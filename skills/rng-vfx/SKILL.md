---
name: rng-vfx
description: Use when designing or building real-time game visual effects - hits, slashes, impacts, explosions, fire, smoke, magic, projectiles, auras, lightning, trails, shockwaves - or their shaders, particles, timing and textures, in Unity (Shuriken, VFX Graph, Shader Graph), Unreal (Niagara) or three.js / WebGL, in any style from realistic to anime, toon, stylized MOBA, dark fantasy or pixel art. Also use when an existing effect looks cheap, weak, washed out or unreadable and needs fixing.
---

# Game VFX

Work as the lead VFX artist on a shipped action game. Effects exist for the player: they tell what happened, where, and how hard, in a fraction of a second, from the camera the game is actually played with. Beauty in a close-up that does not read from the gameplay camera is a failure.

## What generated effects get wrong

Effects made by agents cluster around the same defaults. They are why an effect reads as cheap, so treat each as a decision you have to justify, not a starting point:

1. **Bloom does the work.** Cores pushed to white and bloom turned up, so the frame washes out, the target blows out and shapes dissolve into glow. Shipped effects are designed in value first and read with bloom off; bloom is an accent on the hottest few percent.
2. **Hairlines.** Rings, spikes, speed lines and sparks one or two pixels wide that look fine in the close-up and vanish at the gameplay camera.
3. **No primary shape.** A soft glowing blob, a cloud of noise or several competing elements instead of one designed silhouette that reads in a single still frame.
4. **Wrong timing.** A slow swell to a late peak, or a long full-screen moment, followed by everything vanishing at once. Shipped hits peak within 1 - 3 frames of contact, hold briefly, and spend most of their life dissipating.
5. **No contact.** The target and the ground do not react: no light on the target, no dust, no mark, no knockback.
6. **Weak dissipation.** Smoke that detaches and floats away as one lump, puffs that shrink uniformly, trails that pop off.
7. **Generic palette.** Everything warm white-orange, gold or pastel, regardless of genre and readability against the scene.
8. **Noise as detail.** Procedural noise used as surface texture reads as dirt or grain. In shipped work, noise breaks edges and drives erosion of a designed shape; the detail comes from the shapes.

## The process

Copy this checklist into your notes and work through it in order. The written plan comes before any code because the expensive mistakes (wrong primary shape, wrong timing, wrong palette) are design mistakes, and they are cheap to fix on paper and expensive to fix in shaders.

```
- [ ] 1. Brief and audit
- [ ] 2. Reference breakdown
- [ ] 3. Design plan (shape, value, colour, timing, layers)
- [ ] 4. Check the plan against the defaults above; revise
- [ ] 5. Blockout: flat shapes, bloom off, gameplay camera; review frames
- [ ] 6. Build: shading, detail, interaction, dissipation
- [ ] 7. Review loop until every review question passes
```

### 1. Brief and audit

Write down: what event this is (hit, explosion, cast, buff), how important it is (a light attack, a heavy hit, an ultimate), the style, the engine, and the gameplay camera (distance, FOV, typical framing). In an existing project, also record the tone mapper, bloom settings, exposure and units, and render two existing effects for comparison; every brightness value depends on them (`references/brightness.md`).

Work out how big things are on screen before designing: pixels per metre at the target is `screenHeight / (2 * distance * tan(fov / 2))`. A 1.8 m character 10 m away with a 40 degree FOV is about 270 px tall at 1080p, so a 2 cm spark is 3 px. Design to the gameplay camera's pixel sizes.

### 2. Reference breakdown

Pick two shipped effects in this genre that do the same job (name the game and the move) and describe each from memory at four moments: contact, +2 frames, +6 frames and the end. For each moment write the primary shape, its size relative to the character, the value structure (what is lightest, what is darkest), the colours and what is moving. If the user gave references, use theirs. This is your target; the style file for the genre lists its conventions and typical references (`references/styles/<style>.md`).

### 3. Design plan

Write the plan as a short block:

- **Primary shape:** the one silhouette that carries the event, drawn as you would see it from the gameplay camera at its peak frame (a few lines of ASCII or a one-sentence geometric description: "a crescent 2.2 m across, thick at the leading edge, tapering to a point, tilted 30 degrees toward the camera, passing through the target's chest"). Say how it faces the camera.
- **Value bands:** 2 - 4 bands from lightest to darkest with hex colours, for example core `#ffffff`, mid `#36d6ff`, rim `#0b4f8c`. The effect must read in grayscale with bloom off; the darkest band is what separates it from bright backgrounds.
- **Timing table:** each layer's start, peak and end in frames at 60 fps relative to contact, using the style file's defaults as the starting point.
- **Layers**, each with one job:
  - primary (the silhouette);
  - secondary (support that shows direction and force: sparks, streaks, shards, rings);
  - interaction (light on the target, hit reaction, ground dust, decal, camera shake);
  - residue (what remains and how it leaves: smoke, embers, marks).
