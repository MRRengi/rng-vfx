import { HIT, HIT_LIGHT, HIT_DIR, BLAST, UP, AWAY, at } from './layout.js';

// Toon / cartoon. Full frame rate, round friendly shapes that pop in with
// overshoot, hold, then shrink away. Clustered puffs share one thick outline.
// Small broken rings, a dust skirt on the ground, a bouncy target.
export default {
  id: 'toon',
  name: 'Toon',
  blurb: 'Pop-in with overshoot, clustered two-tone puffs with one outline that shrink out, broken rings, dust skirt, bouncy target.',
  look: { fps: 0, tone: 'neutral', bloom: { strength: 0.12, threshold: 1.6, radius: 0.15 } },
  effects: {
    impact: {
      duration: 1.1,
      contact: 0,
      build(fx) {
        fx.hitstop(0.02, 3);
        fx.celOutline('#2b2b55', 3);
        fx.flash({
          pos: HIT, size: 1.2, hard: true, spikes: 4, spikeLen: 0.8, core: 0.45, sharp: 1.0, jitter: 0.3,
          dir: HIT_DIR, aspect: 1.6, core_color: '#fffbd0', coreK: 1.0, edge_color: '#ffc62e', edgeK: 1.0, rot: 0.3, order: 0,
          scaleCurve: [[0, 0], [0.06, 1.12, 'outBack'], [0.1, 1], [0.16, 1.05], [0.24, 0, 'inQuad']],
          alphaCurve: [[0, 1], [0.24, 1], [0.241, 0]],
        }, 0);
        fx.ring({
          billboard: true, pos: HIT, size: 1.7, hard: true, noise: 0, blend: 'alpha', coverage: 0.6, seed: 3,
          color: '#ffffff', colorK: 1, color2: '#2b2b55', color2K: 1,
          radius: [[0, 0.5], [0.22, 0.8, 'outBack']], width: [[0, 0.05], [0.22, 0.0, 'inQuad']],
          alpha: [[0, 1], [0.21, 1], [0.22, 0]],
        }, 0.05);
        for (const [axis, seed] of [[[1, 0.7, 0.1], 11], [[1, -0.25, 0.5], 12], [[0.6, 0.35, -0.7], 13]]) {
          fx.burst({
            shape: 'puff', cel: true, dir: 'cone', axis, angle: 18, count: 5, seed, origin: HIT, spawnR: 0.05, speed: [3, 3.6], drag: 6,
            life: [0.5, 0.65], size: [0.55, 0.04], sizePow: 2.2, sizeIn: 0.14, sizeRand: 0.35, bands: 1, outline: 0,
            shadow: '#b6c2ff', erode: 0, noiseScale: 1.6, blend: 'alpha', fadeDist: 0.05,
            ramp: fx.ramp([[0, '#ffffff', 1], [1, '#f2f4ff', 1]]),
          }, 0.03);
        }
        fx.burst({
          shape: 'sparkle', soft: 100, dir: 'cone', axis: HIT_DIR, angle: 70, count: 7, origin: HIT, speed: [3, 5], drag: 4,
          gravity: [0, -3, 0], life: [0.45, 0.6], size: [0.38, 0.15], sizePow: 1.5, sizeIn: 0.2, spin: 4, fade: [0, 1],
          ramp: fx.ramp([[0, '#fff38a', 1.1], [1, '#ff8ad8', 1.0]]),
        }, 0.04);
        fx.target({
          dir: HIT_DIR, color: '#fff3c0', rimColor: '#ffd84a',
          flash: [[0, 1], [0.033, 1], [0.034, 0]],
          rim: [[0, 0], [0.034, 1], [0.3, 0]],
          knock: [[0, 0], [0.06, 0.2, 'outQuad'], [0.4, -0.05, 'inOutSine'], [0.6, 0, 'inOutSine']],
        });
        fx.light({ pos: HIT_LIGHT, color: '#fff0b0', distance: 4, intensity: [[0, 0], [0.02, 5], [0.4, 0]] });
        fx.shake([[0, 0.05], [0.22, 0, 'outQuad']]);
      },
    },
    explosion: {
      duration: 2.0,
      contact: 0,
      build(fx) {
        const C = at(BLAST, 0, 0.5, 0);
        fx.celOutline('#3a1e3a', 3);
        // Short pop disc under the puffs, smaller than the fireball.
        fx.flash({
          pos: C, size: 1.6, hard: true, spikes: 0, spikeLen: 0, core: 0.9, depthTest: true, order: 0,
          core_color: '#ffffff', coreK: 1.0, edge_color: '#fff2a8', edgeK: 1.0,
          scaleCurve: [[0, 0], [0.05, 1, 'outBack'], [0.085, 0, 'inQuad']],
          alphaCurve: [[0, 1], [0.085, 1], [0.086, 0]],
        }, 0);
        fx.burst({
          shape: 'puff', cel: true, dir: 'cone', axis: UP, angle: 60, count: 12, sizeDist: [3, 5, 4], origin: C, spawnR: 0.3,
          speed: [3, 5], drag: 6, life: [0.55, 0.8], size: [1.25, 0.08], sizePow: 2.5, sizeIn: 0.12, bands: 1, outline: 0,
          shadow: '#dd6f5c', erode: 0, noiseScale: 1.4, blend: 'alpha', fadeDist: 0.05,
          ramp: fx.ramp([[0, '#fff3b0', 1.05], [0.3, '#ffb627', 1.0], [1, '#ff5e3a', 1]]),
        }, 0.02);
        fx.burst({
          shape: 'puff', cel: true, dir: 'cone', axis: UP, angle: 40, count: 10, sizeDist: [3, 4, 3], origin: at(C, 0, 0.6, 0), spawnR: 0.5,
          speed: [1.5, 2.5], gravity: [0, 1.5, 0], drag: 3, delay: [0, 0.08], life: [0.8, 1.2], size: [1.4, 0.08],
          sizePow: 2.5, sizeIn: 0.12, bands: 1, outline: 0, shadow: '#9aa2e6', erode: 0, noiseScale: 1.4,
          blend: 'alpha', fadeDist: 0.05, ramp: fx.ramp([[0, '#ffffff', 1], [1, '#d8dcff', 1]]),
        }, 0.12);
        for (const [delay, seed, speed] of [[0.03, 21, [6, 8]], [0.1, 22, [4, 5]]]) {
          fx.burst({
            shape: 'puff', cel: true, dir: 'ring', lift: 0.05, count: 14, seed, origin: at(BLAST, 0, 0.2, 0), speed, drag: 6,
            life: [0.45, 0.6], size: [0.6, 0.0], sizePow: 2, sizeIn: 0.15, bands: 1, outline: 0,
            shadow: '#b6c2ff', erode: 0, noiseScale: 1.4, blend: 'alpha', ground: 0, fadeDist: 0.05,
            ramp: fx.ramp([[0, '#ffffff', 1], [1, '#eef0ff', 1]]),
          }, delay);
        }
        fx.burst({
          shape: 'sparkle', soft: 100, dir: 'hemi', count: 8, origin: C, speed: [5, 8], drag: 1.5,
          gravity: [0, -9, 0], life: [0.7, 1.0], size: [0.42, 0.2], sizeIn: 0.15, spin: 6, fade: [0, 1],
          ramp: fx.ramp([[0, '#fff7a0', 1.1], [1, '#ffd000', 1.0]]),
        }, 0.05);
        fx.target({
          dir: AWAY, color: '#fff3c0', rimColor: '#ffb627',
          flash: [[0, 0], [0.04, 1], [0.073, 1], [0.074, 0]],
          knock: [[0, 0], [0.08, 0.25, 'outQuad'], [0.45, -0.06, 'inOutSine'], [0.7, 0, 'inOutSine']],
        });
        fx.light({ pos: C, color: '#ffd38a', distance: 8, shadow: true, intensity: [[0, 0], [0.03, 18], [0.6, 0]] });
        fx.shake([[0, 0.1], [0.4, 0, 'outQuad']]);
      },
    },
  },
};
