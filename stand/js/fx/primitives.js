import * as THREE from 'three';
import { NOISE, TEXNOISE } from './glsl.js';
import { G, SOFT, distortScene } from './globals.js';
import { rng, curve } from './math.js';

// ---------------------------------------------------------------------------
// Gradient ramps. Stops are [position 0..1, '#rrggbb' (sRGB), intensity, alpha].
// Intensity above 1 makes the color HDR so bloom picks it up. Keep mid tones
// at or under 1 and only the hottest stop above it.
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
  tex.needsUpdate = true;
  return tex;
}

function blending(mat, mode) {
  if (mode === 'premul') {
    mat.blending = THREE.CustomBlending;
    mat.blendSrc = THREE.OneFactor;
    mat.blendDst = THREE.OneMinusSrcAlphaFactor;
    mat.blendSrcAlpha = THREE.OneFactor;
    mat.blendDstAlpha = THREE.OneMinusSrcAlphaFactor;
  } else {
    mat.blending = mode === 'alpha' ? THREE.NormalBlending : THREE.AdditiveBlending;
  }
}

function color3(hex, k = 1) {
  const c = new THREE.Color(hex);
  return new THREE.Vector3(c.r * k, c.g * k, c.b * k);
}

const v3 = a => new THREE.Vector3(...a);

