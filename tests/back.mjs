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
await browser.close(); server.close();
console.log(fails.length ? `\n${fails.length} Back check(s) failed.` : '\nBack keeps its place everywhere tried.');
process.exit(fails.length ? 1 : 0);
