---
name: bootstrap-shader
description: Scaffold a fullscreen-shader mini-game where rendering is a single GLSL fragment shader driven by uniforms (game state). Use when the user wants a rhythm game, abstract/visual game, or psychedelic boss fight.
---

## When to use

- User says "shader", "GLSL", "raymarching", "abstract", "rhythm visualization"
- Game is largely *visual* (rhythm, music-driven, mood-piece) with simple input
- DO NOT use for traditional gameplay with many distinct entities — use `2d-canvas` or `3d`

## Required reading

- `/CLAUDE.md`
- `/api/CLAUDE.md`

## Inputs

| Input         | Default                          | Notes                                             |
|---------------|----------------------------------|---------------------------------------------------|
| game id       | (ask)                            |                                                   |
| fragment file | `<game-id>.frag.glsl`            | inlined or fetched at boot                        |
| uniforms      | `{u_time, u_res, u_state, u_beat}` | game writes to these every frame                |
| theme         | `{bg, accent, danger}`           | passed as `u_color_*` uniforms                    |

## Recipe

1. **Engine sibling**: if `engine-shader.js` does not exist, create it. It boots a fullscreen quad with a vertex shader that passes UV through, and a user-supplied fragment shader. Exposes:
   - `engine.shader.setFragment(src)` — recompiles
   - `engine.shader.setUniform(name, value)` — float / vec2 / vec3 / vec4
   - `engine.audio` unchanged
   - `engine.hud` overlays a 2D canvas above the GL canvas for HUD/text
2. Copy `template.html` → `<game-id>.html`. Replace `<script src="engine.js">` with `<script src="engine-shader.js">`. Add an inline `<script type="x-shader/x-fragment" id="frag">…</script>` block or fetch a `.frag.glsl` file in `onInit`.
3. In `onInit`, call `engine.shader.setFragment(document.getElementById('frag').textContent)`.
4. In `onUpdate`, write game state to uniforms: `engine.shader.setUniform('u_state', state)`. Examples for a rhythm game: `u_beat` rising on every detected beat, `u_score`, `u_player_x`.
5. **Input handling** stays in JS — the shader only renders. Input changes uniforms, which changes pixels.
6. **HUD**: 2D canvas overlay. Implement `onHud(ctx, e)` as usual.
7. Register in `api/leaderboard.js` `GAMES`, append to `index.html` portals, add Mt. Olympus tablet.

## Verification

- Shader compiles without warnings (check console).
- 60fps on a mid-range GPU at full window size.
- Resize: shader rescales correctly; uniforms `u_res` reflect new size.
- Audio reacts visually (if rhythm): beat → visible response within 1 frame.

## Notes

- `engine-shader.js` does not exist yet. First invocation creates it.
- Keep the fragment shader under ~200 lines — past that it gets hard to read and shader compile errors get cryptic. Refactor into helper functions inside the shader.
- For rhythm games, pair this with `add-rhythm-game` (genre skill) which handles beat detection and timing windows.

## Updates

| Date       | Change          | Author |
|------------|-----------------|--------|
| 2026-05-07 | Initial recipe. | jim    |