// ---------------------------------------------------------------------------
// Burst: GPU particles whose motion is solved in closed form (gravity + linear
// drag), so any time can be rendered directly and the timeline can scrub.
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
uniform float uStretch;
uniform float uSpawnR;
uniform vec3 uOrigin;
uniform float uCurl;
uniform float uSpin;
uniform float uGround;
uniform float uBounce;
uniform float uMinPx;
uniform float uPxScale;
uniform float uSizeIn;
uniform vec2 uSnapRes;
attribute vec4 aSeed;
attribute vec3 aDir;
attribute float aScale;
varying vec2 vUv;
varying float vN;
varying vec4 vSeed;
varying vec3 vCenterView;
varying float vHeight;
${TEXNOISE}
// Curl of a noise vector potential: divergence-free swirl, no sinks or sources.
float pot(vec3 q) { return tn(q.xz * 0.21 + vec2(q.y * 0.13, q.y * 0.07)).b; }
vec3 curlAt(vec3 q) {
  float e = 0.15;
  vec3 dx = vec3(e, 0.0, 0.0), dy = vec3(0.0, e, 0.0), dz = vec3(0.0, 0.0, e);
  vec3 o1 = vec3(31.4, 7.1, 3.3), o2 = vec3(-11.7, 19.3, 5.9);
  float dpzdy = pot(q + o2 + dy) - pot(q + o2 - dy);
  float dpydz = pot(q + o1 + dz) - pot(q + o1 - dz);
  float dpxdz = pot(q + dz) - pot(q - dz);
  float dpzdx = pot(q + o2 + dx) - pot(q + o2 - dx);
  float dpydx = pot(q + o1 + dx) - pot(q + o1 - dx);
  float dpxdy = pot(q + dy) - pot(q - dy);
  return vec3(dpzdy - dpydz, dpxdz - dpzdx, dpydx - dpxdy) / (2.0 * e);
}
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
  if (uCurl > 0.0) p += curlAt(p * 0.8 + aSeed.xyz * 9.0 + vec3(0.0, age * 0.3, 0.0)) * uCurl * pow(n, 1.2);
  float sz = mix(uSize.x, uSize.y, pow(clamp(n, 0.0, 1.0), uSizePow)) * aScale;
  if (uSizeIn > 0.0 && n < uSizeIn) {
    // Pop in with overshoot (outBack) over the first part of life.
    float x = n / uSizeIn - 1.0;
    sz *= 1.0 + 2.70158 * x * x * x + 1.70158 * x * x;
  }
  if (p.y < uGround) {
    // Mirror below the ground: a cheap closed-form bounce with energy loss.
    p.y = uGround + (uGround - p.y) * uBounce;
    vel.y = -vel.y * uBounce;
    vel.xz *= 0.6;
  }
  p.y = max(p.y, uGround + sz * 0.25);
  vHeight = p.y - uOrigin.y;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vCenterView = (modelViewMatrix * vec4(p - uOrigin, 0.0)).xyz;
  vCenterView = length(vCenterView) > 0.0001 ? normalize(vCenterView) : vec3(0.0, 0.0, 1.0);
  float worldPerPx = -mv.z * uPxScale;
  float minSz = uMinPx * worldPerPx;
  vec2 corner = position.xy;
  vec3 vv = (modelViewMatrix * vec4(vel, 0.0)).xyz;
  float sp = length(vv.xy);
  if (uStretch > 0.0 && sp > 0.0001) {
    vec2 ax = vv.xy / sp;
    // Keep det(perp, ax) > 0: a mirrored basis flips the winding and the
    // quad is back-face culled, silently hiding every stretched particle.
    vec2 perp = vec2(ax.y, -ax.x);
    float wid = max(sz, minSz);
    float len = max(wid + sp * uStretch, minSz * 3.0);
    mv.xy += ax * (corner.y - 0.5) * len + perp * corner.x * wid;
  } else {
    sz = max(sz, minSz);
    float r = aSeed.x * 6.2831 + uSpin * age * (aSeed.y - 0.5) * 2.0;
    float c = cos(r), s = sin(r);
    mv.xy += mat2(c, s, -s, c) * corner * sz;
  }
  gl_Position = projectionMatrix * mv;
  if (uSnapRes.x > 0.0) {
    // Pixel style: snap the particle centre to the pixel grid so it does not shimmer.
    vec4 cc = projectionMatrix * (modelViewMatrix * vec4(p, 1.0));
    vec2 ndc = cc.xy / cc.w;
    vec2 snapped = floor(ndc * uSnapRes * 0.5 + 0.5) / (uSnapRes * 0.5);
    gl_Position.xy += (snapped - ndc) * gl_Position.w;
  }
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
uniform float uFadeDist;
uniform float uVBias;
uniform vec3 uFireColor;
uniform float uFireK;
uniform float uFireH;
uniform vec3 uLightView;
varying vec2 vUv;
varying float vN;
varying vec4 vSeed;
varying vec3 vCenterView;
varying float vHeight;
${NOISE}
${TEXNOISE}
${SOFT}
void main() {
  vec2 c = vUv - 0.5;
  float r = length(c) * 2.0;
  vec4 col = texture2D(uRamp, vec2(clamp(vN, 0.0, 1.0), 0.5));
  float a = 0.0;
  float occl = 1.0;
#if SHAPE == 0
  // Soft glow: the classic additive sprite.
  a = pow(clamp(1.0 - r, 0.0, 1.0), uSoft);
#elif SHAPE == 1
  // Cel puff: worley-lobed silhouette, banded shading from the cluster centre,
  // outline, dissolves through cell-shaped holes.
  float lobes = tn(vUv * 0.18 * uNoiseScale + vSeed.xy).g;
  float m = 1.0 - r + (lobes - 0.5) * 0.5;
  if (m <= 0.0) discard;
  float holes = tn(vUv * 0.3 * uNoiseScale + vSeed.zw).g;
  float thr = uErode * smoothstep(0.35, 1.0, vN);
  if (holes < thr) discard;
  vec2 q = c * 2.0;
  vec3 sN = normalize(vec3(q, sqrt(max(0.0, 1.0 - dot(q, q)))));
  vec3 N = normalize(sN + 1.2 * vCenterView);
  float sh = clamp(dot(N, uLightView) * 0.5 + 0.5, 0.0, 1.0);
  float band = clamp(floor(sh * (uBands + 1.0)) / max(uBands, 1.0), 0.0, 1.0);
  col.rgb = mix(col.rgb * uShadow, col.rgb, band);
  if (m < uOutline || holes < thr + uOutline * 0.6) col.rgb = uOutlineColor;
  a = 1.0;
#elif SHAPE == 2
  // Streak: bright head, tapered tail. Sparks and speed lines.
  float w = 1.0 - abs(c.x) * 2.0;
  a = pow(clamp(w, 0.0, 1.0), uSoft) * pow(vUv.y, 1.6);
  col.rgb *= 1.0 + 1.5 * smoothstep(0.75, 1.0, vUv.y) * smoothstep(0.4, 1.0, w);
#elif SHAPE == 3
  // Smoke: billow + warped noise with two pans, self-shadow toward the light,
  // optional glow from the fire underneath.
  vec2 base = vUv * 0.25 * uNoiseScale + vSeed.xy;
  float tt = vN * 1.5 + vSeed.z * 3.0;
  r = length((vUv - 0.5) * 2.0 + (tn(vUv * 0.3 + vSeed.zw).rb - 0.5) * 0.55);
  vec4 nA = tnDual(base, vec2(0.0, -0.05), vec2(0.02, -0.08), tt);
  vec2 toL = normalize(uLightView.xy + 0.0001) * 0.035;
  vec4 nB = tnDual(base + toL, vec2(0.0, -0.05), vec2(0.02, -0.08), tt);
  float f = nA.r * 0.55 + nA.b * 0.45;
  float f2 = nB.r * 0.55 + nB.b * 0.45;
  float dens = clamp((f * 1.7 - 0.3 - r * 1.05 - vN * uErode * 0.55) * 3.5, 0.0, 1.0);
  float lit = clamp(0.7 + (f - f2) * 6.0, 0.15, 1.1);
  col.rgb *= mix(uShadow, vec3(1.0), lit);
  col.rgb += uFireColor * uFireK * (1.0 - smoothstep(0.0, uFireH, vHeight)) * (1.0 - vN * 0.6);
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
  // Debris shard: irregular hard polygon with a lit and an unlit face.
  float skew = vSeed.x - 0.5;
  float d = abs(c.x + c.y * skew) * 1.6 + abs(c.y) * (1.2 + vSeed.y);
  if (d > 0.5) discard;
  col.rgb *= 0.7 + 0.6 * step(0.0, c.x - c.y * 0.3);
  a = 1.0;
#elif SHAPE == 7
  // Fire: billow noise scrolling up, eroded by a threshold that rises with age
  // and with height (tips burn off first), coloured by heat through the ramp.
  vec2 base = vUv * 0.12 * uNoiseScale + vSeed.xy;
  vec4 n4 = tnDual(base, vec2(0.0, -0.35), vec2(0.06, -0.55), uTimeAbs + vSeed.z * 3.0);
  float f = n4.r * 0.6 + n4.b * 0.4;
  r = length((vUv - 0.5) * 2.0 + (tn(vUv * 0.3 + vSeed.zw + vec2(0.0, -uTimeAbs * 0.2)).rb - 0.5) * 0.6);
  float shape = 1.0 - r * 0.9;
  // Keep a hot core early in life: threshold stays low for the first ~30%.
  float thr = mix(0.05, 0.95, pow(clamp(vN, 0.0, 1.0), 1.6)) * uErode + (1.0 - uErode) * 0.1
            + (vUv.y - 0.5) * uVBias;
  float heat = (f * shape * 1.9 + (1.0 - r) * 0.4 - thr) / max(uSoft, 0.001);
  if (heat <= 0.0) discard;
  col = texture2D(uRamp, vec2(clamp(1.0 - heat, 0.0, 1.0), 0.5));
  a = clamp(heat * 3.0, 0.0, 1.0);
  // Hot parts glow through, cooled parts occlude like smoke.
  occl = mix(0.35, 1.0, smoothstep(0.2, 0.9, 1.0 - clamp(heat, 0.0, 1.0)));
#endif
  float fade = smoothstep(0.0, uFade.x, vN) * (1.0 - smoothstep(uFade.y, 1.0, vN));
  float alpha = col.a * a * fade * uOpacity * softFade(uFadeDist);
  if (alpha < 0.002) discard;
  vec3 rgb = col.rgb * uIntensity;
#ifdef PREMUL
  gl_FragColor = vec4(rgb * alpha, alpha * occl);
#else
  gl_FragColor = vec4(rgb, alpha);
#endif
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
      v.set(s * Math.cos(a), z, s * Math.sin(a)).applyQuaternion(q);
    } else if (mode === 'cone') {
      const ang = (opt.angle ?? 30) * Math.PI / 180;
      const z = 1 - r() * (1 - Math.cos(ang)), a = r() * Math.PI * 2, s = Math.sqrt(1 - z * z);
      v.set(s * Math.cos(a), z, s * Math.sin(a)).applyQuaternion(q);
    } else if (mode === 'ring') {
      const a = (i / count) * Math.PI * 2 + r() * 0.3;
      const up = (opt.lift ?? 0) * (r() * 0.6 + 0.4);
      v.set(Math.cos(a), up, Math.sin(a)).normalize();
    } else {
      v.copy(axis);
    }
    out.set([v.x, v.y, v.z], i * 3);
  }
  return out;
}

