// unlock — generic localStorage-backed unlock + counter persistence.
//
// Loaded via:
//   <script src="vendor/@tns/game-engine/unlock/index.js"></script>
//
// Attaches `Engine.unlock`. Two cooperating stores:
//   • Unlocks   — boolean-ish "I did this" flags.   Keyed by string id.
//   • Counters  — integer tallies for progress.     Keyed by string key.
//
// Storage keys are namespaced with `tns.` so they don't collide with
// game-specific localStorage usage.
//
//   Engine.unlock.set('manga_mode')          // unlock once; subsequent calls no-op
//   Engine.unlock.has('manga_mode')          // → bool
//   Engine.unlock.list()                     // → [id, ...]
//   Engine.unlock.clear('manga_mode')        // forget one (debug)
//   Engine.unlock.clear()                    // forget all (debug)
//
//   Engine.unlock.tally('sun_deaths')        // +1, returns new count
//   Engine.unlock.tally('sun_deaths', 3)     // +3
//   Engine.unlock.count('sun_deaths')        // → number
//   Engine.unlock.setCount(key, n)
//
//   Engine.unlock.onChange(cb)               // cb({type:'unlock'|'tally', id?, key?, value?})
//
// The library is intentionally generic: god-games' mystery definitions
// (`mysteries.js`) sit on top, calling `set` / `tally` / `has` / `count` to
// drive their puzzle logic. Other TNS games can layer their own mysteries the
// same way without modifying this module.

(function () {
  if (typeof window === 'undefined') return;
  const Engine = (window.Engine = window.Engine || {});
  if (Engine.unlock && Engine.unlock._loaded) return;

  const KEY_UNLOCKS  = 'tns.unlocks';
  const KEY_COUNTERS = 'tns.counters';

  function safeParse(raw) {
    if (!raw) return {};
    try { const v = JSON.parse(raw); return (v && typeof v === 'object') ? v : {}; }
    catch (_e) { return {}; }
  }
  function loadUnlocks()  { try { return safeParse(localStorage.getItem(KEY_UNLOCKS));  } catch (_e) { return {}; } }
  function loadCounters() { try { return safeParse(localStorage.getItem(KEY_COUNTERS)); } catch (_e) { return {}; } }
  function save(key, obj) { try { localStorage.setItem(key, JSON.stringify(obj)); return true; } catch (_e) { return false; } }

  const listeners = [];
  function emit(ev) { for (const fn of listeners) { try { fn(ev); } catch (_e) {} } }

  Engine.unlock = {
    _loaded: true,

    has(id) { return !!loadUnlocks()[id]; },

    set(id) {
      const u = loadUnlocks();
      if (u[id]) return false;
      u[id] = Date.now();
      save(KEY_UNLOCKS, u);
      emit({ type: 'unlock', id });
      return true;
    },

    list() { return Object.keys(loadUnlocks()); },

    clear(id) {
      const u = loadUnlocks();
      if (id == null) { save(KEY_UNLOCKS, {}); emit({ type: 'clear' }); return; }
      if (u[id]) { delete u[id]; save(KEY_UNLOCKS, u); emit({ type: 'clear', id }); }
    },

    count(key) { return loadCounters()[key] | 0; },

    tally(key, n = 1) {
      const c = loadCounters();
      c[key] = (c[key] | 0) + n;
      save(KEY_COUNTERS, c);
      emit({ type: 'tally', key, value: c[key] });
      return c[key];
    },

    setCount(key, n) {
      const c = loadCounters();
      c[key] = n | 0;
      save(KEY_COUNTERS, c);
      emit({ type: 'tally', key, value: c[key] });
    },

    onChange(fn) { if (typeof fn === 'function') listeners.push(fn); },
  };
})();
