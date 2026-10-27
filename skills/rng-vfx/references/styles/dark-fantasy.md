# Dark fantasy

Diablo IV, Path of Exile, Elden Ring, Dark Souls, Lords of the Fallen. Grim, heavy, material: dark masses with hot edges, blood that has weight, fire that burns rather than glows.

**References to recall:** Diablo IV (Barbarian heavy hits, Necromancer blood spells, Sorcerer fire), Elden Ring (Bloodhound's Fang slashes, Rivers of Blood, greatsword impacts), Path of Exile (Cyclone, Heavy Strike). Describe the matching one at contact, +2, +6 frames and the end before building.

## Look

- Value carries the effect: dark bodies with a thin hot edge (a dark torn slash with a red-orange rim), not bright glowing shapes.
- Desaturated, heavy palette with one hot accent. Example blood: `#7a0a10` body, `#3a0206` dark, a small `#ff5a3c` glint; fire: `#ffb070` core, `#d8280c` body, `#6a0808` edge, `#120406` smoke base; smoke `#1e1416` to `#3a2e30`, never pure black (it must read against a dark background with a rim of fire light from below).
- Torn, ragged, asymmetric shapes: claws, tears, splinters, cracks; nothing perfectly round or clean.
- Fire stays red-orange under the tone mapper: keep its body below the bloom threshold.
- Heavy timing: big hits have hit stop, a long hold of the dark residue and slow smoke.

## Timing defaults (60 fps)

| Layer | Start | Peak | End |
|---|---|---|---|
| Slash (dark body, hot rim) | -3 | 0 - 2 | erodes by 14 - 18 |
| Torn contact flash | 0 | 1 | 4 - 5 |
| Blood spray | 0 | | lands as splats at 18 - 27 |
| Splat decals | 18 | | stay |
| Embers | 2 | | 60 - 90, rising |
| Ground cracks (explosions) | -15 (spread before) | 0 | cool unevenly until 180 |
| Fire tongues | 0 | 4 - 8 | 40 - 60 |
| Smoke | 4 | grows 60 - 120 | 180 - 300 |

## Signature shapes

- A dark crescent with a hot rim on its outer edge, burning off from the tail.
- One torn blade along the swing as the contact flash, never a symmetric star or a cross.
- Blood: dark teardrops stretched by speed, a bright glint on a few, landing as splats with satellite drops.
- Glowing cracks that branch and cool unevenly.
- Black smoke lit from below by the fire.

## Failure modes in this style

- Bright saturated red glow everywhere (neon blood, pink sprinkles).
- The target repainted red on hit; the hit reads through the rim, the jolt and light.
- Clean geometric shapes, symmetric crosses and stars.
- Smoke that vanishes on dark backgrounds because it has no rim light.
- Round dot splats.
