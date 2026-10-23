# Realism (physically based, cinematic)

Reference points: Battlefield, Call of Duty, The Last of Us Part II, Red Dead Redemption 2, Ghost of Tsushima, film VFX and real high-speed footage.

## What defines it

- **Physics is the art direction.** Sparks fall under gravity and slow down with air drag, smoke rises by buoyancy and spreads, debris arcs and bounces, dust hugs the ground. Viewers know real motion and notice when it is wrong.
- **Temperature drives color.** Hot things glow along the blackbody curve: white, then yellow, orange, red, dark red, black. Fire cools into smoke as it rises; sparks and debris cool as they fly.
- **Scale cues.** Real explosions are huge and slow; a large explosion that dissipates in one second looks like a firecracker. Small things are fast, big things are slow.
- **HDR and exposure.** Flashes are very bright and very short; the scene exposure reacts (an exposure dip). Filmic tone mapping (AgX, ACES).
- **Volume.** Smoke has self-shadowing, density variation and soft edges; it is lit by the environment and by the fire inside it.
- **Lighting integration.** Explosions light the environment strongly; muzzle flashes cast light; sparks are too small to cast light but their reflections on wet surfaces sell them.

## Color and value

- Fire: blackbody ramp. Smoke: neutral to slightly warm dark grays (combustion), lighter gray-brown for dust. Lit from below by fire.
- Avoid saturated non-physical colors unless the source is chemical (green copper flames, magnesium white).
- Bloom: moderate, high threshold, follows HDR values naturally.

## Signature techniques

- **One temperature particle for fire:** a premultiplied-alpha particle whose emission follows the blackbody ramp of its temperature and whose occlusion grows as it cools, so fire turns into smoke inside the same particle. Two separate sets (orange fire, gray smoke) that do not overlap, or overlap only as a pop, is the cheap tell. When separate smoke is used for the column and the dust, it follows the handoff rules in `recipes/explosion.md` (spawned inside the fire, overlapping for 6 - 10 frames).
- **Smoke lit by the fire:** add the fire colour to smoke by height above the source, scaled by the fire light's curve, so the column glows from below.
- **Flash and exposure:** flash 2 - 3 frames, smaller than the fireball; sell brightness with a short exposure dip (1 -> 0.6 -> 1 over ~0.3 s), not a white frame.
- **Simulated flipbooks:** fire, smoke and explosions from fluid simulations (EmberGen, Houdini, Blender Mantaflow, or the engine's own fluid tools) baked to flipbooks with motion vectors for smooth frame blending. When no sim tool is available, layered fbm puffs with domain warping and fake self-shadow get close for mid-distance effects.
- **Motion vector flipbook blending** to play low frame count flipbooks smoothly at any speed.
- **Six-way or normal-mapped smoke lighting** so smoke responds to scene lights.
- **Soft particles** (depth fade) everywhere particles meet geometry.
- **Ballistic sparks** with stretched billboards along velocity, bounce on collision (restitution 0.2 - 0.4). Orient the spray cone 60 - 90 degrees off the camera axis: a cone pointing at the camera foreshortens every spark into a dot. Add a hero subset (about 25%): faster (12 - 18 m/s), longer stretch, brighter.
- **Ground dust rings** for explosions and landings: ring emitter, high initial speed, very high drag, low and wide.
- **Heat distortion** above fires and after explosions.
- **Light curves:** very short peak (2 to 3 frames), long tail.
- **Decals:** scorch marks, bullet holes, wet splashes with roughness changes.

## Default numbers

- Timings, sizes and brightness: `numbers.md` > Realism.
- Gravity 9.81 m/s^2 at real scale; check the project's unit scale first (`audit.md`).
- Smoke lifetime scales with blast size: a ~3 m fireball's smoke keeps billowing for 3.5 - 4.5 s, rising slowly, not shooting out of frame in a second.

## Common mistakes

- Additive smoke (smoke is alpha-blended and occludes).
- Fire that stays the same color for its whole life.
- Sparks with no gravity, or gravity with no drag.
- Explosions that are too fast for their size.
- Missing ground interaction: dust, scorch, light on the ground.
- Hitstop on an explosion: realism never freezes the world for a blast.
- A scorch drawn as an alpha-black disc: darken the ground with a multiply decal and radial ejecta streaks, keep the albedo texture visible.
