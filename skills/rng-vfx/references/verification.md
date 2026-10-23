# Verification

An effect is checked by looking at frames, not by reading code. Something other than the author's opinion should confirm it works: the reference, the grayscale read, the gameplay camera, the budget.

## Frame strip

The core artifact: 6 to 12 frames evenly spaced over the effect's duration, side by side, labelled with times. It shows timing, shape evolution and dissipation at a glance, and it is diffable between versions.

- **three.js / stand:** `window.rngStand.captureStrip(8)` returns a PNG data URL; the Tools folder in the stand's panel saves one.
- **Unity:** `references/engines/unity.md` > Headless frame strips.
- **Unreal:** Movie Render Queue to a PNG sequence, then tile (`references/engines/unreal.md`).
- Tiling frames from a folder: `ffmpeg -i frame_%04d.png -vf tile=8x1 strip.png` (pick the 8 frames first), or a few lines of Python with Pillow.

## Checklist

Check each against the breakdown written before building (SKILL.md step 3):

1. **Peak frame:** is there a clearly readable peak within the first few frames after contact? Is it the brightest, highest-contrast frame?
2. **Timing:** fast in, slow out? Layers staggered? Total length matches the brief?
3. **Grayscale:** desaturate the strip. Does the shape still read? Is the core the lightest value?
4. **Gameplay camera:** render at the real gameplay distance and angle. Is it still readable? Is it too big, hiding characters?
5. **Backgrounds:** dark, mid-gray and bright backgrounds. Additive effects vanish on bright ones; dark smoke vanishes on dark ones. The stand has four presets.
6. **Style rules:** compare against the style file's "What defines it" and "Common mistakes".
7. **Dissipation:** does every layer leave in its designed way? No pops, no hard cut at the end of life, no leftover particles.
8. **Hierarchy:** next to other effects of its tier, is it weighted correctly?
9. **Budget:** particle counts, overdraw and lights inside `references/performance.md` limits.
10. **Reference:** if a reference exists, place its frames under the strip at matching times and compare shape, timing and value.

## The stand

`stand/index.html` (served statically, also deployed to GitHub Pages) shows the six styles with impact and explosion archetypes.

- Timeline: play, pause, scrub, frame step (respects the style's drawings per second), speed 1 / 0.5 / 0.25 / 0.1, loop.
- View: four backgrounds, four camera presets including Gameplay (high and far), grayscale toggle, dummy toggle.
- Look: exposure, bloom, drawings per second override, impact frame and camera shake toggles.
- Tools: save frame strip, save current frame.
- **Compare mode:** engine renders (videos or strips) sit next to the live effect and follow the timeline. Add renders permanently by placing files in `stand/renders/` and listing them in `stand/renders/manifest.json`:

```json
{
  "items": [
    { "style": "anime", "effect": "impact", "engine": "Unity VFX Graph", "file": "anime-impact-unity.mp4", "note": "v2" }
  ]
}
```

- Deep links: `#style=darkfantasy&fx=explosion`.
- Script API (`window.rngStand`): `styles`, `select(style, fx)`, `play()`, `pause()`, `seek(t)`, `duration()`, `set(key, value)` for `background`, `camera`, `grayscale`, `bloom`, `dummy`, `captureFrame()`, `captureStrip(n)`.

Headless use with Playwright (Chromium software rendering works for correctness checks):

```python
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    page = b.new_page(viewport={"width": 1100, "height": 700})
    page.goto("http://localhost:8000/#style=anime&fx=impact")
    page.wait_for_function("window.rngStand")
    page.evaluate("window.rngStand.pause()")
    url = page.evaluate("window.rngStand.captureStrip(8)")
    # url is a data:image/png;base64,... string
    b.close()
```

Serve the folder first (`python -m http.server 8000 -d stand`); ES modules do not load from `file://`.

## Adding an effect to the stand

1. Open the style file in `stand/js/styles/` and add an entry under `effects` with `duration` and `build(fx)`.
2. Build it from the primitives: `fx.burst`, `fx.flash`, `fx.ring`, `fx.slash`, `fx.decal`, `fx.light`, plus `fx.shake` and `fx.impactFrame` curves. Every primitive takes a start time as its second argument.
3. Add the archetype to `ARCHETYPES` in `stand/js/styles/layout.js` (with a stage entry for dummy position and camera focus) if it is new.
4. Everything must be a function of time (seeded randomness, curves), so the timeline can scrub it.
