# Sources

The notes in this skill are written in our own words. These are the works they draw on and the places to go deeper. Nothing here is copied from them.

## Books

- Joseph Gilland, *Elemental Magic: The Art of Special Effects Animation* (Volume I) and *Elemental Magic Volume II: The Technique of Special Effects Animation*. Hand-drawn effects animation: fire, water, smoke, explosions, magic; timing, shape and design of 2D effects. The foundation for the anime, toon and pixel notes.
- Frank Thomas and Ollie Johnston, *The Illusion of Life: Disney Animation*. The principles of animation (timing, anticipation, squash and stretch, follow-through) that effects timing rests on.
- Tomas Akenine-Möller, Eric Haines, Naty Hoffman and others, *Real-Time Rendering* (4th edition). Blending, transparency, particles, post-processing, performance.
- Matt Pharr, Wenzel Jakob, Greg Humphreys, *Physically Based Rendering* (free online at pbr-book.org). Light transport, blackbody emission, volumes.
- Robert Bridson, *Fluid Simulation for Computer Graphics*. How smoke, fire and liquids actually move; buoyancy, vorticity.
- Randima Fernando (ed.) and others, *GPU Gems* 1 to 3 (free on NVIDIA's developer site). GPU particles, fast fluid dynamics on the GPU, effects techniques.
- Patricio Gonzalez Vivo and Jen Lowe, *The Book of Shaders* (free online). Shaping functions, noise, patterns.

## Papers

- Jos Stam, *Stable Fluids*, SIGGRAPH 1999. The basis of real-time grid fluids.
- Robert Bridson, Jim Hourihan, Marcus Nordenstam, *Curl-Noise for Procedural Fluid Flow*, SIGGRAPH 2007. Divergence-free turbulence for particles.
- Ken Perlin, *Improving Noise*, SIGGRAPH 2002.

## Talks and guides from studios

- Riot Games, *League of Legends VFX Style Guide* (public PDF) and the "/dev: League's VFX Style Guide" article: gameplay clarity, value ranges, color, shape language, timing. https://nexus.leagueoflegends.com/en-us/2017/10/dev-leagues-vfx-style-guide/
- Junya C. Motomura (Arc System Works), *GuiltyGearXrd's Art Style: The X Factor Between 2D and 3D*, GDC 2015, talk and English handout published by Arc System Works. https://arcsystemworks.com/?p=823
- Epic Games, Niagara documentation and the free Niagara Examples Pack for UE 5.7. https://dev.epicgames.com/documentation/en-us/unreal-engine/creating-visual-effects-in-niagara-for-unreal-engine
- Epic Games, Movie Render Queue command line rendering. https://dev.epicgames.com/documentation/en-us/unreal-engine/using-command-line-rendering-with-move-render-queue-in-unreal-engine
- Unity, Visual Effect Graph and Shader Graph manuals (docs.unity3d.com).

## Communities and tutorials

- Real Time VFX community (realtimevfx.com): breakdowns, sketchbooks, feedback threads by working VFX artists.
- Inigo Quilez's articles (iquilezles.org): signed distance functions, noise, smooth minimum.
- Catlike Coding (catlikecoding.com): Unity shaders and rendering from first principles.
- Simon Trümpler's technical art breakdowns of shipped games (simonschreibt.de).

## Tools

- EffectTextureMaker by mebiusbox: browser VFX texture generator; generated textures are CC0. https://mebiusbox.github.io/en/docs/lab/effect_texture_maker
- JangaFX EmberGen, SideFX Houdini, Blender: simulation for flipbooks.
- three.js (MIT), lil-gui (MIT): used by the stand.
