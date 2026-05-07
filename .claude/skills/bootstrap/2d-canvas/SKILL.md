---
name: bootstrap-2d-canvas
description: Scaffold a new 2D-canvas mini-game using the existing shared engine.js — the project's default rendering path. Use when the user wants a top-down or side-view action/arcade game (twitch action, bullet hell, platformer, wave survival).
---

## When to use

- User says "add a new game" / "make a new mini-game" without specifying 3D
- The game is a top-down or side-view canvas game (most God Games entries so far)
- User has not asked for pixel-art, isometric, or shader-driven look

## Required reading

Read these first; do NOT duplicate their content into the new game file.

- `/CLAUDE.md` — root project contract
- `/api/CLAUDE.md` — leaderboard registration
- `/manga/CLAUDE.md` — *only if* the game will use manga polish

## Inputs

| Input        | Default                         | Notes                                  |
|--------------|---------------------------------|----------------------------------------|
| game id      | (ask)                           | lowercase, matches filename            |
| display name | (ask)                           | shown in title screen                  |
| theme        | `{bg, accent, danger}`          | hex colors per root design rules       |
| score order  | `desc`                          | leaderboard sort (`desc` for points, `asc` for time) |
| score range  | `0..10_000_000`                 | min/max passed to leaderboard          |
| controls     | `←→` move, `Z` action           | extend `mobile.actions` to match       |

## Recipe

1. Copy `template.html` → `<game-id>.html`. Update `<title>`, `Engine.boot` config (title/subtitle/instructions/dead/victory/theme/mobile/onInit/onUpdate/onRender/onHud).
2. Append a portal entry to `index.html`'s `portals` array: `{ id, name, file: '<game-id>.html', color, story }`. The hub auto-distributes — no layout math.
3. Register the game in `api/leaderboard.js` `GAMES`: `<id>: { order, min, max }`.
4. Wire score submission inside the death/victory transition. Pattern (see `icarus.html` `submitToHall`):
   ```js
   function submitToHall(score) {
     const name = (localStorage.getItem('godgames_playerName') || 'NAMELESS MORTAL').slice(0,20);
     fetch('/api/leaderboard', { method:'POST', headers:{'Content-Type':'application/json'},
       body: JSON.stringify({ game:'<id>', name, score }) }).catch(()=>{});
   }
   ```
5. Add the game's tablet to `mount-olympus.html` (mirror Achilles' tablet markup; swap id + label).
6. Smoke-test locally: `python3 -m http.server 8000` (or any static server) → open `http://localhost:8000/<game-id>.html`. Confirm title screen, gameplay, death, leaderboard submission.

## Verification

- Hub portal appears and navigates to the new game.
- Title → playing → death/victory → leaderboard submits without console errors.
- Mobile: rotate to landscape, on-screen buttons work.
- `curl -sS http://localhost:3000/api/leaderboard?game=<id>` (after `vercel dev`) returns `{rankings: [...]}`.

## Updates

| Date       | Change           | Author |
|------------|------------------|--------|
| 2026-05-07 | Initial recipe.  | jim    |
