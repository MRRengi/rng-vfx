import { RING_N, HIT, HIT_DIR, BLAST, UP, AWAY, at } from './layout.js';

// Pixel art. The frame renders at low resolution with nearest upscaling and a
// limited palette; motion is stepped at 10 fps; strokes are at least two
// pixels; the target sprite-flashes white on contact. No light falloff on the
// floor (it bands when quantized) and no bloom haze.
const D = 1 / 10;

export default {
  id: 'pixel',
  name: 'Pixel',
  blurb: 'Low-res render, nearest upscale, limited palette, 10 fps, 2px+ strokes, white sprite flash on the target, no soft haze.',
  look: { fps: 10, tone: 'neutral', pixel: 5, posterize: 5, bloom: { strength: 0.0, threshold: 2, radius: 0 } },
  effects: {
    impact: {
      duration: 1.0,
      contact: 0,
      build(fx) {
        fx.flash({
          pos: HIT, size: 1.8, hard: true, spikes: 4, spikeLen: 1.2, core: 0.3, sharp: 6, jitter: 0.8,
          dir: HIT_DIR, aspect: 1.3, core_color: '#ffffff', coreK: 1, edge_color: '#ffe14d', edgeK: 1,
          scaleCurve: [[0, 0.7], [D, 1], [2 * D, 0.5]], alphaCurve: [[0, 1], [3 * D - 0.001, 1], [3 * D, 0]],
        }, 0);
        fx.ring({
          normal: RING_N, pos: HIT, size: 3.4, hard: true, noise: 0, color: '#ffe14d', colorK: 1, color2: '#ff7a1a', color2K: 1,
          radius: [[0, 0.45], [3 * D, 0.9, 'outQuad']], width: [[0, 0.09], [3 * D, 0.04]],
          alpha: [[0, 1], [3 * D, 1], [3 * D + 0.001, 0]],
        }, D);
        fx.burst({
          shape: 'square', dir: 'cone', axis: HIT_DIR, angle: 60, count: 12, origin: HIT, speed: [4, 7], drag: 4,
          gravity: [0, -4, 0], life: [3 * D, 5 * D], size: [0.18, 0.08], sizeRand: 0, fade: [0, 0.999], minPx: 2,
          ramp: fx.ramp([[0, '#ffffff', 1], [0.3, '#ffe14d', 1], [0.65, '#ff7a1a', 1], [1, '#b8261e', 1]]),
        }, D);
        fx.burst({
          shape: 'puff', dir: 'cone', axis: HIT_DIR, angle: 70, count: 5, origin: HIT, speed: [1.2, 2], drag: 5,
          life: [4 * D, 6 * D], size: [0.45, 0.75], bands: 1, outline: 0.14, outlineColor: '#1a1630', shadow: '#8a92c8',
          erode: 1, noiseScale: 2, blend: 'alpha', fadeDist: 0, ramp: fx.ramp([[0, '#ffffff', 1], [1, '#d0d6ff', 1]]),
        }, 2 * D);
        fx.target({
          dir: HIT_DIR, color: '#ffffff',
          flash: [[0, 1], [2 * D - 0.001, 1], [2 * D, 0]],
          jolt: [[0, 0.06], [4 * D, 0]],
        });
        fx.shake([[0, 0.05], [2 * D, 0]]);
      },
    },
    explosion: {
      duration: 1.9,
      contact: 0,
      build(fx) {
        const C = at(BLAST, 0, 0.5, 0);
        fx.flash({
          pos: C, size: 2.6, hard: true, spikes: 0, spikeLen: 0, core: 0.85,
          core_color: '#ffffff', coreK: 1, edge_color: '#ffe14d', edgeK: 1,
          scaleCurve: [[0, 0.5], [D, 1], [2 * D, 0.6]], alphaCurve: [[0, 1], [2 * D, 1], [2 * D + 0.001, 0]],
        }, 0);
        fx.burst({
          shape: 'puff', dir: 'cone', axis: UP, angle: 60, count: 10, sizeDist: [3, 4, 3], origin: C, spawnR: 0.4,
          speed: [2.5, 4.5], drag: 5, life: [5 * D, 8 * D], size: [1.0, 1.6], sizePow: 0.4, bands: 2, outline: 0.1,
          outlineColor: '#2b0f0f', shadow: '#b8261e', erode: 1, noiseScale: 2, blend: 'alpha', order: 2, fadeDist: 0,
          ramp: fx.ramp([[0, '#ffffff', 1], [0.2, '#ffe14d', 1], [0.5, '#ff7a1a', 1], [1, '#6a1a1a', 1]]),
        }, D);
        fx.burst({
          shape: 'puff', dir: 'cone', axis: UP, angle: 40, count: 8, origin: at(C, 0, 0.6, 0), spawnR: 0.5, speed: [1.2, 2],
          gravity: [0, 2, 0], drag: 2, delay: [0, 2 * D], life: [8 * D, 11 * D], size: [0.9, 1.3], bands: 1, outline: 0.1,
          outlineColor: '#121018', shadow: '#5a5268', erode: 1, noiseScale: 2, blend: 'alpha', order: 1, fadeDist: 0,
          ramp: fx.ramp([[0, '#8a8498', 1], [1, '#5a5468', 1]]),
        }, 3 * D);
        fx.burst({
          shape: 'square', dir: 'hemi', count: 18, sizeDist: [4, 8, 6], origin: C, speed: [5, 9], gravity: [0, -14, 0], drag: 1,
          life: [6 * D, 10 * D], size: [0.22, 0.16], ground: 0, bounce: 0.3, fade: [0, 0.999], minPx: 2,
          ramp: fx.ramp([[0, '#ffe14d', 1], [0.5, '#ff7a1a', 1], [1, '#3a2a2a', 1]]),
        }, D);
        fx.ring({
          pos: at(BLAST, 0, 0.03, 0), size: 7, hard: true, noise: 0, color: '#ffe14d', colorK: 1, color2: '#ff7a1a', color2K: 1,
          radius: [[0, 0.1], [4 * D, 0.9, 'outQuad']], width: [[0, 0.07], [4 * D, 0.03]],
          alpha: [[0, 1], [4 * D, 1], [4 * D + 0.001, 0]],
        }, D);
        fx.target({
          dir: AWAY, color: '#ffffff',
          flash: [[0, 1], [2 * D - 0.001, 1], [2 * D, 0]],
          knock: [[0, 0], [D, 0.15], [5 * D, 0]],
        });
        fx.shake([[0, 0.12], [5 * D, 0]]);
      },
    },
  },
};
