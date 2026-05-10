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
        animations: {
          perseusIdle:    { frames: ['perseusIdle'], fps: 1, loop: true },
          perseusRun:     { frames: ['perseusRun', 'perseusRun', 'perseusIdle'], fps: 10, loop: true },
          perseusMirror:  { frames: ['perseusMirror'], fps: 1, loop: true },
          perseusSlash:   { frames: ['perseusSlash'], fps: 10, loop: false },
          perseusHit:     { frames: ['perseusStone', 'perseusIdle'], fps: 9, loop: false },
          perseusStone:   { frames: ['perseusStone'], fps: 1, loop: false },
          perseusVictory: { frames: ['perseusVictory'], fps: 1, loop: true },
          medusaIdle:     { frames: ['medusaIdle'], fps: 1, loop: true },
          medusaWatch:    { frames: ['medusaIdle', 'medusaGaze'], fps: 2, loop: true },
          medusaGaze:     { frames: ['medusaGaze'], fps: 1, loop: true },
          medusaHurt:     { frames: ['medusaHurt', 'medusaGaze'], fps: 8, loop: false },
          snakeFly:       { frames: ['snake'], fps: 1, loop: true },
          snakeReflect:   { frames: ['snakeReflect'], fps: 1, loop: true },
          caveHazard:     { frames: ['hazard'], fps: 1, loop: true },
        },
      },
    });

    const chamberW = 1672;
    const chamberH = 941;
    const chamber = (col) => ({ x: col * chamberW, y: 0, w: chamberW, h: chamberH });

    M.assets.define('godgames.perseus.chambers', {
      src: 'assets/manga/perseus/perseus-chambers-v1.jpg',
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
