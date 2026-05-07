// physics — collision primitives + spatial hash for the kid's game.
//
// Loaded via:
//   <script src="node_modules/@tellandshow/game-engine/physics/index.js"></script>
//
// On load, attaches itself to `Engine.physics` (which the engine.js core
// initialises as an empty object so this can attach without timing concerns).
// Each kid's game opts in to physics by including this script tag — adds
// ~3KB minified, zero deps, no build step.
//
// Pedagogy: kids call `Engine.physics.overlaps(a, b)` and get back a boolean.
// Each shape is a plain `{x, y, w, h}` (rect) or `{x, y, r}` (circle) — no
// classes, no `new`, just objects the kid already understands.

(function () {
  if (typeof window === 'undefined') return;
  // Engine.physics may already be initialised by engine.js core; merge so we
  // don't clobber anything the engine attached at boot.
  const Engine = (window.Engine = window.Engine || {});
  Engine.physics = Engine.physics || {};
  const P = Engine.physics;

  // -------- Shape predicates --------

  /** True if `s` looks like {x, y, w, h}. */
  P.isRect = function (s) {
    return s && typeof s.x === 'number' && typeof s.y === 'number' &&
           typeof s.w === 'number' && typeof s.h === 'number';
  };

  /** True if `s` looks like {x, y, r}. */
  P.isCircle = function (s) {
    return s && typeof s.x === 'number' && typeof s.y === 'number' &&
           typeof s.r === 'number';
  };

  // -------- Overlap tests --------

  /** AABB overlap. Both args are {x, y, w, h} where x/y is the top-left. */
  P.rectRect = function (a, b) {
    return a.x < b.x + b.w &&
           a.x + a.w > b.x &&
           a.y < b.y + b.h &&
           a.y + a.h > b.y;
  };

  /** Two circles overlap if center distance < sum of radii. */
  P.circleCircle = function (a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const rsum = a.r + b.r;
    return dx * dx + dy * dy < rsum * rsum;
  };

  /** Rect (top-left x/y, w/h) and circle (center x/y, r). */
  P.rectCircle = function (rect, circle) {
    // Closest point on the rect to the circle center.
    const cx = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
    const cy = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
    const dx = cx - circle.x;
    const dy = cy - circle.y;
    return dx * dx + dy * dy < circle.r * circle.r;
  };

  /**
   * Auto-dispatch overlap test. Kids usually just want `overlaps(a, b)` —
   * we figure out the shape from the object's fields.
   */
  P.overlaps = function (a, b) {
    const aIsRect = P.isRect(a);
    const aIsCircle = P.isCircle(a);
    const bIsRect = P.isRect(b);
    const bIsCircle = P.isCircle(b);
    if (aIsRect && bIsRect) return P.rectRect(a, b);
    if (aIsCircle && bIsCircle) return P.circleCircle(a, b);
    if (aIsRect && bIsCircle) return P.rectCircle(a, b);
    if (aIsCircle && bIsRect) return P.rectCircle(b, a);
    return false;
  };

  // -------- Distance helpers --------

  /** Squared distance between two points. Skip the sqrt when comparing distances. */
  P.distSq = function (a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return dx * dx + dy * dy;
  };

  /** Euclidean distance between two points (or shapes — uses their x/y). */
  P.dist = function (a, b) {
    return Math.sqrt(P.distSq(a, b));
  };

  // -------- Swept collision (one moving rect vs static rect) --------

  /**
   * Swept-AABB: where along the move-vector does `mover` first hit `obstacle`?
   * Returns null if no collision; otherwise `{ t, nx, ny }` where t is the
   * fraction of the move (0..1) at which contact happens, and (nx,ny) is the
   * collision normal pointing away from obstacle.
   *
   * Useful for "stop before you walk into the wall" — the kid runs the move
   * up to t, then either stops, slides, or bounces.
   */
  P.sweptRect = function (mover, dx, dy, obstacle) {
    const expandX = obstacle.x - mover.w;
    const expandY = obstacle.y - mover.h;
    const expandW = obstacle.w + mover.w;
    const expandH = obstacle.h + mover.h;

    let xEntryDist, xExitDist, yEntryDist, yExitDist;
    if (dx > 0) { xEntryDist = expandX - mover.x; xExitDist = (expandX + expandW) - mover.x; }
    else        { xEntryDist = (expandX + expandW) - mover.x; xExitDist = expandX - mover.x; }
    if (dy > 0) { yEntryDist = expandY - mover.y; yExitDist = (expandY + expandH) - mover.y; }
    else        { yEntryDist = (expandY + expandH) - mover.y; yExitDist = expandY - mover.y; }

    const xEntry = dx === 0 ? -Infinity : xEntryDist / dx;
    const xExit  = dx === 0 ?  Infinity : xExitDist  / dx;
    const yEntry = dy === 0 ? -Infinity : yEntryDist / dy;
    const yExit  = dy === 0 ?  Infinity : yExitDist  / dy;

    const entry = Math.max(xEntry, yEntry);
    const exit  = Math.min(xExit, yExit);

    if (entry > exit || (xEntry < 0 && yEntry < 0) || entry > 1) return null;

    let nx = 0, ny = 0;
    if (xEntry > yEntry) nx = dx > 0 ? -1 : 1;
    else                 ny = dy > 0 ? -1 : 1;

    return { t: entry, nx, ny };
  };

  // -------- SpatialHash --------

  /**
   * Cheap broad-phase. Kids' games probably never need this — direct loop
   * over a few dozen entities is plenty. But once they hit "100 enemies on
   * screen" the hash keeps frame time linear instead of quadratic.
   *
   * Usage:
   *   const grid = Engine.physics.SpatialHash(64);
   *   grid.clear();
   *   for (const e of enemies) grid.insert(e);
   *   const near = grid.query({ x, y, r: 100 });   // all enemies within ~100px
   */
  P.SpatialHash = function (cellSize) {
    const size = cellSize || 64;
    const cells = new Map();

    function key(cx, cy) { return cx + ':' + cy; }

    function bucketsForBounds(x1, y1, x2, y2) {
      const cx1 = Math.floor(x1 / size);
      const cy1 = Math.floor(y1 / size);
      const cx2 = Math.floor(x2 / size);
      const cy2 = Math.floor(y2 / size);
      const out = [];
      for (let cy = cy1; cy <= cy2; cy++) {
        for (let cx = cx1; cx <= cx2; cx++) out.push(key(cx, cy));
      }
      return out;
    }

    return {
      cellSize: size,
      clear() { cells.clear(); },
      insert(obj) {
        let buckets;
        if (P.isRect(obj))   buckets = bucketsForBounds(obj.x, obj.y, obj.x + obj.w, obj.y + obj.h);
        else if (P.isCircle(obj)) buckets = bucketsForBounds(obj.x - obj.r, obj.y - obj.r, obj.x + obj.r, obj.y + obj.r);
        else                 buckets = [key(Math.floor(obj.x / size), Math.floor(obj.y / size))];
        for (const k of buckets) {
          if (!cells.has(k)) cells.set(k, []);
          cells.get(k).push(obj);
        }
      },
      /** Query objects whose bucket overlaps the query shape. May return duplicates — caller dedupes if needed. */
      query(shape) {
        let buckets;
        if (P.isRect(shape))   buckets = bucketsForBounds(shape.x, shape.y, shape.x + shape.w, shape.y + shape.h);
        else if (P.isCircle(shape)) buckets = bucketsForBounds(shape.x - shape.r, shape.y - shape.r, shape.x + shape.r, shape.y + shape.r);
        else                  buckets = [key(Math.floor(shape.x / size), Math.floor(shape.y / size))];
        const seen = new Set();
        const out = [];
        for (const k of buckets) {
          const bucket = cells.get(k);
          if (!bucket) continue;
          for (const obj of bucket) {
            if (!seen.has(obj)) { seen.add(obj); out.push(obj); }
          }
        }
        return out;
      },
    };
  };
})();
