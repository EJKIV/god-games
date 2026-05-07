// manga/characters/scorpion.js — Giant scorpion boss, manga style.
//
// state: { x, y, facing, hp, hurtFlash, tailCurl, clawOpen, stingT,
//          phase (1|2|3), state ('idle'|'walk'|'claw'|'sting'|'charge'|'backup'|'hurt'|'dead'),
//          stateTimer, t (animation phase 0..1), frenzied (bool, low-HP visual buff) }

(function () {
  const M = (window.Manga = window.Manga || {});
  M.effects = M.effects || {}; M.characters = M.characters || {};
  M.fx = M.fx || {}; M.scenes = M.scenes || {}; M.INK = M.INK || '#0a0a0a';

  M.characters.scorpion = {
    name: 'Giant Scorpion',
    defaultState: {
      x: 0, y: 0, facing: -1,
      hp: 200, hurtFlash: 0,
      tailCurl: 0.38, clawOpen: 0, stingT: 0,
      phase: 1, state: 'idle',
      t: 0,
      frenzied: false,
    },
    preview: { width: 220, height: 110, defaultPose: 'idle' },

    polish: {
      onSting: { sfxText: 'STING!' },
      onClaw:  { sfxText: 'CLAW!' },
      onCharge:{ sfxText: 'CHARGE!' },
      onFrenzy:{ sfxText: 'FRENZY!' },
      onVenomRain: { sfxText: 'VENOM RAIN!' },
      onPhantomClaw:{ sfxText: 'PHANTOM CLAW!' },
    },

    draw(ctx, state) {
      const f = state.facing;
      const t = state.t || 0;
      const flash = state.hurtFlash > 0 && Math.sin(t * 32) > 0;
      const frenzied = !!state.frenzied;

      ctx.save();
      ctx.translate(state.x, state.y);
      ctx.scale(f, 1);
      if (flash) ctx.globalAlpha = 0.55;

      // Frenzy aura — pulsing red halo when boss is below 33% HP
      if (frenzied) {
        ctx.save();
        ctx.shadowColor = '#ff2200'; ctx.shadowBlur = 32;
        const p = 0.5 + Math.sin(t * 6) * 0.5;
        ctx.fillStyle = `rgba(220, 30, 0, ${0.10 + p * 0.10})`;
        ctx.beginPath(); ctx.ellipse(0, -22, 95, 50, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      // Hard ink shadow under body
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.beginPath(); ctx.ellipse(0, 4, 95, 12, 0, 0, Math.PI * 2); ctx.fill();

      // ── Tail (drawn first, behind body) ─────────────────────────────
      drawTail(ctx, state);

      // ── Legs (4 per side) ──────────────────────────────────────────
      const moving = state.state === 'walk' || state.state === 'charge';
      for (const side of [-1, 1]) {
        for (let i = 0; i < 4; i++) {
          const lx = -38 + i * 22, lBase = -22 + i * 3;
          const phase = t * 4.5 + i * 0.9 + (side < 0 ? 1.6 : 0);
          const sway = Math.sin(phase) * (moving ? 1 : 0.2) * 8;
          const kneeX = lx + side * (38 + sway), kneeY = lBase - 26;
          const footX = lx + side * (52 + sway * 0.5), footY = -2;
          // Leg segments (flat with bold outline)
          ctx.strokeStyle = i % 2 === 0 ? '#9a4818' : '#a85c20';
          ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(lx, lBase); ctx.lineTo(kneeX, kneeY); ctx.lineTo(footX, footY);
          ctx.stroke();
          M.effects.inkStroke(ctx, 2.2);
          ctx.beginPath();
          ctx.moveTo(lx, lBase); ctx.lineTo(kneeX, kneeY); ctx.lineTo(footX, footY);
          ctx.stroke();
          // Claw tip
          ctx.strokeStyle = M.INK; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.moveTo(footX, footY); ctx.lineTo(footX + side * 7, footY + 5); ctx.stroke();
        }
      }

      // ── Body (flat dark orange, NOT a gradient) ─────────────────────
      ctx.fillStyle = frenzied ? '#c62a18' : '#a64818';
      ctx.beginPath(); ctx.ellipse(0, -26, 60, 38, 0, 0, Math.PI * 2); ctx.fill();
      M.effects.inkStroke(ctx, 5);
      ctx.stroke();
      // Segment lines (manga ink — bold)
      M.effects.inkStroke(ctx, 2);
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath(); ctx.ellipse(i * 11, -26, 5, 36, 0, 0, Math.PI * 2); ctx.stroke();
      }
      // Halftone on top half of body
      ctx.save();
      ctx.beginPath(); ctx.ellipse(0, -26, 60, 38, 0, 0, Math.PI * 2); ctx.clip();
      M.effects.halftone(ctx, -60, -68, 120, 28, { density: 5, dotSize: 1.9, alpha: 0.45, color: '#0a0a0a' });
      ctx.restore();
      // Spine ridge highlight
      ctx.strokeStyle = 'rgba(255,180,60,0.5)'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(-50, -32); ctx.lineTo(50, -32); ctx.stroke();

      // ── Head ─────────────────────────────────────────────────────────
      ctx.fillStyle = frenzied ? '#d8401a' : '#b85020';
      ctx.beginPath(); ctx.ellipse(66, -20, 28, 20, 0.12, 0, Math.PI * 2); ctx.fill();
      M.effects.inkStroke(ctx, 4);
      ctx.stroke();
      // Halftone on head shadow side
      ctx.save();
      ctx.beginPath(); ctx.ellipse(66, -20, 28, 20, 0.12, 0, Math.PI * 2); ctx.clip();
      M.effects.halftone(ctx, 64, -36, 28, 14, { density: 4, dotSize: 1.5, alpha: 0.45, color: '#0a0a0a' });
      ctx.restore();
      // Chelicerae (mouth pincers)
      ctx.strokeStyle = M.INK; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(88, -18); ctx.lineTo(100, -25); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(88, -22); ctx.lineTo(100, -13); ctx.stroke();
      // Eyes — bold black ovals with yellow glow
      ctx.fillStyle = M.INK;
      ctx.beginPath(); ctx.arc(78, -14, 5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(70, -11, 3.5, 0, Math.PI * 2); ctx.fill();
      // Yellow iris flecks
      ctx.fillStyle = frenzied ? '#ff2200' : '#ffd54a';
      ctx.beginPath(); ctx.arc(79, -15, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(71, -12, 1.4, 0, Math.PI * 2); ctx.fill();
      // Brow lines
      M.effects.inkStroke(ctx, 2);
      ctx.beginPath(); ctx.moveTo(64, -28); ctx.lineTo(74, -22); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(56, -22); ctx.lineTo(66, -16); ctx.stroke();

      // ── Pedipalp (claw) ──────────────────────────────────────────────
      drawClaw(ctx, state.clawOpen);

      ctx.restore();
    },
  };

  function drawTail(ctx, state) {
    const segs = 5;
    const curl = state.tailCurl;
    const pts = [{ x: -42, y: -18 }];
    for (let i = 0; i < segs; i++) {
      const t = (i + 1) / segs;
      const angle = -0.25 + curl * (Math.PI * 1.05) * t - 0.08;
      const len = 30 * (1 - t * 0.08);
      const prev = pts[pts.length - 1];
      pts.push({ x: prev.x - Math.cos(angle) * len, y: prev.y - Math.sin(angle) * len });
    }
    // Each segment: thick fill with bold ink outline
    for (let i = 0; i < segs; i++) {
      const p1 = pts[i], p2 = pts[i + 1];
      const w = 22 - i * 2.8;
      // Fill (flat, alternating shade for segmentation)
      ctx.strokeStyle = i % 2 === 0 ? '#a64818' : '#8a3a14';
      ctx.lineWidth = Math.max(6, w);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
      // Bold ink overlay
      ctx.strokeStyle = M.INK;
      ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
    }
    // Stinger
    const tip = pts[segs], pre = pts[segs - 1];
    const ang = Math.atan2(tip.y - pre.y, tip.x - pre.x);
    ctx.save(); ctx.translate(tip.x, tip.y); ctx.rotate(ang - Math.PI / 2);
    // Stinger body
    ctx.fillStyle = '#d8a020';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(8, -7, 10, -20, 2, -34);
    ctx.bezierCurveTo(-2, -20, -2, -7, 0, 0);
    ctx.fill();
    M.effects.inkStroke(ctx, 2.5);
    ctx.stroke();
    // Venom glow when charged
    const vg = state.stingT;
    if (vg > 0.4) {
      ctx.shadowColor = '#00ff44'; ctx.shadowBlur = 16 * vg;
      ctx.fillStyle = `rgba(40, 220, 30, ${vg * 0.95})`;
      ctx.beginPath(); ctx.arc(2, -32, 6, 0, Math.PI * 2); ctx.fill();
      M.effects.inkStroke(ctx, 1.5);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }

  function drawClaw(ctx, open) {
    ctx.save();
    ctx.translate(86, -20);
    // Arm
    ctx.strokeStyle = '#9a4018'; ctx.lineWidth = 14; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(36, 2); ctx.stroke();
    M.effects.inkStroke(ctx, 2.5);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(36, 2); ctx.stroke();
    // Palm
    ctx.fillStyle = '#a85220';
    ctx.beginPath(); ctx.ellipse(44, 2, 18, 11, 0.1, 0, Math.PI * 2); ctx.fill();
    M.effects.inkStroke(ctx, 3);
    ctx.stroke();
    // Upper finger (opens with claw state)
    const uf = open * 22;
    ctx.strokeStyle = '#c46228'; ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(52, -4);
    ctx.quadraticCurveTo(66, -10 - uf, 72, -3 + uf * 0.3);
    ctx.stroke();
    M.effects.inkStroke(ctx, 2.2);
    ctx.beginPath();
    ctx.moveTo(52, -4);
    ctx.quadraticCurveTo(66, -10 - uf, 72, -3 + uf * 0.3);
    ctx.stroke();
    // Lower finger
    ctx.strokeStyle = '#c46228'; ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(52, 8);
    ctx.quadraticCurveTo(66, 14 + uf * 0.5, 70, 8);
    ctx.stroke();
    M.effects.inkStroke(ctx, 2.2);
    ctx.beginPath();
    ctx.moveTo(52, 8);
    ctx.quadraticCurveTo(66, 14 + uf * 0.5, 70, 8);
    ctx.stroke();
    // Claw tips (sharp black)
    ctx.strokeStyle = M.INK; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(72, -3 + uf * 0.3); ctx.lineTo(78, -5 + uf * 0.2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(70, 8); ctx.lineTo(74, 11); ctx.stroke();
    ctx.restore();
  }
})();
