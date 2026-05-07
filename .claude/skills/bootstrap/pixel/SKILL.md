---
name: bootstrap-pixel
description: Scaffold a retro pixel-art mini-game with palette + grid lock on top of the 2d-canvas engine. Use when the user wants a chunky retro look (NES/SNES-era), tilemap platformer, or pixel-perfect roguelike.
---

## When to use

- User says "pixel art", "retro", "NES", "8-bit", "16-bit", "chunky pixels"
- Game design uses a tilemap (platformer, roguelike, top-down RPG)
- DO NOT use for smooth-vector look or particle-heavy action — use plain `2d-canvas`

## Required reading

- `/CLAUDE.md`
- `/api/CLAUDE.md`

## Inputs

| Input          | Default                                    | Notes                                      |
|----------------|--------------------------------------------|--------------------------------------------|
| game id        | (ask)                                      |                                            |
| internal res   | `320x180`                                  | logical pixel grid; canvas scales up       |
| palette        | `(ask)` 8–16 hex colors                    | enforce: only these colors in the game     |
| tile size      | `16`                                       | px in internal res                         |
| theme          | `{bg, accent, danger}`                     | must be palette members                    |

## Recipe

1. **Engine mixin**: ensure `pixel.js` exists (a tiny add-on to `engine.js`, not a sibling). It exposes:
   - `Engine.pixel.setMode({width, height, palette})` — switches engine to logical-pixel mode and disables image smoothing
   - `Engine.pixel.assertColor(c)` — throws if a non-palette color is used (dev only)
   - `Engine.pixel.tileMap(grid, tileFns)` — draws a tile grid at the logical resolution
   If `pixel.js` does not exist, create it and include with `<script src="pixel.js"></script>` after `engine.js`.
2. Copy `template.html` → `<game-id>.html`. After `Engine.boot({...})`, call `Engine.pixel.setMode({ width:320, height:180, palette:[...] })`.
3. In CSS, set `image-rendering: pixelated; image-rendering: crisp-edges;` on the canvas so the upscaled pixels are crisp.
4. Build a tilemap in `onInit`: `world = Engine.pixel.tileMap(grid, { '#': drawWall, '.': drawFloor, ... })`. Each tile draw fn renders at internal resolution; the engine handles the upscale.
5. **Sprites**: draw at integer coordinates only. Movement may use floats internally but `Math.floor(x)` before drawing.
6. **Audio**: switch `Engine.audio.tone(...)` to `'square'` waveform with shorter durations for chiptune feel.
7. Register in `api/leaderboard.js` `GAMES`, append to `index.html` portals, add Mt. Olympus tablet.

## Verification

- Canvas displays pixel-perfect (no blurring or sub-pixel sampling at any zoom level).
- All visible colors are members of the declared palette (use `Engine.pixel.assertColor` in dev to enforce).
- Game runs at 60fps and physics is reproducible across machines (integer-snapped positions).
- Mobile: dpad and action buttons render at the upscaled resolution without misalignment.

## Notes

- `pixel.js` doesn't exist yet. First invocation creates it.
- Keep the engine-side change *minimal* — `pixel.js` is an opt-in mixin that toggles smoothing + provides palette/tile helpers, not a full engine fork.
- Recommended starter palettes: PICO-8 (16 colors), DawnBringer 16, NES 64-of-which-54-distinct.

## Updates

| Date       | Change          | Author |
|------------|-----------------|--------|
| 2026-05-07 | Initial recipe. | jim    |
