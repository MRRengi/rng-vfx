# Motion quality

A strong design still looks cheap when its motion is rough. Players read polish from smoothness: shapes that ease, edges that stay clean, detail that moves with the shape. Most of this is invisible in single stills, so review it on consecutive frames (`../SKILL.md` step 5).

Contents: easing; continuity and flicker; stepped animation; birth and death; anti-aliasing and shimmer; fast motion; hit stop and camera shake; overlap; frame rate.

## Easing

Nothing in a good effect moves linearly. Bursts, rings and slashes arrive on fast-out curves (outExpo, outQuart): most of the size in the first few frames, then a slow settle, which is what makes a hit feel sudden and heavy. Fades and dissolves ease in at the end so the last part goes quickly. A linear grow or fade reads as mechanical.

## Continuity and flicker

Drive every value from continuous time. Random values re-rolled every frame (a new seed, a random size, a random rotation) make the effect flicker and boil; seed each particle once and animate from its age. Scroll and evolve noise smoothly, at a speed that matches the motion of the shape. When a shape has to change (a burst growing spikes, a puff breaking up), morph it continuously or cross-fade over a few frames instead of swapping one shape for another.

## Stepped animation

Drawn styles hold drawings (on twos or threes) because the whole game is drawn that way: pixel art and 2D games with hand-animated sprites. In a 3D game the characters and camera move smoothly, so a stepped effect against them reads as judder, and it gets worse whenever the display or capture rate does not divide the step evenly (60 fps on twos shown at 24 or 50 fps stutters irregularly). In 3D anime and stylized games keep the main shapes smooth; if you want a drawn feel, step only small details (spike lengths, sparkle positions) and keep the large silhouette continuous.

## Birth and death

- Elements other than the contact flash grow or fade in over 1 - 3 frames rather than appearing at full size; the flash is the one thing that pops, which is why it reads as the moment of contact.
- Spread particle births over a few frames so a burst unfolds instead of switching on.
- Elements leave by eroding, thinning, shrinking or fading on an eased curve, unevenly across a group. A whole layer vanishing on one frame is a visible pop.
- Keep the draw order of transparent layers stable; sort changes between layers or instances show as pops.

## Anti-aliasing and shimmer

- Anti-alias shader edges with `fwidth` (`alpha = 1 - smoothstep(-aa, aa, dist)`, `aa = fwidth(dist)`). Hard `step` edges crawl when the shape moves or scales.
- Post-processing chains often lose the renderer's default anti-aliasing: in three.js give the composer a multisampled target (`new WebGLRenderTarget(w, h, { samples: 4, type: HalfFloatType })`) or add an FXAA/SMAA pass; in engines keep TAA or MSAA on and check thin additive elements for ghosting.
- Thin lines and small sparks shimmer as they cross pixels; keep them above the minimum widths (`elements.md` > Reading at distance).
- Fine noise detail sparkles and boils at distance. Keep its features several pixels wide at the gameplay camera, or fade the detail out with distance.

## Fast motion

Anything moving more than a few pixels per frame strobes (reads as separate copies) unless it is stretched along its velocity or leaves a trail: velocity-stretched sparks, ribbon trails on projectiles and hero sparks, a smear on the slash's leading edge. The stretch length is about the distance moved in one to two frames.

## Hit stop and camera shake

- Hit stop freezes the attacker, the target and the contact elements for a few frames on heavy hits; when it releases, motion resumes on its curve instead of jumping ahead to catch up.
- Camera shake is smooth noise with a decaying envelope, a few pixels at its strongest and gone within 6 - 15 frames, biased along the hit direction. Per-frame random offsets read as a glitch, not an impact.

## Overlap

Layers start and end at slightly different times: the flash, then the burst, then rings, sparks and residue each with their own curve. Everything starting and stopping together looks like one switch being flipped.

## Frame rate

Animate from time in seconds, not frame counts, so the effect plays the same at 30, 60 or 144 fps and `seek(t)` renders the same frame every time. Timing tables in the style files are written in 60 fps frames for convenience.
