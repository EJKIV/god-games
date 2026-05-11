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
    const shouldPrime = page === 'orion.html';
    function prime(id, frames, opts) {
      if (!shouldPrime) return;
      setTimeout(() => {
        const art = window.GodGames && GodGames.MangaArt;
        if (art && typeof art.primeAsset === 'function') art.primeAsset(id, frames, opts || {});
      }, 0);
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

    const ow = 2512 / 8;
    const oh = 942 / 3;
    const orionFrame = (col, row, anchorY = oh * 0.90) => ({
      x: col * ow, y: row * oh, w: ow, h: oh,
      anchorX: ow / 2, anchorY,
    });

    M.assets.define('godgames.orion.orionAnimV1', {
      src: 'assets/manga/orion/orion-anim-loops-v1.png',
      frames: {
        idle1:        orionFrame(0, 0),
        idle2:        orionFrame(1, 0),
        idle3:        orionFrame(2, 0),
        idle4:        orionFrame(3, 0),
        jump:         orionFrame(4, 0, oh * 0.82),
        dodge:        orionFrame(5, 0, oh * 0.84),
        hit:          orionFrame(6, 0),
        prone:        orionFrame(7, 0, oh * 0.66),
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
        fallen:       orionFrame(6, 2, oh * 0.66),
      },
      meta: {
        usage: 'Manga/anime Orion gameplay, title, death, and victory animation sheet.',
        animations: {
          idle:    { frames: ['idle1', 'idle2', 'idle3', 'idle4'], fps: 5, loop: true },
          run:     { frames: ['run1', 'run2', 'run3', 'run4', 'run5', 'run6', 'run7', 'run8'], fps: 14, loop: true },
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
    prime('godgames.orion.orionAnimV1');

    const sw = 2808 / 8;
    const sh = 1124 / 4;
    const scorpionFrame = (col, row, anchorY = sh * 0.80) => ({
      x: col * sw, y: row * sh, w: sw, h: sh,
      anchorX: sw / 2, anchorY,
    });

    M.assets.define('godgames.orion.scorpionAnimV1', {
      src: 'assets/manga/orion/scorpion-anim-loops-v1.png',
      frames: {
        idle1:        scorpionFrame(0, 0),
        idle2:        scorpionFrame(1, 0),
        idle3:        scorpionFrame(2, 0),
        idle4:        scorpionFrame(3, 0),
        hurt:         scorpionFrame(4, 0),
        enraged:      scorpionFrame(5, 0),
        dead1:        scorpionFrame(6, 0, sh * 0.70),
        dead2:        scorpionFrame(7, 0, sh * 0.70),
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
        usage: 'Manga/anime giant scorpion gameplay animation sheet.',
        animations: {
          idle:    { frames: ['idle1', 'idle2', 'idle3', 'idle4'], fps: 5, loop: true },
          crawl:   { frames: ['crawl1', 'crawl2', 'crawl3', 'crawl4', 'crawl5', 'crawl6', 'crawl7', 'crawl8'], fps: 12, loop: true },
          claw:    { frames: ['clawWindup', 'clawSnap', 'clawRecover'], fps: 12, loop: false },
          sting:   { frames: ['stingCurl', 'stingRelease', 'stingRecover'], fps: 11, loop: false },
          charge:  { frames: ['charge1', 'charge2', 'charge3', 'charge4', 'charge5', 'charge6', 'charge7', 'charge8'], fps: 13, loop: true },
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
