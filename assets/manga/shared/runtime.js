(function () {
  const GG = (window.GodGames = window.GodGames || {});
  const Art = (GG.MangaArt = GG.MangaArt || {});
  const SCENE_ATLAS = 'godgames.shared.sceneAtlas';

  function mangaEnabled() {
    return (window.Engine && Engine.manga) || localStorage.getItem('godgames_manga') === '1';
  }

  function assets() {
    return window.Manga && Manga.assets ? Manga.assets : null;
  }

  function ready(id) {
    const A = assets();
    return !!(A && typeof A.ready === 'function' && A.ready(id));
  }

  function drawImage(ctx, id, x, y, w, h, opts = {}) {
    const A = assets();
    if (!A || typeof A.drawImage !== 'function') return false;
    return A.drawImage(ctx, id, x, y, w, h, opts);
  }

  function drawFrame(ctx, id, frame, x, y, opts = {}) {
    const A = assets();
    if (!A || typeof A.drawFrame !== 'function') return false;
    return A.drawFrame(ctx, id, frame, x, y, opts);
  }

  function animation(id, name) {
    const A = assets();
    if (!A || typeof A.get !== 'function') return null;
    const def = A.get(id);
    return def && def.meta && def.meta.animations
      ? def.meta.animations[name] || null
      : null;
  }

  function animationFrame(id, name, t = 0, opts = {}) {
    const anim = animation(id, name);
    const frames = anim && Array.isArray(anim.frames) && anim.frames.length
      ? anim.frames
      : [name];
    const fps = opts.fps ?? (anim && anim.fps) ?? 8;
    const loop = opts.loop ?? (anim ? anim.loop !== false : true);
    let idx = 0;

    if (frames.length > 1 && fps > 0) {
      idx = Math.floor(Math.max(0, t) * fps);
      idx = loop ? idx % frames.length : Math.min(frames.length - 1, idx);
    }

    return frames[idx] || frames[0] || name;
  }

  function drawAnimation(ctx, id, name, t, x, y, opts = {}) {
    return drawFrame(ctx, id, animationFrame(id, name, t, opts), x, y, opts);
  }

  function drawFrameCover(ctx, id, frameName, x, y, w, h, opts = {}) {
    const A = assets();
    if (!A || typeof A.image !== 'function' || typeof A.frame !== 'function') return false;

    const img = A.image(id);
    const fr = A.frame(id, frameName);
    if (!img || !fr || !ready(id)) return false;

    const scale = Math.max(w / fr.w, h / fr.h);
    const cropW = Math.min(fr.w, w / scale);
    const cropH = Math.min(fr.h, h / scale);
    const focusX = Math.max(0, Math.min(1, opts.focusX ?? 0.5));
    const focusY = Math.max(0, Math.min(1, opts.focusY ?? 0.5));
    const sx = fr.x + (fr.w - cropW) * focusX;
    const sy = fr.y + (fr.h - cropH) * focusY;

    ctx.save();
    ctx.globalAlpha *= opts.alpha ?? 1;
    ctx.drawImage(img, sx, sy, cropW, cropH, x, y, w, h);
    ctx.restore();
    return true;
  }

  function drawScene(ctx, frameName, x, y, w, h, opts = {}) {
    return drawFrameCover(ctx, SCENE_ATLAS, frameName, x, y, w, h, opts);
  }

  function mangaAtmosphere(ctx, W, H, opts = {}) {
    if (!window.Manga || !Manga.effects) return;
    const ink = opts.ink || '#0a0a0a';
    if (Manga.effects.halftone) {
      Manga.effects.halftone(ctx, 0, 0, W, H, {
        density: opts.density ?? 8,
        dotSize: opts.dotSize ?? 1.35,
        alpha: opts.halftoneAlpha ?? 0.12,
        color: ink,
      });
    }
    if (Manga.effects.scanlines) {
      Manga.effects.scanlines(ctx, W, H, { spacing: opts.scanSpacing ?? 4, alpha: opts.scanAlpha ?? 0.08 });
    }
    if (Manga.effects.vignette) {
      Manga.effects.vignette(ctx, W, H, { strength: opts.vignette ?? 0.55 });
    }
  }

  function overlay(ctx, W, H, opts = {}) {
    ctx.save();
    if (opts.color) {
      ctx.globalAlpha = opts.alpha ?? 1;
      ctx.fillStyle = opts.color;
      ctx.fillRect(0, 0, W, H);
    }
    if (opts.gradient !== false) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, opts.top || 'rgba(0,0,0,0.10)');
      g.addColorStop(0.55, opts.mid || 'rgba(0,0,0,0.08)');
      g.addColorStop(1, opts.bottom || 'rgba(0,0,0,0.58)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
  }

  Art.SCENE_ATLAS = SCENE_ATLAS;
  Art.mangaEnabled = mangaEnabled;
  Art.ready = ready;
  Art.drawImage = drawImage;
  Art.drawFrame = drawFrame;
  Art.animation = animation;
  Art.animationFrame = animationFrame;
  Art.drawAnimation = drawAnimation;
  Art.drawFrameCover = drawFrameCover;
  Art.drawScene = drawScene;
  Art.mangaAtmosphere = mangaAtmosphere;
  Art.overlay = overlay;
})();
