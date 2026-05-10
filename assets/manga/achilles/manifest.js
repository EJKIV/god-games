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

    M.assets.define('godgames.achilles.battlefield', {
      src: 'assets/manga/achilles/battlefield-clean-v3.jpg',
      meta: {
        usage: 'Clean asset-backed Achilles manga gameplay arena with no baked-in archers or active arrows.',
      },
    });

    const aw = 1254 / 5;
    const ah = 1254 / 4;
    const animFrame = (col, row, anchorY = ah * 0.88) => ({
      x: col * aw, y: row * ah, w: aw, h: ah,
      anchorX: aw / 2, anchorY,
    });

    M.assets.define('godgames.achilles.animSheet', {
      src: 'assets/manga/achilles/achilles-anim-v2.png',
      frames: {
        idle1:       animFrame(0, 0),
        idle2:       animFrame(1, 0),
        runRight1:   animFrame(2, 0),
        runRight2:   animFrame(3, 0),
        runRight3:   animFrame(4, 0),
        runLeft1:    animFrame(0, 1),
        runLeft2:    animFrame(1, 1),
        runLeft3:    animFrame(2, 1),
        bashWindup:  animFrame(3, 1),
        bashImpact:  animFrame(4, 1),
        bowDraw:     animFrame(0, 2),
        bowAim:      animFrame(1, 2),
        bowRelease:  animFrame(2, 2),
        heelWindup:  animFrame(3, 2),
        heelSlash:   animFrame(4, 2),
        hit:         animFrame(0, 3),
        guarded:     animFrame(1, 3),
        fall1:       animFrame(2, 3),
        fallen:      animFrame(3, 3),
        victory:     animFrame(4, 3),
      },
      meta: {
        usage: 'Manga/anime Achilles gameplay animation sheet.',
        animations: {
          idle:       { frames: ['idle1', 'idle2'], fps: 2, loop: true },
          runRight:   { frames: ['runRight1', 'runRight2', 'runRight3'], fps: 10, loop: true },
          runLeft:    { frames: ['runLeft1', 'runLeft2', 'runLeft3'], fps: 10, loop: true },
          bash:       { frames: ['bashWindup', 'bashImpact'], fps: 14, loop: false },
          bow:        { frames: ['bowDraw', 'bowAim'], fps: 8, loop: false },
          bowRelease: { frames: ['bowRelease'], fps: 1, loop: false },
          strike:     { frames: ['heelWindup', 'heelSlash'], fps: 12, loop: false },
          hit:        { frames: ['hit'], fps: 1, loop: false },
          guarded:    { frames: ['guarded'], fps: 1, loop: false },
          fallen:     { frames: ['fall1', 'fallen'], fps: 5, loop: false },
          victory:    { frames: ['victory'], fps: 1, loop: false },
        },
      },
    });

    const archerCell = 362;
    const archerFrame = (col, row, anchorY = archerCell * 0.90) => ({
      x: col * archerCell, y: row * archerCell, w: archerCell, h: archerCell,
      anchorX: archerCell / 2, anchorY,
    });

    M.assets.define('godgames.achilles.archerSheet', {
      src: 'assets/manga/achilles/archers-v2.png',
      frames: {
        idle1:          archerFrame(0, 0),
        idle2:          archerFrame(1, 0),
        draw:           archerFrame(2, 0),
        aim:            archerFrame(3, 0),
        release:        archerFrame(0, 1),
        recoil:         archerFrame(1, 1),
        telegraph:      archerFrame(2, 1),
        hit:            archerFrame(3, 1),
        down1:          archerFrame(0, 2),
        down2:          archerFrame(1, 2),
        eliteTelegraph: archerFrame(2, 2),
        eliteRelease:   archerFrame(3, 2),
      },
      meta: {
        usage: 'Manga/anime Achilles archer gameplay sprites.',
        animations: {
          idle:      { frames: ['idle1', 'idle2'], fps: 2, loop: true },
          draw:      { frames: ['draw', 'aim'], fps: 8, loop: false },
          release:   { frames: ['release', 'recoil'], fps: 12, loop: false },
          downed:    { frames: ['down1', 'down2'], fps: 4, loop: false },
          telegraph: { frames: ['telegraph', 'eliteTelegraph'], fps: 6, loop: true },
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
  }

  register();
})();
