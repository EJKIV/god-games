// dialogue — text overlay + branching script runtime for the kid's game.
//
// Loaded via:
//   <script src="node_modules/@tellandshow/game-engine/dialogue/index.js"></script>
//
// Attaches `Engine.dialogue`. The kid authors a JSON script:
//
//   game/story/intro.json
//   {
//     "version": 1,
//     "speakers": { "ash": { "name": "Ash", "color": "#cc2222" }, ... },
//     "start": "node-1",
//     "nodes": {
//       "node-1": { "speaker": "ash", "text": "We need to find the relic.", "next": "node-2" },
//       "node-2": { "speaker": "narrator", "text": "Suddenly, a roar.", "choices": [
//         { "label": "Run.", "next": "node-flee" },
//         { "label": "Stand and fight.", "next": "node-fight" }
//       ]}
//     }
//   }
//
// At runtime:
//   const scene = await Engine.dialogue.load('game/story/intro.json');
//   Engine.dialogue.start(scene, { onEnd: () => Engine.setState('playing') });
//
// The runtime renders an overlay at the bottom of the canvas, typewriters
// the text in, and shows choice buttons when a node has them.

(function () {
  if (typeof window === 'undefined') return;
  const Engine = (window.Engine = window.Engine || {});
  Engine.dialogue = Engine.dialogue || {};
  const D = Engine.dialogue;

  // -------- Script loading --------

  /**
   * Fetch + parse a dialogue script from `path` (relative to the kid's index.html).
   * Returns the parsed scene object, or null on error.
   */
  D.load = async function (path) {
    if (typeof fetch !== 'function') return null;
    try {
      const r = await fetch(path);
      if (!r.ok) return null;
      const data = await r.json();
      if (!data || data.version !== 1 || !data.nodes || !data.start) return null;
      return data;
    } catch (_e) {
      return null;
    }
  };

  // -------- Active scene state --------
  let active = null; // { scene, currentNodeId, charIndex, onEnd, onChoice, paused }

  /**
   * Start a dialogue scene. Renders over the canvas until the scene reaches
   * a node with no `next` and no `choices`, then calls onEnd.
   *
   * @param {object} scene  parsed JSON from D.load
   * @param {object} [opts]
   * @param {function} [opts.onEnd]    called when the scene ends
   * @param {function} [opts.onChoice] called when the player picks a choice (label, next)
   * @param {number} [opts.cps=40]     characters per second for the typewriter
   */
  D.start = function (scene, opts) {
    if (!scene) return;
    active = {
      scene,
      currentNodeId: scene.start,
      charIndex: 0,
      onEnd: (opts && opts.onEnd) || null,
      onChoice: (opts && opts.onChoice) || null,
      cps: (opts && opts.cps) || 40,
      paused: false,
      revealStart: performance.now(),
    };
  };

  /** Advance past the current node (if it's text-only and finished revealing). */
  D.advance = function () {
    if (!active) return;
    const node = active.scene.nodes[active.currentNodeId];
    if (!node) { D.end(); return; }
    // If text is still typing, finish it instantly first.
    if (active.charIndex < node.text.length) {
      active.charIndex = node.text.length;
      return;
    }
    // No choices? Move to next node, or end.
    if (node.choices && node.choices.length) return; // wait for pickChoice
    if (!node.next) { D.end(); return; }
    active.currentNodeId = node.next;
    active.charIndex = 0;
    active.revealStart = performance.now();
  };

  /** Pick a choice on a branching node. */
  D.pickChoice = function (i) {
    if (!active) return;
    const node = active.scene.nodes[active.currentNodeId];
    if (!node || !node.choices) return;
    const choice = node.choices[i];
    if (!choice) return;
    if (active.onChoice) active.onChoice(choice.label, choice.next);
    if (!choice.next) { D.end(); return; }
    active.currentNodeId = choice.next;
    active.charIndex = 0;
    active.revealStart = performance.now();
  };

  /** Force end the scene. Calls onEnd. */
  D.end = function () {
    const wasActive = active;
    active = null;
    if (wasActive && wasActive.onEnd) wasActive.onEnd();
  };

  /** Is a scene playing right now? Used by game's onUpdate to skip gameplay. */
  D.isActive = function () { return active !== null; };

  // -------- Per-frame tick (typewriter advance) --------

  D.tick = function (dt) {
    if (!active || active.paused) return;
    const node = active.scene.nodes[active.currentNodeId];
    if (!node) { D.end(); return; }
    if (active.charIndex < node.text.length) {
      const elapsed = (performance.now() - active.revealStart) / 1000;
      const target = Math.floor(elapsed * active.cps);
      active.charIndex = Math.min(node.text.length, target);
    }
  };

  // -------- Render overlay --------

  D.render = function (ctx, opts) {
    if (!active) return;
    opts = opts || {};
    const node = active.scene.nodes[active.currentNodeId];
    if (!node) return;

    const W = ctx.canvas.width;
    const H = ctx.canvas.height;
    const boxH = Math.min(180, Math.floor(H * 0.36));
    const boxY = H - boxH - 10;

    // Backdrop.
    ctx.save();
    ctx.fillStyle = 'rgba(14, 13, 24, 0.92)';
    ctx.fillRect(10, boxY, W - 20, boxH);
    ctx.strokeStyle = '#3a3550';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, boxY, W - 20, boxH);

    // Speaker tag.
    const speakerKey = node.speaker || null;
    const speaker = speakerKey && active.scene.speakers ? active.scene.speakers[speakerKey] : null;
    if (speaker) {
      ctx.fillStyle = speaker.color || '#9d8df1';
      ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
      ctx.fillText(speaker.name || speakerKey, 24, boxY + 22);
    }

    // Text body (typewriter-revealed).
    const visibleText = node.text.slice(0, active.charIndex);
    ctx.fillStyle = '#e6e1f2';
    ctx.font = '15px -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
    wrapText(ctx, visibleText, 24, boxY + (speaker ? 46 : 30), W - 48, 22);

    // Choice buttons (if any) — only after text is fully revealed.
    if (active.charIndex >= node.text.length && node.choices && node.choices.length) {
      const baseY = boxY + boxH - 8 - node.choices.length * 26;
      for (let i = 0; i < node.choices.length; i++) {
        const c = node.choices[i];
        const y = baseY + i * 26;
        ctx.fillStyle = '#26213d';
        ctx.fillRect(24, y, W - 48, 22);
        ctx.fillStyle = '#9d8df1';
        ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
        ctx.fillText(`${i + 1}. ${c.label}`, 32, y + 16);
      }
    } else if (active.charIndex >= node.text.length) {
      // Continue indicator.
      ctx.fillStyle = '#7d779a';
      ctx.font = '11px -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
      ctx.fillText('press space to continue ▸', W - 200, boxY + boxH - 14);
    }

    ctx.restore();
  };

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    for (const word of words) {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, x, y);
        y += lineHeight;
        line = word;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, x, y);
  }

  // -------- Input integration helper --------
  // Kids' games can call this from onKeyDown to forward keys to the dialogue.
  // Returns true if dialogue handled the key (so the caller can skip game input).
  D.handleKey = function (event) {
    if (!active) return false;
    if (event.key === ' ' || event.key === 'Enter') {
      D.advance();
      return true;
    }
    // Number keys 1-4 pick choices.
    const node = active.scene.nodes[active.currentNodeId];
    if (node && node.choices && active.charIndex >= node.text.length) {
      const idx = parseInt(event.key, 10) - 1;
      if (idx >= 0 && idx < node.choices.length) {
        D.pickChoice(idx);
        return true;
      }
    }
    return false;
  };
})();
