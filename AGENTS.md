# rng-vfx for any coding agent

This repository is a game VFX skill. When a task involves visual effects (impacts, slashes, projectiles, explosions, fire, smoke, magic, auras, lightning, trails) or their shaders, materials, textures, timing or performance:

1. Read `skills/rng-vfx/SKILL.md` and follow its chain in order.
2. Read only the reference files the SKILL.md table points to for the task.
3. Verify with a frame strip as described in `skills/rng-vfx/references/verification.md`.

Tools in this repository:
- `tools/texgen.py`: procedural VFX textures (Python, numpy, Pillow).
- `stand/`: three.js test stand; serve with `python -m http.server 8000 -d stand`.
