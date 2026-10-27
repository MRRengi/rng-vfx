# Evals

Three briefs that test the skill across realism, stylized and anime. Run each round with two fresh agents in the same conditions: one with the skill, one without. Compare the results as clips side by side, from the gameplay camera and the close camera, without knowing which is which.

`harness.md` is the shared brief: the page, the scene, the cameras and the `window.fx` API every effect must expose.

## Prompt with the skill

```
I need three game VFX built for a web game prototype in three.js. Do the three tasks one after another, each in its own output folder. Do not spawn other agents.

You have a VFX skill at <path>/skills/rng-vfx/. Read its SKILL.md first and follow it for every task, reading the reference files it points to when it says to.

Also read <path>/evals/harness.md: it defines the page, scene, cameras and the window.fx API every effect must have.

Task 1, output folder <out>/realism-explosion/:
A realistic grenade explosion for a third-person shooter, going off on the ground about 2.5 m to the right of the dummy. I want it to look like something from a modern AAA shooter: fireball, smoke, debris, sparks, light, ground interaction. It should read well from the gameplay camera.

Task 2, output folder <out>/moba-slash/:
A sword slash hitting the dummy in a stylized MOBA look (League of Legends / Overwatch hand-painted style). The swing goes diagonally across the dummy and the hit has to feel heavy and readable from the gameplay camera.

Task 3, output folder <out>/anime-magic/:
An anime-style magic hit: a cyan energy blast striking the dummy, in the look of a modern anime action game (Genshin / sakuga anime fights).

Use procedural techniques only: shaders and textures you generate in code. Do not download images or use AI image generation.

Check your own work by rendering frames headlessly and looking at them, and improve until you are happy with each effect. When done, reply with one line per task saying it is finished.
```

The baseline prompt is the same without the skill paragraph.

## Results so far

| Round | Realism | MOBA | Anime |
|---|---|---|---|
| 1: rulebook skill | skill better | baseline better | baseline better |
| 2: energy allowed to glow | skill better | baseline better | baseline better |
| 3: bolder scale and impact frames | not run | tie | skill effect better, motion jittery |
| 4: reference-driven rewrite | skill better | skill better | tie |

Round 5 checked whether the skill holds on styles it was never tuned on, with three new briefs: a dark fantasy greataxe slam, a toon bomb and a pixel-art fireball. All three came out level with the baseline, different in style but equally good.
