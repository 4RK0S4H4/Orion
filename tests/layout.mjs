#!/usr/bin/env node
/* S4 Orion wide windows and hierarchy pass (issues 54 and 56). Loads the showcase (every view) and every app template
   as a light desktop at 1280, 1600 and 1920 (and 390 dark for the surface steps) and checks what can be measured:
     fill      a card grid (.s4-grid) never leaves more than one column's width empty at its inline end
     reading   a paragraph that runs over more than one line never runs wider than the reading measure
     title     the page's title is the largest words in the view (a hero number such as .s4-stat-value may be larger)
     align     the top app bar's title starts on the same edge as the content it names
     steps     a card, pane, field, chip or tonal button never has the same fill as the surface it sits on
   Usage: node tests/layout.mjs [--only=text] [--shots]
   Site templates (decision 0057) and the desktop template have their own rules and are not checked here. */
import { readFileSync, readdirSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, resolve } from 'node:path';

/* ---------- thresholds, in one place ---------- */
const T = {
  widths: [1280, 1600, 1920],     /* large, extra-large, and a common desktop monitor */
  fillSlack: 1,                   /* empty space allowed at a grid's inline end, in columns (1 = less than one column) */
  readingPx: 760,                 /* the reading column (720; 760 in roomy density): the widest a multi-line paragraph may run */
  alignPx: 2,                     /* how far the bar title may sit from the content's start edge */
  stepRatio: 1.03,                /* the least contrast between a nested surface and the one it sits on (same fill = 1) */
};

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith('--' + n + '=')); return a ? a.split('=')[1] : d; };
const ONLY = arg('only', ''), SHOTS = process.argv.includes('--shots');
let pw;
try { pw = await import('playwright'); } catch { try { pw = createRequire(resolve('x.js'))('playwright'); } catch { pw = createRequire(import.meta.url)('playwright'); } }

