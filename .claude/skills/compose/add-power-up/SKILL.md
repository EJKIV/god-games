---
name: add-power-up
description: Add a power-up to an existing game — pickup that grants a timed (or permanent) effect on the player. Composes with any genre.
---

## When to use

- User says "add a power-up", "add a pickup", "add a boon", "magnet item", "double damage"
- Game already exists; this skill drops a single new pickup into it

## Required reading

- `/CLAUDE.md`
- The target game file (`<game-id>.html`) so the new pickup matches its existing entity shape

## Inputs

| Input          | Default                              | Notes                                            |
|----------------|--------------------------------------|--------------------------------------------------|
| name           | (ask)                                | e.g., `magnet`, `double-damage`, `phoenix`       |
| effect         | (ask)                                | what changes for the player                       |
| duration       | `8 s` (or `permanent`)               | timed effects auto-expire                         |
| visual         | (ask)                                | sprite + glow color                               |
| spawn rule     | `random drop, 5%`                    | drop from kills / fixed pickup / shop offering    |
| sfx            | `pickup tone`                        | `Engine.audio.tone(880, 'sine', 0.15, 0.4, 1320)` |

## Recipe

1. **Pickup entity**: extend the game's pickup pool with `{type:'<name>', x, y, vy, glowColor, pickupAt: time + life}`. Render with a pulsing glow (size = `1 + 0.2*sin(t*6)`).
2. **Player effect state**: extend the player object with `<name>T = 0` (remaining duration) and any state the effect needs (e.g., `damageMul = 1`).
3. **Pickup hook**: in collision-with-pickup branch, branch on `type` and apply the effect:
   ```js
   if (p.type === '<name>') {
     player.<name>T = <duration>;
     // any one-time on-pickup effect
     sfx.pickup();
     particles.emit({...});
   }
   ```
4. **Effect tick**: in `onUpdate`, decrement `player.<name>T -= dt`. While `> 0`, modify behavior (e.g., `damage * (player.doubleT > 0 ? 2 : 1)`).
5. **Spawn rule**: extend the game's drop logic to roll for this pickup. Honor `spawn rule`.
6. **HUD**: show remaining duration as a small icon + bar in the corner. Add to `onHud`.
7. **Visual feedback during effect**: apply a subtle persistent change (player tint, particle aura) so the player knows the buff is active.

## Verification

- Pickup spawns at the configured rate.
- Picking it up plays sfx, emits particles, applies the effect.
- Effect duration counts down on HUD; ends with a clear visual cue.
- Stacking the same pickup either refreshes (most cases) or stacks duration (specify which).

## Updates

| Date       | Change          | Author |
|------------|-----------------|--------|
| 2026-05-07 | Initial recipe. | jim    |
