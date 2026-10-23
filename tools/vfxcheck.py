"""Mechanical checks for VFX frame sequences (see skills/rng-vfx/references/verification.md).

Works on any engine's output: give it the effect frames and matching frames of the
same shot without the effect (the "base": effect layers hidden, target reaction,
effect lights and decals still on), and it derives the effect mask by difference.
On the rng-vfx stand it renders both itself, plus geometry for the slash and
hit-vector checks.

    # any engine: two folders of PNGs with the same names; --times lists each frame's time
    python tools/vfxcheck.py frames --fx out/fx --base out/base --fps 60 --contact 0.1 --hue 30 --kind explosion

    # the stand (needs playwright + chromium)
    python tools/vfxcheck.py stand realism explosion

Sampling: 60 fps around contact (contact - 0.05 .. contact + 0.5 s), 20 fps elsewhere;
held-drawing styles at their drawing rate. Holds are judged in seconds.

Checks (thresholds from numbers.md / fundamentals.md):
  straight-edges  dead-straight runs ending in a corner on the mask outline (quad, strip or ground cuts)
  size            primary shape height at peak, in 1080p pixels, >= --min-px (gameplay camera)
  frame-border    the effect never touches the frame border (framing)
  white-clip      share of the effect clipped to white on its brightest frame <= 10%
  haze            brightness rise outside the effect (bloom spill) at the brightest frame <= +25%
  hue             on the frame with the most visible effect pixels (impacts: within 0.25 s of contact),
                  >= 15% of them are saturated and their hue is within 25 deg of --hue (required)
  static-hold     no unchanged mask and image for longer than 4 frames (full rate) or 2 drawings
  empty-tail      at 90% of the duration the mask still holds >= 2% of its peak area
  growth          (explosions) the first frame with content is <= 50% of the peak area
  target-flash    (stand) the hit target never brightens before contact, and its flash stays
                  below 0.75x the luminance of the spark's hot body
  slash-crosses   (stand) each slash's arc midpoint projects inside the target's screen box
  hit-vector      (stand) the slash swing and the spray agree: the effect's centroid after contact
                  lies on the hit side, within 60 deg of the projected hit direction
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
except ImportError:
    cv2 = None

# Body hue per stand effect (degrees). None = neutral body (white puffs, grey smoke).
STAND_HUES = {
    "anime-impact": 195, "anime-explosion": 35, "toon-impact": 45, "toon-explosion": 30,
    "stylized-impact": 255, "stylized-explosion": 30, "darkfantasy-impact": 355,
    "darkfantasy-explosion": 5, "pixel-impact": 45, "pixel-explosion": 35,
    "realism-impact": 35, "realism-explosion": 30,
}


def load(path):
    return np.asarray(Image.open(path).convert("RGB")).astype(np.float32) / 255.0


def luminance(img):
    return img[..., 0] * 0.2126 + img[..., 1] * 0.7152 + img[..., 2] * 0.0722


def effect_mask(fx, base, thr=0.06):
    d = np.abs(fx - base).max(-1)
    m = (d > thr).astype(np.uint8)
    if cv2 is not None:
        m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
    return m.astype(bool)


def core_mask(fx, base, thr=0.2):
    """A stricter mask without bloom spill and faint glow: used for size and framing."""
    return effect_mask(fx, base, thr)


def has_corner(pts, idx, d, k=10, min_deg=35):
    n = len(pts)
    for end, sign in ((idx[0], -1), (idx[-1], 1)):
        j = (end + sign * k) % n
        v = pts[j] - pts[end]
        nv = np.linalg.norm(v)
        if nv < 1e-6:
            continue
        cosang = abs(float(np.dot(v / nv, d)))
        if np.degrees(np.arccos(min(1.0, cosang))) > min_deg:
            return True
    return False


def straight_edges(mask, min_frac=0.2, min_px=40, max_ptp=1.6, geom_edges=None):
    """Dead-straight runs on the mask outline that end in a corner and have a solid body
    behind them. Streaks, spike tips and geometry edges are exempt (straight by design)."""
    if cv2 is None or mask.sum() < 50:
        return []
    H, W = mask.shape
    cnts, _ = cv2.findContours(mask.astype(np.uint8), cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)
    found = []
    for c in cnts:
        pts = c[:, 0, :].astype(np.float64)
        if len(pts) < min_px:
            continue
        (_, _), (rw, rh), _ = cv2.minAreaRect(c)
        if min(rw, rh) > 0 and max(rw, rh) / min(rw, rh) > 5:
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
            if (np.all(q[:, 0] <= 1) or np.all(q[:, 0] >= W - 2) or np.all(q[:, 1] <= 1) or np.all(q[:, 1] >= H - 2)):
                i += step
                continue
            mu = q.mean(0)
            _, _, vt = np.linalg.svd(q - mu, full_matrices=False)
            dist = (q - mu) @ vt[1]
            span = np.linalg.norm(q[-1] - q[0])
            ok = np.ptp(dist) < max_ptp and span > 0.9 * L
            if ok and geom_edges is not None:
                qi = q.astype(int)
                ok = geom_edges[np.clip(qi[:, 1], 0, H - 1), np.clip(qi[:, 0], 0, W - 1)].mean() <= 0.6
            if ok:
                nrm = vt[1]
                mid = q[len(q) // 3: 2 * len(q) // 3][::3]
                best = 0
                for sgn in (1, -1):
                    hits = 0
                    for p_ in mid:
                        for dd in (5, 10, 15):
                            x_, y_ = int(round(p_[0] + nrm[0] * dd * sgn)), int(round(p_[1] + nrm[1] * dd * sgn))
                            hits += 0 <= x_ < W and 0 <= y_ < H and mask[y_, x_]
                    best = max(best, hits / max(1, len(mid) * 3))
                ok = best > 0.85 and has_corner(pts, idx, vt[0])
            if ok:
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


def hot_body(f, m):
    """Hot body: effect pixels between the 60th and 95th luminance percentile."""
    lum = luminance(f)[m]
    if lum.size < 20:
        return np.zeros((0, 3))
    k = (lum >= np.quantile(lum, 0.6)) & (lum <= np.quantile(lum, 0.95))
    return f[m][k]


def run_checks(fx, base, times, contact, duration, a, close=None, info=None):
    masks = [effect_mask(f, b) for f, b in zip(fx, base)]
    cores = [core_mask(f, b) for f, b in zip(fx, base)]
    area = np.array([m.sum() for m in masks], np.float64)
    carea = np.array([m.sum() for m in cores], np.float64)
    H, W = masks[0].shape
    res = {}
    peak = int(np.argmax(carea))
    res["peak_time"] = round(times[peak], 3)

    # straight edges: on the close-up frames when given (more pixels per shape), else these
    shape_frames = close or (fx, base, times)
    hits = []
    for f, bf, t in zip(*shape_frames):
        m = effect_mask(f, bf)
        if m.mean() > 0.4 or (luminance(bf) > 0.85).mean() > 0.5:
            continue  # full-screen or two-tone impact frames are inked flat by design
        geom = None
        if cv2 is not None:
            g = cv2.Canny((luminance(bf) * 255).astype(np.uint8), 20, 60)
            geom = cv2.dilate(g, np.ones((5, 5), np.uint8)) > 0
        for seg in straight_edges(m, geom_edges=geom):
            hits.append({"t": round(t, 3), "seg": seg})
    res["straight-edges"] = {"pass": not hits, "count": len(hits), "found": hits[:12]}

    # size of the primary shape (core mask, no bloom halo) at peak
    m = cores[peak]
    hpx = 0.0
    if m.any():
        ys, xs = np.nonzero(m)
        hpx = (np.quantile(ys, 0.98) - np.quantile(ys, 0.02)) * 1080 / H
    res["size"] = {"pass": hpx >= a.min_px, "height_px_at_1080p": round(float(hpx), 1), "min": a.min_px}

    # framing: core mask touching the border
    touch = [round(t, 3) for t, m in zip(times, cores)
             if m.any() and (m[0].mean() > 0.01 or m[-1].mean() > 0.01 or m[:, 0].mean() > 0.01 or m[:, -1].mean() > 0.01)]
    res["frame-border"] = {"pass": not touch, "times": touch[:6]}

    # brightest frame: white clip and haze
    sums = [float(luminance(f)[m].sum()) if m.any() else 0.0 for f, m in zip(fx, masks)]
    bright = int(np.argmax(sums))
    f, m = fx[bright], masks[bright]
    clip = (f.min(-1) > 0.96) & m
    res["white-clip"] = {"pass": clip.sum() <= 0.10 * max(1, m.sum()), "share": round(float(clip.sum() / max(1, m.sum())), 3), "t": round(times[bright], 3)}
    pre = max([i for i, t in enumerate(times) if t < contact - 1e-6] or [0])
    outside = ~m
    if cv2 is not None:
        outside = ~cv2.dilate(m.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
    l0 = float(luminance(fx[pre])[outside].mean()) if outside.sum() > 100 else 1.0
    l1 = float(luminance(f)[outside].mean()) if outside.sum() > 100 else 1.0
    rise = (l1 - l0) / max(l0, 1e-4)
    res["haze"] = {"pass": rise <= 0.25, "rise_outside_effect": round(rise, 3), "t": round(times[bright], 3)}

    # hue on the frame with the most hot pixels
    if a.hue is None:
        res["hue"] = {"pass": True, "note": "neutral effect, hue not checked"}
    else:
        # Frame: impacts look inside the contact window, explosions anywhere; the one
        # with the most visible effect pixels. Colour is judged on the effect's visible
        # pixels (luminance > 0.3), so white cores and flat-white palettes count against
        # the saturated share only, not against the hue.
        win = [i for i, t in enumerate(times) if a.kind != "impact" or contact - 1e-6 <= t <= contact + 0.25] or list(range(len(fx)))
        bi = max(win, key=lambda i: int((luminance(fx[i])[masks[i]] > 0.3).sum()) if masks[i].any() else 0)
        px = fx[bi][masks[bi]]
        px = px[luminance(px) > 0.3] if len(px) else px
        if len(px) < 20:
            res["hue"] = {"pass": False, "note": "no visible effect pixels"}
        else:
            h, s_, _ = rgb_to_hsv(px)
            sat = s_ > 0.25
            frac = float(sat.mean())
            hue = float(np.degrees(np.angle(np.mean(np.exp(1j * np.radians(h[sat])))))) % 360 if sat.any() else -1
            dh = abs((hue - a.hue + 180) % 360 - 180) if sat.any() else 180
            res["hue"] = {"pass": frac >= 0.15 and dh <= 25, "hue": round(hue, 1), "target": a.hue,
                          "saturated_share": round(frac, 3), "t": round(times[bi], 3)}

    # static hold, judged in seconds
    limit = a.hold_seconds
    run_t, worst = 0.0, 0.0
    for i in range(1, len(masks)):
        u = masks[i] | masks[i - 1]
        if u.sum() < 50:
            run_t = 0.0
            continue
        change = (masks[i] ^ masks[i - 1]).sum() / u.sum()
        img_change = float(np.abs(fx[i] - fx[i - 1]).max(-1)[u].mean())
        if change < 0.01 and img_change < 0.01:
            run_t += times[i] - times[i - 1]
            worst = max(worst, run_t)
        else:
            run_t = 0.0
    res["static-hold"] = {"pass": worst <= limit + 1e-6, "longest_s": round(worst, 3), "max_s": round(limit, 3)}

    # empty tail
    i90 = min(range(len(times)), key=lambda i: abs(times[i] - 0.9 * duration))
    res["empty-tail"] = {"pass": bool(area[i90] >= 0.02 * max(1.0, area.max())), "area_at_90pct": int(area[i90]), "peak_area": int(area.max())}

    # growth (explosions): first content after contact vs the peak
    if a.kind == "explosion":
        after = [i for i, t in enumerate(times) if t >= contact - 1e-6 and carea[i] > 30]
        if after:
            first = after[0]
            ratio = carea[first] / max(1.0, carea.max())
            res["growth"] = {"pass": ratio <= 0.5, "first_over_peak": round(float(ratio), 3), "t": round(times[first], 3)}

    if info:
        tx0, ty0, tx1, ty1 = info["target"]
        box = (int(tx0 * W), int(ty0 * H), int(tx1 * W), int(ty1 * H))
        bx0, by0, bx1, by1 = [max(0, v) for v in box]
        tl = []
        for b_ in base:
            reg = b_[by0:by1, bx0:bx1]
            two_tone = (luminance(b_) > 0.85).mean() > 0.5  # impact frame: the target is inked on purpose
            tl.append(float(np.quantile(luminance(reg), 0.9)) if reg.size and not two_tone else np.nan)
        tl = np.array(tl)
        npre = max(1, len([t for t in times if t < contact - 1e-6]))
        rest = float(np.nanmin(tl[:npre])) if np.isfinite(tl[:npre]).any() else 0.0
        early = [round(t, 3) for t, v in zip(times, tl) if t < contact - 1e-6 and np.isfinite(v) and v > rest + 0.05]
        # spark body luminance in the contact window
        win = [i for i, t in enumerate(times) if contact - 1e-6 <= t <= contact + 0.12]
        spark = max([float(np.median(luminance(hot_body(fx[i], masks[i]).reshape(-1, 1, 3)))) for i in win if masks[i].sum() > 50] or [1.0])
        flash = float(np.nanmax(tl[win])) if win and np.isfinite(tl[win]).any() else 0.0
        res["target-flash"] = {"pass": not early and (flash - rest) <= max(0.0, 0.75 * spark - rest) + 0.05,
                               "before_contact": early[:4], "target_peak": round(flash, 3),
                               "target_rest": round(float(rest), 3), "spark_body": round(spark, 3)}

        if info.get("slashes"):
            bad = []
            for s_ in info["slashes"]:
                mx_, my_ = s_["mid"]
                pad = 0.1 * (tx1 - tx0)
                if not (tx0 - pad <= mx_ <= tx1 + pad and ty0 <= my_ <= ty1):
                    bad.append({"at": s_["at"], "mid": [round(mx_, 3), round(my_, 3)]})
            res["slash-crosses"] = {"pass": not bad, "missed": bad[:4], "target_box": [round(v, 3) for v in info["target"]]}

        if info.get("hitDir") and a.kind == "impact":
            hx, hy = info["hit"]
            dx, dy = info["hitDir"][0] - hx, info["hitDir"][1] - hy
            win2 = [i for i, t in enumerate(times) if contact + 0.03 <= t <= contact + 0.25]
            acc = np.zeros(2)
            tot = 0.0
            for i in win2:
                ys, xs = np.nonzero(cores[i])
                inside = (xs >= bx0) & (xs <= bx1) & (ys >= by0) & (ys <= by1)
                xs, ys = xs[~inside], ys[~inside]  # what sprays off the body
                if len(xs):
                    acc += [xs.mean() / W - hx, ys.mean() / H - hy]
                    tot += 1
            ang = None
            ok = True
            if tot:
                v = acc / tot
                ang = float(np.degrees(np.arccos(np.clip(np.dot(v, [dx, dy]) / (np.linalg.norm(v) * np.hypot(dx, dy) + 1e-9), -1, 1))))
                ok = ang <= 60
            swing_bad = []
            for s_ in info.get("slashes", []):
                if s_.get("swingEnd"):
                    sx, sy = s_["swingEnd"][0] - s_["mid"][0], s_["swingEnd"][1] - s_["mid"][1]
                    # the swing's horizontal sense must match the spray's
                    if sx * dx < 0 and abs(sx) > 0.3 * np.hypot(sx, sy):
                        swing_bad.append(s_["at"])
            res["hit-vector"] = {"pass": ok and not swing_bad, "spray_angle_deg": None if ang is None else round(ang, 1),
                                 "slash_against_spray": swing_bad[:4]}
    return res


def sample_times(dur, contact, fps_style):
    if fps_style:  # held drawings: one sample per drawing
        return list(np.arange(0, dur + 1e-6, 1.0 / fps_style))
    t0, t1 = max(0.0, contact - 0.05), min(dur, contact + 0.5)
    ts = list(np.arange(0, t0, 1 / 20)) + list(np.arange(t0, t1, 1 / 60)) + list(np.arange(t1, dur + 1e-6, 1 / 20))
    return sorted(set(round(t, 4) for t in ts))


def cmd_frames(a):
    names = sorted(os.path.basename(p) for p in glob.glob(os.path.join(a.fx, "*.png")))
    fx = [load(os.path.join(a.fx, n)) for n in names]
    base = [load(os.path.join(a.base, n)) for n in names]
    if a.times:
        times = [float(x) for x in open(a.times).read().split()]
    else:
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
            pg.evaluate(f"window.rngStand.set('background', '{a.background}'); window.rngStand.set('shake', false); window.rngStand.pause()")
            dur = pg.evaluate("window.rngStand.duration()")
            contact = pg.evaluate("window.rngStand.contact()")
            fps_style = pg.evaluate("window.rngStand.styles.length && window.rngStand.info().fps")
            times = sample_times(dur, contact, fps_style)
            lights = "window.rngStand.layers().filter(l => l.kind.startsWith('light') || l.kind.startsWith('decal')).map(l => l.i)"

            def grab(t):
                url = pg.evaluate(f"(window.rngStand.seek({t}), window.rngStand.captureFrame())")
                return np.asarray(Image.open(io.BytesIO(base64.b64decode(url.split(",")[1]))).convert("RGB")).astype(np.float32) / 255.0

            def shoot(camera, ts):
                pg.evaluate(f"window.rngStand.set('camera', '{camera}')")
                pg.evaluate("window.rngStand.solo(null)")
                fx_ = [grab(t) for t in ts]
                pg.evaluate(f"window.rngStand.solo({lights})")
                base_ = [grab(t) for t in ts]
                pg.evaluate("window.rngStand.solo(null)")
                return fx_, base_

            fx, base = shoot(a.camera, times)
            pg.evaluate(f"window.rngStand.seek({contact + 2 / 60})")
            info = pg.evaluate("window.rngStand.info()")
            close = None
            if a.close_fps > 0:
                ct = list(np.arange(0, dur + 1e-6, 1.0 / (fps_style or a.close_fps)))
                cfx, cbase = shoot("Close", ct)
                close = (cfx, cbase, ct)
            b.close()
    finally:
        srv.terminate()
    out = a.out or os.path.join("vfxcheck_out", f"{a.style}-{a.fx}")
    for sub_, seq in (("fx", fx), ("base", base)):
        os.makedirs(os.path.join(out, sub_), exist_ok=True)
        for i, img in enumerate(seq):
            Image.fromarray((img * 255).astype(np.uint8)).save(os.path.join(out, sub_, f"{i:04d}.png"))
    with open(os.path.join(out, "meta.json"), "w") as fh:
        json.dump({"times": times, "contact": contact, "duration": dur, "info": info}, fh)
    a.kind = a.kind or ("explosion" if "explosion" in a.fx else "impact")
    if a.hue == "auto":
        a.hue = STAND_HUES.get(f"{a.style}-{a.fx}")
    a.hold_seconds = (2.0 / fps_style) if fps_style else 4.0 / 60
    return run_checks(fx, base, times, contact, dur, a, close=close, info=info)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    for name in ("frames", "stand"):
        s = sub.add_parser(name)
        s.add_argument("--min-px", type=float, default=40, help="primary shape height at 1080p (40 tier 1, 80 tier 2, 200 tier 3)")
        s.add_argument("--kind", choices=["impact", "explosion", "other"], default=None)
        s.add_argument("--json", action="store_true")
        if name == "frames":
            s.add_argument("--hue", required=True, help="body hue in degrees, or 'none' for a neutral effect")
            s.add_argument("--fx", required=True)
            s.add_argument("--base", required=True)
            s.add_argument("--fps", type=float, default=60)
            s.add_argument("--times", default="", help="file with one time per frame (for mixed sampling)")
            s.add_argument("--contact", type=float, default=0)
            s.add_argument("--duration", type=float, default=0)
            s.add_argument("--hold-seconds", type=float, default=4 / 60)
        else:
            s.add_argument("style")
            s.add_argument("fx")
            s.add_argument("--hue", default="auto", help="body hue in degrees, 'none', or 'auto' (stand table)")
            s.add_argument("--camera", default="Gameplay")
            s.add_argument("--close-fps", type=float, default=15, help="extra Close-camera pass for shape checks; 0 to skip")
            s.add_argument("--background", default="Dusk field")
            s.add_argument("--width", type=int, default=640)
            s.add_argument("--height", type=int, default=360)
            s.add_argument("--port", type=int, default=8790)
            s.add_argument("--out", default="")
    a = ap.parse_args()
    if a.hue not in ("auto",):
        a.hue = None if str(a.hue).lower() == "none" else float(a.hue)
    if a.cmd == "frames":
        a.kind = a.kind or "other"
        res = cmd_frames(a)
    else:
        res = cmd_stand(a)
    if a.json:
        print(json.dumps(res, indent=1))
    else:
        for k, v in res.items():
            if isinstance(v, dict):
                flag = "PASS" if v.get("pass") else "FAIL"
                detail = {kk: vv for kk, vv in v.items() if kk not in ("pass", "found")}
                print(f"{flag:4}  {k:15} {detail}")
                for h in (v.get("found") or [])[:5]:
                    print(f"        t={h['t']}s segment {h['seg'][:4]} length {h['seg'][4]} x height")
            else:
                print(f"      {k:15} {v}")
    sys.exit(1 if any(isinstance(v, dict) and not v.get("pass") for v in res.values()) else 0)


if __name__ == "__main__":
    main()
