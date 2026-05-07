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
//
// `polish` declares per-event feel (colors, intensity, audio). The game reads
// these when Engine.manga is true and applies via Manga.fx.* / Manga.effects.*.

(function () {
  const M = (window.Manga = window.Manga || { effects: {}, characters: {}, fx: {}, INK: '#0a0a0a' });

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
    },
    preview: { width: 80, height: 100, defaultPose: 'idle' },

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
        // Cinematic plays for this many seconds before the dead/score panel
        // appears (and the panel itself fades in over `deadScreenFadeIn`).
        // FALLEN! text fades to 0 over the same window so the two transitions cross.
        deadScreenDelay:   2.2,
        deadScreenFadeIn:  0.5,
        audioLayers: [
          { freq: 110, type: 'sawtooth', dur: 0.55, vol: 0.4, slide: 55,  delay: 0   },
          { freq: 320, type: 'triangle', dur: 0.30, vol: 0.2, slide: 180, delay: 50  },
          { freq:  60, type: 'sine',     dur: 0.90, vol: 0.3,             delay: 120 },
        ],
      },
      // World atmosphere — applied by the game across the whole frame.
      atmosphere: {
        vignetteStrength: 0.55,
        scanlineAlpha:    0.10,
        halftoneAlpha:    0.12,
      },
    },

    draw(ctx, state, opts = {}) {
      const walk = state.vx !== 0 ? Math.sin(state.walkPhase) : 0;
      const flicker = state.iframes > 0 && Math.floor(state.iframes * 14) % 2 === 0;

      ctx.save();
      ctx.translate(state.x, state.y);
      if (flicker) ctx.globalAlpha = 0.30;

      // Ground shadow (flat — no gradient)
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath(); ctx.ellipse(0, 8, 30, 10, 0, 0, Math.PI * 2); ctx.fill();

      // Sandals
      const footL = walk * 8;
      ctx.fillStyle = '#5a3818';
      M.effects.inkStroke(ctx, 2);
      ctx.beginPath(); ctx.ellipse(-8 - footL, 12, 5.5, 4, walk * 0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse( 8 + footL,  8, 5.5, 4, -walk * 0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      // Body — flat bronze with bold ink outline
      ctx.fillStyle = '#d8a840';
      ctx.beginPath(); ctx.ellipse(0, 2, 18, 22, 0, 0, Math.PI * 2); ctx.fill();
      M.effects.inkStroke(ctx, 3.5);
      ctx.stroke();

      // Halftone shading on the right side of the body
      ctx.save();
      ctx.beginPath(); ctx.ellipse(0, 2, 18, 22, 0, 0, Math.PI * 2); ctx.clip();
      M.effects.halftone(ctx, -2, -16, 22, 40, { density: 4, dotSize: 1.7, alpha: 0.45, color: '#5a3010' });
      ctx.restore();

      // Belt line across torso
      M.effects.inkStroke(ctx, 2.5);
      ctx.beginPath(); ctx.moveTo(-15, 0); ctx.lineTo(15, 0); ctx.stroke();

      // Shield
      const shOffX = -state.facing * 4 + walk * 3;
      ctx.fillStyle = '#e8b840';
      ctx.beginPath(); ctx.ellipse(shOffX, -22, 22, 22, 0, 0, Math.PI * 2); ctx.fill();
      M.effects.inkStroke(ctx, 4);
      ctx.stroke();
      M.effects.inkStroke(ctx, 1.5);
      ctx.beginPath(); ctx.arc(shOffX, -22, 16, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#fff2a0';
      ctx.beginPath(); ctx.arc(shOffX, -22, 5.5, 0, Math.PI * 2); ctx.fill();
      M.effects.inkStroke(ctx, 2);
      ctx.stroke();
      ctx.save();
      ctx.beginPath(); ctx.arc(shOffX, -22, 22, 0, Math.PI * 2); ctx.clip();
      M.effects.halftone(ctx, shOffX + 4, -42, 22, 44, { density: 5, dotSize: 1.9, alpha: 0.5, color: '#6a4810' });
      ctx.restore();

      // Helmet
      ctx.fillStyle = '#c89028';
      ctx.beginPath(); ctx.arc(0, -3, 12, 0, Math.PI * 2); ctx.fill();
      M.effects.inkStroke(ctx, 3.5);
      ctx.stroke();

      // Plume — bold red strip
      ctx.fillStyle = '#cc1418';
      ctx.beginPath();
      ctx.rect(-state.facing * 14 - 2, -6, state.facing * 28 + 4, 6);
      ctx.fill();
      M.effects.inkStroke(ctx, 2);
      ctx.stroke();
      ctx.fillStyle = '#ff7a3a';
      ctx.fillRect(-state.facing * 12, -5, state.facing * 24, 1.6);

      ctx.restore();
      ctx.globalAlpha = 1;

      // Hit flash — radial ink burst
      if (state.hitFlash > 0) {
        const f = state.hitFlash / 0.35;
        ctx.save();
        ctx.globalAlpha = f * 0.7;
        ctx.translate(state.x, state.y - 8);
        ctx.fillStyle = '#ff2200';
        ctx.beginPath(); ctx.ellipse(0, 0, 32, 34, 0, 0, Math.PI * 2); ctx.fill();
        M.effects.inkStroke(ctx, 3);
        ctx.stroke();
        ctx.restore();
      }
    },
  };
})();
