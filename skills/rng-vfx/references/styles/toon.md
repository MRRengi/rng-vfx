# Toon (cartoon)

Reference points: Western cartoon animation, cel-shaded adventure games (The Legend of Zelda: The Wind Waker), rhythm action games like Hi-Fi Rush, Nintendo-style party games.

## What defines it

- **Round, friendly shapes.** Puffs are circles and clusters of circles, stars have rounded points, splashes are blobs.
- **Squash and stretch, overshoot.** Shapes pop past their final size and settle (outBack, elastic). Fast things stretch along their motion.
- **Full frame rate,** usually 60 fps smooth motion; snappy because of easing, not frame holds. Holds can still be used for comic timing (a freeze before a pop).
- **Thick outlines, two tones.** One light tone and one shadow tone, a confident dark outline (often a dark tint of the fill, not black).
- **Dissipation by shrinking.** Puffs scale down to nothing, stars twinkle out. Rarely erosion, almost never alpha fades.
- **Symbols.** Stars, sparkles, swirls, sweat drops, "pow" shapes are allowed and expected.

## Color and value

- Bright saturated primaries and candy colors. Shadows are hue-shifted (lavender or blue shadows on white, red-pink shadows on yellow-orange).
- High value overall; readability comes from outlines and shape rather than darkness.
- Bloom: very little. A soft halo around a flash at most.

## Signature techniques

- **Two-tone puff:** circle silhouette with slight noise wobble, one shading band, outline. Size curve: pop up to full with outBack in 3 - 6 frames, hold, shrink with ease in. A size curve that only goes from big to small (born at full size) has no pop: add an explicit size-in phase (the stand's burst takes `sizeIn`, the fraction of life spent popping in).
- **Cluster puffs:** spawn 2 - 3 clusters of 3 - 5 puffs (tight spawn radius, low speed variance inside a cluster) so a cloud reads as a bunch of grapes, not balloons drifting apart. Draw one thick outline around each cluster's union, not one per puff.
- **Curl tips:** the comic smoke swoosh is a spiral, a polar mask `r < f(angle + twist * r)`, at the ends of puff trails.
- **Star burst:** 4 - 6 pointed star, low sharpness for rounded tips, overshoot scale, then vanish in one frame or shrink.
- **Rings and ground shocks:** an outlined ring (dark inner band, light outer band, alpha-blended) that starts 2 - 3 frames after the star, covers about 60% of the circle and stays within 1.2x the star; on the ground use a skirt of small puffs running outward, never a flat additive white hoop.
- **Sparkle:** four-point star particle, scale and rotation pulse, twinkle out.
- **Rim and toon ramp on meshes:** a 1D ramp texture with 2 - 3 hard steps for lighting, a fresnel rim for magic.

## Default numbers

- Impact: star 6 - 12 frames with overshoot, ring 15 - 20 frames, puffs 30 - 40 frames shrink out, sparkles 25 - 40 frames.
- Explosion: white disc pop 5 frames, fire puffs 30 - 50 frames, lavender smoke puffs drifting up 50 - 70 frames, stars falling with gravity.
- Outline width 7 - 10% of puff radius.

## Common mistakes

- Sharp aggressive spikes (that is anime or stylized combat).
- Realistic smoke or volumetrics.
- Fading instead of shrinking.
- Linear motion: toon needs strong easing on everything.
- Anything held still: every shape keeps squashing, bobbing or shrinking; a held toon puff reads as a sticker.
- Two-colour rings with an outline colour: toon rings are one flat colour.
- A target that only slides: toon targets squash, stretch and settle.
