// manga/effects/halftone.js — manga screen-tone dot pattern.
// Tileable cached pattern via createPattern; clip to a shape for shadow areas.
(function () {
  const M = (window.Manga = window.Manga || { effects: {}, characters: {}, fx: {}, INK: '#0a0a0a' });
  const cache = M._patternCache = M._patternCache || {};

  function makePattern(ctx, density, color, dotSize) {
    const key = `${density}|${color}|${dotSize}`;
    if (cache[key]) return cache[key];
    const c = document.createElement('canvas');
    c.width = c.height = density;
    const cx = c.getContext('2d');
    cx.fillStyle = color;
    cx.beginPath();
    cx.arc(density / 2, density / 2, dotSize / 2, 0, Math.PI * 2);
    cx.fill();
    cache[key] = ctx.createPattern(c, 'repeat');
    return cache[key];
  }

  /** Halftone screen-tone fill over a rect.
   *  opts: { density (px between dots, default 6), dotSize, color, alpha, angle (deg) } */
  M.effects.halftone = function (ctx, x, y, w, h, opts = {}) {
    const density = opts.density || 6;
    const dotSize = opts.dotSize != null ? opts.dotSize : density * 0.42;
    const color = opts.color || M.INK;
    const alpha = opts.alpha != null ? opts.alpha : 0.55;
    const angle = (opts.angle || 0) * Math.PI / 180;
    const pat = makePattern(ctx, density, color, dotSize);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(angle);
    ctx.fillStyle = pat;
    ctx.fillRect(-w / 2 - density, -h / 2 - density, w + density * 2, h + density * 2);
    ctx.restore();
  };
})();
