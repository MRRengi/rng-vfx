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
  white-clip      share of the effect burned to white next to its coloured body <= 15% (OKLab)
  haze            brightness rise outside the effect (bloom spill) at the brightest frame <= +25%
  hue             on the frame with the most visible effect pixels (impacts: within 0.1 s of contact),
                  >= 15% of them are saturated and >= 30% of the saturated ones are within 25 deg of --hue
  static-hold     no unchanged mask and image for longer than 4 frames (full rate) or 2 drawings
  empty-tail      at 90% of the duration the mask still holds >= 2% of its peak area
  growth          (explosions) the first frame with content is <= 50% of the peak area
  target-flash    (stand) the hit target never brightens before contact, and its flash stays
                  below 0.75x the luminance of the spark's hot body
  slash-crosses   (stand) each slash's arc midpoint projects inside the target's screen box
  hit-vector      (stand) the slash swing and the spray agree: the effect's centroid after contact
                  lies on the hit side, within 45 deg of the projected hit direction
  target-visible  (stand) the hit target keeps >= 70% of its rest luminance and >= 0.08 during the hit
  target-colour   (stand) OKLab chroma of the target (85th percentile of its box) rises <= 0.05
  time-to-peak    the largest hot shape reaches 60% of its max within --max-rise of contact
  blobs           no smooth convex main body, no 3+ smooth balls at peak and handoff
  closed-ring     (impacts, stand) no closed ring around the hit point for more than one sample
  effect-light    (stand) lit pool < 3x the peak core area and dimmer than the effect's brightest part
  drawing-grid    (held styles, stand) contact falls on a drawing
  dark-blood      (darkfantasy impact) saturated reds: median OKLab L <= 0.5, chroma <= 0.2
  grounded        (explosions, stand) the effect touches the blast's ground point for >= 60% of
                  the time from contact until it falls under 20% of its peak area
  dark-background (dark styles, stand) the effect keeps >= half its visible area on Night arena
  shape-keys      (stand, --keys) silhouette IoU with the contact / peak / break-up keys >= 0.3 (aim 0.6);
                  writes keys.png with the keys outlined over the matched frames
  static-hold is per region (8x8 tiles), so a frozen spark fails even while smoke moves
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
    "realism-impact": None, "realism-explosion": 30,
}


def load(path):
    return np.asarray(Image.open(path).convert("RGB")).astype(np.float32) / 255.0


def luminance(img):
    return img[..., 0] * 0.2126 + img[..., 1] * 0.7152 + img[..., 2] * 0.0722


def oklab(rgb):
    """sRGB (0..1, gamma) to OKLab. Returns L, a, b arrays."""
    c = np.where(rgb <= 0.04045, rgb / 12.92, ((rgb + 0.055) / 1.055) ** 2.4)
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    l = np.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
    m = np.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
    s_ = np.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
    L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s_
    A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s_
    B = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s_
    return L, A, B


