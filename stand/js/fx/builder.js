import * as THREE from 'three';
import * as P from './primitives.js';
import { curve } from './math.js';

// Builds one effect from its definition. Every layer gets a start time `at`
// (seconds) and is evaluated at local time t - at, so the whole effect is a
// pure function of the timeline.
export function buildEffect(def, scene) {
  const group = new THREE.Group();
  const layers = [];
  let shake = () => 0;
  let impact = () => 0;

  const add = (prim, at = 0) => { group.add(prim.object); layers.push({ prim, at }); return prim; };
  const fx = {
    ramp: P.ramp,
    burst: (o, at) => add(P.burst(o), at),
    flash: (o, at) => add(P.flash(o), at),
    ring: (o, at) => add(P.ring(o), at),
    slash: (o, at) => add(P.slash(o), at),
    decal: (o, at) => add(P.decal(o), at),
    light: (o, at) => add(P.light(o), at),
    shake: keys => { shake = curve(keys); },
    impactFrame: keys => { impact = curve(keys); },
  };
  def.build(fx);
  scene.add(group);

  return {
    group,
    duration: def.duration,
    update(t) {
      for (const { prim, at } of layers) {
        // A layer does not exist before its start time.
        prim.object.visible = t >= at;
        prim.update(t - at, t);
      }
    },
    shakeAt: t => shake(t),
    impactAt: t => impact(t),
    dispose() {
      scene.remove(group);
      for (const { prim } of layers) prim.dispose();
      for (const { prim } of layers) if (prim.object.material?.uniforms?.uRamp) prim.object.material.uniforms.uRamp.value?.dispose?.();
    },
  };
}
