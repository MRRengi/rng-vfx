#!/usr/bin/env python3
"""texgen - procedural VFX textures for rng-vfx.

Headless, deterministic, no GPU. Needs numpy and Pillow.
Everything this script outputs is yours (MIT, same as the repo).

Examples:
  python texgen.py noise --kind fbm --size 512 --seamless -o fbm.png
  python texgen.py noise --kind voronoi --cells 8 --size 512 --seamless -o cells.png
  python texgen.py noise --kind cracks --cells 6 -o cracks.png
  python texgen.py shape --kind ring --width 0.08 -o ring.png
  python texgen.py shape --kind star --spikes 6 --sharp 12 -o star.png
  python texgen.py shape --kind glow --falloff 2.5 -o glow.png
  python texgen.py shape --kind streak -o streak.png
  python texgen.py ramp --stops "0:#ffffff,0.3:#ffd34d,0.7:#ff6a1f,1:#3b0f0f" -o fire_ramp.png
  python texgen.py flipbook --kind puff --frames 16 --size 1024 -o puff_4x4.png
  python texgen.py flipbook --kind fire --frames 16 --size 1024 -o fire_4x4.png
  python texgen.py pack --r a.png --g b.png --b c.png --a d.png -o packed.png
"""
import argparse
import math
import numpy as np
from PIL import Image


# ---------------------------------------------------------------- noise core
def _rng(seed):
    return np.random.default_rng(seed)


def value_noise(size, freq, seed=0, periodic=True):
    """Smooth value noise. With periodic=True it tiles seamlessly."""
    r = _rng(seed)
    grid = r.random((freq + 1, freq + 1))
    if periodic:
        grid[-1, :] = grid[0, :]
        grid[:, -1] = grid[:, 0]
    x = np.linspace(0, freq, size, endpoint=False)
    xi = np.floor(x).astype(int)
    xf = x - xi
    u = xf * xf * (3 - 2 * xf)
    a = grid[np.ix_(xi, xi)]
    b = grid[np.ix_(xi, xi + 1)]
    c = grid[np.ix_(xi + 1, xi)]
    d = grid[np.ix_(xi + 1, xi + 1)]
    uy, ux = np.meshgrid(u, u, indexing="ij")
    return (a * (1 - ux) + b * ux) * (1 - uy) + (c * (1 - ux) + d * ux) * uy


def fbm(size, base=4, octaves=5, seed=0, gain=0.5, periodic=True):
    out = np.zeros((size, size))
    amp, total = 1.0, 0.0
    for o in range(octaves):
        out += amp * value_noise(size, base * 2 ** o, seed + o * 31, periodic)
        total += amp
        amp *= gain
    return out / total


def warped_fbm(size, base=3, seed=0, strength=0.35, periodic=True):
    """Domain-warped fbm: swirly, smoke-like structure."""
    n = fbm(size, base, 5, seed, periodic=periodic)
    w1 = fbm(size, base, 4, seed + 100, periodic=periodic)
    w2 = fbm(size, base, 4, seed + 200, periodic=periodic)
    yy, xx = np.meshgrid(np.arange(size), np.arange(size), indexing="ij")
    sx = ((xx + (w1 - 0.5) * strength * size) % size).astype(int)
    sy = ((yy + (w2 - 0.5) * strength * size) % size).astype(int)
    return n[sy, sx]


