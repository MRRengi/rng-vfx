import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import GUI from 'lil-gui';
import { buildEffect } from './fx/builder.js';
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
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 200);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.6, 0.4, 1.0);
composer.addPass(bloom);

// The anime impact frame: a held high-contrast inverted frame on contact.
const impactPass = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uAmount: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uAmount; varying vec2 vUv;
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
      vec3 inv = vec3(1.0 - step(0.35, l)) * vec3(1.0, 0.97, 0.95);
      gl_FragColor = vec4(mix(c.rgb, inv, uAmount), c.a);
    }`,
});
composer.addPass(impactPass);
composer.addPass(new OutputPass());

// Limited palette for the pixel style, applied after tone mapping.
const posterPass = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uLevels: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uLevels; varying vec2 vUv;
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      if (uLevels > 0.5) c.rgb = floor(c.rgb * uLevels + 0.5) / uLevels;
      gl_FragColor = c;
    }`,
});
composer.addPass(posterPass);

// ---------------------------------------------------------------- world
const hemi = new THREE.HemisphereLight('#b8c4ff', '#30261e', 0.8);
const key = new THREE.DirectionalLight('#ffffff', 1.2);
key.position.set(4, 7, 5);
scene.add(hemi, key);

function gridTexture() {
  const s = 256;
  const cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const g = cv.getContext('2d');
  g.fillStyle = '#808080'; g.fillRect(0, 0, s, s);
  g.fillStyle = '#7a7a7a';
  for (let i = 0; i < 400; i++) g.fillRect(Math.random() * s, Math.random() * s, 2, 2);
  g.strokeStyle = 'rgba(0,0,0,0.22)'; g.lineWidth = 2; g.strokeRect(0, 0, s, s);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(40, 40);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
const groundMat = new THREE.MeshStandardMaterial({ map: gridTexture(), roughness: 0.95, metalness: 0 });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), groundMat);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const dummy = new THREE.Group();
{
  const m = new THREE.MeshStandardMaterial({ color: '#8c8f99', roughness: 0.8 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.9, 6, 16), m);
  body.position.y = 0.93;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 14), m);
  head.position.y = 1.62;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.06, 24), m);
  base.position.y = 0.03;
  dummy.add(body, head, base);
}
scene.add(dummy);

const BACKGROUNDS = {
  'Night arena': { bg: '#0c0d13', ground: '#2a2b33', hemi: 0.35, key: 0.5, fog: 0.035 },
  'Dusk field': { bg: '#4b587a', ground: '#4a6a44', hemi: 0.9, key: 1.1, fog: 0.02 },
  'Mid gray': { bg: '#767676', ground: '#6e6e6e', hemi: 1.0, key: 1.0, fog: 0 },
  'Bright sand': { bg: '#cfe3f1', ground: '#d9ccb0', hemi: 1.3, key: 1.6, fog: 0.012 },
};

const CAMERAS = {
  Close: { pos: [0.2, 1.7, 4.8], fov: 40 },
  Gameplay: { pos: [7.5, 9.5, 10.5], fov: 30 },
  Side: { pos: [5.5, 1.5, 0.6], fov: 40 },
  Low: { pos: [1.8, 0.35, 4.2], fov: 50 },
};

// ---------------------------------------------------------------- state
const params = {
  background: 'Night arena',
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
  posterPass.uniforms.uLevels.value = look.posterize || 0;
  canvas.classList.toggle('pixel', !!look.pixel);
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
  state.effect = buildEffect(def, scene);
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
const fTools = gui.addFolder('Tools');
fTools.add(params, 'frames', 4, 16, 1).name('strip frames');
fTools.add({ strip: () => download(captureStrip(params.frames), 'strip') }, 'strip').name('save frame strip');
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
  if (px) {
    renderer.setPixelRatio(1);
    renderer.setSize(Math.max(1, Math.round(w / px)), Math.max(1, Math.round(h / px)), false);
    composer.setPixelRatio(1);
    composer.setSize(Math.max(1, Math.round(w / px)), Math.max(1, Math.round(h / px)));
  } else {
    const dpr = Math.min(devicePixelRatio, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    composer.setPixelRatio(dpr);
    composer.setSize(w, h);
  }
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(view);

const shakeOffset = new THREE.Vector3();
function renderAt(t) {
  const fps = effectFps();
  const te = fps ? Math.floor(t * fps + 1e-6) / fps : t;
  state.effect.update(te);
  impactPass.uniforms.uAmount.value = params.impactFrame ? state.effect.impactAt(te) : 0;
  const amp = params.shake ? state.effect.shakeAt(te) : 0;
  shakeOffset.set(
    Math.sin(te * 61.0) + Math.sin(te * 37.3) * 0.5,
    Math.sin(te * 53.0 + 1.3) + Math.sin(te * 29.1) * 0.5,
    0).multiplyScalar(amp * 0.6);
  camera.position.add(shakeOffset);
  composer.render();
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

// Frame strip: evenly spaced frames across the effect, labelled with time.
// This is what agents compare against references and engine renders.
function captureStrip(n = 8) {
  const was = state.t;
  const w = canvas.width, h = canvas.height;
  const cw = Math.round(Math.min(view.clientWidth, 480)), ch = Math.round(cw * h / w);
  const out = document.createElement('canvas');
  out.width = cw * n;
  out.height = ch + 22;
  const g = out.getContext('2d');
  g.fillStyle = '#0b0c10';
  g.fillRect(0, 0, out.width, out.height);
  g.imageSmoothingEnabled = !state.style.look.pixel;
  const dur = state.effect.duration;
  for (let i = 0; i < n; i++) {
    const t = (dur * i) / (n - 1);
    renderAt(t);
    g.drawImage(canvas, i * cw, 0, cw, ch);
    g.fillStyle = '#aab';
    g.font = '13px ui-monospace, monospace';
    g.fillText(`${t.toFixed(2)}s`, i * cw + 6, ch + 16);
  }
  state.t = was;
  renderAt(was);
  return out.toDataURL('image/png');
}

function download(url, kind) {
  const a = document.createElement('a');
  a.href = url;
  a.download = `${state.style.id}-${state.fxId}-${kind}.png`;
  a.click();
}

// ---------------------------------------------------------------- boot
const compare = setupCompare();
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
  set: (k, v) => { params[k] = v; applyBackground(); applyCamera(); syncBloom(); canvas.classList.toggle('gray', !!params.grayscale); dummy.visible = params.dummy; },
  captureFrame,
  captureStrip,
};
