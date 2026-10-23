# Stylized (hand-painted, MOBA and hero shooter)

Reference points: League of Legends (Riot published its VFX style guide publicly; it is the best free document on readable stylized VFX), Overwatch, World of Warcraft, Hades, Fortnite.

## What defines it

- **Gameplay clarity above everything.** Effects show area, direction, power level and timing. Flavor is added only after the gameplay read is solid.
- **Painterly shapes from noise.** Shapes come from gradient-mapped, eroding noise textures rather than hard cels. Edges are soft but defined. Use a large-feature tiling texture (billow Perlin `|n|`, inverted Worley, warped fbm, or painted brush noise) sampled with two pans at scales about 1.0 and 1.7 in different directions. For flames, bias the erosion threshold by height so the tops burn off first. Procedural value noise gives cauliflower mush; do not use it for bodies.
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
- **Shockwaves are distortion first:** a refraction ring that pushes the image outward, plus a thin bright leading edge. A wide soft coloured band on the ground reads as a UI selection circle. Tilt impact rings toward the hit instead of facing the camera.
- **Slash hold and burn:** hold the slash head at full size for 3 - 4 frames before the tail eats it, and draw a bright burn band at the dissolve edge.
- **Swept slash mesh:** arc mesh, head and tail masks along U, white core to colored edge along V, erosion as the tail passes.
- **Ribbon trails** with tapered width and scrolling noise.
- **Fresnel shells** on characters for buffs and shields.
- **Ground decals** for area of effect with a crisp edge and a soft interior.

## Default numbers

- Impact: slash 6 - 10 frames, flash 2 - 4 frames, ring 18 - 20 frames, sparks 20 - 35 frames with gravity, motes 40 - 70 frames, smoke 35 - 55 frames.
- Explosion: flash 5 - 15 frames, fireball 35 - 60 frames eroding, smoke 70 - 110 frames, embers up to 2 s, scorch 2 - 5 s.

## Common mistakes

- Everything at the same brightness (no hierarchy).
- Noise textures that are too fine; at gameplay distance fine noise becomes gray mush. Use big, readable noise features.
- Area of effect drawn larger or smaller than the hitbox.
- Smoke covering the character or the important part of the effect.
- A slash that floats beside the target: it crosses the target's body, with one or two thinner secondary arcs a frame behind for volume.
- Body and slash cores above HDR 1.5 (spark heads may reach 2.5, see Bloom adds up in `fundamentals.md`): bloom turns them into haze and the shape is lost.
