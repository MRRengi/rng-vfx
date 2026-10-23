import { HIT, HIT_DIR, BLAST, UP, AWAY, at } from './layout.js';

// Realism. Physics first: sparks fan out across the view (never toward the
// camera), follow gravity and drag, bounce and cool along a blackbody ramp.
// Fire is one premultiplied particle that glows hot and occludes as it cools,
// smoke is dense, lit from below and keeps billowing for seconds. Short flash,
// exposure dip instead of a white-out, distortion, flickering light, no rims.
const BLACKBODY = [[0, '#ffffff', 2.5], [0.15, '#fff1b8', 2.0], [0.4, '#ffb347', 1.6], [0.75, '#ff5a1a', 1.2], [1, '#661100', 1]];

export default {
  id: 'realism',
  name: 'Realism',
  blurb: 'Sparks across the view with gravity, drag and bounce, blackbody cooling, premultiplied fire into dense lit smoke, distortion.',
  look: { fps: 0, tone: 'agx', bloom: { strength: 0.25, threshold: 1.1, radius: 0.2 } },
  effects: {
    impact: {
      duration: 2.0,
      contact: 0,
      build(fx) {
        const bb = fx.ramp(BLACKBODY);
        const SPRAY = [1, 0.55, -0.2];
        fx.hitstop(0.0, 2);
        fx.flash({
          pos: HIT, size: 0.6, spikes: 0, spikeLen: 0, core: 0.7, soft: 4, dir: SPRAY, aspect: 3.2,
          core_color: '#fff6e0', coreK: 3, edge_color: '#ffb050', edgeK: 1.4,
          scaleCurve: [[0, 1], [0.05, 0.6]], alphaCurve: [[0, 1], [0.033, 1], [0.05, 0]],
        }, 0);
        fx.burst({
          shape: 'streak', dir: 'cone', axis: SPRAY, angle: 50, count: 70, origin: HIT,
          speed: [4, 11], gravity: [0, -9.81, 0], drag: 0.6, life: [0.4, 1.1], stretch: 0.05,
          size: [0.035, 0.015], soft: 1, ground: 0, bounce: 0.3, fade: [0, 0.85], ramp: bb,
        }, 0);
        fx.burst({
          shape: 'streak', dir: 'cone', axis: SPRAY, angle: 25, count: 18, seed: 31, origin: HIT,
          speed: [12, 18], gravity: [0, -9.81, 0], drag: 0.5, life: [0.3, 0.6], stretch: 0.12,
          size: [0.035, 0.02], soft: 1, ground: 0, bounce: 0.3, fade: [0, 0.8], ramp: bb,
        }, 0);
        // Dust: a fast directional jet that stops dead, then a slow haze.
        fx.burst({
          shape: 'smoke', dir: 'cone', axis: [-1, 0.35, 0.35], angle: 25, count: 6, origin: HIT, spawnR: 0.05,
          speed: [6, 9], drag: 7, gravity: [0, 0.15, 0], life: [0.9, 1.3], size: [0.2, 0.9], sizePow: 0.4,
          shadow: '#7a7068', noiseScale: 3, erode: 0.5, blend: 'alpha', order: -1, fade: [0.04, 0.4], fadeDist: 0.25,
          ramp: fx.ramp([[0, '#b0a596', 1, 0.7], [1, '#8f857a', 1, 0]]),
        }, 0.01);
        fx.burst({
          shape: 'smoke', dir: 'cone', axis: [-1, 0.5, 0.4], angle: 50, count: 4, origin: HIT, spawnR: 0.15,
          speed: [0.5, 1.2], drag: 3, gravity: [0, 0.2, 0], delay: [0.05, 0.1], life: [1.8, 2.0], size: [0.6, 1.8], sizePow: 0.5,
          shadow: '#7a7068', noiseScale: 2.5, erode: 0.5, blend: 'alpha', order: -2, fade: [0.1, 0.5], fadeDist: 0.3,
          ramp: fx.ramp([[0, '#a89d90', 1, 0.45], [1, '#8f857a', 1, 0]]),
        }, 0.02);
        fx.burst({
          shape: 'shard', dir: 'cone', axis: [-0.6, 0.6, 0.5], angle: 60, count: 10, sizeDist: [2, 4, 4], origin: HIT, speed: [2, 5],
          gravity: [0, -9.81, 0], drag: 0.4, life: [0.7, 1.1], size: [0.11, 0.08], spin: 15, ground: 0, bounce: 0.25,
          blend: 'alpha', fade: [0, 0.9], ramp: fx.ramp([[0, '#8a837c', 1], [1, '#5c5650', 1]]),
        }, 0);
        fx.target({
          dir: HIT_DIR,
          jolt: [[0, 0.025], [0.15, 0]],
          knock: [[0, 0], [0.05, 0.05, 'outQuad'], [0.4, 0, 'inOutSine']],
        });
        // Small hot spot on the surface, close and short.
        fx.light({ pos: at(HIT, 0, 0, 0.3), color: '#ffb066', distance: 2, intensity: [[0, 12], [0.05, 0, 'outQuad']] });
        fx.shake([[0, 0.035], [0.15, 0, 'outQuad']]);
      },
    },
    explosion: {
      duration: 4.4,
      contact: 0,
      build(fx) {
        const C = at(BLAST, 0, 0.5, 0);
        const bb = fx.ramp(BLACKBODY);
        const fireK = [[0, 1.4], [0.4, 0.8], [1.3, 0.15, 'outQuad'], [3, 0]];
        fx.hitstop(0.0, 2);
        fx.flash({
          pos: C, size: 2.2, spikes: 0, spikeLen: 0, core: 0.8, soft: 4,
          core_color: '#fffaf0', coreK: 3.5, edge_color: '#ffcf7a', edgeK: 1.6,
          scaleCurve: [[0, 0.6], [0.03, 1, 'outExpo']], alphaCurve: [[0, 1], [0.03, 1], [0.05, 0]],
        }, 0);
        fx.exposure([[0, 1], [0.03, 0.6], [0.35, 1, 'outQuad']]);
        fx.burst({
          shape: 'fire', dir: 'cone', axis: UP, angle: 45, count: 18, sizeDist: [4, 8, 6], origin: C, spawnR: 0.45,
          speed: [3, 6], drag: 3, gravity: [0, 2.0, 0], life: [0.9, 1.5], size: [1.8, 3.4], sizePow: 0.4, stretch: 0.02,
          soft: 0.9, erode: 1, noiseScale: 3, vBias: 0.25, blend: 'premul', order: 3, fadeDist: 0.4,
          ramp: fx.ramp([[0, '#fff8e6', 3], [0.2, '#ffd27a', 2.0], [0.45, '#ff7a1f', 1.3], [0.7, '#a3260f', 0.9], [0.88, '#2a1410', 1], [1, '#161210', 1]]),
        }, 0);
        // Stem and base: the fireball sits on the ground.
        fx.burst({
          shape: 'fire', dir: 'cone', axis: UP, angle: 15, count: 5, origin: at(BLAST, 0, 0.1, 0), spawnR: 0.2,
          speed: [4, 6], drag: 3, life: [0.7, 1.0], size: [1.2, 1.8], stretch: 0.04, soft: 0.9, erode: 1, noiseScale: 3,
          vBias: 0.3, blend: 'premul', order: 4, fadeDist: 0.3,
          ramp: fx.ramp([[0, '#fff8e6', 2.6], [0.3, '#ffb347', 1.4], [0.7, '#7a200c', 0.9], [1, '#161210', 1]]),
        }, 0);
        fx.burst({
          shape: 'smoke', dir: 'cone', axis: UP, angle: 30, count: 20, sizeDist: [4, 8, 8], origin: at(C, 0, 0.3, 0), spawnR: 0.35,
          speed: [1, 2.6], gravity: [0, 1.2, 0], drag: 2, delay: [0.12, 0.2], life: [3.5, 4.5], size: [1.4, 4.2], sizePow: 0.45,
          shadow: '#3a3430', noiseScale: 2.4, erode: 0.45, blend: 'alpha', order: 2, fade: [0.05, 0.6], fadeDist: 0.5,
          fireGlow: { color: '#ff7a2a', intensity: 0.8, height: 1.2, k: fireK },
          ramp: fx.ramp([[0, '#1c1916', 1, 0.95], [0.5, '#3d3833', 1, 0.85], [1, '#6b655f', 1, 0]]),
        }, 0);
        fx.burst({
          shape: 'smoke', dir: 'ring', lift: 0.15, count: 50, sizeDist: [4, 10, 30], origin: at(BLAST, 0, 0.25, 0), speed: [5, 14],
          drag: 4, life: [1.4, 2.0], size: [0.6, 1.8], sizePow: 0.5, shadow: '#8a8074', ground: 0,
          noiseScale: 3, erode: 0.5, blend: 'alpha', order: 1, fade: [0.05, 0.5], fadeDist: 0.3,
          ramp: fx.ramp([[0, '#a8998a', 1, 0.6], [1, '#a8998a', 1, 0]]),
        }, 0.03);
        fx.burst({
          shape: 'smoke', dir: 'ring', lift: 0.05, count: 6, seed: 41, origin: at(BLAST, 0, 0.3, 0), speed: [1, 2],
          drag: 2, life: [3.0, 3.8], size: [1.5, 3.2], sizePow: 0.5, shadow: '#8a8074', ground: 0,
          noiseScale: 2.4, erode: 0.45, blend: 'alpha', order: 0, fade: [0.08, 0.55], fadeDist: 0.4,
          ramp: fx.ramp([[0, '#9a8c7e', 1, 0.5], [1, '#9a8c7e', 1, 0]]),
        }, 0.1);
        fx.burst({
          shape: 'shard', dir: 'hemi', count: 40, sizeDist: [6, 12, 22], origin: C, speed: [6, 14], gravity: [0, -9.81, 0], drag: 0.3,
          life: [1.2, 2.0], size: [0.35, 0.3], spin: 12, ground: 0, bounce: 0.25, blend: 'alpha', fade: [0, 0.95],
          ramp: fx.ramp([[0, '#3e3a36', 1], [1, '#2a2725', 1]]),
        }, 0);
        fx.burst({
          shape: 'streak', dir: 'hemi', count: 14, origin: C, speed: [8, 14], gravity: [0, -9.81, 0], drag: 0.3,
          life: [0.8, 1.4], stretch: 0.03, size: [0.06, 0.03], soft: 1, ground: 0, bounce: 0.3, fade: [0, 0.8], ramp: bb,
        }, 0);
        fx.burst({
          shape: 'streak', dir: 'hemi', count: 50, origin: C, speed: [5, 12], gravity: [0, -9.81, 0], drag: 0.8,
          life: [0.5, 1.2], stretch: 0.04, size: [0.035, 0.015], soft: 1, ground: 0, bounce: 0.3, fade: [0, 0.85], ramp: bb,
        }, 0);
        fx.distort({ kind: 'ring', pos: at(BLAST, 0, 0.05, 0), size: 12, radius: [[0, 0.05], [0.3, 0.95, 'outExpo']], width: [[0, 0.06], [0.3, 0.03]], strength: [[0, 0.04], [0.3, 0]] }, 0);
        fx.distort({ kind: 'heat', pos: at(C, 0, 1.4, 0), size: 5, strength: [[0, 0.016], [2.5, 0.006], [3.8, 0]] }, 0.05);
        fx.decal({ pos: at(BLAST, 0, 0.012, 0), size: 4, hot: '#ff6a1f', hotK: 1.2, dark: '#0e0b09', glow: [[0, 1], [1.2, 0, 'outQuad']] }, 0);
        fx.target({
          dir: AWAY,
          jolt: [[0, 0.05], [0.5, 0]],
          knock: [[0, 0], [0.1, 0.16, 'outQuad'], [1.0, 0, 'inOutSine']],
        });
        fx.light({ pos: C, color: '#ffa860', distance: 12, shadow: true, flicker: 0.15, intensity: [[0, 0], [0.02, 70], [0.3, 25, 'outQuad'], [1.8, 0, 'outQuad']] });
        fx.shake([[0, 0.28], [1.0, 0, 'outQuad']]);
      },
    },
  },
};
