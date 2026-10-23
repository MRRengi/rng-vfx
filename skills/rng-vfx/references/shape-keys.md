# Shape keys

Design the silhouette before touching parameters. A shape key is a flat, single-value drawing of the effect's mask at one moment, seen from the gameplay camera. Draw three for every effect:

- **Contact:** the frame the hit lands, or the flash of an explosion.
- **Peak:** contact + 2 to 3 frames (+1 drawing on twos). The biggest, clearest shape.
- **Break-up:** contact + 8 frames (+4 drawings). Energy has left, residue is forming.

## How to draw them

- **Format:** SVG or a 512 px PNG per key, black shape on white, the target drawn as a grey silhouette for scale and the hit direction as an arrow.
- **Tools:** an SVG written by hand (paths and circles are enough), a quick image-model sketch converted to a mask, or a frame from a reference clip traced to a mask.
- **What they must show:**
  - The proportions: the primary shape against the target, at the sizes from `numbers.md`.
  - The direction: everything leans along the hit vector.
  - The rhythm of big, medium and small shapes.
  - The negative space: gaps, holes, broken rings.
- **Line of action:** draw one curve through the whole effect over time, from anticipation through contact to the residue drifting away. Every key's main mass sits on it. An effect without one reads as scattered parts.

After the blockout (SKILL.md step 7), the rendered effect mask at each key should overlap its drawing by about 60% or more (intersection over union). Below that, change the blockout, not the drawing, unless the drawing was wrong.

### Keys as data (checked by `tools/vfxcheck.py`)

Write the three keys as a small JSON file, so the overlap is measured instead of eyeballed. Units are target heights (H); for an impact the origin is the hit point with +x along the hit direction on screen, for an explosion the origin is the blast's ground point; +y is up; `t` is seconds after contact:

```json
{
  "contact": {"t": 0.0,   "shapes": [{"star": [0.05, 0, 0.32, 0.1, 5, 0]}, {"ellipse": [0.12, 0, 0.32, 0.08]}]},
  "peak":    {"t": 0.083, "shapes": [{"ellipse": [0, 0.85, 0.65, 0.85]}]},
  "breakup": {"t": 0.333, "shapes": [{"circle": [0.3, 0.05, 0.15]}, {"poly": [[0, 0], [0.8, 0.2], [0.6, -0.4]]}]}
}
```

Shapes: `circle [x, y, r]`, `ellipse [x, y, rx, ry]`, `poly [[x, y], ...]`, `star [x, y, rOuter, rInner, points, rotationDeg]`. vfxcheck compares the effect's silhouette (gaps between sparks closed, holes filled) with each key at its best frame within ±50% of the key's time (timing itself is judged by `time-to-peak`), fails under 0.3 and aims for 0.6, and saves `keys.png`, the frames with each key outlined, for the review. An inked impact frame at contact counts as the designed contact shape and is skipped. The stand's keys are in `stand/keys/`.

Make the keys physically possible: sparks at 10 - 15 m/s cover about 0.35 H in 3 frames, so a peak key that already shows the full 1 H spray is wrong, not the effect.

## Reference silhouettes per style

Use these when the user gives no references. Sizes are fractions of the target's height (H, about 1.8 m); "hit" is the hit direction.

### Anime impact (12 drawings per second)
- **Contact (drawing 1):** a 4 - 5 blade star, 0.6 H across, one dominant blade along the hit at 1.5x the others, a white core 0.15 H. The impact frame inks this shape on paper for one drawing.
- **Peak (drawing 2):** the star redrawn at 1.08x with new blade lengths. A broken ring (55% coverage) at 0.9x the star, offset 0.1 H along the hit. 3 - 5 speed streaks along the hit, each 0.4 H long.
- **Break-up (drawing 4):** the star gone. 2 - 3 cel puffs at 0.25 - 0.35 H, clustered 0.3 H off the target on the hit side with one shared outline. A few falling sparks.

