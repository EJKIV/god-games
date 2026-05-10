// manga/characters/orion.js — Orion the Hunter, manga style (side profile).
//
// state: { x, y, facing, walkPhase, vx, vy, onGround, hp,
//          hurtFlash (0..0.7), proneT (0..2), proneDmg, spearCount,
//          stabFlash (0..0.22), invincible, dodgeT (0..0.28) }
// Optional manga flags:
//   constellationCharging  bool — Q ability winding up (glow + raised arm)

(function () {
  const M = (window.Manga = window.Manga || {});
  M.effects = M.effects || {}; M.characters = M.characters || {};
  M.fx = M.fx || {}; M.scenes = M.scenes || {}; M.INK = M.INK || '#0a0a0a';

  M.characters.orion = {
    name: 'Orion',
    defaultState: {
      x: 0, y: 0, facing: 1,
      walkPhase: 0, vx: 0, vy: 0, onGround: true,
      hp: 3, hurtFlash: 0, invincible: 0,
      proneT: 0, proneDmg: 0,
      spearCount: 7, stabFlash: 0, dodgeT: 0,
      constellationCharging: false,
    },
    preview: { width: 60, height: 110, defaultPose: 'idle' },

    polish: {
      onHit: {
        flashColor:    'rgba(255,40,0,0.45)',
        punchIntensity: 10,
        punchDuration:  0.25,
        sfxText:       'CRACK!',
        slomoFactor:    0.5,
        slomoDuration:  0.15,
      },
      onDeath: {
        slomoFactor:    0.18,
        slomoDuration:  0.8,
        panelSplit:     true,
        sfxText:       'FALLEN!',
        deadScreenDelay:   2.2,
        deadScreenFadeIn:  0.5,
        audioLayers: [
          { freq: 100, type: 'sawtooth', dur: 0.6, vol: 0.4, slide: 50,  delay: 0   },
          { freq: 280, type: 'triangle', dur: 0.3, vol: 0.2, slide: 160, delay: 60  },
          { freq:  55, type: 'sine',     dur: 1.0, vol: 0.3,             delay: 130 },
        ],
      },
      onConstellation: {
        sfxText: 'CONSTELLATION STRIKE!',
        audioLayers: [
          { freq: 200, type: 'sawtooth', dur: 0.50, vol: 0.32, slide:  80, delay: 0   },
          { freq:1200, type: 'triangle', dur: 0.30, vol: 0.20, slide: 600, delay: 60  },
          { freq:  90, type: 'sine',     dur: 0.80, vol: 0.30,              delay: 140 },
        ],
      },
      atmosphere: {
        vignetteStrength: 0.65,
        scanlineAlpha:    0.10,
      },
    },

    draw(ctx, state) {
      const x = state.x, y = state.y, f = state.facing;
      const flash = state.hurtFlash > 0 && Math.sin((state.t || 0) * 28) > 0;

      // ── Prone pose (knockdown) ─────────────────────────────────────
      if (state.proneT > 0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(state.facing * Math.PI / 2);
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.beginPath(); ctx.ellipse(0, 4, 34, 5, 0, 0, Math.PI * 2); ctx.fill();
        // Body
        ctx.fillStyle = '#e8d8b8';
        ctx.beginPath(); ctx.roundRect(-15, -13, 30, 18, 4); ctx.fill();
        M.effects.inkStroke(ctx, 3.5);
        ctx.stroke();
        // Halftone (manga shadow on lower side)
        ctx.save();
        ctx.beginPath(); ctx.roundRect(-15, -13, 30, 18, 4); ctx.clip();
        M.effects.halftone(ctx, -16, -4, 32, 12, { density: 4, dotSize: 1.6, alpha: 0.45, color: '#0a0a0a' });
        ctx.restore();
        // Belt
        ctx.fillStyle = M.INK;
        ctx.fillRect(-15, -4, 30, 3);
        // Limbs
        ctx.strokeStyle = '#c89058'; ctx.lineWidth = 6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(-20, -8); ctx.stroke();
        ctx.beginPath(); ctx.moveTo( 5, 0); ctx.lineTo( 20, -4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-8, -12); ctx.lineTo(-22, -22); ctx.stroke();
        ctx.beginPath(); ctx.moveTo( 8, -12); ctx.lineTo( 22, -18); ctx.stroke();
        M.effects.inkStroke(ctx, 2.2);
        ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(-20, -8); ctx.stroke();
        ctx.beginPath(); ctx.moveTo( 5, 0); ctx.lineTo( 20, -4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-8, -12); ctx.lineTo(-22, -22); ctx.stroke();
        ctx.beginPath(); ctx.moveTo( 8, -12); ctx.lineTo( 22, -18); ctx.stroke();
        // Head
        ctx.fillStyle = '#c89058';
        ctx.beginPath(); ctx.arc(0, -22, 12, 0, Math.PI * 2); ctx.fill();
        M.effects.inkStroke(ctx, 3);
        ctx.stroke();
        // Helmet
        ctx.fillStyle = '#8a6028';
        ctx.beginPath(); ctx.arc(0, -25, 12, Math.PI, 0); ctx.fill();
        M.effects.inkStroke(ctx, 2.5);
        ctx.stroke();
        // Recovery timer arc
        const prog = 1 - state.proneT / 2.0;
        ctx.strokeStyle = 'rgba(255,220,80,0.85)'; ctx.lineWidth = 3.5;
        ctx.beginPath(); ctx.arc(0, -22, 18, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2); ctx.stroke();
        ctx.restore();
        return;
      }

      const walk = state.onGround && state.vx !== 0 ? Math.sin(state.walkPhase) * 0.9 : 0;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(f, 1);
      if (flash) ctx.globalAlpha = 0.6;

      // Constellation glow halo (when ability is charging)
      if (state.constellationCharging) {
        ctx.save();
        ctx.shadowColor = '#88ddff'; ctx.shadowBlur = 30;
        ctx.fillStyle = 'rgba(170,220,255,0.25)';
        ctx.beginPath(); ctx.arc(0, -55, 56, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      // Hard ink shadow
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.beginPath(); ctx.ellipse(0, 0, 22, 5, 0, 0, Math.PI * 2); ctx.fill();

      // Legs — flat skin + thick outline
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#c89058'; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(-5, -18); ctx.lineTo(-9 + walk * 11, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo( 5, -18); ctx.lineTo( 9 - walk * 11, 0); ctx.stroke();
      M.effects.inkStroke(ctx, 2.5);
      ctx.beginPath(); ctx.moveTo(-5, -18); ctx.lineTo(-9 + walk * 11, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo( 5, -18); ctx.lineTo( 9 - walk * 11, 0); ctx.stroke();

      // Sandals
      ctx.fillStyle = M.INK;
      ctx.fillRect(-12 + walk * 11, -2, 6, 3);
      ctx.fillRect(  6 - walk * 11, -2, 6, 3);

      // Tunic — flat off-white with thick ink
      ctx.fillStyle = '#e8d8b8';
      ctx.beginPath();
      ctx.moveTo(-12, -18); ctx.lineTo(-14, -52); ctx.lineTo(14, -52); ctx.lineTo(12, -18);
      ctx.closePath(); ctx.fill();
      M.effects.inkStroke(ctx, 3.5);
      ctx.stroke();
      // Tunic folds
      M.effects.inkStroke(ctx, 1.2);
      ctx.beginPath(); ctx.moveTo(-3, -50); ctx.lineTo(-4, -20); ctx.stroke();
      ctx.beginPath(); ctx.moveTo( 3, -50); ctx.lineTo( 4, -20); ctx.stroke();

      // Halftone shading on right side of tunic
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, -18); ctx.lineTo(0, -52); ctx.lineTo(14, -52); ctx.lineTo(12, -18);
      ctx.closePath();
      ctx.clip();
      M.effects.halftone(ctx, 0, -54, 16, 38, { density: 4, dotSize: 1.5, alpha: 0.45, color: '#0a0a0a' });
      ctx.restore();

      // Belt
      ctx.fillStyle = M.INK;
      ctx.fillRect(-13, -30, 26, 4);

      // Belt spears (small triangles)
      const beltSpears = Math.min(state.spearCount, 7);
      for (let i = 0; i < beltSpears; i++) {
        const bx = -10 + i * 3, by = -28;
        ctx.save(); ctx.translate(bx, by); ctx.rotate(0.15);
        ctx.strokeStyle = M.INK; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0, 4); ctx.lineTo(0, -10); ctx.stroke();
        ctx.fillStyle = '#d8d8d8';
        ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(-1.6, -7); ctx.lineTo(1.6, -7); ctx.closePath(); ctx.fill();
        ctx.restore();
      }

      // Arms
      ctx.lineWidth = 6; ctx.strokeStyle = '#c89058';
      ctx.beginPath(); ctx.moveTo(12, -46); ctx.lineTo(18 + walk * 5, -30); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-12, -46); ctx.lineTo(-16 - walk * 4, -32); ctx.stroke();
      M.effects.inkStroke(ctx, 2.2);
      ctx.beginPath(); ctx.moveTo(12, -46); ctx.lineTo(18 + walk * 5, -30); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-12, -46); ctx.lineTo(-16 - walk * 4, -32); ctx.stroke();

      // Held weapon (spear or knife)
      ctx.save(); ctx.translate(18 + walk * 5, -30); ctx.rotate(0.18 - walk * 0.12);
      if (state.spearCount > 0) {
        // Spear shaft
        ctx.strokeStyle = '#5a3818'; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0, -32); ctx.lineTo(0, 18); ctx.stroke();
        // Tip
        ctx.fillStyle = '#d8d8d8';
        ctx.beginPath(); ctx.moveTo(0, -32); ctx.lineTo(-4.5, -20); ctx.lineTo(4.5, -20); ctx.closePath(); ctx.fill();
        M.effects.inkStroke(ctx, 1.8);
        ctx.stroke();
      } else {
        // Knife
        ctx.strokeStyle = '#5a3818'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -16); ctx.stroke();
        ctx.fillStyle = '#d0d0d0';
        ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(-3, -8); ctx.lineTo(3, -11); ctx.closePath(); ctx.fill();
        M.effects.inkStroke(ctx, 1.5);
        ctx.stroke();
      }
      ctx.restore();

      // Neck + head
      ctx.fillStyle = '#c89058';
      ctx.fillRect(-4, -58, 8, 8);
      M.effects.inkStroke(ctx, 1.8);
      ctx.strokeRect(-4, -58, 8, 8);
      // Head - narrow anime profile with a larger expressive eye.
      ctx.fillStyle = '#c89058';
      ctx.beginPath(); ctx.ellipse(1, -66, 12.5, 14.5, 0.04, 0, Math.PI * 2); ctx.fill();
      M.effects.inkStroke(ctx, 3);
      ctx.stroke();
      // Halftone on back of head
      ctx.save();
      ctx.beginPath(); ctx.ellipse(1, -66, 12.5, 14.5, 0.04, 0, Math.PI * 2); ctx.clip();
      M.effects.halftone(ctx, -14, -81, 12, 30, { density: 3, dotSize: 1.3, alpha: 0.6, color: '#0a0a0a' });
      ctx.restore();
      // Helmet
      ctx.fillStyle = '#8a6028';
      ctx.beginPath(); ctx.ellipse(0, -69, 13, 9, 0, Math.PI, 0); ctx.fill();
      M.effects.inkStroke(ctx, 2.5);
      ctx.stroke();
      // Helmet cheek piece
      ctx.fillStyle = '#6a5018';
      ctx.beginPath(); ctx.arc(0, -66, 5, Math.PI, 0); ctx.fill();
      // Sharp side guard and plume give the helmet a stronger anime silhouette.
      ctx.fillStyle = '#4a3515';
      ctx.beginPath();
      ctx.moveTo(-8, -67); ctx.lineTo(-15, -58); ctx.lineTo(-7, -60);
      ctx.closePath(); ctx.fill();
      // Crest (red plume — vertical, manga-bold)
      ctx.fillStyle = '#cc1418';
      ctx.beginPath();
      ctx.moveTo(-4, -78); ctx.lineTo(0, -101); ctx.lineTo(5, -79); ctx.lineTo(1, -84); ctx.closePath();
      ctx.fill();
      M.effects.inkStroke(ctx, 2);
      ctx.stroke();
      // Plume highlight
      ctx.strokeStyle = '#ff7a3a'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(0, -95); ctx.lineTo(0, -82); ctx.stroke();
      M.effects.animeEye(ctx, 6.4, -66.5, {
        sx: 0.62, sy: 0.68,
        iris: state.constellationCharging ? '#88ddff' : '#553018',
        mood: state.constellationCharging ? 'wide' : 'focus',
        outline: 1.25,
      });
      M.effects.animeCheek(ctx, 1.2, -60.5, { scale: 0.42, rot: -0.12 });

      ctx.restore();

      // Stab flash overlay (knife slash arc + speed lines) — only when manga + stab firing
      if (state.stabFlash > 0) {
        const sf = state.stabFlash / 0.22;
        const reach = state.facing * 60 * sf;
        const kx = state.x + state.facing * 22 + reach;
        const ky = state.y - 36;
        ctx.save();
        ctx.translate(kx, ky);
        ctx.globalAlpha = sf;
        // Slash arc (manga curve)
        ctx.strokeStyle = 'rgba(255,255,200,0.95)';
        ctx.shadowColor = '#fff5c0'; ctx.shadowBlur = 12 * sf;
        ctx.lineWidth = 5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(0, 8, 30, -1.1, 0.1); ctx.stroke();
        ctx.shadowBlur = 0;
        // Black ink speed lines
        if (M.effects.speedLines) {
          M.effects.speedLines(ctx, 0, 0, {
            count: 8, innerR: 12, outerR: 38,
            color: 'rgba(0,0,0,0.7)', width: 1.6, jitter: 0.5,
          });
        }
        ctx.restore();
      }
    },
  };
})();
