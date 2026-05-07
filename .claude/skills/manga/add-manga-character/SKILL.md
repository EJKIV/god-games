---
name: add-manga-character
description: Add a new character to the portable manga visual library — pure draw function + polish profile, registered on window.Manga.characters. Use when the user wants to introduce a new character that any game can render.
---

## When to use

- User says "add Achilles / Hercules / Perseus / <name> as a character"
- The character should be **portable** — usable by multiple games, drop-in via `<script src="manga/manga.js">`
- DO NOT use this for one-off enemies that only one game will ever use — inline them in that game instead

## Required reading

- `/manga/CLAUDE.md` — character contract, INK color, halftone usage, polish profile shape
- `/manga/README.md` — public API as seen by consumers
- `manga/characters/achilles.js` — reference implementation

## Inputs

| Input              | Default                                | Notes                                              |
|--------------------|----------------------------------------|----------------------------------------------------|
| name               | (ask)                                  | lowercase, used as filename and registry key       |
| reference art      | optional                               | a sketch / reference image; if absent, ask for description |
| body archetype     | (ask)                                  | warrior / archer / mage / monster                   |
| color palette      | `(ask)` — 3–5 hex                      | flat colors only (manga style)                      |
| polish profile     | derived from sensation goals           | start from achilles.js and tune                     |

## Recipe

1. **Read** `manga/characters/achilles.js` end-to-end. Note the structure:
   - `defaultState` — initial render state shape *(required)*
   - `polish` — `onHit`, `onDeath`, `atmosphere` blocks *(required — drives feel)*
   - `draw(ctx, state, opts)` — pure render fn *(required)*
   - `preview` — *(optional, forward-looking)* dimensions hint for a future character viewer. No code in the repo consumes it today; safe to omit on new characters.
2. **Create** `manga/characters/<name>.js`. Use the namespace-init guard:
   ```js
   (function () {
     const M = (window.Manga = window.Manga || { effects: {}, characters: {}, fx: {}, INK: '#0a0a0a' });
     M.characters.<name> = {
       name: '<name>',
       defaultState: {...},
       polish: {...},                  // see step 4
       draw(ctx, s, opts={}) {...},    // see step 3
       // preview: { width, height, defaultPose },  // optional, forward-looking
     };
   })();
   ```
3. **Draw function** (purity rules — see `/manga/CLAUDE.md`):
   - Read only `state` and `opts`. NEVER `Engine.*` or `localStorage`.
   - Outline: `Manga.effects.inkStroke(ctx, 3)` then stroke a body shape.
   - Shadows: clip to body shape, call `Manga.effects.halftone(ctx, x,y,w,h)`.
   - Flat colors only — no gradients (vignette aside).
   - Hit-flash: if `state.hitFlash > 0`, overlay the body in `state.hitFlashColor`.
4. **Polish profile**: copy Achilles' block as a starting point; tweak per the character's "personality" (a heavy fighter has bigger `punchIntensity`; a fast assassin has shorter `slomoDuration`). Don't omit the death-cinematic timing fields:
   - `onDeath.deadScreenDelay` (seconds the cinematic plays before the dead/score panel appears)
   - `onDeath.deadScreenFadeIn` (seconds the score panel fades in over)
   - The `onDeath.sfxText` fades to 0 across the same window so the two transitions cross.
   Omit these and the death feels rushed — the SFX-text and the score panel will collide instead of crossfading.
5. **Register**: append `'characters/<name>.js'` to `MANGA_FILES` in `manga/manga.js` (preserve order — characters load after effects/fx).
6. **Document** — update **both** docs that list characters (otherwise one drifts out of sync):
   - `manga/README.md` — extend the `characters/` block under "## Layout" with the new file (replace the trailing `└──` with `├──` on the previous entry).
   - `manga/CLAUDE.md` — extend the `characters/` block under "## Structure / Domain Map" the same way.
7. **Smoke-test in isolation**: open the manga README's standalone canvas fixture, swap in the new character name, see it render.

## Verification

- Drop a `<canvas>` + `<script src="manga/manga.js">` into a blank HTML file; the new character draws without errors.
- The character renders at multiple `state.hp`, `state.facing`, `state.walkPhase` values without breaking.
- A game that imports `manga/manga.js` can call `Manga.characters.<name>.draw(ctx, state)` with no extra setup.
- The polish profile is *felt* (use `tune-character-feel` to dial in).

## Pairs well with

- `tune-character-feel` (after the character is in)
- `add-enemy-archetype` (if the character is also an enemy in some game)

## Updates

| Date       | Change                                                                                                                | Author |
|------------|-----------------------------------------------------------------------------------------------------------------------|--------|
| 2026-05-07 | Initial recipe.                                                                                                       | jim    |
| 2026-05-07 | Dry-run pass: marked `preview` optional; added `deadScreenDelay`/`deadScreenFadeIn` to polish step; doc step now updates both README and CLAUDE.md. | jim    |
