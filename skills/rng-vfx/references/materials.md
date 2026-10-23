# Materials

## Blend modes

| Mode | Formula | Use | Watch out |
|---|---|---|---|
| Additive | `dst + src * a` | light-emitting things: glows, sparks, fire cores, energy | invisible on white backgrounds; stacks to white fast; cannot darken |
| Alpha blend | `src * a + dst * (1 - a)` | smoke, dust, blood, debris, dark magic, outlines | needs sorting; overdraw heavy |
| Premultiplied | `src + dst * (1 - a)` | mixed glowing and occluding in one texture (fire with smoky edges) | shader must multiply rgb by alpha |
| Multiply | `dst * src` | darkening, shadows, scorch overlays | cannot brighten |
| Opaque + alpha clip / dither | depth-written | chunky debris, cel puffs, pixel effects, large dissolves | hard edges; use dithering for soft looks |

Choose by what the element is physically: light adds, matter occludes. Dark fantasy and realism lean on alpha blending; stylized energy and anime flashes lean on additive.

## HDR and emission

- Work in linear color space; author colors in sRGB and convert.
- Emission or color above 1 is what bloom reacts to. Give HDR only to cores and sparks, so bloom outlines the hottest parts and not the whole effect.
- Exposure and tone mapping change everything. Judge effects with the project's real tone mapper (Neutral for flat stylized looks, AgX or ACES for filmic). An effect tuned without tone mapping blows out once it is on.
- Bloom settings belong to the project, not the effect. If an effect only looks right with special bloom, fix the effect's values instead.

## Lit or unlit

- **Unlit** (most VFX): flashes, energy, stylized fire, anime and toon puffs (their shading is designed in the shader), sparks.
- **Lit:** realistic smoke and dust (they must respond to the sun and to explosion light), debris, liquids, decals. Options from cheap to good: vertex lighting, normal-mapped particles, six-way lightmaps (smoke sims baked with lighting from six directions, blended by the light direction at runtime; supported in Unity VFX Graph and Unreal).
- Toon-lit meshes (shields, domes) use a ramp texture for hard light bands.

## Sorting and depth

- Transparent particles do not write depth. Sort per system (and per particle for alpha blend when needed). Additive does not need sorting.
- Put dark alpha-blended layers (smoke) before additive layers in render order so glows sit on top.
- Slashes and flashes that must read over the target can ignore depth or be pushed toward the camera; ground elements (rings, decals) need depth test and a small depth offset to avoid z-fighting.
- Opaque effect parts (debris, cel puffs with alpha clip) write depth and sort for free.

## Common material settings

- Double-sided for flat meshes (slashes, rings, ribbons).
- Fog: decide per effect. Bright magic often ignores fog; smoke and dust must take fog or they float in front of the atmosphere.
- Receive shadows: off for most VFX; on for big lit smoke if the pipeline supports it.
- Soft particles: on for anything touching geometry.

## Presets by style

| Style | Core | Secondary | Residue | Tone mapping |
|---|---|---|---|---|
| Anime | unlit hard additive or opaque flat | unlit additive streaks | alpha clip / opaque step-shaded puffs | Neutral |
| Toon | unlit opaque flat + outline | unlit sparkles | opaque shrinking puffs | Neutral |
| Stylized | unlit additive HDR | additive sparks | alpha-blended painted smoke | Neutral or ACES |
| Dark fantasy | alpha-blended dark with HDR rim | additive embers | alpha-blended black smoke, decals | AgX / ACES |
| Pixel | unlit opaque, palette | squares | opaque or dithered | none / Neutral, low-res target |
| Realism | additive HDR flash, premultiplied fire | additive streak sparks | lit alpha-blended smoke, lit debris | AgX / ACES |
