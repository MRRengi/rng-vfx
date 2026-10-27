# Toon

Cartoon games: The Legend of Zelda: The Wind Waker, Splatoon, Ratchet & Clank, Fortnite's lighter effects, Cuphead's spirit in 3D. Friendly, round, bouncy, outlined.

**References to recall:** The Wind Waker (sword hits, bomb explosions with round puffs, enemy defeat puffs), Splatoon (ink bursts), Ratchet & Clank (weapon impacts). Describe the matching one at contact, +2, +6 frames and the end before building.

## Look

- Round shapes: puffs are clusters of circles, stars have straight edges and slightly rounded tips, splashes are blobs.
- Flat colour in 2 bands (light and shade) and a thick dark outline (6 - 8% of a shape's radius, at least 2 px); no gradients, little or no bloom.
- Bright, friendly palette with a coloured outline instead of black. Example: star `#fff3a0` / `#ffc62e`, outline `#3a2a6a`; puffs `#ffffff` / `#c9c0e8`, outline `#2b2b55`; fire `#ffe14d` / `#ff7a1a`, outline `#5a1e1e`.
- Motion is squash and stretch with overshoot: pop in fast with an outBack curve, hold, shrink away with an ease-in. Shapes disappear by shrinking, rarely by fading.
- Symbols are welcome: stars, sparkles, swirls, "pow" bursts.

## Timing defaults (60 fps, typical)

| Layer | Start | Peak | End |
|---|---|---|---|
| Star | 0 | 3 - 4 (overshoot 1.1x) | shrinks out by 10 - 12 |
| Puffs | 2 | 6 - 8 (outBack pop) | hold, then shrink by 25 - 35 |
| Sparkles | 2 | | 30 - 40, twinkling |
| Explosion fire puffs | 0 | 4 - 6 | shrink by 30 - 40 |
| Smoke puffs | 15 | 25 | 50 - 60 |
| Target squash | 0 | 2 | bounce settles by 20 |

## Signature shapes

- Star polygon burst with a thick outline, one long point along the hit.
- Puff clusters with an outline around the union and one shade band, holes appearing late (`elements.md` > Cel puffs).
- A skirt of small puffs on the ground instead of a ring.
- Squash on the target and a bounce.

## Failure modes in this style

- Concave petal-like star points: they read as a flower. Use a star polygon with straight edges.
- Outlined donut puffs from fine-noise holes.
- Soft glow and bloom: toon is flat colour.
- Fades instead of shrinking; no overshoot, no squash.
- A thin flat ring instead of a puff skirt.
