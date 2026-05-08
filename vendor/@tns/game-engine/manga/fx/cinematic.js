// manga/fx/cinematic.js — portable mythology-vignette overlay.
//
// Factory: returns a stateful object games drive into their render loop.
// Designed for "you have discovered something — here is the place" reveals.
// Briefly fades in a dark backdrop with a location/title and a flavor line,
// holds, and fades out. Caller chooses the title text + color.
//
// Usage:
//   const cinematic = Manga.fx.cinematic();
//   // on solve / discovery:
//   cinematic.trigger('RIVER OCEANUS', 'the boundary where the world ends', '#88c8ff');
//   // each frame:
//   cinematic.update(dt);
//   cinematic.render(ctx, canvas.width, canvas.height);
//
// Mysteries-style use case: god-games' mysteries.js creates one instance and
// exposes it on `GodGames.MythCinematic` so each game's update + render hooks
// drive the same singleton. A kid game using the library directly would do
// the same — one instance per page.

(function () {
  const M = (window.Manga = window.Manga || { effects: {}, characters: {}, fx: {}, INK: '#0a0a0a' });

  M.fx.cinematic = function () {
    return {
      active: null, // { name, flavor, color, t, dur }

      trigger(name, flavor, color, opts) {
        opts = opts || {};
        this.active = {
          name: name || '',
          flavor: flavor || '',
          color: color || '#ffd54a',
          t: 0,
          dur: opts.duration != null ? opts.duration : 3.0,
        };
      },

      update(dt) {
        if (!this.active) return;
        this.active.t += dt;
        if (this.active.t >= this.active.dur) this.active = null;
      },

      render(ctx, W, H) {
        if (!this.active) return;
        const { name, flavor, color, t, dur } = this.active;
        const fadeIn = 0.45, fadeOut = 0.6;
        const hold = dur - fadeIn - fadeOut;
        let alpha;
        if (t < fadeIn) alpha = t / fadeIn;
        else if (t < fadeIn + hold) alpha = 1;
        else alpha = Math.max(0, 1 - (t - fadeIn - hold) / fadeOut);

        ctx.save();
        // Dark backdrop with a vignette feel
        ctx.globalAlpha = alpha * 0.92;
        const bg = ctx.createRadialGradient(W/2, H/2, 80, W/2, H/2, Math.max(W, H));
        bg.addColorStop(0, 'rgba(8, 4, 14, 0.50)');
        bg.addColorStop(1, 'rgba(2, 0, 6, 0.97)');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        // Decorative ink frame — top + bottom borders
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 14;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(W * 0.12, H * 0.30); ctx.lineTo(W * 0.88, H * 0.30);
        ctx.moveTo(W * 0.12, H * 0.62); ctx.lineTo(W * 0.88, H * 0.62);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Location name — big serif, glowing in the location's color
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.font = 'bold 56px serif';
        ctx.shadowColor = color; ctx.shadowBlur = 28;
        ctx.fillStyle = color;
        ctx.fillText(name, W / 2, H * 0.46);
        ctx.shadowBlur = 0;

        // Subtitle — italic flavor text
        ctx.font = 'italic 20px serif';
        ctx.fillStyle = 'rgba(240, 230, 200, 0.88)';
        ctx.fillText(flavor, W / 2, H * 0.54);

        ctx.restore();
      },
    };
  };
})();
