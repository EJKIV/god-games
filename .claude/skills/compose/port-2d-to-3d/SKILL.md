---
name: port-2d-to-3d
description: Take an existing 2D game (engine.js based) and scaffold a 3D sibling that reuses its game logic. Use when the user wants a 3D version of a working 2D game.
---

## When to use

- User says "port Achilles to 3D", "I want a 3D version of <game>", "give me a 3D twin"
- The 2D game is in a healthy state (lifecycle works, leaderboard wired)
- DO NOT use this to rewrite a 2D game in place — this creates a sibling file

## Required reading

- `/CLAUDE.md`
- The source game file (`<game-id>.html`)
- `bootstrap/3d` SKILL.md — the 3D engine sibling and lifecycle contract

## Inputs

| Input           | Default                            | Notes                                            |
|-----------------|------------------------------------|--------------------------------------------------|
| source          | (ask) — `<game-id>.html`           |                                                  |
| target id       | `<game-id>-3d`                     | filename and leaderboard id                      |
| camera          | `third-person`                     | inherit from `bootstrap/3d` choices              |
| keep score      | `same metric`                      | usually identical — same skill, more dimensions  |

## Recipe

1. **Verify 3D engine exists**: if `engine-3d.js` is not in the repo, run `bootstrap/3d` first to scaffold it. Stop and confirm before continuing.
2. **Copy game file**: `<game-id>.html` → `<game-id>-3d.html`. Replace `<script src="engine.js">` with the 3D importmap + module variants from `bootstrap/3d`.
3. **Identify game logic vs. render code**:
   - **Game logic** (state, input, AI, scoring) — keep mostly intact. Vector math may need a Z component but conceptually same.
   - **Render code** (`onRender(ctx, e)`, `draw*` helpers) — replace entirely. Build Three.js meshes for player, enemies, world.
4. **Mesh inventory**: list every entity that was drawn on canvas. For each, decide:
   - Is it represented by a primitive (`BoxGeometry`, `CylinderGeometry`, `SphereGeometry`)? Cheap; use that.
   - Does it need a model? Use a low-poly placeholder (`THREE.Group` of primitives) for first pass.
5. **Update entities to carry meshes**: add `entity.mesh = …` at spawn; update `mesh.position` from `entity.x/y/z` each frame; remove from scene on despawn.
6. **HUD stays 2D**: implement `onHud(ctx, e)` with the same calls as the source game. Engine-3d overlays a 2D canvas on top of WebGL.
7. **Polish**: 2D `manga/fx` doesn't translate. Use `add-3d-polish` skill to scaffold a `manga-3d/` equivalent (camera shake → camera offset, hit flash → material emissive bump, slow-mo → clock scale).
8. **Leaderboard**: register `<target id>` in `api/leaderboard.js` as a separate game (or, if the design intends, share the same leaderboard — be explicit).
9. **Hub**: add a portal entry to `index.html` for the 3D variant.

## Verification

- 3D game has the same lifecycle (title → playing → death/victory → leaderboard) as the 2D source.
- Game logic parity: same difficulty curve, same scoring, same death triggers.
- HUD reads the same data and displays the same numbers.
- Both 2D and 3D versions still run independently (no shared regressions).

## Pairs well with

- `bootstrap/3d` (run first if needed)
- `add-3d-polish` (replace 2D manga fx with 3D equivalents)

## Updates

| Date       | Change          | Author |
|------------|-----------------|--------|
| 2026-05-07 | Initial recipe. | jim    |
