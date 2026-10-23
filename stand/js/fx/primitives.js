import * as THREE from 'three';
import { NOISE } from './glsl.js';
import { rng, curve } from './math.js';

// ---------------------------------------------------------------------------
// Gradient ramps. Stops are [position 0..1, '#rrggbb' (sRGB), intensity, alpha].
// Intensity above 1 makes the color HDR so bloom picks it up.
// ---------------------------------------------------------------------------
export function ramp(stops, size = 256) {
  const data = new Float32Array(size * 4);
  const cols = stops.map(([p, hex, k = 1, a = 1]) => {
    const c = new THREE.Color(hex);
    return [p, c.r * k, c.g * k, c.b * k, a];
  });
  for (let i = 0; i < size; i++) {
    const x = i / (size - 1);
    let j = 0;
    while (j < cols.length - 2 && x > cols[j + 1][0]) j++;
    const a = cols[j], b = cols[Math.min(j + 1, cols.length - 1)];
    const t = b[0] === a[0] ? 0 : Math.min(1, Math.max(0, (x - a[0]) / (b[0] - a[0])));
    for (let c = 0; c < 4; c++) data[i * 4 + c] = a[c + 1] + (b[c + 1] - a[c + 1]) * t;
  }
  const tex = new THREE.DataTexture(data, size, 1, THREE.RGBAFormat, THREE.FloatType);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

const BLEND = {
  add: THREE.AdditiveBlending,
  alpha: THREE.NormalBlending,
};

function color3(hex, k = 1) {
  const c = new THREE.Color(hex);
  return new THREE.Vector3(c.r * k, c.g * k, c.b * k);
}

// ---------------------------------------------------------------------------
// Burst: a GPU particle burst whose motion is solved analytically per frame
// (ballistic motion with linear drag), so any time can be evaluated directly.
// ---------------------------------------------------------------------------
const SHAPES = { glow: 0, puff: 1, streak: 2, smoke: 3, square: 4, sparkle: 5, shard: 6, fire: 7 };

const BURST_VS = /* glsl */ `
uniform float uTime;
uniform vec2 uDelay;
uniform vec2 uLife;
uniform vec2 uSpeed;
uniform vec3 uGravity;
uniform float uDrag;
uniform vec2 uSize;
uniform float uSizePow;
uniform float uSizeRand;
uniform float uStretch;
uniform float uSpawnR;
uniform vec3 uOrigin;
uniform float uCurl;
uniform float uSpin;
uniform float uGround;
uniform float uAspect;
attribute vec4 aSeed;
attribute vec3 aDir;
varying vec2 vUv;
varying float vN;
varying vec4 vSeed;
void main() {
  float delay = uDelay.x + aSeed.w * uDelay.y;
  float life = mix(uLife.x, uLife.y, aSeed.x);
  float age = uTime - delay;
  float n = age / life;
  vUv = uv;
  vN = n;
  vSeed = aSeed;
  if (n < 0.0 || n > 1.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  float spd = mix(uSpeed.x, uSpeed.y, aSeed.y);
  vec3 v0 = aDir * spd;
  float k = max(uDrag, 0.001);
  float e = exp(-k * age);
  vec3 p = uOrigin + aDir * uSpawnR * aSeed.z + v0 * (1.0 - e) / k
         + uGravity * (age / k - (1.0 - e) / (k * k));
  vec3 vel = v0 * e + uGravity * (1.0 - e) / k;
  p += uCurl * n * vec3(sin(age * 3.0 + aSeed.x * 20.0),
                        0.5 * sin(age * 2.3 + aSeed.y * 20.0),
                        cos(age * 2.7 + aSeed.z * 20.0));
  float sz = mix(uSize.x, uSize.y, pow(clamp(n, 0.0, 1.0), uSizePow))
           * (1.0 - uSizeRand + uSizeRand * 2.0 * aSeed.z);
  p.y = max(p.y, uGround + sz * 0.25);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vec2 corner = position.xy;
  vec3 vv = (modelViewMatrix * vec4(vel, 0.0)).xyz;
  float sp = length(vv.xy);
  if (uStretch > 0.0 && sp > 0.0001) {
    vec2 ax = vv.xy / sp;
    vec2 perp = vec2(-ax.y, ax.x);
    float len = sz + sp * uStretch;
    mv.xy += ax * (corner.y - 0.5) * len + perp * corner.x * sz;
  } else {
    float r = aSeed.x * 6.2831 + uSpin * age * (aSeed.y - 0.5) * 2.0;
    float c = cos(r), s = sin(r);
    mv.xy += mat2(c, s, -s, c) * corner * sz;
  }
  gl_Position = projectionMatrix * mv;
}`;

const BURST_FS = /* glsl */ `
uniform sampler2D uRamp;
uniform float uOpacity;
uniform vec2 uFade;
uniform float uIntensity;
uniform float uErode;
uniform float uNoiseScale;
uniform float uBands;
uniform float uSoft;
uniform vec3 uShadow;
uniform float uOutline;
uniform vec3 uOutlineColor;
uniform float uTimeAbs;
varying vec2 vUv;
varying float vN;
varying vec4 vSeed;
${NOISE}
void main() {
  vec2 c = vUv - 0.5;
  float r = length(c) * 2.0;
  vec4 col = texture2D(uRamp, vec2(clamp(vN, 0.0, 1.0), 0.5));
  float a = 0.0;
#if SHAPE == 0
  // Soft glow: the classic additive sprite.
  a = pow(clamp(1.0 - r, 0.0, 1.0), uSoft);
#elif SHAPE == 1
  // Cel puff: hard silhouette, banded sphere shading, outline, dissolves by holes.
  float nz = vnoise(vUv * uNoiseScale + vSeed.xy * 50.0);
  float m = 1.0 - r + (nz - 0.5) * 0.35;
  if (m <= 0.0) discard;
  float holes = vnoise(vUv * uNoiseScale * 1.6 + vSeed.zw * 40.0);
  float thr = uErode * smoothstep(0.35, 1.0, vN);
  if (holes < thr) discard;
  vec2 q = c * 2.0;
  vec3 nrm = normalize(vec3(q, sqrt(max(0.0, 1.0 - dot(q, q)))));
  float sh = clamp(dot(nrm, normalize(vec3(-0.5, 0.6, 0.6))), 0.0, 1.0);
  float band = floor(sh * uBands + 0.5) / max(uBands, 1.0);
  col.rgb = mix(col.rgb * uShadow, col.rgb, band);
  if (m < uOutline || holes < thr + uOutline * 0.6) col.rgb = uOutlineColor;
  a = 1.0;
#elif SHAPE == 2
  // Streak: bright head, tapered tail. Used for sparks and speed lines.
  float w = 1.0 - abs(c.x) * 2.0;
  a = pow(clamp(w, 0.0, 1.0), uSoft) * pow(vUv.y, 1.6);
#elif SHAPE == 3
  // Soft volumetric-looking smoke: domain-warped fbm, fake self-shadow.
  vec2 q = vUv * uNoiseScale + vSeed.xy * 10.0 + vec2(0.0, -vN * 0.6);
  float f = fbm(q + fbm(q * 0.5 + vN) * 1.2);
  float f2 = fbm(q + vec2(-0.06, 0.09) + fbm(q * 0.5 + vN) * 1.2);
  float dens = clamp((f * 1.5 - 0.35 - r * 0.95 - vN * uErode * 0.5) * 2.2, 0.0, 1.0);
  float lit = clamp(0.7 + (f2 - f) * 5.0, 0.35, 1.25);
  col.rgb *= mix(uShadow, vec3(1.0), lit);
  a = dens;
#elif SHAPE == 4
  // Hard pixel square.
  a = 1.0;
#elif SHAPE == 5
  // Four-point sparkle.
  float sx = 1.0 - abs(c.x) * 2.0;
  float sy = 1.0 - abs(c.y) * 2.0;
  float spike = max(pow(clamp(sx, 0.0, 1.0), 12.0) * pow(clamp(sy, 0.0, 1.0), 0.6),
                    pow(clamp(sy, 0.0, 1.0), 12.0) * pow(clamp(sx, 0.0, 1.0), 0.6));
  a = max(spike, pow(clamp(1.0 - r * 2.2, 0.0, 1.0), 2.0));
  a = uSoft > 50.0 ? step(0.35, a) : a;
#elif SHAPE == 6
  // Debris shard: irregular hard polygon.
  float skew = vSeed.x - 0.5;
  float d = abs(c.x + c.y * skew) * 1.6 + abs(c.y) * (1.2 + vSeed.y);
  if (d > 0.5) discard;
  col.rgb *= 0.75 + 0.5 * step(0.0, c.x - c.y * 0.3);
  a = 1.0;
#elif SHAPE == 7
  // Fire puff: eroded noise, colored by how far above the erosion threshold it is.
  vec2 q = vUv * uNoiseScale + vSeed.xy * 13.0 + vec2(0.0, -uTimeAbs * 0.9);
  float f = fbm(q) * (1.0 - r * 0.85) * 1.9;
  float thr = mix(0.18, 0.95, pow(clamp(vN, 0.0, 1.0), 0.8)) * uErode + (1.0 - uErode) * 0.18;
  float heat = (f - thr) / max(uSoft, 0.001);
  if (heat <= 0.0) discard;
  col = texture2D(uRamp, vec2(clamp(1.0 - heat, 0.0, 1.0), 0.5));
  a = clamp(heat * 3.0, 0.0, 1.0);
#endif
  float fade = smoothstep(0.0, uFade.x, vN) * (1.0 - smoothstep(uFade.y, 1.0, vN));
  float alpha = col.a * a * fade * uOpacity;
  if (alpha < 0.002) discard;
  gl_FragColor = vec4(col.rgb * uIntensity, alpha);
}`;

function directions(count, mode, r, opt) {
  const out = new Float32Array(count * 3);
  const axis = new THREE.Vector3(...(opt.axis || [0, 1, 0])).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis);
  const v = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    if (mode === 'sphere') {
      const z = r() * 2 - 1, a = r() * Math.PI * 2, s = Math.sqrt(1 - z * z);
      v.set(s * Math.cos(a), z, s * Math.sin(a));
    } else if (mode === 'hemi') {
      const z = r(), a = r() * Math.PI * 2, s = Math.sqrt(1 - z * z);
      v.set(s * Math.cos(a), z, s * Math.sin(a));
      v.applyQuaternion(q);
    } else if (mode === 'cone') {
      const ang = (opt.angle ?? 30) * Math.PI / 180;
      const z = 1 - r() * (1 - Math.cos(ang)), a = r() * Math.PI * 2, s = Math.sqrt(1 - z * z);
      v.set(s * Math.cos(a), z, s * Math.sin(a)).applyQuaternion(q);
    } else if (mode === 'ring') {
      const a = (i / count) * Math.PI * 2 + r() * 0.3;
      const up = (opt.lift ?? 0) * (r() * 0.6 + 0.4);
      v.set(Math.cos(a), up, Math.sin(a)).normalize();
    } else if (mode === 'screen') {
      // Fan in the plane facing the default camera, for 2D-style impact lines.
      const a = r() * Math.PI * 2;
      v.set(Math.cos(a), Math.sin(a), 0).applyQuaternion(q);
    } else {
      v.copy(axis);
    }
    out.set([v.x, v.y, v.z], i * 3);
  }
  return out;
}

