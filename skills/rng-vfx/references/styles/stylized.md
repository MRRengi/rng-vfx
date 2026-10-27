# Stylized (MOBA, hero shooters, hand-painted)

League of Legends, Wild Rift, Overwatch, Dota 2, Heroes of the Storm, Fortnite, Smite. Readability for gameplay comes first: every ability must read instantly from a high or third-person camera among many others. The look is luminous, saturated energy on clean, bold shapes, with painted detail inside them.

**References to recall:** League of Legends (Garen's Judgment and Decisive Strike, Yasuo's Steel Tempest, Riven's abilities, Jinx's rockets), Overwatch (Reinhardt's hammer swing and Earthshatter, Genji's Dragonblade, Junkrat's explosions), Dota 2 (Juggernaut's Omnislash). Describe the matching one at contact, +2, +6 frames and the end before building.

## Look

- Energy glows. A slash or a spell is a luminous body: a hot near-white core line, a saturated body that falls off softly toward the edge, and a little bloom on the core. It casts light: the target is lit by it from the hit side for a few frames, the ground under it picks up its colour.
- Layered, not single: a slash is two or three overlapping translucent arcs of different widths and lifetimes (a bright thin leading edge, a wider softer body, a faint wispy trail), with streaky painted texture running along the arc, not across it. Wisps peel off the trailing edge.
- Shapes are bold, big and simple enough to read from far: a heavy slash arc is taller than the champion (radius 1.2 - 1.6x the character's height) and the target sits inside it. Crescents, clean rings with gaps, cones, chunky shards. No outlines; the separation from the background comes from the hot core against the saturated body.
- Colour: one saturated hero colour plus one secondary accent, from the character or ability (a warrior's gold blade is gold; do not swap it for an unusual hue just to be different). Example heavy gold blade: core `#fffbe6`, body `#ffc23a`, falloff `#d06a12`, accent `#5fd3ff`. Example cyan ability: core `#effdff`, body `#36d6ff`, falloff `#1478c8`, accent `#ffd34a`.
- Bloom moderate, on the core and the contact flash; the body stays saturated instead of turning white, and the champion stays readable.
- Fire and smoke are painted: soft heat bands, the hottest band one connected shape; smoke in warm browns or purples with soft painted edges, lit.

## Timing defaults (60 fps)

| Layer | Start | Peak | End |
|---|---|---|---|
| Wind-up / anticipation | -10 to -4 | | 0 |
| Slash head sweep | -3 | 0 (reaches target) | |
| Slash body, fading and thinning from the tail | 0 | 0 - 2 | 10 - 16 |
| Contact flash (glow + glints) | 0 | 1 | 4 - 6 |
| Target flare (near white), then light from the hit | 0 | 1 - 2 | 6 - 10 |
| Sparks / shards | 0 | | 15 - 30 |
| Ground ring / crack | 1 | 6 - 10 | 20 - 30 |
| Slash mark / afterimage | 0 | | 20 - 30 |
| Hit stop (heavy) | 0 | | 3 - 5 frames freeze |

Heavy hits are bigger, not longer: the peak shape is 1.5 - 2x a light hit's size at the same speed.

## Signature shapes

- Slash arc facing the camera, layered translucent bands, hot leading edge, wispy trailing edge, fading and thinning from the tail (`shapes.md` > Slash).
- Contact flash: a big radial glow with two or three long glints stretched along the cut and a cross glint, the target flaring white inside it; a ground ring at the feet. Never a cartoon star polygon.
- Glowing sparks and small shards thrown along the swing, with short trails.
- A glowing ring or a dust skirt on the ground, and a slash mark that cools.

## Failure modes in this style

- Flat, unlit, outlined shapes: reads as a toon sticker, not a MOBA ability.
- A small, subdued slash beside the target: no weight.
- Washed-out white glow that hides the shape for more than a couple of frames.
- Monotone white-orange: no saturated body, no accent.
- Hairline elements that vanish at the gameplay camera.
- A 3D ribbon seen edge-on, or a slash plus a separate "cut line" competing as two shapes.
- Everything gone at +0.3 s: no mark, no lingering light, no weight.
