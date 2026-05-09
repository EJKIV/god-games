// God Games — Hall of Gods leaderboard API.
// GET  /api/leaderboard?game=icarus&limit=25  → { entries: [{name, score, ts}, ...] }
// POST /api/leaderboard  body {game, name, score} → { rank, entries }
//
// Storage: Upstash Redis sorted sets via REST API.
// Required env: KV_REST_API_URL + KV_REST_API_TOKEN, OR
//               UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN.

const REDIS_URL =
  process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN =
  process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

// Each game has a "mortal" board (normal mode) and a parallel "-manga" board
// (manga easter-egg mode) so the two cohorts don't share rankings.
const GAMES = {
  icarus:           { order: 'desc', min: 0,    max: 10_000_000 },
  orion:            { order: 'asc',  min: 1000, max: 3_600_000  },
  achilles:         { order: 'desc', min: 0,    max: 10_000_000 },
  perseus:          { order: 'desc', min: 0,    max: 10_000_000 },
  'icarus-manga':   { order: 'desc', min: 0,    max: 10_000_000 },
  'orion-manga':    { order: 'asc',  min: 1000, max: 3_600_000  },
  'achilles-manga': { order: 'desc', min: 0,    max: 10_000_000 },
  'perseus-manga':  { order: 'desc', min: 0,    max: 10_000_000 },
};

const TOP_N = 25;
const RATE_WINDOW_S = 60;
const RATE_MAX = 5;
const MAX_PAYLOAD_BYTES = 4_000;

// ── Redis helpers ──────────────────────────────────────────────────────────
async function redis(...command) {
  if (!REDIS_URL || !REDIS_TOKEN) {
    throw new Error('Redis env vars not configured. Provision Vercel KV / Upstash and link it to this project.');
  }
  const res = await fetch(REDIS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Redis ${res.status}: ${txt}`);
  }
  const json = await res.json();
  return json.result;
}

// Member format: "<name>|<ts>" — same name can appear multiple times.
function packMember(name, ts) {
  return `${name}|${ts}`;
}
function unpackMember(member) {
  const idx = member.lastIndexOf('|');
  if (idx === -1) return { name: member, ts: 0 };
  return { name: member.slice(0, idx), ts: Number(member.slice(idx + 1)) || 0 };
}

// ── Validation ─────────────────────────────────────────────────────────────
function sanitizeName(raw) {
  if (typeof raw !== 'string') return null;
  // strip control chars, collapse whitespace
  let s = raw.replace(/[\x00-\x1f\x7f]/g, '').replace(/\s+/g, ' ').trim();
  if (!s) return null;
  if (s.length > 20) s = s.slice(0, 20);
  return s;
}

function validateGame(g) {
  return typeof g === 'string' && Object.prototype.hasOwnProperty.call(GAMES, g);
}

function validateScore(game, score) {
  if (typeof score !== 'number' || !Number.isFinite(score)) return false;
  const cfg = GAMES[game];
  return score >= cfg.min && score <= cfg.max;
}

// ── Rate limit ─────────────────────────────────────────────────────────────
async function rateLimit(ip) {
  const key = `rl:${ip}`;
  const count = await redis('INCR', key);
  if (count === 1) await redis('EXPIRE', key, RATE_WINDOW_S);
  return count <= RATE_MAX;
}

function clientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length) return xff.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

// ── Read top N ─────────────────────────────────────────────────────────────
async function fetchTop(game, limit) {
  const cfg = GAMES[game];
  const cmd = cfg.order === 'desc' ? 'ZREVRANGE' : 'ZRANGE';
  const flat = await redis(cmd, `leaderboard:${game}`, 0, limit - 1, 'WITHSCORES');
  if (!Array.isArray(flat)) return [];
  const entries = [];
  for (let i = 0; i < flat.length; i += 2) {
    const { name, ts } = unpackMember(flat[i]);
    const score = Number(flat[i + 1]);
    entries.push({ name, score, ts });
  }
  return entries;
}

// ── Body parsing (Vercel passes parsed JSON in req.body when content-type is JSON,
// but we defend against the raw-stream case too) ──────────────────────────
async function readJsonBody(req) {
  if (bodyTooLarge(req)) return null;
  let parsedBody;
  try { parsedBody = req.body; } catch (_e) { return null; }
  if (parsedBody && typeof parsedBody === 'object') return parsedBody;
  if (typeof parsedBody === 'string') {
    if (parsedBody.length > MAX_PAYLOAD_BYTES) return null;
    try { return JSON.parse(parsedBody); } catch { return null; }
  }
  // raw stream fallback
  let buf = '';
  for await (const chunk of req) {
    buf += chunk;
    if (buf.length > MAX_PAYLOAD_BYTES) return null;
  }
  try { return JSON.parse(buf || '{}'); } catch { return null; }
}

function bodyTooLarge(req) {
  const raw = req.headers?.['content-length'];
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = Number(value);
  return Number.isFinite(n) && n > MAX_PAYLOAD_BYTES;
}

// ── Handler ────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  try {
    if (req.method === 'GET') {
      const game = req.query?.game;
      if (!validateGame(game)) {
        return res.status(400).json({ error: 'invalid game' });
      }
      const limit = Math.min(TOP_N, Math.max(1, parseInt(req.query?.limit, 10) || TOP_N));
      const entries = await fetchTop(game, limit);
      return res.status(200).json({ entries });
    }

    if (req.method === 'POST') {
      const body = await readJsonBody(req);
      if (!body) return res.status(400).json({ error: 'invalid json' });
      const { game, score } = body;
      const name = sanitizeName(body.name) || 'NAMELESS MORTAL';

      if (!validateGame(game)) return res.status(400).json({ error: 'invalid game' });
      if (!validateScore(game, score)) return res.status(400).json({ error: 'invalid score' });

      const ip = clientIp(req);
      if (!(await rateLimit(ip))) {
        return res.status(429).json({ error: 'too many submissions, try again soon' });
      }

      const ts = Date.now();
      const member = packMember(name, ts);
      await redis('ZADD', `leaderboard:${game}`, score, member);

      const cfg = GAMES[game];
      const rankZeroBased = cfg.order === 'desc'
        ? await redis('ZREVRANK', `leaderboard:${game}`, member)
        : await redis('ZRANK',    `leaderboard:${game}`, member);
      const rank = (typeof rankZeroBased === 'number') ? rankZeroBased + 1 : null;

      const entries = await fetchTop(game, TOP_N);
      return res.status(200).json({ rank, entries });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    console.error('leaderboard error:', err);
    return res.status(500).json({ error: 'internal error' });
  }
}
