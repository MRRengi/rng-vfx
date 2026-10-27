# Harness for every VFX task

Deliver one effect as a self-contained web page in the output folder you are given:

- `index.html` (plus any `.js`, shader or texture files it needs, all inside the output folder). Use three.js; install it into the output folder with `npm install three` and load it with an import map pointing at `./node_modules/three/build/three.module.js` and `./node_modules/three/examples/jsm/`. The page must work offline when served with `python3 -m http.server` from the output folder.
- Scene: a flat ground plane, a neutral dusk sky, and a capsule "dummy" 1.8 m tall standing at the origin as the hit target and size reference. Units are metres.
- Two cameras, switchable with `window.fx.setCamera('gameplay' | 'close')`:
  - `gameplay`: third-person game view, about 10 m from the action, 40 degree vertical FOV, looking slightly down.
  - `close`: about 4 m away, framing the effect.
- Default canvas 1280x720.
- Scripting API on `window.fx` so frames can be captured headlessly:
  - `fx.duration` (seconds), `fx.contact` (seconds, the moment of impact or detonation)
  - `fx.pause()`, `fx.seek(t)` (renders the exact frame at time t, deterministic across calls), `fx.play()`
  - `fx.setCamera(name)`
- The effect plays once from t = 0 to `fx.duration`, then loops after a short pause when playing.

Headless rendering in this environment: Playwright for Python with Chromium is preinstalled; launch Chromium with `args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"]`. Do not run `playwright install`.

Also write `notes.md` in the output folder: a few lines on what you built and the main decisions.
