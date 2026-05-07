// manga/effects/panelsplit.js — death/transition slabs sliding off-screen.
(function () {
  const M = (window.Manga = window.Manga || { effects: {}, characters: {}, fx: {}, INK: '#0a0a0a' });

  /** Manga panel-split transition — alternate slabs slide off opposite sides.
   *  progress 0..1: 0=full coverage, 1=fully revealed.
   *  opts: { slabs (default 3), color } */
  M.effects.panelSplit = function (ctx, W, H, progress, opts = {}) {
    const slabs = opts.slabs || 3;
    const color = opts.color || '#0a0a14';
    const slabH = H / slabs;
    ctx.save();
    ctx.fillStyle = color;
    for (let i = 0; i < slabs; i++) {
      const dir = i % 2 === 0 ? -1 : 1;
      const off = dir * progress * (W * 1.15);
      ctx.fillRect(off, i * slabH, W, slabH + 1);
    }
    ctx.restore();
  };
})();
