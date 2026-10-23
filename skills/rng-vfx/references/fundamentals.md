# Fundamentals

These apply to every style. Style files change the numbers and the shapes, never the principles.

## Hierarchy

Everything on screen competes for attention. Rank the effect before designing it.

| Tier | Examples | Brightness ceiling | Screen area | Duration | Shake |
|---|---|---|---|---|---|
| 0 Ambient | torches, dust motes, idle auras | low, no pure white | small | looping | none |
| 1 Basic | basic attacks, footsteps, small hits | mid | under ~5% of screen | 0.2 - 0.5 s | none or tiny |
| 2 Ability | skills, projectiles, buffs | high | 5 - 15% | 0.4 - 1.2 s | small |
| 3 Signature | ultimates, boss attacks, big explosions | pure white allowed | 15 - 40% | 1 - 3 s | strong |
| 4 Cinematic | finishers, cutscene moments | anything | full screen | as needed | as needed |

Reserve clipping white (far above B, blooming) and full saturation for the cores of tier 2 - 3 effects. Flat white as a palette colour in toon, anime and pixel is different and allowed (`numbers.md`). If everything glows, nothing reads.

Separate **gameplay-critical** elements (area of effect, hitbox, direction, timing tells) from **flavor** (sparks, motes, smoke). Critical elements get the clearest shapes and must stay readable when flavor is turned down for performance.

Telegraphs (where an attack will land) must show the true area. A circle that is larger or smaller than the real hitbox is a bug, not a style choice.

## Value

Value (lightness) carries readability; hue carries identity.

- Design in grayscale first: desaturate the frame. The shape of the peak frame must be obvious.
- Keep a value structure: core brightest, mid tones around it, darkest elements (smoke, debris, outlines) at the edges. Three to four value steps is enough.
- Contrast against the background, not in absolute terms. A white flash on a snow level needs a dark outline or a dark under-layer to read. A black smoke on a dark dungeon needs a rim light or an emissive edge.
- Dark elements are powerful: a dark core, dark smoke or a dark outline makes the bright parts brighter without raising brightness.

## Color

- Pick one dominant hue family per effect, one accent, and neutrals. Three hue families is a crowd.
- Hue shift across value: bright parts drift toward white or yellow, shadows drift toward the complementary or cooler side. A ramp that only changes lightness looks flat.
- Saturation peaks in the mid tones. Highlights desaturate toward white, shadows desaturate toward gray or a dark tint.
- Color means something in games (team colors, damage types, healing green, poison green-purple, fire orange, ice cyan). Respect the game's existing color language before inventing.
- Brightness is relative to the project's bloom threshold B (`numbers.md`). Push only the core above B; keep mid tones under it so bloom does not swallow the shape.

## Shape language

| Shape | Reads as | Use for |
|---|---|---|
| Sharp, angular, asymmetric spikes | aggressive, fast, painful | damage, crits, anime impacts, lightning |
| Circles, blobs, bubbles | friendly, soft, magical-benign | heals, toon, pickups, buffs |
| Squares, grids | technological, digital, rigid | sci-fi, UI-like effects, pixel styles |
| Noisy, fractal, organic | natural, chaotic | fire, smoke, dust, magic corruption |
| Long thin streaks | speed, direction | sparks, speed lines, projectiles |
| Crescents and arcs | motion of a swing | slashes, trails |

