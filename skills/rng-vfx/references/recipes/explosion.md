# Explosion construction

An explosion is not a ball of particles with smoke on top. It sits on the ground, grows out of a compressed core, hands its fire over to smoke and leaves a mark. These are the construction rules behind the quality floors.

## Grounding

- **Stem:** the stem or base emitter lives at least as long as the fireball and starts at the ground.
- **Base height:** for the first 40% of the fireball's life, the fireball's base stays within 0.3 m of the ground (for a 2.5 - 4 m fireball).
- **Rise:** after that the fireball may rise, slower than the smoke above it (`numbers.md` > Motion budgets).
- **Dust skirt:** puffs that start at the ground and push out horizontally.
  - Hard-edged cel puffs sit one radius above the ground, or the soft-particle fade cuts them along a straight line (`fundamentals.md` > Ground contact).
- **Mark:** a scorch or crack decal and a light pool on the ground (`meshes-decals.md`).
- **Check:** the bottom of the fireball's bounding box at 25%, 50% and 75% of its life. A gap between it and the ground before 40% means the explosion floats.

## Growth

- **Frame 1** is a compressed bright core at 30 - 50% of the peak size.
- **Peak** arrives within 3 - 6 frames (or 2 - 3 drawings) with outExpo; a fireball that appears at full size has no blast.
- **Anticipation** for big ones: 6 - 20 frames of compression, glow, cracks or inward motes before the flash.

## Clusters (multi-quad bodies)

- **Spread:** spawn radius at least 0.35x the quad size, with X jitter and ±20 degrees of rotation per quad.
- **Hero quads:** 3 or fewer, offset from each other. Mids fill the gaps, accents break the silhouette.
- **Avoid stacking:** never stack tall windows (aspect above 1.2) on a tight spawn radius along one axis. They line up into a column with straight vertical sides.
- **Silhouette:** at peak, lobes and tongues break the outline. A smooth ellipse means the clusters are too tight or the windows too regular.

## Fire-to-smoke handoff

The transition is the explosion's tell. A pop from fire to a separate smoke cloud reads as two effects.

- **Overlap:** fire and smoke overlap for 2 drawings (anime, pixel) or 6 - 10 frames (full rate).
- **Spawn:** smoke spawns inside the fire's footprint at 80 - 100% of its size, starting before the fire's peak ends. It does not start above the fire later.
- **Remnants:** fire tongues persist on the smoke's lower edge for 2 - 3 drawings, or 10 - 20 frames, and smoke near the base keeps the fire's light (`smoke-lighting.md`).
- **Cel styles:** cel smoke keeps 2 shading bands and the outline; a single flat value reads as a cardboard cutout.
- **Realism:** the temperature particle cools into smoke itself (premultiplied: hot parts glow, cool parts occlude), so the handoff is continuous.

## Ground ring

On the biggest explosions only:
- at most 2 m radius;
- 40 - 50% coverage;
- low alpha, short.

Better: a dust skirt plus distortion. A closed even ring around the blast reads as a selection circle from the gameplay camera.
