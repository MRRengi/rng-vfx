# Slash

A slash shows the path the blade took. Placed by hand with rotation angles, it drifts into vertical or edge-on arcs that float beside the target. Build it from the swing.

## Source 1: the weapon's path (preferred)

When the attack has an animation, the slash is the surface swept by the blade.

1. **Sample.** Read the blade's base and tip positions every 1/60 s across the active frames of the attack clip, in the character's local space.
   - Unity: in an editor script, sample the clip at each t with `AnimationMode.StartAnimationMode()` + `AnimationMode.SampleAnimationClip(character, clip, t)` (works for Humanoid and Generic clips; `clip.SampleAnimation` does not drive Humanoid retargeting correctly), then read `bladeBase.position` and `bladeTip.position` (two empty transforms parented to the weapon) and call `AnimationMode.StopAnimationMode()` at the end. A `PlayableGraph` with an `AnimationClipPlayable` evaluated per t also works.
   - Unreal: give the weapon two sockets. In Niagara, a ribbon emitter can follow the tip socket at runtime. To bake the shape, sample `GetSocketLocation` per frame from an editor utility.
   - Blender: put two empties on the blade and export their per-frame positions.
2. **Smooth.** Resample the two paths with Catmull-Rom splines to 24 - 32 evenly spaced samples over the swing. Raw samples at 60 Hz give a faceted arc on fast swings.
3. **Build a strip.** Two vertices per sample (base, tip).
   - U goes along the swing from 0 (start) to 1 (end of swing). V goes from 0 at the base to 1 at the tip.
   - Store the sample's time in U, so the shader can reveal the strip in step with the animation.
4. **Shade.** See Shading below. The strip is static geometry; a head parameter moves along U.

The result follows the real swing, crosses the target exactly where the weapon does, and stays in sync if the animation changes, once it is re-baked.

## Source 2: no animation

Build the arc from intent, never from Euler angles.

- **Inputs:**
  - `swing`: the direction the blade travels at contact (world space).
  - `normal`: the swing plane's normal.
  - `C`: the target's centre of mass.
  - `R`: radius, about arm plus blade length (1.0 - 1.6 m for a sword).
  - `span`: the arc angle, 120 - 200 degrees.
- **Placement:**
  - The arc's midpoint lies within 0.15 m of C.
  - The arc's centre is therefore `C - R * radial`, where `radial` is the in-plane direction perpendicular to `swing`.
- **Orientation:**
  - Most melee swings run diagonally, 20 - 50 degrees from horizontal.
  - Horizontal is for sweeps, vertical for overheads only.
  - The plane is seen at least 30 degrees off edge-on from the gameplay camera.
- **Size:** the chord is at least 1.3x the target's width, so the slash reads as passing through the body, not touching it.
- **Curvature reads as direction.** The visible band is what the eye reads, not the swing vector at its midpoint. A small radius with a long span curls the band's far half steeply down and the slash reads vertical, even with a diagonal `swing`. Without an animation path, keep `R` at 1.1 - 1.3x the character's height and the visible span at 80 - 110 degrees for a diagonal cut; widen the span only for full spins. Judge the angle on the strip from the gameplay camera: the line from the band's start to its end should sit 20 - 50 degrees from horizontal.
- **Secondary arcs** share the main arc's centre (concentric) at 0.85x and 1.1x its radius; placing each one through the hit point on its own makes them cross in an X.

```js
// three.js: orient an arc mesh (built in its local XY plane, angles a0 -> a1) by intent.
function orientSlash(mesh, a0, a1, swing, normal) {
  const am = (a0 + a1) / 2, sg = Math.sign(a1 - a0) || 1;
  const u = new THREE.Vector3(-Math.sin(am) * sg, Math.cos(am) * sg, 0); // local tangent at the midpoint
  const ez = new THREE.Vector3(0, 0, 1);
  const n = new THREE.Vector3(...normal).normalize();
  const t = new THREE.Vector3(...swing); t.addScaledVector(n, -t.dot(n)).normalize();
  const L = new THREE.Matrix4().makeBasis(u, new THREE.Vector3().crossVectors(ez, u), ez);
  const W = new THREE.Matrix4().makeBasis(t, new THREE.Vector3().crossVectors(n, t), n);
  mesh.quaternion.setFromRotationMatrix(W.multiply(L.transpose()));
}
```

