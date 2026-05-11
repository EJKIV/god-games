(function () {
  const GG = (window.GodGames = window.GodGames || {});
  const Art = (GG.MangaArt = GG.MangaArt || {});
  const SCENE_ATLAS = 'godgames.shared.sceneAtlas';
  const atmosphereCache = new Map();
  const effectLayerCache = new Map();
  const frameLayerCache = new Map();
  const MAX_ATMOSPHERE_CACHE = 10;
  const MAX_EFFECT_LAYER_CACHE = 48;
  const MAX_FRAME_LAYER_CACHE = 96;

  function storageValue(key) {
    try { return localStorage.getItem(key); } catch (_) { return null; }
  }

  function mangaEnabled() {
    return (window.Engine && Engine.manga) || storageValue('godgames_manga') === '1';
  }

  function performanceTier() {
    const pref = storageValue('godgames_perf');
    if (pref === 'high' || pref === 'balanced' || pref === 'low') return pref;
    const nav = window.navigator || {};
    const touch = (nav.maxTouchPoints || 0) > 0;
    const pixels = (window.innerWidth || 0) * (window.innerHeight || 0) * Math.max(1, window.devicePixelRatio || 1);
    if (touch || pixels > 1400000 || Math.min(window.innerWidth || 9999, window.innerHeight || 9999) < 520) return 'low';
    return 'balanced';
  }

  function qualityScale() {
    const tier = performanceTier();
    if (tier === 'high') return 1;
    if (tier === 'low') return 0.48;
    return 0.72;
  }

  function heavyEffects(opts = {}) {
    if (opts.heavyEffects === true) return true;
    if (opts.heavyEffects === false) return false;
    return performanceTier() === 'high';
  }

  function frameBlendEnabled(opts = {}) {
    if (opts.frameBlend === false || opts.tween === false) return false;
    if (opts.frameBlend === true || opts.tween === true) return true;
    return performanceTier() === 'high';
  }

  function smearEnabled(opts = {}, amount = 0) {
    if (opts.smear === false) return false;
    if (opts.smear === true || typeof opts.smear === 'number') return amount > 0.10;
    return heavyEffects(opts) && amount > 0.26;
  }

  function clearPerformanceCaches() {
    atmosphereCache.clear();
    effectLayerCache.clear();
    frameLayerCache.clear();
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
    if (!window.document || typeof A.image !== 'function' || typeof A.frame !== 'function') {
      return A.drawFrame(ctx, id, frame, x, y, opts);
    }

    const img = A.image(id);
    const fr = A.frame(id, frame);
    if (!img || !fr || !ready(id)) return false;
    if (fr.w * fr.h > 700000) return A.drawFrame(ctx, id, frame, x, y, opts);

    const key = `${id}|${frame}`;
    let layer = frameLayerCache.get(key);
    if (!layer) {
      const cw = Math.max(1, Math.ceil(fr.w));
      const ch = Math.max(1, Math.ceil(fr.h));
      layer = document.createElement('canvas');
      layer.width = cw;
      layer.height = ch;
      const layerCtx = layer.getContext('2d');
      if (!layerCtx) return A.drawFrame(ctx, id, frame, x, y, opts);
      layerCtx.drawImage(img, fr.x, fr.y, fr.w, fr.h, 0, 0, cw, ch);
      frameLayerCache.set(key, layer);
      trimCache(frameLayerCache, MAX_FRAME_LAYER_CACHE);
    }

    const scale = typeof opts.scale === 'number' ? opts.scale : 1;
    const alpha = typeof opts.alpha === 'number' ? opts.alpha : 1;
    const ax = typeof opts.anchorX === 'number' ? opts.anchorX : (typeof fr.anchorX === 'number' ? fr.anchorX : fr.w / 2);
    const ay = typeof opts.anchorY === 'number' ? opts.anchorY : (typeof fr.anchorY === 'number' ? fr.anchorY : fr.h / 2);

    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(x, y);
    if (opts.rotate) ctx.rotate(opts.rotate);
    ctx.scale((opts.flipX ? -1 : 1) * scale, (opts.flipY ? -1 : 1) * scale);
    ctx.drawImage(layer, -ax, -ay, fr.w, fr.h);
    ctx.restore();
    return true;
  }

  function cycle01(v) {
    if (typeof v !== 'number' || !Number.isFinite(v)) return 0;
    return v - Math.floor(v);
  }

  function smoothstep(edge0, edge1, v) {
    const t = clamp((v - edge0) / Math.max(0.0001, edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function animation(id, name) {
    const A = assets();
    if (!A || typeof A.get !== 'function') return null;
    const def = A.get(id);
    return def && def.meta && def.meta.animations
      ? def.meta.animations[name] || null
      : null;
  }

  function animationState(id, name, t = 0, opts = {}) {
    const anim = animation(id, name);
    const frames = anim && Array.isArray(anim.frames) && anim.frames.length
      ? anim.frames
      : [name];
    const fps = opts.fps ?? (anim && anim.fps) ?? 8;
    const loop = opts.loop ?? (anim ? anim.loop !== false : true);
    let idx = 0;
    let progress = 0;

    if (frames.length > 1 && fps > 0) {
      const raw = Math.max(0, t) * fps;
      if (loop) {
        const whole = Math.floor(raw);
        idx = whole % frames.length;
        progress = raw - whole;
      } else {
        const capped = Math.min(frames.length - 1, raw);
        idx = Math.floor(capped);
        progress = idx >= frames.length - 1 ? 1 : capped - idx;
      }
    }

    const nextIdx = frames.length > 1
      ? (loop ? (idx + 1) % frames.length : Math.min(frames.length - 1, idx + 1))
      : idx;

    return {
      frame: frames[idx] || frames[0] || name,
      nextFrame: frames[nextIdx] || frames[idx] || frames[0] || name,
      frames,
      index: idx,
      nextIndex: nextIdx,
      progress,
      fps,
      loop,
      phase: frames.length > 1 ? (idx + progress) / frames.length : cycle01(Math.max(0, t) * Math.max(0.01, fps)),
    };
  }

  function animationFrame(id, name, t = 0, opts = {}) {
    return animationState(id, name, t, opts).frame;
  }

  function filmAmountForAnimation(name, opts = {}) {
    if (typeof opts.amount === 'number') return opts.amount;
    const n = String(name || '').toLowerCase();
    if (/dead|fallen|stone|hazard|splash/.test(n)) return 0.04;
    if (/idle|watch|gaze|victory|recover|guard/.test(n)) return 0.18;
    if (/run|walk|crawl|charge|fly|breach/.test(n)) return 0.72;
    if (/dodge|jump|flap|speed|dive/.test(n)) return 0.44;
    if (/attack|claw|sting|stab|throw|bash|bow|strike|slash|release|hurt|hit/.test(n)) return 0.30;
    return 0.22;
  }

  function tweenAmountForAnimation(name, opts = {}) {
    if (opts.frameBlend === false || opts.tween === false) return 0;
    if (typeof opts.frameBlendStrength === 'number') return opts.frameBlendStrength;
    if (typeof opts.tweenAmount === 'number') return opts.tweenAmount;
    const n = String(name || '').toLowerCase();
    if (/dead|fallen|stone|hazard|splash/.test(n)) return 0;
    if (/idle|watch|gaze|victory|recover|guard/.test(n)) return 0.16;
    if (/run|walk|crawl|charge|fly|breach|flap/.test(n)) return 0.30;
    if (/dodge|jump|speed|dive/.test(n)) return 0.18;
    if (/attack|claw|sting|stab|throw|bash|bow|strike|slash|release|hurt|hit/.test(n)) return 0.20;
    return 0.14;
  }

  function shouldFilmAnimation(id, name, opts = {}) {
    if (opts.film === false) return false;
    if (opts.film === true) return true;
    const sid = String(id || '');
    if (/fxhud|sceneAtlas|hubConcourse|destinationPanels|clueTablet|olympus/i.test(sid)) return false;
    return /animSheet|archerSheet|orionAnim|scorpionAnim|perseus\.gorgonSheet|icarus\.stageAtlasV2/i.test(sid);
  }

  function drawFilmFrame(ctx, id, frame, x, y, opts = {}) {
    const q = qualityScale();
    const amount = clamp(filmAmountForAnimation(opts.animName || frame, opts), 0, 1.4);
    const phase = cycle01(opts.phase != null
      ? opts.phase
      : (opts.walkPhase != null ? opts.walkPhase / (Math.PI * 2) : (opts.t || 0) * (opts.rate || 0.95)));
    const wave = Math.sin(phase * Math.PI * 2);
    const lift = Math.max(0, Math.sin(phase * Math.PI));
    const settle = Math.max(0, Math.cos(phase * Math.PI * 2));
    const baseScale = typeof opts.scale === 'number' ? opts.scale : 1;
    const bob = (opts.bob ?? 5) * amount * q * lift * lift;
    const floatBob = (opts.floatBob || 0) * q * Math.sin((opts.floatT ?? opts.t ?? 0) * (opts.floatRate ?? 1.8) + (opts.floatPhase || 0));
    const sway = (opts.sway ?? 0.025) * amount * (0.7 + q * 0.3) * wave;
    const squash = (opts.squash ?? 0.025) * amount * q * settle;
    const lean = opts.lean || 0;
    const xDrift = (opts.driftX || 0) * amount * q * Math.sin(phase * Math.PI * 2 + 0.8);
    const yDrift = (opts.driftY || 0) * amount * q * Math.cos(phase * Math.PI * 2 + 0.4);
    const smearAlpha = smearEnabled(opts, amount)
      ? (opts.smearAlpha ?? clamp((amount - 0.26) * 0.12, 0, 0.12)) * q
      : 0;
    const smearDistance = typeof opts.smear === 'number' ? opts.smear : 5;
    const smearX = opts.smearX != null
      ? opts.smearX
      : ((opts.flipX ? 1 : -1) * smearDistance * amount * (0.45 + Math.abs(wave) * 0.55));
    const smearY = opts.smearY ?? (bob * 0.22);

    ctx.save();
    ctx.translate(x + xDrift, y - bob + floatBob + yDrift);
    const rotate = (opts.rotate || 0) + lean + sway;
    if (rotate) ctx.rotate(rotate);
    ctx.scale(
      (opts.filmScaleX || 1) * (1 + squash),
      (opts.filmScaleY || 1) * (1 - squash * 0.72)
    );
    if (smearAlpha > 0) {
      drawFrame(ctx, id, frame, smearX, smearY, {
        scale: baseScale,
        alpha: (opts.alpha ?? 1) * smearAlpha,
        flipX: opts.flipX,
        flipY: opts.flipY,
        anchorX: opts.anchorX,
        anchorY: opts.anchorY,
      });
    }
    const drew = drawFrame(ctx, id, frame, 0, 0, {
      scale: baseScale,
      alpha: opts.alpha,
      flipX: opts.flipX,
      flipY: opts.flipY,
      anchorX: opts.anchorX,
      anchorY: opts.anchorY,
    });
    ctx.restore();
    return drew;
  }

  function drawAnimation(ctx, id, name, t, x, y, opts = {}) {
    const state = animationState(id, name, t, opts);
    if (shouldFilmAnimation(id, name, opts)) {
      const baseOpts = Object.assign({}, opts, {
        t,
        animName: name,
        phase: opts.phase != null ? opts.phase : state.phase,
      });
      const blendStrength = frameBlendEnabled(opts) ? tweenAmountForAnimation(name, opts) : 0;
      if (blendStrength > 0 && state.nextFrame && state.nextFrame !== state.frame) {
        const alpha = opts.alpha ?? 1;
        const mix = smoothstep(0.36, 0.94, state.progress) * blendStrength;
        const drewA = drawFilmFrame(ctx, id, state.frame, x, y, Object.assign({}, baseOpts, {
          alpha: alpha * Math.max(0.62, 1 - mix),
        }));
        const drewB = drawFilmFrame(ctx, id, state.nextFrame, x, y, Object.assign({}, baseOpts, {
          alpha: alpha * mix,
          phase: cycle01(baseOpts.phase + 1 / state.frames.length),
          amount: filmAmountForAnimation(name, opts) * 0.82,
          smear: false,
        }));
        return drewA || drewB;
      }
      return drawFilmFrame(ctx, id, state.frame, x, y, baseOpts);
    }
    return drawFrame(ctx, id, state.frame, x, y, opts);
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

  function trimCache(cache, max) {
    while (cache.size > max) cache.delete(cache.keys().next().value);
  }

  function effectKey(kind, w, h, opts = {}) {
    return [
      kind,
      Math.ceil(w),
      Math.ceil(h),
      opts.color || '',
      opts.density ?? '',
      opts.dotSize ?? '',
      opts.alpha ?? '',
      opts.spacing ?? '',
      opts.strength ?? '',
    ].join('|');
  }

  function drawCachedEffect(ctx, kind, x, y, w, h, opts = {}, drawLayer) {
    if (!window.Manga || !Manga.effects || !window.document) return false;
    const cw = Math.max(1, Math.ceil(w));
    const ch = Math.max(1, Math.ceil(h));
    if (!Number.isFinite(cw) || !Number.isFinite(ch) || cw <= 0 || ch <= 0) return false;
    if (cw * ch > 6000000) return false;
    const key = effectKey(kind, cw, ch, opts);
    let layer = effectLayerCache.get(key);
    if (!layer) {
      layer = document.createElement('canvas');
      layer.width = cw;
      layer.height = ch;
      const layerCtx = layer.getContext('2d');
      if (!layerCtx) return false;
      drawLayer(layerCtx, cw, ch);
      effectLayerCache.set(key, layer);
      trimCache(effectLayerCache, MAX_EFFECT_LAYER_CACHE);
    }
    ctx.drawImage(layer, x, y, w, h);
    return true;
  }

  function halftone(ctx, x, y, w, h, opts = {}) {
    if (!window.Manga || !Manga.effects || typeof Manga.effects.halftone !== 'function') return false;
    const alpha = typeof opts.alpha === 'number' ? opts.alpha : null;
    const cacheOpts = alpha == null ? opts : Object.assign({}, opts, { alpha: 1 });
    ctx.save();
    if (alpha != null) ctx.globalAlpha *= alpha;
    if (opts.cache === false || !drawCachedEffect(ctx, 'halftone', x, y, w, h, cacheOpts, (layerCtx, cw, ch) => {
      Manga.effects.halftone(layerCtx, 0, 0, cw, ch, cacheOpts);
    })) {
      Manga.effects.halftone(ctx, x, y, w, h, cacheOpts);
    }
    ctx.restore();
    return true;
  }

  function scanlines(ctx, x, y, w, h, opts = {}) {
    if (!window.Manga || !Manga.effects || typeof Manga.effects.scanlines !== 'function') return false;
    const alpha = typeof opts.alpha === 'number' ? opts.alpha : null;
    const cacheOpts = alpha == null ? opts : Object.assign({}, opts, { alpha: 1 });
    ctx.save();
    if (alpha != null) ctx.globalAlpha *= alpha;
    if (opts.cache === false || !drawCachedEffect(ctx, 'scanlines', x, y, w, h, cacheOpts, (layerCtx, cw, ch) => {
      Manga.effects.scanlines(layerCtx, cw, ch, cacheOpts);
    })) {
      if (x || y) ctx.translate(x, y);
      Manga.effects.scanlines(ctx, w, h, cacheOpts);
    }
    ctx.restore();
    return true;
  }

  function vignette(ctx, x, y, w, h, opts = {}) {
    if (!window.Manga || !Manga.effects || typeof Manga.effects.vignette !== 'function') return false;
    if (opts.cache === false || !drawCachedEffect(ctx, 'vignette', x, y, w, h, opts, (layerCtx, cw, ch) => {
      Manga.effects.vignette(layerCtx, cw, ch, opts);
    })) {
      ctx.save();
      if (x || y) ctx.translate(x, y);
      Manga.effects.vignette(ctx, w, h, opts);
      ctx.restore();
    }
    return true;
  }

  function drawAtmosphereLayer(ctx, W, H, opts = {}) {
    const ink = opts.ink || '#0a0a0a';
    if (Manga.effects.halftone) {
      Manga.effects.halftone(ctx, 0, 0, W, H, {
        density: opts.density,
        dotSize: opts.dotSize,
        alpha: opts.halftoneAlpha,
        color: ink,
      });
    }
    if (Manga.effects.scanlines) {
      Manga.effects.scanlines(ctx, W, H, { spacing: opts.scanSpacing, alpha: opts.scanAlpha });
    }
    if (Manga.effects.vignette) {
      Manga.effects.vignette(ctx, W, H, { strength: opts.vignette });
    }
  }

  function mangaAtmosphere(ctx, W, H, opts = {}) {
    if (!window.Manga || !Manga.effects) return;
    const tier = performanceTier();
    const q = qualityScale();
    const settings = {
      ink: opts.ink || '#0a0a0a',
      density: opts.density ?? (tier === 'low' ? 11 : 8),
      dotSize: (opts.dotSize ?? 1.35) * (0.85 + q * 0.15),
      halftoneAlpha: (opts.halftoneAlpha ?? 0.12) * (tier === 'high' ? 1 : (tier === 'low' ? 0.45 : 0.68)),
      scanSpacing: opts.scanSpacing ?? (tier === 'low' ? 7 : 4),
      scanAlpha: (opts.scanAlpha ?? 0.08) * (tier === 'high' ? 1 : (tier === 'low' ? 0.35 : 0.58)),
      vignette: opts.vignette ?? 0.55,
    };
    const w = Math.max(1, Math.ceil(W));
    const h = Math.max(1, Math.ceil(H));
    if (!window.document || w * h > 6000000) {
      drawAtmosphereLayer(ctx, W, H, settings);
      return;
    }
    const key = [
      tier, w, h, settings.ink, settings.density, settings.dotSize.toFixed(2),
      settings.halftoneAlpha.toFixed(3), settings.scanSpacing,
      settings.scanAlpha.toFixed(3), settings.vignette.toFixed(2),
    ].join('|');
    let layer = atmosphereCache.get(key);
    if (!layer) {
      layer = document.createElement('canvas');
      layer.width = w;
      layer.height = h;
      const layerCtx = layer.getContext('2d');
      if (!layerCtx) {
        drawAtmosphereLayer(ctx, W, H, settings);
        return;
      }
      drawAtmosphereLayer(layerCtx, w, h, settings);
      atmosphereCache.set(key, layer);
      while (atmosphereCache.size > MAX_ATMOSPHERE_CACHE) {
        atmosphereCache.delete(atmosphereCache.keys().next().value);
      }
    }
    ctx.drawImage(layer, 0, 0, W, H);
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

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function rr(ctx, x, y, w, h, r) {
    if (typeof ctx.roundRect === 'function') { ctx.roundRect(x, y, w, h, r); return; }
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  }

  function drawPanel(ctx, x, y, w, h, opts = {}) {
    const ink = opts.ink || '#0a0a0a';
    const accent = opts.accent || '#D4AF37';
    const r = opts.radius ?? 6;
    ctx.save();
    ctx.globalAlpha *= opts.alpha ?? 1;
    ctx.fillStyle = opts.shadow || 'rgba(0,0,0,0.46)';
    ctx.beginPath(); rr(ctx, x + 8, y + 9, w, h, r); ctx.fill();
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, opts.paper || 'rgba(244,235,210,0.96)');
    g.addColorStop(1, opts.bottom || 'rgba(200,182,142,0.96)');
    ctx.fillStyle = g;
    ctx.beginPath(); rr(ctx, x, y, w, h, r); ctx.fill();
    const toneTier = performanceTier();
    if (window.Manga && Manga.effects && Manga.effects.halftone && opts.tone !== false && toneTier !== 'low') {
      ctx.save();
      ctx.beginPath(); rr(ctx, x + 3, y + 3, w - 6, h - 6, Math.max(0, r - 2)); ctx.clip();
      Manga.effects.halftone(ctx, x, y + h * 0.42, w, h * 0.58, {
        density: opts.density ?? 7,
        dotSize: opts.dotSize ?? 1.25,
        alpha: (opts.toneAlpha ?? 0.14) * (toneTier === 'high' ? 1 : 0.58),
        color: ink,
      });
      ctx.restore();
    }
    ctx.strokeStyle = ink;
    ctx.lineWidth = opts.lineWidth ?? 3.5;
    ctx.lineJoin = 'round';
    ctx.beginPath(); rr(ctx, x, y, w, h, r); ctx.stroke();
    ctx.globalAlpha *= opts.accentAlpha ?? 0.70;
    ctx.strokeStyle = accent;
    ctx.lineWidth = opts.accentWidth ?? 1.25;
    ctx.beginPath(); rr(ctx, x + 8, y + 8, w - 16, h - 16, Math.max(0, r - 3)); ctx.stroke();
    ctx.restore();
  }

  function contactShadow(ctx, x, y, opts = {}) {
    const scale = opts.scale ?? 1;
    const w = opts.w ?? 46 * scale;
    const h = opts.h ?? 10 * scale;
    ctx.save();
    ctx.globalAlpha *= opts.alpha ?? 0.42;
    ctx.fillStyle = opts.color || 'rgba(0,0,0,0.82)';
    ctx.beginPath(); ctx.ellipse(x, y + (opts.offsetY ?? 5 * scale), w, h, opts.rotate || 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha *= 0.35;
    ctx.strokeStyle = opts.rim || 'rgba(255,225,130,0.52)';
    ctx.lineWidth = Math.max(1, 1.2 * scale);
    ctx.beginPath(); ctx.ellipse(x, y + (opts.offsetY ?? 5 * scale), w * 0.68, h * 0.52, opts.rotate || 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  function inkText(ctx, text, x, y, opts = {}) {
    ctx.save();
    ctx.textAlign = opts.align || 'center';
    ctx.textBaseline = opts.baseline || 'alphabetic';
    ctx.font = opts.font || '900 42px "Impact", "Arial Black", sans-serif';
    ctx.lineJoin = 'round';
    if (opts.shadow) { ctx.shadowColor = opts.shadow; ctx.shadowBlur = opts.shadowBlur ?? 12; }
    ctx.lineWidth = opts.strokeWidth ?? 5;
    ctx.strokeStyle = opts.stroke || '#0a0a0a';
    ctx.strokeText(text, x, y);
    ctx.shadowBlur = 0;
    ctx.fillStyle = opts.fill || '#fff1b8';
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function drawPill(ctx, x, y, label, opts = {}) {
    const w = opts.w ?? Math.max(96, String(label).length * 14 + 38);
    const h = opts.h ?? 38;
    drawPanel(ctx, x - w / 2, y - h / 2, w, h, {
      radius: opts.radius ?? 8,
      paper: opts.paper || 'rgba(255,219,93,0.96)',
      bottom: opts.bottom || 'rgba(212,175,55,0.96)',
      accent: opts.accent || '#fff4b8',
      lineWidth: opts.lineWidth ?? 3.5,
      toneAlpha: opts.toneAlpha ?? 0.08,
      shadow: opts.shadow || 'rgba(0,0,0,0.50)',
    });
    inkText(ctx, label, x, y + 6, {
      font: opts.font || '900 18px "Impact", "Arial Black", sans-serif',
      fill: opts.fill || '#1a0f00',
      strokeWidth: opts.strokeWidth ?? 3.5,
    });
    return { x: x - w / 2, y: y - h / 2, w, h };
  }

  function drawSharedWalker(ctx, state, opts = {}) {
    if (!window.Manga || !Manga.characters || !Manga.characters.hubWalker) return false;
    const scale = opts.scale ?? 1;
    const x = state.x || 0;
    const y = state.y || 0;
    const form = state.form || 'human';
    const landing = clamp((state.landingT || 0) / 0.18, 0, 1);
    const ready = clamp(state.readyT || 0, 0, 1);
    const turn = clamp((state.turnT || 0) / 0.18, 0, 1);
    if (opts.shadow !== false) {
      contactShadow(ctx, x, y, {
        scale,
        w: ((form === 'toad' ? 32 : 24) + Math.abs(state.vx || 0) * 0.015 + landing * 8) * scale,
        h: ((form === 'toad' ? 7 : 5) + landing * 2.4) * scale,
        alpha: opts.shadowAlpha ?? (0.38 + ready * 0.05 + landing * 0.08),
      });
    }
    const amount = clamp(Math.abs(state.vx || 0) / (form === 'toad' ? 440 : 220), 0, 1);
    const phase = cycle01((state.walkPhase || 0) / (Math.PI * 2));
    const step = Math.sin(phase * Math.PI * 2);
    const lift = Math.max(0, Math.sin(phase * Math.PI));
    const idleFloat = amount < 0.04 ? Math.sin((state.t || 0) * 2.1) * (form === 'toad' ? 0.8 : 0.35) : 0;
    const bob = (form === 'toad' ? 10 : 2.4) * amount * lift * lift + idleFloat;
    const squash = (form === 'toad' ? 0.06 : 0.025) * amount * Math.max(0, Math.cos(phase * Math.PI * 2)) + landing * 0.08;
    const turnSqueeze = turn > 0 ? 0.56 + Math.abs((1 - turn) - 0.5) * 0.88 : 1;
    ctx.save();
    ctx.translate(x, y - bob);
    ctx.rotate((state.lean || 0) + step * amount * (form === 'toad' ? 0.045 : 0.018) + ready * (state.facing || 1) * -0.010);
    ctx.scale(scale * turnSqueeze * (1 + squash), scale * (1 - squash * 0.7 + landing * 0.06));
    Manga.characters.hubWalker.draw(ctx, {
      x: 0, y: 0,
      facing: state.facing || 1,
      walkPhase: state.walkPhase || 0,
      vx: state.vx || 0,
      form,
    });
    ctx.restore();
    return true;
  }

  const PLACE_SCENES = {
    oceanus:  { frame: 'oceanus',  ground: 0.64, scale: 1.00, accent: '#88c8ff', focusX: 0.50, focusY: 0.52 },
    asphodel: { frame: 'asphodel', ground: 0.68, scale: 0.98, accent: '#d7d2c2', focusX: 0.50, focusY: 0.54 },
    erebus:   { frame: 'erebus',   ground: 0.78, scale: 0.92, accent: '#a070d0', focusX: 0.50, focusY: 0.53 },
    lethe:    { frame: 'lethe',    ground: 0.64, scale: 0.96, accent: '#82b8d8', focusX: 0.50, focusY: 0.52, mappedFrom: 'oceanus' },
    tartarus: { frame: 'tartarus', ground: 0.79, scale: 0.88, accent: '#d06060', focusX: 0.50, focusY: 0.52 },
    elysium:  { frame: 'elysium',  ground: 0.66, scale: 1.02, accent: '#ffd54a', focusX: 0.52, focusY: 0.48, mappedFrom: 'olympus' },
    olympus:  { frame: 'olympus',  ground: 0.78, scale: 0.96, accent: '#ffe080', focusX: 0.50, focusY: 0.50 },
    dreams:   { frame: 'dreams',   ground: 0.70, scale: 0.98, accent: '#c084ff', focusX: 0.52, focusY: 0.45, mappedFrom: 'zeus' },
  };

  function placeSceneSpec(id) { return PLACE_SCENES[id] || PLACE_SCENES.oceanus; }
  function placeStage(id, W, H) {
    const spec = placeSceneSpec(id);
    const compact = Math.max(420, Math.min(W, H));
    return {
      id,
      spec,
      groundY: H * spec.ground,
      horizonY: H * Math.max(0.38, spec.ground - 0.18),
      travelerScale: spec.scale * clamp(compact / 760, 0.74, 1.12),
      light: spec.accent,
    };
  }

  function drawPlaceTreatment(ctx, id, W, H, t) {
    ctx.save();
    if (id === 'lethe') {
      const riverY = H * 0.58;
      ctx.fillStyle = 'rgba(184,220,238,0.15)';
      ctx.beginPath();
      ctx.moveTo(0, riverY + 12);
      for (let x = 0; x <= W; x += 26) ctx.lineTo(x, riverY + Math.sin(x * 0.012 + t * 0.7) * 8 + 18);
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(230,248,255,0.58)';
      ctx.lineWidth = 1.8;
      for (let i = 0; i < 5; i++) {
        const pulse = (t * 0.22 + i * 0.18) % 1;
        ctx.globalAlpha = 0.42 * (1 - pulse);
        ctx.beginPath(); ctx.ellipse(W * (0.18 + i * 0.16), riverY + 54 + i * 12, 24 + pulse * 86, 5 + pulse * 16, 0, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    } else if (id === 'elysium') {
      const fieldY = H * 0.58;
      ctx.fillStyle = 'rgba(255,230,120,0.16)';
      ctx.fillRect(0, fieldY, W, H - fieldY);
      for (let i = 0; i < 110; i++) {
        const x = (i * 157) % W;
        const y = fieldY + 26 + ((i * 37) % Math.max(30, H - fieldY - 40));
        ctx.fillStyle = i % 3 === 0 ? 'rgba(255,213,74,0.88)' : 'rgba(255,248,205,0.56)';
        ctx.beginPath(); ctx.ellipse(x, y, 2.2, 1.2, (i % 7) * 0.4, 0, Math.PI * 2); ctx.fill();
      }
    } else if (id === 'dreams') {
      ctx.fillStyle = 'rgba(76,24,120,0.28)';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(226,205,255,0.38)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const cx = ((i * 230 + t * 10) % (W + 180)) - 90;
        const cy = H * (0.28 + (i % 3) * 0.12) + Math.sin(t * 0.45 + i) * 22;
        ctx.beginPath(); ctx.ellipse(cx, cy, 86 + i * 8, 28 + i * 2, 0.12 * i, 0, Math.PI * 2); ctx.stroke();
      }
    } else if (id === 'tartarus') {
      ctx.fillStyle = 'rgba(120,20,20,0.18)'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(10,10,10,0.72)';
      for (let i = 0; i < 8; i++) ctx.fillRect(W * (0.18 + i * 0.09), H * 0.18, 8, H * 0.66);
    } else if (id === 'erebus') {
      const glow = ctx.createRadialGradient(W / 2, H * 0.58, 8, W / 2, H * 0.58, W * 0.28);
      glow.addColorStop(0, `rgba(160,112,208,${0.24 + Math.sin(t * 1.1) * 0.04})`);
      glow.addColorStop(1, 'rgba(160,112,208,0)');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
    } else if (id === 'olympus') {
      ctx.strokeStyle = 'rgba(255,232,150,0.42)';
      ctx.lineWidth = 2.2;
      for (let i = 0; i < 8; i++) {
        ctx.beginPath(); ctx.moveTo(W * 0.50, H * 0.17); ctx.lineTo(W * (0.18 + i * 0.09), H * 0.62); ctx.stroke();
      }
    } else if (id === 'asphodel') {
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      for (let i = 0; i < 42; i++) {
        ctx.beginPath(); ctx.ellipse((i * 181 + t * 12) % W, H * 0.48 + ((i * 37) % Math.max(40, H * 0.34)), 2.4, 5.5, Math.sin(i) * 0.6, 0, Math.PI * 2); ctx.fill();
      }
    } else if (id === 'oceanus') {
      ctx.strokeStyle = 'rgba(180,230,255,0.46)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(W * 0.5, H * 0.62, W * 0.55, Math.PI, 0); ctx.stroke();
    }
    if (window.Manga && Manga.effects && Manga.effects.halftone && performanceTier() !== 'low') {
      Manga.effects.halftone(ctx, 0, H * 0.54, W, H * 0.46, {
        density: 8, dotSize: 1.2, alpha: (id === 'asphodel' ? 0.08 : 0.12) * qualityScale(), color: '#0a0a0a',
      });
    }
    ctx.restore();
  }

  function drawPlaceScene(ctx, id, x, y, w, h, opts = {}) {
    const spec = placeSceneSpec(id);
    if (!drawScene(ctx, spec.frame, x, y, w, h, {
      focusX: opts.focusX ?? spec.focusX ?? 0.5,
      focusY: opts.focusY ?? spec.focusY ?? 0.5,
      alpha: opts.alpha ?? 1,
    })) return false;
    overlay(ctx, w, h, {
      top: opts.top || 'rgba(0,0,0,0.08)',
      mid: opts.mid || 'rgba(0,0,0,0.08)',
      bottom: opts.bottom || 'rgba(0,0,0,0.64)',
    });
    drawPlaceTreatment(ctx, id, w, h, opts.t || 0);
    mangaAtmosphere(ctx, w, h, {
      halftoneAlpha: opts.halftoneAlpha ?? 0.09,
      scanAlpha: opts.scanAlpha ?? 0.07,
      vignette: opts.vignette ?? 0.56,
    });
    return true;
  }

  function drawGameTraveler(ctx, game, x, y, opts = {}) {
    const t = opts.t || 0;
    const facing = opts.facing || 1;
    const vx = Math.abs(opts.vx || 0) > 1 ? opts.vx : facing * 60;
    const scale = opts.scale ?? 1;
    const walkCycle = cycle01((opts.walkPhase || t * 4.2) / (Math.PI * 2));
    const movingAmount = clamp(Math.abs(vx) / 80, 0.18, 1);
    let id = null, frame = null, spriteScale = scale, yy = y, flipX = facing < 0;
    let film = { phase: walkCycle, amount: movingAmount, bob: 5 * scale, sway: 0.028, squash: 0.032 };
    if (game === 'icarus') {
      const wing = cycle01(t * 0.76);
      id = 'godgames.icarus.flightSheet';
      frame = wing < 0.24 ? 'flapUp' : (wing < 0.50 ? 'glide' : (wing < 0.74 ? 'flapDown' : 'glide'));
      spriteScale *= 0.34;
      yy -= 22 * scale;
      film = {
        phase: wing,
        amount: 0.46,
        bob: 5.5 * scale,
        floatBob: 3.6 * scale,
        floatRate: 1.45,
        sway: 0.040,
        squash: 0.018,
        rotate: Math.sin(t * 1.1) * 0.035,
      };
    } else if (game === 'achilles') {
      id = ready('godgames.achilles.animSheet') ? 'godgames.achilles.animSheet' : 'godgames.achilles.actionSheet';
      if (id === 'godgames.achilles.animSheet') {
        const anim = Math.abs(vx) > 1 ? (facing < 0 ? 'runLeft' : 'runRight') : 'idle';
        frame = animationFrame(id, anim, opts.walkPhase || t); flipX = false; spriteScale *= 0.36; film.animName = anim;
      } else {
        frame = Math.abs(vx) > 1 ? (facing < 0 ? 'runLeft' : 'runRight') : 'idle'; flipX = frame === 'idle' && facing < 0; spriteScale *= 0.30;
      }
      yy += 4 * scale;
    } else if (game === 'orion') {
      id = ready('godgames.orion.orionAnimV1') ? 'godgames.orion.orionAnimV1' : 'godgames.orion.scorpionSheet';
      if (id === 'godgames.orion.orionAnimV1') {
        const anim = Math.abs(vx) > 1 ? 'run' : 'idle';
        frame = animationFrame(id, anim, opts.walkPhase || t); flipX = facing < 0; spriteScale *= 0.34; film.animName = anim;
      } else {
        frame = Math.abs(vx) > 1 ? 'orionRun' : 'orionIdle'; flipX = facing < 0; spriteScale *= 0.31;
      }
      yy += 2 * scale;
    } else if (game === 'perseus') {
      id = 'godgames.perseus.gorgonSheet';
      frame = Math.abs(Math.sin(opts.walkPhase || t)) > 0.18 ? 'perseusRun' : 'perseusIdle';
      spriteScale *= 0.32;
      yy += 3 * scale;
      film.animName = frame;
    }
    if (!id || !frame || !ready(id)) return false;
    contactShadow(ctx, x, y, { scale, w: opts.shadowW || 42 * scale, h: opts.shadowH || 9 * scale, alpha: opts.shadowAlpha ?? 0.42, rim: opts.accent || '#D4AF37' });
    ctx.save();
    ctx.shadowColor = opts.accent || '#D4AF37';
    ctx.shadowBlur = heavyEffects() ? (opts.glow ?? 10) : Math.min(4, (opts.glow ?? 10) * 0.36);
    const drew = drawFilmFrame(ctx, id, frame, x, yy, Object.assign({}, film, {
      scale: spriteScale,
      flipX,
      alpha: opts.alpha,
    }));
    ctx.restore();
    return drew;
  }

  const PLACE_NAME_TO_ID = {
    'RIVER OCEANUS': 'oceanus',
    'ASPHODEL MEADOWS': 'asphodel',
    EREBUS: 'erebus',
    LETHE: 'lethe',
    TARTARUS: 'tartarus',
    ELYSIUM: 'elysium',
    'MOUNT OLYMPUS': 'olympus',
    'LAND OF DREAMS': 'dreams',
  };

  function createCinematic() {
    return {
      active: null,
      trigger(name, flavor, color, opts = {}) {
        this.active = { name: name || '', flavor: flavor || '', color: color || '#ffd54a', t: 0, dur: opts.duration != null ? opts.duration : 3.0 };
      },
      update(dt) {
        if (!this.active) return;
        this.active.t += dt;
        if (this.active.t >= this.active.dur) this.active = null;
      },
      render(ctx, W, H) {
        if (!this.active) return;
        const a = this.active;
        const fadeIn = 0.45, fadeOut = 0.62, hold = Math.max(0, a.dur - fadeIn - fadeOut);
        const alpha = a.t < fadeIn ? a.t / fadeIn : (a.t < fadeIn + hold ? 1 : Math.max(0, 1 - (a.t - fadeIn - hold) / fadeOut));
        const id = PLACE_NAME_TO_ID[String(a.name).toUpperCase()] || 'dreams';
        ctx.save();
        ctx.globalAlpha = alpha;
        if (!drawPlaceScene(ctx, id, 0, 0, W, H, { t: a.t, alpha: 0.86, bottom: 'rgba(0,0,0,0.76)' })) {
          ctx.fillStyle = 'rgba(2,0,6,0.92)'; ctx.fillRect(0, 0, W, H);
        }
        if (window.Manga && Manga.effects && Manga.effects.speedLines) {
          Manga.effects.speedLines(ctx, W / 2, H * 0.48, {
            count: 32, innerR: Math.min(W, H) * 0.12, outerR: Math.max(W, H) * 0.70,
            color: 'rgba(255,255,255,0.38)', width: 1.6, jitter: 0.35,
          });
        }
        const panelW = Math.min(W * 0.78, 780), panelH = Math.min(H * 0.26, 190);
        const px = (W - panelW) / 2, py = H * 0.40 - panelH / 2;
        drawPanel(ctx, px, py, panelW, panelH, { accent: a.color, lineWidth: 4.5, toneAlpha: 0.14, shadow: 'rgba(0,0,0,0.58)' });
        inkText(ctx, a.name, W / 2, py + panelH * 0.48, {
          font: `900 ${Math.max(34, Math.min(62, W / 16))}px "Impact", "Arial Black", sans-serif`,
          fill: a.color, shadow: a.color, shadowBlur: 12, strokeWidth: 6,
        });
        ctx.textAlign = 'center';
        ctx.font = `italic ${Math.max(16, Math.min(22, W / 46))}px Georgia, serif`;
        ctx.fillStyle = 'rgba(45,30,18,0.88)';
        ctx.fillText(a.flavor, W / 2, py + panelH * 0.70);
        ctx.restore();
      },
    };
  }

  Art.SCENE_ATLAS = SCENE_ATLAS;
  Art.PLACE_SCENES = PLACE_SCENES;
  Art.mangaEnabled = mangaEnabled;
  Art.performanceTier = performanceTier;
  Art.qualityScale = qualityScale;
  Art.heavyEffects = heavyEffects;
  Art.frameBlendEnabled = frameBlendEnabled;
  Art.clearPerformanceCaches = clearPerformanceCaches;
  Art.ready = ready;
  Art.drawImage = drawImage;
  Art.drawFrame = drawFrame;
  Art.animation = animation;
  Art.animationState = animationState;
  Art.animationFrame = animationFrame;
  Art.drawAnimation = drawAnimation;
  Art.drawFilmFrame = drawFilmFrame;
  Art.drawFrameCover = drawFrameCover;
  Art.drawScene = drawScene;
  Art.halftone = halftone;
  Art.scanlines = scanlines;
  Art.vignette = vignette;
  Art.mangaAtmosphere = mangaAtmosphere;
  Art.overlay = overlay;
  Art.drawPanel = drawPanel;
  Art.contactShadow = contactShadow;
  Art.inkText = inkText;
  Art.drawPill = drawPill;
  Art.drawSharedWalker = drawSharedWalker;
  Art.placeSceneSpec = placeSceneSpec;
  Art.placeStage = placeStage;
  Art.drawPlaceScene = drawPlaceScene;
  Art.drawGameTraveler = drawGameTraveler;
  Art.createCinematic = createCinematic;
})();
