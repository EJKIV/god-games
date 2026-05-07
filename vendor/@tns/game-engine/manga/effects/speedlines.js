// manga/effects/speedlines.js — radial speed/impact lines.
(function () {
  const M = (window.Manga = window.Manga || { effects: {}, characters: {}, fx: {}, INK: '#0a0a0a' });

  /** Radial speed lines emanating from (cx, cy).
   *  opts: { count, innerR, outerR, color, width, jitter (0..1) } */
  M.effects.speedLines = function (ctx, cx, cy, opts = {}) {
    const count  = opts.count  || 14;
    const innerR = opts.innerR || 22;
    const outerR = opts.outerR || 90;
    const color  = opts.color  || M.INK;
    const width  = opts.width  || 2.5;
    const jitter = opts.jitter != null ? opts.jitter : 0.4;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + Math.random() * jitter;
      const r1 = innerR + Math.random() * (innerR * 0.3);
      const r2 = outerR - Math.random() * (outerR * 0.25);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
      ctx.stroke();
    }
    ctx.restore();
  };
})();
