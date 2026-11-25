#!/usr/bin/env node
/* Check a page built with Orion before handing it over.
   Usage: node check.mjs page.html [more.html | http://…] [--out dir]
   Loads each page as a 390px dark phone and a 1280px light desktop (Playwright + Chromium) and reports:
     errors   – console errors, failed requests, unknown icons, sideways scroll, text below WCAG AA as rendered
                (on glass: against the worst backdrop after the glass's own filter and tint), icon-only controls with
                no name, a button group that swaps panels or tabs without panels (decision 0059), a dialog that does not ask (one
                answer, or a form: decision 0064), and app CSS that breaks the house rules (hex/rgb colors, !important, hand-written durations or
                easings, glass on content, bare element selectors), and silent failures (decision 0065): an s4- class nothing
                defines, a word split across lines or a box one glyph wide, a part outside its component, a status drawn as a fill,
                a dial attribute (data-scale, data-corners, data-energy …) with a value that is not on its list (decision 0067),
                window controls that are not full cells to the window's top and end edges (decision 0072), and a
                word split or a page scrolling sideways in the middle of a motion (issue 70, midmotion.mjs),
                a nav bar highlight drawn as a circle or narrower than its label (round 0061)
     warnings – more than one filled button in one area, more than one filled accent action on the first screen
                (decision 0070), labels that look sentence case
   Saves a full-page screenshot per viewport in --out (default ./s4-check). Exit code 1 when there are errors. */
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname, basename, join, parse, sep } from 'node:path';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { knownClasses, silentAudit, windowAudit, glowAudit } from './silent.mjs';
import { midMotion } from './midmotion.mjs';

const argv = process.argv.slice(2);
const outIdx = argv.indexOf('--out');
const OUT = resolve(outIdx >= 0 ? argv.splice(outIdx, 2)[1] : 's4-check');
const pages = argv.filter((a) => !a.startsWith('--'));
if (!pages.length) { console.error('Usage: node check.mjs page.html [--out dir]'); process.exit(2); }

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { try { ({ chromium } = createRequire(resolve('x.js'))('playwright')); } catch { try { ({ chromium } = createRequire(import.meta.url)('playwright')); } catch {} } }
if (!chromium) { console.error('Playwright is not installed: npm i -D playwright && npx playwright install chromium'); process.exit(2); }

const SYSTEM_CSS = /(^|\/)orion(\.(site|core|data|commands|desktop|direct|inputs|sitekit))?(\.min)?\.css$/;
const SAFE_SELECTOR = /^(html|body|:root|\*|::?[a-z-]+|from|to|\d+(\.\d+)?%)$/;