Rules:
- Vary size. A burst of identical particles reads as a pattern, not an explosion. Use big / medium / small with clear ratios (roughly 1 : 0.5 : 0.15).
- Give the silhouette a direction. Radial symmetry is static; bias the burst toward the hit direction or upward.
- Avoid tangents and mush: shapes that barely touch, or overlap into an even blob, destroy readability. Clusters with gaps read better than even spreads.
- Negative space is part of the shape. Holes in smoke and gaps between flame tongues make them read as volume.
- **No straight cuts.** Every procedural shape fades or narrows to zero before the edge of its quad or strip (mesh, ribbon, billboard): stars fit their longest spike, lobed puffs get a margin, bodies get a round window, broken rings narrow to a point at each gap, streak, trail and slash heads close to a rounded tip. A straight line on a frame that is not a designed hard edge is the quad showing through, and it is the fastest giveaway of cheap VFX.
- **Slashes follow the swing.** From the weapon's path when there is an animation, from swing direction and plane normal when there is not; never from rotation angles picked by eye (`recipes/slash.md`).
- **Dissolve stays out of the body.** Erosion holes belong to the tail of a slash or the end of a body's life. Holes in the body read as dirt on additive shapes and as outlined pockmarks on alpha shapes.

## Timing

The universal envelope: **anticipation -> contact -> follow-through -> dissipation**. Per-style lengths are in `numbers.md`.

| Phase | Purpose |
|---|---|
| Anticipation | tells the player something is coming: gather, charge, inward motion |
| Contact / peak | the readable frame: biggest shape, highest contrast |
| Follow-through | energy leaves: bursts, shockwaves, sparks travel |
| Dissipation | residue: smoke, embers, decals, afterglow |

- Peak within the first 2 to 4 frames after contact. A slow rise kills the hit.
- Ease out on almost everything that expands (outExpo, outQuart). Ease in on things that fall or collapse. Overshoot (outBack, elastic) only in toon and playful styles.
- Stagger secondary layers by 1 to 3 frames after the primary. Everything starting on the same frame looks mechanical.
- **Hitstop sits on contact,** never on the first frame of an effect that has nothing before it (freezing the first frame freezes nothing). What it freezes and for how long: `numbers.md` > Per style and the hitstop rule under that table.
- **No empty tail.** The last element stays visible until at least 90% of the effect's duration. Trim the duration to the content.
- **Fade in one place.** One curve owns each layer's fade-out. A colour ramp that fades alpha, multiplied by a separate opacity-over-life curve, makes smoke transparent by mid-life. Keep the body's opacity nearly constant and fade over the last quarter of life; erode lightly.

### Drawings per second (frame holds)

Hand-drawn effects animate on twos or threes (a new drawing every 2 or 3 frames at 24 fps, so 12 or 8 drawings per second). Holding drawings gives snap and weight. In real time, quantize the effect's time: `t_held = floor(t * fps) / fps`. Never hold the camera or gameplay, only the effect.

**Put every key on the drawing grid** (multiples of 1/fps). A key that falls between drawings is simply lost: the contact drawing never appears, or appears already decaying. Check that the contact drawing exists and is not hidden under an impact frame (put the colour peak on the drawing after the impact frame). Only the spark's first drawing may be above B; the next ones shrink, break or darken.

## Quality floors

Hard minimums. An effect that misses one of these looks cheap regardless of how good the timing is. Numbers live in `numbers.md`; these are the tests.

Shape:
- **Screen size.** The primary shape, sparks and lines meet the pixel minimums at the gameplay camera (`numbers.md` > Sizes, enforced by `recipes/screen-size.md`).
- **Size tiers and counts.** Big, mid and small tiers per layer; hero, mid and accent counts per effect (`numbers.md` > Counts). One random size range reads as a pattern.
- **Cotton-ball test.** If the peak frame reads as a pile of separate circles, the shapes are wrong. Merge silhouettes (one outline around a cluster), add lobes, tongues and negative space, and use authored shapes (`recipes/flipbooks.md`).
- **Reticle test.** If the peak frame reads as a target or crosshair (concentric star, ring and disc), offset and tilt the parts and give them a direction.
- **Rings are small, broken and short.** Size and lifetime from `numbers.md`; coverage 40 - 70% of the circle, stretched 1.4 - 1.8x along the hit. A closed even ring larger than the character reads as a selection circle.
- **No straight cuts.** No straight edge on any frame where a shape ends on its quad or strip border (see Shape language).
- **Slashes cross the target.** Built from the swing (`recipes/slash.md`); the projected arc midpoint lies inside the target's silhouette.
- **Redraw designed shapes.** A spark, star or splash visible for more than 2 drawings (or 4 frames) changes every drawing: new point lengths, rotation, or silhouette (`recipes/spark-star.md` > Life).
- **Bystanders** near an effect who were not hit get light only, never a flash, rim or reaction.
- **No static holds.** Nothing is held unchanged for more than 4 frames at 60 fps, including frames frozen by hitstop, or for more than 2 drawings in held-drawing styles. Held shapes drift in scale 5 - 10%, erode, or get redrawn.
- **Explosions are grounded and hand over to smoke.** Construction rules and checks in `recipes/explosion.md`.
- **Explosion silhouette.** Ground explosions are taller than wide (about 1.3 - 1.4) and sit on a stem that touches the ground. Air bursts are round with a dust ring below. Toon may stay round but squashes and stretches.
- **Framing.** The whole effect, peak to dissipation, stays inside the gameplay camera's frame.

