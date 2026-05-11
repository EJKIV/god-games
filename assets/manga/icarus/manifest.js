(function () {
  function register() {
    const M = window.Manga;
    if (!M || !M.assets || typeof M.assets.define !== 'function') {
      setTimeout(register, 0);
      return;
    }
    try {
      if (localStorage.getItem('godgames_manga') !== '1') return;
    } catch (_e) {
      return;
    }
    const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    const shouldPrime = page === 'icarus.html';
    function prime(id, frames, opts) {
      if (!shouldPrime) return;
      setTimeout(() => {
        const art = window.GodGames && GodGames.MangaArt;
        if (art && typeof art.primeAsset === 'function') art.primeAsset(id, frames, opts || {});
      }, 0);
    }

    M.assets.define('godgames.icarus.hero', {
      src: 'assets/manga/icarus/icarus-hero.jpg',
      meta: {
        usage: 'Manga-mode Icarus title, tutorial, death, and dive cut-in art.',
      },
    });

    M.assets.define('godgames.icarus.flightStageV2', {
      src: 'assets/manga/icarus/icarus-flight-stage-v2.jpg',
      meta: {
        usage: 'Clean Icarus manga gameplay flight stage with sun, safe lane, sea depth, and no baked-in live actors.',
      },
    });

    const cell = 418;
    const sheetFrame = (col, row) => ({ x: cell * col, y: cell * row, w: cell, h: cell, anchorX: 209, anchorY: 209 });
    M.assets.define('godgames.icarus.flightSheet', {
      src: 'assets/manga/icarus/icarus-flight-loops-v1.png',
      frames: {
        flap1:    sheetFrame(0, 0),
        flap2:    sheetFrame(1, 0),
        flap3:    sheetFrame(2, 0),
        flap4:    sheetFrame(3, 0),
        flap5:    sheetFrame(4, 0),
        flap6:    sheetFrame(5, 0),
        flap7:    sheetFrame(6, 0),
        flap8:    sheetFrame(7, 0),
        glide1:   sheetFrame(0, 1),
        glide2:   sheetFrame(1, 1),
        glide3:   sheetFrame(2, 1),
        glide4:   sheetFrame(3, 1),
        speed1:   sheetFrame(4, 1),
        speed2:   sheetFrame(5, 1),
        speed3:   sheetFrame(6, 1),
        speed4:   sheetFrame(7, 1),
        dive:     sheetFrame(0, 2),
        burn:     sheetFrame(1, 2),
        wet:      sheetFrame(2, 2),
        falling:  sheetFrame(3, 2),
        recover:  sheetFrame(4, 2),
        flapDown: sheetFrame(5, 2),
        glide:    sheetFrame(6, 2),
        flapUp:   sheetFrame(7, 2),
        speed:    sheetFrame(4, 1),
      },
      meta: {
        sourcePrompt: '3x3 chroma-key manga/anime Icarus gameplay sprite sheet, generated to match the Icarus hero art.',
        animations: {
          flap: { frames: ['flap1', 'flap2', 'flap3', 'flap4', 'flap5', 'flap6', 'flap7', 'flap8'], fps: 14, loop: true },
          glide: { frames: ['glide1', 'glide2', 'glide3', 'glide4'], fps: 5, loop: true },
          speed: { frames: ['speed1', 'speed2', 'speed3', 'speed4'], fps: 8, loop: true },
          dive: { frames: ['dive'], fps: 1, loop: false },
          burn: { frames: ['burn'], fps: 1, loop: false },
          wet: { frames: ['wet'], fps: 1, loop: false },
          falling: { frames: ['falling'], fps: 1, loop: false },
          recover: { frames: ['recover'], fps: 1, loop: false },
        },
      },
    });
    prime('godgames.icarus.flightSheet');

    const atlasCell = 2512 / 8;
    const atlasFrame = (col, row, anchorY = atlasCell / 2) => ({
      x: col * atlasCell, y: row * atlasCell, w: atlasCell, h: atlasCell,
      anchorX: atlasCell / 2, anchorY,
    });

    M.assets.define('godgames.icarus.stageAtlasV2', {
      src: 'assets/manga/icarus/icarus-stage-atlas-loops-v1.png',
      frames: {
        eagleFly1:      atlasFrame(0, 0),
        eagleFly2:      atlasFrame(1, 0),
        eagleFly3:      atlasFrame(2, 0),
        eagleFly4:      atlasFrame(3, 0),
        eagleFly5:      atlasFrame(4, 0),
        eagleFly6:      atlasFrame(5, 0),
        eagleDive:      atlasFrame(6, 0),
        eagleHit:       atlasFrame(7, 0),
        orcaBreach1:    atlasFrame(0, 1, atlasCell * 0.76),
        orcaBreach2:    atlasFrame(1, 1, atlasCell * 0.76),
        orcaBreach3:    atlasFrame(2, 1, atlasCell * 0.77),
        orcaBreach4:    atlasFrame(3, 1, atlasCell * 0.78),
        orcaBreach5:    atlasFrame(4, 1, atlasCell * 0.78),
        orcaBreach6:    atlasFrame(5, 1, atlasCell * 0.76),
        orcaChurn:      atlasFrame(6, 1),
        orcaSplash:     atlasFrame(7, 1, atlasCell * 0.74),
        daedalusFly1:   atlasFrame(0, 2, atlasCell * 0.62),
        daedalusFly2:   atlasFrame(1, 2, atlasCell * 0.62),
        daedalusFly3:   atlasFrame(2, 2, atlasCell * 0.62),
        daedalusFly4:   atlasFrame(3, 2, atlasCell * 0.62),
        daedalusRescue: atlasFrame(0, 3, atlasCell * 0.82),
        islandReady:    atlasFrame(1, 3, atlasCell * 0.78),
        islandSinking:  atlasFrame(2, 3, atlasCell * 0.76),
        featherBurst:   atlasFrame(3, 3),
        burnFlare:      atlasFrame(4, 3),
        waterDrips:     atlasFrame(5, 3),
        diveAura:       atlasFrame(6, 3),
        eagleCruise:    atlasFrame(0, 4),
        eagleAttack:    atlasFrame(1, 4),
        orcaBreach:     atlasFrame(2, 4, atlasCell * 0.76),
        orcaBite:       atlasFrame(3, 4, atlasCell * 0.78),
        daedalusFly:    atlasFrame(4, 4, atlasCell * 0.62),
      },
      meta: {
        usage: 'Icarus manga gameplay enemies, Daedalus rescue, islands, and hazard FX.',
        animations: {
          eagleFly:   { frames: ['eagleFly1', 'eagleFly2', 'eagleFly3', 'eagleFly4', 'eagleFly5', 'eagleFly6'], fps: 11, loop: true },
          eagleDive:  { frames: ['eagleDive'], fps: 1, loop: false },
          eagleHit:   { frames: ['eagleHit'], fps: 1, loop: false },
          orcaBreach: { frames: ['orcaBreach1', 'orcaBreach2', 'orcaBreach3', 'orcaBreach4', 'orcaBreach5', 'orcaBreach6'], fps: 10, loop: false },
          daedalusFly: { frames: ['daedalusFly1', 'daedalusFly2', 'daedalusFly3', 'daedalusFly4'], fps: 6, loop: true },
        },
      },
    });
    prime('godgames.icarus.stageAtlasV2');
  }

  register();
})();