export function burst(o) {
  const count = o.count ?? 40;
  const r = rng(o.seed ?? 7);
  const base = new THREE.PlaneGeometry(1, 1);
  const geo = new THREE.InstancedBufferGeometry();
  geo.index = base.index;
  geo.attributes.position = base.attributes.position;
  geo.attributes.uv = base.attributes.uv;
  const seeds = new Float32Array(count * 4);
  for (let i = 0; i < seeds.length; i++) seeds[i] = r();
  geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 4));
  geo.setAttribute('aDir', new THREE.InstancedBufferAttribute(directions(count, o.dir || 'sphere', r, o), 3));
  geo.instanceCount = count;

  const mat = new THREE.ShaderMaterial({
    defines: { SHAPE: SHAPES[o.shape || 'glow'] },
    uniforms: {
      uTime: { value: 0 },
      uTimeAbs: { value: 0 },
      uDelay: { value: new THREE.Vector2(...(o.delay || [0, 0])) },
      uLife: { value: new THREE.Vector2(...(o.life || [0.4, 0.8])) },
      uSpeed: { value: new THREE.Vector2(...(o.speed || [1, 3])) },
      uGravity: { value: new THREE.Vector3(...(o.gravity || [0, 0, 0])) },
      uDrag: { value: o.drag ?? 0.001 },
      uSize: { value: new THREE.Vector2(...(o.size || [0.3, 0.1])) },
      uSizePow: { value: o.sizePow ?? 1 },
      uSizeRand: { value: o.sizeRand ?? 0.3 },
      uStretch: { value: o.stretch ?? 0 },
      uSpawnR: { value: o.spawnR ?? 0 },
      uOrigin: { value: new THREE.Vector3(...(o.origin || [0, 1, 0])) },
      uCurl: { value: o.curl ?? 0 },
      uSpin: { value: o.spin ?? 0 },
      uGround: { value: o.ground ?? -100 },
      uAspect: { value: 1 },
      uRamp: { value: o.ramp },
      uOpacity: { value: o.opacity ?? 1 },
      uFade: { value: new THREE.Vector2(Math.max(0.001, (o.fade || [0, 0.7])[0]), Math.min(0.999, (o.fade || [0, 0.7])[1])) },
      uIntensity: { value: o.intensity ?? 1 },
      uErode: { value: o.erode ?? 0.8 },
      uNoiseScale: { value: o.noiseScale ?? 4 },
      uBands: { value: o.bands ?? 2 },
      uSoft: { value: o.soft ?? 1.5 },
      uShadow: { value: o.shadow ? color3(o.shadow) : new THREE.Vector3(0.55, 0.5, 0.6) },
      uOutline: { value: o.outline ?? 0 },
      uOutlineColor: { value: o.outlineColor ? color3(o.outlineColor) : new THREE.Vector3(0.05, 0.03, 0.05) },
    },
    vertexShader: BURST_VS,
    fragmentShader: BURST_FS,
    transparent: true,
    depthWrite: false,
    blending: BLEND[o.blend || 'add'],
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = o.order ?? 0;
  return {
    object: mesh,
    update(t, tAbs) { mat.uniforms.uTime.value = t; mat.uniforms.uTimeAbs.value = tAbs; },
    dispose() { geo.dispose(); base.dispose(); mat.dispose(); },
  };
}

// ---------------------------------------------------------------------------
// Flash: billboard with a core and N spikes. Hard mode gives the anime star.
// ---------------------------------------------------------------------------
const FLASH_FS = /* glsl */ `
uniform float uScale;
uniform float uAlpha;
uniform float uSpikes;
uniform float uSpikeLen;
uniform float uCore;
uniform float uSharp;
uniform float uRot;
uniform float uHard;
uniform float uSoft;
uniform float uJitter;
uniform vec3 uCoreColor;
uniform vec3 uEdgeColor;
uniform float uSeed;
varying vec2 vUv;
${NOISE}
void main() {
  vec2 c = (vUv - 0.5) * 2.0 / max(uScale, 0.0001);
  float r = length(c);
  float ang = atan(c.y, c.x) + uRot;
  float sp = pow(abs(cos(ang * uSpikes * 0.5)), uSharp);
  float jit = 1.0 + (vnoise(vec2(floor((ang + 3.1416) / 6.2832 * uSpikes + 0.5), uSeed)) - 0.5) * uJitter;
  float rad = uCore + uSpikeLen * sp * jit;
  float s = 1.0 - r / max(rad, 0.0001);
  float a = uHard > 0.5 ? step(0.0, s) : pow(clamp(s, 0.0, 1.0), uSoft);
  vec3 col = mix(uEdgeColor, uCoreColor, uHard > 0.5 ? step(0.45, s) : smoothstep(0.0, 0.6, s));
  float alpha = a * uAlpha;
  if (alpha < 0.002) discard;
  gl_FragColor = vec4(col, alpha);
}`;

const BILLBOARD_VS = /* glsl */ `
uniform vec3 uPos;
uniform float uSize;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(uPos, 1.0);
  mv.xy += position.xy * uSize;
  gl_Position = projectionMatrix * mv;
}`;

export function flash(o) {
  const geo = new THREE.PlaneGeometry(1, 1);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uPos: { value: new THREE.Vector3(...(o.pos || [0, 1, 0])) },
      uSize: { value: o.size ?? 3 },
      uScale: { value: 0 },
      uAlpha: { value: 0 },
      uSpikes: { value: o.spikes ?? 8 },
      uSpikeLen: { value: o.spikeLen ?? 0.6 },
      uCore: { value: o.core ?? 0.25 },
      uSharp: { value: o.sharp ?? 12 },
      uRot: { value: o.rot ?? 0 },
      uHard: { value: o.hard ? 1 : 0 },
      uSoft: { value: o.soft ?? 2 },
      uJitter: { value: o.jitter ?? 0 },
      uSeed: { value: o.seed ?? 3 },
      uCoreColor: { value: color3(o.core_color || '#ffffff', o.coreK ?? 4) },
      uEdgeColor: { value: color3(o.edge_color || '#66ccff', o.edgeK ?? 2) },
    },
    vertexShader: BILLBOARD_VS,
    fragmentShader: FLASH_FS,
    transparent: true,
    depthWrite: false,
    depthTest: o.depthTest ?? true,
    blending: BLEND[o.blend || 'add'],
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = o.order ?? 5;
  const scale = curve(o.scaleCurve || [[0, 0], [0.05, 1, 'outExpo'], [0.2, 0.6]]);
  const alpha = curve(o.alphaCurve || [[0, 1], [0.15, 1], [0.25, 0]]);
  const rotSpeed = o.rotSpeed ?? 0;
  return {
    object: mesh,
    update(t) {
      mat.uniforms.uScale.value = scale(t);
      mat.uniforms.uAlpha.value = alpha(t);
      mat.uniforms.uRot.value = (o.rot ?? 0) + rotSpeed * t;
    },
    dispose() { geo.dispose(); mat.dispose(); },
  };
}

