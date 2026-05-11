// tests/qa-harness.mjs
//
// No-build browser QA for shared God Games surfaces. It loads every page in
// normal and manga mode, checks for page/runtime errors, verifies visible
// canvases are nonblank, samples warm requestAnimationFrame budgets, checks
// portrait rotation overlays, and exercises hub portal + destination return
// routing.

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
const SETTLE_MS = Number(process.env.QA_SETTLE_MS || 750);
const FRAME_WARMUP_MS = Number(process.env.QA_FRAME_WARMUP_MS || 450);
const FRAME_SAMPLE_MS = Number(process.env.QA_FRAME_SAMPLE_MS || 900);
const DESKTOP_P95_MS = Number(process.env.QA_DESKTOP_P95_MS || 250);
const MOBILE_P95_MS = Number(process.env.QA_MOBILE_P95_MS || 250);
const FRAME_EPSILON_MS = Number(process.env.QA_FRAME_EPSILON_MS || 1);

const DESKTOP = { id: 'desktop', budget: DESKTOP_P95_MS, viewport: { width: 1440, height: 900, deviceScaleFactor: 1 } };
const MOBILE_LANDSCAPE = { id: 'mobile-landscape', budget: MOBILE_P95_MS, viewport: { width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true } };
const MOBILE_PORTRAIT = { id: 'mobile-portrait', budget: MOBILE_P95_MS, viewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true } };

const SURFACES = [
  { id: 'hub', path: 'index.html', canvas: true, rotate: true },
  { id: 'mount-olympus', path: 'mount-olympus.html', canvas: true, rotate: true },
  { id: 'olympus-clues', path: 'olympus-clues.html', canvas: true },
  { id: 'achilles', path: 'achilles.html', canvas: true, rotate: true },
  { id: 'icarus', path: 'icarus.html', canvas: true, rotate: true },
  { id: 'orion', path: 'orion.html', canvas: true, rotate: true },
  { id: 'perseus', path: 'perseus.html', canvas: true, rotate: true },
  { id: 'place-oceanus', path: 'place.html?id=oceanus&from=icarus&clue=clue.first', canvas: true, returns: true },
  { id: 'place-asphodel', path: 'place.html?id=asphodel&from=orion&clue=clue.second', canvas: true, returns: true },
  { id: 'place-erebus', path: 'place.html?id=erebus&from=achilles&clue=clue.third', canvas: true, returns: true },
  { id: 'place-lethe', path: 'place.html?id=lethe&from=icarus&clue=clue.first', canvas: true, returns: true },
  { id: 'place-tartarus', path: 'place.html?id=tartarus&from=perseus&clue=clue.fourth', canvas: true, returns: true },
  { id: 'place-elysium', path: 'place.html?id=elysium&from=orion&clue=clue.second', canvas: true, returns: true },
  { id: 'place-olympus', path: 'place.html?id=olympus&from=achilles&clue=clue.third', canvas: true, returns: true },
  { id: 'place-dreams', path: 'place.html?id=dreams&from=perseus&clue=clue.fourth', canvas: true, returns: true },
];

const onlyArg = process.argv.find((arg) => arg.startsWith('--only='));
const only = onlyArg ? new Set(onlyArg.slice('--only='.length).split(',').map((s) => s.trim()).filter(Boolean)) : null;
const surfaces = SURFACES.filter((surface) => !only || only.has(surface.id) || only.has(surface.id.replace(/^place-/, '')));
const portalsOnly = !!(only && only.has('portals'));

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createContext(browser) {
  if (typeof browser.createBrowserContext === 'function') return browser.createBrowserContext();
  return browser.createIncognitoBrowserContext();
}

function scenarioUrl(path) {
  const sep = path.includes('?') ? '&' : '?';
  return `${BASE}/${path}${sep}qaHarness=1`;
}

