(function () {
  function register() {
    const M = window.Manga;
    if (!M || !M.assets || typeof M.assets.define !== 'function') {
      setTimeout(register, 0);
      return;
    }

    M.assets.define('godgames.icarus.hero', {
      src: 'assets/manga/icarus/icarus-hero.jpg',
      meta: {
        usage: 'Manga-mode Icarus title, tutorial, death, and dive cut-in art.',
      },
    });

    M.assets.define('godgames.icarus.flightStageV2', {
      src: 'assets/manga/icarus/icarus-flight-stage-v2.jpg',
      meta: {
        usage: 'Clean Icarus manga gameplay flight stage with sun, safe lane, sea depth, and no baked-in live actors.',
      },
    });

    const cell = 418;
    M.assets.define('godgames.icarus.flightSheet', {
      src: 'assets/manga/icarus/icarus-flight-sheet.png',
      frames: {
        glide:    { x: cell * 0, y: cell * 0, w: cell, h: cell, anchorX: 209, anchorY: 209 },
        flapUp:   { x: cell * 1, y: cell * 0, w: cell, h: cell, anchorX: 209, anchorY: 209 },
        flapDown: { x: cell * 2, y: cell * 0, w: cell, h: cell, anchorX: 209, anchorY: 209 },
        dive:     { x: cell * 0, y: cell * 1, w: cell, h: cell, anchorX: 209, anchorY: 209 },
        burn:     { x: cell * 1, y: cell * 1, w: cell, h: cell, anchorX: 209, anchorY: 209 },
        wet:      { x: cell * 2, y: cell * 1, w: cell, h: cell, anchorX: 209, anchorY: 209 },
        falling:  { x: cell * 0, y: cell * 2, w: cell, h: cell, anchorX: 209, anchorY: 209 },
        speed:    { x: cell * 1, y: cell * 2, w: cell, h: cell, anchorX: 209, anchorY: 209 },
        recover:  { x: cell * 2, y: cell * 2, w: cell, h: cell, anchorX: 209, anchorY: 209 },
      },
      meta: {
        sourcePrompt: '3x3 chroma-key manga/anime Icarus gameplay sprite sheet, generated to match the Icarus hero art.',
      },
    });

    const atlasCell = 1254 / 4;
    const atlasFrame = (col, row, anchorY = atlasCell / 2) => ({
      x: col * atlasCell, y: row * atlasCell, w: atlasCell, h: atlasCell,
      anchorX: atlasCell / 2, anchorY,
    });

    M.assets.define('godgames.icarus.stageAtlasV2', {
      src: 'assets/manga/icarus/icarus-stage-atlas-v2.png',
      frames: {
        eagleCruise:    atlasFrame(0, 0),
        eagleAttack:    atlasFrame(1, 0),
        eagleDive:      atlasFrame(2, 0),
        eagleHit:       atlasFrame(3, 0),
        orcaChurn:      atlasFrame(0, 1),
        orcaBreach:     atlasFrame(1, 1, atlasCell * 0.76),
        orcaBite:       atlasFrame(2, 1, atlasCell * 0.78),
        orcaSplash:     atlasFrame(3, 1, atlasCell * 0.74),
        daedalusFly:    atlasFrame(0, 2, atlasCell * 0.62),
        daedalusRescue: atlasFrame(1, 2, atlasCell * 0.82),
        islandReady:    atlasFrame(2, 2, atlasCell * 0.78),
        islandSinking:  atlasFrame(3, 2, atlasCell * 0.76),
        featherBurst:   atlasFrame(0, 3),
        burnFlare:      atlasFrame(1, 3),
        waterDrips:     atlasFrame(2, 3),
        diveAura:       atlasFrame(3, 3),
      },
      meta: {
        usage: 'Icarus manga gameplay enemies, Daedalus rescue, islands, and hazard FX.',
        animations: {
          eagleFly:   { frames: ['eagleCruise', 'eagleAttack'], fps: 7, loop: true },
          eagleDive:  { frames: ['eagleDive'], fps: 1, loop: false },
          eagleHit:   { frames: ['eagleHit'], fps: 1, loop: false },
          orcaBreach: { frames: ['orcaBreach', 'orcaBite'], fps: 7, loop: false },
        },
      },
    });
  }

  register();
})();
