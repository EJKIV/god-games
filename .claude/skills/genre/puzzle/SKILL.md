---
name: genre-puzzle
description: Drop a puzzle game — turn-based or constraint-solving with a clear win state per level. Sphinx riddles, Daedalus' labyrinth-builder.
---

## When to use

- User says "puzzle", "Sphinx", "Daedalus", "Sokoban", "constraint solver"
- Levels are discrete; each has a defined win state
- Best paired with `bootstrap-2d-canvas` or `bootstrap-pixel`

## Required reading

- `/CLAUDE.md`

## Inputs

| Input             | Default                      | Notes                                       |
|-------------------|------------------------------|---------------------------------------------|
| puzzle type       | (ask)                        | Sokoban / pipe-flow / pattern-match / logic |
| level count       | `(ask)`                       | 10–30 typical                                |
| undo              | `enabled`                    | infinite-undo strongly recommended           |
| hints             | `disabled`                   | optional later                               |

## Recipe

1. **Puzzle state**: `level = { grid, entities, win(state)→bool }`. State must be **fully serializable** so undo is just `history.push(structuredClone(state))`.
2. **Action loop**: each player input → mutate state (or push a new state) → check `win(state)`. Win → next level / score.
3. **Undo**: `'z' / 'u'` pops `history`. Render is purely a function of state, so undo is free.
4. **Levels**: store as data files (`<game-id>-levels.json`) so adding a level = adding JSON, not code. Validate on boot — every shipped level must be solvable (test with a brute-force solver during dev if cheap).
5. **Score**: pick one — moves taken (order: asc), time elapsed (order: asc), or par-deviation. Submit cumulative score after final level.
6. **Visuals**: minimal. Tile-based renders cleanly with `bootstrap-pixel` if you want the retro feel.

## Verification

- Every level is solvable. Run a solver / playtest on each.
- Undo works infinite-deep; redo (if added) is symmetric.
- Win state triggers exactly when designed; no false positives or near-misses.
- Score submits after the run (or per-level if leaderboard is per-level).

## Pairs well with

- `bootstrap/pixel` or `bootstrap/2d-canvas`
- `compose/add-progression-meta` (unlock chapters)

## Updates

| Date       | Change          | Author |
|------------|-----------------|--------|
| 2026-05-07 | Initial recipe. | jim    |