/* ---------------- static lint of the app's own CSS ---------------- */
function lintCss(css, where) {
  const out = [];
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const keyframes = new Set();
  for (const m of css.matchAll(/@keyframes\s+([\w-]+)/g)) keyframes.add(m[1]);
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const sel = m[1].trim().replace(/^@[^;]*;\s*/, ''), body = m[2];
    if (/^(from|to|[\d.%,\s]+)$/.test(sel)) continue;            /* keyframe stops */
    const at = `${where}: ${sel.slice(0, 60)}`;
    for (const d of body.split(';')) {
      const i = d.indexOf(':'); if (i < 0) continue;
      const prop = d.slice(0, i).trim().toLowerCase(), raw = d.slice(i + 1).trim();
      if (prop.startsWith('--') && /^--_/.test(prop)) continue;
      const val = raw.replace(/var\([^()]*(\([^()]*\))*[^()]*\)/g, 'VAR');
      if (/!important/.test(raw)) out.push(`${at} → ${prop}: !important (override with tokens or attributes instead)`);
      if (/#[0-9a-f]{3,8}\b|\b(rgba?|hsla?|hwb|oklch|oklab|lab|lch)\(/i.test(val) && !/^(content|src|grid-template-areas)$/.test(prop))
        out.push(`${at} → ${prop}: ${raw} (use a --md-sys-color-* role)`);
      if (/\b(white|black)\b/i.test(val) && /color|background|border|fill|stroke|shadow|outline/.test(prop))
        out.push(`${at} → ${prop}: ${raw} (use a --md-sys-color-* role)`);
      if (/^(-webkit-)?backdrop-filter$/.test(prop) && !/^none$/.test(val))
        out.push(`${at} → ${prop} (glass comes from the components or class="s4-glass" on a floating panel only)`);
      if (/^(transition|animation)(-duration|-timing-function|-delay)?$/.test(prop)) {
        const words = val.split(/[\s,]+/);
        if (words.some((w) => /^-?\d*\.?\d+m?s$/.test(w) && !/^0m?s$/.test(w)) || /\b(ease|ease-in|ease-out|ease-in-out|cubic-bezier|steps)\b/.test(val))
          out.push(`${at} → ${prop}: ${raw} (use a motion pattern token such as var(--s4-motion-state), or S4.transition.*)`);
      }
    }
    if (sel.startsWith('@')) continue;
    for (const s of splitList(sel)) {
      if (!s || SAFE_SELECTOR.test(s)) continue;
      if (!/[.#[]/.test(s) && !/^(html|body|:root)\b/.test(s))
        out.push(`${where}: "${s}" styles bare elements (scope it under an app class so it can't leak into components)`);
    }
  }
  return out;
}

/* a selector list split at its own commas only: commas inside :is(), :where(), :not(), :has(), :nth-child(… of …) or an
   attribute value belong to one selector (decision 0060) */
function splitList(sel) {
  const out = []; let depth = 0, quote = '', cur = '';
  for (const ch of sel) {
    if (quote) { if (ch === quote) quote = ''; cur += ch; continue; }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '(' || ch === '[') depth++;
    else if (ch === ')' || ch === ']') depth = Math.max(0, depth - 1);
    else if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  out.push(cur.trim());
  return out.filter(Boolean);
}

/* ---------------- in-page audit (runs in the browser) ---------------- */
function audit() {
  const issues = { overflow: [], contrast: [], names: [], filled: [], caseWarn: [], glassContent: [], roles: [] };
  const vw = document.documentElement.clientWidth;
  if (document.documentElement.scrollWidth > vw + 1) {
    const wide = [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width && r.right > vw + 1 && getComputedStyle(e).position !== 'fixed'; })
      .filter((e, _, all) => !all.some((p) => p !== e && p.contains(e))).slice(0, 5);
    issues.overflow.push(`page is ${document.documentElement.scrollWidth}px wide in a ${vw}px window; widest: ${wide.map(path).join(', ') || '?'}`);
  }
  function path(e) {
    const bits = []; for (let n = e; n && n !== document.body && bits.length < 3; n = n.parentElement) {
      let s = n.tagName.toLowerCase(); if (n.id) s += '#' + n.id; else if (n.classList.length) s += '.' + [...n.classList].slice(0, 2).join('.'); bits.unshift(s);
    } return bits.join(' > ');
  }
  const cv = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  const parse = (c) => {
    let m = c.match(/^rgba?\(([^)]+)\)/);
    if (m) { const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] == null ? 1 : p[3]]; }
    m = c.match(/^color\(srgb ([^)]+)\)/);
    if (m) { const p = m[1].split(/[\s/]+/).filter(Boolean).map(Number); return [p[0] * 255, p[1] * 255, p[2] * 255, p[3] == null ? 1 : p[3]]; }
    if (!c || c === 'transparent') return null;
    cv.clearRect(0, 0, 1, 1); cv.fillStyle = '#000'; cv.fillStyle = c; cv.fillRect(0, 0, 1, 1);    /* oklch(), lab() … */
    const d = cv.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255];
  };
  const over = (top, bot) => { const a = top[3]; return [0, 1, 2].map((i) => top[i] * a + bot[i] * (1 - a)).concat(1); };
  const lum = (c) => { const v = c.slice(0, 3).map((x) => { x /= 255; return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const filterOf = (f) => { const c = /contrast\(([\d.]+)\)/.exec(f), b = /brightness\(([\d.]+)\)/.exec(f); return (v) => Math.min(255, Math.max(0, ((v - 127.5) * (c ? +c[1] : 1) + 127.5) * (b ? +b[1] : 1))); };
  const hidden = (e) => {   /* not shown, or disabled (WCAG exempts disabled controls, including their labels) */
    if (e.closest('[hidden],[inert],[aria-hidden="true"],.s4-visually-hidden,[disabled],[aria-disabled="true"],:disabled,[data-s4-skip]')) return true;
    const lab = e.closest('label'); if (lab && lab.control && lab.control.disabled) return true;
    return ['label', '.s4-text-field', '.s4-list-item'].some((q) => { const c = e.closest(q); return c && c.querySelector('input:disabled, select:disabled, textarea:disabled'); });
  };
  const seen = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: (n) => n.nodeValue.trim() ? 1 : 2 });
  for (let t; (t = walker.nextNode());) {
    const el = t.parentElement; if (!el || seen.has(el) || hidden(el) || /^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|OPTION)$/.test(el.tagName)) continue;
    seen.add(el);
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
    if (!r.width || !r.height || cs.visibility !== 'visible' || +cs.opacity === 0) continue;
    let fg = parse(cs.color); if (!fg) continue;
    /* stack of backgrounds up to the first opaque one, noting glass and opacity */
    const layers = []; let glass = null, opacity = 1, unknown = false;
    for (let n = el; n; n = n.parentElement) {
      const s = getComputedStyle(n); opacity *= +s.opacity;
      const bg = parse(s.backgroundColor); const bf = s.backdropFilter || s.webkitBackdropFilter;
      if (bf && bf !== 'none' && bg && bg[3] < 1) { glass = { tint: bg, f: filterOf(bf) }; break; }   /* its gradient is the edge highlight */
      if (s.backgroundImage !== 'none') unknown = true;
      if (bg && bg[3] > 0) { layers.push(bg); if (bg[3] >= 1) break; }
      /* a selected tab or nav item sits on the pill that slides behind it (a sibling element, not an ancestor) */
      if (n.matches('.s4-tab[aria-selected="true"], .s4-nav-item[aria-current]:not([aria-current="false"])')) { const pill = n.parentElement && n.parentElement.querySelector(':scope > .s4-tabs-indicator, :scope > .s4-nav-pill'); const pb = pill && parse(getComputedStyle(pill).backgroundColor); if (pb && pb[3] > 0) layers.push(pb); }
      /* the selected option of a connected button group sits on the ink that slides behind it (decision 0059) */
      if (n.matches('.s4-button-group[data-s4-ink] > [aria-pressed="true"]')) { const ink = n.parentElement.querySelector(':scope > .s4-button-group-ink:not([hidden])'); const ib = ink && parse(getComputedStyle(ink, '::before').backgroundColor); if (ib) { ib[3] *= +getComputedStyle(ink).opacity; if (ib[3] > 0) layers.push(ib); } }
    }
    if (unknown || opacity < 0.99) continue;                                  /* images and fading content: skip */
    const size = parseFloat(cs.fontSize), bold = +cs.fontWeight >= 700, large = size >= 24 || (bold && size >= 18.66);
    const need = large ? 3 : 4.5;
    const bases = glass ? [0, 255].map((v) => { const x = glass.f(v); return over(glass.tint, [x, x, x, 1]); }) : [[255, 255, 255, 1]];
    let worst = Infinity;
    for (let base of bases) {
      for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base);
      worst = Math.min(worst, ratio(over(fg, base), base));
    }
    if (worst < need) issues.contrast.push(`${worst.toFixed(2)}:1 (needs ${need}) ${glass ? 'on glass ' : ''}"${t.nodeValue.trim().slice(0, 40)}" in ${path(el)}`);
  }
  /* icon-only controls need a name */
  for (const b of document.querySelectorAll('button, a[href], [role="button"], [role="tab"], [role="menuitem"]')) {
    if (hidden(b) || !b.getClientRects().length) continue;
    const name = (b.getAttribute('aria-label') || '').trim() || (b.getAttribute('aria-labelledby') ? 'x' : '') || (b.title || '').trim() || b.textContent.trim();
    if (!name) issues.names.push(path(b));
  }
  /* decision 0059: a button group sets a value or changes how the same thing is shown; tabs swap panels */
  const nameOf = (e) => (e.getAttribute('aria-label') || e.id || '').trim();
  for (const g of document.querySelectorAll('.s4-button-group')) {
    const opts = [...g.children].filter((b) => b.matches('.s4-button, .s4-icon-button'));
    const targets = new Set(); let why = g.matches('[role="tablist"]') ? 'it is a tablist' : '';
    for (const b of opts) {
      if (b.matches('[role="tab"]')) why = 'its options are tabs';
      if (b.matches('[data-view], [data-page-open]')) why = 'an option opens a view or a page';
      for (const id of (b.getAttribute('aria-controls') || '').split(/\s+/).filter(Boolean)) {
        const t = document.getElementById(id); if (!t) continue; targets.add(t);
        if (t.matches('[role="tabpanel"], .s4-tab-panel, .s4-view, .s4-subpage') || (t.hidden && !b.hasAttribute('aria-expanded'))) why = `an option controls the panel #${id}`;
      }
    }
    if (!why && targets.size > 1) why = `its options control ${targets.size} different regions`;
    if (why) issues.roles.push(`button group "${nameOf(g)}" swaps panels (${why}): if it swaps what is on the screen, it is tabs (.s4-tabs with tab panels)`);
  }
  for (const l of document.querySelectorAll('.s4-tabs')) {
    const tabs = [...l.querySelectorAll('.s4-tab')];
    const bare = tabs.filter((t) => { const id = t.getAttribute('aria-controls'); return !id || !document.getElementById(id); });
    if (tabs.length && bare.length) issues.roles.push(`tabs "${nameOf(l)}" without panels (${bare.length} of ${tabs.length} tabs control no tab panel): tabs swap panels; if it changes a value or how the same thing is shown, it is a button group`);
  }
  /* decision 0064: a dialog asks a question the app cannot go on without. One with a single answer is something to read
     (a page) or a notice (a snackbar); one that holds a form is a task (in place, a floating panel or a page), unless its
     answer is destructive (typing a name to confirm a delete) */
  for (const d of document.querySelectorAll('dialog.s4-dialog:not(.s4-palette)')) {
    const answers = new Set([...d.querySelectorAll('[data-close]')].map((b) => b.getAttribute('data-close')));
    const label = d.id || (d.querySelector('.s4-dialog-headline') || d).textContent.trim().slice(0, 40);
    if (answers.size < 2) issues.roles.push(`dialog "${label}" has ${answers.size ? 'one answer' : 'no answer'}: a dialog asks a question the app cannot go on without; something to read is a page (.s4-subpage), a notice is a snackbar`);
    const field = d.querySelector('input:not([type="checkbox"], [type="radio"], [type="hidden"]), textarea, select, [contenteditable="true"]');
    if (field && !d.querySelector('[data-close][data-color="error"]')) issues.roles.push(`dialog "${label}" holds a form: a task goes in place (.s4-expand), in a floating panel (.s4-bottom-sheet) or on a page; a dialog only asks`);
  }
  /* glass on content */
  for (const g of document.querySelectorAll('.s4-glass')) if (g.matches('.s4-card, .s4-pane, .s4-list, .s4-table, .s4-text-field, main, article, p, li, td') || (g.closest('.s4-content') && /^(static|relative)$/.test(getComputedStyle(g).position)))
    issues.glassContent.push(path(g));
  /* one filled button per area */
  const filled = [...document.querySelectorAll('.s4-button:not([data-variant])')].filter((b) => !hidden(b) && b.getClientRects().length && !b.closest('.s4-button-group'));
  const byParent = new Map(); for (const b of filled) { const p = b.parentElement; byParent.set(p, (byParent.get(p) || []).concat(b)); }
  for (const [p, bs] of byParent) if (bs.length > 1) issues.filled.push(`${bs.length} filled buttons in ${path(p)}: ${bs.map((b) => '"' + b.textContent.trim() + '"').join(', ')}`);
  /* one filled action per screen (decision 0070): on the first screen at rest, count every solid accent fill that asks
     to be pressed (buttons and FABs drawn in the primary color, pressed chips), each against its own scope's primary.
     A site header's action is the hero's action kept in reach as the page scrolls (one job), so it is not counted. */
  const onScreen = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth; };
  const loudFills = [...document.querySelectorAll('.s4-button, .s4-fab, .s4-chip[aria-pressed="true"]')].filter((b) => {
    if (hidden(b) || !b.getClientRects().length || !onScreen(b) || b.closest('dialog, [popover], .s4-menu, .s4-button-group, .s4-sheet, .s4-site-header')) return false;
    const probe = document.createElement('i'); probe.style.cssText = 'position:absolute;background:var(--md-sys-color-primary)'; b.parentElement.appendChild(probe);
    const primary = getComputedStyle(probe).backgroundColor; probe.remove();
    return getComputedStyle(b).backgroundColor === primary;
  });
  if (loudFills.length > 1) issues.screenFilled = [`${loudFills.length} accent fills: ${loudFills.map((b) => '"' + b.textContent.trim().slice(0, 30) + '"').join(', ')}`];
  /* Title Case labels */
  const small = new Set('a an the and but or nor for so yet on at to by in of up as vs via with per from into off out over'.split(' '));
  for (const e of document.querySelectorAll('.s4-button, .s4-chip, .s4-tab, .s4-nav-label, .s4-menu-item, th, .s4-app-bar-title, .s4-pane-title, .s4-card-title, .s4-dialog-title, .s4-sheet-title, .s4-text-field label')) {
    if (hidden(e)) continue;
    const c = e.cloneNode(true); c.querySelectorAll('[class*="supporting"], [class*="trailing"], .s4-badge, .s4-icon').forEach((x) => x.remove());
    const words = c.textContent.trim().replace(/\s+/g, ' ').split(' ');
    if (words.length < 2 || words.length > 8 || /[.?!]$/.test(words.at(-1))) continue;
    if (words.slice(1).some((w) => /^[a-z]/.test(w) && !small.has(w))) issues.caseWarn.push(`"${words.join(' ')}" (${path(e)})`);
  }
  return issues;
}

