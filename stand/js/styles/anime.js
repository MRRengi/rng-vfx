import { HIT, HIT_LIGHT, BLAST, at } from './layout.js';

// Anime / sakuga. Drawn on twos (12 drawings per second), hard cel shapes,
// a held impact frame, spiky asymmetric flashes, smoke that pops in and
// dissolves through holes instead of fading.
export default {
  id: 'anime',
  name: 'Anime',
  blurb: 'On twos (12 fps), hard cel shapes, inverted impact frame, puffs that dissolve through holes.',
  look: { fps: 12, tone: 'neutral', bloom: { strength: 0.3, threshold: 1.3, radius: 0.2 } },
  effects: {
    impact: {
      duration: 0.95,
      build(fx) {
        const T = 0.1; // contact frame; everything before it is anticipation
        fx.burst({
          shape: 'streak', dir: 'sphere', count: 14, origin: HIT, spawnR: 1.6,
          speed: [-10, -13], life: [0.1, 0.12], stretch: 0.04, size: [0.06, 0.03], soft: 1,
          ramp: fx.ramp([[0, '#ffffff', 2], [1, '#9fe8ff', 2]]),
        }, 0);
        fx.impactFrame([[0, 0], [T, 0], [T + 0.001, 1], [T + 0.08, 1], [T + 0.081, 0]]);
        fx.flash({
          pos: HIT, size: 1.9, hard: true, spikes: 7, spikeLen: 1.35, core: 0.22, sharp: 18, jitter: 0.9,
          rotSpeed: 9, core_color: '#ffffff', coreK: 1.6, edge_color: '#3fd8ff', edgeK: 1.4,
          scaleCurve: [[0, 0], [0.001, 1], [0.16, 1.1], [0.25, 0.35]],
          alphaCurve: [[0, 1], [0.16, 1], [0.25, 0]],
        }, T);
        fx.ring({
          billboard: true, pos: HIT, size: 2.2, hard: true, noise: 0.55, noiseFreq: 3,
          color: '#ffffff', colorK: 1.5, color2: '#3fd8ff', color2K: 1.4,
          radius: [[0, 0.1], [0.25, 0.85, 'outExpo']], width: [[0, 0.09], [0.25, 0.012]],
          alpha: [[0, 1], [0.2, 1], [0.26, 0]],
        }, T);
        fx.burst({
          shape: 'streak', dir: 'sphere', count: 26, origin: HIT, speed: [14, 20], drag: 6,
          life: [0.12, 0.22], stretch: 0.06, size: [0.07, 0.02], soft: 1,
          ramp: fx.ramp([[0, '#ffffff', 2.5], [1, '#3fd8ff', 2]]),
        }, T);
        fx.burst({
          shape: 'streak', dir: 'sphere', count: 18, origin: HIT, speed: [5, 9], gravity: [0, -12, 0],
          drag: 2, life: [0.3, 0.5], stretch: 0.05, size: [0.05, 0.02], soft: 1, ground: 0,
          ramp: fx.ramp([[0, '#ffffff', 3], [0.5, '#fff3a0', 2.5], [1, '#ffb030', 1.6]]),
        }, T);
        fx.burst({
          shape: 'puff', dir: 'sphere', count: 7, origin: HIT, spawnR: 0.15, speed: [1.6, 3], drag: 5,
          life: [0.45, 0.7], size: [0.3, 0.8], sizePow: 0.4, bands: 2, outline: 0.06,
          outlineColor: '#1d2440', shadow: '#7088b8', erode: 1, noiseScale: 2, blend: 'alpha',
          ramp: fx.ramp([[0, '#ffffff', 1.15], [1, '#dce8f2', 1]]),
        }, T + 0.02);
        fx.light({ pos: HIT_LIGHT, color: '#7fe4ff', intensity: [[0, 0], [T, 0], [T + 0.001, 30], [0.45, 0, 'outQuad']] });
        fx.shake([[0, 0], [T, 0], [T + 0.001, 0.12], [0.4, 0, 'outQuad']]);
      },
    },
    explosion: {
      duration: 2.3,
      build(fx) {
        const T = 0.17;
        const C = at(BLAST, 0, 0.6, 0);
        fx.flash({
          pos: C, size: 1.6, hard: true, spikes: 0, spikeLen: 0, core: 0.6,
          core_color: '#ffffff', coreK: 3, edge_color: '#ffe17a', edgeK: 2,
          scaleCurve: [[0, 0.1], [T, 0.5, 'inQuad']], alphaCurve: [[0, 1], [T, 1], [T + 0.001, 0]],
        }, 0);
        fx.impactFrame([[0, 0], [T, 0], [T + 0.001, 1], [T + 0.16, 1], [T + 0.161, 0]]);
        fx.flash({
          pos: C, size: 4.2, hard: true, spikes: 9, spikeLen: 1.2, core: 0.3, sharp: 14, jitter: 1,
          rotSpeed: 6, core_color: '#fffbe6', coreK: 1.7, edge_color: '#ffb12a', edgeK: 1.5,
          scaleCurve: [[0, 0], [0.001, 0.8], [0.2, 1.1], [0.3, 0.3]], alphaCurve: [[0, 1], [0.2, 1], [0.3, 0]],
        }, T);
        fx.burst({
          shape: 'puff', dir: 'hemi', count: 13, origin: C, spawnR: 0.4, speed: [3, 6], drag: 4,
          life: [0.75, 1.1], size: [0.9, 2.1], sizePow: 0.35, bands: 3, outline: 0.04,
          outlineColor: '#2a0e0e', shadow: '#a8402c', erode: 1, noiseScale: 2.6, blend: 'alpha', order: 2,
          ramp: fx.ramp([[0, '#fff7d6', 2.2], [0.25, '#ffd23f', 1.8], [0.55, '#ff6a1a', 1.3], [1, '#5a1e1e', 0.8]]),
        }, T);
        fx.burst({
          shape: 'puff', dir: 'hemi', count: 10, origin: C, spawnR: 0.6, speed: [1.5, 2.6], gravity: [0, 2.5, 0],
          drag: 2, delay: [0.25, 0.2], life: [1.0, 1.5], size: [1.0, 1.9], sizePow: 0.5, bands: 2, outline: 0.05,
          outlineColor: '#141018', shadow: '#6b6178', erode: 1, noiseScale: 2.4, blend: 'alpha', order: 1,
          ramp: fx.ramp([[0, '#5a5262', 1], [1, '#2e2a35', 1]]),
        }, T);
        fx.ring({
          pos: at(BLAST, 0, 0.03, 0), size: 9, hard: true, noise: 0.4, noiseFreq: 5,
          color: '#ffffff', colorK: 2, color2: '#ffb347', color2K: 1.8,
          radius: [[0, 0.05], [0.5, 0.95, 'outExpo']], width: [[0, 0.06], [0.5, 0.006]],
          alpha: [[0, 1], [0.42, 1], [0.5, 0]],
        }, T);
        fx.burst({
          shape: 'streak', dir: 'hemi', count: 24, origin: C, speed: [9, 15], gravity: [0, -15, 0],
          drag: 1, life: [0.5, 0.9], stretch: 0.04, size: [0.08, 0.03], soft: 1, ground: 0,
          ramp: fx.ramp([[0, '#fff1a8', 3], [1, '#ff7b2a', 2]]),
        }, T);
        fx.burst({
          shape: 'streak', dir: 'sphere', count: 20, origin: C, speed: [26, 36], drag: 8,
          life: [0.1, 0.18], stretch: 0.05, size: [0.09, 0.02], soft: 1,
          ramp: fx.ramp([[0, '#ffffff', 2.5], [1, '#ffe7a3', 2]]),
        }, T);
        fx.light({ pos: C, color: '#ffb35c', intensity: [[0, 0], [T, 6], [T + 0.001, 90], [1.2, 0, 'outQuad']] });
        fx.shake([[0, 0], [T, 0], [T + 0.001, 0.25], [0.9, 0, 'outQuad']]);
      },
    },
  },
};
