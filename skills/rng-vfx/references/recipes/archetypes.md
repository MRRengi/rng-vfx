# Other archetypes

Construction notes for effects beyond hits and explosions. Timing and brightness follow `numbers.md` and the style file; these are the shape and layer rules.

## Projectile

- **Head:**
  - A readable shape at gameplay distance, 40 px or more on screen for a tier-2 ability.
  - A core above B, a coloured body and a silhouette that shows direction: a teardrop or arrowhead stretched along velocity (aspect 1.5 - 3), never a round ball.
- **Trail:**
  - A ribbon or stretched particles, 3 - 8 head-lengths long.
  - Width tapers to zero at the tail, UVs scroll along the length.
  - The trail erodes from the tail (`slash.md` > Shading applies to ribbons too).
- **Secondary:** small sparks or motes shed from the head (5 - 15 per second), inheriting 20 - 40% of its velocity.
- **Start and end:**
  - At spawn, a muzzle flash for 2 - 3 frames.
  - At the end, an impact (`spark-star.md`) plus the trail dissipating in place over 0.2 - 0.5 s. A trail that vanishes with the head reads as a cut.
- **Light:** a moving point light at 0.3 - 0.5 B on nearby surfaces, if the projectile is bright.

## Beam

- **Body:**
  - A mesh cylinder or a camera-facing strip, with two scrolling noises at different speeds (dual pan) eroding the edges.
  - The core is a thin strip above B, the outer glow below B.
- **Ends:**
  - The source has a muzzle glow and inward-moving motes.
  - The impact end has a spark, a ground decal and sparks spraying along the surface.
  - The ends fade or narrow to zero; a beam cut flat at either end shows its geometry.
- **Life:**
  - Start by extending from the source over 2 - 4 frames.
  - Hold with width pulsing ±10% at 8 - 15 Hz.
  - End by thinning to zero over 3 - 6 frames.

## Lightning

- **Shape:**
  - A branching jagged polyline: midpoint displacement with 5 - 7 subdivisions, displacement halving each level.
  - 1 - 3 branches spawned from random segments, shorter and thinner.
  - Rendered as a camera-facing strip with a bright core (above B) and a wide soft glow (below B).
- **Life:**
  - 2 - 4 frames on, 1 - 2 off, a new path each strike.
  - The whole bolt lives 0.1 - 0.4 s.
  - Each frame shows a new path: one path held for many frames reads as a static crack.
- **Impact:** flash, sparks, a short scorch decal, and a light at 1 - 1.5 B that strobes with the bolt.

## Aura / buff

- **Ground:**
  - A ring or glyph decal under the character, 1.2 - 1.6x the character's footprint, slowly rotating (10 - 30 degrees per second).
  - Low alpha (0.3 - 0.6).
- **Body:**
  - A fresnel rim on the character (0.3 - 0.5 B) or a mesh shell 3 - 5% larger with scrolling noise.
  - Never an opaque sphere over the character.
- **Motion:** rising motes or streaks, 5 - 20 alive at a time, spawned on the body's surface with curl turbulence.
- **Pulse:** a slow pulse of brightness and scale (±10% at 0.5 - 1.5 Hz).
- **Readability:** the character's silhouette and face stay readable. The aura is tier 0 - 1 brightness unless it marks a gameplay state.

## Heal

- **Shapes:** round, soft, upward.
  - Rising particles (plus signs, leaves, soft glows) in an upward spiral over 0.6 - 1.2 s.
  - A gentle flash at the start, below B.
- **Colour:** green or gold, within the game's colour language.
- **Target:** a soft fresnel pulse on the healed character, never a hit flash.

## Telegraph (area warning)

- **Area:** the shape matches the real hitbox exactly. A circle larger or smaller than the hitbox is a bug.
- **Construction:**
  - A ground decal with a crisp outline.
  - A low-alpha fill (0.15 - 0.35).
  - An inner fill that grows from the centre to the edge over the warning time, so the player can read when it lands.
- **Values:** a high-contrast edge colour against both the lightest and darkest ground of the level.
- **End:** at the moment of impact, the telegraph is replaced by the effect. It does not fade slowly over the impact.

## Target reaction

- **Contact frames:**
  - A flash (albedo tint for dark styles, a short emissive tint for bright ones), in the frames from `numbers.md`.
  - Then a rim for 2 - 6 frames.
  - A squash of about 0.85 along the hit axis with recovery over 6 - 15 frames.
  - A jolt (high-frequency shake, 0.02 - 0.05 m) and a lean away from the hit.
- **Mark:** a wound decal, frost, burn or stain matching the damage type, fading over seconds.
- **Bystanders:** characters near the effect who were not hit get light only.
