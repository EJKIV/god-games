---
name: add-3d-polish
description: Build a Three.js polish library that mirrors manga/fx — camera shake (camera offset), hit flash (material emissive bump), slow-mo (clock scale), screen punch (camera FOV pulse). Use when scaffolding the first 3D polish effects, or when porting a 2D game to 3D.
---

## When to use

- User has just bootstrapped a 3D game (`bootstrap/3d`) and wants polish
- User is porting a 2D game and the 2D `manga/fx` doesn't translate
- DO NOT use this to add a *single* 3D effect to an existing manga-3d library — that's a vanilla edit

## Required reading

- `/manga/CLAUDE.md` — the contract being mirrored
- `bootstrap/3d` SKILL.md — the Three.js engine sibling

## Inputs

| Input              | Default                          | Notes                                          |
|--------------------|----------------------------------|------------------------------------------------|
| target directory   | `manga-3d/`                      | sibling of `manga/`                             |
| starter set        | `cameraShake, hitFlash, slomo, fovPunch` |                                          |

## Recipe

1. **Create** `manga-3d/` if it does not exist. Mirror the structure of `manga/`:
   - `manga-3d/manga3d.js` — loader (lists files, injects scripts in order)
   - `manga-3d/fx/` — stateful factories
   - `manga-3d/effects/` — stateless one-shot helpers
   - `manga-3d/characters/` — Three.js Group factories per character (later)
   - `manga-3d/README.md` — public API
   - `manga-3d/CLAUDE.md` — subtree router (mirrors `/manga/CLAUDE.md`)
2. **Init guard** at the top of every sub-file:
   ```js
   const M3 = (window.Manga3D = window.Manga3D || { effects:{}, fx:{}, characters:{} });
   ```
3. **Starter fx — implement these four**:
   - `cameraShake()` → factory. `.trigger(amount, duration)`. `.apply(camera)` adds a small per-frame random offset to camera position; `.update(dt)` decays.
   - `hitFlash()` → factory. `.trigger(material, color, duration)`. `.update(dt)` ramps `material.emissive` from `color` back to original.
   - `slomo()` → factory. `.trigger(factor, duration)`. `.scaleDt(dt)` returns scaled dt; engine clock multiplier.
   - `fovPunch()` → factory. `.trigger(amount, duration)`. `.apply(camera)` pulses `camera.fov` then settles back; calls `camera.updateProjectionMatrix()`.
4. **Stateless effects**: e.g., `screenFlash(renderer, color, alpha)` overlays a fullscreen colored quad for one frame.
5. **Engine integration**: `engine-3d.js` exposes a hook `engine.fx = Manga3D` so games can call `engine.fx.cameraShake()` to get a fresh instance.
6. **Document** the API in `manga-3d/README.md`. Show one usage example per fx.
7. **Smoke-test**: in a 3D game, trigger each fx and visually confirm the effect.

## Verification

- All four starter fx work in a 3D game without crashes.
- Two instances of the same fx don't interfere (factory pattern enforced).
- A 2D game ported to 3D can replace `Manga.fx.cameraPunch()` calls with `Manga3D.fx.cameraShake()` and feel comparably alive.
- `manga-3d/CLAUDE.md` exists and tells future Claude how to extend the library.

## Pairs well with

- `bootstrap/3d` (run first)
- `port-2d-to-3d` (often invoked together)

## Updates

| Date       | Change          | Author |
|------------|-----------------|--------|
| 2026-05-07 | Initial recipe. | jim    |