function makeSink() {
  return { responses: [], pageErrors: [], consoleErrors: [], failedRequests: [] };
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
    const error = failure ? failure.errorText : 'request failed';
    if (error === 'net::ERR_ABORTED') return;
    sink.failedRequests.push({ url: req.url(), method: req.method(), error });
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
    localStorage.setItem('godgames_playerName', 'QA');
    localStorage.setItem('godgames_perf', 'balanced');
    localStorage.setItem('icarus_lastPlay', String(Date.now()));
    const ts = Date.now();
    localStorage.setItem('tns.unlocks', JSON.stringify({
      'hint.z': ts,
      'hint.e': ts,
      'hint.u': ts,
      'hint.s': ts,
      'clue.first': ts,
      'clue.second': ts,
      'clue.third': ts,
      'clue.fourth': ts,
    }));
    if (mangaOn) localStorage.setItem('godgames_manga', '1');
    else localStorage.removeItem('godgames_manga');
  }, manga);
}

async function newPage(context, sink, viewport, manga) {
  const page = await context.newPage();
  await page.setViewport(viewport);
  await instrumentPage(page, sink);
  await seedPage(page, manga);
  return page;
}

function assertNoBrowserErrors(sink, label) {
  const problems = [];
  if (sink.responses.length) problems.push(`HTTP ${JSON.stringify(sink.responses.slice(0, 4))}`);
  if (sink.failedRequests.length) problems.push(`failed requests ${JSON.stringify(sink.failedRequests.slice(0, 4))}`);
  if (sink.pageErrors.length) problems.push(`page errors ${sink.pageErrors.slice(0, 4).join(' | ')}`);
  if (sink.consoleErrors.length) problems.push(`console errors ${sink.consoleErrors.slice(0, 4).join(' | ')}`);
  if (problems.length) throw new Error(`${label}: ${problems.join('; ')}`);
}

async function canvasStats(page) {
  return page.evaluate(() => {
    const canvases = Array.from(document.querySelectorAll('canvas'))
      .filter((canvas) => {
        const cs = getComputedStyle(canvas);
        return canvas.width > 0 && canvas.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden';
      });
    return canvases.map((canvas, index) => {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const cols = 18;
      const rows = 12;
      let nonblank = 0;
      let opaque = 0;
      const buckets = new Set();
      try {
        for (let y = 0; y < rows; y += 1) {
          for (let x = 0; x < cols; x += 1) {
            const sx = Math.min(canvas.width - 1, Math.max(0, Math.floor((x + 0.5) * canvas.width / cols)));
            const sy = Math.min(canvas.height - 1, Math.max(0, Math.floor((y + 0.5) * canvas.height / rows)));
            const px = ctx.getImageData(sx, sy, 1, 1).data;
            if (px[3] > 8) {
              opaque += 1;
              if (px[0] > 8 || px[1] > 8 || px[2] > 8) nonblank += 1;
              buckets.add(`${px[0] >> 4}:${px[1] >> 4}:${px[2] >> 4}:${px[3] >> 6}`);
            }
          }
        }
        return {
          index,
          width: canvas.width,
          height: canvas.height,
          opaque,
          nonblank,
          unique: buckets.size,
          ok: opaque > 16 && (nonblank > 8 || buckets.size > 3),
        };
      } catch (err) {
        return { index, width: canvas.width, height: canvas.height, ok: false, error: err.message };
      }
    });
  });
}

async function assertCanvasNonblank(page, label) {
  const stats = await canvasStats(page);
  if (!stats.length) throw new Error(`${label}: no visible canvas`);
  if (!stats.some((entry) => entry.ok)) throw new Error(`${label}: visible canvases look blank ${JSON.stringify(stats)}`);
}

async function measureFrames(page, durationMs) {
  return page.evaluate(({ warmupMs, sampleMs }) => new Promise((resolve) => {
    const samples = [];
    let last = 0;
    let seen = 0;
    const sampleStart = performance.now() + warmupMs;
    const end = sampleStart + sampleMs;
    const step = (ts) => {
      if (last && ts >= sampleStart) {
        seen += 1;
        if (seen > 3) samples.push(ts - last);
      }
      last = ts;
      if (performance.now() < end) {
        requestAnimationFrame(step);
        return;
      }
      const sorted = samples.slice().sort((a, b) => a - b);
      const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] || 0;
      const avg = samples.reduce((sum, v) => sum + v, 0) / Math.max(1, samples.length);
      const report = window.GodGames && GodGames.MangaArt && typeof GodGames.MangaArt.performanceReport === 'function'
        ? GodGames.MangaArt.performanceReport()
        : null;
      resolve({ count: samples.length, avg, p95, mangaReport: report });
    };
    requestAnimationFrame(step);
  }), { warmupMs: FRAME_WARMUP_MS, sampleMs: durationMs });
}

