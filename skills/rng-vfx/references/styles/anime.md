# Anime (sakuga, cel-shaded 3D)

Reference points: hand-drawn TV and film effects animation (the "sakuga" tradition), 2D fighting games, and cel-shaded 3D fighters that imitate 2D (Arc System Works' Guilty Gear Xrd / Strive and Dragon Ball FighterZ are the reference for anime look in real-time 3D).

## What defines it

- **Drawn on twos or threes.** Effects change drawing every 2 or 3 frames (12 or 8 per second). Quantize effect time. Smooth 60 fps motion instantly reads as "3D game", not anime.
- **Hard edges, flat fills.** Two or three tone bands, no gradients inside a shape except a deliberate glow layer. Edges are crisp; anti-aliasing is fine, softness is not.
- **Designed shapes per drawing.** Each held drawing is a composed silhouette: asymmetric spikes, curls, teardrop flame tongues. Randomness is art-directed, not uniform noise.
- **Extreme timing contrast.** The peak drawing arrives instantly and is held; then the effect breaks up fast. Big shapes appear at full size on frame 1 and shrink or shatter rather than grow slowly.
- **Impact frames.** The biggest hits get 1 to 3 frames of inverted or two-tone (black and white, black and red) image.
- **Lines.** Speed lines, radial impact lines and outline strokes are part of the effect vocabulary.
- **Smoke is solid.** Cel smoke is opaque, banded, outlined, and dies by holes opening inside it, then the pieces shrink.

## Color and value

- Core: pure white. Mid: one saturated hue (cyan, yellow, magenta, orange). Shadow band: a darker, often hue-shifted version (blue shadows on white smoke, red shadows on orange fire).
- Outlines and shadow bands are dark but tinted, never pure black, except in impact frames.
- Limited bloom. A thin glow around the core is fine; a big haze kills the flat look. Keep bloom threshold above the mid tones.

## Signature techniques

- **Stepped time:** `t = floor(t * 12) / 12` on the effect clock (shader time, particle time, curve time).
- **Step-shaded puffs:** sphere-ish normal from the quad UV, `floor(dot(N, L) * bands) / bands`, two colors from a ramp, outline where the noise-distorted silhouette is thin.
- **Hole erosion:** a second noise compared against a threshold that rises late in life; discard where noise is below it, draw an outline color just above it.
- **Spiky flash:** polar coordinates; radius = core + spike length x `pow(abs(cos(angle * n / 2)), sharpness)`, with per-spike length jitter. Rotate between drawings, not continuously.
- **Radial speed lines:** very fast, short-lived stretched particles from the impact point, or a full-screen radial lines texture masked by a noise.
- **Impact frame pass:** a post-process that maps luminance to two values (threshold around 0.3 - 0.4) and inverts, active for 1 to 3 frames.
- **Hand-drawn flipbooks:** for flame and explosion shapes the best results come from drawn frames (8 to 16 frames) rather than simulation. Generate them with an image model in a consistent style and play them stepped.
- **Normals for cel-shaded meshes:** if the effect includes meshes (shockwave domes, energy shells), edit or replace normals so the light band falls in a clean designed shape; noise in the normals turns into noise in the bands.

## Default numbers

- Impact: anticipation 0 - 6 frames of inward lines; contact flash 2 drawings held; ring 3 - 4 drawings expanding fast; puffs 5 - 8 drawings; total under 1 s.
- Explosion: 2 drawings of bright compressed core, impact frame 2 drawings, fireball 6 - 10 drawings, black smoke 10 - 16 drawings rising, all on twos.
- Bands: 2 for smoke, 3 for fire. Outline width about 5 - 8% of the puff radius.

## Common mistakes

- Smooth interpolated motion at full frame rate.
- Soft alpha fades instead of shrink, holes or snap-off.
- Gradient-heavy textures or volumetric smoke.
- Heavy bloom haze.
- Uniform random particle size; anime bursts have a few big designed shapes and many tiny accents.

## Stand

`stand/` > Anime. Uses 12 drawings per second, an impact frame pass, step-shaded hole-eroding puffs, a hard spiky flash and hard rings.
