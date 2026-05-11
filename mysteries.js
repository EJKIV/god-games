// mysteries.js — God Games puzzle progression.
//
// The toad journal gives the first omen, then each god game contributes ONE
// fragment toward a Greek-mythological invocation. Solving a game's secret
// yields:
//   • One letter fragment toward the codeword.
//   • A canonical clue that explains how this realm points to the next myth.
//   • A brief MythCinematic overlay: the player is carried to a transitional
//     Greek-mythology location (Oceanus, Asphodel, Erebus, Tartarus).
//
// As more games ship, each new game contributes a new letter and the LAST-
// added game inherits the "call to Zeus" final hint. Today the order is:
//   Icarus  → 'z' (Oceanus)
//   Orion   → 'e' (Asphodel Meadows)
//   Achilles→ 'u' (Erebus)
//   Perseus → 's' (Tartarus)
//
// Final unlock: type the hidden codeword on Mt. Olympus while the storm builds.
// 'shankle' remains as a dev bypass.

(function () {
  if (typeof window === 'undefined') return;
  window.GodGames = window.GodGames || {};

  const CHAIN_VERSION = 'v3';
  const CHAIN_VERSION_KEY = 'godgames_mystery_chain_version';
  const CODE_HINTS = new Set(['z', 'e', 'u', 's']);
  const CHAIN_CLUES = new Set(['first', 'second', 'third', 'fourth']);
  const LEGACY_CHAIN_UNLOCKS = new Set([
    'hint.z', 'hint.e', 'hint.u', 'hint.s',
    'clue.first', 'clue.second', 'clue.third', 'clue.fourth',
    'manga_mode', 'hint.zeus_call',
  ]);
  const LEGACY_CHAIN_COUNTERS = new Set(['mysteries_solved_count']);

  // MythCinematic uses the portable Manga.fx.cinematic factory if the manga
  // library has loaded. Falls back to a minimal stub if it hasn't (so tests
  // and bare pages still work).
  function makeCinematic() {
    const art = window.GodGames && window.GodGames.MangaArt;
    if (art && typeof art.createCinematic === 'function' && art.mangaEnabled && art.mangaEnabled()) {
      return art.createCinematic();
    }
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
    CHAIN_VERSION,

    // ── Clue chain ───────────────────────────────────────────────────────
    // The toad journal guides a fixed myth path, but discoveries remain open:
    // a later clue can be found early and the journal will mark it as such.
    prologueClue: {
      id: 'clue.toad',
      order: 0,
      title: 'THE TOAD SEES THE FIRST STEP',
      source: 'the mushroom at Olympus',
      targetGame: 'icarus',
      targetHint: 'hint.z',
      actionVerb: 'rise',
      realm: 'Olympus',
      realmId: 'olympus',
      riddle: 'The small watcher begins with the boy of wax. Seek the middle path he refused, then rise until the golden eye starts to burn.',
      text: 'The small watcher begins with the boy of wax. Seek the middle path he refused, then rise until the golden eye starts to burn.',
      mythBasis: 'Daedalus warned Icarus not to fly too high, but the sun drew him upward and the wax failed.',
      journalNudge: 'Find the flight game. The clue is not in winning; it is in repeating the mistake the myth warns against.',
      uncoveredText: 'The first step is a warning, not a victory. Icarus must choose the sun.',
      purpose: 'Four fragments form the name that wakes the mountain.',
    },
    clues: [
      {
        id: 'clue.first',
        order: 1,
        title: 'THE WORLD RIM POINTS UPWARD',
        source: 'icarus',
        targetGame: 'orion',
        revealedBy: 'hint.z',
        targetHint: 'hint.e',
        placeId: 'oceanus',
        realm: 'River Oceanus',
        actionVerb: 'gaze',
        letter: 'Z',
        text: 'Oceanus circles the world where Icarus falls. From that rim, look for the hunter who became stars; stand beneath his pattern and keep still.',
        riddle: 'Where the fallen wing reaches the world-rim, look upward for the hunter made of stars. Stand below him and do not move.',
        mythBasis: 'Oceanus marks the edge of the ancient world; Orion was set among the constellations after death.',
        realmUncoveringText: 'The river at the world boundary does not send you onward by land. It turns your eyes upward, from the fall of Icarus to Orion in the sky.',
        journalNudge: 'In Orion, stillness matters more than attack. Watch the constellation, not the scorpion.',
        uncoveredText: 'The wax gives the first letter, but the river points to a hunter above it.',
        purpose: 'The letters are not prizes. They are a name being assembled by myth.',
        pointsAt: 'orion',
      },
      {
        id: 'clue.second',
        order: 2,
        title: 'THE MEADOW KEEPS THE SHADE',
        source: 'orion',
        targetGame: 'achilles',
        revealedBy: 'hint.e',
        targetHint: 'hint.u',
        placeId: 'asphodel',
        realm: 'Asphodel Meadows',
        actionVerb: 'answer three times',
        letter: 'E',
        text: 'Asphodel keeps the ordinary dead, but one friend will not stay ordinary. Let Patroclus be heard in bronze: answer the archers three times.',
        riddle: 'The gray meadow is full of quiet shades. One friend is not quiet. When bronze is drawn against you, answer him three times.',
        mythBasis: 'Patroclus\' death drives Achilles back into battle; the clue turns that grief into deliberate counterstrikes.',
        realmUncoveringText: 'Asphodel is not a battlefield, but it is full of shades. The one that matters is Patroclus, whose death turns Achilles from refusal to vengeance.',
        journalNudge: 'In Achilles, do not merely survive the arrows. Time countershots so the friend\'s shade is answered three times in a short span.',
        uncoveredText: 'The hunter gives the second letter, and the gray dead point to Achilles\' friend.',
        purpose: 'Each realm translates one myth into the next game\'s hidden action.',
        pointsAt: 'achilles',
      },
      {
        id: 'clue.third',
        order: 3,
        title: 'THE GLOOM HIDES A MARK',
        source: 'achilles',
        targetGame: 'perseus',
        revealedBy: 'hint.u',
        targetHint: 'hint.s',
        placeId: 'erebus',
        realm: 'Erebus',
        actionVerb: 'find the mark',
        letter: 'U',
        text: 'Erebus is the dark before the underworld. In the cave of reflection, do not mistake every serpent for the answer; seek the sigma cut into stone.',
        riddle: 'Before Tartarus, the dark teaches suspicion. In the mirror hero\'s cave, the true serpent is a letter cut into stone.',
        mythBasis: 'Perseus survives Medusa by reflection; this clue asks the player to read the chamber, not just fight what moves.',
        realmUncoveringText: 'Erebus is a threshold, a place where shapes are half-seen. It teaches the Perseus clue: trust reflection, but look for the carved sign.',
        journalNudge: 'In Perseus, the hidden answer is a sigma mark. It is not the obvious Gorgon or the moving snakes.',
        uncoveredText: 'Patroclus gives the third letter, and the gloom points toward a carved serpent-letter.',
        purpose: 'The puzzle grows less direct as the myths move deeper under the world.',
        pointsAt: 'perseus',
      },
      {
        id: 'clue.fourth',
        order: 4,
        title: 'THE DEEP PRISON NAMES THE KING',
        source: 'perseus',
        targetGame: 'olympus',
        revealedBy: 'hint.s',
        targetMystery: 'manga_mode',
        placeId: 'tartarus',
        realm: 'Tartarus',
        actionVerb: 'speak',
        letter: 'S',
        text: 'Tartarus holds what even the gods fear. Carry Z, E, U, and S back to Olympus; speak the king\'s name where lightning gathers.',
        riddle: 'The deepest prison gives no new road. It gives the name above all roads: return to the mountain and speak it into the storm.',
        mythBasis: 'Zeus is the Olympian king who overthrew the Titans and rules through the thunderbolt.',
        realmUncoveringText: 'Tartarus is where the Titans are bound. From that depth, the puzzle points to their conqueror: Zeus, the thunderer on Olympus.',
        journalNudge: 'Return to the hub. On Olympus, type the four letters you earned in order.',
        uncoveredText: 'The sigma completes the name. The mountain is waiting for thunder.',
        purpose: 'The invocation is the key to the manga world.',
        pointsAt: 'olympus-call-zeus',
      },
    ],

    findClue(id) {
      if (!id) return null;
      if (id === M.prologueClue.id) return M.decorateClue(M.prologueClue);
      for (const c of M.clues) {
        if (c.id === id || storageClueId(c.id) === id) return M.decorateClue(c);
      }
      return null;
    },
    clueForHint(id) {
      const fullId = storageHintId(id || '');
      return M.clues.find(c => storageHintId(c.revealedBy) === fullId) || null;
    },
    hintForClue(clue) {
      return clue && clue.revealedBy ? clue.revealedBy : null;
    },
    targetMet(clue) {
      if (!window.Engine || !Engine.unlock || !clue) return false;
      if (clue.targetHint) return M.hasHint(clue.targetHint);
      if (clue.targetMystery) return M.isSolved(clue.targetMystery);
      return false;
    },
    clueUnlocked(clue) {
      if (!clue) return false;
      if (clue.id === M.prologueClue.id) return true;
      if (!window.Engine || !Engine.unlock) return false;
      return M.storedClueUnlocked(clue);
    },
    storedClueUnlocked(clue) {
      if (!clue || !window.Engine || !Engine.unlock) return false;
      if (clue.id === M.prologueClue.id) return true;
      return Engine.unlock.has(storageClueId(clue.id));
    },
    firstUnmetOrder() {
      if (!window.Engine || !Engine.unlock) return 0;
      if (!M.hasHint('z')) return 0;
      for (const c of M.clues) {
        if (!M.targetMet(c)) return c.order;
      }
      return M.clues.length + 1;
    },
    decorateClue(clue) {
      if (!clue) return null;
      const unlocked = M.clueUnlocked(clue);
      const resolved = M.targetMet(clue);
      const firstUnmet = M.firstUnmetOrder();
      return Object.assign({}, clue, {
        unlocked,
        resolved,
        foundEarly: unlocked && clue.order > firstUnmet,
        current: unlocked && !resolved && clue.order === firstUnmet,
        status: resolved ? 'fulfilled' : (unlocked && clue.order > firstUnmet ? 'found early' : 'active'),
      });
    },

    // ── Mystery definitions ──────────────────────────────────────────────
    list: [
      {
        id: 'manga_mode',
        lockedTitle: '???',
        lockedFlavor: 'Four myths, four fragments. The mountain waits for the name.',
        // Each hint contributes one fragment of the codeword. solveOrder
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
            id: 'hint.s', letter: 'S',
            fragment: '"S" — not from the Gorgon, but from the mark cut into stone.',
            mythLocation: { name: 'TARTARUS', flavor: 'the deep prison of titans', color: '#702030' },
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
      const fullId = storageHintId(id);
      const ok = Engine.unlock.set(fullId);
      if (ok) {
        const legacyId = legacyHintId(id);
        if (legacyId !== fullId) Engine.unlock.set(legacyId);
        // If this hint carries a mythLocation, fire the cinematic so the
        // player witnesses the discovery. opts.silent skips the cinematic.
        const hint = M.findHint(fullId);
        if (hint && hint.mythLocation && !(opts && opts.silent)) {
          MythCinematic.trigger(hint.mythLocation.name, hint.mythLocation.flavor, hint.mythLocation.color);
        }
        // Auto-cascade: any hint with autoEarnsAfter pointing entirely at
        // earned hints now earns automatically.
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
      return Engine.unlock.has(storageHintId(id));
    },
    findHint(fullId) {
      const wanted = storageHintId(fullId);
      for (const m of M.list) {
        for (const h of m.hints || []) if (storageHintId(h.id) === wanted) return h;
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
      return Engine.unlock.has(storageMysteryId(mysteryId));
    },
    solve(mysteryId) {
      if (!window.Engine || !Engine.unlock) return false;
      const id = storageMysteryId(mysteryId);
      const ok = Engine.unlock.set(id);
      if (id !== mysteryId) Engine.unlock.set(mysteryId);
      return ok;
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
    // True once every codeword fragment has been uncovered as a clue mark.
    // Loose synced hint ids are not enough to invoke the mountain.
    codewordLetterUnlocked(index) {
      const letter = String(M.MANGA_CODEWORD[index] || '').toUpperCase();
      if (!letter) return false;
      const clue = M.clues.find(c => String(c.letter || '').toUpperCase() === letter);
      return !!(clue && M.storedClueUnlocked(clue));
    },
    mangaCodewordReady() {
      return M.MANGA_CODEWORD.split('').every((_ch, index) => M.codewordLetterUnlocked(index));
    },
    triggerMangaUnlock() {
      try { localStorage.setItem('godgames_manga', '1'); } catch (_e) {}
      M.solve('manga_mode');
    },

    // ── unlockAndDepart ──────────────────────────────────────────────────
    // Game-side mystery payoff: end the run, take the player to the
    // mythological place, hand them a clue toward the next mystery.
    //
    //   GodGames.Mysteries.unlockAndDepart({
    //     hintId:  'z',                 // earns the manga-mode letter
    //     placeId: 'oceanus',           // place.html target
    //     fromGame:'icarus',            // which character poses in the place
    //     extraUnlocks: ['hint.glyph_first'],  // optional companion unlocks
    //   });
    //
    // Steps: earn hint → reveal that hint's chain clue → maintain the legacy
    // solved counter → save any silent unlocks → submit score (best-effort) → navigate. Set
    // window.GodGames.suppressDepart = true to skip navigation in tests.
    // Per-page-load guard so a trigger that fires on consecutive frames
    // doesn't queue multiple navigations. Reset naturally when the page
    // navigates away.
    _firedThisLoad: false,

    unlockAndDepart(opts) {
      if (M._firedThisLoad) return;
      opts = opts || {};
      let revealedClueId = null;
      const hintId = opts.hintId ? storageHintId(opts.hintId) : '';
      const chainClue = hintId ? M.clueForHint(hintId) : null;
      if (window.Engine && Engine.unlock) {
        // Only the first-ever discovery advances the chain. Re-triggers on
        // subsequent runs still navigate to the place (so the player can
        // re-experience the cinematic) but don't double-count or re-reveal.
        const isNew = hintId && !Engine.unlock.has(hintId);
        if (isNew) {
          M.earnHint(hintId, { silent: true });
          for (const id of opts.extraUnlocks || []) Engine.unlock.set(String(id));
          Engine.unlock.tally('mysteries_solved_count');
          if (chainClue) {
            const clueId = storageClueId(chainClue.id);
            Engine.unlock.set(clueId);
            if (clueId !== chainClue.id) Engine.unlock.set(chainClue.id);
            revealedClueId = chainClue.id;
          }
        } else if (chainClue && hintId && Engine.unlock.has(hintId)) {
          const clueId = storageClueId(chainClue.id);
          if (!M.storedClueUnlocked(chainClue)) {
            Engine.unlock.set(clueId);
            if (clueId !== chainClue.id) Engine.unlock.set(chainClue.id);
          }
          if (M.storedClueUnlocked(chainClue)) revealedClueId = chainClue.id;
        }
      }
      try { if (typeof window.GodGames.submitNow === 'function') window.GodGames.submitNow(); }
      catch (_e) {}
      M._firedThisLoad = true;
      if (window.GodGames && window.GodGames.suppressDepart) return;
      const params = new URLSearchParams();
      if (opts.placeId)  params.set('id',   opts.placeId);
      if (opts.fromGame) params.set('from', opts.fromGame);
      if (opts.hintId)   params.set('hint', opts.hintId);
      if (revealedClueId) params.set('clue', revealedClueId);
      setTimeout(() => { location.href = 'place.html?' + params.toString(); }, 60);
    },

    filterProgressState(state) {
      return filterProgressState(state);
    },

    resetLocalChainForTesting() {
      runChainResetMigration({ force: true, keepVersion: false });
    },

    // Convenience helpers used by olympus-clues.html.
    solvedCount() {
      if (!window.Engine || !Engine.unlock) return 0;
      return ['z', 'e', 'u', 's'].reduce((n, id) => n + (M.hasHint(id) ? 1 : 0), 0);
    },
    revealedClues() {
      if (!window.Engine || !Engine.unlock) return [];
      return M.clues.filter(c => M.clueUnlocked(c)).map(c => M.decorateClue(c));
    },
    nextRiddle() {
      return M.journalState().current || M.journalState().future || null;
    },
    journalState() {
      const currentOrder = M.firstUnmetOrder();
      const decorated = M.clues.map(c => M.decorateClue(c));
      const earned = decorated.filter(c => c.unlocked);
      const current = currentOrder === 0
        ? M.decorateClue(M.prologueClue)
        : decorated.find(c => c.order === currentOrder && c.unlocked && !c.resolved);
      const future = decorated.find(c => !c.unlocked) || null;
      const early = earned.filter(c => c.foundEarly);
      return {
        prologue: M.decorateClue(M.prologueClue),
        earned,
        early,
        current,
        future,
        solvedCount: M.solvedCount(),
        complete: M.mangaCodewordReady(),
        codeword: M.MANGA_CODEWORD.toUpperCase(),
      };
    },
  };

  function hintBase(id) {
    let s = String(id || '');
    if (s.startsWith('hint.')) s = s.slice(5);
    const versioned = s.match(/^v\d+\.(.+)$/);
    return versioned ? versioned[1] : s;
  }

  function stripHintPrefix(id) {
    return hintBase(id);
  }

  function legacyHintId(id) {
    return 'hint.' + hintBase(id);
  }

  function storageHintId(id) {
    const base = hintBase(id);
    return CODE_HINTS.has(base) ? `hint.${CHAIN_VERSION}.${base}` : `hint.${base}`;
  }

  function storageMysteryId(id) {
    return id === 'manga_mode' ? `manga_mode.${CHAIN_VERSION}` : id;
  }

  function storageClueId(id) {
    const s = String(id || '');
    const versioned = s.match(/^clue\.v\d+\.(.+)$/);
    if (versioned) return `clue.${CHAIN_VERSION}.${versioned[1]}`;
    if (s.startsWith('clue.')) return `clue.${CHAIN_VERSION}.${s.slice(5)}`;
    return s;
  }

  function safeParse(raw) {
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_e) {
      return {};
    }
  }

  function filterProgressState(state, opts) {
    opts = opts || {};
    const input = state && typeof state === 'object' ? state : {};
    const unlocks = Object.create(null);
    const counters = Object.create(null);
    for (const [id, ts] of Object.entries(input.unlocks || {})) {
      if (LEGACY_CHAIN_UNLOCKS.has(id)) continue;
      if (isObsoleteChainUnlock(id)) continue;
      if (opts.dropCurrent && isCurrentChainUnlock(id)) continue;
      unlocks[id] = ts;
    }
    for (const [key, value] of Object.entries(input.counters || {})) {
      if (LEGACY_CHAIN_COUNTERS.has(key)) continue;
      counters[key] = value;
    }
    return { unlocks, counters };
  }

  function isCurrentChainUnlock(id) {
    if (id === storageMysteryId('manga_mode')) return true;
    for (const h of CODE_HINTS) {
      if (id === storageHintId(h)) return true;
    }
    for (const c of ['clue.first', 'clue.second', 'clue.third', 'clue.fourth']) {
      if (id === storageClueId(c)) return true;
    }
    return false;
  }

  function isObsoleteChainUnlock(id) {
    const s = String(id || '');
    const hint = s.match(/^hint\.(?:(v\d+)\.)?([a-z])$/);
    if (hint && CODE_HINTS.has(hint[2])) return s !== storageHintId(hint[2]);

    const clue = s.match(/^clue\.(?:(v\d+)\.)?(first|second|third|fourth)$/);
    if (clue && CHAIN_CLUES.has(clue[2])) return s !== storageClueId(`clue.${clue[2]}`);

    const manga = s.match(/^manga_mode(?:\.(v\d+))?$/);
    if (manga) return s !== storageMysteryId('manga_mode');

    return false;
  }

  function runChainResetMigration(opts) {
    opts = opts || {};
    const force = !!opts.force;
    try {
      if (!force && localStorage.getItem(CHAIN_VERSION_KEY) === CHAIN_VERSION) return;
      const current = filterProgressState({
        unlocks: safeParse(localStorage.getItem('tns.unlocks')),
        counters: safeParse(localStorage.getItem('tns.counters')),
      }, { dropCurrent: force });
      localStorage.setItem('tns.unlocks', JSON.stringify(current.unlocks));
      localStorage.setItem('tns.counters', JSON.stringify(current.counters));
      localStorage.removeItem('godgames_manga');
      if (opts.keepVersion === false) localStorage.removeItem(CHAIN_VERSION_KEY);
      else localStorage.setItem(CHAIN_VERSION_KEY, CHAIN_VERSION);
    } catch (_e) {
      // localStorage may be blocked; puzzle helpers still ignore legacy keys.
    }
  }

  runChainResetMigration();

  window.GodGames.Mysteries = M;
  window.GodGames.MythCinematic = MythCinematic;
})();
