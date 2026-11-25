#!/usr/bin/env node
/* Orion reach suite (round 0056): who can use a page, beyond the default phone and desktop.
   Passes (all driven by page lists and selectors, so new components are covered without edits here):
     rtl       every page with dir="rtl" at 390 and 1280: no sideways scroll, the nav rail on the inline-start (right)
               side, leading icons before their text, menus, dialogs, panels and tooltips open inside the screen
     print     print media (dark scheme requested, to prove light is forced): main content shown, no glass, tables
               are tables, chrome gone, white page
     zoom      200% text (root font size doubled, see below): no sideways scroll, no clipped or overlapping text
     reflow    320 CSS px wide (400% zoom of a 1280 window): no sideways scroll
     longtext  very long words and sentences injected into labels, headlines, chips, buttons, cells, titles, values:
               nothing spills out of its container, nothing overlaps
     forced    forced-colors: active: every interactive control keeps a visible boundary (border or outline)
     reflowz   320 CSS px wide with text at 200%, two ways (the browser's text size, html { font-size: 200% }; and every element's
               text doubled, as textZoom does): no sideways scroll; with the browser's text size also no word split across lines and
               no control whose content sticks out of its box, the five truncation places of decision 0058 excepted (decision 0073)
     dirflip   dir flipped from ltr to rtl after load (a live language switch): the Ink Track pill, the tabs indicator and the nav
               highlight sit under their selected option again (issue 77)
     long320   50-character phrases and unbroken words injected into every trailing, meta and supporting slot at 320: the page
               must not scroll sideways (issue 79)
     motion    reduced motion: no looping animation keeps running
     keys      Tab through the page: everything reachable, a focus ring of at least 3:1 against what is behind it,
               focus order follows the visual order
   Usage: node tests/reach.mjs [--pass=rtl,print,...] [--only=text] [--workers=4] [--shots=dir] [--browser=chromium|webkit|firefox]
   --browser picks the engine (default chromium); CI's "browsers" job runs WebKit and Firefox (round 0066).
   Zoom method: browsers have no scripting API for text-only zoom, and the type scale is in px (the M3 dp scale,
   deliberately), so a root font-size of 200% would change nothing. The pass instead doubles the computed font size
   and line height of every element (what Android's font scale, iOS Larger Text and Firefox's text-only zoom do),
   while boxes keep their own sizes: that finds every container that clips or overlaps text. The reflow pass loads
   every page at 320 CSS px wide (WCAG 1.4.10: a 1280 window at 400% zoom) and checks for sideways scroll. */
import { readFileSync, readdirSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, resolve } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith('--' + n + '=')); return a ? a.split('=')[1] : d; };
const ONLY = arg('only', ''), WORKERS = +arg('workers', 4), SHOTS = arg('shots', '');
const PASSES = arg('pass', 'rtl,print,zoom,reflow,reflowz,dirflip,long320,longtext,forced,motion,keys').split(',');
const BROWSER = arg('browser', 'chromium');
if (!['chromium', 'webkit', 'firefox'].includes(BROWSER)) { console.error(`--browser=${BROWSER}: use chromium, webkit or firefox`); process.exit(2); }
const FILE = arg('file', '');   /* run the named page(s) only (tests/checker.mjs proves a rule on a known-bad fixture this way) */

import { silentAudit } from '../skill/orion/scripts/silent.mjs';

let pw;
try { pw = await import('playwright'); } catch { try { pw = createRequire(resolve('x.js'))('playwright'); } catch { try { pw = createRequire(import.meta.url)('playwright'); } catch {} } }
if (!pw) { console.error('Playwright is not installed'); process.exit(2); }

/* ---------- pages: the showcase, every template, every component reference page ---------- */
const pages = ['demo/index.html'];
for (const f of readdirSync(join(root, 'templates'))) if (f.endsWith('.html') && f !== 'index.html') pages.push('templates/' + f);
for (const d of readdirSync(join(root, 'components'))) { const f = `components/${d}/${d}.html`; if (existsSync(join(root, f))) pages.push(f); }
const targets = FILE ? FILE.split(',') : pages.filter((p) => !ONLY || p.includes(ONLY));
const isApp = (p) => /^(demo|templates)\//.test(p);

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg' };
const server = createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = join(root, p);
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file)) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const ORIGIN = 'http://127.0.0.1:' + server.address().port;

/* ---------- helpers installed in every page ---------- */
function installHelpers() {
  window.__h = {
    vis(el) { if (!el.isConnected) return false; const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && !el.closest('[hidden], [inert], [data-s4-skip], iframe'); },
    tag(el) { let s = el.tagName.toLowerCase(); if (el.id) s += '#' + el.id; else if (el.className && typeof el.className === 'string') s += '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.'); const t = (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 24); return t ? s + ' "' + t + '"' : s; },
    /* the rectangle of an element's own text */
    textRect(el) { const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let rect = null; const lines = []; for (let t = tw.nextNode(); t; t = tw.nextNode()) { if (!t.textContent.trim() || t.parentElement.closest('.s4-icon, svg, [hidden]')) continue; const rg = document.createRange(); rg.selectNodeContents(t); for (const r0 of rg.getClientRects()) { let r = r0; if (!r.width) continue; let hidden = false, L = r.left, R = r.right, T = r.top, B = r.bottom; for (let p = t.parentElement; p && p !== document.body; p = p.parentElement) { const pc = getComputedStyle(p); const bx = p.getBoundingClientRect(); if (/hidden|clip/.test(pc.overflowY)) { T = Math.max(T, bx.top); B = Math.min(B, bx.bottom); } if (/hidden|clip/.test(pc.overflowX)) { L = Math.max(L, bx.left); R = Math.min(R, bx.right); } } if (R - L < 1 || B - T < 1) hidden = true; if (hidden) continue; r = { left: L, right: R, top: T, bottom: B, width: R - L, height: B - T }; lines.push(r); rect = rect ? { left: Math.min(rect.left, r.left), right: Math.max(rect.right, r.right), top: Math.min(rect.top, r.top), bottom: Math.max(rect.bottom, r.bottom) } : { left: r.left, right: r.right, top: r.top, bottom: r.bottom }; } } if (rect) rect.lines = lines; return rect; },
    parse(c) { const m = /rgba?\(([^)]+)\)/.exec(c); if (!m) { const k = /color\(srgb ([\d. ]+)(?:\/ ([\d.]+))?\)/.exec(c); if (k) { const v = k[1].trim().split(/\s+/).map((x) => +x * 255); return [v[0], v[1], v[2], k[2] === undefined ? 1 : +k[2]]; } return [0, 0, 0, 0]; } const p = m[1].split(/[ ,\/]+/).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; },
    lum(c) { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); },
    contrast(a, b) { const x = this.lum(a), y = this.lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); },
    over(top, bottom) { const a = top[3]; return [top[0] * a + bottom[0] * (1 - a), top[1] * a + bottom[1] * (1 - a), top[2] * a + bottom[2] * (1 - a), 1]; },
    /* what is painted behind an element: its ancestors' backgrounds composited, translucent (glass) layers over the layer below */
    behind(el) { const chain = []; for (let p = el; p; p = p.parentElement) { const c = this.parse(getComputedStyle(p).backgroundColor); if (c[3] > 0) chain.push(c); if (c[3] >= 1) break; } let acc = [255, 255, 255, 1]; if (!chain.length || chain[chain.length - 1][3] < 1) { const b = this.parse(getComputedStyle(document.documentElement).backgroundColor); const bb = this.parse(getComputedStyle(document.body).backgroundColor); acc = bb[3] >= 1 ? bb : b[3] >= 1 ? b : [255, 255, 255, 1]; } for (let i = chain.length - 1; i >= 0; i--) acc = this.over(chain[i], chain[i][3] >= 1 ? [0, 0, 0, 1] : acc); return acc; },
  };
}

