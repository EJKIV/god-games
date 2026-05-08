// places.js — God Games mythological location catalog.
//
// Each entry describes a "place" the player can be transported to as a
// reward for solving a mystery. The catalog is data-driven so future
// mysteries can be added by appending a new entry here + wiring a trigger
// in some game. place.html consumes this file and the mysteries.clues
// chain to render the actual scene.
//
// Each place has:
//   name     — big serif label shown over the scene
//   flavor   — italic subtitle, mythologically poetic
//   palette  — color tokens used by the silhouette + scene chrome
//   silhouette(ctx, W, H, t) — draw the location's background tableau.
//                              t is wall-clock seconds, drives gentle
//                              ambient motion (water shimmer, mist drift).
//   characterTransform(ctx, W, H) — optional. Lets the place adjust how
//                              the character is positioned/scaled inside
//                              it (e.g., Erebus places them lower, more
//                              shadowed). Default: centered, idle.

(function () {
  if (typeof window === 'undefined') return;
  window.GodGames = window.GodGames || {};

  const INK = '#0a0a0a';

  // Halftone helper — small cached pattern, used by every silhouette.
  let _ht = null;
  function halftone(ctx, x, y, w, h, alpha, color) {
    if (!_ht) {
      const tile = document.createElement('canvas');
      tile.width = tile.height = 6;
      const tc = tile.getContext('2d');
      tc.fillStyle = '#000';
      tc.beginPath(); tc.arc(3, 3, 1.2, 0, Math.PI * 2); tc.fill();
      _ht = ctx.createPattern(tile, 'repeat');
    }
    ctx.save();
    ctx.globalAlpha = alpha != null ? alpha : 0.4;
    ctx.fillStyle = color || _ht;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }

  window.GodGames.places = {
    // ────────────────────────────────────────────────────────────────────
    oceanus: {
      name: 'RIVER OCEANUS',
      flavor: 'the boundary where the world ends',
      palette: { sky: '#0c1828', deep: '#08203a', accent: '#88c8ff', mist: 'rgba(180,210,255,0.18)' },
      silhouette(ctx, W, H, t) {
        // Sky gradient → deep horizon
        const sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0,   '#0c1828');
        sky.addColorStop(0.55,'#0a2848');
        sky.addColorStop(1,   '#04101e');
        ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
        // Far stars sparser (outside-the-world feel)
        ctx.globalAlpha = 0.5;
        for (let i = 0; i < 70; i++) {
          const sx = (i * 137 + Math.sin(i * 7.3) * 50) % W;
          const sy = ((i * 89) % (H * 0.45));
          ctx.fillStyle = '#dfeeff';
          ctx.fillRect(sx, sy, 1.4, 1.4);
        }
        ctx.globalAlpha = 1;
        // Endless sea — encircling the world per the myth
        const seaY = H * 0.62;
        ctx.fillStyle = '#06182f';
        ctx.fillRect(0, seaY, W, H - seaY);
        // Halftone scrim on the water surface
        ctx.save();
        ctx.beginPath(); ctx.rect(0, seaY, W, H * 0.10); ctx.clip();
        halftone(ctx, 0, seaY, W, H * 0.10, 0.45, INK);
        ctx.restore();
        // Slow undulating horizon line
        ctx.strokeStyle = 'rgba(140,200,255,0.55)'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let x = 0; x <= W; x += 6) {
          const y = seaY + Math.sin(x * 0.012 + t * 0.8) * 4;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
        // The boundary — a pale arc rising from the horizon to denote the
        // edge of the world. Faint, hangs there mythologically.
        ctx.save();
        ctx.translate(W * 0.5, seaY);
        ctx.strokeStyle = 'rgba(136,200,255,0.35)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, W * 0.62, Math.PI, 0); ctx.stroke();
        ctx.restore();
        // Mist drifting low
        ctx.fillStyle = 'rgba(180,210,255,0.10)';
        for (let i = 0; i < 6; i++) {
          const mx = ((i * 220 + t * 18) % (W + 200)) - 100;
          ctx.beginPath();
          ctx.ellipse(mx, seaY - 18, 90 + i * 10, 12, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      },
      characterTransform(_ctx, W, H) {
        return { x: W * 0.5, y: H * 0.62 - 4, scale: 1.05 };
      },
    },

    // ────────────────────────────────────────────────────────────────────
    asphodel: {
      name: 'ASPHODEL MEADOWS',
      flavor: 'where neutral souls walk in gray',
      palette: { sky: '#1c1d24', deep: '#34343a', accent: '#bfbcae', mist: 'rgba(180,180,170,0.22)' },
      silhouette(ctx, W, H, t) {
        // Flat gray sky — the field is famously colorless
        ctx.fillStyle = '#1c1d24'; ctx.fillRect(0, 0, W, H);
        // Halftone scrim across the upper sky
        halftone(ctx, 0, 0, W, H * 0.55, 0.20, INK);
        // The meadow — pale gray ground stretching to the horizon
        const groundY = H * 0.65;
        ctx.fillStyle = '#3a3a3a'; ctx.fillRect(0, groundY, W, H - groundY);
        // Asphodel stalks scattered (faint vertical strokes)
        ctx.strokeStyle = 'rgba(220,218,200,0.35)'; ctx.lineWidth = 1.2;
        for (let i = 0; i < 90; i++) {
          const sx = (i * 173 + Math.sin(i * 1.3) * 40) % W;
          const sy = groundY + ((i * 17) % (H - groundY - 20));
          const sh = 8 + (i % 5) * 3;
          ctx.beginPath(); ctx.moveTo(sx, sy + sh); ctx.lineTo(sx, sy);
          ctx.stroke();
          // Tiny pale flower head
          ctx.fillStyle = 'rgba(230,225,210,0.4)';
          ctx.beginPath(); ctx.arc(sx, sy, 1.4, 0, Math.PI * 2); ctx.fill();
        }
        // Drifting souls — pale silhouettes far in the distance
        ctx.fillStyle = 'rgba(200,200,196,0.18)';
        for (let i = 0; i < 7; i++) {
          const ph = 30 + (i % 3) * 8;
          const px = ((i * 200 + t * 6) % (W + 200)) - 100;
          const py = groundY - ph - 4 + Math.sin(t * 0.3 + i) * 2;
          ctx.beginPath();
          ctx.ellipse(px, py - ph * 0.25, 9, ph * 0.45, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillRect(px - 7, py - ph * 0.55, 14, ph);
        }
        // Horizon line — bold ink
        ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(W, groundY); ctx.stroke();
      },
      characterTransform(_ctx, W, H) {
        return { x: W * 0.45, y: H * 0.65 - 6, scale: 1.0 };
      },
    },

    // ────────────────────────────────────────────────────────────────────
    erebus: {
      name: 'EREBUS',
      flavor: 'the gloom before the underworld',
      palette: { sky: '#0a0418', deep: '#1c0a26', accent: '#a070d0', mist: 'rgba(80,40,120,0.30)' },
      silhouette(ctx, W, H, t) {
        // Deep purple-black void
        const sky = ctx.createRadialGradient(W/2, H * 0.4, 40, W/2, H * 0.4, Math.max(W, H));
        sky.addColorStop(0,   '#1a0a26');
        sky.addColorStop(1,   '#02000a');
        ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
        // Halftone shadow — covers most of the frame
        halftone(ctx, 0, 0, W, H, 0.55, INK);
        // Two pale columns — the threshold to Hades
        const colY = H * 0.30, colH = H * 0.55;
        for (const colX of [W * 0.32, W * 0.68]) {
          ctx.fillStyle = '#1c1224';
          ctx.fillRect(colX - 16, colY, 32, colH);
          // Halftone shading on the right side of each column
          ctx.save();
          ctx.beginPath(); ctx.rect(colX, colY, 16, colH); ctx.clip();
          halftone(ctx, colX, colY, 16, colH, 0.55, INK);
          ctx.restore();
          // Top + bottom blocks
          ctx.fillStyle = '#160820';
          ctx.fillRect(colX - 22, colY - 10, 44, 12);
          ctx.fillRect(colX - 22, colY + colH - 2, 44, 12);
          // Bold ink outline
          ctx.strokeStyle = INK; ctx.lineWidth = 3;
          ctx.strokeRect(colX - 16, colY, 32, colH);
        }
        // A dim violet glow from the gateway between the columns
        const glow = ctx.createRadialGradient(W/2, colY + colH * 0.6, 8, W/2, colY + colH * 0.6, W * 0.18);
        glow.addColorStop(0,   `rgba(160,112,208,${0.30 + Math.sin(t * 1.2) * 0.05})`);
        glow.addColorStop(1,   'rgba(160,112,208,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, W, H);
        // Slowly drifting motes
        ctx.fillStyle = 'rgba(190,150,230,0.7)';
        for (let i = 0; i < 12; i++) {
          const mx = ((i * 113 + t * 4) % W);
          const my = (((i * 71) % H) + Math.sin(t * 0.6 + i) * 10);
          ctx.beginPath(); ctx.arc(mx, my, 1.4, 0, Math.PI * 2); ctx.fill();
        }
      },
      characterTransform(_ctx, W, H) {
        return { x: W * 0.5, y: H * 0.78, scale: 0.95 };
      },
    },

    // ────────────────────────────────────────────────────────────────────
    // Reserved for future mysteries — silhouettes are stubs that future
    // commits can flesh out. Left here so adding a mystery only needs a
    // mysteries.clues entry, not a fresh place too.
    dreams: {
      name: 'LAND OF DREAMS',
      flavor: 'where ghosts of dreams dwell beyond the streams',
      palette: { sky: '#180c2a', deep: '#2a1248', accent: '#aa44ff', mist: 'rgba(170,68,255,0.20)' },
      silhouette(ctx, W, H, t) {
        const sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#0e0820'); sky.addColorStop(1, '#22102e');
        ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
        halftone(ctx, 0, 0, W, H, 0.30, INK);
        // Floating shapes — abstract dream silhouettes
        for (let i = 0; i < 5; i++) {
          const cx = ((i * 220 + t * 6) % (W + 200)) - 100;
          const cy = H * 0.35 + Math.sin(t * 0.5 + i) * 28;
          ctx.fillStyle = `rgba(170, 68, 255, ${0.10 + (i % 3) * 0.05})`;
          ctx.beginPath();
          ctx.ellipse(cx, cy, 90 + i * 6, 30 + i * 3, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      },
      characterTransform(_ctx, W, H) { return { x: W * 0.5, y: H * 0.7, scale: 1.0 }; },
    },
  };
})();
