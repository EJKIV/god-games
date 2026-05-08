// tests/e2e.mjs — End-to-end smoke for the mysteries system.
//
// Drives each game through its mythology-aligned secret with puppeteer and
// verifies the corresponding hint persists in localStorage. Catches the bugs
// that bit us most recently:
//   • window.Engine wasn't being set, so unlocks silently failed
//   • Achilles counter-shot was gated behind manga (chicken-and-egg)
//   • Sun's Embrace dwell-time goal was too long given the burn rate
//
// Run from the repo root, with a local server on :8765:
//
//   python3 -m http.server 8765 &
//   npm install --no-save puppeteer-core      # one-time
//   node tests/e2e.mjs
//
// Screenshots land in /tmp/shots/ for visual confirmation that cinematics
// fire (RIVER OCEANUS, ASPHODEL MEADOWS, EREBUS). Exits 0 on all-pass, 1 on
// any fail — wire into CI when ready.

import { mkdirSync } from 'fs';
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
const BASE = process.env.BASE_URL || 'http://localhost:8765';
const SHOTS = process.env.SHOTS_DIR || '/tmp/shots';

mkdirSync(SHOTS, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--disable-gpu', '--no-sandbox'],
  defaultViewport: { width: 1440, height: 900 },
});

const results = [];
function pass(name, detail = '') { results.push({ name, ok: true, detail }); }
function fail(name, detail = '') { results.push({ name, ok: false, detail }); }

async function freshPage() {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('JS ERROR:', e.message));
  return { page, close: () => ctx.close() };
}

async function probe(page) {
  return await page.evaluate(() => ({
    unlocks: window.Engine?.unlock?.list() || [],
    counters: (() => { try { return JSON.parse(localStorage.getItem('tns.counters') || '{}'); } catch { return {}; } })(),
    cinematicActive: !!(window.GodGames?.MythCinematic?.active),
    cinematicName: window.GodGames?.MythCinematic?.active?.name || null,
    state: typeof state !== 'undefined' ? state : null,
    location: location.pathname,
  }));
}

// ── 1. Engine.unlock module sanity ────────────────────────────────────────
async function testEngineUnlock() {
  const { page, close } = await freshPage();
  await page.goto(`${BASE}/icarus.html`, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 600));
  const r = await page.evaluate(() => {
    const set = window.Engine?.unlock?.set('hint.smoketest');
    const has = window.Engine?.unlock?.has('hint.smoketest');
    return { hasUnlock: !!window.Engine?.unlock, set, has };
  });
  if (r.set === true && r.has === true) pass('Engine.unlock writes + reads');
  else fail('Engine.unlock', JSON.stringify(r));
  await close();
}

// ── 2. Icarus Sun's Embrace ───────────────────────────────────────────────
async function testIcarus() {
  const { page, close } = await freshPage();
  await page.goto(`${BASE}/tests/seed.html?go=icarus.html`, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 800));
  await page.keyboard.press('ArrowUp');     // start
  await new Promise(r => setTimeout(r, 300));
  await page.keyboard.down('ArrowUp');      // hold to fly
  await new Promise(r => setTimeout(r, 2200));

  const mid = await probe(page);
  await page.screenshot({ path: `${SHOTS}/icarus_play.png` });
  await page.keyboard.up('ArrowUp');

  const ok = mid.unlocks.includes('hint.z');
  if (ok) pass('Icarus → hint.z earned', `cinematic=${mid.cinematicName}`);
  else fail('Icarus → hint.z earned', JSON.stringify(mid));
  await close();
}

// ── 3. Orion Constellation's Gaze ─────────────────────────────────────────
async function testOrion() {
  const { page, close } = await freshPage();
  await page.goto(`${BASE}/tests/seed.html?go=orion.html`, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 800));
  await page.keyboard.press(' ');            // start
  await new Promise(r => setTimeout(r, 4500)); // stand still 4+ seconds

  const after = await probe(page);
  await page.screenshot({ path: `${SHOTS}/orion_play.png` });
  if (after.unlocks.includes('hint.e')) pass('Orion → hint.e earned', 'gaze accumulated');
  else fail('Orion → hint.e earned', JSON.stringify(after));
  await close();
}

