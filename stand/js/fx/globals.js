import * as THREE from 'three';

// Uniforms shared by every effect material. Each material references these
// same objects, so main.js updates them once per frame for all effects.
export const G = {
  uNoise: { value: null },                    // RGBA tiling noise: R billow, G worley, B warped fbm, A ridged
  uDepth: { value: null },                    // opaque scene depth (soft particles)
  uRes: { value: new THREE.Vector2(1, 1) },   // size of the target effects render into
  uNear: { value: 0.05 },
  uFar: { value: 200 },
  uPxScale: { value: 0.001 },                 // world units per pixel at distance 1
  uLightView: { value: new THREE.Vector3(-0.4, 0.7, 0.6).normalize() }, // key light, view space
  uSnapRes: { value: new THREE.Vector2(0, 0) }, // pixel style: snap particle centres to this grid
};

// Effects that render into the distortion buffer instead of the colour image.
export const distortScene = new THREE.Scene();

// Cel layers (anime, toon, pixel puffs) render here so one outline can be
// drawn around their union instead of one per puff.
export const celScene = new THREE.Scene();

// Additive layers (sparks, flashes, glows, trails) render here, after the cel
// layer is composited, so cel puffs never cover the spark.
export const overScene = new THREE.Scene();

// Soft-particle and screen-size helpers used by several fragment shaders.
export const SOFT = /* glsl */ `
uniform sampler2D uDepth;
uniform vec2 uRes;
uniform float uNear;
uniform float uFar;
float linDepth(float d) {
  float z = d * 2.0 - 1.0;
  return 2.0 * uNear * uFar / (uFar + uNear - z * (uFar - uNear));
}
float softFade(float fadeDist) {
  if (fadeDist <= 0.0) return 1.0;
  float scene = linDepth(texture2D(uDepth, gl_FragCoord.xy / uRes).r);
  float frag = linDepth(gl_FragCoord.z);
  return clamp((scene - frag) / fadeDist, 0.0, 1.0);
}`;