// ---------------------------------------------------------------------------
// Ring: shockwave. Lies on the ground by default; billboard: true faces camera.
// ---------------------------------------------------------------------------
const RING_FS = /* glsl */ `
uniform float uR;
uniform float uW;
uniform float uAlpha;
uniform float uHard;
uniform float uSoft;
uniform float uNoise;
uniform float uNoiseFreq;
uniform float uErode;
uniform float uFill;
uniform float uSeed;
uniform vec3 uColor;
uniform vec3 uColor2;
varying vec2 vUv;
${NOISE}
void main() {
  vec2 c = (vUv - 0.5) * 2.0;
  float r = length(c);
  vec2 dir = c / max(r, 0.0001);
  float nz = vnoise(dir * uNoiseFreq + uSeed);
  float w = uW * (1.0 - uNoise + uNoise * 2.0 * nz);
  float d = abs(r - uR) - w;
  float a = uHard > 0.5 ? step(d, 0.0) : 1.0 - smoothstep(0.0, uSoft, d);
  float inner = clamp((r - (uR - w)) / max(2.0 * w, 0.0001), 0.0, 1.0);
  vec3 col = mix(uColor2, uColor, uHard > 0.5 ? step(0.5, inner) : inner);
  a += uFill * (1.0 - smoothstep(0.0, max(uR, 0.0001), r)) * (1.0 - a);
  float holes = vnoise(c * 6.0 + uSeed * 3.0);
  if (holes < uErode) a = 0.0;
  float alpha = a * uAlpha * step(r, 1.0);
  if (alpha < 0.002) discard;
  gl_FragColor = vec4(col, alpha);
}`;

