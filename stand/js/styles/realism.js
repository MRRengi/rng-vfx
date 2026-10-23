import { HIT, HIT_LIGHT, HIT_DIR, BLAST, UP, AWAY, at } from './layout.js';

// Realism. Physics first: sparks fan out across the view (never toward the
// camera), follow gravity and drag, bounce and cool along a blackbody ramp.
// Fire is one premultiplied particle that glows hot and occludes as it cools,
// smoke is lit from below by it and keeps billowing for seconds. Short flash,
// exposure dip instead of a white-out, distortion, flickering light.
const BLACKBODY = [[0, '#ffffff', 6], [0.15, '#fff1b8', 4], [0.4, '#ffb347', 2.5], [0.75, '#ff5a1a', 1.5], [1, '#661100', 1]];

export default {
  id: 'realism',
  name: 'Realism',
  blurb: 'Sparks across the view with gravity, drag and bounce, blackbody cooling, premultiplied fire into lit smoke, distortion.',
  look: { fps: 0, tone: 'agx', bloom: { strength: 0.5, threshold: 1.1, radius: 0.25 } },
  effects: {
    impact: {
      duration: 1.8,
      contact: 0,
      build(fx) {
        const bb = fx.ramp(BLACKBODY);
        const SPRAY = [1, 0.55, -0.2];
        fx.flash({
          pos: HIT, size: 0.6, spikes: 0, spikeLen: 0, core: 0.7, soft: 4, dir: SPRAY, aspect: 3.2,
          core_color: '#fff6e0', coreK: 4, edge_color: '#ffb050', edgeK: 1.6,
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
          size: [0.035, 0.02], soft: 1, intensity: 1.6, ground: 0, bounce: 0.3, fade: [0, 0.8], ramp: bb,
        }, 0);
        fx.burst({
          shape: 'smoke', dir: 'cone', axis: [-1, 0.35, 0.35], angle: 35, count: 9, origin: HIT, spawnR: 0.05,
          speed: [3, 5], drag: 5, gravity: [0, 0.2, 0], life: [1.0, 1.6], size: [0.15, 1.0], sizePow: 0.4,
          shadow: '#7a7068', noiseScale: 3, erode: 0.6, blend: 'alpha', order: -1, fade: [0.04, 0.4], fadeDist: 0.25,
          ramp: fx.ramp([[0, '#9a8f82', 1, 0.6], [1, '#7f766c', 1, 0]]),
        }, 0.01);
        fx.burst({
          shape: 'shard', dir: 'cone', axis: [-0.6, 0.6, 0.5], angle: 60, count: 10, sizeDist: [2, 4, 4], origin: HIT, speed: [2, 5],
          gravity: [0, -9.81, 0], drag: 0.4, life: [0.7, 1.1], size: [0.11, 0.08], spin: 15, ground: 0, bounce: 0.25,
          blend: 'alpha', fade: [0, 0.9], ramp: fx.ramp([[0, '#8a837c', 1], [1, '#5c5650', 1]]),
        }, 0);
        fx.target({
          dir: HIT_DIR, rimColor: '#ffb066',
          rim: [[0, 0.6], [0.08, 0]],
          jolt: [[0, 0.025], [0.15, 0]],
          knock: [[0, 0], [0.05, 0.05, 'outQuad'], [0.4, 0, 'inOutSine']],
        });
        fx.light({ pos: HIT_LIGHT, color: '#ffb066', distance: 2.5, intensity: [[0, 4], [0.05, 0, 'outQuad']] });
        fx.shake([[0, 0.035], [0.15, 0, 'outQuad']]);
      },
    },
    explosion: {
      duration: 4.0,
      contact: 0,
      build(fx) {
        const C = at(BLAST, 0, 0.5, 0);
        const bb = fx.ramp(BLACKBODY);
        const fireK = [[0, 2], [0.4, 1.2], [1.3, 0.2, 'outQuad'], [3, 0]];
        fx.flash({
          pos: C, size: 2.5, spikes: 0, spikeLen: 0, core: 0.8, soft: 4,
          core_color: '#fffaf0', coreK: 5, edge_color: '#ffcf7a', edgeK: 2,
          scaleCurve: [[0, 0.6], [0.03, 1, 'outExpo']], alphaCurve: [[0, 1], [0.03, 1], [0.05, 0]],
        }, 0);
        fx.exposure([[0, 1], [0.03, 0.6], [0.35, 1, 'outQuad']]);
        // One temperature-driven particle: hot core glows through, cooled
        // edges occlude like smoke (premultiplied blend).
        fx.burst({
          shape: 'fire', dir: 'cone', axis: UP, angle: 65, count: 20, sizeDist: [4, 10, 6], origin: C, spawnR: 0.6,
          speed: [3, 6], drag: 3, gravity: [0, 2.0, 0], life: [0.9, 1.5], size: [1.8, 3.4], sizePow: 0.4, stretch: 0.02,
          soft: 0.9, erode: 1, noiseScale: 3, vBias: 0.25, blend: 'premul', order: 3, fadeDist: 0.4,
          ramp: fx.ramp([[0, '#fff8e6', 4], [0.2, '#ffd27a', 2.4], [0.45, '#ff7a1f', 1.4], [0.7, '#a3260f', 0.9], [0.88, '#2a1410', 1], [1, '#161210', 1]]),
        }, 0);
        fx.burst({
          shape: 'smoke', dir: 'cone', axis: UP, angle: 55, count: 20, sizeDist: [4, 8, 8], origin: at(C, 0, 0.3, 0), spawnR: 0.7,
          speed: [1, 2.6], gravity: [0, 1.2, 0], drag: 2, delay: [0.12, 0.2], life: [3.5, 4.5], size: [1.4, 4.2], sizePow: 0.45,
          shadow: '#4a4440', noiseScale: 2.4, erode: 0.5, blend: 'alpha', order: 2, fade: [0.05, 0.6], fadeDist: 0.5,
          fireGlow: { color: '#ff7a2a', intensity: 1.5, height: 2.5, k: fireK },
          ramp: fx.ramp([[0, '#2b2622', 1, 0.95], [0.5, '#4a443f', 1, 0.8], [1, '#6b655f', 1, 0]]),
        }, 0);
        fx.burst({
          shape: 'smoke', dir: 'ring', lift: 0.05, count: 50, origin: at(BLAST, 0, 0.25, 0), speed: [8, 12],
          drag: 4, life: [1.4, 2.0], size: [0.6, 1.8], sizePow: 0.5, shadow: '#8a8074', ground: 0,
          noiseScale: 3, erode: 0.6, blend: 'alpha', order: 1, fade: [0.05, 0.5], fadeDist: 0.3,
          ramp: fx.ramp([[0, '#a8998a', 1, 0.55], [1, '#a8998a', 1, 0]]),
        }, 0.03);
        fx.burst({
          shape: 'shard', dir: 'hemi', count: 40, sizeDist: [10, 0, 30], origin: C, speed: [6, 14], gravity: [0, -9.81, 0], drag: 0.3,
          life: [1.2, 2.0], size: [0.26, 0.22], spin: 12, ground: 0, bounce: 0.25, blend: 'alpha', fade: [0, 0.95],
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
          dir: AWAY, rimColor: '#ffa860',
          rim: [[0, 1], [0.6, 0]],
          jolt: [[0, 0.05], [0.5, 0]],
          knock: [[0, 0], [0.1, 0.16, 'outQuad'], [1.0, 0, 'inOutSine']],
        });
        fx.light({ pos: C, color: '#ffa860', distance: 12, shadow: true, flicker: 0.15, intensity: [[0, 0], [0.02, 70], [0.3, 25, 'outQuad'], [1.8, 0, 'outQuad']] });
        fx.shake([[0, 0.28], [1.0, 0, 'outQuad']]);
      },
    },
  },
};
