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
// fire (RIVER OCEANUS, ASPHODEL MEADOWS, EREBUS, TARTARUS). Exits 0 on
// all-pass, 1 on any fail — wire into CI when ready.

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

// ── 1b. Progress sync waits for first-time name entry ────────────────────
async function testProgressSyncAfterLateName() {
  const { page, close } = await freshPage();
  let pulls = 0;
  let posts = 0;
  await page.setRequestInterception(true);
  page.on('request', req => {
    const url = new URL(req.url());
    if (url.pathname !== '/api/progress') {
      req.continue();
      return;
    }
    if (req.method() === 'GET') {
      pulls++;
      req.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          unlocks: { 'hint.z': 123 },
          counters: { mysteries_solved_count: 2 },
        }),
      });
      return;
    }
    if (req.method() === 'POST') {
      posts++;
      req.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ unlocks: {}, counters: {} }),
      });
      return;
    }
    req.respond({ status: 204 });
  });

  await page.goto(`${BASE}/index.html`, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 700));
  const pullsBeforeName = pulls;
  await page.type('#nameInput', 'LATE');
  await page.click('#nameSave');
  await page.waitForFunction(() => window.Engine?.unlock?.has('hint.z') === true, { timeout: 4000 });
  await new Promise(r => setTimeout(r, 2500));

  const r = await page.evaluate(() => ({
    name: localStorage.getItem('godgames_playerName'),
    hasZ: !!window.Engine?.unlock?.has('hint.z'),
    count: window.Engine?.unlock?.count('mysteries_solved_count') || 0,
  }));
  if (pullsBeforeName === 0 && pulls >= 1 && posts >= 1 && r.name === 'LATE' && r.hasZ && r.count === 2) {
    pass('Progress sync pulls after first-time name save');
  } else {
    fail('Progress sync late name', JSON.stringify({ pullsBeforeName, pulls, posts, r }));
  }
  await close();
}

// ── 2. Icarus Sun's Embrace ──────────────────────────────────────────────
//
// New experience: trigger fires → game ends → page navigates to
// place.html?id=oceanus&from=icarus&clue=clue.first. We can't easily
// follow the navigation back through localStorage in puppeteer's
// per-context isolation, so we snapshot the unlock state inside Icarus
// using `window.GodGames.suppressDepart = true` to skip the redirect.
async function testIcarus() {
  const { page, close } = await freshPage();
  await page.goto(`${BASE}/tests/seed.html?go=icarus.html`, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 800));
  await page.evaluate(() => { window.GodGames.suppressDepart = true; });
  await page.keyboard.press('ArrowUp');     // start
  await new Promise(r => setTimeout(r, 300));
  await page.keyboard.down('ArrowUp');      // hold to fly
  await new Promise(r => setTimeout(r, 3500));

  const mid = await probe(page);
  await page.screenshot({ path: `${SHOTS}/icarus_play.png` });
  await page.keyboard.up('ArrowUp');

  const ok = mid.unlocks.includes('hint.z')
    && mid.unlocks.some(u => u.startsWith('clue.'))
    && mid.counters.mysteries_solved_count >= 1;
  if (ok) pass('Icarus → hint.z earned + clue revealed', `unlocks=${mid.unlocks.join(',')}`);
  else fail('Icarus → hint.z earned', JSON.stringify(mid));
  await close();
}

// ── 3. Orion Constellation's Gaze ─────────────────────────────────────────
async function testOrion() {
  const { page, close } = await freshPage();
  await page.goto(`${BASE}/tests/seed.html?go=${encodeURIComponent('orion.html?testHooks=1')}`, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 800));
  await page.evaluate(() => { window.GodGames.suppressDepart = true; });
  await page.keyboard.press(' ');            // start
  await page.waitForFunction(() => window.Engine?.state === 'playing');
  const canGaze = await page.evaluate(() => window.GodGames?.OrionTest?.canGazeInNormalMode?.() === true);
  await page.evaluate(() => window.GodGames.OrionTest.recordConstellationGaze());
  await new Promise(r => setTimeout(r, 300));

  const after = await probe(page);
  await page.screenshot({ path: `${SHOTS}/orion_play.png` });
  if (canGaze && after.unlocks.includes('hint.e')) pass('Orion → hint.e earned', 'gaze accumulated');
  else fail('Orion → hint.e earned', JSON.stringify(after));
  await close();
}