/* ---------- rtl ---------- */
function rtlAudit() {
  const h = window.__h, out = [];
  const ov = document.documentElement.scrollWidth - innerWidth;
  if (ov > 1) out.push(`sideways scroll: ${ov}px`);
  /* in rtl, anything starting before the left edge of the page cannot be scrolled to */
  const lost = [...document.querySelectorAll('body *')].filter((e) => {
    if (!h.vis(e) || e.getBoundingClientRect().left >= -2) return false;
    for (let p = e; p && p !== document.body; p = p.parentElement) { const cs = getComputedStyle(p); if (cs.position === 'fixed' || /hidden|clip|auto|scroll/.test(cs.overflowX)) return false; }
    return true;
  }).slice(0, 3);
  if (lost.length) out.push('content runs off the left edge: ' + lost.map(h.tag).join(', '));
  document.querySelectorAll('.s4-nav-rail').forEach((r) => { if (!h.vis(r)) return; const b = r.getBoundingClientRect(), box = r.parentElement.getBoundingClientRect(); if (b.left + b.width / 2 < box.left + box.width / 2) out.push('nav rail is on the left in rtl: ' + h.tag(r)); });
  /* leading icons come before the text, which in rtl is to its right */
  let n = 0;
  document.querySelectorAll('.s4-button, .s4-chip, .s4-list-item, .s4-menu-item, .s4-nav-item, .s4-tab, .s4-banner, .s4-segment, .s4-breadcrumb-link, .s4-page').forEach((el) => {
    if (n > 60 || !h.vis(el)) return;
    const icon = [...el.children].find((c) => c.classList.contains('s4-icon'));
    if (!icon || !h.vis(icon)) return;
    const tr = h.textRect(el); if (!tr) return;
    const ir = icon.getBoundingClientRect();
    if (Math.abs((ir.top + ir.bottom) / 2 - (tr.top + tr.bottom) / 2) > ir.height) return;
    if (ir.left < tr.right && ir.right > tr.left) return;   /* overlapping: not a leading icon (a stacked label) */
    n++;
    const first = [...el.childNodes].find((c) => c === icon || (c.nodeType === 3 && c.textContent.trim()) || (c.nodeType === 1 && c !== icon && h.textRect(c)));
    const iconFirst = first === icon;
    const iconRight = ir.left + ir.width / 2 > tr.left + (tr.right - tr.left) / 2;
    if (iconFirst !== iconRight) out.push(`icon is on the wrong side of its text in rtl: ${h.tag(el)}`);
  });
  return [...new Set(out)];
}

/* open every menu, dialog, panel and tooltip the page has and check it fits the screen */
async function overlays(page, add, tooltips = true) {
  const settle = () => page.waitForTimeout(480);
  const fit = (id) => page.evaluate((id) => { const e = document.getElementById(id); if (!e) return ''; const r = e.getBoundingClientRect(); if (!r.width) return ''; return (r.left < -1 || r.top < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1) ? 'opens outside the screen (' + [r.left, r.top, r.right, r.bottom].map(Math.round).join(', ') + ')' : ''; }, id);
  const ids = await page.evaluate(() => {
    const seen = new Set(), out = [];
    document.querySelectorAll('[data-dialog], [data-sheet], [data-menu]').forEach((b) => { const id = b.dataset.dialog || b.dataset.sheet || b.dataset.menu, r = b.getBoundingClientRect(); if (!seen.has(id) && r.width && !b.closest('[hidden], dialog')) { seen.add(id); out.push([id, b.dataset.menu ? 'menu' : 'panel']); } });
    return out;
  });
  for (const [id, kind] of ids) {
    const b = page.locator(`[data-dialog="${id}"], [data-sheet="${id}"], [data-menu="${id}"]`).first();
    try { if (!(await b.isVisible())) continue; await b.scrollIntoViewIfNeeded({ timeout: 2000 }); await b.click({ timeout: 3000 }); } catch (e) { continue; }
    await settle();
    const f = await fit(id); if (f) add(`${kind} "${id}" ${f}`);
    await page.keyboard.press('Escape'); await settle();
    await page.evaluate(() => document.querySelectorAll('dialog[open]').forEach((d) => d.close && d.close()));
  }
  if (!tooltips) return;
  const tips = page.locator('[data-tooltip]');
  const count = Math.min(await tips.count(), 6);
  for (let i = 0; i < count; i++) {
    const tip = tips.nth(i);
    try {
      if (!(await tip.isVisible())) continue;
      await tip.scrollIntoViewIfNeeded({ timeout: 1000 }); await tip.hover({ timeout: 1500 }); await page.waitForTimeout(650);
      const r = await page.evaluate(() => { const t = [...document.querySelectorAll('.s4-tooltip')].find((x) => { const b = x.getBoundingClientRect(); return b.width && getComputedStyle(x).visibility !== 'hidden' && getComputedStyle(x).opacity > 0.5; }); if (!t) return ''; const b = t.getBoundingClientRect(); return (b.left < -1 || b.right > innerWidth + 1 || b.top < -1 || b.bottom > innerHeight + 1) ? 'outside' : ''; });
      if (r) add('a tooltip opens outside the screen');
      await page.mouse.move(1, 1); await page.waitForTimeout(250);
    } catch (e) {}
  }
}

