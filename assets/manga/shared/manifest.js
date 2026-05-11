(function () {
  function register() {
    const M = window.Manga;
    if (!M || !M.assets || typeof M.assets.define !== 'function') {
      setTimeout(register, 0);
      return;
    }

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

    const avatarCell = 1774 / 4;
    const avatarFrame = (idx) => ({
      x: idx * avatarCell,
      y: 0,
      w: avatarCell,
      h: 887,
      anchorX: avatarCell / 2,
      anchorY: 768,
    });
    M.assets.define('godgames.shared.hubAvatarV2', {
      src: 'assets/manga/shared/hub-avatar-v2.png',
      frames: {
        idle: avatarFrame(0),
        walkA: avatarFrame(1),
        walkB: avatarFrame(2),
        ready: avatarFrame(3),
      },
      meta: {
        usage: 'Transparent manga/anime hub traveler sprite sheet for the Mount Olympus concourse.',
      },
    });
  }

  register();
})();
