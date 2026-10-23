# three.js (WebGL / WebGPU)

The stand in this repository (`stand/`) is a working reference for everything below: instanced GPU bursts with closed-form motion, flash / ring / slash / decal shaders, bloom, an impact frame pass and a palette pass.

## Approaches

| Approach | When |
|---|---|
| **Closed-form instanced bursts** (InstancedBufferGeometry + ShaderMaterial, motion solved in the vertex shader from age) | hits, explosions, bursts: zero CPU per frame, perfectly scrubbable |
| **CPU particle pool** (typed arrays, one InstancedMesh or Points draw) | continuous emitters with collisions or gameplay interaction, up to a few thousand |
| **GPGPU** (GPUComputationRenderer ping-pong textures, or WebGPU compute with TSL) | tens of thousands of particles, fluids, flocking |
| **three.quarks** (open-source particle library with Unity-like modules and an editor) | teams that want an authoring UI and familiar emitter modules |
| **Meshes with ShaderMaterial** | slashes, rings, domes, beams, shields, decals |

Points (`gl_PointSize`) are simplest but cannot rotate or stretch along velocity and have size limits; prefer instanced quads.

**Winding trap:** when the vertex shader builds a quad from a custom basis (velocity-stretched sparks: `right = perp(velocity)`, `up = velocity`), keep `det(right, up) > 0` or set `side: THREE.DoubleSide`. A mirrored basis flips the triangle winding and the default back-face culling silently removes every instance: no error, the layer just never appears. `perp = vec2(ax.y, -ax.x)` with `up = ax` is correct; `vec2(-ax.y, ax.x)` is mirrored.

**Flipbook sprites** for designed shapes (anime sparks, pixel hits, drawn fire): a quad sampling a sprite sheet with `frame = floor(age01 * frames)`, UV = cell offset + uv / grid, no blending between frames for anime and pixel (stepped), frame blending or motion vectors for realism. Without a flipbook path every style ends up drawn with the same procedural shapes.

## Materials and blending

- `ShaderMaterial` with `transparent: true`, `depthWrite: false`; `blending: THREE.AdditiveBlending` for light, `NormalBlending` for smoke. Premultiplied alpha: `premultipliedAlpha: true` and `CustomBlending` with `OneFactor` / `OneMinusSrcAlphaFactor`, and multiply rgb by alpha in the shader.
- `side: THREE.DoubleSide` for flat meshes; `frustumCulled = false` for instanced effects whose vertices move in the shader (or set a correct bounding sphere).
- `renderOrder` controls draw order between transparent objects: dark smoke first, additive glows after.
- Color management: three converts hex colors from sRGB to linear (`new THREE.Color('#ff6a1f')`). Ramps built as Float textures keep HDR values above 1 for bloom.
- Soft particles: render a depth texture (`WebGLRenderTarget` with `depthTexture`) and compare in the fragment shader. See the pipeline below.

## Post-processing

- `EffectComposer` with `RenderPass`, `UnrealBloomPass`, custom `ShaderPass`es and `OutputPass` (applies tone mapping and sRGB). Put custom effect passes (impact frame) before `OutputPass` if they work on linear HDR, after it if they work on display values (palette reduction).
- Tone mapping: `renderer.toneMapping = THREE.AgXToneMapping` (filmic) or `NeutralToneMapping` (stylized).
- The `postprocessing` library by pmndrs is a faster alternative (merged passes, SelectiveBloom, depth effects).
- Pixel style: render at low resolution (`renderer.setSize(w / px, h / px, false)` with CSS `image-rendering: pixelated`) and posterize at the end.

## The frame pipeline (what the stand does)

1. **Opaque depth prepass.** Hide the effect group, set `scene.overrideMaterial` to a `MeshBasicMaterial({ colorWrite: false })`, render into a target with a `DepthTexture` the same size as the composer's render target. Effects read it: `alpha *= clamp((sceneDepth - fragDepth) / 0.3, 0, 1)` with both depths linearized from `near` / `far`.
2. **Distortion buffer.** Distortion meshes live in their own scene and write signed UV offsets (`gl_FragColor = vec4(offset, 0, 1)`, additive) into a `HalfFloatType` target at half resolution, cleared to zero each frame.
3. **Composer:** `RenderPass` -> distortion `ShaderPass` (sample the colour at `uv + offset`) -> cel pass (the cel scene rendered to its own target, union outline, laid over the image) -> additive pass (additive layers rendered to their own target over a copy of the opaque depth, then added, so cel puffs never cover sparks and sparks still pass behind the character) -> `UnrealBloomPass` -> custom effect passes on linear HDR (impact frame) -> `OutputPass` (tone mapping, sRGB) -> display-space passes (palette).
4. **Shared uniforms.** One object holding the noise texture, depth texture, resolution, near / far, world-units-per-pixel and the key light direction in view space, spread into every effect material so they update once per frame. Note: `ShaderPass` clones its uniforms and cannot clone render-target textures; assign those after creating the pass.
5. **Pixel mode:** a low-res drawing buffer with CSS `image-rendering: pixelated`, palette mapping at the end, flat floor.

