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
  }

  register();
})();
