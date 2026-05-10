(function () {
  function register() {
    const M = window.Manga;
    if (!M || !M.assets || typeof M.assets.define !== 'function') {
      setTimeout(register, 0);
      return;
    }

    const cell = 418;
    const frame = (col, row) => ({ x: col * cell, y: row * cell, w: cell, h: cell, anchorX: cell / 2, anchorY: cell * 0.72 });

    M.assets.define('godgames.achilles.actionSheet', {
      src: 'assets/manga/achilles/achilles-action-sheet.png',
      frames: {
        idle:     frame(0, 0),
        runLeft:  frame(1, 0),
        runRight: frame(2, 0),
        bash:     frame(0, 1),
        bow:      frame(1, 1),
        strike:   frame(2, 1),
        hit:      frame(0, 2),
        fallen:   frame(1, 2),
        victory:  frame(2, 2),
      },
      meta: {
        usage: 'Manga-mode Achilles gameplay, title, death, and victory poses.',
      },
    });
  }

  register();
})();
