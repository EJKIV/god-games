---
name: genre-bullet-hell
description: Drop a bullet-hell (danmaku) system — dense bullet patterns from emitters, a tiny player hitbox, grazing rewards. Pair with bootstrap-2d-webgl for high bullet counts.
---

## When to use

- User says "bullet hell", "danmaku", "Touhou-like", "thousands of bullets"
- Player hitbox should be visibly smaller than the sprite
- Strongly prefer pairing with `bootstrap-2d-webgl` (canvas chokes past ~3k bullets)

## Required reading

- `/CLAUDE.md`
- Choose a bootstrap first; this skill assumes the engine is already wired

## Inputs

| Input              | Default                | Notes                                           |
|--------------------|------------------------|-------------------------------------------------|
| max bullets        | `5000`                 | sets pool size; drives renderer choice          |
| player hitbox      | `4 px`                 | small relative to sprite (~32 px)               |
| graze radius       | `24 px`                | barely-dodging rewards score                    |
| pattern types      | `[ring, spiral, fan]`  | starter set; extend later                       |

## Recipe

1. **Bullet pool**: pre-allocate a flat array of `MAX_BULLETS` reusable objects `{x, y, vx, vy, alive, color, rad}`. Never new-up bullets in the loop.
2. **Pattern emitters**: build a small library of pure functions in `<game-id>-patterns.js`:
   ```js
   patterns.ring   = (cx, cy, n, speed, color) => bullets.spawnN(n, i => ({...}))
   patterns.spiral = (cx, cy, n, speed, twist) => …
   patterns.fan    = (cx, cy, n, spread, dir, speed) => …
   ```
3. **Boss script**: a sequence of timed pattern calls. Pattern → wait → next pattern. Drives the entire fight.
4. **Player hitbox**: render a small visible dot at the hitbox center so the player can read it. Render the larger sprite around it but DO NOT use the sprite for collision.
5. **Graze**: each frame, count bullets within `graze radius` but outside `hitbox`. Add to a graze counter; convert to score on bomb / boss-end.
6. **Rendering**: with `bootstrap-2d-webgl`, push all alive bullets into a single Pixi `ParticleContainer` or a regl point-sprite shader. With `bootstrap-2d-canvas`, batch-draw with one `ctx.fillStyle` per color.
7. **Mobile**: dpad → 8-directional movement; one button for shoot, one for focus (smaller hitbox visualization + slower movement).

## Verification

- 5000 bullets onscreen → 60fps in DevTools profiler.
- Player can graze a wall of bullets; graze counter rises visibly.
- Boss script plays through; phase transitions clean (no leftover bullets unless intentional).
- Death triggers exactly once when a bullet's center is within `hitbox` of player center.

## Pairs well with

- `bootstrap/2d-webgl` (recommended)
- `compose/add-boss-phase` (each pattern stage is a phase)

## Updates

| Date       | Change          | Author |
|------------|-----------------|--------|
| 2026-05-07 | Initial recipe. | jim    |
