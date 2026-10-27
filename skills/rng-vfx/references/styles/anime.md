# Anime

Anime action games and TV sakuga: Genshin Impact, Honkai: Star Rail, Zenless Zone Zero, Guilty Gear Strive, Dragon Ball FighterZ, Naruto Storm, and the effects animation of studios like Trigger and ufotable. Effects are drawn: graphic shapes, hard cel shading, held drawings and big contrast in timing.

**References to recall:** Genshin Impact (Ayaka's and Chongyun's cryo bursts, Keqing's electro slashes, a charged-attack impact), Zenless Zone Zero (heavy hit impacts), Guilty Gear Strive (counter-hit impact frames), Dragon Ball FighterZ (ki blasts, impact frames). Describe the matching one at contact, +2, +6 frames and the end before building.

## Look

- Hard-edged shapes in 2 - 3 cel bands: a white core, a saturated main colour, a deep shade colour, often a thin dark outline. No soft gradients inside shapes.
- Saturated colour: cyan means cyan (`#00d8ff`), not baby blue. Example cyan energy: core `#ffffff`, main `#16e0ff`, shade `#0a7ed6`, deep `#08306e`, accent sparkle `#fff27a`. Example fire: core `#fffbe0`, main `#ffb020`, shade `#ff5a10`, deep `#a8180c`.
- Glow is a drawn shape (a soft-edged colour band around the core) plus a little bloom on the core only.
- Shapes are designed and dramatic: spiky stars that break the circle, petal bursts, sharp crescents, chunky smoke curls with outlines, speed lines.
- Held drawings: shapes change on twos or threes (every 2 - 3 frames at 60 fps, i.e. 12 - 24 drawings per second), not smoothly every frame. Fast secondary motion (speed lines, sparks) can run every frame.

## Timing defaults (60 fps; drawings on twos)

| Layer | Start | Peak | End |
|---|---|---|---|
| Anticipation / charge | -12 to -4 | | 0 |
| Projectile travel | | | stops at 0, on the target |
| Impact frame (heaviest hits only) | 0 | | 1 - 2 frames |
| Contact star / burst | 0 - 2 | 2 - 4 (biggest drawing) | 10 - 16 |
| Speed lines | 0 | | 6 - 10 |
| Rings / shock | 2 | 8 - 12 | 16 - 20 |
| Hang: big shape holds | 4 | | 12 - 20 |
| Smoke curls break up | 8 | | 40 - 60 |
| Sparkles / shards | 2 | | 30 - 50 |

The contrast is the point: a very fast hit, a held strong pose of the shape, then a slower break-up.

## Signature shapes

- Contact burst: a spiky star or petal shape that breaks out of the circle, redrawn each drawing with new spike lengths.
- Impact frame: two-tone silhouette with radial speed lines (`shapes.md` > Impact frames).
- Cel smoke: chunky outlined curls in 2 - 3 tones, breaking into pieces with large holes, on held drawings.
- Speed lines and streaks with real thickness that taper.
- Sparkles: 4-point stars that pop and twinkle.

## Failure modes in this style

- Soft bloomy blobs and domes: anime glow is drawn, not bloomed.
- Pastel or washed colour instead of saturated cel bands.
- Impact frames that run 3 frames or more, cover the whole screen with shapeless blobs, or repeat.
- Hairline rings and speed lines that vanish at the gameplay camera.
- Smooth, continuous animation of everything: no held drawings, so it looks like generic particles.
- The burst collapsing within a quarter second: no hang, no designed break-up.
- Projectiles that pass through the target instead of stopping on it.
