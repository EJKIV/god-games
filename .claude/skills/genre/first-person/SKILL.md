---
name: genre-first-person
description: Drop a first-person system — player POV, mouse / touch look, optional weapon (bow, sword). Odysseus's bow contest, Apollo's archery. Requires bootstrap-3d.
---

## When to use

- User says "first-person", "FPS", "bow", "Odysseus", "Apollo's archery"
- Game is from inside the character's head
- **Requires** `bootstrap-3d` — 2D doesn't do real first-person

## Required reading

- `/CLAUDE.md`
- The bootstrap-3d skill — first-person assumes engine-3d.js exists

## Inputs

| Input             | Default                                | Notes                                            |
|-------------------|----------------------------------------|--------------------------------------------------|
| weapon            | `bow`                                  | `bow` / `sword` / `none` (exploration)            |
| look sensitivity  | `0.0025 rad/px`                        |                                                  |
| movement          | `WASD + mouse-look`                    | desktop                                           |
| mobile look       | `right thumb drag`                     | engine adds this when `mobile.camera: 'look'`    |
| pointer lock      | `requested on click`                   | desktop only                                      |

## Recipe

1. **Camera rig**: parent the Three.js camera to a `playerHead` Object3D. `playerHead.position` follows the player body. Mouse/touch X → `playerHead.rotation.y`. Mouse/touch Y → `camera.rotation.x` (pitch, clamped ±π/2).
2. **Pointer lock**: on canvas click → `canvas.requestPointerLock()`. While locked, use `mousemovementX/Y` directly.
3. **Movement**: WASD applies force in the camera's local XZ plane (forward/strafe). Apply to body velocity; integrate with friction.
4. **Weapon (bow example)**:
   - Hold to draw — `drawT` accumulates while button is held, capped at ~1s.
   - Release to fire — spawn an `arrow` entity with velocity = camera-forward × `drawT × maxArrowSpeed`.
   - Arrow gravity, drag, and collision against scene meshes (use raycasting per frame).
5. **Crosshair / reticle**: render a small dot in the center of the HUD overlay (2D canvas above the WebGL canvas).
6. **Mobile**: left thumb dpad for movement; right thumb drag-zone for camera look (engine creates this when `mobile.camera: 'look'`); a tap-button for fire / draw-and-release.

## Verification

- Mouse-look feels smooth (no acceleration jitter, no inverted axis surprises).
- Pointer-lock toggles cleanly on click and release on Esc.
- Bow draw → release fires an arrow that visibly arcs and hits a target at 20m within tuning.
- Mobile look-zone responds to drag without conflicting with movement zone.

## Pairs well with

- `bootstrap/3d` (required)
- `compose/add-enemy-archetype` (targets, hostile mobs)
- `genre/boss-rush` (POV boss fight)

## Updates

| Date       | Change          | Author |
|------------|-----------------|--------|
| 2026-05-07 | Initial recipe. | jim    |