const PLANE_VS = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

export function ring(o) {
  const geo = new THREE.PlaneGeometry(1, 1);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uR: { value: 0 }, uW: { value: 0.05 }, uAlpha: { value: 1 },
      uHard: { value: o.hard ? 1 : 0 }, uSoft: { value: o.soft ?? 0.05 },
      uNoise: { value: o.noise ?? 0.3 }, uNoiseFreq: { value: o.noiseFreq ?? 4 },
      uErode: { value: 0 }, uFill: { value: o.fill ?? 0 }, uSeed: { value: o.seed ?? 1 },
      uColor: { value: color3(o.color || '#ffffff', o.colorK ?? 2) },
      uColor2: { value: color3(o.color2 || o.color || '#ffffff', o.color2K ?? o.colorK ?? 2) },
    },
    vertexShader: o.billboard ? BILLBOARD_VS : PLANE_VS,
    fragmentShader: RING_FS,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: BLEND[o.blend || 'add'],
  });
  const size = o.size ?? 6;
  if (o.billboard) {
    mat.uniforms.uPos = { value: new THREE.Vector3(...(o.pos || [0, 1, 0])) };
    mat.uniforms.uSize = { value: size };
  }
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = o.order ?? 2;
  if (!o.billboard) {
    mesh.scale.setScalar(size);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(...(o.pos || [0, 0.02, 0]));
  }
  const R = curve(o.radius || [[0, 0.05], [0.4, 0.9, 'outExpo']]);
  const W = curve(o.width || [[0, 0.08], [0.4, 0.0, 'outQuad']]);
  const A = curve(o.alpha || [[0, 1], [0.3, 1], [0.4, 0]]);
  const E = curve(o.erode || [[0, 0], [1, 0]]);
  return {
    object: mesh,
    update(t) {
      mat.uniforms.uR.value = R(t);
      mat.uniforms.uW.value = W(t);
      mat.uniforms.uAlpha.value = A(t);
      mat.uniforms.uErode.value = E(t);
    },
    dispose() { geo.dispose(); mat.dispose(); },
  };
}

