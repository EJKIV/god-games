# @tellandshow/game-engine — Agent Router

Single source of truth: `CLAUDE.md`. `AGENTS.md` is a symlink (created on first commit).

## What this is

The runtime engine kids' games consume. Ported verbatim from `god-games/engine.js` + `manga/` + `api/leaderboard.js` so the same code that powers achilles/icarus/orion can power any new kid's game published through Game Studio.

## Stack snapshot

- **Plain JavaScript, zero build step.** Kids' games load files via `<script src="node_modules/@tellandshow/game-engine/core/engine.js">`. Preserves the "open `index.html`, it just works" promise.
- **Engine.boot(config)** is the single entry. Exposes `window.Engine`. Lifecycle hooks (`onInit`/`onUpdate`/`onRender`/`onTitleRender`/`onGameOverRender`/`onTryStart`/`onKeyDown`/`onResize`), audio synth, particles, screen shake, mobile shell, state machine (`title`/`playing`/`dead`/`victory`), HUD primitives.
- **Manga library** (`manga/`) — portable visual style + character renderers + polish FX. Self-registering on `window.Manga`. No engine dependency.
- **Leaderboard** (`api/leaderboard.js`) — Vercel serverless function for opt-in score persistence. Upstash Redis via `KV_REST_API_URL` / `KV_REST_API_TOKEN`.

## Layout

```
packages/game-engine/
├── core/
│   └── engine.js               # Engine.boot, lifecycle, particles, shake, audio, mobile, state
├── manga/                      # Visual library — see manga/CLAUDE.md
│   ├── manga.js                # Module loader + INK constant
│   ├── characters/             # Character draw + polish profiles
│   ├── effects/                # Stateless render helpers (halftone, ink, vignette, ...)
│   ├── fx/                     # Stateful per-frame fx (camerapunch, slomo, sfxlayered, zeusstrike)
│   └── scenes/                 # Cinematic scene drawables
├── api/
│   └── leaderboard.js          # Vercel serverless. See api/CLAUDE.md
├── package.json
└── CLAUDE.md
```

## Subtree dispatch

| If touching                | Read first             |
|----------------------------|------------------------|
| `manga/*`                  | `manga/CLAUDE.md`      |
| `api/*`                    | `api/CLAUDE.md`        |
| `core/engine.js`           | (this file)            |

## Always

- Engine code stays plain JS loadable via `<script src>`. No build step in the kid's repo, ever.
- `Engine.boot` config shape is the contract — required: `title`, `theme: { bg, accent, danger }`, `onInit`, `onUpdate`, `onRender`. Don't break this.
- New engine helpers (physics/animation/audio/dialogue/save/level/accessibility — coming in M3) live in sibling subfolders next to `core/`. Each gets its own subfolder + entry file.
- When adding new `manga/` content, follow the patterns documented in `manga/CLAUDE.md` (no gradients, use `Manga.INK`, ink weights 2–4px).

## Ask first

- Renaming or removing public surface on `Engine.*` (every kid's game depends on it).
- Schema changes to leaderboard member format (see `api/CLAUDE.md`).
- Adding a build step.

## Never

- Hardcode god-games-specific theming (Greek mythology, gold/navy) into engine code. The engine is theme-agnostic; god-games consumes the engine, not the other way around.
- Bundle runtime deps. Stay zero-deps.
- Skip name sanitization on either client or server (control chars in names break leaderboard rendering).

## Source

Ported from `~/projects/god-games/` (engine.js, manga/, api/) on 2026-05-07. The god-games repo continues to exist as the worked-example consumer of this package — once @tellandshow/game-engine is linked or published, god-games' `package.json` should depend on it (M1.7).

## Updates

| Date       | Change                                                | Author |
|------------|-------------------------------------------------------|--------|
| 2026-05-07 | Added `Engine.timeScale` + `Engine.setTimeScale(factor, dur)` for slo-mo dips. Engine multiplies dt by `timeScale` while `state==='playing'`; particles, floaters, time, and `config.onUpdate` all slow together. Shake decay stays on raw dt. | jim    |
| 2026-05-07 | Added manga `daedalus.js` + `orca.js`. See `manga/CLAUDE.md`.        | jim    |
| 2026-05-07 | Initial port from god-games. Engine + manga + api.    | jim    |
