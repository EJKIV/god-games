// manga/fx/slomo.js — stateful time-scale effect.
//
// Usage:
//   const slomo = Manga.fx.slomo();
//   // on hit / death:
//   slomo.trigger(0.25, 0.6);  // 25% speed for 0.6s, then ease back to 1
//   // top of every onUpdate:
//   dt = slomo.scaleDt(dt);
(function () {
  const M = (window.Manga = window.Manga || { effects: {}, characters: {}, fx: {}, INK: '#0a0a0a' });

  M.fx.slomo = function () {
    return {
      scale: 1,
      _factor: 1, _dur: 0, _t: 0,

      trigger(factor, duration) {
        this._factor = Math.max(0.05, Math.min(1, factor));
        this._dur = duration;
        this._t = duration;
      },

      // Pass real dt; returns scaled dt and decays internal state.
      scaleDt(dt) {
        if (this._t <= 0) {
          this.scale = 1;
          return dt;
        }
        // Use the *real* dt to advance our timer (so slo-mo doesn't extend itself)
        this._t = Math.max(0, this._t - dt);
        const k = this._t / this._dur;            // 1 → 0
        // Ease scale from `_factor` back to 1 (cubic ease-out: snappy at end)
        const e = 1 - Math.pow(1 - k, 3);
        this.scale = this._factor + (1 - this._factor) * (1 - e);
        return dt * this.scale;
      },
    };
  };
})();
