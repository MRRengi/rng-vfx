# Anime (sakuga, cel-shaded 3D)

Reference points: hand-drawn TV and film effects animation (the "sakuga" tradition), 2D fighting games, and cel-shaded 3D fighters that imitate 2D (Arc System Works' Guilty Gear Xrd / Strive and Dragon Ball FighterZ are the reference for anime look in real-time 3D).

## What defines it

- **Drawn on twos or threes.** Effects change drawing every 2 or 3 frames (12 or 8 per second). Quantize effect time. Smooth 60 fps motion instantly reads as "3D game", not anime.
- **Hard edges, flat fills.** Two or three tone bands, no gradients inside a shape except a deliberate glow layer. Edges are crisp; anti-aliasing is fine, softness is not.
- **Designed shapes per drawing.** Each held drawing is a composed silhouette: asymmetric spikes, curls, teardrop flame tongues. Randomness is art-directed, not uniform noise.
- **Extreme timing contrast.** The peak drawing arrives instantly and is held; then the effect breaks up fast. Contact sparks and impact shapes appear at full size on their first drawing and shrink or shatter rather than grow slowly. Explosions are the exception: one drawing of compressed core, then the full fireball on the next drawing (`recipes/explosion.md` > Growth), never a slow grow.
- **Impact frames.** The biggest hits get one drawing of inverted or two-tone (black and white, black and red) image.
- **Lines.** Speed lines, radial impact lines and outline strokes are part of the effect vocabulary.
- **Smoke is solid.** Cel smoke is opaque, banded, outlined, and dies by holes opening inside it, then the pieces shrink.

## Color and value

- Core: pure white. Mid: one saturated hue (cyan, yellow, magenta, orange). Shadow band: a darker, often hue-shifted version (blue shadows on white smoke, red shadows on orange fire).
- Outlines and shadow bands are dark but tinted, never pure black, except in impact frames.
- Limited bloom. A thin glow around the core is fine; a big haze kills the flat look. Keep bloom threshold above the mid tones.

## Signature techniques

- **Stepped time:** `t = floor(t * 12) / 12` on the effect clock (shader time, particle time, curve time). Every key goes on the grid (multiples of 1/12 s): contact at 2/12, impact frame from 2/12 to 3/12, the coloured hit spark peaking from 3/12 for 2 drawings. Off-grid keys silently drop drawings.
- **Step-shaded puffs:** sphere-ish normal from the quad UV, `floor(dot(N, L) * bands) / bands`, two colors from a ramp, outline where the noise-distorted silhouette is thin.
- **Hole erosion:** a second noise compared against a threshold that rises late in life; discard where noise is below it, draw an outline color just above it.
- **Spiky flash:** polar coordinates with pointed spikes from a triangle wave, `tri = 1 - abs(fract(angle / 2pi * n + 0.5) - 0.5) * 2`, radius = core + spikeLength x `pow(tri, sharpness)`. Use 4 - 6 spikes, sharpness 2 - 3 (concave wedges; 12+ gives hairlines, a cosine gives rounded petals), core 0.15 - 0.3, length jitter so spikes range about 0.4x to 1.6x. Elongate the whole spark along the hit direction (aspect 1.3 - 1.6). Rotate or redraw between drawings, never continuously. No closed ring around the spark: if a ring is used it is a broken arc (40 - 60% of the circle), at most 1.2x the spark, one drawing later, for 2 drawings. Redraw the spark each drawing (new spike lengths, count and angle) rather than rotating one shape: a held star that only turns reads as clip art.
- **Radial speed lines:** very fast, short-lived stretched particles from the impact point, or a full-screen radial lines texture masked by a noise.
- **Impact frame:** 1 drawing at contact. The character is forced to one value (black) by its own mask, not by luminance: a luminance threshold turns a mid-gray character white and erases it. Background goes flat (white, or red for the strongest hits), bright effect shapes go black with a crisp edge, optional radial speed lines over it. Turn bloom off for these drawings. The coloured spark peaks on the drawing after the impact frame, so the frame never hides it. A cheap way to get the mask: push the character's emissive to full white for the impact drawings, then the two-tone pass inks it with the effect.
- **One outline per cluster:** puffs drawn as separate outlined circles read as a bag of oranges. Render the cel puffs into their own target and draw the outline around the union (edge detect on alpha), or use a flipbook drawn as one mass. Shade from the cluster centre (normal = sphere normal + direction from the effect centre), not per puff.
- **Smears:** a 1 - 2 drawing smeared shape (stretched along motion, single colour) between the anticipation and the contact sells speed better than motion blur.
- **Hand-drawn flipbooks:** for flame and explosion shapes the best results come from drawn frames (8 to 16 frames) rather than simulation. Make them from 4 - 6 drawn keyframes plus a life map (`recipes/flipbooks.md`) and play them stepped.
- **Normals for cel-shaded meshes:** if the effect includes meshes (shockwave domes, energy shells), edit or replace normals so the light band falls in a clean designed shape; noise in the normals turns into noise in the bands.

## Default numbers

- Timings, sizes and brightness: `numbers.md` > Anime.
- Bands: 2 for smoke, 3 for fire. Outline width about 5 - 8% of the puff radius.
- Spark: 4 - 5 blades, one dominant blade along the hit, blades unequal, redrawn every drawing.

## Common mistakes

- Smooth interpolated motion at full frame rate.
- Soft alpha fades instead of shrink, holes or snap-off.
- Gradient-heavy textures or volumetric smoke.
- Heavy bloom haze.
- Uniform random particle size; anime bursts have a few big designed shapes and many tiny accents.
- An impact frame that loses the shapes: the effect and the character must be inked by their own masks (draw the effect alone into a mask target), never found by a luminance threshold. Flat paper fills the rest of the screen for that one drawing; more than one drawing reads as a white-out.
- Ramps sampled by age alone: in sakuga the colour bands follow the radius of the shape (white core, colour band, dark edge) as well as time.
- Symmetric protrusions (ears on a puff cluster, a star with even spikes): bias spikes along the hit, jitter their angles, vary their lengths.

## Stand

`stand/` > Anime. Uses 12 drawings per second, an impact frame pass, step-shaded hole-eroding puffs, a hard spiky flash and hard rings.
