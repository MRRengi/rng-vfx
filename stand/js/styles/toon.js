import { HIT, HIT_LIGHT, BLAST, at } from './layout.js';

// Toon / cartoon. Full frame rate, round friendly shapes, overshoot and bounce,
// thick outlines, two tones. Puffs shrink away instead of eroding.
export default {
  id: 'toon',
  name: 'Toon',
  blurb: 'Round shapes, overshoot easing, thick outlines, two tones, puffs shrink out instead of fading.',
  look: { fps: 0, tone: 'neutral', bloom: { strength: 0.2, threshold: 1.3, radius: 0.2 } },
  effects: {
    impact: {
      duration: 1.0,
      build(fx) {
        fx.flash({
          pos: HIT, size: 1.7, hard: true, spikes: 5, spikeLen: 0.85, core: 0.45, sharp: 1.6,
          core_color: '#fffbd0', coreK: 1.15, edge_color: '#ffc62e', edgeK: 1.0, rot: 0.3,
          scaleCurve: [[0, 0], [0.12, 1, 'outBack'], [0.2, 0, 'inQuad']],
          alphaCurve: [[0, 1], [0.2, 1], [0.201, 0]],
        }, 0);
        fx.ring({
          billboard: true, pos: HIT, size: 2.2, hard: true, noise: 0, color: '#ffffff', colorK: 1.2,
          radius: [[0, 0.15], [0.3, 0.8, 'outBack']], width: [[0, 0.07], [0.3, 0.0, 'inQuad']],
          alpha: [[0, 1], [0.28, 1], [0.3, 0]],
        }, 0.02);
        fx.burst({
          shape: 'puff', dir: 'ring', lift: 0.6, count: 8, origin: HIT, spawnR: 0.1, speed: [3.2, 4.2], drag: 6,
          life: [0.5, 0.7], size: [0.6, 0.04], sizePow: 2.2, bands: 1, outline: 0.09,
          outlineColor: '#2b2b55', shadow: '#b6c2ff', erode: 0, noiseScale: 1.5, blend: 'alpha',
          ramp: fx.ramp([[0, '#ffffff', 1.05], [1, '#f2f4ff', 1]]),
        }, 0.03);
        fx.burst({
          shape: 'sparkle', soft: 100, dir: 'sphere', count: 10, origin: HIT, speed: [3, 5], drag: 4,
          gravity: [0, -3, 0], life: [0.4, 0.7], size: [0.32, 0.06], sizePow: 1.5, spin: 4, fade: [0, 1],
          ramp: fx.ramp([[0, '#fff38a', 1.6], [1, '#ff8ad8', 1.4]]),
        }, 0.04);
        fx.light({ pos: HIT_LIGHT, color: '#fff0b0', intensity: [[0, 0], [0.02, 12], [0.4, 0]] });
        fx.shake([[0, 0.06], [0.25, 0, 'outQuad']]);
      },
    },
    explosion: {
      duration: 1.9,
      build(fx) {
        const C = at(BLAST, 0, 0.5, 0);
        fx.flash({
          pos: C, size: 4.2, hard: true, spikes: 0, spikeLen: 0, core: 0.9,
          core_color: '#ffffff', coreK: 1.15, edge_color: '#fff2a8', edgeK: 1.0,
          scaleCurve: [[0, 0], [0.08, 1, 'outBack'], [0.16, 0, 'inQuad']],
          alphaCurve: [[0, 1], [0.16, 1], [0.161, 0]],
        }, 0);
        fx.burst({
          shape: 'puff', dir: 'hemi', count: 12, origin: C, spawnR: 0.3, speed: [3, 5], drag: 6,
          life: [0.5, 0.8], size: [1.05, 0.08], sizePow: 2.5, bands: 1, outline: 0.07,
          outlineColor: '#5a1d2b', shadow: '#dd6f5c', erode: 0, noiseScale: 1.4, blend: 'alpha', order: 2,
          ramp: fx.ramp([[0, '#fff3b0', 1.35], [0.3, '#ffb627', 1.2], [1, '#ff5e3a', 1]]),
        }, 0.04);
        fx.burst({
          shape: 'puff', dir: 'hemi', count: 10, origin: C, spawnR: 0.5, speed: [1.5, 2.5], gravity: [0, 1.5, 0],
          drag: 3, delay: [0.18, 0.1], life: [0.8, 1.2], size: [1.15, 0.08], sizePow: 2.5, bands: 1,
          outline: 0.07, outlineColor: '#3a3e7a', shadow: '#9aa2e6', erode: 0, noiseScale: 1.4, blend: 'alpha', order: 1,
          ramp: fx.ramp([[0, '#ffffff', 1], [1, '#d8dcff', 1]]),
        }, 0.04);
        fx.burst({
          shape: 'sparkle', soft: 100, dir: 'hemi', count: 14, origin: C, speed: [5, 8], drag: 1.5,
          gravity: [0, -9, 0], life: [0.6, 1.0], size: [0.38, 0.1], spin: 6, fade: [0, 1],
          ramp: fx.ramp([[0, '#fff7a0', 1.6], [1, '#ffd000', 1.3]]),
        }, 0.05);
        fx.ring({
          pos: at(BLAST, 0, 0.03, 0), size: 7, hard: true, noise: 0, color: '#ffffff', colorK: 0.95,
          radius: [[0, 0.1], [0.35, 0.8, 'outBack']], width: [[0, 0.08], [0.35, 0, 'inQuad']],
          alpha: [[0, 1], [0.33, 1], [0.35, 0]],
        }, 0.04);
        fx.light({ pos: C, color: '#ffd38a', intensity: [[0, 0], [0.03, 35], [0.6, 0]] });
        fx.shake([[0, 0.12], [0.45, 0, 'outQuad']]);
      },
    },
  },
};
