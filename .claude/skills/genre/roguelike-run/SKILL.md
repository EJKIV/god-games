---
name: genre-roguelike-run
description: Drop a roguelike-run system — procedurally generated rooms connected by doors, run-based meta progression, permadeath. Best paired with bootstrap-2-5d-iso.
---

## When to use

- User says "roguelike", "Hades-style", "rooms with doors", "procgen", "run-based"
- Each death starts a fresh run; meta progress (unlocks, currency) persists
- Compatible with any 2D bootstrap; iso reads best

## Required reading

- `/CLAUDE.md`
- `/api/CLAUDE.md` (score = furthest depth reached or run gold; pick one as the leaderboard metric)

## Inputs

| Input             | Default                          | Notes                                        |
|-------------------|----------------------------------|----------------------------------------------|
| room types        | `['combat','shop','elite','boss']` | starter set                                  |
| layout            | `linear with branches`           | `linear` / `branching` / `grid`              |
| run length        | `~10 rooms`                      | aim for 10–15 min runs                       |
| persistence       | `localStorage.<game-id>_meta`    | unlocks, currency, run count                 |

## Recipe

1. **Run state**: `run = { seed, rooms: [], current: 0, hp, gold, items: [], depth: 0 }`. Generate `seed` at run start; reuse for reproducibility.
2. **Room generation**: `generateRoom(seed, type, depth) → { tiles, enemies, exits }`. Use a tiny seeded PRNG (mulberry32 in 6 lines). Each room is self-contained.
3. **Layout**: build the run's room sequence at run start so the map is decidable. Show a mini-map / next-room preview at each door.
4. **Doors / transitions**: when player enters a door, fade out, advance `run.current`, load next room, fade in. Persist hp/gold/items, drop enemies/projectiles.
5. **Items / boons**: pick a small starter item pool. Each item is `{name, rarity, onPickup(run), onTick(run, dt), onHit(run, target)}`. Engine calls hooks at the right moments.
6. **Meta progression**: on death, write `run.gold` and `run.depth` into `localStorage.<game-id>_meta`. Spend currency between runs to unlock new items / starting boons.
7. **Score submission**: pick one metric — *furthest depth* (order: desc) or *fastest clear* (order: asc) — and register it. Submit on victory or death.

## Verification

- Two runs with the same seed produce identical layouts.
- Items affect the run (visible, testable change in numbers or behavior).
- Run takes ~10–15 minutes when played at intended difficulty.
- Death → meta updated → new run starts cleanly with persisted unlocks applied.

## Pairs well with

- `bootstrap/2-5d-iso` (recommended)
- `compose/add-power-up` (each run boon)
- `compose/add-enemy-archetype` (room enemy variety)
- `compose/add-progression-meta` (unlock structure)

## Updates

| Date       | Change          | Author |
|------------|-----------------|--------|
| 2026-05-07 | Initial recipe. | jim    |
