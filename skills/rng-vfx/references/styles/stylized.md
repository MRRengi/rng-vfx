# Stylized (MOBA, hero shooters, hand-painted)

League of Legends, Wild Rift, Overwatch, Dota 2, Heroes of the Storm, Fortnite, Smite. Every ability must read instantly from a high or third-person camera among many others, so shapes are big, bold and clean, energy is luminous and saturated, and detail inside shapes looks painted.

**References to recall:** League of Legends (Garen's Judgment and Decisive Strike, Yasuo's Steel Tempest, Riven's abilities, Jinx's rockets), Overwatch (Reinhardt's hammer swing and Earthshatter, Genji's Dragonblade, Junkrat's explosions), Dota 2 (Juggernaut's Omnislash). Describe the matching one at contact, +2, +6 frames and the end before building.

## Look

- Energy glows: a hot near-white core line, a saturated body falling off softly toward the edge, bloom on the core. It lights the target from the hit side and colours the ground under it.
- Bold: shapes are big and simple enough to read among many other abilities; the hit flash makes the target flare. Weight comes from size and contrast, not duration.
- Layered: a slash is two or three overlapping translucent arcs of different widths and lifetimes (a bright thin leading edge, a wider softer body, a faint wispy trail), with streaky painted texture running along the arc. Wisps peel off the trailing edge.
- No outlines; the separation from the background comes from the hot core against the saturated body.
- Colour: one saturated hero colour plus one accent, chosen from the character or ability's identity. Example heavy gold blade: core `#fffbe6`, body `#ffc23a`, falloff `#d06a12`, accent `#5fd3ff`. Example cyan ability: core `#effdff`, body `#36d6ff`, falloff `#1478c8`, accent `#ffd34a`.
- Bloom moderate, on the core and the flash; the body stays saturated and the champion stays readable.
- Fire and smoke are painted: soft heat bands, the hottest band one connected shape; smoke in warm browns or purples with soft painted edges, lit.

## Timing defaults (60 fps, typical)

| Layer | Start | Peak | End |
|---|---|---|---|
| Wind-up / anticipation | -10 to -4 | | 0 |
| Slash head sweep | -3 | 0 (reaches target) | |
| Slash body, fading and thinning from the tail | 0 | 0 - 2 | 10 - 16 |
| Contact flash (glow + glints) | 0 | 1 | 4 - 6 |
| Target flare, then light from the hit | 0 | 1 - 2 | 6 - 10 |
| Sparks / shards | 0 | | 15 - 30 |
| Ground ring / crack | 1 | 6 - 10 | 20 - 30 |
| Slash mark / afterimage | 0 | | 20 - 30 |
| Hit stop (heavy) | 0 | | 3 - 5 frames freeze |

Heavy hits are bigger, not longer: the peak shape is 1.5 - 2x a light hit's size at the same speed.

## Signature shapes

- Slash arc in the swing plane, turned toward the camera, layered translucent bands, hot leading edge, wispy trailing edge, fading and thinning from the tail (`../elements.md` > Slash).
- Contact flash: a big radial glow with long glints along the cut and a cross glint, the target flaring inside it.
- Glowing sparks and small shards thrown along the swing, with short trails.
- A glowing ring or dust skirt on the ground, and a slash mark that cools.

## Failure modes in this style

- Flat, unlit, outlined shapes: reads as a toon sticker.
- Washed-out white glow that hides the shape for more than a couple of frames.
- Monotone white-orange: no saturated body, no accent.
- A 3D ribbon seen edge-on, or a slash plus a separate "cut line" competing as two shapes.
- Everything gone at +0.3 s: no mark, no lingering light.
