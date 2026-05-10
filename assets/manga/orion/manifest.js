(function () {
  function register() {
    const M = window.Manga;
    if (!M || !M.assets || typeof M.assets.define !== 'function') {
      setTimeout(register, 0);
      return;
    }

    const cell = 362;
    const frame = (col, row, anchorY) => ({ x: col * cell, y: row * cell, w: cell, h: cell, anchorX: cell / 2, anchorY: anchorY || cell * 0.76 });

    M.assets.define('godgames.orion.scorpionSheet', {
      src: 'assets/manga/orion/orion-scorpion-sheet.png',
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
      meta: {
        usage: 'Clean Orion manga gameplay arena with no baked-in fighters, projectiles, or blocking foreground figures.',
      },
    });

    const ow = 1254 / 4;
    const oh = 1254 / 4;
    const orionFrame = (col, row, anchorY = oh * 0.90) => ({
      x: col * ow, y: row * oh, w: ow, h: oh,
      anchorX: ow / 2, anchorY,
    });

    M.assets.define('godgames.orion.orionAnimV1', {
      src: 'assets/manga/orion/orion-anim-v1.png',
      frames: {
        idle1:        orionFrame(0, 0),
        idle2:        orionFrame(1, 0),
        run1:         orionFrame(2, 0),
        run2:         orionFrame(3, 0),
        run3:         orionFrame(0, 1),
        jump:         orionFrame(1, 1, oh * 0.82),
        spearWindup:  orionFrame(2, 1),
        spearRelease: orionFrame(3, 1),
        stabWindup:   orionFrame(0, 2),
        stabThrust:   orionFrame(1, 2),
        stabRecover:  orionFrame(2, 2),
        dodge:        orionFrame(3, 2, oh * 0.84),
        hit:          orionFrame(0, 3),
        prone:        orionFrame(1, 3, oh * 0.66),
        victory:      orionFrame(2, 3),
        fallen:       orionFrame(3, 3, oh * 0.66),
      },
      meta: {
        usage: 'Manga/anime Orion gameplay, title, death, and victory animation sheet.',
        animations: {
          idle:    { frames: ['idle1', 'idle2'], fps: 2, loop: true },
          run:     { frames: ['run1', 'run2', 'run3'], fps: 10, loop: true },
          jump:    { frames: ['jump'], fps: 1, loop: false },
          throw:   { frames: ['spearWindup', 'spearRelease'], fps: 12, loop: false },
          stab:    { frames: ['stabWindup', 'stabThrust', 'stabRecover'], fps: 16, loop: false },
          dodge:   { frames: ['dodge'], fps: 1, loop: false },
          hit:     { frames: ['hit'], fps: 1, loop: false },
          prone:   { frames: ['prone'], fps: 1, loop: false },
          fallen:  { frames: ['fallen'], fps: 1, loop: false },
          victory: { frames: ['victory'], fps: 1, loop: false },
        },
      },
    });

    const sw = 1402 / 4;
    const sh = 1122 / 4;
    const scorpionFrame = (col, row, anchorY = sh * 0.80) => ({
      x: col * sw, y: row * sh, w: sw, h: sh,
      anchorX: sw / 2, anchorY,
    });

    M.assets.define('godgames.orion.scorpionAnimV1', {
      src: 'assets/manga/orion/scorpion-anim-v1.png',
      frames: {
        idle1:        scorpionFrame(0, 0),
        idle2:        scorpionFrame(1, 0),
        crawl1:       scorpionFrame(2, 0),
        crawl2:       scorpionFrame(3, 0),
        clawWindup:   scorpionFrame(0, 1),
        clawSnap:     scorpionFrame(1, 1),
        clawRecover:  scorpionFrame(2, 1),
        stingCurl:    scorpionFrame(3, 1),
        stingRelease: scorpionFrame(0, 2),
        stingRecover: scorpionFrame(1, 2),
        charge1:      scorpionFrame(2, 2),
        charge2:      scorpionFrame(3, 2),
        hurt:         scorpionFrame(0, 3),
        enraged:      scorpionFrame(1, 3),
        dead1:        scorpionFrame(2, 3, sh * 0.70),
        dead2:        scorpionFrame(3, 3, sh * 0.70),
      },
      meta: {
        usage: 'Manga/anime giant scorpion gameplay animation sheet.',
        animations: {
          idle:    { frames: ['idle1', 'idle2'], fps: 2, loop: true },
          crawl:   { frames: ['crawl1', 'crawl2'], fps: 8, loop: true },
          claw:    { frames: ['clawWindup', 'clawSnap', 'clawRecover'], fps: 12, loop: false },
          sting:   { frames: ['stingCurl', 'stingRelease', 'stingRecover'], fps: 11, loop: false },
          charge:  { frames: ['charge1', 'charge2'], fps: 10, loop: true },
          hurt:    { frames: ['hurt'], fps: 1, loop: false },
          enraged: { frames: ['enraged'], fps: 1, loop: false },
          dead:    { frames: ['dead1', 'dead2'], fps: 4, loop: false },
        },
      },
    });

    const fxCell = 1254 / 4;
    const fxFrame = (col, row) => ({
      x: col * fxCell, y: row * fxCell, w: fxCell, h: fxCell,
      anchorX: fxCell / 2, anchorY: fxCell / 2,
    });

    M.assets.define('godgames.orion.fxHudV1', {
      src: 'assets/manga/orion/orion-fx-hud-v1.png',
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
  }

  register();
})();
