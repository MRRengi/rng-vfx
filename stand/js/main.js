import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import GUI from 'lil-gui';
import { buildEffect } from './fx/builder.js';
import { G, distortScene, celScene } from './fx/globals.js';
import { STAGE, ARCHETYPES } from './styles/layout.js';
import anime from './styles/anime.js';
import toon from './styles/toon.js';
import stylized from './styles/stylized.js';
import darkfantasy from './styles/darkfantasy.js';
import pixel from './styles/pixel.js';
import realism from './styles/realism.js';
import { setupCompare } from './compare.js';

const STYLES = [anime, toon, stylized, darkfantasy, pixel, realism];
const GAP = 0.45; // seconds of empty stage between loops

// ---------------------------------------------------------------- renderer
const canvas = document.getElementById('c');
const view = document.getElementById('view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 200);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const FULL_VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';

// Screen distortion: effects draw UV offsets into distortTarget (see the
// distort primitive); this pass bends the rendered image by them.
const distortTarget = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType });
const distortPass = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, tDistort: { value: distortTarget.texture } },
  vertexShader: FULL_VS,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform sampler2D tDistort; varying vec2 vUv;
    void main() {
      vec2 off = texture2D(tDistort, vUv).xy;
      gl_FragColor = texture2D(tDiffuse, vUv + off);
    }`,
});
// ShaderPass clones its uniforms and cannot clone render-target textures; set it after.
distortPass.uniforms.tDistort.value = distortTarget.texture;
composer.addPass(distortPass);

// Cel layers render on their own, then one outline is drawn around the union
// of everything in that layer (edge detection on alpha), and the result is
// laid over the scene before bloom.
const celTarget = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType });
const celPass = new ShaderPass({
  uniforms: {
    tDiffuse: { value: null }, tCel: { value: null }, uTexel: { value: new THREE.Vector2(1, 1) },
    uOutline: { value: new THREE.Color('#1a1630') }, uPx: { value: 2.5 },
  },
  vertexShader: FULL_VS,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform sampler2D tCel; uniform vec2 uTexel; uniform vec3 uOutline; uniform float uPx;
    varying vec2 vUv;
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      vec4 cel = texture2D(tCel, vUv);
      float m = 0.0;
      for (int i = 0; i < 12; i++) {
        float a = float(i) / 12.0 * 6.2832;
        m = max(m, texture2D(tCel, vUv + vec2(cos(a), sin(a)) * uTexel * uPx).a);
      }
      float inside = step(0.5, cel.a);
      vec3 col = mix(c.rgb, cel.rgb / max(cel.a, 0.001), inside);
      col = mix(col, uOutline, step(0.5, m) * (1.0 - inside));
      gl_FragColor = vec4(col, c.a);
    }`,
});
celPass.uniforms.tCel.value = celTarget.texture;
composer.addPass(celPass);

const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.6, 0.4, 1.0);
composer.addPass(bloom);