def voronoi(size, cells=8, seed=0, edges=False):
    """F1 distance (cells) or F2-F1 (edges). Always tiles."""
    r = _rng(seed)
    pts = r.random((cells, cells, 2))
    yy, xx = np.meshgrid(np.arange(size), np.arange(size), indexing="ij")
    px = xx / size * cells
    py = yy / size * cells
    d1 = np.full((size, size), 9.0)
    d2 = np.full((size, size), 9.0)
    n1 = np.zeros((size, size, 2))
    n2 = np.zeros((size, size, 2))
    for j in range(-2, cells + 2):
        for i in range(-2, cells + 2):
            p = pts[j % cells, i % cells]
            cx, cy = i + p[0], j + p[1]
            dx = px - cx
            dy = py - cy
            d = np.sqrt(dx * dx + dy * dy)
            closer = d < d1
            second = (~closer) & (d < d2)
            d2 = np.where(closer, d1, np.where(second, d, d2))
            n2 = np.where(closer[..., None], n1, np.where(second[..., None], [cx, cy], n2))
            d1 = np.where(closer, d, d1)
            n1 = np.where(closer[..., None], [cx, cy], n1)
    if not edges:
        return d1
    # Distance to the bisector between the two nearest points: a true border distance.
    sep = np.linalg.norm(n2 - n1, axis=-1)
    return (d2 * d2 - d1 * d1) / np.maximum(2 * sep, 1e-6)


def norm01(a):
    a = a - a.min()
    m = a.max()
    return a / m if m > 0 else a


def polar(size):
    yy, xx = np.meshgrid(np.linspace(-1, 1, size), np.linspace(-1, 1, size), indexing="ij")
    return np.sqrt(xx * xx + yy * yy), np.arctan2(yy, xx)


# ---------------------------------------------------------------- outputs
def save_gray(a, path):
    Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8), "L").save(path)
    print("wrote", path)


def save_rgba(rgb, alpha, path):
    arr = np.dstack([np.clip(rgb, 0, 1), np.clip(alpha, 0, 1)])
    Image.fromarray((arr * 255).astype(np.uint8), "RGBA").save(path)
    print("wrote", path)


def hex_rgb(h):
    h = h.strip().lstrip("#")
    return np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)])


def parse_stops(s):
    out = []
    for part in s.split(","):
        p, c = part.split(":")
        out.append((float(p), hex_rgb(c)))
    return sorted(out, key=lambda x: x[0])


def sample_ramp(stops, t):
    t = np.clip(t, 0, 1)
    out = np.zeros(t.shape + (3,))
    for (p0, c0), (p1, c1) in zip(stops[:-1], stops[1:]):
        m = (t >= p0) & (t <= p1)
        k = ((t - p0) / max(p1 - p0, 1e-6))[..., None]
        out[m] = (c0 * (1 - k) + c1 * k)[m]
    out[t <= stops[0][0]] = stops[0][1]
    out[t >= stops[-1][0]] = stops[-1][1]
    return out


# ---------------------------------------------------------------- commands
def cmd_noise(a):
    s, seed = a.size, a.seed
    if a.kind == "value":
        img = value_noise(s, a.freq, seed, a.seamless)
    elif a.kind == "fbm":
        img = fbm(s, a.freq, a.octaves, seed, periodic=a.seamless)
    elif a.kind == "warped":
        img = warped_fbm(s, a.freq, seed, periodic=a.seamless)
    elif a.kind == "voronoi":
        img = norm01(voronoi(s, a.cells, seed))
    elif a.kind == "cells":
        img = 1 - norm01(voronoi(s, a.cells, seed))
    elif a.kind == "cracks":
        e = voronoi(s, a.cells, seed, edges=True)
        img = 1 - np.clip(e / a.edge, 0, 1)
    elif a.kind == "ridged":
        img = 1 - np.abs(fbm(s, a.freq, a.octaves, seed, periodic=a.seamless) * 2 - 1)
    else:
        raise SystemExit("unknown noise kind")
    img = norm01(img)
    if a.contrast != 1:
        img = np.clip((img - 0.5) * a.contrast + 0.5, 0, 1)
    save_gray(img, a.out)