### Hit flash that can darken

`emissive` only adds light, so a dark tint (dark fantasy's deep crimson) comes out pink. Lerp the albedo instead: in `onBeforeCompile`, after `#include <color_fragment>`, `diffuseColor.rgb = mix(diffuseColor.rgb, uFlashCol, uFlash)`; add a little emissive only for bright flash colours. Rim: `pow(1 - N.V, 4)` at 0.3 or less; with a lower exponent a thin capsule reads as a full-body tint.

### Sorting instances

Three.js sorts objects, not instances. For alpha-blended bursts (smoke, cel puffs, blood) with closed-form motion, evaluate each instance's position on the CPU (the same formula as the vertex shader, 60 instances is nothing), sort by view depth, and write the order into an instanced index attribute each frame; or split a large burst into a few depth-sorted sub-meshes. Additive layers need no sorting.

### Lit smoke (six-way)

Six-way lightmaps store how a smoke frame is lit from +X, -X, +Y, -Y, +Z and -Z in two RGBA textures (EmberGen and Houdini export them). In the fragment shader transform the light direction into the particle's billboard basis and weight the six channels by its components: `lit = dot(max(L, 0), posXYZ) + dot(max(-L, 0), negXYZ)`, then add the explosion's own light the same way from its direction. Cheaper fallback: a normal from the density gradient (two offset texture taps) and a wrap-lit `N.L`.

### Flipbooks

A sheet is a grid of frames (4x4 at 256 px per cell is enough for most bodies). Pick the frame from the particle's normalized age, `frame = floor(age01 * frames)`, optionally stepped (no blend between frames, for hand-drawn sheets) or blended between two frames for smoke. Load sheets once, share the texture across materials, `colorSpace = SRGBColorSpace`, mipmaps on, clamp to edge, and leave half a texel of padding at cell borders or neighbours bleed in. Randomize the start frame and flip per particle so a burst of 20 does not play the same drawing in sync. The stand's `shape: 'sheet'` uses `sheet: { url, grid: [4, 4], frames: 16, stepped }`.

### Ribbon trails from the closed form

When motion is a closed-form function of time, a trail needs no history buffer: build a strip of N segments per particle and place segment i at `motion(age - i / N * trailTime)`. The ribbon bends with gravity and drag for free, stays deterministic and scrubbable, and costs one instanced draw. Expand each vertex across the screen-space tangent (perpendicular to the projected segment direction), keep the width at least 2 px, taper toward the tail, and make the head 2x brighter. Use them for the hero subset of sparks, not all of them.

## The stand's primitive parameters

The stand's effect definitions (`stand/js/styles/*.js`) use these names; the general rules they implement live in `fundamentals.md` and `numbers.md`:
- `fade: [in, out]` is the opacity-over-life window. Keep ramp alpha nearly constant and let `fade` own the fade-out, e.g. `[0.05, 0.75]`.
- `sizeIn` is the fraction of life spent popping in.
- `coreK` / `K` in ramp stops is the HDR multiplier. With the stand's bloom threshold of about 1.0-1.4, B is about 1.2.
- `occlusion` on premultiplied fire is how much a hot pixel blocks what is behind it. Keep it at 0.75 or more so overlapping quads do not sum to white.
- `swing` and `normal` on `slash()` orient the arc by intent (`recipes/slash.md`).
- `dragQ` on `burst()` is quadratic drag for sparks (`physics.md` > Sparks).

## Determinism and review

- Seed every random value (a small xorshift is enough) and drive everything from a single effect time. Then any frame can be rendered on demand: scrubbing, frame strips and automated checks become trivial.
- Quantize the effect time for held drawings: `floor(t * fps) / fps`.
- Expose a small API on `window` (select, seek, capture) so headless browsers can render frame strips; the stand's `window.rngStand` is an example.

## Performance

- One draw call per layer with instancing; avoid one mesh per particle.
- Overdraw dominates on mobile GPUs: keep big transparent quads few, discard fully transparent fragments, shrink smoke quads to their content.
- Use half-float render targets for HDR (`HalfFloatType`), not full float.
- Avoid allocations per frame (no new Vector3 in the loop); update uniforms in place.
- Test on a mid-range phone; desktop SwiftShader (software) renders are useful for correctness, not for performance.

## WebGPU

`three/webgpu` with TSL (three shading language) supports compute shaders for particle simulation and node-based materials. Use it when targeting modern browsers and needing large GPU simulations; keep a WebGL fallback for wide reach.