// Anime impact frame: the target is forced to black (its own mask, written
// into alpha by the dummy's material during the frame), the background goes
// flat white, bright effect pixels go black with a crisp edge.
const impactPass = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uAmount: { value: 0 }, uMode: { value: 0 } },
  vertexShader: FULL_VS,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uAmount; uniform float uMode; varying vec2 vUv;
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
      float ink = step(0.75, l);
      vec3 paper = uMode > 0.5 ? vec3(0.85, 0.06, 0.05) : vec3(1.0, 0.98, 0.95);
      vec3 frame = mix(paper, vec3(0.0), ink);
      gl_FragColor = vec4(mix(c.rgb, frame, uAmount), c.a);
    }`,
});
composer.addPass(impactPass);
composer.addPass(new OutputPass());

// Pixel style palette: every pixel maps to the nearest colour of a fixed
// palette, compared in OKLab (perceptual), after tone mapping.
const PAL_MAX = 32;
const posterPass = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uCount: { value: 0 }, uPal: { value: Array.from({ length: PAL_MAX }, () => new THREE.Vector3()) } },
  vertexShader: FULL_VS,
  fragmentShader: `
    #define PAL_MAX ${PAL_MAX}
    uniform sampler2D tDiffuse; uniform int uCount; uniform vec3 uPal[PAL_MAX]; varying vec2 vUv;
    vec3 toLinear(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }
    vec3 oklab(vec3 c) {
      vec3 l = vec3(0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b,
                    0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b,
                    0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b);
      l = pow(max(l, 0.0), vec3(1.0 / 3.0));
      return vec3(0.2104542553 * l.x + 0.7936177850 * l.y - 0.0040720468 * l.z,
                  1.9779984951 * l.x - 2.4285922050 * l.y + 0.4505937099 * l.z,
                  0.0259040371 * l.x + 0.7827717662 * l.y - 0.8086757660 * l.z);
    }
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      if (uCount > 0) {
        vec3 q = oklab(toLinear(c.rgb));
        float best = 1e9; vec3 pick = c.rgb;
        for (int i = 0; i < PAL_MAX; i++) {
          if (i >= uCount) break;
          vec3 d = oklab(toLinear(uPal[i])) - q;
          float e = dot(d, d);
          if (e < best) { best = e; pick = uPal[i]; }
        }
        c.rgb = pick;
      }
      gl_FragColor = c;
    }`,
});
composer.addPass(posterPass);

// Opaque depth for soft particles.
const depthTarget = new THREE.WebGLRenderTarget(4, 4);
depthTarget.depthTexture = new THREE.DepthTexture(4, 4);
G.uDepth.value = depthTarget.depthTexture;
const depthOnly = new THREE.MeshBasicMaterial({ colorWrite: false });

// ---------------------------------------------------------------- world
const hemi = new THREE.HemisphereLight('#b8c4ff', '#30261e', 0.8);
const key = new THREE.DirectionalLight('#ffffff', 1.2);
key.position.set(4, 7, 5);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 0.5, far: 30 });
key.shadow.bias = -0.0005;
scene.add(hemi, key);

const texLoader = new THREE.TextureLoader();
function loadTex(url, srgb) {
  return new Promise(res => texLoader.load(url, t => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.anisotropy = 4;
    res(t);
  }));
}

const groundMat = new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0 });
let groundMaps = null;
const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Dummy with a hit-reaction material: solid flash via emissive, fresnel rim
// injected into the standard shader.
const rimUniform = { value: new THREE.Color(0, 0, 0) };
const dummyMat = new THREE.MeshStandardMaterial({ color: '#8c8f99', roughness: 0.6 });
dummyMat.onBeforeCompile = shader => {
  shader.uniforms.uRim = rimUniform;
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', '#include <common>\nuniform vec3 uRim;')
    .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      float rimF = pow(1.0 - saturate(dot(normalize(vNormal), normalize(vViewPosition))), 2.5);
      totalEmissiveRadiance += uRim * rimF;`);
};
const dummy = new THREE.Group();
const dummyBody = new THREE.Group();
{
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.9, 6, 16), dummyMat);
  body.position.y = 0.93;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 14), dummyMat);
  head.position.y = 1.62;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.06, 24), dummyMat);
  base.position.y = 0.03;
  for (const m of [body, head, base]) { m.castShadow = true; m.receiveShadow = true; }
  dummyBody.add(body, head);
  dummy.add(dummyBody, base);
}
scene.add(dummy);

const BACKGROUNDS = {
  'Dusk field': { bg: '#4b5674', ground: '#9a9a9a', hemi: 0.9, key: 1.4, fog: 0.018 },
  'Night arena': { bg: '#0c0d13', ground: '#55565e', hemi: 0.3, key: 0.45, fog: 0.035 },
  'Mid gray': { bg: '#767676', ground: '#aaaaaa', hemi: 1.0, key: 1.2, fog: 0 },
  'Bright sand': { bg: '#cfe3f1', ground: '#ffe9c4', hemi: 1.3, key: 2.0, fog: 0.012 },
};

const CAMERAS = {
  Close: { pos: [0.2, 1.7, 4.8], fov: 40 },
  Gameplay: { pos: [7.5, 9.5, 10.5], fov: 30 },
  Side: { pos: [5.5, 1.5, 0.6], fov: 40 },
  Low: { pos: [1.8, 0.35, 4.2], fov: 50 },
};

// ---------------------------------------------------------------- state
const params = {
  background: 'Dusk field',
  camera: 'Close',
  grayscale: false,
  dummy: true,
  exposure: 1,
  bloom: true,
  bloomStrength: 0.6,
  bloomThreshold: 1,
  bloomRadius: 0.4,
  fps: 'Native',
  impactFrame: true,
  shake: true,
  reaction: true,
  softParticles: true,
  distortion: true,
  frames: 8,
};

