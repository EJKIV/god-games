// manga/assets.js — Tiny bitmap asset registry for manga-mode art.
//
// The manga library stays portable: callers define their own project-local
// image paths after loading manga.js, then use this helper to draw full images
// or named sprite-sheet frames when those images are ready.

(function () {
  const M = (window.Manga = window.Manga || {});
  M.effects = M.effects || {}; M.characters = M.characters || {};
  M.fx = M.fx || {}; M.scenes = M.scenes || {}; M.assets = M.assets || {};
  M.INK = M.INK || '#0a0a0a';

  const A = M.assets;
  const defs = A._defs || (A._defs = {});
  const images = A._images || (A._images = {});

  function clamp01(v, fallback) {
    if (typeof v !== 'number' || !Number.isFinite(v)) return fallback;
    return Math.max(0, Math.min(1, v));
  }

  A.define = function define(id, def) {
    if (!id || !def || !def.src) return null;
    defs[id] = {
      src: def.src,
      crossOrigin: def.crossOrigin,
      frames: def.frames || {},
      meta: def.meta || {},
    };
    if (def.preload !== false) A.image(id);
    return defs[id];
  };

  A.get = function get(id) {
    return defs[id] || null;
  };

  A.image = function image(id) {
    const def = defs[id];
    if (!def) return null;
    if (!images[id]) {
      const img = new Image();
      const entry = images[id] = { img, loaded: false, failed: false };
      if (def.crossOrigin) img.crossOrigin = def.crossOrigin;
      img.decoding = 'async';
      img.onload = () => { entry.loaded = true; entry.failed = false; };
      img.onerror = () => { entry.failed = true; };
      img.src = def.src;
      if (img.complete && img.naturalWidth > 0) entry.loaded = true;
    }
    return images[id].img;
  };

  A.ready = function ready(id) {
    if (!images[id]) A.image(id);
    const entry = images[id];
    return !!(entry && !entry.failed && entry.img.complete && entry.img.naturalWidth > 0);
  };

  A.failed = function failed(id) {
    return !!(images[id] && images[id].failed);
  };

  A.frame = function frame(id, name) {
    const def = defs[id];
    if (!def || !def.frames) return null;
    return def.frames[name] || null;
  };

  A.drawImage = function drawImage(ctx, id, x, y, w, h, opts = {}) {
    const img = A.image(id);
    if (!img || !A.ready(id)) return false;

    const sw = img.naturalWidth || img.width;
    const sh = img.naturalHeight || img.height;
    if (!sw || !sh || !w || !h) return false;

    const fit = opts.fit || 'cover';
    const focusX = clamp01(opts.focusX, 0.5);
    const focusY = clamp01(opts.focusY, 0.5);
    const alignX = clamp01(opts.alignX, 0.5);
    const alignY = clamp01(opts.alignY, 0.5);
    const alpha = typeof opts.alpha === 'number' ? opts.alpha : 1;

    ctx.save();
    ctx.globalAlpha *= alpha;

    if (fit === 'contain') {
      const scale = Math.min(w / sw, h / sh);
      const dw = sw * scale;
      const dh = sh * scale;
      const dx = x + (w - dw) * alignX;
      const dy = y + (h - dh) * alignY;
      ctx.drawImage(img, dx, dy, dw, dh);
    } else {
      const scale = Math.max(w / sw, h / sh);
      const cropW = Math.min(sw, w / scale);
      const cropH = Math.min(sh, h / scale);
      const sx = (sw - cropW) * focusX;
      const sy = (sh - cropH) * focusY;
      ctx.drawImage(img, sx, sy, cropW, cropH, x, y, w, h);
    }

    ctx.restore();
    return true;
  };

  A.drawFrame = function drawFrame(ctx, id, name, x, y, opts = {}) {
    const img = A.image(id);
    const fr = A.frame(id, name);
    if (!img || !fr || !A.ready(id)) return false;

    const scale = typeof opts.scale === 'number' ? opts.scale : 1;
    const alpha = typeof opts.alpha === 'number' ? opts.alpha : 1;
    const ax = typeof opts.anchorX === 'number' ? opts.anchorX : (typeof fr.anchorX === 'number' ? fr.anchorX : fr.w / 2);
    const ay = typeof opts.anchorY === 'number' ? opts.anchorY : (typeof fr.anchorY === 'number' ? fr.anchorY : fr.h / 2);

    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(x, y);
    if (opts.rotate) ctx.rotate(opts.rotate);
    ctx.scale((opts.flipX ? -1 : 1) * scale, (opts.flipY ? -1 : 1) * scale);
    ctx.drawImage(img, fr.x, fr.y, fr.w, fr.h, -ax, -ay, fr.w, fr.h);
    ctx.restore();
    return true;
  };
})();
