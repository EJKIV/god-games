---
name: bootstrap-2-5d-iso
description: Scaffold a top-down isometric mini-game with depth sorting (Hades-style, dungeon crawl, RPG). Use when the user wants overhead exploration with floor tiles, stacked sprites, and depth ordering — but not full 3D.
---

## When to use

- User says "isometric", "top-down with depth", "Hades-style", "dungeon crawl"
- Game has rooms/floors/walls that the player walks around
- User wants the look of 3D without a 3D engine's complexity
- DO NOT use for pure side-view or pure top-down with no Z-stacking — use 2d-canvas instead

## Required reading

- `/CLAUDE.md`
- `/api/CLAUDE.md`
- Optional: `/manga/CLAUDE.md` if reusing manga character draws (note: characters render as flat top-down by default; iso projection happens at engine level)

## Inputs

| Input        | Default                         | Notes                                            |
|--------------|---------------------------------|--------------------------------------------------|
| game id      | (ask)                           |                                                  |
| tile size    | `64`                            | px per iso diamond edge                          |
| projection   | `2:1`                           | classic dimetric. `1:1` for true isometric       |
| theme        | `{bg, accent, danger}`          |                                                  |
| world size   | `(ask)`                         | tile w × h; small first room ~12×12              |

## Recipe

1. **Engine sibling**: if `engine-iso.js` does not exist, create it. It exposes the same lifecycle as `engine.js` plus:
   - `engine.iso.worldToScreen(x, y, z) → {sx, sy}` and inverse
   - `engine.iso.depthSort(entities)` — stable sort by `(y + z*0.5)` so taller things hide shorter ones behind them
   - `engine.iso.drawTile(ctx, tx, ty, fillFn)` — strokes a diamond and fills it
2. Copy `template.html` → `<game-id>.html`. Change `<script src="engine.js">` → `<script src="engine-iso.js">`.
3. In `onInit`, build the tile grid: `world = { tiles: [...], entities: [player, ...] }`. Each entity has `{x, y, z, draw(ctx, screen)}`.
4. In `onUpdate`, move entities in world coords (not screen coords). Camera follows player in world space; engine handles iso projection.
5. In `onRender`, call `engine.iso.depthSort(entities)`, then iterate and call each entity's `draw(ctx, screen)` where `screen = engine.iso.worldToScreen(e.x, e.y, e.z)`.
6. **Mobile**: dpad maps to world-space `±x` / `±y`, NOT screen. The engine remaps automatically if you set `mobile.movement: 'iso'`.
7. Register in `api/leaderboard.js` `GAMES`, append to `index.html` portals, add Mt. Olympus tablet.

## Verification

- Tall entity (e.g. column) correctly occludes short entity behind it; the same column is correctly hidden by something taller in front.
- Player walks past a wall: player passes behind it without z-fighting flicker.
- Camera stays centered on player in world coords; rotation/zoom (if added) doesn't break depth sort.

## Notes

- `engine-iso.js` does not exist yet. First invocation creates it.
- Keep tile rendering separate from entity rendering — tiles draw first (always-behind), entities go through depth sort.

## Updates

| Date       | Change          | Author |
|------------|-----------------|--------|
| 2026-05-07 | Initial recipe. | jim    |