Brightness:
- **White budget.** At most ~10% of the effect's area clips to white on the peak frame, and the brightest element sits next to a dark one. Flash core size and time above B: `numbers.md`.
- **Summed brightness.** Overlapping additive or premultiplied bodies add up. Fewer, bigger hero quads beat many equal ones; fire that glows through should mostly occlude as it cools. Test: the peak's hue survives (an orange fireball still reads orange), and mean frame luminance rises less than ~25% over the frame before contact.
- **Target flash cap.** The hit character's flash stays under B, tinted, for the frames in `numbers.md`. A full-body flash brighter than the spark is a white-out. Dark styles darken the body (an albedo tint) instead of adding light.

Bodies:
- **Fire noise leads.** Heat is noise first, masked by the radius (`heat = (noise - bias) * mask - threshold`). An additive radial term maps the ramp into concentric rings, the fried-egg look. Test: no rings around the centre on any frame.
- **Fire hangs, smoke rises.** Motion budgets in `numbers.md`.
- **Smoke wraps the fire.** On explosions the smoke is emitted from the fireball itself, starting within 2 - 4 frames of the peak and continuing for about half a second, with 30 - 40% of puffs inside the fire's footprint at the fire's size or bigger.
- **Smoke has mass and light.** At its peak a smoke puff is opaque in its core and differs from the background by at least 0.25 in grayscale value. It is lit, not flat (`recipes/smoke-lighting.md`).
- **Visible residue.** Dark layers (smoke, blood, ash) read on dark backgrounds: a value floor, a rim, or light from the fire below. Check on a dark and a mid background.
- **One fire per style.** Fire bodies differ by style in shape language, value, timing and texture, not only in ramp colours.

Integration:
- **Ground contact.** No hard lines where quads cut the ground or a character (soft particles), and something touches the ground on big events (light pool, dust, scorch, cracks). Hard-edged cel shapes are the exception to soft particles: the fade plus the cel threshold still cuts them along a straight ground line. Keep their bottom above the ground (centre at least one radius up) or squash them flat.
- **Sort alpha-blended instances** back to front within each layer as well as between layers, or dust draws through fire. Additive layers do not need it.
- **Dissolve stays out of the body.** Erosion holes belong to the tail of a slash or the end of a body's life.
- **Target reaction.** Squash on contact, a jolt and a lean away from the hit, a short rim (`numbers.md` > Motion budgets and Per style). Toon gets a squash-stretch-squash bounce, realism a small one.

## Layer anatomy

A complete hit or explosion usually has most of these. Each is its own emitter or mesh with its own timing.