const state = {
  style: STYLES[0],
  fxId: 'impact',
  effect: null,
  t: 0,
  playing: true,
  speed: 1,
  loop: true,
};

function applyBackground() {
  const b = BACKGROUNDS[params.background];
  scene.background = new THREE.Color(b.bg);
  groundMat.color.set(b.ground);
  hemi.intensity = b.hemi;
  key.intensity = b.key;
  scene.fog = b.fog ? new THREE.FogExp2(b.bg, b.fog) : null;
}

function applyCamera() {
  const c = CAMERAS[params.camera];
  const f = STAGE[state.fxId].focus;
  camera.fov = c.fov;
  camera.updateProjectionMatrix();
  const scale = state.fxId === 'explosion' ? 1.35 : 1;
  camera.position.set(f[0] + c.pos[0] * scale, c.pos[1] * scale, f[2] + c.pos[2] * scale);
  controls.target.set(...f);
  controls.update();
}

function applyLook() {
  const look = state.style.look;
  renderer.toneMapping = look.tone === 'agx' ? THREE.AgXToneMapping : THREE.NeutralToneMapping;
  renderer.toneMappingExposure = params.exposure;
  params.bloomStrength = look.bloom.strength;
  params.bloomThreshold = look.bloom.threshold;
  params.bloomRadius = look.bloom.radius;
  syncBloom();
  const pal = look.palette || [];
  posterPass.uniforms.uCount.value = pal.length;
  pal.forEach((hex, i) => {
    const n = parseInt(hex.slice(1), 16);
    posterPass.uniforms.uPal.value[i].set((n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255);
  });
  impactPass.uniforms.uMode.value = look.impactMode === 'red' ? 1 : 0;
  canvas.classList.toggle('pixel', !!look.pixel);
  // Pixel art: a flat floor; a detailed texture turns to noise when quantized.
  if (groundMaps) {
    groundMat.map = look.pixel ? null : groundMaps[0];
    groundMat.normalMap = look.pixel ? null : groundMaps[1];
    groundMat.roughnessMap = look.pixel ? null : groundMaps[2];
    groundMat.needsUpdate = true;
  }
  resize();
  gui?.controllersRecursive().forEach(c => c.updateDisplay());
}

function syncBloom() {
  bloom.enabled = params.bloom && params.bloomStrength > 0;
  bloom.strength = params.bloomStrength;
  bloom.threshold = params.bloomThreshold;
  bloom.radius = params.bloomRadius;
}

function effectFps() {
  if (params.fps === 'Native') return state.style.look.fps || 0;
  return params.fps === 'Smooth' ? 0 : Number(params.fps);
}

function load() {
  state.effect?.dispose();
  const def = state.style.effects[state.fxId];
  state.effect = buildEffect(def, scene, distortScene, celScene);
  const co = state.effect.celOutline();
  celPass.uniforms.uOutline.value.copy(co.color);
  dummy.position.set(...STAGE[state.fxId].dummy);
  state.t = 0;
  scrub.max = String(def.duration);
  caption.innerHTML = `<b>${state.style.name} · ${ARCHETYPES.find(a => a.id === state.fxId).name}</b> ${state.style.blurb}`;
  applyLook();
  applyCamera();
  writeHash();
  compare.refresh(state.style.id, state.fxId);
}

// ---------------------------------------------------------------- UI
const styleTabs = document.getElementById('styleTabs');
const fxTabs = document.getElementById('fxTabs');
const caption = document.getElementById('caption');
const scrub = document.getElementById('scrub');
const timeOut = document.getElementById('time');
const btnPlay = document.getElementById('btnPlay');

for (const s of STYLES) {
  const b = document.createElement('button');
  b.textContent = s.name;
  b.dataset.id = s.id;
  b.onclick = () => select(s.id, state.fxId);
  styleTabs.append(b);
}
for (const a of ARCHETYPES) {
  const b = document.createElement('button');
  b.textContent = a.name;
  b.dataset.id = a.id;
  b.onclick = () => select(state.style.id, a.id);
  fxTabs.append(b);
}
function markTabs() {
  styleTabs.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.id === state.style.id));
  fxTabs.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.id === state.fxId));
}

function select(styleId, fxId) {
  state.style = STYLES.find(s => s.id === styleId) || STYLES[0];
  state.fxId = state.style.effects[fxId] ? fxId : 'impact';
  markTabs();
  load();
}

