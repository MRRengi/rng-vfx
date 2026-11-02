# Effects animation craft

Principles that classical effects animators (Disney, Don Bluth; written down by Joseph Gilland in *Elemental Magic*) used for water, fire, smoke, explosions and magic. They hold in every style and engine, because they describe how energy looks when it moves matter. Read this when planning the primary shape and timing (`../SKILL.md` steps 3 - 4), and again when an effect looks stiff, mechanical or "CG".

Contents: animate the energy; designed shapes; the life of the energy; scale; choreography; cause and effect; exaggeration; role in the scene; magic.

## Animate the energy, not the things

An effect is energy made visible: a rock's impact moving water, hot air carrying soot, a shockwave throwing dirt. Before drawing a shape, name the force (impact, heat rising, pressure release, wind, gravity) and the material it moves (thin water, thick oil, soot, dust, glass, soil). The look comes from both: the same rock makes a lacy splash in water and a few heavy blobs in oatmeal. Ask what you would do if you were that water or that smoke and something hit you.

Every detail follows the path of action of that force. Droplets leave a splash along the splash's flowering trajectory, tears in a water sheet run along its direction of travel, cinders ride the arcs of the fire, fragments fly out along the blast's radial lines. Details that ignore the underlying flow read as random noise. Rough the flow first (a few strokes or curves), get it moving, then hang detail on it.

## Designed shapes

- **Silhouette first.** The primary shape must read alone; the secondary shapes live inside it. Detailing secondary shapes while the silhouette is weak produces a busy, confusing effect.
- **Large forms before detail.** Form comes from a few large shapes; detail rides on top of them. Sizes follow a power law: a few big masses define the shape, then progressively more and smaller pieces. Too much high-frequency detail (strong noise, turbulence, many overlapping sprites) eats the form. Test it by blurring the frame: if the silhouette disappears, it was never there.
- **No twinning.** Repeated similar shapes, mirror symmetry, parallel edges and even spacing are what make effects look generated. Give every cluster big, medium and small members; pinch and widen tapering shapes instead of keeping their edges parallel; break the silhouette asymmetrically even when the physics would be symmetric (a real blast expands almost evenly, a good one does not look like a snowman). This applies to timing too: equal intervals and simultaneous endings look mechanical.
- **Every boundary is designed.** An effect has boundaries in space: the ends of a trail, ribbon, beam or arc, the edges of a card, the line where it meets the ground. It also has boundaries in time: its first and last frames, and each element's birth and death. Each boundary is either shaped on purpose (a taper, a point, a frayed or eroding edge, a soft falloff) or invisible. A straight cut where a mesh, a texture or a timeline simply stops is the clearest sign of construction, and it reads as cheap. Ends taper over a real length (a slash narrows to a point and frays into wisps over the last part of its length). In time, things grow out of their source and leave on curves. The contact flash is the one deliberate hard edge.
- **The whole emerges from motion.** A hand-drawn effect draws its final silhouette; a real-time effect builds it from many elements. A still image of the final shape repeated on every particle never adds up to that shape, it reads as a pile of copies. The silhouette comes from something that moves: the motion of simple soft elements (a flame's teardrop from round blobs of heat rising, converging and shrinking as they cool, each blob itself round, with no tip and no direction), an animated sequence per element (a baked simulation or drawn frames, each particle at its own phase, size and rotation), or a shader field. The shape descriptions in these references (tongues, billows, crowns, sheets) describe what the whole should read as, not what to draw on one particle.
- **No icons.** Scalloped water, hot-rod flames, popcorn clouds and symmetric star bursts are symbols, not elements. Real water and fire have chunky, irregular, surprising shapes.
- **Interior tone describes volume.** Shadow or density bands inside smoke vary in width with the mass they describe; a band that just follows the outline flattens it.

## The life of the energy

Energy is strongest at the start and dies out, and the shapes show it: sharp, angular and straight while the energy is high, soft, rounded and languid as it fades. A splash starts as an explosion and ends as gentle ripples; a blast starts as radial streaks and ends as slow billows. At the first instant every explosion looks the same whatever the material, pure directional energy; the material's own character (water's sheets and drops, smoke's billows, glass's shards) appears as the energy drops off, further from the centre.

