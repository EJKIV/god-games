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
    const shouldPrime = page === 'icarus.html';
    const travelerPreload = shouldPrime || placeFrom === 'icarus';
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

    M.assets.define('godgames.icarus.hero', {
      src: 'assets/manga/icarus/icarus-hero.jpg',
      preload: shouldPrime,
      meta: {
        usage: 'Manga-mode Icarus title, tutorial, death, and dive cut-in art.',
      },
    });

    M.assets.define('godgames.icarus.flightStageV2', {
      src: 'assets/manga/icarus/icarus-flight-stage-v2.jpg',
      preload: shouldPrime,
      meta: {
        usage: 'Clean Icarus manga gameplay flight stage with sun, safe lane, sea depth, and no baked-in live actors.',
      },
    });

    function anchoredFrame(cellW, cellH, bounds, col, row, mode = 'center', anchors) {
      const key = `${col},${row}`;
      const b = bounds[key];
      const anchor = anchors && anchors[key];
      const valid = b && (b[2] - b[0]) > cellW * 0.12 && (b[3] - b[1]) > cellH * 0.12;
      const anchorX = anchor ? anchor[0] : (valid ? (b[0] + b[2]) / 2 : cellW / 2);
      const anchorY = anchor ? anchor[1] : (valid
        ? (mode === 'ground' ? b[3] : (b[1] + b[3]) / 2)
        : cellH / 2);
      return { x: cellW * col, y: cellH * row, w: cellW, h: cellH, anchorX, anchorY };
    }

    const cell = 418;
    const flightBounds = {
      '0,0': [16, 9, 393, 418], '1,0': [43, 12, 418, 402], '2,0': [0, 93, 418, 410], '3,0': [0, 69, 418, 418], '4,0': [0, 58, 418, 418], '5,0': [0, 52, 418, 412], '6,0': [0, 99, 418, 417], '7,0': [0, 125, 264, 389],
      '0,1': [29, 0, 418, 350], '1,1': [0, 73, 418, 348], '2,1': [0, 98, 418, 354], '3,1': [0, 0, 418, 346], '4,1': [0, 0, 418, 312], '5,1': [0, 64, 418, 418], '6,1': [0, 73, 418, 418], '7,1': [0, 86, 402, 418],
      '0,2': [52, 51, 359, 418], '1,2': [73, 21, 361, 418], '2,2': [49, 17, 379, 330], '3,2': [72, 28, 418, 418], '4,2': [0, 42, 418, 418], '5,2': [0, 0, 418, 373], '6,2': [0, 0, 418, 418], '7,2': [0, 0, 398, 341],
    };
    const flightAnchors = {
      '0,0': [182, 200], '1,0': [198, 211], '2,0': [265, 252], '3,0': [288, 246], '4,0': [300, 263], '5,0': [313, 235], '6,0': [163, 201], '7,0': [116, 230],
      '0,1': [232, 179], '1,1': [275, 183], '2,1': [310, 170], '3,1': [228, 183], '4,1': [201, 203], '5,1': [237, 183], '6,1': [266, 184], '7,1': [99, 195],
      '0,2': [220, 172], '1,2': [207, 157], '2,2': [222, 164], '3,2': [276, 192], '4,2': [280, 134], '5,2': [150, 151], '6,2': [174, 141], '7,2': [159, 136],
    };
    const sheetFrame = (col, row) => anchoredFrame(cell, cell, flightBounds, col, row, 'center', flightAnchors);
    M.assets.define('godgames.icarus.flightSheet', {
      src: 'assets/manga/icarus/icarus-flight-film-v2.png',
      preload: travelerPreload,
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
        sourcePrompt: '8x4 chroma-key manga/anime Icarus film-motion gameplay sprite sheet with flap, glide, speed, dive, burn, wet, falling, and recovery states.',
        animations: {
          flap: { frames: ['flap1', 'flap2', 'flap3', 'flap4', 'flap5', 'flap6', 'flap7', 'flap8'], fps: 12, loop: true },
          glide: { frames: ['glide1', 'glide2', 'glide3', 'glide4'], fps: 4, loop: true },
          speed: { frames: ['speed1', 'speed2', 'speed3', 'speed4'], fps: 7, loop: true },
          dive: { frames: ['dive'], fps: 1, loop: false },
          burn: { frames: ['burn'], fps: 1, loop: false },
          wet: { frames: ['wet'], fps: 1, loop: false },
          falling: { frames: ['falling'], fps: 1, loop: false },
          recover: { frames: ['recover'], fps: 1, loop: false },
        },
      },
    });
    prime('godgames.icarus.flightSheet');

    const orcaAirCell = 314;
    const orcaAirBounds = {
      '0,0': [97, 65, 314, 247], '1,0': [112, 61, 314, 247], '2,0': [101, 68, 302, 247], '3,0': [85, 48, 314, 247], '4,0': [103, 62, 314, 247], '5,0': [85, 48, 314, 247], '6,0': [85, 48, 314, 247],
    };
    const orcaAirAnchors = {
      '0,0': [195, 153], '1,0': [211, 145], '2,0': [197, 163], '3,0': [192, 133], '4,0': [214, 161], '5,0': [192, 133], '6,0': [192, 133],
    };
    const orcaAirFrame = (col) => anchoredFrame(orcaAirCell, orcaAirCell, orcaAirBounds, col, 0, 'center', orcaAirAnchors);

    M.assets.define('godgames.icarus.orcaAirV1', {
      src: 'assets/manga/icarus/orca-air-v1.png',
      preload: shouldPrime,
      frames: {
        orcaAirBreach1: orcaAirFrame(0),
        orcaAirBreach2: orcaAirFrame(1),
        orcaAirBreach3: orcaAirFrame(2),
        orcaAirBreach4: orcaAirFrame(3),
        orcaAirBreach5: orcaAirFrame(4),
        orcaAirBreach6: orcaAirFrame(5),
        orcaAirBite:    orcaAirFrame(6),
      },
      meta: {
        usage: 'Clean airborne Icarus orca body frames with no water attached; surface water remains in the FX sheets.',
        animations: {
          orcaAirBreach: { frames: ['orcaAirBreach1', 'orcaAirBreach2', 'orcaAirBreach3', 'orcaAirBreach4', 'orcaAirBreach5', 'orcaAirBreach6'], fps: 10, loop: false },
        },
      },
    });
    prime('godgames.icarus.orcaAirV1');

    const atlasCell = 2512 / 8;
    const atlasFrame = (col, row, anchorY = atlasCell / 2, anchorX = atlasCell / 2) => ({
      x: col * atlasCell, y: row * atlasCell, w: atlasCell, h: atlasCell,
      anchorX, anchorY,
    });
    const eagleAtlasAnchors = [
      [144, 165], [169, 187], [159, 191], [212, 192],
      [197, 188], [228, 171], [169, 192], [86, 220],
    ];
    const orcaAtlasAnchors = [
      [189, 188], [202, 182], [188, 192], [195, 171], [213, 193], [177, 190],
    ];
    const daedalusAtlasAnchors = [
      [154, 150], [149, 151], [170, 149], [200, 163],
    ];
    const eagleFrame = (col) => atlasFrame(col, 0, eagleAtlasAnchors[col][1], eagleAtlasAnchors[col][0]);
    const orcaBodyFrame = (col) => atlasFrame(col, 1, orcaAtlasAnchors[col][1], orcaAtlasAnchors[col][0]);
    const daedalusFlyFrame = (col) => atlasFrame(col, 2, daedalusAtlasAnchors[col][1], daedalusAtlasAnchors[col][0]);

    M.assets.define('godgames.icarus.stageAtlasV2', {
      src: 'assets/manga/icarus/icarus-creatures-film-v2.png',
      preload: false,
      frames: {
        eagleFly1:      eagleFrame(0),
        eagleFly2:      eagleFrame(1),
        eagleFly3:      eagleFrame(2),
        eagleFly4:      eagleFrame(3),
        eagleFly5:      eagleFrame(4),
        eagleFly6:      eagleFrame(5),
        eagleDive:      eagleFrame(6),
        eagleHit:       eagleFrame(7),
        orcaBreach1:    orcaBodyFrame(0),
        orcaBreach2:    orcaBodyFrame(1),
        orcaBreach3:    orcaBodyFrame(2),
        orcaBreach4:    orcaBodyFrame(3),
        orcaBreach5:    orcaBodyFrame(4),
        orcaBreach6:    orcaBodyFrame(5),
        orcaChurn:      atlasFrame(6, 1),
        orcaSplash:     atlasFrame(7, 1, atlasCell * 0.74),
        daedalusFly1:   daedalusFlyFrame(0),
        daedalusFly2:   daedalusFlyFrame(1),
        daedalusFly3:   daedalusFlyFrame(2),
        daedalusFly4:   daedalusFlyFrame(3),
        daedalusRescue: atlasFrame(4, 2, atlasCell * 0.82),
        islandReady:    atlasFrame(0, 3, atlasCell * 0.78),
        islandSinking:  atlasFrame(1, 3, atlasCell * 0.76),
        featherBurst:   atlasFrame(2, 3),
        burnFlare:      atlasFrame(3, 3),
        waterDrips:     atlasFrame(4, 3),
        diveAura:       atlasFrame(5, 3),
        eagleCruise:    eagleFrame(1),
        eagleAttack:    eagleFrame(6),
        orcaBreach:     orcaBodyFrame(3),
        orcaBite:       orcaBodyFrame(4),
        daedalusFly:    daedalusFlyFrame(0),
      },
      meta: {
        usage: 'Icarus manga film-motion enemies, Daedalus rescue, islands, and hazard FX in one shared flight-stage style.',
        animations: {
          eagleFly:   { frames: ['eagleFly1', 'eagleFly2', 'eagleFly3', 'eagleFly4', 'eagleFly5', 'eagleFly6'], fps: 10, loop: true },
          eagleDive:  { frames: ['eagleDive'], fps: 1, loop: false },
          eagleHit:   { frames: ['eagleHit'], fps: 1, loop: false },
          orcaBreach: { frames: ['orcaBreach1', 'orcaBreach2', 'orcaBreach3', 'orcaBreach4', 'orcaBreach5', 'orcaBreach6'], fps: 10, loop: false },
          daedalusFly: { frames: ['daedalusFly1', 'daedalusFly2', 'daedalusFly3', 'daedalusFly4'], fps: 6, loop: true },
        },
      },
    });
    const fxCell = 314;
    const fxFrame = (col, row, anchorY = fxCell / 2, anchorX = fxCell / 2) => ({
      x: col * fxCell, y: row * fxCell, w: fxCell, h: fxCell,
      anchorX, anchorY,
    });
    const daedalusFxAnchors = [
      [157, 147], [158, 145], [157, 147], [156, 143],
    ];
    const daedalusFxFrame = (col) => fxFrame(col, 2, daedalusFxAnchors[col][1], daedalusFxAnchors[col][0]);

    M.assets.define('godgames.icarus.fxCreaturesV2', {
      src: 'assets/manga/icarus/icarus-fx-creatures-v2.png',
      preload: false,
      frames: {
        orcaWarn1:     fxFrame(0, 0, fxCell * 0.66),
        orcaWarn2:     fxFrame(1, 0, fxCell * 0.66),
        orcaWarn3:     fxFrame(2, 0, fxCell * 0.66),
        orcaWarn4:     fxFrame(3, 0, fxCell * 0.66),
        orcaChurn:     fxFrame(4, 0, fxCell * 0.66),
        orcaSplash1:   fxFrame(5, 0, fxCell * 0.78),
        orcaSplash2:   fxFrame(6, 0, fxCell * 0.78),
        orcaSplash3:   fxFrame(7, 0, fxCell * 0.78),
        orcaBreach1:   fxFrame(0, 1, fxCell * 0.76),
        orcaBreach2:   fxFrame(1, 1, fxCell * 0.76),
        orcaBreach3:   fxFrame(2, 1, fxCell * 0.77),
        orcaBreach4:   fxFrame(3, 1, fxCell * 0.78),
        orcaBreach5:   fxFrame(4, 1, fxCell * 0.78),
        orcaBreach6:   fxFrame(5, 1, fxCell * 0.76),
        orcaBite:      fxFrame(6, 1, fxCell * 0.78),
        orcaSplash4:   fxFrame(7, 1, fxCell * 0.78),
        daedalusFly1:  daedalusFxFrame(0),
        daedalusFly2:  daedalusFxFrame(1),
        daedalusFly3:  daedalusFxFrame(2),
        daedalusFly4:  daedalusFxFrame(3),
        daedalusRescue1: fxFrame(4, 2, fxCell * 0.82),
        daedalusRescue2: fxFrame(5, 2, fxCell * 0.82),
        wetWingFx1:    fxFrame(6, 2),
        wetWingFx2:    fxFrame(7, 2),
        waveCurl1:     fxFrame(0, 3, fxCell * 0.84),
        waveCurl2:     fxFrame(1, 3, fxCell * 0.84),
        waveCurl3:     fxFrame(2, 3, fxCell * 0.84),
        waveCurl4:     fxFrame(3, 3, fxCell * 0.84),
        waveCurl5:     fxFrame(4, 3, fxCell * 0.84),
        waveCurl6:     fxFrame(5, 3, fxCell * 0.84),
        waveFoam:      fxFrame(6, 3, fxCell * 0.84),
        waveImpact:    fxFrame(7, 3, fxCell * 0.78),
      },
      meta: {
        usage: 'Icarus manga FX atlas for orca warning/breach/splash, Daedalus flight/rescue, wet wing overlays, and animated wave hazards.',
        animations: {
          orcaWarn:     { frames: ['orcaWarn1', 'orcaWarn2', 'orcaWarn3', 'orcaWarn4', 'orcaChurn'], fps: 10, loop: true },
          orcaBreach:   { frames: ['orcaBreach1', 'orcaBreach2', 'orcaBreach3', 'orcaBreach4', 'orcaBreach5', 'orcaBreach6'], fps: 11, loop: false },
          orcaSplash:   { frames: ['orcaSplash1', 'orcaSplash2', 'orcaSplash3', 'orcaSplash4'], fps: 12, loop: false },
          daedalusFly:  { frames: ['daedalusFly1', 'daedalusFly2', 'daedalusFly3', 'daedalusFly4'], fps: 7, loop: true },
          daedalusRescue: { frames: ['daedalusRescue1', 'daedalusRescue2'], fps: 4, loop: true },
          wetWingFx:    { frames: ['wetWingFx1', 'wetWingFx2'], fps: 8, loop: true },
          waveCurl:     { frames: ['waveCurl1', 'waveCurl2', 'waveCurl3', 'waveCurl4', 'waveCurl5', 'waveCurl6'], fps: 9, loop: true },
          waveImpact:   { frames: ['waveImpact', 'waveFoam'], fps: 10, loop: false },
        },
      },
    });
    loadAfterPlaying('godgames.icarus.stageAtlasV2', 500);
    loadAfterPlaying('godgames.icarus.fxCreaturesV2', 1050);
  }

  register();
})();
