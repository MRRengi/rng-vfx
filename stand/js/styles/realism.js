import { HIT, HIT_LIGHT, BLAST, at } from './layout.js';

// Realism. Physics first: sparks follow gravity and drag and cool along a
// blackbody ramp, fire cools into smoke as it rises, dust spreads along the
// ground, debris arcs ballistically. HDR intensities, filmic tone mapping,
// short bright flash, long soft decay.
export default {
  id: 'realism',
  name: 'Realism',
  blurb: 'Gravity and drag, blackbody cooling, fire that turns into smoke, ground-hugging dust, filmic HDR.',
  look: { fps: 0, tone: 'agx', bloom: { strength: 0.6, threshold: 1.0, radius: 0.3 } },
  effects: {
    impact: {
      duration: 1.6,
      build(fx) {
        const blackbody = fx.ramp([[0, '#ffffff', 8], [0.15, '#fff1b8', 6], [0.4, '#ffb347', 4], [0.75, '#ff5a1a', 2.5], [1, '#661100', 1]]);
        fx.flash({
          pos: HIT, size: 0.5, spikes: 0, spikeLen: 0, core: 0.7, soft: 2.5,
          core_color: '#fff6e0', coreK: 4, edge_color: '#ffb050', edgeK: 3,
          scaleCurve: [[0, 1], [0.05, 0.6]], alphaCurve: [[0, 1], [0.02, 1], [0.06, 0]],
        }, 0);
        fx.burst({
          shape: 'streak', dir: 'cone', axis: [0.25, 0.55, 1], angle: 65, count: 90, origin: HIT,
          speed: [4, 12], gravity: [0, -9.81, 0], drag: 0.6, life: [0.4, 1.1], stretch: 0.07,
          size: [0.06, 0.025], soft: 1, ground: 0, fade: [0, 0.85], ramp: blackbody,
        }, 0);
        fx.burst({
          shape: 'smoke', dir: 'sphere', count: 8, origin: HIT, spawnR: 0.1, speed: [0.5, 1.5], drag: 3,
          gravity: [0, 0.25, 0], life: [1.0, 1.6], size: [0.3, 1.4], sizePow: 0.5, shadow: '#7a7068',
          noiseScale: 2.5, erode: 0.6, blend: 'alpha', order: -1, fade: [0.05, 0.4],
          ramp: fx.ramp([[0, '#8a7f72', 1, 0.55], [1, '#6f665c', 1, 0]]),
        }, 0.01);
        fx.burst({
          shape: 'shard', dir: 'cone', axis: [0, 0.6, 1], angle: 70, count: 10, origin: HIT, speed: [2, 5],
          gravity: [0, -9.81, 0], drag: 0.4, life: [0.6, 1.0], size: [0.05, 0.04], spin: 15, ground: 0,
          blend: 'alpha', fade: [0, 0.9], ramp: fx.ramp([[0, '#5a5550', 1], [1, '#3c3834', 1]]),
        }, 0);
        fx.light({ pos: HIT_LIGHT, color: '#ffb066', intensity: [[0, 8], [0.12, 0, 'outQuad']] });
        fx.shake([[0, 0.04], [0.15, 0, 'outQuad']]);
      },
    },
    explosion: {
      duration: 3.2,
      build(fx) {
        const C = at(BLAST, 0, 0.5, 0);
        const blackbody = fx.ramp([[0, '#ffffff', 8], [0.2, '#fff1b8', 6], [0.5, '#ffb347', 4], [0.8, '#ff5a1a', 2.5], [1, '#661100', 1]]);
        fx.flash({
          pos: C, size: 4.5, spikes: 0, spikeLen: 0, core: 0.8, soft: 2.4,
          core_color: '#fffaf0', coreK: 5, edge_color: '#ffcf7a', edgeK: 2.5,
          scaleCurve: [[0, 0.6], [0.04, 1, 'outExpo']], alphaCurve: [[0, 1], [0.06, 1], [0.16, 0]],
        }, 0);
        fx.burst({
          shape: 'fire', dir: 'hemi', count: 20, origin: C, spawnR: 0.6, speed: [3, 6], drag: 3,
          gravity: [0, 2.5, 0], life: [0.7, 1.3], size: [1.0, 2.4], sizePow: 0.4, soft: 0.9,
          erode: 1, noiseScale: 2.4, blend: 'alpha', order: 3,
          ramp: fx.ramp([[0, '#fff8e6', 5], [0.2, '#ffd27a', 3.5], [0.45, '#ff7a1f', 2.2], [0.7, '#a3260f', 1.2], [0.88, '#2a1410', 1], [1, '#161210', 1]]),
        }, 0);
        fx.burst({
          shape: 'smoke', dir: 'hemi', count: 18, origin: C, spawnR: 0.7, speed: [1, 3], gravity: [0, 3, 0],
          drag: 1.4, delay: [0.15, 0.2], life: [2.0, 2.8], size: [1.4, 3.4], sizePow: 0.5, shadow: '#4a4440',
          noiseScale: 1.6, erode: 0.5, blend: 'alpha', order: 2, fade: [0.06, 0.55],
          ramp: fx.ramp([[0, '#2b2622', 1, 0.95], [0.5, '#4a443f', 1, 0.8], [1, '#6b655f', 1, 0]]),
        }, 0);
        fx.burst({
          shape: 'smoke', dir: 'ring', lift: 0.05, count: 20, origin: at(BLAST, 0, 0.25, 0), speed: [8, 12],
          drag: 4, life: [1.2, 1.8], size: [0.5, 1.6], sizePow: 0.5, shadow: '#8a8074', ground: 0,
          noiseScale: 2, erode: 0.6, blend: 'alpha', order: 1, fade: [0.05, 0.5],
          ramp: fx.ramp([[0, '#9a8c7a', 1, 0.6], [1, '#9a8c7a', 1, 0]]),
        }, 0.03);
        fx.burst({
          shape: 'shard', dir: 'hemi', count: 30, origin: C, speed: [6, 14], gravity: [0, -9.81, 0], drag: 0.3,
          life: [1.2, 2.0], size: [0.12, 0.1], spin: 12, ground: 0, blend: 'alpha', fade: [0, 0.95],
          ramp: fx.ramp([[0, '#2e2a27', 1], [1, '#1c1a18', 1]]),
        }, 0);
        fx.burst({
          shape: 'streak', dir: 'hemi', count: 14, origin: C, speed: [8, 14], gravity: [0, -9.81, 0], drag: 0.3,
          life: [0.8, 1.4], stretch: 0.02, size: [0.06, 0.03], soft: 1, ground: 0, fade: [0, 0.8], ramp: blackbody,
        }, 0);
        fx.burst({
          shape: 'streak', dir: 'hemi', count: 40, origin: C, speed: [5, 12], gravity: [0, -9.81, 0], drag: 0.8,
          life: [0.5, 1.2], stretch: 0.025, size: [0.03, 0.015], soft: 1, ground: 0, fade: [0, 0.85], ramp: blackbody,
        }, 0);
        fx.ring({
          pos: at(BLAST, 0, 0.04, 0), size: 10, soft: 0.1, noise: 0.5, noiseFreq: 8,
          color: '#d8d0c4', colorK: 0.9, color2: '#a89c8c', color2K: 0.6, blend: 'alpha',
          radius: [[0, 0.05], [0.25, 0.95, 'outExpo']], width: [[0, 0.05], [0.25, 0.0]],
          alpha: [[0, 0.5], [0.25, 0]],
        }, 0);
        fx.decal({ pos: at(BLAST, 0, 0.012, 0), size: 4, hot: '#ff6a1f', hotK: 1.5, dark: '#0e0b09', glow: [[0, 1], [1.2, 0, 'outQuad']] }, 0);
        fx.light({ pos: C, color: '#ffa860', intensity: [[0, 0], [0.02, 110], [0.3, 30, 'outQuad'], [1.6, 0, 'outQuad']] });
        fx.shake([[0, 0.3], [1.0, 0, 'outQuad']]);
      },
    },
  },
};
