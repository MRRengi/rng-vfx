# Screen size

An effect that reads in a close-up can vanish at the gameplay camera. The rule is the minimums in `numbers.md` (primary shape 40 px, sparks 12 px, lines 2 px at 1080p). Enforce them in the vertex shader, not by hope.

## World size per pixel

For a perspective camera, the world size of one pixel at view depth `z` is:

```
worldPerPixel = 2 * tan(fov / 2) * z / screenHeightPx
```

Pass `2 * tan(fov / 2) / screenHeightPx` as a uniform (it changes only on resize or FOV change). Multiply by the particle's view depth in the vertex shader.

## Clamp in the vertex shader

```glsl
// view-space centre of the particle
vec4 mv = modelViewMatrix * vec4(center, 1.0);
float worldPerPx = -mv.z * uPxScale;           // uPxScale = 2 * tan(fov/2) / screenHeight
float size = max(sizeWorld, uMinPx * worldPerPx);

// Stretched streaks: clamp width and length separately.
float width = max(widthWorld, 2.0 * worldPerPx);
float len   = max(lenWorld, 12.0 * worldPerPx);
```

HLSL is the same. In Unity Shader Graph, get the view depth from the Position node (View space, negate z). In Unreal, get it from the PixelDepth or CameraVector length node in a vertex-shader custom node.

Clamp thin things too: a 0.01 m spark at 15 m is under a pixel and flickers. Clamp its width to 2 px and its length to 12 px, and lower its brightness slightly as the clamp kicks in. The spark then reads as a thin streak rather than a flickering dot.

## Engine traps

- **Unity Shuriken:** *Max Particle Size* defaults to 0.5, a fraction of the viewport. Big particles near the camera stop growing at half the screen. Raise it for large effects. *Min Particle Size* does the opposite clamp, in the same viewport units.
- **Unreal Niagara sprites:** there is no automatic pixel clamp. Compute it in the material's vertex shader (World Position Offset), or scale the sprite size in a module from the camera distance.
- **three.js points:** `gl_PointSize` is limited by hardware (often 64 - 256 px). Use instanced quads for anything large.

## Pixel art

Pixel effects do not scale continuously. They use the sprites' fixed pixels per metre and snap to that grid.
- If the gameplay camera shows the effect under 16 px in total, the effect is redrawn larger at the sprite resolution. It is never scaled up with filtering.
- Never mix pixel sizes: an effect rendered at a finer pixel grid than the sprites breaks the style.
