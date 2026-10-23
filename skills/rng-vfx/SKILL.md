---
name: rng-vfx
description: Real-time game VFX across styles (anime, toon, stylized, dark fantasy, pixel, realism) and engines (Unity VFX Graph / Shuriken / Shader Graph, Unreal Niagara / Materials, three.js). Use when creating, reviewing or fixing visual effects - impacts, slashes, projectiles, explosions, fire, smoke, magic, auras, lightning, trails - their shaders, materials, textures, timing and performance.
---

# rng-vfx

A VFX artist's production process, written for an agent. Two things make an effect look expensive, and both are load-bearing:
- **The decision chain:** what the effect communicates, which style rules apply, how it is timed, how it reads at gameplay distance in this particular project.
- **Authored shapes and surfaces:** designed silhouettes, flipbooks and painted masks, slashes swept from the weapon, lit smoke, depth-aware blending, distortion, a reacting target.

A correct chain rendered as procedural blobs on round quads still looks cheap. Follow the chain in order. Numbers come from `references/numbers.md`; the tests come from `references/fundamentals.md` > Quality floors.

## The chain

0. **Audit the project.** Before designing, record:
   - the engine and pipeline, tone mapper, bloom threshold (**B**) and exposure mode;
   - units, the gameplay camera and its pixels per metre, frame rate;
   - the game's colour language;
   - a reference strip of 2 - 3 existing effects.

   Details in `references/audit.md`. Every brightness and size in this skill is relative to these. With no project, use the neutral defaults listed there and say so.
1. **Brief.** In one or two lines: what gameplay event this is, how important it is compared to everything else on screen (`references/fundamentals.md` > Hierarchy), where the camera is, and how long the effect may last.
2. **References.** Ask the user for 2 - 3 reference clips or frames of the look they want, unless they already gave some.
   - If a shell with network access exists, `yt-dlp` plus `ffmpeg -ss <time> -frames:v 24` cuts frames around contact.
   - Break each reference down as frames: what is on screen at contact, +2, +6, the end.
   - With no references, write the breakdown from the style file and say that you did.
3. **Style.** Pick exactly one style file and follow its rules. Mixing rules from two styles is the most common reason an effect looks "off". When the references contradict the style file, the references win; note where.
4. **Engine and system.** Decide where it is built: VFX Graph or Shuriken, Niagara, three.js instancing, meshes or sprites, which blend modes and post effects exist (`references/engines/*.md`).
5. **Layers.** Decide the layer stack (core, flash, shape, secondary, residue, light, distortion, decal, target reaction, camera). Each layer has one job. Construction rules for the common ones are in `references/recipes/`.
6. **Timing.** Anticipation, contact, follow-through, dissipation per layer, with numbers from `references/numbers.md`.
7. **Blockout with motion.** Before any texture or shader work:
   - flat, unlit, grayscale shapes with the final timing and motion (`references/physics.md`), seen through the gameplay camera;
   - check the silhouette, the size on screen, the hit direction, the framing, the grounding;
   - run the mechanical checks (`tools/vfxcheck.py`, `references/verification.md`).

   Fix problems here; textures will not fix them later.
8. **Shape sources.** For each body, choose an authored source:
   - a flipbook (simulated or drawn), a life map or a swept mesh (`references/recipes/`);
   - procedural noise only for masks, erosion and accents (`references/textures.md`).
9. **Shaders and materials.** Build from the technique catalog (`references/shaders.md`, `references/materials.md`, `references/recipes/smoke-lighting.md`). Verify again: strips plus mechanical checks.
10. **Budget.** Check against `references/performance.md`.
11. **Final verify.** Render the even, peak and gameplay-camera strips next to the references and the existing effects. Run every check in `references/verification.md` and the cheapness checklist. Any failure goes back to the step that owns it.

## Which file to read

| Task | Read |
|---|---|
| Any effect, first time in a session | `references/fundamentals.md`, `references/numbers.md` |
| Working in an existing project | `references/audit.md` |
| Anime, sakuga, cel-shaded 3D, fighting games | `references/styles/anime.md` |
| Cartoon, toon, Wind Waker, bouncy | `references/styles/toon.md` |
| MOBA, hero shooter, hand-painted, "Riot / Blizzard look" | `references/styles/stylized.md` |
| ARPG, Diablo-like, grimdark, horror magic | `references/styles/dark-fantasy.md` |
| Pixel art, retro, low-res | `references/styles/pixel.md` |
| Realistic, cinematic, military, physically based | `references/styles/realism.md` |
| Slashes, sword trails, swings | `references/recipes/slash.md` |
| Hit sparks, stars, flashes at contact | `references/recipes/spark-star.md` |
| Explosions: grounding, growth, clusters, fire-to-smoke handoff | `references/recipes/explosion.md`, `references/physics.md` |
| Projectiles, beams, lightning, auras and buffs, heals, telegraphs, target reaction | `references/recipes/archetypes.md` |
| Fire, smoke, puffs, anything that needs a flipbook or a designed dissolve | `references/recipes/flipbooks.md`, `references/physics.md` |
| Smoke, dust, steam that must look lit | `references/recipes/smoke-lighting.md` |
| Shockwave cones, domes, beams, tornadoes, ground shocks, scorch and crack decals | `references/recipes/meshes-decals.md` |
| Effects too small at the gameplay camera, minimum pixel sizes | `references/recipes/screen-size.md` |
| Particle motion, gravity, drag, sparks, smoke, fire, fluids | `references/physics.md` |
| Erosion, distortion, flowmaps, fresnel, polar UVs, soft particles | `references/shaders.md` |
| Blend modes, HDR, emission, lit vs unlit, sorting | `references/materials.md` |
| Masks, noises, ramps, texture generation | `references/textures.md` |
| Unity | `references/engines/unity.md` |
| Unreal Engine | `references/engines/unreal.md` |
| Browser, WebGL, three.js | `references/engines/threejs.md` |
| Budgets, overdraw, LOD, mobile | `references/performance.md` |
| Checking the result, frame strips, the stand | `references/verification.md` |
| Sources behind these notes | `references/sources.md` |

