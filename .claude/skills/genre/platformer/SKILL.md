---
name: genre-platformer
description: Drop a side-view platformer — tilemap, jumping, hazards, level goals. Best paired with bootstrap-pixel for the retro look.
---

## When to use

- User says "platformer", "Mario-like", "Hercules' labors", "levels with jumps"
- Game is side-view, gravity-based, with discrete levels
- Pairs naturally with `bootstrap-pixel`, also fine on plain `2d-canvas`

## Required reading

- `/CLAUDE.md`

## Inputs

| Input              | Default                       | Notes                                            |
|--------------------|-------------------------------|--------------------------------------------------|
| gravity            | `1800 px/s²`                  | tune by feel — Mario-like                        |
| jump velocity      | `-650 px/s`                   | gives ~2.5 tile peak at gravity above            |
| coyote time        | `100 ms`                      | post-leaving-ground grace                        |
| jump buffer        | `120 ms`                      | pre-landing input grace                          |
| variable jump      | `enabled`                     | release jump button → cut upward velocity        |
| level data         | (ask)                         | tile grid, hazards, goal                         |

## Recipe

1. **Tilemap**: `level = { tiles: [[' ','#',…], …], hazards: […], goal: {x,y} }`. Tile types: `' '` empty, `'#'` solid, `'^'` spike, `'='` one-way platform, `'$'` coin.
2. **Player physics**: integrate `vy += gravity*dt`, `y += vy*dt`. Sweep and collide vs. solid tiles per axis (resolve x first, then y).
3. **Jump feel**: track `coyoteT` (decrement when grounded → 0; reset to 100ms on leaving ground). Track `bufferT` (set to 120ms on jump press). On any frame where `bufferT>0 && coyoteT>0`, jump and consume both.
4. **Variable jump**: when jump released and `vy < 0`, set `vy = max(vy, -200)` (cuts the rest of the upward velocity).
5. **Hazards**: on collision with `'^'` or hazard entity → death. Spike grid is part of tilemap; moving hazards are entities with their own update.
6. **Goal**: on collision with `goal` → victory transition; submit score (= time, lives, or coins, pick one).
7. **Camera**: follow player with a deadzone (~80px box) so small movements don't shake the camera.

## Verification

- Player can jump exactly the maximum distance/height the level designer expects (no off-by-one tile reach).
- Coyote time + jump buffer noticeably improve forgiveness vs. without (test by trying to fall-and-jump after a ledge).
- Spikes and hazards kill consistently; the player dies exactly when their hitbox touches.
- Camera doesn't jitter on small player movements.

## Pairs well with

- `bootstrap/pixel` (recommended)
- `compose/add-power-up` (double-jump, dash, …)
- `compose/add-enemy-archetype` (goombas, koopas, …)

## Updates

| Date       | Change          | Author |
|------------|-----------------|--------|
| 2026-05-07 | Initial recipe. | jim    |
