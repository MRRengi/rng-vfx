# Numbers

This file is the single source for timings, sizes and brightness. Style files and `fundamentals.md` describe how things should look. When they disagree with a number here, this file wins. Frame counts are at 60 fps. "Drawings" are steps on a held-drawing grid: 12 per second in anime, 10 in pixel.

## Brightness is relative to the project

Absolute values like "HDR 2" mean nothing across engines. UE5 has auto exposure and physical light units, HDRP uses EV, Unity's HDR colour picker counts intensity in stops, and three.js applies tone mapping after exposure. So every brightness below is a multiple of **B**: the scene-referred value at which this project's bloom starts to respond, measured after exposure (see `audit.md`). Lock exposure while designing, or every number drifts with the scene.

| Level | Value | Used for | Time above B |
|---|---|---|---|
| Body | 0.4 - 0.9 B | smoke, puffs, slash edges, rings, mid tones of fire | - |
| Hot body | 0.9 - 1.3 B | fire mid band, slash core, lightning glow | as long as it lives |
| Core | 1.5 - 2.5 B | flash core, spark heads, the hottest fire stop, lightning core | flash 3 frames or less, sparks while hot |
| Target flash | 0.6 - 1.0 B | the hit character's flash (an albedo tint for dark colours) | 1 - 2 frames, or 1 drawing |
| Rim | 0.3 - 0.5 B | fresnel rim on the hit character | 2 - 6 frames |

