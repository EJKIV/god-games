---
name: add-enemy-archetype
description: Add a new enemy type to an existing game — sprite/model + AI + drop table. Composes with any genre that has enemies.
---

## When to use

- User says "add a new enemy", "add a Cyclops / Hydra / Centaur / harpy"
- Game already has an enemy system; this drops a new archetype into it

## Required reading

- `/CLAUDE.md`
- The target game file to see its enemy entity shape and AI dispatch
- `/manga/CLAUDE.md` if visuals will use a `Manga.characters.*` draw fn

## Inputs

| Input            | Default                                          | Notes                                            |
|------------------|--------------------------------------------------|--------------------------------------------------|
| name             | (ask)                                            |                                                   |
| stats            | `{hp, dmg, speed, score}`                        | scale relative to existing enemies                |
| ai               | `chase`                                          | `chase` / `patrol` / `ranged` / `summoner`        |
| weakness         | none                                             | takes 2× from a specific damage type             |
| visual           | inline canvas drawing OR `Manga.characters.<n>`  | for reusable look, register in `manga/characters/` |
| drop table       | `{coin: 0.7, powerup: 0.05}`                     | rarities sum ≤ 1                                  |
| sfx (spawn,die)  | optional                                         |                                                   |

## Recipe

1. **AI behaviour**: implement `ai_<name>(enemy, dt, world)` that updates the enemy's velocity / state. Common shapes:
   - `chase`: vector toward player, normalize × speed.
   - `patrol`: bounce between waypoints; switch to chase when player enters detection radius.
   - `ranged`: maintain distance; fire projectiles on a cooldown.
   - `summoner`: stationary; spawns weaker enemies on a cooldown.
2. **Spawn factory**: `spawn<Name>(x, y) → {type:'<name>', x, y, hp, dmg, speed, ai: ai_<name>, ...}`. Push into the game's enemy array.
3. **Drawing**: either:
   - inline `draw<Name>(ctx, e)` in the game file, OR
   - `Manga.characters.<name>.draw(ctx, e)` if the character is reusable across games (then follow `add-manga-character` skill instead).
4. **Drop table**: in the game's `onEnemyDeath` (or equivalent), roll the drop. Spawn pickup (use `add-power-up` shape) or drop a coin entity.
5. **Enemy registry**: extend the game's spawn picker to include `<name>` with an appearance probability (gated by current difficulty).
6. **Polish**: hit flash on damage (`enemy.hitFlash = 0.12`), particles on death matching the enemy's color, SFX on spawn and death.

## Verification

- Enemy spawns and behaves per the AI spec.
- Damage applied correctly; dies at `hp ≤ 0`.
- Drop table fires at the configured rates (test by running 100 deaths and observing distribution).
- Visual hit-feedback is unmistakable.

## Pairs well with

- `add-manga-character` (if visual is reusable)
- `tune-character-feel` (after the enemy is in)

## Updates

| Date       | Change          | Author |
|------------|-----------------|--------|
| 2026-05-07 | Initial recipe. | jim    |
