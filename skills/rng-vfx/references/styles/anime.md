# Anime

Anime action games and TV sakuga: Genshin Impact, Honkai: Star Rail, Zenless Zone Zero, Wuthering Waves, Guilty Gear Strive, Dragon Ball FighterZ, Naruto Storm, and the effects animation of studios like Trigger and ufotable. Big, saturated, luminous energy with crisp edges, dramatic contrast in timing, and impact frames on the heaviest hits.

**References to recall:** Genshin Impact (Ayaka's and Chongyun's cryo bursts, Keqing's electro slashes, a charged-attack impact), Zenless Zone Zero (heavy hit impacts), Guilty Gear Strive (counter-hit impact frames), Dragon Ball FighterZ (ki blasts, impact frames). Describe the matching one at contact, +2, +6 frames and the end before building.

## Look

- Energy is luminous and saturated: a white-hot core, a saturated body with a crisp outer edge, and a soft glow halo around it. Cores bloom; the body keeps its colour instead of going white.
- Dramatic contrast: heavy hits are large and loud for a moment, with rings, arcs and radial streaks around a burst whose shape still reads and through which the target is still visible.
- Crisp, not cartoon: sharp edges and clean shapes (energy spheres, crescents, rings, beams, tapered streaks), without black outlines, star polygons or outlined clouds (those are toon).
- Light is part of the effect: the target flares and is lit in the effect's colour, a glow pool and ring anchor it on the ground.
- Saturated colour: cyan means cyan (`#00d8ff`), not baby blue. Example cyan energy: core `#ffffff`, body `#16e0ff`, falloff `#0a7ed6`, deep `#08306e`, accent sparkle `#fff27a`. Example fire: core `#fffbe0`, body `#ffb020`, falloff `#ff5a10`, deep `#a8180c`.
- 3D anime games animate effects smoothly, at the game's frame rate; the drawn feel comes from crisp shapes and timing, not from stepped animation (`../motion.md` > Stepped animation).
- Residue is energy too: the burst breaks into glowing fragments, motes and sparkles that drift and twinkle out, not grey smoke.

## Timing defaults (60 fps, typical)

| Layer | Start | Peak | End |
|---|---|---|---|
| Anticipation / charge | -12 to -4 | | 0 |
| Projectile travel | | | stops at 0, on the target |
| Impact frame (heaviest hits) | 0 | | 1 - 4 frames |
| Contact burst | 0 - 2 | 2 - 4 | 20 - 40 |
| Speed streaks | 0 | | 6 - 12 |
| Rings / shock | 2 | 8 - 12 | 16 - 30 |
| Hang: the big shape holds | 4 | | 12 - 24 |
| Break-up into glowing fragments | 12 | | 40 - 60 |
| Sparkles / motes | 2 | | 30 - 60 |

The contrast is the point: a very fast hit, a held strong shape, then a slower break-up.

## Signature shapes

- Contact burst: energy with a crisp, slightly irregular edge, spikes of light breaking out, crossing arcs and rings around it.
- Impact frame on the heaviest hits: a brief full-screen two-tone silhouette with radial speed lines (`../elements.md` > Impact frames).
- Rings and arcs with real thickness, tilted in 3D around the target.
- Speed streaks that taper, with thickness.
- Sparkles: 4-point glints that pop and twinkle.

## Failure modes in this style

- A burst so large and bright that it becomes a shapeless blob hiding the target, or so small and brief that the hit has no weight.
- Flat outlined cartoon stars and clouds: reads as toon, not anime action.
- Soft shapeless bloom domes with no crisp edge; pastel colour.
- Stepped or redrawn-every-few-frames shapes in a 3D scene: reads as jitter.
- The burst collapsing within a quarter second: no hang, no designed break-up.
- Projectiles that pass through the target instead of stopping on it.
