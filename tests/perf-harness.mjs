// tests/perf-harness.mjs
//
// Repeatable browser performance and fairness smoke for gameplay surfaces.
// Measures desktop/mobile, manga on/off, and cold/warm loads. Fails on:
//   - unexpected 4xx/5xx responses or request failures
//   - uncaught JS errors or console.error calls
//   - p95 requestAnimationFrame delta over budget
//   - gameplay-vs-visual drift over the debug overlay budget

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

let puppeteer;
try {
  puppeteer = require('puppeteer-core');
} catch (_e) {
  console.error('puppeteer-core not installed. Run:');
  console.error('  npm install --no-save puppeteer-core');
  process.exit(2);
}

const CHROME = process.env.CHROME_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = (process.env.BASE_URL || 'http://localhost:8765').replace(/\/$/, '');
const DURATION_MS = Number(process.env.PERF_DURATION_MS || 1800);
const SETTLE_MS = Number(process.env.PERF_SETTLE_MS || 650);
const DRIFT_BUDGET = Number(process.env.PERF_DRIFT_RATIO || 0.35);
const DESKTOP_P95_MS = Number(process.env.PERF_DESKTOP_P95_MS || 34);
const MOBILE_P95_MS = Number(process.env.PERF_MOBILE_P95_MS || 50);

const VIEWPORTS = [
  { id: 'desktop', budget: DESKTOP_P95_MS, viewport: { width: 1440, height: 900, deviceScaleFactor: 1 } },
  { id: 'mobile', budget: MOBILE_P95_MS, viewport: { width: 812, height: 375, deviceScaleFactor: 2, isMobile: true, hasTouch: true } },
];

const ROUTES = [
  { id: 'hub', path: 'index.html', start: false, needsDebug: true },
  { id: 'achilles', path: 'achilles.html', startKey: ' ', needsDebug: true },
  { id: 'icarus', path: 'icarus.html', startKey: 'ArrowUp', needsDebug: true },
  { id: 'orion', path: 'orion.html', startKey: ' ', needsDebug: true },
  { id: 'perseus', path: 'perseus.html', startKey: ' ', needsDebug: true },
];

const onlyArg = process.argv.find((arg) => arg.startsWith('--only='));
const only = onlyArg ? new Set(onlyArg.slice('--only='.length).split(',').map((s) => s.trim()).filter(Boolean)) : null;
const routes = ROUTES.filter((route) => !only || only.has(route.id));

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createContext(browser) {
  if (typeof browser.createBrowserContext === 'function') return browser.createBrowserContext();
  return browser.createIncognitoBrowserContext();
}

function scenarioUrl(route) {
  const sep = route.path.includes('?') ? '&' : '?';
  return `${BASE}/${route.path}${sep}perfHarness=1`;
}

function makeSink() {
  return {
    responses: [],
    pageErrors: [],
    consoleErrors: [],
    failedRequests: [],
  };
}

async function instrumentPage(page, sink) {
  page.on('pageerror', (err) => sink.pageErrors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (/favicon/i.test(text)) return;
    sink.consoleErrors.push(text);
  });
  page.on('requestfailed', (req) => {
    const failure = req.failure();
    sink.failedRequests.push({
      url: req.url(),
      method: req.method(),
      error: failure ? failure.errorText : 'request failed',
    });
  });
  page.on('response', (res) => {
    const status = res.status();
    if (status < 400) return;
    sink.responses.push({ url: res.url(), status });
  });

  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const url = new URL(req.url());
    if (url.pathname === '/favicon.ico') {
      req.respond({ status: 204 }).catch(() => {});
      return;
    }
    if (url.pathname === '/api/progress') {
      req.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ unlocks: {}, counters: {} }),
      }).catch(() => {});
      return;
    }
    if (url.pathname === '/api/leaderboard') {
      const body = req.method() === 'GET'
        ? { game: url.searchParams.get('game') || null, scores: [] }
        : { ok: true, rank: null };
      req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify(body) }).catch(() => {});
      return;
    }
    req.continue().catch(() => {});
  });
}

async function seedPage(page, manga) {
  await page.evaluateOnNewDocument((mangaOn) => {
    localStorage.setItem('godgames_playerName', 'PERF');
    localStorage.removeItem('godgames_debug');
    localStorage.setItem('godgames_perf', 'balanced');
    localStorage.setItem('icarus_lastPlay', String(Date.now()));
    if (mangaOn) localStorage.setItem('godgames_manga', '1');
    else localStorage.removeItem('godgames_manga');
  }, manga);
}

async function newScenarioPage(context, sink, viewport, manga, cold) {
  const page = await context.newPage();
  await page.setViewport(viewport);
  await page.setCacheEnabled(!cold);
  await instrumentPage(page, sink);
  await seedPage(page, manga);
  return page;
}

