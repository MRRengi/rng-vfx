import { HIT, HIT_LIGHT, BLAST, at } from './layout.js';

// Dark fantasy (ARPG school). Black reads as a color: dark cores with hot
// crimson rims, alpha-blended black smoke, embers that linger, glowing
// cracks in the ground, heavy camera weight. Bright values are rationed.
export default {
  id: 'darkfantasy',
  name: 'Dark Fantasy',
  blurb: 'Black cores with hot rims, alpha-blended black smoke, lingering embers, glowing cracks, heavy weight.',
  look: { fps: 0, tone: 'agx', bloom: { strength: 0.55, threshold: 1.1, radius: 0.35 } },
  effects: {
    impact: {
      duration: 1.3,
      build(fx) {
        fx.slash({
          pos: at(HIT, 0, 0, 0.25), rot: [0.2, -0.3, -0.35], scale: 1.05, from: 160, to: -30, rIn: 0.8, rOut: 1.5,
          blend: 'alpha', hard: false, coreColor: '#080103', coreK: 1, edgeColor: '#3a0408', edgeK: 1,
          rimColor: '#ff3a22', rimK: 2.4, rimW: 0.32, noise: 0.3, dissolve: 0.5, thick: 0.8,
          head: [[0, 0], [0.09, 1.0, 'outQuart'], [0.42, 1.75, 'inQuad']], alpha: [[0, 1], [0.25, 1], [0.42, 0]], tail: 0.75,
        }, 0);
        fx.flash({
          pos: HIT, size: 1.5, spikes: 7, spikeLen: 0.9, core: 0.2, sharp: 20, jitter: 0.8, soft: 1.8,
          core_color: '#ffd2c2', coreK: 3, edge_color: '#ff1a1a', edgeK: 2,
          scaleCurve: [[0, 0], [0.03, 1, 'outExpo'], [0.15, 0.4]], alphaCurve: [[0, 1], [0.06, 1], [0.16, 0]],
        }, 0.05);
        fx.burst({
          shape: 'streak', dir: 'cone', axis: [0.6, 0.3, 1], angle: 55, count: 24, origin: HIT,
          speed: [3, 6.5], gravity: [0, -14, 0], drag: 1, life: [0.4, 0.75], stretch: 0.03,
          size: [0.08, 0.05], soft: 0.6, blend: 'alpha', ground: 0, fade: [0, 0.85],
          ramp: fx.ramp([[0, '#9a0010', 1], [1, '#3a0004', 1]]),
        }, 0.05);
        fx.burst({
          shape: 'glow', dir: 'sphere', count: 22, origin: HIT, spawnR: 0.3, speed: [1, 3], gravity: [0, 1.5, 0],
          drag: 2, curl: 0.5, life: [0.8, 1.4], size: [0.08, 0.02], soft: 2.2,
          ramp: fx.ramp([[0, '#ffb38a', 3], [0.5, '#ff2a0a', 2.5], [1, '#400000', 1]]),
        }, 0.05);
        fx.burst({
          shape: 'smoke', dir: 'sphere', count: 7, origin: HIT, spawnR: 0.2, speed: [0.4, 1], drag: 2,
          gravity: [0, 0.9, 0], delay: [0.04, 0.08], life: [0.8, 1.3], size: [0.5, 1.1], sizePow: 0.6,
          shadow: '#5a2020', noiseScale: 2.2, erode: 0.8, blend: 'alpha', order: -1, fade: [0.08, 0.45],
          ramp: fx.ramp([[0, '#1d0f12', 1, 0.9], [1, '#0a0506', 1, 0]]),
        }, 0.05);
        fx.light({ pos: HIT_LIGHT, color: '#ff2a1a', intensity: [[0, 0], [0.05, 0], [0.06, 8], [0.6, 0, 'outQuad']] });
        fx.shake([[0, 0], [0.05, 0], [0.06, 0.14], [0.45, 0, 'outQuad']]);
      },
    },
    explosion: {
      duration: 2.8,
      build(fx) {
        const T = 0.28; // cracks spread first, then the eruption
        const C = at(BLAST, 0, 0.4, 0);
        fx.decal({
          pos: at(BLAST, 0, 0.012, 0), size: 4.4, cracks: 1, hot: '#ff2a10', hotK: 3, dark: '#0a0506',
          reveal: [[0, 0], [T, 1.2, 'outQuad']], glow: [[0, 0.35], [T, 1], [2.8, 0.12, 'outQuad']],
          alpha: [[0, 0], [0.04, 1], [10, 1]],
        }, 0);
        fx.burst({
          shape: 'glow', dir: 'sphere', count: 18, origin: C, spawnR: 1.8, speed: [-5, -6], drag: 0.001,
          life: [0.25, 0.3], size: [0.06, 0.12], soft: 2, ramp: fx.ramp([[0, '#ff6a40', 2.5], [1, '#ffd0b0', 3]]),
        }, 0);
        fx.flash({
          pos: C, size: 5, spikes: 0, spikeLen: 0, core: 0.7, soft: 2,
          core_color: '#ffd8c8', coreK: 4, edge_color: '#ff1a0a', edgeK: 2.5,
          scaleCurve: [[0, 0.2], [0.05, 1, 'outExpo'], [0.25, 0.6]], alphaCurve: [[0, 1], [0.08, 1], [0.25, 0]],
        }, T);
        fx.burst({
          shape: 'fire', dir: 'hemi', count: 16, origin: C, spawnR: 0.45, speed: [2.5, 4.5], drag: 3,
          gravity: [0, 2.2, 0], life: [0.8, 1.2], size: [1.1, 2.2], sizePow: 0.45, soft: 0.8,
          erode: 1, noiseScale: 2.4, blend: 'alpha', order: 2,
          ramp: fx.ramp([[0, '#ffd0b0', 3.5], [0.2, '#ff3b1a', 2.6], [0.5, '#8b0a0a', 1.2], [0.75, '#200406', 1], [1, '#050203', 1]]),
        }, T);
        fx.burst({
          shape: 'smoke', dir: 'hemi', count: 14, origin: C, spawnR: 0.6, speed: [1, 2.2], gravity: [0, 2.6, 0],
          drag: 1.8, delay: [0.18, 0.25], life: [1.4, 2.0], size: [1.3, 2.8], sizePow: 0.5, shadow: '#4a2020',
          noiseScale: 1.7, erode: 0.6, blend: 'alpha', order: 1, fade: [0.08, 0.55],
          ramp: fx.ramp([[0, '#140a0c', 1, 0.95], [1, '#080506', 1, 0]]),
        }, T);
        fx.burst({
          shape: 'glow', dir: 'hemi', count: 40, origin: C, spawnR: 1, speed: [1, 3.5], gravity: [0, 1.6, 0],
          drag: 1.2, curl: 0.8, delay: [0.05, 0.8], life: [1.2, 2.0], size: [0.07, 0.02], sizeRand: 0.5, soft: 2.2,
          ramp: fx.ramp([[0, '#ffb07a', 3], [0.6, '#ff2a0a', 2.5], [1, '#300000', 1]]),
        }, T);
        fx.burst({
          shape: 'shard', dir: 'hemi', count: 16, origin: C, speed: [5, 9], gravity: [0, -14, 0], drag: 0.8,
          life: [0.7, 1.1], size: [0.2, 0.16], spin: 10, ground: 0, blend: 'alpha', fade: [0, 0.9],
          ramp: fx.ramp([[0, '#3a2422', 1], [1, '#1a1111', 1]]),
        }, T);
        fx.burst({
          shape: 'shard', dir: 'sphere', count: 30, origin: at(BLAST, 0, 3.4, 0), spawnR: 2.6, speed: [0.1, 0.4],
          gravity: [0, -0.6, 0], drag: 2, curl: 0.8, delay: [0.3, 0.7], life: [1.5, 2.2], size: [0.06, 0.05],
          spin: 4, blend: 'alpha', fade: [0.2, 0.7], ramp: fx.ramp([[0, '#4a4244', 1], [1, '#2c2628', 1]]),
        }, T);
        fx.ring({
          pos: at(BLAST, 0, 0.04, 0), size: 8, soft: 0.08, noise: 0.6, noiseFreq: 7,
          color: '#ff5a3a', colorK: 2, color2: '#6a0808', color2K: 1.4,
          radius: [[0, 0.05], [0.55, 0.95, 'outExpo']], width: [[0, 0.12], [0.55, 0.0, 'outQuad']],
          alpha: [[0, 1], [0.55, 0]],
        }, T);
        fx.light({ pos: C, color: '#ff2a12', intensity: [[0, 2], [T, 10], [T + 0.02, 45], [1.8, 0, 'outQuad']] });
        fx.shake([[0, 0.015], [T, 0.03], [T + 0.01, 0.28], [1.2, 0, 'outQuad']]);
      },
    },
  },
};
