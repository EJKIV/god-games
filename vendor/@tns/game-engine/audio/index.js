// audio — extends Engine.audio with sample loading, sequencer, and looping music.
//
// Loaded via:
//   <script src="node_modules/@tellandshow/game-engine/audio/index.js"></script>
//
// engine.js core already provides:
//   Engine.audio.tone(freq, type, dur, vol, slide)
//   Engine.audio.hit / pickup / death / victory  (preset SFX)
//   Engine.audio.init()  // creates the WebAudio context lazily
//   Engine.audio._ctx    // the AudioContext
//
// This module adds:
//   Engine.audio.sample(url)           → cached AudioBuffer; play with .play(opts)
//   Engine.audio.sequence(notes, opts) → fire a sequence of tones at delays
//   Engine.audio.music(track, opts)    → loop a melody as background; pause/resume
//   Engine.audio.setVolume(0..1)       → master volume
//
// Pedagogy: the `tone` + presets in core handle 80% of kid SFX. Samples
// are for kids who want to drop in WAV/MP3 sound effects. Sequences are
// for kids composing chiptune jingles in code. Music loops a sequence.

(function () {
  if (typeof window === 'undefined') return;
  const Engine = (window.Engine = window.Engine || {});
  Engine.audio = Engine.audio || {};
  const A = Engine.audio;

  // Master gain node — interposed between every source and the destination
  // so setVolume affects everything (samples, sequences, music, even the
  // core tone()'s output if we route it through this gain. Core tone()
  // routes through ctx.destination directly, so setVolume only affects
  // this module's outputs. Documented in CLAUDE.md.)
  let _master = null;

  function ensureMaster() {
    if (!A._ctx) A.init && A.init();
    if (!A._ctx) return null;
    if (!_master) {
      _master = A._ctx.createGain();
      _master.gain.value = 1;
      _master.connect(A._ctx.destination);
    }
    return _master;
  }

  /** Master volume, 0..1. Affects samples, sequences, and music. */
  A.setVolume = function (v) {
    const m = ensureMaster();
    if (!m) return;
    m.gain.value = Math.max(0, Math.min(1, v));
  };

  // -------- Samples --------

  const sampleCache = new Map(); // url → Promise<AudioBuffer>

  /**
   * Load + cache a sample at `url`. Returns an object with `play(opts)` so the
   * kid can play it multiple times without re-loading.
   *
   * Usage:
   *   const hit = Engine.audio.sample('game/assets/hit.wav');
   *   hit.play();                       // play once
   *   hit.play({ volume: 0.5, rate: 1.2 });
   */
  A.sample = function (url) {
    if (!sampleCache.has(url)) {
      sampleCache.set(url, fetchSample(url));
    }
    const promise = sampleCache.get(url);
    return {
      play(opts) {
        return promise.then((buf) => {
          if (!buf) return;
          const ctx = A._ctx;
          if (!ctx) return;
          const master = ensureMaster();
          const src = ctx.createBufferSource();
          src.buffer = buf;
          src.playbackRate.value = (opts && opts.rate) || 1;
          if (opts && typeof opts.volume === 'number') {
            const gain = ctx.createGain();
            gain.gain.value = Math.max(0, Math.min(1, opts.volume));
            src.connect(gain).connect(master);
          } else {
            src.connect(master);
          }
          src.start(0);
          return src;
        }).catch(() => null);
      },
    };
  };

  function fetchSample(url) {
    if (typeof fetch !== 'function') return Promise.resolve(null);
    return fetch(url)
      .then((r) => r.ok ? r.arrayBuffer() : null)
      .then((buf) => {
        if (!buf || !A._ctx) return null;
        return new Promise((resolve) => {
          A._ctx.decodeAudioData(buf, resolve, () => resolve(null));
        });
      })
      .catch(() => null);
  }

  // -------- Note → frequency helper (chiptune) --------

  // Standard 12-tone equal temperament. Notes are strings like 'A4', 'C#5', 'Eb3'.
  // 'rest' → 0 Hz (silent gap in a sequence).
  const NOTE_OFFSETS = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
  function noteToFreq(note) {
    if (!note || note === 'rest') return 0;
    const m = String(note).match(/^([A-G][#b]?)(-?\d+)$/);
    if (!m) return 0;
    const semitone = NOTE_OFFSETS[m[1]];
    if (semitone === undefined) return 0;
    const octave = parseInt(m[2], 10);
    // A4 = 440Hz; semitone offset from A4 = (octave - 4) * 12 + (semitone - 9)
    const offset = (octave - 4) * 12 + (semitone - 9);
    return 440 * Math.pow(2, offset / 12);
  }
  A.noteToFreq = noteToFreq;

  // -------- Sequence --------

  /**
   * Play a list of notes in sequence. Each note is `{ note: 'A4', dur: 0.2, vol: 0.5 }`
   * or a shorthand string like `'A4'` (defaults to 0.2s, 0.4 vol).
   * Returns a handle with `cancel()`.
   *
   * `opts.gap` is extra silence between notes (default 30ms — keeps notes distinct).
   * `opts.type` is the oscillator type (default 'square' — chiptune sound).
   */
  A.sequence = function (notes, opts) {
    opts = opts || {};
    const gap = opts.gap != null ? opts.gap : 0.03;
    const type = opts.type || 'square';
    const ctx = A._ctx;
    if (!ctx) { A.init && A.init(); }
    const master = ensureMaster();
    if (!ctx || !master) return { cancel: () => {} };

    const cancellers = [];
    let when = ctx.currentTime;

    for (const raw of notes) {
      const note = typeof raw === 'string' ? { note: raw } : raw;
      const freq = noteToFreq(note.note);
      const dur = note.dur != null ? note.dur : 0.2;
      const vol = note.vol != null ? note.vol : 0.4;

      if (freq > 0) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, when);
        gain.gain.linearRampToValueAtTime(vol, when + 0.01);
        gain.gain.linearRampToValueAtTime(0, when + dur);
        osc.connect(gain).connect(master);
        osc.start(when);
        osc.stop(when + dur + 0.05);
        cancellers.push(() => { try { osc.stop(); } catch (_e) {} });
      }
      when += dur + gap;
    }

    return { cancel: () => cancellers.forEach((fn) => fn()) };
  };

  // -------- Music (looping sequence) --------

  /**
   * Play `track` (a list of notes) on loop until cancelled. Same shorthand as
   * sequence(). Returns `{ pause(), resume(), cancel() }`.
   *
   * `opts.bpm` controls the tempo when notes are specified as quarter/eighth/etc.
   * — but for the kid-friendly path, just pass durations in seconds and ignore bpm.
   */
  A.music = function (track, opts) {
    opts = opts || {};
    let active = true;
    let currentSeq = null;

    function loop() {
      if (!active) return;
      currentSeq = A.sequence(track, opts);
      // Compute total duration to schedule the next loop iteration.
      let total = 0;
      const gap = opts.gap != null ? opts.gap : 0.03;
      for (const raw of track) {
        const note = typeof raw === 'string' ? { note: raw } : raw;
        total += (note.dur != null ? note.dur : 0.2) + gap;
      }
      setTimeout(loop, Math.max(50, total * 1000));
    }
    loop();

    return {
      pause()  { active = false; if (currentSeq) currentSeq.cancel(); },
      resume() { if (!active) { active = true; loop(); } },
      cancel() { active = false; if (currentSeq) currentSeq.cancel(); },
    };
  };
})();
