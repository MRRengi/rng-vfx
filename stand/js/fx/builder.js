import * as THREE from 'three';
import * as P from './primitives.js';
import { curve } from './math.js';

// Builds one effect from its definition. Every layer gets a start time `at`
// (seconds) and is evaluated at local time t - at, so the whole effect is a
// pure function of the timeline.
export function buildEffect(def, scene, distortScene, celScene, overScene, fps = 0) {
  const group = new THREE.Group();
  const overGroup = new THREE.Group();
  const distortGroup = new THREE.Group();
  const celGroup = new THREE.Group();
  let hold = null;
  let solo = null;
  let celOutline = { color: new THREE.Color('#1a1630'), px: 2.5 };
  const layers = [];
  let shake = () => 0;
  let impact = () => 0;
  let exposure = () => 1;
  let target = null;

  const add = (prim, at = 0) => {
    const additive = prim.object.material?.blending === THREE.AdditiveBlending;
    (prim.scene === 'distort' ? distortGroup : prim.scene === 'cel' ? celGroup : additive && overScene ? overGroup : group).add(prim.object);
    layers.push({ prim, at, kind: kindOf });
    return prim;
  };
  let kindOf = '';
  const k = (name, fn) => (o, at) => { kindOf = name + (o.shape ? ':' + o.shape : ''); return add(fn(o), at); };
  const fx = {
    ramp: P.ramp,
    burst: k('burst', P.burst),
    trail: k('trail', P.trail),
    flash: k('flash', P.flash),
    ring: k('ring', P.ring),
    slash: k('slash', P.slash),
    decal: k('decal', P.decal),
    distort: k('distort', P.distort),
    light: k('light', P.light),
    shake: keys => { shake = curve(keys); },
    impactFrame: keys => { impact = curve(keys); },
    // Exposure multiplier over time: a short dip after a huge flash reads as
    // brightness without a white-out frame.
    exposure: keys => { exposure = curve(keys); },
    // Hitstop: the effect's layers freeze for `frames` (at 60 fps) after `at`;
    // camera, shake and target reaction keep running on real time.
    hitstop: (at, frames) => { hold = { at, dur: frames / 60 }; },
    // One outline around the union of all cel layers of this effect.
    celOutline: (color, px = 2.5) => { celOutline = { color: new THREE.Color(color), px }; },
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
        squash: curve(o.squash || [[0, 0]]),
        dir: new THREE.Vector3(...(o.dir || [1, 0, 0])).normalize(),
      };
    },
  };
  def.build(fx);
  scene.add(group);
  distortScene.add(distortGroup);
  celScene.add(celGroup);
  overScene?.add(overGroup);
  const remap = t => (!hold || t <= hold.at ? t : t < hold.at + hold.dur ? hold.at : t - hold.dur);

  // Lead-in: effects whose contact is at 0 get a few empty frames in front, so
  // strips and checks see what comes before contact. Held-drawing styles lead by one
  // whole drawing, so contact stays on the drawing grid.
  const lead = def.lead ?? ((def.contact ?? 0) < 0.01 ? (fps ? 1 / fps : 0.05) : 0);
  return {
    group,
    duration: def.duration + lead,
    contact: (def.contact ?? 0) + lead,
    celGroup,
    overGroup,
    celOutline: () => celOutline,
    // Layer census: solo one layer (index) or null for all. Used to prove every
    // layer actually renders; a layer that never shows is a bug, not tuning.
    layers: () => layers.map((l, i) => ({ i, kind: l.kind, at: l.at })),
    probes: () => layers.filter(l => l.prim.probe).map(l => ({ kind: l.kind, at: l.at, ...l.prim.probe() })),
    targetDir: () => target ? target.dir.toArray() : null,
    solo: i => { solo = i; },
    update(tIn) {
      const tReal = tIn - lead;
      // Hitstop freezes only what was already playing before contact (the
      // anticipation, the swing). Layers born at or after contact run on real
      // time, so the spark blooms through the hold and lands with the reaction.
      layers.forEach(({ prim, at, kind }, i) => {
        // Slashes freeze 2 frames at most: a held slash reads as a sticker.
        const t = hold && at >= hold.at - 1e-4 ? tReal
          : kind === 'slash' && hold ? (tReal <= hold.at ? tReal : Math.max(hold.at, tReal - 2 / 60))
          : remap(tReal);
        prim.object.visible = tReal >= 0 && t >= at && (solo === null || solo === i || (Array.isArray(solo) && solo.includes(i)));
        prim.update(t - at, t);
      });
    },
    shakeAt: t => (t < lead ? 0 : shake(t - lead)),
    impactAt: t => (t < lead ? 0 : impact(t - lead)),
    exposureAt: t => (t < lead ? 1 : exposure(t - lead)),
    targetAt: tIn => { const t = tIn - lead; return t < 0 ? null : target && {
      color: target.color, flash: target.flash(t), rim: target.rim(t), rimColor: target.rimColor,
      jolt: target.jolt(t), knock: target.knock(t), squash: target.squash(t), dir: target.dir,
    }; },
    dispose() {
      scene.remove(group);
      distortScene.remove(distortGroup);
      celScene.remove(celGroup);
      overScene?.remove(overGroup);
      for (const { prim } of layers) {
        prim.object.material?.uniforms?.uRamp?.value?.dispose?.();
        prim.dispose();
      }
    },
  };
}
