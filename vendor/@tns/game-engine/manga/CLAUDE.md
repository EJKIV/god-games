# manga/ — Subtree Router

Single source of truth: `CLAUDE.md`. `AGENTS.md` should be a symlink to this
file.

Read root `CLAUDE.md` first. This file covers only `manga/` and descendants.

## Context

`manga/` is a **portable canvas art library** — no `engine.js` import, no `Engine` global reference, no DOM coupling beyond `<canvas>` and `<script>` injection. Drop the whole folder into any project, include `<script src="manga/manga.js">`, and you have `window.Manga.{effects, fx, characters}` available.

This folder owns: manga visual style (ink + halftone + flat color), per-character draw functions, cinematic polish helpers (camera punch, slo-mo, layered SFX, panel-split, vignette, scanlines, flash), and the loader that wires it all together. It does **not** own: game state, leaderboard wiring, mobile controls, audio context creation (callers pass an `AudioContext` in for SFX). Those belong to the root project.

## Core Patterns

**Each effect / fx / character is a self-contained file** that registers itself on `window.Manga`:

```js
// manga/<namespace>/<name>.js
(function () {
  const M = (window.Manga = window.Manga || { effects: {}, characters: {}, fx: {}, INK: '#0a0a0a' });
  M.<namespace>.<name> = function (ctx, ...) { /* ... */ };
})();
```

`manga.js` is a tiny loader that reads `MANGA_FILES` and injects each as a `<script async=false>` so order is preserved and the consumer only needs one `<script>` tag. To add a new effect/character: drop the file, append its path to `MANGA_FILES` in `manga.js`.

**Three namespaces, three contracts:**
- `Manga.effects.*(ctx, ...args)` — pure stateless render. Reads only ctx + args. Returns nothing.
- `Manga.fx.<name>()` — factory returning a stateful object with `update(dt)` and trigger methods. Each game/scene creates its own instance (no singletons). Game integrates the state by reading `obj.x`, `obj.scale`, etc.
- `Manga.characters.<name>` — `{ name, defaultState, preview, polish, draw(ctx, state, opts) }`. Draw is pure: reads only state + opts. `polish` profile drives the game's cinematic feel for hits and deaths.

**Per-character `polish` profile** lives in the character module (not the game) so a character's feel travels with the character to other projects:

```js
polish: {
  onHit:   { flashColor, punchIntensity, punchDuration, sfxText, slomoFactor, slomoDuration },
  onDeath: { slomoFactor, slomoDuration, panelSplit, sfxText, audioLayers },
  atmosphere: { vignetteStrength, scanlineAlpha, halftoneAlpha },
}
```

## Structure / Domain Map

```
manga/
├── manga.js                Loader — appends scripts in MANGA_FILES order. Init `window.Manga` first.
├── README.md               Human-facing API docs + "use in another project" recipe.
├── CLAUDE.md (this file)   Agent contract for the manga subtree.
├── effects/                Stateless render: pure (ctx, …) → void
│   ├── inkstroke.js        Configures ctx for bold black ink. Used by all character outlines.
│   ├── animeface.js        Reusable anime eye + cheek hatching helpers.
│   ├── halftone.js         Cached pattern; clip to a shape for screen-tone shadows.
│   ├── speedlines.js       Radial impact lines.
│   ├── sfxtext.js          Tilted outlined comic text (BAM!, FALLEN!, …).
│   ├── panelsplit.js       Death/transition slabs sliding off-screen.
│   ├── flash.js            Full-screen color burst.
│   ├── vignette.js         Radial dark fade — atmospheric.
│   └── scanlines.js        Horizontal stripes via cached pattern.
├── fx/                     Stateful per-frame helpers (factories)
│   ├── camerapunch.js      .trigger(dx,dy,dur) / .update(dt) / .x .y
│   ├── slomo.js            .trigger(factor,dur) / .scaleDt(dt) / .scale
│   └── sfxlayered.js       Stateless helper: plays a stack of tones with delays.
└── characters/             { name, defaultState, preview, polish, draw }
    ├── achilles.js         Overhead-view bronze warrior + polish profile.
    ├── orion.js            Side-profile hunter (jump/dodge/stab poses + Q-strike charge).
    ├── scorpion.js         Giant scorpion boss (state-driven tail/claw/sting/frenzy).
    ├── icarus.js           Side-flight youth with sun-burn/sea-wet wing damage stages.
    ├── eagle.js            Left-facing bald eagle with dive aura + telegraph ring.
    ├── daedalus.js         Inventor — `pose: 'flying' | 'standing' | 'rescue'`. `polish.onRescue` carries the divine-intervention SFX layers.
    └── orca.js             Killer whale breach. Caller clips to surface via `state.surfaceLocalY`. `polish.onBreach`.
```

