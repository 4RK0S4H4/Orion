#!/usr/bin/env node
/* Orion Back test (round 0059, decision 0067): coming back from a page keeps your place. The production suite checks it
   in passing on every page; this test makes it the point, on the three places where it was lost before (the editor's script
   page, the calendar's booking page, the Showcase's note page). For each, at 390 dark and 1280 light, and by both ways back
   (the browser's Back, and the Back button in the top app bar):
     setup    the opener is scrolled well down its view first, so there is a position worth keeping (a page that is too
              short to scroll at that width is reported, not passed vacuously)
     scroll   after Back the view is where it was when the opener was tapped (within 4px), not at the top
     focus    focus is back on the opener (or inside it), never on <body>
     field    nothing put the cursor in a text field on the way (decision 0049)
   Then (round 0061) a tapped view switch on the Showcase and Dosewise leaves no ring round the screen, and the keyboard keeps it.
   Usage: node tests/back.mjs [--browser=chromium|webkit]   (default chromium) */
import { readFileSync, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, resolve } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const browserName = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=chromium').split('=')[1];
let pw;
try { pw = await import('playwright'); } catch { try { pw = createRequire(resolve('x.js'))('playwright'); } catch { pw = createRequire(import.meta.url)('playwright'); } }

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg' };
const server = createServer((req, res) => {
  const file = join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' }); res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const ORIGIN = 'http://127.0.0.1:' + server.address().port;

const TARGETS = [
  { file: 'templates/editor.html', page: 'script' },
  { file: 'templates/calendar.html', page: 'booking' },
  { file: 'demo/index.html', page: 'note' },
];
const VIEWS = [
  { name: '390 dark', viewport: { width: 390, height: 844 }, colorScheme: 'dark', isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { name: '1280 light, a short window', viewport: { width: 1280, height: 420 }, colorScheme: 'light' },
];

const fails = [];
const say = (ok, what) => { if (!ok) fails.push(what); console.log(`  ${ok ? '✓' : '✗'} ${what}`); };
const browser = await pw[browserName].launch();

for (const t of TARGETS) for (const v of VIEWS) {
  const ctx = await browser.newContext(v), page = await ctx.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  console.log(`${t.file} (${t.page}) at ${v.name}`);
  await page.goto(`${ORIGIN}/${t.file}`, { waitUntil: 'load' });
  await page.waitForTimeout(900);
  const sel = `[data-page-open="${t.page}"]`;
  const opener = page.locator(sel + ':visible').last();
  if (!(await opener.count())) { say(false, 'no visible opener'); await ctx.close(); continue; }
  for (const route of ['the browser Back', 'the top bar Back button']) {
    /* a fresh start each time: the view at its top, then the opener scrolled low */
    await page.evaluate(() => { const app = document.querySelector('.s4-app'); if (window.S4 && S4.pages && app) S4.pages.reset && S4.pages.reset(app); });
    await page.waitForTimeout(300);
    await opener.evaluate((x) => x.scrollIntoView({ block: 'end', behavior: 'instant' }));
    await page.waitForTimeout(250);
    await page.evaluate(() => { window.__where = null; const app = document.querySelector('.s4-app'), body = app && app.hasAttribute('data-window') ? app.querySelector(':scope > .s4-app-body') : null; window.__y = () => (body ? body.scrollTop : window.scrollY); addEventListener('pointerdown', () => { window.__where = window.__y(); }, { capture: true, once: true }); });
    const before = await page.evaluate(() => window.__y());
    await opener.click(); await page.waitForTimeout(700);
    const where = await page.evaluate(() => window.__where);
    const open = await page.evaluate((n) => { const p = document.querySelector(`.s4-subpage[data-page="${n}"]`); return !!p && !p.hidden; }, t.page);
    say(open, `${route}: the page opens`);
    if (!open) continue;
    /* at 390 the view must scroll (it is a phone: a page too short to scroll there is a failure of the test, not a pass); on a
       desktop a layout that fits the window, or scrolls inside a pane, has no view position to keep */
    if (v.isMobile) say(where >= 40, `${route}: there was a position to keep (${Math.round(where)}px down; opener was scrolled to ${Math.round(before)}px)`);
    else console.log(`  - ${route}: view scrolled ${Math.round(where)}px (a desktop layout that fits has none to keep)`);
    const fieldIn = await page.evaluate(() => { const a = document.activeElement; return !!a && a.matches('input:not([type="checkbox"]):not([type="radio"]):not([type="range"]), textarea, select'); });
    say(!fieldIn, `${route}: opening put no cursor in a field (decision 0049)`);
    if (route === 'the browser Back') await page.goBack();
    else await page.locator('.s4-app-bar-back:visible').first().click();
    await page.waitForTimeout(800);
    const r = await page.evaluate((n) => {
      const p = document.querySelector(`.s4-subpage[data-page="${n}"]`), a = document.activeElement;
      const same = (o) => !!a && !!o && (a === o || a.contains(o) || o.contains(a));
      const openers = [...document.querySelectorAll(`[data-page-open="${n}"]`)];
      return { closed: !!p && p.hidden, y: window.__y(), onBody: !a || a === document.body, onOpener: openers.some(same), at: a ? a.tagName.toLowerCase() + (typeof a.className === 'string' && a.className ? '.' + a.className.trim().split(/\s+/)[0] : '') : '' };
    }, t.page);
    say(r.closed, `${route}: the page closes`);
    say(Math.abs(r.y - where) <= 4, `${route}: scroll restored (${Math.round(where)}px before, ${Math.round(r.y)}px after)`);
    say(!r.onBody && r.onOpener, `${route}: focus is back on an opener (it is on ${r.onBody ? '<body>' : r.at})`);
  }
  say(!errs.length, `no script errors${errs.length ? ': ' + errs[0] : ''}`);
  await ctx.close();
}
/* decision 0076 (QA pass 2, issue 86): the screen follows the URL. After N view switches, Back N times lands on the first view and
   Forward walks to the last, and at every step the visible view, the nav item marked current and the hash agree. */
for (const file of ['demo/index.html', 'examples/brand-trial/index.html']) for (const v of VIEWS) {
  const ctx = await browser.newContext(v), page = await ctx.newPage();
  console.log(`${file}: Back and Forward change the screen at ${v.name} (issue 86)`);
  await page.goto(`${ORIGIN}/${file}`, { waitUntil: 'load' }); await page.waitForTimeout(700);
  const state = () => page.evaluate(() => {
    const shown = [...document.querySelectorAll('.s4-app .s4-view')].filter((x) => !x.hidden).map((x) => x.dataset.view);
    const cur = [...document.querySelectorAll('.s4-app .s4-nav-item[aria-current="page"][data-view]')].filter((x) => x.getClientRects().length).map((x) => x.dataset.view);
    return { shown: shown.join(), cur: cur.join(), hash: location.hash.slice(1).split('/')[0] };
  });
  const names = await page.evaluate(() => [...new Set([...document.querySelectorAll('.s4-app .s4-nav-item[data-view]')].filter((x) => x.getClientRects().length).map((x) => x.dataset.view))]);
  const first = (await state()).shown;
  const seq = names.filter((n) => n !== first).slice(0, 2);
  const agree = async (what, want) => { await page.waitForTimeout(800); const s = await state(); say(s.shown === want && (!s.cur || s.cur === want) && (!s.hash || s.hash === want || want === first), `${what}: view "${s.shown}", nav "${s.cur}", hash "#${s.hash}" (wanted "${want}")`); };
  if (seq.length < 2) { say(false, 'fewer than three views to switch between'); await ctx.close(); continue; }
  for (const n of seq) { await page.locator(`.s4-app .s4-nav-item[data-view="${n}"]:visible`).first().click(); await agree(`switch to ${n}`, n); }
  await page.goBack(); await agree('Back', seq[0]);
  await page.goBack(); await agree('Back again', first);
  await page.goForward(); await agree('Forward', seq[0]);
  await page.evaluate((n) => { location.hash = '#' + n; }, seq[1]); await agree(`location.hash = #${seq[1]}`, seq[1]);
  await ctx.close();
}
/* round 0061: a place-holder that takes focus on the way (a view, the main landmark) rings only for the keyboard. On an
   iPhone a tap focuses no link, so the view takes focus after every switch, and WebKit counts a script's focus as
   :focus-visible: the whole screen was outlined. The tap is replayed as iOS does it (pointerdown, then a click that moves
   no focus), on the Showcase and Dosewise at 390 dark. */
for (const file of ['demo/index.html', 'examples/brand-trial/index.html']) {
  const ctx = await browser.newContext(VIEWS[0]), page = await ctx.newPage();
  console.log(`${file}: no ring round the screen after a tap (round 0061)`);
  await page.goto(`${ORIGIN}/${file}`, { waitUntil: 'load' }); await page.waitForTimeout(700);
  const ring = () => page.evaluate(() => { const a = document.activeElement, cs = getComputedStyle(a); return { at: a.tagName.toLowerCase() + (typeof a.className === 'string' && a.className ? '.' + a.className.trim().split(/\s+/)[0] : ''), ring: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0, holder: a !== document.body && !a.matches('a[href], button, input, select, textarea, [role]') }; });
  const tap = (i) => page.evaluate((i) => { const x = document.querySelectorAll('.s4-app > .s4-nav-bar .s4-nav-item')[i]; x.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' })); x.click(); }, i);
  await tap(1); await page.waitForTimeout(800);
  let r = await ring();
  say(r.holder, `a tapped view switch leaves focus on a place-holder (it is on ${r.at})`);
  say(!r.ring, `the ${r.at} it landed on draws no ring after a tap`);
  await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab');
  await page.evaluate(() => { const app = document.querySelector('.s4-app'); S4.app.go(app, document.querySelector('.s4-app .s4-view[hidden]').dataset.view); });
  await page.waitForTimeout(800);
  r = await ring();
  say(r.holder && r.ring, `on the keyboard the ${r.at} it lands on keeps its ring`);
  await ctx.close();
}
await browser.close(); server.close();
console.log(fails.length ? `\n${fails.length} Back check(s) failed.` : '\nBack keeps its place everywhere tried.');
process.exit(fails.length ? 1 : 0);
