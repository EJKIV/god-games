# God Games — Agent Router

Single source of truth: `CLAUDE.md`. `AGENTS.md` is a symlink to this file.

## Context

A series of Greek-mythology HTML5-canvas mini-games sharing one engine, one hub, and a shared "Hall of Mount Olympus" leaderboard. Persistent state: per-player name in `localStorage.godgames_playerName`, manga-mode flag in `localStorage.godgames_manga`, top-25 rankings per game in Upstash Redis.

## Stack Snapshot

- **HTML5 Canvas + vanilla JS** — no build step, no bundler, no dependencies. Open any `.html` directly with `file://` or any static server.
- **Vercel Functions** (Node 18+ ESM) for `/api/*` — `package.json` declares `"type": "module"`.
- **Upstash Redis** (sorted sets) for leaderboards. Env vars `KV_REST_API_URL` / `KV_REST_API_TOKEN`.
- **Hosting**: `god-games.vercel.app` (production alias on `ejkivs-projects/god-games`).
- **Git remote**: `https://github.com/EJKIV/god-games.git`.

## Core Architecture Patterns

- **Each game = one HTML file** that loads `engine.js` + (optionally) `manga/manga.js` and calls `Engine.boot({...})` with its theme + lifecycle hooks (`onInit`, `onUpdate`, `onRender`, `onTitleRender`, `onGameOverRender`, `onKeyDown`, `onTryStart`).
- **Adding a new game**: copy `template.html` → `<name>.html`, fill in mechanics, register in `api/leaderboard.js` `GAMES` table, add a portal entry to `index.html` `portals` array, add a tablet to `mount-olympus.html` (matches existing pattern).
- **Hub & Mt. Olympus do *not* use `engine.js`** — they have their own loops. They duplicate the landscape-overlay CSS inline (single source not feasible without a build step).
- **Mobile contract**: each game declares `mobile: { movement, actions }` in its `Engine.boot` config. Engine renders translucent on-screen buttons that synthesize keydown/keyup, so existing keyboard branches run unchanged. Modes per action: `'tap'` (default), `'hold'` (sustained), `'doubleTap'` (fires two presses ~80ms apart for double-tap detectors).
- **Manga easter egg**: typing `'shankle'` on the hub sets `localStorage.godgames_manga='1'`; `'normal'` clears. `engine.js` reads at boot and exposes `Engine.manga`. Game render branches on it. `manga/` library is portable — see `manga/CLAUDE.md`.
- **Score submission contract**: each game submits to `/api/leaderboard` POST `{ game, name, score }` on death/victory. Game must be registered in `api/leaderboard.js` `GAMES` table — see `api/CLAUDE.md`.
- **Name modal pattern**: every interactive page reads `localStorage.godgames_playerName`; if missing, opens a modal that sanitizes (`replace(/[\x00-\x1f\x7f]/g, '')`, clamp to 20) and stores. Sanitization regex must match `api/leaderboard.js` exactly.

## Commands

```bash
# Local smoke test (any plain HTTP server works since there's no build)
python3 -m http.server 8765
# then open http://localhost:8765

# Deploy to production
vercel --prod --yes
# alias: https://god-games.vercel.app

# Inspect a leaderboard
curl -sS "https://god-games.vercel.app/api/leaderboard?game=achilles"

# Push to GitHub (Vercel does NOT auto-deploy from git)
git push origin master
```

## Structure & Subtree Dispatch

```
god-games/
├── CLAUDE.md  AGENTS.md        Router (this file). AGENTS.md is a symlink.
├── engine.js                   Shared lifecycle: rAF loop, input, audio ctx, particles, shake,
│                               camera, screens, HUD primitives, mobile/touch shell, manga flag.
├── index.html                  Hub world (4 portals + name modal + manga easter-egg detector).
├── achilles.html               Arrow Gauntlet — overhead dodge. First manga-mode integration.
├── icarus.html                 Flight game — sun/sea wing damage, tutorial.
├── orion.html                  Boss fight — scorpion vs spear/stab/dodge.
├── mount-olympus.html          Leaderboard display (Icarus / Orion / Achilles tablets).
├── template.html               Skeleton: copy this when adding a new game.
├── package.json                {"type":"module"} so api/*.js is ESM.
├── manga/                      Portable canvas art library — manga style + cinematic polish.
└── api/                        Vercel serverless functions (leaderboard).
```

| If touching                                | Read first             |
|--------------------------------------------|------------------------|
| `manga/*` (visual library, polish, characters) | `manga/AGENTS.md`     |
| `api/*` (leaderboard backend)              | `api/AGENTS.md`        |
| `index.html` (hub) or `mount-olympus.html` | (root only)            |
| Game files (`*.html` using `engine.js`)    | (root only)            |
| `engine.js`                                | (root only)            |

