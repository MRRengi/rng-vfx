# Flipbooks and authored shapes

Procedural noise on a quad gives every style the same look. Shipped effects get their character from authored shapes: simulated flipbooks for realism, drawn frames and painted masks for anime, toon and stylized. This file covers how to get them and how to check them.

## Which source for which body

| Body | Realism | Stylized | Anime / toon | Pixel |
|---|---|---|---|---|
| Fireball, explosion | simulation flipbook | painted flipbook or posterized sim | drawn keyframes + life map | hand-drawn frames at sprite resolution |
| Smoke | simulation flipbook (six-way lit if possible) | painted puff flipbook | cel puff with life-map holes | 2-tone dithered frames |
| Spark, flash | procedural is fine | drawn star, 4 - 8 variations | drawn star per drawing | drawn |
| Slash | swept mesh (`slash.md`) | swept mesh + painted texture | swept mesh + drawn edge texture | drawn frames |

Procedural noise stays useful for masks, erosion, distortion and small accents. It should not be the only source of a hero body.

## Simulation: Blender (free)

1. **Domain.** Mantaflow gas domain, resolution 128 - 192, adaptive domain off.
   - Flow object: type Fire + Smoke, flow source Mesh, temperature and fuel set for the effect.
   - Bake 64 frames with noise upres x2 for detail.
2. **Camera.** Orthographic, framing the domain at its largest frame with 5% margin. One camera for the whole bake: a camera that follows the sim makes the sprite drift.
3. **Render.** Film > Transparent. Render separate passes:
   - **Density (alpha):** the volume rendered with density only, emission off, as grayscale.
   - **Temperature or emission:** flame emission only, as grayscale.
   - **Lit colour (optional):** smoke lit by a key light from the side; or six lightmaps from ±X, ±Y, ±Z for six-way lighting.
   - Keep the passes grayscale. Colour comes from a ramp in the shader, so one sim serves several palettes.
4. **Pack.**
   - 8 x 8 frames of 256 px (64 frames) for heroes; 4 x 4 frames of 256 px for small elements.
   - Empty padding inside each cell sized for the smallest mip (`numbers.md` > Textures), so mipmaps never bleed between frames.
   - `montage` (ImageMagick) or an atlas tool packs the frames.
5. **Motion vectors (optional).** Export a flow pass, or compute optical flow between frames, so the shader can blend frames without ghosting. This makes 16 frames look like 64.

## Simulation: EmberGen

- Built for this job.
- Export a flipbook with:
  - 64 frames on an 8 x 8 grid, 2048 - 4096 px;
  - emission and density in separate channels;
  - optionally motion vectors and six-way lightmaps (it has an export preset for them).
- Match the simulation's timing to the effect's duration before export. Playing a 2 s sim in 0.8 s makes it look fake.

## Image models (drawn and painted looks)

Image models cannot draw a coherent 16-cell sequence in one image; the cells do not match.

1. Generate **4 - 6 keyframes** as separate images in one consistent style prompt: birth, growth, peak, break-up, last wisps. Each prompt describes that frame's shape, on a flat neutral background, centred, with nothing cropped.
2. Feed the previous keyframe back as a reference image for the next one when the model supports it, so the shapes evolve instead of jumping.
3. Remove the background (`sprite_tools_remove_bg` in Rengi Forge, or a matte by value), centre each frame on the same pivot, and pack.
4. Fill the in-betweens with a life map (below) or frame blending, not by generating more images.

Prompt shape: "single hand-painted [style] [element] frame, [stage description], flat 2-tone cel shading with a dark outline, centred on a plain #808080 background, no text, no frame border, game VFX sprite".