/* visit every view of an app shell, running a check in each */
async function eachView(page, fn) {
  const views = await page.evaluate(() => [...new Set([...document.querySelectorAll('.s4-nav-item[data-view]')].map((a) => a.dataset.view))]);
  await fn(null);
  for (const v of views) {
    const nav = page.locator(`.s4-nav-item[data-view="${v}"]`);
    let clicked = false;
    for (let i = 0; i < (await nav.count()); i++) { const l = nav.nth(i); if (await l.isVisible().catch(() => false)) { try { await l.click({ timeout: 3000 }); clicked = true; break; } catch (e) {} } }
    if (!clicked) continue;
    await page.waitForTimeout(700);
    await fn(v);
  }
}

/* ---------- print ---------- */
function printAudit() {
  const h = window.__h, out = [];
  const body = getComputedStyle(document.body), bg = h.parse(body.backgroundColor), page = h.parse(getComputedStyle(document.documentElement).backgroundColor);
  const paper = bg[3] >= 1 ? bg : page[3] >= 1 ? page : [255, 255, 255, 1];
  if (h.lum(paper) < 0.8) out.push('print: the page is not white (' + body.backgroundColor + ')');
  if (h.contrast(h.parse(body.color), paper) < 7) out.push('print: body text is not dark on white');
  const glass = [...document.querySelectorAll('body *')].filter((e) => { if (!h.vis(e)) return false; const cs = getComputedStyle(e); return (cs.backdropFilter && cs.backdropFilter !== 'none') || (cs.webkitBackdropFilter && cs.webkitBackdropFilter !== 'none'); });
  if (glass.length) out.push('print: glass is still on (' + glass.slice(0, 3).map(h.tag).join(', ') + ')');
  /* main content is not hidden */
  const main = document.querySelector('main, .s4-main, [role="main"], .s4-view:not([hidden]), body > .s4-prose, .s4-prose') || document.body;
  const mr = main.getBoundingClientRect();
  if (!(mr.width > 100 && mr.height > 50)) out.push('print: the main content has no size (' + h.tag(main) + ')');
  /* chrome is gone */
  document.querySelectorAll('.s4-nav-bar, .s4-nav-rail, .s4-fab, .s4-toolbar, .s4-snackbar, .s4-scrim, .s4-titlebar, .s4-nav-rail-scrim, [data-s4-print="hide"]').forEach((e) => { if (h.vis(e) && !e.closest('dialog:not([open])')) out.push('print: chrome is still shown: ' + h.tag(e)); });
  /* tables are tables, not the stacked phone layout */
  document.querySelectorAll('table.s4-table, .s4-table table').forEach((t) => {
    if (!h.vis(t)) return;
    const tr = t.querySelector('tr'); if (!tr) return;
    const d = getComputedStyle(tr).display, td = t.querySelector('td:not([data-check]), th:not([data-check])');
    if (d !== 'table-row' || (td && getComputedStyle(td).display !== 'table-cell')) out.push('print: a table is not drawn as a table (' + d + ')');
  });
  /* sideways overflow */
  const ov = document.documentElement.scrollWidth - innerWidth;
  if (ov > 2) out.push(`print: page is ${ov}px wider than the sheet`);
  /* panes, cards and rows do not split across pages */
  const split = document.querySelector('.s4-card, .s4-pane, .s4-list-item, tr');
  if (split) { const cs = getComputedStyle(split); if (!/avoid/.test(cs.breakInside) && !/avoid/.test(cs.pageBreakInside)) out.push('print: ' + h.tag(split) + ' may break across pages (no break-inside)'); }
  /* links in prose show their address; nothing else does */
  const a = document.querySelector('.s4-prose a[href^="http"]');
  if (a) { const c = getComputedStyle(a, '::after').content; if (!c || c === 'none' || c === 'normal') out.push('print: a link in prose does not print its address'); }
  const b = document.querySelector('.s4-button[href^="http"], a.s4-list-item[href^="http"], .s4-nav-item[href^="http"]');
  if (b) { const c = getComputedStyle(b, '::after').content; if (c && /http/.test(c)) out.push('print: a link outside prose prints its address: ' + h.tag(b)); }
  return out;
}