def cmd_shape(a):
    s = a.size
    r, ang = polar(s)
    if a.kind == "glow":
        img = np.clip(1 - r, 0, 1) ** a.falloff
    elif a.kind == "ring":
        d = np.abs(r - a.radius) - a.width
        img = np.clip(1 - d / a.soft, 0, 1) * (r <= 1)
    elif a.kind == "star":
        sp = np.abs(np.cos(ang * a.spikes / 2)) ** a.sharp
        rad = a.core + a.spike_len * sp
        img = np.clip((1 - r / rad) * 2.5, 0, 1) ** 1.5
    elif a.kind == "streak":
        yy, xx = np.meshgrid(np.linspace(0, 1, s), np.linspace(-1, 1, s), indexing="ij")
        img = np.clip(1 - np.abs(xx), 0, 1) ** 1.5 * (1 - yy) ** 1.6
    elif a.kind == "puff":
        n = fbm(s, 4, 4, a.seed, periodic=False)
        img = np.clip((1 - r + (n - 0.5) * 0.6) * 2.2, 0, 1)
    elif a.kind == "slash":
        # crescent mask, U along the arc, V across: use with a polar-free mesh or as a sprite
        yy, xx = np.meshgrid(np.linspace(-1, 1, s), np.linspace(-1, 1, s), indexing="ij")
        c1 = np.sqrt(xx ** 2 + (yy + 0.2) ** 2)
        c2 = np.sqrt((xx + 0.15) ** 2 + (yy + 0.45) ** 2)
        img = np.clip((0.95 - c1) * 8, 0, 1) * np.clip((c2 - 0.85) * 8, 0, 1)
    else:
        raise SystemExit("unknown shape kind")
    save_gray(img, a.out)


def cmd_ramp(a):
    stops = parse_stops(a.stops)
    t = np.tile(np.linspace(0, 1, a.width), (a.height, 1))
    rgb = sample_ramp(stops, t)
    Image.fromarray((rgb * 255).astype(np.uint8), "RGB").save(a.out)
    print("wrote", a.out)


def cmd_flipbook(a):
    n = a.frames
    grid = int(math.ceil(math.sqrt(n)))
    cell = a.size // grid
    sheet_rgb = np.zeros((grid * cell, grid * cell, 3))
    sheet_a = np.zeros((grid * cell, grid * cell))
    r, _ = polar(cell)
    yy = np.linspace(-1, 1, cell)[:, None] * np.ones((1, cell))
    base = warped_fbm(cell, 3, a.seed, periodic=False)
    detail = fbm(cell, 6, 4, a.seed + 7, periodic=False)
    stops = parse_stops(a.stops) if a.stops else None
    for f in range(n):
        t = f / max(n - 1, 1)
        if a.kind == "puff":
            # expanding smoke puff that thins and erodes
            grow = 0.6 + 0.4 * (1 - (1 - t) ** 3)
            noise = base * 0.75 + detail * 0.25
            dens = (1 - r / grow) * 1.5 + (noise - 0.5) * 1.2 - t ** 1.5 * 1.4
            alpha = np.clip(dens * 2.0, 0, 1)
            lit = np.clip(0.8 + (np.roll(base, -int(cell * 0.03), axis=0) - base) * 4 - yy * 0.25, 0.35, 1.2)
            col = np.ones((cell, cell, 3)) * lit[..., None] * 0.85
            if stops is not None:
                col = sample_ramp(stops, np.full((cell, cell), t)) * lit[..., None]
        elif a.kind == "fire":
            # flame tongues rising and eroding, colored by heat
            shift = int(t * cell * 0.6)
            noise = np.roll(base, -shift, axis=0) * 0.6 + np.roll(detail, -shift * 2, axis=0) * 0.4
            mask = np.clip(1 - r * 0.9, 0, 1) * np.clip(1 - (-yy) * 0.6, 0, 1)
            thr = 0.15 + 0.75 * t ** 1.3
            heat = (noise * mask * 1.8 - thr) / 0.6
            alpha = np.clip(heat * 3, 0, 1)
            fire_stops = stops or parse_stops("0:#fffbe0,0.25:#ffd34d,0.55:#ff6a1f,0.85:#b3261e,1:#3b0f0f")
            col = sample_ramp(fire_stops, 1 - np.clip(heat, 0, 1))
        else:
            raise SystemExit("unknown flipbook kind")
        gy, gx = divmod(f, grid)
        sheet_rgb[gy * cell:(gy + 1) * cell, gx * cell:(gx + 1) * cell] = col
        sheet_a[gy * cell:(gy + 1) * cell, gx * cell:(gx + 1) * cell] = alpha
    save_rgba(sheet_rgb, sheet_a, a.out)
    print(f"grid {grid}x{grid}, {n} frames, {cell}px cells")


