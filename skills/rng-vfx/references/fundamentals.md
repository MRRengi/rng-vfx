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

Reserve pure white and full saturation for tier 3 and up. If everything glows, nothing reads.

Separate **gameplay-critical** elements (area of effect, hitbox, direction, timing tells) from **flavor** (sparks, motes, smoke). Critical elements get the clearest shapes and must stay readable when flavor is turned down for performance.

Telegraphs (where an attack will land) must show the true area. A circle that is larger or smaller than the real hitbox is a bug, not a style choice.

## Value

Value (lightness) carries readability; hue carries identity.

- Design in grayscale first. Toggle grayscale on the stand or desaturate the frame. The shape of the peak frame must be obvious.
- Keep a value structure: core brightest, mid tones around it, darkest elements (smoke, debris, outlines) at the edges. Three to four value steps is enough.
- Contrast against the background, not in absolute terms. A white flash on a snow level needs a dark outline or a dark under-layer to read. A black smoke on a dark dungeon needs a rim light or an emissive edge.
- Dark elements are powerful: a dark core, dark smoke or a dark outline makes the bright parts brighter without raising brightness.

## Color

- Pick one dominant hue family per effect, one accent, and neutrals. Three hue families is a crowd.
- Hue shift across value: bright parts drift toward white or yellow, shadows drift toward the complementary or cooler side. A ramp that only changes lightness looks flat.
- Saturation peaks in the mid tones. Highlights desaturate toward white, shadows desaturate toward gray or a dark tint.
- Color means something in games (team colors, damage types, healing green, poison green-purple, fire orange, ice cyan). Respect the game's existing color language before inventing.
- HDR: values above 1 make bloom respond. Push only the core above 1; keep mid tones under 1 so bloom does not swallow the shape.

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

## Timing

The universal envelope: **anticipation -> contact -> follow-through -> dissipation**.

| Phase | Purpose | Typical length (60 fps) |
|---|---|---|
| Anticipation | tells the player something is coming; gather, charge, inward motion | 0 - 10 frames for hits, up to 1 s for big telegraphed attacks |
| Contact / peak | the readable frame; biggest shape, highest contrast | 1 - 4 frames |
| Follow-through | energy leaves: bursts, shockwaves, sparks travel | 6 - 20 frames |
| Dissipation | residue: smoke, embers, decals, afterglow | 0.3 - 2 s |

Defaults:
- Peak within the first 2 to 4 frames after contact. A slow rise kills the hit.
- Ease out on almost everything that expands (outExpo, outQuart). Ease in on things that fall or collapse.
- Overshoot (outBack, elastic) only in toon and playful styles.
- Stagger secondary layers by 1 to 3 frames after the primary. Everything starting on the same frame looks mechanical.
- Long tails are cheap and add a lot: lingering embers or a cooling decal extend the effect without hurting readability.

### Drawings per second (frame holds)

Hand-drawn effects animate on twos or threes (a new drawing every 2 or 3 frames at 24 fps, so 12 or 8 drawings per second). Holding drawings gives snap and weight. In real time, quantize the effect's time: `t_held = floor(t * fps) / fps`. Use 12 for anime, 8 to 12 for pixel, full rate for stylized and realism. Never hold the camera or gameplay, only the effect.

## Layer anatomy

A complete hit or explosion usually has most of these. Each is its own emitter or mesh with its own timing.

| Layer | Job | Typical tech |
|---|---|---|
| Anticipation | warn and build | inward streaks, charging glow, ground crack reveal |
| Flash | mark the contact frame | billboard star or disc, 1 - 4 frames |
| Primary shape | the identity of the effect | slash mesh, shockwave ring, fireball puffs |
| Secondary | energy and direction | sparks, speed lines, debris |
| Tertiary / residue | aftermath and grounding | smoke, embers, dust, ash |
| Light | lights the world | point light with a fast curve |
| Distortion | heat or shock | screen-space refraction of a ring or puff |
| Decal | lasting mark | scorch, crack, splatter, frost |
| Camera | weight | shake, hitstop, impact frame, chromatic pulse |

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

- **Hitstop:** freeze or slow both attacker and target for 2 to 6 frames on contact. Scale with damage.
- **Camera shake:** short, high frequency for hits; longer, lower frequency for explosions. Decay fast (outQuad or exponential). Shake along the hit direction reads better than random.
- **Impact frame:** 1 to 3 frames of inverted or high contrast image on the biggest hits. Anime signature; use sparingly elsewhere.
- **Screen flash:** a brief full-screen tint at very low alpha. Never on tier 0 to 1 effects.
- **Time remap:** slow the effect's own clock right after contact (not the game) for extra weight.

## Archetype recipes

Starting stacks. The style file adjusts the parts.

- **Melee impact:** anticipation (optional) -> flash -> shockwave ring -> radial sparks or streaks -> small smoke -> light -> shake.
- **Slash:** arc mesh swept by a head with a tail, white core to colored edge, eroding as the tail passes -> small flash at contact -> sparks along the arc direction.
- **Projectile:** head (core glow + shape), trail (ribbon or stretched particles), muzzle flash at spawn, impact at end. The head must be readable at gameplay distance; the trail shows direction.
- **Explosion:** anticipation (compression, glow, cracks) -> flash -> fireball (fast expansion, slow decay) -> smoke column (buoyant, delayed) -> shockwave on ground -> debris (ballistic) -> sparks -> scorch decal -> light -> shake.
- **Fire loop:** flame tongues (eroded noise scrolling up), core glow, embers, a little smoke, flickering light. Loop length 1 - 3 s with a seamless noise scroll.
- **Aura / buff:** ground ring or glyph, rising motes, a fresnel shell or rim on the character, slow pulse. Never cover the character's silhouette.
- **Heal:** rising soft particles, plus signs or leaves for style, upward spiral, a gentle flash. Round shapes, green or gold.
- **Lightning:** branching jagged line (generated mesh or flipbook), flickering on and off for 2 to 4 frames, bright core with colored glow, impact flash, burn decal.
- **Projectile trail ribbon:** width tapers to zero at the tail, UVs scroll along the length, alpha erodes at the tail end.
