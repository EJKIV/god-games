// manga/characters/hub-walker.js — the hub player in manga style.
// Two visual variants share one state shape: form: 'human' | 'toad'.
//
// state shape:
//   x, y          screen position (y is the ground line)
//   facing        -1 | 1
//   walkPhase     radians
//   vx            horizontal velocity (used to detect "moving")
//   form          'human' | 'toad'

(function () {
  const M = (window.Manga = window.Manga || {});
  M.effects = M.effects || {}; M.characters = M.characters || {};
  M.fx = M.fx || {}; M.scenes = M.scenes || {}; M.INK = M.INK || '#0a0a0a';

  // ── Human (manga) ────────────────────────────────────────────────────
  function drawHuman(ctx, state) {
    const x = state.x, y = state.y, f = state.facing;
    const walk = state.vx !== 0 ? Math.sin(state.walkPhase) * 0.9 : 0;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(f, 1);

    // Hard ink shadow under feet
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath(); ctx.ellipse(0, 0, 22, 5, 0, 0, Math.PI * 2); ctx.fill();

    // Legs — flat skin with thick outline
    ctx.strokeStyle = '#b8884a'; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-5, -18); ctx.lineTo(-9 + walk * 10, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo( 5, -18); ctx.lineTo( 9 - walk * 10, 0); ctx.stroke();
    M.effects.inkStroke(ctx, 3);
    ctx.beginPath(); ctx.moveTo(-5, -18); ctx.lineTo(-9 + walk * 10, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo( 5, -18); ctx.lineTo( 9 - walk * 10, 0); ctx.stroke();

    // Sandals — solid black
    ctx.fillStyle = M.INK;
    ctx.fillRect(-12 + walk * 10, -2, 8, 3);
    ctx.fillRect(  4 - walk * 10, -2, 8, 3);

    // Robe — flat off-white with thick outline
    ctx.fillStyle = '#f0e8d0';
    ctx.beginPath();
    ctx.moveTo(-13, -20); ctx.lineTo(-15, -50); ctx.lineTo(15, -50); ctx.lineTo(13, -20);
    ctx.closePath();
    ctx.fill();
    M.effects.inkStroke(ctx, 4);
    ctx.stroke();

    // Robe folds — pure ink lines (manga: 2-3 strokes for fabric)
    M.effects.inkStroke(ctx, 1.8);
    ctx.beginPath(); ctx.moveTo(-5, -47); ctx.lineTo(-6, -22); ctx.stroke();
    ctx.beginPath(); ctx.moveTo( 5, -47); ctx.lineTo( 6, -22); ctx.stroke();

    // Halftone shading on the trailing side of the robe (back side relative to walk)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-13, -20); ctx.lineTo(-15, -50); ctx.lineTo(0, -50); ctx.lineTo(-1, -20);
    ctx.closePath();
    ctx.clip();
    M.effects.halftone(ctx, -16, -52, 18, 36, { density: 4, dotSize: 1.5, alpha: 0.55, color: '#0a0a0a' });
    ctx.restore();

    // Belt — solid black
    ctx.fillStyle = M.INK;
    ctx.fillRect(-13, -30, 26, 3);

    // Arms — flat skin + outline
    ctx.strokeStyle = '#b8884a'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(-12, -44); ctx.lineTo(-17 - walk * 4, -28); ctx.stroke();
    ctx.beginPath(); ctx.moveTo( 12, -44); ctx.lineTo( 17 + walk * 5, -28); ctx.stroke();
    M.effects.inkStroke(ctx, 2.2);
    ctx.beginPath(); ctx.moveTo(-12, -44); ctx.lineTo(-17 - walk * 4, -28); ctx.stroke();
    ctx.beginPath(); ctx.moveTo( 12, -44); ctx.lineTo( 17 + walk * 5, -28); ctx.stroke();

    // Neck — flat skin + outline
    ctx.fillStyle = '#c0995a';
    ctx.fillRect(-4, -56, 8, 8);
    M.effects.inkStroke(ctx, 2);
    ctx.strokeRect(-4, -56, 8, 8);

    // Head - slightly oversized and oval so the silhouette reads anime.
    ctx.fillStyle = '#c0995a';
    ctx.beginPath(); ctx.ellipse(1, -63, 13, 15, 0, 0, Math.PI * 2); ctx.fill();
    M.effects.inkStroke(ctx, 3.5);
    ctx.stroke();

    // Halftone shading on back-half of face
    ctx.save();
    ctx.beginPath(); ctx.ellipse(1, -63, 13, 15, 0, 0, Math.PI * 2); ctx.clip();
    M.effects.halftone(ctx, -14, -78, 13, 30, { density: 3, dotSize: 1.3, alpha: 0.6, color: '#0a0a0a' });
    ctx.restore();

    // Hair - solid black, sharp angular anime silhouette with a heavy bang.
    ctx.fillStyle = M.INK;
    ctx.beginPath();
    ctx.moveTo(-13, -68);
    ctx.lineTo(-12, -78);
    ctx.lineTo( -7, -74);
    ctx.lineTo( -3, -82);
    ctx.lineTo(  2, -75);
    ctx.lineTo(  8, -80);
    ctx.lineTo( 13, -70);
    ctx.lineTo( 12, -58);
    ctx.lineTo(-12, -58);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-8, -65); ctx.lineTo(-1, -54); ctx.lineTo(-9, -57);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(5, -66); ctx.lineTo(11, -58); ctx.lineTo(6, -57);
    ctx.closePath(); ctx.fill();

    M.effects.animeEye(ctx, 5.3, -63.2, { sx: 0.72, sy: 0.70, iris: '#5a3518', outline: 1.35 });
    M.effects.animeCheek(ctx, 1.5, -56.8, { scale: 0.55, rot: -0.12 });
    // Nose and mouth - tiny marks under the eye.
    M.effects.inkStroke(ctx, 1.2);
    ctx.beginPath(); ctx.moveTo(9, -60); ctx.lineTo(10.5, -58.2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5, -54.8); ctx.lineTo(9, -54.4); ctx.stroke();

    ctx.restore();
  }

  // ── Toad (manga) ─────────────────────────────────────────────────────
  function drawToad(ctx, state) {
    const x = state.x, y = state.y, f = state.facing;
    const moving = state.vx !== 0;
    const hopT = moving ? Math.max(0, Math.sin(state.walkPhase)) : 0;
    const hop = hopT * 18;
    const stretch = hopT * 0.10;

    ctx.save();
    ctx.translate(x, y);

    // Hard ink shadow (shrinks while airborne)
    const shScale = 1 - hop / 42;
    ctx.fillStyle = `rgba(0,0,0,${0.5 * shScale})`;
    ctx.beginPath(); ctx.ellipse(0, 0, 28 * shScale, 6 * shScale, 0, 0, Math.PI * 2); ctx.fill();

    ctx.translate(0, -hop);
    ctx.scale(f * (1 - stretch * 0.4), 1 + stretch);

    // Back leg (flat dark green + outline)
    ctx.fillStyle = '#244c20';
    ctx.beginPath(); ctx.ellipse(-14, -14, 14, 9, -0.2, 0, Math.PI * 2); ctx.fill();
    M.effects.inkStroke(ctx, 3);
    ctx.stroke();
    // Back foot
    ctx.fillStyle = '#3a7a36';
    ctx.beginPath(); ctx.ellipse(-22, -3, 14, 5, 0.05, 0, Math.PI * 2); ctx.fill();
    M.effects.inkStroke(ctx, 2.5);
    ctx.stroke();
    // Webbed toes (bold ink lines)
    M.effects.inkStroke(ctx, 2);
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-28, -3);
      ctx.lineTo(-36 + i * 2, -2 + (i - 1) * 2);
      ctx.stroke();
    }

    // Body — FLAT green (no gradient) with thick ink outline
    ctx.fillStyle = '#3f7a39';
    ctx.beginPath(); ctx.ellipse(2, -18, 24, 18, 0, 0, Math.PI * 2); ctx.fill();
    M.effects.inkStroke(ctx, 4);
    ctx.stroke();

    // Halftone shading on top-back of body
    ctx.save();
    ctx.beginPath(); ctx.ellipse(2, -18, 24, 18, 0, 0, Math.PI * 2); ctx.clip();
    M.effects.halftone(ctx, -22, -38, 22, 18, { density: 4, dotSize: 1.5, alpha: 0.5, color: '#0a0a0a' });
    ctx.restore();

    // Belly — flat pale yellow-green
    ctx.fillStyle = '#dfe2a0';
    ctx.beginPath(); ctx.ellipse(2, -9, 18, 8, 0, 0, Math.PI * 2); ctx.fill();
    M.effects.inkStroke(ctx, 2);
    ctx.stroke();

    // Warts — solid black dots, no gradient
    ctx.fillStyle = M.INK;
    const warts = [[-10, -30], [-2, -34], [8, -32], [16, -26], [-14, -22], [12, -20], [20, -18], [-8, -24]];
    for (const [wx, wy] of warts) {
      ctx.beginPath(); ctx.arc(wx, wy, 2, 0, Math.PI * 2); ctx.fill();
    }

    // Front leg
    ctx.fillStyle = '#3a7a36';
    ctx.beginPath(); ctx.ellipse(15, -3, 7, 4.5, 0, 0, Math.PI * 2); ctx.fill();
    M.effects.inkStroke(ctx, 2.5);
    ctx.stroke();
    M.effects.inkStroke(ctx, 2);
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(19, -2);
      ctx.lineTo(24 + i * 1.5, 0.5);
      ctx.stroke();
    }

    // Mouth — bold curve
    M.effects.inkStroke(ctx, 2.5);
    ctx.beginPath();
    ctx.moveTo(8, -14);
    ctx.quadraticCurveTo(20, -10, 26, -16);
    ctx.stroke();

    // Back eye bump
    ctx.fillStyle = '#3f7a39';
    ctx.beginPath(); ctx.ellipse(-2, -34, 7, 8, 0, 0, Math.PI * 2); ctx.fill();
    M.effects.inkStroke(ctx, 2.5);
    ctx.stroke();
    // Iris (flat gold)
    ctx.fillStyle = '#f0c844';
    ctx.beginPath(); ctx.arc(-1, -34, 4, 0, Math.PI * 2); ctx.fill();
    M.effects.inkStroke(ctx, 1.8);
    ctx.stroke();
    // Pupil — solid black slit
    ctx.fillStyle = M.INK;
    ctx.beginPath(); ctx.ellipse(-1, -34, 1.2, 3.4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(0.5, -36.4, 1.1, 0, Math.PI * 2); ctx.fill();

    // Front eye bump (large, manga-prominent)
    ctx.fillStyle = '#4d8c46';
    ctx.beginPath(); ctx.ellipse(14, -36, 9, 10, 0, 0, Math.PI * 2); ctx.fill();
    M.effects.inkStroke(ctx, 3);
    ctx.stroke();
    // Iris (flat gold)
    ctx.fillStyle = '#f0c844';
    ctx.beginPath(); ctx.arc(15, -36, 6, 0, Math.PI * 2); ctx.fill();
    M.effects.inkStroke(ctx, 2);
    ctx.stroke();
    // Pupil — solid black vertical slit
    ctx.fillStyle = M.INK;
    ctx.beginPath(); ctx.ellipse(15, -36, 1.6, 5, 0, 0, Math.PI * 2); ctx.fill();
    // Anime catchlights and upper lash make the toad feel intentionally styled.
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(17, -38, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(13.2, -32.8, 0.8, 0, Math.PI * 2); ctx.fill();
    M.effects.inkStroke(ctx, 1.8);
    ctx.beginPath(); ctx.moveTo(6, -43); ctx.quadraticCurveTo(15, -49, 25, -42); ctx.stroke();

    // Nostril — solid black
    ctx.fillStyle = M.INK;
    ctx.beginPath(); ctx.arc(22, -22, 1.2, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  }

  M.characters.hubWalker = {
    name: 'Hub Walker',
    defaultState: { x: 0, y: 0, facing: 1, walkPhase: 0, vx: 0, form: 'human' },
    preview: { width: 60, height: 100, defaultPose: 'idle' },
    draw(ctx, state) {
      if (state.form === 'toad') drawToad(ctx, state);
      else                       drawHuman(ctx, state);
    },
  };
})();
