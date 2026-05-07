// manga/characters/daedalus.js — Daedalus the inventor, manga style.
//
// Three poses share the same draw entrypoint:
//   pose: 'flying'   — side-profile, robed, wings extended (escort/hub).
//   pose: 'standing' — feet on ground (tutorial / lectern / mentor scene).
//   pose: 'rescue'   — only the forearm + hand, reaching upward (Icarus auto-rescue).
//
// state: { x, y, pose, t (anim phase), facing (1=right, -1=left), bob (extra y), reach (0..1) }
//   reach is used by the rescue pose to drive the hand stretching from below.

(function () {
  const M = (window.Manga = window.Manga || {});
  M.effects = M.effects || {}; M.characters = M.characters || {};
  M.fx = M.fx || {}; M.scenes = M.scenes || {}; M.INK = M.INK || '#0a0a0a';

  const ROBE      = '#3a2e1e';
  const ROBE_HI   = '#6a5438';
  const SKIN      = '#d4a060';
  const SKIN_DARK = '#9a5020';
  const BEARD     = '#e8e2d2';
  const BEARD_INK = '#7a7268';
  const GOLD      = '#D4AF37';

  M.characters.daedalus = {
    name: 'Daedalus',
    defaultState: {
      x: 0, y: 0, pose: 'flying',
      facing: 1, t: 0, bob: 0, reach: 1,
    },
    preview: { width: 80, height: 110, defaultPose: 'standing' },

    polish: {
      onRescue: {
        sfxText: 'DAEDALUS!',
        audioLayers: [
          { freq: 220, type: 'triangle', dur: 0.50, vol: 0.30, slide: 720, delay: 0   },
          { freq: 880, type: 'sine',     dur: 0.35, vol: 0.22, slide: 440, delay: 40  },
          { freq:  90, type: 'sawtooth', dur: 0.60, vol: 0.30, slide: 180, delay: 100 },
        ],
      },
    },

    draw(ctx, state, opts = {}) {
      const pose = state.pose || 'flying';
      ctx.save();
      ctx.translate(state.x, state.y + (state.bob || 0));
      const f = state.facing || 1;
      if (pose === 'rescue')        drawRescueHand(ctx, state);
      else if (pose === 'standing') { ctx.scale(0.55 * f, 0.55); drawStanding(ctx, state); }
      else                          { ctx.scale(0.50 * f, 0.50); drawFlying(ctx, state); }
      ctx.restore();
    },
  };

  // ── Pose: flying (escorts Icarus) ─────────────────────────────────────────
  function drawFlying(ctx, state) {
    const t = state.t || 0;
    const flapY = Math.sin(t * 3.2 + 1.4) * 13;

    // Wing (grey/brown manga feathers, behind body)
    drawWing(ctx, flapY);

    // Legs trailing
    ctx.strokeStyle = SKIN; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-2, 8); ctx.quadraticCurveTo(-15, 22, -18, 38); ctx.stroke();
    ctx.beginPath(); ctx.moveTo( 4, 8); ctx.quadraticCurveTo( -7, 18, -10, 38); ctx.stroke();
    M.effects.inkStroke(ctx, 2.2);
    ctx.beginPath(); ctx.moveTo(-2, 8); ctx.quadraticCurveTo(-15, 22, -18, 38); ctx.stroke();
    ctx.beginPath(); ctx.moveTo( 4, 8); ctx.quadraticCurveTo( -7, 18, -10, 38); ctx.stroke();
    // Sandals
    ctx.fillStyle = M.INK;
    ctx.fillRect(-21, 37, 7, 3);
    ctx.fillRect(-13, 37, 7, 3);

    // Robe (dark, flat with bold ink)
    ctx.fillStyle = ROBE;
    ctx.beginPath();
    ctx.moveTo(-12, -14); ctx.lineTo(14, -14);
    ctx.bezierCurveTo(15, -4, 12, 10, 8, 14);
    ctx.bezierCurveTo(-2, 16, -12, 12, -14, 6);
    ctx.closePath(); ctx.fill();
    M.effects.inkStroke(ctx, 3.2);
    ctx.stroke();
    // Robe folds
    M.effects.inkStroke(ctx, 1.1);
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath(); ctx.moveTo(i * 4, -11); ctx.lineTo(i * 3, 10); ctx.stroke();
    }
    // Halftone shadow on lower robe
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-12, -14); ctx.lineTo(14, -14);
    ctx.bezierCurveTo(15, -4, 12, 10, 8, 14);
    ctx.bezierCurveTo(-2, 16, -12, 12, -14, 6);
    ctx.closePath(); ctx.clip();
    M.effects.halftone(ctx, -14, 0, 28, 16, { density: 4, dotSize: 1.4, alpha: 0.40, color: '#0a0a0a' });
    ctx.restore();
    // Belt (rope)
    ctx.strokeStyle = '#8a7050'; ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.moveTo(-12, 2); ctx.lineTo(12, 2); ctx.stroke();
    M.effects.inkStroke(ctx, 1.1);
    ctx.beginPath(); ctx.moveTo(-12, 2); ctx.lineTo(12, 2); ctx.stroke();

    // Forward arm — reaching toward Icarus
    ctx.strokeStyle = SKIN; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(11, -8); ctx.quadraticCurveTo(23, -5, 32, 1); ctx.stroke();
    M.effects.inkStroke(ctx, 1.6);
    ctx.beginPath(); ctx.moveTo(11, -8); ctx.quadraticCurveTo(23, -5, 32, 1); ctx.stroke();
    // Hand
    ctx.fillStyle = SKIN;
    ctx.beginPath(); ctx.arc(32, 1, 3.6, 0, Math.PI * 2); ctx.fill();
    M.effects.inkStroke(ctx, 1.3);
    ctx.stroke();

    // Neck + head
    ctx.fillStyle = SKIN;
    ctx.fillRect(8, -22, 7, 11);
    M.effects.inkStroke(ctx, 1.5);
    ctx.strokeRect(8, -22, 7, 11);
    ctx.fillStyle = SKIN;
    ctx.beginPath(); ctx.arc(15, -30, 11, 0, Math.PI * 2); ctx.fill();
    M.effects.inkStroke(ctx, 2.6);
    ctx.stroke();
    // Halftone on jaw
    ctx.save();
    ctx.beginPath(); ctx.arc(15, -30, 11, 0, Math.PI * 2); ctx.clip();
    M.effects.halftone(ctx, 17, -26, 11, 12, { density: 3, dotSize: 1.2, alpha: 0.50, color: '#0a0a0a' });
    ctx.restore();

    drawHeadDetail(ctx);

    // Bald with white side hair (manga: receding scholar)
    ctx.fillStyle = BEARD;
    ctx.beginPath(); ctx.arc(13, -35, 11, Math.PI * 0.78, Math.PI * 2.0); ctx.fill();
    ctx.beginPath(); ctx.arc(2, -32, 6, Math.PI * 1.3, Math.PI * 2.4); ctx.fill();
    M.effects.inkStroke(ctx, 1.5);
    ctx.beginPath(); ctx.arc(13, -35, 11, Math.PI * 0.78, Math.PI * 2.0); ctx.stroke();
  }

  // ── Pose: standing (tutorial platform / hub) ──────────────────────────────
  function drawStanding(ctx, state) {
    // Robe body — flat trapezoid with bold ink
    ctx.fillStyle = ROBE;
    ctx.beginPath();
    ctx.moveTo(-13, -18); ctx.lineTo(13, -18);
    ctx.lineTo(16, 22);   ctx.lineTo(-16, 22);
    ctx.closePath(); ctx.fill();
    M.effects.inkStroke(ctx, 3.5);
    ctx.stroke();
    // Halftone shadow on lower right of robe
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, -18); ctx.lineTo(13, -18); ctx.lineTo(16, 22); ctx.lineTo(0, 22); ctx.closePath();
    ctx.clip();
    M.effects.halftone(ctx, 0, -18, 16, 40, { density: 4, dotSize: 1.5, alpha: 0.45, color: '#0a0a0a' });
    ctx.restore();
    // Robe folds
    M.effects.inkStroke(ctx, 1.2);
    for (const xi of [-5, 0, 5]) {
      ctx.beginPath(); ctx.moveTo(xi, -14); ctx.lineTo(xi + 2, 18); ctx.stroke();
    }
    // Belt rope
    ctx.strokeStyle = '#8a7050'; ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.moveTo(-14, 6); ctx.lineTo(14, 6); ctx.stroke();
    M.effects.inkStroke(ctx, 1);
    ctx.beginPath(); ctx.moveTo(-14, 6); ctx.lineTo(14, 6); ctx.stroke();

    // Legs
    ctx.strokeStyle = SKIN; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-5, 22); ctx.lineTo(-5, 50); ctx.stroke();
    ctx.beginPath(); ctx.moveTo( 5, 22); ctx.lineTo( 5, 50); ctx.stroke();
    M.effects.inkStroke(ctx, 1.6);
    ctx.beginPath(); ctx.moveTo(-5, 22); ctx.lineTo(-5, 50); ctx.stroke();
    ctx.beginPath(); ctx.moveTo( 5, 22); ctx.lineTo( 5, 50); ctx.stroke();
    // Sandals
    ctx.strokeStyle = M.INK; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-9, 50); ctx.lineTo(-1, 50); ctx.stroke();
    ctx.beginPath(); ctx.moveTo( 1, 50); ctx.lineTo( 9, 50); ctx.stroke();

    // Left arm down at side
    ctx.strokeStyle = SKIN; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(-13, -10); ctx.quadraticCurveTo(-22, -2, -20, 18); ctx.stroke();
    M.effects.inkStroke(ctx, 1.5);
    ctx.beginPath(); ctx.moveTo(-13, -10); ctx.quadraticCurveTo(-22, -2, -20, 18); ctx.stroke();
    ctx.fillStyle = SKIN;
    ctx.beginPath(); ctx.arc(-20, 18, 3.6, 0, Math.PI * 2); ctx.fill();
    M.effects.inkStroke(ctx, 1.2);
    ctx.stroke();

    // Right arm raised (gesturing — pointing at the sky)
    ctx.strokeStyle = SKIN; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(13, -10); ctx.quadraticCurveTo(28, -22, 38, -32); ctx.stroke();
    M.effects.inkStroke(ctx, 1.5);
    ctx.beginPath(); ctx.moveTo(13, -10); ctx.quadraticCurveTo(28, -22, 38, -32); ctx.stroke();
    ctx.fillStyle = SKIN;
    ctx.beginPath(); ctx.arc(38, -32, 3.6, 0, Math.PI * 2); ctx.fill();
    M.effects.inkStroke(ctx, 1.3);
    ctx.stroke();

    // Neck + head (front-facing)
    ctx.fillStyle = SKIN;
    ctx.fillRect(-4, -28, 8, 12);
    M.effects.inkStroke(ctx, 1.5);
    ctx.strokeRect(-4, -28, 8, 12);
    ctx.fillStyle = SKIN;
    ctx.beginPath(); ctx.arc(0, -36, 11, 0, Math.PI * 2); ctx.fill();
    M.effects.inkStroke(ctx, 2.8);
    ctx.stroke();
    // Halftone on the jaw
    ctx.save();
    ctx.beginPath(); ctx.arc(0, -36, 11, 0, Math.PI * 2); ctx.clip();
    M.effects.halftone(ctx, 2, -32, 11, 12, { density: 3, dotSize: 1.2, alpha: 0.45, color: '#0a0a0a' });
    ctx.restore();

    // Beard — long, flat, bold ink outline
    ctx.fillStyle = BEARD;
    ctx.beginPath();
    ctx.moveTo(-9, -30); ctx.quadraticCurveTo(-12, -18, -8, -10);
    ctx.quadraticCurveTo(0, -6, 8, -10);
    ctx.quadraticCurveTo(12, -18, 9, -30);
    ctx.closePath(); ctx.fill();
    M.effects.inkStroke(ctx, 2.2);
    ctx.stroke();
    // Beard texture lines
    ctx.strokeStyle = BEARD_INK; ctx.lineWidth = 0.9;
    for (let i = -6; i <= 6; i += 3) {
      ctx.beginPath(); ctx.moveTo(i, -26); ctx.lineTo(i * 0.8, -12); ctx.stroke();
    }

    // Eyes — manga-style bold + brow
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(-3.6, -37, 2.2, 1.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse( 3.6, -37, 2.2, 1.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = M.INK;
    ctx.beginPath(); ctx.arc(-3.6, -37, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc( 3.6, -37, 1.2, 0, Math.PI * 2); ctx.fill();
    // Bushy brows — bold ink
    M.effects.inkStroke(ctx, 2.4);
    ctx.beginPath(); ctx.moveTo(-6, -41); ctx.lineTo(-1, -39.5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo( 6, -41); ctx.lineTo( 1, -39.5); ctx.stroke();
    // Nose
    M.effects.inkStroke(ctx, 1.2);
    ctx.beginPath(); ctx.moveTo(0, -35); ctx.lineTo(-2, -31); ctx.lineTo(2, -31); ctx.stroke();
    // Mouth
    M.effects.inkStroke(ctx, 1.4);
    ctx.beginPath(); ctx.moveTo(-3, -28.5); ctx.quadraticCurveTo(0, -27, 3, -28.5); ctx.stroke();

    // White hair (receding) — bold flat
    ctx.fillStyle = BEARD;
    ctx.beginPath(); ctx.arc(0, -42, 10, Math.PI, 0); ctx.fill();
    ctx.beginPath(); ctx.arc(-9, -37, 4, Math.PI * 1.2, Math.PI * 2.2); ctx.fill();
    ctx.beginPath(); ctx.arc( 9, -37, 4, Math.PI * 0.8, Math.PI * 1.8, true); ctx.fill();
    M.effects.inkStroke(ctx, 1.6);
    ctx.beginPath(); ctx.arc(0, -42, 10, Math.PI, 0); ctx.stroke();
  }

  // ── Pose: rescue (hand reaching from below) ──────────────────────────────
  // Drawn at state.x, state.y. `reach` (0..1) drives the divine ascent: the
  // whole hand offsets downward and shrinks at reach=0, then climbs and grows
  // to full size at reach=1. Forearm extends off-screen below the rescue
  // point throughout. Gold halo + sparkles signal divine intervention.
  function drawRescueHand(ctx, state) {
    const reach   = (state.reach != null ? state.reach : 1);
    const offsetY = (1 - reach) * 80;        // start 80px below, climb to 0
    const scale   = 0.55 + 0.45 * reach;     // 0.55 → 1.0 size
    ctx.save();
    ctx.translate(0, offsetY);
    ctx.scale(scale, scale);
    ctx.globalAlpha = Math.min(1, reach * 1.5);

    // Aura behind the hand — gold halo
    ctx.save();
    ctx.shadowColor = GOLD; ctx.shadowBlur = 32;
    ctx.fillStyle = 'rgba(212, 175, 55, 0.30)';
    ctx.beginPath(); ctx.arc(0, 0, 38, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Speed lines around the wrist (manga emphasis)
    if (M.effects.speedLines) {
      M.effects.speedLines(ctx, 0, 0, {
        count: 9, innerR: 24, outerR: 56,
        color: 'rgba(10,10,10,0.55)', width: 1.6, jitter: 0.6,
      });
    }

    // Forearm — extends downward, full length once the hand has climbed.
    const armLen = 90;
    ctx.lineCap = 'round';
    ctx.strokeStyle = SKIN; ctx.lineWidth = 18;
    ctx.beginPath(); ctx.moveTo(0, 8); ctx.lineTo(-4, 8 + armLen); ctx.stroke();
    M.effects.inkStroke(ctx, 3);
    ctx.beginPath(); ctx.moveTo(0, 8); ctx.lineTo(-4, 8 + armLen); ctx.stroke();
    // Cuff of robe at base of forearm
    ctx.fillStyle = ROBE;
    ctx.beginPath();
    ctx.moveTo(-16, 8 + armLen);
    ctx.lineTo(16, 8 + armLen);
    ctx.lineTo(20, 8 + armLen + 22);
    ctx.lineTo(-20, 8 + armLen + 22);
    ctx.closePath(); ctx.fill();
    M.effects.inkStroke(ctx, 3);
    ctx.stroke();
    // Gold trim on cuff
    ctx.strokeStyle = GOLD; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(-16, 8 + armLen); ctx.lineTo(16, 8 + armLen); ctx.stroke();

    // Wrist + palm
    ctx.fillStyle = SKIN;
    ctx.beginPath(); ctx.ellipse(0, 0, 16, 12, 0, 0, Math.PI * 2); ctx.fill();
    M.effects.inkStroke(ctx, 3);
    ctx.stroke();
    // Halftone on palm shadow
    ctx.save();
    ctx.beginPath(); ctx.ellipse(0, 0, 16, 12, 0, 0, Math.PI * 2); ctx.clip();
    M.effects.halftone(ctx, -16, 2, 32, 12, { density: 4, dotSize: 1.3, alpha: 0.40, color: '#0a0a0a' });
    ctx.restore();

    // Fingers — four reaching upward, thumb at the side. Bold flat ink shapes.
    const fingerY = -10;
    const fingers = [
      { x: -12, y: fingerY, len: 18 },
      { x:  -4, y: fingerY - 2, len: 22 },
      { x:   5, y: fingerY - 1, len: 20 },
      { x:  13, y: fingerY,     len: 16 },
    ];
    for (const fn of fingers) {
      ctx.fillStyle = SKIN;
      ctx.beginPath();
      ctx.roundRect(fn.x - 3, fn.y - fn.len, 6, fn.len + 4, 3);
      ctx.fill();
      M.effects.inkStroke(ctx, 2.2);
      ctx.stroke();
      // Knuckle line
      M.effects.inkStroke(ctx, 1.1);
      ctx.beginPath(); ctx.moveTo(fn.x - 3, fn.y - fn.len * 0.55); ctx.lineTo(fn.x + 3, fn.y - fn.len * 0.55); ctx.stroke();
    }
    // Thumb (across the wrist)
    ctx.fillStyle = SKIN;
    ctx.beginPath();
    ctx.moveTo(-16, -2);
    ctx.quadraticCurveTo(-26, 2, -22, 10);
    ctx.quadraticCurveTo(-14, 8, -12, 0);
    ctx.closePath(); ctx.fill();
    M.effects.inkStroke(ctx, 2.4);
    ctx.stroke();

    // Sparkles around the hand
    const tw = state.t || 0;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + tw * 1.2;
      const r = 36 + Math.sin(tw * 4 + i) * 4;
      const sx = Math.cos(a) * r, sy = Math.sin(a) * r - 14;
      ctx.fillStyle = GOLD;
      ctx.shadowColor = GOLD; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(sx, sy, 2.4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  function drawWing(ctx, flapY) {
    const rx = -5, ry = -10;
    const tipX = -7 + flapY * 0.4;
    const tipY = -46 + flapY * 0.85;
    // Membrane — flat off-white with bold ink + halftone
    ctx.fillStyle = '#cfc8b6';
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.bezierCurveTo(rx + 11, ry - 14, tipX + 18, tipY + 14, tipX, tipY);
    ctx.bezierCurveTo(tipX - 10, tipY + 18, rx - 11, ry + 5, rx, ry);
    ctx.fill();
    M.effects.inkStroke(ctx, 2.6);
    ctx.stroke();
    // Halftone shadow on inner wing
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.bezierCurveTo(rx + 11, ry - 14, tipX + 18, tipY + 14, tipX, tipY);
    ctx.bezierCurveTo(tipX - 10, tipY + 18, rx - 11, ry + 5, rx, ry);
    ctx.closePath(); ctx.clip();
    M.effects.halftone(ctx, rx - 8, ry - 8, 28, 44, { density: 4, dotSize: 1.4, alpha: 0.40, color: '#0a0a0a' });
    ctx.restore();
    // Feathers (grey alternating)
    const cols = ['#d0ccc0', '#9a948a'];
    for (let i = 0; i < 6; i++) {
      const t = i / 5;
      const bx = rx + (tipX - rx) * t, by = ry + (tipY - ry) * t;
      const len = 18 - t * 4;
      const ang = -0.2 - t * 0.62 - flapY * 0.007;
      ctx.save(); ctx.translate(bx, by); ctx.rotate(ang);
      ctx.fillStyle = cols[i % 2];
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-len * 0.44, len * 0.2, -len * 0.38, len * 0.74, 0, len);
      ctx.bezierCurveTo(len * 0.06, len * 0.68, len * 0.08, len * 0.22, 0, 0);
      ctx.fill();
      M.effects.inkStroke(ctx, 1.2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawHeadDetail(ctx) {
    // Worried eye + brow facing right
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(20, -32, 2, 1.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = M.INK;
    ctx.beginPath(); ctx.arc(20, -32, 1.1, 0, Math.PI * 2); ctx.fill();
    // Bushy worried brow
    M.effects.inkStroke(ctx, 2.4);
    ctx.beginPath(); ctx.moveTo(17.5, -35.5); ctx.quadraticCurveTo(20, -36.5, 23, -35); ctx.stroke();
    // Nose
    M.effects.inkStroke(ctx, 1.2);
    ctx.beginPath(); ctx.moveTo(26, -31); ctx.lineTo(28, -28); ctx.stroke();

    // Beard — long flat shape with bold ink
    ctx.fillStyle = BEARD;
    ctx.beginPath();
    ctx.moveTo(9, -23); ctx.quadraticCurveTo(8, -14, 13, -10);
    ctx.quadraticCurveTo(20, -8, 24, -14); ctx.quadraticCurveTo(26, -21, 22, -24);
    ctx.closePath(); ctx.fill();
    M.effects.inkStroke(ctx, 2);
    ctx.stroke();
    // Beard texture
    ctx.strokeStyle = BEARD_INK; ctx.lineWidth = 0.9;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(11 + i * 2, -20);
      ctx.lineTo(13 + i * 2, -12);
      ctx.stroke();
    }
  }
})();
