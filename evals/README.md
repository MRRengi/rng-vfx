# Evals

How the skill is tested. Run each round with two fresh agents in the same conditions: one with the skill, one without. Compare the results as clips side by side, from the gameplay camera and the close camera, without knowing which is which.

`harness.md` is the shared brief: the page, the scene, the cameras and the `window.fx` API every effect must expose.

## How a round runs

The user writes the effect request in their own words, the way they would ask for it in a real project. Each agent gets only three things: that message verbatim, `harness.md` (the project setup: page, scene, cameras, the `window.fx` API and where to deliver), and, for the skill run, the path to the skill. Nothing else: no hints on how to build the effect or how to check it, because those would test the prompt instead of the skill.

```
<the user's message, verbatim>

Project setup and delivery: <path>/evals/harness.md. Output folder: <out>/<task>/.
VFX skill: <path>/skills/rng-vfx/   (skill run only)
```

Rounds 1 - 7 used briefs written by Claude; from round 8 on the user writes them.

## Results so far

| Round | Realism | MOBA | Anime |
|---|---|---|---|
| 1: rulebook skill | skill better | baseline better | baseline better |
| 2: energy allowed to glow | skill better | baseline better | baseline better |
| 3: bolder scale and impact frames | not run | tie | skill effect better, motion jittery |
| 4: reference-driven rewrite | skill better | skill better | tie |

Round 5 checked whether the skill holds on styles it was never tuned on, with three new briefs: a dark fantasy greataxe slam, a toon bomb and a pixel-art fireball. All three came out level with the baseline, different in style but equally good.

Round 6 covered all six styles with new event types: a fuel barrel explosion, a MOBA lightning strike, an anime electro slash, a dark fantasy blood nova, a toon ink splat and a pixel-art sword slash. The skill won the lightning strike, the blood nova and the ink splat, lost the barrel explosion, and tied the anime slash (some parts better each way) and the pixel slash.

Round 7 reran those six with the skill after adding classical effects craft (Gilland's *Elemental Magic*), two runs each: realism and dark fantasy were clearly better than before, MOBA level with round 4 and better than the baseline, anime split between a top run and a weak one, toon good but with a ground decal covering the attack too long, and pixel slashes that did not understand which way the blow went in the world. Those last two became general principles (residue sits after and under the event; a slash is the trail of a weapon swung by someone), not effect-specific rules.

Round 8 was the first request written by the user: a cinematic, physically grounded barrel explosion.

Rounds 9 and 10 used his request for a divine slash in an isometric survivors-like. Between them the skill gained knowledge from senior artists' critiques on realtimevfx.com and Riot's style guide (round 9), then the principle that every boundary of an effect, in space and in time, is designed rather than cut off (round 10). Round 9: the skill's version preferred as an effect, both with a hard cut at the start of the slash. Round 10: the skill's version judged better by an order of magnitude.

Rounds 11 - 15 moved from single hits to effects that live over time:

- **Round 11, a seamless sci-fi shield with floating holes from hits:** the skill's version clearly better. The user noticed projectiles that seemed to stall; the bolt was parked at the contact point for two frames after crossing the screen in two. The review only rendered motion around one contact, so neither the agent nor the reviewer saw the other three hits frame by frame. That became two general changes: momentum never stops without a cause, and motion is reviewed around every event (`--events`).
- **Rounds 12 - 14, a stylized fireball with physically burning particles that can be moved or held as a fire hand:** the baseline won by a wide margin in round 12, and two more skill runs confirmed it was the skill, not luck. The skill's fire was built from a still flame image repeated on every particle, then from velocity-stretched blobs, because the classical (hand-drawn) fire descriptions and a blanket stretch-on-motion rule were read per particle. The fixes were general: the whole emerges from motion (simple soft elements, animated sequences or a shader field, never a still image of the final shape), stretching is motion blur for small hard things only while soft volumes stay round and fill their trail by density, and distortion (heat, pressure fronts, gravity) is part of the event rather than polish. Round 14's fireball was approved.
- **Round 15, a forest portal for a Dragon Age 2-like RPG:** the skill's version far better, and two more runs held the same level.

Rounds 16 - 19:

- **Round 16, a Genshin-style AoE skill with evil energy:** the baseline won. Its core burst grew over the whole damage area, while the skill's version put a small column in the middle and left the area to a faint ring of spikes. The skill had been shaped by single-target hits, so it taught one primary shape at the contact point but never that the primary shape shows where the effect acts. The fix was general: the brief records the gameplay footprint (target, radius, cone, line, zone), and at its peak the primary shape fills that footprint.
- **Round 17, an AoE with evil and healing energy:** two skill runs, both filling the whole AoE circle at the peak.
- **Round 18, a black hole that pulls units in:** the skill's version preferred and made the README's hero, with a readable zone and a unit outside it that leans in but is not taken. A tool bug surfaced too: after the review capture size had been lowered for speed, pages with a fixed 1280x720 canvas were cropped in the review; the default went back to the canvas size.
- **Round 19, an isometric pixel-art healing aura:** the user liked both; the skill's three runs were consistently punchy (anticipation, a one-drawing flash, stepped drawings, a small palette, dithered fades) where the baseline was smooth and saturated.
