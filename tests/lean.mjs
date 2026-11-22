#!/usr/bin/env node
/* S4 Orion lean-bundle test (round 0060, decision 0069): a page that links orion.core.min.* plus its packs behaves exactly
   like the same page on the full bundle. For every page that links the lean files, at 390 dark and 1280 light, it is
   loaded twice: as written, and with the lean files swapped for orion.min.css/js (requests intercepted, so the page is
   untouched). Compared: page errors and console errors, the S4 runtime (every public name), the element count, and the
   computed style of every element (all properties), with motion reduced and random numbers seeded so the two runs can match.
   A difference names the first elements and properties that differ. Usage: node tests/lean.mjs [--browser=chromium] [--only=part-of-a-path] */
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, resolve } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const browserName = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=chromium').split('=')[1];
let pw;
try { pw = await import('playwright'); } catch { try { pw = createRequire(resolve('x.js'))('playwright'); } catch { pw = createRequire(import.meta.url)('playwright'); } }
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' };
const server = createServer((req, res) => {
  const file = join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' }); res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const ORIGIN = 'http://127.0.0.1:' + server.address().port;

const ONLY = (process.argv.find((a) => a.startsWith('--only=')) || '--only=').split('=')[1];
const pages = ['demo/index.html'].concat(readdirSync(join(root, 'templates')).filter((f) => f.endsWith('.html')).map((f) => 'templates/' + f))
  .filter((p) => /orion\.core\.min\.css/.test(readFileSync(join(root, p), 'utf8')) && p.includes(ONLY));
const VIEWS = [
  { name: '390 dark', viewport: { width: 390, height: 844 }, colorScheme: 'dark', reducedMotion: 'reduce', isMobile: true, hasTouch: true, deviceScaleFactor: 1 },
  { name: '1280 light', viewport: { width: 1280, height: 900 }, colorScheme: 'light', reducedMotion: 'reduce' },
];
const fullCss = readFileSync(join(root, 'components/orion.min.css')), fullJs = readFileSync(join(root, 'components/orion.min.js'));
const index = JSON.parse(readFileSync(join(root, 'components/packs.json'), 'utf8'));
const SEED = () => { let a = 123456789; Math.random = () => { a = (a * 1664525 + 1013904223) % 4294967296; return a / 4294967296; }; };

async function snapshot(page, url, full) {
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  page.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !/preloaded using link preload/.test(m.text())) errs.push(m.type() + ': ' + m.text().slice(0, 160)); });
  await page.addInitScript(SEED);
  if (full) {
    await page.route(/\/orion\.core\.min\.css/, (r) => r.fulfill({ body: fullCss, contentType: 'text/css' }));
    await page.route(/\/orion\.core\.min\.js/, (r) => r.fulfill({ body: fullJs, contentType: 'text/javascript' }));
    await page.route(/\/orion\.(data|commands|desktop|direct|inputs|sitekit)\.min\.css/, (r) => r.fulfill({ body: '', contentType: 'text/css' }));
    await page.route(/\/orion\.(data|commands|desktop|direct|inputs|sitekit)\.min\.js/, (r) => r.fulfill({ body: '', contentType: 'text/javascript' }));
  }
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(1500);
  const data = await page.evaluate(() => {
    const names = Object.keys(window.S4 || {}).sort();
    const els = [...document.querySelectorAll('body, body *')].filter((e) => !/^(SCRIPT|STYLE|LINK|META)$/.test(e.tagName));
    const rows = els.map((e, i) => {
      const cs = getComputedStyle(e), o = {};
      for (let k = 0; k < cs.length; k++) { const p = cs[k]; if (/^(transition|animation|-webkit-locale)/.test(p)) continue; o[p] = cs.getPropertyValue(p); }
      return { i, tag: e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : ''), o };
    });
    return { names, rows };
  });
  return { errs, ...data };
}

const fails = [];
const browser = await pw[browserName].launch();
/* a layout still settling when both runs are read can differ for a moment (the article's centered column did, in both directions), so a differing view is read once more; it fails only if it differs twice */
async function compare(pg, opts) {
  const a = await browser.newContext(opts), b = await browser.newContext(opts);
  const url = `${ORIGIN}/${pg}`;
  const [lean, full] = await Promise.all([snapshot(await a.newPage(), url, false), snapshot(await b.newPage(), url, true)]);
  await a.close(); await b.close();
  const probs = [];
  const html = readFileSync(join(root, pg), 'utf8'), linked = new Set([...html.matchAll(/orion\.([a-z]+)\.min\.js/g)].map((m) => m[1]));
  const absent = new Set(Object.entries(index.packs).filter(([k]) => !linked.has(k)).flatMap(([, p]) => p.names));   /* names of packs the page does not link are meant to be missing */
  const missing = full.names.filter((n) => !lean.names.includes(n) && !absent.has(n)), extra = lean.names.filter((n) => !full.names.includes(n));
  if (missing.length || extra.length) probs.push(`S4 differs: missing ${missing.join(',') || '-'}, extra ${extra.join(',') || '-'}`);
  const le = lean.errs.filter((e) => !full.errs.includes(e));
  if (le.length) probs.push(`errors only on the lean bundle: ${le.slice(0, 3).join(' | ')}`);
  if (lean.rows.length !== full.rows.length) probs.push(`element count ${lean.rows.length} vs ${full.rows.length}`);
  else {
    let shown = 0, bad = 0;
    for (let i = 0; i < lean.rows.length; i++) {
      const diff = Object.keys(full.rows[i].o).filter((k) => lean.rows[i].o[k] !== full.rows[i].o[k]);
      if (diff.length) { bad++; if (shown++ < 3) probs.push(`${full.rows[i].tag}: ${diff.slice(0, 4).map((k) => `${k} ${lean.rows[i].o[k]} vs ${full.rows[i].o[k]}`).join('; ')}`); }
    }
    if (bad) probs.push(`${bad} of ${lean.rows.length} elements differ in computed style`);
  }
  return { probs, n: lean.rows.length, names: lean.names.length };
}
for (const pg of pages) for (const v of VIEWS) {
  const { name, ...opts } = v;
  let r = await compare(pg, opts);
  if (r.probs.length) r = await compare(pg, opts);
  console.log(`${r.probs.length ? '✗' : '✓'} ${pg} at ${name}: ${r.n} elements, ${r.names} S4 names${r.probs.length ? '\n    ' + r.probs.join('\n    ') : ''}`);
  if (r.probs.length) fails.push(`${pg} at ${name}`);
}
await browser.close(); server.close();
if (fails.length) { console.error(`\nLean bundle differs from the full one on ${fails.length} page view(s).`); process.exit(1); }
console.log(`\nLean bundle: ${pages.length} pages x ${VIEWS.length} views behave like the full bundle.`);
