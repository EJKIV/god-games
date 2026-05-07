// manga/characters/icarus.js — Icarus mid-flight, manga style.
//
// state shape:
//   x, y            screen position
//   facingRight     0 | 1 (flips wings)
//   vx, vy          velocity (for tunic streaming + dying spin)
//   flapPhase       radians, drives wing animation
//   wingHealth      0..50
//   burnDmg, wetDmg 0..100 (drives dominant tint)
//   thrusting       bool — flapping right now (bigger wing sweep)
//   dying           bool — death spin
//   angle           rotation (used in dying state)
//   diving          bool — manga-only dive-bomb ability active

(function () {
  const M = (window.Manga = window.Manga || {});
  M.effects = M.effects || {}; M.characters = M.characters || {};
  M.fx = M.fx || {}; M.scenes = M.scenes || {}; M.INK = M.INK || '#0a0a0a';

  M.characters.icarus = {
    name: 'Icarus',
    defaultState: {
      x: 0, y: 0,
      facingRight: 1,
      vx: 0, vy: 0,
      flapPhase: 0,
      wingHealth: 50,
      burnDmg: 0, wetDmg: 0,
      thrusting: false,
      dying: false, angle: 0,
      diving: false,
    },
    preview: { width: 90, height: 80, defaultPose: 'flying' },

    polish: {
      onHit: {
        flashColor: 'rgba(255,40,0,0.45)',
        sfxText: 'BURN!',
      },
      onDeath: {
        slomoFactor: 0.20, slomoDuration: 0.7,
        panelSplit: true,
        sfxText: 'FALLEN!',
        deadScreenDelay: 2.2,
        deadScreenFadeIn: 0.5,
        audioLayers: [
          { freq: 100, type: 'sawtooth', dur: 0.6, vol: 0.4, slide: 50,  delay: 0   },
          { freq: 280, type: 'triangle', dur: 0.3, vol: 0.2, slide: 160, delay: 60  },
          { freq:  55, type: 'sine',     dur: 1.0, vol: 0.3,             delay: 130 },
        ],
      },
      onDive: {
        sfxText: 'ICARIAN DIVE!',
        audioLayers: [
          { freq: 700, type: 'sawtooth', dur: 0.30, vol: 0.30, slide: 220, delay: 0 },
          { freq: 220, type: 'sine',     dur: 0.40, vol: 0.30, slide:  70, delay: 30 },
        ],
      },
    },

    draw(ctx, state) {
      const wh = state.wingHealth / 50;
      const burnFrac = state.burnDmg / 100;
      const wetFrac  = state.wetDmg  / 100;
      const thrusting = !!state.thrusting;
      const flapY = Math.sin(state.flapPhase) * (thrusting ? 26 : 12);

      ctx.save();
      ctx.translate(state.x, state.y);
      if (state.dying) ctx.rotate(state.angle);
      ctx.scale(state.facingRight ? 0.7 : -0.7, 0.7);

      // Diving aura — manga ability glow streaks downward
      if (state.diving) {
        ctx.save();
        ctx.shadowColor = '#ff8800'; ctx.shadowBlur = 28;
        ctx.fillStyle = 'rgba(255,180,80,0.3)';
        ctx.beginPath(); ctx.ellipse(-10, 14, 26, 60, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      // ── Wing (manga: bold flat feathers + ink + halftone shadow) ──
      drawWing(ctx, flapY, wh, burnFrac, wetFrac);

      const skin  = '#e8b870';
      const tunic = '#f0e8d0';
      const tunicShade = '#a89878';
      const streamX = Math.max(0, -state.vy * 0.008);

      // Legs trailing back
      ctx.strokeStyle = skin; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-2, 8);  ctx.quadraticCurveTo(-18 + streamX, 22, -22 + streamX, 42); ctx.stroke();
      ctx.beginPath(); ctx.moveTo( 4, 8);  ctx.quadraticCurveTo(-10 + streamX, 18, -14 + streamX, 42); ctx.stroke();
      M.effects.inkStroke(ctx, 2.2);
      ctx.beginPath(); ctx.moveTo(-2, 8);  ctx.quadraticCurveTo(-18 + streamX, 22, -22 + streamX, 42); ctx.stroke();
      ctx.beginPath(); ctx.moveTo( 4, 8);  ctx.quadraticCurveTo(-10 + streamX, 18, -14 + streamX, 42); ctx.stroke();
      // Sandals
      ctx.fillStyle = M.INK;
      ctx.fillRect(-25 + streamX, 41, 7, 3);
      ctx.fillRect(-17 + streamX, 41, 7, 3);

      // Tunic — flat off-white with thick ink + halftone trailing edge
      ctx.fillStyle = tunic;
      ctx.beginPath();
      ctx.moveTo(-12, -14); ctx.lineTo(14, -14);
      ctx.bezierCurveTo(16, -4, 14, 8, 10, 12);
      ctx.bezierCurveTo(0, 14 + streamX * 0.5, -12 + streamX * 0.8, 12, -14 + streamX, 6);
      ctx.closePath(); ctx.fill();
      M.effects.inkStroke(ctx, 3.5);
      ctx.stroke();
      // Halftone on the trailing edge of the tunic
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(-12, -14); ctx.lineTo(14, -14);
      ctx.bezierCurveTo(16, -4, 14, 8, 10, 12);
      ctx.bezierCurveTo(0, 14 + streamX * 0.5, -12 + streamX * 0.8, 12, -14 + streamX, 6);
      ctx.closePath(); ctx.clip();
      M.effects.halftone(ctx, -16, 2, 12, 14, { density: 4, dotSize: 1.5, alpha: 0.5, color: '#0a0a0a' });
      ctx.restore();
      // Fold lines
      M.effects.inkStroke(ctx, 1);
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 4, -11);
        ctx.quadraticCurveTo(i * 5 + streamX * 0.3, 0, i * 3 + streamX * 0.5, 10);
        ctx.stroke();
      }
      // Belt — gold band with ink line
      ctx.strokeStyle = '#D4AF37'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-11, 0); ctx.lineTo(13, 0); ctx.stroke();
      M.effects.inkStroke(ctx, 1.2);
      ctx.beginPath(); ctx.moveTo(-11, 0); ctx.lineTo(13, 0); ctx.stroke();
      // Belt buckle
      ctx.fillStyle = '#D4AF37';
      ctx.beginPath(); ctx.arc(2, 0, 3, 0, Math.PI * 2); ctx.fill();
      M.effects.inkStroke(ctx, 1.5);
      ctx.stroke();

      // Forward arm (reaching out)
      ctx.strokeStyle = skin; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(12, -8); ctx.quadraticCurveTo(26, -5, 38, 0); ctx.stroke();
      M.effects.inkStroke(ctx, 1.8);
      ctx.beginPath(); ctx.moveTo(12, -8); ctx.quadraticCurveTo(26, -5, 38, 0); ctx.stroke();
      // Hand
      ctx.fillStyle = skin;
      ctx.beginPath(); ctx.arc(38, 0, 4, 0, Math.PI * 2); ctx.fill();
      M.effects.inkStroke(ctx, 1.5);
      ctx.stroke();

      // Trailing arm (faded)
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = skin; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(6, -6); ctx.quadraticCurveTo(18, -3, 28, 2); ctx.stroke();
      M.effects.inkStroke(ctx, 1.4);
      ctx.beginPath(); ctx.moveTo(6, -6); ctx.quadraticCurveTo(18, -3, 28, 2); ctx.stroke();
      ctx.globalAlpha = 1;

      // Neck + head
      ctx.fillStyle = skin;
      ctx.fillRect(9, -24, 8, 12);
      M.effects.inkStroke(ctx, 1.8);
      ctx.strokeRect(9, -24, 8, 12);
      // Head — manga proportions
      ctx.fillStyle = skin;
      ctx.beginPath(); ctx.arc(16, -32, 12, 0, Math.PI * 2); ctx.fill();
      M.effects.inkStroke(ctx, 3);
      ctx.stroke();
      // Halftone shadow on jaw
      ctx.save();
      ctx.beginPath(); ctx.arc(16, -32, 12, 0, Math.PI * 2); ctx.clip();
      M.effects.halftone(ctx, 18, -28, 12, 14, { density: 3, dotSize: 1.3, alpha: 0.55, color: '#0a0a0a' });
      ctx.restore();
      // Eye — manga-style: large white + black pupil + brow
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.ellipse(21, -33, 2.6, 1.8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = M.INK;
      ctx.beginPath(); ctx.arc(21.5, -33, 1.4, 0, Math.PI * 2); ctx.fill();
      // Brow — bold ink
      M.effects.inkStroke(ctx, 2);
      ctx.beginPath(); ctx.moveTo(18, -36.5); ctx.lineTo(25, -36); ctx.stroke();
      // Nose tip
      M.effects.inkStroke(ctx, 1.4);
      ctx.beginPath(); ctx.moveTo(26, -31); ctx.lineTo(28, -28); ctx.stroke();
      // Mouth — small determined line
      M.effects.inkStroke(ctx, 1.4);
      ctx.beginPath(); ctx.moveTo(25, -26); ctx.lineTo(21, -25.5); ctx.stroke();

      // Hair — bold flat black silhouette streaming back
      ctx.fillStyle = M.INK;
      ctx.beginPath();
      ctx.arc(14, -37, 12, Math.PI * 0.78, Math.PI * 2.05);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(2, -34); ctx.lineTo(-12, -32); ctx.lineTo(-8, -28); ctx.lineTo(0, -30);
      ctx.closePath(); ctx.fill();
      // Hair streak highlight
      ctx.strokeStyle = '#3a2818'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(8, -42); ctx.lineTo(-2, -36); ctx.stroke();

      ctx.restore();
    },
  };

  // Side wing — manga rendition with flat feathers + bold ink + halftone
  function drawWing(ctx, flapY, wh, burnFrac, wetFrac) {
    const dominant = burnFrac >= wetFrac ? 'burn' : 'wet';
    const domFrac  = dominant === 'burn' ? burnFrac : wetFrac;
    const fBase = dominant === 'burn'
      ? (domFrac < 0.35 ? '#f0e8d0' : domFrac < 0.65 ? '#dd7700' : '#3a1408')
      : (domFrac < 0.35 ? '#f0e8d0' : domFrac < 0.65 ? '#4488cc' : '#0a1838');
    const fDark = dominant === 'burn'
      ? (domFrac < 0.35 ? '#a89878' : domFrac < 0.65 ? '#6a3008' : '#0a0a0a')
      : (domFrac < 0.35 ? '#a89878' : domFrac < 0.65 ? '#1a4078' : '#04081a');

    // Wing root (upper back)
    const rx = -5, ry = -12;
    const tipX = -8 + flapY * 0.45;
    const tipY = -56 + flapY * 0.88;
    const maxFeathers = 8;
    const nFeathers = Math.max(2, Math.round(wh * maxFeathers));

    // Wing membrane — flat fill, then bold ink outline
    ctx.fillStyle = fBase;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.bezierCurveTo(rx + 14, ry - 18, tipX + 22, tipY + 16, tipX, tipY);
    ctx.bezierCurveTo(tipX - 12, tipY + 20, rx - 14, ry + 6, rx, ry);
    ctx.fill();
    M.effects.inkStroke(ctx, 3);
    ctx.stroke();

    // Halftone shadow on inner side of wing
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.bezierCurveTo(rx + 14, ry - 18, tipX + 22, tipY + 16, tipX, tipY);
    ctx.bezierCurveTo(tipX - 12, tipY + 20, rx - 14, ry + 6, rx, ry);
    ctx.closePath(); ctx.clip();
    M.effects.halftone(ctx, rx - 10, ry - 10, 30, 50, {
      density: 4, dotSize: 1.5, alpha: 0.4, color: '#0a0a0a',
    });
    ctx.restore();

    // Individual feathers — bold flat shapes
    for (let i = 0; i < nFeathers; i++) {
      const t = i / Math.max(1, nFeathers - 1);
      const bx = rx + (tipX - rx) * t;
      const by = ry + (tipY - ry) * t;
      const len = 22 - t * 6;
      const spreadAngle = -0.25 - t * 0.72 - flapY * 0.007;
      const col = i % 2 === 0 ? fBase : fDark;
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(spreadAngle);
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-len * 0.5, len * 0.2, -len * 0.44, len * 0.76, 0, len);
      ctx.bezierCurveTo(len * 0.06, len * 0.68, len * 0.08, len * 0.22, 0, 0);
      ctx.fill();
      M.effects.inkStroke(ctx, 1.4);
      ctx.stroke();
      ctx.restore();
    }

    // Wing arm/bone — strong ink stroke
    M.effects.inkStroke(ctx, 2);
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.quadraticCurveTo((rx + tipX) / 2 + 10, (ry + tipY) / 2 - 4, tipX, tipY);
    ctx.stroke();
  }
})();