| Layer | Job | Typical tech |
|---|---|---|
| Anticipation | warn and build | inward streaks, charging glow, ground crack reveal |
| Flash | mark the contact frame | billboard star or disc (lengths in `numbers.md`) |
| Primary shape | the identity of the effect | slash mesh, shockwave ring, fireball puffs |
| Secondary | energy and direction | sparks, speed lines, debris |
| Tertiary / residue | aftermath and grounding | smoke, embers, dust, ash |
| Light | lights the world | point light with a fast curve |
| Distortion | heat or shock | screen-space refraction of a ring or puff; required for tier 2+ shockwaves and big fires |
| Decal | lasting mark | scorch, crack, splatter, frost |
| Target reaction | sells the hit on the receiver | hit flash or rim, squash, jolt, lean away from the hit, wound mark |
| Camera | weight | shake, hitstop, impact frame, exposure dip |

## Dissipation catalog

Choose deliberately per layer:

- **Erode:** alpha threshold rises over life through a noise texture; edges break into islands. The default for fire, magic and painted smoke.
- **Holes:** a second noise eats holes from inside; the shape breaks apart. Anime and toon smoke.
- **Shrink out:** scale to zero with ease in. Toon puffs, sparkles, pixel squares.
- **Fade:** alpha to zero. Only for glows and very soft elements; on solid shapes it looks cheap.
- **Cool down:** color slides down a blackbody or ramp toward dark before fading. Sparks, embers, hot debris, decals.
- **Drift and thin:** smoke rises, expands and lowers density. Realism smoke.
- **Fall and settle:** debris, blood, ash obey gravity and come to rest on the ground.

## Game feel helpers

- **Hitstop:** freeze or slow both attacker and target on contact, scaled with damage (lengths per style in `numbers.md`). Hitstop freezes what was already moving before contact: the attacker, the swing, the slash and the anticipation layers. Layers born at contact (spark, flash, ring, puffs) keep playing through the hold, so the spark blooms while the world is frozen and lands together with the target reaction. Freezing a contact layer at its first frame leaves the spark tiny during the hold and peaking after the reaction is over. A slash freezes 2 frames at most, then keeps wiping. Camera shake keeps running.
- **Camera shake:** short, high frequency for hits; longer, lower frequency for explosions. Decay fast (outQuad or exponential). Shake along the hit direction reads better than random.
- **Impact frame:** a single two-tone image (1 - 3 frames at full rate, 1 drawing in held-drawing styles) on the biggest hits. Anime signature; use sparingly elsewhere. It is the only allowed full-screen flat frame (see No white-out frames in SKILL.md).
- **Screen flash:** a brief full-screen tint at very low alpha. Never on tier 0 to 1 effects.
- **Time remap:** slow the effect's own clock right after contact (not the game) for extra weight.

## Archetype recipes

Starting stacks. The style file adjusts the parts.

- **Melee impact:** anticipation (optional) -> flash -> shockwave ring -> radial sparks or streaks -> small smoke -> light -> shake.
- **Slash:** arc mesh swept by a head with a tail, white core to colored edge, eroding as the tail passes -> small flash at contact -> sparks along the arc direction.
- **Projectile:** head (core glow + shape), trail (ribbon or stretched particles), muzzle flash at spawn, impact at end. The head must be readable at gameplay distance; the trail shows direction.
- **Explosion:** anticipation (compression, glow, cracks) -> flash -> fireball (fast expansion, slow decay) -> smoke emitted from the fireball (wrapping it, then rising) -> shockwave on ground -> debris (ballistic) -> sparks -> scorch decal -> light -> shake.
- **Fire loop:** flame tongues (eroded noise scrolling up), core glow, embers, a little smoke, flickering light. Loop length 1 - 3 s with a seamless noise scroll.
- **Aura / buff:** ground ring or glyph, rising motes, a fresnel shell or rim on the character, slow pulse. Never cover the character's silhouette.
- **Heal:** rising soft particles, plus signs or leaves for style, upward spiral, a gentle flash. Round shapes, green or gold.
- **Lightning:** branching jagged line (generated mesh or flipbook), flickering on and off for 2 to 4 frames, bright core with colored glow, impact flash, burn decal.
- **Projectile trail ribbon:** width tapers to zero at the tail, UVs scroll along the length, alpha erodes at the tail end.
