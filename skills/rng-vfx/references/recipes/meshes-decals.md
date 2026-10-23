# Mesh effects and decals

Billboards cannot make every shape. Shockwave cones, domes, beams, tornadoes and ground shocks are meshes with scrolling, eroding materials. Scorches, cracks and splats are decals.

## Mesh kit

| Mesh | Used for | UV convention | Notes |
|---|---|---|---|
| Cone (open, 24 - 32 sides) | muzzle blasts, directional shock, jet | U around, V from tip (0) to rim (1) | scale along its axis over life; erode from the rim |
| Dome / hemisphere | shields, explosion shock dome, impact bubble | U around, V from pole (0) to equator (1) | fresnel edge plus distortion; scale with outExpo |
| Cylinder (open) | beams, pillars of light, rising columns | U around, V along the length | scroll V for flow; fade both ends with vertex colour alpha |
| Twisted cylinder | tornado, vortex, spiral aura | as cylinder, with vertices rotated by `twist * v` | radius larger at the top; scroll U and V |
| Ring strip (flat annulus) | ground shock, ripple, magic circle edge | U around, V from inner (0) to outer (1) radius | keep V for the band profile, U for breaks and noise |
| Swept strip | slashes, trails, swirls | U along the sweep, V across | see `slash.md` |
| Crossed quads (2 - 3 planes) | sparks or flames seen from all sides | standard 0..1 per plane | cheap volume for small elements |

Rules:
- **Vertex colour alpha** fades edges that must not show a hard line: the ends of beams, the rim of a cone, the open edge of a dome.
- **UV2** holds a per-mesh random or a gradient when the material needs both a scroll and a fixed mask.
- **Scroll speeds** come in pairs at different rates and directions (as in `shaders.md` > dual pan). A single scroll reads as a texture sliding over a mesh.
- **Silhouette breaks.** Erode with a noise or a life map so the mesh outline never reads as geometry.

Generating them:
- **three.js:**
  - `CylinderGeometry(rTop, rBottom, h, radial, heightSeg, openEnded=true)` for cones and cylinders.
  - `SphereGeometry` with `thetaLength = PI / 2` for domes.
  - `RingGeometry` for strips; remap its UVs to (angle, radius), since the default UVs are planar.
  - Twist by rotating each vertex by `twist * (y / h)` around the axis.
- **Unity:** build in an editor script with the `Mesh` API (vertices, uv, colors, triangles), or use ProBuilder. Save as an asset.
- **Unreal:** model in Blender, or use Geometry Script (procedural mesh in editor utilities).
- **Blender:** a cylinder with a Simple Deform (Twist) modifier, a UV unwrap following the convention above, and vertex paint for alpha.

## Decals

| Engine | How |
|---|---|
| three.js | `DecalGeometry` (examples/jsm/geometries) projects onto meshes. On flat ground, a plane slightly above it with `polygonOffset` and `depthWrite: false` is enough. |
| Unity URP | Decal Projector component; requires the Decal renderer feature on the URP renderer. Material uses a Decal shader (Shader Graph target: Decal). |
| Unity HDRP | Decal Projector with an HDRP Decal material; enable decals in the HDRP asset. |
| Unreal | Material Domain: Deferred Decal, applied with a Decal component; DBuffer decals (project setting) let decals affect lit surfaces correctly. |

Recipes:
- **Scorch.**
  - Darken the ground; do not paint over it. Multiply blending (or a DBuffer base colour multiply), so the ground's texture stays visible.
  - Add radial ejecta streaks: `pow(noise(angle * 24, r * 0.5), 6) * (1 - r)`.
  - Add a noise-broken outer edge.
  - Optional: a hot glow that cools over 1 - 2 s.
- **Cracks.**
  - Polar-log Voronoi edges, wrapped in angle (`shaders.md` > §19).
  - Revealed from the centre over the anticipation.
  - Glow cools unevenly per cell.
- **Splat.**
  - A thresholded warped blob plus satellite drops, hard edged, darker than the source fluid.
  - Revealed over 2 - 4 frames as the drops land.

A scorch drawn as an alpha-blended dark disc reads as a hole in the ground, never as burned ground.
