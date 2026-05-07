---
name: bootstrap-2d-webgl
description: Scaffold a 2D mini-game with WebGL acceleration (PixiJS or regl) for heavy sprite/particle counts. Use when the user wants bullet hell, danmaku, mass-particle effects, or expects >5k draw calls per frame.
---

## When to use

- User says "bullet hell", "danmaku", "thousands of bullets", "mass particles"
- Existing 2d-canvas game is hitting framerate ceilings under load
- User explicitly mentions PixiJS / WebGL2 / regl
- DO NOT use this for typical action games — `bootstrap-2d-canvas` is simpler

## Required reading

- `/CLAUDE.md` — design rules (esp. theme colors, leaderboard hooks)
- `/api/CLAUDE.md` — leaderboard contract

## Inputs

| Input        | Default                         | Notes                                  |
|--------------|---------------------------------|----------------------------------------|
| game id      | (ask)                           | lowercase                              |
| renderer     | `pixi`                          | `pixi` for sprites, `regl` for shaders |
| sprite count budget | `10000`                  | drives texture-atlas vs. per-sprite    |
| theme        | `{bg, accent, danger}`          |                                         |

## Recipe

1. **Engine sibling**: if `engine-2d-gl.js` does not exist, create it as a thin wrapper that mirrors `engine.js` lifecycle (`boot`, `onInit`, `onUpdate`, `onRender`, `onHud`, `setState`, `shake`, `audio`, `hud`, `particles`) but swaps the `<canvas>` 2d ctx for a Pixi `Application` or regl `gl` context. Keep the public surface identical so games are interchangeable. Do NOT couple to game logic.
2. Add CDN script tags in the new game HTML:
   - PixiJS: `<script src="https://cdn.jsdelivr.net/npm/pixi.js@8/dist/pixi.min.js"></script>`
   - regl:   `<script src="https://cdn.jsdelivr.net/npm/regl@2/dist/regl.min.js"></script>`
3. Copy `template.html` → `<game-id>.html`. Replace `<script src="engine.js"></script>` with `<script src="engine-2d-gl.js"></script>`. The `Engine.boot({...})` shape is unchanged.
4. In `onInit`, create the renderer-specific scene root (e.g., `engine.stage = new PIXI.Container()`). In `onRender`, the engine flushes the Pixi/regl frame.
5. **Particles**: replace `e.particles.emit(...)` calls only if profiling shows the canvas pool is the bottleneck. Pixi `ParticleContainer` or a regl point-sprite shader handles 10k+ particles cheaply.
6. Register in `api/leaderboard.js` `GAMES`, append to `index.html` portals, add Mt. Olympus tablet (same as 2d-canvas recipe).
7. Smoke-test under load: spawn the worst-case bullet count and confirm 60fps in Chrome DevTools perf profiler.

## Verification

- DevTools perf shows ≥58fps with the worst-case sprite count.
- Game lifecycle (title → playing → dead → leaderboard) works identically to a 2d-canvas game.
- WebGL context loss recovery: refresh during gameplay; engine reboots cleanly.

## Notes

- The 2d-webgl path is currently aspirational (no `engine-2d-gl.js` in repo). The first invocation creates it.
- Keep `engine.js` and `engine-2d-gl.js` API-compatible. If you need a renderer-only feature, expose it under `engine.gl.*` so 2d-canvas games can ignore it.

## Updates

| Date       | Change          | Author |
|------------|-----------------|--------|
| 2026-05-07 | Initial recipe. | jim    |
