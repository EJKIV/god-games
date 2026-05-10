// manga/fx/zeusstrike.js — Zeus appears, charges, throws a lightning bolt,
// strikes a target, screen flashes, smoke lingers. Stateful sequence.
//
// Phases (timeline driven by `t`):
//   0.00–0.70  charge   — Zeus visible at (fromX,fromY) raising arm; charge glow grows + whistle
//   0.70–0.82  bolt     — jagged lightning path drawn (high frequency flicker)
//   0.82–1.20  impact   — full-screen white flash + speed lines + boom
//   1.20–2.40  aftermath— smoke/glow at impact site fading out
//   2.40+      done     — caller frees the instance
//
// Usage:
//   const strike = Manga.fx.zeusStrike({
//     fromX, fromY,           // Zeus origin (atop Mount Olympus)
//     toX, toY,               // strike target (player)
//     audioCtx,               // caller-supplied AudioContext
//     onImpact: () => { ... } // fires once when bolt lands (good place to flip a state flag)
//     onDone:   () => { ... }
//   });
//   strike.start();
//   // each frame: strike.update(dt); strike.render(ctx, W, H);
//   if (strike.done) cleanup;

(function () {
  const M = (window.Manga = window.Manga || { effects: {}, characters: {}, fx: {}, INK: '#0a0a0a' });

  function generateBolt(x1, y1, x2, y2, segs) {
    const path = [{ x: x1, y: y1 }];
    const dx = x2 - x1, dy = y2 - y1;
    const perpX = -dy, perpY = dx;
    const len = Math.sqrt(perpX * perpX + perpY * perpY) || 1;
    const px = perpX / len, py = perpY / len;
    for (let i = 1; i < segs; i++) {
      const t = i / segs;
      const jitter = (Math.random() - 0.5) * 100 * Math.sin(Math.PI * t); // peak in middle
      path.push({
        x: x1 + dx * t + px * jitter,
        y: y1 + dy * t + py * jitter,
      });
    }
    path.push({ x: x2, y: y2 });
    // 1–2 small branches splintering off near the middle
    const branches = [];
    for (let b = 0; b < 2; b++) {
      const bi = 2 + Math.floor(Math.random() * (path.length - 4));
      const start = path[bi];
      const target = {
        x: start.x + (Math.random() - 0.5) * 220,
        y: start.y + Math.random() * 80,
      };
      const sub = [start];
      for (let j = 1; j < 4; j++) {
        const tj = j / 4;
        sub.push({
          x: start.x + (target.x - start.x) * tj + (Math.random() - 0.5) * 30,
          y: start.y + (target.y - start.y) * tj + (Math.random() - 0.5) * 20,
        });
      }
      sub.push(target);
      branches.push(sub);
    }
    return { main: path, branches };
  }

  function drawZeus(ctx, x, y, charge, blink) {
    ctx.save();
    ctx.translate(x, y);
    // Aura behind Zeus, growing with charge
    ctx.save();
    ctx.shadowColor = '#cce8ff';
    ctx.shadowBlur = 12 + charge * 60;
    ctx.fillStyle = `rgba(170, 215, 255, ${0.18 + charge * 0.25})`;
    ctx.beginPath(); ctx.arc(0, -10, 60 + charge * 40, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Robe (white-gold flowing)
    ctx.fillStyle = '#fff5d8';
    ctx.beginPath();
    ctx.moveTo(-26, -8);
    ctx.lineTo(-34, 70);
    ctx.lineTo(34, 70);
    ctx.lineTo(26, -8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = M.INK; ctx.lineWidth = 3.5; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.stroke();
    // Robe folds
    ctx.strokeStyle = '#c8b878'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-12, -2); ctx.lineTo(-14, 65); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(  0, -2); ctx.lineTo(  0, 68); ctx.stroke();
    ctx.beginPath(); ctx.moveTo( 12, -2); ctx.lineTo( 14, 65); ctx.stroke();
    // Belt
    ctx.strokeStyle = '#b8902a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-26, 18); ctx.lineTo(26, 18); ctx.stroke();

    // Left arm at side
    ctx.strokeStyle = '#e8c89a'; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-22, -4); ctx.quadraticCurveTo(-32, 12, -28, 32); ctx.stroke();
    ctx.strokeStyle = M.INK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-22, -4); ctx.quadraticCurveTo(-32, 12, -28, 32); ctx.stroke();

    // Right arm raised holding bolt
    const armEndX = 30, armEndY = -50 - charge * 16;
    ctx.strokeStyle = '#e8c89a'; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(22, -4); ctx.quadraticCurveTo(28, -28, armEndX, armEndY); ctx.stroke();
    ctx.strokeStyle = M.INK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(22, -4); ctx.quadraticCurveTo(28, -28, armEndX, armEndY); ctx.stroke();

    // Charging bolt in hand
    ctx.save();
    ctx.translate(armEndX, armEndY);
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 12 + charge * 28;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.7 + 0.3 * blink})`;
    ctx.beginPath();
    const sz = 8 + charge * 8;
    ctx.moveTo(-sz * 0.3, -sz);
    ctx.lineTo(sz * 0.5,  -sz * 0.2);
    ctx.lineTo(0,         -sz * 0.3);
    ctx.lineTo(sz * 0.6,   sz * 0.7);
    ctx.lineTo(-sz * 0.4,  sz * 0.1);
    ctx.lineTo(sz * 0.1,  -sz * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#aaddff'; ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // Head + beard. Zeus is a transition-screen character, so he uses the
    // same anime-eye language as the playable manga sprites.
    ctx.fillStyle = '#e8c89a';
    ctx.beginPath(); ctx.ellipse(0, -29, 14.5, 16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = M.INK; ctx.lineWidth = 2.5; ctx.stroke();
    // Hair (white windblown, sharper anime silhouette)
    ctx.fillStyle = '#f4f4f4';
    ctx.beginPath();
    ctx.moveTo(-15, -33);
    ctx.lineTo(-26, -46);
    ctx.lineTo(-16, -39);
    ctx.quadraticCurveTo(-10, -48, -2, -43);
    ctx.quadraticCurveTo(8, -49, 16, -39);
    ctx.lineTo(25, -45);
    ctx.lineTo(15, -25);
    ctx.lineTo(-15, -24);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = M.INK; ctx.lineWidth = 1.5; ctx.stroke();
    // Beard
    ctx.fillStyle = '#fafafa';
    ctx.beginPath();
    ctx.moveTo(-10, -22); ctx.quadraticCurveTo(-12, -8, 0, -2);
    ctx.quadraticCurveTo(12, -8, 10, -22); ctx.lineTo(8, -18);
    ctx.quadraticCurveTo(0, -14, -8, -18); ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = M.INK; ctx.lineWidth = 1.5; ctx.stroke();
    if (M.effects && typeof M.effects.animeEye === 'function') {
      M.effects.animeEye(ctx, -5.2, -29.4, {
        sx: 0.62, sy: 0.58, iris: blink > 0.5 ? '#aaddff' : '#5f6f86',
        mood: 'focus', outline: 1.15,
      });
      M.effects.animeEye(ctx, 5.2, -29.4, {
        sx: 0.62, sy: 0.58, iris: blink > 0.5 ? '#aaddff' : '#5f6f86',
        mood: 'focus', outline: 1.15,
      });
    } else {
      ctx.fillStyle = M.INK;
      ctx.beginPath(); ctx.ellipse(-5, -28, 1.5, 2.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse( 5, -28, 1.5, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    }
    // Brow (angry, heavy enough to survive the glow)
    ctx.strokeStyle = M.INK; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-11, -36); ctx.lineTo(-1.5, -33); ctx.stroke();
    ctx.beginPath(); ctx.moveTo( 11, -36); ctx.lineTo( 1.5, -33); ctx.stroke();

    ctx.restore();
  }

  function drawBolt(ctx, bolt, intensity) {
    if (!bolt) return;
    function strokePath(path, w, color, glow) {
      ctx.save();
      ctx.shadowColor = glow || color;
      ctx.shadowBlur = w * 4;
      ctx.strokeStyle = color;
      ctx.lineWidth = w;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
      ctx.stroke();
      ctx.restore();
    }
    // Outer glow halo
    strokePath(bolt.main, 16 * intensity, 'rgba(170,215,255,0.5)', '#aaddff');
    // Mid layer
    strokePath(bolt.main, 7 * intensity, 'rgba(220,240,255,0.95)', '#ffffff');
    // Hot core
    strokePath(bolt.main, 2.5, '#ffffff', '#ffffff');
    // Branches
    for (const b of bolt.branches) {
      strokePath(b, 6 * intensity, 'rgba(170,215,255,0.4)', '#aaddff');
      strokePath(b, 2, '#ffffff', '#ffffff');
    }
  }

  function playCharge(ac) {
    if (!ac) return;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(160, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(1400, ac.currentTime + 0.7);
    g.gain.setValueAtTime(0.001, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.10, ac.currentTime + 0.15);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.7);
    o.connect(g); g.connect(ac.destination);
    o.start(); o.stop(ac.currentTime + 0.7);
  }

  M.fx.zeusStrike = function (opts) {
    const fromX = opts.fromX, fromY = opts.fromY;
    const toX = opts.toX, toY = opts.toY;
    const audioCtx = opts.audioCtx;
    const onImpact = opts.onImpact;
    const onDone = opts.onDone;

    return {
      t: 0,
      phase: 'charge',
      done: false,
      _impactFired: false,
      _bolt: null,
      _started: false,

      start() {
        this._started = true;
        playCharge(audioCtx);
      },

      update(dt) {
        if (!this._started) return;
        this.t += dt;
        if (this.t < 0.70) {
          this.phase = 'charge';
        } else if (this.t < 0.82) {
          if (!this._bolt) this._bolt = generateBolt(fromX, fromY, toX, toY, 10);
          this.phase = 'bolt';
        } else if (this.t < 1.20) {
          this.phase = 'impact';
          if (!this._impactFired) {
            this._impactFired = true;
            if (audioCtx && M.fx.sfxLayered) {
              M.fx.sfxLayered(audioCtx, [
                { freq:  60, type: 'sine',     dur: 1.2, vol: 0.5,  slide:   30, delay: 0   },
                { freq: 220, type: 'square',   dur: 0.4, vol: 0.45, slide:   80, delay: 0   },
                { freq:1800, type: 'sawtooth', dur: 0.3, vol: 0.22, slide:  600, delay: 20  },
                { freq:  90, type: 'sawtooth', dur: 0.7, vol: 0.30, slide:   40, delay: 80  },
              ]);
            }
            if (onImpact) onImpact();
          }
        } else if (this.t < 2.40) {
          this.phase = 'aftermath';
        } else {
          if (!this.done) {
            this.done = true;
            if (onDone) onDone();
          }
        }
      },

      render(ctx, W, H) {
        if (!this._started || this.done) return;

        // Charge — Zeus visible (still during bolt phase too).
        if (this.phase === 'charge' || this.phase === 'bolt') {
          const charge = Math.min(1, this.t / 0.70);
          const blink = Math.sin(this.t * 50) * 0.5 + 0.5;
          drawZeus(ctx, fromX, fromY, charge, blink);
        }

        // Bolt — jagged path. Flicker by re-randomizing on every other frame for chaos.
        if (this.phase === 'bolt') {
          if (Math.random() < 0.4) this._bolt = generateBolt(fromX, fromY, toX, toY, 10);
          drawBolt(ctx, this._bolt, 1);
        }

        // Impact — full-screen white flash + outward speed lines.
        if (this.phase === 'impact') {
          const k = (this.t - 0.82) / 0.38; // 0..1
          // Flash decays from full-bright to transparent
          const a = Math.pow(1 - k, 1.3) * 0.92;
          ctx.save();
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = a;
          ctx.fillRect(0, 0, W, H);
          ctx.restore();
          // Speed lines bursting from impact
          if (M.effects.speedLines) {
            M.effects.speedLines(ctx, toX, toY, {
              count: 32, innerR: 36, outerR: 240 + (1 - k) * 80,
              color: 'rgba(255,255,255,0.85)', width: 4, jitter: 0.6,
            });
            M.effects.speedLines(ctx, toX, toY, {
              count: 18, innerR: 50, outerR: 320 + (1 - k) * 60,
              color: 'rgba(170,220,255,0.6)', width: 2.5, jitter: 0.4,
            });
          }
        }

        // Aftermath — smoke/glow lingering at impact site, fades out.
        if (this.phase === 'aftermath') {
          const k = (this.t - 1.20) / 1.20;
          const a = Math.max(0, 1 - k);
          ctx.save();
          // Smoke disc
          ctx.fillStyle = `rgba(60, 60, 80, ${0.35 * a})`;
          ctx.beginPath();
          ctx.arc(toX, toY, 80 + k * 80, 0, Math.PI * 2);
          ctx.fill();
          // Inner glow
          ctx.shadowColor = '#aaddff';
          ctx.shadowBlur = 30 * a;
          ctx.fillStyle = `rgba(200, 230, 255, ${0.4 * a})`;
          ctx.beginPath();
          ctx.arc(toX, toY, 30 + k * 30, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      },
    };
  };
})();