// Per-particle size scale. sizeDist [big, mid, small] uses 1 : 0.5 : 0.15 tiers,
// which reads far better than one uniform random spread.
function scales(count, r, opt) {
  const out = new Float32Array(count);
  const dist = opt.sizeDist;
  const rand = opt.sizeRand ?? 0.3;
  for (let i = 0; i < count; i++) {
    if (dist) {
      const total = dist[0] + dist[1] + dist[2];
      const x = r() * total;
      const tier = x < dist[0] ? 1 : x < dist[0] + dist[1] ? 0.5 : 0.15;
      out[i] = tier * (0.85 + r() * 0.3);
    } else {
      out[i] = 1 - rand + rand * 2 * r();
    }
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
  geo.setAttribute('aScale', new THREE.InstancedBufferAttribute(scales(count, r, o), 1));
  geo.instanceCount = count;
  const fade = o.fade || [0, 0.7];
  const fireK = curve(o.fireGlow?.k || [[0, 0]]);
  const defines = { SHAPE: SHAPES[o.shape || 'glow'] };
  if (o.blend === 'premul') defines.PREMUL = 1;

  const mat = new THREE.ShaderMaterial({
    defines,
    uniforms: {
      ...G,
      uTime: { value: 0 },
      uTimeAbs: { value: 0 },
      uDelay: { value: new THREE.Vector2(...(o.delay || [0, 0])) },
      uLife: { value: new THREE.Vector2(...(o.life || [0.4, 0.8])) },
      uSpeed: { value: new THREE.Vector2(...(o.speed || [1, 3])) },
      uGravity: { value: v3(o.gravity || [0, 0, 0]) },
      uDrag: { value: o.drag ?? 0.001 },
      uSize: { value: new THREE.Vector2(...(o.size || [0.3, 0.1])) },
      uSizePow: { value: o.sizePow ?? 1 },
      uStretch: { value: o.stretch ?? 0 },
      uSpawnR: { value: o.spawnR ?? 0 },
      uOrigin: { value: v3(o.origin || [0, 1, 0]) },
      uCurl: { value: o.curl ?? 0 },
      uSpin: { value: o.spin ?? 0 },
      uGround: { value: o.ground ?? -100 },
      uBounce: { value: o.bounce ?? 0 },
      uMinPx: { value: o.minPx ?? 2 },
      uSizeIn: { value: o.sizeIn ?? 0 },
      uRamp: { value: o.ramp },
      uOpacity: { value: o.opacity ?? 1 },
      uFade: { value: new THREE.Vector2(Math.max(0.001, fade[0]), Math.min(0.999, fade[1])) },
      uIntensity: { value: o.intensity ?? 1 },
      uErode: { value: o.erode ?? 0.8 },
      uNoiseScale: { value: o.noiseScale ?? 4 },
      uBands: { value: o.bands ?? 2 },
      uSoft: { value: o.soft ?? 1.5 },
      uShadow: { value: o.shadow ? color3(o.shadow) : new THREE.Vector3(0.55, 0.5, 0.6) },
      uOutline: { value: o.outline ?? 0 },
      uOutlineColor: { value: o.outlineColor ? color3(o.outlineColor) : new THREE.Vector3(0.05, 0.03, 0.05) },
      uFadeDist: { value: o.fadeDist ?? 0.3 },
      uVBias: { value: o.vBias ?? 0.25 },
      uFireColor: { value: color3(o.fireGlow?.color || '#000000', o.fireGlow?.intensity ?? 1) },
      uFireK: { value: 0 },
      uFireH: { value: o.fireGlow?.height ?? 1.5 },
    },
    vertexShader: BURST_VS,
    fragmentShader: BURST_FS,
    transparent: true,
    depthWrite: false,
  });
  blending(mat, o.blend || 'add');
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = o.order ?? 0;
  return {
    object: mesh,
    scene: o.cel ? 'cel' : undefined,
    update(t, tAbs) {
      mat.uniforms.uTime.value = t;
      mat.uniforms.uTimeAbs.value = tAbs;
      mat.uniforms.uFireK.value = fireK(tAbs);
    },
    dispose() { geo.dispose(); base.dispose(); mat.dispose(); },
  };
}

// ---------------------------------------------------------------------------
// Flash: camera-facing star or disc. `dir` (world) and `aspect` stretch it
// along the hit direction; spikes with low sharpness are wedges, high
// sharpness are hairlines (avoid those for anime).
// ---------------------------------------------------------------------------
const FLASH_VS = /* glsl */ `
uniform vec3 uPos;
uniform float uSize;
uniform vec3 uDir;
uniform float uAspect;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(uPos, 1.0);
  vec2 d = (viewMatrix * vec4(uDir, 0.0)).xy;
  float L = length(d);
  d = L > 0.0001 ? d / L : vec2(1.0, 0.0);
  vec2 pp = vec2(-d.y, d.x);
  mv.xy += (d * position.x * uAspect + pp * position.y) * uSize;
  gl_Position = projectionMatrix * mv;
}`;

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
uniform float uRound;
uniform vec3 uCoreColor;
uniform vec3 uEdgeColor;
uniform float uSeed;
varying vec2 vUv;
${NOISE}
void main() {
  vec2 c = (vUv - 0.5) * 2.0 / max(uScale, 0.0001);
  float r = length(c);
  float ang = atan(c.y, c.x) + uRot;
  // Pointed spikes from a triangle wave (straight-edged star at sharp 1,
  // concave anime spikes at 2-4); rounded tips from a cosine for toon.
  float tri = 1.0 - abs(fract(ang / 6.2832 * uSpikes + 0.5) - 0.5) * 2.0;
  float sp = uRound > 0.5 ? pow(abs(cos(ang * uSpikes * 0.5)), uSharp) : pow(tri, uSharp);
  float idx = floor((ang + 3.1416) / 6.2832 * uSpikes + 0.5);
  float jit = 1.0 + (hash12(vec2(idx, uSeed)) - 0.5) * uJitter;
  float rad = uCore + uSpikeLen * sp * max(jit, 0.2);
  float s = 1.0 - r / max(rad, 0.0001);
  float a = uHard > 0.5 ? step(0.0, s) : pow(clamp(s, 0.0, 1.0), uSoft);
  vec3 col = mix(uEdgeColor, uCoreColor, uHard > 0.5 ? step(0.45, s) : smoothstep(0.0, 0.6, s));
  float alpha = a * uAlpha;
  if (alpha < 0.002) discard;
  gl_FragColor = vec4(col, alpha);
}`;

export function flash(o) {
  const geo = new THREE.PlaneGeometry(1, 1);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uPos: { value: v3(o.pos || [0, 1, 0]) },
      uSize: { value: o.size ?? 1.5 },
      uDir: { value: v3(o.dir || [1, 0, 0]) },
      uAspect: { value: o.aspect ?? 1 },
      uScale: { value: 0 },
      uAlpha: { value: 0 },
      uSpikes: { value: o.spikes ?? 5 },
      uSpikeLen: { value: o.spikeLen ?? 0.6 },
      uCore: { value: o.core ?? 0.25 },
      uSharp: { value: o.sharp ?? 4 },
      uRot: { value: o.rot ?? 0 },
      uHard: { value: o.hard ? 1 : 0 },
      uSoft: { value: o.soft ?? 4 },
      uJitter: { value: o.jitter ?? 0 },
      uRound: { value: o.round ? 1 : 0 },
      uSeed: { value: o.seed ?? 3 },
      uCoreColor: { value: color3(o.core_color || '#ffffff', o.coreK ?? 2.5) },
      uEdgeColor: { value: color3(o.edge_color || '#66ccff', o.edgeK ?? 1.2) },
    },
    vertexShader: FLASH_VS,
    fragmentShader: FLASH_FS,
    transparent: true,
    depthWrite: false,
    depthTest: o.depthTest ?? false,
  });
  blending(mat, o.blend || 'add');
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = o.order ?? 8;
  const scale = curve(o.scaleCurve || [[0, 0], [0.05, 1, 'outExpo'], [0.2, 0.6]]);
  const alpha = curve(o.alphaCurve || [[0, 1], [0.05, 1], [0.1, 0]]);
  const rotSpeed = o.rotSpeed ?? 0;
  return {
    object: mesh,
    update(t) {
      mat.uniforms.uScale.value = scale(t);
      mat.uniforms.uAlpha.value = alpha(t);
      mat.uniforms.uRot.value = (o.rot ?? 0) + rotSpeed * t;
      if (o.redraw) {
        // A new designed drawing each held frame: new spike lengths, count and angle.
        const k = Math.floor(Math.max(0, t) * o.redraw + 1e-6);
        mat.uniforms.uSeed.value = (o.seed ?? 3) + k * 7.31;
        mat.uniforms.uSpikes.value = (o.spikes ?? 5) + [0, -1, 1][k % 3];
        mat.uniforms.uRot.value = (o.rot ?? 0) + k * 0.9;
      }
    },
    dispose() { geo.dispose(); mat.dispose(); },
  };
}

// ---------------------------------------------------------------------------
// Ring: a band of radius R and width W. Lies on the ground by default,
// faces the camera with billboard: true, or sits in the plane whose normal is
// `normal` (use the hit direction so the ring is perpendicular to the blow).
// ---------------------------------------------------------------------------
const RING_FS = /* glsl */ `
uniform float uR;
uniform float uW;
uniform float uAlpha;
uniform float uHard;
uniform float uSoft;
uniform float uNoiseAmt;
uniform float uNoiseFreq;
uniform float uErode;
uniform float uFill;
uniform float uSeed;
uniform float uEdge;
uniform float uCoverage;
uniform float uAspect;
uniform vec3 uColor;
uniform vec3 uColor2;
varying vec2 vUv;
${TEXNOISE}
void main() {
  vec2 c = (vUv - 0.5) * 2.0;
  c.x /= max(uAspect, 0.01);
  float r = length(c);
  float ang01 = atan(c.y, c.x) / 6.2832 + 0.5;
  float reps = max(1.0, floor(uNoiseFreq * 0.5 + 0.5));
  float nz = tn(vec2(ang01 * reps, uSeed * 0.137)).g;
  float w = uW * (1.0 - uNoiseAmt + uNoiseAmt * 2.0 * nz);
  float d = abs(r - uR) - w;
  float a = uHard > 0.5 ? step(d, 0.0) : 1.0 - smoothstep(0.0, uSoft, d);
  float across = clamp((r - (uR - w)) / max(2.0 * w, 0.0001), 0.0, 1.0);
  vec3 col = mix(uColor2, uColor, uHard > 0.5 ? step(0.5, across) : across);
  // Thin bright leading edge on the outside of the band.
  col += uColor * uEdge * smoothstep(0.75, 1.0, across) * (1.0 - smoothstep(1.0, 1.15, across));
  a += uFill * (1.0 - smoothstep(0.0, max(uR, 0.0001), r)) * (1.0 - a);
  float holes = tn(c * 0.45 + uSeed * 0.31).g;
  if (holes < uErode) a = 0.0;
  // Broken arc: only part of the circle exists. A closed even hoop reads as UI.
  if (uCoverage < 0.999) {
    float cv = tn(vec2(ang01 * 2.0, uSeed * 0.29 + 0.5)).r;
    a *= smoothstep(1.0 - uCoverage - 0.04, 1.0 - uCoverage + 0.04, cv);
  }
  float alpha = a * uAlpha * step(r, 1.0);
  if (alpha < 0.002) discard;
  gl_FragColor = vec4(col, alpha);
}`;

const PLANE_VS = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

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

function orientPlane(mesh, o, defaultY = 0.02) {
  if (o.normal) {
    const n = v3(o.normal).normalize();
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
    mesh.position.set(...(o.pos || [0, 1, 0]));
  } else {
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(...(o.pos || [0, defaultY, 0]));
  }
}

export function ring(o) {
  const geo = new THREE.PlaneGeometry(1, 1);
  const size = o.size ?? 6;
  const uniforms = {
    ...G,
    uR: { value: 0 }, uW: { value: 0.05 }, uAlpha: { value: 1 },
    uHard: { value: o.hard ? 1 : 0 }, uSoft: { value: o.soft ?? 0.05 },
    uNoiseAmt: { value: o.noise ?? 0.3 }, uNoiseFreq: { value: o.noiseFreq ?? 4 },
    uErode: { value: 0 }, uFill: { value: o.fill ?? 0 }, uSeed: { value: o.seed ?? 1 },
    uEdge: { value: o.edge ?? 0 },
    uCoverage: { value: o.coverage ?? 1 },
    uAspect: { value: o.aspect ?? 1 },
    uColor: { value: color3(o.color || '#ffffff', o.colorK ?? 1.5) },
    uColor2: { value: color3(o.color2 || o.color || '#ffffff', o.color2K ?? o.colorK ?? 1.5) },
    uPos: { value: v3(o.pos || [0, 1, 0]) },
    uSize: { value: size },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: o.billboard ? BILLBOARD_VS : PLANE_VS,
    fragmentShader: RING_FS,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  blending(mat, o.blend || 'add');
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = o.order ?? 2;
  if (!o.billboard) {
    mesh.scale.setScalar(size);
    orientPlane(mesh, o);
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
// Slash: a crescent swept by a moving head. uv.x runs along the arc, uv.y
// across it. The arc midpoint sits on the mesh origin, so placing the mesh on
// the hit point makes the blade path pass through the target. Dissolve tears
// along ridged noise and burns at the edge.
// ---------------------------------------------------------------------------
const SLASH_FS = /* glsl */ `
uniform float uHead;
uniform float uTail;
uniform float uAlpha;
uniform float uHard;
uniform float uWobble;
uniform float uThick;
uniform float uSeed;
uniform float uDissolve;
uniform vec3 uCore;
uniform vec3 uEdge;
uniform vec3 uRim;
uniform float uRimW;
uniform vec3 uBurn;
uniform float uBurnW;
varying vec2 vUv;
${TEXNOISE}
void main() {
  float tl = (uHead - vUv.x) / max(uTail, 0.0001);
  if (tl < 0.0 || tl > 1.0) discard;
  float ends = smoothstep(0.0, 0.08, vUv.x) * (1.0 - smoothstep(0.85, 1.0, vUv.x));
  float w = uThick * pow(1.0 - tl, 0.6) * ends;
  float nz = tn(vec2(vUv.x * 1.5 - uHead * 0.4, vUv.y * 0.35) + uSeed * 0.21).b;
  float dr = abs(vUv.y - 0.5) * 2.0 + (nz - 0.5) * uWobble;
  float s = 1.0 - dr / max(w, 0.0001);
  if (s <= 0.0) discard;
  float tear = tn(vec2(vUv.x * 2.5, vUv.y * 0.6) + uSeed * 0.37).a;
  float thr = uDissolve * tl;
  if (tear < thr) discard;
  float a = uHard > 0.5 ? 1.0 : smoothstep(0.0, 0.35, s);
  float k = uHard > 0.5 ? step(0.55, s) * step(tl, 0.75) : smoothstep(0.2, 0.9, s) * (1.0 - tl);
  vec3 col = mix(uEdge, uCore, k);
  if (s < uRimW) col = uRim;
  if (uBurnW > 0.0 && tear < thr + uBurnW) col = uBurn;
  float alpha = a * uAlpha;
  if (alpha < 0.002) discard;
  gl_FragColor = vec4(col, alpha);
}`;

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
      uNoise: G.uNoise,
      uHead: { value: 0 }, uTail: { value: o.tail ?? 0.6 }, uAlpha: { value: 1 },
      uHard: { value: o.hard ? 1 : 0 }, uWobble: { value: o.noise ?? 0.15 },
      uThick: { value: o.thick ?? 1 }, uSeed: { value: o.seed ?? 2 },
      uDissolve: { value: o.dissolve ?? 0 },
      uCore: { value: color3(o.coreColor || '#ffffff', o.coreK ?? 2.5) },
      uEdge: { value: color3(o.edgeColor || '#4fc3ff', o.edgeK ?? 1.2) },
      uRim: { value: color3(o.rimColor || o.edgeColor || '#000000', o.rimK ?? 1) },
      uRimW: { value: o.rimW ?? 0 },
      uBurn: { value: color3(o.burnColor || '#ffffff', o.burnK ?? 2) },
      uBurnW: { value: o.burnW ?? 0 },
    },
    vertexShader: PLANE_VS,
    fragmentShader: SLASH_FS,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    depthTest: o.depthTest ?? false,
  });
  blending(mat, o.blend || 'add');
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
// Decal on the ground: a dark scorch bed, optional radial cracks (Voronoi in
// polar-log space, so cells stretch outward and shrink toward the centre),
// widths tapering with radius, and per-cell cooling so veins die unevenly.
// ---------------------------------------------------------------------------
const DECAL_FS = /* glsl */ `
uniform float uAlpha;
uniform float uGlow;
uniform float uSeed;
uniform float uCracks;
uniform float uReveal;
uniform float uScorch;
uniform float uSplat;
uniform vec3 uDark;
uniform vec3 uHot;
varying vec2 vUv;
${NOISE}
${TEXNOISE}
float hashW(vec2 p, float P) { return hash12(vec2(mod(p.x, P), p.y)); }
// Voronoi periodic in x with period P: seamless around the angle.
vec2 voronoiWrap(vec2 p, float P) {
  vec2 n = floor(p);
  vec2 f = fract(p);
  vec2 mg, mr;
  float md = 8.0;
  for (int j = -1; j <= 1; j++)
  for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j));
    vec2 o = vec2(hashW(n + g, P), hashW(n + g + vec2(0.0, 19.7), P));
    vec2 r = g + o - f;
    float d = dot(r, r);
    if (d < md) { md = d; mr = r; mg = g; }
  }
  float id = hashW(n + mg + vec2(0.0, 5.3), P);
  md = 8.0;
  for (int j = -2; j <= 2; j++)
  for (int i = -2; i <= 2; i++) {
    vec2 g = mg + vec2(float(i), float(j));
    vec2 o = vec2(hashW(n + g, P), hashW(n + g + vec2(0.0, 19.7), P));
    vec2 r = g + o - f;
    if (dot(mr - r, mr - r) > 0.00001)
      md = min(md, dot(0.5 * (mr + r), normalize(r - mr)));
  }
  return vec2(md, id);
}
void main() {
  vec2 c = (vUv - 0.5) * 2.0;
  float r = length(c);
  float f = tn(c * 0.35 + uSeed * 0.13).b;
  float scorch = (1.0 - smoothstep(0.25, 0.9, r + (f - 0.5) * 0.5)) * uScorch;
  float reveal = step(r, uReveal + (f - 0.5) * 0.3);
  float vein = 0.0;
  float cellCool = 1.0;
  if (uCracks > 0.0) {
    const float P = 6.0;
    float ang01 = atan(c.y, c.x) / 6.2832 + 0.5;
    vec2 warp = vec2(tn(c * 0.3 + uSeed * 0.1).b, tn(c * 0.3 + uSeed * 0.1 + 0.5).b) - 0.5;
    vec2 pp = vec2(ang01 * P, log(max(r, 0.015)) * 1.3) + warp * vec2(1.2, 0.6);
    vec2 vc = voronoiWrap(pp + vec2(0.0, uSeed), P);
    float width = mix(0.06, 0.015, clamp(r, 0.0, 1.0));
    vein = (1.0 - smoothstep(0.0, width, vc.x)) * pow(1.0 - clamp(r, 0.0, 1.0), 1.4)
         * (0.55 + tn(c * 0.6).r * 0.9) * uCracks;
    // Prune some borders so it branches instead of forming a web.
    vein *= step(0.35, hash12(floor(pp + vec2(0.0, uSeed)) + 3.7));
    cellCool = clamp(uGlow * 1.6 - vc.y * 0.6, 0.0, 1.0);
  }
  float molten = (1.0 - smoothstep(0.0, 0.3, r)) * uGlow * uCracks;
  if (uSplat > 0.0) {
    // Splat: thresholded warped blob plus satellite drops, hard edged.
    float blob = tn(c * 0.35 + uSeed * 0.17).b * (1.25 - r * 1.15);
    float sat = tn(c * 1.3 + uSeed * 0.23).g * (1.0 - smoothstep(0.5, 1.0, r));
    float m = step(0.62, max(blob, sat * 0.85)) * reveal;
    if (m < 0.5) discard;
    gl_FragColor = vec4(uDark * (0.8 + 0.4 * tn(c * 2.0).r), uAlpha);
    return;
  }
  vec3 col = uDark + uHot * (vein * 3.0 * cellCool + molten * 2.0 + scorch * 0.3 * uGlow * (1.0 - r));
  float a = max(max(scorch * 0.9, vein * max(cellCool, 0.25)), molten) * uAlpha * reveal;
  if (a < 0.002) discard;
  gl_FragColor = vec4(col, a);
}`;

export function decal(o) {
  const geo = new THREE.PlaneGeometry(1, 1);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uNoise: G.uNoise,
      uAlpha: { value: 0 }, uGlow: { value: 0 }, uSeed: { value: o.seed ?? 4 },
      uCracks: { value: o.cracks ?? 0 }, uReveal: { value: 0 }, uScorch: { value: o.scorch ?? 1 }, uSplat: { value: o.splat ? 1 : 0 },
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
  const Gl = curve(o.glow || [[0, 1], [1.5, 0, 'outQuad']]);
  const R = curve(o.reveal || [[0, 0], [0.15, 1.2, 'outExpo']]);
  return {
    object: mesh,
    update(t) { mat.uniforms.uAlpha.value = A(t); mat.uniforms.uGlow.value = Gl(t); mat.uniforms.uReveal.value = R(t); },
    dispose() { geo.dispose(); mat.dispose(); },
  };
}

// ---------------------------------------------------------------------------
// Distortion: draws UV offsets into a separate buffer that a post pass uses to
// bend the image behind it. kind 'ring' pushes outward along a band (shock),
// kind 'heat' wobbles upward inside a soft column (heat haze).
// ---------------------------------------------------------------------------
const DISTORT_FS = /* glsl */ `
uniform float uR;
uniform float uW;
uniform float uStrength;
uniform float uTimeAbs;
uniform float uKind;
varying vec2 vUv;
${TEXNOISE}
void main() {
  vec2 c = (vUv - 0.5) * 2.0;
  float r = length(c);
  vec2 off;
  if (uKind < 0.5) {
    float band = 1.0 - smoothstep(0.0, max(uW, 0.0001), abs(r - uR));
    off = (c / max(r, 0.0001)) * band;
  } else {
    float mask = (1.0 - smoothstep(0.3, 1.0, abs(c.x))) * smoothstep(-1.0, -0.6, c.y) * (1.0 - smoothstep(0.2, 1.0, c.y));
    vec4 n = tnDual(vUv * 0.6, vec2(0.0, -0.5), vec2(0.04, -0.8), uTimeAbs);
    off = (n.rb - 0.5) * 2.0 * mask;
  }
  gl_FragColor = vec4(off * uStrength, 0.0, 1.0);
}`;

export function distort(o) {
  const geo = new THREE.PlaneGeometry(1, 1);
  const size = o.size ?? 4;
  const kind = o.kind === 'heat' ? 1 : 0;
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uNoise: G.uNoise,
      uR: { value: 0 }, uW: { value: 0.1 }, uStrength: { value: 0 }, uTimeAbs: { value: 0 },
      uKind: { value: kind },
      uPos: { value: v3(o.pos || [0, 1, 0]) },
      uSize: { value: size },
    },
    vertexShader: o.billboard || kind === 1 ? BILLBOARD_VS : PLANE_VS,
    fragmentShader: DISTORT_FS,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  if (!(o.billboard || kind === 1)) {
    mesh.scale.setScalar(size);
    orientPlane(mesh, o);
  }
  const R = curve(o.radius || [[0, 0.05], [0.5, 0.95, 'outExpo']]);
  const W = curve(o.width || [[0, 0.12], [0.5, 0.04]]);
  const S = curve(o.strength || [[0, 0.03], [0.5, 0]]);
  return {
    object: mesh,
    scene: 'distort',
    update(t, tAbs) {
      mat.uniforms.uR.value = R(t);
      mat.uniforms.uW.value = W(t);
      mat.uniforms.uStrength.value = t >= 0 ? S(t) : 0;
      mat.uniforms.uTimeAbs.value = tAbs;
    },
    dispose() { geo.dispose(); mat.dispose(); },
  };
}

// ---------------------------------------------------------------------------
// Light: a real point light so the effect lights the ground and the target.
// Physical falloff (decay 2) with a limited range.
// ---------------------------------------------------------------------------
export function light(o) {
  const l = new THREE.PointLight(o.color || '#ffaa55', 0, o.distance ?? 6, 2);
  l.position.set(...(o.pos || [0, 1, 0]));
  if (o.shadow) {
    l.castShadow = true;
    l.shadow.mapSize.set(512, 512);
    l.shadow.bias = -0.002;
  }
  const I = curve(o.intensity || [[0, 0], [0.03, 40], [0.6, 0, 'outQuad']]);
  const flicker = o.flicker ?? 0;
  return {
    object: l,
    update(t) {
      let k = I(t);
      if (flicker > 0 && t > 0) k *= 1 - flicker + flicker * (0.5 + 0.5 * Math.sin(t * 53.1) * Math.sin(t * 31.7 + 1.3));
      l.intensity = Math.max(0, k);
    },
    dispose() { l.dispose?.(); },
  };
}

export { distortScene };
