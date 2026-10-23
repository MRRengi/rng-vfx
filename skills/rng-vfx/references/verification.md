# Verification

An effect is checked by looking at frames, not by reading code. Something other than the author's opinion should confirm it works: the reference, the grayscale read, the gameplay camera, the budget.

## Frame strip

The core artifact: 6 to 12 frames evenly spaced over the effect's duration, side by side, labelled with times. It shows timing, shape evolution and dissipation at a glance, and it is diffable between versions.

- **three.js / stand:** `window.rngStand.captureStrip(8)` returns a PNG data URL; the Tools folder in the stand's panel saves one.
- **Peak strip:** an evenly spaced strip misses 1 - 3 frame peaks. Always also capture frames packed around contact: -1, 0, +1, +2, +3, +5, +8, +12 frames (`window.rngStand.capturePeak()`; it steps in the style's drawings, so in anime +2 is 2/12 s and in pixel 2/10 s; use `captureTimes` for 60 fps steps), at full resolution.
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
10. **Reference (mandatory):** take 2 - 3 frames from the reference games named in the style file (or the user's reference), place them under the strip at matching times, compare shape, timing and value.

## Layer census

Once per effect, solo each layer (all other layers hidden) and render it across its lifetime on a dark and a mid background. Every layer must visibly appear. A layer that never shows is a bug (culling, blending, a wrong start time, zero alpha), not a tuning problem, and no look review is valid until the census passes. The stand exposes `window.rngStand.layers()` and `window.rngStand.solo(i)` for this.

The stand (or any reference implementation) is not proof that a rule is implemented: check the rule in the code.

## Required outputs per review

An even strip, a peak strip around contact, and one strip from the gameplay camera. Close-ups alone hide readability problems.

## Cheapness checklist

Any yes means the effect still looks cheap:

- Does the peak frame read as balls, discs or cotton (separate round puffs)?
- Does it read as a reticle (concentric star, ring and disc of similar size)?
- Are there hard lines where quads cut the ground or the character?
- Is any element under 2 px, or are sparks dots instead of streaks?
- Is there a white-out frame or a bloom haze hiding the shape?
- Do dark layers vanish on the dark background, or bright additive ones on the bright background?
- Does the target not react?
- In held-drawing styles, do keys fall between drawings (missing contact drawing)?
- Does every style use the same noise look (procedural value-noise blobs)?
- Is the shockwave a soft coloured disc instead of distortion plus a thin edge?
- Is there a closed ring larger than the character (a selection circle)?
- Does the target flash brighter than the spark?
- Is any shape held unchanged for more than 4 frames?
- Does the fire have no hot core at its peak (islands)?
- Did the layer census pass?

### Mechanical checks

Run these on rendered frames instead of judging by eye:

- **Held shape:** no region of the effect is pixel-identical (or within 1%) across more than 4 frames at 60 fps, or more than 2 drawings in held-drawing styles.
- **Empty tail:** the effect's mask is non-empty in the frame at 90% of the duration.
- **Silhouette aspect:** the explosion's bounding box at peak is taller than wide (1.2 or more); the impact spark is longer along the hit than across it.
- **Post-palette colour (pixel):** sample the effect's main colours after the palette pass. If smoke maps to a hue it was not meant to have, the palette lacks neutrals.
- **Grayscale separation:** the main shape and its shadow side differ by 0.25 or more in grayscale; smoke and background differ by 0.25 or more on the mid background.

Review on a mid or dusk background by default. Black backgrounds flatter additive effects and hide the problems above.

## The stand

`stand/index.html` (served statically, also deployed to GitHub Pages) shows the six styles with impact and explosion archetypes.

- Timeline: play, pause, scrub, frame step (respects the style's drawings per second), speed 1 / 0.5 / 0.25 / 0.1, loop.
- View: four backgrounds (dusk by default), four camera presets including Gameplay (high and far), grayscale toggle, dummy toggle.
- Engine: shared RGBA noise texture, soft particles from an opaque depth prepass, a distortion buffer and pass, premultiplied fire, smoke lit by its fire, a reacting dummy (flash, fresnel rim, jolt, lean), shadows from big effect lights, a textured PBR floor.
- Look: exposure, bloom, drawings per second override, impact frame and camera shake toggles.
- Tools: save frame strip, save peak strip, save current frame.
- **Compare mode:** engine renders (videos or strips) sit next to the live effect and follow the timeline. Add renders permanently by placing files in `stand/renders/` and listing them in `stand/renders/manifest.json`:

```json
{
  "items": [
    { "style": "anime", "effect": "impact", "engine": "Unity VFX Graph", "file": "anime-impact-unity.mp4", "note": "v2" }
  ]
}
```

- Deep links: `#style=darkfantasy&fx=explosion`.
- Script API (`window.rngStand`): `styles`, `select(style, fx)`, `play()`, `pause()`, `seek(t)`, `duration()`, `contact()`, `set(key, value)` for `background`, `camera`, `grayscale`, `bloom`, `dummy`, `softParticles`, `distortion`, `reaction`, `captureFrame()`, `captureStrip(n)`, `capturePeak()`, `captureTimes(times)`.

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
2. Build it from the primitives: `fx.burst`, `fx.flash`, `fx.ring`, `fx.slash`, `fx.decal`, `fx.distort`, `fx.light`, plus `fx.shake`, `fx.impactFrame`, `fx.exposure` curves and `fx.target` (hit reaction). Every primitive takes a start time as its second argument. Set `contact` on the effect so the peak strip centres on it. Use `HIT_DIR`, `RING_N` and `AWAY` from `layout.js` for directions.
3. Add the archetype to `ARCHETYPES` in `stand/js/styles/layout.js` (with a stage entry for dummy position and camera focus) if it is new.
4. Everything must be a function of time (seeded randomness, curves), so the timeline can scrub it.
