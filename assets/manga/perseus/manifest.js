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
    const placeFrom = page === 'place.html'
      ? String(new URLSearchParams(location.search || '').get('from') || '').toLowerCase()
      : '';
    const shouldPrime = page === 'perseus.html';
    const travelerPreload = shouldPrime || placeFrom === 'perseus';
    function prime(id, frames, opts) {
      if (!shouldPrime) return;
      setTimeout(() => {
        const art = window.GodGames && GodGames.MangaArt;
        if (art && typeof art.primeAsset === 'function') art.primeAsset(id, frames, opts || {});
      }, 0);
    }

    const cell = 362;
    const frame = (col, row, anchorY) => ({ x: col * cell, y: row * cell, w: cell, h: cell, anchorX: cell / 2, anchorY: anchorY || cell * 0.78 });

    M.assets.define('godgames.perseus.gorgonSheet', {
      src: 'assets/manga/perseus/perseus-gorgon-film-v2.png',
      preload: travelerPreload,
      frames: {
        perseusIdle:     frame(0, 0),
        perseusIdle1:    frame(0, 0),
        perseusIdle2:    frame(1, 0),
        perseusIdle3:    frame(2, 0),
        perseusIdle4:    frame(3, 0),
        perseusMirror:   frame(4, 0),
        perseusMirror1:  frame(4, 0),
        perseusMirror2:  frame(5, 0),
        perseusStone:    frame(6, 0),
        perseusVictory:  frame(7, 0),
        perseusRun:      frame(0, 1),
        perseusRun1:     frame(0, 1),
        perseusRun2:     frame(1, 1),
        perseusRun3:     frame(2, 1),
        perseusRun4:     frame(3, 1),
        perseusRun5:     frame(4, 1),
        perseusRun6:     frame(5, 1),
        perseusRun7:     frame(6, 1),
        perseusRun8:     frame(7, 1),
        perseusSlash:    frame(0, 2),
        perseusSlash1:   frame(0, 2),
        perseusSlash2:   frame(1, 2),
        perseusSlash3:   frame(2, 2),
        perseusSlash4:   frame(3, 2),
        hazard:          frame(4, 2, cell * 0.72),
        hazard1:         frame(4, 2, cell * 0.72),
        hazard2:         frame(5, 2, cell * 0.72),
        hazard3:         frame(6, 2, cell * 0.72),
        hazard4:         frame(7, 2, cell * 0.72),
        medusaIdle:      frame(0, 3, cell * 0.78),
        medusaIdle1:     frame(0, 3, cell * 0.78),
        medusaIdle2:     frame(1, 3, cell * 0.78),
        medusaIdle3:     frame(2, 3, cell * 0.78),
        medusaIdle4:     frame(3, 3, cell * 0.78),
        medusaGaze:      frame(4, 3, cell * 0.78),
        medusaGaze1:     frame(4, 3, cell * 0.78),
        medusaGaze2:     frame(5, 3, cell * 0.78),
        medusaHurt:      frame(6, 3, cell * 0.78),
        medusaHurt1:     frame(6, 3, cell * 0.78),
        medusaHurt2:     frame(7, 3, cell * 0.78),
        snake:           frame(0, 4, cell * 0.64),
        snake1:          frame(0, 4, cell * 0.64),
        snake2:          frame(1, 4, cell * 0.64),
        snake3:          frame(2, 4, cell * 0.64),
        snake4:          frame(3, 4, cell * 0.64),
        snakeReflect:    frame(4, 4, cell * 0.64),
        snakeReflect1:   frame(4, 4, cell * 0.64),
        snakeReflect2:   frame(5, 4, cell * 0.64),
        snakeReflect3:   frame(6, 4, cell * 0.64),
        snakeReflect4:   frame(7, 4, cell * 0.64),
      },
      meta: {
        usage: 'Manga-mode Perseus, Medusa, serpent, and cave hazard film-motion gameplay poses.',
        animations: {
          perseusIdle:    { frames: ['perseusIdle1', 'perseusIdle2', 'perseusIdle3', 'perseusIdle4'], fps: 4, loop: true },
          perseusRun:     { frames: ['perseusRun1', 'perseusRun2', 'perseusRun3', 'perseusRun4', 'perseusRun5', 'perseusRun6', 'perseusRun7', 'perseusRun8'], fps: 12, loop: true },
          perseusMirror:  { frames: ['perseusMirror1', 'perseusMirror2'], fps: 4, loop: true },
          perseusSlash:   { frames: ['perseusSlash1', 'perseusSlash2', 'perseusSlash3', 'perseusSlash4'], fps: 12, loop: false },
          perseusHit:     { frames: ['perseusStone', 'perseusIdle'], fps: 8, loop: false },
          perseusStone:   { frames: ['perseusStone'], fps: 1, loop: false },
          perseusVictory: { frames: ['perseusVictory'], fps: 1, loop: true },
          medusaIdle:     { frames: ['medusaIdle1', 'medusaIdle2', 'medusaIdle3', 'medusaIdle4'], fps: 4, loop: true },
          medusaWatch:    { frames: ['medusaIdle1', 'medusaIdle2', 'medusaIdle3', 'medusaIdle4', 'medusaGaze1', 'medusaGaze2'], fps: 4, loop: true },
          medusaGaze:     { frames: ['medusaGaze1', 'medusaGaze2'], fps: 5, loop: true },
          medusaHurt:     { frames: ['medusaHurt1', 'medusaHurt2', 'medusaGaze1'], fps: 7, loop: false },
          snakeFly:       { frames: ['snake1', 'snake2', 'snake3', 'snake4'], fps: 9, loop: true },
          snakeReflect:   { frames: ['snakeReflect1', 'snakeReflect2', 'snakeReflect3', 'snakeReflect4'], fps: 9, loop: true },
          caveHazard:     { frames: ['hazard1', 'hazard2', 'hazard3', 'hazard4'], fps: 7, loop: true },
        },
      },
    });
    prime('godgames.perseus.gorgonSheet');

    const chamberW = 1672;
    const chamberH = 941;
    const chamber = (col) => ({ x: col * chamberW, y: 0, w: chamberW, h: chamberH });

    M.assets.define('godgames.perseus.chambers', {
      src: 'assets/manga/perseus/perseus-chambers-v1.jpg',
      preload: shouldPrime,
      frames: {
        chamber1: chamber(0),
        chamber2: chamber(1),
        chamber3: chamber(2),
        title: chamber(0),
        death: chamber(2),
        victory: chamber(2),
      },
      meta: {
        usage: 'Clean three-chamber Perseus manga cave stage atlas with no active actors, hazards, beams, or UI baked in.',
      },
    });

    const fxCell = 320;
    const fxFrame = (col, row) => ({
      x: col * fxCell, y: row * fxCell, w: fxCell, h: fxCell,
      anchorX: fxCell / 2, anchorY: fxCell / 2,
    });

    M.assets.define('godgames.perseus.fxHudSheet', {
      src: 'assets/manga/perseus/serpent-fx-hud-v1.png',
      preload: shouldPrime,
      frames: {
        serpentFly:     fxFrame(0, 0),
        serpentReflect: fxFrame(1, 0),
        floorHazard:    fxFrame(2, 0),
        mirrorBeam:     fxFrame(3, 0),
        gazeFlare:      fxFrame(0, 1),
        mirrorDull:     fxFrame(1, 1),
        sigmaSeal:      fxFrame(2, 1),
        veilCrack:      fxFrame(3, 1),
        mirrorImpact:   fxFrame(0, 2),
        hitBurst:       fxFrame(1, 2),
        mirrorIcon:     fxFrame(2, 2),
        swordIcon:      fxFrame(3, 2),
        heartFull:      fxFrame(0, 3),
        heartEmpty:     fxFrame(1, 3),
        stoneShard:     fxFrame(2, 3),
        dustPuff:       fxFrame(3, 3),
      },
      meta: {
        usage: 'Manga/anime Perseus serpents, mirror/gaze effects, Sigma seal, cave hazards, and HUD icons.',
      },
    });
  }

  register();
})();