/* ---------- zoom and long text ---------- */
function clipAudit(opts) {
  const h = window.__h, out = [];
  const ov = document.documentElement.scrollWidth - innerWidth;
  if (ov > 1) {
    const wide = [...document.querySelectorAll('body *')].filter((e) => h.vis(e) && e.getBoundingClientRect().right > innerWidth + 1 && !e.closest('[data-scroll], .s4-table-wrap, .s4-tabs, [style*="overflow"]')).slice(0, 3).map(h.tag);
    out.push(`sideways scroll: ${ov}px (${wide.join(', ')})`);
  }
  const leaves = [...document.querySelectorAll('body *')].filter((e) => h.vis(e) && !e.closest('svg, .s4-icon, script, style, .s4-visually-hidden') && [...e.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim()));
  const seen = new Set();
  const note = (m) => { if (!seen.has(m)) { seen.add(m); out.push(m); } };
  for (const el of leaves) {
    const cs = getComputedStyle(el), tr = h.textRect(el); if (!tr) continue;
    if (el.closest('[data-collapsed] > .s4-fab-label, .s4-fab[data-collapsed] *')) continue;
    if (el.closest('.s4-avatar, .s4-chip-avatar')) continue;   /* initials in a fixed disc: clipped by design (README) */
    /* text hard-clipped by its own box or by an ancestor that clips */
    for (let p = el; p && p !== document.body; p = p.parentElement) {
      const pc = getComputedStyle(p);
      const clipsX = /hidden|clip/.test(pc.overflowX), clipsY = /hidden|clip/.test(pc.overflowY);
      if (!clipsX && !clipsY) continue;
      const b = p.getBoundingClientRect(), pad = 1.5;
      const ellipsis = pc.textOverflow === 'ellipsis' || cs.textOverflow === 'ellipsis' || /-webkit-box/.test(pc.display + cs.display) || (pc.webkitLineClamp && pc.webkitLineClamp !== 'none');
      if (ellipsis) break;
      if (clipsX && (tr.left < b.left - pad || tr.right > b.right + pad) && p.scrollWidth > p.clientWidth + 1) note(`text is clipped sideways by ${h.tag(p)}: ${h.tag(el)}`);
      if (clipsY && (tr.top < b.top - pad || tr.bottom > b.bottom + pad) && p.scrollHeight > p.clientHeight + 1 && !/auto|scroll/.test(pc.overflowY) && !p.matches('.s4-expand, .s4-accordion-body, [data-s4-collapsed]')) note(`text is clipped vertically by ${h.tag(p)}: ${h.tag(el)}`);
      break;
    }
    /* text that spills out of its filled container (button, chip, card, list row) */
    if (opts.container) {
      const host = el.closest('.s4-button, .s4-chip, .s4-list-item, .s4-card, .s4-stat, .s4-menu-item, .s4-nav-item, .s4-tab, .s4-segment, .s4-banner, td, th, .s4-message-bubble, .s4-field');
      if (host && host !== el || host === el) {
        const b = host.getBoundingClientRect();
        if (tr.right > b.right + 2 || tr.left < b.left - 2 || tr.bottom > b.bottom + 2 || tr.top < b.top - 2) {
          if (!host.closest('.s4-table-wrap, [data-scroll], .s4-tabs')) note(`text spills out of ${h.tag(host)}: ${h.tag(el)}`);
        }
      }
    }
  }
  /* overlap of two text runs that sit in the same scrolling flow */
  const boxes = [];
  for (const el of leaves) {
    let fixed = false; for (let p = el; p && p !== document.body; p = p.parentElement) { const cs = getComputedStyle(p); if (cs.position === 'fixed' || cs.position === 'sticky' || cs.position === 'absolute') fixed = true; }
    const r = h.textRect(el); if (!r || r.right - r.left < 4 || r.bottom - r.top < 6 || el.closest('.s4-avatar')) continue;
    boxes.push({ el, r, fixed, scroller: (() => { for (let p = el.parentElement; p; p = p.parentElement) { if (/auto|scroll|hidden/.test(getComputedStyle(p).overflowY) && p.scrollHeight > p.clientHeight + 1) return p; } return document.documentElement; })() });
  }
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i], b = boxes[j];
    if (a.fixed || b.fixed || a.scroller !== b.scroller || a.el.contains(b.el) || b.el.contains(a.el)) continue;
    let hit = false;
    for (const x of a.r.lines) { for (const y of b.r.lines) { const ox = Math.min(x.right, y.right) - Math.max(x.left, y.left), oy = Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top); if (ox > 3 && oy > 5) { hit = true; break; } } if (hit) break; }
    if (hit) note(`text overlaps text: ${h.tag(a.el)} and ${h.tag(b.el)}`);
  }
  return out;
}

/* text-only zoom: every element's text grows, boxes keep their authored sizes */
function textZoom(f) {
  const els = [...document.querySelectorAll('body, body *')].filter((e) => !(e instanceof SVGElement));
  const sizes = els.map((e) => { const cs = getComputedStyle(e); return [parseFloat(cs.fontSize), cs.lineHeight === 'normal' ? null : parseFloat(cs.lineHeight)]; });
  els.forEach((e, i) => { e.style.setProperty('font-size', sizes[i][0] * f + 'px', 'important'); if (sizes[i][1] != null) e.style.setProperty('line-height', sizes[i][1] * f + 'px', 'important'); });
}

const LONG_WORD = 'Supercalifragilisticexpialidocious'.repeat(4);
const LONG_TEXT = 'This label has been written to be much longer than any designer would ever plan for in the layout';
function injectLong(arg) {
  const sels = ['.s4-button', '.s4-chip', '.s4-list-headline', '.s4-list-supporting', '.s4-nav-label', 'td', 'th', '.s4-app-bar-title', '.s4-stat-value', '.s4-stat-label', '.s4-card-title', '.s4-card-subhead', '.s4-menu-item', '.s4-tab', 'h1', 'h2', 'h3', '.s4-segment', '.s4-breadcrumb-link', '.s4-message-bubble', '.s4-banner', ...(arg.slots ? ['.s4-list-trailing', '.s4-list-supporting', '.s4-list-overline', '.s4-timeline-meta', '.s4-timeline-label', '.s4-tree-trailing', '.s4-tree-label', '.s4-upload-meta', '.s4-upload-name', '.s4-stat-meta', '.s4-meter-legend li', '.s4-description-term', 'dt', 'dd', '.s4-status', '.s4-nav-label', '.s4-site-logo', '.s4-card-supporting', '.s4-menu-item-supporting', '.s4-kicker'] : [])];
  const h = window.__h; let n = 0;
  sels.forEach((s, si) => {
    let k = 0;
    document.querySelectorAll(s).forEach((el) => {
      if (k >= (arg.slots ? 4 : 3) || !h.vis(el) || el.matches('.s4-num')) return;   /* amounts and counts are not labels: .s4-num is nowrap by design, badges hold counts */
      const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let t = tw.nextNode(); t; t = tw.nextNode()) {
        if (!t.textContent.trim() || t.parentElement.closest('.s4-icon, svg, .s4-badge, .s4-kbd')) continue;
        t.textContent = (k % 2 === 0 ? arg.word : arg.text);   /* alternate unbroken and multi-word */
        k++; n++; el.setAttribute('data-long', k % 2 ? 'word' : 'text'); break;
      }
    });
  });
  return n;
}
function longAudit() {
  /* in addition to the generic clip audit: an injected element must stay inside the screen and inside its container */
  const h = window.__h, out = [];
  document.querySelectorAll('[data-long]').forEach((el) => {
    if (!h.vis(el)) return;
    const r = h.textRect(el); if (!r) return;
    if (r.right > innerWidth + 1 || r.left < -1) {
      let scrolls = false; for (let p = el; p && p !== document.body; p = p.parentElement) if (/auto|scroll/.test(getComputedStyle(p).overflowX) || p.matches('.s4-table-wrap, [data-scroll]')) scrolls = true;
      if (!scrolls) out.push(`long ${el.dataset.long} runs off the screen: ${h.tag(el)}`);
    }
  });
  return out;
}


