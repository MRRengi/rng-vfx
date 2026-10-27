# Unreal Engine (Niagara)

Unreal units are centimetres: gravity is about -980 cm/s^2 and sizes are 100x the metre values in other files.

Contents: niagara structure; useful modules; materials; brightness and exposure; erosion master material; renderer settings that matter; temporal anti-aliasing (tsr / taa); lights, decals, camera; scalability and budgets; authoring and timing; headless renders (no editor ui).

## Niagara structure

- **System** asset (what gameplay spawns) contains **Emitters**; each emitter has stacks: Emitter Spawn, Emitter Update, Particle Spawn, Particle Update, Event handlers, Render.
- One System per effect, one Emitter per layer (flash, sparks, smoke, ring). Offset layers in time with Spawn Burst Instantaneous `Spawn Time`, or with emitter `Loop Delay`.
- **User parameters** (`User.Color`, `User.Intensity`, `User.Direction`) are the interface to gameplay and Blueprints.
- **Renderers:** Sprite (facing modes, velocity-aligned for sparks), Mesh (debris, domes, slashes as meshes), Ribbon (trails), **Light renderer** (spawns lights from particles), Component renderer, Decal renderer (newer versions).
- **Sim target:** CPU for small counts, events and light renderers; GPU for large counts (set Fixed Bounds on GPU emitters or they cull wrongly).
- Determinism: enable `Determinism` on emitters and set a fixed random seed so renders and reviews repeat exactly.

## Useful modules

Add Velocity / Add Velocity in Cone, Gravity Force, Drag, Curl Noise Force, Vortex Velocity, Point Attraction Force, Collision (scene depth or distance field), Scale Sprite Size / Scale Color by curves, Sub UV Animation (flipbooks; its modes are Linear, Random, Infinite Loop and Direct Set; for held, stepped playback turn off Sub UV Blending on the Sprite Renderer), Shape Location (sphere, torus, cylinder, mesh), Generate Location Event / Death Event (secondary emitters), Dynamic Material Parameters (curves into the material).

**Niagara Data Channels** spawn many small identical effects (impacts, footsteps) from one system instead of one component per event.

## Materials

- Domain Surface, Blend Mode **Translucent** (alpha), **Additive**, or **Masked** (cutout); Shading Model **Unlit** for most VFX.
- Read `Particle Color` (driven by Niagara color), `Dynamic Parameter` (custom curves), `Particle Relative Time`, `Particle Random`.
- `DepthFade` for soft particles. `Fresnel`. `Panner`. `SubUV` / Flipbook functions with motion vectors for smooth sims.
- Distortion: Refraction input on a translucent material, or sample `SceneTexture:SceneColor` in a post-process style material.
- Material Instances per effect variant; keep one master material per technique (erosion master, slash master, fresnel master).
- Lit smoke: Translucent with Lighting Mode *Volumetric PerVertex Directional* (cheap) or *Surface ForwardShading* (accurate, expensive), or six-way lightmaps built in the material.

## Brightness and exposure

- **Lock exposure before tuning anything:** a Post Process Volume (unbound) with Metering Mode Manual, or Min EV100 = Max EV100. Auto exposure otherwise rescales every emissive value as the effect brightens the screen, and the effect tunes itself dimmer.
- **Bloom:**
  - The default threshold of -1 blooms everything slightly. Measure **B** as the emissive value where the halo becomes clearly visible at the locked exposure.
  - Write the levels from `../brightness.md` as multiples of it.
- **Tone mapping:** the filmic tonemapper desaturates bright reds toward pink and oranges toward yellow-white. Keep hot mid tones near B and check the hue at peak.

## Erosion master material

One master material, instanced per effect. Domain Surface, Unlit, Translucent (or Additive), two-sided for meshes.

- **Inputs:**
  - Particle Color (colour and an alpha multiplier).
  - Dynamic Parameter: index 0 `.x` erosion, `.y` emissive multiplier, `.z` distortion, `.w` free.
  - Particle Random for per-particle offsets.
- **Noise:** sample the noise texture twice with two Panners at different speeds and directions, scaled differently. Add them (dual pan).
- **Erosion:** `heat = (noise * mask - erosion) / softness`, where mask is the sprite's shape texture or a radial gradient window.
  - Opacity = `saturate(heat * k)`.
  - Colour = a Curve Atlas row or a gradient texture sampled at `1 - heat`.
