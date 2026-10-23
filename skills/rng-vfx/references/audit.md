# Project audit

Do this before designing anything in someone else's project. Every number in this skill depends on the project's camera, exposure, bloom and units. An effect tuned in isolation looks wrong in the game. Write the results down in a short audit block at the top of your notes. Each item takes a minute to find.

## What to record

| Item | Why it matters | Where to find it |
|---|---|---|
| Engine, version, render pipeline | decides blend modes, distortion, available systems | Unity: Package Manager (URP/HDRP/Built-in), Graphics settings. Unreal: project version, Rendering settings. Web: three.js version, WebGL 2 or WebGPU |
| Tone mapper | AgX/ACES desaturate hot colours toward white; neutral and none keep hue | Unity: Volume > Tonemapping. Unreal: post-process volume > Film. three.js: `renderer.toneMapping` |
| Bloom threshold and intensity (= **B**) | all brightness in `numbers.md` is relative to it | Unity: Volume > Bloom. Unreal: post-process > Bloom (threshold -1 means everything blooms). three.js: the bloom pass |
| Exposure mode | auto exposure shifts every value per scene | Unity HDRP: Exposure override. Unreal: Exposure (lock Min = Max EV100 while designing). three.js: `toneMappingExposure` |
| Units and scale | gravity, speeds and sizes assume metres | character height in units; Unity 1 unit = 1 m by convention, Unreal 1 unit = 1 cm |
| Gameplay camera | sizes on screen, readability, framing | camera distance, FOV, typical framing; compute pixels per metre at the target: `ppm = screenHeight / (2 * distance * tan(fov / 2))` |
| Frame rate | frame counts in `numbers.md` assume 60 | project target fps |
| Existing effects | match their language, density and brightness | render 2 - 3 existing effects with the same strip method you will use for yours |
| Colour language | damage types, teams, healing, rarity colours | game design docs, UI, existing effects |
| Pixels per unit (2D, pixel art) | effect pixels must match sprite pixels | sprite import settings, pixel-perfect camera |
| Background values | effects must read on the lightest and darkest playable areas | a screenshot of each |

## Turning it into numbers

1. Measure B: place an unlit quad with a value you control at the effect's position, raise it until the bloom halo appears, and record that value.
2. Write the brightness table from `numbers.md` in project values (for example, URP's threshold 0.9 is entered in gamma space, so B is about 0.79 linear and "core 1.5 - 2.5 B" is 1.2 - 2.0 in its max channel).
3. Compute pixels per metre at the gameplay camera, then check that the minimum sizes in `numbers.md` (40 px primary shape, 12 px sparks) are reachable at the world sizes you plan. If they are not, scale the effect or clamp its screen size (`recipes/screen-size.md`). Do not hope it reads.
4. Put the existing effects' strips next to yours at every review.

## When there is no project yet

Pick neutral defaults and say so in the notes: metres, 60 fps, filmic tone mapping (AgX), bloom threshold 1.0 after exposure 1.0, and a gameplay camera at 8 - 12 m with a 40 degree FOV for third person or isometric. The stand in this repository uses these.
