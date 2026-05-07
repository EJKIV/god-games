---
name: add-polish-fx
description: Add a stateful polish effect to manga/fx/ — factory returning {trigger, update, …} so each game owns its own instance. Use for camera tweens, time-scale variants, particle blooms, anything that needs per-frame state.
---

## When to use

- User says "add a screen-shake variant", "add a chromatic-aberration on hit", "I want a stateful <fx>"
- The effect needs per-frame state (it's not a single render call)

## Required reading

- `/manga/CLAUDE.md` — fx contract: factory pattern, no singletons, AudioContext as parameter
- An existing fx: `manga/fx/camerapunch.js`, `manga/fx/slomo.js`

## Inputs

| Input         | Default            | Notes                                            |
|---------------|--------------------|--------------------------------------------------|
| name          | (ask)              | lowercase, camelCase'd in registry: `Manga.fx.<name>()` |
| trigger args  | (ask)              | what `trigger(...)` accepts                       |
| public state  | (ask)              | what fields the game reads (e.g., `.x`, `.scale`) |

## Recipe

1. **Read** `manga/fx/camerapunch.js` — the simplest factory. Pattern:
   ```js
   (function () {
     const M = (window.Manga = window.Manga || { effects: {}, characters: {}, fx: {}, INK: '#0a0a0a' });
     M.fx.<name> = function () {
       const o = { /* public state */ x: 0, _t: 0 };
       o.trigger = (/* args */) => { o._t = duration; /* set internal */ };
       o.update  = (dt) => { /* tick */ };
       return o;
     };
   })();
   ```
2. **Factory rule**: every call to `Manga.fx.<name>()` returns a **fresh** object. NO module-level mutable state. NO singletons. This means a single page can run two games side-by-side, or your tests can run in parallel.
3. **Public state vs. internal**: prefix internal fields with `_`. The game reads `o.x`, `o.scale`, etc. and applies them to its own draw calls.
4. **Audio**: if your fx plays sound, **accept an AudioContext as a parameter** in `trigger()` — never reach for `Engine.audio._ctx`. See `manga/fx/sfxlayered.js` for the canonical pattern.
5. **Register**: append `'fx/<name>.js'` to `MANGA_FILES` in `manga/manga.js`.
6. **Document**: add a row in `manga/README.md` showing the factory, trigger args, and public state fields.

## Verification

- Two instances created in the same page do not interfere (`a.trigger()` doesn't move `b.x`).
- `update(dt)` is idempotent when no trigger is active (no NaN, no drift).
- A consumer can integrate by reading `o.x`, `o.scale`, etc. without knowing internals.
- Audio version (if any) accepts an external `AudioContext` and works with two different contexts.

## Pairs well with

- `add-manga-effect` (pair stateless render with stateful timing)
- `tune-character-feel` (polish profiles often invoke fx)

## Updates

| Date       | Change          | Author |
|------------|-----------------|--------|
| 2026-05-07 | Initial recipe. | jim    |
