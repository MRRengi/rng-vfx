"""Mechanical checks for VFX frame sequences (see skills/rng-vfx/references/verification.md).

Works on any engine's output: give it the effect frames and matching frames of the
same shot without the effect (the "base"), and it derives the effect mask by
difference. On the rng-vfx stand it can render both itself.

    # any engine: two folders of PNGs with the same names, rendered at --fps
    python tools/vfxcheck.py frames --fx out/fx --base out/base --fps 60 --contact 0.1

    # the stand (needs playwright + chromium): renders and checks one effect
    python tools/vfxcheck.py stand realism explosion --camera Gameplay

Checks (thresholds from numbers.md / fundamentals.md, override with flags):
  straight-edges  long straight segments on the effect mask's outline (quad or strip cuts)
  size            effect height on screen at peak >= --min-px
  white-clip      share of the effect mask clipped to white at peak <= 10%
  lum-rise        mean frame luminance at peak vs the frame before contact <= +25%
  hue-at-peak     hottest 10% of effect pixels keep saturation >= 0.35 (and --hue +/- 15 deg)
  static-hold     no frame-to-frame mask change under 1% for more than --hold frames
  empty-tail      the mask still has content at 90% of the duration
Exit code 1 when any check fails.
"""
import argparse
import glob
import io
import json
import os
import sys

import numpy as np
from PIL import Image

try:
    import cv2
except ImportError:  # straight-edge check needs OpenCV
    cv2 = None


def load(path):
    return np.asarray(Image.open(path).convert("RGB")).astype(np.float32) / 255.0


def luminance(img):
    return img[..., 0] * 0.2126 + img[..., 1] * 0.7152 + img[..., 2] * 0.0722


def effect_mask(fx, base, thr=0.06):
    d = np.abs(fx - base).max(-1)
    m = (d > thr).astype(np.uint8)
    if cv2 is not None:  # drop isolated noise pixels
        m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
    return m.astype(bool)


