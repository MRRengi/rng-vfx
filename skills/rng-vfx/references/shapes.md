# Building the shapes

How to construct each common element so it reads. Sizes are in metres for a 1.8 m character and frames at 60 fps; adjust to the project.

Contents:
- Foundations: designed shapes, value bands, blending
- Contact flash (star)
- Slash
- Projectile
- Rings and shockwaves
- Sparks
- Debris
- Explosions
- Smoke and dust
- Fire
- Cel puffs and stylized smoke
- Impact frames
- Hit reaction and hit stop
- Decals and marks
- Light

## Foundations

**Shapes come from math, not noise.** Build silhouettes from signed distance functions in the fragment shader: circles, capsules, crescents (difference of two circles), star polygons (straight edges from tip to valley), segments. A designed silhouette with a crisp edge reads at any distance; then use noise only to break that edge (offset the distance by low-amplitude fbm) and to drive erosion over life. Noise sampled as colour or alpha on its own looks like grain or dirt.

**Value bands.** Map a single 0..1 "heat" or "density" value through the plan's bands: smoothstep between bands for realistic and painted looks, a hard step for anime, toon and pixel. Keep the brightest band to the core (10 - 20% of the shape's area), the mid band carrying the colour, and a dark rim or outline on anything that has to read against bright backgrounds.

**Erosion over life (a life map).** Give the shape a grayscale map that says when each pixel dies (big smooth blobs, not fine noise), and discard where `map < age01`. The shape then breaks into large pieces from the edges inward instead of fading or shrinking uniformly. Add a thin bright or dark band at the erosion edge for burning or dissolving looks.

**Blending.**
- Additive: light (flashes, energy, sparks). Brightens only; disappears on bright backgrounds, so give important additive shapes a dark alpha-blended under-shape.
- Alpha: matter (smoke, dust, debris, blood, cel shapes).
- Premultiplied: fire and anything that glows and occludes at once; the alpha says how much it blocks, the colour how much it emits.

## Contact flash (star)

The contact flash says where and how hard. It is small, hot and short.

- Star polygon with 4 - 6 uneven blades; the longest one or two along the hit direction at 1.5 - 2x the others. Straight or slightly concave edges, sharp tips.
- Size: 0.3 - 0.5 m across for a light hit, 0.6 - 1.0 m for a heavy one.
- Value: white core about 20% of the radius, saturated colour band, thin dark outline in stylized styles.
- Timing: full size on the contact frame or the next, holds 1 - 2 frames, shrinks or breaks over 2 - 4 frames. Redraw it each 2 frames with new blade lengths rather than rotating one shape.
- Never cover the target: the flash sits on the impact point, in front of the surface, and is smaller than the character's torso.

## Slash

The slash is one shape: a crescent that passes through the target.

- **Geometry:** an arc strip (or a crescent SDF on a quad) whose midpoint lies on the impact point. Radius about arm plus weapon (1.2 - 1.8 m for a sword); visible span 90 - 140 degrees. The visible band, start to end, sits 20 - 50 degrees from horizontal from the gameplay camera unless the attack is an overhead or a sweep.
- **Facing:** orient the arc plane toward the camera (tilt it until its normal is within about 40 degrees of the view direction). An arc seen edge-on reads as a line or a pole.
- **Width profile:** widest just behind the leading edge (0.15 - 0.25 of the radius), tapering to a point at the tail; the outer edge sharp, the inner edge softer. The cut line is the bright outer edge of this same shape, not a separate element.
- **Timing:** the head sweeps through the arc in 2 - 4 frames, reaching the target on the contact frame; the full shape holds 1 - 2 frames; then it erodes from the tail toward the head over 6 - 12 frames. It does not move or change shape after contact.
- **Values:** bright edge, coloured body, darker or transparent inner edge. In stylized styles a hand-painted band structure (2 - 3 hard bands) with a dark rim.
- **Afterwards:** a short slash mark on the target or the ground (a decal or an afterimage) for 0.3 - 0.5 s keeps the weight after the trail is gone.
- From a real animation, sample the weapon tip and base each frame and build the strip from those points instead of an ideal arc.

## Projectile

- A hard-edged core (bright, small) inside a larger coloured shape stretched along the direction of travel (1.5 - 3x longer than wide), plus a trail that tapers and dissipates behind it.
- It stops at the contact point: the projectile ends where the impact begins, on the same frame. Nothing passes through the target unless the design says it pierces.
- Anticipation: a short charge or muzzle flash at the source tells the player where it came from.

## Rings and shockwaves

- Born thick (0.1 - 0.15 of the final radius), thinning as they expand, radius on an outExpo or outQuart curve over 6 - 12 frames, alpha gone by the end.
- Broken, not closed: 50 - 70% of the circle, the gap facing away from the camera or offset along the hit. A closed thin ring around the hit point reads as a targeting reticle.
- On the ground: a fast radial dust skirt (alpha-blended puffs moving outward with high drag) reads better than a flat additive hoop.
- A heat or pressure distortion ring (screen-space UV offset) sells force without adding brightness.

## Sparks

- Streaks stretched along their screen velocity: length about 1.5 frames of motion, at least 12 px and 3x their width.
- Quadratic drag (`physics.md` > Sparks): fast out, then they coast and fall. Linear drag makes them stop dead in mid-air or fly off screen.
- Speeds spread x3 and lengths 0.3 - 1.6x the mean; about a quarter are heroes (longer, brighter, with a ribbon trail). Equal sparks in an even fan read as a flower.
- Emit over 2 - 4 frames, not all on one frame: dozens born on one pixel sum into a ball of bloom.
- Colour: white-hot for the first 20 - 30% of life, then down a blackbody or style ramp to dark.
- Direction: biased along the reflection of the hit direction off the surface, not a uniform sphere.