Worked example (the stand's anime explosion, `stand/textures/anime_fire_3x2.png`):
1. Five keyframes, generated with the Codex CLI image tool one at a time: birth, growth, peak, break-up, wisps. Frames 2 - 5 each got the previous frame attached with `-i` and the instruction to keep the style, palette, outline and centre. Stdin must be closed (`'' | codex exec ...`), or the CLI waits for input.
2. `python tools/packframes.py frame_1.png ... frame_5.png -o anime_fire_3x2.png --cell 320 --cols 3 --bg 808080` keys out the grey background with a soft edge, un-mixes the grey from the edge pixels, crops all frames to one shared box so the pivot stays fixed, and packs them.
3. In the effect: one hero quad, stepped, two drawings per keyframe, in the cel layer so it sorts with the cel puffs and gets the union outline.

Keying choices in `packframes.py`, by what the model painted:

| Backdrop / body | Flags | Why |
|---|---|---|
| Flat grey, coloured body (fire) | default (`--bg 808080`) | only backdrop connected to the image border is keyed |
| Grey smoke whose highlights match the grey | default, never `--holes` | flood keying keeps grey pixels inside the shape opaque |
| Drawn dissolve holes inside a puff | `--holes` | also keys enclosed backdrop-coloured regions of 30 px or more |
| Mottled or gradient backdrop (painted, realistic) | `--auto-bg --tol 0.03 --soft 0.06` | takes the backdrop colour and its noise from a border band per frame |

Always preview the packed sheet on the stand's sky and on black before wiring it: a grey fringe means `--soft` is too wide or the backdrop estimate is off; holes in the body mean `--tol` is too high.

Using a sheet in an effect:
- **Pivot:** the shared crop centres the union box, so a fire drawn growing from its base has its base near the cell bottom. Place the quad's centre about 0.4x its size above the ground, and keep it `upright` with no spin; a rotated flame reads as wind.
- **Value:** drawn and rendered greys arrive at mid value. Tint the ramp down to the style's smoke floor (dark fantasy 0.08 - 0.12) instead of regenerating.
- **Frame timing:** the growth keys are a small part of the effect's life. Play the sheet on an eased clock, `frame = age01^0.55..0.7 * frames`, so birth to peak takes 3 - 6 frames and the decay keys get the rest (the stand's `sheet.ease`). A linear clock puts the peak at a third of the life, which for a 1.5 s fireball is 0.5 s late.
- **Frame count:** image models give 5 - 8 keys; add optical-flow in-betweens (`packframes.py --inbetween 1`) so blended frames travel instead of cross-fading (`numbers.md` > Textures).
- **Variation:** 2 - 3 copies at different sizes and start delays, plus a few procedural sprites breaking the outline, so the drawn shape never reads as one stamp.

Sheets shipped with the stand (`stand/textures/`), usable as starting points under MIT: drawn (stepped) `anime_fire_3x2`, `anime_smoke_3x2`, `toon_puff_2x2`, `toon_fire_2x2`, `toon_smoke_3x2`; painted `stylized_fire_3x2`, `stylized_smoke_4x4`, `dark_fire_3x2`, `dark_smoke_4x4`; rendered-sim look with flat light `realism_fire_4x4`, `realism_smoke_4x4` (8 keys + flow in-betweens, 15 frames). The procedural `fire_4x4` and `puff_4x4` from `tools/texgen.py` are tier 0 - 1 fallbacks, not hero bodies.

## Life-map erosion (the cheapest designed shape)

One grayscale texture where each pixel's value is the time at which that pixel disappears (or appears). The shader thresholds it with a moving time, so one painted image gives a fully designed dissolve with controlled holes, tips and break-up:

```glsl
float t = age01;                       // 0 at birth, 1 at death
float m = texture(lifeMap, uv).r;      // painted: dark = dies first, bright = survives longest
float w = 0.08;                        // edge softness, 0.05 - 0.15; 0.0 with a step() for cel styles
float a = smoothstep(t, t + w, m);     // visible while m is above the moving threshold
float edge = a * (1.0 - smoothstep(t + w, t + 2.0 * w, m)); // band for a burn or outline colour
```

How to make a life map:
- **From a drawn silhouette:** distance to the edge (`scipy.ndimage.distance_transform_edt`), normalized, times 0.7, plus large-feature noise times 0.3. The shape erodes from its edges inward with noisy holes.
- **Painted:** brush the order in by hand (or ask an image model for a "grayscale erosion mask" of the shape). Tips and thin parts go dark so they burn off first; the core stays bright.
- **Appear and disappear:** use two ranges of one map (`t * 0.5` for growth reading the inverted map, then `0.5 + t * 0.5` for dissolve) or two maps.

This is how a single toon puff gets designed holes, or an anime fire tongue gets a drawn break-up, without drawing every frame.

## Quality checks

Before using any flipbook, check it as a contact sheet:

- **Growth.** Frame 1 is 30 - 50% of the peak size; the peak arrives by 20 - 30% of the frames. A sheet that starts at full size and only shrinks reads as a popping ball.
- **Coverage.** At least 85% of the frames have content. Empty tail frames waste resolution; trim them and retime.
- **Stability.** The centroid drifts less than 5% of the cell between frames, unless drift is intended (rising flames). The pivot is consistent.
- **No radial hot centre** on fire, unless it is a flash. A bright disc in the middle of every frame shows as concentric rings when tiled into a fireball (the fried-egg look).
- **Padding.** Every cell has an empty border; nothing touches the cell edge.
- **Loops.** For looping sheets, the last frame blends into the first without a jump.
- **Alpha.** Straight alpha unless the shader expects premultiplied. Know which one the engine import setting assumes.

## Using flipbooks in the shader

- Frame index from normalized age: `frame = age01 * frameCount`.
  - Stepped (no blending) for drawn sheets on a drawing grid.
  - Blended between two frames for sims, ideally with motion vectors.
- Randomize per particle: start frame (0 - 20%), flip X, rotation (±30 degrees for fire, any for smoke), playback rate (±15%). Twenty particles playing the same frame in sync read as a pattern.
- Grayscale sheets take colour from a ramp, by temperature for fire and by density or lighting for smoke.
