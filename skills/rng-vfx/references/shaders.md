# Shader technique catalog

Snippets are GLSL-flavoured pseudocode; HLSL is the same with `lerp`, `frac`, `saturate`. The node table at the end maps each technique to Unity Shader Graph and Unreal Material nodes.

Most effect shaders are a handful of these combined. Feed per-particle data (normalized age, random seed, custom values) into the shader so one material serves many particles with variation.

## 1. Particle data in the shader

Always pass at least:
- `age01` (0 at birth, 1 at death): drives erosion, color, size.
- `seed` (0..1 random per particle): offsets noise UVs and picks variants.
- Optional: a custom float animated by a curve (erosion amount, glow amount) so artists time the shader from the particle system.

Unity: Custom Vertex Streams (Shuriken) or VFX Graph output attributes. Unreal: Dynamic Parameter and Particle Relative Time / Particle Random nodes.

## 2. Panning and dual-noise

```
vec2 uvA = uv * scaleA + time * speedA;
vec2 uvB = uv * scaleB + time * speedB;   // different direction and speed
float n = texture(noise, uvA).r * texture(noise, uvB).r * 2.0;
```

Two noises moving at different speeds and directions break visible repetition. Multiply by a shape mask so the result stays inside the silhouette.

## 3. UV distortion

```
vec2 offs = (texture(noise, uv * s + time * v).rg - 0.5) * strength;
vec4 c = texture(mainTex, uv + offs);
```

Gives wobble and organic motion to clean shapes (flames, magic). Mask the distortion strength toward the edges if the shape must keep a clean silhouette.

## 4. Erosion (dissolve)

```
float n = noiseValue;                 // 0..1, from texture or procedural
float threshold = erodeCurve(age01);  // 0 at birth, 1 at death
float soft = 0.05;
float alpha = smoothstep(threshold, threshold + soft, n);
// hard version: alpha = step(threshold, n);
// edge glow: color band just above the threshold
float edge = smoothstep(threshold, threshold + edgeWidth, n) - alpha;
col.rgb += edgeColor * edge;
```

The single most important effect technique. Variants:
- **Erosion by shape:** multiply the noise by a radial mask (`1 - r`) before thresholding so the effect erodes from the edges inward.
- **Heat erosion (gradient-mapped):** `heat = (n * mask - threshold) / softness`; color = ramp(1 - heat); alpha = saturate(heat * k). One noise gives shape, color and dissipation. Used for stylized and realistic fire on the stand.
- **Hole erosion:** a second noise opens holes inside a shape while the silhouette stays: anime and toon smoke.

## 5. Gradient map (ramp)

Store color in a 1D ramp texture or gradient and index it by a scalar: grayscale value, heat, age, distance from center. Lets a grayscale texture take any palette and keeps palettes consistent across effects. Ramps with HDR values (above 1) drive bloom selectively.

## 6. Step shading (toon and anime)

```
float shade = dot(N, L);                    // N from mesh or fake sphere from UV
float band = floor(shade * bands) / bands;  // or step() for 2 tones
col = mix(shadowColor, litColor, band);
```

Fake sphere normal for a billboard puff: `q = (uv - 0.5) * 2; N = normalize(vec3(q, sqrt(1 - dot(q, q))))`. Outline: color the region where the distorted silhouette distance is below a width.

## 7. Fresnel / rim

```
float f = pow(1.0 - saturate(dot(N, V)), power);
```

Shields, energy shells, buff outlines, holograms. Combine with a scrolling noise for energy and with depth fade for intersection glow.

## 8. Polar coordinates

```
vec2 c = uv * 2.0 - 1.0;
float r = length(c);
float a = atan(c.y, c.x) / 6.2832 + 0.5;
vec2 polar = vec2(a, r);
```

Turns linear textures into rings, radial bursts, swirls (add `r * twist` to `a`), portals and magic circles. Radial speed lines: noise sampled by angle, stretched by radius. Ring: `abs(r - radius) < width`.

## 9. Soft particles (depth fade)

```
float sceneDepth = linearEyeDepth(depthTexture, screenUV);
float fade = saturate((sceneDepth - fragmentDepth) / fadeDistance);
alpha *= fade;
```

Removes hard intersection lines where particles cut the ground or walls. Mandatory for smoke, dust and fire near geometry.

