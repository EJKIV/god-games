// manga/effects/vignette.js — radial dark fade around the edges of the frame.
(function () {
  const M = (window.Manga = window.Manga || { effects: {}, characters: {}, fx: {}, INK: '#0a0a0a' });

  /** Atmospheric vignette overlay.
   *  opts: { strength (0..1, default 0.55), color (default '#000'),
   *          inner (0..1 of half-min-dim, default 0.45) } */
  M.effects.vignette = function (ctx, W, H, opts = {}) {
    const strength = opts.strength != null ? opts.strength : 0.55;
    const color    = opts.color    || '#000';
    const inner    = opts.inner != null ? opts.inner : 0.45;
    const r = Math.max(W, H) * 0.75;
    const r0 = Math.min(W, H) * inner;
    const cx = W / 2, cy = H / 2;
    const grad = ctx.createRadialGradient(cx, cy, r0, cx, cy, r);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, color === '#000'
      ? `rgba(0,0,0,${strength})`
      : color);  // arbitrary CSS color tolerated
    ctx.save();
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  };
})();
