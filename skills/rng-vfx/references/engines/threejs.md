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

## Materials and blending

- `ShaderMaterial` with `transparent: true`, `depthWrite: false`; `blending: THREE.AdditiveBlending` for light, `NormalBlending` for smoke. Premultiplied alpha: `premultipliedAlpha: true` and `CustomBlending` with `OneFactor` / `OneMinusSrcAlphaFactor`, and multiply rgb by alpha in the shader.
- `side: THREE.DoubleSide` for flat meshes; `frustumCulled = false` for instanced effects whose vertices move in the shader (or set a correct bounding sphere).
- `renderOrder` controls draw order between transparent objects: dark smoke first, additive glows after.
- Color management: three converts hex colors from sRGB to linear (`new THREE.Color('#ff6a1f')`). Ramps built as Float textures keep HDR values above 1 for bloom.
- Soft particles: render a depth texture (`WebGLRenderTarget` with `depthTexture`) and compare in the fragment shader.

## Post-processing

- `EffectComposer` with `RenderPass`, `UnrealBloomPass`, custom `ShaderPass`es and `OutputPass` (applies tone mapping and sRGB). Put custom effect passes (impact frame) before `OutputPass` if they work on linear HDR, after it if they work on display values (palette reduction).
- Tone mapping: `renderer.toneMapping = THREE.AgXToneMapping` (filmic) or `NeutralToneMapping` (stylized).
- The `postprocessing` library by pmndrs is a faster alternative (merged passes, SelectiveBloom, depth effects).
- Pixel style: render at low resolution (`renderer.setSize(w / px, h / px, false)` with CSS `image-rendering: pixelated`) and posterize at the end.

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