def cmd_pack(a):
    chans = []
    size = None
    for p in (a.r, a.g, a.b, a.a):
        if p:
            im = Image.open(p).convert("L")
            size = size or im.size
            chans.append(np.asarray(im.resize(size), dtype=np.float64) / 255)
        else:
            chans.append(None)
    if size is None:
        raise SystemExit("give at least one channel")
    chans = [c if c is not None else np.zeros(size[::-1]) for c in chans]
    if a.a is None:
        chans[3] = np.ones(size[::-1])
    save_rgba(np.dstack(chans[:3]), chans[3], a.out)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)

    n = sub.add_parser("noise")
    n.add_argument("--kind", default="fbm", choices=["value", "fbm", "warped", "voronoi", "cells", "cracks", "ridged"])
    n.add_argument("--size", type=int, default=512)
    n.add_argument("--freq", type=int, default=4)
    n.add_argument("--octaves", type=int, default=5)
    n.add_argument("--cells", type=int, default=8)
    n.add_argument("--contrast", type=float, default=1.0)
    n.add_argument("--edge", type=float, default=0.04, help="crack width in cell units")
    n.add_argument("--seamless", action="store_true")
    n.add_argument("--seed", type=int, default=1)
    n.add_argument("-o", "--out", required=True)
    n.set_defaults(fn=cmd_noise)

    s = sub.add_parser("shape")
    s.add_argument("--kind", default="glow", choices=["glow", "ring", "star", "streak", "puff", "slash"])
    s.add_argument("--size", type=int, default=256)
    s.add_argument("--falloff", type=float, default=2.0)
    s.add_argument("--radius", type=float, default=0.7)
    s.add_argument("--width", type=float, default=0.06)
    s.add_argument("--soft", type=float, default=0.05)
    s.add_argument("--spikes", type=int, default=6)
    s.add_argument("--sharp", type=float, default=10)
    s.add_argument("--core", type=float, default=0.25)
    s.add_argument("--spike-len", type=float, default=0.7)
    s.add_argument("--seed", type=int, default=1)
    s.add_argument("-o", "--out", required=True)
    s.set_defaults(fn=cmd_shape)

    r = sub.add_parser("ramp")
    r.add_argument("--stops", required=True, help='"pos:#hex,pos:#hex,..."')
    r.add_argument("--width", type=int, default=256)
    r.add_argument("--height", type=int, default=8)
    r.add_argument("-o", "--out", required=True)
    r.set_defaults(fn=cmd_ramp)

    f = sub.add_parser("flipbook")
    f.add_argument("--kind", default="puff", choices=["puff", "fire"])
    f.add_argument("--frames", type=int, default=16)
    f.add_argument("--size", type=int, default=1024)
    f.add_argument("--stops", default=None, help="optional color ramp over life (puff) or heat (fire)")
    f.add_argument("--seed", type=int, default=1)
    f.add_argument("-o", "--out", required=True)
    f.set_defaults(fn=cmd_flipbook)

    p = sub.add_parser("pack")
    for c in ("r", "g", "b", "a"):
        p.add_argument(f"--{c}")
    p.add_argument("-o", "--out", required=True)
    p.set_defaults(fn=cmd_pack)

    args = ap.parse_args()
    args.fn(args)


if __name__ == "__main__":
    main()