/* ---------- text at 200% on a 320 screen (issue 76, 78) ---------- */
function sidewaysAudit() {
  const h = window.__h, ov = document.documentElement.scrollWidth - innerWidth;
  if (ov <= 1) return [];
  const wide = [...document.querySelectorAll('body *')].filter((e) => h.vis(e) && e.getBoundingClientRect().right > innerWidth + 1 && !e.closest('[data-scroll], .s4-table-wrap, .s4-tabs, .s4-nav-bar, [style*="overflow"]'))
    .filter((e, _, all) => !all.some((p) => p !== e && p.contains(e))).slice(0, 3).map(h.tag);
  /* nothing outside a scroller sticks out on its own: name the innermost boxes past the edge (their parent clips or lays them out) */
  const deep = wide.length ? [] : [...document.querySelectorAll('body *')].filter((e) => h.vis(e) && e.getBoundingClientRect().right > innerWidth + 1 && ![...e.children].some((c) => c.getBoundingClientRect().right > innerWidth + 1)).slice(0, 3).map(h.tag);
  return [`sideways scroll: ${ov}px (${wide.concat(deep).join(', ')})`];
}

/* ---------- dir flipped after load (issue 77) ---------- */
function dirflipAudit() {
  const out = [], h = window.__h;
  /* Ink Track: the ink's offset is the selected option's offset in its group */
  for (const g of document.querySelectorAll('.s4-button-group[data-s4-ink]')) {
    const ink = g.querySelector(':scope > .s4-button-group-ink'), b = g.querySelector(':scope > [aria-pressed="true"]');
    if (!ink || ink.hidden || !b || !h.vis(g)) continue;
    const gr = g.getBoundingClientRect(), br = b.getBoundingClientRect();
    const d = Math.abs(parseFloat(ink.style.getPropertyValue('--_ix')) - (br.left - gr.left - g.clientLeft));
    if (!(d <= 1.5)) out.push(`the Ink Track pill is ${Math.round(d)}px from its selected option after dir changed: ${h.tag(g)}`);
  }
  /* the sliding nav highlight sits inside the current item */
  for (const pill of document.querySelectorAll('.s4-nav-bar > .s4-nav-pill, .s4-nav-rail-items > .s4-nav-pill')) {
    const cur = pill.parentElement.querySelector('.s4-nav-item[aria-current]:not([aria-current="false"])');
    if (!cur || !h.vis(cur) || !pill.getClientRects().length) continue;
    const p = pill.getBoundingClientRect(), r = cur.getBoundingClientRect();
    if (Math.abs((p.left + p.width / 2) - (r.left + r.width / 2)) > 2) out.push(`the nav highlight is ${Math.round(Math.abs((p.left + p.width / 2) - (r.left + r.width / 2)))}px off its current item after dir changed: ${h.tag(pill.parentElement)}`);
  }
  /* the tabs indicator is under the selected tab */
  for (const l of document.querySelectorAll('.s4-tabs')) {
    const ind = l.querySelector(':scope > .s4-tabs-indicator, .s4-tabs-indicator'), t = l.querySelector('.s4-tab[aria-selected="true"]');
    if (!ind || !t || !h.vis(t) || !ind.getClientRects().length) continue;
    const p = ind.getBoundingClientRect(), r = t.getBoundingClientRect();
    if (Math.abs((p.left + p.width / 2) - (r.left + r.width / 2)) > 2) out.push(`the tabs indicator is ${Math.round(Math.abs((p.left + p.width / 2) - (r.left + r.width / 2)))}px off its tab after dir changed: ${h.tag(l)}`);
  }
  return out;
}

/* ---------- forced colors ---------- */
function forcedAudit() {
  const h = window.__h, out = [];
  const seen = new Set();
  const controls = document.querySelectorAll('button, a[href], input:not([type="hidden"]), select, textarea, summary, [role="button"], [role="tab"], [role="switch"], [role="menuitem"]');
  for (const el of controls) {
    if (!h.vis(el) || el.disabled) continue;
    if (el.closest('.s4-prose, p, .s4-list-item, .s4-menu-item, .s4-nav-item, .s4-breadcrumb-link, .s4-nav-rail, .s4-nav-bar, .s4-tab, .s4-tabs, .s4-accordion-item, .s4-month, .s4-timeline, .s4-table, .s4-palette, .s4-card-link, .s4-page')) continue;   /* text rows: a row, a text link or a tab is its own label; their state shows as text or an underline */
    const fieldBox = el.closest('.s4-text-field, .s4-date-picker-field, .s4-search');
    if (fieldBox && el.matches('button, a')) continue;   /* a button inside a field sits on the field's boundary */
    const box = fieldBox || (el.matches('input[type="checkbox"], input[type="radio"], input[type="range"], input[type="file"]') || el.getAttribute('aria-hidden') === 'true' ? (el.closest('label, .s4-switch, .s4-checkbox, .s4-radio, .s4-slider') || el) : el);
    const key = h.tag(box); if (seen.has(key)) continue; seen.add(key);
    /* the control or the box that draws it, or any piece inside it, has a border or an outline */
    const pieces = [box, ...box.querySelectorAll('*')].slice(0, 12);
    const has = pieces.some((p) => { const cs = getComputedStyle(p); const bw = ['Top', 'Right', 'Bottom', 'Left'].some((s) => parseFloat(cs['border' + s + 'Width']) >= 1 && cs['border' + s + 'Style'] !== 'none'); const ow = parseFloat(cs.outlineWidth) >= 1 && cs.outlineStyle !== 'none'; return bw || ow; });
    /* a plain text link is drawn by the system in LinkText; a slider paints its track and handle in Highlight with pseudo-elements, which this audit cannot see */
    const textual = (box.matches('a[href]') && !/button|fab|chip|card|icon/.test(box.className)) || box.matches('.s4-slider');
    if (!has && !textual) out.push('forced colors: no visible boundary: ' + h.tag(box));
  }
  return out;
}

/* ---------- motion ---------- */
function motionAudit() {
  const out = [], seen = new Set();
  for (const a of document.getAnimations()) {
    let t; try { t = a.effect.getComputedTiming(); } catch (e) { continue; }
    if (a.playState !== 'running') continue;
    const target = a.effect.target, nm = a.animationName || a.transitionProperty || 'animation';
    if (t.iterations === Infinity) { const k = nm + ' ' + (target && target.className); if (!seen.has(k)) { seen.add(k); out.push(`reduced motion: ${nm} keeps looping on ${window.__h.tag(target)}`); } }
  }
  return out;
}

