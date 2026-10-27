"""Render review frames of a web effect page: stills and a motion sequence.

    python scripts/capture_strip.py <folder with index.html> <output folder> [--size 1280x720]

The page must expose window.fx with: duration, contact, pause(), seek(t),
setCamera('gameplay' | 'close'), and optionally setBloom(on).

Writes:
- gameplay.png, close.png: 10 stills each at -2, 0, +2, +4, +8, +15, +30 frames
  from contact, then 50%, 75% and 95% of the duration, labelled with the time
  from contact (single frames are saved beside them).
- motion_gameplay.png: every frame at 60 fps from 6 frames before contact to
  30 frames after, in order, as a contact sheet. Use it to check jitter,
  popping, flicker and the rhythm of the hit, which stills cannot show.

Needs Playwright for Python with Chromium.
"""
import argparse
import io
import os
import socket
import subprocess
import sys
import time

from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright


def free_port():
    s = socket.socket()
    s.bind(("", 0))
    port = s.getsockname()[1]
    s.close()
    return port


def grab(page, canvas, t):
    page.evaluate(f"window.fx.seek({t})")
    page.wait_for_timeout(30)
    # A page screenshot clipped to the canvas: element screenshots wait for the
    # page to settle and time out on slow software-rendered WebGL.
    box = canvas.bounding_box()
    shot = page.screenshot(clip=box, timeout=120000)
    return Image.open(io.BytesIO(shot)).convert("RGB")


def sheet(tiles, cols):
    tw, th = tiles[0].size
    rows = (len(tiles) + cols - 1) // cols
    out = Image.new("RGB", (tw * cols, th * rows))
    for i, im in enumerate(tiles):
        out.paste(im, ((i % cols) * tw, (i // cols) * th))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("folder")
    ap.add_argument("out")
    ap.add_argument("--size", default="1280x720")
    a = ap.parse_args()
    w, h = (int(v) for v in a.size.split("x"))
    os.makedirs(a.out, exist_ok=True)
    port = free_port()
    srv = subprocess.Popen([sys.executable, "-m", "http.server", str(port), "-d", a.folder],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1)
    errors = []
    f = 1 / 60
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
            page = browser.new_page(viewport={"width": w, "height": h})
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.goto(f"http://localhost:{port}/index.html")
            # The predicate must return a boolean: a returned function would be called by Playwright.
            page.wait_for_function("!!(window.fx && window.fx.seek)", timeout=60000)
            page.wait_for_timeout(1000)
            dur = page.evaluate("window.fx.duration")
            contact = page.evaluate("window.fx.contact")
            page.evaluate("window.fx.pause()")
            if page.evaluate("typeof window.fx.setBloom === 'function'"):
                page.evaluate("window.fx.setBloom(true)")
            canvas = page.query_selector("canvas")

            # Stills
            times = [contact - 2 * f, contact, contact + 2 * f, contact + 4 * f, contact + 8 * f,
                     contact + 15 * f, contact + 30 * f, dur * 0.5, dur * 0.75, dur * 0.95]
            times = [max(0.0, min(dur, t)) for t in times]
            for cam in ("gameplay", "close"):
                page.evaluate(f"window.fx.setCamera('{cam}')")
                tiles = []
                for i, t in enumerate(times):
                    im = grab(page, canvas, t)
                    im.save(os.path.join(a.out, f"{cam}_{i:02d}.png"))
                    th = im.resize((480, int(480 * im.height / im.width)))
                    ImageDraw.Draw(th).text((6, 4), f"{(t - contact) * 60:+.0f}f  {t - contact:+.3f}s", fill=(255, 255, 0))
                    tiles.append(th)
                sheet(tiles, 5).save(os.path.join(a.out, f"{cam}.png"))

            # Motion: consecutive frames around contact, gameplay camera
            page.evaluate("window.fx.setCamera('gameplay')")
            tiles = []
            for k in range(-6, 31):
                t = contact + k * f
                if t < 0 or t > dur:
                    continue
                th = grab(page, canvas, t).resize((320, int(320 * h / w)))
                ImageDraw.Draw(th).text((4, 3), f"{k:+d}f", fill=(255, 255, 0))
                tiles.append(th)
            sheet(tiles, 6).save(os.path.join(a.out, "motion_gameplay.png"))

            browser.close()
    finally:
        srv.terminate()
    print(f"duration {dur:.2f}s, contact {contact:.3f}s, review frames in {a.out}")
    for e in errors:
        print("page error:", e)


if __name__ == "__main__":
    main()
