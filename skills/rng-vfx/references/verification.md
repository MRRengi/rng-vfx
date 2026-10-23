# Verification

An effect is checked by looking at frames, not by reading code. Something other than the author's opinion should confirm it works: the reference, the grayscale read, the gameplay camera, the budget.

## Frame strip

The core artifact: 6 to 12 frames evenly spaced over the effect's duration, side by side, labelled with times. It shows timing, shape evolution and dissipation at a glance, and it is diffable between versions.

- **three.js / stand:** `window.rngStand.captureStrip(8)` returns a PNG data URL; the Tools folder in the stand's panel saves one.
- **Peak strip:** an evenly spaced strip misses 1 - 3 frame peaks. Always also capture frames packed around contact: -1, 0, +1, +2, +3, +5, +8, +12 frames (`window.rngStand.capturePeak()`; it steps in the style's drawings, so in anime +2 is 2/12 s and in pixel 2/10 s; use `captureTimes` for 60 fps steps). When an effect's contact is at 0, frames before contact do not exist and the -1 frame repeats contact: give effects a short real lead-in (a few frames of anticipation or a tiny glow) so the strip shows what comes before, at full resolution.
- **Unity:** `references/engines/unity.md` > Headless frame strips.
- **Unreal:** Movie Render Queue to a PNG sequence, then tile (`references/engines/unreal.md`).
- Tiling frames from a folder: `ffmpeg -i frame_%04d.png -vf tile=8x1 strip.png` (pick the 8 frames first), or a few lines of Python with Pillow.

## Checklist

Check each against the breakdown written before building (SKILL.md step 2):

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

## Before textures: the blockout check

Before any texture or shader work, render the effect as flat grayscale shapes with final timing through the gameplay camera:
- The primary shape reaches its minimum size on screen.
- The hit direction reads.
- The slash midpoint falls inside the target.
- Nothing leaves the frame.

Problems found here are cheap. Found after texturing, they get papered over with glow.

## Required outputs per review

An even strip, a peak strip around contact, and one strip from the gameplay camera, shown next to the reference frames (SKILL.md step 2) and the project's existing effects (`audit.md`). Close-ups alone hide readability problems; an effect judged without its references drifts toward the agent's own taste.

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

### Mechanical checks (script)

`tools/vfxcheck.py` runs these on any frame sequence. Give it the effect frames and matching frames of the same shot without the effect (effect layers hidden; target reaction, effect lights and decals still on). It derives the effect mask by difference:

```
python tools/vfxcheck.py frames --fx out/fx --base out/base --fps 60 --contact 0.1 --hue 30 --kind explosion
python tools/vfxcheck.py stand realism explosion        # renders the stand itself, gameplay camera + close-up pass
```

Sample at 60 fps around contact (or at the drawing rate for held-drawing styles); `--times` takes a file of per-frame times for mixed sampling. It reports PASS or FAIL and exits 1 on any failure:

- **Straight edges.** Dead-straight runs on the mask outline that end in a corner with a solid body behind them (a quad, strip or ground cut). Exempt by design: full-screen and two-tone impact frames, thin features (streaks, spike tips), edges that coincide with scene geometry. Run on close-up frames.
- **Size.** Primary shape height at peak in 1080p pixels at the gameplay camera, from a strict mask without the bloom halo (`--min-px` 40 / 80 / 200 by tier).
- **Frame border.** The effect never touches the frame border.
- **White clip and haze** on the effect's brightest frame: at most 10% of the effect clipped to white; brightness outside the effect rises at most 25%.
- **Hue.** On the frame with the most visible effect pixels (impacts: within 0.25 s of contact), 15% or more of those pixels are saturated, and 30% or more of the saturated ones sit within 25 degrees of `--hue` (so two-colour designs pass, drifted colours do not). Required; `--hue none` only for neutral effects. This catches AgX turning red into salmon and orange into white.
- **Static hold** in seconds: at most 4 frames at full rate, 2 drawings in held styles.
- **Empty tail.** At 90% of the duration the mask holds at least 2% of its peak area.
- **Growth** (`--kind explosion`). The first frame with content after contact is at most 50% of the peak area.
- **Target flash, slash crossing, hit vector** (stand, which exports the target's screen box, slash midpoints and swing directions, and the projected hit direction). The target never brightens before contact and stays below 0.75x the spark body. Every slash midpoint lies inside the target box. The spray leaves the target within 60 degrees of the hit direction, and no slash swings against it. In another engine, export the same points and add them to the run.

- **Static hold per region.** The frame is split into 8 x 8 tiles; a tile with effect content that does not change for longer than the limit fails, so a frozen spark is caught even while smoke moves elsewhere.
- **Target visible.** During the hit the target keeps at least half its rest luminance and 0.08 or more (dark tints must not erase it).
- **Grounded** (explosions). For 0.4 s after the peak, the bottom of the effect stays within 4% of the frame of the blast's ground point.
- **Dark background** (dark fantasy and realism by default, `--dark` for others). At five moments the effect keeps at least half of its visible area on the darkest background.

Passing is necessary, not sufficient. The script finds known cheap tells; the shape keys and the references judge the rest.

### Checks the script does not do

Judge these on the strips, against the shape keys (SKILL.md step 7) and the references:

- **Silhouette proportions:** the effect mask at contact, +3 and +8 frames matches the shape keys (overlap about 60% or more); the explosion is taller than wide; the impact spark is longer along the hit than across it.
- **Post-palette colour (pixel):** sample the main colours after the palette pass. If smoke maps to a hue it was not meant to have, the palette lacks neutrals.
- **Grayscale separation:** the main shape and its shadow side differ by 0.25 or more in grayscale; smoke and background differ by 0.25 or more on the mid background.
- **Reticle and cotton balls:** no concentric star-ring-disc, no pile of round blobs.

Review on a mid or dusk background by default: black backgrounds flatter additive effects and hide the problems above. Dark styles (dark fantasy, horror) are reviewed on a dark background as well, because that is where their smoke and blood vanish.

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
