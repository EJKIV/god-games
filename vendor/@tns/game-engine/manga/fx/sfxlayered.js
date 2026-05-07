// manga/fx/sfxlayered.js — play a stack of synthesized tones with delays.
//
// Usage:
//   Manga.fx.sfxLayered(audioCtx, [
//     { freq: 110, type: 'sawtooth', dur: 0.5, vol: 0.4, slide: 55,  delay: 0   },
//     { freq: 320, type: 'triangle', dur: 0.3, vol: 0.2, slide: 180, delay: 50  },
//     { freq:  60, type: 'sine',     dur: 0.9, vol: 0.3,             delay: 120 },
//   ]);
//
// Caller supplies the AudioContext (so this stays free of engine.js coupling).
// Each layer descriptor: { freq, type, dur, vol, slide?, delay? (ms) }.
(function () {
  const M = (window.Manga = window.Manga || { effects: {}, characters: {}, fx: {}, INK: '#0a0a0a' });

  function playOne(ac, layer) {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = layer.type || 'sine';
    o.frequency.value = layer.freq;
    if (layer.slide) o.frequency.linearRampToValueAtTime(layer.slide, ac.currentTime + layer.dur);
    g.gain.setValueAtTime(layer.vol != null ? layer.vol : 0.3, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + layer.dur);
    o.connect(g); g.connect(ac.destination);
    o.start(); o.stop(ac.currentTime + layer.dur);
  }

  M.fx.sfxLayered = function (audioCtx, layers) {
    if (!audioCtx || !Array.isArray(layers)) return;
    for (const layer of layers) {
      const delay = Math.max(0, layer.delay || 0);
      if (delay === 0) playOne(audioCtx, layer);
      else setTimeout(() => playOne(audioCtx, layer), delay);
    }
  };
})();