Conversions:
- **Unity HDR picker:** intensity is in stops. +1 doubles the value, so with URP's default bloom threshold of 0.9, 2B is about +1.
- **UE5:** lock exposure first (Min EV100 = Max EV100 in a post-process volume, or Manual metering). Emissive values are then relative to that fixed exposure. With the default bloom threshold of -1 (everything blooms a little), measure B as the value where the bloom halo becomes clearly visible.
- **three.js:** with `EffectComposer`, B is simply `UnrealBloomPass.threshold` in linear values. `toneMappingExposure` is applied later in `OutputPass`, so it does not change what blooms; an exposure dip there darkens the frame but not the bloom input (scale the effect's emissive too, or apply exposure before the bloom pass).

Summed brightness counts too. Ten overlapping fire quads at 1.2 B add up to a white blob. Check the hue at peak: an orange fireball that reads white is too bright, whatever its per-quad values say.

## Per style

| | Anime | Toon | Stylized | Dark fantasy | Pixel | Realism |
|---|---|---|---|---|---|---|
| Drawing grid | 12 / s | full rate | full rate | full rate | 10 / s | full rate |
| Hitstop on hits | 2 - 3 drawings | 2 - 3 frames | 3 - 4 frames | 3 - 4 frames | 2 drawings | 0 - 2 frames |
| Hitstop on explosions | 1 - 2 drawings | 0 - 2 frames | 0 - 3 frames | 3 frames on the eruption | 0 - 1 drawing | none |
| Contact spark (whole life) | 2 - 3 drawings | 8 - 12 frames | 6 - 10 frames | 4 - 8 frames | 2 - 3 drawings | 2 - 4 frames |
| Flash above B | first drawing only | 1 - 2 frames | 2 - 3 frames | 2 - 3 frames | none (flat white) | 2 - 3 frames |
| Impact ring (whole life) | 2 - 3 drawings | 6 - 10 frames | 8 - 12 frames | 8 - 12 frames | 2 - 3 drawings | none (distortion only) |
| Ring start after flash | 1 drawing | 2 - 3 frames | 2 - 3 frames | 2 - 3 frames | 1 drawing | - |
| Slash (head to gone) | 3 - 5 drawings | 10 - 16 frames | 12 - 18 frames | 14 - 22 frames | 3 - 5 drawings | 6 - 10 frames (motion blur) |
| Target flash | 1 drawing | 1 - 2 frames | 1 - 2 frames | 1 - 2 frames, dark tint | 1 drawing, flat white | none or 1 frame |
| Rim | 1 - 2 drawings | 4 - 6 frames | 3 - 5 frames | 4 - 6 frames | none | none |
| Hit puffs / smoke | 5 - 8 drawings | 20 - 30 frames | 35 - 55 frames | 40 - 70 frames | 4 - 6 drawings | 1 - 1.6 s |
| Impact total | 0.6 - 0.9 s | 0.4 - 0.6 s | 0.6 - 0.9 s | 0.8 - 1.2 s | 0.5 - 0.8 s | 1.2 - 1.8 s |
| Explosion fireball | 6 - 10 drawings | 0.5 - 0.8 s | 0.6 - 1.0 s | 0.8 - 1.2 s | 5 - 8 drawings | 0.8 - 1.5 s |
| Explosion smoke | 10 - 16 drawings | 0.6 - 1.0 s | 1.2 - 1.8 s | 2 - 3 s | 8 - 11 drawings | 3.5 - 4.5 s |
| Explosion total | 1.3 - 1.8 s | 1.0 - 1.4 s | 2 - 3 s | 2.5 - 3.5 s | 1.2 - 1.6 s | 3.5 - 4.5 s |
| Pure white | flat white is a palette colour | flat white is a palette colour | core only, tier 2+ | core only, tier 3 | flat white is a palette colour | flash core only |

Two rules sit on top of the table:
- **Hitstop and holds.** Hitstop freezes the attacker and everything that was already playing before contact. A slash may freeze for 2 frames at most; after that it keeps wiping (at full speed, or at 25% speed until the hitstop ends), because a frozen slash reads as a sticker. Layers born at contact (spark, flash, ring, puffs) play through the hitstop.
- **White.** Toon, anime and pixel use flat white as an ordinary palette colour (a white puff, a white spark core). That is not an HDR white-out. The hierarchy rule in `fundamentals.md` limits *clipping* white (values far above B that bloom into a blob) to tier 2-3 cores.

## Sizes and screen space

Screen-space numbers are for a 1080p frame through the gameplay camera. Scale by height for other resolutions.

| Element | Minimum on screen |
|---|---|
| Primary shape (spark, slash, fireball) at peak | 40 px tall for tier 1, 80 px for tier 2, 200 px for tier 3 |
| Spark or streak length at peak | 12 px; heroes 20 px |
| Any line or edge | 2 px wide (clamp in the vertex shader, see `recipes/screen-size.md`) |
| Debris chips | 4 px across |
| Pixel-art effect as a whole | 16 px, at the sprites' pixels per metre |

| Element | World size (1.8 m character) |
|---|---|
| Impact spark or star | 0.6 - 1.4 m across, at most 0.8x the character's height |
| Flash core radius | at most 0.6x the primary shape's radius |
| Impact ring | 1.0 - 1.2x the primary shape, 0.5 - 0.8 m radius |
| Ground ring on big explosions | 2 m radius at most, low alpha, or replaced by a dust skirt plus distortion |
| Medium explosion fireball | 2.5 - 4 m tall |

## Motion budgets

| | Value |
|---|---|
| Spark travel, impacts | 1 - 3 m (quadratic drag c = 0.8 - 2, see `physics.md` > Sparks) |
| Spark travel, explosions | 3 - 6 m (c = 0.1 - 0.4) |
| Fireball body travel | 1.5 - 2.5 m (buoyancy about 0.8 m/s^2, linear drag 3 - 3.5) |
| Smoke column rise, medium explosion | 3 - 6 m over its life (buoyancy 1 - 1.5 m/s^2, drag about 2) |
| Hit puffs | 0.3 - 0.8 m from contact, away from the camera side of the target |
| Target squash on contact | about 0.85 along the hit axis and 1.1 across, recovering over 6 - 15 frames |
| Camera shake, hits | 0.02 - 0.1 m, decays within 6 - 15 frames |
| Camera shake, explosions | 0.1 - 0.3 m, decays within 0.4 - 1 s |

## Effect lights

A light sells contact, but too strong or too long it tints the whole target and flattens the spark against the body.

| | Peak on the target | Radius | Duration |
|---|---|---|---|
| Hit spark light | lit albedo at most 0.5 B brighter than without it | 1.5 - 2.5x the primary shape | falls to 10% within the flash frames + 4 frames, or 1 drawing |
| Slash light | 0.3 B | 1.5x the arc radius | head travel + 2 frames |
| Explosion light | ground and nearby characters at most 1 B | 3 - 5x the fireball radius | follows the fireball: peak on the flash, 40% at the fireball's peak, gone when the fire is |
| Fire loop light | 0.2 - 0.4 B | 2 - 3x the flame height | flicker at the size-dependent frequency (`physics.md` > Fire) |

- Put the light in front of the target on the hit side, never inside it.
- Check: once the flash frames are over, the target's luminance is back at or below rim level.
- **Bystanders** (characters near the effect who were not hit) get light only: no flash, no rim, no reaction.

## Counts

| | Hero | Mid | Accent |
|---|---|---|---|
| Impact | 1 - 2 | 4 - 8 | 10 - 30 |
| Explosion | about 3 | 6 - 10 | 30+ |

Size tiers within a layer are roughly 1 : 0.5 : 0.15.
