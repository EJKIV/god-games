// manga/effects/flash.js — full-screen color burst.
// Use for hit pulses ('rgba(255,40,0,0.4)') or thunder ('#fff5c0').
(function () {
  const M = (window.Manga = window.Manga || { effects: {}, characters: {}, fx: {}, INK: '#0a0a0a' });

  /** Fill the screen with `color` at `alpha` (0..1). Cheap. */
  M.effects.flash = function (ctx, W, H, color, alpha) {
    if (!alpha || alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.min(1, alpha);
    ctx.fillStyle = color || '#ffffff';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  };
})();
