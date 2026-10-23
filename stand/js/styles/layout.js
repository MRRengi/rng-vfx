// Shared stage layout so every style is judged at the same scale.
// The dummy is 1.8 m tall. Impacts land on its chest; explosions go off
// beside it so the dummy stays as a size reference.

export const HIT = [0, 1.15, 0.35];
export const BLAST = [0.6, 0, 0];
// Hit lights sit in front of the target; a light inside the dummy just paints it.
export const HIT_LIGHT = [0, 1.25, 1.2];
export const at = (base, x = 0, y = 0, z = 0) => [base[0] + x, base[1] + y, base[2] + z];

export const STAGE = {
  impact: { dummy: [0, 0, 0], focus: [0, 1.1, 0] },
  explosion: { dummy: [-2.4, 0, -0.8], focus: [0.3, 1.2, 0] },
};

export const ARCHETYPES = [
  { id: 'impact', name: 'Impact' },
  { id: 'explosion', name: 'Explosion' },
];
