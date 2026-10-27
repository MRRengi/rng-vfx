# Brightness

Bloom is an accent. Design the effect to read with bloom off (value bands, `../SKILL.md` step 3), then let only the hottest few percent of it exceed the bloom threshold. This file is how to set those levels in each engine.

## Brightness is relative to the project

Absolute values like "HDR 2" mean nothing across engines. UE5 has auto exposure and physical light units, HDRP uses EV, Unity's HDR colour picker counts intensity in stops, and three.js applies tone mapping after exposure. So every brightness below is a multiple of **B**: the scene-referred value at which this project's bloom starts to respond, measured after exposure (measure it: place an unlit quad with a value you control at the effect, raise it until a bloom halo appears, and record that value). Lock exposure while designing, or every number drifts with the scene.

| Level | Value | Used for | Time above B |
|---|---|---|---|
| Body | 0.4 - 0.9 B | smoke, puffs, slash edges, rings, mid tones of fire | - |
| Hot body | 0.9 - 1.3 B | fire mid band, slash core, lightning glow | as long as it lives |
| Core | 1.5 - 2.5 B | flash core, spark heads, the hottest fire stop, lightning core | flash 3 frames or less, sparks while hot |
| Target flash | 0.6 - 1.0 B | the hit character's flash (an albedo tint for dark colours) | 1 - 2 frames, or 1 drawing |
| Rim | 0.3 - 0.5 B | fresnel rim on the hit character | 2 - 6 frames |

Conversions:
- **Unity HDR picker:** intensity is in stops; +1 doubles the value. URP's Bloom Threshold is entered in gamma space (0.9 is about 0.79 linear), so measure B instead of computing it, then write levels as stops above it.
- **UE5:** lock exposure first (Min EV100 = Max EV100 in a post-process volume, or Manual metering). Emissive values are then relative to that fixed exposure. With the default bloom threshold of -1 (everything blooms a little), measure B as the value where the bloom halo becomes clearly visible.
- **three.js:** with `EffectComposer`, B is `UnrealBloomPass.threshold`, compared against linear luminance (`LuminosityHighPassShader`). `toneMappingExposure` is applied later in `OutputPass`, so it does not change what blooms; an exposure dip there darkens the frame but not the bloom input (scale the effect's emissive too, or apply exposure before the bloom pass).

**What the threshold measures depends on the engine.**
- **three.js** (`UnrealBloomPass`) compares Rec.709 luminance of the linear colour (`0.2126 R + 0.7152 G + 0.0722 B`).
- **Unreal** compares its own `Luminance()` (`0.3 R + 0.59 G + 0.11 B`, linear). Reds and blues bloom earlier there than in three.js.
- For both, every level in the table above is a luminance; for a saturated colour, scale its channels by `level / lum(colour)` (table below).
- **Unity URP** prefilters on the brightest channel (`max(r, g, b)` with a soft knee). The levels apply to the max channel directly and the table below does not apply: a pure red at 1.2 B in its red channel blooms like white at 1.2 B.
- **Unity HDRP** bloom is energy-conserving and its default Threshold is 0: everything scatters a little and there is no B until you set one. Either set an explicit Threshold (then B is that value after exposure) or, like UE's -1, define B as the value where the halo becomes clearly visible.

three.js also has a hard knee: `UnrealBloomPass` passes the whole pixel once it crosses the threshold (`smoothWidth` 0.01), so anything sitting right at B flickers in and out of bloom with a hard contour. Raise `bloom.highPassUniforms.smoothWidth` to about 0.15x the threshold, and keep body levels below 0.85 B or above 1.15 B.

Luminance engines, channel scale per colour (sRGB hex converted to linear first):

| Colour | three.js lum per unit | three.js scale for 1 B | Unreal lum per unit | Unreal scale for 1 B |
|---|---|---|---|---|
| white | 1.00 | x1 | 1.00 | x1 |
| yellow #ffd23f | 0.68 | x1.5 | 0.69 | x1.5 |
| cyan #3fd8ff | 0.57 | x1.7 | 0.53 | x1.9 |
| orange #ff6a1f | 0.32 | x3.2 | 0.39 | x2.6 |
| pure red #ff0000 | 0.21 | x4.7 | 0.30 | x3.3 |
| violet #7b5cff | 0.19 | x5.2 | 0.23 | x4.3 |
| pure blue #0000ff | 0.07 | x13.9 | 0.11 | x9.1 |

A red rim "at 1.2 B" written as channel values never blooms; a white core at the same channel value blows out. Reds and blues need much larger channel values to glow and turn toward white or pink under AgX when pushed. In dark styles, carry the heat with value contrast (dark body, bright edge) rather than raw channel intensity.

Summed brightness counts too. Ten overlapping fire quads at 1.2 B add up to a white blob. Check the hue at peak: an orange fireball that reads white is too bright, whatever its per-quad values say.

