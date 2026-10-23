import { HIT, HIT_LIGHT, HIT_DIR, BLAST, UP, AWAY, at } from './layout.js';

// Dark fantasy (ARPG school). Black reads as a colour: dark torn shapes with
// hot rims and burning dissolves, blood with real value that lands as splats,
// black smoke lit from inside by its fire, branching radial cracks that cool
// unevenly, heavy weight.
export default {
  id: 'darkfantasy',
  name: 'Dark Fantasy',
  blurb: 'Dark torn shapes with hot rims, burning dissolves, blood that splats, fire-lit black smoke, branching cracks that cool unevenly.',
  look: { fps: 0, tone: 'agx', bloom: { strength: 0.4, threshold: 1.2, radius: 0.25 } },
  effects: {
    impact: {
      duration: 1.2,
      contact: 0.05,
      build(fx) {
        fx.hitstop(0.05, 4);
        fx.slash({
          pos: at(HIT, 0, 0, 0.25), rot: [0.2, -0.3, -0.35], scale: 1.05, from: 160, to: -30, rIn: 0.8, rOut: 1.5,
          blend: 'alpha', hard: false, coreColor: '#1a0306', coreK: 1, edgeColor: '#5a0810', edgeK: 1,
          rimColor: '#ff3a22', rimK: 2.0, rimW: 0.28, noise: 0.3, dissolve: 0.3, thick: 0.85,
          burnColor: '#ff5a2a', burnK: 1.6, burnW: 0.05,
          head: [[0, 0], [0.07, 1.0, 'outQuart'], [0.1, 1.05], [0.26, 1.75, 'inQuad']], alpha: [[0, 1], [0.18, 1], [0.26, 0]], tail: 0.75,
        }, 0);
        // Claw strands: thin torn arcs riding the main slash, each a frame late.
        for (const [k, rIn, rOut] of [[0, 1.56, 1.64], [1, 0.64, 0.72]]) {
          fx.slash({
            pos: at(HIT, 0, 0, 0.25), rot: [0.2, -0.3, -0.35], scale: 1.05, from: 150, to: -20,
            rIn, rOut, torn: 0.4, blend: 'alpha', hard: false,
            coreColor: '#1a0306', coreK: 1, edgeColor: '#5a0810', edgeK: 1, rimColor: '#ff3a22', rimK: 1.8, rimW: 0.6,
            noise: 0.4, dissolve: 0.8, thick: 1,
            head: [[0, 0], [0.09, 1.0, 'outQuart'], [0.3, 1.6, 'inQuad']], alpha: [[0, 1], [0.2, 1], [0.27, 0]], tail: 0.55,
          }, 0.017 * (k + 1));
        }
        fx.flash({
          pos: HIT, size: 1.6, spikes: 4, spikeLen: 1.1, core: 0.22, sharp: 2.5, jitter: 2.0, soft: 1.5, blend: 'alpha', bias: 0.6,
          dir: HIT_DIR, aspect: 1.6, core_color: '#0a0204', coreK: 1, edge_color: '#ff3a22', edgeK: 1.4,
          scaleCurve: [[0, 0.5], [0.03, 1, 'outExpo'], [0.08, 1.15]], alphaCurve: [[0, 1], [0.05, 1], [0.08, 0]],
        }, 0.05);
        fx.flash({
          pos: HIT, size: 0.45, spikes: 0, spikeLen: 0, core: 0.7, soft: 4, core_color: '#ffd8c8', coreK: 2.4, edge_color: '#ff2a1a', edgeK: 1.2,
          scaleCurve: [[0, 1]], alphaCurve: [[0, 1], [0.03, 1], [0.04, 0]], order: 9,
        }, 0.05);
        fx.burst({
          shape: 'streak', dir: 'cone', axis: HIT_DIR, angle: 40, count: 30, origin: HIT,
          speed: [3, 7], gravity: [0, -14, 0], drag: 1, life: [0.45, 0.8], stretch: 0.03,
          size: [0.14, 0.06], soft: 0.6, blend: 'alpha', ground: 0, fade: [0, 0.9], minPx: 2,
          ramp: fx.ramp([[0, '#c0101a', 1], [1, '#6a0008', 1]]),
        }, 0.05);
        fx.decal({
          pos: at(HIT, 1.1, -1.14, -0.1), size: 1.5, splat: true, dark: '#8a0010', seed: 9,
          alpha: [[0, 0], [0.28, 0], [0.3, 0.95], [10, 0.95]], reveal: [[0, 0], [0.28, 0], [0.45, 1.1, 'outQuad']],
        }, 0.05);
        fx.burst({
          shape: 'glow', dir: 'cone', axis: HIT_DIR, angle: 80, count: 24, sizeDist: [2, 6, 12], origin: HIT, spawnR: 0.3,
          speed: [1, 3], gravity: [0, 1.5, 0], drag: 2, curl: 0.8, life: [0.8, 1.4], size: [0.1, 0.02], soft: 2.2,
          ramp: fx.ramp([[0, '#ffb38a', 1.8], [0.5, '#ff2a0a', 1.3], [1, '#400000', 1]]),
        }, 0.05);
        fx.burst({
          shape: 'smoke', dir: 'cone', axis: HIT_DIR, angle: 70, count: 7, origin: HIT, spawnR: 0.2, speed: [0.4, 1], drag: 2,
          gravity: [0, 0.9, 0], delay: [0.04, 0.08], life: [0.7, 1.0], size: [0.6, 1.2], sizePow: 0.5,
          shadow: '#5a2020', noiseScale: 3, erode: 0.3, blend: 'alpha', order: -1, fade: [0.06, 0.75],
          fireGlow: { color: '#ff2a12', intensity: 1.2, height: 0.4, rim: 0.6, k: [[0, 0.8], [0.5, 0]] },
          ramp: fx.ramp([[0, '#2a1418', 1, 0.9], [0.7, '#1a0c0e', 1, 0.88], [1, '#0a0506', 1, 0]]),
        }, 0.05);
        fx.target({
          dir: HIT_DIR, color: '#400404', rimColor: '#ff3a22',
          flash: [[0, 0], [0.049, 0], [0.05, 1], [0.083, 1], [0.084, 0]],
          rim: [[0, 0], [0.05, 1], [0.15, 0]],
          squash: [[0, 0], [0.05, 0], [0.08, 0.6], [0.3, 0, 'outQuad']],
          jolt: [[0, 0], [0.05, 0.05], [0.3, 0]],
          knock: [[0, 0], [0.05, 0], [0.1, 0.12, 'outQuad'], [0.7, 0, 'inOutSine']],
        });
        fx.light({ pos: HIT_LIGHT, color: '#ff2a1a', distance: 3, intensity: [[0, 0], [0.05, 0], [0.06, 6], [0.3, 0, 'outQuad']] });
        fx.shake([[0, 0], [0.05, 0], [0.06, 0.12], [0.4, 0, 'outQuad']]);
      },
    },
    explosion: {
      duration: 3.2,
      contact: 0.28,
      build(fx) {
        const T = 0.28; // cracks spread first, then the eruption
        const C = at(BLAST, 0, 0.4, 0);
        const fireK = [[0, 0], [T, 0.3], [T + 0.05, 1.4], [T + 1.5, 0.15, 'outQuad'], [3.4, 0]];
        fx.hitstop(T + 0.05, 3);
        fx.exposure([[0, 1], [T, 1], [T + 0.03, 0.7], [T + 0.45, 1, 'outQuad']]);
        fx.decal({
          pos: at(BLAST, 0, 0.012, 0), size: 4.6, cracks: 1, scorch: 1, hot: '#ff2a10', hotK: 1.6, dark: '#0a0506',
          reveal: [[0, 0], [T, 1.2, 'outQuad']], glow: [[0, 0.35], [T, 1], [3.4, 0.05, 'outQuad']],
          alpha: [[0, 0], [0.04, 1], [10, 1]],
        }, 0);
        fx.burst({
          shape: 'glow', dir: 'sphere', count: 26, origin: C, spawnR: 1.8, speed: [-5, -6], drag: 0.001,
          life: [0.25, 0.3], size: [0.1, 0.18], soft: 2, ramp: fx.ramp([[0, '#ff6a40', 1.5], [1, '#ffd0b0', 1.8]]),
        }, 0);
        fx.flash({
          pos: C, size: 2.2, spikes: 0, spikeLen: 0, core: 0.7, soft: 4,
          core_color: '#ffd8c8', coreK: 1.8, edge_color: '#ff1a0a', edgeK: 1.2,
          scaleCurve: [[0, 0.4], [0.04, 1, 'outExpo']], alphaCurve: [[0, 1], [0.04, 1], [0.08, 0]],
        }, T);
        fx.burst({
          shape: 'fire', dir: 'cone', axis: UP, angle: 55, count: 9, sizeDist: [3, 5, 1], origin: C, spawnR: 0.45,
          speed: [5, 8], drag: 3.5, gravity: [0, 0.8, 0], life: [0.9, 1.3], size: [2.6, 4.2], sizePow: 0.45, aspectY: 1.35, upright: true,
          soft: 0.8, erode: 1, noiseScale: 3, vBias: 0.3, blend: 'premul', order: 3, fadeDist: 0.4,
          ramp: fx.ramp([[0, '#ffb070', 1.2], [0.2, '#e8300f', 1.1], [0.5, '#8b0a0a', 1.0], [0.75, '#200406', 1], [1, '#050203', 1]]),
        }, T);
        fx.burst({
          shape: 'fire', dir: 'cone', axis: UP, angle: 18, count: 7, origin: C, spawnR: 0.2, speed: [9, 12], drag: 2.5,
          life: [0.6, 0.9], size: [0.9, 1.4], stretch: 0.1, soft: 0.7, erode: 1, noiseScale: 3, vBias: 0.5, blend: 'premul', order: 4,
          ramp: fx.ramp([[0, '#ffd0b0', 1.4], [0.3, '#ff3b1a', 1.2], [0.7, '#5a0606', 1], [1, '#050203', 1]]),
        }, T + 0.02);
        fx.burst({
          shape: 'smoke', dir: 'cone', axis: UP, angle: 40, count: 20, sizeDist: [5, 8, 7], origin: C, spawnR: 0.5,
          speed: [1, 2.2], gravity: [0, 1.4, 0], drag: 1.8, delay: [0.03, 0.6], life: [2.0, 2.8], size: [1.6, 3.2], sizePow: 0.45,
          shadow: '#4a2020', noiseScale: 2.4, erode: 0.3, blend: 'alpha', order: 2, fade: [0.06, 0.75], fadeDist: 0.4,
          fireGlow: { color: '#ff2a12', intensity: 2.2, height: 1.2, rim: 0.8, k: fireK },
          ramp: fx.ramp([[0, '#3a1c1c', 1, 0.95], [0.7, '#2a1414', 1, 0.9], [1, '#140a0c', 1, 0]]),
        }, T);
        fx.burst({
          shape: 'smoke', dir: 'ring', lift: 0.05, count: 18, origin: at(BLAST, 0, 0.25, 0), speed: [5, 8], drag: 5,
          life: [1.3, 1.9], size: [0.6, 1.6], sizePow: 0.5, shadow: '#4a2020', ground: 0, noiseScale: 3, erode: 0.3,
          blend: 'alpha', order: 1, fade: [0.05, 0.75], fadeDist: 0.3,
          fireGlow: { color: '#ff2a12', intensity: 1.2, height: 0.8, k: fireK },
          ramp: fx.ramp([[0, '#1e1012', 1, 0.9], [1, '#080506', 1, 0]]),
        }, T + 0.02);
        fx.burst({
          shape: 'glow', dir: 'hemi', count: 44, sizeDist: [2, 8, 20], origin: C, spawnR: 1, speed: [1, 3.5], gravity: [0, 1.6, 0],
          drag: 1.2, curl: 1.0, delay: [0.05, 0.8], life: [1.2, 2.0], size: [0.1, 0.02], soft: 2.2,
          ramp: fx.ramp([[0, '#ffb07a', 1.8], [0.6, '#ff2a0a', 1.3], [1, '#300000', 1]]),
        }, T);
        fx.burst({
          shape: 'shard', dir: 'hemi', count: 16, sizeDist: [3, 6, 7], origin: C, speed: [5, 9], gravity: [0, -14, 0], drag: 0.8,
          life: [0.8, 1.2], size: [0.3, 0.24], spin: 10, ground: 0, bounce: 0.25, blend: 'alpha', fade: [0, 0.9],
          ramp: fx.ramp([[0, '#4a2c28', 1], [1, '#241616', 1]]),
        }, T);
        fx.burst({
          shape: 'shard', dir: 'sphere', count: 34, origin: at(BLAST, 0, 3.4, 0), spawnR: 2.6, speed: [0.1, 0.4],
          gravity: [0, -0.6, 0], drag: 2, curl: 0.8, delay: [0.4, 0.9], life: [1.5, 2.2], size: [0.1, 0.08],
          spin: 4, blend: 'alpha', fade: [0.2, 0.7], ramp: fx.ramp([[0, '#6a6266', 1], [1, '#4a4446', 1]]),
        }, T);
        fx.ring({
          pos: at(BLAST, 0, 0.04, 0), size: 4, soft: 0.02, noise: 0.6, noiseFreq: 7, edge: 1.5, coverage: 0.6, seed: 8,
          color: '#ff5a3a', colorK: 1.2, color2: '#3a0404', color2K: 1,
          radius: [[0, 0.05], [0.45, 0.95, 'outExpo']], width: [[0, 0.02], [0.45, 0.0, 'outQuad']],
          alpha: [[0, 0.5], [0.45, 0]],
        }, T);
        fx.distort({ kind: 'ring', pos: at(BLAST, 0, 0.05, 0), size: 9, radius: [[0, 0.05], [0.55, 0.95, 'outExpo']], width: [[0, 0.1], [0.55, 0.04]], strength: [[0, 0.0158], [0.55, 0]] }, T);
        fx.distort({ kind: 'heat', pos: at(C, 0, 1.4, 0), size: 4.5, strength: [[0, 0.014], [2.0, 0.006], [2.9, 0]] }, T);
        fx.target({
          dir: AWAY, color: '#400404', rimColor: '#ff3a22',
          rim: [[0, 0.15], [T, 0.3], [T + 0.05, 1], [T + 0.25, 0.2, 'outQuad'], [T + 1.5, 0.05]],
          jolt: [[0, 0.01], [T, 0.02], [T + 0.01, 0.06], [T + 0.5, 0]],
          knock: [[0, 0], [T, 0], [T + 0.1, 0.2, 'outQuad'], [T + 1.0, 0, 'inOutSine']],
        });
        fx.light({ pos: C, color: '#ff2a12', distance: 9, shadow: true, flicker: 0.25, intensity: [[0, 1], [T, 4], [T + 0.02, 22], [2.0, 0, 'outQuad']] });
        fx.shake([[0, 0.015], [T, 0.03], [T + 0.01, 0.26], [T + 1.2, 0, 'outQuad']]);
      },
    },
  },
};
