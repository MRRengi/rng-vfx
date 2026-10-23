import * as THREE from 'three';
import * as P from './primitives.js';
import { curve } from './math.js';

// Builds one effect from its definition. Every layer gets a start time `at`
// (seconds) and is evaluated at local time t - at, so the whole effect is a
// pure function of the timeline.
export function buildEffect(def, scene, distortScene) {
  const group = new THREE.Group();
  const distortGroup = new THREE.Group();
  const layers = [];
  let shake = () => 0;
  let impact = () => 0;
  let exposure = () => 1;
  let target = null;

  const add = (prim, at = 0) => {
    (prim.scene === 'distort' ? distortGroup : group).add(prim.object);
    layers.push({ prim, at });
    return prim;
  };
  const fx = {
    ramp: P.ramp,
    burst: (o, at) => add(P.burst(o), at),
    flash: (o, at) => add(P.flash(o), at),
    ring: (o, at) => add(P.ring(o), at),
    slash: (o, at) => add(P.slash(o), at),
    decal: (o, at) => add(P.decal(o), at),
    distort: (o, at) => add(P.distort(o), at),
    light: (o, at) => add(P.light(o), at),
    shake: keys => { shake = curve(keys); },
    impactFrame: keys => { impact = curve(keys); },
    // Exposure multiplier over time: a short dip after a huge flash reads as
    // brightness without a white-out frame.
    exposure: keys => { exposure = curve(keys); },
    // Target reaction: the hit character flashes, gets a rim, shakes and leans.
    // flash: 0..1 curve of a solid colour flash; rim: 0..1 curve of a fresnel rim;
    // jolt: curve of shake amplitude (m); knock: curve of lean (radians) away from the hit.
    target: o => {
      target = {
        color: new THREE.Color(o.color || '#ffffff'),
        flash: curve(o.flash || [[0, 0]]),
        rim: curve(o.rim || [[0, 0]]),
        rimColor: new THREE.Color(o.rimColor || o.color || '#ffffff'),
        jolt: curve(o.jolt || [[0, 0]]),
        knock: curve(o.knock || [[0, 0]]),
        dir: new THREE.Vector3(...(o.dir || [1, 0, 0])).normalize(),
      };
    },
  };
  def.build(fx);
  scene.add(group);
  distortScene.add(distortGroup);

  return {
    group,
    duration: def.duration,
    contact: def.contact ?? 0,
    update(t) {
      for (const { prim, at } of layers) {
        // A layer does not exist before its start time.
        prim.object.visible = t >= at;
        prim.update(t - at, t);
      }
    },
    shakeAt: t => shake(t),
    impactAt: t => impact(t),
    exposureAt: t => exposure(t),
    targetAt: t => target && {
      color: target.color, flash: target.flash(t), rim: target.rim(t), rimColor: target.rimColor,
      jolt: target.jolt(t), knock: target.knock(t), dir: target.dir,
    },
    dispose() {
      scene.remove(group);
      distortScene.remove(distortGroup);
      for (const { prim } of layers) {
        prim.object.material?.uniforms?.uRamp?.value?.dispose?.();
        prim.dispose();
      }
    },
  };
}
