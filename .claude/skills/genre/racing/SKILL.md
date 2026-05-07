---
name: genre-racing
description: Drop a racing game — lap-based with checkpoints, AI opponents (optional), boost / drift mechanics. Chariot races, ship races. Best paired with bootstrap-3d.
---

## When to use

- User says "racing", "chariot race", "lap", "race against time / opponents"
- Game is fundamentally about going fast on a track
- Best paired with `bootstrap-3d`; 2.5d-iso also works for top-down kart-style

## Required reading

- `/CLAUDE.md`

## Inputs

| Input                | Default                                      | Notes                                       |
|----------------------|----------------------------------------------|---------------------------------------------|
| lap count            | `3`                                          |                                             |
| checkpoints per lap  | `(ask)`                                      | 4–8 typical                                  |
| AI opponents         | `0` (start with time-trial)                  | add later if needed                          |
| boost mechanic       | `enabled`                                    | rewards drift / mini-game                    |
| score metric         | `total time`                                 | `order: 'asc'` in leaderboard                |

## Recipe

1. **Track**: a closed-loop spline or polygon mesh. Mark checkpoints at known positions; player must hit them in order.
2. **Player physics**: simplified arcade — `accel`, `friction`, `maxSpeed`, `turnRate`. Drift = sliding when turning past a threshold; reduces grip but generates boost.
3. **Lap detection**: keep `nextCheckpoint`. On crossing it, increment; on crossing the start line *after* visiting all checkpoints, lap++.
4. **Boost**: filling a meter via drift lets the player tap a button for `~1s` of `1.4× maxSpeed`.
5. **AI** (optional later): each opponent follows a precomputed racing line with rubber-banding (slows when far ahead, speeds when far behind) to keep races close.
6. **Win**: lap count reached → submit total time. `order: 'asc'` in `api/leaderboard.js`.

## Verification

- Player cannot skip checkpoints (test by driving the wrong way through a checkpoint — should not advance).
- Lap counter is correct after a clean lap.
- Drift / boost feel like genuine choices (drifting on a tight corner is faster than not, sometimes).
- Final time matches a stopwatch within 50ms.

## Pairs well with

- `bootstrap/3d` (recommended)
- `bootstrap/2-5d-iso` for top-down kart
- `compose/add-power-up` (Mario Kart-style items, optional)

## Updates

| Date       | Change          | Author |
|------------|-----------------|--------|
| 2026-05-07 | Initial recipe. | jim    |
