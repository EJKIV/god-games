# manga/ — Portable manga-style canvas art library

A self-contained collection of manga visual effects, cinematic polish helpers, and per-character draw functions for HTML5 Canvas. **Zero dependencies.** Drop the folder into any project, include `manga/manga.js`, and you have access to `window.Manga`.

> Architectural details, conventions, and "where do I add X?" live in `manga/CLAUDE.md` (also as `manga/AGENTS.md` for non-Anthropic tools).

## Usage

```html
<script src="manga/manga.js"></script>
<script>
  // Stateless render effects
  Manga.effects.halftone(ctx, 0, 0, 800, 600, { density: 6, alpha: 0.4 });
  Manga.effects.speedLines(ctx, 200, 200, { count: 18, outerR: 120 });
  Manga.effects.sfxText(ctx, 200, 200, 'BAM!', { size: 64, color: '#ffd54a' });
  Manga.effects.flash(ctx, W, H, '#ff2200', 0.5);
  Manga.effects.vignette(ctx, W, H, { strength: 0.55 });
  Manga.effects.scanlines(ctx, W, H, { spacing: 3, alpha: 0.18 });
  Manga.effects.panelSplit(ctx, W, H, progress);

  // Stateful gameplay-feel helpers (factories)
  const punch = Manga.fx.cameraPunch();
  punch.trigger(8, -4, 0.22);
  // each frame: punch.update(dt); ctx.translate(punch.x, punch.y);

  const slomo = Manga.fx.slomo();
  slomo.trigger(0.25, 0.6);
  // each frame: dt = slomo.scaleDt(dt);

  Manga.fx.sfxLayered(audioCtx, [
    { freq: 110, type: 'sawtooth', dur: 0.5, vol: 0.4, slide: 55,  delay: 0   },
    { freq: 320, type: 'triangle', dur: 0.3, vol: 0.2, slide: 180, delay: 50  },
    { freq:  60, type: 'sine',     dur: 0.9, vol: 0.3,             delay: 120 },
  ]);

  // Characters
  Manga.characters.achilles.draw(ctx, {
    x: 200, y: 300, facing: 1, walkPhase: 0,
    vx: 0, hp: 5, hitFlash: 0, iframes: 0,
  });
</script>
```

## Layout

```
manga/
├── manga.js                  Loader — appends scripts in MANGA_FILES order.
├── effects/                  Stateless render effects (pure ctx-only).
│   ├── inkstroke.js          ctx setup helper
│   ├── halftone.js           cached pattern; clip to a shape for shadows
│   ├── speedlines.js         radial impact lines
│   ├── sfxtext.js            tilted comic text (BAM!, FALLEN!)
│   ├── panelsplit.js         death/transition slabs
│   ├── flash.js              full-screen color burst
│   ├── vignette.js           atmospheric radial dark fade
│   └── scanlines.js          horizontal CRT-feel stripes
├── fx/                       Stateful gameplay helpers (factories).
│   ├── camerapunch.js        .trigger(dx,dy,dur) / .update(dt)
│   ├── slomo.js              .trigger(factor,dur) / .scaleDt(dt)
│   └── sfxlayered.js         layered tone helper
└── characters/               { name, defaultState, polish, draw }
    ├── achilles.js           overhead bronze warrior + polish profile
    ├── orion.js              side-profile hunter (spear/stab + dodge poses)
    ├── scorpion.js           giant scorpion boss (tail/claw state machine)
    ├── icarus.js             flight-pose youth with damage-stage wings
    ├── eagle.js              left-flying bald eagle (dive + telegraph)
    ├── daedalus.js           inventor — flying / standing / rescue poses
    └── orca.js               killer whale breach (clipped to surface)
```

## API

### `Manga.effects` (stateless)

| Function | Purpose |
|---|---|
| `halftone(ctx, x, y, w, h, opts)`         | Manga screen-tone overlay. Cached per-pattern. |
| `animeEye(ctx, x, y, opts)`               | Tall anime eye with iris, catchlights, lash, and expression brow. |
| `animeCheek(ctx, x, y, opts)`             | Small cheek hatch marks for anime face reads. |
| `speedLines(ctx, cx, cy, opts)`           | Radial impact lines. |
| `sfxText(ctx, x, y, text, opts)`          | Tilted comic-style SFX text. |
| `panelSplit(ctx, W, H, progress, opts)`   | Slabs slide off-screen for death/transition. |
| `flash(ctx, W, H, color, alpha)`          | Full-screen color burst. |
| `vignette(ctx, W, H, opts)`               | Radial dark fade. |
| `scanlines(ctx, W, H, opts)`              | Horizontal stripes via cached pattern. |
| `inkStroke(ctx, w)`                       | Sets stroke style for bold black outlines. |

### `Manga.fx` (stateful factories)

| Factory             | Returned object methods                                     |
|---------------------|-------------------------------------------------------------|
| `cameraPunch()`     | `.trigger(dx, dy, duration)`, `.update(dt)`, `.x`, `.y`     |
| `slomo()`           | `.trigger(factor, duration)`, `.scaleDt(dt)`, `.scale`      |
| `sfxLayered(ac, layers)` | (function — plays a stack of `{freq,type,dur,vol,slide,delay}` tones) |

### `Manga.characters`

Each character module exports:

```js
window.Manga.characters.<name> = {
  name: '<name>',
  defaultState: { /* plain object the caller will adapt to */ },
  preview: { width, height, defaultPose },     // for future character viewer
  polish: {
    onHit:   { flashColor, punchIntensity, punchDuration, sfxText, slomoFactor, slomoDuration },
    onDeath: { slomoFactor, slomoDuration, panelSplit, sfxText, audioLayers },
    atmosphere: { vignetteStrength, scanlineAlpha, halftoneAlpha },
  },
  draw(ctx, state, opts = {}) { /* pure: only reads from state + opts */ },
};
```

`polish` is consumed by the **game**, not by the library — the game reads `Manga.characters.<name>.polish.onHit` (or `.onDeath`) and triggers `Manga.fx.cameraPunch().trigger(...)`, `Manga.fx.slomo().trigger(...)`, `Manga.fx.sfxLayered(...)` accordingly. This keeps the library free of runtime/game state while letting each character carry its own feel.

## Adding a new character

1. Create `manga/characters/<name>.js` following the shape above. Use only flat colors + `Manga.effects.inkStroke` + `Manga.effects.halftone` (clipped) inside `draw`.
2. Append `'characters/<name>.js'` to `MANGA_FILES` in `manga/manga.js`.
3. Document the character in `manga/CLAUDE.md` "Structure / Domain Map".

## Editing existing characters

Each character is a single file. Edit `draw` to change the look; edit `polish` to change how it *feels* on hit/death (without touching effect code). Build a tiny viewer page to scrub state if you're iterating heavily — see `manga/CLAUDE.md` "Commands" section for a one-canvas template.

## Use outside this project

```bash
cp -r manga/ /path/to/your/project/
```

Then `<script src="manga/manga.js">` and you're done. The library has no dependency on `engine.js`, no globals beyond `window.Manga`, and accepts an `AudioContext` parameter for SFX so it works in any audio-init flow.
