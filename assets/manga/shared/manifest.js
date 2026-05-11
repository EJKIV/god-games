(function () {
  function register() {
    const M = window.Manga;
    if (!M || !M.assets || typeof M.assets.define !== 'function') {
      setTimeout(register, 0);
      return;
    }
    function mangaRequested() {
      try { return localStorage.getItem('godgames_manga') === '1'; }
      catch (_e) { return false; }
    }
    function hubPage() {
      const path = (location.pathname || '').split('/').pop();
      return !path || path === 'index.html';
    }
    if (!mangaRequested() && !hubPage()) return;

    const cell = 362;
    const frame = (col, row) => ({ x: col * cell, y: row * cell, w: cell, h: cell });

    M.assets.define('godgames.shared.sceneAtlas', {
      src: 'assets/manga/shared/godgames-scene-atlas.jpg',
      frames: {
        hub:         frame(0, 0),
        hubStage:    frame(0, 0),
        olympus:     frame(1, 0),
        olympusHall: frame(1, 0),
        icarus:      frame(2, 0),
        achilles:    frame(3, 0),
        orion:       frame(0, 1),
        perseus:     frame(1, 1),
        oceanus:     frame(2, 1),
        lethe:       frame(2, 1),
        asphodel:    frame(3, 1),
        erebus:      frame(0, 2),
        tartarus:    frame(1, 2),
        zeus:        frame(2, 2),
        dreams:      frame(2, 2),
        clues:       frame(3, 2),
        clueTablet:  frame(3, 2),
        elysium:     frame(1, 0),
      },
      meta: {
        usage: 'Shared manga/anime scene atlas for hub, game title/death screens, clue review, Olympus, and mystery places.',
        placeMappings: {
          lethe: 'oceanus frame with river-of-forgetting treatment',
          elysium: 'olympus frame with blessed-field treatment',
          dreams: 'zeus frame with dream-realm treatment',
        },
      },
    });

    M.assets.define('godgames.shared.hubConcourseV2', {
      src: 'assets/manga/shared/hub-concourse-v2.jpg',
      meta: {
        usage: 'Clean manga/anime Mount Olympus hub concourse with five empty destination shrine bays; live canvas overlays provide labels, selection, and navigation.',
      },
    });

    const hubPanelW = 1983 / 5;
    const hubPanel = (idx) => ({ x: idx * hubPanelW + 28, y: 42, w: hubPanelW - 56, h: 662 });
    M.assets.define('godgames.shared.hubDestinationPanelsV2', {
      src: 'assets/manga/shared/hub-destination-panels-v2.jpg',
      frames: {
        orion: hubPanel(0),
        achilles: hubPanel(1),
        perseus: hubPanel(2),
        olympus: hubPanel(3),
        icarus: hubPanel(4),
      },
      meta: {
        usage: 'Five cohesive manga destination murals used as live hub shrine insets.',
      },
    });

    const avatarCell = 3552 / 8;
    const avatarH = 887;
    const avatarFrame = (col, row) => ({
      x: col * avatarCell,
      y: row * avatarH,
      w: avatarCell,
      h: avatarH,
      anchorX: avatarCell / 2,
      anchorY: 768,
    });
    M.assets.define('godgames.shared.hubAvatarV2', {
      src: 'assets/manga/shared/hub-avatar-loops-v1.png',
      frames: {
        idle:  avatarFrame(0, 0),
        walkA: avatarFrame(0, 1),
        walkB: avatarFrame(4, 1),
        ready: avatarFrame(4, 0),
        idle1: avatarFrame(0, 0),
        idle2: avatarFrame(1, 0),
        idle3: avatarFrame(2, 0),
        idle4: avatarFrame(3, 0),
        ready1: avatarFrame(4, 0),
        ready2: avatarFrame(5, 0),
        ready3: avatarFrame(6, 0),
        ready4: avatarFrame(7, 0),
        walk1: avatarFrame(0, 1),
        walk2: avatarFrame(1, 1),
        walk3: avatarFrame(2, 1),
        walk4: avatarFrame(3, 1),
        walk5: avatarFrame(4, 1),
        walk6: avatarFrame(5, 1),
        walk7: avatarFrame(6, 1),
        walk8: avatarFrame(7, 1),
      },
      meta: {
        usage: 'Transparent manga/anime hub traveler sprite sheet for the Mount Olympus concourse.',
        animations: {
          idle: { frames: ['idle1', 'idle2', 'idle3', 'idle4'], fps: 5, loop: true },
          ready: { frames: ['ready1', 'ready2', 'ready3', 'ready4'], fps: 5, loop: true },
          walk: { frames: ['walk1', 'walk2', 'walk3', 'walk4', 'walk5', 'walk6', 'walk7', 'walk8'], fps: 12, loop: true },
        },
      },
    });

    const toadCellW = 2048 / 8;
    const toadCellH = 384 / 2;
    const toadFrame = (col, row) => ({
      x: col * toadCellW,
      y: row * toadCellH,
      w: toadCellW,
      h: toadCellH,
      anchorX: toadCellW / 2,
      anchorY: 160,
    });
    M.assets.define('godgames.shared.hubToadV1', {
      src: 'assets/manga/shared/hub-toad-loops-v1.png',
      frames: {
        idle: toadFrame(0, 0),
        ready: toadFrame(4, 0),
        hop: toadFrame(0, 1),
        idle1: toadFrame(0, 0),
        idle2: toadFrame(1, 0),
        idle3: toadFrame(2, 0),
        idle4: toadFrame(3, 0),
        ready1: toadFrame(4, 0),
        ready2: toadFrame(5, 0),
        ready3: toadFrame(6, 0),
        ready4: toadFrame(7, 0),
        hop1: toadFrame(0, 1),
        hop2: toadFrame(1, 1),
        hop3: toadFrame(2, 1),
        hop4: toadFrame(3, 1),
        hop5: toadFrame(4, 1),
        hop6: toadFrame(5, 1),
        hop7: toadFrame(6, 1),
        hop8: toadFrame(7, 1),
      },
      meta: {
        usage: 'Transparent manga/anime hub toad sprite loops for clue entrance traversal.',
        animations: {
          idle: { frames: ['idle1', 'idle2', 'idle3', 'idle4'], fps: 4, loop: true },
          ready: { frames: ['ready1', 'ready2', 'ready3', 'ready4'], fps: 4, loop: true },
          hop: { frames: ['hop1', 'hop2', 'hop3', 'hop4', 'hop5', 'hop6', 'hop7', 'hop8'], fps: 9, loop: true },
        },
      },
    });
  }

  register();
})();
