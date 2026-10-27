# Unity

Covers URP (most common), HDRP and the Built-in pipeline where they differ.

Contents: pick the system; shader graph for vfx; vfx graph; particle system (shuriken); brightness, materials and sorting; temporal anti-aliasing; lights, decals, camera; authoring and timing; headless frame strips (no play mode); performance notes.

## Pick the system

| Need | Use |
|---|---|
| Thousands of particles, GPU sim, trails as strips, events, SDF / depth collision | **VFX Graph** (URP, HDRP; needs compute shaders) |
| Mobile and WebGL, physics collisions with colliders, CPU access to particles, small counts | **Particle System (Shuriken)** |
| Meshes with animated shaders (slashes, domes, beams, shields) | MeshRenderer + Shader Graph material, animated by Animator, Timeline or script |
| Screen effects (impact frame, chromatic pulse, flash) | URP Renderer Feature or Volume overrides; HDRP Custom Pass |

WebGL builds: VFX Graph does not run on WebGL; use Shuriken there. Unity 6's WebGPU backend (experimental) supports compute and can run VFX Graph; use it only when the project already targets WebGPU and keeps a WebGL fallback.

## Shader Graph for VFX

- Graph type: Unlit (URP) or Unlit / HDRP Unlit; Surface Transparent; Blend Additive, Alpha or Premultiply; Render Face Both for flat meshes; Depth Write off.
- For VFX Graph outputs, enable the **VFX Graph** support in the Shader Graph target ("Support VFX Graph") and pick the graph in the output context.
- Particle data in Shader Graph with Shuriken: enable **Custom Vertex Streams** in the Renderer module and add the streams you need (AgePercent, StableRandom, Custom1); Unity packs them into texture coordinate channels in order, as described below, and you read them through the UV nodes.
- Opaque Texture (URP asset) must be on for Scene Color (distortion); Depth Texture on for Scene Depth (soft particles, intersection glow).
- Keep HDR on in the URP asset and on cameras so emission above 1 reaches bloom.

## VFX Graph

- Contexts: Spawn (bursts, rates) -> Initialize (position, velocity, lifetime, size, color, custom attributes) -> Update (forces, turbulence, collision, aging) -> Output (quad, mesh, strip, decal).
- Bursts: Single Burst in Spawn; for layered effects use one system per effect with several Spawn contexts (flash, sparks, smoke) and set delays per Spawn.
- Exposed properties and **Event** attributes (`OnPlay` with a payload) let gameplay pass position, direction, color and intensity per instance.
- Useful blocks: Turbulence (curl-like noise), Linear Drag, Gravity, Conform to Sphere / SDF, Collide with Depth Buffer, Trigger Event on Die (secondary sparks, splashes), Orient: Along Velocity (stretched sparks), Flipbook Player.
- Strips (Particle Strip outputs) for trails and ribbons.
- Set **Bounds** correctly (or Recorded bounds); wrong bounds make effects cull or pop.
- Six-way smoke lighting output is available in recent versions for lit smoke flipbooks.
- Instancing of VFX Graph is supported in Unity 6 and reduces cost of many identical effects.

## Particle System (Shuriken)

- One parent system with child systems per layer; Sub Emitters for birth / death / collision spawns.
- Modules worth knowing: Velocity / Limit Velocity over Lifetime (drag), Noise (turbulence), Collision (world, with bounce and lifetime loss), Trails (ribbons), Texture Sheet Animation (flipbooks, with frame-over-time curves for stepped playback), Custom Data (curves into the shader), Lights (spawns real lights for a ratio of particles).
- Stretched Billboard render mode for sparks; set Speed Scale and Length Scale.
- Use **Stop Action: Disable / Callback** and pool effects; instantiating effect prefabs per hit causes spikes.

## Brightness, materials and sorting

- **HDR colour picker:** intensity is in stops; +1 doubles the value. URP's bloom threshold is in gamma space (0.9 is about 0.79 linear) and compares the brightest channel, not luminance. With the default 0.9, a core at 2 B is about intensity +0.66, a body at 0.7 B about -0.86 relative to 1.0. Write the levels from `../brightness.md` in these terms. HDR must be on in the URP asset and on the camera.
- **Lock exposure while designing in HDRP** (Exposure override: Fixed), or values drift between scenes.
- **URP Particles shaders** (Particles/Unlit, Particles/Lit):
  - Blending Mode: Alpha, Premultiply, Additive or Multiply.
  - Advanced options: Flip-Book Blending, Soft Particles (needs Depth Texture on in the URP asset), Camera Fading (stops quads popping into the near plane), Distortion (needs Opaque Texture).
  - These cover most billboard needs before writing a Shader Graph.
