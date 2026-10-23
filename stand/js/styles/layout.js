// Shared stage layout so every style is judged at the same scale.
// The dummy is 1.8 m tall. Impacts land on its chest; explosions go off
// beside it so the dummy stays as a size reference.

export const HIT = [0, 1.15, 0.35];
export const BLAST = [0.6, 0, 0];
// Hit lights sit in front of the target; a light inside the dummy just paints it.
export const HIT_LIGHT = [0, 1.25, 1.2];
// Direction the blow travels (attacker to target, out the far side). Kept
// well off the camera axis so sprays and streaks read as long shapes.
export const HIT_DIR = (() => { const v = [1, 0.2, -0.25]; const l = Math.hypot(...v); return v.map(x => x / l); })();
export const UP = [0, 1, 0];
// Plane for rings perpendicular-ish to the blow but still facing the camera
// enough to read as an ellipse, never edge-on.
export const RING_N = (() => { const v = [1, 0.45, 1.35]; const l = Math.hypot(...v); return v.map(x => x / l); })();
// From the blast toward the dummy, for knockback in explosions.
export const AWAY = (() => { const v = [-1, 0, -0.3]; const l = Math.hypot(...v); return v.map(x => x / l); })();
export const at = (base, x = 0, y = 0, z = 0) => [base[0] + x, base[1] + y, base[2] + z];

export const STAGE = {
  impact: { dummy: [0, 0, 0], focus: [0, 1.1, 0] },
  explosion: { dummy: [-2.4, 0, -0.8], focus: [0.3, 1.2, 0] },
};

export const ARCHETYPES = [
  { id: 'impact', name: 'Impact' },
  { id: 'explosion', name: 'Explosion' },
];