async function runLoadScenario(context, surface, manga) {
  const sink = makeSink();
  const page = await newPage(context, sink, DESKTOP.viewport, manga);
  const label = `${surface.id}:${manga ? 'manga' : 'normal'}:${DESKTOP.id}`;
  try {
    await page.goto(scenarioUrl(surface.path), { waitUntil: 'load', timeout: 45000 });
    await sleep(SETTLE_MS);
    if (surface.canvas) await assertCanvasNonblank(page, label);
    const frames = await measureFrames(page, FRAME_SAMPLE_MS);
    if (frames.p95 > DESKTOP.budget + FRAME_EPSILON_MS) {
      throw new Error(`${label}: p95 ${frames.p95.toFixed(1)}ms exceeds ${DESKTOP.budget}ms across ${frames.count} frames`);
    }
    assertNoBrowserErrors(sink, label);
    return { label, frames };
  } finally {
    await page.close().catch(() => {});
  }
}

async function overlayState(page) {
  return page.evaluate(() => {
    const overlay = document.querySelector('.rotate-overlay,.ge-rotate-overlay');
    if (!overlay) return { exists: false, visible: false };
    const cs = getComputedStyle(overlay);
    const rect = overlay.getBoundingClientRect();
    return {
      exists: true,
      visible: cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity || 1) !== 0 && rect.width > 0 && rect.height > 0,
      display: cs.display,
      width: rect.width,
      height: rect.height,
    };
  });
}

async function runRotateScenario(context, surface, manga) {
  for (const vp of [MOBILE_PORTRAIT, MOBILE_LANDSCAPE]) {
    const sink = makeSink();
    const page = await newPage(context, sink, vp.viewport, manga);
    const label = `${surface.id}:${manga ? 'manga' : 'normal'}:${vp.id}:rotate`;
    try {
      await page.goto(scenarioUrl(surface.path), { waitUntil: 'load', timeout: 45000 });
      await sleep(350);
      const state = await overlayState(page);
      if (!state.exists) throw new Error(`${label}: missing rotate overlay`);
      if (vp.id === 'mobile-portrait' && !state.visible) throw new Error(`${label}: overlay is not visible in portrait`);
      if (vp.id === 'mobile-landscape' && state.visible) throw new Error(`${label}: overlay remains visible in landscape`);
      assertNoBrowserErrors(sink, label);
    } finally {
      await page.close().catch(() => {});
    }
  }
}

async function hubPortalRegions(page) {
  await page.waitForFunction(() => window.GodGames && GodGames.HubDebug && typeof GodGames.HubDebug.portals === 'function', { timeout: 5000 });
  return page.evaluate(() => GodGames.HubDebug.portals());
}

