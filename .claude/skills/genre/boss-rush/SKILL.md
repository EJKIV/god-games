---
name: genre-boss-rush
description: Drop a boss-rush system — multi-phase boss fights with telegraphed attacks, windups, and payoffs. Each phase changes the boss's pattern and look. Compatible with any renderer.
---

## When to use

- User says "boss fight", "boss rush", "Perseus vs Medusa", "Theseus vs Minotaur"
- Game is fight-focused (no procgen rooms; bosses are the content)
- Each fight should feel cinematic — telegraph → windup → attack → recovery

## Required reading

- `/CLAUDE.md`
- `/manga/CLAUDE.md` for polish profile pattern (telegraph color, windup punch)
- An existing boss for reference (current repo has Achilles' boss waves in `achilles.html`)

## Inputs

| Input              | Default                  | Notes                                              |
|--------------------|--------------------------|----------------------------------------------------|
| boss name          | (ask)                    |                                                    |
| phase count        | `3`                      | typically 2–4                                      |
| phase trigger      | `hp threshold`           | `hp` / `time` / `damage taken`                     |
| attack vocabulary  | `[]`                     | e.g., `['slash', 'leap', 'shockwave', 'summon']`   |

## Recipe

1. **Boss state machine**: `boss = { x, y, hp, phase: 0, action: 'idle', actionT: 0, …}`. Actions: `'idle' | 'telegraph' | 'windup' | 'attack' | 'recover' | 'transition'`.
2. **Attack contract**: each attack is an object `{ name, telegraph: dt => draw warning, windup: dt => …, attack: dt => emit hitboxes, recover: dt => …, totalT: 1.5 }`. Engine ticks `actionT` and dispatches.
3. **Telegraph reads first**: the windup glow / floor-marker / wind-up sound plays before any damage. Player must be able to react; aim for ≥ 0.4s of telegraph.
4. **Phase transitions**: on `hp` crossing threshold → `action = 'transition'`. Play a panel-split (`Manga.effects.panelSplit` if loaded), shake, palette swap. Then load the next phase's attack vocabulary.
5. **Player damage**: only the `'attack'` window of an action has live hitboxes. Telegraph and windup are visual-only.
6. **Pacing**: between attacks, a 0.6–1.0s `'idle'` so the player can reposition. Aggressive bosses lower this on later phases.
7. **Death**: on `hp ≤ 0`, freeze with a slowmo, panel-split, victory transition, then `submitToHall(score || timeMs)`. Time-based scoring uses `order:'asc'` in `api/leaderboard.js` GAMES.

## Verification

- Each attack has a clearly readable telegraph; a first-time player can dodge with full telegraph reaction.
- Phase transitions are unmistakable (visual + audio shift).
- Boss death is *climactic* — slow-mo, screen flash, victory text, score submitted exactly once.
- No "double-attack" bug where two attack windows overlap.

## Pairs well with

- `compose/add-boss-phase` to extend an existing boss
- `compose/tune-character-feel` once attacks are in place
- Either 2D or 3D bootstrap (3D bosses are extra cinematic)

## Updates

| Date       | Change          | Author |
|------------|-----------------|--------|
| 2026-05-07 | Initial recipe. | jim    |
