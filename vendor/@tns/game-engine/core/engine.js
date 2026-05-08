// engine.js — God Games shared engine
// Boot a game with: Engine.boot({ title, theme, onInit, onUpdate, onRender, ... })
// Provides: rAF loop, input, audio, particles, screen shake, camera, floaters,
// default title/dead/victory screens, HUD primitives.

const Engine = {
  // Public
  canvas: null,
  ctx: null,
  W: 0, H: 0,
  GOLD: '#D4AF37',
  state: 'title',          // 'title' | 'playing' | 'dead' | 'victory'
  time: 0,
  keys: {},
  mouse: { x: 0, y: 0, down: false },
  camera: { x: 0, y: 0 },
  config: null,
  theme: null,
  // Easter-egg manga mode — toggled from the hub by typing 'shankle' / 'normal'.
  // Read here at boot; games branch their render with `if (Engine.manga) ...`.
  manga: typeof localStorage !== 'undefined' && localStorage.getItem('godgames_manga') === '1',
  // Public time scale (1.0 = real-time). Set via `Engine.setTimeScale(factor, dur)`.
  // Engine multiplies dt by this when `state === 'playing'`, so particles,
  // floaters, time, and `config.onUpdate` all slow together. Shake decay stays
  // on raw dt so transitions don't snap.
  timeScale: 1,

  // Internal
  _shakeAmt: 0,
  _justPressed: {},
  _lastTime: null,
  _floaters: [],
  // setTimeScale state — _tsFactor eases back to 1 over _tsDur (cubic).
  _tsFactor: 1, _tsDur: 0, _tsT: 0,

  particles: { list: [] },
  audio: {},
  hud: {},

  boot(config) {
    this.config = config;
    this.theme = Object.assign({
      bg: '#000',
      accent: this.GOLD,
      danger: '#cc2200',
      shakeDecay: 'exp',
      restartKey: ['1', ' '],
    }, config.theme || {});

    this.canvas = document.getElementById(config.canvasId || 'c');
    this.ctx = this.canvas.getContext('2d');
    this._fitCanvas();

    window.addEventListener('resize', () => this._fitCanvas());
    window.addEventListener('keydown', (e) => this._onKeyDown(e));
    window.addEventListener('keyup',   (e) => this._onKeyUp(e));
    this.canvas.addEventListener('mousemove', (e) => {
      const r = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - r.left;
      this.mouse.y = e.clientY - r.top;
    });
    this.canvas.addEventListener('mousedown', () => { this.mouse.down = true; });
    this.canvas.addEventListener('mouseup',   () => { this.mouse.down = false; });

    this._setupMobileShell();

    requestAnimationFrame((ts) => this._loop(ts));
  },

  // ── Mobile / touch support ─────────────────────────────────────────────
  // Injects a portrait-rotation overlay (always present, shown by media query
  // on touch devices in portrait) and an on-screen virtual gamepad (only on
  // (pointer: coarse) devices) that simulates keydown/keyup so existing game
  // code runs unchanged. Game declares its buttons via `config.mobile`.
  _setupMobileShell() {
    if (!document.getElementById('ge-mobile-style')) {
      const style = document.createElement('style');
      style.id = 'ge-mobile-style';
      style.textContent = `
        .ge-rotate-overlay {
          display: none;
          position: fixed; inset: 0; z-index: 9999;
          background: #04071a; color: #D4AF37;
          flex-direction: column; align-items: center; justify-content: center;
          gap: 22px; font-family: 'Trebuchet MS', serif; font-size: 22px;
          letter-spacing: 0.1em; text-align: center;
        }
        .ge-rotate-icon {
          width: 56px; height: 92px;
          border: 3px solid #D4AF37; border-radius: 8px;
          box-shadow: 0 0 24px rgba(212,175,55,0.45);
          animation: ge-rotate-bob 2.4s ease-in-out infinite;
        }
        @keyframes ge-rotate-bob {
          0%, 25%, 100% { transform: rotate(0deg); }
          55%, 80%      { transform: rotate(-90deg); }
        }
        @media (orientation: portrait) and (pointer: coarse) {
          body > *:not(.ge-rotate-overlay) { display: none !important; }
          .ge-rotate-overlay { display: flex !important; }
        }
        .ge-touch-ui {
          position: fixed; inset: 0; pointer-events: none; z-index: 100;
          user-select: none; -webkit-user-select: none;
        }
        .ge-touch-ui button {
          pointer-events: auto;
          touch-action: none;
          user-select: none; -webkit-user-select: none;
          -webkit-tap-highlight-color: transparent;
          background: rgba(212,175,55,0.18);
          border: 2px solid rgba(212,175,55,0.55);
          color: rgba(255,240,180,0.95);
          font-family: monospace; font-weight: bold;
          backdrop-filter: blur(2px);
          -webkit-backdrop-filter: blur(2px);
          transition: background 0.05s, transform 0.05s;
          outline: none;
        }
        .ge-touch-ui button:active,
        .ge-touch-ui button.held {
          background: rgba(212,175,55,0.55);
          transform: scale(0.93);
        }
        .ge-dpad { position: absolute; bottom: 22px; left: 22px; display: flex; gap: 14px; }
        .ge-dpad button { width: 84px; height: 84px; font-size: 30px; border-radius: 50%; }
        .ge-actions { position: absolute; bottom: 22px; right: 22px; display: grid; gap: 12px; grid-template-columns: 1fr; }
        .ge-actions.cols-2 { grid-template-columns: 1fr 1fr; }
        .ge-actions button { width: 76px; height: 76px; font-size: 12px; padding: 4px; line-height: 1.1; border-radius: 50%; }
        .ge-back-wrap { position: absolute; top: 64px; left: 8px; }
        .ge-back-wrap button { width: 60px; height: 38px; font-size: 11px; border-radius: 8px; }
      `;
      document.head.appendChild(style);
    }

    if (!document.querySelector('.ge-rotate-overlay')) {
      const overlay = document.createElement('div');
      overlay.className = 'ge-rotate-overlay';
      overlay.innerHTML = `
        <div class="ge-rotate-icon"></div>
        <div>ROTATE YOUR DEVICE</div>
        <div style="font-size:13px; opacity:0.7; letter-spacing:0.04em;">This game is best played in landscape</div>
      `;
      document.body.appendChild(overlay);
    }

    this.isTouch = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    if (!this.isTouch) return;

    const m = this.config.mobile || {};

    // Tap canvas during title/dead/victory to start/restart (same as Space/restartKey).
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.target !== this.canvas) return; // only when touching empty canvas
      if (this.state === 'title') {
        e.preventDefault();
        this._tapKey(' ');
      } else if (this.state === 'dead' || this.state === 'victory') {
        e.preventDefault();
        const rk = Array.isArray(this.theme.restartKey) ? this.theme.restartKey[0] : this.theme.restartKey;
        this._tapKey(rk);
      }
    }, { passive: false });

    const ui = document.createElement('div');
    ui.className = 'ge-touch-ui';

    if (m.movement === 'horizontal') {
      const lk = m.leftKey  || 'ArrowLeft';
      const rk = m.rightKey || 'ArrowRight';
      const dpad = document.createElement('div');
      dpad.className = 'ge-dpad';
      dpad.appendChild(this._makeTouchButton('◀', lk, 'hold'));
      dpad.appendChild(this._makeTouchButton('▶', rk, 'hold'));
      ui.appendChild(dpad);
    }

    if (m.actions && m.actions.length) {
      const actions = document.createElement('div');
      actions.className = 'ge-actions';
      if (m.actions.length > 3) actions.classList.add('cols-2');
      for (const a of m.actions) {
        actions.appendChild(this._makeTouchButton(a.label, a.key, a.mode || 'tap'));
      }
      ui.appendChild(actions);
    }

    if (m.back !== false) {
      const back = document.createElement('div');
      back.className = 'ge-back-wrap';
      back.appendChild(this._makeTouchButton('← HUB', 'Escape', 'tap'));
      ui.appendChild(back);
    }

    document.body.appendChild(ui);
  },

  _makeTouchButton(label, key, mode) {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.tabIndex = -1;

    const start = (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.classList.add('held');
      if (mode === 'doubleTap') {
        // Two synthetic press/release pairs ~80ms apart so existing
        // performance.now() double-tap detectors trigger from one tap.
        this._simKeyDown(key);
        setTimeout(() => this._simKeyUp(key),    60);
        setTimeout(() => this._simKeyDown(key), 120);
        setTimeout(() => this._simKeyUp(key),   180);
      } else {
        this._simKeyDown(key);
      }
    };
    const end = (e) => {
      if (e) e.preventDefault();
      btn.classList.remove('held');
      if (mode !== 'doubleTap') this._simKeyUp(key);
    };

    btn.addEventListener('touchstart',  start, { passive: false });
    btn.addEventListener('touchend',    end,   { passive: false });
    btn.addEventListener('touchcancel', end,   { passive: false });
    btn.addEventListener('mousedown',   start);
    btn.addEventListener('mouseup',     end);
    btn.addEventListener('mouseleave',  () => { if (btn.classList.contains('held')) end(); });
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
    return btn;
  },

  // Simulate a keyboard event by routing through the same handlers desktop
  // keys take, so audio init, state transitions, and onKeyDown all fire.
  _simKeyDown(key) {
    this._onKeyDown({ key, target: { tagName: '' }, preventDefault: () => {} });
  },
  _simKeyUp(key) {
    this._onKeyUp({ key });
  },
  _tapKey(key) {
    this._simKeyDown(key);
    setTimeout(() => this._simKeyUp(key), 50);
  },

  setState(next) {
    const prev = this.state;
    this.state = next;
    if (next === 'playing' && (prev === 'title' || prev === 'dead' || prev === 'victory')) {
      this._reset();
      this.config.onInit(this);
    }
  },

  shake(amt) { this._shakeAmt = Math.max(this._shakeAmt, amt); },

  // Trigger a time-scale dip. `factor` is the floor (e.g. 0.35), `duration` is
  // how long until we ease back to 1. Cubic ease-out. Calling again replaces
  // the current dip. Pass factor=1 (any duration) to cancel.
  setTimeScale(factor, duration) {
    this._tsFactor = Math.max(0.05, Math.min(1, factor));
    this._tsDur    = Math.max(0.001, duration);
    this._tsT      = this._tsDur;
    this.timeScale = this._tsFactor;
  },

  justPressed(key) { return !!this._justPressed[key]; },

  floater(x, y, text, color, opts) {
    opts = opts || {};
    const life = opts.life || 1.0;
    this._floaters.push({
      x, y, text,
      color: color || this.GOLD,
      vy: opts.vy != null ? opts.vy : -40,
      life,
      maxLife: life,
      font: opts.font || 'bold 16px monospace',
    });
  },

  _fitCanvas() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.W = this.canvas.width;
    this.H = this.canvas.height;
    if (this.config && this.config.onResize) this.config.onResize(this.W, this.H, this);
  },

  _reset() {
    this.particles.list.length = 0;
    this._floaters.length = 0;
    this._shakeAmt = 0;
    this.camera.x = 0;
    this.camera.y = 0;
    this.timeScale = 1; this._tsFactor = 1; this._tsDur = 0; this._tsT = 0;
  },

  _onKeyDown(e) {
    // Skip when typing in a form field (e.g. name modal input).
    const tag = e.target && e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (this.keys[e.key]) { e.preventDefault(); return; } // ignore key-repeat
    this.keys[e.key] = true;
    this._justPressed[e.key] = true;

    if (e.key === 'Escape') {
      window.location.href = this.config.hubHref || 'index.html';
      return;
    }

    // Lazy audio init on first space/enter
    if (!this.audio._ctx && (e.key === ' ' || e.key === 'Enter')) this.audio.init();

    if (this.state === 'title' && e.key === ' ') {
      // Optional gate: game may block start (e.g. force a name prompt).
      if (this.config.onTryStart && this.config.onTryStart(this) === false) {
        e.preventDefault();
        return;
      }
      this.audio.init();
      this.setState('playing');
      e.preventDefault();
      return;
    }

    const restartKeys = Array.isArray(this.theme.restartKey) ? this.theme.restartKey : [this.theme.restartKey];
    if ((this.state === 'dead' || this.state === 'victory') && restartKeys.includes(e.key)) {
      if (this.config.onTryStart && this.config.onTryStart(this) === false) {
        e.preventDefault();
        return;
      }
      this.setState('playing');
      e.preventDefault();
      return;
    }

    if (this.config.onKeyDown) this.config.onKeyDown(e, this);

    e.preventDefault();
  },

  _onKeyUp(e) { this.keys[e.key] = false; },

  _loop(ts) {
    if (this._lastTime === null) this._lastTime = ts;
    const dt = Math.min((ts - this._lastTime) / 1000, 0.05);
    this._lastTime = ts;

    this._update(dt);
    this._render();
    this._justPressed = {};

    requestAnimationFrame((ts2) => this._loop(ts2));
  },

  _update(dt) {
    // Decay shake on raw dt (always, so it doesn't snap on state transitions).
    if (this.theme.shakeDecay === 'linear') {
      this._shakeAmt = Math.max(0, this._shakeAmt - dt * 20);
    } else {
      this._shakeAmt *= Math.pow(0.85, dt * 60);
      if (this._shakeAmt < 0.5) this._shakeAmt = 0;
    }

    // Advance the time-scale ease using *raw* dt (so the dip's duration is
    // wall-clock, not subjective time). Cubic ease-out from _tsFactor → 1.
    // Only applied while playing, so a death/victory mid-slo-mo doesn't drag
    // the game-over screen.
    if (this._tsT > 0 && this.state === 'playing') {
      this._tsT = Math.max(0, this._tsT - dt);
      const k = this._tsT / this._tsDur;       // 1 → 0
      const e = 1 - Math.pow(1 - k, 3);
      this.timeScale = this._tsFactor + (1 - this._tsFactor) * (1 - e);
    } else {
      this.timeScale = 1;
    }

    // Gameplay tick uses scaled dt so time, particles, floaters, and onUpdate
    // all slow together during a slo-mo dip.
    const sdt = dt * this.timeScale;
    this.time += sdt;

    if (this.state !== 'playing') return;

    // Particles
    const list = this.particles.list;
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      if (p.update) {
        p.update(sdt, this);
      } else {
        p.x += p.vx * sdt;
        p.y += p.vy * sdt;
        if (p.gravity) p.vy += p.gravity * sdt;
        if (p.drag) {
          const k = Math.pow(1 - p.drag, sdt * 60);
          p.vx *= k; p.vy *= k;
        }
        if (p.rot !== undefined) p.rot += p.rotV * sdt;
        if (p.fade === 'life') p.alpha = p.life / p.maxLife;
        else                   p.alpha -= sdt / p.maxLife;
        p.life -= sdt;
      }
      if ((p.life !== undefined && p.life <= 0) || p.alpha <= 0) list.splice(i, 1);
    }

    // Floaters
    for (let i = this._floaters.length - 1; i >= 0; i--) {
      const f = this._floaters[i];
      f.y += f.vy * sdt;
      f.life -= sdt;
      if (f.life <= 0) this._floaters.splice(i, 1);
    }

    this.config.onUpdate(sdt, this);
  },

  _render() {
    const { ctx, W, H } = this;

    ctx.save();
    if (this._shakeAmt > 0.5) {
      ctx.translate(
        (Math.random() - 0.5) * this._shakeAmt * 2.5,
        (Math.random() - 0.5) * this._shakeAmt * 2.5
      );
    }

    // Background (in shake-space, no camera)
    if (typeof this.theme.bg === 'function') {
      this.theme.bg(ctx, W, H, this.time, this);
    } else {
      ctx.fillStyle = this.theme.bg;
      ctx.fillRect(0, 0, W, H);
    }

    if (this.state === 'playing') {
      ctx.save();
      ctx.translate(-this.camera.x, -this.camera.y);
      this.config.onRender(ctx, this);
      this._renderParticles();
      this._renderFloaters();
      ctx.restore();
    }

    ctx.restore();

    // Screen-space overlays
    if (this.state === 'playing' && this.config.onHud) this.config.onHud(ctx, this);

    if (this.state === 'title') {
      if (this.config.onTitleRender) this.config.onTitleRender(ctx, this);
      else this._defaultTitle();
    }
    if (this.state === 'dead' || this.state === 'victory') {
      if (this.config.onGameOverRender) this.config.onGameOverRender(ctx, this);
      else this._defaultGameOver();
    }
  },

  _renderParticles() {
    const ctx = this.ctx;
    for (const p of this.particles.list) {
      if (p.render) {
        p.render(ctx, this);
      } else {
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color || '#fff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size || 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  },

  _renderFloaters() {
    const ctx = this.ctx;
    for (const f of this._floaters) {
      ctx.globalAlpha = Math.min(1, f.life / f.maxLife);
      ctx.fillStyle = f.color;
      ctx.font = f.font;
      ctx.textAlign = 'center';
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  },

  _restartLabel() {
    const r = Array.isArray(this.theme.restartKey) ? this.theme.restartKey[0] : this.theme.restartKey;
    if (r === ' ')   return 'SPACE';
    if (r === '\n')  return 'ENTER';
    return r.toUpperCase();
  },

  _defaultTitle() {
    const { ctx, W, H, time, config } = this;
    ctx.fillStyle = 'rgba(0,0,0,0.62)';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 62px serif';
    ctx.fillStyle = this.theme.accent;
    ctx.shadowColor = this.theme.accent;
    ctx.shadowBlur = 28;
    ctx.fillText(config.title || 'GOD GAMES', W / 2, H * 0.28);
    ctx.shadowBlur = 0;
    if (config.subtitle) {
      ctx.font = 'italic 27px serif';
      ctx.fillStyle = 'rgba(225,205,160,0.9)';
      ctx.fillText(config.subtitle, W / 2, H * 0.37);
    }
    if (config.instructions && config.instructions.length) {
      ctx.font = '13px monospace';
      ctx.fillStyle = 'rgba(220,200,155,0.65)';
      config.instructions.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.50 + i * 23));
    }
    if (Math.sin(time * 3) > 0) {
      ctx.font = 'bold 18px monospace';
      ctx.fillStyle = this.GOLD;
      ctx.shadowColor = this.GOLD;
      ctx.shadowBlur = 12;
      ctx.fillText('PRESS SPACE TO BEGIN', W / 2, H * 0.72);
    }
    ctx.shadowBlur = 0;
    ctx.font = '12px monospace';
    ctx.fillStyle = 'rgba(170,170,170,0.45)';
    ctx.fillText('ESC — Return to World', W / 2, H * 0.88);
    ctx.restore();
  },

  _defaultGameOver() {
    const { ctx, W, H, time, config } = this;
    const isVictory = this.state === 'victory';
    ctx.fillStyle = isVictory ? 'rgba(0,0,0,0.72)' : 'rgba(0,0,0,0.78)';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.textAlign = 'center';
    const titleColor = isVictory ? this.GOLD : this.theme.danger;
    const titleText  = isVictory
      ? (config.victoryTitle || 'VICTORY')
      : (config.deadTitle    || 'DEFEATED');
    const subText = isVictory ? config.victorySubtitle : config.deadSubtitle;
    ctx.font = 'bold 52px serif';
    ctx.fillStyle = titleColor;
    ctx.shadowColor = titleColor;
    ctx.shadowBlur = 22;
    ctx.fillText(titleText, W / 2, H * 0.37);
    ctx.shadowBlur = 0;
    if (subText) {
      ctx.font = 'italic 15px serif';
      ctx.fillStyle = 'rgba(220,200,155,0.7)';
      ctx.fillText(subText, W / 2, H * 0.45);
    }
    if (Math.sin(time * 3) > 0) {
      const promptColor = isVictory ? '#44ff88' : this.GOLD;
      ctx.font = 'bold 19px monospace';
      ctx.fillStyle = promptColor;
      ctx.shadowColor = promptColor;
      ctx.shadowBlur = 9;
      ctx.fillText(`PRESS  ${this._restartLabel()}  TO ${isVictory ? 'PLAY AGAIN' : 'TRY AGAIN'}`, W / 2, H * 0.60);
    }
    ctx.shadowBlur = 0;
    ctx.font = '12px monospace';
    ctx.fillStyle = 'rgba(170,170,170,0.5)';
    ctx.fillText('ESC — Return to World', W / 2, H * 0.70);
    ctx.restore();
  },
};

// ── Audio ─────────────────────────────────────────────────────────────────────
Engine.audio = {
  _ctx: null,
  init() {
    if (!this._ctx) this._ctx = new (window.AudioContext || window.webkitAudioContext)();
  },
  // Bit-identical port of orion.html's tone() — primary synth primitive.
  tone(freq, type, dur, vol = 0.4, slide = null) {
    if (!this._ctx) return;
    const o = this._ctx.createOscillator();
    const g = this._ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    if (slide) o.frequency.linearRampToValueAtTime(slide, this._ctx.currentTime + dur);
    g.gain.setValueAtTime(vol, this._ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + dur);
    o.connect(g); g.connect(this._ctx.destination);
    o.start(); o.stop(this._ctx.currentTime + dur);
  },
  hit()     { this.tone(90,  'square',   0.22, 0.55, 60); },
  pickup()  { this.tone(660, 'sine',     0.12, 0.30, 880); },
  death()   { this.tone(180, 'sawtooth', 0.60, 0.50, 60); },
  victory() {
    [440, 550, 660, 880].forEach((f, i) => setTimeout(() => this.tone(f, 'sine', 0.45, 0.4), i * 130));
  },
};

// ── Particle emitter ──────────────────────────────────────────────────────────
// Engine.particles.list is the live pool. Default update + render handles the
// common case. Push raw objects with custom update/render fns for bespoke types
// (e.g., rotated quads, stretched drips).
Engine.particles.emit = function(opts) {
  const list = Engine.particles.list;
  const n = opts.count != null ? opts.count : 8;
  const baseAngle = (opts.spread && opts.spread.angle != null) ? opts.spread.angle : 0;
  const arc       = (opts.spread && opts.spread.arc   != null) ? opts.spread.arc   : Math.PI * 2;
  const speedRange = Array.isArray(opts.speed)
    ? opts.speed
    : [(opts.speed || 120) * 0.5, (opts.speed || 120) * 1.0];
  const lifeRange = Array.isArray(opts.lifetime)
    ? opts.lifetime
    : [opts.lifetime || 0.6, opts.lifetime || 0.6];
  const sizeRange = Array.isArray(opts.size)
    ? opts.size
    : [opts.size || 3, opts.size || 3];
  const colors = Array.isArray(opts.color) ? opts.color : [opts.color || '#fff'];

  for (let i = 0; i < n; i++) {
    const a = baseAngle - arc / 2 + Math.random() * arc;
    const s = speedRange[0] + Math.random() * (speedRange[1] - speedRange[0]);
    const life = lifeRange[0] + Math.random() * (lifeRange[1] - lifeRange[0]);
    const size = sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]);
    const p = {
      x: opts.x, y: opts.y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s - (opts.upBias || 0),
      color: colors[Math.floor(Math.random() * colors.length)],
      size,
      alpha: 1,
      life, maxLife: life,
      gravity: opts.gravity || 0,
      drag:    opts.drag    || 0,
      fade:    opts.fade    || 'linear',
    };
    if (opts.rotation) {
      p.rot  = Math.random() * Math.PI * 2;
      p.rotV = (Math.random() - 0.5) * 8;
    }
    list.push(p);
  }
};

