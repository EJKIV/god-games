(function () {
  function register() {
    const M = window.Manga;
    if (!M || !M.assets || typeof M.assets.define !== 'function') {
      setTimeout(register, 0);
      return;
    }

    const cell = 362;
    const frame = (col, row, anchorY) => ({ x: col * cell, y: row * cell, w: cell, h: cell, anchorX: cell / 2, anchorY: anchorY || cell * 0.78 });

    M.assets.define('godgames.perseus.gorgonSheet', {
      src: 'assets/manga/perseus/perseus-gorgon-sheet.png',
      frames: {
        perseusIdle:    frame(0, 0),
        perseusRun:     frame(1, 0),
        perseusMirror:  frame(2, 0),
        perseusSlash:   frame(3, 0),
        perseusStone:   frame(0, 1),
        perseusVictory: frame(1, 1),
        medusaIdle:     frame(2, 1, cell * 0.78),
        medusaGaze:     frame(3, 1, cell * 0.78),
        medusaHurt:     frame(0, 2, cell * 0.78),
        snake:          frame(1, 2, cell * 0.64),
        snakeReflect:   frame(2, 2, cell * 0.64),
        hazard:         frame(3, 2, cell * 0.72),
      },
      meta: {
        usage: 'Manga-mode Perseus, Medusa, serpent, and cave hazard gameplay poses.',
      },
    });
  }

  register();
})();