def blob_stats(mask):
    """Per connected component: area, solidity (area / hull area) and circularity
    (4 pi area / perimeter^2). Smooth convex balls score high on both."""
    if cv2 is None or mask.sum() < 50:
        return []
    cnts, _ = cv2.findContours(mask.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    out = []
    for c in cnts:
        a_ = cv2.contourArea(c)
        if a_ < 60:
            continue
        hull = cv2.contourArea(cv2.convexHull(c))
        per = cv2.arcLength(c, True)
        x, y, w, h = cv2.boundingRect(c)
        out.append({"area": a_, "solidity": a_ / max(hull, 1), "circ": 4 * np.pi * a_ / max(per * per, 1),
                    "box": (x, y, w, h)})
    return out


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
    # Burned to white: near-white and colourless. Tone mappers (AgX, Neutral) roll off
    # instead of clipping, so a hard min(rgb) > 0.96 test never fires; this one does.
    Lw, Aw, Bw = oklab(f)
    white = (Lw > 0.9) & (np.hypot(Aw, Bw) < 0.035) & m
    # Only white enclosed by the effect's colour counts (a burned hot core). White puffs,
    # dust and designed white shapes are bordered by outline, ground or sky instead.
    col_ = (np.hypot(Aw, Bw) > 0.1) & m
    clip = np.zeros_like(white)
    if cv2 is not None and white.any():
        nlab, lab = cv2.connectedComponents(white.astype(np.uint8))
        for k in range(1, nlab):
            comp = lab == k
            if comp.sum() < 6:
                continue
            ring = cv2.dilate(comp.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool) & ~comp
            if ring.any() and col_[ring].mean() > 0.6:
                clip |= comp
    res["white-clip"] = {"pass": clip.sum() <= 0.15 * max(1, m.sum()), "share": round(float(clip.sum() / max(1, m.sum())), 3), "t": round(times[bright], 3)}
    pre = max([i for i, t in enumerate(times) if t < contact - 1e-6] or [0])
    outside = ~m
    if cv2 is not None:
        outside = ~cv2.dilate(m.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
    l0 = float(luminance(fx[pre])[outside].mean()) if outside.sum() > 100 else 1.0
    l1 = float(luminance(f)[outside].mean()) if outside.sum() > 100 else 1.0
    rise = (l1 - l0) / max(l0, 1e-4)
    # Bloom spill: the soft mask (bloom included) against the hard core. A halo much
    # wider than the shape is haze even when it sits "inside" the soft mask.
    cb = cores[bright].sum()
    # Only soft pixels that brighten the frame are glow; dark smoke around the core is not haze.
    # The core is widened by 2 px first, so thin sparks are not judged by their 1 px width.
    cd = cv2.dilate(cores[bright].astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool) if cv2 is not None else cores[bright]
    glow = m & ~cd & ((luminance(f) - luminance(base[bright])) > 0.03)
    halo = float((glow.sum() + cd.sum()) / max(cd.sum(), 1)) if cb > 30 else 1.0
    res["haze"] = {"pass": rise <= 0.25 and halo <= 4.0, "rise_outside_effect": round(rise, 3),
                   "halo_over_core": round(halo, 2), "t": round(times[bright], 3)}

    # hue on the frame with the most hot pixels
    if a.hue is None:
        res["hue"] = {"pass": True, "note": "neutral effect, hue not checked"}
    else:
        # Frame: impacts look inside the contact window, explosions anywhere; the one
        # with the most visible effect pixels. Colour is judged on the effect's visible
        # pixels (luminance > 0.3), so white cores and flat-white palettes count against
        # the saturated share only, not against the hue.
        # Impacts: the contact read (contact .. +0.15 s); later frames belong to residue (puffs,
        # smoke) whose shading is not the effect's colour.
        hw = max(0.1, (2.0 / a.fps_style) if getattr(a, "fps_style", 0) else 0)
        # Explosions: after the flash (contact + 0.1 s); the flash is white by design and judged
        # by white-clip, the body's colour by this.
        if a.kind == "impact":
            win = [i for i, t in enumerate(times) if contact - 1e-6 <= t <= contact + hw]
        else:
            win = [i for i, t in enumerate(times) if t >= contact + 0.1]
        win = win or list(range(len(fx)))
        bi = max(win, key=lambda i: int((luminance(fx[i])[masks[i]] > 0.3).sum()) if masks[i].any() else 0)
        px = fx[bi][masks[bi]]
        px = px[luminance(px) > 0.3] if len(px) else px
        min_px_ = max(5, int(20 * H * W / (640 * 360)))  # pixel-art frames are captured at sprite resolution
        if len(px) < min_px_:
            res["hue"] = {"pass": False, "note": "no visible effect pixels"}
        else:
            h, s_, _ = rgb_to_hsv(px)
            sat = s_ > 0.25
            frac = float(sat.mean())
            # Share of the saturated pixels near the target hue: two-colour designs
            # (a cyan spark with yellow sparks) pass as long as the target colour holds
            # 30% or more; a red that drifted to salmon or pink does not.
            hs = h[sat]
            near = float((np.abs((hs - a.hue + 180) % 360 - 180) <= 25).mean()) if sat.any() else 0.0
            hue = float(np.degrees(np.angle(np.mean(np.exp(1j * np.radians(hs)))))) % 360 if sat.any() else -1
            res["hue"] = {"pass": frac >= a.min_sat_share and near >= 0.3, "mean_hue": round(hue, 1), "target": a.hue,
                          "near_target": round(near, 3), "saturated_share": round(frac, 3), "t": round(times[bi], 3)}

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
    # Per region: a frozen spark passes the whole-effect test while smoke moves
    # elsewhere. Split the frame into tiles and track holds in each tile with content.
    T = 8
    th, tw = H // T, W // T
    tile_run = np.zeros((T, T))
    tile_worst = 0.0
    for i in range(1, len(masks)):
        dt = times[i] - times[i - 1]
        for ty in range(T):
            for tx in range(T):
                sl = (slice(ty * th, (ty + 1) * th), slice(tx * tw, (tx + 1) * tw))
                u = masks[i][sl] | masks[i - 1][sl]
                if u.sum() < 40:
                    tile_run[ty, tx] = 0
                    continue
                ch = float(np.abs(fx[i][sl] - fx[i - 1][sl]).max(-1)[u].mean())
                if ch < 0.004 and (masks[i][sl] ^ masks[i - 1][sl]).sum() < 0.01 * u.sum():
                    tile_run[ty, tx] += dt
                    tile_worst = max(tile_worst, tile_run[ty, tx])
                else:
                    tile_run[ty, tx] = 0
    worst = max(worst, tile_worst)
    res["static-hold"] = {"pass": worst <= limit + 1e-6, "longest_s": round(worst, 3), "max_s": round(limit, 3), "per_region": True}

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
    # Time to peak of the hot body (bright or saturated effect pixels): the primary
    # shape has to arrive fast. Smoke grows for seconds and is excluded by brightness.
    hot = []
    for f_, m_ in zip(fx, masks):
        if not m_.any():
            hot.append(0)
            continue
        L_, A_, B_ = oklab(f_)
        # Hot = near-white or saturated and bright; light grey smoke (L about 0.75) is not hot.
        # Only the largest connected hot shape counts: sparks and debris flying outward grow the
        # hot area for a second without the body itself growing.
        hm = (((L_ > 0.85) | (np.hypot(A_, B_) > 0.12) & (L_ > 0.4)) & m_).astype(np.uint8)
        if cv2 is not None and hm.any():
            n_, lab_, st_, _ = cv2.connectedComponentsWithStats(cv2.dilate(hm, np.ones((3, 3), np.uint8)))
            k_ = 1 + int(np.argmax(st_[1:, cv2.CC_STAT_AREA])) if n_ > 1 else 0
            hot.append(int((hm.astype(bool) & (lab_ == k_)).sum()) if k_ else 0)
        else:
            hot.append(int(hm.sum()))
    hot = np.array(hot, np.float64)
    if hot.max() > 50:
        reach = [t for t, v in zip(times, hot) if t >= contact - 1e-6 and v >= 0.6 * hot.max()]
        ttp = (reach[0] - contact) if reach else 9.0
        res["time-to-peak"] = {"pass": ttp <= a.max_rise, "seconds": round(ttp, 3), "max": a.max_rise}

    # Blobs: smooth convex balls read as cotton or soap bubbles, and three or more of
    # them at once read as a stacked column. Judged at the peak and at the handoff.
    bad_blob = []
    for i in sorted(set([peak, min(len(times) - 1, peak + max(1, len(times) // 6))])):
        st = blob_stats(cores[i])
        tot = sum(b_["area"] for b_ in st) or 1
        balls = [b_ for b_ in st if b_["solidity"] > 0.94 and b_["circ"] > 0.78 and b_["area"] > 0.04 * tot]
        big = max(st, key=lambda b_: b_["area"]) if st else None
        smooth_main = big is not None and big["area"] > 0.5 * tot and big["solidity"] > 0.96 and big["circ"] > 0.82
        if len(balls) >= 3 or smooth_main:
            bad_blob.append({"t": round(times[i], 3), "balls": len(balls), "smooth_main": bool(smooth_main)})
    res["blobs"] = {"pass": not bad_blob, "found": [], "frames": bad_blob}

    if a.max_red_L is not None:
        # Dark blood: saturated reds after contact stay dark (dark-fantasy palette #7a0a10 - #3a0206).
        Ls = []
        for f_, m_, t in zip(fx, masks, times):
            if not (contact + 0.1 <= t <= contact + 0.8) or not m_.any():
                continue
            px = f_[m_]
            h_, s_, _ = rgb_to_hsv(px)
            red = ((h_ >= 330) | (h_ <= 20)) & (s_ > 0.45)
            if red.sum() > 30:
                L_, A_, B_ = oklab(px[red])
                Ls.append((float(np.median(L_)), float(np.median(np.hypot(A_, B_)))))
        med = float(np.median([x[0] for x in Ls])) if Ls else 0.0
        chr_ = float(np.median([x[1] for x in Ls])) if Ls else 0.0
        res["dark-blood"] = {"pass": med <= a.max_red_L and chr_ <= 0.2, "median_L": round(med, 3), "max_L": a.max_red_L,
                             "median_chroma": round(chr_, 3), "max_chroma": 0.2}

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
        cap_ok = a.sprite_flash or (flash - rest) <= max(0.0, 0.75 * spark - rest) + 0.05
        res["target-flash"] = {"pass": not early and cap_ok, "sprite_flash": a.sprite_flash,
                               "before_contact": early[:4], "target_peak": round(flash, 3),
                               "target_rest": round(float(rest), 3), "spark_body": round(spark, 3)}

        # Target never vanishes: during the reaction it keeps at least half its rest luminance.
        low = float(np.nanmin(tl[win])) if win and np.isfinite(tl[win]).any() else rest
        res["target-visible"] = {"pass": low >= 0.7 * rest and low >= 0.08, "min_during_hit": round(low, 3), "rest": round(float(rest), 3)}

        # Target colour (OKLab): a hit flash tints the target toward the effect colour,
        # it does not repaint it. Chroma rise of the target's body is capped.
        def tchroma(img):
            reg = img[by0:by1, bx0:bx1]
            if not reg.size:
                return np.nan
            _, A_, B_ = oklab(reg)
            return float(np.quantile(np.hypot(A_, B_), 0.85))  # the body, not the sky around it
        tc = np.array([tchroma(b_) if not ((luminance(b_) > 0.85).mean() > 0.5) else np.nan for b_ in base])
        c_rest = float(np.nanmin(tc[:npre])) if np.isfinite(tc[:npre]).any() else 0.0
        c_hit = float(np.nanmax(tc[win])) if win and np.isfinite(tc[win]).any() else c_rest
        res["target-colour"] = {"pass": a.sprite_flash or (c_hit - c_rest) <= 0.05, "chroma_rest": round(c_rest, 3),
                                "chroma_hit": round(c_hit, 3), "max_rise": 0.05}

        if a.kind == "explosion" and info.get("blastGround"):
            gy = info["blastGround"][1] * H
            # From contact until the effect falls under 20% of its peak area, the soft mask
            # (smoke included) touches the ground for >= 60% of that time.
            end = max([i for i, v in enumerate(area) if v >= 0.2 * area.max()] or [len(times) - 1])
            span = [i for i, t in enumerate(times) if t >= contact - 1e-6 and i <= end]
            gaps = []
            for i in span:
                ys, xs = np.nonzero(masks[i])
                if len(ys) < 50:
                    continue
                if gy - np.quantile(ys, 0.995) > 0.04 * H:
                    gaps.append(round(times[i], 3))
            tot_t = (times[span[-1]] - times[span[0]]) if len(span) > 1 else 1
            gap_t = 0.0
            for i in span[1:]:
                if round(times[i], 3) in gaps:
                    gap_t += times[i] - times[i - 1]
            res["grounded"] = {"pass": gap_t <= 0.4 * tot_t, "floating_share": round(gap_t / max(tot_t, 1e-6), 3),
                               "floating_from": gaps[:1], "life_s": round(tot_t, 2)}

        if info.get("slashes"):
            bad = []
            for s_ in info["slashes"]:
                mx_, my_ = s_["mid"]
                pad = 0.1 * (tx1 - tx0)
                if not (tx0 - pad <= mx_ <= tx1 + pad and ty0 <= my_ <= ty1):
                    bad.append({"at": s_["at"], "mid": [round(mx_, 3), round(my_, 3)]})
            res["slash-crosses"] = {"pass": not bad, "missed": bad[:4], "target_box": [round(v, 3) for v in info["target"]]}

        if a.kind == "impact" and cv2 is not None:
            # A closed ring around the hit point reads as a targeting reticle.
            hx_, hy_ = info["hit"][0] * W, info["hit"][1] * H
            rings = []
            for i in [j for j, t in enumerate(times) if contact - 1e-6 <= t <= contact + 0.3]:
                cnts, hier = cv2.findContours(masks[i].astype(np.uint8), cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)
                if hier is None:
                    continue
                for k, c in enumerate(cnts):
                    par = hier[0][k][3]
                    if par < 0:
                        continue
                    hole, outer = cv2.contourArea(c), cv2.contourArea(cnts[par])
                    if hole > 0.25 * outer and hole > 200 and cv2.pointPolygonTest(c, (hx_, hy_), False) >= 0:
                        rings.append(round(times[i], 3))
                        break
            res["closed-ring"] = {"pass": len(rings) <= 1, "times": rings[:6]}

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
                ok = ang <= 45
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


def dark_check(ts, dfx, dbase, lfx, lbase):
    """Dark styles: the effect (smoke and residue included) keeps at least half of its
    visible area on the darkest background."""
    bad = []
    for t, f1, b1, f2, b2 in zip(ts, dfx, dbase, lfx, lbase):
        a_dark = effect_mask(f1, b1).sum()
        a_lit = effect_mask(f2, b2).sum()
        if a_lit > 200 and a_dark < 0.5 * a_lit:
            bad.append({"t": round(t, 3), "dark_area": int(a_dark), "lit_area": int(a_lit)})
    return {"dark-background": {"pass": not bad, "vanishing": bad}}


def key_mask(shapes, W, H, origin, hpx, sx):
    """Rasterize shape-key primitives (units of target height, +y up, +x along the hit)."""
    m = np.zeros((H, W), np.uint8)
    ox, oy = origin

    def P(x, y):
        return int(round(ox + sx * x * hpx)), int(round(oy - y * hpx))
    for sh in shapes:
        (kind, v), = sh.items()
        if kind == "circle":
            cv2.circle(m, P(v[0], v[1]), max(1, int(v[2] * hpx)), 1, -1)
        elif kind == "ellipse":
            cv2.ellipse(m, P(v[0], v[1]), (max(1, int(v[2] * hpx)), max(1, int(v[3] * hpx))), 0, 0, 360, 1, -1)
        elif kind == "poly":
            cv2.fillPoly(m, [np.array([P(x, y) for x, y in v], np.int32)], 1)
        elif kind == "star":
            x, y, ro, ri, n, rot = v
            pts = []
            for k in range(int(n) * 2):
                ang = np.radians(rot) + np.pi * k / n
                r = ro if k % 2 == 0 else ri
                pts.append(P(x + r * np.cos(ang), y + r * np.sin(ang)))
            cv2.fillPoly(m, [np.array(pts, np.int32)], 1)
    return m.astype(bool)


def key_check(keys, fx, base, times, contact, info, kind, out):
    """Overlap (IoU) of the rendered effect with its shape keys at contact, peak and break-up."""
    H, W = fx[0].shape[:2]
    tx0, ty0, tx1, ty1 = info["target"]
    hpx = (ty1 - ty0) * H
    if kind == "explosion":
        origin = (info["blastGround"][0] * W, info["blastGround"][1] * H)
        sx = 1
    else:
        origin = (info["hit"][0] * W, info["hit"][1] * H)
        sx = -1 if info.get("hitDir") and info["hitDir"][0] < info["hit"][0] else 1
    rows, tiles = {}, []
    for name in ("contact", "peak", "breakup"):
        if name not in keys:
            continue
        # Shape is judged here, timing by time-to-peak: each key is matched at its best frame
        # within +-50% of its time (at least +-2 frames) after contact.
        kt = max(keys[name]["t"], 1 / 60)
        win = max(kt * 0.5, 2 / 60, (1.01 / info['fps']) if info.get('fps') else 0)
        near = min(range(len(times)), key=lambda j: abs(times[j] - contact - kt))
        if name == "contact" and (luminance(base[near]) > 0.85).mean() > 0.5:
            rows[name] = "impact frame"  # an inked two-tone contact drawing is the designed contact shape
            continue
        cand = [j for j, tt in enumerate(times) if kt - win - 1e-6 <= tt - contact <= kt + win + 1e-6
                and (luminance(base[j]) > 0.85).mean() <= 0.5]  # skip inked two-tone impact frames
        if not cand:
            cand = [min(range(len(times)), key=lambda j: abs(times[j] - contact - kt))]
        km = key_mask(keys[name]["shapes"], W, H, origin, hpx, sx)
        k_ = max(3, int(0.04 * hpx) | 1)  # tolerance: about 4% of the target's height
        ker = np.ones((k_, k_), np.uint8)
        kmd = cv2.dilate(km.astype(np.uint8), ker).astype(bool)
        best = (-1.0, cand[0])
        kc = max(3, int(0.12 * hpx) | 1)
        close_k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (kc, kc))
        for j in cand:
            # Silhouette, not pixels: close gaps between sparks and streaks (about 12% of the
            # target's height) and fill holes, as a designer reads the shape.
            em = cv2.morphologyEx(effect_mask(fx[j], base[j], 0.12).astype(np.uint8), cv2.MORPH_CLOSE, close_k)
            cnts_, _ = cv2.findContours(em, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            em = np.zeros_like(em)
            cv2.drawContours(em, cnts_, -1, 1, -1)
            emd = cv2.dilate(em, ker).astype(bool)
            iou_j = float((emd & kmd).sum() / max(1, (emd | kmd).sum()))
            if iou_j > best[0]:
                best = (iou_j, j)
        iou, i = best
        rows[name] = round(iou, 3)
        img = (fx[i] * 255).astype(np.uint8).copy()
        cnts, _ = cv2.findContours(km.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        cv2.drawContours(img, cnts, -1, (0, 255, 255), 1)
        tiles.append(img)
    if tiles and out:
        Image.fromarray(np.concatenate(tiles, 1)).save(os.path.join(out, "keys.png"))
    nums = [v_ for v_ in rows.values() if isinstance(v_, float)]
    worst = min(nums) if nums else 1.0
    return {"shape-keys": {"pass": worst >= 0.3, "iou": rows, "min": 0.3, "aim": 0.6}}


def light_check(ts, lonly, bare, full, base):
    """Effect lights: the lit pool (ground and target) stays smaller than 3x the effect's
    core and dimmer than its hot body (numbers.md: explosion light <= 1 B)."""
    bad = []
    rows = []
    cores_ = [core_mask(fu, ba) for fu, ba in zip(full, base)]
    core_peak = max([c.sum() for c in cores_] + [1])
    for t, lo, br, fu, core in zip(ts, lonly, bare, full, cores_):
        lit = effect_mask(lo, br, 0.04)
        if lit.sum() < 50:
            continue
        rise = luminance(lo)[lit] - luminance(br)[lit]
        pool = float(np.quantile(luminance(lo)[lit], 0.95))
        body = float(np.quantile(luminance(fu)[core], 0.95)) if core.sum() > 20 else 1.0
        ar = lit.sum() / core_peak
        rows.append({"t": round(t, 3), "area_x": round(float(ar), 2), "pool_L": round(pool, 3), "body_L": round(body, 3), "rise": round(float(rise.mean()), 3)})
        if (ar > 3.0 and rise.mean() > 0.04) or pool > 0.9 * body:
            bad.append(rows[-1])
    return {"effect-light": {"pass": not bad, "over": bad[:4], "frames": len(rows)}}


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
            a.dark = a.dark or a.style in ("darkfantasy", "realism")
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
            # Lights alone against nothing at all, to cap effect lights against the effect.
            lt = [t for t in (contact + 0.03, contact + 0.1, contact + 0.25, contact + 0.5) if t < dur]
            only_lights = "window.rngStand.layers().filter(l => l.kind.startsWith('light')).map(l => l.i)"
            pg.evaluate(f"window.rngStand.set('camera', '{a.camera}')")
            pg.evaluate(f"window.rngStand.solo({only_lights})")
            lfx_ = [grab(t) for t in lt]
            pg.evaluate("window.rngStand.solo([])")
            lbare = [grab(t) for t in lt]
            pg.evaluate("window.rngStand.solo(null)")
            lfull = [grab(t) for t in lt]
            pg.evaluate(f"window.rngStand.solo({lights})")
            lbase = [grab(t) for t in lt]
            pg.evaluate("window.rngStand.solo(null)")
            light_pass = (lt, lfx_, lbare, lfull, lbase)
            pg.evaluate(f"window.rngStand.seek({contact + 2 / 60})")
            info = pg.evaluate("window.rngStand.info()")
            dark = None
            if a.dark:
                dt_ = [contact + 0.05, contact + 0.2, dur * 0.5, dur * 0.75, dur * 0.9]
                pg.evaluate("window.rngStand.set('background', 'Night arena')")
                dfx, dbase = shoot(a.camera, dt_)
                pg.evaluate(f"window.rngStand.set('background', '{a.background}')")
                lfx, lbase = shoot(a.camera, dt_)
                dark = (dt_, dfx, dbase, lfx, lbase)
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
    a.fps_style = fps_style
    if a.min_px is None:
        a.min_px = 200 if a.kind == "explosion" else 80  # tier 3 explosion, tier 2 impact
    if a.max_rise is None:
        a.max_rise = 0.2 if a.kind == "explosion" else 0.12
        if fps_style:
            a.max_rise = max(a.max_rise, 2.0 / fps_style)
    if a.max_red_L is None and a.style == "darkfantasy" and a.kind == "impact":
        a.max_red_L = 0.5
    if a.style == "pixel":
        a.sprite_flash = True
        a.min_sat_share = min(a.min_sat_share, 0.1)
    res = run_checks(fx, base, times, contact, dur, a, close=close, info=info)
    res.update(light_check(*light_pass))
    kp = a.keys or os.path.join(root, "keys", f"{a.style}-{a.fx}.json")
    if cv2 is not None and os.path.exists(kp):
        res.update(key_check(json.load(open(kp)), fx, base, times, contact, info, a.kind, out))
    if fps_style:
        k = contact * fps_style
        res["drawing-grid"] = {"pass": abs(k - round(k)) < 0.02, "contact": contact, "drawings_per_s": fps_style}
    if dark:
        res.update(dark_check(*dark))
    return res


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    for name in ("frames", "stand"):
        s = sub.add_parser(name)
        s.add_argument("--min-px", type=float, default=None, help="primary shape height at 1080p (40 tier 1, 80 tier 2, 200 tier 3); stand default: 80 impacts, 200 explosions")
        s.add_argument("--max-rise", type=float, default=None, help="seconds from contact until the hot body reaches 60%% of its peak (default 0.12 impacts, 0.2 explosions, at least 2 drawings)")
        s.add_argument("--max-red-L", type=float, default=None, help="dark blood: median OKLab lightness of saturated reds after contact (darkfantasy impact: 0.5)")
        s.add_argument("--kind", choices=["impact", "explosion", "other"], default=None)
        s.add_argument("--min-sat-share", type=float, default=0.15, help="share of visible pixels that must be saturated")
        s.add_argument("--sprite-flash", action="store_true", help="pixel style: a full-white sprite flash is the intended hit cue")
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
            s.add_argument("--dark", action="store_true", help="also check visibility on the Night arena background (on by default for darkfantasy and realism)")
            s.add_argument("--width", type=int, default=640)
            s.add_argument("--height", type=int, default=360)
            s.add_argument("--port", type=int, default=8790)
            s.add_argument("--out", default="")
            s.add_argument("--keys", default="", help="shape-key JSON (default stand/keys/<style>-<fx>.json)")
    a = ap.parse_args()
    if a.hue not in ("auto",):
        a.hue = None if str(a.hue).lower() == "none" else float(a.hue)
    if a.cmd == "frames":
        a.kind = a.kind or "other"
        a.min_px = a.min_px if a.min_px is not None else 40
        a.max_rise = a.max_rise if a.max_rise is not None else (0.2 if a.kind == "explosion" else 0.12)
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