## Rules / Coding Standards

- **Color invariants**: gold `#D4AF37` for UI/accents. Manga ink `#0a0a0a` (`Manga.INK`). Each game has a unique theme accent (Orion `#c87030`, Icarus `#ff8800`, Achilles `#cc2222`).
- **`Engine.boot` config shape** is the contract. Required: `title`, `theme: { bg, accent, danger }`, `onInit`, `onUpdate`, `onRender`. Everything else has defaults; `mobile`, `onTitleRender`, `onGameOverRender`, `onTryStart`, `onKeyDown` are opt-in.
- **`restartKey` defaults to `['1', ' ']`**; override per game (e.g. Orion uses `'1'` only because Space is reserved for in-dodge attacks).
- **Audio synthesis is the rule** — no audio files. `Engine.audio.tone(freq, type, dur, vol, slide)` for one-offs; for continuous/custom audio (Icarus's wind+crackle), call `Engine.audio.init()` first then create oscillators on `Engine.audio._ctx`.
- **Screen shake** via `Engine.shake(amount)` — engine handles the transform and decay.
- **Each game must register its leaderboard entry** in `api/leaderboard.js` `GAMES` (id, order, score range) before submitting.
- **No emoji in code** unless asked. Emoji are fine in UI strings (e.g., `♥` hearts, `⚡` power badge).
- **Targets**: 60fps gameplay. Engine handles dt-clamping at 50ms. Don't add features that regress framerate without measuring.

## Governance & Path Authority

- **Leaderboard schema** (Upstash Redis):
  - Sorted set per game: `leaderboard:<game-id>`
  - Member format: `${name}|${ts}` (lastIndexOf('|') splits — name may contain `|`? sanitizer strips control chars but not pipe. Names with pipe will parse as `everything-before-last-pipe | everything-after`. Acceptable.)
  - Top-25 returned via `ZRANGE`/`ZREVRANGE WITHSCORES`.
- **Env var contract** (`api/leaderboard.js`): prefers `KV_REST_API_URL` + `KV_REST_API_TOKEN`, falls back to `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`. Provisioned on the Vercel project; pull locally with `vercel env pull`.
- **Storage keys** in `localStorage`: `godgames_playerName` (string), `godgames_manga` (`'1'` or absent), `icarus_lastPlay` (timestamp; controls tutorial skip).

## Operational Boundaries

### Always
- Register new games in `api/leaderboard.js` `GAMES` *before* shipping a game's submit path — submissions to unregistered ids 400 silently.
- Update the relevant `CLAUDE.md` (root or subtree) in the same commit that adds a new pattern, not in a follow-up.
- Keep client-side and server-side name sanitization regex in lock-step (`/[\x00-\x1f\x7f]/g` everywhere).
- After deploying, smoke-test the leaderboard end-to-end (POST + GET) — past prod-API outages came from missing env vars or unregistered game ids.

### Ask first
- Adding a build step (bundler, TypeScript, sprite preprocessing). The "open any HTML in any browser" promise is load-bearing for sharing.
- Changing `Engine.state` machine (`'title' | 'playing' | 'dead' | 'victory'`) or its transition rules. Every game branches on these.
- Schema changes to `api/leaderboard.js` member format — see `api/CLAUDE.md`.
- Adding a new top-level dependency (e.g. an analytics SDK). Currently zero deps.

### Never
- Commit `.env*` files or env-var contents.
- Skip name sanitization on either client or server (control chars in names break the Olympus rendering).
- Force-push to `master` (`origin/master` tracks GitHub `EJKIV/god-games`).
- Hard-code Vercel deployment URLs in code — always use `god-games.vercel.app` (the alias) or relative `/api/*` paths.

## Git / Change Workflow

- Single branch (`master`). PRs not used for solo work; commit directly + push.
- Commit-message style (from recent log): present tense, lowercase, descriptive subject + a paragraph explaining intent. Example: `add achilles arrow gauntlet, wire to mount olympus`.
- Co-author trailer is set in commit template: `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`.
- Vercel deploys are **manual** (no GitHub-Vercel auto-deploy connected). After commit + push, run `vercel --prod --yes` to ship.

## Updates

| Date       | Change                                                                                     | Author |
|------------|--------------------------------------------------------------------------------------------|--------|
| 2026-05-07 | Restructured to cascading router pattern. Subtree files under `manga/` and `api/`. Polish library v2. | jim    |
| 2026-05-06 | Added mobile/landscape support and manga easter egg (`shankle`/`normal`).                  | jim    |
| 2026-05-06 | Added Achilles. Wired Mount Olympus leaderboard. Engine extraction. Name modal.            | jim    |
