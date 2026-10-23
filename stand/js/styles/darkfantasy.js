import { HIT, HIT_LIGHT, HIT_DIR, BLAST, UP, AWAY, at } from './layout.js';

// Dark fantasy (ARPG school). Black reads as a colour: dark torn shapes with
// hot rims and burning dissolve edges, blood with real value, black smoke lit
// from inside by its fire, radial cracks that cool unevenly, heavy weight.
export default {
  id: 'darkfantasy',
  name: 'Dark Fantasy',
  blurb: 'Dark torn shapes with hot rims, burning dissolves, blood that lands, fire-lit black smoke, radial cracks cooling unevenly.',
  look: { fps: 0, tone: 'agx', bloom: { strength: 0.5, threshold: 1.1, radius: 0.3 } },
  effects: {
    impact: {
      duration: 1.4,
      contact: 0.05,
      build(fx) {
        fx.slash({
          pos: at(HIT, 0, 0, 0.25), rot: [0.2, -0.3, -0.35], scale: 1.05, from: 160, to: -30, rIn: 0.8, rOut: 1.5,
          blend: 'alpha', hard: false, coreColor: '#080103', coreK: 1, edgeColor: '#3a0408', edgeK: 1,
          rimColor: '#ff3a22', rimK: 2.2, rimW: 0.3, noise: 0.3, dissolve: 0.6, thick: 0.85,
          burnColor: '#ff5a2a', burnK: 3, burnW: 0.05,
          head: [[0, 0], [0.09, 1.0, 'outQuart'], [0.16, 1.05], [0.45, 1.75, 'inQuad']], alpha: [[0, 1], [0.38, 1], [0.45, 0]], tail: 0.75,
        }, 0);
        // Torn dark splash along the swing, plus a tiny hot core.
        fx.flash({
          pos: HIT, size: 1.6, spikes: 6, spikeLen: 1.0, core: 0.25, sharp: 3, jitter: 1.5, soft: 1.5, blend: 'alpha',
          dir: HIT_DIR, aspect: 2, core_color: '#0a0204', coreK: 1, edge_color: '#ff3a22', edgeK: 1.6,
          scaleCurve: [[0, 0.5], [0.04, 1, 'outExpo'], [0.2, 1.1]], alphaCurve: [[0, 1], [0.12, 1], [0.22, 0]],
        }, 0.05);
        fx.flash({
          pos: HIT, size: 0.5, spikes: 0, spikeLen: 0, core: 0.7, soft: 4, core_color: '#ffd8c8', coreK: 3, edge_color: '#ff2a1a', edgeK: 1.5,
          scaleCurve: [[0, 1]], alphaCurve: [[0, 1], [0.03, 1], [0.04, 0]], order: 9,
        }, 0.05);
        fx.burst({
          shape: 'streak', dir: 'cone', axis: HIT_DIR, angle: 40, count: 30, origin: HIT,
          speed: [3, 7], gravity: [0, -14, 0], drag: 1, life: [0.45, 0.8], stretch: 0.06,
          size: [0.12, 0.05], soft: 0.6, blend: 'alpha', ground: 0, fade: [0, 0.9], minPx: 2,
          ramp: fx.ramp([[0, '#c0101a', 1], [1, '#5a0008', 1]]),
        }, 0.05);
        fx.decal({
          pos: at(HIT, 1.0, -1.14, -0.3), size: 1.6, scorch: 1, dark: '#4a0308', hot: '#000000', hotK: 0, seed: 9,
          alpha: [[0, 0], [0.35, 0], [0.42, 0.9], [10, 0.9]], reveal: [[0, 0], [0.35, 0], [0.5, 1, 'outQuad']], glow: [[0, 0]],
        }, 0.05);
        fx.burst({
          shape: 'glow', dir: 'cone', axis: HIT_DIR, angle: 80, count: 24, sizeDist: [2, 6, 12], origin: HIT, spawnR: 0.3,
          speed: [1, 3], gravity: [0, 1.5, 0], drag: 2, curl: 0.8, life: [0.8, 1.4], size: [0.1, 0.02], soft: 2.2,
          ramp: fx.ramp([[0, '#ffb38a', 2.2], [0.5, '#ff2a0a', 1.6], [1, '#400000', 1]]),
        }, 0.05);
        fx.burst({
          shape: 'smoke', dir: 'cone', axis: HIT_DIR, angle: 70, count: 7, origin: HIT, spawnR: 0.2, speed: [0.4, 1], drag: 2,
          gravity: [0, 0.9, 0], delay: [0.04, 0.08], life: [0.8, 1.3], size: [0.6, 1.2], sizePow: 0.6,
          shadow: '#5a2020', noiseScale: 3, erode: 0.8, blend: 'alpha', order: -1, fade: [0.08, 0.45],
          fireGlow: { color: '#ff2a12', intensity: 1, height: 1.2, k: [[0, 0.8], [0.5, 0]] },
          ramp: fx.ramp([[0, '#2a1418', 1, 0.9], [1, '#0a0506', 1, 0]]),
        }, 0.05);
        fx.target({
          dir: HIT_DIR, color: '#ff2a1a', rimColor: '#ff3a22',
          flash: [[0, 0], [0.049, 0], [0.05, 0.6], [0.08, 0]],
          rim: [[0, 0], [0.05, 1], [0.6, 0]],
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
        const fireK = [[0, 0], [T, 0.3], [T + 0.05, 1.4], [T + 1.5, 0.15, 'outQuad'], [3.2, 0]];
        fx.decal({
          pos: at(BLAST, 0, 0.012, 0), size: 4.6, cracks: 1, scorch: 1, hot: '#ff2a10', hotK: 2.4, dark: '#0a0506',
          reveal: [[0, 0], [T, 1.2, 'outQuad']], glow: [[0, 0.35], [T, 1], [3.2, 0.05, 'outQuad']],
          alpha: [[0, 0], [0.04, 1], [10, 1]],
        }, 0);
        fx.burst({
          shape: 'glow', dir: 'sphere', count: 18, origin: C, spawnR: 1.8, speed: [-5, -6], drag: 0.001,
          life: [0.25, 0.3], size: [0.06, 0.12], soft: 2, ramp: fx.ramp([[0, '#ff6a40', 1.8], [1, '#ffd0b0', 2.2]]),
        }, 0);
        fx.flash({
          pos: C, size: 2.5, spikes: 0, spikeLen: 0, core: 0.7, soft: 4,
          core_color: '#ffd8c8', coreK: 3, edge_color: '#ff1a0a', edgeK: 1.6,
          scaleCurve: [[0, 0.4], [0.04, 1, 'outExpo']], alphaCurve: [[0, 1], [0.04, 1], [0.08, 0]],
        }, T);
        fx.burst({
          shape: 'fire', dir: 'cone', axis: UP, angle: 55, count: 16, sizeDist: [5, 8, 3], origin: C, spawnR: 0.45,
          speed: [2.5, 4.5], drag: 3, gravity: [0, 2.2, 0], life: [0.9, 1.3], size: [1.9, 3.2], sizePow: 0.45, stretch: 0.03,
          soft: 0.8, erode: 1, noiseScale: 3, vBias: 0.3, blend: 'premul', order: 3, fadeDist: 0.4,
          ramp: fx.ramp([[0, '#ffd0b0', 2.6], [0.2, '#ff3b1a', 1.6], [0.5, '#8b0a0a', 1.0], [0.75, '#200406', 1], [1, '#050203', 1]]),
        }, T);
        // Upward column of fire tongues gives the eruption vertical structure.
        fx.burst({
          shape: 'fire', dir: 'cone', axis: UP, angle: 18, count: 7, origin: C, spawnR: 0.2, speed: [6, 9], drag: 2.5,
          life: [0.6, 0.9], size: [0.7, 1.1], stretch: 0.1, soft: 0.7, erode: 1, noiseScale: 3, vBias: 0.5, blend: 'premul', order: 4,
          ramp: fx.ramp([[0, '#ffd0b0', 2.4], [0.3, '#ff3b1a', 1.4], [0.7, '#5a0606', 1], [1, '#050203', 1]]),
        }, T + 0.02);
        fx.burst({
          shape: 'smoke', dir: 'cone', axis: UP, angle: 45, count: 14, sizeDist: [3, 6, 5], origin: at(C, 0, 0.4, 0), spawnR: 0.6,
          speed: [1, 2.2], gravity: [0, 1.6, 0], drag: 1.8, delay: [0.15, 0.25], life: [1.6, 2.3], size: [1.4, 2.9], sizePow: 0.5,
          shadow: '#4a2020', noiseScale: 2.4, erode: 0.6, blend: 'alpha', order: 2, fade: [0.08, 0.55], fadeDist: 0.4,
          fireGlow: { color: '#ff2a12', intensity: 1.4, height: 2.2, k: fireK },
          ramp: fx.ramp([[0, '#1e1012', 1, 0.95], [1, '#080506', 1, 0]]),
        }, T);
        fx.burst({
          shape: 'smoke', dir: 'ring', lift: 0.05, count: 18, origin: at(BLAST, 0, 0.25, 0), speed: [6, 8], drag: 5,
          life: [1.2, 1.7], size: [0.6, 1.5], sizePow: 0.5, shadow: '#4a2020', ground: 0, noiseScale: 3, erode: 0.6,
          blend: 'alpha', order: 1, fade: [0.05, 0.5], fadeDist: 0.3,
          fireGlow: { color: '#ff2a12', intensity: 0.8, height: 0.8, k: fireK },
          ramp: fx.ramp([[0, '#1e1012', 1, 0.85], [1, '#080506', 1, 0]]),
        }, T + 0.02);
        fx.burst({
          shape: 'glow', dir: 'hemi', count: 44, sizeDist: [2, 8, 20], origin: C, spawnR: 1, speed: [1, 3.5], gravity: [0, 1.6, 0],
          drag: 1.2, curl: 1.0, delay: [0.05, 0.8], life: [1.2, 2.0], size: [0.1, 0.02], soft: 2.2,
          ramp: fx.ramp([[0, '#ffb07a', 2.2], [0.6, '#ff2a0a', 1.6], [1, '#300000', 1]]),
        }, T);
        fx.burst({
          shape: 'shard', dir: 'hemi', count: 16, sizeDist: [3, 6, 7], origin: C, speed: [5, 9], gravity: [0, -14, 0], drag: 0.8,
          life: [0.8, 1.2], size: [0.26, 0.2], spin: 10, ground: 0, bounce: 0.25, blend: 'alpha', fade: [0, 0.9],
          ramp: fx.ramp([[0, '#4a2c28', 1], [1, '#241616', 1]]),
        }, T);
        fx.burst({
          shape: 'shard', dir: 'sphere', count: 34, origin: at(BLAST, 0, 3.4, 0), spawnR: 2.6, speed: [0.1, 0.4],
          gravity: [0, -0.6, 0], drag: 2, curl: 0.8, delay: [0.4, 0.9], life: [1.5, 2.2], size: [0.1, 0.08],
          spin: 4, blend: 'alpha', fade: [0.2, 0.7], ramp: fx.ramp([[0, '#6a6266', 1], [1, '#4a4446', 1]]),
        }, T);
        fx.ring({
          pos: at(BLAST, 0, 0.04, 0), size: 8, soft: 0.03, noise: 0.6, noiseFreq: 7, edge: 2,
          color: '#ff5a3a', colorK: 1.4, color2: '#3a0404', color2K: 1,
          radius: [[0, 0.05], [0.5, 0.95, 'outExpo']], width: [[0, 0.04], [0.5, 0.0, 'outQuad']],
          alpha: [[0, 0.8], [0.5, 0]],
        }, T);
        fx.distort({ kind: 'ring', pos: at(BLAST, 0, 0.05, 0), size: 9, radius: [[0, 0.05], [0.55, 0.95, 'outExpo']], width: [[0, 0.1], [0.55, 0.04]], strength: [[0, 0.035], [0.55, 0]] }, T);
        fx.distort({ kind: 'heat', pos: at(C, 0, 1.4, 0), size: 4.5, strength: [[0, 0.014], [2.0, 0.006], [2.9, 0]] }, T);
        fx.target({
          dir: AWAY, color: '#ff2a1a', rimColor: '#ff3a22',
          rim: [[0, 0.15], [T, 0.3], [T + 0.05, 1], [T + 1.5, 0.1]],
          jolt: [[0, 0.01], [T, 0.02], [T + 0.01, 0.06], [T + 0.5, 0]],
          knock: [[0, 0], [T, 0], [T + 0.1, 0.2, 'outQuad'], [T + 1.0, 0, 'inOutSine']],
        });
        fx.light({ pos: C, color: '#ff2a12', distance: 9, shadow: true, flicker: 0.25, intensity: [[0, 1], [T, 4], [T + 0.02, 22], [2.0, 0, 'outQuad']] });
        fx.shake([[0, 0.015], [T, 0.03], [T + 0.01, 0.26], [T + 1.2, 0, 'outQuad']]);
      },
    },
  },
};
