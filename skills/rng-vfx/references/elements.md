# Building the elements

How to construct common elements so they read and behave right. Sizes are typical values in metres for a 1.8 m character and frames at 60 fps, taken from shipped games; scale them to the event and to your reference, and go bigger when the reference does. The look of each element (palette, softness, how much it glows) comes from the style file.

Contents:
- Foundations: designed shapes, colour ramp, reading at distance, blending
- Contact flash
- Slash
- Projectile
- Rings and shockwaves
- Sparks
- Debris
- Explosions
- Smoke and dust
- Fire
- Splashes and liquids
- Lightning and arcs
- Cel puffs (toon only)
- Impact frames
- Hit reaction and hit stop
- Decals and marks
- Light

## Foundations

**Shapes come from math, not noise.** Build silhouettes from signed distance functions in the fragment shader: circles, capsules, crescents (difference of two circles), segments, and for toon star polygons. A designed silhouette with a crisp edge reads at any distance; then use noise only to break that edge (offset the distance by low-amplitude fbm) and to drive erosion over life. Noise sampled as colour or alpha on its own looks like grain or dirt.

**Colour ramp.** Map a single 0..1 "heat" or "density" value through the plan's ramp: smooth falloff for energy, realism and painted looks, a hard step only for toon and pixel. Keep the hottest value to the core (10 - 20% of the shape's area) and let the saturated body carry the colour. For energy, add a soft glow halo outside the body (a wider, fainter copy of the shape, or bloom on the core) and cast its light onto the target and the ground (a point light or a light card). On bright backgrounds an additive shape needs a faint darker alpha under-shape; outlines are for toon only.