### Anime explosion
- **Contact:** a compressed core 0.3 H, white with a yellow edge.
- **Peak (+1 drawing):** the drawn fireball 1.6 - 1.9 H tall, taller than wide, sitting on the ground, with 3 - 5 flame tongues breaking the silhouette upward.
- **Break-up (+4 drawings):** the fireball torn into 3 - 4 chunks with gaps; dark smoke (2 bands, outline) at 1.2x the fireball's area taking over the top; the stem still touching the ground.

### Toon impact
- **Contact:** a 5 - 6 point star with slightly convex tips and a thick outline, 0.45 H across.
- **Peak (+3 frames):** the star at 1.12x (overshoot); 1 - 3 drawn puffs popping in on the hit side, 0.3 H each.
- **Break-up (+8 frames):** the star gone; puffs at full size with holes appearing; 2 - 4 sparkles falling.

### Toon explosion
- **Contact:** a white puff pop 0.4 H.
- **Peak (+3 frames):** a cluster of 5 - 7 fire puffs, 1.3 - 1.5 H tall, round but squashed and stretched, on a 3-puff stem.
- **Break-up (+12 frames):** fire puffs shrinking; lavender smoke puffs (2 tones, outline) rising from inside the fire's footprint; a dust skirt of small puffs at ground level.

### Stylized impact
- **Contact:** the slash band crossing the target diagonally, 1.4 H chord, widest 0.2 H behind the head.
- **Peak (+2 frames):** a 4-spike flash 0.45 H at the crossing point, long spikes along the hit; the slash tail starting to eat the band.
- **Break-up (+8 frames):** the slash gone except burning flecks; a spray of 20 - 30 sparks arcing down along the hit, spread 1 H; a small broken ring 0.5 H.

### Stylized explosion
- **Contact:** a flash 0.6 H.
- **Peak (+4 frames):** painted fire 1.6 H tall in 3 flat heat bands, the hottest band one connected shape, on a stem.
- **Break-up (+12 frames):** fire eroding into islands; painted smoke 1.3x the fire's area rising from inside it; embers.

### Dark fantasy impact
- **Contact:** a dark torn crescent with a hot rim crossing the target, 1.3 H chord; a tiny additive core.
- **Peak (+3 frames):** two thin claw strands riding the arc; blood teardrops spraying along the hit, 0.6 H.
- **Break-up (+8 frames):** the crescent burning off from the tail; blood landing as splats; embers rising.

### Dark fantasy explosion
- **Contact:** cracks glowing in the ground, 1.2 H radius.
- **Peak (+4 frames):** 3 - 4 big dark-red fire tongues 1.8 H tall from the cracks, black edges.
- **Break-up (+15 frames):** black smoke (value floor 0.12, rim lit from below) at 1.4x the fire's area, still touching the ground; cracks cooling unevenly.

### Pixel impact (10 drawings per second)
- **Contact:** a 4-point star or plus, 0.4 H, the target flashed white.
- **Peak (+1 drawing):** a broken ring 0.5 H; 6 - 10 square pixels flying along the hit.
- **Break-up (+3 drawings):** a 2-tone puff cluster 0.3 H on the hit side, dithering out.

### Pixel explosion
- **Contact:** a white disc 0.4 H.
- **Peak (+1 drawing):** a fire cluster 1.2 H, taller than wide, on the ground.
- **Break-up (+4 drawings):** 2-tone smoke cluster 1.3x the fire's area; debris squares bouncing.

### Realism impact
- **Contact:** an anisotropic flare along the hit, 0.3 H long, for 2 frames.
- **Peak (+3 frames):** a fan of 40 - 70 sparks of very unequal length spraying along the reflected hit direction, 1 H spread; a dust jet.
- **Break-up (+8 frames):** sparks arcing down and bouncing; the dust expanding and thinning; chips falling.

### Realism explosion
- **Contact:** a flash smaller than the coming fireball (0.8 H), an exposure dip.
- **Peak (+5 frames):** a fireball 1.8 - 2.2 H tall, rolling lobes, hot core, on the ground.
- **Break-up (+20 frames):** dark smoke wrapping the fire from inside, 1.3x its area, lit orange from below; a dust skirt; debris arcs.
