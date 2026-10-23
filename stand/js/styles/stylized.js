import { RING_N, HIT, HIT_LIGHT, HIT_DIR, BLAST, UP, AWAY, at } from './layout.js';

// Stylized / hand-painted (MOBA and hero-shooter school). Full frame rate,
// clear value hierarchy, gradient-mapped erosion of large-feature texture
// noise, a slash that crosses the target with a burning dissolve edge,
// distortion plus a thin edge for shocks, painted smoke lit by its fire.
export default {
  id: 'stylized',
  name: 'Stylized',
  blurb: 'Value hierarchy, eroding texture noise through ramps, slash across the target with burn edge, distortion shock, fire-lit painted smoke.',
  look: { fps: 0, tone: 'neutral', bloom: { strength: 0.3, threshold: 1.4, radius: 0.2 } },
  effects: {
    impact: {
      duration: 0.7,
      contact: 0.08,
      build(fx) {
        fx.hitstop(0.08, 4);
        fx.slash({
          pos: at(HIT, -0.15, 0.1, 0.2), swing: [0.85, -0.45, -0.15], normal: [0.25, 0.4, 1], scale: 1.15, from: 150, to: 0, rIn: 1.15, rOut: 1.42, torn: 0.15,
          coreColor: '#e6dcff', coreK: 1.2, edgeColor: '#6a3cff', edgeK: 1.0, noise: 0.25, dissolve: 0.7,
          burnColor: '#d9ccff', burnK: 1.6, burnW: 0.06,
          head: [[0, 0], [0.08, 1, 'outQuart'], [0.22, 1.7]], alpha: [[0, 1], [0.12, 1], [0.22, 0]], tail: 0.7,
        }, 0);
        // Secondary arcs: thinner, offset, a frame behind; they give the swing volume.
        fx.slash({
          pos: at(HIT, -0.15, 0.1, 0.2), swing: [0.85, -0.45, -0.15], normal: [0.25, 0.4, 1], scale: 1.15, from: 140, to: 10, rIn: 1.58, rOut: 1.68, torn: 0.3,
          coreColor: '#d9ccff', coreK: 1.1, edgeColor: '#6a4cff', edgeK: 1.0, noise: 0.35, dissolve: 0.8,
          head: [[0, 0], [0.08, 1, 'outQuart'], [0.2, 1.6]], alpha: [[0, 0.8], [0.14, 0.8], [0.2, 0]], tail: 0.5,
        }, 0.017);
        fx.slash({
          pos: at(HIT, -0.15, 0.1, 0.2), swing: [0.85, -0.45, -0.15], normal: [0.25, 0.4, 1], scale: 1.15, from: 160, to: 10, rIn: 0.55, rOut: 0.63, torn: 0.3,
          coreColor: '#bfaeff', coreK: 1.0, edgeColor: '#4b2bd1', edgeK: 0.9, noise: 0.4, dissolve: 0.8,
          head: [[0, 0], [0.09, 1, 'outQuart'], [0.2, 1.5]], alpha: [[0, 0.7], [0.13, 0.7], [0.19, 0]], tail: 0.45,
        }, 0.033);
        fx.flash({
          pos: HIT, size: 0.9, spikes: 4, spikeLen: 0.9, core: 0.2, sharp: 2, soft: 4, rot: 0.4,
          dir: HIT_DIR, aspect: 1.8, core_color: '#ffffff', coreK: 1.3, edge_color: '#8e7bff', edgeK: 1.1,
          scaleCurve: [[0, 0.4], [0.03, 1, 'outExpo'], [0.09, 0.7]], alphaCurve: [[0, 1], [0.05, 1], [0.09, 0]],
        }, 0.08);
        fx.ring({
          normal: RING_N, pos: HIT, size: 1.0, soft: 0.02, noise: 0.5, noiseFreq: 4, edge: 1.2, coverage: 0.55, aspect: 1.5, seed: 7,
          color: '#d7ceff', colorK: 1.0, color2: '#6a4cff', color2K: 0.6,
          radius: [[0, 0.3], [0.22, 0.95, 'outExpo']], width: [[0, 0.025], [0.22, 0.0, 'outQuad']],
          alpha: [[0, 0.5], [0.22, 0]], erode: [[0, 0], [0.05, 0], [0.2, 0.6]],
        }, 0.12);
        fx.distort({ kind: 'ring', billboard: true, pos: HIT, size: 3.2, radius: [[0, 0.2], [0.3, 0.9, 'outExpo']], width: [[0, 0.12], [0.3, 0.05]], strength: [[0, 0.0113], [0.3, 0]] }, 0.08);
        fx.burst({
          shape: 'streak', dir: 'cone', axis: HIT_DIR, angle: 40, count: 30, origin: HIT, speed: [5, 10], gravity: [0, -9, 0],
          dragQ: 1.0, life: [0.35, 0.65], stretch: 0.08, size: [0.08, 0.02], soft: 1.2, ground: 0, bounce: 0.3,
          ramp: fx.ramp([[0, '#ffffff', 2.0], [0.4, '#a48bff', 1.4], [1, '#4b2bd1', 1.0]]),
        }, 0.08);
        fx.burst({
          shape: 'glow', dir: 'cone', axis: HIT_DIR, angle: 80, count: 16, sizeDist: [2, 5, 9], origin: HIT, spawnR: 0.3,
          speed: [0.6, 1.6], drag: 2, gravity: [0, 0.6, 0], curl: 0.5, delay: [0, 0.1], life: [0.4, 0.7],
          size: [0.18, 0.04], soft: 2, ramp: fx.ramp([[0, '#d5c9ff', 1.6], [1, '#5a37ff', 1.0]]),
        }, 0.08);
        fx.burst({
          shape: 'smoke', dir: 'cone', axis: HIT_DIR, angle: 70, count: 6, origin: HIT, spawnR: 0.2, speed: [0.6, 1.4], drag: 3,
          gravity: [0, 0.5, 0], delay: [0, 0.05], life: [0.6, 0.75], size: [0.8, 1.6], sizePow: 0.35,
          shadow: '#3a3060', noiseScale: 3, erode: 0.3, blend: 'alpha', order: -1, fade: [0.08, 0.75],
          ramp: fx.ramp([[0, '#7a68b8', 1, 0.9], [0.7, '#5a4a90', 1, 0.85], [1, '#3a3060', 1, 0]]),
        }, 0.08);
        fx.target({
          dir: HIT_DIR, color: '#c9bbff', rimColor: '#8e7bff',
          flash: [[0, 0], [0.079, 0], [0.08, 0.2], [0.113, 0.2], [0.114, 0]],
          rim: [[0, 0], [0.114, 1], [0.18, 0]],
          jolt: [[0, 0], [0.08, 0.04], [0.25, 0]],
          knock: [[0, 0], [0.08, 0], [0.13, 0.1, 'outQuad'], [0.6, 0, 'inOutSine']],
          squash: [[0, 0], [0.08, 0], [0.11, 0.7], [0.3, 0, 'outQuad']],
        });
        fx.light({ pos: HIT_LIGHT, color: '#a48bff', distance: 2.5, intensity: [[0, 0], [0.08, 0], [0.09, 3], [0.2, 0, 'outQuad']] });
        fx.shake([[0, 0], [0.08, 0], [0.09, 0.07], [0.35, 0, 'outQuad']]);
      },
    },
    explosion: {
      duration: 2.0,
      contact: 0,
      build(fx) {
        const C = at(BLAST, 0, 0.5, 0);
        const fireK = [[0, 1.2], [0.6, 0.6], [1.6, 0, 'outQuad']];
        fx.flash({
          pos: C, size: 1.8, spikes: 0, spikeLen: 0, core: 0.8, soft: 4,
          core_color: '#fff4dd', coreK: 1.5, edge_color: '#ff9a3c', edgeK: 1.2,
          scaleCurve: [[0, 0.4], [0.04, 1, 'outExpo']], alphaCurve: [[0, 1], [0.04, 1], [0.08, 0]],
        }, 0);
        fx.exposure([[0, 1], [0.03, 0.75], [0.4, 1, 'outQuad']]);
        fx.burst({
          // Painted fire: big noise features, three flat heat bands with hard edges.
          shape: 'fire', dir: 'cone', axis: UP, angle: 40, count: 7, sizeDist: [2, 4, 1], origin: C, spawnR: 0.35,
          speed: [3, 6], drag: 3.5, gravity: [0, 0.8, 0], life: [0.8, 1.1], size: [2.0, 3.0], sizePow: 0.5, aspectY: 1.25, upright: true,
          soft: 0.8, erode: 1, noiseScale: 1.6, vBias: 0.25, poster: 3, blend: 'premul', order: 3, fadeDist: 0.4,
          ramp: fx.ramp([[0, '#fff6c8', 1.3], [0.33, '#ffc23a', 1.1], [0.66, '#ff6a1f', 1.0], [0.9, '#a8261e', 0.9], [1, '#3b0f0f', 1]]),
        }, 0.02);
        // Stem: the fireball connects to the ground.
        fx.burst({
          shape: 'fire', dir: 'cone', axis: UP, angle: 15, count: 4, seed: 61, origin: at(BLAST, 0, 0.1, 0), spawnR: 0.2,
          speed: [3, 4.5], drag: 3.5, gravity: [0, 0.8, 0], life: [0.9, 1.1], size: [1.0, 1.5], aspectY: 1.4, upright: true,
          soft: 0.8, erode: 1, noiseScale: 1.6, vBias: 0.3, poster: 3, blend: 'premul', order: 4, fadeDist: 0.3,
          ramp: fx.ramp([[0, '#fffbe0', 1.5], [0.3, '#ffd34d', 1.3], [0.6, '#ff6a1f', 1.0], [1, '#3b0f0f', 1]]),
        }, 0.02);
        fx.burst({
          shape: 'smoke', dir: 'cone', axis: UP, angle: 45, count: 12, sizeDist: [3, 6, 3], origin: at(C, 0, 0.3, 0), spawnR: 0.5,
          speed: [1, 2], gravity: [0, 1.3, 0], drag: 2, delay: [0.1, 0.12], life: [2.2, 2.8], size: [1.4, 2.8], sizePow: 0.35,
          shadow: '#7a6a80', noiseScale: 2.5, erode: 0.3, blend: 'alpha', order: 2, fade: [0.06, 0.75], fadeDist: 0.4,
          fireGlow: { color: '#ff7a2a', intensity: 1.0, height: 2.0, rim: 0.5, k: fireK },
          ramp: fx.ramp([[0, '#4a3a52', 1, 0.92], [0.7, '#3a3042', 1, 0.88], [1, '#2a2430', 1, 0]]),
        }, 0.02);
        fx.burst({
          shape: 'streak', dir: 'hemi', count: 30, origin: C, speed: [6, 14], gravity: [0, -10, 0], dragQ: 0.3,
          life: [0.6, 1.2], stretch: 0.05, size: [0.07, 0.02], soft: 1.2, ground: 0, bounce: 0.3,
          ramp: fx.ramp([[0, '#ffffff', 2.0], [0.3, '#ffd36b', 1.4], [1, '#ff5a1f', 1.0]]),
        }, 0.02);
        fx.burst({
          shape: 'glow', dir: 'hemi', count: 26, sizeDist: [2, 6, 12], origin: C, spawnR: 0.8, speed: [1, 3], gravity: [0, 1.2, 0],
          drag: 1.5, curl: 0.9, delay: [0.1, 0.5], life: [1, 1.9], size: [0.1, 0.03], soft: 2,
          ramp: fx.ramp([[0, '#ffd28a', 1.6], [1, '#ff4a12', 1.0]]),
        }, 0.02);
        fx.ring({
          pos: at(BLAST, 0, 0.04, 0), size: 2.6, soft: 0.02, noise: 0.6, noiseFreq: 6, edge: 1.5, coverage: 0.45, seed: 4,
          color: '#ffe0b0', colorK: 1.0, color2: '#ff8a3c', color2K: 0.5,
          radius: [[0, 0.05], [0.45, 0.95, 'outExpo']], width: [[0, 0.015], [0.45, 0.0, 'outQuad']],
          alpha: [[0, 0.15], [0.45, 0]],
        }, 0.02);
        fx.distort({ kind: 'ring', pos: at(BLAST, 0, 0.05, 0), size: 9, radius: [[0, 0.05], [0.6, 0.95, 'outExpo']], width: [[0, 0.1], [0.6, 0.04]], strength: [[0, 0.0135], [0.6, 0]] }, 0.02);
        fx.distort({ kind: 'heat', pos: at(C, 0, 1.2, 0), size: 4, strength: [[0, 0.012], [1.5, 0.006], [2.6, 0]] }, 0.05);
        fx.decal({ pos: at(BLAST, 0, 0.012, 0), size: 3.6, multiply: true, strength: 0.45, hot: '#ff6a1f', hotK: 1.4, dark: '#100a08', glow: [[0, 1], [1.6, 0, 'outQuad']] }, 0.02);
        fx.target({
          dir: AWAY, color: '#ffd8a8', rimColor: '#ff9a4a',
          rim: [[0, 0], [0.05, 1], [0.7, 0]],
          jolt: [[0, 0.04], [0.3, 0]],
          knock: [[0, 0], [0.08, 0.14, 'outQuad'], [0.8, 0, 'inOutSine']],
        });
        fx.light({ pos: C, color: '#ff9a4a', distance: 10, shadow: true, flicker: 0.2, intensity: [[0, 0], [0.02, 40], [1.4, 0, 'outQuad']] });
        fx.shake([[0, 0.16], [0.8, 0, 'outQuad']]);
      },
    },
  },
};
