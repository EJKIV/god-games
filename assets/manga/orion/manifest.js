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
    const shouldPrime = page === 'orion.html';
    const travelerPreload = shouldPrime || placeFrom === 'orion';
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

    const cell = 362;
    const frame = (col, row, anchorY) => ({ x: col * cell, y: row * cell, w: cell, h: cell, anchorX: cell / 2, anchorY: anchorY || cell * 0.76 });

    M.assets.define('godgames.orion.scorpionSheet', {
      src: 'assets/manga/orion/orion-scorpion-sheet.png',
      preload: false,
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

    M.assets.define('godgames.orion.arenaCleanV1', {
      src: 'assets/manga/orion/orion-arena-clean-v1.jpg',
      preload: shouldPrime,
      meta: {
        usage: 'Clean Orion manga gameplay arena with no baked-in fighters, projectiles, or blocking foreground figures.',
      },
    });

    const ow = 2512 / 8;
    const oh = 942 / 3;
    function anchoredFrame(cellW, cellH, bounds, col, row, mode = 'ground', fallbackY = cellH * 0.90) {
      const b = bounds[`${col},${row}`];
      const valid = b && (b[2] - b[0]) > cellW * 0.12 && (b[3] - b[1]) > cellH * 0.12;
      const anchorX = valid && mode === 'center' ? (b[0] + b[2]) / 2 : cellW / 2;
      const anchorY = valid
        ? (mode === 'center' ? (b[1] + b[3]) / 2 : b[3])
        : fallbackY;
      return { x: col * cellW, y: row * cellH, w: cellW, h: cellH, anchorX, anchorY };
    }
    const orionBounds = {
      '0,0': [73, 49, 281, 290], '1,0': [12, 44, 314, 290], '2,0': [0, 47, 314, 290], '3,0': [0, 41, 314, 289], '4,0': [0, 45, 314, 281], '5,0': [0, 77, 314, 288], '6,0': [0, 99, 314, 285], '7,0': [0, 213, 281, 286],
      '0,1': [23, 56, 314, 314], '1,1': [0, 51, 314, 242], '2,1': [0, 53, 314, 241], '3,1': [0, 51, 309, 226], '4,1': [11, 52, 314, 242], '5,1': [0, 55, 314, 314], '6,1': [0, 57, 314, 209], '7,1': [0, 52, 296, 241],
      '0,2': [28, 0, 314, 225], '1,2': [0, 29, 314, 225], '2,2': [0, 33, 314, 227], '3,2': [0, 61, 314, 224], '4,2': [0, 3, 274, 227], '5,2': [35, 0, 314, 227], '6,2': [0, 92, 314, 225], '7,2': [0, 21, 274, 225],
    };
    const orionFrame = (col, row) => anchoredFrame(ow, oh, orionBounds, col, row, 'ground', oh * 0.90);

    M.assets.define('godgames.orion.orionAnimV1', {
      src: 'assets/manga/orion/orion-film-v2.png',
      preload: travelerPreload,
      frames: {
        idle1:        orionFrame(0, 0),
        idle2:        orionFrame(1, 0),
        idle3:        orionFrame(2, 0),
        idle4:        orionFrame(3, 0),
        jump:         orionFrame(4, 0),
        dodge:        orionFrame(5, 0),
        hit:          orionFrame(6, 0),
        prone:        orionFrame(7, 0),
        run1:         orionFrame(0, 1),
        run2:         orionFrame(1, 1),
        run3:         orionFrame(2, 1),
        run4:         orionFrame(3, 1),
        run5:         orionFrame(4, 1),
        run6:         orionFrame(5, 1),
        run7:         orionFrame(6, 1),
        run8:         orionFrame(7, 1),
        spearWindup:  orionFrame(0, 2),
        spearRelease: orionFrame(1, 2),
        stabWindup:   orionFrame(2, 2),
        stabThrust:   orionFrame(3, 2),
        stabRecover:  orionFrame(4, 2),
        victory:      orionFrame(5, 2),
        fallen:       orionFrame(6, 2),
      },
      meta: {
        usage: 'Manga/anime Orion film-motion gameplay, title, death, and victory animation sheet.',
        animations: {
          idle:    { frames: ['idle1', 'idle2', 'idle3', 'idle4'], fps: 4, loop: true },
          run:     { frames: ['run1', 'run2', 'run3', 'run4', 'run5', 'run6', 'run7', 'run8'], fps: 12, loop: true },
          jump:    { frames: ['jump'], fps: 1, loop: false },
          throw:   { frames: ['spearWindup', 'spearRelease'], fps: 10, loop: false },
          stab:    { frames: ['stabWindup', 'stabThrust', 'stabRecover'], fps: 13, loop: false },
          dodge:   { frames: ['dodge'], fps: 1, loop: false },
          hit:     { frames: ['hit'], fps: 1, loop: false },
          prone:   { frames: ['prone'], fps: 1, loop: false },
          fallen:  { frames: ['fallen'], fps: 1, loop: false },
          victory: { frames: ['victory'], fps: 1, loop: false },
        },
      },
    });
    prime('godgames.orion.orionAnimV1');

    const sw = 2808 / 8;
    const sh = 1124 / 4;
    const scorpionBounds = {
      '0,0': [34, 29, 351, 281], '1,0': [0, 29, 351, 281], '2,0': [0, 29, 351, 281], '3,0': [0, 45, 351, 281], '4,0': [0, 131, 351, 281], '5,0': [0, 24, 348, 281], '6,0': [14, 196, 351, 281], '7,0': [0, 183, 334, 281],
      '0,1': [26, 0, 351, 268], '1,1': [0, 0, 351, 268], '2,1': [0, 0, 351, 270], '3,1': [0, 0, 351, 270], '4,1': [0, 0, 351, 268], '5,1': [0, 0, 351, 270], '6,1': [0, 0, 351, 268], '7,1': [0, 0, 328, 271],
      '0,2': [17, 84, 351, 238], '1,2': [0, 86, 351, 237], '2,2': [0, 86, 351, 242], '3,2': [0, 98, 351, 243], '4,2': [0, 104, 351, 243], '5,2': [0, 105, 351, 241], '6,2': [0, 99, 343, 242], '7,2': [2, 108, 334, 242],
      '0,3': [15, 7, 346, 260], '1,3': [11, 8, 351, 248], '2,3': [0, 32, 350, 251], '3,3': [12, 16, 351, 252], '4,3': [0, 31, 339, 251], '5,3': [0, 43, 351, 251], '6,3': [0, 47, 351, 249], '7,3': [0, 31, 314, 254],
    };
    const scorpionFrame = (col, row) => anchoredFrame(sw, sh, scorpionBounds, col, row, 'ground', sh * 0.80);

    M.assets.define('godgames.orion.scorpionAnimV1', {
      src: 'assets/manga/orion/scorpion-film-v2.png',
      preload: shouldPrime,
      frames: {
        idle1:        scorpionFrame(0, 0),
        idle2:        scorpionFrame(1, 0),
        idle3:        scorpionFrame(2, 0),
        idle4:        scorpionFrame(3, 0),
        hurt:         scorpionFrame(4, 0),
        enraged:      scorpionFrame(5, 0),
        dead1:        scorpionFrame(6, 0),
        dead2:        scorpionFrame(7, 0),
        crawl1:       scorpionFrame(0, 1),
        crawl2:       scorpionFrame(1, 1),
        crawl3:       scorpionFrame(2, 1),
        crawl4:       scorpionFrame(3, 1),
        crawl5:       scorpionFrame(4, 1),
        crawl6:       scorpionFrame(5, 1),
        crawl7:       scorpionFrame(6, 1),
        crawl8:       scorpionFrame(7, 1),
        charge1:      scorpionFrame(0, 2),
        charge2:      scorpionFrame(1, 2),
        charge3:      scorpionFrame(2, 2),
        charge4:      scorpionFrame(3, 2),
        charge5:      scorpionFrame(4, 2),
        charge6:      scorpionFrame(5, 2),
        charge7:      scorpionFrame(6, 2),
        charge8:      scorpionFrame(7, 2),
        clawWindup:   scorpionFrame(0, 3),
        clawSnap:     scorpionFrame(1, 3),
        clawRecover:  scorpionFrame(2, 3),
        stingCurl:    scorpionFrame(3, 3),
        stingRelease: scorpionFrame(4, 3),
        stingRecover: scorpionFrame(5, 3),
      },
      meta: {
        usage: 'Manga/anime giant scorpion film-motion gameplay animation sheet.',
        animations: {
          idle:    { frames: ['idle1', 'idle2', 'idle3', 'idle4'], fps: 4, loop: true },
          crawl:   { frames: ['crawl1', 'crawl2', 'crawl3', 'crawl4', 'crawl5', 'crawl6', 'crawl7', 'crawl8'], fps: 10, loop: true },
          claw:    { frames: ['clawWindup', 'clawSnap', 'clawRecover'], fps: 10, loop: false },
          sting:   { frames: ['stingCurl', 'stingRelease', 'stingRecover'], fps: 9, loop: false },
          charge:  { frames: ['charge1', 'charge2', 'charge3', 'charge4', 'charge5', 'charge6', 'charge7', 'charge8'], fps: 11, loop: true },
          hurt:    { frames: ['hurt'], fps: 1, loop: false },
          enraged: { frames: ['enraged'], fps: 1, loop: false },
          dead:    { frames: ['dead1', 'dead2'], fps: 4, loop: false },
        },
      },
    });
    prime('godgames.orion.scorpionAnimV1');

    const fxCell = 1254 / 4;
    const fxFrame = (col, row) => ({
      x: col * fxCell, y: row * fxCell, w: fxCell, h: fxCell,
      anchorX: fxCell / 2, anchorY: fxCell / 2,
    });

    M.assets.define('godgames.orion.fxHudV1', {
      src: 'assets/manga/orion/orion-fx-hud-v1.png',
      preload: false,
      frames: {
        spearTrail1:       fxFrame(0, 0),
        spearTrail2:       fxFrame(1, 0),
        spearImpact:       fxFrame(2, 0),
        stabSlash:         fxFrame(3, 0),
        venomBlob:         fxFrame(0, 1),
        venomTrail:        fxFrame(1, 1),
        venomSplash:       fxFrame(2, 1),
        phantomClaw:       fxFrame(3, 1),
        clawTrail:         fxFrame(0, 2),
        constellationMark: fxFrame(1, 2),
        fallingSpear:      fxFrame(2, 2),
        starImpact:        fxFrame(3, 2),
        dustPuff:          fxFrame(0, 3),
        heartFull:         fxFrame(1, 3),
        heartEmpty:        fxFrame(2, 3),
        abilityIcon:       fxFrame(3, 3),
      },
      meta: {
        usage: 'Manga/anime Orion spear, venom, phantom claw, constellation strike, dust, and HUD accents.',
      },
    });
    loadAfterPlaying('godgames.orion.fxHudV1', 900);
    loadAfterPlaying('godgames.orion.scorpionSheet', 1400);
  }

  register();
})();