## Rules that hold in every style

- **Visual weight follows gameplay weight.** A basic attack never outshines an ultimate. Brightness, size, duration and screen shake are a budget shared by the whole screen.
- **Value first, hue second.** If the effect does not read in grayscale it will not read in color. Check grayscale before tuning colors.
- **Every effect has a peak frame.** Know which frame it is and make it the clearest shape and highest contrast in the effect.
- **Fast in, slow out.** Contact is sudden, dissipation is slow. Linear timing is the signature of amateur VFX.
- **Shape language is the style.** Sharp and asymmetric reads aggressive; round reads friendly; noisy and organic reads natural. Pick on purpose.
- **Layers, not one big sprite.** A good impact is 4 to 8 small layers with distinct jobs, not one sprite doing everything.
- **Dissipation is designed.** Decide how each element leaves: shrinks, erodes, breaks into holes, fades, drifts, falls. Plain alpha fade on everything looks cheap.
- **Light the world.** Bright effects should light the ground and the characters near them (a short-lived point light, emissive decal or vertex color pulse).
- **Respect the camera.** Design and check at the gameplay camera distance, not only in a close-up.
- **Deterministic and scrubbable when possible.** Seeded randomness and time-driven parameters make effects reviewable frame by frame and reproducible in tests.
- **Every impact has a hit vector.** Sprays, flash elongation, sparks and debris follow the direction of the blow. The main spray axis sits at least 45 degrees off the camera axis, or streaks foreshorten into dots.
- **No reticles, no hoops.** A flash and a ring sharing a centre read as a crosshair, and a big closed ring reads as a UI selection circle. Rings are small, broken, stretched along the hit and short-lived; the numbers are under Ring limits in `references/fundamentals.md`. Tilt rings toward the hit.
- **Bodies use texture noise or flipbooks.** Fire, smoke, explosion and puff bodies sample a large-feature noise texture (billow, inverted Worley, warped fbm) or a flipbook. Procedural value noise is for small masks and holes only; on bodies it gives the same cotton-ball look in every style.
- **The target reacts.** Hit flash or fresnel rim, a jolt, a lean away from the hit, a mark. The target's response carries half of an impact.
- **No white-out frames.** The flash core stays small, has a tight falloff, and stays above B only for the frames in `references/numbers.md`. Overlapping bodies (fire, explosions) count too: their summed HDR is what blooms into white mush. Use an exposure dip, not a full-screen white, to sell brightness. The one exception is a designed impact frame: a two-tone frame, 1 drawing, with the effect and character inked, on the biggest hits in styles that use it (anime first).
- **Depth-aware and refractive.** Soft particles wherever quads meet geometry; shockwaves and heat are distortion, not soft additive discs.
- **Big enough on screen.** At the gameplay camera the primary shape, sparks and lines meet the pixel minimums in `references/numbers.md`, clamped in the shader when needed.
- **No straight cuts.** Nothing ends on the straight border of its quad or strip; shapes fade or narrow to zero first.
- **Slashes follow the swing** and cross the target (`references/recipes/slash.md`).

## Tools this skill can use

All optional. The skill works with none of them.

- **EffectTextureMaker** (browser, generated textures are CC0): noise, flare, ring, explosion, lightning, cloud and spritesheet templates, saved and loaded as JSON presets. See `references/textures.md` for the automation recipe.
- **Image generation CLI** (any model the user has): painted textures, hand-drawn flipbook frames, decals. Prompt patterns in `references/textures.md`.
- **Rengi Forge** (MCP server, if connected): `sprite_tools_video_to_sheet` (video to flipbook), `sprite_tools_normal_map`, `texture_tools_seamless`, `texture_tools_pbr`, `texture_tools_pack` (channel packing), `sprite_tools_pixelate`, `texture_tools_atlas`. When these tools are present, prefer them over hand-written image scripts.
- **The rng-vfx stand** (`stand/` in this repository): a three.js page with the six styles, frame stepping, grayscale and an engine-render compare panel. See `references/verification.md`.

## Scope discipline

Build what was asked. When fixing an effect, fix the reported problem and leave the rest of the effect alone. When the brief is unclear about style, importance or camera, ask one question instead of guessing; those three decide everything downstream.