const SITE = /^(landing|pricing|blog|docs|site|desktop-app|index)\.html$/;
const pages = ['demo/index.html', ...readdirSync(join(root, 'templates')).filter((f) => f.endsWith('.html') && !SITE.test(f)).map((f) => 'templates/' + f)]
  .filter((p) => !ONLY || p.includes(ONLY));

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
const server = createServer((req, res) => {
  let file = join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' }); res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const ORIGIN = 'http://127.0.0.1:' + server.address().port;

function measure(T) {
  const out = [];
  const shown = (e) => { if (!e.getClientRects().length) return false; const s = getComputedStyle(e); return s.visibility !== 'hidden' && +s.opacity > 0; };
  const name = (e) => { let s = e.tagName.toLowerCase(); if (e.id) s += '#' + e.id; else if (e.classList.length) s += '.' + [...e.classList].slice(0, 2).join('.'); const t = (e.textContent || '').trim().slice(0, 24); return t ? `${s} "${t}"` : s; };
  const main = document.querySelector('.s4-content') || document.querySelector('main') || document.body;
  const inOverlay = (e) => e.closest('dialog, .s4-sheet, .s4-menu, [popover], [hidden], .s4-snackbar');

  /* fill */
  for (const g of main.querySelectorAll('.s4-grid')) {
    if (!shown(g) || inOverlay(g)) continue;
    const kids = [...g.children].filter(shown); if (!kids.length) continue;
    const gr = g.getBoundingClientRect(), rtl = getComputedStyle(g).direction === 'rtl';
    const col = Math.min(...kids.map((k) => k.getBoundingClientRect().width)), gap = parseFloat(getComputedStyle(g).columnGap) || 0;
    const end = rtl ? Math.min(...kids.map((k) => k.getBoundingClientRect().left)) - gr.left : gr.right - Math.max(...kids.map((k) => k.getBoundingClientRect().right));
    if (end > T.fillSlack * (col + gap) - 1) out.push(`fill: ${name(g)} leaves ${Math.round(end)}px empty at its end (a column is ${Math.round(col)})`);
  }
  /* reading */
  for (const p of main.querySelectorAll('p, .s4-prose li')) {
    if (!shown(p) || inOverlay(p)) continue;
    const s = getComputedStyle(p), fs = parseFloat(s.fontSize), lh = parseFloat(s.lineHeight) || fs * 1.4;
    const r = p.getBoundingClientRect();
    if (r.height > lh * 1.6 && r.width > T.readingPx + 0.5) out.push(`reading: ${name(p)} runs ${Math.round(r.width)}px wide (most ${T.readingPx})`);
  }
  /* title */
  const bar = document.querySelector('.s4-app-bar-title');
  const heads = [...document.querySelectorAll('.s4-app-bar-title, .s4-subpage-title, h1, h2, h3')].filter((e) => shown(e) && !inOverlay(e) && !e.closest('.s4-nav-rail'));
  const titleSize = Math.max(0, ...heads.map((h) => parseFloat(getComputedStyle(h).fontSize)));
  const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
  for (let n; (n = walker.nextNode());) {
    const t = n.nodeValue.trim(); if (!t) continue;
    const e = n.parentElement; if (!shown(e) || inOverlay(e) || e.closest('.s4-stat-value, [data-hero], .s4-icon, .s4-avatar, h1, h2, h3, .s4-subpage-title')) continue;
    if (/^[\d\s$€£%.,:+\-−–/KMBkmohdw]+$/.test(t)) continue;      /* numbers rank by size on purpose */
    const fs = parseFloat(getComputedStyle(e).fontSize);
    if (fs > titleSize + 0.5) { out.push(`title: "${t.slice(0, 30)}" (${fs}px) is larger than the page title (${titleSize}px)`); break; }
  }
  /* align */
  const view = main.querySelector(':scope > :is(.s4-view, .s4-subpage):not([hidden])') || main;
  if (bar && shown(bar) && document.documentElement.clientWidth >= 840 && !document.querySelector('.s4-app[data-sub]')) {
    const cs = getComputedStyle(view), vr = view.getBoundingClientRect();
    const start = vr.left + parseFloat(cs.paddingLeft);
    /* the bar's first thing sits on the column's edge: the title, or a leading Back or menu button, whose box hangs 8
       outside the column so its glyph sits just inside it (the same offset as at the default 24 margin) */
    const first = [...bar.closest('.s4-top-app-bar').querySelectorAll('.s4-icon-button, .s4-app-bar-title')].filter(shown)[0];
    const fr = first.getBoundingClientRect(), icon = first.classList.contains('s4-icon-button');
    const off = icon ? Math.abs(fr.left + 8 - start) : Math.abs(fr.left - start);
    if (off > T.alignPx) out.push(`align: the top app bar starts at ${Math.round(fr.left)}, the content at ${Math.round(start)}`);
  }
  /* steps */
  const lum = (c) => { const m = c.match(/[\d.]+/g); if (!m) return null; const [r, g, b, a = 1] = m.map(Number); if (a < 0.5) return null; const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const behind = (e) => { for (let p = e.parentElement; p; p = p.parentElement) { const l = lum(getComputedStyle(p).backgroundColor); if (l !== null) return [l, p]; } return [lum(getComputedStyle(document.body).backgroundColor) ?? 1, document.body]; };
  for (const e of main.querySelectorAll('.s4-card, .s4-pane, .s4-search, .s4-text-field input, .s4-text-field textarea, .s4-chip, .s4-button[data-variant="tonal"]')) {
    if (!shown(e) || inOverlay(e)) continue;
    const l = lum(getComputedStyle(e).backgroundColor); if (l === null) continue;
    const [b, p] = behind(e); const ratio = (Math.max(l, b) + 0.05) / (Math.min(l, b) + 0.05);
    if (ratio < T.stepRatio) out.push(`steps: ${name(e)} on ${name(p)} differ by ${ratio.toFixed(3)} (least ${T.stepRatio})`);
  }
  return [...new Set(out)];
}

const failures = []; let runs = 0;
const browser = await pw.chromium.launch();
const jobs = [];
for (const rel of pages) { for (const w of T.widths) jobs.push([rel, w, 'light']); jobs.push([rel, 390, 'dark']); }
let i = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (i < jobs.length) {
    const [rel, w, scheme] = jobs[i++];
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, colorScheme: scheme, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const found = new Set();
    try {
      await page.goto(ORIGIN + '/' + rel, { waitUntil: 'load' }); await page.waitForTimeout(400);
      const views = await page.evaluate(() => [...document.querySelectorAll('.s4-content > .s4-view')].map((v) => v.dataset.view));
      for (const v of views.length ? views : ['']) {
        if (v) { await page.evaluate((v) => S4.app.go(document.querySelector('.s4-app'), v), v); await page.waitForTimeout(450); }
        const list = await page.evaluate(measure, T);
        for (const m of list) if (w !== 390 || m.startsWith('steps')) found.add((v ? `[${v}] ` : '') + m);
        if (found.size && SHOTS) { mkdirSync(join(root, 'tests/out'), { recursive: true }); await page.screenshot({ path: join(root, 'tests/out', `layout_${rel.replace(/\W+/g, '_')}_${v}_${w}.png`), fullPage: true }); }
      }
    } catch (e) { found.add('could not finish: ' + String(e.message).split('\n')[0]); }
    await ctx.close(); runs++;
    if (found.size) failures.push({ label: `${w} ${scheme}  ${rel}`, list: [...found] });
  }
}));
await browser.close(); server.close();
if (failures.length) {
  console.error(`\nLayout pass: problems on ${failures.length} of ${runs} runs\n`);
  for (const f of failures.sort((a, b) => a.label.localeCompare(b.label))) console.error(f.label + '\n' + f.list.map((m) => '  x ' + m).join('\n'));
  process.exit(1);
}
console.log(`Layout pass passed: ${pages.length} pages x ${T.widths.join(', ')} light and 390 dark (fill, reading, title, align, steps).`);
