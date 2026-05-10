// manga/effects/animeface.js - reusable anime facial details.
//
// These helpers are intentionally tiny canvas primitives. They keep character
// files visually consistent without taking ownership of character anatomy.

(function () {
  const M = (window.Manga = window.Manga || { effects: {}, characters: {}, fx: {}, INK: '#0a0a0a' });
  M.effects = M.effects || {};
  M.INK = M.INK || '#0a0a0a';

  function optNum(v, fallback) {
    return typeof v === 'number' ? v : fallback;
  }

  function inkStroke(ctx, w) {
    if (M.effects.inkStroke) {
      M.effects.inkStroke(ctx, w);
    } else {
      ctx.strokeStyle = M.INK;
      ctx.lineWidth = w || 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }

  M.effects.animeEye = function animeEye(ctx, x, y, opts = {}) {
    const sx = optNum(opts.sx, optNum(opts.scale, 1));
    const sy = optNum(opts.sy, optNum(opts.scale, 1));
    const rot = optNum(opts.rot, 0);
    const iris = opts.iris || '#3a2514';
    const pupil = opts.pupil || M.INK;
    const white = opts.white || '#fffaf0';
    const lid = opts.lid || M.INK;
    const outline = optNum(opts.outline, 1.7);
    const mood = opts.mood || 'focus';
    const catchlight = opts.catchlight !== false;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(sx, sy);

    // Tall white eye reads anime even at sprite scale.
    ctx.fillStyle = white;
    ctx.beginPath();
    ctx.ellipse(0, 0, 4.1, 6.2, 0.02, 0, Math.PI * 2);
    ctx.fill();
    inkStroke(ctx, outline);
    ctx.stroke();

    ctx.fillStyle = iris;
    ctx.beginPath();
    ctx.ellipse(0.25, 0.45, 2.45, 4.15, 0.05, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = pupil;
    ctx.beginPath();
    ctx.ellipse(0.45, 0.7, 1.05, 2.85, 0, 0, Math.PI * 2);
    ctx.fill();

    if (catchlight) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-1.05, -2.25, 1.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(1.15, 2.55, 0.46, 0, Math.PI * 2);
      ctx.fill();
    }

    // Heavy upper lash and mood line provide the anime expression cue.
    ctx.strokeStyle = lid;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 1.75;
    ctx.beginPath();
    ctx.moveTo(-4.7, -5.1);
    ctx.quadraticCurveTo(0.1, -7.4, 5.0, -4.8);
    ctx.stroke();
    ctx.lineWidth = 1.35;
    ctx.beginPath();
    if (mood === 'soft') {
      ctx.moveTo(-4.5, -8.1);
      ctx.quadraticCurveTo(0.4, -8.8, 5.0, -7.3);
    } else if (mood === 'wide') {
      ctx.moveTo(-5.1, -8.3);
      ctx.lineTo(5.2, -8.8);
    } else {
      ctx.moveTo(-5.3, -8.2);
      ctx.lineTo(5.0, -9.6);
    }
    ctx.stroke();

    ctx.restore();
  };

  M.effects.animeCheek = function animeCheek(ctx, x, y, opts = {}) {
    const scale = optNum(opts.scale, 1);
    const color = opts.color || 'rgba(210, 70, 75, 0.48)';
    const rot = optNum(opts.rot, -0.18);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2 * scale;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo((-3 + i * 3) * scale, -1.5 * scale);
      ctx.lineTo((-1 + i * 3) * scale, 2.1 * scale);
      ctx.stroke();
    }
    ctx.restore();
  };
})();
