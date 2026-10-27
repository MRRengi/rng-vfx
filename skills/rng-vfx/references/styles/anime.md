# Anime

Anime action games and TV sakuga: Genshin Impact, Honkai: Star Rail, Zenless Zone Zero, Wuthering Waves, Guilty Gear Strive, Dragon Ball FighterZ, Naruto Storm, and the effects animation of studios like Trigger and ufotable. Saturated, luminous energy with crisp edges, dramatic contrast in timing, and impact frames on the heaviest hits.

**References to recall:** Genshin Impact (Ayaka's and Chongyun's cryo bursts, Keqing's electro slashes, a charged-attack impact), Zenless Zone Zero (heavy hit impacts), Guilty Gear Strive (counter-hit impact frames), Dragon Ball FighterZ (ki blasts, impact frames). Describe the matching one at contact, +2, +6 frames and the end before building.

## Look

- Energy is luminous and saturated: a white-hot core, a saturated body with a crisp outer edge, and a soft glow halo around it. Cores bloom; the body keeps its colour instead of going white.
- Crisp, not cartoon: edges are sharp and shapes are clean (spheres of energy, crescents, rings, beams, tapered streaks), but there are no black outlines, no straight-edged star polygons and no outlined cartoon clouds; those are toon.
- Light is part of the effect: the target, the ground and nearby surfaces are lit in the effect's colour, and a ground ring or glow pool anchors it.
- Saturated colour: cyan means cyan (`#00d8ff`), not baby blue. Example cyan energy: core `#ffffff`, body `#16e0ff`, falloff `#0a7ed6`, deep `#08306e`, accent sparkle `#fff27a`. Example fire: core `#fffbe0`, body `#ffb020`, falloff `#ff5a10`, deep `#a8180c`.
- Rhythm: the big shapes can change on twos (held drawings) for a drawn feel; sparks, sparkles and speed streaks run every frame.
- Residue is energy too: the burst breaks into glowing fragments, motes and sparkles that drift and twinkle out, not into grey cartoon smoke.

## Timing defaults (60 fps)

| Layer | Start | Peak | End |
|---|---|---|---|
| Anticipation / charge | -12 to -4 | | 0 |
| Projectile travel | | | stops at 0, on the target |
| Impact frame (heavy hits), full screen, alternating tones | 0 | | 2 - 4 frames |
| Contact burst (energy sphere, glow) | 0 - 2 | 2 - 4 | 20 - 30 |
| Speed streaks | 0 | | 6 - 10 |
| Rings / shock | 2 | 8 - 12 | 16 - 24 |
| Hang: big shape holds | 4 | | 12 - 20 |
| Break-up into glowing fragments | 12 | | 40 - 60 |
| Sparkles / motes | 2 | | 30 - 60 |

The contrast is the point: a very fast hit, a held strong shape, then a slower break-up.

## Signature shapes

- Contact burst: a sphere of energy 1.5 - 2x the target's height that swallows the target, with a crisp, slightly irregular edge, spikes of light breaking out of it and bright crossing arcs and rings around it. It is the biggest thing on screen during the hang.
- Impact frame: full-screen two-tone silhouette with thick radial speed lines, 2 - 4 frames with alternating tones (`shapes.md` > Impact frames).
- Rings and arcs with real thickness, tilted in 3D around the target.
- Speed streaks that taper, with thickness.
- Sparkles: 4-point glints that pop and twinkle.

## Failure modes in this style

- Flat, outlined cartoon stars and clouds: reads as toon or a comic, not anime action.
- Soft, shapeless bloom domes with no crisp edge.
- Pastel or washed colour instead of saturated energy.
- A timid impact frame (a small patch, one frame) or one with shapeless blobs.
- A burst smaller than the target: the hit has no weight.
- Hairline rings and speed lines that vanish at the gameplay camera.
- The burst collapsing within a quarter second: no hang, no designed break-up.
- Projectiles that pass through the target instead of stopping on it.
