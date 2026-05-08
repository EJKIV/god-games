# myth-place-cut - scene-cut mystery example

This is the current God Games pattern for a myth discovery:

1. The level hides a subtle spot.
2. Touching it calls `GodGames.Mysteries.unlockAndDepart({ hintId, placeId, fromGame })`.
3. The mystery state is saved with `Engine.unlock`.
4. The player leaves the level for `place.html`, a quiet scene that reveals the mythological place.

The real God Games project has a full `mysteries.js`, `places.js`, clue chain,
and Redis sync. This example keeps the same shape with a tiny inline shim so a
kid game can copy the pattern without needing the God Games repo.

## Run

From the package root:

```bash
python3 -m http.server 8765
# open http://localhost:8765/examples/myth-place-cut/
```

Or open `index.html` directly in a browser. The script paths walk up to the
package's `core/`, `unlock/`, and `manga/` folders.

## How to Extend

- Change the hidden spot in `index.html` by editing `SPOT`.
- Change the unlock key by passing a different `hintId`.
- Add more destinations by moving the inline `PLACE` object in `place.html`
  into a small catalog object keyed by `placeId`.
- Keep the discovery cryptic. Let the art and mythology hint at the secret;
  do not put control instructions inside the scene.

Use `examples/myth-discovery/` only when you specifically want the older
in-level overlay fallback powered by `Manga.fx.cinematic`.
