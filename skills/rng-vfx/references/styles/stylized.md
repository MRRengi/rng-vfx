# Stylized (hand-painted, MOBA and hero shooter)

Reference points: League of Legends (Riot published its VFX style guide publicly; it is the best free document on readable stylized VFX), Overwatch, World of Warcraft, Hades, Fortnite.

## What defines it

- **Gameplay clarity above everything.** Effects show area, direction, power level and timing. Flavor is added only after the gameplay read is solid.
- **Painterly shapes from noise.** Shapes come from gradient-mapped, eroding noise textures rather than hard cels. Edges are soft but defined.
- **Strong value hierarchy.** White core, saturated mid, darker painted secondary (smoke, outer flames). Three or four value steps.
- **Full frame rate with punchy curves.** Fast in, slow out. Short holds on peak frames are fine.
- **Primary and secondary separation.** The primary element (the spell's real area or projectile) gets the clearest shape and contrast; secondary elements (sparks, motes) are smaller, darker or less saturated.
- **Painted smoke.** Smoke has visible brushy noise, two or three soft value bands, and a color tint from the effect's theme (purple smoke for arcane, warm brown for fire).

## Color and value

- One theme color per ability, chosen from the character's identity. Accent sparingly.
- Hue shift: core toward white or pale yellow, edges toward a deeper saturated hue, smoke toward a desaturated dark version.
- Reserve pure white and maximum brightness for the strongest abilities (Riot's guide frames this as a scale of importance).
- Bloom: medium, controlled. Use HDR only on cores and sparks.

## Signature techniques

- **Erosion with gradient map:** sample a noise, compute `heat = (noise - threshold(life)) / softness`, color from a ramp by heat, alpha from heat. One texture gives shape, color and dissipation.
- **UV scrolling and panning noise** on meshes (cones, cylinders, half-spheres) for beams, tornadoes, shields.
- **Distortion** on shockwaves and heat (refraction using a noise normal, masked by a ring).
- **Swept slash mesh:** arc mesh, head and tail masks along U, white core to colored edge along V, erosion as the tail passes.
- **Ribbon trails** with tapered width and scrolling noise.
- **Fresnel shells** on characters for buffs and shields.
- **Ground decals** for area of effect with a crisp edge and a soft interior.

## Default numbers

- Impact: slash or flash 6 - 10 frames, ring 18 - 20 frames, sparks 20 - 35 frames with gravity, motes 40 - 70 frames, smoke 35 - 55 frames.
- Explosion: flash 5 - 15 frames, fireball 35 - 60 frames eroding, smoke 70 - 110 frames, embers up to 2 s, scorch 2 - 5 s.

## Common mistakes

- Everything at the same brightness (no hierarchy).
- Noise textures that are too fine; at gameplay distance fine noise becomes gray mush. Use big, readable noise features.
- Area of effect drawn larger or smaller than the hitbox.
- Smoke covering the character or the important part of the effect.