const gui = new GUI({ container: view, title: 'Stand' });
const fView = gui.addFolder('View');
fView.add(params, 'background', Object.keys(BACKGROUNDS)).onChange(applyBackground);
fView.add(params, 'camera', Object.keys(CAMERAS)).onChange(applyCamera);
fView.add(params, 'grayscale').name('grayscale (G)').onChange(v => canvas.classList.toggle('gray', v));
fView.add(params, 'dummy').onChange(v => { dummy.visible = v; });
const fLook = gui.addFolder('Look');
fLook.add(params, 'exposure', 0.2, 3, 0.01).onChange(v => { renderer.toneMappingExposure = v; });
fLook.add(params, 'bloom').onChange(syncBloom);
fLook.add(params, 'bloomStrength', 0, 3, 0.01).name('bloom strength').onChange(syncBloom);
fLook.add(params, 'bloomThreshold', 0, 3, 0.01).name('bloom threshold').onChange(syncBloom);
fLook.add(params, 'bloomRadius', 0, 1, 0.01).name('bloom radius').onChange(syncBloom);
fLook.add(params, 'fps', ['Native', 'Smooth', '24', '12', '8']).name('drawings / s');
fLook.add(params, 'impactFrame').name('impact frame');
fLook.add(params, 'shake').name('camera shake');
fLook.add(params, 'reaction').name('target reaction');
fLook.add(params, 'softParticles').name('soft particles');
fLook.add(params, 'distortion');
const fTools = gui.addFolder('Tools');
fTools.add(params, 'frames', 4, 16, 1).name('strip frames');
fTools.add({ strip: () => download(captureStrip(params.frames), 'strip') }, 'strip').name('save frame strip');
fTools.add({ peak: () => download(capturePeak(), 'peak') }, 'peak').name('save peak strip');
fTools.add({ frame: () => download(captureFrame(), 'frame') }, 'frame').name('save current frame');
if (innerWidth < 720) gui.close();

document.querySelectorAll('#modeTabs button').forEach(b => {
  b.onclick = () => {
    document.querySelectorAll('#modeTabs button').forEach(x => x.classList.toggle('on', x === b));
    document.getElementById('stage').classList.toggle('split', b.dataset.mode === 'compare');
    resize();
  };
});

btnPlay.onclick = () => setPlaying(!state.playing);
document.getElementById('btnRestart').onclick = () => { state.t = 0; setPlaying(true); };
document.getElementById('btnBack').onclick = () => step(-1);
document.getElementById('btnFwd').onclick = () => step(1);
document.getElementById('speed').onchange = e => { state.speed = Number(e.target.value); };
document.getElementById('loop').onchange = e => { state.loop = e.target.checked; };
scrub.oninput = () => { state.t = Number(scrub.value); setPlaying(false); };

function setPlaying(p) {
  state.playing = p;
  btnPlay.textContent = p ? '❚❚' : '▶';
  btnPlay.title = p ? 'Pause (Space)' : 'Play (Space)';
}
function step(dir) {
  setPlaying(false);
  const fps = effectFps() || 60;
  state.t = Math.min(state.effect.duration, Math.max(0, (Math.round(state.t * fps) + dir) / fps));
}

addEventListener('keydown', e => {
  if (e.target.closest?.('input, select, .lil-gui')) return;
  if (e.code === 'Space') { e.preventDefault(); setPlaying(!state.playing); }
  else if (e.code === 'ArrowLeft') step(-1);
  else if (e.code === 'ArrowRight') step(1);
  else if (e.code === 'KeyR') { state.t = 0; setPlaying(true); }
  else if (e.code === 'KeyG') { params.grayscale = !params.grayscale; canvas.classList.toggle('gray', params.grayscale); gui.controllersRecursive().forEach(c => c.updateDisplay()); }
  else if (/^Digit[1-4]$/.test(e.code)) { params.camera = Object.keys(CAMERAS)[Number(e.code.slice(5)) - 1]; applyCamera(); gui.controllersRecursive().forEach(c => c.updateDisplay()); }
});

// ---------------------------------------------------------------- hash state
function writeHash() {
  history.replaceState(null, '', `#style=${state.style.id}&fx=${state.fxId}`);
}
function readHash() {
  const h = new URLSearchParams(location.hash.slice(1));
  return { style: h.get('style') || 'anime', fx: h.get('fx') || 'impact' };
}