The first drawing of an impact or burst is already big and developed. Growing it over six or eight frames makes it slow and unreal.

## Scale

Scale is timing plus detail. Bigger events move slower after their explosive start, hang longer at the top of their arcs, and carry more internal detail; the same structure drawn with less detail and faster timing reads small. A candle flame has no break-off pieces because detail would make it read as a bonfire. A huge splash can hang in the air for seconds. To make a magic effect feel vast, slow it down a lot and add detail.

Hang time at the apex of a trajectory (slowing into it and out of it) is one of the strongest scale cues.

## Choreography

Nothing in an effect does the same thing at the same time. When a bottle smashes, some pieces bounce, some slide, some spin off through the air, and a few always land far away from the rest. Big pieces hang longer and rotate slower; small ones are quick. Layers overlap: the secondary jet of a splash rises while the primary falls; a second blast fires while the first is slowing. Overlapping timings and directions are what make an effect feel alive and steer the eye.

Give every element one job and let it behave accordingly. The fast directional burst lives a few frames and is gone; the smoke that lingers is a different element with its own soft, slow motion; dust that falls and dust that rises are separate too. One element stretched to do two jobs makes the burst sluggish and the residue wrong.

Rhythm can be planned by sound. Say the effect out loud ("ba-DOOM... shhh") and time the layers to it: the hit lands on the accent, and a secondary event (embers, a second pop, debris landing) comes after a pause about as long as a quick breath, so the effect seems to exhale instead of fizzling into one continuous blur. A pace faster than a heartbeat reads as aggressive; slower reads as calm or benign (heals, buffs).

## Cause and effect

One event triggers others. Fire means light on its surroundings and smoke; an explosion means light, debris and dust; a splash means ripples and bubbles; water on a fire means steam, thicker smoke, dying flames, a dimming light. The strongest force sets the path of the chaos, and secondary reactions bend around it.

Smoke, steam and dust can look identical at first and resolve differently: smoke keeps rising and lingers longest; steam vanishes into the air; dust is heavier and settles back down.

## Exaggeration

The most common mistake is not pushing far enough. Push the physics, motion, design and perspective; pulling an overdone effect back is easy, breathing life into a timid one is hard. Real explosions grow smoothly over 3 - 30 frames, and copied faithfully they feel lifeless; animated ones get anticipation, a faster expansion and a harder stop (`elements.md` > Explosions). Exaggeration happens inside the style: a realistic effect is exaggerated in timing and contrast, not by turning it into a cartoon.

## Role in the scene

Decide whether the effect is the star or a supporting player. Most effects support the action and must not upstage the character (a footstep splash, a torch); the star moments (an ultimate, a big explosion, a finishing blow) may own the frame. Either way the effect must look as if the same artist drew it as the characters and the world.

Length is part of the message: how long an effect stays on screen tells the player how much it matters, and anything lingering clutters the view and hides the next event. If an effect feels long, it is much too long. The energy is short; only quiet residue stays.

The same hierarchy holds inside an effect: the event is the star, and everything that follows it (marks, stains, smoke, lingering sparks) supports it. Residue arrives after the peak, sits behind or under the action and is quieter than it, so the eye reads the hit first and the aftermath second.

## Magic

Build magic on a natural element (smoke, water, fire, sparks, wind), then break its rules with an internal logic of its own. Smoke that rises, pauses as if sniffing the air, recoils and darts on reads as a spirit; anything that defies gravity reads as magic. The departure from physics is what tells the audience it is magic, and the internal consistency is what makes it believable. Spirals and vortices are a natural vocabulary for it.

Generated particles look cold because every particle follows the same rule. Give sparkles individual characters (some glimmer from a dot and pulse, some twirl while scaling, some twinkle at random, some wink in and out), vary their lifespans, split a trail into streams that spiral around each other, and let the trail change behaviour with the motion (falling curtains when drifting, a spray like a ski wake on a sharp turn, smoky billows, bubbles rising).
