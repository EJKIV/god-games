---
name: debug-leaderboard
description: Inspect the production Upstash Redis leaderboard, list entries, and clean up test pollution. Use when the user says "the leaderboard looks wrong" or "remove the test entries".
---

## When to use

- User says "leaderboard is wrong", "remove that test entry", "show me the raw rankings"
- A bad submission needs cleaning before users see it
- DO NOT run this preemptively — only when there's a specific symptom

## Required reading

- `/api/CLAUDE.md` — member packing format (`<name>|<ts>`), validation rules, env var names

## Inputs

| Input                 | Default                            | Notes                                       |
|-----------------------|------------------------------------|---------------------------------------------|
| game id               | (ask)                              | which leaderboard                            |
| operation             | (ask)                              | `list` / `remove <member>` / `cleanup tests` |

## Setup (every session)

```bash
vercel env pull .env.tmp --environment=production
set -a; . ./.env.tmp; set +a
# Confirm vars loaded
echo "URL=$KV_REST_API_URL  TOKEN=${KV_REST_API_TOKEN:0:8}…"
```

**ALWAYS** delete `.env.tmp` when done: `rm .env.tmp`.

## Operations

### List rankings (raw)

```bash
curl -sS -X POST "$KV_REST_API_URL" \
  -H "Authorization: Bearer $KV_REST_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '["ZRANGE","leaderboard:<game>",0,-1,"WITHSCORES"]'
```

For `order: 'desc'` games (icarus, achilles), also try `ZREVRANGE`. The API endpoint surfaces the rankings already-sorted; the raw view above shows the unsorted member list.

### Remove a single entry

Member format is **always** `<name>|<unix-ms-ts>`. To remove a known member:

```bash
curl -sS -X POST "$KV_REST_API_URL" \
  -H "Authorization: Bearer $KV_REST_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '["ZREM","leaderboard:<game>","TESTNAME|1714000000000"]'
```

### Clean up test entries (interactive)

1. List the rankings (above).
2. Identify members that look like test pollution (names like `TEST`, `XXX`, scores at min/max edge).
3. **Show the user the candidates and ask for explicit approval** before any `ZREM`.
4. Remove approved candidates one at a time. Re-list to confirm.

### Clear an entire leaderboard (DANGER)

```bash
curl -sS -X POST "$KV_REST_API_URL" \
  -H "Authorization: Bearer $KV_REST_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '["DEL","leaderboard:<game>"]'
```

Only run this with the user's explicit, informed confirmation. It deletes the entire sorted set. Suggest backing up via `ZRANGE … WITHSCORES` first.

## Safety rails

- **Never** commit `.env.tmp`. Project `.gitignore` should already block it; verify if uncertain.
- **Never** remove an entry without the user seeing it first.
- **Never** clear a leaderboard without explicit confirmation.
- Always `rm .env.tmp` at the end of the session.

## Verification

- After cleanup, GET `/api/leaderboard?game=<id>` reflects the changes.
- Hub leaderboard tablet shows the cleaned data on next refresh.
- `.env.tmp` is gone from working dir.

## Updates

| Date       | Change          | Author |
|------------|-----------------|--------|
| 2026-05-07 | Initial recipe. | jim    |
