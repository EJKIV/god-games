# God Games — Agent Router

Single source of truth: `CLAUDE.md`. `AGENTS.md` is a symlink to this file.

## Context

A series of Greek-mythology HTML5-canvas mini-games sharing one engine, one hub, and a shared "Hall of Mount Olympus" leaderboard. Persistent state: per-player name in `localStorage.godgames_playerName`, manga-mode flag in `localStorage.godgames_manga`, top-25 rankings per game in Upstash Redis.

## Stack Snapshot

- **HTML5 Canvas + vanilla JS** — no build step, no bundler. Open any `.html` directly with `file://` (after one-time `npm install`) or any static server.
- **Engine + manga library now come from `@tns/game-engine`** — a sibling package in `~/projects/tellandshow/game-studio/packages/game-engine/`. god-games is a *consumer* of this package, dogfooding it the same way kids' games do. See "Where the engine comes from" below.
- **Vercel Functions** (Node 18+ ESM) for `/api/*` — `package.json` declares `"type": "module"`.
- **Upstash Redis** (sorted sets) for leaderboards. Env vars `KV_REST_API_URL` / `KV_REST_API_TOKEN`.
- **Hosting**: `god-games.vercel.app` (production alias on `ejkivs-projects/god-games`).
- **Git remote**: `https://github.com/EJKIV/god-games.git`.

## Where the engine comes from

god-games used to ship `engine.js` and `manga/` directly at the repo root. As of 2026-05-07, both moved into `@tns/game-engine` (Tell and Show's published game engine package), and god-games consumes them via npm.

```
god-games/
├── package.json              # depends on "@tns/game-engine": "file:../tellandshow/game-studio/packages/game-engine"
└── node_modules/
    └── @tns/
        └── game-engine -> ../../../tellandshow/game-studio/packages/game-engine   (symlinked by `npm install`)
```

HTML files load engine + manga via:
```html
<script src="node_modules/@tns/game-engine/core/engine.js"></script>
<script src="node_modules/@tns/game-engine/manga/manga.js"></script>
```

**Dev requirement**: clone `tellandshow` next to `god-games` (sibling directories under `~/projects/`), then run `npm install` in god-games. The `file:` link makes the symlink; `npm install` is a one-time download, not a build step.

**To make engine changes**: edit `tellandshow/game-studio/packages/game-engine/core/engine.js` (or `manga/...`). The symlink means your edits are immediately visible to god-games on next page reload — no rebuild, no republish.

When `@tns/game-engine` is published to npm, swap the `file:` dep for a real semver. Same workflow for kids' games — they'll just `tns update`.

## Core Architecture Patterns

- **Each game = one HTML file** that loads `node_modules/@tns/game-engine/core/engine.js` + (optionally) `node_modules/@tns/game-engine/manga/manga.js` and calls `Engine.boot({...})` with its theme + lifecycle hooks (`onInit`, `onUpdate`, `onRender`, `onTitleRender`, `onGameOverRender`, `onKeyDown`, `onTryStart`).
- **Adding a new game**: copy `template.html` → `<name>.html`, fill in mechanics, register in `api/leaderboard.js` `GAMES` table, add a portal entry to `index.html` `portals` array, add a tablet to `mount-olympus.html` (matches existing pattern).
- **Hub & Mt. Olympus do *not* use the engine** — they have their own loops. They duplicate the landscape-overlay CSS inline (single source not feasible without a build step).
- **Mobile contract**: each game declares `mobile: { movement, actions }` in its `Engine.boot` config. Engine renders translucent on-screen buttons that synthesize keydown/keyup, so existing keyboard branches run unchanged. Modes per action: `'tap'` (default), `'hold'` (sustained), `'doubleTap'` (fires two presses ~80ms apart for double-tap detectors).
- **Manga easter egg**: typing `'shankle'` on the hub sets `localStorage.godgames_manga='1'`; `'normal'` clears. The engine reads at boot and exposes `Engine.manga`. Game render branches on it. The manga library is portable — see `node_modules/@tns/game-engine/manga/CLAUDE.md`.
- **Score submission contract**: each game submits to `/api/leaderboard` POST `{ game, name, score }` on death/victory. Game must be registered in `api/leaderboard.js` `GAMES` table — see `api/CLAUDE.md`.
- **Name modal pattern**: every interactive page reads `localStorage.godgames_playerName`; if missing, opens a modal that sanitizes (`replace(/[\x00-\x1f\x7f]/g, '')`, clamp to 20) and stores. Sanitization regex must match `api/leaderboard.js` exactly.

## Commands

```bash
# One-time setup (after cloning fresh, with tellandshow as a sibling clone)
npm install

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
├── index.html                  Hub world (4 portals + name modal + manga easter-egg detector).
├── achilles.html               Arrow Gauntlet — overhead dodge. First manga-mode integration.
├── icarus.html                 Flight game — sun/sea wing damage, tutorial.
├── orion.html                  Boss fight — scorpion vs spear/stab/dodge.
├── mount-olympus.html          Leaderboard display (Icarus / Orion / Achilles tablets).
├── template.html               Skeleton: copy this when adding a new game.
├── package.json                Declares dep on @tns/game-engine (file: link to sibling tellandshow clone).
├── api/                        Vercel serverless functions (leaderboard) — stays here for Vercel routing.
└── node_modules/@tns/game-engine/   Symlinked engine + manga (managed by npm; populated by `npm install`).
```

| If touching                                       | Read first                                            |
|---------------------------------------------------|-------------------------------------------------------|
| Engine internals or manga visuals                 | `~/projects/tellandshow/game-studio/packages/game-engine/CLAUDE.md` |
| `api/*` (leaderboard backend)                     | `api/AGENTS.md`                                       |
| `index.html` (hub) or `mount-olympus.html`        | (root only)                                           |
| Game files (`*.html` using the engine)            | (root only)                                           |

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
- Adding a new top-level dependency. Currently the only runtime dep is `@tns/game-engine` (and dev-only Vercel CLI / vitest if added later).
- Editing engine internals from inside god-games. Engine source-of-truth is `~/projects/tellandshow/game-studio/packages/game-engine/`. Edits land there, propagate here through the symlink.

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
| 2026-05-07 | Engine + manga moved out to `@tns/game-engine` (consumed via npm link). god-games is now a *consumer* of the published engine. | jim    |
| 2026-05-07 | Restructured to cascading router pattern. Subtree files under `manga/` and `api/`. Polish library v2. | jim    |
| 2026-05-06 | Added mobile/landscape support and manga easter egg (`shankle`/`normal`).                  | jim    |
| 2026-05-06 | Added Achilles. Wired Mount Olympus leaderboard. Engine extraction. Name modal.            | jim    |