// ── HUD primitives ────────────────────────────────────────────────────────────
Engine.hud = {
  drawBar(x, y, w, h, frac, fill, bg = 'rgba(0,0,0,0.55)', stroke = 'rgba(255,255,255,0.3)') {
    const ctx = Engine.ctx;
    ctx.save();
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 4); ctx.fill();
    ctx.fillStyle = fill;
    ctx.beginPath(); ctx.roundRect(x, y, w * Math.max(0, Math.min(1, frac)), h, 4); ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(x, y, w, h, 4); ctx.stroke();
    }
    ctx.restore();
  },
  drawHearts(x, y, current, max, size = 24, color = '#ff2244') {
    const ctx = Engine.ctx;
    ctx.save();
    ctx.textAlign = 'left';
    ctx.font = `${size}px serif`;
    for (let i = 0; i < max; i++) {
      const alive = i < current;
      ctx.fillStyle   = alive ? color : 'rgba(80,30,30,0.4)';
      ctx.shadowColor = alive ? color : 'transparent';
      ctx.shadowBlur  = alive ? 10 : 0;
      ctx.fillText('♥', x + i * (size + 8), y);
    }
    ctx.shadowBlur = 0;
    ctx.restore();
  },
  drawText(text, x, y, opts = {}) {
    const ctx = Engine.ctx;
    ctx.save();
    ctx.font      = opts.font  || '14px monospace';
    ctx.fillStyle = opts.color || Engine.GOLD;
    ctx.textAlign = opts.align || 'left';
    if (opts.glow) {
      ctx.shadowColor = opts.glow;
      ctx.shadowBlur  = opts.glowSize || 8;
    }
    ctx.fillText(text, x, y);
    ctx.shadowBlur = 0;
    ctx.restore();
  },
};

// Expose on window so companion modules (unlock, save, manga fx, mysteries)
// can extend the same Engine object. Without this, top-level `const Engine`
// is a lexical binding only — external IIFE modules see an undefined
// `window.Engine` and unintentionally create a separate empty object.
if (typeof window !== 'undefined') window.Engine = Engine;