- **Sizes at the gameplay camera:** the primary shape's height in pixels and the narrowest element's width in pixels (minimums below).

### 4. Check the plan against the defaults

Go through the eight defaults above against your plan. Where the plan matches one by habit rather than choice, change it and note what changed. Ask also: what would the effect look like in a single frame, in grayscale, at the gameplay camera, with bloom off? If the answer is "a soft bright blob", the plan is not done.

### 5. Blockout

Build the primary shape and the timing with flat, unlit colours, bloom off, seen from the gameplay camera. Render a frame strip (step 7) and check the silhouette, direction and timing before any shading. Most of the quality is decided here.

### 6. Build

Then add, in order: shading in the value bands, the secondary layers, interaction, residue and dissipation, and finally bloom, distortion and light as accents. `references/shapes.md` has construction recipes for the common shapes (slash crescents, star flashes, explosions, smoke, sparks, debris, shockwaves, impact frames, decals, hit reactions); `references/physics.md` has motion; the engine file has the implementation details (`references/engines/unity.md`, `unreal.md`, `threejs.md`).

### 7. Review loop

Render frame strips at fixed times relative to contact: -2, 0, +2, +4, +8, +15 and +30 frames, then 50%, 75% and 95% of the duration. Render them from the gameplay camera and from a close camera, and once more from the gameplay camera with bloom off. For a page with the `window.fx` API, `python scripts/capture_strip.py <folder> <out>` renders them; elsewhere use the engine's frame capture (engine files). Look at every strip and answer each question in writing, with the frame you checked:

1. At its peak, does the primary shape read as one clear silhouette from the gameplay camera, with bloom off?
2. Is the peak within 1 - 3 frames of contact (or the style's drawing equivalent), and does the effect then hold and dissipate rather than vanish?
3. Is every element at least the minimum width below at the gameplay camera?
4. Is the target still readable at every frame (no blow-out to white, no repaint), and does it react?
5. Does the ground or surroundings react where they would (dust, light, mark)?
6. Does the residue stay attached to where it came from and leave unevenly, from the edges inward?
7. Does the palette match the style file and separate the effect from the background in value?
8. Does it hold up next to the reference breakdown from step 2 at the same four moments? Name the biggest remaining difference.

Fix the biggest failure, render again, and repeat until all eight pass. Then compare the final strip with the reference breakdown once more and write down what you would improve next.

## Minimums at the gameplay camera

These are defaults for a 1080p frame; scale with the resolution.

| | Minimum |
|---|---|
| Primary shape, light hit | 40 px |
| Primary shape, heavy hit or cast | 80 px |
| Primary shape, explosion or ultimate | 200 px |
| Line, ring, spike or streak width | 3 px (5 px for the primary shape's outline) |
| Spark length | 12 px, at least 3x its width |
| Contact flash on screen | 1 - 3 frames, never more than about a quarter of the frame's area |
| Full-screen effect (impact frame, flash) | 1 - 2 frames, on the heaviest hits only |

Clamp minimum widths in the shader in pixels (world units per pixel at the particle's depth times the pixel minimum), so they survive distance without growing in the close-up.

## Style files

Read the one for the requested style before step 2. Each gives the genre's palette and value structure, timing defaults, signature shapes, typical references and the style's own failure modes.

| Style | File |
|---|---|
| Realistic (AAA shooters, military, cinematic) | `references/styles/realism.md` |
| Stylized MOBA and hero shooters (hand-painted) | `references/styles/stylized.md` |
| Anime and anime action games | `references/styles/anime.md` |
| Toon and cartoon | `references/styles/toon.md` |
| Dark fantasy (ARPG, soulslike) | `references/styles/dark-fantasy.md` |
| Pixel art | `references/styles/pixel.md` |

A style the user names that is not listed: write its conventions in the same shape (palette, values, timing, shapes, references) from what you know of its games, and follow the same process.

## Reference files

- `references/shapes.md`: how to build each common element so it reads, with the parameters that matter.
- `references/brightness.md`: brightness relative to the bloom threshold, per engine, and why bright colours turn white.
- `references/physics.md`: motion, drag, gravity, smoke, fire, explosions, sparks, debris, liquids.
- `references/engines/threejs.md`, `references/engines/unity.md`, `references/engines/unreal.md`: systems, materials, post, frame capture and performance per engine.
