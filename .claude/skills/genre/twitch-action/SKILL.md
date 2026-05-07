---
name: genre-twitch-action
description: Drop a twitch-action game system into a bootstrapped shell — fast reflex gameplay with simple controls, escalating difficulty, and a death-and-restart loop. Matches Icarus, Achilles, and Orion's shape.
---

## When to use

- User wants "Icarus-style", "Achilles-style", "fast reflexes", "dodge enemies", "score-attack"
- Core loop is: avoid/hit, accumulate score, eventually die, restart
- Compatible with: any bootstrap renderer; most natural with 2d-canvas

## Required reading

- `/CLAUDE.md`
- An existing twitch game for reference: `icarus.html`, `achilles.html`, or `orion.html`

## Inputs

| Input             | Default                | Notes                                          |
|-------------------|------------------------|------------------------------------------------|
| difficulty curve  | `time-based`           | `time-based` / `score-based` / `wave-based`    |
| score source      | `survival + kills`     | what increases score                           |
| death trigger     | `hp ≤ 0`               | could also be timer / fall / etc.              |
| max session       | `~3 min`               | aim for short, repeatable runs                 |

## Recipe

1. In the game's `onInit`, build:
   - `player = { x, y, vx, vy, hp, iframes: 0 }`
   - `enemies = []`, `pickups = []`, `score = 0`, `time = 0`, `difficulty = 0`
   - `spawnTimer = 0`
2. In `onUpdate(dt)`:
   - Read input → update player accel/velocity. Use smooth accel/decel (see `engine.js` design rules).
   - `time += dt; difficulty = curveFn(time)` — e.g., `Math.min(1, time/120)` for 2-min ramp.
   - `spawnTimer -= dt`. When ≤ 0, spawn an enemy with stats scaled by `difficulty`. Reset to `lerp(1.5, 0.3, difficulty)` seconds.
   - Update each enemy's AI; check collisions vs player and pickups.
   - On player hit: `player.hp--; player.iframes = 1.0; e.shake(8); sfx.hit()`. If `hp ≤ 0 → e.setState('dead')`.
   - Score: tick survival (`+1/sec`) and reward kills/pickups.
3. In `onRender`: draw enemies (oldest first), pickups, player. Use `Engine.particles.emit` on hits and deaths.
4. In `onHud`: draw `e.hud.drawHearts(...)`, score top-right with `e.hud.drawScore(...)` (or equivalent), XP/combo if relevant.
5. **Death transition**: in `onUpdate`, when state becomes `dead`, call `submitToHall(score)` once (gate on a `submitted` flag).
6. **Polish**: hits flash the screen via `Manga.effects.flash` (if manga loaded), `Engine.shake(N)` proportional to impact, particles on every event. Per project rules: every action gets visual feedback.

## Verification

- Run survives 3+ min without crashes; framerate stays at 60fps.
- Difficulty visibly escalates — early game feels easy, late game forces death.
- Death reads as climactic: shake + flash + slowdown (if manga polish wired).
- Score submits exactly once per run; leaderboard shows the entry.

## Pairs well with

- `compose/add-enemy-archetype` to add variety
- `compose/add-power-up` for mid-run rewards
- `compose/tune-character-feel` once gameplay is in place

## Updates

| Date       | Change          | Author |
|------------|-----------------|--------|
| 2026-05-07 | Initial recipe. | jim    |
