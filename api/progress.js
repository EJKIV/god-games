// God Games — Mystery progress sync API.
// GET  /api/progress?name=<player>          → { unlocks: {...}, counters: {...} }
// POST /api/progress  body { name, unlocks, counters }  → merges into stored state
//
// Storage: Upstash Redis SET/GET. One JSON blob per player keyed by
// sanitized name. Merge strategy:
//   • unlocks  — union with max(ts) wins (so the side that earned an
//                unlock most recently still wins, but a removal never
//                propagates — by design; mysteries are forever-state)
//   • counters — max(local, remote). A counter never goes backwards.
//
// Same env vars + name sanitization regex as api/leaderboard.js so the
// player name a kid types into the name modal round-trips identically
// across this endpoint and the leaderboard endpoint.

const REDIS_URL =
  process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN =
  process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const RATE_WINDOW_S = 60;
const RATE_MAX = 30;          // higher than leaderboard — progress writes are debounced but frequent
const MAX_UNLOCKS = 200;      // upper bound on a player's unlock count
const MAX_COUNTER_KEYS = 100; // upper bound on counter keys
const MAX_PAYLOAD_BYTES = 12_000;
const CORS_METHODS = 'GET, POST, OPTIONS';
const CORS_HEADERS = 'Content-Type';

async function redis(...command) {
  if (!REDIS_URL || !REDIS_TOKEN) {
    throw new Error('Redis env vars not configured.');
  }
  const res = await fetch(REDIS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Redis ${res.status}: ${txt}`);
  }
  const json = await res.json();
  return json.result;
}

function sanitizeName(raw) {
  if (typeof raw !== 'string') return null;
  let s = raw.replace(/[\x00-\x1f\x7f]/g, '').replace(/\s+/g, ' ').trim();
  if (!s) return null;
  if (s.length > 20) s = s.slice(0, 20);
  return s;
}

function clientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length) return xff.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function isLocalHost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

function originAllowed(req, origin) {
  if (!origin) return true;
  let parsed;
  try { parsed = new URL(origin); } catch (_e) { return false; }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
  if (isLocalHost(parsed.hostname)) return true;
  const host = String(req.headers.host || '').toLowerCase();
  return host && parsed.host.toLowerCase() === host;
}

function applyCors(req, res) {
  const origin = String(req.headers.origin || '');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', CORS_METHODS);
  res.setHeader('Access-Control-Allow-Headers', CORS_HEADERS);
  if (!origin) return true;
  if (!originAllowed(req, origin)) return false;
  res.setHeader('Access-Control-Allow-Origin', origin);
  return true;
}

async function rateLimit(ip) {
  const key = `rl:progress:${ip}`;
  const count = await redis('INCR', key);
  if (count === 1) await redis('EXPIRE', key, RATE_WINDOW_S);
  return count <= RATE_MAX;
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    if (req.body.length > MAX_PAYLOAD_BYTES) return null;
    try { return JSON.parse(req.body); } catch { return null; }
  }
  let buf = '';
  for await (const chunk of req) {
    buf += chunk;
    if (buf.length > MAX_PAYLOAD_BYTES) return null;
  }
  try { return JSON.parse(buf || '{}'); } catch { return null; }
}

function progressKey(name) {
  return `progress:${name}`;
}

async function loadProgress(name) {
  const raw = await redis('GET', progressKey(name));
  if (!raw || typeof raw !== 'string') return { unlocks: {}, counters: {} };
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return { unlocks: {}, counters: {} };
    return sanitizeIncoming(data);
  } catch (_e) { return { unlocks: {}, counters: {} }; }
}

async function saveProgress(name, state) {
  const wrapped = { _v: 1, _ts: Date.now(), unlocks: state.unlocks, counters: state.counters };
  await redis('SET', progressKey(name), JSON.stringify(wrapped));
}

// Validate + clamp incoming side. Drop anything that's not the right shape.
function sanitizeIncoming(side) {
  const out = { unlocks: Object.create(null), counters: Object.create(null) };
  if (!side || typeof side !== 'object') return out;
  if (side.unlocks && typeof side.unlocks === 'object') {
    let n = 0;
    for (const [k, v] of Object.entries(side.unlocks)) {
      if (!safeProgressKey(k)) continue;
      if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) continue;
      out.unlocks[k] = v;
      if (++n >= MAX_UNLOCKS) break;
    }
  }
  if (side.counters && typeof side.counters === 'object') {
    let n = 0;
    for (const [k, v] of Object.entries(side.counters)) {
      if (!safeProgressKey(k)) continue;
      if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) continue;
      out.counters[k] = Math.floor(v);
      if (++n >= MAX_COUNTER_KEYS) break;
    }
  }
  return out;
}

function safeProgressKey(k) {
  return typeof k === 'string'
    && k.length > 0
    && k.length <= 80
    && k !== '__proto__'
    && k !== 'constructor'
    && k !== 'prototype';
}

function mergeStates(stored, incoming) {
  const out = { unlocks: { ...stored.unlocks }, counters: { ...stored.counters } };
  for (const [k, ts] of Object.entries(incoming.unlocks)) {
    out.unlocks[k] = Math.max(out.unlocks[k] || 0, ts);
  }
  for (const [k, n] of Object.entries(incoming.counters)) {
    out.counters[k] = Math.max(out.counters[k] || 0, n);
  }
  return out;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!applyCors(req, res)) {
    res.statusCode = 403;
    res.end(JSON.stringify({ error: 'origin not allowed' }));
    return;
  }
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }

  try {
    if (req.method === 'GET') {
      const name = sanitizeName((req.query && req.query.name) || '');
      if (!name) { res.statusCode = 400; res.end(JSON.stringify({ error: 'name required' })); return; }
      const data = await loadProgress(name);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
      return;
    }

    if (req.method === 'POST') {
      const ip = clientIp(req);
      const ok = await rateLimit(ip);
      if (!ok) { res.statusCode = 429; res.end(JSON.stringify({ error: 'rate limited' })); return; }
      const body = await readJsonBody(req);
      if (!body) { res.statusCode = 400; res.end(JSON.stringify({ error: 'bad body' })); return; }
      const name = sanitizeName(body.name || '');
      if (!name) { res.statusCode = 400; res.end(JSON.stringify({ error: 'name required' })); return; }
      const incoming = sanitizeIncoming(body);
      const stored = await loadProgress(name);
      const merged = mergeStates(stored, incoming);
      await saveProgress(name, merged);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ unlocks: merged.unlocks, counters: merged.counters }));
      return;
    }

    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'method not allowed' }));
  } catch (e) {
    console.error('progress error:', e);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'internal error' }));
  }
}
