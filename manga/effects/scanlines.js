// manga/effects/scanlines.js — subtle horizontal CRT-feel stripes overlay.
(function () {
  const M = (window.Manga = window.Manga || { effects: {}, characters: {}, fx: {}, INK: '#0a0a0a' });
  const cache = M._patternCache = M._patternCache || {};

  function makePattern(ctx, spacing, alpha, color) {
    const key = `scan|${spacing}|${alpha}|${color}`;
    if (cache[key]) return cache[key];
    const c = document.createElement('canvas');
    c.width = 1; c.height = spacing;
    const cx = c.getContext('2d');
    cx.fillStyle = color;
    cx.globalAlpha = alpha;
    cx.fillRect(0, 0, 1, 1);
    cache[key] = ctx.createPattern(c, 'repeat');
    return cache[key];
  }

  /** opts: { spacing (default 3), alpha (default 0.18), color (default '#000') } */
  M.effects.scanlines = function (ctx, W, H, opts = {}) {
    const spacing = opts.spacing || 3;
    const alpha   = opts.alpha != null ? opts.alpha : 0.18;
    const color   = opts.color || '#000';
    const pat = makePattern(ctx, spacing, alpha, color);
    ctx.save();
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  };
})();
