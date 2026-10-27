# Stylized (MOBA, hero shooters, hand-painted)

League of Legends, Overwatch, Dota 2, Heroes of the Storm, Fortnite, Smite. Readability for gameplay comes first: every ability must read instantly from a high or third-person camera among many others, so shapes are bold, graphic and clean, and textures look painted.

**References to recall:** League of Legends (Garen's Judgment and Decisive Strike, Yasuo's Steel Tempest, Riven's abilities, Jinx's rockets), Overwatch (Reinhardt's hammer swing and Earthshatter, Genji's Dragonblade, Junkrat's explosions), Dota 2 (Juggernaut's Omnislash). Describe the matching one at contact, +2, +6 frames and the end before building.

## Look

- Bold silhouettes with simple, designed shapes: crescents, stars, petals, chunky shards, clean rings with gaps.
- Hand-painted value structure: 2 - 3 hard or slightly soft bands (light core, saturated mid, darker rim), painted brush texture inside shapes rather than noise, very little gradient.
- Bloom low or off: the shapes read on their own. Brightness never washes out the champion or the ground.
- Colour: one saturated hero colour plus one secondary accent, chosen for the character or ability, with a dark rim for contrast on bright ground. Example for a heavy gold blade: core `#fffbe6`, mid `#ffc23a`, deep `#c2620e`, rim `#4a1d06`, accent `#5fd3ff`. Example for a cyan ability: core `#effdff`, mid `#36d6ff`, deep `#1478c8`, rim `#0b2d5a`, accent `#ffd34a`.
- Fire and smoke are painted: posterized heat bands, the hottest band one connected shape; smoke in warm browns or purples with soft painted edges.

## Timing defaults (60 fps)

| Layer | Start | Peak | End |
|---|---|---|---|
| Wind-up / anticipation | -10 to -4 | | 0 |
| Slash head sweep | -3 | 0 (reaches target) | |
| Slash hold, then erode from tail | 0 | 0 - 2 | 10 - 16 |
| Contact flash (star) | 0 | 1 | 4 - 6 |
| Shards / sparks | 0 | | 15 - 30 |
| Ground ring / crack | 1 | 6 - 10 | 20 - 30 |
| Slash mark / afterimage | 0 | | 20 - 30 |
| Hit stop (heavy) | 0 | | 3 - 5 frames freeze |

Heavy hits are bigger, not longer: the peak shape is 1.5 - 2x a light hit's size at the same speed.

## Signature shapes

- Slash crescent facing the camera, thick leading edge, painted bands, eroding from the tail (`shapes.md` > Slash).
- Star flash with 4 - 6 uneven blades, a dark rim.
- Chunky shards thrown along the swing, rotating, with a bright edge.
- Ground cracks or slash decals for heavy hits.
- Painted puffs (2 - 3 bands, soft edge) for dust and smoke.

## Failure modes in this style

- Glowy, bloomy energy with soft gradients instead of painted bands: reads as generic sci-fi.
- Monotone gold or white-orange: no saturated mid band, no dark rim, no accent.
- Hairline elements that vanish at the gameplay camera.
- A 3D ribbon seen edge-on, or a slash plus a separate "cut line" competing as two shapes.
- Noise patches inside shapes that read as dirt or burnt paper.
- Everything gone at +0.3 s: no mark, no lingering shape, no weight.
