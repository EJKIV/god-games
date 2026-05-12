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
    function loadAfterPlaying(id, delay = 800) {
      if (!shouldPrime) return;
      const wait = () => {
        if (window.Engine && Engine.state === 'playing') {
          setTimeout(() => {
            if (M.assets && typeof M.assets.image === 'function') M.assets.image(id);
          }, delay);
        } else {
          setTimeout(wait, 250);
        }
      };
      setTimeout(wait, 0);
    }

    function anchoredFrame(cellW, cellH, bounds, col, row, mode = 'ground', fallbackY = cellH * 0.78) {
      const b = bounds[`${col},${row}`];
      const valid = b && (b[2] - b[0]) > cellW * 0.12 && (b[3] - b[1]) > cellH * 0.12;
      const anchorX = valid && mode === 'center' ? (b[0] + b[2]) / 2 : cellW / 2;
      const anchorY = valid
        ? (mode === 'center' ? (b[1] + b[3]) / 2 : b[3])
        : fallbackY;
      return { x: col * cellW, y: row * cellH, w: cellW, h: cellH, anchorX, anchorY };
    }

    const cellW = 680;
    const cellH = 600;
    const gorgonBounds = {
      '0,0': [105, 46, 330, 362], '1,0': [77, 42, 301, 362], '2,0': [55, 42, 278, 362], '3,0': [47, 44, 276, 362], '4,0': [22, 46, 318, 362], '5,0': [5, 46, 292, 362], '6,0': [45, 0, 362, 362], '7,0': [0, 7, 177, 362],
      '0,1': [53, 0, 339, 362], '1,1': [56, 0, 315, 362], '2,1': [26, 0, 307, 362], '3,1': [29, 0, 337, 362], '4,1': [15, 0, 295, 362], '5,1': [8, 0, 273, 362], '6,1': [6, 0, 294, 362], '7,1': [5, 0, 323, 362],
      '0,2': [44, 0, 307, 351], '1,2': [13, 0, 362, 351], '2,2': [0, 0, 362, 352], '3,2': [0, 0, 362, 349], '4,2': [0, 0, 362, 351], '5,2': [0, 0, 362, 360], '6,2': [0, 0, 362, 362], '7,2': [0, 0, 331, 360],
      '0,3': [55, 19, 319, 362], '1,3': [34, 13, 299, 362], '2,3': [23, 19, 296, 362], '3,3': [33, 19, 287, 362], '4,3': [5, 19, 359, 362], '5,3': [16, 47, 362, 362], '6,3': [0, 0, 362, 362], '7,3': [0, 65, 94, 362],
      '0,4': [17, 0, 339, 309], '1,4': [11, 0, 362, 316], '2,4': [0, 0, 362, 311], '3,4': [0, 0, 324, 324], '4,4': [7, 0, 322, 314], '5,4': [21, 0, 362, 320], '6,4': [0, 0, 362, 316], '7,4': [0, 0, 252, 324],
    };
    const actorFrame = (col, row) => ({
      x: col * cellW, y: row * cellH, w: cellW, h: cellH,
      anchorX: cellW / 2, anchorY: 520,
    });
    const centerFrame = (col, row) => ({
      x: col * cellW, y: row * cellH, w: cellW, h: cellH,
      anchorX: cellW / 2, anchorY: cellH / 2,
    });

    M.assets.define('godgames.perseus.gorgonSheet', {
      src: 'assets/manga/perseus/perseus-gorgon-clean-v1.png',
      preload: travelerPreload,
      frames: {
        perseusIdle:     actorFrame(0, 0),
        perseusIdle1:    actorFrame(0, 0),
        perseusIdle2:    actorFrame(1, 0),
        perseusIdle3:    actorFrame(2, 0),
        perseusIdle4:    actorFrame(3, 0),
        perseusMirror:   actorFrame(4, 0),
        perseusMirror1:  actorFrame(4, 0),
        perseusMirror2:  actorFrame(5, 0),
        perseusStone:    actorFrame(6, 0),
        perseusVictory:  actorFrame(7, 0),
        perseusRun:      actorFrame(0, 1),
        perseusRun1:     actorFrame(0, 1),
        perseusRun2:     actorFrame(1, 1),
        perseusRun3:     actorFrame(2, 1),
        perseusRun4:     actorFrame(3, 1),
        perseusRun5:     actorFrame(4, 1),
        perseusRun6:     actorFrame(5, 1),
        perseusRun7:     actorFrame(6, 1),
        perseusRun8:     actorFrame(7, 1),
        perseusSlash:    actorFrame(0, 2),
        perseusSlash1:   actorFrame(0, 2),
        perseusSlash2:   actorFrame(1, 2),
        perseusSlash3:   actorFrame(2, 2),
        perseusSlash4:   actorFrame(3, 2),
        hazard:          actorFrame(4, 2),
        hazard1:         actorFrame(4, 2),
        hazard2:         actorFrame(5, 2),
        hazard3:         actorFrame(6, 2),
        hazard4:         actorFrame(7, 2),
        medusaIdle:      actorFrame(0, 3),
        medusaIdle1:     actorFrame(0, 3),
        medusaIdle2:     actorFrame(1, 3),
        medusaIdle3:     actorFrame(2, 3),
        medusaIdle4:     actorFrame(3, 3),
        medusaGaze:      actorFrame(4, 3),
        medusaGaze1:     actorFrame(4, 3),
        medusaGaze2:     actorFrame(5, 3),
        medusaHurt:      actorFrame(5, 3),
        medusaHurt1:     actorFrame(5, 3),
        medusaHurt2:     actorFrame(4, 3),
        snake:           centerFrame(0, 4),
        snake1:          centerFrame(0, 4),
        snake2:          centerFrame(1, 4),
        snake3:          centerFrame(2, 4),
        snake4:          centerFrame(3, 4),
        snakeReflect:    centerFrame(4, 4),
        snakeReflect1:   centerFrame(4, 4),
        snakeReflect2:   centerFrame(5, 4),
        snakeReflect3:   centerFrame(6, 4),
        snakeReflect4:   centerFrame(7, 4),
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
      preload: false,
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
    loadAfterPlaying('godgames.perseus.fxHudSheet', 900);
  }

  register();
})();
