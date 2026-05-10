(function () {
  function register() {
    const M = window.Manga;
    if (!M || !M.assets || typeof M.assets.define !== 'function') {
      setTimeout(register, 0);
      return;
    }

    const cell = 362;
    const frame = (col, row, anchorY) => ({ x: col * cell, y: row * cell, w: cell, h: cell, anchorX: cell / 2, anchorY: anchorY || cell * 0.76 });

    M.assets.define('godgames.orion.scorpionSheet', {
      src: 'assets/manga/orion/orion-scorpion-sheet.png',
      frames: {
        orionIdle:     frame(0, 0),
        orionRun:      frame(1, 0),
        orionJump:     frame(2, 0),
        orionStab:     frame(3, 0),
        orionThrow:    frame(0, 1),
        orionDodge:    frame(1, 1, cell * 0.80),
        scorpionIdle:  frame(2, 1, cell * 0.70),
        scorpionClaw:  frame(3, 1, cell * 0.70),
        scorpionSting: frame(0, 2, cell * 0.70),
        scorpionCharge:frame(1, 2, cell * 0.70),
        scorpionHurt:  frame(2, 2, cell * 0.70),
        scorpionDead:  frame(3, 2, cell * 0.70),
      },
      meta: {
        usage: 'Manga-mode Orion and giant scorpion gameplay poses.',
      },
    });
  }

  register();
})();
