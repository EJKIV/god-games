// manga.js — Loader for the manga library.
//
// Architecture: each effect, fx helper, and character is a self-contained file
// that registers itself on `window.Manga`. This file pulls them in order so
// games include just one `<script src="manga/manga.js">` tag.
//
// To add a new character: drop a file at `manga/characters/<name>.js` and
// append its path to MANGA_FILES below. To add a new effect: same in
// `manga/effects/`. To add stateful gameplay fx: same in `manga/fx/`.

(function () {
  // Idempotent: don't double-load if the page accidentally includes this twice.
  if (window.__mangaLoaderRan) return;
  window.__mangaLoaderRan = true;

  // Initialize namespace early so feature-detection (`window.Manga?.fx`) works
  // even before sub-files have parsed.
  window.Manga = window.Manga || {};
  const M = window.Manga;
  M.effects    = M.effects    || {};
  M.characters = M.characters || {};
  M.fx         = M.fx         || {};
  M.scenes     = M.scenes     || {};
  M.INK        = M.INK        || '#0a0a0a';

  const MANGA_FILES = [
    // Effects (stateless render helpers)
    'effects/inkstroke.js',
    'effects/halftone.js',
    'effects/speedlines.js',
    'effects/sfxtext.js',
    'effects/panelsplit.js',
    'effects/flash.js',
    'effects/vignette.js',
    'effects/scanlines.js',
    // FX (stateful gameplay-feel helpers)
    'fx/camerapunch.js',
    'fx/slomo.js',
    'fx/sfxlayered.js',
    'fx/zeusstrike.js',
    // Scenes (environmental drawables — portals, mountains, columns)
    'scenes/hub.js',
    // Characters
    'characters/achilles.js',
    'characters/hub-walker.js',
  ];

  // Resolve files relative to this script's URL so the library works no matter
  // where the consumer drops the manga/ folder.
  const here = (document.currentScript && document.currentScript.src) || '';
  const root = here.replace(/manga\.js(\?.*)?$/, '');

  for (const f of MANGA_FILES) {
    const s = document.createElement('script');
    s.src = root + f;
    s.async = false; // preserve order so sub-files see their dependencies (halftone before scanlines, etc.)
    document.head.appendChild(s);
  }
})();
