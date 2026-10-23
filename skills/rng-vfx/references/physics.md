# Physics for VFX

Realism needs real physics; every other style needs believable physics bent on purpose. Know the real behaviour first, then decide what to exaggerate.

## Particle motion

### Integration

Per particle: position `p`, velocity `v`, forces `F`. Explicit Euler per frame is fine for most VFX:

```
v += (gravity + forces / mass) * dt
v *= exp(-drag * dt)        // frame-rate independent linear drag
p += v * dt
```

`v *= (1 - drag * dt)` is not frame-rate independent; use the exponential form.

### Closed form (scrubbable)

With constant gravity `g` and linear drag `k`, position at age `t` is solvable directly, so an effect can be evaluated at any time without stepping. The stand uses this:

```
e = exp(-k t)
p(t) = p0 + v0 (1 - e) / k + g (t / k - (1 - e) / k^2)
v(t) = v0 e + g (1 - e) / k
```

Terminal velocity under linear drag is `g / k`. Pick `k` from the terminal velocity you want: dust (~0.5 m/s) needs high drag, sparks (~10 m/s) low drag.

### Drag profiles

- Sparks, debris: low drag (0.3 - 1). They travel and arc.
- Smoke puffs, dust: high drag (2 - 6). Fast initial burst that stops abruptly: this "punch then hang" is the look of real explosions and impacts.
- Stylized energy: very high drag (5 - 10) gives snappy outward bursts that freeze in place.

### Gravity and scale

- Check the unit scale (Unity and three.js usually 1 unit = 1 m, Unreal 1 unit = 1 cm, so gravity is 981 there).
- Time scales with the square root of size for gravity-driven motion (Froude scaling). Something 4x bigger should fall about 2x slower in screen terms. Big explosions look slow; small ones look fast. Shrinking a big effect without speeding it up makes it look like a miniature.

### Turbulence

- **Curl noise** gives divergence-free swirling (no sinks or sources), which looks like air. Use it for smoke, embers, magic motes. Built in: VFX Graph Turbulence block, Niagara Curl Noise Force.
- Value or Perlin noise used directly as a force creates clumping and dead zones; prefer curl.
- Periodic sine offsets per particle are not turbulence: they move in sync and repeat. Use curl from a noise texture (`shaders.md` > Curl turbulence).
- Scale the turbulence frequency to the effect size; low frequency for big plumes, higher for small wisps. Increase turbulence with age so particles start coherent and break up.

### Other forces

- **Vortex / orbit:** tangential velocity around an axis for tornadoes, portals, charge-up spirals.
- **Attractors / conform to sphere:** pull particles into a shape for charge-ups and absorb effects. Pair with a timing curve so they snap in.
- **Wind:** a constant plus low-frequency gusts, shared by all effects in the scene.
- **Velocity inheritance:** sparks from a moving weapon or a moving explosion source inherit part of that velocity (20 - 60%).

### Collision

- Cheap: clamp to a ground plane and slide, or kill on contact.
- GPU depth-buffer collision (VFX Graph Collide with Depth Buffer, Niagara scene depth collision) works for on-screen geometry.
- Bounce with restitution 0.2 - 0.5 and friction; each bounce should lose energy. Sparks that hit a surface often split into smaller sparks.
- Closed-form bounce (no simulation state): when the solved position goes below the ground, mirror it, `y = ground + (ground - y) * restitution`, flip and scale the vertical velocity the same way and damp horizontal velocity. Not exact, reads right.

## Smoke

- Smoke rises because it is hotter (buoyancy proportional to the temperature difference with the air). As it cools, buoyancy drops, so plumes decelerate as they rise.
- It expands as it rises and mixes with air, so density per puff goes down while size goes up. Model: size grows with an ease out, alpha and density drop with age.
- Fresh combustion smoke is dark; it lightens and warms in color as it thins. Dust is lighter and browner and does not rise much; it spreads and settles.
- Smoke is lit: brighter on the side facing light, darker in the core. Even a fake gradient (offset noise lookup toward the light) helps hugely.
- Edges: smoke boundaries are soft and fractal. Add a domain-warped fbm to the alpha.

## Fire

- Flames are hot gas glowing; color follows temperature (blackbody: about 1000 K dark red to 1500 K orange to 2000+ K yellow-white). Hottest at the base and core, cooling toward the tips.
- Flames rise and break into tongues; the tips detach and vanish. Use noise scrolling upward with erosion stronger at the top.
- Flicker frequency drops with fire size: candles flicker around 10 - 15 Hz, a 1 m fire around 1.5 Hz (a commonly used empirical rule is roughly `1.5 / sqrt(diameter in metres)` Hz for pool fires). Small fast flicker on a big fire looks wrong.
- Fire turns into smoke above it. The transition is the realism tell: hot orange at the bottom, dark smoke on top.
- Fire lights its surroundings with a flickering light (intensity noise at the flicker frequency).

## Explosions

- A blast front expands extremely fast and decelerates: radius grows roughly with `t^0.4` (Sedov-Taylor). In practice: outExpo or outQuart on every expanding element.
- The fireball rises because it is hot, rolls into a toroidal vortex, and can form a mushroom cap with a stem when the energy is high.
- Sequence: flash (almost instant), fireball (fast growth, slower decay, cooling color), smoke (takes over as fire cools, keeps rising and expanding for seconds), dust ring (ground shock), debris (ballistic, with smoke trails for big ones), sparks.
- Ground explosions throw dirt upward in a cone; air bursts are spherical and make a dust ring below.
- Shockwave visibility: a condensation or dust ring on the ground, or heat distortion. Real shockwaves are invisible in clear air.

## Sparks

- Hot metal fragments: bright white-yellow at birth, cooling along the blackbody ramp over 0.3 - 1.5 s. Render as streaks stretched along velocity (motion blur).
- Grinding or welding sparks: continuous stream, tight cone, very bright.
- Impact sparks: short burst, wide cone biased away from the surface normal and along the reflection of the hitting direction.
- Sparks from burning materials can branch: spawn 2 - 4 smaller sparks mid-flight.

## Liquids

- Drops: stretch along velocity, sphere when slow. Gravity, small drag.
- Splashes: a crown of droplets on impact, a central jet, secondary drops; spread scales with impact speed.
- For gameplay VFX, fake liquids with stretched particles plus a ribbon or mesh sheet; full SPH or FLIP simulation is for cinematics or baked flipbooks.
- Blood: dark, viscous, alpha-blended, short arcs, decals on landing. Never additive.

## Debris

- Ballistic arcs, random angular velocity (spin), bounce with high friction, then rest.
- Size distribution: few big chunks, many small. Big chunks move slower.
- Optional smoke trails behind big chunks (ribbon or small puffs spawned along the path).

## GPU simulation by engine

- **Unity VFX Graph:** GPU particles, Turbulence, Conform to SDF, Collide with Depth Buffer, Trigger Event on Die (secondary sparks), strip renderers for trails.
- **Unreal Niagara:** GPU and CPU sim, Curl Noise Force, Collision (scene depth, distance fields), Niagara Grid 2D/3D and simulation stages for real-time fluids, Niagara Fluids plugin.
- **three.js:** CPU particles in typed arrays for hundreds, GPGPU ping-pong textures (GPUComputationRenderer) for tens of thousands, or closed-form motion in the vertex shader for bursts (no state at all).
