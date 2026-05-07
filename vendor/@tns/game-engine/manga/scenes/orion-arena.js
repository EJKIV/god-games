// manga/scenes/orion-arena.js — desert arena background, manga style.
//
// Single export: Manga.scenes.orionArena(ctx, W, H, time, opts)
// Replaces the gradient sky / smooth dunes / soft ground with bold flat
// fields and ink silhouettes appropriate for manga mode.

(function () {
  const M = (window.Manga = window.Manga || {});
  M.effects = M.effects || {}; M.characters = M.characters || {};
  M.fx = M.fx || {}; M.scenes = M.scenes || {}; M.INK = M.INK || '#0a0a0a';

  // Cached starfield (resolution-independent)
  let stars = null;
  function ensureStars() {
    if (stars) return;
    stars = Array.from({ length: 140 }, () => ({
      rx: Math.random(),
      ry: Math.random() * 0.7,
      r:  Math.random() * 1.4 + 0.4,
      ph: Math.random() * Math.PI * 2,
    }));
  }

  M.scenes.orionArena = function (ctx, W, H, time, opts = {}) {
    ensureStars();
    const GY = H * 0.76;

    // ── Sky — flat dark blue (no gradient) with horizon band ───────────
    ctx.fillStyle = '#0a1230';
    ctx.fillRect(0, 0, W, GY);
    ctx.fillStyle = '#1c1238';
    ctx.fillRect(0, GY * 0.65, W, GY * 0.35);
    // Bold ink horizon line above the dunes
    ctx.fillStyle = M.INK;
    ctx.fillRect(0, GY * 0.62, W, 1.5);

    // Stars — small white dots with glow
    for (const s of stars) {
      const blink = Math.sin(time * 1.5 + s.ph) * 0.4 + 0.6;
      ctx.globalAlpha = blink * 0.95;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(s.rx * W, s.ry * GY * 0.62, s.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Moon — flat ivory disk with sharp crescent and bold outline
    ctx.fillStyle = '#fff5d8';
    ctx.beginPath(); ctx.arc(W * 0.86, H * 0.10, 30, 0, Math.PI * 2); ctx.fill();
    M.effects.inkStroke(ctx, 3);
    ctx.stroke();
    // Crescent shadow
    ctx.fillStyle = '#0a1230';
    ctx.beginPath(); ctx.arc(W * 0.86 + 9, H * 0.10, 26, 0, Math.PI * 2); ctx.fill();

    // ── Dunes silhouette — flat dark slab with bold ink outline ────────
    ctx.fillStyle = '#1a0e08';
    ctx.beginPath();
    ctx.moveTo(0, GY);
    const dx = [0,.10,.22,.35,.46,.58,.70,.82,.93,1];
    const dh = [.14,.09,.22,.10,.18,.07,.20,.11,.08,.12];
    for (let i = 0; i < dx.length; i++) ctx.lineTo(dx[i] * W, GY - dh[i] * H * 0.55);
    ctx.lineTo(W, GY); ctx.closePath();
    ctx.fill();
    M.effects.inkStroke(ctx, 4);
    // outline only the top of the dunes (where the silhouette meets sky)
    ctx.beginPath();
    ctx.moveTo(0, GY);
    for (let i = 0; i < dx.length; i++) ctx.lineTo(dx[i] * W, GY - dh[i] * H * 0.55);
    ctx.lineTo(W, GY);
    ctx.stroke();

    // Halftone shading on the dunes (top half)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, GY);
    for (let i = 0; i < dx.length; i++) ctx.lineTo(dx[i] * W, GY - dh[i] * H * 0.55);
    ctx.lineTo(W, GY); ctx.closePath();
    ctx.clip();
    M.effects.halftone(ctx, 0, GY - H * 0.32, W, H * 0.14, {
      density: 6, dotSize: 2.0, alpha: 0.40, color: '#0a0a0a',
    });
    ctx.restore();

    // ── Ground — flat sandy color with bold ink top edge ───────────────
    ctx.fillStyle = '#9a5418';
    ctx.fillRect(0, GY, W, H - GY);
    // Halftone shading on far ground
    M.effects.halftone(ctx, 0, GY + 14, W, H - GY - 14, {
      density: 7, dotSize: 1.7, alpha: 0.22, color: '#0a0a0a',
    });
    // Top edge ink line
    ctx.fillStyle = M.INK;
    ctx.fillRect(0, GY, W, 3);

    // Sand ripples — bold ink lines
    M.effects.inkStroke(ctx, 1.4);
    for (let i = 0; i < 5; i++) {
      const ry = GY + 14 + i * 22;
      ctx.beginPath();
      ctx.moveTo(0, ry);
      for (let x = 0; x <= W; x += 24) {
        ctx.lineTo(x, ry + Math.sin(x * 0.025 + i * 1.4) * 4);
      }
      ctx.stroke();
    }

    // Rocks — flat dark ovals with bold ink
    const rockXs = [W * 0.07, W * 0.22, W * 0.45, W * 0.62, W * 0.80, W * 0.91];
    for (let i = 0; i < rockXs.length; i++) {
      const rx = rockXs[i], rw = 16 + i * 5, rh = 10 + i * 2;
      ctx.fillStyle = '#3a1e08';
      ctx.beginPath(); ctx.ellipse(rx, GY - 4, rw, rh, 0, 0, Math.PI * 2); ctx.fill();
      M.effects.inkStroke(ctx, 2.5);
      ctx.stroke();
    }

    // Torches at the arena edges (manga ink, bold flame)
    drawMangaTorch(ctx, W * 0.04, GY - 50, time);
    drawMangaTorch(ctx, W * 0.96, GY - 50, time);
  };

  function drawMangaTorch(ctx, x, y, time) {
    ctx.save(); ctx.translate(x, y);
    // Pole
    ctx.strokeStyle = '#3a2410'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -30); ctx.stroke();
    M.effects.inkStroke(ctx, 2.5);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -30); ctx.stroke();
    // Cup
    ctx.fillStyle = '#5a3818';
    ctx.beginPath();
    ctx.moveTo(-9, -30); ctx.lineTo(9, -30); ctx.lineTo(7, -20); ctx.lineTo(-7, -20);
    ctx.closePath(); ctx.fill();
    M.effects.inkStroke(ctx, 2.5);
    ctx.stroke();
    // Flame — bold flat shape with ink outline + speed-line tongues
    const fl = 0.7 + Math.sin(time * 8 + x) * 0.3;
    ctx.shadowColor = '#ff8800'; ctx.shadowBlur = 18 * fl;
    ctx.fillStyle = '#ff8800';
    ctx.beginPath();
    ctx.moveTo(-7, -22);
    ctx.lineTo(-3, -34 - fl * 4);
    ctx.lineTo(0, -42 - fl * 6);
    ctx.lineTo(3, -34 - fl * 4);
    ctx.lineTo(7, -22);
    ctx.closePath();
    ctx.fill();
    M.effects.inkStroke(ctx, 2);
    ctx.stroke();
    // Inner flame
    ctx.fillStyle = '#fff5a0';
    ctx.beginPath();
    ctx.moveTo(-3, -24); ctx.lineTo(0, -36 - fl * 4); ctx.lineTo(3, -24);
    ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }
})();
