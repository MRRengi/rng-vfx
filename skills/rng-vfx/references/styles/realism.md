# Realism

Modern AAA shooters, military and cinematic games. The effect has to be believable first: real physics, real materials, real light. Stylization happens only in timing and readability.

**References to recall:** Battlefield (grenades, artillery, vehicle explosions), Call of Duty Modern Warfare (frag, flashbang, impacts on concrete and metal), The Last of Us Part II (gunshot impacts, molotov), Red Dead Redemption 2 (dynamite, muzzle flash), Escape from Tarkov (bullet impacts). Describe the matching one at contact, +2, +6 frames and the end before building.

## Look

- Match the event's real material. Ground bursts (grenades, artillery, mines) and bullet impacts are matter first: dirt, dust, smoke and debris, with fire and flashes short. Fuel explosions (barrels, vehicles, gas) are fire first: a bright rolling fireball that lights the scene, then black smoke.
- Physically based light: the flash and fire light the surroundings through a real light, and smoke is lit by the sun and by the fire.
- Colour comes from materials and temperature: blackbody ramps for hot things (`#fff6e0` white-hot, `#ffc46b` yellow, `#ff7a1f` orange, `#9b2a0c` dark red), earth tones for dirt (`#4a3a2c`, `#6b5a48`, `#8a7a66`), grey-browns for smoke (`#2a2622` base, `#55504a` body, `#8c857c` thin edges).
- Value: dark masses (soil, smoke) against the sky are what read from far away. A frag explosion that is mostly bright is wrong.
- Fire emits light: its body is bright, saturated orange and yellow, sitting just under the bloom threshold so filmic tone mapping (AgX or ACES) keeps it orange instead of white, with only the core above it (`brightness.md`). Under the threshold does not mean dark: a brown or muddy fireball reads as dirt, not fire.

## Timing defaults (60 fps, typical)

| Layer | Start | Peak | End |
|---|---|---|---|
| Flash card + light | 0 | 0 - 1 | 2 - 3 |
| Fireball (frag) | 0 | 3 - 5 | 8 - 12 |
| Fireball (fuel/vehicle) | 0 | 6 - 12 | 60 - 120, rising |
| Ejecta column | 0 | 6 - 10 (max height) | falls and drifts until 60 - 90 |
| Ground dust skirt | 1 | 10 - 20 | 40 - 70 |
| Sparks | 0 | 0 | 20 - 60 |
| Debris | 0 | arc apex 15 - 30 | lands and rests |
| Smoke | 2 - 6 | grows for 60 - 120 | 180 - 400, thinning |
| Scorch decal | 0 | 3 | stays |
| Bullet impact (concrete) | 0: spark/flash 1 - 2 frames, dust puff peaking at 4 - 8, debris chips, decal | | 30 - 60 |

## Signature shapes

- Ejecta column: dark soil cone thrown up and falling back, the main silhouette of ground explosions.
- Fireball: premultiplied, temperature-driven, rolling and rising (only where fuel justifies it).
- Smoke: lit, ground-anchored columns that spread and drift slowly.
- Sparks: blackbody streaks with quadratic drag and bounce.
- Debris: angular, mixed sizes, a few big hero chunks with dust trails.
- Decals: scorch with radial streaks, bullet holes, chips.
- Simulated flipbooks (EmberGen, Houdini, Blender) with motion vectors are the shipped standard for fireballs and smoke where available; procedurally, use lit noise volumes built from designed shapes (`elements.md`).

## Failure modes in this style

- A bright orange cumulus fireball for every explosion (petrol-barrel look) when the brief is a grenade or shell; and the reverse, a fuel explosion drawn as a dark brown dirt cloud with the fire buried inside it.
- Smoke that fills the frame for seconds and hides the event and the characters.
- A full-screen white flash; a real flash is small and short and works through light.
- Smoke as one detached lump floating away, unlit and noisy.
- Uniform round debris blobs flying symmetrically.
- No ground interaction and no reaction on nearby characters.
- Additive blending on smoke or dust.
