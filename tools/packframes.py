"""Pack separately generated keyframes into a flipbook sheet.

Removes a flat background colour to alpha (soft edge), crops every frame to
the union of their bounding boxes so the pivot stays fixed, pads, and packs
into a grid. Used for image-model keyframes (see recipes/flipbooks.md).

    python tools/packframes.py frame_1.png frame_2.png ... -o sheet.png --cell 256 --bg 808080
"""
import argparse
import math

import numpy as np
from PIL import Image


def to_rgba(path, bg, tol, soft):
    im = np.asarray(Image.open(path).convert("RGB")).astype(np.float32) / 255.0
    d = np.sqrt(((im - bg) ** 2).sum(-1))
    a = np.clip((d - tol) / soft, 0.0, 1.0)
    return im, a


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("frames", nargs="+")
    ap.add_argument("-o", "--out", required=True)
    ap.add_argument("--cell", type=int, default=256)
    ap.add_argument("--bg", default="808080")
    ap.add_argument("--tol", type=float, default=0.06, help="colour distance treated as background")
    ap.add_argument("--soft", type=float, default=0.08, help="width of the alpha ramp above tol")
    ap.add_argument("--pad", type=float, default=0.04, help="empty border inside each cell, fraction")
    ap.add_argument("--cols", type=int, default=0)
    a = ap.parse_args()

    bg = np.array([int(a.bg[i:i + 2], 16) / 255.0 for i in (0, 2, 4)], np.float32)
    frames = [to_rgba(p, bg, a.tol, a.soft) for p in a.frames]

    # Union bounding box, made square around its centre.
    ys, xs = [], []
    for _, al in frames:
        yy, xx = np.nonzero(al > 0.05)
        ys += [yy.min(), yy.max()]
        xs += [xx.min(), xx.max()]
    cy, cx = (min(ys) + max(ys)) / 2, (min(xs) + max(xs)) / 2
    half = max(max(ys) - min(ys), max(xs) - min(xs)) / 2 / (1 - 2 * a.pad)
    box = (int(cx - half), int(cy - half), int(cx + half), int(cy + half))

    n = len(frames)
    cols = a.cols or int(math.ceil(math.sqrt(n)))
    rows = int(math.ceil(n / cols))
    sheet = Image.new("RGBA", (cols * a.cell, rows * a.cell), (0, 0, 0, 0))
    for i, (rgb, al) in enumerate(frames):
        # Un-mix the background from the soft edge so it does not leave a grey halo.
        alc = np.clip(al, 1e-3, 1.0)[..., None]
        fg = np.clip((rgb - bg * (1 - alc)) / alc, 0, 1)
        arr = np.dstack([fg, al])
        im = Image.fromarray((arr * 255).astype(np.uint8), "RGBA")
        canvas = Image.new("RGBA", (box[2] - box[0], box[3] - box[1]), (0, 0, 0, 0))
        canvas.paste(im, (-box[0], -box[1]))
        cell = canvas.resize((a.cell, a.cell), Image.LANCZOS)
        sheet.paste(cell, ((i % cols) * a.cell, (i // cols) * a.cell))
    sheet.save(a.out)
    print(f"wrote {a.out}: {n} frames, grid {cols}x{rows}, {a.cell}px cells")


if __name__ == "__main__":
    main()