async function gotoMeasured(page, route) {
  const t0 = Date.now();
  await page.goto(scenarioUrl(route), { waitUntil: 'load', timeout: 45000 });
  return Date.now() - t0;
}

async function startRoute(page, route) {
  await page.evaluate(() => {
    window.GodGames = window.GodGames || {};
    window.GodGames.suppressDepart = true;
  });
  await sleep(SETTLE_MS);
  if (route.start === false) return;
  await page.keyboard.press(route.startKey || ' ');
  await page.waitForFunction(() => window.Engine && window.Engine.state === 'playing', { timeout: 5000 });
  await sleep(220);
  await seedThreats(page, route.id);
}

async function seedThreats(page, id) {
  await page.evaluate((gameId) => {
    try {
      if (gameId === 'achilles' && typeof arrows !== 'undefined' && player && typeof PLAYER_Y !== 'undefined') {
        const originY = typeof archerArrowStartY === 'function' ? archerArrowStartY() : 28;
        const tx = Math.max(LANE_L + 20, Math.min(LANE_R - 20, player.x + 18));
        arrows.push({
          x: tx,
          y: PLAYER_Y - 230,
          visualX: tx - 8,
          visualY: PLAYER_Y - 240,
          visualTilt: 0,
          originX: tx,
          originY,
          targetX: tx,
          targetY: PLAYER_Y,
          arcOffset: 0,
          speed: 190,
          alive: true,
          landed: false,
          targeted: true,
        });
      }
      if (gameId === 'icarus' && typeof eagles !== 'undefined' && typeof orcas !== 'undefined' && player) {
        eagles.push({
          x: player.x + 150,
          y: player.y - 34,
          visualX: player.x + 140,
          visualY: player.y - 40,
          visualTilt: 0,
          speed: 95,
          size: 1,
          wingPhase: 0,
          markT: 0,
          divingT: 0,
          _diveRolled: true,
          _diving: false,
        });
        orcas.push({
          x: player.x + 90,
          y: oceanY(),
          visualX: player.x + 82,
          visualY: oceanY() + 6,
          visualTilt: 0,
          vx: 0,
          vy: 0,
          chargeT: 0.28,
          splashed: false,
        });
      }
      if (gameId === 'orion' && boss && orion) {
        boss.state = 'charge';
        boss.stateTimer = 0.18;
        boss.facing = orion.x < boss.x ? -1 : 1;
        boss.chargeVx = boss.facing * 180;
      }
      if (gameId === 'perseus' && typeof spawnSnake === 'function') {
        spawnSnake();
      }
    } catch (err) {
      console.error('perf threat seed failed:', err.message);
    }
  }, id);
}

async function driveRoute(page, id, durationMs) {
  const end = Date.now() + durationMs;
  const release = new Set();
  async function down(key) {
    release.add(key);
    await page.keyboard.down(key);
  }
  async function up(key) {
    release.delete(key);
    await page.keyboard.up(key);
  }

  try {
    if (id === 'hub') {
      await down('ArrowRight');
      await sleep(durationMs);
      return;
    }
    if (id === 'achilles') {
      let right = true;
      while (Date.now() < end) {
        const key = right ? 'ArrowRight' : 'ArrowLeft';
        await down(key);
        await sleep(220);
        await up(key);
        right = !right;
      }
      return;
    }
    if (id === 'icarus') {
      await down('ArrowUp');
      await sleep(durationMs);
      return;
    }
    if (id === 'orion') {
      await down('ArrowRight');
      await sleep(Math.floor(durationMs * 0.55));
      await up('ArrowRight');
      await page.keyboard.press(' ');
      await sleep(Math.max(0, durationMs - Math.floor(durationMs * 0.55)));
      return;
    }
    if (id === 'perseus') {
      await down('ArrowRight');
      await down('z');
      await sleep(Math.floor(durationMs * 0.55));
      await up('z');
      await page.keyboard.press('x');
      await sleep(Math.max(0, durationMs - Math.floor(durationMs * 0.55)));
    }
  } finally {
    for (const key of Array.from(release)) {
      try { await page.keyboard.up(key); } catch (_e) {}
    }
  }
}

