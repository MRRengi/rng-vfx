# Pixel art

Reference points: Dead Cells, Celeste, Hyper Light Drifter, Enter the Gungeon, Blasphemous, Vampire Survivors, classic 16-bit games.

## What defines it

- **Pixel grid is law.** Effects live on the same pixel grid as the art. No sub-pixel motion, no rotated pixels, no mixed pixel sizes. Render low-res and upscale with nearest filtering, or snap positions and sizes to the grid.
- **Limited palette.** Effects use the game's palette, usually 3 to 6 colors per effect: white, a bright, a mid, a dark, maybe an outline.
- **Low frame rate animation.** 8 to 12 drawings per second, often hand-drawn frame by frame. Motion snaps.
- **Hard edges.** No soft alpha gradients. Transparency, if any, is dithered or on/off.
- **Chunky shapes and readable frames.** At low resolution each frame must still read: a plus-shaped flash, a 2-pixel ring, square particles.

## Color and value

- Pick colors from the game palette. A fire ramp might be white, yellow, orange, red, dark brown.
- Glow is drawn, not computed: a lighter ring of pixels around a core, or a palette-swap flash on the sprite.
- Bloom: usually off. If used, apply it before upscaling so it stays pixel aligned, and keep it subtle.

## Signature techniques

- **Low-res render target** at the game's native resolution, nearest-neighbour upscale.
- **Palette mapping, not posterize:** map each pixel to the nearest colour of a fixed 16 - 24 colour palette (distance in OKLab) in a final pass. Per-channel posterize produces up to 125 arbitrary colours and smears gradients into bands. Turn MSAA off for the low-res target; antialiased edges become noise when quantized.
- **Square particles** whose size steps in whole pixels, with centres snapped to the pixel grid (`ndc = floor(ndc * res / 2 + 0.5) / (res / 2)`) so they do not shimmer.
- **Strokes of 2 px or more** with a 1 px dark outline (edge detect on alpha in the low-res target, written with the darkest palette colour).
- **Stepped animation** at 8 to 12 fps for every effect parameter.
- **Sprite flash (mandatory):** the hit target turns full palette white for exactly 1 drawing, the shortest step the drawing grid allows; a longer white reads as a white-out. It is the single most important pixel hit cue.
- **No smooth light falloff on the floor.** Quantized point-light falloff bands into rings. Use a flat floor and dithered light-pool sprites instead.
- **Dithered dissolve:** Bayer matrix threshold instead of smooth alpha.
- **Hand-drawn flipbooks:** the gold standard for pixel effects; small (32 to 128 px) frame sequences. An image model can draft keyframes (`recipes/flipbooks.md`), which are then redrawn at sprite resolution and reduced to the palette.

## Default numbers

- Timings and sizes: `numbers.md` > Pixel.
- Effects drawn at the sprites' pixel density, never finer; palette of the game, never extra colours.

## Common mistakes

- Mixing high-res smooth particles with pixel art.
- Anti-aliasing and bilinear filtering on effect textures.
- Rotating sprites by arbitrary angles (pixels become uneven).
- Bloom haze that blurs the grid.
- Too many colors.
- A palette with no neutral greys: smoke snaps to the nearest saturated colour (often purple or brown). Include 3 - 4 neutrals.
- Shadow and light colours one step apart: they merge after quantization. Keep 2 steps of value between them.