- **Custom Vertex Streams** (Shuriken Renderer module):
  - Add the streams the shader needs: AgePercent, StableRandom.x, Custom1/Custom2 (Custom Data curves), Velocity, AnimBlend for flipbook blending.
  - Unity packs them into TEXCOORD channels in order and prints the mapping next to each stream (for example `UV2 + AnimBlend (TEXCOORD0.zw|x)`). Read that label and sample the same channels with UV nodes in Shader Graph.
  - A mismatch silently gives garbage values.
- **Max Particle Size** (Renderer module) defaults to 0.5 of the viewport: big particles near the camera stop growing. Raise it for large effects.
- **Sorting:**
  - Between systems: *Sorting Fudge* (Renderer module; lower values draw later) and the material's render queue or Sorting Priority.
  - Within a system: *Sort Mode* (By Distance for alpha smoke, Youngest in Front for bursts).
  - VFX Graph outputs have their own Sort option (sort particles by distance) and a Sorting Priority.
- **VFX Graph outputs:**
  - Output Particle Unlit Quad / Lit Quad (lit smoke in HDRP, or URP with Lit outputs);
  - Output Particle Mesh;
  - Output ParticleStrip Quad (trails, slashes following a socket);
  - Output Particle Six-way Smoke (recent versions) for six-way lightmapped flipbooks.

## Temporal anti-aliasing

TAA (HDRP, and URP in recent versions) smears thin fast sparks and blends flipbook frames.
- **HDRP:** enable *Transparent Writes Motion Vectors* on materials of fast elements so TAA reprojects them.
- **URP:** prefer SMAA or FXAA on cameras that show heavy effects. Otherwise keep sparks at least 2 px wide so the history does not erase them.
- Always review strips with the project's real anti-aliasing on.

## Lights, decals, camera

- Short light flash: a Light with an animation curve, or the Shuriken Lights module. VFX Graph does not spawn lights; add a Light component driven by the same timeline.
- Decals: URP Decal Projector (enable the Decal renderer feature), HDRP Decal Projector. Animate a fade or erosion parameter on the decal material.
- Camera shake: Cinemachine Impulse Source + Impulse Listener. Shape the impulse to the hit direction.
- Hitstop: scale `Time.timeScale` or the Animator speed of attacker and target for a few frames; keep the VFX on unscaled time if it should continue.
- Impact frame and color pulses: a Renderer Feature with a full-screen pass, or a Volume with a weight curve.

## Authoring and timing

- Timeline is the best place to time multi-part effects: Control Tracks for particle systems and VFX, Animation Tracks for lights and materials, Activation Tracks for meshes.
- Prefab per effect, pooled, with a single entry component (`Play(position, direction, intensity)`).
- Stepped (held) animation: drive the shader time and particle simulation with a quantized time, or use Texture Sheet Animation with constant frame curves; for VFX Graph pass a quantized time as a property.

## Headless frame strips (no Play mode)

Effects can be sampled at exact times in the editor without entering Play mode, which makes them checkable in batch mode by an agent. Shuriken: `ParticleSystem.Simulate(time, withChildren: true, restart: true, fixedTimeStep: true)`. VFX Graph: `VisualEffect.Reinit()` then `VisualEffect.Simulate(stepDeltaTime, stepCount)`. Those steps are queued and applied by the VFX manager on its next update, so rendering right after `Simulate` captures stale particles; the script below renders one editor update later. Timeline: set `PlayableDirector.time` and call `Evaluate()`. Then render a camera into a RenderTexture.