def straight_edges(mask, min_frac=0.2, min_px=40, max_ptp=1.6):
    """Dead-straight runs on the mask's outer contour: long (>= min_px and >= min_frac of
    the shape's size) whose points stay within max_ptp pixels of a line (pixel stair-steps
    included). Over that length a curved outline bows by more than that (a chord's sagitta
    is L^2 / 8R); a quad or strip cut does not."""
    if cv2 is None or mask.sum() < 50:
        return []
    H, W = mask.shape
    cnts, _ = cv2.findContours(mask.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    found = []
    for c in cnts:
        pts = c[:, 0, :].astype(np.float64)
        if len(pts) < min_px:
            continue
        x0, y0, w, h = cv2.boundingRect(c)
        L = int(max(min_px, min_frac * max(w, h)))
        if len(pts) < L * 1.2:
            continue
        step = max(4, L // 4)
        i = 0
        while i < len(pts):
            idx = (np.arange(L) + i) % len(pts)
            q = pts[idx]
            # skip runs lying on the image border (framing, not a quad cut)
            if (np.all(q[:, 0] <= 1) or np.all(q[:, 0] >= W - 2) or np.all(q[:, 1] <= 1) or np.all(q[:, 1] >= H - 2)):
                i += step
                continue
            mu = q.mean(0)
            u, sv, vt = np.linalg.svd(q - mu, full_matrices=False)
            dist = (q - mu) @ vt[1]
            span = np.linalg.norm(q[-1] - q[0])
            if np.ptp(dist) < max_ptp and span > 0.9 * L:
                found.append((int(q[0][0]), int(q[0][1]), int(q[-1][0]), int(q[-1][1]), round(span / max(w, h), 3)))
                i += L
            else:
                i += step
    return found


def rgb_to_hsv(rgb):
    mx, mn = rgb.max(-1), rgb.min(-1)
    d = mx - mn
    h = np.zeros_like(mx)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    m = d > 1e-6
    rm = m & (mx == r)
    gm = m & (mx == g) & ~rm
    bm = m & ~rm & ~gm
    h[rm] = ((g - b)[rm] / d[rm]) % 6
    h[gm] = (b - r)[gm] / d[gm] + 2
    h[bm] = (r - g)[bm] / d[bm] + 4
    return h * 60.0, np.where(mx > 1e-6, d / np.maximum(mx, 1e-6), 0), mx


def run_checks(fx_frames, base_frames, times, contact, duration, a):
    masks = [effect_mask(f, b) for f, b in zip(fx_frames, base_frames)]
    area = np.array([m.sum() for m in masks], np.float64)
    res = {}

    peak = int(np.argmax(area))
    res["peak_time"] = round(times[peak], 3)

    # straight edges, on every frame with content
    hits = []
    for t, m in zip(times, masks):
        for seg in straight_edges(m):
            hits.append({"t": round(t, 3), "seg": seg})
    res["straight-edges"] = {"pass": len(hits) == 0, "found": hits[:12], "count": len(hits)}

    # size at peak
    m = masks[peak]
    if m.any():
        ys, xs = np.nonzero(m)
        hpx = int(ys.max() - ys.min())
        H = m.shape[0]
        hpx1080 = hpx * 1080 / H
    else:
        hpx1080 = 0
    res["size"] = {"pass": hpx1080 >= a.min_px, "height_px_at_1080p": round(hpx1080, 1), "min": a.min_px}

    # white clip at peak
    f = fx_frames[peak]
    clip = (f.min(-1) > 0.96) & m
    share = float(clip.sum() / max(1, m.sum()))
    res["white-clip"] = {"pass": share <= 0.10, "share": round(share, 3)}

    # luminance rise: peak vs last frame before contact
    pre = max([i for i, t in enumerate(times) if t < contact] or [0])
    l0 = float(luminance(fx_frames[pre]).mean())
    l1 = float(luminance(fx_frames[peak]).mean())
    rise = (l1 - l0) / max(l0, 1e-4)
    res["lum-rise"] = {"pass": rise <= 0.25, "rise": round(rise, 3)}

    # hue at peak: hottest 10% of effect pixels
    if m.any():
        lum = luminance(f)[m]
        k = lum >= np.quantile(lum, 0.9)
        h, s, v = rgb_to_hsv(f[m][k])
        sat = float(np.median(s))
        hue = float(np.degrees(np.angle(np.mean(np.exp(1j * np.radians(h))))) % 360)
        ok = sat >= a.min_sat
        if a.hue is not None:
            dh = abs((hue - a.hue + 180) % 360 - 180)
            ok = ok and dh <= 15
        res["hue-at-peak"] = {"pass": ok, "hue": round(hue, 1), "saturation": round(sat, 3),
                              "target_hue": a.hue, "note": "flat white palette styles may skip with --min-sat 0"}
    else:
        res["hue-at-peak"] = {"pass": False, "note": "no effect pixels at peak"}

    # static hold: consecutive frames where the mask barely changes
    run, worst = 0, 0
    for i in range(1, len(masks)):
        u = masks[i] | masks[i - 1]
        if u.sum() < 50:
            run = 0
            continue
        change = (masks[i] ^ masks[i - 1]).sum() / u.sum()
        img_change = float(np.abs(fx_frames[i] - fx_frames[i - 1]).max(-1)[u].mean())
        if change < 0.01 and img_change < 0.01:
            run += 1
            worst = max(worst, run)
        else:
            run = 0
    res["static-hold"] = {"pass": worst + 1 <= a.hold, "longest_frames": worst + 1 if worst else 0, "max": a.hold}

    # empty tail
    i90 = min(range(len(times)), key=lambda i: abs(times[i] - 0.9 * duration))
    res["empty-tail"] = {"pass": bool(area[i90] > 50), "area_at_90pct": int(area[i90])}
    return res


def cmd_frames(a):
    names = sorted(os.path.basename(p) for p in glob.glob(os.path.join(a.fx, "*.png")))
    fx = [load(os.path.join(a.fx, n)) for n in names]
    base = [load(os.path.join(a.base, n)) for n in names]
    times = [i / a.fps for i in range(len(names))]
    return run_checks(fx, base, times, a.contact, a.duration or times[-1], a)


def cmd_stand(a):
    import base64
    import subprocess
    import time
    from playwright.sync_api import sync_playwright
    root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "stand")
    srv = subprocess.Popen([sys.executable, "-m", "http.server", str(a.port), "-d", root],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1)
    try:
        with sync_playwright() as p:
            b = p.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
            pg = b.new_page(viewport={"width": a.width, "height": a.height})
            pg.goto(f"http://localhost:{a.port}/#style={a.style}&fx={a.fx}")
            pg.wait_for_function("window.rngStand", timeout=30000)
            pg.add_style_tag(content=".lil-gui,.caption,.hint{display:none!important}")
            pg.evaluate(f"window.rngStand.set('camera', '{a.camera}'); window.rngStand.set('background', '{a.background}');"
                        "window.rngStand.set('shake', false); window.rngStand.pause()")
            dur = pg.evaluate("window.rngStand.duration()")
            contact = pg.evaluate("window.rngStand.contact()")
            fps = pg.evaluate("window.rngStand.styles.find(s => s.id === '%s').look?.fps || 0" % a.style) or 60
            step = 1.0 / min(fps, a.fps)
            times = list(np.arange(0, dur + 1e-6, step))

            def grab(t):
                url = pg.evaluate(f"(window.rngStand.seek({t}), window.rngStand.captureFrame())")
                return np.asarray(Image.open(io.BytesIO(base64.b64decode(url.split(",")[1]))).convert("RGB")).astype(np.float32) / 255.0

            fx = [grab(t) for t in times]
            # Base shot: the effect's lights stay on (they light the floor in both shots, so
            # floor tiles do not enter the mask); every other layer is hidden. The target
            # reaction still plays.
            pg.evaluate("window.rngStand.solo(window.rngStand.layers().filter(l => l.kind.startsWith('light')).map(l => l.i))")
            base = [grab(t) for t in times]
            pg.evaluate("window.rngStand.solo(null)")
            b.close()
    finally:
        srv.terminate()
    # Keep the frames so the checks can be rerun with `frames` without rendering again.
    out = a.out or os.path.join("vfxcheck_out", f"{a.style}-{a.fx}")
    for sub_, seq in (("fx", fx), ("base", base)):
        os.makedirs(os.path.join(out, sub_), exist_ok=True)
        for i, img in enumerate(seq):
            Image.fromarray((img * 255).astype(np.uint8)).save(os.path.join(out, sub_, f"{i:04d}.png"))
    with open(os.path.join(out, "meta.json"), "w") as fh:
        json.dump({"fps": 1.0 / step, "contact": contact, "duration": dur}, fh)
    return run_checks(fx, base, times, contact, dur, a)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    for name in ("frames", "stand"):
        s = sub.add_parser(name)
        s.add_argument("--min-px", type=float, default=40)
        s.add_argument("--min-sat", type=float, default=0.35)
        s.add_argument("--hue", type=float, default=None)
        s.add_argument("--hold", type=int, default=4, help="max frames a shape may stay unchanged")
        s.add_argument("--json", action="store_true")
        if name == "frames":
            s.add_argument("--fx", required=True)
            s.add_argument("--base", required=True)
            s.add_argument("--fps", type=float, default=60)
            s.add_argument("--contact", type=float, default=0)
            s.add_argument("--duration", type=float, default=0)
        else:
            s.add_argument("style")
            s.add_argument("fx")
            s.add_argument("--camera", default="Close", help="Close for shape checks; run again with Gameplay for the size check")
            s.add_argument("--background", default="Dusk field")
            s.add_argument("--fps", type=float, default=20, help="sampling rate (held-drawing styles use their own)")
            s.add_argument("--width", type=int, default=640)
            s.add_argument("--height", type=int, default=360)
            s.add_argument("--port", type=int, default=8790)
            s.add_argument("--out", default="", help="where to keep the rendered frames (default vfxcheck_out/<style>-<fx>)")
    a = ap.parse_args()
    res = cmd_frames(a) if a.cmd == "frames" else cmd_stand(a)
    if a.json:
        print(json.dumps(res, indent=1))
    else:
        for k, v in res.items():
            if isinstance(v, dict):
                flag = "PASS" if v.get("pass") else "FAIL"
                detail = {kk: vv for kk, vv in v.items() if kk not in ("pass", "found")}
                print(f"{flag:4}  {k:15} {detail}")
                if k == "straight-edges" and v.get("found"):
                    for h in v["found"][:5]:
                        print(f"        t={h['t']}s segment {h['seg'][:4]} length {h['seg'][4]} x height")
            else:
                print(f"      {k:15} {v}")
    failed = any(isinstance(v, dict) and not v.get("pass") for v in res.values())
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