**Mandatory check:** project the arc's midpoint to the screen through the gameplay camera. It must fall inside the target's screen silhouette. If it does not, the slash misses, however good it looks.

## Shape: thickness profile

A slash is not a uniform tube. Its silhouette carries the speed.

- **Width along the visible band** (from the head back toward the tail):
  - Rises from a rounded point at the head to its maximum at 20 - 35% behind the head.
  - Maximum width is 0.12 - 0.18 of the arc radius: a 1.3 m arc is 0.16 - 0.23 m thick at its widest. Thicker reads as a banana, thinner as a scratch.
  - Tapers with a smoothstep to zero at the tail.
- **Across the band:**
  - The outer edge (the blade's tip side) is sharp: anti-aliasing only, no soft falloff.
  - The inner edge is soft: the last 30% of the width fades.
  - The core band (brightest colour) is 15 - 25% of the width and hugs the outer edge.
- **After contact,** head and tail move monotonically with outQuad or linear curves, never inQuad (an ease-in after contact reads as a hold, then a jump).
- **Mechanical checks:**
  - After the 2-frame hold, the slash mask changes by more than 3% of its pixels every frame until it is gone.
  - At contact, the projected arc midpoint lies inside the target's screen bounding box.
  - The arc ends above the ground or tapers to zero before touching it: an arc cut by the floor shows a straight edge.

## Shading

- **Reveal:**
  - A head value moves along U from 0 to 1 over 2 - 4 frames before contact (the swing).
  - A tail follows at a fixed lag (tail length 0.5 - 0.8 of the arc), so the visible band is `head - tail < U < head`.
  - Head timing comes from the animation, or from `numbers.md` for the style.
- **Width:**
  - Full near the head.
  - Tapers to zero toward the tail and toward both ends of the arc.
  - Closes to a rounded tip at the head (`width *= sqrt(saturate(tl / 0.05))`, where tl is the normalized position behind the head). A straight cut at the head is the quad showing.
- **Colour:**
  - The core sits toward the tip edge (V near 1): white-hot or the style's core colour, at 0.9 - 1.3 B.
  - It grades to the edge colour toward the base.
  - A thin rim lies on the outer silhouette only.
- **Dissolve:**
  - Erosion only in the tail half (`threshold = dissolve * smoothstep(0.45, 1.0, tl)`).
  - A burn band of 0.04 - 0.08 above the threshold.
  - Never holes in the body: on additive slashes they show the background as black holes, on alpha slashes they get outlined.
- **Secondary arcs:** 1 - 2 thinner arcs at 0.85x and 1.1x radius, a frame behind, lower alpha. They give the swing volume.
- **Hitstop:**
  - The slash freezes for 2 frames at most, then keeps wiping.
  - The spark and the target reaction carry the hitstop.

## Per engine

- **Unity:**
  - Baked strip mesh with a Shader Graph material (U and V from UV0, head and tail as material properties driven by a script or Timeline).
  - At runtime: a VFX Graph *Output ParticleStrip* following the tip, or Shuriken *Trails* in Ribbon mode.
- **Unreal:**
  - Static mesh strip with a material (head and tail from a Dynamic Parameter or Material Parameter Collection).
  - Or a Niagara *Ribbon* renderer following the tip socket. Its UV mode decides whether erosion textures stretch or tile: use *Scaled Uniformly* for a fixed-shape slash texture.
- **three.js:** `BufferGeometry` strip with a `ShaderMaterial`. The stand's `slash()` primitive takes `swing` and `normal` instead of `rot`.
