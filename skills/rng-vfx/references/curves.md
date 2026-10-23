# Curve presets

Agents copy curves well and invent them badly. These are starting curves per style and layer, as data: `[time, value, ease]`, where time is seconds after the layer starts (D = one drawing: 1/12 s anime, 1/10 s pixel) and ease names the curve into that key (`outQuad`, `outBack`, `outExpo`, `inQuad`, `step`). Tune from here; do not start from linear.

## Anime (on twos, all keys on the drawing grid)

| Layer | Scale | Alpha | Colour / notes |
|---|---|---|---|
| Contact spark | `[0, 1.0] [D, 1.08] [2D, 0.6, step] [3D, 0]` | `[0, 1] [3D, 1] [3D+, 0]` | white core, colour band; redraw every drawing (new blade lengths) |
| Broken ring | `[0, 0.5] [2D, 0.92, outQuad]` | `[0, 1] [2D, 1] [2D+, 0]` | width `[0, 0.08] [2D, 0.02]` |
| Speed streaks | stretch along hit | `[0, 1] [2D, 1] [3D, 0]` | 2 - 3 drawings |
| Hit puffs (cel) | `[0, 0.3] [D, 1.0, outBack] [6D, 1.0] [9D, 0.4]` | holes erode from 0.35 of life | 2 bands, union outline |
| Fireball (drawn) | flipbook, 2 drawings per key | `[0, 1]` until the break-up key | stem life ≥ fireball life |
| Smoke (cel) | `[0, 0.6] [3D, 1.0, outQuad] [14D, 1.3]` | holes from 0.5 of life | starts 2 drawings before the fire ends |
| Target flash | - | `[0, 0] [D, 0.35] [2D, 0]` | tinted toward the effect colour, never white over white |

## Toon (full rate)

| Layer | Scale | Alpha | Colour / notes |
|---|---|---|---|
| Star | `[0, 0.85] [0.06, 1.12, outBack] [0.09, 0.95] [0.12, 1.05] [0.16, 0, inQuad]` | `[0, 1] [0.16, 1] [0.161, 0]` | outlined; redraw point lengths every 3 frames |
| Puffs (drawn) | `[0, 0.3] [0.06, 1.0, outBack] [0.3, 1.0] [0.45, 0.6]` | flipbook holes | 2 tones, outline |
| Fire puffs | `[0, 0.2] [0.07, 1.1, outBack] [0.12, 1.0]`, squash `aspectY [0, 0.85] [0.1, 1.2] [0.25, 1.0]` | shrink out over the last 30% | 2 bands ≥ 0.18 L apart |
| Ring | `[0, 0.5] [0.1, 0.8, outBack]` | `[0, 1] [0.1, 0]` | one flat colour |
| Target | squash `[0, 0] [0.04, 1, outQuad] [0.14, -0.5] [0.26, 0.2] [0.38, 0]` | flash `[0, 0.25] [0.033, 0]` | bounce |

## Stylized (full rate)

| Layer | Scale / position | Alpha | Notes |
|---|---|---|---|
| Slash head | `[0, 0] [0.08, 1, outQuart] [0.22, 1.7]` (linear after contact) | `[0, 1] [0.12, 1] [0.22, 0]` | tail 0.7; burn band only in the tail |
| Flash | `[0, 0.4] [0.03, 1, outExpo] [0.09, 0.7]` | `[0, 1] [0.05, 1] [0.09, 0]` | 4 spikes, long ones along the hit |
| Sparks | quadratic drag c ≈ 1 | fade over the last 20% | ramp: pale colour → saturated → dark |
| Fire (painted) | `sizeIn` 0.12, then rising 0.8 m/s² buoyancy | erode from 0.3 of life | 3 posterized bands, hottest band connected |
| Smoke (painted) | `[0, 0.6] [0.3, 1.0, outQuad] [1.6, 1.4]` | fade over the last 25% | starts inside the fire, 1.3x its area |

## Dark fantasy (full rate)

| Layer | Scale / position | Alpha | Notes |
|---|---|---|---|
| Slash | head `[0, 0] [0.05, 1, outQuart] [0.083, 1.1] [0.25, 1.75, outQuad]` | `[0, 1] [0.18, 1] [0.26, 0]` | dark body, hot rim on the outer edge |
| Torn flash | stretched along the hit, aspect 3 | `[0, 1] [0.05, 1] [0.08, 0]` | 2 torn blades, never a 4-way cross |
| Blood | quadratic drag c ≈ 1.5, gravity -14 | lands as splats at 0.3 - 0.45 s | `#7a0a10 → #3a0206`, teardrops stretched by speed |
| Cracks | reveal `[0, 0] [T, 1.2, outQuad]` | glow `[T, 1] [T + 3, 0.05, outQuad]` | cooling unevenly per cell |
| Fire tongues | `sizeIn` 0.15 | erode from 0.25 of life | stay red under the tonemapper |
| Smoke | `[0, 0.6] [0.4, 1.0] [2.5, 1.5]` | fade over the last 25% | value floor 0.08 - 0.12, fire light only in the bottom 30% |

## Pixel (10 drawings per second)

| Layer | Scale | Alpha | Notes |
|---|---|---|---|
| Flash | `[0, 0.7] [D, 1] [2D, 0.5]` | `[0, 1] [3D, 0]` | plus or 4-point star, palette colours |
| Squares | gravity, drag | `step` off at end of life | 2 - 3 px squares at sprite resolution |
| Puffs | `[0, 0.4] [D, 1.0] [4D, 0.6]` | dither out over the last 40% | 2 tones from the palette's neutrals |
| Sprite flash | - | full white for exactly 1 drawing | the intended cue; exempt from the target-flash cap |

## Realism (full rate)

| Layer | Scale | Alpha | Notes |
|---|---|---|---|
| Contact flare | aspect 3 along the hit | `[0, 1] [0.033, 1] [0.034, 0]` | 2 frames |
| Sparks | quadratic drag c 0.8 - 2 | blackbody cooling over life | 25% heroes with trails |
| Fireball | `sizeIn` 0.12; frame 1 at 40% of the peak | premultiplied: glow → occlusion as it cools | temperature particle |
| Smoke | `[0, 0.6] [0.5, 1.0, outQuad] [4, 1.8]` | constant opacity, fade over the last 25% | buoyancy 1 - 1.5 m/s², lit from below |
| Light | `[0, 0] [0.02, 1] [0.3, 0.35, outQuad] [1.8, 0, outQuad]` | - | follows the fireball |
| Exposure | `[0, 1] [0.03, 0.6] [0.35, 1, outQuad]` | - | applied before bloom |
