---
name: rng-vfx
description: Use when designing or building real-time game visual effects - hits, slashes, impacts, explosions, fire, smoke, magic, projectiles, auras, lightning, trails, shockwaves - or their shaders, particles, timing and textures, in Unity (Shuriken, VFX Graph, Shader Graph), Unreal (Niagara) or three.js / WebGL, in any style from realistic to anime, toon, stylized MOBA, dark fantasy or pixel art. Also use when an existing effect looks cheap, weak, washed out, jittery or unreadable and needs fixing.
---

# Game VFX

Work as the lead VFX artist on a shipped action game. The goal is an effect that could ship next to the best work in its genre: when a player sees it from the camera the game is played with, it tells them what happened, where and how hard, and it feels good.

You already know what the best effects in each genre look like. This skill does not replace that taste; it gives you a way of working that turns it into a finished effect, and the knowledge that is easy to get wrong: how real explosions and smoke behave, how things read at gameplay distance, how each engine handles brightness and blending, and what makes motion look polished. Numbers in the reference files are typical starting points taken from shipped games. Go past them whenever your reference does.

Think of every effect as energy made visible: an impact moving water, heat carrying soot, a blast throwing dirt, magic bending light. Name the force and the material it moves before you draw anything; the shapes, the timing and the way it dies all follow from those two.

## What a shipped effect has

These seven qualities are what separate shipped effects from generated ones. Each is a judgement about the result, not a rule about the parts:

1. **It reads from the gameplay camera.** One primary shape carries the event and is recognisable in a single frame from the real camera. Close-up beauty that turns into a blur or vanishes at distance is a failure, so design with the on-screen size in mind (pixels per metre, below).
2. **It has weight in proportion to the event.** A light jab is small and quick; a heavy hit, an ultimate or a big explosion owns the frame for a moment. Generated effects are usually timid, so when unsure, go bigger and bolder, as the reference does.
3. **The world reacts.** The target flinches, flares and is lit by the hit; the ground takes light, dust and a mark; heavy hits freeze for a few frames and shake the camera. An effect floating in front of an unaffected scene looks pasted on.
4. **Timing has contrast.** A fast arrival (with anticipation where the move has a wind-up), a short strong hold, then a long, uneven dissipation. A slow swell, an even fade or everything vanishing at once all read as weak.
5. **Each material behaves like itself.** Energy emits light: hot core, saturated body, glow, light cast on the surroundings. Matter (smoke, dust, soil, debris, blood) is lit by the scene, occludes and obeys physics. Fire is both. The look of each comes from the genre: painted MOBA energy, crisp anime energy, believable realistic dirt.
6. **The shapes are designed.** A strong asymmetric silhouette; big, medium and small pieces rather than repeats; no mirror symmetry, parallel edges or even spacing; every detail following the path of the force; shapes sharp and fast while the energy is high and soft and slow as it dies. Repetition and symmetry are the clearest signs of generated work (`references/craft.md`).
7. **The motion is polished.** Smooth, eased, continuous motion; edges anti-aliased; no flicker, popping, strobing or jitter; detail that moves with the shape instead of boiling. A great design with rough motion looks cheap (`references/motion.md`).

Comic devices (outlines, straight-edged star polygons, "pow" bursts, outlined cartoon clouds) belong to the toon style. In other styles they turn the effect into a sticker, so use them only when the style or the user asks.

## How to work

### 1. Brief

Write down the event (hit, explosion, cast, buff), its weight (light, heavy, ultimate), the style, the engine and the gameplay camera (distance, FOV, framing). In an existing project, record the tone mapper, bloom, exposure and units, and look at two of its existing effects; brightness depends on them (`references/brightness.md`).

Work out the on-screen scale: pixels per metre at the target is `screenHeight / (2 * distance * tan(fov / 2))`. A 1.8 m character 10 m away with a 40 degree FOV is about 270 px tall at 1080p, so a 2 cm spark is 3 px and a 2 m slash is 300 px. Elements narrower than about 3 px disappear.

### 2. Reference breakdown

