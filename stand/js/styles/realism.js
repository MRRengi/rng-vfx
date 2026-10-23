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
      duration: 1.8,
      contact: 0,
      build(fx) {
        const bb = fx.ramp(BLACKBODY);
        const SPRAY = [1, 0.55, -0.2];
        // Contact streak: a 2-frame anisotropic flare along the hit, the readable contact shape.
        fx.flash({
          pos: HIT, size: 0.5, spikes: 0, spikeLen: 0, core: 0.5, soft: 3, dir: HIT_DIR, aspect: 3,
          core_color: '#fff6e0', coreK: 2, edge_color: '#ffb050', edgeK: 1.2,
          scaleCurve: [[0, 1]], alphaCurve: [[0, 1], [0.033, 1], [0.034, 0]], order: 8,
        }, 0);
        fx.flash({
          pos: HIT, size: 0.6, spikes: 0, spikeLen: 0, core: 0.7, soft: 4, dir: SPRAY, aspect: 3.2,
          core_color: '#fff6e0', coreK: 3, edge_color: '#ffb050', edgeK: 1.4,
          scaleCurve: [[0, 1], [0.05, 0.6]], alphaCurve: [[0, 1], [0.033, 1], [0.05, 0]],
        }, 0);
        fx.burst({
          shape: 'streak', dir: 'cone', axis: SPRAY, angle: 50, count: 70, origin: HIT,
          speed: [5, 18], gravity: [0, -9.81, 0], dragQ: 1.2, life: [0.25, 0.7], stretch: 0.05, minPx: 3,
          size: [0.035, 0.015], soft: 1, ground: 0, bounce: 0.3, fade: [0, 0.85], ramp: bb,
        }, 0);
        // Hero sparks: a few ribbons whose tails bend under gravity.
        fx.trail({
          dir: 'cone', axis: SPRAY, angle: 25, count: 12, seed: 31, origin: HIT,
          speed: [12, 18], gravity: [0, -9.81, 0], dragQ: 1.0, life: [0.4, 0.8], trailTime: 0.08,
          width: 0.022, minPx: 3, ground: 0, bounce: 0.3, fade: [0, 0.8], ramp: bb,
        }, 0);
        // Dust: a fast directional jet that stops dead, then a slow haze.
        fx.burst({
          shape: 'smoke', dir: 'cone', axis: [-1, 0.35, 0.35], angle: 25, count: 6, origin: HIT, spawnR: 0.05,
          speed: [3, 5], drag: 4, gravity: [0, 0.4, 0], life: [1.0, 1.3], size: [0.4, 1.6], sizePow: 0.6,
          shadow: '#7a7068', noiseScale: 3, erode: 0.3, blend: 'alpha', order: -1, fade: [0.04, 0.7], fadeDist: 0.25,
          ramp: fx.ramp([[0, '#b0a596', 1, 0.85], [0.7, '#9a9085', 1, 0.8], [1, '#8f857a', 1, 0]]),
        }, 0.01);
        fx.burst({
          shape: 'smoke', dir: 'cone', axis: [-1, 0.5, 0.4], angle: 50, count: 4, origin: HIT, spawnR: 0.15,
          speed: [0.5, 1.2], drag: 3, gravity: [0, 0.2, 0], delay: [0.05, 0.1], life: [1.8, 2.0], size: [0.6, 1.8], sizePow: 0.5,
          shadow: '#7a7068', noiseScale: 2.5, erode: 0.3, blend: 'alpha', order: -2, fade: [0.1, 0.75], fadeDist: 0.3,
          ramp: fx.ramp([[0, '#a89d90', 1, 0.6], [0.7, '#968b80', 1, 0.55], [1, '#8f857a', 1, 0]]),
        }, 0.02);
        fx.burst({
          shape: 'shard', dir: 'cone', axis: [-0.6, 0.6, 0.5], angle: 60, count: 10, sizeDist: [2, 4, 4], origin: HIT, speed: [2, 5],
          gravity: [0, -9.81, 0], drag: 0.4, life: [0.7, 1.1], size: [0.17, 0.1], spin: 15, ground: 0, bounce: 0.25,
          blend: 'alpha', fade: [0, 0.9], ramp: fx.ramp([[0, '#5e5852', 1], [1, '#3e3a36', 1]]),
        }, 0);
        fx.target({
          dir: HIT_DIR,
          jolt: [[0, 0.025], [0.15, 0]],
          knock: [[0, 0], [0.05, 0.05, 'outQuad'], [0.4, 0, 'inOutSine']],
          squash: [[0, 0], [0.033, 0.6], [0.2, 0, 'outQuad']],
        });
        // Small hot spot on the surface, close and short.
        fx.light({ pos: at(HIT, 0, 0, 0.3), color: '#ffb066', distance: 1.5, intensity: [[0, 3], [0.05, 0, 'outQuad']] });
        fx.shake([[0, 0.035], [0.15, 0, 'outQuad']]);
      },
    },
    explosion: {
      duration: 4.2,
      contact: 0,
      build(fx) {
        const C = at(BLAST, 0, 0.5, 0);
        const bb = fx.ramp(BLACKBODY);
        const fireK = [[0, 1.4], [0.4, 0.8], [1.3, 0.15, 'outQuad'], [3, 0]];
        fx.flash({
          pos: C, size: 2.2, spikes: 0, spikeLen: 0, core: 0.8, soft: 4,
          core_color: '#fffaf0', coreK: 3.5, edge_color: '#ffcf7a', edgeK: 1.6,
          scaleCurve: [[0, 0.6], [0.03, 1, 'outExpo']], alphaCurve: [[0, 1], [0.03, 1], [0.05, 0]],
        }, 0);
        fx.exposure([[0, 1], [0.03, 0.6], [0.35, 1, 'outQuad']]);
        fx.burst({
          shape: 'fire', dir: 'cone', axis: UP, angle: 45, count: 5, sizeDist: [3, 2, 0], origin: C, spawnR: 0.6, spin: 0.35, sizeIn: 0.12,
          speed: [2.5, 5], drag: 3.5, gravity: [0, 0.8, 0], life: [0.9, 1.5], size: [1.8, 3.4], sizePow: 0.4, aspectY: 1.15,
          soft: 0.9, erode: 1, noiseScale: 3, vBias: 0.25, blend: 'premul', order: 3, fadeDist: 0.4,
          ramp: fx.ramp([[0, '#ffe2a0', 1.3], [0.2, '#ffb040', 1.15], [0.45, '#ff6a10', 1.05], [0.7, '#a3260f', 0.9], [0.88, '#2a1410', 1], [1, '#161210', 1]]),
        }, 0);
        // Mid and small tiers from a flipbook: each quad plays a burning, breaking puff.
        fx.burst({
          shape: 'sheet', sheet: { url: './textures/fire_4x4.png', grid: [4, 4], frames: 16 },
          dir: 'sphere', count: 8, sizeDist: [0, 5, 3], seed: 52, origin: C, spawnR: 0.7, speed: [1.5, 4], drag: 3.5,
          gravity: [0, 0.8, 0], life: [0.7, 1.2], size: [1.2, 2.2], sizePow: 0.4, spin: 0.6, soft: 0.9, blend: 'premul', order: 3, fadeDist: 0.4,
          fade: [0.02, 0.9], ramp: fx.ramp([[0, '#ffd9a0', 1.2], [0.5, '#ffc890', 1.05], [1, '#ffb080', 0.95]]),
        }, 0);
        // Stem and base: the fireball sits on the ground.
        fx.burst({
          shape: 'fire', dir: 'cone', axis: UP, angle: 15, count: 5, origin: at(BLAST, 0, 0.1, 0), spawnR: 0.2,
          speed: [4, 6], drag: 3.5, gravity: [0, 0.8, 0], life: [0.7, 1.0], size: [1.2, 1.8], aspectY: 1.4, upright: true, soft: 0.9, erode: 1, noiseScale: 3,
          vBias: 0.3, blend: 'premul', order: 4, fadeDist: 0.3,
          ramp: fx.ramp([[0, '#fff8e6', 1.6], [0.3, '#ffb347', 1.3], [0.7, '#7a200c', 0.9], [1, '#161210', 1]]),
        }, 0);
        fx.burst({
          shape: 'smoke', dir: 'cone', axis: UP, angle: 30, count: 26, sizeDist: [6, 10, 10], origin: C, spawnR: 0.6,
          speed: [1, 2.6], gravity: [0, 0.8, 0], drag: 2, delay: [0.03, 0.6], life: [3.5, 4.5], size: [1.4, 4.2], sizePow: 0.45,
          shadow: '#3a3430', noiseScale: 2.4, erode: 0.3, blend: 'alpha', order: 2, fade: [0.05, 0.75], fadeDist: 0.5,
          fireGlow: { color: '#ff7a2a', intensity: 0.8, height: 1.2, rim: 0.6, k: fireK },
          ramp: fx.ramp([[0, '#1c1916', 1, 0.95], [0.6, '#3d3833', 1, 0.9], [1, '#6b655f', 1, 0]]),
        }, 0);
        fx.burst({
          shape: 'smoke', dir: 'ring', lift: 0.15, count: 50, sizeDist: [4, 10, 30], origin: at(BLAST, 0, 0.25, 0), speed: [5, 14],
          drag: 4, life: [1.4, 2.0], size: [0.6, 1.8], sizePow: 0.5, shadow: '#8a8074', ground: 0,
          noiseScale: 3, erode: 0.3, blend: 'alpha', order: 1, fade: [0.05, 0.75], fadeDist: 0.3,
          ramp: fx.ramp([[0, '#a8998a', 1, 0.85], [0.7, '#a0927f', 1, 0.8], [1, '#a8998a', 1, 0]]),
        }, 0.03);
        fx.burst({
          shape: 'smoke', dir: 'ring', lift: 0.05, count: 6, seed: 41, origin: at(BLAST, 0, 0.3, 0), speed: [1, 2],
          drag: 2, life: [3.0, 3.8], size: [1.5, 3.2], sizePow: 0.5, shadow: '#8a8074', ground: 0,
          noiseScale: 2.4, erode: 0.3, blend: 'alpha', order: 0, fade: [0.08, 0.75], fadeDist: 0.4,
          ramp: fx.ramp([[0, '#9a8c7e', 1, 0.8], [0.7, '#928474', 1, 0.75], [1, '#9a8c7e', 1, 0]]),
        }, 0.1);
        fx.burst({
          shape: 'shard', dir: 'hemi', count: 40, sizeDist: [6, 12, 22], origin: C, speed: [6, 14], gravity: [0, -9.81, 0], drag: 0.3,
          life: [1.2, 2.0], size: [0.35, 0.3], spin: 12, ground: 0, bounce: 0.25, blend: 'alpha', fade: [0, 0.95],
          ramp: fx.ramp([[0, '#3e3a36', 1], [1, '#2a2725', 1]]),
        }, 0);
        fx.trail({
          dir: 'hemi', count: 14, origin: C, speed: [10, 18], gravity: [0, -9.81, 0], dragQ: 0.25,
          life: [0.8, 1.4], trailTime: 0.12, width: 0.045, minPx: 3, ground: 0, bounce: 0.3, fade: [0, 0.8], ramp: bb,
        }, 0);
        fx.burst({
          shape: 'streak', dir: 'hemi', count: 50, origin: C, speed: [6, 16], gravity: [0, -9.81, 0], dragQ: 0.35,
          life: [0.5, 1.2], stretch: 0.04, minPx: 3, size: [0.035, 0.015], soft: 1, ground: 0, bounce: 0.3, fade: [0, 0.85], ramp: bb,
        }, 0);
        fx.distort({ kind: 'ring', pos: at(BLAST, 0, 0.05, 0), size: 12, radius: [[0, 0.05], [0.3, 0.95, 'outExpo']], width: [[0, 0.06], [0.3, 0.03]], strength: [[0, 0.018], [0.3, 0]] }, 0);
        fx.distort({ kind: 'heat', pos: at(C, 0, 1.4, 0), size: 5, strength: [[0, 0.016], [2.5, 0.006], [3.8, 0]] }, 0.05);
        // Scorch darkens the ground (multiply) with ejecta streaks; never an alpha-black disc.
        fx.decal({ pos: at(BLAST, 0, 0.012, 0), size: 5, multiply: true, strength: 0.55, hot: '#ff6a1f', hotK: 1.2, dark: '#0e0b09', glow: [[0, 1], [1.2, 0, 'outQuad']] }, 0);
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
