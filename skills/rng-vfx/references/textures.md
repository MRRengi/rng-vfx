# Textures

Effects need few textures, but the right ones. Most good effects are 2 to 5 small textures reused through UV tricks, erosion and ramps.

## The kit

| Texture | Channels | Typical size | Use |
|---|---|---|---|
| Soft glow | R | 64 - 128 | additive cores, motes |
| Shape masks (circle, ring, star, streak, crescent) | R | 128 - 256 | flashes, rings, sparks, slashes |
| Tiling noises (fbm, warped fbm, voronoi, ridged) | R or packed RGBA | 256 - 512 | erosion, distortion, panning detail |
| Distortion normal / flow | RG | 128 - 256 | heat haze, UV wobble, flow maps |
| Ramps | RGB(A), 256 x 1 | 256 | gradient mapping by heat, age or value |
| Flipbooks | RGBA, grid 4x4 to 8x8 | 512 - 2048 | fire, smoke, explosions, hand-drawn frames |
| Motion vectors for flipbooks | RG | same as flipbook | smooth flipbook blending |
| Decals | RGBA + optional normal | 256 - 1024 | scorch, cracks, splatter |

### Authoring rules

- **Masks and noises are linear data.** Import them with sRGB off. Only color textures (painted flipbooks, decals with color) are sRGB.
- **Pack channels.** Four grayscale masks in one RGBA texture is one sample and one memory slot. Keep a naming convention, for example `T_FX_Noise_RGBA` with R fbm, G voronoi, B cracks, A streak.
- **Seamless when panning.** Any texture that scrolls must tile. Periodic noise (generated on a wrapping lattice) tiles by construction.
- **Big readable features.** Effects are seen small and fast. Noise with very fine detail turns to gray at distance. Prefer few large features plus a little fine detail.
- **Black borders on sprites.** Shape masks must fade to zero before the edge, or the quad outline shows.
- **Flipbook padding.** See `numbers.md` > Textures (about 2^m px per cell for the smallest mip m the sheet is drawn at).
- **Compression.** Single-channel masks: BC4 (desktop) or EAC R11 / ASTC (mobile). Two-channel: BC5. Color: BC7 or ASTC. Check that soft gradients survive compression; banding shows first in glows.
- **Mipmaps on, with alpha coverage** where alpha clip is used, so distant cutout shapes do not vanish.

## Which noise for what

| Noise | Looks like | Use for |
|---|---|---|
| Value noise | soft blobs on a grid | small masks and holes only; on bodies it gives cotton-ball mush |
| Perlin (gradient) | smooth clouds | gentle variation, distortion |
| Billow (`abs(perlin)` fbm) | puffy lobes with creases | smoke and fire bodies |
| Inverted Worley | round billowy cells (cauliflower done right) | cel puff silhouettes, cartoon smoke, cell-shaped holes |
| Warped fbm | swirling, smoky streaks | smoke detail, flowing magic |
| Ridged (`1 - abs(perlin)`) | sharp ridges and veins | lightning, energy, cracks, tearing dissolves |

The standard pack: one 512 RGBA tiling texture with R billow, G inverted Worley, B warped fbm, A ridged (`python tools/texgen.py vfxpack -o noise_rgba.png`). It covers almost every eroding body. Sample it with two pans at different scales and directions so it never visibly tiles.

## Sources, best first for bodies

For the bodies of effects (fire, smoke, explosions, puffs, slashes) the order of quality is: simulated or hand-drawn flipbook > painted flipbook from an image model > texture noise with erosion > procedural noise. Procedural shapes in the shader stay the right choice for crisp masks: discs, rings, stars, gradients, spikes.

### 1. Procedural in the shader (masks)

Circles, rings, stars, gradients and spikes are cheap to compute (`references/shaders.md` > Signed distance shapes) and stay crisp at any size. Use them for masks and flashes, not for the textured bodies of fire and smoke.

### 2. texgen (in this repository)

`tools/texgen.py` (Python, numpy and Pillow, headless, deterministic, MIT):

