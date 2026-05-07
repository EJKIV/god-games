# God Games

A series of Greek mythology mini-games built by a Theo.

## Architecture
- Each mini-game is one HTML file (icarus.html, orion.html, achilles.html, ...) that includes the shared engine via `<script src="engine.js"></script>` and calls `Engine.boot({...})` with its theme + lifecycle hooks (onInit, onUpdate, onRender, etc.).
- `engine.js` owns the boring boilerplate: rAF loop, dt clamping, input, audio context, particle pool, screen shake, camera, default title/dead/victory screens, HUD primitives. Games supply only their theme and gameplay code.
- `template.html` is the copy-paste skeleton for new games — duplicate it, fill in the TODOs.
- `index.html` is the hub. Adding a new game = append an entry to the `portals` array (auto-distributed across the screen) + create the game file. No layout math required.
- `mount-olympus.html` is the leaderboard page. Its tablets fetch `/api/leaderboard?game=<id>` and render rankings.
- `api/leaderboard.js` is a Vercel serverless function backed by Upstash Redis (KV_REST_API_URL / KV_REST_API_TOKEN). Games POST `{game, name, score}` on death or victory; GET returns the top 25.
- Player name is stored in `localStorage.godgames_playerName` (key `NAME_KEY`); the hub and each game gate gameplay behind a name-prompt modal.

## Design Rules
- Use HTML canvas for all gameplay
- Epic visual style: dark backgrounds, glowing effects, particle systems
- Color palette: deep navy/black backgrounds, gold (#D4AF37) for UI and accents, mythological colors per game (sun orange for Icarus, blood red for Achilles, forest green for Artemis, etc.)
- Every action needs visual feedback: hits flash, deaths explode, pickups glow and pulse, score floats up from the action
- Use Web Audio API for synthesized retro sound effects (no audio files). For one-off SFX call `Engine.audio.tone(freq, type, dur, vol, slide)`. For continuous/custom audio (Icarus's wind+crackle), call `Engine.audio.init()` first then create oscillators on `Engine.audio._ctx`.
- Screen shake on big impacts via `Engine.shake(amount)` — engine handles the transform and decay.
- Smooth acceleration/deceleration on player movement
- Always include: title screen, HUD (score/health/XP), game over screen with final score and play again button. Engine renders defaults; games can override via `onTitleRender` / `onGameOverRender`, or just supply `title` / `subtitle` / `instructions` / `deadTitle` / `victoryTitle` config.
- Show XP prominently — it's the core reward across all games. Submit final score to the leaderboard from the death/victory transition (see Icarus and Orion for examples).
- Each game must register its leaderboard entry in `api/leaderboard.js` `GAMES` (id, order, score range) before submitting.
- Use emoji or canvas-drawn sprites for characters (no external images)
- When adding new features, NEVER break existing features
- Make controls responsive and satisfying
- Target 60fps smooth gameplay
- **Mobile**: every page enforces landscape via a `(orientation: portrait) and (pointer: coarse)` CSS overlay. Each game declares a `mobile` block in `Engine.boot({...})` listing its on-screen buttons; the engine renders a translucent gamepad and synthesizes keydown/keyup so the existing keyboard branches work unchanged. Modes per action: `'tap'` (default), `'hold'` (sustained), `'doubleTap'` (fires two presses ~80ms apart so existing `performance.now()` double-tap detectors trigger from one tap). The hub auto-expands portal hit regions on touch so tapping a portal arch navigates directly.

## Git Workflow
- After completing each major feature, commit with a descriptive message
- Push to GitHub after each session
- Use present tense commit messages: "add wing burning effect"
