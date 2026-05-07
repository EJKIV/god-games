// manga/effects/sfxtext.js — bold tilted comic-style SFX text ("BAM!", "ZASH!").
(function () {
  const M = (window.Manga = window.Manga || { effects: {}, characters: {}, fx: {}, INK: '#0a0a0a' });

  /** opts: { size, color, outline, outlineWidth, tilt (deg), font, alpha } */
  M.effects.sfxText = function (ctx, x, y, text, opts = {}) {
    const size = opts.size || 48;
    const tilt = ((opts.tilt != null ? opts.tilt : -8) * Math.PI) / 180;
    const fill = opts.color || '#fff5c0';
    const outline = opts.outline || M.INK;
    const outlineWidth = opts.outlineWidth || Math.max(4, size * 0.14);
    const font = opts.font || `900 ${size}px "Impact", "Arial Black", sans-serif`;
    const alpha = opts.alpha != null ? opts.alpha : 1;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(tilt);
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    ctx.lineWidth = outlineWidth;
    ctx.strokeStyle = outline;
    ctx.strokeText(text, 0, 0);
    ctx.fillStyle = fill;
    ctx.fillText(text, 0, 0);
    ctx.restore();
  };
})();