```
python tools/texgen.py vfxpack --size 512 -o T_FX_Noise_RGBA.png   # R billow, G inv. Worley, B warped fbm, A ridged
python tools/texgen.py noise --kind billow --freq 4 -o T_FX_Billow.png
python tools/texgen.py noise --kind worley --cells 5 -o T_FX_Worley.png
python tools/texgen.py noise --kind fbm --freq 4 --size 512 --seamless -o T_FX_Fbm.png
python tools/texgen.py noise --kind warped --seamless -o T_FX_Warped.png
python tools/texgen.py noise --kind voronoi --cells 8 --seamless -o T_FX_Voronoi.png
python tools/texgen.py noise --kind cracks --cells 6 --edge 0.04 -o T_FX_Cracks.png
python tools/texgen.py noise --kind ridged --seamless -o T_FX_Ridged.png
python tools/texgen.py shape --kind glow --falloff 2.5 -o T_FX_Glow.png
python tools/texgen.py shape --kind ring --radius 0.7 --width 0.06 -o T_FX_Ring.png
python tools/texgen.py shape --kind star --spikes 6 --sharp 2.5 -o T_FX_Star.png
python tools/texgen.py shape --kind streak -o T_FX_Streak.png
python tools/texgen.py shape --kind slash -o T_FX_Slash.png
python tools/texgen.py ramp --stops "0:#ffffff,0.3:#ffd34d,0.7:#ff6a1f,1:#3b0f0f" -o T_FX_Ramp_Fire.png
python tools/texgen.py flipbook --kind fire --frames 16 --size 1024 -o T_FX_Fire_4x4.png
python tools/texgen.py flipbook --kind puff --frames 16 --size 1024 -o T_FX_Smoke_4x4.png
python tools/texgen.py ground -o stage/   # tileable flagstone albedo, normal, roughness for test stands
python tools/texgen.py pack --r T_FX_Fbm.png --g T_FX_Voronoi.png --b T_FX_Cracks.png --a T_FX_Streak.png -o T_FX_Noise_RGBA.png
```

Change `--seed` for variants. Run it in the agent's own environment; it needs no display.

### 3. EffectTextureMaker (browser tool by mebiusbox)

A web page (three.js) with dozens of VFX templates: noises, flares, rings, sparks, explosions, smoke, fire, lightning, magic circles, caustics, brush strokes, and a sprite sheet mode. The author states that generated textures are CC0, free for commercial use. Its source code is not open source, so use it as a generator only: never copy its shaders into a project.

How to use it as an agent:
- Open it in a headless browser (Playwright). The right-side controller sets resolution (up to 2048), template type, template parameters, toon shading, polar conversion, normal map, color balance and sprite sheet settings.
- Use the controller's save button to get the current settings as JSON. Keep that JSON next to the exported texture (`textures/presets/<name>.json`) so the texture can be regenerated or tweaked later; load it back with the load button.
- Export with "Download (PNG)" for images with alpha. Sprite sheets: set dimension (cells per row), time, timeLength and timeStep, then save the image.
- Useful templates per style: anime and toon (Flare, Cross, Spark, FlowerFun, Ring with the toon option), stylized (FbmNoise, TurbulentNoise, Energy, MagicCircle, BrushStroke), dark fantasy (Smoke, Cloud, Grunge, Electric, CellNoise for cracks), realism (Explosion, Smoke, Fire with sprite sheet), pixel (export at 64 - 128 px, then reduce to the palette).

### 4. Image generation

For painted and hand-drawn looks (anime fire, toon puffs, stylized flipbooks, decals) an image model gives a more designed result than noise. Prompting rules that work:
- **Do not ask for a whole grid.** Models cannot keep 16 cells consistent; frames jump in shape and position. Generate 4 - 6 keyframes as separate images (birth, growth, peak, break-up, last wisps), feeding the previous one back as a reference, and fill the in-betweens with a life map or frame blending. Full method: `recipes/flipbooks.md`.
- Use a **plain neutral background** (#808080) and remove it afterwards, or a **plain black background** for additive elements.
- Name the **style and constraints**: "flat cel-shaded, 3 tones, crisp edges, no gradients, no text, no glow haze" for anime; "hand-painted brush texture, soft value bands" for stylized; "pixel art, 64 px per frame, 5 color palette" for pixel.
- Generate grayscale when the color should come from a ramp in the shader; it keeps the palette controllable.
- Always post-process: remove background to alpha, center frames, enforce the grid, check frame-to-frame consistency. Reject sheets where frames jump in position or style.

### 5. Rengi Forge tools (if the MCP server is connected)

| Need | Tool |
|---|---|
| Video or simulation render to flipbook | `sprite_tools_video_to_sheet` |
| Remove background from generated frames | `sprite_tools_remove_bg` |
| Normal map for lit smoke or decals | `sprite_tools_normal_map` |
| Make a noise or decal tile seamlessly | `texture_tools_seamless` |
| Full PBR set for decal surfaces | `texture_tools_pbr` |
| Pack masks into RGBA channels | `texture_tools_pack` |
| Atlas several sprites | `texture_tools_atlas`, `sprite_tools_pack` |
| Pixel art reduction | `sprite_tools_pixelate` |
| Slice a sprite sheet | `sprite_tools_slice` |

### 6. Simulation (realism)

For realistic fire, smoke and explosions, flipbooks baked from fluid simulation are the standard. Options: JangaFX EmberGen (real-time, made for this), SideFX Houdini (Pyro), Blender (Mantaflow, free), or the engine's own tools (Niagara Fluids). Bake 32 to 64 frames with motion vectors; render at least two lighting variants or six-way lightmaps for lit smoke. Without these tools, `texgen` puffs plus shader erosion are the fallback.
