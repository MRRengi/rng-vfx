import { HIT, HIT_LIGHT, BLAST, at } from './layout.js';

// Stylized / hand-painted (MOBA and hero-shooter school). Full frame rate,
// clear value hierarchy (white core, saturated mid, dark painted smoke),
// eroding noise shapes instead of hard cels, generous but controlled bloom.
export default {
  id: 'stylized',
  name: 'Stylized',
  blurb: 'Clear value hierarchy, gradient-mapped eroding noise, painted smoke, readable silhouettes.',
  look: { fps: 0, tone: 'neutral', bloom: { strength: 0.45, threshold: 1.15, radius: 0.25 } },
  effects: {
    impact: {
      duration: 1.1,
      build(fx) {
        fx.slash({
          pos: at(HIT, 0, 0, 0.25), rot: [-0.25, 0.25, 0.15], scale: 0.95, from: 150, to: -35, rIn: 0.85, rOut: 1.45,
          coreColor: '#ffffff', coreK: 3, edgeColor: '#7b5cff', edgeK: 2.5, noise: 0.25, dissolve: 0.6,
          head: [[0, 0], [0.1, 1.0, 'outQuart'], [0.34, 1.7, 'inQuad']], alpha: [[0, 1], [0.2, 1], [0.34, 0]], tail: 0.7,
        }, 0);
        fx.flash({
          pos: HIT, size: 1.8, spikes: 4, spikeLen: 1.0, core: 0.18, sharp: 30, soft: 1.6, rot: 0.4,
          core_color: '#ffffff', coreK: 2.5, edge_color: '#8e7bff', edgeK: 2,
          scaleCurve: [[0, 0], [0.04, 1, 'outExpo'], [0.22, 0.5]], alphaCurve: [[0, 1], [0.1, 1], [0.24, 0]],
        }, 0.06);
        fx.ring({
          billboard: true, pos: HIT, size: 2.2, soft: 0.06, noise: 0.5, noiseFreq: 4,
          color: '#d7ceff', colorK: 2, color2: '#6a4cff', color2K: 1.6,
          radius: [[0, 0.1], [0.32, 0.9, 'outExpo']], width: [[0, 0.1], [0.32, 0.0, 'outQuad']],
          alpha: [[0, 1], [0.32, 0]],
        }, 0.06);
        fx.burst({
          shape: 'streak', dir: 'sphere', count: 22, origin: HIT, speed: [4, 8], gravity: [0, -9, 0], drag: 2.5,
          life: [0.35, 0.6], stretch: 0.045, size: [0.05, 0.02], soft: 1.2, ground: 0,
          ramp: fx.ramp([[0, '#ffffff', 3], [0.4, '#a48bff', 2.5], [1, '#4b2bd1', 1.5]]),
        }, 0.06);
        fx.burst({
          shape: 'glow', dir: 'sphere', count: 14, origin: HIT, spawnR: 0.3, speed: [0.5, 1.5], drag: 2,
          gravity: [0, 0.8, 0], curl: 0.3, delay: [0.05, 0.2], life: [0.6, 1.1], size: [0.14, 0.03], soft: 2,
          ramp: fx.ramp([[0, '#c9bbff', 2.5], [1, '#5a37ff', 1.5]]),
        }, 0.06);
        fx.burst({
          shape: 'smoke', dir: 'sphere', count: 6, origin: HIT, spawnR: 0.2, speed: [0.6, 1.2], drag: 3,
          gravity: [0, 0.6, 0], delay: [0.05, 0.08], life: [0.6, 0.9], size: [0.6, 1.2], sizePow: 0.6,
          shadow: '#3a3060', noiseScale: 2, erode: 0.8, blend: 'alpha', order: -1, fade: [0.15, 0.4],
          ramp: fx.ramp([[0, '#6b5aa0', 1, 0.75], [1, '#2a2340', 1, 0]]),
        }, 0.06);
        fx.light({ pos: HIT_LIGHT, color: '#a48bff', intensity: [[0, 0], [0.06, 0], [0.08, 12], [0.5, 0, 'outQuad']] });
        fx.shake([[0, 0], [0.06, 0], [0.07, 0.07], [0.35, 0, 'outQuad']]);
      },
    },
    explosion: {
      duration: 2.4,
      build(fx) {
        const C = at(BLAST, 0, 0.5, 0);
        fx.flash({
          pos: C, size: 5, spikes: 0, spikeLen: 0, core: 0.8, soft: 2.2,
          core_color: '#fff4dd', coreK: 5, edge_color: '#ff9a3c', edgeK: 2.5,
          scaleCurve: [[0, 0.3], [0.05, 1, 'outExpo'], [0.25, 0.7]], alphaCurve: [[0, 1], [0.08, 1], [0.25, 0]],
        }, 0);
        fx.burst({
          shape: 'fire', dir: 'hemi', count: 16, origin: C, spawnR: 0.5, speed: [2, 4], drag: 3.5,
          gravity: [0, 1.6, 0], life: [0.6, 1.0], size: [1.2, 2.0], sizePow: 0.5, soft: 0.8,
          erode: 1, noiseScale: 2.2, blend: 'alpha', order: 2,
          ramp: fx.ramp([[0, '#fffbe0', 4], [0.25, '#ffd34d', 3], [0.55, '#ff6a1f', 2.2], [0.85, '#b3261e', 1.4], [1, '#3b0f0f', 1]]),
        }, 0.02);
        fx.burst({
          shape: 'smoke', dir: 'hemi', count: 12, origin: C, spawnR: 0.6, speed: [1, 2], gravity: [0, 1.8, 0],
          drag: 2, delay: [0.25, 0.1], life: [1.2, 1.8], size: [1.2, 2.4], sizePow: 0.5, shadow: '#7a6a80',
          noiseScale: 1.8, erode: 0.6, blend: 'alpha', order: 1, fade: [0.1, 0.5],
          ramp: fx.ramp([[0, '#3b3340', 1, 0.85], [1, '#1f1b22', 1, 0]]),
        }, 0.02);
        fx.burst({
          shape: 'streak', dir: 'hemi', count: 30, origin: C, speed: [6, 12], gravity: [0, -10, 0], drag: 1.2,
          life: [0.6, 1.2], stretch: 0.04, size: [0.06, 0.02], soft: 1.2, ground: 0,
          ramp: fx.ramp([[0, '#ffffff', 4], [0.3, '#ffd36b', 3], [1, '#ff5a1f', 2]]),
        }, 0.02);
        fx.burst({
          shape: 'glow', dir: 'hemi', count: 24, origin: C, spawnR: 0.8, speed: [1, 3], gravity: [0, 1.2, 0],
          drag: 1.5, curl: 0.6, delay: [0.1, 0.5], life: [1, 1.8], size: [0.07, 0.02], sizeRand: 0.5, soft: 2,
          ramp: fx.ramp([[0, '#ffd28a', 3], [1, '#ff4a12', 2]]),
        }, 0.02);
        fx.ring({
          pos: at(BLAST, 0, 0.04, 0), size: 8, soft: 0.06, noise: 0.6, noiseFreq: 6,
          color: '#ffe0b0', colorK: 1.6, color2: '#ff8a3c', color2K: 1.2,
          radius: [[0, 0.05], [0.6, 0.95, 'outExpo']], width: [[0, 0.1], [0.6, 0.0, 'outQuad']],
          alpha: [[0, 0.9], [0.6, 0]],
        }, 0.02);
        fx.decal({ pos: at(BLAST, 0, 0.012, 0), size: 3.6, hot: '#ff6a1f', hotK: 2, glow: [[0, 1], [1.6, 0, 'outQuad']] }, 0.02);
        fx.light({ pos: C, color: '#ff9a4a', intensity: [[0, 0], [0.02, 70], [1.2, 0, 'outQuad']] });
        fx.shake([[0, 0.18], [0.8, 0, 'outQuad']]);
      },
    },
  },
};
