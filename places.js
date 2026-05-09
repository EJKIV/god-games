// places.js — God Games mythological location catalog.
//
// Each entry describes a "place" the player can be transported to as a
// reward for solving a mystery. The catalog is data-driven so future
// mysteries can be added by appending a new entry here + wiring a trigger
// in some game. place.html consumes this file and the mysteries.clues
// chain to render the actual scene.
//
// Each place has:
//   name     — big serif label shown over the scene
//   flavor   — italic subtitle, mythologically poetic
//   palette  — color tokens used by the silhouette + scene chrome
//   silhouette(ctx, W, H, t) — draw the location's background tableau.
//                              t is wall-clock seconds, drives gentle
//                              ambient motion (water shimmer, mist drift).
//   characterTransform(ctx, W, H) — optional. Lets the place adjust how
//                              the character is positioned/scaled inside
//                              it (e.g., Erebus places them lower, more
//                              shadowed). Default: centered, idle.

(function () {
  if (typeof window === 'undefined') return;
  window.GodGames = window.GodGames || {};

  const INK = '#0a0a0a';

  // Halftone helper — small cached pattern, used by every silhouette.
  let _ht = null;
  function halftone(ctx, x, y, w, h, alpha, color) {
    if (!_ht) {
      const tile = document.createElement('canvas');
      tile.width = tile.height = 6;
      const tc = tile.getContext('2d');
      tc.fillStyle = '#000';
      tc.beginPath(); tc.arc(3, 3, 1.2, 0, Math.PI * 2); tc.fill();
      _ht = ctx.createPattern(tile, 'repeat');
    }
    ctx.save();
    ctx.globalAlpha = alpha != null ? alpha : 0.4;
    ctx.fillStyle = color || _ht;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }

  // Ambient audio factory per place. Each entry's ambience(audioCtx) wires
  // oscillators/noise into audioCtx.destination and returns an object with
  //   .stop()           — fades out + disconnects everything
  // The pattern: layered low-volume oscillators + (optional) filtered noise
  // for texture. Player on the place page can hear the location's mood.
  function makeAmbience(setup) {
    return function (audioCtx) {
      const nodes = setup(audioCtx);
      const masterGain = audioCtx.createGain();
      const dryGain = audioCtx.createGain();
      const wetGain = audioCtx.createGain();
      const convolver = audioCtx.createConvolver();
      masterGain.gain.value = 0;
      dryGain.gain.value = 0.78;
      wetGain.gain.value = 0.18;
      convolver.buffer = reverbImpulse(audioCtx, 2.6, 2.4);
      dryGain.connect(masterGain);
      convolver.connect(wetGain);
      wetGain.connect(masterGain);
      masterGain.connect(audioCtx.destination);
      for (const n of nodes) {
        n.gain.connect(dryGain);
        n.gain.connect(convolver);
      }
      masterGain.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 1.2);
      return {
        stop() {
          masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
          masterGain.gain.setValueAtTime(masterGain.gain.value, audioCtx.currentTime);
          masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.6);
          setTimeout(() => {
            for (const n of nodes) {
              try { n.osc.stop(); } catch (_e) {}
              for (const x of n.extraOscs || []) try { x.stop(); } catch (_e) {}
              try { n.gain.disconnect(); } catch (_e) {}
              try { n.osc.disconnect(); } catch (_e) {}
            }
            try { dryGain.disconnect(); } catch (_e) {}
            try { convolver.disconnect(); } catch (_e) {}
            try { wetGain.disconnect(); } catch (_e) {}
            try { masterGain.disconnect(); } catch (_e) {}
          }, 700);
        },
      };
    };
  }
  function reverbImpulse(ac, seconds, decay) {
    const len = Math.max(1, Math.floor(ac.sampleRate * seconds));
    const buf = ac.createBuffer(2, len, ac.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        const t = i / len;
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay);
      }
    }
    return buf;
  }
  function tone(ac, freq, type, vol, slowMod) {
    const osc = ac.createOscillator(), gain = ac.createGain();
    const extraOscs = [];
    osc.type = type; osc.frequency.value = freq;
    gain.gain.value = vol;
    if (slowMod) {
      // Gentle LFO on gain so the tone breathes
      const lfo = ac.createOscillator(), lfoGain = ac.createGain();
      lfo.type = 'sine'; lfo.frequency.value = slowMod.rate;
      lfoGain.gain.value = slowMod.depth;
      lfo.connect(lfoGain); lfoGain.connect(gain.gain);
      lfo.start();
      extraOscs.push(lfo);
    }
    osc.connect(gain);
    osc.start();
    return { osc, gain, extraOscs };
  }
  function noise(ac, color) {
    const buf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      // Pink-ish noise via simple lowpass on white
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3;
    }
    const src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
    const filt = ac.createBiquadFilter();
    filt.type = color || 'bandpass';
    filt.frequency.value = 480;
    const gain = ac.createGain(); gain.gain.value = 0.09;
    src.connect(filt); filt.connect(gain);
    src.start();
    return { osc: src, gain };
  }

  window.GodGames.places = {
    // ────────────────────────────────────────────────────────────────────
    oceanus: {
      name: 'RIVER OCEANUS',
      flavor: 'the boundary where the world ends',
      palette: { sky: '#0c1828', deep: '#08203a', accent: '#88c8ff', mist: 'rgba(180,210,255,0.18)' },
      silhouette(ctx, W, H, t) {
        // Sky gradient → deep horizon
        const sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0,   '#0c1828');
        sky.addColorStop(0.55,'#0a2848');
        sky.addColorStop(1,   '#04101e');
        ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
        // Far stars sparser (outside-the-world feel)
        ctx.globalAlpha = 0.5;
        for (let i = 0; i < 70; i++) {
          const sx = (i * 137 + Math.sin(i * 7.3) * 50) % W;
          const sy = ((i * 89) % (H * 0.45));
          ctx.fillStyle = '#dfeeff';
          ctx.fillRect(sx, sy, 1.4, 1.4);
        }
        ctx.globalAlpha = 1;
        // Endless sea — encircling the world per the myth
        const seaY = H * 0.62;
        ctx.fillStyle = '#06182f';
        ctx.fillRect(0, seaY, W, H - seaY);
        // Halftone scrim on the water surface
        ctx.save();
        ctx.beginPath(); ctx.rect(0, seaY, W, H * 0.10); ctx.clip();
        halftone(ctx, 0, seaY, W, H * 0.10, 0.45, INK);
        ctx.restore();
        // Slow undulating horizon line
        ctx.strokeStyle = 'rgba(140,200,255,0.55)'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let x = 0; x <= W; x += 6) {
          const y = seaY + Math.sin(x * 0.012 + t * 0.8) * 4;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
        // The boundary — a pale arc rising from the horizon to denote the
        // edge of the world. Faint, hangs there mythologically.
        ctx.save();
        ctx.translate(W * 0.5, seaY);
        ctx.strokeStyle = 'rgba(136,200,255,0.35)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, W * 0.62, Math.PI, 0); ctx.stroke();
        ctx.restore();
        // Mist drifting low
        ctx.fillStyle = 'rgba(180,210,255,0.10)';
        for (let i = 0; i < 6; i++) {
          const mx = ((i * 220 + t * 18) % (W + 200)) - 100;
          ctx.beginPath();
          ctx.ellipse(mx, seaY - 18, 90 + i * 10, 12, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      },
      characterTransform(_ctx, W, H) {
        return { x: W * 0.5, y: H * 0.62 - 4, scale: 1.05 };
      },
      // Low ocean swell + a single distant ringing bell — boundary of the world
      ambience: makeAmbience((ac) => {
        const swell = tone(ac, 55,  'sine',     0.20, { rate: 0.15, depth: 0.10 });
        const drone = tone(ac, 110, 'sine',     0.08, { rate: 0.08, depth: 0.04 });
        const bell  = tone(ac, 880, 'triangle', 0.04, { rate: 0.05, depth: 0.04 });
        const surf  = noise(ac, 'lowpass');
        return [swell, drone, bell, surf];
      }),
    },

    // ────────────────────────────────────────────────────────────────────
    asphodel: {
      name: 'ASPHODEL MEADOWS',
      flavor: 'where neutral souls walk in gray',
      palette: { sky: '#1c1d24', deep: '#34343a', accent: '#bfbcae', mist: 'rgba(180,180,170,0.22)' },
      silhouette(ctx, W, H, t) {
        // Flat gray sky — the field is famously colorless
        ctx.fillStyle = '#1c1d24'; ctx.fillRect(0, 0, W, H);
        // Halftone scrim across the upper sky
        halftone(ctx, 0, 0, W, H * 0.55, 0.20, INK);
        // The meadow — pale gray ground stretching to the horizon
        const groundY = H * 0.65;
        ctx.fillStyle = '#3a3a3a'; ctx.fillRect(0, groundY, W, H - groundY);
        // Asphodel stalks scattered (faint vertical strokes)
        ctx.strokeStyle = 'rgba(220,218,200,0.35)'; ctx.lineWidth = 1.2;
        for (let i = 0; i < 90; i++) {
          const sx = (i * 173 + Math.sin(i * 1.3) * 40) % W;
          const sy = groundY + ((i * 17) % (H - groundY - 20));
          const sh = 8 + (i % 5) * 3;
          ctx.beginPath(); ctx.moveTo(sx, sy + sh); ctx.lineTo(sx, sy);
          ctx.stroke();
          // Tiny pale flower head
          ctx.fillStyle = 'rgba(230,225,210,0.4)';
          ctx.beginPath(); ctx.arc(sx, sy, 1.4, 0, Math.PI * 2); ctx.fill();
        }
        // Drifting souls — pale silhouettes far in the distance
        ctx.fillStyle = 'rgba(200,200,196,0.18)';
        for (let i = 0; i < 7; i++) {
          const ph = 30 + (i % 3) * 8;
          const px = ((i * 200 + t * 6) % (W + 200)) - 100;
          const py = groundY - ph - 4 + Math.sin(t * 0.3 + i) * 2;
          ctx.beginPath();
          ctx.ellipse(px, py - ph * 0.25, 9, ph * 0.45, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillRect(px - 7, py - ph * 0.55, 14, ph);
        }
        // Horizon line — bold ink
        ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(W, groundY); ctx.stroke();
      },
      characterTransform(_ctx, W, H) {
        return { x: W * 0.45, y: H * 0.65 - 6, scale: 1.0 };
      },
      // Grey hush — soft pink noise with a barely-there midrange drone
      ambience: makeAmbience((ac) => {
        const drone = tone(ac, 165, 'sine',  0.05, { rate: 0.10, depth: 0.03 });
        const fifth = tone(ac, 247, 'sine',  0.03, { rate: 0.07, depth: 0.02 });
        const hush  = noise(ac, 'bandpass');
        return [drone, fifth, hush];
      }),
    },

    // ────────────────────────────────────────────────────────────────────
    erebus: {
      name: 'EREBUS',
      flavor: 'the gloom before the underworld',
      palette: { sky: '#0a0418', deep: '#1c0a26', accent: '#a070d0', mist: 'rgba(80,40,120,0.30)' },
      silhouette(ctx, W, H, t) {
        // Deep purple-black void
        const sky = ctx.createRadialGradient(W/2, H * 0.4, 40, W/2, H * 0.4, Math.max(W, H));
        sky.addColorStop(0,   '#1a0a26');
        sky.addColorStop(1,   '#02000a');
        ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
        // Halftone shadow — covers most of the frame
        halftone(ctx, 0, 0, W, H, 0.55, INK);
        // Two pale columns — the threshold to Hades
        const colY = H * 0.30, colH = H * 0.55;
        for (const colX of [W * 0.32, W * 0.68]) {
          ctx.fillStyle = '#1c1224';
          ctx.fillRect(colX - 16, colY, 32, colH);
          // Halftone shading on the right side of each column
          ctx.save();
          ctx.beginPath(); ctx.rect(colX, colY, 16, colH); ctx.clip();
          halftone(ctx, colX, colY, 16, colH, 0.55, INK);
          ctx.restore();
          // Top + bottom blocks
          ctx.fillStyle = '#160820';
          ctx.fillRect(colX - 22, colY - 10, 44, 12);
          ctx.fillRect(colX - 22, colY + colH - 2, 44, 12);
          // Bold ink outline
          ctx.strokeStyle = INK; ctx.lineWidth = 3;
          ctx.strokeRect(colX - 16, colY, 32, colH);
        }
        // A dim violet glow from the gateway between the columns
        const glow = ctx.createRadialGradient(W/2, colY + colH * 0.6, 8, W/2, colY + colH * 0.6, W * 0.18);
        glow.addColorStop(0,   `rgba(160,112,208,${0.30 + Math.sin(t * 1.2) * 0.05})`);
        glow.addColorStop(1,   'rgba(160,112,208,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, W, H);
        // Slowly drifting motes
        ctx.fillStyle = 'rgba(190,150,230,0.7)';
        for (let i = 0; i < 12; i++) {
          const mx = ((i * 113 + t * 4) % W);
          const my = (((i * 71) % H) + Math.sin(t * 0.6 + i) * 10);
          ctx.beginPath(); ctx.arc(mx, my, 1.4, 0, Math.PI * 2); ctx.fill();
        }
      },
      characterTransform(_ctx, W, H) {
        return { x: W * 0.5, y: H * 0.78, scale: 0.95 };
      },
      // Deep drone + sub-rumble — the gloom before Hades
      ambience: makeAmbience((ac) => {
        const sub   = tone(ac, 41,  'sine',     0.30, { rate: 0.08, depth: 0.10 });
        const drone = tone(ac, 82,  'sawtooth', 0.06, { rate: 0.06, depth: 0.04 });
        const ghost = tone(ac, 220, 'triangle', 0.03, { rate: 0.18, depth: 0.10 });
        return [sub, drone, ghost];
      }),
    },

    // ────────────────────────────────────────────────────────────────────
    lethe: {
      name: 'LETHE',
      flavor: 'the river of forgetting',
      palette: { sky: '#101824', deep: '#0d2532', accent: '#5a8db0', mist: 'rgba(145,180,205,0.22)' },
      silhouette(ctx, W, H, t) {
        ctx.fillStyle = '#101824';
        ctx.fillRect(0, 0, W, H);
        halftone(ctx, 0, 0, W, H * 0.58, 0.22, INK);

        const riverY = H * 0.56;
        ctx.fillStyle = '#071821';
        ctx.fillRect(0, riverY, W, H - riverY);
        ctx.fillStyle = '#102c3b';
        ctx.beginPath();
        ctx.moveTo(0, riverY + 18);
        for (let x = 0; x <= W; x += 28) {
          ctx.lineTo(x, riverY + Math.sin(x * 0.013 + t * 0.45) * 7 + 18);
        }
        ctx.lineTo(W, H);
        ctx.lineTo(0, H);
        ctx.closePath();
        ctx.fill();
        halftone(ctx, 0, riverY + 8, W, H - riverY, 0.28, INK);

        // Black banks pressing the river into a narrow path.
        ctx.fillStyle = INK;
        ctx.beginPath();
        ctx.moveTo(0, riverY + 10);
        ctx.lineTo(W * 0.22, riverY + 42);
        ctx.lineTo(W * 0.10, H);
        ctx.lineTo(0, H);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(W, riverY + 4);
        ctx.lineTo(W * 0.75, riverY + 46);
        ctx.lineTo(W * 0.90, H);
        ctx.lineTo(W, H);
        ctx.closePath();
        ctx.fill();

        // Slow memory ripples, almost erased as they widen.
        ctx.strokeStyle = 'rgba(120,175,205,0.52)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 7; i++) {
          const rx = (i * 181 + Math.sin(i * 4.1) * 35) % W;
          const ry = riverY + 38 + ((i * 43) % (H - riverY - 72));
          const pulse = ((t * 0.28 + i * 0.17) % 1);
          ctx.globalAlpha = 0.42 * (1 - pulse);
          ctx.beginPath();
          ctx.ellipse(rx, ry, 18 + pulse * 56, 5 + pulse * 12, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // Reed silhouettes and forgetful mist.
        ctx.strokeStyle = 'rgba(150,185,205,0.34)';
        ctx.lineWidth = 1.2;
        for (let i = 0; i < 36; i++) {
          const side = i % 2 ? W * 0.18 : W * 0.82;
          const sx = side + Math.sin(i * 2.4) * 42;
          const sy = riverY + 20 + ((i * 23) % (H - riverY - 36));
          ctx.beginPath();
          ctx.moveTo(sx, sy + 28);
          ctx.quadraticCurveTo(sx + Math.sin(i) * 8, sy + 12, sx + Math.sin(i * 1.7) * 11, sy);
          ctx.stroke();
        }
        ctx.fillStyle = 'rgba(170,205,225,0.12)';
        for (let i = 0; i < 6; i++) {
          const mx = ((i * 190 + t * 12) % (W + 180)) - 90;
          ctx.beginPath();
          ctx.ellipse(mx, riverY - 14 + Math.sin(t * 0.35 + i) * 6, 120, 15, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      },
      characterTransform(_ctx, W, H) {
        return { x: W * 0.50, y: H * 0.62, scale: 1.0 };
      },
      // Slow water + a fading memory tone.
      ambience: makeAmbience((ac) => {
        const current = tone(ac, 73,  'sine',     0.11, { rate: 0.10, depth: 0.06 });
        const memory  = tone(ac, 392, 'triangle', 0.035, { rate: 0.04, depth: 0.045 });
        const echo    = tone(ac, 196, 'sine',     0.03, { rate: 0.06, depth: 0.03 });
        const water   = noise(ac, 'lowpass');
        return [current, memory, echo, water];
      }),
    },

    // ────────────────────────────────────────────────────────────────────
    tartarus: {
      name: 'TARTARUS',
      flavor: 'the deep prison of titans',
      palette: { sky: '#12050a', deep: '#050102', accent: '#702030', mist: 'rgba(112,32,48,0.28)' },
      silhouette(ctx, W, H, t) {
        ctx.fillStyle = '#12050a';
        ctx.fillRect(0, 0, W, H);
        halftone(ctx, 0, 0, W, H, 0.40, INK);

        const pitY = H * 0.42;
        ctx.fillStyle = '#050102';
        ctx.beginPath();
        ctx.moveTo(W * 0.18, pitY);
        ctx.lineTo(W * 0.82, pitY);
        ctx.lineTo(W * 0.96, H);
        ctx.lineTo(W * 0.04, H);
        ctx.closePath();
        ctx.fill();

        // Jagged prison walls, black against red stone.
        ctx.fillStyle = '#1d080b';
        for (let i = 0; i < 9; i++) {
          const x = i * W / 8;
          const h = H * (0.18 + (i % 3) * 0.05);
          ctx.beginPath();
          ctx.moveTo(x - W * 0.08, pitY);
          ctx.lineTo(x + W * 0.04, pitY - h);
          ctx.lineTo(x + W * 0.14, pitY);
          ctx.closePath();
          ctx.fill();
        }
        ctx.strokeStyle = INK;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(W * 0.18, pitY);
        ctx.lineTo(W * 0.82, pitY);
        ctx.stroke();

        // Heavy bars in the foreground.
        ctx.fillStyle = INK;
        for (let i = 0; i < 8; i++) {
          const bx = W * 0.24 + i * W * 0.074;
          ctx.fillRect(bx, H * 0.20, 9, H * 0.62);
        }
        ctx.fillRect(W * 0.22, H * 0.32, W * 0.58, 8);
        ctx.fillRect(W * 0.22, H * 0.62, W * 0.58, 8);

        // Chain links, slightly trembling in the hot dark.
        ctx.strokeStyle = '#702030';
        ctx.lineWidth = 4;
        for (let c = 0; c < 3; c++) {
          const cx = W * (0.30 + c * 0.20);
          for (let i = 0; i < 6; i++) {
            const cy = H * 0.18 + i * 34 + Math.sin(t * 1.3 + i + c) * 1.5;
            ctx.save();
            ctx.translate(cx + Math.sin(i) * 8, cy);
            ctx.rotate((i % 2 ? 0.35 : -0.35));
            ctx.beginPath();
            ctx.ellipse(0, 0, 9, 17, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }
        }

        // Titan-scale forms, barely visible behind the bars.
        ctx.fillStyle = 'rgba(112,32,48,0.26)';
        ctx.beginPath();
        ctx.ellipse(W * 0.50, H * 0.72, W * 0.26, H * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(W * 0.35, H * 0.58, W * 0.10, H * 0.07, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(W * 0.65, H * 0.58, W * 0.10, H * 0.07, 0.4, 0, Math.PI * 2);
        ctx.fill();
      },
      characterTransform(_ctx, W, H) {
        return { x: W * 0.50, y: H * 0.78, scale: 0.90 };
      },
      // Chain clatter over a deep sub-rumble.
      ambience: makeAmbience((ac) => {
        const sub     = tone(ac, 36,   'sine',     0.32, { rate: 0.07, depth: 0.10 });
        const iron    = tone(ac, 147,  'sawtooth', 0.035, { rate: 0.90, depth: 0.06 });
        const clatter = tone(ac, 1175, 'square',   0.018, { rate: 1.40, depth: 0.045 });
        const grit    = noise(ac, 'bandpass');
        return [sub, iron, clatter, grit];
      }),
    },

    // ────────────────────────────────────────────────────────────────────
    elysium: {
      name: 'ELYSIUM',
      flavor: 'the bright fields of the blessed',
      palette: { sky: '#202538', deep: '#2f321c', accent: '#ffd54a', mist: 'rgba(255,213,74,0.18)' },
      silhouette(ctx, W, H, t) {
        ctx.fillStyle = '#202538';
        ctx.fillRect(0, 0, W, H);
        halftone(ctx, 0, 0, W, H * 0.55, 0.18, INK);

        const fieldY = H * 0.58;
        ctx.fillStyle = '#2f321c';
        ctx.fillRect(0, fieldY, W, H - fieldY);
        ctx.fillStyle = '#4a4721';
        ctx.beginPath();
        ctx.moveTo(0, fieldY + 24);
        for (let x = 0; x <= W; x += 40) {
          ctx.lineTo(x, fieldY + 18 + Math.sin(x * 0.01 + t * 0.25) * 5);
        }
        ctx.lineTo(W, H);
        ctx.lineTo(0, H);
        ctx.closePath();
        ctx.fill();
        halftone(ctx, 0, fieldY, W, H - fieldY, 0.20, INK);

        // Distant grove and simple blessed figures.
        ctx.fillStyle = INK;
        for (let i = 0; i < 8; i++) {
          const tx = W * 0.08 + i * W * 0.12;
          const ty = fieldY - 12 + Math.sin(i) * 4;
          ctx.fillRect(tx - 3, ty - 44, 6, 44);
          ctx.beginPath();
          ctx.ellipse(tx, ty - 48, 18, 26, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = 'rgba(255,235,150,0.32)';
        for (let i = 0; i < 7; i++) {
          const px = ((i * 170 + t * 5) % (W + 140)) - 70;
          const py = fieldY - 18 + Math.sin(t * 0.35 + i) * 3;
          ctx.beginPath();
          ctx.ellipse(px, py - 18, 8, 18, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(px - 5, py - 20, 10, 28);
        }

        // Flower sparks in the foreground.
        for (let i = 0; i < 115; i++) {
          const fx = (i * 157) % W;
          const fy = fieldY + 30 + ((i * 31) % (H - fieldY - 42));
          ctx.fillStyle = i % 3 === 0 ? '#ffd54a' : 'rgba(245,232,180,0.50)';
          ctx.beginPath();
          ctx.arc(fx, fy, 1.3 + (i % 2), 0, Math.PI * 2);
          ctx.fill();
        }

        // A still gold horizon, like daylight without a visible sun.
        ctx.strokeStyle = 'rgba(255,213,74,0.70)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(W * 0.08, fieldY - 8);
        ctx.lineTo(W * 0.92, fieldY - 8);
        ctx.stroke();
      },
      characterTransform(_ctx, W, H) {
        return { x: W * 0.48, y: H * 0.62, scale: 1.05 };
      },
      // Bright major triad + light wind.
      ambience: makeAmbience((ac) => {
        const root  = tone(ac, 262, 'sine',     0.045, { rate: 0.08, depth: 0.025 });
        const third = tone(ac, 330, 'sine',     0.035, { rate: 0.07, depth: 0.020 });
        const fifth = tone(ac, 392, 'triangle', 0.030, { rate: 0.06, depth: 0.018 });
        const wind  = noise(ac, 'highpass');
        return [root, third, fifth, wind];
      }),
    },

    // ────────────────────────────────────────────────────────────────────
    olympus: {
      name: 'MOUNT OLYMPUS',
      flavor: 'the seat of the gods',
      palette: { sky: '#161b2a', deep: '#261d16', accent: '#ffe080', mist: 'rgba(255,224,128,0.22)' },
      silhouette(ctx, W, H, t) {
        ctx.fillStyle = '#161b2a';
        ctx.fillRect(0, 0, W, H);
        halftone(ctx, 0, 0, W, H * 0.62, 0.20, INK);

        const baseY = H * 0.78;
        ctx.fillStyle = '#0a0a0a';
        ctx.beginPath();
        ctx.moveTo(W * 0.08, baseY);
        ctx.lineTo(W * 0.30, H * 0.56);
        ctx.lineTo(W * 0.42, H * 0.66);
        ctx.lineTo(W * 0.55, H * 0.34);
        ctx.lineTo(W * 0.70, H * 0.62);
        ctx.lineTo(W * 0.88, H * 0.48);
        ctx.lineTo(W, baseY);
        ctx.lineTo(W, H);
        ctx.lineTo(0, H);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#2a261b';
        ctx.beginPath();
        ctx.moveTo(W * 0.27, baseY);
        ctx.lineTo(W * 0.55, H * 0.37);
        ctx.lineTo(W * 0.80, baseY);
        ctx.closePath();
        ctx.fill();
        halftone(ctx, W * 0.28, H * 0.38, W * 0.50, H * 0.40, 0.24, INK);

        // Palace columns on the high ridge.
        const colBase = H * 0.43;
        ctx.fillStyle = '#e5c870';
        for (let i = 0; i < 6; i++) {
          const x = W * 0.43 + i * W * 0.035;
          ctx.fillRect(x, colBase - 54, 8, 54);
        }
        ctx.fillRect(W * 0.415, colBase - 64, W * 0.22, 10);
        ctx.fillRect(W * 0.405, colBase, W * 0.24, 8);
        ctx.strokeStyle = INK;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(W * 0.415, colBase - 64, W * 0.22, 72);

        // Thunderclouds and lightning cuts.
        ctx.fillStyle = 'rgba(12,14,22,0.86)';
        for (let i = 0; i < 5; i++) {
          const cx = W * (0.18 + i * 0.18) + Math.sin(t * 0.18 + i) * 8;
          const cy = H * (0.20 + (i % 2) * 0.05);
          ctx.beginPath();
          ctx.ellipse(cx, cy, W * 0.11, H * 0.035, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.strokeStyle = '#ffe080';
        ctx.lineWidth = 2.2;
        ctx.globalAlpha = 0.35 + Math.max(0, Math.sin(t * 1.7)) * 0.25;
        for (let i = 0; i < 3; i++) {
          const lx = W * (0.28 + i * 0.22);
          ctx.beginPath();
          ctx.moveTo(lx, H * 0.24);
          ctx.lineTo(lx - 12, H * 0.32);
          ctx.lineTo(lx + 10, H * 0.31);
          ctx.lineTo(lx - 6, H * 0.43);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;

        ctx.fillStyle = 'rgba(255,224,128,0.12)';
        for (let i = 0; i < 4; i++) {
          const mx = ((i * 250 + t * 10) % (W + 160)) - 80;
          ctx.beginPath();
          ctx.ellipse(mx, H * 0.50 + Math.sin(t * 0.3 + i) * 5, 120, 17, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      },
      characterTransform(_ctx, W, H) {
        return { x: W * 0.50, y: H * 0.78, scale: 0.98 };
      },
      // High airy drone + distant lightning.
      ambience: makeAmbience((ac) => {
        const air     = tone(ac, 523, 'sine',     0.035, { rate: 0.05, depth: 0.025 });
        const crown   = tone(ac, 784, 'triangle', 0.020, { rate: 0.04, depth: 0.018 });
        const thunder = tone(ac, 49,  'sine',     0.24, { rate: 0.12, depth: 0.12 });
        const storm   = noise(ac, 'lowpass');
        return [air, crown, thunder, storm];
      }),
    },

    // ────────────────────────────────────────────────────────────────────
    // Reserved for future mysteries — silhouettes are stubs that future
    // commits can flesh out. Left here so adding a mystery only needs a
    // mysteries.clues entry, not a fresh place too.
    dreams: {
      name: 'LAND OF DREAMS',
      flavor: 'where ghosts of dreams dwell beyond the streams',
      palette: { sky: '#180c2a', deep: '#2a1248', accent: '#aa44ff', mist: 'rgba(170,68,255,0.20)' },
      silhouette(ctx, W, H, t) {
        const sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#0e0820'); sky.addColorStop(1, '#22102e');
        ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
        halftone(ctx, 0, 0, W, H, 0.30, INK);
        // Floating shapes — abstract dream silhouettes
        for (let i = 0; i < 5; i++) {
          const cx = ((i * 220 + t * 6) % (W + 200)) - 100;
          const cy = H * 0.35 + Math.sin(t * 0.5 + i) * 28;
          ctx.fillStyle = `rgba(170, 68, 255, ${0.10 + (i % 3) * 0.05})`;
          ctx.beginPath();
          ctx.ellipse(cx, cy, 90 + i * 6, 30 + i * 3, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      },
      characterTransform(_ctx, W, H) { return { x: W * 0.5, y: H * 0.7, scale: 1.0 }; },
      // Airy chimes — the dream-realm
      ambience: makeAmbience((ac) => {
        const a = tone(ac, 392, 'sine', 0.04, { rate: 0.20, depth: 0.06 });
        const b = tone(ac, 587, 'sine', 0.03, { rate: 0.16, depth: 0.05 });
        const c = tone(ac, 784, 'sine', 0.02, { rate: 0.13, depth: 0.04 });
        return [a, b, c];
      }),
    },
  };
})();
