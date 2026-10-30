# Evals

Three briefs that test the skill across realism, stylized and anime. Run each round with two fresh agents in the same conditions: one with the skill, one without. Compare the results as clips side by side, from the gameplay camera and the close camera, without knowing which is which.

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