## Commands

None — this folder has no build step or tests of its own. To smoke-test a character in isolation:

```html
<canvas id="c" width=400 height=400></canvas>
<script src="manga/manga.js"></script>
<script>
  const ctx = document.getElementById('c').getContext('2d');
  setInterval(() => {
    ctx.clearRect(0, 0, 400, 400);
    Manga.characters.achilles.draw(ctx, {
      x: 200, y: 220, facing: 1, walkPhase: performance.now()/100,
      vx: 100, hp: 5, hitFlash: 0, iframes: 0,
    });
  }, 16);
</script>
```

## Rules / Coding Standards

- **Ink color**: `Manga.INK` (`#0a0a0a`). Never use pure black `#000` for outlines — it reads as too harsh.
- **No gradients in characters**: flat colors + halftone screen-tone is the manga aesthetic. `createLinearGradient`/`createRadialGradient` is allowed in `effects/vignette.js` but should be avoided everywhere else.
- **Outline weights**: 3–4px on body shapes, 2px on details. Use `Manga.effects.inkStroke(ctx, w)` for setup.
- **Halftone for shadows** via `Manga.effects.halftone` clipped to the shape (`ctx.beginPath(); ctx.<shape>(...); ctx.clip(); halftone(...)`).
- **Character `draw(ctx, state, opts={})`** signature is mandatory. Never read globals; never reference `Engine` or call `localStorage`. The character is portable.
- **Stateful fx are factories** (`Manga.fx.cameraPunch()` returns a fresh instance). Do not export shared singletons — that breaks multi-game pages and tests.
- **Audio helpers accept an `AudioContext`** parameter — never reach for `Engine.audio._ctx` from inside the library.
- **Namespace-init guard** at the top of every sub-file: `const M = (window.Manga = window.Manga || { effects: {}, characters: {}, fx: {}, INK: '#0a0a0a' });`. Means files load in any order if needed.

## Operational Boundaries

### Always
- Add new effect/character/fx by: (a) creating a file under the right namespace, (b) appending its path to `MANGA_FILES` in `manga.js`.
- Keep characters' `polish` profile in their own file so it travels with the character.
- Document any new public API in `manga/README.md` in the same change.

### Ask first
- Adding a build step (concatenation, ES module conversion, TypeScript). The "drop the folder, one script tag" promise is load-bearing.
- Changing the `Manga.<namespace>` shape (renaming `effects` → `render` or similar). Consumers in this and other projects depend on the keys.
- Adding a runtime dependency (e.g., `<script src=...>` for a font). Currently zero deps.

### Never
- `import` from `engine.js` or read the `Engine` global. The library must work without it.
- Reach into `Engine.audio._ctx` — accept the AudioContext as a parameter instead.
- Reference DOM elements by id beyond `document.currentScript.src` (in the loader). Characters/effects only touch the `<canvas>` they're given.
- Add singletons. Stateful fx are factories.

## Dispatch Hints

| Task                                | Files / globs                          |
|-------------------------------------|----------------------------------------|
| Tweak how Achilles looks            | `manga/characters/achilles.js` (`draw`) |
| Tweak how Achilles *feels* on hit   | `manga/characters/achilles.js` (`polish.onHit`) |
| Add a new character                 | `manga/characters/<name>.js` + append to `MANGA_FILES` in `manga.js` |
| Add a new visual effect             | `manga/effects/<name>.js` + append    |
| Add a new gameplay-feel helper      | `manga/fx/<name>.js` + append          |
| Adjust death panel-split timing     | `manga/effects/panelsplit.js` + caller `achilles.html` (search `mangaDeathT`) |
| Halftone density / dot size         | `manga/effects/halftone.js` (defaults) |

## Updates

| Date       | Change                                                                | Author |
|------------|-----------------------------------------------------------------------|--------|
| 2026-05-10 | Added reusable anime facial-detail helpers for stronger character reads across manga mode. | codex  |
| 2026-05-07 | Added `daedalus.js` (3 poses incl. divine-rescue hand) + `orca.js` (breach). New `polish.onRescue` / `polish.onBreach` profiles. | jim    |
| 2026-05-07 | Split monolithic `manga.js` into per-piece files. Added `Manga.fx`. Added Achilles `polish` profile. | jim    |
