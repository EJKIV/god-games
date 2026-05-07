// save — localStorage-backed persistence with versioned migrations.
//
// Loaded via:
//   <script src="node_modules/@tellandshow/game-engine/save/index.js"></script>
//
// Attaches `Engine.save`. The kid's game calls:
//   Engine.save.save('slot1', { hp: 10, level: 3, x: 200, y: 400 });
//   const data = Engine.save.load('slot1');   // → { ... } or null
//
// Storage key shape: `tns.save.<gameId>.<slot>` so different games on the
// same browser don't collide. gameId comes from `tns.config.json`'s top
// level, or falls back to the document's <title>.
//
// Each save carries a `_v` version number. Bump it when the kid's saved
// data shape changes (rare); register a migration via
// `Engine.save.migrate({from, to, run})` and load() runs migrations in
// sequence on stale saves before returning.

(function () {
  if (typeof window === 'undefined') return;
  const Engine = (window.Engine = window.Engine || {});
  Engine.save = Engine.save || {};
  const S = Engine.save;

  S.gameId = null;       // resolved on first save/load; can be set explicitly
  const migrations = []; // { from: number, to: number, run: (data) => data }

  function resolveGameId() {
    if (S.gameId) return S.gameId;
    // Try to read tns.config.json via fetch isn't possible in a script tag
    // context — kids' games can call Engine.save.setGameId('my-game') in
    // onInit if they want a specific id; otherwise fall back to title.
    if (typeof document !== 'undefined' && document.title) {
      // Slugify the title for a stable key.
      S.gameId = document.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'game';
    } else {
      S.gameId = 'game';
    }
    return S.gameId;
  }

  S.setGameId = function (id) {
    S.gameId = String(id || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'game';
  };

  function key(slot) {
    return `tns.save.${resolveGameId()}.${slot || 'default'}`;
  }

  /**
   * Persist `data` to `slot`. Adds `_v` (current version) and `_ts` (epoch ms).
   * Returns true on success, false if storage is unavailable or full.
   */
  S.save = function (slot, data) {
    if (data === undefined || data === null) return false;
    const wrapped = { ...data, _v: S.currentVersion, _ts: Date.now() };
    try {
      localStorage.setItem(key(slot), JSON.stringify(wrapped));
      return true;
    } catch (_e) {
      // Storage full / private mode / disabled. Don't crash the kid's game.
      return false;
    }
  };

  /**
   * Load and return data for `slot`, running any registered migrations.
   * Returns null if nothing's been saved (or if the data is corrupt).
   */
  S.load = function (slot) {
    let raw;
    try { raw = localStorage.getItem(key(slot)); }
    catch (_e) { return null; }
    if (!raw) return null;
    let data;
    try { data = JSON.parse(raw); }
    catch (_e) { return null; }
    if (!data || typeof data !== 'object') return null;

    // Run migrations from data._v up to currentVersion.
    let v = typeof data._v === 'number' ? data._v : 1;
    while (v < S.currentVersion) {
      const m = migrations.find((mig) => mig.from === v);
      if (!m) break; // gap in migration chain — stop and return what we have
      try { data = m.run(data) || data; }
      catch (_e) { return null; } // migration failed — refuse the load rather than corrupt
      v = m.to;
      data._v = v;
    }

    return data;
  };

  /** Delete a slot's saved data. */
  S.clear = function (slot) {
    try { localStorage.removeItem(key(slot)); return true; }
    catch (_e) { return false; }
  };

  /** List all slot names that have data for the current game. */
  S.listSlots = function () {
    const prefix = `tns.save.${resolveGameId()}.`;
    const slots = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(prefix)) slots.push(k.slice(prefix.length));
      }
    } catch (_e) { /* ignore */ }
    return slots;
  };

  /**
   * Register a migration. Each migration moves data from one version to the next.
   * Migrations are run in chain on load — `from: 1, to: 2`, `from: 2, to: 3`, etc.
   */
  S.migrate = function ({ from, to, run }) {
    if (typeof from !== 'number' || typeof to !== 'number' || typeof run !== 'function') return;
    migrations.push({ from, to, run });
    if (to > S.currentVersion) S.currentVersion = to;
  };

  /** Increment when the kid's save shape changes. Default 1 (no migrations needed yet). */
  S.currentVersion = 1;

  /**
   * Convenience: auto-save on a periodic interval.
   * Returns a stop() function. Pass a getDataFn that returns the current
   * snapshot — called every `intervalMs`.
   */
  S.autosave = function (slot, getDataFn, intervalMs) {
    if (typeof getDataFn !== 'function') return () => {};
    const ms = Math.max(500, intervalMs || 5000); // floor at 500ms; default 5s
    const id = setInterval(() => {
      try { S.save(slot, getDataFn()); }
      catch (_e) { /* swallow — autosave shouldn't crash gameplay */ }
    }, ms);
    return () => clearInterval(id);
  };
})();
