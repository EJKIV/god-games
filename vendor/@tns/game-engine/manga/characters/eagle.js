// manga/characters/eagle.js — bald eagle in flight, manga style.
//
// Caller has already ctx.translate(eagle.x, eagle.y) before calling .draw, so
// the draw runs at the origin (this matches Icarus's existing draw call site).
//
// state shape:
//   size        scale factor (typ 0.9..1.3)
//   wingPhase   radians, drives wing flap
//   diving      bool — manga special "diving claw" (red glow + dive trail)
//   marked      bool — manga telegraph (red ring before dive)

(function () {
  const M = (window.Manga = window.Manga || {});
  M.effects = M.effects || {}; M.characters = M.characters || {};
  M.fx = M.fx || {}; M.scenes = M.scenes || {}; M.INK = M.INK || '#0a0a0a';

  M.characters.eagle = {
    name: 'Eagle',
    defaultState: { size: 1, wingPhase: 0, diving: false, marked: false },
    preview: { width: 70, height: 80, defaultPose: 'flap' },

    polish: {
      onDive: { sfxText: 'DIVE!' },
    },

    draw(ctx, state) {
      const s = state.size;
      const flapY = Math.sin(state.wingPhase) * 18 * s;

      // Diving aura — red trail behind a marked/diving eagle
      if (state.diving) {
        ctx.save();
        ctx.shadowColor = '#ff2200'; ctx.shadowBlur = 24;
        ctx.fillStyle = 'rgba(255, 60, 30, 0.35)';
        ctx.beginPath(); ctx.ellipse(0, -10, 18 * s, 30 * s, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      // Marker ring (telegraph 0.4s before a dive)
      if (state.marked) {
        ctx.save();
        ctx.shadowColor = '#ff2200'; ctx.shadowBlur = 14;
        ctx.strokeStyle = 'rgba(255,40,30,0.85)';
        ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.arc(0, -2, 28 * s, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }

      // ── Wing (left-facing eagle: head at -x, wing root upper-right) ─
      const rx = 6 * s, ry = -8 * s;
      const tipX = 8 * s - flapY * 0.38;
      const tipY = -46 * s + flapY * 0.86;
      // Wing membrane — flat dark brown
      ctx.fillStyle = '#2a1808';
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.bezierCurveTo(rx + 12 * s, ry - 14 * s, tipX + 18 * s, tipY + 12 * s, tipX, tipY);
      ctx.bezierCurveTo(tipX - 10 * s, tipY + 15 * s, rx - 12 * s, ry + 5 * s, rx, ry);
      ctx.fill();
      M.effects.inkStroke(ctx, 3);
      ctx.stroke();
      // Halftone on wing shadow side
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.bezierCurveTo(rx + 12 * s, ry - 14 * s, tipX + 18 * s, tipY + 12 * s, tipX, tipY);
      ctx.bezierCurveTo(tipX - 10 * s, tipY + 15 * s, rx - 12 * s, ry + 5 * s, rx, ry);
      ctx.closePath(); ctx.clip();
      M.effects.halftone(ctx, rx - 4, ry - 12, 18 * s, 24 * s, {
        density: 3, dotSize: 1.2, alpha: 0.45, color: '#0a0a0a',
      });
      ctx.restore();
      // Primary feathers — bold flat shapes
      for (let i = 0; i < 5; i++) {
        const t = i / 4;
        const bx = rx + (tipX - rx) * t;
        const by2 = ry + (tipY - ry) * t;
        const len = (20 - t * 5) * s;
        const ang = -0.18 - t * 0.62 - flapY * 0.006 / s;
        ctx.save();
        ctx.translate(bx, by2);
        ctx.rotate(ang);
        ctx.fillStyle = i % 2 === 0 ? '#3d2a0a' : '#1a0e02';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-len * 0.44, len * 0.2, -len * 0.38, len * 0.73, 0, len);
        ctx.bezierCurveTo(len * 0.06, len * 0.68, len * 0.08, len * 0.22, 0, 0);
        ctx.fill();
        M.effects.inkStroke(ctx, 1);
        ctx.stroke();
        ctx.restore();
      }

      // ── Body ────────────────────────────────────────────────────────
      ctx.fillStyle = '#3d2a0a';
      ctx.beginPath(); ctx.ellipse(2 * s, 0, 16 * s, 6 * s, 0, 0, Math.PI * 2); ctx.fill();
      M.effects.inkStroke(ctx, 2.5);
      ctx.stroke();
      // White tail band
      ctx.fillStyle = '#e8e0c8';
      ctx.beginPath(); ctx.ellipse(14 * s, 0, 5 * s, 3.5 * s, 0, 0, Math.PI * 2); ctx.fill();
      M.effects.inkStroke(ctx, 1.5);
      ctx.stroke();
      // Tail (sharp angular fan)
      ctx.fillStyle = '#1a0e02';
      ctx.beginPath();
      ctx.moveTo(16 * s, -3 * s);
      ctx.bezierCurveTo(22 * s, -7 * s, 28 * s, -3 * s, 30 * s, 0);
      ctx.bezierCurveTo(28 * s, 4 * s, 22 * s, 7 * s, 16 * s, 3 * s);
      ctx.closePath(); ctx.fill();
      M.effects.inkStroke(ctx, 2);
      ctx.stroke();

      // ── White head (bald eagle) ─────────────────────────────────────
      ctx.fillStyle = '#fffaf0';
      ctx.beginPath(); ctx.arc(-9 * s, -2 * s, 7 * s, 0, Math.PI * 2); ctx.fill();
      M.effects.inkStroke(ctx, 2.5);
      ctx.stroke();
      // Halftone on head shadow side
      ctx.save();
      ctx.beginPath(); ctx.arc(-9 * s, -2 * s, 7 * s, 0, Math.PI * 2); ctx.clip();
      M.effects.halftone(ctx, -8 * s, 0, 8 * s, 6 * s, {
        density: 3, dotSize: 1.1, alpha: 0.4, color: '#0a0a0a',
      });
      ctx.restore();
      // Oversized anime predator eye with a hard brow.
      M.effects.animeEye(ctx, -11 * s, -3.8 * s, {
        sx: 0.46 * s, sy: 0.42 * s,
        white: '#ffd54a', iris: state.diving ? '#ff2218' : '#6a2a10',
        mood: 'focus', outline: 1.0 * s,
      });
      M.effects.inkStroke(ctx, 1.5 * s);
      ctx.beginPath(); ctx.moveTo(-15 * s, -8 * s); ctx.lineTo(-8 * s, -6.2 * s); ctx.stroke();

      // ── Hooked yellow beak (points LEFT) ────────────────────────────
      ctx.fillStyle = '#e8a020';
      ctx.beginPath();
      ctx.moveTo(-14 * s, -1.5 * s);
      ctx.lineTo(-23 * s, -0.5 * s);
      ctx.lineTo(-19 * s, 4 * s);
      ctx.lineTo(-13 * s, 2 * s);
      ctx.closePath(); ctx.fill();
      M.effects.inkStroke(ctx, 2);
      ctx.stroke();
    },
  };
})();
