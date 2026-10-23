# Performance

The expensive part of VFX is **fill rate**: how many screen pixels get shaded, and how many times (overdraw). Particle counts and simulation are usually cheap in comparison, especially on the GPU.

## Budgets (starting points, adjust per project)

| Platform | Simultaneous effects on screen | Particles per typical effect | Overdraw target in effect area | Texture size per effect texture |
|---|---|---|---|---|
| High-end PC / console | 20 - 60 | 50 - 500 (GPU: thousands) | under 8 layers | up to 1024, flipbooks 2048 |
| Mid PC / Switch-class | 10 - 30 | 30 - 200 | under 5 | 512, flipbooks 1024 |
| Mobile | 5 - 15 | 10 - 80 | under 3 | 256, flipbooks 512 |
| WebGL (desktop browser) | 10 - 30 | 50 - 500 instanced | under 5 | 512 |

## Rules

- **Shrink quads to their content.** A soft glow texture that is 60% empty still costs 100% of its quad. Trim transparent borders, use tighter meshes (Unity: mesh particles or the sprite outline; Unreal: Cutout textures for sprites).
- **Big smoke is the usual offender.** Fewer, smaller, denser puffs; fade them before they grow huge; reduce count at distance.
- **Opaque or alpha-tested where possible.** Cel puffs, debris and pixel effects can be opaque with alpha clip: no blending cost, depth testing works.
- **Fewer materials, more variation in data.** One master material with per-particle parameters beats ten materials (draw calls, state changes).
- **Lights are expensive.** Few dynamic lights per effect (one is usually enough), short lifetimes, small radius, no shadows unless it is a hero moment.
- **Distortion and scene color reads** are a full-screen cost on some platforms; budget them for hero effects.
- **LOD and scalability.** Turn off flavor layers first (motes, secondary sparks), then reduce counts, then shorten lifetimes. Never remove the gameplay-critical layer.
- **Pool effects.** Spawning and destroying effect objects creates hitches. Reuse.
- **Bounds and culling.** Correct bounds let the engine skip off-screen effects; wrong bounds either waste or make effects pop.

## How to measure

- Unity: Scene view Overdraw mode, Rendering Debugger, Frame Debugger, Profiler (GPU module).
- Unreal: Shader Complexity view mode, Quad Overdraw, `stat GPU`, `stat Niagara`, Niagara Debugger.
- three.js: `renderer.info` (draw calls, triangles), browser performance panel, Spector.js for frame capture.
- Test the worst case: the maximum number of effects the game can trigger at once, at the closest camera distance, on the weakest target device.
