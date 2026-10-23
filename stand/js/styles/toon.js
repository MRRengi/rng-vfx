import { HIT, HIT_LIGHT, HIT_DIR, BLAST, UP, AWAY, at } from './layout.js';

// Toon / cartoon. Full frame rate, round friendly shapes, overshoot and hold,
// thick outlines, two tones. Puffs come in clusters and shrink away instead of
// eroding. Rings are outlined, never flat additive hoops.
export default {
  id: 'toon',
  name: 'Toon',
  blurb: 'Round shapes with overshoot and hold, clustered two-tone puffs that shrink out, outlined rings, bouncy target.',
  look: { fps: 0, tone: 'neutral', bloom: { strength: 0.15, threshold: 1.3, radius: 0.2 } },
  effects: {
    impact: {
      duration: 1.1,
      contact: 0,
      build(fx) {
        fx.flash({
          pos: HIT, size: 1.3, hard: true, round: true, spikes: 5, spikeLen: 0.85, core: 0.45, sharp: 1.6, jitter: 0.6,
          dir: HIT_DIR, aspect: 1.3, core_color: '#fffbd0', coreK: 1.1, edge_color: '#ffc62e', edgeK: 1.0, rot: 0.3,
          scaleCurve: [[0, 0], [0.07, 1.12, 'outBack'], [0.14, 1], [0.24, 0, 'inQuad']],
          alphaCurve: [[0, 1], [0.24, 1], [0.241, 0]],
        }, 0);
        fx.ring({
          billboard: true, pos: HIT, size: 3.2, hard: true, noise: 0, blend: 'alpha',
          color: '#ffffff', colorK: 1, color2: '#2b2b55', color2K: 1,
          radius: [[0, 0.45], [0.28, 0.85, 'outBack']], width: [[0, 0.06], [0.28, 0.0, 'inQuad']],
          alpha: [[0, 1], [0.27, 1], [0.28, 0]],
        }, 0.05);
        // Three tight clusters of puffs instead of evenly spread balloons.
        for (const [axis, seed] of [[[1, 0.7, 0.1], 11], [[1, -0.25, 0.5], 12], [[0.6, 0.35, -0.7], 13]]) {
          fx.burst({
            shape: 'puff', dir: 'cone', axis, angle: 18, count: 3, seed, origin: HIT, spawnR: 0.05, speed: [3, 3.6], drag: 6,
            life: [0.5, 0.65], size: [0.55, 0.04], sizePow: 2.2, sizeRand: 0.35, bands: 1, outline: 0.09,
            outlineColor: '#2b2b55', shadow: '#b6c2ff', erode: 0, noiseScale: 1.6, blend: 'alpha', fadeDist: 0.1,
            ramp: fx.ramp([[0, '#ffffff', 1], [1, '#f2f4ff', 1]]),
          }, 0.03);
        }
        fx.burst({
          shape: 'sparkle', soft: 100, dir: 'cone', axis: HIT_DIR, angle: 70, count: 7, origin: HIT, speed: [3, 5], drag: 4,
          gravity: [0, -3, 0], life: [0.45, 0.6], size: [0.38, 0.15], sizePow: 1.5, spin: 4, fade: [0, 1],
          ramp: fx.ramp([[0, '#fff38a', 1.2], [1, '#ff8ad8', 1.1]]),
        }, 0.04);
        fx.target({
          dir: HIT_DIR, color: '#ffffff', rimColor: '#ffd84a',
          flash: [[0, 1], [0.05, 1], [0.051, 0]],
          rim: [[0, 0], [0.05, 1], [0.35, 0]],
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
        fx.flash({
          pos: C, size: 2.6, hard: true, spikes: 0, spikeLen: 0, core: 0.9,
          core_color: '#ffffff', coreK: 1.1, edge_color: '#fff2a8', edgeK: 1.0,
          scaleCurve: [[0, 0], [0.08, 1, 'outBack'], [0.14, 1], [0.2, 0, 'inQuad']],
          alphaCurve: [[0, 1], [0.2, 1], [0.201, 0]],
        }, 0);
        fx.burst({
          shape: 'puff', dir: 'cone', axis: UP, angle: 60, count: 12, sizeDist: [3, 5, 4], origin: C, spawnR: 0.3,
          speed: [3, 5], drag: 6, life: [0.55, 0.8], size: [1.25, 0.08], sizePow: 2.5, bands: 1, outline: 0.07,
          outlineColor: '#5a1d2b', shadow: '#dd6f5c', erode: 0, noiseScale: 1.4, blend: 'alpha', order: 2, fadeDist: 0.2,
          ramp: fx.ramp([[0, '#fff3b0', 1.15], [0.3, '#ffb627', 1.05], [1, '#ff5e3a', 1]]),
        }, 0.04);
        fx.burst({
          shape: 'puff', dir: 'cone', axis: UP, angle: 40, count: 10, sizeDist: [3, 4, 3], origin: at(C, 0, 0.6, 0), spawnR: 0.5,
          speed: [1.5, 2.5], gravity: [0, 1.5, 0], drag: 3, delay: [0, 0.08], life: [0.8, 1.2], size: [1.4, 0.08],
          sizePow: 2.5, bands: 1, outline: 0.07, outlineColor: '#3a3e7a', shadow: '#9aa2e6', erode: 0, noiseScale: 1.4,
          blend: 'alpha', order: 1, fadeDist: 0.2, ramp: fx.ramp([[0, '#ffffff', 1], [1, '#d8dcff', 1]]),
        }, 0.14);
        // Dust skirt along the ground instead of a flat hoop.
        fx.burst({
          shape: 'puff', dir: 'ring', lift: 0.05, count: 14, origin: at(BLAST, 0, 0.2, 0), speed: [6, 8], drag: 6,
          life: [0.45, 0.6], size: [0.55, 0.0], sizePow: 2, bands: 1, outline: 0.08, outlineColor: '#3a3e7a',
          shadow: '#b6c2ff', erode: 0, noiseScale: 1.4, blend: 'alpha', ground: 0, fadeDist: 0.1,
          ramp: fx.ramp([[0, '#ffffff', 1], [1, '#eef0ff', 1]]),
        }, 0.04);
        fx.burst({
          shape: 'sparkle', soft: 100, dir: 'hemi', count: 8, origin: C, speed: [5, 8], drag: 1.5,
          gravity: [0, -9, 0], life: [0.7, 1.0], size: [0.42, 0.2], spin: 6, fade: [0, 1],
          ramp: fx.ramp([[0, '#fff7a0', 1.2], [1, '#ffd000', 1.1]]),
        }, 0.05);
        fx.target({
          dir: AWAY, color: '#ffffff', rimColor: '#ffb627',
          flash: [[0, 0], [0.04, 1], [0.09, 1], [0.091, 0]],
          knock: [[0, 0], [0.08, 0.25, 'outQuad'], [0.45, -0.06, 'inOutSine'], [0.7, 0, 'inOutSine']],
        });
        fx.light({ pos: C, color: '#ffd38a', distance: 8, shadow: true, intensity: [[0, 0], [0.03, 18], [0.6, 0]] });
        fx.shake([[0, 0.1], [0.4, 0, 'outQuad']]);
      },
    },
  },
};
