// mysteries.js — God Games puzzle progression.
//
// Each mystery is a chain of hints earned through play, optionally followed by
// a final action (typing a codeword, hitting a counter target). Persistence
// runs through Engine.unlock (see vendor/@tns/game-engine/unlock/index.js):
//   • Hint earned         → Engine.unlock.set(`hint.${hintId}`)
//   • Mystery solved      → Engine.unlock.set(mysteryId)
//   • Counter progress    → Engine.unlock.tally(counterKey)
//
// Game files (icarus/orion/achilles) call into Mysteries.* whenever a tracked
// event fires (sun death, perfect dodge, kill, leaderboard rank). The hub
// mysteries panel reads back the same store and renders progress.
//
// Code word for manga mode: 'shankle' (split into syllables across 3 hints).
// Typing 'shankle' or 'normal' on the hub continues to work as a dev bypass.

(function () {
  if (typeof window === 'undefined') return;
  window.GodGames = window.GodGames || {};

  const M = {
    // Codeword that unlocks manga mode once all 3 syllable hints are earned.
    MANGA_CODEWORD: 'shankle',

    // ── Mystery definitions ───────────────────────────────────────────────
    list: [
      {
        id: 'manga_mode',
        title: 'The Manga Style',
        lockedTitle: 'A whisper from beyond the page…',
        description: 'See the world rendered in bold ink and screen-tone.',
        hints: [
          {
            id: 'hint.shan',
            earnedBy: 'Complete Daedalus\'s flight tutorial in Icarus.',
            text: 'Daedalus murmurs the syllable: "shan…"',
          },
          {
            id: 'hint.kuh',
            earnedBy: 'Land your first perfect dodge against the Scorpion.',
            text: 'In a frozen breath, you hear: "…kuh…"',
          },
          {
            id: 'hint.lay',
            earnedBy: 'Slay 25 enemies in Achilles.',
            text: 'Etched in the bronze of a fallen helm: "…lay"',
          },
        ],
        finalStep: 'Type the three syllables together at the hub. A storm will gather over Olympus.',
        reward: 'Manga mode — bold ink + halftone visuals across all games. Unlocks new abilities.',
      },
      {
        id: 'daedalus_compassion',
        title: 'Daedalus\'s Compassion',
        lockedTitle: '???',
        description: 'Daedalus reaches once for those who fall. Visible only in the manga style.',
        requires: 'manga_mode',
        hints: [
          {
            id: 'hint.wax_remembers',
            earnedBy: 'Burn against the sun three times.',
            text: 'The wax remembers every fall. He is watching.',
            target: { counter: 'icarus_sun_deaths', goal: 3 },
          },
        ],
        finalStep: 'Fly again — Daedalus will catch you when you next fall.',
        reward: 'Daedalus\'s hand emerges and lifts you on your next near-death. Once per run.',
      },
      {
        id: 'perfect_dodger',
        title: 'The Hunter\'s Eye',
        lockedTitle: '???',
        description: 'Time itself slows for those who read the scorpion\'s strikes.',
        requires: 'manga_mode',
        hints: [
          {
            id: 'hint.first_perfect',
            earnedBy: 'Land your first perfect dodge against the Scorpion.',
            text: 'A breath held. The world stalled for an instant.',
          },
        ],
        finalStep: 'Land 5 perfect dodges across your runs.',
        target: { counter: 'orion_perfect_dodges', goal: 5 },
        reward: 'Your perfect dodges already grant slo-mo + a counter. Future: bonus damage scaling.',
      },
      {
        id: 'pantheon_rank',
        title: 'A Name on Olympus',
        lockedTitle: '???',
        description: 'The gods notice mortals who climb high enough on the leaderboards.',
        hints: [
          {
            id: 'hint.first_score',
            earnedBy: 'Submit any score to a leaderboard.',
            text: 'Your name has been heard.',
          },
        ],
        finalStep: 'Place top 10 on any single leaderboard.',
        target: { counter: 'olympus_top10_count', goal: 1 },
        reward: 'A Pantheon mark next to your name on Mount Olympus.',
      },
      {
        id: 'glyph_hunter',
        title: 'The Glyph Hunter',
        lockedTitle: '???',
        description: 'Three hidden glyphs bear the marks of the three games — find them all.',
        hints: [
          {
            id: 'hint.first_glyph',
            earnedBy: 'Find your first hidden glyph.',
            text: 'A mark, half-buried, etched in stone.',
          },
        ],
        finalStep: 'Find all three hidden glyphs (one per game).',
        target: { counter: 'glyphs_found', goal: 3 },
        reward: 'Future: an alternate visual mode unlocks.',
      },
    ],

    // ── Hint earning helpers ──────────────────────────────────────────────
    // earnHint(id): mark a hint earned. Triggers any "all-hints-earned"
    // mystery solves so single-hint mysteries unlock immediately.
    earnHint(id) {
      if (!window.Engine || !Engine.unlock) return false;
      const ok = Engine.unlock.set('hint.' + stripHintPrefix(id));
      if (ok) {
        for (const myst of M.list) M.maybeSolveByHints(myst);
      }
      return ok;
    },
    hasHint(id) {
      if (!window.Engine || !Engine.unlock) return false;
      return Engine.unlock.has('hint.' + stripHintPrefix(id));
    },
    // tally(counterKey, n): bump a counter and auto-earn any hints whose
    // target counter+goal is now satisfied; auto-solve mysteries whose own
    // target hits its goal, AND mysteries whose only requirement is that all
    // hints be earned.
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
        // Auto-solve "all hints satisfied" mysteries (no codeword, no top-level target).
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
    // Mark a mystery as solved manually (for codeword-style unlocks).
    solve(mysteryId) {
      if (!window.Engine || !Engine.unlock) return false;
      return Engine.unlock.set(mysteryId);
    },

    // Internal: solve a mystery whose top-level target counter has been hit.
    maybeSolveMystery(myst) {
      if (!myst || !myst.target) return false;
      if (M.isSolved(myst.id)) return false;
      if (Engine.unlock.count(myst.target.counter) < myst.target.goal) return false;
      if (myst.id === 'manga_mode') return false;            // codeword required
      if (myst.requires && !M.isSolved(myst.requires)) return false;
      return M.solve(myst.id);
    },
    // Internal: solve a mystery once all its hints are earned (used for
    // mysteries that have no separate top-level target).
    maybeSolveByHints(myst) {
      if (!myst) return false;
      if (myst.target) return false;          // handled by maybeSolveMystery
      if (myst.id === 'manga_mode') return false;
      if (M.isSolved(myst.id)) return false;
      if (myst.requires && !M.isSolved(myst.requires)) return false;
      const hints = myst.hints || [];
      if (hints.length === 0) return false;
      if (!hints.every(h => M.hasHint(h.id))) return false;
      return M.solve(myst.id);
    },

    // ── Manga mode helpers ────────────────────────────────────────────────
    // True once all three manga-mode hint syllables are earned (codeword
    // becomes typable on the hub).
    mangaCodewordReady() {
      return M.hasHint('shan') && M.hasHint('kuh') && M.hasHint('lay');
    },
    // Called by the hub when the player types the full codeword.
    triggerMangaUnlock() {
      try { localStorage.setItem('godgames_manga', '1'); } catch (_e) {}
      M.solve('manga_mode');
    },
  };

  // Accept either 'foo' or 'hint.foo' for ergonomic call sites.
  function stripHintPrefix(id) {
    return id.startsWith('hint.') ? id.slice(5) : id;
  }

  window.GodGames.Mysteries = M;
})();
