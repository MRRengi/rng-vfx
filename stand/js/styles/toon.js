import { HIT, HIT_LIGHT, HIT_DIR, BLAST, UP, AWAY, at } from './layout.js';

// Toon / cartoon. Full frame rate, round friendly shapes that pop in with
// overshoot, hold, then shrink away. Clustered puffs share one thick outline.
// Small broken rings, a dust skirt on the ground, a bouncy target.
export default {
  id: 'toon',
  name: 'Toon',
  blurb: 'Pop-in with overshoot, clustered two-tone puffs with one outline that shrink out, broken rings, dust skirt, bouncy target.',
  look: { fps: 0, tone: 'neutral', bloom: { strength: 0.12, threshold: 1.6, radius: 0.15 } },
  effects: {
    impact: {
      duration: 0.5,
      contact: 0,
      build(fx) {
        fx.celOutline('#2b2b55', 3);
        fx.flash({
          pos: HIT, size: 0.85, hard: true, spikes: 5, spikeLen: 0.62, core: 0.36, sharp: 1, poly: 0.08, jitter: 0.2, bias: 0.4, blend: 'alpha', outline: 0.1, outlineColor: '#2b2b55', redraw: 20, rot: 0,
          dir: HIT_DIR, aspect: 1.6, core_color: '#fffbd0', coreK: 1.0, edge_color: '#ffc62e', edgeK: 1.0, order: 0,
          scaleCurve: [[0, 0.85], [0.06, 1.12, 'outBack'], [0.09, 0.95], [0.12, 1.06], [0.16, 0, 'inQuad']],
          alphaCurve: [[0, 1], [0.16, 1], [0.161, 0]],
        }, 0);
        fx.ring({
          normal: [0.75, 0.3, 0.9], pos: at(HIT, HIT_DIR[0] * 0.2, HIT_DIR[1] * 0.2, HIT_DIR[2] * 0.2), size: 1.5, aspect: 1.5, hard: true, noise: 0, blend: 'alpha', coverage: 0.6, seed: 3,
          color: '#ffffff', colorK: 1, color2: '#ffffff', color2K: 1,
          radius: [[0, 0.5], [0.1, 0.8, 'outBack']], width: [[0, 0.05], [0.1, 0.0, 'inQuad']],
          alpha: [[0, 1], [0.099, 1], [0.1, 0]],
        }, 0.05);
        // Drawn puffs (image-model keyframes, recipes/flipbooks.md): pop in, full, holes, bits.
        fx.burst({
          shape: 'sheet', cel: true, sheet: { url: './textures/toon_puff_2x2.png', grid: [2, 2], frames: 4, stepped: true },
          dir: 'cone', axis: HIT_DIR, angle: 45, count: 3, seed: 11, origin: at(HIT, HIT_DIR[0] * 0.35, HIT_DIR[1] * 0.35, HIT_DIR[2] * 0.35),
          spawnR: 0.05, speed: [2.2, 3.2], drag: 6, life: [0.36, 0.46], size: [0.95, 0.8], sizeIn: 0.15, sizeRand: 0.25,
          blend: 'alpha', fadeDist: 0.05, fade: [0, 0.999], ramp: fx.ramp([[0, '#ffffff', 1], [1, '#ffffff', 1]]),
        }, 0.03);
        fx.burst({
          shape: 'sparkle', soft: 100, dir: 'cone', axis: HIT_DIR, angle: 70, count: 7, origin: HIT, speed: [3, 5], drag: 4,
          gravity: [0, -3, 0], life: [0.45, 0.6], size: [0.38, 0.15], sizePow: 1.5, sizeIn: 0.2, spin: 4, fade: [0, 1],
          ramp: fx.ramp([[0, '#fff38a', 1.1], [1, '#ff8ad8', 1.0]]),
        }, 0.04);
        fx.target({
          dir: HIT_DIR, color: '#fff3c0', rimColor: '#ffd84a',
          flash: [[0, 0.25], [0.033, 0.25], [0.034, 0]],
          rim: [[0, 0], [0.034, 1], [0.15, 0]],
          knock: [[0, 0], [0.06, 0.2, 'outQuad'], [0.4, -0.05, 'inOutSine'], [0.6, 0, 'inOutSine']],
          squash: [[0, 0], [0.04, 1, 'outQuad'], [0.14, -0.5, 'inOutSine'], [0.26, 0.2, 'inOutSine'], [0.38, 0, 'inOutSine']],
        });
        fx.light({ pos: HIT_LIGHT, color: '#fff0b0', distance: 1.8, intensity: [[0, 0], [0.02, 2.2], [0.1, 0]] });
        fx.shake([[0, 0.05], [0.22, 0, 'outQuad']]);
      },
    },
    explosion: {
      duration: 0.95,
      contact: 0,
      build(fx) {
        const C = at(BLAST, 0, 0.5, 0);
        fx.celOutline('#3a1e3a', 3);
        // Short pop disc under the puffs, smaller than the fireball.
        fx.flash({
          pos: C, size: 0.7, hard: true, spikes: 6, spikeLen: 0.35, core: 0.55, sharp: 0.6, outline: 0.1, outlineColor: '#3a1e3a', blend: 'alpha', depthTest: true, order: 0,
          core_color: '#ffffff', coreK: 1.0, edge_color: '#fff2a8', edgeK: 1.0,
          scaleCurve: [[0, 0], [0.05, 1, 'outBack'], [0.085, 0, 'inQuad']],
          alphaCurve: [[0, 1], [0.085, 1], [0.086, 0]],
        }, 0);
        fx.burst({
          // Drawn fire puffs (image-model keyframes): pop in, full, holes, bits.
          shape: 'sheet', cel: true, sheet: { url: './textures/toon_fire_2x2.png', grid: [2, 2], frames: 4, stepped: true, ease: 0.5 },
          dir: 'cone', axis: UP, angle: 50, count: 6, sizeDist: [2, 3, 1], origin: C, spawnR: 0.6,
          speed: [1.8, 3.4], drag: 6, life: [0.6, 0.8], size: [5.2, 4.4], sizeIn: 0.08, sizeRand: 0.2, blend: 'alpha', fadeDist: 0.05, order: 3,
          fade: [0, 0.999], ramp: fx.ramp([[0, '#ffffff', 1.05], [1, '#ffffff', 1.0]]),
        }, 0.02);
        fx.burst({
          // Drawn smoke puffs: 2 tones, outline, holes as they go.
          shape: 'sheet', cel: true, sheet: { url: './textures/toon_smoke_3x2.png', grid: [3, 2], frames: 6, stepped: true },
          dir: 'cone', axis: UP, angle: 40, count: 6, sizeDist: [2, 3, 1], origin: at(C, 0, 0.4, 0), spawnR: 0.6,
          speed: [1.2, 2.2], gravity: [0, 1.5, 0], drag: 3, delay: [0, 0.1], life: [0.6, 0.8], size: [2.5, 3.0], sizeIn: 0.15,
          blend: 'alpha', fadeDist: 0.05, fade: [0, 0.999], order: 1, ramp: fx.ramp([[0, '#ffffff', 1], [1, '#ffffff', 1]]),
        }, 0.38);
        // Stem: three puffs that tie the fireball to the ground.
        fx.burst({
          shape: 'sheet', cel: true, sheet: { url: './textures/toon_fire_2x2.png', grid: [2, 2], frames: 4, stepped: true, ease: 0.5 },
          dir: 'cone', axis: UP, angle: 10, count: 3, seed: 23, origin: at(BLAST, 0, 0.45, 0), spawnR: 0.1,
          speed: [1.5, 2.5], drag: 6, life: [0.55, 0.75], size: [1.9, 1.7], sizeIn: 0.08, blend: 'alpha', fadeDist: 0.05, fade: [0, 0.999], order: 2,
          ramp: fx.ramp([[0, '#ffffff', 1.0], [1, '#ffffff', 1]]),
        }, 0.02);
        for (const [delay, seed, speed] of [[0.2, 21, [6, 8]], [0.28, 22, [4, 5]]]) {
          fx.burst({
            shape: 'puff', cel: true, dir: 'ring', lift: 0.05, count: 14, seed, origin: at(BLAST, 0, 0.38, 0), speed, drag: 6,
            life: [0.45, 0.6], size: [0.35, 0.0], sizePow: 2, sizeIn: 0.15, bands: 1, outline: 0,
            shadow: '#a89cc0', erode: 0, noiseScale: 1.4, blend: 'alpha', ground: 0, fadeDist: 0.05,
            ramp: fx.ramp([[0, '#ffffff', 1], [1, '#d8d0e6', 1]]),
          }, delay);
        }
        fx.burst({
          shape: 'sparkle', soft: 100, dir: 'hemi', count: 8, origin: C, speed: [5, 8], drag: 1.5,
          gravity: [0, -9, 0], life: [0.6, 0.9], size: [0.42, 0.2], sizeIn: 0.15, spin: 6, fade: [0, 1],
          ramp: fx.ramp([[0, '#fff7a0', 1.1], [1, '#ffd000', 1.0]]),
        }, 0.05);
        fx.target({
          dir: AWAY, color: '#fff3c0', rimColor: '#ffb627',
          knock: [[0, 0], [0.08, 0.25, 'outQuad'], [0.45, -0.06, 'inOutSine'], [0.7, 0, 'inOutSine']],
          squash: [[0, 0], [0.06, 1, 'outQuad'], [0.2, -0.6, 'inOutSine'], [0.34, 0.25, 'inOutSine'], [0.5, 0, 'inOutSine']],
        });
        fx.light({ pos: C, color: '#ffd38a', distance: 4.5, shadow: true, intensity: [[0, 0], [0.03, 7], [0.1, 9], [0.25, 4], [0.45, 0]] });
        fx.shake([[0, 0.1], [0.4, 0, 'outQuad']]);
      },
    },
  },
};
