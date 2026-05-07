// manga/scenes/hub.js — manga-style versions of hub scene elements.
//
// Three drawables:
//   Manga.scenes.archPortal  — gateway arch with name plate. Replaces drawPortal.
//   Manga.scenes.olympus     — sacred mountain peak. Replaces drawMountain.
//   Manga.scenes.column      — decorative pillar. Replaces drawColumn.
//
// All take a (ctx, state) signature where state carries position + flags
// the caller already tracks (player-near, name, sub, hue, etc.).

(function () {
  const M = (window.Manga = window.Manga || {});
  M.effects = M.effects || {}; M.characters = M.characters || {};
  M.fx = M.fx || {}; M.scenes = M.scenes || {}; M.INK = M.INK || '#0a0a0a';

  // ── Arch portal ───────────────────────────────────────────────────────
  // state: { x, gy, name, sub, hue, near, time }
  M.scenes.archPortal = function (ctx, state) {
    const archH = 150, archW = 70;
    const innerH = archH - 14, innerW = archW;
    const time = state.time || 0;
    const pulse = Math.sin(time * 2.2);

    ctx.save();
    ctx.translate(state.x, state.gy);

    // Inner panel — flat warm color (NOT a gradient)
    ctx.fillStyle = state.hue || '#ff7700';
    ctx.beginPath();
    ctx.rect(-innerW / 2, -archH, innerW, archH);
    ctx.arc(0, -archH, innerW / 2, Math.PI, 0);
    ctx.fill();

    // Halftone shadow inside the arch (right half)
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, -archH, innerW / 2, archH);
    ctx.arc(0, -archH, innerW / 2, -Math.PI / 2, 0);
    ctx.clip();
    M.effects.halftone(ctx, 0, -archH, innerW / 2, archH, {
      density: 5, dotSize: 2, alpha: 0.55, color: '#0a0a0a',
    });
    ctx.restore();

    // Speed lines bursting from the portal (only when near, manga emphasis)
    if (state.near && M.effects.speedLines) {
      M.effects.speedLines(ctx, 0, -archH * 0.55, {
        count: 14, innerR: 18, outerR: 56,
        color: 'rgba(255,255,255,0.65)', width: 1.8, jitter: 0.5,
      });
    }

    // Pillars — flat tan with thick ink outline + flute lines
    ctx.fillStyle = '#c8b078';
    ctx.fillRect(-archW / 2 - 16, -archH, 16, archH);
    ctx.fillRect( archW / 2,      -archH, 16, archH);
    M.effects.inkStroke(ctx, 4);
    ctx.strokeRect(-archW / 2 - 16, -archH, 16, archH);
    ctx.strokeRect( archW / 2,      -archH, 16, archH);
    // Flutes
    M.effects.inkStroke(ctx, 1.8);
    for (const px of [-archW / 2 - 12, -archW / 2 - 8, -archW / 2 - 4]) {
      ctx.beginPath(); ctx.moveTo(px, -archH + 4); ctx.lineTo(px, -2); ctx.stroke();
    }
    for (const px of [archW / 2 + 4, archW / 2 + 8, archW / 2 + 12]) {
      ctx.beginPath(); ctx.moveTo(px, -archH + 4); ctx.lineTo(px, -2); ctx.stroke();
    }

    // Capstone — flat darker tan with bold outline
    ctx.fillStyle = '#9a8050';
    ctx.beginPath();
    ctx.rect(-archW / 2 - 22, -archH - 12, archW + 44, 14);
    ctx.fill();
    M.effects.inkStroke(ctx, 4);
    ctx.stroke();

    // Arch outer outline (thick, the defining manga shape)
    M.effects.inkStroke(ctx, 5);
    ctx.beginPath();
    ctx.moveTo(-innerW / 2, 0);
    ctx.lineTo(-innerW / 2, -archH);
    ctx.arc(0, -archH, innerW / 2, Math.PI, 0);
    ctx.lineTo(innerW / 2, 0);
    ctx.stroke();

    // Inner halo when near — bold ring around the arch
    if (state.near) {
      const t = 0.5 + pulse * 0.5;
      ctx.save();
      ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 14 + t * 12;
      ctx.strokeStyle = `rgba(255,255,255,${0.5 + t * 0.4})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-innerW / 2, 0);
      ctx.lineTo(-innerW / 2, -archH);
      ctx.arc(0, -archH, innerW / 2, Math.PI, 0);
      ctx.lineTo(innerW / 2, 0);
      ctx.stroke();
      ctx.restore();
    }

    // Name plate — bold ink-outlined name above the arch
    ctx.font = '900 18px "Impact", "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 4;
    ctx.strokeStyle = M.INK;
    ctx.strokeText(state.name, 0, -archH - 28);
    ctx.fillStyle = '#fff5c0';
    ctx.fillText(state.name, 0, -archH - 28);
    // Subtitle
    ctx.font = 'bold 11px monospace';
    ctx.lineWidth = 2.5;
    ctx.strokeText(state.sub, 0, -archH - 11);
    ctx.fillStyle = '#fff5c0';
    ctx.fillText(state.sub, 0, -archH - 11);
    ctx.textBaseline = 'alphabetic';

    ctx.restore();
  };

  // ── Mount Olympus (mountain portal) ───────────────────────────────────
  // state: { x, gy, name, sub, near, time }
  M.scenes.olympus = function (ctx, state) {
    const peakH = 220, baseW = 240;
    const time = state.time || 0;

    ctx.save();
    ctx.translate(state.x, state.gy);

    // Mountain silhouette — FLAT slate-blue with thick ink outline
    ctx.fillStyle = '#3a4470';
    ctx.beginPath();
    ctx.moveTo(-baseW / 2, 0);
    ctx.lineTo(-baseW * 0.20, -peakH * 0.50);
    ctx.lineTo(-baseW * 0.06, -peakH * 0.85);
    ctx.lineTo(0, -peakH);
    ctx.lineTo( baseW * 0.07, -peakH * 0.84);
    ctx.lineTo( baseW * 0.22, -peakH * 0.55);
    ctx.lineTo( baseW / 2, 0);
    ctx.closePath();
    ctx.fill();
    M.effects.inkStroke(ctx, 5);
    ctx.stroke();

    // Halftone shading on shadowed (right) flank
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, -peakH);
    ctx.lineTo( baseW * 0.07, -peakH * 0.84);
    ctx.lineTo( baseW * 0.22, -peakH * 0.55);
    ctx.lineTo( baseW / 2, 0);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.clip();
    M.effects.halftone(ctx, 0, -peakH, baseW / 2, peakH, {
      density: 5, dotSize: 1.9, alpha: 0.50, color: '#0a0a0a',
    });
    ctx.restore();

    // Snowcap — flat white with sharp angular silhouette and thick outline
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-baseW * 0.10, -peakH * 0.66);
    ctx.lineTo(-baseW * 0.07, -peakH * 0.74);
    ctx.lineTo(-baseW * 0.03, -peakH * 0.80);
    ctx.lineTo(0, -peakH);
    ctx.lineTo( baseW * 0.04, -peakH * 0.79);
    ctx.lineTo( baseW * 0.07, -peakH * 0.74);
    ctx.lineTo( baseW * 0.11, -peakH * 0.66);
    // jagged underside
    ctx.lineTo( baseW * 0.06, -peakH * 0.66);
    ctx.lineTo( baseW * 0.02, -peakH * 0.72);
    ctx.lineTo(-baseW * 0.02, -peakH * 0.70);
    ctx.lineTo(-baseW * 0.06, -peakH * 0.66);
    ctx.closePath();
    ctx.fill();
    M.effects.inkStroke(ctx, 3.5);
    ctx.stroke();

    // Speed lines radiating from the summit (manga "this is sacred" cue)
    if (M.effects.speedLines) {
      M.effects.speedLines(ctx, 0, -peakH, {
        count: 18, innerR: 24, outerR: 100, color: '#fff5c0', width: 1.6, jitter: 0.3,
      });
    }

    // Title above the peak — bold ink-outlined
    ctx.font = '900 26px "Impact", "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 6;
    ctx.strokeStyle = M.INK;
    ctx.strokeText(state.name, 0, -peakH - 30);
    ctx.fillStyle = '#fff5c0';
    ctx.fillText(state.name, 0, -peakH - 30);
    // Subtitle
    ctx.font = 'bold 12px monospace';
    ctx.lineWidth = 3;
    ctx.strokeText(state.sub, 0, -peakH - 10);
    ctx.fillStyle = '#fff5c0';
    ctx.fillText(state.sub, 0, -peakH - 10);
    ctx.textBaseline = 'alphabetic';

    ctx.restore();
  };

  // ── Decorative column ─────────────────────────────────────────────────
  // state: { x, gy }
  M.scenes.column = function (ctx, state) {
    const cH = 110, cW = 18;
    const x = state.x, gy = state.gy;

    // Hard ink shadow
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(x - cW / 2 + 5, gy - cH + 5, cW, cH);

    // Shaft — flat tan
    ctx.fillStyle = '#c8b078';
    ctx.fillRect(x - cW / 2, gy - cH, cW, cH);
    M.effects.inkStroke(ctx, 4);
    ctx.strokeRect(x - cW / 2, gy - cH, cW, cH);

    // Flutes — bold black vertical lines
    M.effects.inkStroke(ctx, 2);
    for (let i = 1; i < 4; i++) {
      const fx = x - cW / 2 + i * (cW / 4);
      ctx.beginPath(); ctx.moveTo(fx, gy - cH + 4); ctx.lineTo(fx, gy - 2); ctx.stroke();
    }

    // Capital
    ctx.fillStyle = '#9a8050';
    ctx.fillRect(x - cW / 2 - 6, gy - cH - 12, cW + 12, 12);
    M.effects.inkStroke(ctx, 4);
    ctx.strokeRect(x - cW / 2 - 6, gy - cH - 12, cW + 12, 12);

    // Base
    ctx.fillStyle = '#9a8050';
    ctx.fillRect(x - cW / 2 - 5, gy - 8, cW + 10, 8);
    M.effects.inkStroke(ctx, 4);
    ctx.strokeRect(x - cW / 2 - 5, gy - 8, cW + 10, 8);
  };
})();
