import { RING_N, HIT, HIT_LIGHT, HIT_DIR, BLAST, UP, AWAY, at } from './layout.js';

// Stylized / hand-painted (MOBA and hero-shooter school). Full frame rate,
// clear value hierarchy, gradient-mapped erosion of large-feature texture
// noise, a held slash with a burning dissolve edge, distortion instead of
// soft "pancake" shockwaves, smoke lit by its own fire.
export default {
  id: 'stylized',
  name: 'Stylized',
  blurb: 'Value hierarchy, eroding texture noise through ramps, held slash with burn edge, distortion shock, fire-lit smoke.',
  look: { fps: 0, tone: 'neutral', bloom: { strength: 0.45, threshold: 1.15, radius: 0.25 } },
  effects: {
    impact: {
      duration: 1.2,
      contact: 0.08,
      build(fx) {
        fx.slash({
          pos: at(HIT, 0, 0, 0.25), rot: [-0.25, 0.25, 0.15], scale: 0.95, from: 150, to: -35, rIn: 0.85, rOut: 1.45,
          coreColor: '#ffffff', coreK: 2.2, edgeColor: '#7b5cff', edgeK: 1.3, noise: 0.25, dissolve: 0.7,
          burnColor: '#d9ccff', burnK: 2.2, burnW: 0.06,
          head: [[0, 0], [0.08, 1, 'outQuart'], [0.14, 1.05], [0.34, 1.7, 'inQuad']], alpha: [[0, 1], [0.3, 1], [0.36, 0]], tail: 0.7,
        }, 0);
        fx.flash({
          pos: HIT, size: 1.1, spikes: 4, spikeLen: 0.9, core: 0.2, sharp: 6, soft: 4, rot: 0.4,
          dir: HIT_DIR, aspect: 1.8, core_color: '#ffffff', coreK: 2.5, edge_color: '#8e7bff', edgeK: 1.2,
          scaleCurve: [[0, 0.4], [0.03, 1, 'outExpo'], [0.09, 0.7]], alphaCurve: [[0, 1], [0.05, 1], [0.09, 0]],
        }, 0.08);
        fx.ring({
          normal: RING_N, pos: HIT, size: 2.8, soft: 0.05, noise: 0.8, noiseFreq: 4, edge: 1.5,
          color: '#d7ceff', colorK: 1.1, color2: '#6a4cff', color2K: 0.9,
          radius: [[0, 0.3], [0.3, 0.92, 'outExpo']], width: [[0, 0.07], [0.3, 0.0, 'outQuad']],
          alpha: [[0, 0.8], [0.3, 0]], erode: [[0, 0], [0.3, 0.45]],
        }, 0.12);
        fx.distort({ kind: 'ring', billboard: true, pos: HIT, size: 3.2, radius: [[0, 0.2], [0.3, 0.9, 'outExpo']], width: [[0, 0.12], [0.3, 0.05]], strength: [[0, 0.025], [0.3, 0]] }, 0.08);
        fx.burst({
          shape: 'streak', dir: 'cone', axis: HIT_DIR, angle: 40, count: 30, origin: HIT, speed: [5, 10], gravity: [0, -9, 0],
          drag: 2.5, life: [0.35, 0.65], stretch: 0.08, size: [0.08, 0.02], soft: 1.2, ground: 0, bounce: 0.3,
          ramp: fx.ramp([[0, '#ffffff', 2.2], [0.4, '#a48bff', 1.6], [1, '#4b2bd1', 1.0]]),
        }, 0.08);
        fx.burst({
          shape: 'glow', dir: 'cone', axis: HIT_DIR, angle: 80, count: 16, sizeDist: [2, 5, 9], origin: HIT, spawnR: 0.3,
          speed: [0.6, 1.6], drag: 2, gravity: [0, 0.6, 0], curl: 0.5, delay: [0, 0.15], life: [0.6, 1.1],
          size: [0.18, 0.04], soft: 2, ramp: fx.ramp([[0, '#d5c9ff', 1.8], [1, '#5a37ff', 1.1]]),
        }, 0.08);
        fx.burst({
          shape: 'smoke', dir: 'cone', axis: HIT_DIR, angle: 70, count: 6, origin: HIT, spawnR: 0.2, speed: [0.6, 1.4], drag: 3,
          gravity: [0, 0.5, 0], delay: [0, 0.05], life: [0.7, 1.0], size: [0.8, 1.6], sizePow: 0.6,
          shadow: '#3a3060', noiseScale: 3, erode: 0.8, blend: 'alpha', order: -1, fade: [0.12, 0.45],
          ramp: fx.ramp([[0, '#8a78c8', 1, 0.8], [1, '#3a3060', 1, 0]]),
        }, 0.08);
        fx.target({
          dir: HIT_DIR, color: '#c9bbff', rimColor: '#8e7bff',
          flash: [[0, 0], [0.079, 0], [0.08, 1], [0.12, 1], [0.121, 0]],
          rim: [[0, 0], [0.12, 1], [0.5, 0]],
          jolt: [[0, 0], [0.08, 0.04], [0.25, 0]],
          knock: [[0, 0], [0.08, 0], [0.13, 0.1, 'outQuad'], [0.6, 0, 'inOutSine']],
        });
        fx.light({ pos: HIT_LIGHT, color: '#a48bff', distance: 4, intensity: [[0, 0], [0.08, 0], [0.09, 8], [0.5, 0, 'outQuad']] });
        fx.shake([[0, 0], [0.08, 0], [0.09, 0.07], [0.35, 0, 'outQuad']]);
      },
    },
    explosion: {
      duration: 2.8,
      contact: 0,
      build(fx) {
        const C = at(BLAST, 0, 0.5, 0);
        const fireK = [[0, 1.2], [0.6, 0.6], [1.6, 0, 'outQuad']];
        fx.flash({
          pos: C, size: 2.0, spikes: 0, spikeLen: 0, core: 0.8, soft: 4,
          core_color: '#fff4dd', coreK: 3, edge_color: '#ff9a3c', edgeK: 1.4,
          scaleCurve: [[0, 0.4], [0.04, 1, 'outExpo']], alphaCurve: [[0, 1], [0.04, 1], [0.08, 0]],
        }, 0);
        fx.burst({
          shape: 'fire', dir: 'cone', axis: UP, angle: 60, count: 16, sizeDist: [6, 10, 0], origin: C, spawnR: 0.5,
          speed: [2, 4], drag: 3.5, gravity: [0, 1.6, 0], life: [0.7, 1.1], size: [2.2, 3.4], sizePow: 0.5, stretch: 0.04,
          soft: 0.8, erode: 1, noiseScale: 3, vBias: 0.3, blend: 'premul', order: 3, fadeDist: 0.4,
          ramp: fx.ramp([[0, '#fffbe0', 3], [0.25, '#ffd34d', 1.6], [0.55, '#ff6a1f', 1.0], [0.85, '#b3261e', 0.8], [1, '#3b0f0f', 1]]),
        }, 0.02);
        fx.burst({
          shape: 'smoke', dir: 'cone', axis: UP, angle: 50, count: 12, sizeDist: [3, 6, 3], origin: at(C, 0, 0.3, 0), spawnR: 0.6,
          speed: [1, 2], gravity: [0, 1.5, 0], drag: 2, delay: [0.1, 0.12], life: [1.6, 2.2], size: [1.4, 2.6], sizePow: 0.5,
          shadow: '#7a6a80', noiseScale: 2.5, erode: 0.6, blend: 'alpha', order: 2, fade: [0.1, 0.5], fadeDist: 0.4,
          fireGlow: { color: '#ff7a2a', intensity: 1.2, height: 2.0, k: fireK },
          ramp: fx.ramp([[0, '#6a5a70', 1, 0.9], [1, '#2a2430', 1, 0]]),
        }, 0.02);
        fx.burst({
          shape: 'streak', dir: 'hemi', count: 30, origin: C, speed: [6, 12], gravity: [0, -10, 0], drag: 1.2,
          life: [0.6, 1.2], stretch: 0.05, size: [0.07, 0.02], soft: 1.2, ground: 0, bounce: 0.3,
          ramp: fx.ramp([[0, '#ffffff', 2.5], [0.3, '#ffd36b', 1.6], [1, '#ff5a1f', 1.1]]),
        }, 0.02);
        fx.burst({
          shape: 'glow', dir: 'hemi', count: 26, sizeDist: [2, 6, 12], origin: C, spawnR: 0.8, speed: [1, 3], gravity: [0, 1.2, 0],
          drag: 1.5, curl: 0.9, delay: [0.1, 0.5], life: [1, 1.9], size: [0.1, 0.03], soft: 2,
          ramp: fx.ramp([[0, '#ffd28a', 2], [1, '#ff4a12', 1.2]]),
        }, 0.02);
        fx.ring({
          pos: at(BLAST, 0, 0.04, 0), size: 8, soft: 0.03, noise: 0.6, noiseFreq: 6, edge: 2,
          color: '#ffe0b0', colorK: 1.1, color2: '#ff8a3c', color2K: 0.6,
          radius: [[0, 0.05], [0.6, 0.95, 'outExpo']], width: [[0, 0.04], [0.6, 0.0, 'outQuad']],
          alpha: [[0, 0.6], [0.6, 0]],
        }, 0.02);
        fx.distort({ kind: 'ring', pos: at(BLAST, 0, 0.05, 0), size: 9, radius: [[0, 0.05], [0.6, 0.95, 'outExpo']], width: [[0, 0.1], [0.6, 0.04]], strength: [[0, 0.03], [0.6, 0]] }, 0.02);
        fx.distort({ kind: 'heat', pos: at(C, 0, 1.2, 0), size: 4, strength: [[0, 0.012], [1.5, 0.006], [2.6, 0]] }, 0.05);
        fx.decal({ pos: at(BLAST, 0, 0.012, 0), size: 3.6, hot: '#ff6a1f', hotK: 1.6, dark: '#100a08', glow: [[0, 1], [1.6, 0, 'outQuad']] }, 0.02);
        fx.target({
          dir: AWAY, color: '#ffd8a8', rimColor: '#ff9a4a',
          rim: [[0, 0], [0.05, 1], [0.8, 0]],
          jolt: [[0, 0.04], [0.3, 0]],
          knock: [[0, 0], [0.08, 0.14, 'outQuad'], [0.8, 0, 'inOutSine']],
        });
        fx.light({ pos: C, color: '#ff9a4a', distance: 10, shadow: true, flicker: 0.2, intensity: [[0, 0], [0.02, 40], [1.4, 0, 'outQuad']] });
        fx.shake([[0, 0.16], [0.8, 0, 'outQuad']]);
      },
    },
  },
};