/* ---------- keys ---------- */
function tabbables() {
  const h = window.__h, seenRadio = new Set();
  return [...document.querySelectorAll('button, a[href], input:not([type="hidden"]), select, textarea, summary, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]')].filter((e) => {
    if (e.disabled || e.tabIndex < 0 || !h.vis(e) && !e.matches('input')) return false;
    if (e.closest('[hidden], [inert], dialog:not([open]), [popover]:not(:popover-open)')) return false;
    if (!e.getClientRects().length) return false;   /* no box at all (inside a display: none region, like a desktop inspector on a phone): Tab cannot reach it; a visually hidden input still has a box */
    if (e.matches('input[type="radio"]')) { const k = e.name || e.id; if (e.name) { const grp = document.querySelectorAll(`input[type="radio"][name="${e.name}"]`); const stop = [...grp].find((r) => r.checked) || grp[0]; if (e !== stop) return false; } else if (seenRadio.has(k)) return false; seenRadio.add(k); }
    const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
    if (cs.visibility === 'hidden' || cs.display === 'none') return false;
    return r.width > 0 || r.height > 0 || e.matches('input');
  });
}
function ringInfo() {
  const h = window.__h, el = document.activeElement; if (!el || el === document.body) return null;
  const boxes = [el, ...[el.parentElement, el.parentElement && el.parentElement.parentElement].filter(Boolean), ...(el.parentElement ? el.parentElement.querySelectorAll(':scope > *') : []), ...el.querySelectorAll('*'), ...[el.closest('.s4-text-field, .s4-search, .s4-date-picker-field, .s4-split-grip')].filter(Boolean)].slice(0, 40);
  for (const b of boxes) {
    const cs = getComputedStyle(b), w = parseFloat(cs.outlineWidth) || 0;
    if (cs.outlineStyle !== 'none' && w >= 1) {
      const col = h.parse(cs.outlineColor), off = parseFloat(cs.outlineOffset) || 0;
      const r = b.getBoundingClientRect(); if (!r.width) continue;
      /* behind a ring drawn outside the box is the box's parent; a ring drawn inside sits on the box's own fill */
      const own = h.parse(cs.backgroundColor);
      const back = off < 0 ? (own[3] > 0 ? h.over(own, h.behind(b.parentElement || b)) : h.behind(b.parentElement || b)) : h.behind(b.parentElement || b);
      const ring = col[3] < 1 ? h.over(col, back) : col;
      const inner = off < 0 ? h.behind(b) : null;
      let c = h.contrast(ring, back);
      if (inner) c = Math.min(c, h.contrast(ring, inner));
      return { width: w, contrast: c, rect: el.getBoundingClientRect(), ringBox: b.tagName };
    }
  }
  /* a field's keyboard ring is an outline on its box (the field's ::before, issues 62 and 64): outside the box, so it is
     measured against what is behind the field */
  const box = el.closest('.s4-text-field');
  if (box) { const bs = getComputedStyle(box, '::before'), bw = parseFloat(bs.outlineWidth) || 0; if (bs.outlineStyle !== 'none' && bw >= 1) { const col = h.parse(bs.outlineColor), back = h.behind(box.parentElement || box); return { width: bw, contrast: h.contrast(col[3] < 1 ? h.over(col, back) : col, back), rect: el.getBoundingClientRect(), ringBox: 'field' }; } }
  /* the ink ring of a field is a spread shadow on its ::before; a split grip lights its bar */
  const host = el.closest('.s4-text-field, .s4-search, .s4-date-picker-field');
  if (host) { const sh = getComputedStyle(host, '::before').boxShadow; const m = /((?:rgba?|color)\([^)]+\))\s+0px\s+0px\s+0px\s+([\d.]+)px(?!\s*inset)/.exec(sh); const m2 = /((?:rgba?|color)\([^)]+\))\s+0px\s+0px\s+0px\s+([\d.]+)px\s+inset/.exec(sh) || /inset\s+((?:rgba?|color)\([^)]+\))\s+0px\s+0px\s+0px\s+([\d.]+)px/.exec(sh); const hit = m || m2; if (hit && parseFloat(hit[2]) >= 1) { const col = h.parse(hit[1]); const back = h.behind(host.parentElement || host); return { width: parseFloat(hit[2]) + (m && m2 ? parseFloat(m2[2]) : 0), contrast: h.contrast(col[3] < 1 ? h.over(col, back) : col, back), rect: el.getBoundingClientRect() }; } }
  if (el.matches('.s4-split-grip')) { const c = h.parse(getComputedStyle(el, '::before').backgroundColor); const back = h.behind(el.parentElement || el); if (c[3] > 0) return { width: 4, contrast: h.contrast(c, back), rect: el.getBoundingClientRect() }; }
  /* a window control (decision 0072) draws its ring on its firm layer (its ::before), inside the square cell */
  if (el.matches('.s4-window-control')) { const bs = getComputedStyle(el, '::before'), bw = parseFloat(bs.outlineWidth) || 0; if (bs.outlineStyle !== 'none' && bw >= 1) { const col = h.parse(bs.outlineColor), back = h.behind(el); return { width: bw, contrast: h.contrast(col[3] < 1 ? h.over(col, back) : col, back), rect: el.getBoundingClientRect() }; } }
  /* a control that shows focus by a changed fill, not a ring (menu items, rows) */
  return { width: 0, contrast: 0, rect: el.getBoundingClientRect(), none: true };
}
async function keysAudit(page, add, rtl) {
  const expected = await page.evaluate(() => window.__tabbables().map((e) => { e.setAttribute('data-kx', ''); return window.__h.tag(e); }));
  const reached = new Set(), order = [];
  await page.evaluate(() => { if (document.activeElement) document.activeElement.blur(); window.scrollTo(0, 0); });
  const limit = Math.min(expected.length + 25, 260);
  let prev = null, backJumps = [];
  for (let i = 0; i < limit; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(30);
    const st = await page.evaluate(() => {
      const el = document.activeElement; if (!el || el === document.body) return { done: true };
      const info = window.__ringInfo();
      const h = window.__h; let fixed = false; for (let p = el; p && p !== document.body; p = p.parentElement) { const cs = getComputedStyle(p); if (cs.position === 'fixed' || cs.position === 'sticky') fixed = true; }
      const r = el.getBoundingClientRect(); let off = 0; for (let p = el.parentElement; p; p = p.parentElement) { const cs = getComputedStyle(p); if (/auto|scroll/.test(cs.overflowY) && p.scrollHeight > p.clientHeight + 1) { off = p.scrollTop; break; } } let offX = 0; for (let p = el.parentElement; p; p = p.parentElement) { const cs = getComputedStyle(p); if (/auto|scroll/.test(cs.overflowX) && p.scrollWidth > p.clientWidth + 1) { offX = p.scrollLeft; break; } }   /* positions in the content of a sideways scroller (a board), like scrollTop for a tall one */ const sc = (() => { for (let p = el.parentElement; p; p = p.parentElement) { const cs = getComputedStyle(p); if (/auto|scroll/.test(cs.overflowY) && p.scrollHeight > p.clientHeight + 1) return h.tag(p); } return ''; })();
      const again = el.hasAttribute('data-kv'); el.setAttribute('data-kv', '');   /* the same element again is a loop; the same words on another control (Status in two tables) are not */
      return { dir: getComputedStyle(el).direction, again, native: el.matches('.s4-date-picker-field, input[type="date"], input[type="time"], input[type="datetime-local"], input[type="month"], input[type="week"]'), scrub: !!el.closest('.rv-scrub'), tag: h.tag(el), kx: el.hasAttribute('data-kx'), info, fixed, sc, rect: { l: r.left + scrollX + offX, r: r.right + scrollX + offX, t: r.top + scrollY + off, b: r.bottom + scrollY + off }, inDialog: !!el.closest('dialog, [popover]') };
    });
    if (st.done) break;
    if (st.again && i > expected.length && !st.native) break;   /* a native time or date field takes one Tab per part (hours, minutes, AM/PM): not a loop */
    reached.add(st.tag);
    if (st.kx || true) {
      const i2 = st.info;
      if (st.native) { /* native multi-part date and time controls: the ring is checked by hand (see notes) */ }
      else if (st.scrub) { /* the motion lab's scrub bar is a review tool, not part of the system */ }
      else if (i2 && i2.none) add(`keys: no focus ring on ${st.tag}`);
      else if (i2 && i2.contrast < 3) add(`keys: focus ring is ${i2.contrast.toFixed(2)}:1 (needs 3:1) on ${st.tag}`);
      else if (i2 && i2.width < 2) add(`keys: focus ring is only ${i2.width}px on ${st.tag}`);
    }
    /* visual order: the next stop must not jump back up the page (outside fixed bars and separate scrollers) */
    if (prev && !st.fixed && !prev.fixed && !st.inDialog && !prev.inDialog && st.sc === prev.sc) {
      const sameRow = Math.min(st.rect.b, prev.rect.b) - Math.max(st.rect.t, prev.rect.t) > 0.5 * Math.min(st.rect.b - st.rect.t, prev.rect.b - prev.rect.t);
      const xOverlap = Math.min(st.rect.r, prev.rect.r) - Math.max(st.rect.l, prev.rect.l) > 0.3 * Math.min(st.rect.r - st.rect.l, prev.rect.r - prev.rect.l); /* a jump to another column (rail to content, board columns) is not a jump back */
      if (st.rect.b < prev.rect.t - 4 && xOverlap) backJumps.push(`${prev.tag} then ${st.tag} (jumps up the page)`);
      else if (sameRow) { const rtlHere = st.dir === prev.dir ? st.dir === 'rtl' : rtl;   /* a right-to-left region in a left-to-right page reads right to left */ const before = rtlHere ? st.rect.l > prev.rect.r - 4 + 0 : st.rect.l < prev.rect.l - 4; const ahead = rtlHere ? st.rect.r > prev.rect.r + 4 : st.rect.l < prev.rect.l - 4; if (before && ahead && Math.abs(st.rect.l - prev.rect.l) > 24) backJumps.push(`${prev.tag} then ${st.tag} (against the reading direction)`); }
    }
    prev = st;
    order.push(st.tag);
  }
  const miss = expected.filter((t) => !reached.has(t));
  /* a roving group or a control inside a collapsed region is reached another way; only report plain controls */
  if (miss.length) add(`keys: Tab never reached ${miss.length} control(s): ${miss.slice(0, 4).join('; ')}`);
  backJumps.slice(0, 3).forEach((m) => add('keys: focus order: ' + m));
  await page.evaluate(() => { document.querySelectorAll('[data-kx], [data-kv]').forEach((e) => { e.removeAttribute('data-kx'); e.removeAttribute('data-kv'); }); });
}