This is the most important step: the reference is your target, and vague memories make vague effects. Pick two shipped effects in this genre that do the same job (name the game and the move; use the user's references if given) and describe each in detail at four moments: contact, +2 frames, +6 frames and the end. For each, write the primary shape and its size relative to the character, what is brightest and darkest, the colours, what the target and ground are doing, and what is moving and how. The style file lists the genre's typical references and look (`references/styles/<style>.md`).

### 3. Plan

Write a short plan before code, because the expensive mistakes (wrong shape, wrong scale, wrong timing, wrong material) are cheap to fix on paper:

- **Force and material:** what drives the effect (impact, heat, pressure, wind, gravity, a spell's own logic) and what it moves (thin or thick liquid, soot, dust, glass, soil, light).
- **Primary shape:** the one silhouette that carries the event at its peak, its size relative to the character and how it faces the camera.
- **Colour and light:** the ramp from hottest to edge with hex values; what glows, what light it casts and on what; how the matter is lit.
- **Timing:** each layer's start, peak and end in frames at 60 fps relative to contact.
- **Layers**, each with one job: primary; secondary (sparks, streaks, shards, rings that show direction and force); interaction (target reaction and light, ground dust, marks, hit stop, shake); residue (what remains and how it leaves).

Read the plan against the seven qualities and against your reference breakdown. Where it is smaller, plainer or shorter-lived than the reference, ask whether that is a choice or a habit.

### 4. Build in passes

Blockout first: the primary shape and its timing, seen from the gameplay camera, so you can judge silhouette, scale and rhythm before spending time on detail. Then add the colour ramp and glow (or lighting), the secondary layers, interaction, residue and dissipation, and finally polish (distortion, motion quality). `references/craft.md` has the classical effects-animation principles (energy, designed shapes, scale, choreography, magic), `references/elements.md` has construction notes for common elements, `references/physics.md` has motion, and the engine file has the implementation (`references/engines/threejs.md`, `unity.md`, `unreal.md`).

### 5. Review against the reference

Look at the effect in two ways, because each catches different problems:

- **Stills** at fixed times from contact (-2, 0, +2, +4, +8, +15, +30 frames, then 50%, 75% and 95% of the duration) from the gameplay camera and a close camera: shape, scale, colour, reaction, residue.
- **Motion:** every frame from a few frames before contact to about half a second after, in order: jitter, popping, flicker and the rhythm of the hit only show up here.

For a page with the `window.fx` API, `python scripts/capture_strip.py <folder> <out>` renders both (add `--times 0.4,0.5` for a quick look at chosen frames while iterating); elsewhere use the engine's frame capture. Then critique it as a demanding art director would, next to your reference breakdown at the same moments: where is it weaker than the reference, and which of the seven qualities is furthest off? Fix the biggest gap, render again and repeat until you would put it in the reel next to the reference. Write down what you would improve next.

## Reference files

Read the style file before step 2, and the others when the step calls for them.

| File | What it holds |
|---|---|
| `references/styles/realism.md` | AAA shooters, military, cinematic |
| `references/styles/stylized.md` | MOBA and hero shooters (LoL, Overwatch, Dota) |
| `references/styles/anime.md` | anime action games and sakuga (Genshin, ZZZ, Guilty Gear) |
| `references/styles/toon.md` | cartoon (Wind Waker, Splatoon) |
| `references/styles/dark-fantasy.md` | ARPG and soulslike (Diablo, Elden Ring, PoE) |
| `references/styles/pixel.md` | pixel art |
| `references/craft.md` | effects-animation principles from classical hand-drawn effects: animating energy, designed shapes, the life of the energy, scale, choreography, cause and effect, exaggeration, magic |
| `references/elements.md` | how to construct slashes, flashes, projectiles, rings, sparks, debris, explosions, smoke, fire, splashes and liquids, lightning, impact frames, hit reactions, decals, light |
| `references/motion.md` | motion quality: easing, smoothness, anti-aliasing, flicker, popping, hit stop, frame rate |
| `references/physics.md` | motion of particles, smoke, fire, explosions, debris, liquids |
| `references/brightness.md` | brightness relative to bloom per engine, and why bright colours turn white |
| `references/engines/threejs.md`, `unity.md`, `unreal.md` | systems, materials, post, frame capture, performance |

A style the user names that is not listed: describe its look, timing and typical references in the same way from what you know of its games, and follow the same process.