async function runPortalScenario(context, manga, vp) {
  const setupSink = makeSink();
  const setupPage = await newPage(context, setupSink, vp.viewport, manga);
  await setupPage.goto(scenarioUrl('index.html'), { waitUntil: 'load', timeout: 45000 });
  await sleep(SETTLE_MS);
  const regions = await hubPortalRegions(setupPage);
  await setupPage.close().catch(() => {});
  assertNoBrowserErrors(setupSink, `hub:${manga ? 'manga' : 'normal'}:${vp.id}:portal-setup`);

  if (!regions.length) throw new Error(`hub:${manga ? 'manga' : 'normal'}:${vp.id}: no portal regions`);
  for (const region of regions) {
    const sink = makeSink();
    const page = await newPage(context, sink, vp.viewport, manga);
    const label = `hub:${manga ? 'manga' : 'normal'}:${vp.id}:portal:${region.name}`;
    try {
      await page.goto(scenarioUrl('index.html'), { waitUntil: 'load', timeout: 45000 });
      await sleep(SETTLE_MS);
      let target = region;
      if (!manga && !vp.viewport.hasTouch) {
        await page.evaluate((name) => GodGames.HubDebug.focusPortal(name), region.name);
        await sleep(180);
        const buttons = await page.evaluate(() => GodGames.HubDebug.buttons());
        target = buttons.find((button) => button.name === region.name) || region;
      }
      if (vp.viewport.hasTouch) await page.touchscreen.tap(target.cx, target.cy);
      else await page.mouse.click(target.cx, target.cy);
      await page.waitForFunction((href) => location.pathname.endsWith('/' + href) || location.pathname.endsWith(href), { timeout: 5000 }, region.href);
      assertNoBrowserErrors(sink, label);
    } catch (err) {
      throw new Error(`${label}: ${err.message}`);
    } finally {
      await page.close().catch(() => {});
    }
  }
}

async function runReturnScenario(context, surface, manga) {
  const sink = makeSink();
  const page = await newPage(context, sink, DESKTOP.viewport, manga);
  const label = `${surface.id}:${manga ? 'manga' : 'normal'}:return`;
  try {
    await page.goto(scenarioUrl(surface.path), { waitUntil: 'load', timeout: 45000 });
    await sleep(SETTLE_MS);
    const selector = surface.id === 'olympus-clues' ? '#backBtn' : '#returnBtn';
    if (selector === '#returnBtn') {
      await page.waitForFunction(() => document.querySelector('#returnBtn')?.classList.contains('visible'), { timeout: 4500 });
    }
    await page.click(selector);
    await page.waitForFunction(() => location.pathname.endsWith('/index.html') || location.pathname === '/', { timeout: 5000 });
    assertNoBrowserErrors(sink, label);
  } finally {
    await page.close().catch(() => {});
  }
}

async function main() {
  if (!surfaces.length && !portalsOnly) {
    console.error('No surfaces matched --only.');
    process.exit(2);
  }
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--disable-dev-shm-usage', '--no-sandbox'],
  });
  const failures = [];
  let passed = 0;

  async function run(label, fn) {
    const context = await createContext(browser);
    try {
      const result = await fn(context);
      passed += 1;
      const p95 = result && result.frames ? ` p95=${result.frames.p95.toFixed(1)}ms` : '';
      console.log(`ok ${label}${p95}`);
    } catch (err) {
      failures.push({ label, error: err.message });
      console.error(`fail ${label}: ${err.message}`);
    } finally {
      await context.close().catch(() => {});
    }
  }

  try {
    for (const surface of surfaces) {
      for (const manga of [false, true]) {
        await run(`load:${surface.id}:${manga ? 'manga' : 'normal'}`, (context) => runLoadScenario(context, surface, manga));
      }
    }

    for (const surface of surfaces.filter((surface) => surface.rotate)) {
      for (const manga of [false, true]) {
        await run(`rotate:${surface.id}:${manga ? 'manga' : 'normal'}`, (context) => runRotateScenario(context, surface, manga));
      }
    }

    if (!only || only.has('hub') || only.has('portals')) {
      for (const manga of [false, true]) {
        await run(`portals:desktop:${manga ? 'manga' : 'normal'}`, (context) => runPortalScenario(context, manga, DESKTOP));
        await run(`portals:mobile:${manga ? 'manga' : 'normal'}`, (context) => runPortalScenario(context, manga, MOBILE_LANDSCAPE));
      }
    }

    for (const surface of surfaces.filter((surface) => surface.returns || surface.id === 'olympus-clues')) {
      for (const manga of [false, true]) {
        await run(`return:${surface.id}:${manga ? 'manga' : 'normal'}`, (context) => runReturnScenario(context, surface, manga));
      }
    }
  } finally {
    await browser.close().catch(() => {});
  }

  console.log(`\nQA passed ${passed}, failed ${failures.length}`);
  if (failures.length) {
    for (const failure of failures) console.error(`- ${failure.label}: ${failure.error}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err.stack || err.message);
  process.exit(1);
});
