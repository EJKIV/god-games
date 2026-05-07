---
name: genre-auto-runner
description: Drop an endless auto-runner — player runs forward automatically; input switches lanes / jumps / slides. Hermes-the-messenger style.
---

## When to use

- User says "auto-runner", "endless runner", "Hermes", "Subway Surfers", "Temple Run"
- Player has only a few discrete inputs (lane swap, jump, slide)
- Compatible with any 2D or iso bootstrap; 3D works for chase-cam variants

## Required reading

- `/CLAUDE.md`

## Inputs

| Input            | Default                            | Notes                                            |
|------------------|------------------------------------|--------------------------------------------------|
| lane count       | `3`                                |                                                  |
| forward speed    | `360 px/s`, `+5/sec`               | accelerates over time                            |
| obstacle pool    | `['low','high','full','coin']`     | slide / jump / both / pickup                     |
| death            | `obstacle hit`                     | one-hit, restart                                 |

## Recipe

1. **World scrolls toward player**: keep the player at a fixed screen Y; obstacles spawn off-screen (top in top-down, far in 3D) and approach. World scroll speed = `forward speed`.
2. **Lanes**: discrete X positions (or world X, in 3D). Lane swap is a tween over ~120ms; can't swap mid-tween.
3. **Jump / slide**: each is a timed state with frames where the hitbox lifts above / drops below the default lane height. Engine forces the player to land back at default height.
4. **Spawner**: every `lerp(1.0, 0.4, time/180)` seconds, pick a random obstacle from the pool, weight by difficulty. Avoid impossible patterns (e.g., a `full` immediately after a `full` with no recovery time).
5. **Coins / pickups**: same lane system. Picking up grants score and optionally activates a power-up.
6. **Score**: `score = distance + coins*N`. Submit on death.

## Verification

- Player can complete a 60-second run without unfair deaths (no impossible obstacle patterns).
- Speed visibly accelerates; difficulty curve is felt.
- Lane swap, jump, slide each register reliably (test on mobile too).
- Score submits on death exactly once.

## Pairs well with

- `bootstrap/2-5d-iso` (recommended) for the chase-cam look
- `bootstrap/3d` for full chase-cam
- `compose/add-power-up` (magnet, double-coin, invincible)

## Updates

| Date       | Change          | Author |
|------------|-----------------|--------|
| 2026-05-07 | Initial recipe. | jim    |