async function measureFrames(page, durationMs) {
  return page.evaluate((duration) => new Promise((resolve) => {
    const deltas = [];
    let last = null;
    const start = performance.now();
    function tick(ts) {
      if (last != null) deltas.push(ts - last);
      last = ts;
      if (ts - start >= duration) {
        const sorted = deltas.slice().sort((a, b) => a - b);
        const p95 = sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] : 0;
        const avg = deltas.length ? deltas.reduce((sum, n) => sum + n, 0) / deltas.length : 0;
        resolve({
          frames: deltas.length,
          p95,
          avg,
          max: sorted.length ? sorted[sorted.length - 1] : 0,
        });
        return;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }), durationMs);
}

async function probe(page) {
  return page.evaluate(() => ({
    href: location.href,
    state: window.Engine ? window.Engine.state : null,
    manga: localStorage.getItem('godgames_manga') === '1',
    debug: window.GodGames && GodGames.Debug && typeof GodGames.Debug.report === 'function'
      ? GodGames.Debug.report()
      : null,
  }));
}

function gateResult(route, viewport, sink, frames, pageProbe) {
  const failures = [];
  if (sink.responses.length) failures.push(`http ${sink.responses.map((r) => `${r.status} ${r.url}`).join('; ')}`);
  if (sink.failedRequests.length) failures.push(`request failed ${sink.failedRequests.map((r) => `${r.method} ${r.url}: ${r.error}`).join('; ')}`);
  if (sink.pageErrors.length) failures.push(`js ${sink.pageErrors.join('; ')}`);
  if (sink.consoleErrors.length) failures.push(`console ${sink.consoleErrors.join('; ')}`);
  if (frames.p95 > viewport.budget) failures.push(`p95 ${frames.p95.toFixed(1)}ms > ${viewport.budget}ms`);

  if (route.needsDebug) {
    const report = pageProbe.debug;
    if (!report || report.game !== route.id) {
      failures.push(`missing debug report for ${route.id}`);
    } else {
      if ((report.failures || []).length) failures.push(`debug drift failures ${report.failures.length}`);
      if (report.maxDriftRatio > DRIFT_BUDGET + 0.001) {
        failures.push(`drift ${(report.maxDriftRatio * 100).toFixed(1)}% > ${(DRIFT_BUDGET * 100).toFixed(1)}%`);
      }
    }
  }

  return failures;
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--disable-gpu', '--no-sandbox'],
  defaultViewport: null,
});

const results = [];

for (const route of routes) {
  for (const viewport of VIEWPORTS) {
    for (const manga of [false, true]) {
      for (const load of ['cold', 'warm']) {
        const sink = makeSink();
        const context = await createContext(browser);
        let page;
        let loadMs = 0;
        try {
          if (load === 'warm') {
            const warmup = await newScenarioPage(context, sink, viewport.viewport, manga, false);
            await gotoMeasured(warmup, route);
            await sleep(450);
            await warmup.close();
          }

          page = await newScenarioPage(context, sink, viewport.viewport, manga, load === 'cold');
          loadMs = await gotoMeasured(page, route);
          await startRoute(page, route);

          const framePromise = measureFrames(page, DURATION_MS);
          const drivePromise = driveRoute(page, route.id, DURATION_MS);
          const frames = await framePromise;
          await drivePromise;
          await sleep(120);
          const pageProbe = await probe(page);
          const failures = gateResult(route, viewport, sink, frames, pageProbe);
          results.push({
            route: route.id,
            viewport: viewport.id,
            manga,
            load,
            loadMs,
            frames,
            debug: pageProbe.debug,
            ok: failures.length === 0,
            failures,
          });
        } catch (err) {
          results.push({
            route: route.id,
            viewport: viewport.id,
            manga,
            load,
            loadMs,
            frames: null,
            debug: null,
            ok: false,
            failures: [`threw ${err.message}`],
          });
        } finally {
          if (page) await page.close().catch(() => {});
          await context.close().catch(() => {});
        }
      }
    }
  }
}

console.log('\nPERF HARNESS');
console.log('='.repeat(132));
console.log('route      viewport manga load  load_ms frames p95_ms avg_ms max_ms drift% status');
console.log('-'.repeat(132));

let failed = 0;
for (const r of results) {
  const f = r.frames || { frames: 0, p95: 0, avg: 0, max: 0 };
  const drift = r.debug ? (r.debug.maxDriftRatio * 100).toFixed(1) : 'n/a';
  const status = r.ok ? 'ok' : `FAIL ${r.failures.join(' | ')}`;
  if (!r.ok) failed++;
  console.log([
    r.route.padEnd(10),
    r.viewport.padEnd(8),
    String(r.manga ? 'on' : 'off').padEnd(5),
    r.load.padEnd(5),
    String(r.loadMs).padStart(7),
    String(f.frames).padStart(6),
    f.p95.toFixed(1).padStart(6),
    f.avg.toFixed(1).padStart(6),
    f.max.toFixed(1).padStart(6),
    String(drift).padStart(6),
    status,
  ].join(' '));
}

console.log('-'.repeat(132));
console.log(`${results.length - failed} passed, ${failed} failed`);
console.log(`budgets: desktop p95 <= ${DESKTOP_P95_MS}ms, mobile p95 <= ${MOBILE_P95_MS}ms, drift <= ${(DRIFT_BUDGET * 100).toFixed(1)}%`);

await browser.close();
process.exit(failed ? 1 : 0);
