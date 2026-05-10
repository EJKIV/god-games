// manga/characters/orca.js — Killer whale breaching the surface, manga style.
//
// state: {
//   x, y          screen position (centre of mass)
//   surfaceLocalY local y of the ocean surface relative to the orca's translate
//                 origin. Used to clip the lower body so the orca looks like
//                 it's breaching (only what's above water draws).
//   facing        1 = breach right, -1 = breach left (default 1)
//   t             animation phase (radians)
// }
//
// Note: caller is expected to have already translated to (x,y) and applied
// any rotation. The draw runs at the local origin so it composes with the
// existing icarus.html call site (same pattern as eagle.js).

(function () {
  const M = (window.Manga = window.Manga || {});
  M.effects = M.effects || {}; M.characters = M.characters || {};
  M.fx = M.fx || {}; M.scenes = M.scenes || {}; M.INK = M.INK || '#0a0a0a';

  const BLACK = '#0c0c0c';
  const BELLY = '#f4efe2';

  M.characters.orca = {
    name: 'Orca',
    defaultState: { x: 0, y: 0, surfaceLocalY: 60, facing: 1, t: 0 },
    preview: { width: 90, height: 130, defaultPose: 'breach' },

    polish: {
      onBreach: { sfxText: 'BREACH!' },
    },

    draw(ctx, state) {
      const surfaceLocalY = (state.surfaceLocalY != null ? state.surfaceLocalY : 60);
      const facing = state.facing != null ? state.facing : 1;
      const bLen = 52, bW = 17;

      ctx.save();
      // Mirror horizontally when breaching leftward — clip rect is symmetric
      // so it survives the flip.
      if (facing < 0) ctx.scale(-1, 1);
      // Clip to "above water" — manga emphasis on the body breaking through.
      ctx.beginPath();
      ctx.rect(-80, -bLen - 50, 160, bLen + 50 + surfaceLocalY);
      ctx.clip();

      // Body — flat black with bold ink outline
      ctx.fillStyle = BLACK;
      ctx.beginPath(); ctx.ellipse(0, 0, bW, bLen, 0, 0, Math.PI * 2); ctx.fill();
      M.effects.inkStroke(ctx, 4);
      ctx.stroke();

      // Halftone shadow on the back (top side) of the body — bold black ink
      // dots, the same convention used across the manga library.
      ctx.save();
      ctx.beginPath(); ctx.ellipse(0, 0, bW, bLen, 0, 0, Math.PI * 2); ctx.clip();
      M.effects.halftone(ctx, -bW, -bLen, bW, bLen, {
        density: 4, dotSize: 1.4, alpha: 0.55, color: '#0a0a0a',
      });
      ctx.restore();

      // White belly — flat off-white with bold ink
      ctx.fillStyle = BELLY;
      ctx.beginPath(); ctx.ellipse(9, 12, bW * 0.5, bLen * 0.5, 0.2, 0, Math.PI * 2); ctx.fill();
      M.effects.inkStroke(ctx, 2.4);
      ctx.stroke();

      // White eye patch — manga-bold tilted oval
      ctx.fillStyle = BELLY;
      ctx.beginPath(); ctx.ellipse(13, -22, 10, 7, 0.3, 0, Math.PI * 2); ctx.fill();
      M.effects.inkStroke(ctx, 2);
      ctx.stroke();
      // Anime eye inside the patch so the whale reads as a character, not icon art.
      M.effects.animeEye(ctx, 13, -22, {
        sx: 0.46, sy: 0.44, rot: 0.2,
        white: BELLY, iris: '#68c9ff',
        mood: 'wide', outline: 0.9,
      });

      // Dorsal fin — sharp triangular silhouette
      ctx.fillStyle = BLACK;
      ctx.beginPath();
      ctx.moveTo(-4, -28);
      ctx.lineTo(-18, -68);
      ctx.lineTo(4, -32);
      ctx.closePath(); ctx.fill();
      M.effects.inkStroke(ctx, 3);
      ctx.stroke();
      // Halftone on inner side of dorsal — black ink dots over the silhouette.
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(-4, -28); ctx.lineTo(-18, -68); ctx.lineTo(4, -32);
      ctx.closePath(); ctx.clip();
      M.effects.halftone(ctx, -18, -68, 14, 38, {
        density: 3, dotSize: 1.2, alpha: 0.5, color: '#0a0a0a',
      });
      ctx.restore();

      // Mouth line — bold ink curving open along the snout
      M.effects.inkStroke(ctx, 2);
      ctx.beginPath();
      ctx.moveTo(-2, -38);
      ctx.quadraticCurveTo(8, -36, 14, -30);
      ctx.stroke();
      // Tooth flecks (manga: 2-3 sharp triangles)
      ctx.fillStyle = BELLY;
      ctx.beginPath(); ctx.moveTo(2, -36); ctx.lineTo(4, -33); ctx.lineTo(6, -36); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(8, -34); ctx.lineTo(10, -31); ctx.lineTo(12, -34); ctx.closePath(); ctx.fill();
      M.effects.inkStroke(ctx, 1);
      ctx.stroke();

      // Fluke (tail) — bold splayed shape at the back/bottom
      ctx.fillStyle = BLACK;
      ctx.beginPath();
      ctx.moveTo(-4, bLen - 4);
      ctx.bezierCurveTo(-24, bLen + 10, -28, bLen + 24, -14, bLen + 19);
      ctx.lineTo(0, bLen + 5);
      ctx.lineTo(14, bLen + 19);
      ctx.bezierCurveTo(28, bLen + 24, 24, bLen + 10, 4, bLen - 4);
      ctx.closePath(); ctx.fill();
      M.effects.inkStroke(ctx, 3);
      ctx.stroke();

      // Side flipper (front, near belly)
      ctx.fillStyle = BLACK;
      ctx.beginPath();
      ctx.moveTo(2, -2);
      ctx.quadraticCurveTo(22, 6, 26, 22);
      ctx.quadraticCurveTo(18, 18, 8, 12);
      ctx.closePath(); ctx.fill();
      M.effects.inkStroke(ctx, 2.4);
      ctx.stroke();

      ctx.restore();

      // Speed lines streaming up off the back when breaching
      if (surfaceLocalY > -bLen) {
        if (M.effects.speedLines) {
          M.effects.speedLines(ctx, 0, -bLen - 8, {
            count: 6, innerR: 18, outerR: 50,
            color: 'rgba(10,10,10,0.45)', width: 1.4, jitter: 0.7,
          });
        }
      }
    },
  };
})();