**Reading at distance.** At the gameplay camera, lines, rings and streaks narrower than about 3 px (at 1080p) and sparks shorter than about 12 px vanish; clamp widths in pixels in the shader (world units per pixel at the particle's depth times the pixel minimum) so they survive distance without growing in the close-up. Typical primary-shape heights: a light hit about the size of the target's torso, a heavy hit or spell about the character's height or more, an explosion or ultimate several times that.

**Erosion over life (a life map).** Give the shape a grayscale map that says when each pixel dies (big smooth blobs, not fine noise), and discard where `map < age01`. The shape then breaks into large pieces from the edges inward instead of fading or shrinking uniformly. Add a thin bright or dark band at the erosion edge for burning or dissolving looks.

**Blending.**
- Additive: light (flashes, energy, sparks). Brightens only; disappears on bright backgrounds, so give important additive shapes a dark alpha-blended under-shape.
- Alpha: matter (smoke, dust, debris, blood, toon shapes).
- Premultiplied: fire and anything that glows and occludes at once; the alpha says how much it blocks, the colour how much it emits.

## Contact flash

The contact flash says where and how hard. It is small, hot and short.

- Energy styles (stylized, anime, realism muzzle and impacts): a radial glow card with a white-hot centre, plus two or three long glints (thin tapered light streaks) stretched along the cut or the hit direction, and a shorter cross glint. The glints are 2 - 4x longer than the glow is wide. A point light at the impact lights the target and the ground for the same frames.
- Toon only: a straight-edged star polygon with 4 - 6 uneven blades and an outline.
- Size: 0.3 - 0.5 m across for a light hit, 0.6 - 1.0 m for a heavy one (glints can run longer).
- Timing: full size on the contact frame or the next, holds 1 - 2 frames, then shrinks and fades over 2 - 4 frames.
- Never cover the target: the flash sits on the impact point, in front of the surface, and is smaller than the character's torso; the target is lit by it, not hidden by it.

## Slash

The slash is one shape: a crescent that passes through the target.

- **Geometry:** an arc strip (or a crescent SDF on a quad) whose midpoint lies on the impact point. Radius at least arm plus weapon (1.2 - 1.8 m for a sword); stylized heavy hits exaggerate it well past that so the target sits inside the arc. Visible span 90 - 140 degrees. The visible band, start to end, sits 20 - 50 degrees from horizontal from the gameplay camera unless the attack is an overhead or a sweep.
- **Facing:** orient the arc plane toward the camera (tilt it until its normal is within about 40 degrees of the view direction). An arc seen edge-on reads as a line or a pole.
- **Width profile:** widest just behind the leading edge (0.15 - 0.25 of the radius), tapering to a point at the tail; the outer edge sharp, the inner edge softer. The cut line is the bright outer edge of this same shape, not a separate element.
- **Timing:** the head sweeps through the arc in 2 - 4 frames, reaching the target on the contact frame; the full shape holds 1 - 2 frames; then it fades and thins from the tail toward the head over 6 - 12 frames, wisps peeling off the trailing edge. It does not move or change shape after contact.
- **Layers and values:** a hot, thin leading edge (near white, blooms); a wider saturated body that falls off softly toward the inner edge; a faint wispy trail behind with streaky texture running along the arc. Build them as two or three overlapping strips with different widths and lifetimes so the slash has depth. Light the target from the cut side for a few frames.
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
- Ballistic arcs with low drag; a few hero chunks fly highest and last longest; big pieces hang longer and rotate slower, small ones are quick; big pieces bounce once with high friction and rest; small ones can vanish on landing. A few pieces always end up much farther away than the rest.
- The material decides how things break and land: glass splits into thin light shards that flutter and skitter; ceramic leaves a ring of pieces with one big piece sliding off and rocking; brick crumbles partly to powder and barely skids; soil clods burst into dust.
- Darker than the ground, so they read against it; chunks of soil leave short dust trails.

## Explosions

Decide the type first; it changes everything:
- **Fragmentation grenade, artillery, mine:** mostly dirt and dust. A flash of 1 - 2 frames, a small fireball that is gone within about 0.1 - 0.2 s, a dark ejecta column of soil thrown up in a cone, a fast low dust skirt, grey-brown smoke, debris and a dark scorch.
- **Fuel, vehicle, barrel:** the fireball is the star. A large, bright, luminous orange-yellow ball of flame that billows out in 3 - 6 frames, rolls and rises for half a second or more, lights everything around it, then cools through orange and dark red into black smoke rising in a column, often with a stem. Its body glows; keep it just under the bloom threshold so it stays orange rather than white, never dark or brown. The smoke is black to dark grey (soot), not brown dust, and it rises above the fire rather than burying the frame.
- **Magic or stylized:** the genre's shapes and palette, the same structure of core, body, residue.

Timing that sells any explosion (`craft.md` > Exaggeration): the first frame is already a big burst of pure directional energy; it expands faster than physics for 3 - 6 frames, then drops abruptly into a long, slow expansion and fade (seconds for big blasts) while debris reaches the top of its arc and falls. A frame of anticipation (the source shrinking or darkening just before) adds punch; stylized and anime styles can also add one or two punch frames (a negative or a high-contrast frame) on the detonation, realism keeps those to a flash and light. A second, smaller blast firing while the first slows adds overlap. The smoke starts with the same radial shapes and turns into billowing, mushrooming shapes as the energy dies.

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

- **Motion of rising smoke:** fast at first, pushed by the heat; slowing as it meets cooler air, where it meanders and twists; spreading and rolling back over itself near the top. A hot column hitting a ceiling of cool air mushrooms. Big plumes churn violently inside but move slowly overall.
- **Roll direction follows the force:** smoke pushed down and out (a rocket on the ground, a landing) rolls outward from underneath; smoke pushed up and out (a campfire, a blast column) rolls up and over at the edges.
- **Spawn over time from the source**, not as one lump: new puffs keep appearing near the ground for the first part of the effect, so the column stays attached while its top rises and spreads.
- **Lit:** a normal from the density gradient (two offset texture taps, or a sphere normal per puff), lit by the scene's key light with wrap lighting, plus the fire's own light from below while it burns. Unlit smoke reads as a flat sprite.
- **Value:** fresh combustion smoke is dark (darkest at the base and core), lightening as it thins; dust is lighter and browner and spreads and settles more than it rises, falling back as soon as the force that raised it is gone; steam is white and vanishes quickly instead of thinning slowly.
- **Growth:** size eases out, density drops with age, buoyancy slows as it rises.
- **Dissipation:** erode from the edges inward with large-feature noise, unevenly across puffs; never a uniform fade of one blob.
- **Shape:** the overall silhouette of the cloud matters more than individual puffs; check it in a single frame.

## Fire

- Fire is bubbles of hot, glowing gas rising through cooler air; the cool air presses on it, pinches it and curls it. The overall form is one or more tapering triangles feeding each other, waving like flags blown from below, with opposing curls on the two sides.
- Hottest at the base and core, cooling toward the tips. The base clings to and wraps the burning object and moves slower and more fluidly than the top.
- Tongues pinch and twist off near the top and live only 2 - 4 frames (larger ones a little longer), flipping their curl from one frame to the next as they go, which reads as flicker; they do not shrink neatly to a point.
- Real fire is more erratic than it is usually animated: pieces appear and vanish unpredictably and the volume pulses irregularly. Keep the underlying wave motion smooth and let the shapes riding on it be wild. Predictable, evenly repeating fire is the common failure.
- Keep a fire's size constant by opening elongated holes in its middle that split off pieces, rather than letting it slowly grow.
- Noise scrolling upward drives the shape, with erosion stronger at the top; flicker frequency falls with size (about `1.5 / sqrt(diameter in m)` Hz). Bigger fires move slower and carry more detail; a candle flame only stretches and bobs, with no break-offs.
- Embers and cinders ride the fire's arcs with varied size and spacing, and a few shoot off erratically sideways or spiralling.
- Fire turns into smoke above it; that transition sells realism. Clean fuel burns bluer with little smoke; dirty fuel makes soot.
- It lights its surroundings with a flickering light, and heat haze distorts the air above it.

## Splashes and liquids

- **Anatomy of a splash:** the impact throws liquid up and out explosively, already well formed on the first frame; an air pocket is dragged under and breaks into bubbles; the rising sheet thins, tears holes that open along its direction of travel (never at odd angles), and breaks into strings of droplets; it slows into the top of its arc, hangs, and falls back accelerating; a secondary jet then shoots up from the impact point as the air pocket closes, on its own overlapping timing, and collapses into ripples. Ripples spread and slow.
- **Primary shapes:** a bowl, a sheet or pure spray. Fast, jagged or glancing hits (bullets, a blade) make spray; heavy objects make a big sheet and a solid surge instead of a jet; a buried air pocket rises later as a dome that rolls outward with bubbles surfacing long after.
- Only a few of the falling droplets need their own small landing splash; one or two after-splashes tell the story.
- **Viscosity sets shape and speed:** thicker liquids (oil, paint, ink, blood, mud, lava) stay together in round blobs, stretch into strings and move slower; thinner ones (alcohol, gasoline) break into fine sheets and droplets faster and spread wider. Gooey splats land with a flattening squash and satellite drops.
- Ripples and splats on the ground keep the ground's perspective as they grow: they widen more than they deepen.
- Big splashes are slow and hang in the air; a large splash can be built from copies of one good splash layered with staggered start times.

## Lightning and arcs

- A main channel that branches like a river delta or tree roots, the branches thinner and shorter, all asymmetric; push it more dramatic than a photo.
- The strike lands in 1 - 2 frames with a bright flash of light on the ground and the target, flickers through two or three re-strikes along nearly the same path, then leaves glowing afterimages and crawling sparks. Redraw the jagged path each re-strike rather than sliding one shape.

## Cel puffs (toon only)

- 2 - 3 hard value bands and an outline, lit from one consistent side.
- Clusters of lobes with different sizes, never a single circle.
- **Holes:** driven by a large-feature life map; the smallest hole is about 20% of the puff's radius; holes start at the silhouette edge and work inward while the puff shrinks a little; no outline drawn around small inner holes. Fine noise holes turn puffs into outlined donuts and worms.

## Impact frames

The anime and fighting-game impact frame sells the heaviest hits (not used in realism). Make it bold:

- Full screen, typically 2 - 4 frames on the contact, then straight into the burst.
- Alternate the tones across those frames: dark silhouette on white, then white silhouette on the effect's deep colour (for cyan, a navy `#0a2a5e`), optionally an inverted or tinted frame between. Each frame redrawn, not one image held.
- Content: the target's and the burst's silhouette at its strongest, plus thick radial speed lines converging on the hit. The shape must read; it is not a random blob.
- Once per hit, never repeated in a rapid loop (photosensitivity).

## Hit reaction and hit stop

- **Flash:** on contact the target flares toward white or the effect's hot colour for 1 - 3 frames, then tints toward the effect colour and returns over a few more. Lerp its albedo toward the flash colour and add emissive for the flare. In dark fantasy and realism keep it subtle (a tint, a rim, light from the hit).
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
