"""Render review frame strips of a web effect page.

    python scripts/capture_strip.py <folder with index.html> <output folder> [--size 1280x720]

The page must expose window.fx with: duration, contact, pause(), seek(t),
setCamera('gameplay' | 'close'), and optionally setBloom(on).

Writes gameplay.png, close.png and (when setBloom exists) gameplay_nobloom.png:
10 frames each at -2, 0, +2, +4, +8, +15, +30 frames from contact, then 50%, 75%
and 95% of the duration, labelled with the time from contact. Single frames are
saved beside them. Needs Playwright for Python with Chromium.
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
            has_bloom = page.evaluate("typeof window.fx.setBloom === 'function'")
            page.evaluate("window.fx.pause()")
            f = 1 / 60
            times = [contact - 2 * f, contact, contact + 2 * f, contact + 4 * f, contact + 8 * f,
                     contact + 15 * f, contact + 30 * f, dur * 0.5, dur * 0.75, dur * 0.95]
            times = [max(0.0, min(dur, t)) for t in times]
            canvas = page.query_selector("canvas")
            passes = [("gameplay", "gameplay", True), ("close", "close", True)]
            if has_bloom:
                passes.append(("gameplay_nobloom", "gameplay", False))
            for name, cam, bloom in passes:
                page.evaluate(f"window.fx.setCamera('{cam}')")
                if has_bloom:
                    page.evaluate(f"window.fx.setBloom({'true' if bloom else 'false'})")
                tiles = []
                for i, t in enumerate(times):
                    page.evaluate(f"window.fx.seek({t})")
                    page.wait_for_timeout(50)
                    im = Image.open(io.BytesIO(canvas.screenshot())).convert("RGB")
                    im.save(os.path.join(a.out, f"{name}_{i:02d}.png"))
                    th = im.resize((480, int(480 * im.height / im.width)))
                    ImageDraw.Draw(th).text((6, 4), f"{(t - contact) * 60:+.0f}f  {t - contact:+.3f}s", fill=(255, 255, 0))
                    tiles.append(th)
                tw, thh = tiles[0].size
                sheet = Image.new("RGB", (tw * 5, thh * 2))
                for i, th in enumerate(tiles):
                    sheet.paste(th, ((i % 5) * tw, (i // 5) * thh))
                sheet.save(os.path.join(a.out, f"{name}.png"))
            if has_bloom:
                page.evaluate("window.fx.setBloom(true)")
            browser.close()
    finally:
        srv.terminate()
    print(f"duration {dur:.2f}s, contact {contact:.3f}s, strips in {a.out}")
    for e in errors:
        print("page error:", e)


if __name__ == "__main__":
    main()