/* ---------------- run ---------------- */
const VIEWS = [
  { name: '390-dark', viewport: { width: 390, height: 844 }, colorScheme: 'dark', isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { name: '1280-light', viewport: { width: 1280, height: 800 }, colorScheme: 'light', deviceScaleFactor: 1 },
];
mkdirSync(OUT, { recursive: true });
/* serve pages over http, as they will be deployed (file:// blocks font preloads and module fetches) */
const TYPES = { html: 'text/html', css: 'text/css', js: 'text/javascript', mjs: 'text/javascript', json: 'application/json', svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', woff2: 'font/woff2', ico: 'image/x-icon' };
const servers = new Map();
async function serve(dir) {
  if (servers.has(dir)) return servers.get(dir);
  const srv = createServer((req, res) => {
    const f = join(dir, decodeURIComponent(req.url.split(/[?#]/)[0]));
    if (!f.startsWith(dir) || !existsSync(f)) { res.writeHead(404); return res.end(); }
    try { const body = readFileSync(f); res.writeHead(200, { 'content-type': TYPES[f.split('.').pop()] || 'application/octet-stream' }); res.end(body); }
    catch { res.writeHead(404); res.end(); }
  });
  await new Promise((ok) => srv.listen(0, '127.0.0.1', ok));
  const base = `http://127.0.0.1:${srv.address().port}`; servers.set(dir, { srv, base }); return servers.get(dir);
}
const browser = await chromium.launch();
let errorCount = 0, warnCount = 0;
for (const page of pages) {
  /* serve from the filesystem root so ../ links resolve as they do on disk (localhost only, for this run) */
  const abs = resolve(page), fsRoot = parse(abs).root;
  const url = /^https?:/.test(page) ? page : `${(await serve(fsRoot)).base}/${abs.slice(fsRoot.length).split(sep).map(encodeURIComponent).join('/')}`;
  const label = basename(page).replace(/\.html?$/, '') || 'page';
  const errors = new Set(), warnings = new Set();

  /* static: inline <style> and local app stylesheets (not orion.css) */
  if (!/^https?:/.test(page) && existsSync(resolve(page))) {
    const html = readFileSync(resolve(page), 'utf8');
    let n = 0;
    for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
      n++; if (/^\s*\/\* Orion [\d.]+ stylesheet|^\s*\/\* Orion brand: /.test(m[1])) continue;     /* orion.css or a brand file inlined by inline.mjs */
      lintCss(m[1], `<style> #${n}`).forEach((e) => errors.add(e));
    }
    for (const m of html.matchAll(/<link[^>]+rel=["']?stylesheet[^>]*>/gi)) {
      const href = (/href=["']?([^"'\s>]+)/.exec(m[0]) || [])[1];
      if (!href || /^(https?:)?\/\//.test(href) || SYSTEM_CSS.test(href.split('?')[0])) continue;
      const f = resolve(dirname(resolve(page)), href.split('?')[0]);
      if (!existsSync(f)) continue;
      const text = readFileSync(f, 'utf8');
      if (/^\s*\/\* Orion brand: /.test(text)) continue;   /* a brand file from brand.mjs (decision 0063) is Orion's own generated scheme, not app CSS */
      lintCss(text, href).forEach((e) => errors.add(e));
    }
    /* the lean app bundle (decision 0069): a page that links orion.core.min.* links exactly the packs it uses */
    if (/orion\.core\.min\.(css|js)/.test(html)) {
      try {
        const { needsOf, linkedPacks, iconsOf } = await import('./packs.mjs');
        const ic = iconsOf(html); if (ic.problem) errors.add(`lean bundle: the page ${ic.problem} (issue 109)`);
        const index = JSON.parse(readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../assets/packs.json'), 'utf8'));
        const need = needsOf(html, index), have = linkedPacks(html, index);
        for (const p of need.packs) if (!have.has(p)) errors.add(`lean bundle: the page uses ${need.why[p].slice(0, 3).join(', ')} but does not link orion.${p}.min.css and orion.${p}.min.js (node scripts/packs.mjs page.html lists them)`);
        for (const p of have) if (p !== 'core' && !need.packs.includes(p)) warnings.add(`lean bundle: orion.${p}.min.* is linked but nothing on the page uses it`);
        if (/orion(\.min)?\.(css|js)\b/.test(html.replace(/orion\.(core|[a-z]+)\.min\.(css|js)/g, ''))) errors.add('lean bundle: the page links the full orion.css/orion.js beside orion.core.min.*; use one or the other');
      } catch (e) { warnings.add('lean bundle: could not read packs.mjs/packs.json beside the checker (' + e.message + ')'); }
    }
    /* one clipboard helper (decision 0073): S4.util.copy(text, { done, fail }) is the only caller of clipboard.writeText */
    const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map((m, i) => [`<script> #${i + 1}`, m[1]]);
    for (const m of html.matchAll(/<script[^>]*\bsrc=["']?([^"'\s>]+)/gi)) {
      const href = m[1].split('?')[0];
      if (/^(https?:)?\/\//.test(href) || /(^|\/)(orion|icons)[\w.-]*\.js$/.test(href)) continue;
      const f = resolve(dirname(resolve(page)), href); if (existsSync(f)) scripts.push([href, readFileSync(f, 'utf8')]);
    }
    for (const [where, rawCode] of scripts) {
      /* S4.util.copy's own call carries a marker and is exempt, once per file (decision 0076; scripts/check-clipboard.mjs) */
      let seen = 0; const code = rawCode.split('\n').filter((l) => !(l.includes('/* s4-clipboard-helper */') && !seen++)).join('\n');
      if (/\bwriteText\s*\(|\[\s*['"]writeText['"]\s*\]/.test(code.replace(/\/\*[\s\S]*?\*\/|(^|\n)\s*\/\/[^\n]*/g, '')))
      errors.add(`${where}: calls clipboard.writeText directly; use S4.util.copy(text, { done: 'Copied', fail: '…' }) (it never rejects, and says when the browser refuses; decision 0073)`);
    }
    for (const m of html.matchAll(/\sstyle="([^"]*)"/gi)) lintCss(`.x{${m[1]}}`, `style=""`).forEach((e) => errors.add(e.replace(/: \.x → /, " → ")));
  }

  for (const v of VIEWS) {
    const ctx = await browser.newContext(v);
    const p = await ctx.newPage();
    p.on('console', (m) => {
      const t = m.text();
      if (m.type() === 'error') errors.add(`[${v.name}] console error: ${t}`);
      else if (m.type() === 'warning' && /^S4:/.test(t)) errors.add(`[${v.name}] ${t}`);
    });
    p.on('pageerror', (e) => errors.add(`[${v.name}] script error: ${e.message}`));
    p.on('requestfailed', (r) => errors.add(`[${v.name}] failed to load ${r.url()}`));
    p.on('response', (r) => { if (r.status() >= 400) errors.add(`[${v.name}] ${r.status()} ${r.url()}`); });
    await p.goto(url, { waitUntil: 'load' });
    await p.evaluate(() => document.fonts && document.fonts.ready);
    await p.waitForTimeout(700);                                            /* springs and dynamic color settle */
    const report = (r, where) => {
      const at = where ? `[${v.name}, ${where}]` : `[${v.name}]`;
      r.overflow.forEach((x) => errors.add(`${at} sideways scroll: ${x}`));
      r.contrast.forEach((x) => errors.add(`${at} low contrast ${x}`));
      r.names.forEach((x) => errors.add(`${at} control with no accessible name (add aria-label): ${x}`));
      r.glassContent.forEach((x) => errors.add(`${at} glass on content: ${x}`));
      r.roles.forEach((x) => errors.add(`${at} ${x}`));
      (r.dials || []).forEach((x) => errors.add(`${at} ${x}`));
      (r.windows || []).forEach((x) => errors.add(`${at} ${x}`));
      (r.glow || []).forEach((x) => errors.add(`${at} ${x}`));   /* the glow scales with the surface (decision 0080) */   /* window controls are full cells to the window's edges (decision 0072) */   /* a dial attribute with a value Orion has no rule for (decision 0067) */
      (r.unknown || []).forEach((x) => errors.add(`${at} unknown class ${x}: nothing in Orion or the page defines it (check the name in the component's README)`));
      (r.broken || []).forEach((x) => errors.add(`${at} ${x}: the box is too narrow for its words (a fixed width, a column that cannot stack, or a part outside its component)`));
      (r.container || []).forEach((x) => errors.add(`${at} ${x}: put it inside its component (see its README)`));
      (r.overfull || []).forEach((x) => errors.add(`${at} control content outside its box: ${x}: size the control to what it holds (min-inline-size, padding or a shorter label); a ring or outline at the edge would clip it (decision 0073)`));
      (r.reach || []).forEach((x) => errors.add(`${at} ${x} (decision 0076: nothing is gesture-only, a handle is hit where it is drawn)`));
      (r.select || []).forEach((x) => errors.add(`${at} ${x} (decision 0078)`));
      (r.nav || []).forEach((x) => errors.add(`${at} ${x}: the highlight is a rounded rectangle that holds the icon and the label (nav-bar.css; never give .s4-nav-pill its own corner)`));
      (r.loud || []).forEach((x) => errors.add(`${at} ${x}: a status is a tint (no data-tone, or success, warning, info, error; the accent tones draw as a wash); only the state that needs action now is warm`));
      r.filled.forEach((x) => warnings.add(`more than one filled button in an area: ${x}`));
      (r.screenFilled || []).forEach((x) => warnings.add(`${at} more than one filled action on one screen at rest (decision 0070: one filled main action; step the others down to elevated, no "All" chip pressed): ${x}`));
      r.caseWarn.forEach((x) => warnings.add(`label may not be Title Case: ${x}`));
    };
    await p.evaluate(knownClasses);
    const audited = async () => Object.assign(await p.evaluate(audit), await p.evaluate(silentAudit), { dials: await p.evaluate(() => (window.S4 && S4.theme && S4.theme.audit ? S4.theme.audit() : [])), windows: await p.evaluate(windowAudit), glow: await p.evaluate(glowAudit) });
    report(await audited());
    const shot = join(OUT, `${label}-${v.name}.png`);
    await p.screenshot({ path: shot, fullPage: true });
    /* app shell views that were hidden on load get the same audit (screenshots show the first view only) */
    const views = await p.evaluate(() => window.S4 && S4.app && document.querySelector('.s4-app') ? [...document.querySelectorAll('.s4-app .s4-view[data-view][hidden]')].map((x) => x.dataset.view) : []);
    if (process.env.S4_CHECK_DEBUG) console.log(`  (${v.name}: also checked views ${views.join(", ")})`);
    for (const name of views) {
      await p.evaluate((n) => S4.app.go(document.querySelector('.s4-app'), n), name);
      await p.waitForTimeout(900);
      report(await audited(), `view "${name}"`);
    }
    /* mid-motion (issue 70): the rail, dialogs, panels, menus, expands, accordions and pages frozen at 25, 50 and 75% */
    (await midMotion(p)).forEach((x) => errors.add(`[${v.name}] ${x}: nothing may wrap or reflow while it moves (lay it out at its end size and clip or fade it)`));
    await ctx.close();
  }

  console.log(`\n${page}`);
  if (!errors.size && !warnings.size) console.log('  ✓ no problems found');
  for (const e of errors) console.log('  ✗ ' + e);
  for (const w of warnings) console.log('  ! ' + w);
  console.log(`  screenshots: ${join(OUT, label)}-390-dark.png, ${label}-1280-light.png`);
  errorCount += errors.size; warnCount += warnings.size;
}
await browser.close();
for (const { srv } of servers.values()) srv.close();
console.log(`\n${errorCount} error(s), ${warnCount} warning(s).${errorCount ? ' Fix the errors and run it again.' : ''}`);
process.exit(errorCount ? 1 : 0);