## Debris

- Angular pieces (low-poly irregular meshes or sharp polygon sprites), few big and many small, with random spin.
- Ballistic arcs with low drag; a few hero chunks fly highest and last longest; big pieces bounce once with high friction and rest; small ones can vanish on landing.
- Darker than the ground, so they read against it; chunks of soil leave short dust trails.

## Explosions

Decide the type first; it changes everything:
- **Fragmentation grenade, artillery, mine:** mostly dirt and dust. A flash of 1 - 2 frames, a small fireball that is gone within about 0.1 - 0.2 s, a dark ejecta column of soil thrown up in a cone, a fast low dust skirt, grey-brown smoke, debris and a dark scorch.
- **Fuel, vehicle, barrel:** a large rolling fireball that rises, cools from yellow to orange to dark red into black smoke, often with a stem.
- **Magic or stylized:** the genre's shapes and palette, the same structure of core, body, residue.

Layers and timing for a realistic ground explosion:
- **Flash:** a hot, small card at the burst point and a point light, 1 - 2 frames. The light, not bloom, brightens the ground and the nearby character from that side.
- **Fireball (if any):** premultiplied, coloured by temperature (white-yellow core, orange, dark red edge) cooling over its life; grows on outExpo to full size in 3 - 6 frames; rises; rolls.
- **Ejecta column (ground bursts):** dark soil and dust thrown upward in a cone 30 - 60 degrees wide, decelerating with high drag, then falling and drifting.
- **Ground dust skirt:** puffs moving radially along the ground fast (8 - 14 m/s) with high drag, 0.6 - 1.2 s life, reaching 3 - 5 m.
- **Shockwave:** a distortion ring and the dust skirt; nothing bright.
- **Debris and sparks** as above, launched on the contact frame.
- **Smoke:** takes over as the fire cools; anchored at the ground (see Smoke), rising and spreading for seconds.
- **Decal:** a dark irregular scorch with radial ejecta streaks, revealed in the first frames and staying.
- **Interaction:** nearby characters get the flash light and a gust of dust that wraps them; the camera shakes briefly.

## Smoke and dust

- **Spawn over time from the source**, not as one lump: new puffs keep appearing near the ground for the first part of the effect, so the column stays attached while its top rises and spreads.
- **Lit:** a normal from the density gradient (two offset texture taps, or a sphere normal per puff), lit by the scene's key light with wrap lighting, plus the fire's own light from below while it burns. Unlit smoke reads as a flat sprite.
- **Value:** fresh combustion smoke is dark (darkest at the base and core), lightening and warming as it thins; dust is lighter and browner and spreads and settles more than it rises.
- **Growth:** size eases out, density drops with age, buoyancy slows as it rises.
- **Dissipation:** erode from the edges inward with large-feature noise, unevenly across puffs; never a uniform fade of one blob.
- **Shape:** the overall silhouette of the cloud matters more than individual puffs; check it in a single frame.

## Fire

- Hottest at the base and core, cooling toward the tips; tongues break off at the top and vanish.
- Noise scrolling upward drives the shape, with erosion stronger at the top; flicker frequency falls with size (about `1.5 / sqrt(diameter in m)` Hz).
- Fire turns into smoke above it; that transition sells realism.
- It lights its surroundings with a flickering light.

## Cel puffs and stylized smoke

- 2 - 3 hard value bands and an outline (for toon and anime), lit from one consistent side.
- Clusters of lobes with different sizes, never a single circle.
- **Holes:** driven by a large-feature life map; the smallest hole is about 20% of the puff's radius; holes start at the silhouette edge and work inward while the puff shrinks a little; no outline drawn around small inner holes. Fine noise holes turn puffs into outlined donuts and worms.
- Held drawings: in anime and pixel, change the shape on the drawing rate (every 2 - 3 frames), not continuously.

## Impact frames

The anime and fighting-game impact frame is a designed, rare accent.

- 1 - 2 frames, on the heaviest hits only.
- Two tones (black on white or the inverse) of the hit's own silhouette and the attacker and target, plus radial speed lines. The shape must still read: it is the effect's silhouette at its strongest, not a random blob.
- Often limited to a region around the hit or tinted rather than full-screen; full-screen flashing frames are a photosensitivity risk, so never more than 2 in a row and never repeated rapidly.

## Hit reaction and hit stop

- **Flash:** tint the target toward the effect colour for 1 - 2 frames by lerping its albedo (an emissive add can only brighten and washes dark targets to pink or white). Keep it below the effect's own brightness: the target must stay readable.
- **Rim:** a thin rim light in the effect colour for a few frames.
- **Motion:** squash on contact, knockback along the hit direction, a small jolt.
- **Hit stop:** freeze the attacker, target and contact effects for 2 - 6 frames on heavy hits (scale with weight). Effects that started before contact freeze too; the burst continues after.

## Decals and marks

- Scorch: multiply-darkening, irregular outline, radial streaks; the ground texture stays visible under it. An alpha-black disc reads as a hole.
- Slash marks, cracks, splats: revealed in the first frames, holding for seconds, fading slowly; splats have satellite drops.

## Light

- A point light at the effect for the flash frames, falling to 10% within a few frames; for fire and explosions, following the fireball and gone with it.
- Place it in front of the surface on the hit side, never inside the target.
- Light the target and the ground, not the whole scene: radius 2 - 5x the primary shape.
