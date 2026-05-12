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

    const flightCellW = 760;
    const flightCellH = 680;
    const flightBounds = {
      '0,0': [215, 150, 590, 566], '1,0': [226, 142, 607, 531], '2,0': [157, 183, 564, 497], '3,0': [163, 164, 557, 518], '4,0': [199, 136, 531, 503], '5,0': [235, 158, 760, 516], '6,0': [0, 211, 369, 550], '7,0': [117, 236, 528, 527],
      '0,1': [178, 217, 650, 511], '1,1': [188, 231, 629, 504], '2,1': [204, 268, 685, 523], '3,1': [359, 224, 760, 503], '4,1': [0, 231, 372, 483], '5,1': [275, 221, 690, 443], '6,1': [371, 230, 760, 449], '7,1': [0, 219, 560, 438],
      '0,2': [213, 220, 519, 484], '1,2': [247, 204, 532, 486], '2,2': [208, 195, 536, 505], '3,2': [224, 177, 599, 530], '4,2': [213, 237, 760, 579], '5,2': [0, 175, 575, 562], '6,2': [167, 196, 548, 492], '7,2': [160, 190, 622, 544],
      '0,3': [191, 178, 586, 529], '1,3': [252, 186, 518, 544], '2,3': [226, 194, 614, 522], '3,3': [184, 146, 696, 595], '4,3': [332, 271, 580, 494], '5,3': [266, 221, 570, 564], '6,3': [298, 149, 571, 511], '7,3': [209, 176, 585, 514],
    };
    const flightAnchors = {
      '0,0': [403, 358], '1,0': [417, 337], '2,0': [361, 340], '3,0': [360, 341], '4,0': [365, 320], '5,0': [498, 337], '6,0': [185, 381], '7,0': [323, 382],
      '0,1': [414, 364], '1,1': [409, 368], '2,1': [445, 396], '3,1': [560, 364], '4,1': [186, 357], '5,1': [483, 332], '6,1': [566, 340], '7,1': [280, 329],
      '0,2': [366, 352], '1,2': [390, 345], '2,2': [372, 350], '3,2': [412, 354], '4,2': [487, 408], '5,2': [288, 369], '6,2': [358, 344], '7,2': [391, 367],
      '0,3': [389, 354], '1,3': [385, 365], '2,3': [420, 358], '3,3': [440, 371], '4,3': [456, 383], '5,3': [418, 393], '6,3': [435, 330], '7,3': [397, 345],
    };
    const sheetFrame = (col, row) => anchoredFrame(
      flightCellW,
      flightCellH,
      flightBounds,
      col,
      row,
      'center',
      flightAnchors,
    );
    M.assets.define('godgames.icarus.flightSheet', {
      src: 'assets/manga/icarus/icarus-flight-clean-v1.png',
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
        recover:  sheetFrame(3, 3),
        flapDown: sheetFrame(0, 0),
        glide:    sheetFrame(0, 1),
        flapUp:   sheetFrame(1, 0),
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

    const orcaAirCellW = 400;
    const orcaAirCellH = 330;
    const orcaAirBounds = {
      '0,0': [97, 77, 313, 257], '1,0': [96, 81, 297, 266], '2,0': [96, 75, 295, 253], '3,0': [88, 76, 316, 274], '4,0': [85, 67, 295, 251], '5,0': [88, 76, 316, 274], '6,0': [88, 76, 316, 274],
    };
    const orcaAirAnchors = {
      '0,0': [205, 167], '1,0': [197, 174], '2,0': [196, 164], '3,0': [202, 175], '4,0': [190, 159], '5,0': [202, 175], '6,0': [202, 175],
    };
    const orcaAirFrame = (col) => anchoredFrame(
      orcaAirCellW,
      orcaAirCellH,
      orcaAirBounds,
      col,
      0,
      'center',
      orcaAirAnchors,
    );

    M.assets.define('godgames.icarus.orcaAirV1', {
      src: 'assets/manga/icarus/orca-air-clean-v1.png',
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

    const atlasCellW = 640;
    const atlasCellH = 600;
    const atlasFrame = (col, row, anchorY = 300, anchorX = 320) => ({
      x: col * atlasCellW, y: row * atlasCellH, w: atlasCellW, h: atlasCellH,
      anchorX, anchorY,
    });
    const eagleFrame = (col) => atlasFrame(col, 0, 230, 320);
    const orcaBodyFrame = (col) => atlasFrame(col, 1);
    const daedalusFlyFrame = (col) => atlasFrame(col, 2);

    M.assets.define('godgames.icarus.stageAtlasV2', {
      src: 'assets/manga/icarus/icarus-creatures-clean-v1.png',
      preload: false,
      frames: {
        eagleFly1:      eagleFrame(0),
        eagleFly2:      eagleFrame(1),
        eagleFly3:      eagleFrame(2),
        eagleFly4:      eagleFrame(3),
        eagleFly5:      eagleFrame(2),
        eagleFly6:      eagleFrame(1),
        eagleDive:      eagleFrame(0),
        eagleHit:       eagleFrame(2),
        orcaBreach1:    orcaBodyFrame(0),
        orcaBreach2:    orcaBodyFrame(1),
        orcaBreach3:    orcaBodyFrame(2),
        orcaBreach4:    orcaBodyFrame(3),
        orcaBreach5:    orcaBodyFrame(4),
        orcaBreach6:    orcaBodyFrame(5),
        orcaChurn:      atlasFrame(6, 1),
        orcaSplash:     atlasFrame(7, 1),
        daedalusFly1:   daedalusFlyFrame(0),
        daedalusFly2:   daedalusFlyFrame(1),
        daedalusFly3:   daedalusFlyFrame(2),
        daedalusFly4:   daedalusFlyFrame(3),
        daedalusRescue: atlasFrame(4, 2),
        islandReady:    atlasFrame(0, 3),
        islandSinking:  atlasFrame(1, 3),
        featherBurst:   atlasFrame(2, 3),
        burnFlare:      atlasFrame(3, 3),
        waterDrips:     atlasFrame(4, 3),
        diveAura:       atlasFrame(5, 3),
        eagleCruise:    eagleFrame(1),
        eagleAttack:    eagleFrame(3),
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
