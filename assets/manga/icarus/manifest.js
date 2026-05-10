(function () {
  function register() {
    const M = window.Manga;
    if (!M || !M.assets || typeof M.assets.define !== 'function') {
      setTimeout(register, 0);
      return;
    }

    M.assets.define('godgames.icarus.hero', {
      src: 'assets/manga/icarus/icarus-hero.jpg',
      meta: {
        usage: 'Manga-mode Icarus title, tutorial, death, and dive cut-in art.',
      },
    });

    const cell = 418;
    M.assets.define('godgames.icarus.flightSheet', {
      src: 'assets/manga/icarus/icarus-flight-sheet.png',
      frames: {
        glide:    { x: cell * 0, y: cell * 0, w: cell, h: cell, anchorX: 209, anchorY: 209 },
        flapUp:   { x: cell * 1, y: cell * 0, w: cell, h: cell, anchorX: 209, anchorY: 209 },
        flapDown: { x: cell * 2, y: cell * 0, w: cell, h: cell, anchorX: 209, anchorY: 209 },
        dive:     { x: cell * 0, y: cell * 1, w: cell, h: cell, anchorX: 209, anchorY: 209 },
        burn:     { x: cell * 1, y: cell * 1, w: cell, h: cell, anchorX: 209, anchorY: 209 },
        wet:      { x: cell * 2, y: cell * 1, w: cell, h: cell, anchorX: 209, anchorY: 209 },
        falling:  { x: cell * 0, y: cell * 2, w: cell, h: cell, anchorX: 209, anchorY: 209 },
        speed:    { x: cell * 1, y: cell * 2, w: cell, h: cell, anchorX: 209, anchorY: 209 },
        recover:  { x: cell * 2, y: cell * 2, w: cell, h: cell, anchorX: 209, anchorY: 209 },
      },
      meta: {
        sourcePrompt: '3x3 chroma-key manga/anime Icarus gameplay sprite sheet, generated to match the Icarus hero art.',
      },
    });
  }

  register();
})();
