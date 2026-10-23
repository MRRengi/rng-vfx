---
name: rng-vfx
description: Real-time game VFX across styles (anime, toon, stylized, dark fantasy, pixel, realism) and engines (Unity VFX Graph / Shuriken / Shader Graph, Unreal Niagara / Materials, three.js). Use when creating, reviewing or fixing visual effects - impacts, slashes, projectiles, explosions, fire, smoke, magic, auras, lightning, trails - their shaders, materials, textures, timing and performance.
---

# rng-vfx

A VFX artist's process, written for an agent. Two things make an effect look expensive, and both are load-bearing: the decision chain (what the effect communicates, which style rules apply, how it is timed, how it reads at gameplay distance) and the quality of its shapes and surfaces (designed silhouettes, real texture noise or flipbooks, depth-aware blending, distortion, a reacting target). A correct chain rendered as procedural blobs on round quads still looks cheap. Follow the chain in order and meet the quality floors in `references/fundamentals.md`.

## The chain

1. **Brief.** Write down in one or two lines: what gameplay event this is, how important it is compared to everything else on screen (see `references/fundamentals.md` > Hierarchy), where the camera is, and how long the effect may last.
2. **Style.** Pick exactly one style file and follow its rules. Mixing rules from two styles is the most common reason an effect looks "off".
3. **Reference breakdown.** Before building, describe the effect as frames: what is on screen at contact, at +2 frames, at +6, at the end. If the user gave a reference, break it down frame by frame. If not, write the breakdown from the style file.
4. **Timing.** Anticipation, contact, follow-through, dissipation, with numbers in seconds or frames. `references/fundamentals.md` > Timing has the defaults.
5. **Layers.** Decide the layer stack (core, flash, shape, secondary, residue, light, camera, decal). Each layer has one job.
6. **Textures.** Choose or generate masks, noises, flipbooks and ramps (`references/textures.md`).
7. **Shaders and materials.** Build from the technique catalog (`references/shaders.md`, `references/materials.md`).
8. **Motion.** Particle physics, curves, forces (`references/physics.md`).
9. **Engine.** Implement with the engine file (`references/engines/unity.md`, `unreal.md`, `threejs.md`).
10. **Budget.** Check against `references/performance.md` before calling it done.
11. **Verify.** Render a frame strip and check it against the breakdown from step 3 (`references/verification.md`).

## Which file to read

| Task | Read |
|---|---|
| Any effect, first time in a session | `references/fundamentals.md` |
| Anime, sakuga, cel-shaded 3D, fighting games | `references/styles/anime.md` |
| Cartoon, toon, Wind Waker, bouncy | `references/styles/toon.md` |
| MOBA, hero shooter, hand-painted, "Riot / Blizzard look" | `references/styles/stylized.md` |
| ARPG, Diablo-like, grimdark, horror magic | `references/styles/dark-fantasy.md` |
| Pixel art, retro, low-res | `references/styles/pixel.md` |
| Realistic, cinematic, military, physically based | `references/styles/realism.md` |
| Particle motion, gravity, drag, smoke, fire, sparks, fluids | `references/physics.md` |
| Erosion, distortion, flowmaps, fresnel, polar UVs, soft particles | `references/shaders.md` |
| Blend modes, HDR, emission, lit vs unlit, sorting | `references/materials.md` |
| Masks, noises, flipbooks, ramps, texture generation | `references/textures.md` |
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
- **No concentric equal-radius layers.** A flash and a ring sharing a centre and a radius read as a reticle. Offset rings in time (2 to 3 frames later) and size (1.5x the flash or more), tilt them toward the hit.
- **Bodies use texture noise or flipbooks.** Fire, smoke, explosion and puff bodies sample a large-feature noise texture (billow, inverted Worley, warped fbm) or a flipbook. Procedural value noise is for small masks and holes only; on bodies it gives the same cotton-ball look in every style.
- **The target reacts.** Hit flash or fresnel rim, a jolt, a lean away from the hit, a mark. The target's response carries half of an impact.
- **No white-out frames.** Flashes stay smaller than the primary shape (0.6x its radius or less), have a tight falloff, and live 3 frames or less above HDR 1. Use an exposure dip, not a full-screen white, to sell brightness.
- **Depth-aware and refractive.** Soft particles wherever quads meet geometry; shockwaves and heat are distortion, not soft additive discs.
- **Nothing under 2 pixels.** At the review camera, no element is thinner than 2 px and sparks are at least ~20 px long at their peak.

## Tools this skill can use

All optional. The skill works with none of them.

- **EffectTextureMaker** (browser, generated textures are CC0): noise, flare, ring, explosion, lightning, cloud and spritesheet templates, saved and loaded as JSON presets. See `references/textures.md` for the automation recipe.
- **Image generation CLI** (any model the user has): painted textures, hand-drawn flipbook frames, decals. Prompt patterns in `references/textures.md`.
- **Rengi Forge** (MCP server, if connected): `sprite_tools_video_to_sheet` (video to flipbook), `sprite_tools_normal_map`, `texture_tools_seamless`, `texture_tools_pbr`, `texture_tools_pack` (channel packing), `sprite_tools_pixelate`, `texture_tools_atlas`. When these tools are present, prefer them over hand-written image scripts.
- **The rng-vfx stand** (`stand/` in this repository): a three.js page with the six styles, frame stepping, grayscale and an engine-render compare panel. See `references/verification.md`.

## Scope discipline

Build what was asked. When fixing an effect, fix the reported problem and leave the rest of the effect alone. When the brief is unclear about style, importance or camera, ask one question instead of guessing; those three decide everything downstream.