// ── 4. Achilles Shade of Patroclus ────────────────────────────────────────
async function testAchilles() {
  const { page, close } = await freshPage();
  await page.goto(`${BASE}/tests/seed.html?go=${encodeURIComponent('achilles.html?testHooks=1')}`, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 800));
  await page.evaluate(() => { window.GodGames.suppressDepart = true; });
  await page.keyboard.press(' ');
  await page.waitForFunction(() => window.Engine?.state === 'playing');
  const canCounterShot = await page.evaluate(() => window.GodGames?.AchillesTest?.canCounterShotInNormalMode?.() === true);
  await page.evaluate(() => {
    window.GodGames.AchillesTest.recordPatroclusKill();
    window.GodGames.AchillesTest.recordPatroclusKill();
    window.GodGames.AchillesTest.recordPatroclusKill();
  });
  await new Promise(r => setTimeout(r, 300));

  const after = await probe(page);
  await page.screenshot({ path: `${SHOTS}/achilles_play.png` });
  if (canCounterShot && after.unlocks.includes('hint.u')) pass('Achilles → hint.u earned', 'Patroclus combo');
  else fail('Achilles → hint.u earned', JSON.stringify(after));
  await close();
}

// ── 4a. Perseus: chambers + hidden sigma ─────────────────────────────────
async function testPerseus() {
  const { page, close } = await freshPage();
  await page.goto(`${BASE}/tests/seed.html?go=${encodeURIComponent('perseus.html?testHooks=1')}`, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 800));
  await page.evaluate(() => { window.GodGames.suppressDepart = true; });
  await page.keyboard.press(' ');
  await page.waitForFunction(() => window.Engine?.state === 'playing');
  const canReflect = await page.evaluate(() => window.GodGames?.PerseusTest?.canReflectInNormalMode?.() === true);
  const victoryState = await page.evaluate(() => window.GodGames.PerseusTest.completeRun());
  const runState = await page.evaluate(() => window.GodGames.PerseusTest.state());
  await page.reload({ waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 500));
  await page.evaluate(() => { window.GodGames.suppressDepart = true; });
  await page.keyboard.press(' ');
  await page.waitForFunction(() => window.Engine?.state === 'playing');
  await page.evaluate(() => window.GodGames.PerseusTest.enterFinalChamber());
  const sealSolved = await page.evaluate(() => window.GodGames.PerseusTest.solveHiddenSeal());
  await new Promise(r => setTimeout(r, 300));

  const after = await probe(page);
  await page.screenshot({ path: `${SHOTS}/perseus_play.png` });
  if (canReflect && victoryState === 'victory' && runState.levelIndex === 2 && sealSolved && after.unlocks.includes('hint.s')) {
    pass('Perseus → chambers clear + hidden sigma earns hint.s', `hits=${runState.mirrorHits}`);
  } else {
    fail('Perseus → chambers + hidden sigma', JSON.stringify({ canReflect, victoryState, runState, sealSolved, after }));
  }
  await close();
}

// ── 4b. Re-trigger: previously-earned hint still fires the cinematic ─────
// The first time god-games shipped this, the trigger guarded on
// !hasHint(...) so subsequent runs silently skipped — players who'd
// earned the syllable once thought the easter egg was broken. The fix:
// unlockAndDepart is idempotent. This test pre-seeds the hint and verifies
// the trigger still navigates (without bumping the counter or revealing a
// fresh clue).
async function testIcarusRetrigger() {
  const { page, close } = await freshPage();
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('tns.unlocks', JSON.stringify({
      'hint.z': Date.now(), 'clue.first': Date.now(),
    }));
    localStorage.setItem('tns.counters', JSON.stringify({ mysteries_solved_count: 1 }));
    localStorage.setItem('godgames_playerName', 'TEST');
    localStorage.setItem('icarus_lastPlay', String(Date.now()));
  });
  await page.goto(`${BASE}/icarus.html`, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 800));
  // Watch for the navigation that unlockAndDepart should fire.
  let navTo = null;
  page.on('framenavigated', f => { if (f === page.mainFrame()) navTo = f.url(); });
  await page.keyboard.press('ArrowUp');
  await new Promise(r => setTimeout(r, 300));
  await page.keyboard.down('ArrowUp');
  await new Promise(r => setTimeout(r, 4500));
  await page.keyboard.up('ArrowUp');
  await new Promise(r => setTimeout(r, 400));
  // Should have navigated to place.html. Counter should NOT have bumped above 1.
  const stillCount = await page.evaluate(() => {
    try { return JSON.parse(localStorage.getItem('tns.counters') || '{}').mysteries_solved_count; }
    catch { return null; }
  });
  const wentToPlace = navTo && navTo.includes('place.html');
  if (wentToPlace && stillCount === 1) pass('Icarus re-trigger navigates without double-counting');
  else fail('Icarus re-trigger', `navTo=${navTo} count=${stillCount}`);
  await close();
}

// ── 4c. Place page renders the place + character + clue banner ────────────
async function testPlacePage() {
  const { page, close } = await freshPage();
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('tns.unlocks', JSON.stringify({
      'mystery.icarus_solved': Date.now(),
      'clue.first': Date.now(),
    }));
    localStorage.setItem('tns.counters', JSON.stringify({ mysteries_solved_count: 1 }));
  });
  await page.goto(`${BASE}/place.html?id=oceanus&from=icarus&clue=clue.first`, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 3500));
  await page.screenshot({ path: `${SHOTS}/place_oceanus.png` });
  const probe = await page.evaluate(() => ({
    title: document.title,
    hasReturnBtn: !!document.getElementById('returnBtn'),
    placeKnown: !!(window.GodGames && window.GodGames.places && window.GodGames.places.oceanus),
  }));
  if (probe.placeKnown && probe.hasReturnBtn) pass('place.html renders + Return button present');
  else fail('place.html', JSON.stringify(probe));
  await close();
}