// ── 4. Achilles Shade of Patroclus ────────────────────────────────────────
async function testAchilles() {
  const { page, close } = await freshPage();
  await page.goto(`${BASE}/tests/seed.html?go=achilles.html`, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 800));
  await page.keyboard.press(' ');
  await new Promise(r => setTimeout(r, 600));
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('z');
    await new Promise(r => setTimeout(r, 2600));
  }
  await new Promise(r => setTimeout(r, 800));

  const after = await probe(page);
  await page.screenshot({ path: `${SHOTS}/achilles_play.png` });
  if (after.unlocks.includes('hint.u')) pass('Achilles → hint.u earned', 'Patroclus combo');
  else fail('Achilles → hint.u earned', JSON.stringify(after));
  await close();
}

// ── 5. Hub: shankle dev bypass unlocks manga mode ────────────────────────
async function testShankleBypass() {
  const { page, close } = await freshPage();
  await page.goto(`${BASE}/tests/seed.html?go=index.html`, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 800));
  for (const ch of 'shankle') {
    await page.keyboard.press(ch);
    await new Promise(r => setTimeout(r, 30));
  }
  await new Promise(r => setTimeout(r, 6000)); // wait for Zeus strike

  const manga = await page.evaluate(() => localStorage.getItem('godgames_manga'));
  await page.screenshot({ path: `${SHOTS}/shankle_bypass.png` });
  if (manga === '1') pass('Hub: shankle dev bypass → manga unlocked');
  else fail('Hub: shankle dev bypass', `manga=${manga}`);
  await close();
}

// ── 6. Hub: typing ZEUS (with letters earned) unlocks manga ──────────────
async function testZeusInvocation() {
  const { page, close } = await freshPage();
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('tns.unlocks', JSON.stringify({
      'hint.z': Date.now(), 'hint.e': Date.now(), 'hint.u': Date.now(), 'hint.zeus_call': Date.now(),
    }));
    localStorage.setItem('godgames_playerName', 'TEST');
  });
  await page.goto(`${BASE}/index.html`, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 800));
  for (const ch of 'zeus') {
    await page.keyboard.press(ch);
    await new Promise(r => setTimeout(r, 30));
  }
  await new Promise(r => setTimeout(r, 6000));

  const manga = await page.evaluate(() => localStorage.getItem('godgames_manga'));
  await page.screenshot({ path: `${SHOTS}/zeus_invocation.png` });
  if (manga === '1') pass('Hub: typing ZEUS triggers manga unlock');
  else fail('Hub: typing ZEUS', `manga=${manga}`);
  await close();
}

// ── 7. Hub mysteries panel reflects earned hints ─────────────────────────
async function testPanel() {
  const { page, close } = await freshPage();
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('tns.unlocks', JSON.stringify({ 'hint.z': Date.now() }));
    localStorage.setItem('godgames_playerName', 'TEST');
  });
  await page.goto(`${BASE}/index.html`, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 1200));

  const has = await page.evaluate(() => ({
    panelHasZ: !!(window.GodGames?.Mysteries?.hasHint('z')),
    panelHasE: !!(window.GodGames?.Mysteries?.hasHint('e')),
  }));
  await page.screenshot({ path: `${SHOTS}/panel_one_letter.png` });
  if (has.panelHasZ && !has.panelHasE) pass('Hub panel: hasHint reflects state');
  else fail('Hub panel: hasHint', JSON.stringify(has));
  await close();
}

// ── Run all ──────────────────────────────────────────────────────────────
const tests = [testEngineUnlock, testIcarus, testOrion, testAchilles, testPanel, testShankleBypass, testZeusInvocation];
for (const t of tests) {
  try { await t(); }
  catch (e) { fail(t.name, 'threw: ' + e.message); }
}

console.log('\n' + '='.repeat(60));
console.log('TEST RESULTS');
console.log('='.repeat(60));
let passed = 0, failed = 0;
for (const r of results) {
  const symbol = r.ok ? '✓' : '✗';
  console.log(`${symbol} ${r.name}${r.detail ? '  — ' + r.detail : ''}`);
  if (r.ok) passed++; else failed++;
}
console.log(`\n${passed} passed, ${failed} failed`);
console.log(`screenshots in ${SHOTS}/`);

await browser.close();
process.exit(failed > 0 ? 1 : 0);
