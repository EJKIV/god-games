// level — JSON level loader + tile/entity runtime helpers.
//
// Loaded via:
//   <script src="node_modules/@tellandshow/game-engine/level/index.js"></script>
//
// Attaches `Engine.level`. The kid authors levels as JSON:
//
//   game/levels/forest-1.json
//   {
//     "version": 1,
//     "id": "forest-1",
//     "name": "The Outer Forest",
//     "biome": "forest",
//     "tileSize": 32,
//     "width": 20,         // tiles
//     "height": 12,
//     "tiles": [           // row-major; each cell is a tile id from `tileset`
//       "0000000000000000WWWW",
//       ...
//     ],
//     "tileset": {
//       "0": { "kind": "ground", "color": "#3a5a3a" },
//       "W": { "kind": "wall",   "color": "#222",    "solid": true }
//     },
//     "entities": [
//       { "id": "spawn",  "kind": "player-spawn", "x": 64,  "y": 64 },
//       { "id": "goblin1", "kind": "enemy", "ref": "goblin", "x": 320, "y": 96 }
//     ],
//     "exit": { "x": 600, "y": 64, "w": 32, "h": 32, "next": "forest-2" }
//   }
//
// Engine.level.load(path) returns the level + helpers:
//   level.tileAt(tileX, tileY)             → tileset entry or null
//   level.tilePxAt(pxX, pxY)               → same, but takes pixel coords
//   level.eachEntity(kind, fn)             → iterate entities of a kind
//   level.entity(id)                        → look up by id
//   level.bounds()                          → { x: 0, y: 0, w, h } in pixels
//   level.solidAt(pxX, pxY)                 → boolean — for collision against walls
//
// The visual level editor in the builder UI is a separate piece (M3.6+).
// This module is just the data layer + runtime helpers.

(function () {
  if (typeof window === 'undefined') return;
  const Engine = (window.Engine = window.Engine || {});
  Engine.level = Engine.level || {};
  const L = Engine.level;

  /**
   * Fetch + parse a level from `path`. Returns the level object with
   * helper methods attached, or null on error.
   */
  L.load = async function (path) {
    if (typeof fetch !== 'function') return null;
    try {
      const r = await fetch(path);
      if (!r.ok) return null;
      const data = await r.json();
      return L.fromData(data);
    } catch (_e) {
      return null;
    }
  };

  /**
   * Build a level object from parsed JSON. Useful for tests + when the kid
   * has the data inline rather than fetched from a file.
   */
  L.fromData = function (data) {
    if (!data || data.version !== 1) return null;
    if (!Array.isArray(data.tiles) || typeof data.tileSize !== 'number') return null;

    const tileSize = data.tileSize;
    const width  = data.width  || (data.tiles[0] ? data.tiles[0].length : 0);
    const height = data.height || data.tiles.length;
    const tileset = data.tileset || {};
    const entities = Array.isArray(data.entities) ? [...data.entities] : [];
    const exit = data.exit || null;

    function tileAt(tileX, tileY) {
      if (tileX < 0 || tileY < 0 || tileX >= width || tileY >= height) return null;
      const row = data.tiles[tileY];
      if (!row) return null;
      const ch = row[tileX];
      return tileset[ch] || null;
    }

    function tilePxAt(pxX, pxY) {
      return tileAt(Math.floor(pxX / tileSize), Math.floor(pxY / tileSize));
    }

    function solidAt(pxX, pxY) {
      const t = tilePxAt(pxX, pxY);
      return !!(t && t.solid);
    }

    function eachEntity(kindOrFn, fn) {
      // Two call shapes: eachEntity('enemy', fn) or eachEntity(fn) (all).
      if (typeof kindOrFn === 'function') {
        for (const e of entities) kindOrFn(e);
        return;
      }
      for (const e of entities) {
        if (e.kind === kindOrFn) fn(e);
      }
    }

    function entity(id) {
      return entities.find((e) => e.id === id) || null;
    }

    function bounds() {
      return { x: 0, y: 0, w: width * tileSize, h: height * tileSize };
    }

    return {
      ...data,
      width,
      height,
      tileSize,
      entities,
      exit,
      tileAt, tilePxAt, solidAt, eachEntity, entity, bounds,
    };
  };

  /**
   * Render a level's tiles to ctx. Skips the camera-clipped region.
   * Kids' main.js typically calls this in onRender before drawing entities.
   */
  L.render = function (ctx, level, camera) {
    if (!level) return;
    camera = camera || { x: 0, y: 0 };
    const tileSize = level.tileSize;
    const startX = Math.max(0, Math.floor(camera.x / tileSize));
    const startY = Math.max(0, Math.floor(camera.y / tileSize));
    const endX = Math.min(level.width,  Math.ceil((camera.x + ctx.canvas.width)  / tileSize));
    const endY = Math.min(level.height, Math.ceil((camera.y + ctx.canvas.height) / tileSize));
    for (let ty = startY; ty < endY; ty++) {
      for (let tx = startX; tx < endX; tx++) {
        const tile = level.tileAt(tx, ty);
        if (!tile) continue;
        ctx.fillStyle = tile.color || '#444';
        ctx.fillRect(tx * tileSize - camera.x, ty * tileSize - camera.y, tileSize, tileSize);
      }
    }
  };

  /**
   * AABB collision against solid tiles. Returns the resolved (x, y) for the
   * mover after collision response (axis-separated). Kid uses this in their
   * movement step:
   *   const next = Engine.level.collide(level, player, dx, dy);
   *   player.x = next.x;
   *   player.y = next.y;
   */
  L.collide = function (level, mover, dx, dy) {
    if (!level) return { x: mover.x + dx, y: mover.y + dy };
    let nx = mover.x + dx;
    let ny = mover.y + dy;
    // X-axis check
    if (anySolidInRect(level, nx, mover.y, mover.w, mover.h)) {
      nx = mover.x; // reject move
    }
    // Y-axis check (using x already resolved)
    if (anySolidInRect(level, nx, ny, mover.w, mover.h)) {
      ny = mover.y;
    }
    return { x: nx, y: ny };
  };

  function anySolidInRect(level, x, y, w, h) {
    const ts = level.tileSize;
    const x1 = Math.floor(x / ts), y1 = Math.floor(y / ts);
    const x2 = Math.floor((x + w - 1) / ts), y2 = Math.floor((y + h - 1) / ts);
    for (let ty = y1; ty <= y2; ty++) {
      for (let tx = x1; tx <= x2; tx++) {
        const t = level.tileAt(tx, ty);
        if (t && t.solid) return true;
      }
    }
    return false;
  }
})();
