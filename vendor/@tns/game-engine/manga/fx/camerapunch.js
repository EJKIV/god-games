// manga/fx/camerapunch.js — stateful camera-kick effect.
//
// Usage:
//   const punch = Manga.fx.cameraPunch();
//   // on hit:
//   punch.trigger((Math.random()-0.5)*16, (Math.random()-0.5)*16, 0.22);
//   // every frame:
//   punch.update(dt);
//   ctx.translate(punch.x, punch.y);
(function () {
  const M = (window.Manga = window.Manga || { effects: {}, characters: {}, fx: {}, INK: '#0a0a0a' });

  M.fx.cameraPunch = function () {
    return {
      x: 0, y: 0,
      _vx: 0, _vy: 0,
      _t: 0, _dur: 0,

      trigger(dx, dy, duration = 0.25) {
        this._vx = dx;
        this._vy = dy;
        this._dur = duration;
        this._t = duration;
      },

      update(dt) {
        if (this._t <= 0) {
          this.x = 0; this.y = 0;
          return;
        }
        this._t = Math.max(0, this._t - dt);
        // exp decay toward zero, with subtle wobble
        const k = this._t / this._dur;            // 1 → 0
        const wobble = Math.sin(this._t * 60) * 0.4;
        this.x = this._vx * k * (1 + wobble * (1 - k));
        this.y = this._vy * k * (1 + wobble * (1 - k));
      },
    };
  };
})();
