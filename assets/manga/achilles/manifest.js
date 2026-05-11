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
    const shouldPrime = page === 'achilles.html';
    const travelerPreload = shouldPrime || placeFrom === 'achilles';
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

    const cell = 418;
    const frame = (col, row) => ({ x: col * cell, y: row * cell, w: cell, h: cell, anchorX: cell / 2, anchorY: cell * 0.72 });

    M.assets.define('godgames.achilles.actionSheet', {
      src: 'assets/manga/achilles/achilles-action-sheet.png',
      preload: false,
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

    M.assets.define('godgames.achilles.battlefield', {
      src: 'assets/manga/achilles/battlefield-clean-v3.jpg',
      preload: shouldPrime,
      meta: {
        usage: 'Clean asset-backed Achilles manga gameplay arena with no baked-in archers or active arrows.',
      },
    });

    const aw = 2016 / 8;
    const ah = 1256 / 4;
    const animFrame = (col, row, anchorY = ah * 0.88) => ({
      x: col * aw, y: row * ah, w: aw, h: ah,
      anchorX: aw / 2, anchorY,
    });

    M.assets.define('godgames.achilles.animSheet', {
      src: 'assets/manga/achilles/achilles-film-v2.png',
      preload: travelerPreload,
      frames: {
        idle1:       animFrame(0, 0),
        idle2:       animFrame(1, 0),
        idle3:       animFrame(2, 0),
        idle4:       animFrame(3, 0),
        guarded:     animFrame(4, 0),
        hit:         animFrame(5, 0),
        fall1:       animFrame(6, 0),
        fallen:      animFrame(7, 0),
        runRight1:   animFrame(0, 1),
        runRight2:   animFrame(1, 1),
        runRight3:   animFrame(2, 1),
        runRight4:   animFrame(3, 1),
        runRight5:   animFrame(4, 1),
        runRight6:   animFrame(5, 1),
        runRight7:   animFrame(6, 1),
        runRight8:   animFrame(7, 1),
        runLeft1:    animFrame(0, 2),
        runLeft2:    animFrame(1, 2),
        runLeft3:    animFrame(2, 2),
        runLeft4:    animFrame(3, 2),
        runLeft5:    animFrame(4, 2),
        runLeft6:    animFrame(5, 2),
        runLeft7:    animFrame(6, 2),
        runLeft8:    animFrame(7, 2),
        bashWindup:  animFrame(0, 3),
        bashImpact:  animFrame(1, 3),
        bowDraw:     animFrame(2, 3),
        bowAim:      animFrame(3, 3),
        bowRelease:  animFrame(4, 3),
        heelWindup:  animFrame(5, 3),
        heelSlash:   animFrame(6, 3),
        victory:     animFrame(7, 3),
      },
      meta: {
        usage: 'Manga/anime Achilles film-motion gameplay animation sheet.',
        animations: {
          idle:       { frames: ['idle1', 'idle2', 'idle3', 'idle4'], fps: 4, loop: true },
          runRight:   { frames: ['runRight1', 'runRight2', 'runRight3', 'runRight4', 'runRight5', 'runRight6', 'runRight7', 'runRight8'], fps: 12, loop: true },
          runLeft:    { frames: ['runLeft1', 'runLeft2', 'runLeft3', 'runLeft4', 'runLeft5', 'runLeft6', 'runLeft7', 'runLeft8'], fps: 12, loop: true },
          bash:       { frames: ['bashWindup', 'bashImpact'], fps: 12, loop: false },
          bow:        { frames: ['bowDraw', 'bowAim'], fps: 8, loop: false },
          bowRelease: { frames: ['bowRelease'], fps: 1, loop: false },
          strike:     { frames: ['heelWindup', 'heelSlash'], fps: 10, loop: false },
          hit:        { frames: ['hit'], fps: 1, loop: false },
          guarded:    { frames: ['guarded'], fps: 1, loop: false },
          fallen:     { frames: ['fall1', 'fallen'], fps: 5, loop: false },
          victory:    { frames: ['victory'], fps: 1, loop: false },
        },
      },
    });
    prime('godgames.achilles.animSheet');

    const archerCell = 362;
    const archerFrame = (col, row, anchorY = archerCell * 0.90) => ({
      x: col * archerCell, y: row * archerCell, w: archerCell, h: archerCell,
      anchorX: archerCell / 2, anchorY,
    });

    M.assets.define('godgames.achilles.archerSheet', {
      src: 'assets/manga/achilles/archers-film-v2.png',
      preload: false,
      frames: {
        idle1:          archerFrame(0, 0),
        idle2:          archerFrame(1, 0),
        idle3:          archerFrame(2, 0),
        idle4:          archerFrame(3, 0),
        draw:           archerFrame(4, 0),
        aim:            archerFrame(5, 0),
        release:        archerFrame(0, 1),
        recoil:         archerFrame(1, 1),
        telegraph:      archerFrame(2, 1),
        telegraph1:     archerFrame(2, 1),
        telegraph2:     archerFrame(3, 1),
        telegraph3:     archerFrame(4, 1),
        telegraph4:     archerFrame(5, 1),
        down1:          archerFrame(0, 2),
        down2:          archerFrame(1, 2),
        hit:            archerFrame(2, 2),
        eliteTelegraph: archerFrame(3, 2),
        eliteRelease:   archerFrame(4, 2),
      },
      meta: {
        usage: 'Manga/anime Achilles archer film-motion gameplay sprites.',
        animations: {
          idle:      { frames: ['idle1', 'idle2', 'idle3', 'idle4'], fps: 4, loop: true },
          draw:      { frames: ['draw', 'aim'], fps: 7, loop: false },
          release:   { frames: ['release', 'recoil'], fps: 10, loop: false },
          downed:    { frames: ['down1', 'down2'], fps: 4, loop: false },
          telegraph: { frames: ['telegraph1', 'telegraph2', 'telegraph3', 'telegraph4'], fps: 7, loop: true },
        },
      },
    });
    const fxCell = 1254 / 4;
    const fxFrame = (col, row) => ({
      x: col * fxCell, y: row * fxCell, w: fxCell, h: fxCell,
      anchorX: fxCell / 2, anchorY: fxCell / 2,
    });

    M.assets.define('godgames.achilles.fxHudSheet', {
      src: 'assets/manga/achilles/fx-hud-v2.png',
      preload: false,
      frames: {
        arrowDown1:   fxFrame(0, 0),
        arrowDown2:   fxFrame(1, 0),
        returnArrow:  fxFrame(2, 0),
        brokenArrow:  fxFrame(3, 0),
        warningSlash: fxFrame(0, 1),
        shieldBurst:  fxFrame(1, 1),
        impactBurst:  fxFrame(2, 1),
        damageBurst:  fxFrame(3, 1),
        dustPuff:     fxFrame(0, 2),
        slashCrescent: fxFrame(1, 2),
        bowFlare:     fxFrame(2, 2),
        heelSpark:    fxFrame(3, 2),
        heartFull:    fxFrame(0, 3),
        heartEmpty:   fxFrame(1, 3),
        shieldIcon:   fxFrame(2, 3),
        bowIcon:      fxFrame(3, 3),
      },
      meta: {
        usage: 'Manga/anime Achilles arrows, attack FX, and HUD icons.',
      },
    });
    loadAfterPlaying('godgames.achilles.actionSheet', 350);
    loadAfterPlaying('godgames.achilles.archerSheet', 650);
    loadAfterPlaying('godgames.achilles.fxHudSheet', 1000);
  }

  register();
})();
