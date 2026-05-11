# Tests

End-to-end smoke for the mysteries system. Drives a real headless Chrome via
puppeteer-core through each game's secret and verifies the corresponding
hint persists in localStorage.

## Run

```bash
# 1. Serve the project (any static server)
python3 -m http.server 8765 &

# 2. One-time: install puppeteer-core (not committed as a dep — it's heavy
#    and only needed for tests)
npm install --no-save puppeteer-core

# 3. Run the suite
node tests/e2e.mjs
```

Set `BASE_URL`, `CHROME_PATH`, or `SHOTS_DIR` env vars to override defaults.

## Performance + Fairness Harness

```bash
# Serve the project first.
python3 -m http.server 8765 &

# Then run every game + the hub across desktop/mobile, manga on/off,
# cold load/warm load.
npm run perf
```

The harness gates unexpected 404s/HTTP errors, request failures, uncaught JS
errors, `console.error`, p95 frame time, and the debug-overlay drift report.
It sets `localStorage.godgames_debug='1'` so each gameplay surface publishes
hitbox-vs-sprite drift while it drives a short fairness playtest. Useful env
overrides: `PERF_DURATION_MS`, `PERF_DESKTOP_P95_MS`, `PERF_MOBILE_P95_MS`,
and `PERF_DRIFT_RATIO`. To focus one surface, pass `-- --only=icarus`.

## What it covers

- `Engine.unlock` writes + reads via `window.Engine.unlock` (caught the
  bug where `engine.js` declared `const Engine` at top-level but never
  set `window.Engine`, so `unlock/index.js` attached to a separate empty
  shell and every `earnHint()` silently failed).
- Progress sync waits for first-time name entry, then pulls remote unlocks
  after the name modal saves `localStorage.godgames_playerName`.
- Icarus → `hint.z` earned by touching peak altitude (Sun's Embrace).
- Orion → `hint.e` earned by standing still beneath the constellation.
- Achilles → `hint.u` earned by counter-shooting 3 archers in 6.5s.
- Perseus → three chambers can be cleared, then the hidden sigma seal earns
  `hint.s`.
- Hub mysteries panel reflects earned-hint state.
- `shankle` dev bypass unlocks manga mode.
- Typing `zeus` after Z+E+U+S are earned summons the lightning bolt.
- Earning all four letter fragments does not reveal a separate ZEUS hint.

Screenshots land in `/tmp/shots/` so you can visually confirm each
mythology cinematic (RIVER OCEANUS, ASPHODEL MEADOWS, EREBUS, TARTARUS)
actually fires when the hint is earned.

## Helper

`tests/seed.html` pre-fills `localStorage.godgames_playerName='TEST'` and
`icarus_lastPlay` so each game skips its name modal + tutorial. The e2e
suite hits it like `seed.html?go=icarus.html` and the page redirects.