// ---------------------------------------------------------------- render
function resize() {
  const w = view.clientWidth, h = view.clientHeight;
  if (!w || !h) return;
  const px = state.style.look.pixel || 0;
  const dpr = px ? 1 : Math.min(devicePixelRatio, 2);
  const cw = px ? Math.max(1, Math.round(w / px)) : w;
  const ch = px ? Math.max(1, Math.round(h / px)) : h;
  renderer.setPixelRatio(dpr);
  renderer.setSize(cw, ch, false);
  composer.setPixelRatio(dpr);
  composer.setSize(cw, ch);
  const rw = composer.renderTarget1.width, rh = composer.renderTarget1.height;
  depthTarget.setSize(rw, rh);
  distortTarget.setSize(Math.max(1, rw >> 1), Math.max(1, rh >> 1));
  celTarget.setSize(rw, rh);
  celPass.uniforms.uTexel.value.set(1 / rw, 1 / rh);
  G.uSnapRes.value.set(px ? rw : 0, px ? rh : 0);
  G.uRes.value.set(rw, rh);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(view);

const shakeOffset = new THREE.Vector3();
const keyDir = new THREE.Vector3();
function renderAt(t) {
  const fps = effectFps();
  const te = fps ? Math.floor(t * fps + 1e-6) / fps : t;
  state.effect.update(te);

  // Target reaction.
  const tr = params.reaction ? state.effect.targetAt(te) : null;
  dummyBody.position.set(0, 0, 0);
  dummyBody.rotation.set(0, 0, 0);
  dummyMat.emissive.setRGB(0, 0, 0);
  rimUniform.value.setRGB(0, 0, 0);
  if (tr) {
    // Capped under the bloom threshold: a target brighter than the spark is a white-out.
    dummyMat.emissive.copy(tr.color).multiplyScalar(Math.min(tr.flash, 1) * 0.9);
    rimUniform.value.copy(tr.rimColor).multiplyScalar(Math.min(tr.rim, 1) * 1.5);
    const j = tr.jolt * Math.sin(te * 95);
    dummyBody.position.set(tr.dir.x * j, 0, tr.dir.z * j);
    dummyBody.rotation.z = -tr.knock * tr.dir.x;
    dummyBody.rotation.x = tr.knock * tr.dir.z;
  }

  // Impact frame: the target is pushed to full brightness so the two-tone
  // pass inks it black like the effect; bloom is held off for that frame.
  const impactAmt = params.impactFrame ? state.effect.impactAt(te) : 0;
  impactPass.uniforms.uAmount.value = impactAmt;
  const bloomWas = bloom.enabled;
  if (impactAmt > 0.5) { dummyMat.emissive.setScalar(40); bloom.enabled = false; }
  renderer.toneMappingExposure = params.exposure * state.effect.exposureAt(te);
  const amp = params.shake ? state.effect.shakeAt(te) : 0;
  shakeOffset.set(
    Math.sin(te * 61.0) + Math.sin(te * 37.3) * 0.5,
    Math.sin(te * 53.0 + 1.3) + Math.sin(te * 29.1) * 0.5,
    0).multiplyScalar(amp * 0.6);
  camera.position.add(shakeOffset);
  camera.updateMatrixWorld();

  // Shared uniforms.
  G.uNear.value = camera.near;
  G.uFar.value = camera.far;
  G.uPxScale.value = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) / Math.max(1, G.uRes.value.y);
  keyDir.copy(key.position).normalize().transformDirection(camera.matrixWorldInverse);
  G.uLightView.value.copy(keyDir);

  // Opaque depth for soft particles: draw the scene without the effect.
  state.effect.group.visible = false;
  scene.overrideMaterial = depthOnly;
  const bg = scene.background;
  scene.background = null;
  renderer.setRenderTarget(depthTarget);
  renderer.clear();
  if (params.softParticles) renderer.render(scene, camera);
  scene.overrideMaterial = null;
  scene.background = bg;
  state.effect.group.visible = true;

  // Cel layer for the union outline.
  const co = state.effect.celOutline();
  const dpr = state.style.look.pixel ? 1 : Math.min(devicePixelRatio, 2);
  celPass.uniforms.uPx.value = state.style.look.pixel ? 1 : co.px * dpr;
  renderer.setRenderTarget(celTarget);
  renderer.setClearColor(0x000000, 0);
  renderer.clear();
  renderer.render(celScene, camera);

  // Distortion offsets.
  renderer.setRenderTarget(distortTarget);
  renderer.setClearColor(0x000000, 0);
  renderer.clear();
  if (params.distortion) renderer.render(distortScene, camera);
  renderer.setRenderTarget(null);

  composer.render();
  bloom.enabled = bloomWas;
  camera.position.sub(shakeOffset);
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  controls.update();
  const dur = state.effect.duration;
  if (state.playing) {
    state.t += dt * state.speed;
    if (state.t > dur + GAP) {
      if (state.loop) state.t = 0;
      else { state.t = dur; setPlaying(false); }
    }
  }
  const t = Math.min(state.t, dur);
  scrub.value = String(t);
  timeOut.textContent = `${t.toFixed(3)} s`;
  renderAt(state.t);
  compare.sync(t, state.playing && state.t <= dur);
  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------- capture
function captureFrame() {
  renderAt(state.t);
  return canvas.toDataURL('image/png');
}

function captureTimes(times, labels) {
  const was = state.t;
  const w = canvas.width, h = canvas.height;
  const cw = Math.round(Math.min(view.clientWidth, 480)), ch = Math.round(cw * h / w);
  const n = times.length;
  const out = document.createElement('canvas');
  out.width = cw * n;
  out.height = ch + 22;
  const g = out.getContext('2d');
  g.fillStyle = '#0b0c10';
  g.fillRect(0, 0, out.width, out.height);
  g.imageSmoothingEnabled = !state.style.look.pixel;
  times.forEach((t, i) => {
    renderAt(t);
    g.drawImage(canvas, i * cw, 0, cw, ch);
    g.fillStyle = '#aab';
    g.font = '13px ui-monospace, monospace';
    g.fillText(labels ? labels[i] : `${t.toFixed(2)}s`, i * cw + 6, ch + 16);
  });
  state.t = was;
  renderAt(was);
  return out.toDataURL('image/png');
}

// Evenly spaced frames across the whole effect.
function captureStrip(n = 8) {
  const dur = state.effect.duration;
  return captureTimes(Array.from({ length: n }, (_, i) => (dur * i) / (n - 1)));
}

// Frames packed around the contact moment, where 1-3 frame peaks live.
function capturePeak() {
  const fps = effectFps() || 60;
  const c = state.effect.contact;
  const offs = [-1, 0, 1, 2, 3, 5, 8, 12];
  const times = offs.map(k => Math.max(0, c + k / fps));
  return captureTimes(times, offs.map(k => `${k >= 0 ? '+' : ''}${k}f`));
}

function download(url, kind) {
  const a = document.createElement('a');
  a.href = url;
  a.download = `${state.style.id}-${state.fxId}-${kind}.png`;
  a.click();
}

// ---------------------------------------------------------------- boot
const compare = setupCompare();
const [noise, gAlb, gNrm, gRgh] = await Promise.all([
  loadTex('./textures/noise_rgba.png', false),
  loadTex('./textures/ground_albedo.png', true),
  loadTex('./textures/ground_normal.png', false),
  loadTex('./textures/ground_rough.png', false),
]);
G.uNoise.value = noise;
for (const t of [gAlb, gNrm, gRgh]) t.repeat.set(12, 12);
groundMaps = [gAlb, gNrm, gRgh];
groundMat.map = gAlb;
groundMat.normalMap = gNrm;
groundMat.roughnessMap = gRgh;
groundMat.needsUpdate = true;
applyBackground();
const h = readHash();
select(h.style, h.fx);
requestAnimationFrame(frame);

// Scripting API for agents and headless checks (Playwright etc.).
window.rngStand = {
  styles: STYLES.map(s => ({ id: s.id, name: s.name, effects: Object.keys(s.effects) })),
  select,
  pause: () => setPlaying(false),
  play: () => setPlaying(true),
  seek: t => { setPlaying(false); state.t = t; renderAt(t); },
  duration: () => state.effect.duration,
  contact: () => state.effect.contact,
  set: (k, v) => { params[k] = v; applyBackground(); applyCamera(); syncBloom(); canvas.classList.toggle('gray', !!params.grayscale); dummy.visible = params.dummy; },
  captureFrame,
  captureStrip,
  capturePeak,
  captureTimes,
  layers: () => state.effect.layers(),
  solo: i => { state.effect.solo(i); renderAt(state.t); },
};