```csharp
// Editor/FxStrip.cs - run with (no -quit: the script exits itself when done):
// Unity -batchmode -projectPath <project> -executeMethod FxStrip.Run
//   -fxPrefab Assets/FX/Hit.prefab -fxOut Temp/hit_strip.png -fxDuration 1.0 -fxFrames 8 -logFile -
// Do not pass -nographics: rendering needs a graphics device.
using System.Globalization;
using System.IO;
using UnityEditor;
using UnityEngine;
using UnityEngine.VFX;

public static class FxStrip
{
    static GameObject root;
    static Camera cam;
    static RenderTexture rt;
    static Texture2D strip, frame;
    static ParticleSystem[] shuriken;
    static VisualEffect[] graphs;
    static UnityEngine.Playables.PlayableDirector director;
    static string outPath;
    static float duration;
    static int frames, index, phase;
    const int W = 480, H = 320;

    public static void Run()
    {
        var args = System.Environment.GetCommandLineArgs();
        var prefab = AssetDatabase.LoadAssetAtPath<GameObject>(Arg(args, "-fxPrefab"));
        outPath = Arg(args, "-fxOut") ?? "Temp/fx_strip.png";
        duration = float.Parse(Arg(args, "-fxDuration") ?? "1", CultureInfo.InvariantCulture);
        frames = int.Parse(Arg(args, "-fxFrames") ?? "8", CultureInfo.InvariantCulture);

        root = (GameObject)PrefabUtility.InstantiatePrefab(prefab);
        cam = new GameObject("FxStripCamera").AddComponent<Camera>();
        cam.transform.position = new Vector3(0f, 1.7f, -4.8f);
        cam.transform.LookAt(new Vector3(0f, 1.1f, 0f));
        cam.clearFlags = CameraClearFlags.SolidColor;
        cam.backgroundColor = new Color(0.05f, 0.05f, 0.07f);
        cam.allowHDR = true;
        rt = new RenderTexture(W, H, 24, RenderTextureFormat.DefaultHDR);
        cam.targetTexture = rt;
        strip = new Texture2D(W * frames, H, TextureFormat.RGB24, false);
        frame = new Texture2D(W, H, TextureFormat.RGB24, false);
        shuriken = root.GetComponentsInChildren<ParticleSystem>();
        graphs = root.GetComponentsInChildren<VisualEffect>();
        director = root.GetComponentInChildren<UnityEngine.Playables.PlayableDirector>();
        index = 0;
        phase = 0;
        EditorApplication.update += Step;
    }

    // Phase 0 sets the time; phase 1 (one editor update later, after the VFX manager has
    // applied the queued Simulate steps) renders and reads back.
    static void Step()
    {
        if (phase == 0)
        {
            float t = duration * index / Mathf.Max(1, frames - 1);
            if (director != null) { director.time = t; director.Evaluate(); }
            foreach (var ps in shuriken)
                if (ps.transform.parent == null || ps.transform.parent.GetComponentInParent<ParticleSystem>() == null)
                    ps.Simulate(t, true, true, true);
            foreach (var vfx in graphs)
            {
                vfx.Reinit();
                vfx.Simulate(1f / 60f, (uint)Mathf.RoundToInt(t * 60f));
            }
            EditorApplication.QueuePlayerLoopUpdate();
            phase = 1;
            return;
        }
        cam.Render();
        RenderTexture.active = rt;
        frame.ReadPixels(new Rect(0, 0, W, H), 0, 0);
        frame.Apply();
        strip.SetPixels(index * W, 0, W, H, frame.GetPixels());
        RenderTexture.active = null;
        phase = 0;
        if (++index < frames) return;

        EditorApplication.update -= Step;
        strip.Apply();
        Directory.CreateDirectory(Path.GetDirectoryName(outPath));
        File.WriteAllBytes(outPath, strip.EncodeToPNG());
        Object.DestroyImmediate(cam.gameObject);
        Object.DestroyImmediate(root);
        Debug.Log($"FxStrip wrote {outPath}");
        EditorApplication.Exit(0);
    }

    static string Arg(string[] args, string name)
    {
        int i = System.Array.IndexOf(args, name);
        return i >= 0 && i + 1 < args.Length ? args[i + 1] : null;
    }
}
```

Check the first strip yourself: if VFX Graph frames are empty or all show the same particles while Shuriken frames move, the manager did not tick between steps in your Unity version; add a second wait phase, or record those frames in Play mode with the Recorder package.

Notes: render into an HDR target (`DefaultHDR`) so bloom and tone mapping have real values to work with; `ReadPixels` into an RGB24 texture then stores the tone-mapped result. Post-processing (bloom, tone mapping) only appears if the camera has a URP / HDRP camera data component with post-processing enabled and a Volume in the scene; set them up in a small review scene (ground, a character-sized capsule, the gameplay camera, the game's Volume) and load that scene first (`EditorSceneManager.OpenScene`) for renders that match the game. Effects driven by gameplay scripts (not particles or Timeline) need their update method made callable with an explicit time to be sampled this way, which is good practice anyway.

For video, render more frames at 30 or 60 fps into a folder and assemble with ffmpeg: `ffmpeg -framerate 60 -i frame_%04d.png -c:v libx264 -pix_fmt yuv420p out.mp4`.

## Performance notes

- Overdraw is the main cost. Fewer, smaller, more opaque particles beat many large transparent ones. Check with the Scene view Overdraw mode or the Rendering Debugger.
- GPU particles are cheap to simulate; their fill rate is not.
- Mobile: prefer Shuriken, avoid Scene Color distortion, keep textures 256 or smaller, use alpha-tested or opaque shapes where possible.
