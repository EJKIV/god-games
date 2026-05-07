---
name: add-boss-phase
description: Add a new phase to an existing boss — palette swap, new attack vocabulary, transition cinematic. Composes with genre/boss-rush.
---

## When to use

- User says "give the boss a phase 3", "add another phase to <boss>"
- Boss already exists from `genre/boss-rush` (or hand-coded)

## Required reading

- `/CLAUDE.md`
- The boss's current state machine in `<game-id>.html`
- `genre/boss-rush` SKILL.md for the phase contract

## Inputs

| Input            | Default                | Notes                                          |
|------------------|------------------------|------------------------------------------------|
| trigger          | `hp ≤ N%`              | typical: 66%, 33%, 0% (death)                  |
| new attacks      | (ask)                  | usually 2–3 per phase                           |
| pace shift       | `+15% speed`           | aggressive phases go faster                     |
| palette          | optional               | recolor mesh / sprite / aura                    |
| transition fx    | `panel-split + flash`  | `Manga.effects.panelSplit` if available         |

## Recipe

1. **Phase trigger**: in the boss's `onUpdate`, branch on `boss.phase` index. When `boss.hp <= phaseThreshold[boss.phase + 1]`, set `boss.action = 'transition'`, snapshot phase++.
2. **Transition cinematic**: during `'transition'`, freeze the boss for ~1.0s, play:
   - slow-mo on the engine (`Manga.fx.slomo` if available, else custom dt-scaling)
   - panel-split overlay
   - screen flash in the boss's new accent color
   - SFX: a heavy sub-bass + a metallic clang
3. **Apply phase data**: after transition, set `boss.attacks = phaseAttacks[boss.phase]`, `boss.actionSpeed *= paceShift`, palette swap if any.
4. **Author the new attacks**: each follows the boss-rush attack contract (`telegraph → windup → attack → recover`). Telegraph color should differ from previous phases so the player can read patterns are different now.
5. **End-of-phase resets**: clear leftover hitboxes / projectiles unless the design explicitly carries them over.
6. **Death**: the final phase ends in death — slow-mo, panel-split, victory, score submit.

## Verification

- Phase transition is unmissable visually and audibly.
- New attacks read as distinct (not just a recolor of previous attacks).
- Player gets ≥1.0s of breathing room during transition.
- Bug check: no leftover hitboxes from previous phase damage the player after transition.

## Pairs well with

- `genre/boss-rush` (originating skill)
- `tune-character-feel` (refine telegraph + impact polish)

## Updates

| Date       | Change          | Author |
|------------|-----------------|--------|
| 2026-05-07 | Initial recipe. | jim    |
