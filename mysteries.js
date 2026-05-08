// mysteries.js — God Games puzzle progression.
//
// Each god game contributes ONE letter toward a Greek-mythological invocation.
// Solving a game's secret yields:
//   • One letter of the codeword (current letters: ZEU).
//   • A brief MythCinematic overlay — the player is briefly carried to a
//     transitional Greek-mythology location (Oceanus, Asphodel, Erebus, …).
//
// As more games ship, each new game contributes a new letter and the LAST-
// added game inherits the "call to Zeus" final hint. Today the order is:
//   Icarus  → 'z' (Oceanus)
//   Orion   → 'e' (Asphodel Meadows)
//   Achilles→ 'u' (Erebus) + the call-to-Zeus instruction
//
// Final unlock: type 'ZEUS' on Mt. Olympus while the storm builds. The 'S'
// is the literal act of calling Zeus — there's no fourth game required for
// it; the player utters the king's name to complete the invocation.
// 'shankle' remains as a dev bypass.

(function () {
  if (typeof window === 'undefined') return;
  window.GodGames = window.GodGames || {};

  // MythCinematic uses the portable Manga.fx.cinematic factory if the manga
  // library has loaded. Falls back to a minimal stub if it hasn't (so tests
  // and bare pages still work).
  function makeCinematic() {
    if (window.Manga && Manga.fx && typeof Manga.fx.cinematic === 'function') {
      return Manga.fx.cinematic();
    }
    return {
      active: null,
      trigger(name, flavor, color) {
        this.active = { name, flavor, color: color || '#ffd54a', t: 0, dur: 3.0 };
      },
      update(dt) {
        if (!this.active) return;
        this.active.t += dt;
        if (this.active.t >= this.active.dur) this.active = null;
      },
      render(_ctx, _W, _H) { /* no-op without manga library */ },
    };
  }
  // Lazy-init so Manga.fx.cinematic has time to load.
  let _cinematic = null;
  const MythCinematic = {
    get active()  { return (_cinematic = _cinematic || makeCinematic()).active; },
    trigger(name, flavor, color, opts) {
      _cinematic = _cinematic || makeCinematic();
      _cinematic.trigger(name, flavor, color, opts);
    },
    update(dt) {
      _cinematic = _cinematic || makeCinematic();
      _cinematic.update(dt);
    },
    render(ctx, W, H) {
      _cinematic = _cinematic || makeCinematic();
      _cinematic.render(ctx, W, H);
    },
  };

  const M = {
    MANGA_CODEWORD: 'zeus',

    // ── Mystery definitions ──────────────────────────────────────────────
    list: [
      {
        id: 'manga_mode',
        lockedTitle: '???',
        lockedFlavor: 'Three myths, three letters. The fourth, you must speak yourself.',
        // Each hint contributes one letter of the codeword. solveOrder
        // determines panel ordering. mythLocation is what the cinematic
        // shows when the hint is earned.
        hints: [
          {
            id: 'hint.z', letter: 'Z',
            fragment: '"Z" — burned into wax that would not hold.',
            mythLocation: { name: 'RIVER OCEANUS', flavor: 'the boundary where the world ends', color: '#88c8ff' },
          },
          {
            id: 'hint.e', letter: 'E',
            fragment: '"E" — between two stars, the hunter looked up.',
            mythLocation: { name: 'ASPHODEL MEADOWS', flavor: 'where neutral souls walk in gray', color: '#bfbcae' },
          },
          {
            id: 'hint.u', letter: 'U',
            fragment: '"U" — three strikes for a fallen friend.',
            mythLocation: { name: 'EREBUS', flavor: 'the gloom before the underworld', color: '#a070d0' },
          },
          {
            id: 'hint.zeus_call', letter: 'S',
            fragment: 'Climb to Olympus. Speak the name. Call to ZEUS.',
            // This hint earns automatically when all three letter hints are
            // earned — surfacing the final-step instruction. The 'S' itself
            // is added to the storm sequence by typing it on the hub.
            autoEarnsAfter: ['hint.z', 'hint.e', 'hint.u'],
          },
        ],
        solvedTitle: 'THE MANGA STYLE',
        solvedFlavor: 'The world rendered in ink.',
      },
      {
        id: 'daedalus_compassion',
        requires: 'manga_mode',
        lockedTitle: '???',
        lockedFlavor: 'The wax remembers.',
        hints: [
          { id: 'hint.wax_three', fragment: 'Three falls. Three forgivings.', target: { counter: 'icarus_sun_deaths', goal: 3 } },
        ],
        solvedTitle: 'DAEDALUS\'S COMPASSION',
        solvedFlavor: 'Once. The gods will permit one outstretched hand.',
      },
      {
        id: 'perfect_dodger',
        requires: 'manga_mode',
        lockedTitle: '???',
        lockedFlavor: 'Time bends for those who watch.',
        hints: [
          { id: 'hint.first_just', fragment: 'The world stalled, just for a breath.' },
        ],
        target: { counter: 'orion_perfect_dodges', goal: 5 },
        solvedTitle: 'THE HUNTER\'S EYE',
        solvedFlavor: 'Five strikes, five stillnesses.',
      },
      {
        id: 'pantheon_rank',
        lockedTitle: '???',
        lockedFlavor: 'The gods record names that climb high enough.',
        hints: [
          { id: 'hint.first_score', fragment: 'Your name has been heard.' },
        ],
        target: { counter: 'olympus_top10_count', goal: 1 },
        solvedTitle: 'A NAME ON OLYMPUS',
        solvedFlavor: 'Carved among the immortals.',
      },
      {
        id: 'heel_of_achilles',
        requires: 'manga_mode',
        lockedTitle: '???',
        lockedFlavor: 'The hero, brought to his vulnerable wound.',
        hints: [
          { id: 'hint.heel_one_hp', fragment: 'One breath from oblivion. He did not fall.', target: { counter: 'achilles_one_hp_seconds_x10', goal: 50 } },
        ],
        solvedTitle: 'THE HEEL OF ACHILLES',
        solvedFlavor: 'The wound that kills him is the wound that empowers him.',
      },
      {
        id: 'glyph_hunter',
        lockedTitle: '???',
        lockedFlavor: 'Three marks bear the seal of three myths.',
        hints: [
          { id: 'hint.glyph_first', fragment: 'A mark, half-buried in stone.' },
        ],
        target: { counter: 'glyphs_found', goal: 3 },
        solvedTitle: 'THE GLYPH HUNTER',
        solvedFlavor: 'Three myths witnessed.',
      },
    ],

    // ── API used by games ────────────────────────────────────────────────
    earnHint(id, opts) {
      if (!window.Engine || !Engine.unlock) return false;
      const fullId = 'hint.' + stripHintPrefix(id);
      const ok = Engine.unlock.set(fullId);
      if (ok) {
        // If this hint carries a mythLocation, fire the cinematic so the
        // player witnesses the discovery. opts.silent skips the cinematic.
        const hint = M.findHint(fullId);
        if (hint && hint.mythLocation && !(opts && opts.silent)) {
          MythCinematic.trigger(hint.mythLocation.name, hint.mythLocation.flavor, hint.mythLocation.color);
        }
        // Auto-cascade: any hint with autoEarnsAfter pointing entirely at
        // earned hints now earns automatically (chains the call-to-Zeus reveal).
        for (const myst of M.list) {
          for (const h of myst.hints || []) {
            if (h.autoEarnsAfter && h.autoEarnsAfter.every(a => Engine.unlock.has(a))) {
              if (!Engine.unlock.has(h.id)) Engine.unlock.set(h.id);
            }
          }
          M.maybeSolveByHints(myst);
        }
      }
      return ok;
    },
    hasHint(id) {
      if (!window.Engine || !Engine.unlock) return false;
      return Engine.unlock.has('hint.' + stripHintPrefix(id));
    },
    findHint(fullId) {
      for (const m of M.list) {
        for (const h of m.hints || []) if (h.id === fullId) return h;
      }
      return null;
    },
    tally(counterKey, n = 1) {
      if (!window.Engine || !Engine.unlock) return 0;
      const value = Engine.unlock.tally(counterKey, n);
      for (const myst of M.list) {
        for (const h of myst.hints || []) {
          if (h.target && h.target.counter === counterKey && value >= h.target.goal) {
            M.earnHint(h.id);
          }
        }
        if (myst.target && myst.target.counter === counterKey && value >= myst.target.goal) {
          M.maybeSolveMystery(myst);
        }
        M.maybeSolveByHints(myst);
      }
      return value;
    },
    count(counterKey) {
      if (!window.Engine || !Engine.unlock) return 0;
      return Engine.unlock.count(counterKey);
    },
    isSolved(mysteryId) {
      if (!window.Engine || !Engine.unlock) return false;
      return Engine.unlock.has(mysteryId);
    },
    solve(mysteryId) {
      if (!window.Engine || !Engine.unlock) return false;
      return Engine.unlock.set(mysteryId);
    },
    maybeSolveMystery(myst) {
      if (!myst || !myst.target) return false;
      if (M.isSolved(myst.id)) return false;
      if (myst.id === 'manga_mode') return false;
      if (myst.requires && !M.isSolved(myst.requires)) return false;
      if (Engine.unlock.count(myst.target.counter) < myst.target.goal) return false;
      return M.solve(myst.id);
    },
    maybeSolveByHints(myst) {
      if (!myst) return false;
      if (myst.target) return false;
      if (myst.id === 'manga_mode') return false;
      if (M.isSolved(myst.id)) return false;
      if (myst.requires && !M.isSolved(myst.requires)) return false;
      const hints = myst.hints || [];
      if (hints.length === 0) return false;
      if (!hints.every(h => M.hasHint(h.id))) return false;
      return M.solve(myst.id);
    },

    // ── Manga-mode codeword helpers ──────────────────────────────────────
    // True once Z, E, U have all been earned — the call-to-Zeus instruction
    // is now visible. Player still has to type ZEUS on the hub to activate.
    mangaCodewordReady() {
      return M.hasHint('z') && M.hasHint('e') && M.hasHint('u');
    },
    triggerMangaUnlock() {
      try { localStorage.setItem('godgames_manga', '1'); } catch (_e) {}
      M.solve('manga_mode');
    },
  };

  function stripHintPrefix(id) {
    return id.startsWith('hint.') ? id.slice(5) : id;
  }

  window.GodGames.Mysteries = M;
  window.GodGames.MythCinematic = MythCinematic;
})();