// ---------------------------------------------------------------------------
// Slash: a crescent mesh swept by a moving head. uv.x runs along the arc,
// uv.y across it.
// ---------------------------------------------------------------------------
const SLASH_FS = /* glsl */ `
uniform float uHead;
uniform float uTail;
uniform float uAlpha;
uniform float uHard;
uniform float uNoise;
uniform float uThick;
uniform float uSeed;
uniform float uDissolve;
uniform vec3 uCore;
uniform vec3 uEdge;
uniform vec3 uRim;
uniform float uRimW;
varying vec2 vUv;
${NOISE}
void main() {
  float tl = (uHead - vUv.x) / max(uTail, 0.0001);
  if (tl < 0.0 || tl > 1.0) discard;
  float ends = smoothstep(0.0, 0.08, vUv.x) * (1.0 - smoothstep(0.85, 1.0, vUv.x));
  float w = uThick * pow(1.0 - tl, 0.6) * ends;
  float nz = vnoise(vec2(vUv.x * 18.0 - uHead * 4.0, vUv.y * 3.0 + uSeed));
  float dr = abs(vUv.y - 0.5) * 2.0 + (nz - 0.5) * uNoise;
  float s = 1.0 - dr / max(w, 0.0001);
  if (s <= 0.0) discard;
  float holes = vnoise(vec2(vUv.x * 30.0, vUv.y * 6.0) + uSeed * 7.0);
  if (holes < uDissolve * tl) discard;
  float a = uHard > 0.5 ? 1.0 : smoothstep(0.0, 0.35, s);
  float k = uHard > 0.5 ? step(0.55, s) * step(tl, 0.75) : smoothstep(0.2, 0.9, s) * (1.0 - tl);
  vec3 col = mix(uEdge, uCore, k);
  if (s < uRimW) col = uRim;
  float alpha = a * uAlpha;
  if (alpha < 0.002) discard;
  gl_FragColor = vec4(col, alpha);
}`;

