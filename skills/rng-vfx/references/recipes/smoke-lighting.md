# Smoke lighting

Unlit smoke looks like flat cardboard: a single colour cut out by an alpha shape. Real smoke is lit by the sun, the sky, the ground and, near an explosion, by its own fire. It also lets light through at thin edges. These terms are cheap. Use all of them for realism and dark fantasy, and the first three for stylized painted smoke.

## The terms

```glsl
// density: 0..1 from the noise or the flipbook's density channel.
// L: light direction in the particle's billboard space (view space works for camera-facing quads).
// V: view direction (0, 0, 1) in view space.

// 1. Opacity from density (Beer-Lambert): thin parts stay soft, the core goes opaque.
float alpha = 1.0 - exp(-density * 3.0);

// 2. A normal from the density gradient: two taps offset toward +x and +y.
float dx = densityAt(uv + vec2(e, 0.0)) - density;
float dy = densityAt(uv + vec2(0.0, e)) - density;
vec3 N = normalize(vec3(-dx, -dy, 0.25));          // e about 1/64 of the sprite

// 3. Wrap lighting: light wraps around the puff instead of a hard terminator.
float w = 0.5;
float diffuse = clamp((dot(N, L) + w) / (1.0 + w), 0.0, 1.0);

// 4. Ambient from sky and ground: tops pick up the sky, bottoms the ground.
vec3 ambient = mix(groundColor, skyColor, N.y * 0.5 + 0.5);

// 5. Back light: thin edges glow when the sun is behind the smoke.
float back = pow(max(dot(V, -L), 0.0), 4.0) * (1.0 - density) * 0.6;

// 6. Fire light from below: strongest at the bottom of the column, gone by a third of its height.
vec3 fire = fireColor * fireIntensity(t) * clamp(1.0 - h / (0.3 * H), 0.0, 1.0);

vec3 col = albedo * (sunColor * (diffuse + back) + ambient) + fire;
```

`h` is the particle's height above the fire's base and `H` is the column height. `fireIntensity(t)` follows the explosion's light curve, so the glow dies with the fire.

Values:
- **Smoke albedo:** 0.15 - 0.35 for black smoke, 0.5 - 0.7 for dust. Never pure black: black smoke on a dark level vanishes. Give it a value floor, the back light and the fire light.
- **Ambient:** about 30% of the sun, so the shadow side is never empty.
- **Hot rim:** where fire sits behind smoke, a thin hot rim at the density edge (`pow(1 - density, 3)` masked to where density > 0) reads better than a uniform orange tint.

## Six-way lighting (baked data)

When the flipbook comes with six lightmaps (lit from +X, -X, +Y, -Y, +Z, -Z), weight them by the light direction in the sprite's space:

```glsl
vec3 Lp = max(L, 0.0), Ln = max(-L, 0.0);
float lit = dot(Lp, vec3(posX, posY, posZ)) + dot(Ln, vec3(negX, negY, negZ));
```

Pack the six maps into two RGBA textures (RGB = +X +Y +Z, RGB = -X -Y -Z, alpha = density). Add the explosion's own light the same way from its direction.
- **Unity:** VFX Graph has a six-way smoke output.
- **Unreal:** build it in the particle material. Sample both textures, transform the light vector into the sprite's tangent space (or use the Niagara sprite's facing axes passed as Dynamic Parameters), and weight the channels as above.
- **three.js:** implement the formula in the fragment shader.

## Self-shadow without data

For procedural smoke: sample the density a little toward the light (`uv + L.xy * 0.035`) and darken by the difference. That gives a cheap self-shadow on the side away from the sun. It is the minimum. Add the gradient normal and wrap lighting when the smoke is a hero layer.