/* ---------- running ---------- */
const MODES = [
  { key: '390', viewport: { width: 390, height: 844 }, colorScheme: 'dark', phone: true },
  { key: '1280', viewport: { width: 1280, height: 800 }, colorScheme: 'light', phone: false },
];
const QUIET = [/favicon\.ico/];
const failures = [];
let ran = 0;

async function runOne(browser, pass, rel, mode) {
  const label = `${pass} ${mode.key}  ${rel}`;
  const opts = { viewport: mode.viewport, colorScheme: mode.colorScheme, hasTouch: mode.phone && BROWSER !== 'firefox', deviceScaleFactor: 1 };   /* Firefox takes no touch emulation */
  if (pass === 'rtl') opts.locale = 'ar';
  if (pass === 'forced') opts.forcedColors = 'active';
  if (pass === 'motion') opts.reducedMotion = 'reduce';
  if (pass === 'reflow' || pass === 'reflowz' || pass === 'long320') opts.viewport = { width: 320, height: 640 };
  if (pass === 'dirflip') opts.viewport = { width: 390, height: 844 };
  if (pass === 'print') { opts.viewport = { width: 794, height: 1123 }; opts.colorScheme = 'dark'; }
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const found = new Set(), add = (m) => found.add(m);
  page.on('pageerror', (e) => add('script error: ' + String(e.message).split('\n')[0]));
  await page.addInitScript(installHelpers);
  await page.addInitScript(`window.__tabbables = ${tabbables}; window.__ringInfo = ${ringInfo};`);
  if (pass === 'rtl') await page.addInitScript(() => { const set = () => { if (document.documentElement) document.documentElement.setAttribute('dir', 'rtl'); return !!document.documentElement; }; if (!set()) new MutationObserver((m, o) => { if (set()) o.disconnect(); }).observe(document, { childList: true }); });
  try {
    if (pass === 'print') await page.emulateMedia({ media: 'print' });
    await page.goto(ORIGIN + '/' + rel, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(500);
    /* the reference pages' own toolbar (theme, contrast, color) is not part of the system */
    if (['zoom', 'reflow', 'reflowz', 'long320', 'longtext'].includes(pass)) await page.addStyleTag({ content: '.ex-bar, .ex-ctl { display: none !important; }' });
    const shot = async (tag) => { if (SHOTS) { mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: join(SHOTS, `${pass}-${mode.key}-${rel.replace(/[^\w.-]+/g, '_')}${tag || ''}.png`), fullPage: ['print', 'zoom', 'longtext'].includes(pass) }).catch(() => {}); } };
    if (pass === 'rtl') {
      if ((await page.evaluate(() => document.documentElement.dir)) !== 'rtl') add('rtl: the page replaced dir="rtl"');
      await shot();
      if (isApp(rel)) await eachView(page, async (v) => { (await page.evaluate(rtlAudit)).forEach((m) => add((v ? `[${v}] ` : '') + m)); });
      else (await page.evaluate(rtlAudit)).forEach(add);
      await overlays(page, (m) => add('rtl: ' + m), !mode.phone);
    } else if (pass === 'print') {
      await shot();
      (await page.evaluate(printAudit)).forEach(add);
    } else if (pass === 'zoom') {
      await page.evaluate(textZoom, 2);
      await page.evaluate(() => window.dispatchEvent(new Event('resize')));
      await page.waitForTimeout(400);
      await shot();
      if (isApp(rel)) await eachView(page, async (v) => { (await page.evaluate(clipAudit, { container: false })).forEach((m) => add((v ? `[${v}] ` : '') + m)); });
      else (await page.evaluate(clipAudit, { container: false })).forEach(add);
    } else if (pass === 'reflow') {
      const ov = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (ov > 1) add(`reflow: sideways scroll at 320px (${ov}px)`);
    } else if (pass === 'reflowz') {
      if (mode.key === 'rem') await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
      else await page.evaluate(textZoom, 2);
      await page.evaluate(() => window.dispatchEvent(new Event('resize')));
      await page.waitForTimeout(450);
      await shot();
      const run = async (v) => {
        const at = (m) => add(`[${mode.key === 'rem' ? 'text size 200%' : 'text doubled'}${v ? ', ' + v : ''}] ${m}`);
        (await page.evaluate(sidewaysAudit)).forEach(at);
        if (mode.key === 'rem') { const q = await page.evaluate(silentAudit); q.broken.forEach((m) => at(m)); q.overfull.forEach((m) => at(`control content outside its box: ${m}`)); }
      };
      if (isApp(rel)) await eachView(page, run); else await run(null);
    } else if (pass === 'dirflip') {
      await page.addStyleTag({ content: '.ex-bar, .ex-ctl { display: none !important; }' });
      await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'));
      await page.waitForTimeout(700);
      await shot();
      if (isApp(rel)) await eachView(page, async (v) => { (await page.evaluate(dirflipAudit)).forEach((m) => add((v ? `[${v}] ` : '') + m)); });
      else (await page.evaluate(dirflipAudit)).forEach(add);
    } else if (pass === 'long320') {
      const run = async (v) => { const n = await page.evaluate(injectLong, { word: LONG_WORD, text: LONG_TEXT, slots: true }); if (!n) return; await page.waitForTimeout(300); (await page.evaluate(sidewaysAudit)).forEach((m) => add((v ? `[${v}] ` : '') + 'long text in a slot: ' + m)); };
      if (isApp(rel)) await eachView(page, run); else await run(null);
      await shot();
    } else if (pass === 'longtext') {
      /* a desktop window app (data-window) is not a phone layout: its 390px run is skipped */
      if (mode.phone && await page.evaluate(() => !!document.querySelector('.s4-app[data-window]'))) { await ctx.close(); ran++; return; }
      const run = async (v) => { const n = await page.evaluate(injectLong, { word: LONG_WORD, text: LONG_TEXT }); if (!n) return; await page.waitForTimeout(250); (await page.evaluate(clipAudit, { container: true })).concat(await page.evaluate(longAudit)).forEach((m) => add((v ? `[${v}] ` : '') + m)); };
      if (isApp(rel)) await eachView(page, run); else await run(null);
      await shot();
    } else if (pass === 'forced') {
      await shot();
      (await page.evaluate(forcedAudit)).forEach(add);
    } else if (pass === 'motion') {
      await page.waitForTimeout(600);
      (await page.evaluate(motionAudit)).forEach(add);
    } else if (pass === 'keys') {
      await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; animation-duration: 0s !important; }' });   /* read the ring where it settles */
      await keysAudit(page, add, false);
    }
  } catch (e) { add('suite could not finish: ' + String(e.message).split('\n')[0].slice(0, 160)); }
  await ctx.close();
  ran++;
  if (found.size) failures.push({ label, list: [...found] });
}

