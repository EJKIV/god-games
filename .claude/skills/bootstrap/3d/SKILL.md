---
name: bootstrap-3d
description: Scaffold a 3D mini-game using Three.js. Use when the user wants a 3D boss arena, racing, exploration, FPS, or third-person action game.
---

## When to use

- User says "3D", "Three.js", "first-person", "third-person", "boss arena"
- The game design needs camera + perspective (orbiting, chasing, FPS)
- DO NOT use for stylized top-down (`2-5d-iso`) or sprite-heavy 2D action (`2d-canvas`)

## Required reading

- `/CLAUDE.md` — leaderboard hook, theme palette, mobile contract
- `/api/CLAUDE.md` — leaderboard registration

## Inputs

| Input        | Default                              | Notes                                            |
|--------------|--------------------------------------|--------------------------------------------------|
| game id      | (ask)                                |                                                  |
| camera       | `third-person`                       | `first-person` / `third-person` / `orbit`        |
| theme        | `{bg, accent, danger, fog}`          | fog color usually = bg                            |
| scene scale  | `1` unit = `1` meter                 | keep it consistent for physics later             |
| three version| `r170`                               | pin to a specific release for reproducibility    |

## Recipe

1. **Engine sibling**: if `engine-3d.js` does not exist, create it. Mirrors `engine.js` lifecycle and exposes:
   - `engine.three.scene`, `engine.three.camera`, `engine.three.renderer` (WebGLRenderer)
   - `engine.three.raycaster` for click/tap targeting
   - `engine.shake(amount)` → applies camera offset (engine handles decay)
   - `engine.audio` unchanged (Web Audio API works the same)
   - `engine.hud` overlays a 2D `<canvas>` on top of the WebGL canvas — HUD rendering stays 2D
2. Add Three.js CDN script: `<script type="importmap">{"imports":{"three":"https://unpkg.com/three@0.170.0/build/three.module.js"}}</script>` then `<script type="module" src="engine-3d.js"></script>`.
3. Copy `template.html` → `<game-id>.html`. Replace `<script src="engine.js">` with the importmap + module variants. `Engine.boot({...})` shape is unchanged but `onRender(engine)` no longer takes `ctx` — the engine flushes the WebGL frame.
4. In `onInit`, build the scene: lights (ambient + directional), ground plane, player mesh, fog. Use the theme palette for material colors and fog.
5. In `onUpdate`, move the player in world coords and update the camera (`third-person` chases, `first-person` parents to player head, `orbit` rotates around target).
6. **HUD** stays 2D: implement `onHud(ctx, e)` exactly as in 2d-canvas. Engine renders it on the overlay canvas above the WebGL frame.
7. **Mobile**: dpad → world-space movement; first-person needs a right-side touch zone for camera look (engine adds this when `mobile.camera: 'look'`).
8. Register in `api/leaderboard.js` `GAMES`, append to `index.html` portals, add Mt. Olympus tablet.

## Verification

- Scene renders at 60fps on a mid-range laptop with a few hundred meshes.
- Player movement + camera follow feels smooth (no jitter, no clipping into ground).
- HUD overlay (hearts, score) renders crisply over the 3D scene.
- Death → leaderboard submission works (same POST shape as 2D games).
- Window resize: WebGL canvas + HUD canvas both rescale; aspect ratio stays correct.

## Notes

- `engine-3d.js` does not exist yet. First invocation creates it.
- Keep the lifecycle contract identical to `engine.js` — game files written for 2d-canvas should be 80% portable.
- For polish (hit-flash, slow-mo, screen punch), use `manga-3d/` (build via `add-3d-polish` skill) — the 2D `manga/fx` doesn't translate directly.

## Updates

| Date       | Change          | Author |
|------------|-----------------|--------|
| 2026-05-07 | Initial recipe. | jim    |
