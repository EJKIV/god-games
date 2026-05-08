# myth-discovery — engine extractions worked example

**Note:** this example intentionally shows the older in-level overlay fallback
using `Manga.fx.cinematic()`. For the current God Games production pattern,
where discovery leaves the level for a dedicated mythological place scene, use
`examples/myth-place-cut/`.

A 30-second tour showing how a fresh kid game can compose three of the
engine's portable surfaces:

- `Manga.fx.cinematic()` — mythology-vignette overlay on discovery.
- `Engine.unlock` — persistent flags + counters that survive reloads.
- `Engine.dialogue.drawBubble` — inline NPC speech bubble.

## Run

From the repo root (`tellandshow/game-studio/packages/game-engine`):

```bash
python3 -m http.server 8765
# → http://localhost:8765/examples/myth-discovery/
```

Or open `index.html` directly in a browser; relative `<script src>` paths
walk up to `core/`, `unlock/`, `dialogue/`, `manga/`.

## What it shows

- Walk with arrow keys around the arena.
- A faint golden spiral pulses in the upper-right — that's a hidden glyph.
- Touch it: a `LAND OF DREAMS` cinematic fades in over the screen, the
  `marks found` counter increments, and `myth.dreamer_mark` is set.
- Reload the page: the glyph stays bright (already collected), the counter
  remembers, and the NPC line changes from cryptic to acknowledging.

## Source map

The whole game lives in `index.html` (~150 lines). Read top-to-bottom to see:

1. `Engine.boot({...})` lifecycle — `onInit` / `onUpdate` / `onRender`.
2. `cinematic = Manga.fx.cinematic()` once, drive `cinematic.update(dt)` +
   `cinematic.render(ctx, W, H)` in the loop, `cinematic.trigger(...)` on
   the discovery moment.
3. `Engine.unlock.set(id)` to persist flags. `Engine.unlock.tally(key)` for
   counters. `.has(id)` and `.count(key)` to read.
4. `Engine.dialogue.drawBubble(ctx, opts)` for inline speech bubbles. (The
   heavier `Engine.dialogue.start(scene)` JSON-script runtime is right
   next to it for full cutscenes; this example sticks to the bubble.)

A kid layering their own mystery on top would: pick a hidden mark, pick a
mythology location for the cinematic, write the NPC's one-liner. Done.