let browser;
try { browser = await pw[BROWSER].launch(); } catch (e) { console.error(`${BROWSER} is not installed (npx playwright install ${BROWSER})`); process.exit(2); }
const jobs = [];
for (const pass of PASSES) for (const rel of targets) {
  if (pass === 'print' || pass === 'reflow' || pass === 'dirflip' || pass === 'long320') { jobs.push([pass, rel, MODES[0]]); continue; }
  if (pass === 'reflowz') { jobs.push([pass, rel, { key: 'rem' }], [pass, rel, { key: 'x2' }]); continue; }
  if (pass === 'forced' || pass === 'motion') { jobs.push([pass, rel, MODES[isApp(rel) ? 0 : 1]]); continue; }
  for (const mode of MODES) { if (pass === 'keys' && !isApp(rel) && mode.phone) continue; jobs.push([pass, rel, mode]); }
}
let i = 0;
await Promise.all(Array.from({ length: WORKERS }, async () => { while (i < jobs.length) { const [pass, rel, mode] = jobs[i++]; await runOne(browser, pass, rel, mode); } }));
await browser.close();
server.close();

if (failures.length) {
  const total = failures.reduce((n, f) => n + f.list.length, 0);
  console.error(`\nReach suite: ${total} problem(s) on ${failures.length} of ${ran} page runs\n`);
  for (const f of failures.sort((a, b) => a.label.localeCompare(b.label))) console.error(f.label + '\n' + f.list.map((m) => '  x ' + m).join('\n'));
  process.exit(1);
}
console.log(`Reach suite passed: ${targets.length} pages, ${ran} page runs (${PASSES.join(', ')}; ${BROWSER}), nothing wrong.`);
