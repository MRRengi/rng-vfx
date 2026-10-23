import { RING_N, HIT, HIT_LIGHT, HIT_DIR, BLAST, UP, AWAY, at } from './layout.js';

// Anime / sakuga. Drawn on twos (12 drawings per second) and every key sits on
// that grid, so no drawing is lost between frames. Contact gets hitstop and a
// two-drawing impact frame, then the hit spark is held in colour, redrawn each
// drawing. Cel puffs share one outline around their union.
const D = 1 / 12; // one drawing

export default {
  id: 'anime',
  name: 'Anime',
  blurb: 'On twos, keys on the drawing grid, hitstop + two-drawing impact frame, redrawn wedge spark along the hit, cel puffs with one outline.',
  look: { fps: 12, tone: 'neutral', bloom: { strength: 0.2, threshold: 1.6, radius: 0.15 } },
  effects: {
    impact: {
      duration: 0.8,
      contact: 2 * D,
      build(fx) {
        const T = 2 * D;
        fx.hitstop(T, 6);
        fx.celOutline('#1d2440', 2.5);
        // Anticipation: thick lines converging for two drawings.
        fx.burst({
          shape: 'streak', dir: 'sphere', count: 9, origin: HIT, spawnR: 1.5,
          speed: [-8, -9], life: [2 * D + 0.01, 2 * D + 0.02], stretch: 0.06, size: [0.11, 0.08], soft: 0.6, minPx: 3,
          ramp: fx.ramp([[0, '#ffffff', 1.2], [1, '#bff3ff', 1.2]]),
        }, 0);
        fx.impactFrame([[0, 0], [T - 0.001, 0], [T, 1], [T + D - 0.001, 1], [T + D, 0]]);
        fx.flash({
          pos: HIT, size: 1.1, hard: true, spikes: 4, spikeLen: 0.9, core: 0.16, sharp: 3.2, jitter: 1.0,
          dir: HIT_DIR, aspect: 1.6, redraw: 12, bias: 0.85, angJitter: 0.35, depthTest: true, core_color: '#ffffff', coreK: 1.0, edge_color: '#3fd8ff', edgeK: 1.0,
          scaleCurve: [[0, 1], [D, 1.08], [2 * D, 0.5]],
          alphaCurve: [[0, 1], [3 * D, 1], [3 * D + 0.001, 0]],
        }, T);
        fx.ring({
          normal: RING_N, pos: HIT, size: 1.4, hard: true, noise: 0.5, noiseFreq: 3, coverage: 0.55, aspect: 1.6, seed: 5,
          color: '#ffffff', colorK: 1.05, color2: '#3fd8ff', color2K: 1.0,
          radius: [[0, 0.5], [2 * D, 0.92, 'outQuad']], width: [[0, 0.08], [2 * D, 0.02]],
          alpha: [[0, 1], [2 * D, 1], [2 * D + 0.001, 0]],
        }, T + 3 * D);
        fx.burst({
          shape: 'streak', dir: 'cone', axis: HIT_DIR, angle: 70, count: 18, origin: HIT, speed: [16, 22], drag: 6,
          life: [2 * D, 3 * D], stretch: 0.07, size: [0.07, 0.03], soft: 0.8,
          ramp: fx.ramp([[0, '#ffffff', 1.3], [1, '#3fd8ff', 1.1]]),
        }, T);
        fx.burst({
          shape: 'streak', dir: 'cone', axis: HIT_DIR, angle: 50, count: 16, origin: HIT, speed: [6, 10], gravity: [0, -12, 0],
          drag: 2, life: [4 * D, 6 * D], stretch: 0.05, size: [0.06, 0.025], soft: 0.8, ground: 0, bounce: 0.3,
          ramp: fx.ramp([[0, '#ffffff', 1.4], [0.4, '#bff3ff', 1.2], [1, '#3fd8ff', 1.0]]),
        }, T);
        fx.burst({
          shape: 'puff', cel: true, dir: 'cone', axis: HIT_DIR, angle: 75, count: 8, sizeDist: [2, 3, 3], origin: at(HIT, HIT_DIR[0] * 0.35, HIT_DIR[1] * 0.35, HIT_DIR[2] * 0.35), spawnR: 0.15,
          speed: [1.5, 3.2], drag: 5, life: [6 * D, 9 * D], size: [0.35, 0.7], sizePow: 0.4, sizeIn: 0.15, bands: 2, outline: 0,
          shadow: '#4a5c90', holeScale: 0.45, erode: 1, noiseScale: 2.5, blend: 'alpha', fadeDist: 0.05,
          ramp: fx.ramp([[0, '#ffffff', 1.0], [1, '#dce8f2', 1]]),
        }, T + D);
        fx.target({
          dir: HIT_DIR, color: '#bff3ff', rimColor: '#3fd8ff',
          flash: [[0, 0], [T + D - 0.001, 0], [T + D, 0.35], [T + 2 * D - 0.001, 0.35], [T + 2 * D, 0]],
          rim: [[0, 0], [T + 2 * D, 1], [T + 3 * D, 0]],
          jolt: [[0, 0], [T, 0.05], [T + 4 * D, 0]],
          knock: [[0, 0], [T, 0], [T + D, 0.14, 'outQuad'], [T + 9 * D, 0, 'inOutSine']],
          squash: [[0, 0], [T, 0], [T + D, 1], [T + 4 * D, 0]],
        });
        fx.light({ pos: HIT_LIGHT, color: '#7fe4ff', distance: 2.5, intensity: [[0, 0], [T, 0], [T + 0.001, 3], [T + 2 * D, 0]] });
        fx.shake([[0, 0], [T, 0], [T + 0.001, 0.1], [T + 5 * D, 0, 'outQuad']]);
      },
    },
    explosion: {
      duration: 1.5,
      contact: 2 * D,
      build(fx) {
        const T = 2 * D;
        const C = at(BLAST, 0, 0.6, 0);
        fx.hitstop(T, 4);
        fx.celOutline('#2a0e0e', 2.5);
        fx.flash({
          pos: C, size: 1.2, hard: true, spikes: 0, spikeLen: 0, core: 0.6,
          core_color: '#ffffff', coreK: 1.2, edge_color: '#ffe17a', edgeK: 1.0,
          scaleCurve: [[0, 0.15], [T, 0.5]], alphaCurve: [[0, 1], [T - 0.001, 1], [T, 0]],
        }, 0);
        fx.impactFrame([[0, 0], [T - 0.001, 0], [T, 1], [T + D - 0.001, 1], [T + D, 0]]);
        fx.flash({
          pos: C, size: 1.1, hard: true, spikes: 5, spikeLen: 0.6, core: 0.3, sharp: 2.0, jitter: 0.8, blend: 'alpha',
          dir: [0.45, 1, 0.1], aspect: 1.8, redraw: 12, angJitter: 0.7, bias: 0.5, core_color: '#fffbe6', coreK: 1.15, edge_color: '#ffb12a', edgeK: 1.0,
          scaleCurve: [[0, 0.8], [3 * D, 1.1], [4 * D, 0.3]], alphaCurve: [[0, 1], [4 * D, 1], [4 * D + 0.001, 0]],
        }, T);
        // Stem: the fireball connects to the ground.
        fx.burst({
          shape: 'puff', cel: true, dir: 'cone', axis: UP, angle: 15, count: 5, origin: at(BLAST, 0, 0.1, 0), spawnR: 0.2,
          speed: [4, 6], drag: 4, life: [7 * D, 10 * D], size: [0.8, 1.2], sizeIn: 0.12, bands: 2, outline: 0, order: 2,
          shadow: '#7a2418', holeScale: 0.45, erode: 1, noiseScale: 2.2, blend: 'alpha', fadeDist: 0.05,
          ramp: fx.ramp([[0, '#fff2c0', 1.2], [0.4, '#ffb02a', 1.0], [1, '#7a2a1a', 0.8]]),
        }, T);
        // Hero fireball: five drawn keyframes (image model, see recipes/flipbooks.md),
        // played stepped on the drawing grid, two drawings each.
        fx.burst({
          shape: 'sheet', cel: true, sheet: { url: './textures/anime_fire_3x2.png', grid: [3, 2], frames: 5, stepped: true, ease: 0.65 },
          dir: 'cone', axis: UP, angle: 1, count: 1, origin: at(C, 0, 0.35, 0), speed: [0.6, 0.6], drag: 2,
          life: [10 * D, 10 * D], size: [3.4, 3.4], sizeRand: 0, blend: 'alpha', order: 5, fadeDist: 0.05, fade: [0, 0.999],
          ramp: fx.ramp([[0, '#ffffff', 1.05], [1, '#ffffff', 1.0]]),
        }, T);
        fx.burst({
          shape: 'puff', cel: true, dir: 'cone', axis: UP, angle: 55, count: 6, sizeDist: [0, 3, 3], origin: C, spawnR: 0.6,
          speed: [3, 6], drag: 4, life: [8 * D, 13 * D], size: [0.9, 1.6], sizePow: 0.35, sizeIn: 0.1, bands: 2, outline: 0, order: 3,
          shadow: '#7a2418', holeScale: 0.45, erode: 1, noiseScale: 2.2, blend: 'alpha', fadeDist: 0.05,
          ramp: fx.ramp([[0, '#fff7d6', 1.3], [0.25, '#ffd23f', 1.1], [0.55, '#ff6a1a', 1.0], [1, '#5a1e1e', 0.8]]),
        }, T);
        fx.burst({
          shape: 'puff', cel: true, dir: 'cone', axis: UP, angle: 60, origin: C, spawnR: 0.3, speed: [6, 9], drag: 3,
          count: 3, life: [6 * D, 9 * D], size: [0.6, 0.3], stretch: 0.05, bands: 2, outline: 0, order: 4,
          shadow: '#7a2418', holeScale: 0.45, erode: 1, noiseScale: 2, blend: 'alpha', fadeDist: 0.05,
          ramp: fx.ramp([[0, '#fff2c0', 1.2], [0.5, '#ffb02a', 1.0], [1, '#c2401a', 0.9]]),
        }, T);
        fx.burst({
          // Drawn smoke (image-model keyframes): 2 bands, outline, breaking into chunks.
          shape: 'sheet', cel: true, sheet: { url: './textures/anime_smoke_3x2.png', grid: [3, 2], frames: 6, stepped: true },
          dir: 'cone', axis: UP, angle: 35, count: 4, sizeDist: [2, 2, 0], origin: at(BLAST, 0, 1.0, 0), spawnR: 0.5,
          speed: [1.0, 1.8], gravity: [0, 1.5, 0], drag: 2, delay: [0, 2 * D], life: [12 * D, 14 * D],
          size: [2.6, 3.4], sizeIn: 0.1, blend: 'alpha', order: 0, fadeDist: 0.05, fade: [0, 0.999],
          ramp: fx.ramp([[0, '#ffffff', 1], [1, '#ffffff', 1]]),
        }, T + 2 * D);
        // Dust skirt instead of a giant ground hoop.
        fx.burst({
          shape: 'puff', cel: true, dir: 'ring', lift: 0.05, count: 14, origin: at(BLAST, 0, 0.42, 0), speed: [6, 8], drag: 5,
          life: [5 * D, 8 * D], size: [0.7, 0.2], sizePow: 1.5, sizeIn: 0.15, bands: 1, outline: 0, order: 1, shadow: '#9a7a6a',
          erode: 1, noiseScale: 2, blend: 'alpha', ground: 0, fadeDist: 0.05,
          ramp: fx.ramp([[0, '#e8d8c0', 1], [1, '#b8a890', 1]]),
        }, T + D);
        fx.burst({
          shape: 'streak', dir: 'hemi', count: 24, origin: C, speed: [9, 15], gravity: [0, -15, 0],
          drag: 1, life: [6 * D, 11 * D], stretch: 0.04, size: [0.08, 0.03], soft: 0.8, ground: 0, bounce: 0.3,
          ramp: fx.ramp([[0, '#fff1a8', 1.4], [1, '#ff7b2a', 1.1]]),
        }, T);
        fx.burst({
          shape: 'streak', dir: 'sphere', count: 18, origin: C, speed: [26, 36], drag: 8,
          life: [D, 2 * D], stretch: 0.05, size: [0.09, 0.02], soft: 0.8,
          ramp: fx.ramp([[0, '#ffffff', 1.3], [1, '#ffe7a3', 1.1]]),
        }, T);
        fx.target({
          dir: AWAY, color: '#ffffff', rimColor: '#ffb347',
          rim: [[0, 0], [T + 2 * D, 1], [T + 10 * D, 0]],
          jolt: [[0, 0], [T, 0.05], [T + 6 * D, 0]],
          knock: [[0, 0], [T, 0], [T + 2 * D, 0.18, 'outQuad'], [T + 14 * D, 0, 'inOutSine']],
        });
        fx.light({ pos: C, color: '#ffb35c', distance: 4.5, shadow: true, intensity: [[0, 0], [T, 2], [T + 0.001, 28], [T + 3 * D, 11], [T + 12 * D, 0, 'outQuad']] });
        fx.shake([[0, 0], [T, 0], [T + 0.001, 0.22], [T + 10 * D, 0, 'outQuad']]);
      },
    },
  },
};
