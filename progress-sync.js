// progress-sync.js — backs Engine.unlock state with Redis via /api/progress.
//
// Lifecycle:
//   1. Watch for the player's name (localStorage.godgames_playerName).
//      It may be missing on first load until the name modal saves it.
//   2. When a name exists or changes, GET /api/progress?name=<player>.
//      Merge remote state into Engine.unlock:
//      • set every remote unlock id (no-op if local already has it)
//      • for every remote counter, take max(local, remote) and write back
//   3. Subscribe to Engine.unlock.onChange. On any change, debounce ~2s and
//      POST the full local state to /api/progress. Server merges (max, union).
//
// Why this is safe:
//   • All operations are merges, never replaces. A divergent device never
//     loses progress; both sides converge to the union.
//   • Mysteries are forever-state. Counters never decrease (Engine.unlock has
//     no decrement). So max-merge is correct. Puzzle resets are handled by
//     versioned keys in mysteries.js, which filters obsolete chain keys.
//   • Player name is the only identity. No accounts, no auth. The Workshop
//     usage pattern: kid types name once, progress follows them across
//     devices on the same name.

(function () {
  if (typeof window === 'undefined') return;
  if (window.__progressSyncLoaded) return;
  window.__progressSyncLoaded = true;

  try {
    const params = new URLSearchParams(window.location.search || '');
    if (params.has('perfHarness') || params.has('qaHarness')) return;
  } catch (_e) {}

  const NAME_KEY = 'godgames_playerName';
  const ENDPOINT = '/api/progress';
  const DEBOUNCE_MS = 2000;
  const PULL_RETRY_MS = 15000;

  function getName() {
    try { return (localStorage.getItem(NAME_KEY) || '').trim(); }
    catch (_e) { return ''; }
  }

  function getLocalState() {
    let unlocks = {}, counters = {};
    try { unlocks  = JSON.parse(localStorage.getItem('tns.unlocks')  || '{}') || {}; } catch (_e) {}
    try { counters = JSON.parse(localStorage.getItem('tns.counters') || '{}') || {}; } catch (_e) {}
    return filterProgressState({ unlocks, counters });
  }

  function filterProgressState(state) {
    const M = window.GodGames && window.GodGames.Mysteries;
    if (M && typeof M.filterProgressState === 'function') {
      return M.filterProgressState(state);
    }
    return state || { unlocks: {}, counters: {} };
  }

  function hasAnyState(state) {
    return !!(state
      && ((state.unlocks && Object.keys(state.unlocks).length)
        || (state.counters && Object.keys(state.counters).length)));
  }

  // Merge remote into Engine.unlock (the local state). Returns true if the
  // merge actually changed anything locally (so we know whether to POST).
  function mergeRemoteIntoLocal(remote) {
    if (!window.Engine || !Engine.unlock) return false;
    remote = filterProgressState(remote);
    let changed = false;
    if (remote.unlocks) {
      for (const id of Object.keys(remote.unlocks)) {
        if (!Engine.unlock.has(id)) {
          Engine.unlock.set(id);
          changed = true;
        }
      }
    }
    if (remote.counters) {
      for (const [k, n] of Object.entries(remote.counters)) {
        const localN = Engine.unlock.count(k);
        if (n > localN) { Engine.unlock.setCount(k, n); changed = true; }
      }
    }
    return changed;
  }

  // ── Remote pull whenever the active player name appears/changes ──────
  let lastPulledName = '';
  let lastAttemptedName = '';
  let nextPullAt = 0;
  let pullInFlightName = '';
  async function pullForCurrentName() {
    const name = getName();
    if (!name || name === lastPulledName || name === pullInFlightName) return;
    const now = Date.now();
    if (name !== lastAttemptedName) {
      lastAttemptedName = name;
      nextPullAt = 0;
    }
    if (now < nextPullAt) return;
    pullInFlightName = name;
    try {
      const r = await fetch(`${ENDPOINT}?name=${encodeURIComponent(name)}`, { method: 'GET' });
      if (!r.ok) {
        nextPullAt = Date.now() + PULL_RETRY_MS;
        return;
      }
      const remote = await r.json();
      mergeRemoteIntoLocal(remote);
      lastPulledName = name;
      nextPullAt = 0;
      if (hasAnyState(getLocalState())) schedulePush();
    } catch (_e) {
      nextPullAt = Date.now() + PULL_RETRY_MS;
      /* offline / cors / 4xx — silent */
    }
    finally {
      if (pullInFlightName === name) pullInFlightName = '';
    }
  }

  // ── Debounced push on change ─────────────────────────────────────────
  let pushTimer = null;
  function schedulePush() {
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(pushNow, DEBOUNCE_MS);
  }
  async function pushNow() {
    pushTimer = null;
    const name = getName();
    if (!name) return;
    const { unlocks, counters } = getLocalState();
    if (!Object.keys(unlocks).length && !Object.keys(counters).length) return;
    try {
      await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, unlocks, counters }),
        keepalive: true,
      });
    } catch (_e) { /* offline — try again on next change */ }
  }

  // Run as soon as Engine.unlock is available. The script loads after
  // unlock/index.js so this is normally synchronous, but be defensive in
  // case the load order shifts.
  function start() {
    if (!window.Engine || !Engine.unlock) {
      setTimeout(start, 50);
      return;
    }
    pullForCurrentName();
    Engine.unlock.onChange(schedulePush);
    setInterval(pullForCurrentName, 1000);
    window.addEventListener('focus', pullForCurrentName);
    // Best-effort flush on page hide so we don't lose a freshly-earned hint.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        if (pushTimer) { clearTimeout(pushTimer); pushTimer = null; }
        pushNow();
      } else {
        pullForCurrentName();
      }
    });
  }
  start();
})();
