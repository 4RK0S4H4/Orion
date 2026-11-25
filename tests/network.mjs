#!/usr/bin/env node
/* Orion network test (issue 107): what a page really fetches. Each template (not the templates index, which frames them all), the Showcase, the hub and the brand trial is
   loaded in Chromium from a local server that compresses text the way a static host does (gzip level 9; fonts as they are),
   and every request is recorded until the network is quiet and the fonts are in. It fails when:
   - one file is fetched twice (the same path under two URLs, such as a font preloaded with ?v= and asked for without it);
   - a request fails;
   - the page's Orion files (anything under components/, or the demo's own copies) transfer more than the page kind's budget
     in scripts/budgets.mjs: a site page its site total, a lean app page its bundle, font and icons, a full-bundle page its font and icons.
   Prints one line per page. Usage: node tests/network.mjs [--only=part-of-a-path] [--verbose] */
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { NETWORK_BUDGET } from '../scripts/budgets.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let pw;
try { pw = await import('playwright'); } catch { try { pw = createRequire(resolve('x.js'))('playwright'); } catch { try { pw = createRequire(import.meta.url)('playwright'); } catch {} } }
if (!pw) { console.error('Playwright is not installed: npm i -D playwright && npx playwright install chromium'); process.exit(2); }
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.ico': 'image/x-icon' };
const TEXT = new Set(['.html', '.css', '.js', '.mjs', '.json', '.svg']);
const zipped = new Map();
const server = createServer((req, res) => {
  const file = join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  const ext = extname(file), head = { 'content-type': MIME[ext] || 'application/octet-stream', 'cache-control': 'no-store' };
  let body = readFileSync(file);
  if (TEXT.has(ext)) { if (!zipped.has(file)) zipped.set(file, gzipSync(body, { level: 9 })); body = zipped.get(file); head['content-encoding'] = 'gzip'; }
  res.writeHead(200, head); res.end(body);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const ORIGIN = 'http://127.0.0.1:' + server.address().port;

const ONLY = (process.argv.find((a) => a.startsWith('--only=')) || '--only=').split('=')[1];
const VERBOSE = process.argv.includes('--verbose');
const pages = ['index.html', 'demo/index.html', 'examples/brand-trial/index.html']
  .concat(readdirSync(join(root, 'templates')).filter((f) => f.endsWith('.html') && f !== 'index.html').sort().map((f) => 'templates/' + f))
  .filter((p) => existsSync(join(root, p)) && p.includes(ONLY));
const kb = (n) => (n / 1024).toFixed(1);
/* what counts as an Orion file, and which part of a budget it falls in */
const partOf = (path) => {
  const name = path.split('/').pop();
  if (/\.woff2$/.test(name)) return 'font';
  if (/^icons(-[a-z-]+)?\.js$/.test(name)) return 'icons';
  return 'bundle';
};
const isOrion = (path) => /^\/components\//.test(path) || /^\/demo\/(orion\.(css|js)|icons\.js|inter-variable\.woff2)$/.test(path) || /^\/skill\/orion\/assets\//.test(path);

const browser = await pw.chromium.launch();
const problems = [];
for (const page of pages) {
  const src = readFileSync(join(root, page), 'utf8');
  const kind = /orion\.site\.min\.css/.test(src) ? 'site' : /orion\.core\.min\.css/.test(src) ? 'lean' : 'full';
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' });
  const tab = await ctx.newPage();
  const seen = new Map(), failed = [];
  tab.on('requestfailed', (r) => failed.push(`${new URL(r.url()).pathname} (${(r.failure() || {}).errorText || 'failed'})`));
  const done = [];
  tab.on('requestfinished', (r) => done.push((async () => {
    const u = new URL(r.url());
    if (u.protocol === 'data:' || u.origin !== ORIGIN) return;
    const resp = await r.response(); const status = resp ? resp.status() : 0;
    if (status >= 400) failed.push(`${u.pathname} (${status})`);
    let size = 0; try { size = (await r.sizes()).responseBodySize; } catch {}
    const list = seen.get(u.pathname) || []; list.push({ url: u.pathname + u.search, size }); seen.set(u.pathname, list);
  })()));
  await tab.goto(`${ORIGIN}/${page}`, { waitUntil: 'networkidle' });
  await tab.evaluate(() => document.fonts.ready.then(() => new Promise((r) => setTimeout(r, 300))));
  await tab.waitForLoadState('networkidle');
  await Promise.all(done);
  const mine = [];
  for (const [path, list] of seen) {
    if (list.length > 1) problems.push(`${page}: ${path} fetched ${list.length} times (${list.map((x) => x.url).join(', ')})`);
    if (path === '/' + page) continue;
    if (isOrion(path)) for (const x of list) mine.push({ path, part: partOf(path), size: x.size });
  }
  for (const f of failed) problems.push(`${page}: request failed: ${f}`);
  const sum = (part) => mine.filter((x) => !part || x.part === part).reduce((n, x) => n + x.size, 0);
  const total = sum(), parts = { bundle: sum('bundle'), font: sum('font'), icons: sum('icons') };
  const all = [...seen.values()].flat().reduce((n, x) => n + x.size, 0);
  let budgetText;
  if (kind === 'site') {
    budgetText = `budget ${NETWORK_BUDGET.site}`;
    if (total / 1024 > NETWORK_BUDGET.site) problems.push(`${page}: Orion files transfer ${kb(total)} KB > the site budget ${NETWORK_BUDGET.site} KB`);
  } else {
    const b = NETWORK_BUDGET[kind];
    budgetText = `budgets ${b.bundle || '-'}/${b.font}/${b.icons}`;
    for (const k of ['bundle', 'font', 'icons']) if (b[k] && parts[k] / 1024 > b[k]) problems.push(`${page}: Orion ${k} transfers ${kb(parts[k])} KB > ${b[k]} KB (${kind} page)`);
  }
  console.log(`${page} (${kind}): Orion ${kb(total)} KB (bundle ${kb(parts.bundle)}, font ${kb(parts.font)}, icons ${kb(parts.icons)}; ${budgetText}), page ${kb(all)} KB in ${[...seen.values()].flat().length} requests`);
  if (VERBOSE) for (const x of mine) console.log(`   ${x.path} ${kb(x.size)}`);
  await ctx.close();
}
await browser.close(); server.close();
if (problems.length) { console.error(problems.map((p) => '  x ' + p).join('\n')); console.error(`Network: ${problems.length} problem(s).`); process.exit(1); }
console.log(`Network: ${pages.length} pages, every file fetched once, every page inside its budget.`);
