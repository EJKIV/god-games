---
name: add-progression-meta
description: Add meta-progression — currency / XP / unlocks that persist across runs in localStorage. Composes with any genre but most useful with roguelike-run, wave-survival, auto-runner.
---

## When to use

- User says "add unlocks", "add currency", "permanent upgrades", "meta progression"
- Game already has a death-and-restart loop

## Required reading

- `/CLAUDE.md`

## Inputs

| Input             | Default                                | Notes                                                |
|-------------------|----------------------------------------|------------------------------------------------------|
| storage key       | `<game-id>_meta`                        | localStorage key                                     |
| schema            | `{version, currency, unlocks: [], xp}`  | versioned for future migrations                      |
| currency source   | `kills + run completion`               | how players earn it                                  |
| unlock costs      | (ask)                                  | rule of thumb: 3–5 runs per unlock at intended skill |
| unlock effect     | (ask)                                  | new starting items / characters / difficulty          |

## Recipe

1. **Schema + load**: at game boot, load and migrate:
   ```js
   const META_KEY = '<game-id>_meta';
   let meta = JSON.parse(localStorage.getItem(META_KEY) || 'null') || { version:1, currency:0, unlocks:[], xp:0 };
   if (meta.version < CURRENT_VERSION) meta = migrate(meta);
   ```
2. **Earn currency**: during a run, accumulate `runCurrency`. On death/victory, `meta.currency += runCurrency; saveMeta()`.
3. **`saveMeta()`**: write JSON back to localStorage. Wrap in try/catch (storage may be full).
4. **Unlocks UI**: between runs, show a simple shop screen (separate state, e.g., `'shop'`) with unlock cards. Each card displays cost; click → spend currency, push id to `meta.unlocks`, save.
5. **Apply unlocks**: at run start, branch on `meta.unlocks.includes('<id>')` to enable the effect (extra heart, starting item, alternate character, etc.).
6. **Reset button**: dev / accessibility — clear `localStorage[META_KEY]` (gate behind a confirm modal). Don't auto-call.

## Verification

- Currency persists across page refreshes.
- Unlocks apply on the *next* run after purchase (current run untouched).
- Schema migration: bump `CURRENT_VERSION` to 2 with a no-op `migrate`; old saves load cleanly.
- Reset clears state and the player starts fresh.

## Pairs well with

- `genre/roguelike-run` (natural fit)
- `genre/wave-survival` (between-wave shop becomes between-run shop)
- `genre/auto-runner` (cosmetics, multipliers)

## Updates

| Date       | Change          | Author |
|------------|-----------------|--------|
| 2026-05-07 | Initial recipe. | jim    |
