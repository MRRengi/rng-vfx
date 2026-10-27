# Pixel art

Dead Cells, Celeste, Blasphemous, Hyper Light Drifter, Enter the Gungeon, Owlboy. Effects live on the same pixel grid and palette as the sprites, drawn frame by frame.

**References to recall:** Dead Cells (weapon hits, explosions), Hyper Light Drifter (sword slashes, enemy deaths), Blasphemous (blood and hits), Enter the Gungeon (bullet impacts, explosions). Describe the matching one at contact, +2, +6 frames and the end before building.

## Look

- Effect pixels are the same size as sprite pixels and snap to the same grid: render at the game's native resolution (or a low-res target scaled up with nearest filtering), with positions snapped to whole pixels.
- The game's palette only: 4 - 8 colours per effect, including a dark outline colour and neutrals for smoke. No gradients, no bloom, no sub-pixel alpha; dissolve with ordered dither or by removing pixels.
- Drawn frames are the gold standard: a 4 - 8 frame sprite sheet per element at the sprite's resolution, played stepped at 10 - 15 frames per second. Procedural shapes are acceptable only if they snap to the grid and the palette.
- The hit cue is often a 1-frame full-white sprite flash on the target.
- Sparks and debris are 1 - 2 px squares or short pixel lines; never anti-aliased dots.

## Timing defaults (drawings at 10 - 15 per second)

| Layer | Drawings |
|---|---|
| Hit spark (star or plus) | 1 - 2 drawings big, gone by 3 |
| Sprite flash | exactly 1 drawing |
| Burst / ring | drawings 1 - 3 |
| Puffs (2 tones) | appear on 2, dither out by 5 - 7 |
| Explosion | white disc 1 drawing, fire cluster 2 - 4, smoke 4 - 10 |
| Debris squares | fly for 5 - 10 drawings, bounce once |

## Signature shapes

- Plus or 4-point star hit sparks with a dark outline, so they read over the white sprite flash.
- 2-tone puff clusters that dither out.
- Fire clusters taller than wide with pixel tongues, on the ground.
- Square debris.

## Failure modes in this style

- Smooth procedural circles and blobs instead of drawn shapes.
- Anti-aliased, sub-pixel or bloomed pixels; effect pixels a different size than sprite pixels.
- A yellow spark on a white sprite flash with no outline: invisible.
- Colours outside the palette, especially smoke mapped to a saturated hue because the palette has no neutrals.
- Contact off the drawing grid, so the contact drawing never shows.