// The arc is built so its midpoint sits at the local origin: placing the
// mesh at the hit point makes the blade path pass through the target.
function arcGeometry(a0, a1, rIn, rOut, seg = 96) {
  const pos = [], uv = [], idx = [];
  const am = (a0 + a1) / 2, rm = (rIn + rOut) / 2;
  const ox = Math.cos(am) * rm, oy = Math.sin(am) * rm;
  for (let i = 0; i <= seg; i++) {
    const t = i / seg;
    const a = a0 + (a1 - a0) * t;
    for (let j = 0; j <= 1; j++) {
      const r = j ? rOut : rIn;
      pos.push(Math.cos(a) * r - ox, Math.sin(a) * r - oy, 0);
      uv.push(t, j);
    }
    if (i < seg) {
      const k = i * 2;
      idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

export function slash(o) {
  const geo = arcGeometry(
    (o.from ?? 140) * Math.PI / 180, (o.to ?? -40) * Math.PI / 180,
    o.rIn ?? 0.9, o.rOut ?? 1.5);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uHead: { value: 0 }, uTail: { value: o.tail ?? 0.6 }, uAlpha: { value: 1 },
      uHard: { value: o.hard ? 1 : 0 }, uNoise: { value: o.noise ?? 0.15 },
      uThick: { value: o.thick ?? 1 }, uSeed: { value: o.seed ?? 2 },
      uDissolve: { value: o.dissolve ?? 0 },
      uCore: { value: color3(o.coreColor || '#ffffff', o.coreK ?? 3) },
      uEdge: { value: color3(o.edgeColor || '#4fc3ff', o.edgeK ?? 2) },
      uRim: { value: color3(o.rimColor || o.edgeColor || '#000000', o.rimK ?? 1) },
      uRimW: { value: o.rimW ?? 0 },
    },
    vertexShader: PLANE_VS,
    fragmentShader: SLASH_FS,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    depthTest: o.depthTest ?? false,
    blending: BLEND[o.blend || 'add'],
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = o.order ?? 6;
  mesh.position.set(...(o.pos || [0, 1.1, 0]));
  mesh.rotation.set(...(o.rot || [0, 0, 0]));
  mesh.scale.setScalar(o.scale ?? 1);
  const H = curve(o.head || [[0, 0], [0.12, 1.4, 'outQuart']]);
  const A = curve(o.alpha || [[0, 1], [0.18, 1], [0.3, 0]]);
  return {
    object: mesh,
    update(t) { mat.uniforms.uHead.value = H(t); mat.uniforms.uAlpha.value = A(t); },
    dispose() { geo.dispose(); mat.dispose(); },
  };
}

// ---------------------------------------------------------------------------
// Decal: scorch or crack mark on the ground. Veins glow and cool down.
// ---------------------------------------------------------------------------
const DECAL_FS = /* glsl */ `
uniform float uAlpha;
uniform float uGlow;
uniform float uSeed;
uniform float uCracks;
uniform float uReveal;
uniform vec3 uDark;
uniform vec3 uHot;
varying vec2 vUv;
${NOISE}
void main() {
  vec2 c = (vUv - 0.5) * 2.0;
  float r = length(c);
  float f = fbm(c * 3.0 + uSeed);
  float blob = 1.0 - smoothstep(0.35, 0.95, r + (f - 0.5) * 0.6);
  float reveal = step(r, uReveal + (f - 0.5) * 0.3);
  float vein = 0.0;
  if (uCracks > 0.0) {
    float e = voronoiEdge(c * 4.0 + uSeed);
    vein = (1.0 - smoothstep(0.0, 0.06, e)) * (1.0 - smoothstep(0.2, 1.0, r)) * uCracks;
  }
  vec3 col = uDark + uHot * (vein * 3.0 + blob * 0.4 * (1.0 - r)) * uGlow;
  float a = max(blob * 0.85, vein) * uAlpha * reveal;
  if (a < 0.002) discard;
  gl_FragColor = vec4(col, a);
}`;

export function decal(o) {
  const geo = new THREE.PlaneGeometry(1, 1);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uAlpha: { value: 0 }, uGlow: { value: 0 }, uSeed: { value: o.seed ?? 4 },
      uCracks: { value: o.cracks ?? 0 }, uReveal: { value: 0 },
      uDark: { value: color3(o.dark || '#120c0a', 1) },
      uHot: { value: color3(o.hot || '#ff5a1f', o.hotK ?? 2) },
    },
    vertexShader: PLANE_VS,
    fragmentShader: DECAL_FS,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(...(o.pos || [0, 0.011, 0]));
  mesh.scale.setScalar(o.size ?? 3);
  mesh.renderOrder = 1;
  const A = curve(o.alpha || [[0, 0], [0.05, 1], [10, 1]]);
  const G = curve(o.glow || [[0, 1], [1.5, 0, 'outQuad']]);
  const R = curve(o.reveal || [[0, 0], [0.15, 1.2, 'outExpo']]);
  return {
    object: mesh,
    update(t) { mat.uniforms.uAlpha.value = A(t); mat.uniforms.uGlow.value = G(t); mat.uniforms.uReveal.value = R(t); },
    dispose() { geo.dispose(); mat.dispose(); },
  };
}

// ---------------------------------------------------------------------------
// Light: a real point light so the effect lights the ground and the dummy.
// ---------------------------------------------------------------------------
export function light(o) {
  const l = new THREE.PointLight(o.color || '#ffaa55', 0, o.distance ?? 12, 1.6);
  l.position.set(...(o.pos || [0, 1, 0]));
  const I = curve(o.intensity || [[0, 0], [0.03, 40], [0.6, 0, 'outQuad']]);
  return { object: l, update(t) { l.intensity = I(t); }, dispose() {} };
}
