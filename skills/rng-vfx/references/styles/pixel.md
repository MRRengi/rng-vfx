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
- **Posterize / palette mapping** in a final pass, or a palette lookup texture.
- **Square particles** whose size steps in whole pixels.
- **Stepped animation** at 8 to 12 fps for every effect parameter.
- **Sprite flash:** the hit target turns white or a palette color for 1 to 3 frames.
- **Dithered dissolve:** Bayer matrix threshold instead of smooth alpha.
- **Hand-drawn flipbooks:** the gold standard for pixel effects; small (32 to 128 px) frame sequences. An image model can draft them, then they are reduced to the palette.

## Default numbers

- Impact: plus or star flash 2 frames, ring 3 drawings, squares 3 - 5 drawings, puffs 4 - 6 drawings at 10 fps.
- Explosion: white disc 2 drawings, fire 5 - 8 drawings, smoke 8 - 11 drawings, debris pixels with gravity.

## Common mistakes

- Mixing high-res smooth particles with pixel art.
- Anti-aliasing and bilinear filtering on effect textures.
- Rotating sprites by arbitrary angles (pixels become uneven).
- Bloom haze that blurs the grid.
- Too many colors.
