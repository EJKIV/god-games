---
name: genre-wave-survival
description: Drop a wave-survival system — discrete waves of enemies, between-wave shop/heal, boss every N waves. Atlas-holding-up-the-sky vibes.
---

## When to use

- User says "wave survival", "horde", "Atlas", "endless", "between-wave shop"
- Gameplay loops: clear wave → choose upgrade → next wave
- Compatible with any 2D bootstrap

## Required reading

- `/CLAUDE.md`

## Inputs

| Input            | Default                       | Notes                                       |
|------------------|-------------------------------|---------------------------------------------|
| wave count       | `endless`                     | or fixed (e.g., 30)                          |
| wave size curve  | `5 + wave*2`                  | enemies per wave                             |
| boss every       | `5 waves`                     | scale + special                              |
| upgrade options  | `3 per shop`                  | rerolls allowed?                             |
| death            | `hp ≤ 0`                      |                                              |

## Recipe

1. **Wave manifest**: `waves[i] = { count, types: [{archetype, weight}], boss?: archetype }`. Generate procedurally if endless; hand-author for fixed length.
2. **Wave runner**: state machine `'preparing' → 'fighting' → 'cleared' → 'shopping' → next`. `'preparing'` shows "Wave N" big, plays a horn. `'fighting'` spawns over a window; `'cleared'` triggers when last enemy dies.
3. **Shop**: between waves, present 3 randomly drawn upgrades. Player picks one (or rerolls if currency allows). Upgrade hooks into the same item pool used by `roguelike-run` so they're reusable.
4. **Boss waves**: every `boss every` waves, spawn a single beefy enemy with telegraphed attacks (overlap with `genre/boss-rush` for the boss authoring).
5. **Death**: lose all upgrades. Submit score = `wave reached` (order: desc).

## Verification

- Wave 1 is comfortably clearable; wave 10 demands focus; wave 20+ requires upgrades to survive.
- Boss waves feel distinct (slower pace, telegraphed attacks).
- Shop choices are meaningful — at least one option is build-defining each shop.
- Score reaches the leaderboard with `wave reached` as the metric.

## Pairs well with

- Any 2D bootstrap
- `compose/add-enemy-archetype` (build the wave's monster pool)
- `compose/add-power-up` (shop offerings)
- `genre/boss-rush` (for boss-wave bosses)

## Updates

| Date       | Change          | Author |
|------------|-----------------|--------|
| 2026-05-07 | Initial recipe. | jim    |
