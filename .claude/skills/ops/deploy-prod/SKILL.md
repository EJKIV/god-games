---
name: deploy-prod
description: Commit, push, and deploy the project to Vercel production. Use when the user says "ship it", "deploy", "push to prod" — only after they've confirmed.
---

## When to use

- User explicitly says "deploy", "ship", "push to prod", "publish"
- Local changes are tested and the user has confirmed the deploy
- DO NOT auto-deploy on every change. Always ask first if the user hasn't said the word.

## Required reading

- `/CLAUDE.md` — Git workflow rules (present-tense commit messages, push after each session)
- `/api/CLAUDE.md` — never commit secrets

## Inputs

| Input             | Default              | Notes                                       |
|-------------------|----------------------|---------------------------------------------|
| commit message    | (compose from diff)  | present tense, one-liner                    |
| branch            | `master`             | this repo's main branch                     |
| confirm           | required             | always show diff + plan, ask before push    |

## Pre-flight checks

Run these and surface results to the user **before** committing:

1. `git status` — list modified / new files. Flag anything suspicious (`.env*`, `credentials*`, large binaries).
2. `git diff` — read the actual changes. Don't commit blindly.
3. **Syntax-check** changed `.js` / `.html`: run `node --check engine.js` etc. on JS files; for HTML, at minimum confirm `<script>` blocks parse by extracting and running `node --check`.
4. **Smoke-test** locally if a game changed: ask the user to confirm they ran the local preview (`python3 -m http.server 8000` or `vercel dev`) and tested the affected game's title→playing→death flow.
5. **No secrets in diff**: grep for `KV_REST_API_TOKEN`, `UPSTASH`, etc. — must NOT appear in any committed file.

## Recipe

1. Show the user the pre-flight summary (modified files + commit message draft) and **ask for confirmation**.
2. After confirmation:
   - `git add <specific files>` (NOT `git add -A` — explicit only).
   - `git commit -m "<present-tense one-liner>"` with Co-Authored-By trailer per project Git policy.
   - `git push origin master`.
   - `vercel --prod --yes` (Vercel CLI; assumes user is logged in).
3. Surface the production URL from the Vercel output.
4. **Post-deploy smoke**: `curl -sS https://<deployment-url>/api/leaderboard?game=achilles` and confirm a 200 with a `rankings` array. Report the result.

## Safety rails

- **Never** force-push or amend the previous commit.
- **Never** skip pre-commit hooks (`--no-verify`).
- **Never** commit when the diff contains anything that looks like a secret.
- If the deploy fails (Vercel CLI returns non-zero), surface the error and STOP. Do not retry destructively.

## Verification

- `git status` is clean after push.
- Vercel deploy URL is live (200 on `/`).
- Leaderboard GET returns a valid response.
- The new feature is visible in the deployed site (open hub, navigate to changed game).

## Updates

| Date       | Change          | Author |
|------------|-----------------|--------|
| 2026-05-07 | Initial recipe. | jim    |
