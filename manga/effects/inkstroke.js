// manga/effects/inkstroke.js — convenience: configure ctx for a bold black ink stroke.
(function () {
  const M = (window.Manga = window.Manga || { effects: {}, characters: {}, fx: {}, INK: '#0a0a0a' });

  /** Sets strokeStyle/lineWidth/lineJoin/lineCap for a bold ink stroke.
   *  Caller is responsible for ctx.save()/restore() if it wants to revert. */
  M.effects.inkStroke = function (ctx, w) {
    ctx.strokeStyle = M.INK;
    ctx.lineWidth = w || 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
  };
})();