## 10. Flipbooks

- Frame index from age: `frame = floor(age01 * frameCount)`; UV = cell offset + uv / grid.
- **Frame blending:** sample current and next frame and lerp by the fraction. Cheap smoothing but ghosts.
- **Motion vector blending:** sample a motion vector texture and warp both frames toward each other before blending. Lets a 16-frame sim play smoothly over 2 seconds. Engines support this natively (Unreal SubUV with motion vectors, Unity VFX Graph flipbook blending with motion vectors).
- Stylized and anime flipbooks often play **without** blending, stepped.

## 11. Vertex offset

Displace mesh vertices in the shader: `pos += normal * noise(pos + time) * amount`. Wobbly shockwave domes, pulsing auras, waving flags of energy, tendrils. Use vertex color or UV to mask which vertices move.

## 12. Screen-space distortion

Render a distortion pass (or sample the opaque scene color texture) and offset the screen UV by a noise normal masked by the effect shape:

```
vec2 screenUV = gl_FragCoord.xy / resolution;
vec2 n = texture(noiseNormal, uv).xy * 2.0 - 1.0;
vec3 behind = texture(sceneColor, screenUV + n * strength * mask).rgb;
```

Heat haze, shockwaves, invisibility, magic portals. Unity URP: Scene Color node with the Opaque Texture enabled. Unreal: Refraction or the Scene Texture: SceneColor in a translucent material. three.js: render the scene to a target first, then sample it.

## 13. Signed distance shapes

Procedural masks without textures:
- circle `r - radius`, ring `abs(r - radius) - width`
- star with spikes `r - (core + len * pow(abs(cos(a * n / 2)), sharp))`
- line segment distance for lightning and beams
- smooth union (`smin`) for blob shapes

Antialias with `fwidth`: `alpha = saturate(0.5 - d / fwidth(d))`.

## 14. Dithered transparency

Compare alpha against a 4x4 or 8x8 Bayer matrix value for the pixel; discard below. Opaque rendering (no sorting problems, depth writes) with a transparent look. Pixel art dissolves and stylized dissolves on opaque meshes.

## 15. Flow maps

A 2-channel texture of directions; scroll the main texture along it with two phase-offset samples blended to hide the reset:

```
float ph0 = fract(time * speed), ph1 = fract(time * speed + 0.5);
vec4 a = texture(tex, uv + flow * ph0), b = texture(tex, uv + flow * ph1);
vec4 c = mix(a, b, abs(0.5 - ph0) * 2.0);
```

Directed swirls (lava, portals, magic that flows around a shape) without simulation.

## 16. Premultiplied alpha

`color.rgb *= alpha` in the shader with blend `One, OneMinusSrcAlpha`. One material can then be additive in some areas (alpha 0 with color) and occluding in others: a fire with a dark smoky edge and a glowing core in one particle. Cuts the number of materials and draw calls.

## Node map

| Technique | Unity Shader Graph | Unreal Material Editor |
|---|---|---|
| Particle age / random | Custom vertex streams via UV channels, VFX Graph `Age over Lifetime` | Particle Relative Time, Particle Random, Dynamic Parameter |
| Panning | Tiling And Offset + Time | Panner |
| UV distortion | Sample Texture 2D into Tiling And Offset | Texture Sample into UVs (add) |
| Erosion | Step / Smoothstep, Alpha Clip Threshold | SmoothStep, Opacity Mask, Dither Temporal AA off |
| Gradient map | Sample Gradient, or Sample Texture 2D on a ramp | Texture Sample on a ramp, CurveAtlasRowParameter |
| Step shading | Posterize, Step | Floor / Step material functions |
| Fresnel | Fresnel Effect | Fresnel |
| Polar | Polar Coordinates | VectorToRadialValue, RadialGradientExponential |
| Soft particles | Scene Depth - Screen Position w | DepthFade |
| Flipbook | Flipbook node | SubUV / Flipbook material function |
| Vertex offset | Position input of the vertex stage | World Position Offset |
| Distortion | Scene Color (Opaque Texture on) | Refraction / SceneTexture: SceneColor |
| Dither | Dither node | DitherTemporalAA |
| Flow map | custom subgraph | FlowMaps material function |