- **Burn edge:** a second threshold slightly above erosion, multiplied by an HDR edge colour.
- **Soft particles:** `DepthFade` into opacity (fade distance 20 - 50 cm).
- **Camera fade:** `PixelDepth` near-plane fade so quads do not pop into the camera.

Niagara drives the Dynamic Parameter with curves over Normalized Age (Dynamic Material Parameters module).

## Renderer settings that matter

- **Sprite renderer:**
  - Facing Mode: Face Camera for most, Custom Facing Vector for ground-aligned quads.
  - Alignment: Velocity Aligned for sparks, so they stretch along motion with Scale Sprite Size by Speed.
  - Sub Image Size and Sub UV Blending for flipbooks.
  - Sort Mode: View Depth or View Distance for translucent smoke, None for additive.
- **Ribbon renderer:**
  - UV0 mode: Scaled Uniformly (fixed texture along the ribbon), Tiled Over Ribbon Length, or Tiled From Start Over Ribbon Length.
  - Tessellation for smooth curves on fast swings.
  - Width and colour from particle attributes, tapered at both ends.
- **Mesh renderer:** for domes, cones, slash meshes; Facing Mode Default or Velocity.
- **Sorting between systems:**
  - The Niagara component's Translucency Sort Priority (higher draws later).
  - The renderer's Sort Order Hint between emitters of one system.
  - Separate translucency (material: Translucency Pass "After DOF") keeps effects sharp when depth of field is on.

## Temporal anti-aliasing (TSR / TAA)

Temporal upscalers smear thin, fast, translucent things: sparks turn into faint ghost trails, and flipbook frames blend into each other.
- On spark and flash materials, enable **Responsive AA** (Translucency section). It reduces TSR/TAA history for those pixels.
- Enable **Output Velocity** on translucent materials (UE5, Translucency section) so TSR can reproject them instead of ghosting.
- Review strips with the project's real anti-aliasing on. A strip rendered without TSR hides the ghosting players will see.

## Lights, decals, camera

- Light renderer in Niagara (CPU emitters) or a Point Light component animated in a Blueprint or Sequencer.
- Decals: Decal Actor or component with a Deferred Decal material, fade parameter animated over time.
- Camera shake: Camera Shake Blueprint (Perlin or wave oscillator), triggered from gameplay or an Anim Notify.
- Hitstop: Custom Time Dilation on attacker and target actors for a few frames.
- Impact frame: post-process material blended in for 1 to 3 frames through a Post Process Volume weight or a material parameter collection.

## Scalability and budgets

- **Niagara Effect Types** (assets) set culling distance, max instances and significance per effect category. Assign every system to one.
- Per-emitter **Scalability** settings (detail levels) disable flavor emitters on low settings: sparks and motes off first, critical gameplay shapes never.
- Profile with the Niagara Debugger, `stat Niagara`, `stat GPU`, and the Shader Complexity view mode (overdraw).

## Authoring and timing

- Sequencer for multi-part effects and for review renders: Niagara track, light and decal tracks, camera.
- Anim Notifies (Play Niagara Effect, Timed Niagara Effect) bind effects to animation frames.
- Stepped (held) animation: Sub UV with Sub UV Blending off on the renderer, and quantize time in materials with `Floor(Time * 12) / 12`.

## Headless renders (no editor UI)

Render a review clip or frame sequence with **Movie Render Queue** from the command line. Create a small review level (ground, a character-sized capsule, the gameplay camera) with the effect in a Level Sequence and a Movie Pipeline config asset (output PNG or EXR sequence, resolution, warm-up frames), then:

```
UnrealEditor-Cmd.exe "C:/Proj/Proj.uproject" FxStand -game
  -LevelSequence="/Game/FX/Stand/LS_FxHit.LS_FxHit"
  -MoviePipelineConfig="/Game/FX/Stand/MRQ_FxStrip.MRQ_FxStrip"
  -windowed -resx=1280 -resy=720 -log -notexturestreaming
```

(One line in practice. `-LevelSequence` requires `-MoviePipelineConfig` pointing at a Primary Config preset; alternatively point `-MoviePipelineConfig` at a saved Queue asset and drop `-LevelSequence`. `-RenderOffscreen` can be added to render without showing a window on machines that support it.)

Set the sequence to the effect's duration, add a few warm-up frames in the config so GPU particles exist on frame 1, and enable determinism on the emitters so every render matches. Assemble frames with ffmpeg. Editor scripting for setup (placing the effect, creating the sequence) can be done with Python (`-ExecutePythonScript=setup.py`, Python Editor Script Plugin enabled).
