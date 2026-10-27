# three.js (WebGL / WebGPU)

Contents: approaches; materials and blending; shapes in the fragment shader; pixel-size clamps; post-processing; determinism and frame capture; performance.

## Approaches

| Approach | When |
|---|---|
| **Closed-form instanced bursts**: `InstancedBufferGeometry` + `ShaderMaterial`, each instance's position solved in the vertex shader from its age and per-instance random attributes | hits, explosions, bursts; zero CPU per frame and exactly scrubbable |
| **CPU particle pool**: typed arrays into one `InstancedMesh` | continuous emitters with collisions or gameplay interaction, up to a few thousand |
| **GPGPU**: `GPUComputationRenderer` ping-pong textures, or WebGPU compute with TSL | tens of thousands of particles, fluids |
| **Meshes with `ShaderMaterial`** | slashes, rings, domes, beams, ground cracks, decals |

Use instanced quads, not `Points`: points cannot rotate or stretch along velocity. Closed-form motion (`../physics.md` > Closed form, Sparks) makes trails cheap too: place ribbon segment i at `motion(age - i / N * trailTime)`.

**Winding trap:** a quad built from a custom basis (velocity-stretched sparks with `right = perp(velocity)`) must keep `det(right, up) > 0`, or set `side: THREE.DoubleSide`; a mirrored basis flips the winding and back-face culling silently removes every instance. `perp = vec2(ax.y, -ax.x)` with `up = ax` is correct.

## Materials and blending

- `ShaderMaterial` with `transparent: true`, `depthWrite: false`. Additive: `blending: THREE.AdditiveBlending`. Alpha: `NormalBlending`. Premultiplied (fire): `CustomBlending` with `blendSrc = OneFactor`, `blendDst = OneMinusSrcAlphaFactor`, and multiply rgb by alpha in the shader.
- `frustumCulled = false` for instanced effects whose vertices move in the shader, or set a correct bounding sphere.
- `renderOrder` sorts transparent objects: smoke and dust first, additive light after. three.js sorts objects, not instances: for alpha-blended bursts, compute each instance's position on the CPU with the same formula, sort by view depth, and write the draw order into an index attribute each frame.
- Colour management: `new THREE.Color('#ff6a1f')` converts from sRGB to linear. Ramps baked into a `FloatType` or `HalfFloatType` `DataTexture` keep values above 1 for the core. Grayscale data textures (life maps, masks) use `NoColorSpace`.
- Soft particles: render the opaque scene's depth into a `DepthTexture` and fade where the effect meets geometry: `alpha *= clamp((sceneDepth - fragDepth) / 0.3, 0.0, 1.0)` with linearized depths.
- Hit flash on the target: patch its material in `onBeforeCompile`, after `#include <color_fragment>`: `diffuseColor.rgb = mix(diffuseColor.rgb, uFlashCol, uFlash);`. Emissive only adds light and turns dark tints pink or white. Rim: `pow(1.0 - dot(N, V), 4.0) * 0.3` at most.
- Lit smoke without baked lighting: a normal from the density gradient (two offset taps of the puff's density function) or a sphere normal per puff, `wrap = (dot(N, L) + 0.5) / 1.5`, plus the fire's light from below while it burns.

## Shapes in the fragment shader

Build silhouettes as signed distance functions on the quad's UV (`../shapes.md` > Foundations):

```glsl
// Crescent: the difference of two circles, thick at one end through the offset.
float sdCircle(vec2 p, float r) { return length(p) - r; }
float crescent(vec2 p, float r, float offset, float inner) {
  return max(sdCircle(p, r), -sdCircle(p - vec2(offset, 0.0), inner));
}
// Star polygon with straight edges: fold the angle into one tip-to-valley wedge.
float sdStar(vec2 p, float rOuter, float rInner, float n) {
  float a = atan(p.y, p.x), w = 3.14159265 / n;
  a = abs(mod(a + w, 2.0 * w) - w);
  vec2 q = length(p) * vec2(cos(a), sin(a));
  vec2 tip = vec2(rOuter, 0.0), valley = rInner * vec2(cos(w), sin(w));
  vec2 e = valley - tip, d = q - tip;
  float h = clamp(dot(d, e) / dot(e, e), 0.0, 1.0);
  float s = sign(e.y * d.x - e.x * d.y);
  return length(d - e * h) * s;   // negative inside
}
```

Edge: `alpha = 1.0 - smoothstep(-aa, aa, dist)` with `aa = fwidth(dist)` for a crisp, resolution-independent edge; for cel looks step the bands on the distance or heat value. Break the edge with low-amplitude fbm added to `dist`, not by multiplying alpha with noise. A slash is an arc strip mesh whose midpoint sits on the impact point; orient its plane toward the camera (`../shapes.md` > Slash) and drive the head and tail reveal with the strip's U coordinate.

## Pixel-size clamps

Thin elements disappear at distance. In the vertex shader compute world units per pixel at the instance's depth and clamp the width:

```glsl
float worldPerPx = -mvPosition.z * 2.0 * tan(fovY * 0.5) / viewportHeight;  // perspective camera
float width = max(uWidth, uMinPx * worldPerPx);                             // e.g. uMinPx = 3.0
```

## Post-processing

- `EffectComposer` → `RenderPass` → distortion pass → `UnrealBloomPass` → effect passes on linear HDR (impact frame) → `OutputPass` (tone mapping and sRGB) → display-space passes (palette reduction for pixel art).
- Bloom: `UnrealBloomPass(resolution, strength, radius, threshold)` compares linear luminance with the threshold and has a hard knee; raise `bloomPass.highPassUniforms.smoothWidth.value` to about 0.15x the threshold. Start with strength 0.2 - 0.4 and a threshold above every body colour (`../brightness.md`). Keep a switch to disable bloom for the review pass.
- Distortion: render distortion meshes (rings, heat) into a half-resolution `HalfFloatType` target as signed UV offsets, and offset the scene colour lookup by it in a `ShaderPass`.
- Tone mapping: `renderer.toneMapping = THREE.AgXToneMapping` for realism, `NeutralToneMapping` for stylized looks that must keep hue.
- `ShaderPass` clones its uniforms and cannot clone render-target textures: assign those after creating the pass.
- Pixel art: render at low resolution (`renderer.setPixelRatio` and `setSize(w / px, h / px, false)` with CSS `image-rendering: pixelated`) and snap positions to the pixel grid.

## Determinism and frame capture

- Seed every random value (a small xorshift) and drive everything from one effect time, so `seek(t)` renders the same frame every time. Quantize time for held drawings: `floor(t * fps) / fps`.
- Expose a small API on `window` so a headless browser can render frame strips: `fx.duration`, `fx.contact`, `fx.pause()`, `fx.seek(t)`, `fx.play()`, `fx.setCamera('gameplay' | 'close')`, and `fx.setBloom(on)` for the bloom-off review. `scripts/capture_strip.py` uses it.
- Headless Chromium renders WebGL with SwiftShader (`--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`): fine for correctness, not for performance.

## Performance

- One draw call per layer with instancing; no mesh per particle; no allocations per frame (reuse vectors, update uniforms in place).
- Overdraw dominates on mobile GPUs: few big transparent quads, discard fully transparent fragments, trim quads to their content.
- Half-float render targets for HDR, not full float.
