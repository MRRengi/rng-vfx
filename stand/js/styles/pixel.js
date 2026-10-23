import { HIT, HIT_LIGHT, BLAST, at } from './layout.js';

// Pixel art. The whole frame renders at low resolution with nearest
// upscaling and a limited palette; motion is stepped at 10 fps; shapes are
// hard edged and particles are squares. No soft gradients, no bloom haze.
export default {
  id: 'pixel',
  name: 'Pixel',
  blurb: 'Low-res render, nearest upscale, posterized palette, 10 fps steps, square particles, no soft haze.',
  look: { fps: 10, tone: 'neutral', pixel: 5, posterize: 5, bloom: { strength: 0.0, threshold: 2, radius: 0 } },
  effects: {
    impact: {
      duration: 0.9,
      build(fx) {
        fx.flash({
          pos: HIT, size: 2.2, hard: true, spikes: 4, spikeLen: 1.3, core: 0.28, sharp: 40,
          core_color: '#ffffff', coreK: 1, edge_color: '#ffe14d', edgeK: 1,
          scaleCurve: [[0, 0.6], [0.1, 1], [0.2, 0.5]], alphaCurve: [[0, 1], [0.2, 1], [0.201, 0]],
        }, 0);
        fx.ring({
          billboard: true, pos: HIT, size: 3, hard: true, noise: 0, color: '#ffe14d', colorK: 1, color2: '#ff7a1a', color2K: 1,
          radius: [[0, 0.15], [0.3, 0.85, 'outQuad']], width: [[0, 0.1], [0.3, 0.03]],
          alpha: [[0, 1], [0.3, 1], [0.301, 0]],
        }, 0.05);
        fx.burst({
          shape: 'square', dir: 'sphere', count: 14, origin: HIT, speed: [4, 7], drag: 4, gravity: [0, -4, 0],
          life: [0.3, 0.5], size: [0.16, 0.06], sizeRand: 0, spin: 0, fade: [0, 0.999],
          ramp: fx.ramp([[0, '#ffffff', 1], [0.3, '#ffe14d', 1], [0.65, '#ff7a1a', 1], [1, '#b8261e', 1]]),
        }, 0.05);
        fx.burst({
          shape: 'puff', dir: 'sphere', count: 5, origin: HIT, speed: [1.2, 2], drag: 5, life: [0.4, 0.6],
          size: [0.4, 0.7], bands: 1, outline: 0.12, outlineColor: '#1a1630', shadow: '#8a92c8', erode: 1,
          noiseScale: 2, blend: 'alpha', ramp: fx.ramp([[0, '#ffffff', 1], [1, '#d0d6ff', 1]]),
        }, 0.08);
        fx.light({ pos: HIT_LIGHT, color: '#ffe0a0', intensity: [[0, 5], [0.3, 0]] });
        fx.shake([[0, 0.06], [0.2, 0]]);
      },
    },
    explosion: {
      duration: 1.7,
      build(fx) {
        const C = at(BLAST, 0, 0.5, 0);
        fx.flash({
          pos: C, size: 3.4, hard: true, spikes: 0, spikeLen: 0, core: 0.85,
          core_color: '#ffffff', coreK: 1, edge_color: '#ffe14d', edgeK: 1,
          scaleCurve: [[0, 0.5], [0.1, 1], [0.2, 0.6]], alphaCurve: [[0, 1], [0.2, 1], [0.201, 0]],
        }, 0);
        fx.burst({
          shape: 'puff', dir: 'hemi', count: 10, origin: C, spawnR: 0.4, speed: [2.5, 4.5], drag: 5,
          life: [0.5, 0.8], size: [0.9, 1.5], sizePow: 0.4, bands: 2, outline: 0.1, outlineColor: '#2b0f0f',
          shadow: '#b8261e', erode: 1, noiseScale: 2, blend: 'alpha', order: 2,
          ramp: fx.ramp([[0, '#ffffff', 1], [0.2, '#ffe14d', 1], [0.5, '#ff7a1a', 1], [1, '#6a1a1a', 1]]),
        }, 0.08);
        fx.burst({
          shape: 'puff', dir: 'hemi', count: 8, origin: C, spawnR: 0.5, speed: [1.2, 2], gravity: [0, 2, 0], drag: 2,
          delay: [0.2, 0.15], life: [0.8, 1.1], size: [0.9, 1.3], bands: 1, outline: 0.1, outlineColor: '#121018',
          shadow: '#5a5268', erode: 1, noiseScale: 2, blend: 'alpha', order: 1,
          ramp: fx.ramp([[0, '#6a6478', 1], [1, '#3a3644', 1]]),
        }, 0.08);
        fx.burst({
          shape: 'square', dir: 'hemi', count: 20, origin: C, speed: [5, 9], gravity: [0, -14, 0], drag: 1,
          life: [0.5, 0.9], size: [0.14, 0.1], sizeRand: 0, ground: 0, fade: [0, 0.999],
          ramp: fx.ramp([[0, '#ffe14d', 1], [0.5, '#ff7a1a', 1], [1, '#3a2a2a', 1]]),
        }, 0.08);
        fx.ring({
          pos: at(BLAST, 0, 0.03, 0), size: 7, hard: true, noise: 0, color: '#ffe14d', colorK: 1, color2: '#ff7a1a', color2K: 1,
          radius: [[0, 0.1], [0.4, 0.9, 'outQuad']], width: [[0, 0.07], [0.4, 0.02]],
          alpha: [[0, 1], [0.4, 1], [0.401, 0]],
        }, 0.08);
        fx.light({ pos: C, color: '#ffc070', intensity: [[0, 12], [0.7, 0]] });
        fx.shake([[0, 0.14], [0.5, 0]]);
      },
    },
  },
};
