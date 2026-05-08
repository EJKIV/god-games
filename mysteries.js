// mysteries.js — God Games puzzle progression.
//
// Each mystery is an in-game secret that the player has to discover. The
// panel never tells them what to do — only acknowledges what's been found
// in poetic flavor. Persistence runs through Engine.unlock (see
// vendor/@tns/game-engine/unlock/index.js):
//   • Hint earned     → Engine.unlock.set(`hint.${hintId}`)
//   • Mystery solved  → Engine.unlock.set(mysteryId)
//   • Counter progress→ Engine.unlock.tally(counterKey)
//
// Game files (icarus/orion/achilles) call into Mysteries.* whenever a tracked
// secret event fires. The hub mysteries panel reads back the same store and
// renders only flavor — no goals, no instructions.
//
// The manga mode codeword 'shankle' is split into three syllables, each
// hidden behind a different mythologically-flavored secret across the games:
//   • 'shan' — The Cautious Flight (Icarus, Daedalus's actual advice)
//   • 'kuh'  — The Constellation's Gaze (Orion, hunter looks at his own stars)
//   • 'lay'  — Shade of Patroclus (Achilles, three vengeance shots)
// Typing 'shankle' or 'normal' on the hub still works as a dev bypass.

(function () {
  if (typeof window === 'undefined') return;
  window.GodGames = window.GodGames || {};

  const M = {
    MANGA_CODEWORD: 'shankle',

    // ── Mystery definitions ──────────────────────────────────────────────
    // Each mystery has only the bare minimum the panel renders. There are no
    // `earnedBy` strings — discovering the trigger is the puzzle.
    list: [
      {
        id: 'manga_mode',
        // Locked: panel shows lockedFlavor only — three poetic mythological
        // hints layered together pointing at the THREE secrets to find,
        // without naming any specific action.
        lockedTitle: '???',
        lockedFlavor: 'Three myths. Three syllables. Three deaths-in-waiting.',
        // Each hint, once earned, reveals just its syllable as a fragment
        // tied to the myth that was honored to earn it.
        hints: [
          { id: 'hint.shan', syllable: 'shan…',  fragment: '"shan…" — burned into wax that would not hold.' },
          { id: 'hint.kuh',  syllable: '…kuh…',  fragment: '"…kuh…" — between two stars, the hunter looked up.' },
          { id: 'hint.lay',  syllable: '…lay',   fragment: '"…lay" — three strikes for a fallen friend.' },
        ],
        // Once all 3 syllables are earned, the panel surfaces "shan kuh lay".
        // Player has to read it aloud: 'shankle'.
        solvedTitle: 'THE MANGA STYLE',
        solvedFlavor: 'The world rendered in ink.',
      },
      {
        id: 'daedalus_compassion',
        requires: 'manga_mode',
        lockedTitle: '???',
        lockedFlavor: 'The wax remembers.',
        hints: [
          { id: 'hint.wax_three', syllable: 'thrice', fragment: 'Three falls. Three forgivings.', target: { counter: 'icarus_sun_deaths', goal: 3 } },
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
          { id: 'hint.first_just', syllable: 'breath', fragment: 'The world stalled, just for a breath.' },
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
          { id: 'hint.first_score', syllable: 'heard', fragment: 'Your name has been heard.' },
        ],
        target: { counter: 'olympus_top10_count', goal: 1 },
        solvedTitle: 'A NAME ON OLYMPUS',
        solvedFlavor: 'Carved among the immortals.',
      },
      {
        id: 'glyph_hunter',
        lockedTitle: '???',
        lockedFlavor: 'Three marks bear the seal of three myths.',
        hints: [
          { id: 'hint.glyph_first', syllable: 'mark',  fragment: 'A mark, half-buried in stone.' },
        ],
        target: { counter: 'glyphs_found', goal: 3 },
        solvedTitle: 'THE GLYPH HUNTER',
        solvedFlavor: 'Three myths witnessed.',
      },
    ],

    // ── API used by games ────────────────────────────────────────────────
    earnHint(id) {
      if (!window.Engine || !Engine.unlock) return false;
      const ok = Engine.unlock.set('hint.' + stripHintPrefix(id));
      if (ok) for (const myst of M.list) M.maybeSolveByHints(myst);
      return ok;
    },
    hasHint(id) {
      if (!window.Engine || !Engine.unlock) return false;
      return Engine.unlock.has('hint.' + stripHintPrefix(id));
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

    // Internal: solve when a top-level target counter is met.
    maybeSolveMystery(myst) {
      if (!myst || !myst.target) return false;
      if (M.isSolved(myst.id)) return false;
      if (myst.id === 'manga_mode') return false;
      if (myst.requires && !M.isSolved(myst.requires)) return false;
      if (Engine.unlock.count(myst.target.counter) < myst.target.goal) return false;
      return M.solve(myst.id);
    },
    // Internal: solve when all hints earned (used for hint-only mysteries).
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

    // ── Manga mode helpers ───────────────────────────────────────────────
    mangaCodewordReady() {
      return M.hasHint('shan') && M.hasHint('kuh') && M.hasHint('lay');
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
})();
