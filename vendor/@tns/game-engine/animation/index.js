// animation — tween + easing + sequence chains for the kid's game.
//
// Loaded via:
//   <script src="node_modules/@tellandshow/game-engine/animation/index.js"></script>
//
// Attaches `Engine.animate` namespace. Kids call:
//   Engine.animate.to(target, { x: 100 }, { duration: 500, easing: 'easeOut' })
//
// Returns a Tween object the kid can `.cancel()` if they need.
//
// Pedagogy: "I want this thing to glide to that spot over half a second"
// is one of the first ideas a kid has — `to(target, props, opts)` matches
// it directly. No classes, no `new`, no complex timeline UI.
//
// The tween updater is invoked from the kid's onUpdate via Engine.animate.tick(dt),
// or — if the engine core is loaded with this module — auto-runs each frame.

(function () {
  if (typeof window === 'undefined') return;
  const Engine = (window.Engine = window.Engine || {});
  Engine.animate = Engine.animate || {};
  const A = Engine.animate;

  // -------- Easing curves --------
  // All take t in [0,1] and return eased t in [0,1]. Adding a new easing is
  // a one-liner — additive change, no breakage for existing tweens.
  A.easings = {
    linear: (t) => t,
    easeIn:    (t) => t * t,
    easeOut:   (t) => 1 - (1 - t) * (1 - t),
    easeInOut: (t) => (t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t)),
    bounce:    (t) => {
      // Standard 4-stage bounce.
      const n = 7.5625, d = 2.75;
      if (t < 1 / d)   return n * t * t;
      if (t < 2 / d) { t -= 1.5 / d; return n * t * t + 0.75; }
      if (t < 2.5 / d) { t -= 2.25 / d; return n * t * t + 0.9375; }
      t -= 2.625 / d; return n * t * t + 0.984375;
    },
    elastic:   (t) => {
      if (t === 0 || t === 1) return t;
      const p = 0.3, s = p / 4;
      return Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / p) + 1;
    },
  };

  // -------- Active tweens registry --------
  const live = new Set();

  function lerp(a, b, t) { return a + (b - a) * t; }

  // -------- Tween --------

  /**
   * Tween properties on `target` toward `to` over `opts.duration` ms.
   *
   * @param {object} target  the thing being animated; properties are mutated in place
   * @param {object} to      key→value goals; only number-valued keys are tweened
   * @param {object} opts
   * @param {number} [opts.duration=400]   ms
   * @param {number} [opts.delay=0]        ms before starting
   * @param {string} [opts.easing='easeOut']  key into A.easings, or a function
   * @param {function} [opts.onUpdate]     called every tick with (target, t)
   * @param {function} [opts.onDone]       called once when t reaches 1
   * @returns {{ cancel: function, isLive: function }} tween handle
   */
  A.to = function (target, to, opts) {
    opts = opts || {};
    const duration = opts.duration ?? 400;
    const delay = opts.delay ?? 0;
    const ease = typeof opts.easing === 'function'
      ? opts.easing
      : (A.easings[opts.easing || 'easeOut'] || A.easings.linear);

    // Snapshot starting values for each tweened key.
    const from = {};
    for (const key of Object.keys(to)) {
      if (typeof target[key] === 'number') from[key] = target[key];
    }

    const tween = {
      _target: target,
      _from: from,
      _to: to,
      _duration: Math.max(0, duration),
      _delay: Math.max(0, delay),
      _ease: ease,
      _elapsed: 0,
      _done: false,
      _onUpdate: typeof opts.onUpdate === 'function' ? opts.onUpdate : null,
      _onDone: typeof opts.onDone === 'function' ? opts.onDone : null,
      cancel() { live.delete(tween); tween._done = true; },
      isLive() { return live.has(tween) && !tween._done; },
    };
    live.add(tween);
    return tween;
  };

  /**
   * Convenience: tween from explicit values (instead of "current → to").
   * Useful for "fade in from invisible regardless of current opacity".
   */
  A.fromTo = function (target, from, to, opts) {
    for (const k of Object.keys(from)) target[k] = from[k];
    return A.to(target, to, opts);
  };

  /**
   * Sequence a list of tween factories. Each factory is `() => Tween`.
   * Returns a sequence handle the kid can cancel.
   */
  A.sequence = function (factories) {
    let i = 0;
    let current = null;
    let cancelled = false;

    function step() {
      if (cancelled) return;
      if (i >= factories.length) return;
      const factory = factories[i++];
      const tween = factory();
      if (!tween) return step();
      current = tween;
      const origDone = tween._onDone;
      tween._onDone = () => { if (origDone) origDone(); step(); };
    }
    step();
    return {
      cancel() { cancelled = true; if (current) current.cancel(); },
    };
  };

  // -------- Tick --------

  /**
   * Advance all live tweens by `dt` seconds. Kids running this manually call
   * `Engine.animate.tick(dt)` from their `onUpdate(dt)` — but if engine.js
   * core has integrated this module (M3 follow-up), it auto-runs in the
   * engine's update loop.
   */
  A.tick = function (dt) {
    const dtMs = dt * 1000;
    for (const tween of live) {
      if (tween._done) continue;
      // Honor delay first.
      if (tween._delay > 0) {
        tween._delay -= dtMs;
        if (tween._delay > 0) continue;
        // Spill any negative remainder into elapsed.
        tween._elapsed += -tween._delay;
        tween._delay = 0;
      } else {
        tween._elapsed += dtMs;
      }
      const t = tween._duration === 0 ? 1 : Math.min(1, tween._elapsed / tween._duration);
      const eased = tween._ease(t);
      for (const [key, target] of Object.entries(tween._to)) {
        if (typeof target !== 'number') continue;
        const from = tween._from[key] ?? 0;
        tween._target[key] = lerp(from, target, eased);
      }
      if (tween._onUpdate) tween._onUpdate(tween._target, eased);
      if (t >= 1) {
        tween._done = true;
        live.delete(tween);
        if (tween._onDone) tween._onDone(tween._target);
      }
    }
  };

  /** How many tweens are currently running? Useful for kid-facing debug. */
  A.liveCount = function () { return live.size; };

  /** Cancel everything. Useful on game-state transitions. */
  A.cancelAll = function () {
    for (const tween of live) { tween._done = true; }
    live.clear();
  };

  // -------- Auto-tick integration with engine.js core --------
  //
  // engine.js's update loop calls `onUpdate(dt)` and runs particles/floaters.
  // If this module loads after engine.js, attach a hook so we tick alongside.
  // We don't replace anything the engine already does — we add to it.
  if (typeof Engine.boot === 'function' && !Engine.__animateTickInstalled) {
    Engine.__animateTickInstalled = true;
    const origBoot = Engine.boot;
    Engine.boot = function (config) {
      const userOnUpdate = config && config.onUpdate;
      const wrapped = (dt, eng) => {
        A.tick(dt);
        if (typeof userOnUpdate === 'function') userOnUpdate(dt, eng);
      };
      return origBoot.call(Engine, { ...config, onUpdate: wrapped });
    };
  }
})();
