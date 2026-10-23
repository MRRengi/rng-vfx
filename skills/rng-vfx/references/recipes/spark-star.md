# Contact spark and star

The contact spark is the single most-read shape of a hit. A symmetric star held for several frames reads as a sticker, a flower or a reticle.

## Construction

- **SDF.** In polar coordinates around the centre:
  - `r_edge(a) = core + len_i * pow(tri(a * n / 2pi + phase_i), sharp)`, where `tri(x) = 1 - abs(fract(x + 0.5) - 0.5) * 2`.
  - The shape is inside where `r < r_edge`.
  - A triangle wave gives straight-edged points at `sharp = 1` and concave needles at 2 - 4.
  - `pow(abs(cos))` gives rounded petals: a flower, not a spark.
- **Points:**
  - 4 - 6 points, never evenly spaced: jitter each point's angle by up to ±25% of the spacing.
  - Lengths unequal: ±30% per point, with one dominant point 1.5 - 2x the others along the hit direction.
  - The dominant direction sits at least 45 degrees off the camera axis.
- **Fit the quad:** grow the quad to the longest point times the largest scale key, plus 4%. A point cut by the quad edge is a straight-edged stump.
- **Core:**
  - Radius 0.25 - 0.4 of the longest point.
  - Only the core goes above B, and only for the frames in `numbers.md`.
  - The points are body brightness or a flat colour.
- **Value:** the spark must differ from the target behind it by at least 0.3 in grayscale. If the target is light, add a dark rim, a dark under-shape, or darken the target for those frames. A white spark on a white-flashed target disappears.

## Per style

| Style | Points | Edges | Outline | Fill |
|---|---|---|---|---|
| Anime | 4 - 5, one dominant, concave (sharp 2 - 3) | hard | none or ink in the impact frame | flat white core, colour band, hard |
| Toon | 5 - 6, slightly convex tips (sharp 0.8 - 1.0, tips rounded by the outline) | hard | thick dark, 7 - 10% of the size, in the cel union pass | flat, 2 tones |
| Stylized | 4, long thin, soft falloff | soft | none | additive, core above B |
| Dark fantasy | torn, alpha-blended dark shape with a hot rim | torn | the rim is the edge | dark body, tiny additive core |
| Pixel | plus or 4-point star at sprite resolution | hard pixels | 1 px dark | palette colours only |
| Realism | no star: an anisotropic flare along the hit (aspect 3) for 2 frames | soft | none | additive |

## Life

- **Redraw, do not hold.** Any designed shape visible for more than 2 drawings (or 4 frames at full rate) changes every drawing: new point lengths (±30%), a rotation of 15 degrees or more, or a silhouette change of 10% or more. Anime redraws every drawing; toon overshoots its scale and wobbles.
- **Exit.** The spark breaks, shrinks or snaps off. It does not fade at full size.
- **Ring.** A ring starts 1 drawing (or 2 - 3 frames) after the spark, off-centre along the hit, never concentric with it. A spark plus a concentric ring plus a disc reads as a reticle.
