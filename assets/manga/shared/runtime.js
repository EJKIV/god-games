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
    if (window.Manga && Manga.effects && Manga.effects.halftone && opts.tone !== false) {
      ctx.save();
      ctx.beginPath(); rr(ctx, x + 3, y + 3, w - 6, h - 6, Math.max(0, r - 2)); ctx.clip();
      Manga.effects.halftone(ctx, x, y + h * 0.42, w, h * 0.58, {
        density: opts.density ?? 7,
        dotSize: opts.dotSize ?? 1.25,
        alpha: opts.toneAlpha ?? 0.14,
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
    if (opts.shadow !== false) {
      contactShadow(ctx, x, y, {
        scale,
        w: (state.form === 'toad' ? 32 : 24) * scale,
        h: (state.form === 'toad' ? 7 : 5) * scale,
        alpha: opts.shadowAlpha ?? 0.40,
      });
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    Manga.characters.hubWalker.draw(ctx, {
      x: 0, y: 0,
      facing: state.facing || 1,
      walkPhase: state.walkPhase || 0,
      vx: state.vx || 0,
      form: state.form || 'human',
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
    if (window.Manga && Manga.effects && Manga.effects.halftone) {
      Manga.effects.halftone(ctx, 0, H * 0.54, W, H * 0.46, {
        density: 8, dotSize: 1.2, alpha: id === 'asphodel' ? 0.08 : 0.12, color: '#0a0a0a',
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
    let id = null, frame = null, spriteScale = scale, yy = y, flipX = facing < 0;
    if (game === 'icarus') {
      id = 'godgames.icarus.flightSheet'; frame = Math.sin(t * 2.2) > 0 ? 'flapUp' : 'glide'; spriteScale *= 0.34; yy -= 22 * scale;
    } else if (game === 'achilles') {
      id = ready('godgames.achilles.animSheet') ? 'godgames.achilles.animSheet' : 'godgames.achilles.actionSheet';
      if (id === 'godgames.achilles.animSheet') {
        const anim = Math.abs(vx) > 1 ? (facing < 0 ? 'runLeft' : 'runRight') : 'idle';
        frame = animationFrame(id, anim, opts.walkPhase || t); flipX = false; spriteScale *= 0.36;
      } else {
        frame = Math.abs(vx) > 1 ? (facing < 0 ? 'runLeft' : 'runRight') : 'idle'; flipX = frame === 'idle' && facing < 0; spriteScale *= 0.30;
      }
      yy += 4 * scale;
    } else if (game === 'orion') {
      id = ready('godgames.orion.orionAnimV1') ? 'godgames.orion.orionAnimV1' : 'godgames.orion.scorpionSheet';
      if (id === 'godgames.orion.orionAnimV1') {
        frame = animationFrame(id, Math.abs(vx) > 1 ? 'run' : 'idle', opts.walkPhase || t); flipX = facing < 0; spriteScale *= 0.34;
      } else {
        frame = Math.abs(vx) > 1 ? 'orionRun' : 'orionIdle'; flipX = facing < 0; spriteScale *= 0.31;
      }
      yy += 2 * scale;
    } else if (game === 'perseus') {
      id = 'godgames.perseus.gorgonSheet'; frame = Math.abs(Math.sin(opts.walkPhase || t)) > 0.18 ? 'perseusRun' : 'perseusIdle'; spriteScale *= 0.32; yy += 3 * scale;
    }
    if (!id || !frame || !ready(id)) return false;
    contactShadow(ctx, x, y, { scale, w: opts.shadowW || 42 * scale, h: opts.shadowH || 9 * scale, alpha: opts.shadowAlpha ?? 0.42, rim: opts.accent || '#D4AF37' });
    ctx.save();
    ctx.shadowColor = opts.accent || '#D4AF37';
    ctx.shadowBlur = opts.glow ?? 10;
    const drew = drawFrame(ctx, id, frame, x, yy, { scale: spriteScale, flipX });
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
