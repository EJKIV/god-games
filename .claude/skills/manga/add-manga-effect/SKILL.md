---
name: add-manga-effect
description: Add a new stateless render effect to manga/effects/ — pure (ctx, …) → void. Use when the user wants a new visual filter / overlay / decoration usable by any game.
---

## When to use

- User says "add a <name> effect", "add a screen overlay", "make a <visual> helper"
- The effect is **stateless** — render-only, no per-frame internal state. (For stateful effects, use `add-polish-fx` instead.)

## Required reading

- `/manga/CLAUDE.md` — namespace contract, ink color, halftone pattern
- An existing effect: `manga/effects/flash.js`, `manga/effects/speedlines.js`

## Inputs

| Input        | Default              | Notes                                        |
|--------------|----------------------|----------------------------------------------|
| name         | (ask)                | lowercase, used as filename + registry key   |
| signature    | `(ctx, ...args)`     | first arg is always `ctx`                    |
| inputs       | (ask)                | what params control the visual               |

## Recipe

1. **Read** an existing effect for shape: `manga/effects/flash.js` is the simplest. Note: namespace-init guard, single function, registered on `Manga.effects.<name>`.
2. **Create** `manga/effects/<name>.js`:
   ```js
   (function () {
     const M = (window.Manga = window.Manga || { effects: {}, characters: {}, fx: {}, INK: '#0a0a0a' });
     M.effects.<name> = function (ctx, /* args */) {
       ctx.save();
       // ... render
       ctx.restore();
     };
   })();
   ```
3. **Purity rules**:
   - Read nothing outside `ctx` + args. No `Engine.*`, no DOM lookups.
   - Always `ctx.save()` / `ctx.restore()` so callers' contexts don't leak state.
   - No gradients in characters/effects (except `vignette.js` for atmospheric purposes).
   - Use `Manga.INK` for outlines, never `'#000'`.
4. **Cache patterns / off-screen canvases at module-load time** if the effect uses them (see `halftone.js`). Do not allocate per-call.
5. **Register**: append `'effects/<name>.js'` to `MANGA_FILES` in `manga/manga.js`.
6. **Document**: add a row to `manga/README.md` describing the function signature and its visual.

## Verification

- Standalone canvas fixture: create a blank canvas, call `Manga.effects.<name>(ctx, ...)`, see the expected visual.
- Calling the effect doesn't leak ctx state (test by drawing a known shape after the call — should not be affected by the effect's transforms / styles).
- No console errors on first call before any other Manga method.

## Pairs well with

- `add-manga-character` (effects often used inside character draws)

## Updates

| Date       | Change          | Author |
|------------|-----------------|--------|
| 2026-05-07 | Initial recipe. | jim    |
