# Dark fantasy (ARPG, grimdark, horror magic)

Reference points: Diablo II, III and IV, Path of Exile, Grim Dawn, Dark Souls, Elden Ring, Blasphemous.

## What defines it

- **Black is a color.** Dark cores, black smoke, shadow tendrils and alpha-blended darkness are as important as light. Effects subtract light as often as they add it.
- **Hot rims on dark bodies.** A black or dark crimson shape with a thin burning edge (crimson, ember orange, sickly green, cold blue) is the signature look.
- **Restrained palette.** Desaturated world, two strong effect hues at most: blood red and ember orange, corruption green and black, frost blue and gray, void purple and black.
- **Weight and grit.** Heavier camera shake, longer residue, debris, ash, blood, cracks in the ground, lingering embers and smoke. Things fall and stay.
- **Organic menace.** Shapes are jagged, torn, tendril-like, clawed; avoid clean geometric magic circles unless the theme is ritual.
- **Telegraphs matter.** ARPGs show huge numbers of effects at once from a high camera. Danger zones must read through the clutter, often through value (bright red ground warnings on a dark world).

## Color and value

- Base: near black with a hue tint (never neutral gray-black, it looks like a hole in the screen).
- Rim and core: one hot hue, HDR, used sparingly so it pops against darkness.
- Ground lighting from the effect is important: a red or green glow on the floor sells it.
- Bloom: medium, tight radius. Haze washes out the darkness.
- Filmic tone mapping (AgX, ACES) keeps hot colors from going flat.

## Signature techniques

- **Alpha-blended dark smoke** layered under additive embers. Order matters: dark under, hot over. Black smoke must be lit from inside by its fire (add the fire colour to the smoke by height above the source, scaled by the fire's light curve) or rimmed; unlit black smoke on a dark stage is invisible. Check it on a mid background.
- **Dark slash:** dark core, wide dark edge, hot rim band at the outer edge, tearing apart through ridged noise as the tail passes with a burning band at the dissolve edge.
- **Torn splash instead of a lens flare:** the contact flash is an alpha-blended dark torn shape with a hot rim, stretched along the swing, plus a tiny additive core for 2 frames. A generic sparkle star has no menace.
- **Radial cracks:** Voronoi evaluated in polar-log space (`x = angle / 2pi * P` with the cells wrapped in x so there is no seam, `y = log(r) * k`, plus a little domain warp) so cracks branch outward and get finer toward the centre. Line width tapers with radius (wide in the middle, thin at the edge), brightness falls off as `(1 - r)^1.5`, a molten pool sits in the centre, and each cell cools at its own pace (offset by a per-cell random). Put a dark scorch bed under them. Plain Cartesian Voronoi with equal cells reads as a tiled floor.
- **Ember fields:** many tiny additive particles with curl noise drifting up, long lives, cooling ramp.
- **Blood:** alpha-blended stretched droplets with gravity, a value floor around #c0101a (darker vanishes on dark ground), a tiny specular highlight, a cone along the swing, splat decals on landing. Never additive.
- **Ash fall:** small gray shards drifting down slowly with curl noise after big events.
- **Corruption:** noise-eroded black tendrils (ribbons with scrolling noise, or meshes with vertex offset) creeping outward.

## Default numbers

- Impact: slash 10 - 25 frames with lingering dissolve, flash 6 - 10 frames, blood 25 - 45 frames, embers 50 - 85 frames, smoke 50 - 80 frames.
- Explosion: crack anticipation 10 - 20 frames, eruption fire 50 - 70 frames, black smoke column 80 - 120 frames, ash 90 - 130 frames, cracks cooling 2 - 4 s.

## Common mistakes

- Pure black smoke with no tint and no rim (reads as missing pixels).
- Too many saturated colors; dark fantasy is restrained.
- Additive blending on dark elements (they disappear).
- Pretty, clean, symmetrical magic that belongs to a high fantasy game.
- Smoke glowing from the fire everywhere: fire light lives in the bottom 30% of the column plus a hot rim on the density edge.
- A single slash for a claw or blade attack: add thin torn strands riding the main arc.
- Round blood dots: drops stretch into teardrops along velocity and land as splats with satellite drops.
- A target flash in bright red: dark fantasy tints the hit body dark (deep crimson) and lets the rim carry the heat.
