# api/ — Subtree Router

Read root `CLAUDE.md` first. This file covers only `api/` and descendants.

## Context

Vercel serverless function backed by **Upstash Redis** (sorted sets). Read top-N rankings via `GET /api/leaderboard?game=<id>`; submit a score via `POST /api/leaderboard` with `{ game, name, score }`. No other persistence — no users table, no sessions, no auth. Rate-limited per IP at 5 writes per 60 seconds.

Owns: leaderboard read/write, score validation, name sanitization, member packing format. Does **not** own: game id assignment (each game registers itself in `GAMES` table), client-side score submission (game files own their `submitToHall(score)`), or display (Mt. Olympus and the dead screens own that).

## Core Patterns

**`GAMES` table is the source of truth** for valid game ids, sort order, and score range. Adding a new game means adding a row here before submission will be accepted:

```js
const GAMES = {
  icarus:   { order: 'desc', min: 0,    max: 10_000_000 },
  orion:    { order: 'asc',  min: 1000, max: 3_600_000 },   // time in ms
  achilles: { order: 'desc', min: 0,    max: 10_000_000 },
};
```

**Member packing** so multiple entries per name coexist: each Redis member is `${name}|${ts}` (lastIndexOf('|') splits). Same name can submit multiple scores; each becomes its own ranking row.

**Validation flow** for POST: `validateGame(game)` → `validateScore(game, score)` → `sanitizeName(name)` → `rateLimit(ip)` → `ZADD`. Any failure short-circuits with a 4xx. Names default to `'NAMELESS MORTAL'` if sanitization yields empty.

## Structure / Domain Map

```
api/
├── leaderboard.js          GET (read top N) + POST (submit) handler. Single export default.
├── CLAUDE.md (this file)   Agent contract for this subtree.
└── AGENTS.md → CLAUDE.md   Symlink for non-Anthropic tools.
```

## Commands

```bash
# Read a leaderboard
curl -sS "https://god-games.vercel.app/api/leaderboard?game=achilles"

# Submit a score (manual test)
curl -sS -X POST "https://god-games.vercel.app/api/leaderboard" \
  -H "Content-Type: application/json" \
  -d '{"game":"achilles","name":"TEST","score":1000}'

# Inspect raw Redis (env vars from `vercel env pull`)
curl -sS -X POST "$KV_REST_API_URL" \
  -H "Authorization: Bearer $KV_REST_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '["ZRANGE","leaderboard:achilles",0,-1,"WITHSCORES"]'

# Remove a polluting test entry
curl -sS -X POST "$KV_REST_API_URL" \
  -H "Authorization: Bearer $KV_REST_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '["ZREM","leaderboard:achilles","TEST|<ts>"]'
```

## Rules / Coding Standards

- **Validate before any Redis call**. The `redis()` helper throws if env vars are missing — catch at the top-level handler and return 500.
- **`sanitizeName`** strips control chars (`\x00-\x1f\x7f`), collapses whitespace, trims, clamps to 20. The regex pattern *must match* the client-side sanitizer in `index.html`/`orion.html`/`icarus.html`/`achilles.html` (also `\x00-\x1f\x7f`) so names round-trip identically.
- **Score range guards** `Number.isFinite(score)` plus `min ≤ score ≤ max`. Be generous — better to accept an outlier real score than reject a legitimate run.
- **Redis env vars**: prefer `KV_REST_API_URL`/`KV_REST_API_TOKEN` (Vercel KV), fall back to `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`. Both are equivalent for our purposes.
- **`Cache-Control: no-store`** on all responses — leaderboards must reflect the latest write.

## Operational Boundaries

### Always
- Register a new game in `GAMES` before its first submission (otherwise `validateGame` rejects).
- Apply rate-limit before write (`rateLimit(ip)` returns false at >5/min).
- Keep the regex `[\x00-\x1f\x7f]` in `sanitizeName` — control-char-only stripping. Read tools may render this as visually empty, do not "correct" it.

### Ask first
- Changing the member format (`${name}|${ts}`). Existing entries would parse incorrectly; would need a migration.
- Adding a DELETE endpoint (could be abused without auth; if needed, gate behind a header secret).
- Loosening the score range — open to abuse if `max` is removed.
- Switching backends (Upstash → Vercel Postgres etc.). Rewrites everything below `redis()`.

### Never
- Commit secrets. Env vars come from Vercel; never inline `KV_REST_API_TOKEN`.
- Submit a score without validating game id (would create arbitrary `leaderboard:<garbage>` keys).
- Trust `req.body.name` directly — always pass through `sanitizeName`.
- Skip rate-limit on POST (one bad client can flood the board).

## Dispatch Hints

| Task                                  | Files / functions                                           |
|---------------------------------------|-------------------------------------------------------------|
| Add a new game's leaderboard          | Append to `GAMES` in `leaderboard.js`                       |
| Adjust top-N count                    | `TOP_N` constant in `leaderboard.js`                        |
| Adjust rate limit                     | `RATE_WINDOW_S` / `RATE_MAX` in `leaderboard.js`            |
| Change name sanitization              | `sanitizeName()` here AND every game file's `saveNameFromModal` (kept in lock-step) |
| Inspect / clean up a leaderboard      | Use `vercel env pull` + the curl commands above             |

## Updates

| Date       | Change                                                                          | Author |
|------------|---------------------------------------------------------------------------------|--------|
| 2026-05-07 | Created subtree router. Achilles registered in `GAMES` (order:desc, 0..10M).    | jim    |