// ── 4e. Perseus place scene uses Perseus, not an Achilles placeholder ────
async function testPerseusPlaceCharacter() {
  const { page, close } = await freshPage();
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('tns.unlocks', JSON.stringify({
      'mystery.perseus_solved': Date.now(),
      'clue.fourth': Date.now(),
    }));
  });
  await page.goto(`${BASE}/place.html?id=tartarus&from=perseus&clue=clue.fourth&testHooks=1`, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 1400));
  await page.screenshot({ path: `${SHOTS}/place_tartarus_perseus.png` });
  const probe = await page.evaluate(() => window.GodGames?.PlaceTest || null);
  if (probe?.character === 'perseus' && probe?.hasPerseusTraveler) pass('place.html renders Perseus traveler');
  else fail('place.html Perseus traveler', JSON.stringify(probe));
  await close();
}

// ── 4d. Olympus clues page surfaces earned clues ─────────────────────────
async function testOlympusClues() {
  const { page, close } = await freshPage();
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('tns.unlocks', JSON.stringify({
      'clue.first': Date.now(),
      'clue.second': Date.now(),
    }));
    localStorage.setItem('tns.counters', JSON.stringify({ mysteries_solved_count: 2 }));
  });
  await page.goto(`${BASE}/olympus-clues.html`, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: `${SHOTS}/olympus_clues.png` });
  const probe = await page.evaluate(() => ({
    earned: (window.GodGames?.Mysteries?.revealedClues() || []).map(c => c.id),
    nextHasRiddle: !!(window.GodGames?.Mysteries?.nextRiddle()),
  }));
  if (probe.earned.length === 2 && probe.nextHasRiddle) pass('olympus-clues lists earned + masks next');
  else fail('olympus-clues', JSON.stringify(probe));
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

  const r = await page.evaluate(() => ({
    manga: localStorage.getItem('godgames_manga'),
    solved: !!window.Engine?.unlock?.has('manga_mode'),
  }));
  await page.screenshot({ path: `${SHOTS}/shankle_bypass.png` });
  if (r.manga === '1' && r.solved) pass('Hub: shankle dev bypass → manga unlocked');
  else fail('Hub: shankle dev bypass', JSON.stringify(r));
  await close();
}

// ── 6. Hub: typing ZEUS (with letters earned) unlocks manga ──────────────
async function testZeusInvocation() {
  const { page, close } = await freshPage();
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('tns.unlocks', JSON.stringify({
      'hint.z': Date.now(), 'hint.e': Date.now(), 'hint.u': Date.now(), 'hint.s': Date.now(), 'hint.zeus_call': Date.now(),
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

  const r = await page.evaluate(() => ({
    manga: localStorage.getItem('godgames_manga'),
    solved: !!window.Engine?.unlock?.has('manga_mode'),
  }));
  await page.screenshot({ path: `${SHOTS}/zeus_invocation.png` });
  if (r.manga === '1' && r.solved) pass('Hub: typing ZEUS triggers manga unlock');
  else fail('Hub: typing ZEUS', JSON.stringify(r));
  await close();
}

// ── 7b. Heel of Achilles mystery — counter-driven solve ─────────────────
// Pre-seed manga_mode unlocked (it's a prereq) and tally the counter to its
// goal. The mystery should auto-solve via the maybeSolveByHints chain.
async function testHeelMystery() {
  const { page, close } = await freshPage();
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('tns.unlocks', JSON.stringify({ manga_mode: Date.now() }));
    localStorage.setItem('godgames_playerName', 'TEST');
    localStorage.setItem('godgames_manga', '1');
  });
  await page.goto(`${BASE}/achilles.html`, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 600));

  const r = await page.evaluate(() => {
    // Drive the counter to goal directly.
    for (let i = 0; i < 50; i++) {
      window.GodGames.Mysteries.tally('achilles_one_hp_seconds_x10');
    }
    return {
      heelSolved: window.GodGames.Mysteries.isSolved('heel_of_achilles'),
      counter: window.Engine.unlock.count('achilles_one_hp_seconds_x10'),
    };
  });
  if (r.heelSolved && r.counter >= 50) pass('Heel of Achilles: counter → mystery solves', `count=${r.counter}`);
  else fail('Heel of Achilles', JSON.stringify(r));
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
const tests = [testEngineUnlock, testProgressSyncAfterLateName, testIcarus, testIcarusRetrigger, testOrion, testAchilles, testPerseus, testPlacePage, testPerseusPlaceCharacter, testOlympusClues, testPanel, testShankleBypass, testZeusInvocation, testHeelMystery];
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
