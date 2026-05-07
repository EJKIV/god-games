// manga/characters/achilles.js — Achilles in manga style (overhead view).
//
// Pure draw: takes (ctx, state, opts) and renders. No engine.js dependency.
//
// state shape (caller supplies):
//   x, y          screen position
//   facing        -1 | 1
//   walkPhase     radians; sin(walkPhase) drives walk cycle
//   vx            horizontal velocity (used to detect "moving")
//   hp            current HP (display only)
//   hitFlash      0..0.35  — controls red-pulse halo
//   iframes       0..0.85  — transparency flicker after a hit
//   bashing       boolean  — shield bash active (renders raised glowing shield)
//   drawingBow    boolean  — divine bow active (renders raised bow)
//
// `polish` declares per-event feel (colors, intensity, audio). The game reads
// these when Engine.manga is true and applies via Manga.fx.* / Manga.effects.*.

(function () {
  const M = (window.Manga = window.Manga || {});
  M.effects = M.effects || {}; M.characters = M.characters || {};
  M.fx = M.fx || {}; M.scenes = M.scenes || {}; M.INK = M.INK || '#0a0a0a';

  M.characters.achilles = {
    name: 'Achilles',
    defaultState: {
      x: 0, y: 0,
      facing: 1,
      walkPhase: 0,
      vx: 0,
      hp: 5,
      hitFlash: 0,
      iframes: 0,
      bashing: false,
      drawingBow: false,
    },
    preview: { width: 90, height: 120, defaultPose: 'idle' },

    polish: {
      onHit: {
        flashColor:    'rgba(255,40,0,0.45)',
        punchIntensity: 9,
        punchDuration:  0.22,
        sfxText:       'BAM!',
        slomoFactor:    0.55,
        slomoDuration:  0.12,
      },
      onDeath: {
        slomoFactor:    0.20,
        slomoDuration:  0.7,
        panelSplit:     true,
        sfxText:       'FALLEN!',
        deadScreenDelay:   2.2,
        deadScreenFadeIn:  0.5,
        audioLayers: [
          { freq: 110, type: 'sawtooth', dur: 0.55, vol: 0.4, slide: 55,  delay: 0   },
          { freq: 320, type: 'triangle', dur: 0.30, vol: 0.2, slide: 180, delay: 50  },
          { freq:  60, type: 'sine',     dur: 0.90, vol: 0.3,             delay: 120 },
        ],
      },
      atmosphere: {
        vignetteStrength: 0.55,
        scanlineAlpha:    0.10,
        halftoneAlpha:    0.12,
      },
      // Manga-only player abilities — game reads these, applies cooldown + audio
      onBash: {
        sfxText:       'GUARD!',
        flashColor:    'rgba(255,235,140,0.45)',
        audioLayers: [
          { freq: 700, type: 'square',   dur: 0.06, vol: 0.30,             delay: 0  },
          { freq: 220, type: 'sine',     dur: 0.30, vol: 0.40, slide: 110, delay: 10 },
          { freq:1400, type: 'triangle', dur: 0.18, vol: 0.20, slide: 700, delay: 60 },
        ],
      },
      onBow: {
        sfxText:       'SHOT!',
        audioLayers: [
          { freq: 380, type: 'sawtooth', dur: 0.10, vol: 0.30, slide:  90, delay: 0  },
          { freq:1200, type: 'triangle', dur: 0.12, vol: 0.18, slide: 700, delay: 30 },
        ],
      },
    },

    draw(ctx, state, opts = {}) {
      const walk = state.vx !== 0 ? Math.sin(state.walkPhase) : 0;
      const flicker = state.iframes > 0 && Math.floor(state.iframes * 14) % 2 === 0;
      const bashing = !!state.bashing;
      const drawingBow = !!state.drawingBow;

      ctx.save();
      ctx.translate(state.x, state.y);
      if (flicker) ctx.globalAlpha = 0.30;

      // ── Hard ink shadow ────────────────────────────────────────────
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.beginPath(); ctx.ellipse(0, 12, 34, 11, 0, 0, Math.PI * 2); ctx.fill();

      // ── Sandals ─────────────────────────────────────────────────────
      const footL = walk * 9;
      ctx.fillStyle = '#3a2008';
      ctx.beginPath(); ctx.ellipse(-9 - footL, 14, 6.5, 4.5, walk * 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse( 9 + footL, 10, 6.5, 4.5, -walk * 0.3, 0, Math.PI * 2); ctx.fill();
      M.effects.inkStroke(ctx, 2);
      ctx.beginPath(); ctx.ellipse(-9 - footL, 14, 6.5, 4.5, walk * 0.3, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse( 9 + footL, 10, 6.5, 4.5, -walk * 0.3, 0, Math.PI * 2); ctx.stroke();

      // ── Phlikta (leather strip skirt) ──────────────────────────────
      ctx.fillStyle = '#8b6028';
      for (let i = -2; i <= 2; i++) {
        const sx = i * 5.5;
        ctx.beginPath();
        ctx.moveTo(sx - 2.5, 4);
        ctx.lineTo(sx + 2.5, 4);
        ctx.lineTo(sx + 3,   16);
        ctx.lineTo(sx - 3,   16);
        ctx.closePath();
        ctx.fill();
      }
      M.effects.inkStroke(ctx, 1.8);
      for (let i = -2; i <= 2; i++) {
        const sx = i * 5.5;
        ctx.beginPath();
        ctx.moveTo(sx - 2.5, 4);
        ctx.lineTo(sx + 2.5, 4);
        ctx.lineTo(sx + 3,   16);
        ctx.lineTo(sx - 3,   16);
        ctx.closePath();
        ctx.stroke();
      }

      // ── Body / breastplate — flat bronze with bold ink + segment detail ─
      ctx.fillStyle = '#d8a840';
      ctx.beginPath(); ctx.ellipse(0, -4, 22, 26, 0, 0, Math.PI * 2); ctx.fill();
      M.effects.inkStroke(ctx, 4);
      ctx.stroke();

      // Sternum + segment lines
      M.effects.inkStroke(ctx, 1.8);
      ctx.beginPath(); ctx.moveTo(0, -28); ctx.lineTo(0, 18); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-9, -14); ctx.quadraticCurveTo(0, -11,  9, -14); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-11, -2); ctx.quadraticCurveTo(0,  1, 11, -2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-10, 9); ctx.quadraticCurveTo(0, 12, 10, 9); ctx.stroke();

      // Halftone shading on right half of torso
      ctx.save();
      ctx.beginPath(); ctx.ellipse(0, -4, 22, 26, 0, 0, Math.PI * 2); ctx.clip();
      M.effects.halftone(ctx, 0, -32, 24, 60, { density: 4, dotSize: 1.6, alpha: 0.5, color: '#0a0a0a' });
      ctx.restore();

      // Belt above the phlikta
      ctx.fillStyle = M.INK;
      ctx.fillRect(-19, 1, 38, 4);

      // ── Shield (gets bigger/glowing when bashing) ───────────────────
      const shScale = bashing ? 1.55 : 1.0;
      const shX = -state.facing * 6 + walk * 3;
      const shY = -32;
      const shR = 26 * shScale;
      // Outer rim
      ctx.fillStyle = '#a87018';
      ctx.beginPath(); ctx.arc(shX, shY, shR, 0, Math.PI * 2); ctx.fill();
      M.effects.inkStroke(ctx, 4);
      ctx.stroke();
      // Inner gold field
      ctx.fillStyle = '#e8b840';
      ctx.beginPath(); ctx.arc(shX, shY, shR * 0.85, 0, Math.PI * 2); ctx.fill();
      M.effects.inkStroke(ctx, 2);
      ctx.stroke();
      // Concentric rings (manga detail)
      M.effects.inkStroke(ctx, 1.5);
      ctx.beginPath(); ctx.arc(shX, shY, shR * 0.62, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(shX, shY, shR * 0.40, 0, Math.PI * 2); ctx.stroke();
      // Boss (center stud)
      ctx.fillStyle = '#fff2a0';
      ctx.beginPath(); ctx.arc(shX, shY, shR * 0.18, 0, Math.PI * 2); ctx.fill();
      M.effects.inkStroke(ctx, 2.5);
      ctx.stroke();
      // Halftone on shield's far side
      ctx.save();
      ctx.beginPath(); ctx.arc(shX, shY, shR, 0, Math.PI * 2); ctx.clip();
      M.effects.halftone(ctx, shX + 2, shY - shR, shR + 2, shR * 2, {
        density: 5, dotSize: 1.8, alpha: 0.45, color: '#0a0a0a',
      });
      ctx.restore();
      // Bash glow ring
      if (bashing) {
        ctx.save();
        ctx.shadowColor = '#fff5c0'; ctx.shadowBlur = 24;
        ctx.strokeStyle = 'rgba(255,245,180,0.85)';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(shX, shY, shR + 5, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
        // Speed lines bursting from shield
        if (M.effects.speedLines) {
          M.effects.speedLines(ctx, shX, shY, {
            count: 14, innerR: shR + 6, outerR: shR + 38,
            color: '#fff5c0', width: 2.5, jitter: 0.4,
          });
        }
      }

      // ── Helmet ──────────────────────────────────────────────────────
      ctx.fillStyle = '#c89028';
      ctx.beginPath(); ctx.arc(0, -8, 14, 0, Math.PI * 2); ctx.fill();
      M.effects.inkStroke(ctx, 4);
      ctx.stroke();
      // Visor T-line (manga visor suggestion)
      M.effects.inkStroke(ctx, 1.6);
      ctx.beginPath(); ctx.moveTo(-8, -7); ctx.lineTo(8, -7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(0, -2); ctx.stroke();
      // Halftone on helmet far side
      ctx.save();
      ctx.beginPath(); ctx.arc(0, -8, 14, 0, Math.PI * 2); ctx.clip();
      M.effects.halftone(ctx, 1, -22, 14, 26, { density: 4, dotSize: 1.4, alpha: 0.5, color: '#0a0a0a' });
      ctx.restore();

      // ── Plume — bold red strip with hatching + sharp highlight ──────
      ctx.fillStyle = '#cc1418';
      ctx.beginPath();
      ctx.moveTo(-state.facing * 18, -11);
      ctx.lineTo(-state.facing * 22, -5);
      ctx.lineTo( state.facing * 22, -5);
      ctx.lineTo( state.facing * 18, -11);
      ctx.closePath();
      ctx.fill();
      M.effects.inkStroke(ctx, 2.5);
      ctx.stroke();
      // Hatching texture
      M.effects.inkStroke(ctx, 0.9);
      for (let i = -16; i <= 16; i += 3) {
        ctx.beginPath();
        ctx.moveTo(state.facing * i, -10);
        ctx.lineTo(state.facing * i + state.facing * 1.5, -6);
        ctx.stroke();
      }
      // Sharp highlight stripe
      ctx.fillStyle = '#ff7a3a';
      ctx.fillRect(-state.facing * 16, -8.5, state.facing * 32, 1.4);

      // ── Drawing-bow pose (hand raised holding bow over helmet) ──────
      if (drawingBow) {
        ctx.save();
        ctx.shadowColor = '#fff5c0'; ctx.shadowBlur = 18;
        // Bow arc above head
        ctx.strokeStyle = '#8b5018'; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, -38, 22, Math.PI * 0.85, Math.PI * 0.15, true);
        ctx.stroke();
        // Bowstring
        ctx.strokeStyle = '#fff5c0'; ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-20, -33);
        ctx.lineTo(0, -28);
        ctx.lineTo(20, -33);
        ctx.stroke();
        // Charging arrow
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, -28); ctx.lineTo(0, -54);
        ctx.stroke();
        ctx.fillStyle = '#fff5c0';
        ctx.beginPath();
        ctx.moveTo(0, -56); ctx.lineTo(-3, -50); ctx.lineTo(3, -50); ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      ctx.restore();
      ctx.globalAlpha = 1;

      // Hit flash overlay (drawn outside the translate)
      if (state.hitFlash > 0) {
        const f = state.hitFlash / 0.35;
        ctx.save();
        ctx.globalAlpha = f * 0.7;
        ctx.translate(state.x, state.y - 8);
        ctx.fillStyle = '#ff2200';
        ctx.beginPath(); ctx.ellipse(0, 0, 38, 40, 0, 0, Math.PI * 2); ctx.fill();
        M.effects.inkStroke(ctx, 3.5);
        ctx.stroke();
        ctx.restore();
      }
    },
  };
})();
