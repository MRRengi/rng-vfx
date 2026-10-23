import { RING_N, HIT, HIT_DIR, BLAST, UP, AWAY, at } from './layout.js';

// Pixel art. Low-res render, nearest upscale, a fixed 28-colour palette (OKLab
// nearest), 10 fps, particle centres snapped to the pixel grid, 2px+ strokes,
// one 1px outline around the cel layer, white sprite flash on the target,
// a flat floor and no light falloff (it bands when quantized), no bloom.
const D = 1 / 10;

const PALETTE = [
  '#0e0e17', '#1a1630', '#2b2b55', '#3e4a7a', '#5a6a9c', '#8a9ac8', '#c8d2ee', '#ffffff',
  '#2a2420', '#4a423a', '#6e665c', '#9a9184', '#c8bea8',
  '#3a3a44', '#5c5a66', '#8a8894', '#b4b2bc',
  '#3a1012', '#6a1a1a', '#b8261e', '#ff7a1a', '#ffb030', '#ffe14d', '#fff5c8',
  '#1e4a2e', '#3a7a3e', '#5a3a7a', '#9a6ad8',
];

export default {
  id: 'pixel',
  name: 'Pixel',
  blurb: 'Low-res render, 28-colour palette, 10 fps, grid-snapped particles, 1px outline, white sprite flash, flat floor, no haze.',
  look: { fps: 10, tone: 'neutral', pixel: 5, palette: PALETTE, bloom: { strength: 0.0, threshold: 2, radius: 0 } },
  effects: {
    impact: {
      duration: 0.7,
      contact: 0,
      build(fx) {
        fx.celOutline('#0e0e17', 1);
        fx.flash({
          pos: HIT, size: 1.6, hard: true, spikes: 4, spikeLen: 0.55, core: 0.2, sharp: 2.5, jitter: 0,
          dir: HIT_DIR, aspect: 1.0, redraw: 10, core_color: '#ffffff', coreK: 1, edge_color: '#ffe14d', edgeK: 1,
          scaleCurve: [[0, 0.7], [D, 1], [2 * D, 0.5]], alphaCurve: [[0, 1], [3 * D - 0.001, 1], [3 * D, 0]],
        }, 0);
        fx.ring({
          normal: RING_N, pos: HIT, size: 1.6, hard: true, noise: 0, coverage: 0.65, aspect: 1.4, seed: 2,
          color: '#ffe14d', colorK: 1, color2: '#ff7a1a', color2K: 1,
          radius: [[0, 0.45], [3 * D, 0.9, 'outQuad']], width: [[0, 0.1], [3 * D, 0.05]],
          alpha: [[0, 1], [3 * D, 1], [3 * D + 0.001, 0]],
        }, D);
        fx.burst({
          shape: 'square', cel: true, dir: 'cone', axis: HIT_DIR, angle: 60, count: 12, origin: HIT, speed: [4, 7], drag: 4,
          gravity: [0, -4, 0], life: [3 * D, 5 * D], size: [0.2, 0.1], sizeRand: 0, fade: [0, 0.999], minPx: 2, blend: 'alpha', fadeDist: 0,
          ramp: fx.ramp([[0, '#ffffff', 1], [0.3, '#ffe14d', 1], [0.65, '#ff7a1a', 1], [1, '#b8261e', 1]]),
        }, D);
        fx.burst({
          shape: 'puff', cel: true, dir: 'cone', axis: HIT_DIR, angle: 70, count: 5, origin: HIT, speed: [1.2, 2], drag: 5,
          life: [4 * D, 6 * D], size: [0.5, 0.1], sizePow: 2, bands: 1, outline: 0, shadow: '#8a92c8',
          erode: 0.4, noiseScale: 2, blend: 'alpha', fadeDist: 0, ramp: fx.ramp([[0, '#ffffff', 1], [1, '#d0d6ff', 1]]),
        }, 2 * D);
        fx.target({
          dir: HIT_DIR, color: '#ffffff',
          flash: [[0, 1], [D - 0.001, 1], [D, 0]],
          jolt: [[0, 0.06], [4 * D, 0]],
        });
        fx.shake([[0, 0.05], [2 * D, 0]]);
      },
    },
    explosion: {
      duration: 1.4,
      contact: 0,
      build(fx) {
        const C = at(BLAST, 0, 0.5, 0);
        fx.celOutline('#0e0e17', 1);
        fx.flash({
          pos: C, size: 1.3, hard: true, spikes: 0, spikeLen: 0, core: 0.85,
          core_color: '#ffffff', coreK: 1, edge_color: '#ffe14d', edgeK: 1,
          scaleCurve: [[0, 0.5], [D, 1], [2 * D, 0.6]], alphaCurve: [[0, 1], [2 * D, 1], [2 * D + 0.001, 0]],
        }, 0);
        fx.burst({
          shape: 'puff', cel: true, dir: 'cone', axis: UP, angle: 60, count: 11, sizeDist: [2, 4, 6], origin: C, spawnR: 0.4,
          speed: [2.5, 4.5], drag: 5, life: [5 * D, 8 * D], size: [1.3, 0.3], sizePow: 1.6, bands: 2, outline: 0,
          shadow: '#b8261e', erode: 0, noiseScale: 2, blend: 'alpha', fadeDist: 0,
          ramp: fx.ramp([[0, '#ffffff', 1], [0.2, '#ffe14d', 1], [0.5, '#ff7a1a', 1], [1, '#6a1a1a', 1]]),
        }, D);
        fx.burst({
          shape: 'puff', cel: true, dir: 'cone', axis: UP, angle: 40, count: 8, origin: at(C, 0, 0.6, 0), spawnR: 0.5, speed: [1.2, 2],
          gravity: [0, 2, 0], drag: 2, delay: [0, 2 * D], life: [8 * D, 11 * D], size: [1.1, 0.2], sizePow: 2, bands: 2, outline: 0,
          shadow: '#5c5a66', erode: 0.4, noiseScale: 2, blend: 'alpha', fadeDist: 0,
          ramp: fx.ramp([[0, '#b4b2bc', 1], [1, '#8a8894', 1]]),
        }, 3 * D);
        fx.burst({
          shape: 'square', cel: true, dir: 'hemi', count: 18, sizeDist: [4, 8, 6], origin: C, speed: [5, 9], gravity: [0, -14, 0], drag: 1,
          life: [6 * D, 10 * D], size: [0.3, 0.24], ground: 0, bounce: 0.3, fade: [0, 0.999], minPx: 3, blend: 'alpha', fadeDist: 0,
          ramp: fx.ramp([[0, '#ffe14d', 1], [0.5, '#ff7a1a', 1], [1, '#3a2a2a', 1]]),
        }, D);
        fx.ring({
          pos: at(BLAST, 0, 0.03, 0), size: 4.2, hard: true, noise: 0, coverage: 0.7, seed: 6,
          color: '#ffe14d', colorK: 1, color2: '#ff7a1a', color2K: 1,
          radius: [[0, 0.1], [4 * D, 0.9, 'outQuad']], width: [[0, 0.07], [4 * D, 0.03]],
          alpha: [[0, 1], [4 * D, 1], [4 * D + 0.001, 0]],
        }, D);
        fx.target({
          dir: AWAY, color: '#ffffff',
          flash: [[0, 1], [D - 0.001, 1], [D, 0]],
          knock: [[0, 0], [D, 0.15], [5 * D, 0]],
        });
        fx.shake([[0, 0.12], [5 * D, 0]]);
      },
    },
  },
};
