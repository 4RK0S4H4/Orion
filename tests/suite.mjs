#!/usr/bin/env node
/* S4 Orion production suite (issue 41): every component page, every template, the showcase, the hub and the tokens
   page, in Chromium and WebKit, as a 390px dark phone and a 1280px light desktop (plus one reduced-motion pass).
   On each page it checks:
     load      no script errors, console errors or failed requests; no sideways scroll; every icon drawn; no duplicate
               ids; every control has a name; every field has a label
     focus     no focus ring is cut off by a bar, a scrolling pane or the edge of the screen (issue 42)
     touch     at 390, nothing you tap is smaller than 24px (WCAG 2.2)
     use       it then uses the page: opens and closes every dialog, panel, menu, expand, page, inline confirm, accordion,
               tab, date picker and select, visits every view, hovers a tooltip. Each overlay must fit the screen, close
               with Escape and give focus back; nothing may be left open, stuck mid-animation or throw.
   Usage: node tests/suite.mjs [--browser=chromium|webkit] [--only=text] [--shots] [--workers=4]
   Without --browser both run; a browser that is not installed fails the run in CI and is skipped (loudly) elsewhere.
   Playwright is the only dependency (npm i -D playwright && npx playwright install chromium webkit). */
import { readFileSync, readdirSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, resolve } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith('--' + n + '=')); return a ? a.split('=')[1] : d; };
const ONLY = arg('only', ''), WORKERS = +arg('workers', 4), SHOTS = process.argv.includes('--shots');
const CI = !!process.env.CI;

let pw;
try { pw = await import('playwright'); } catch { try { pw = createRequire(resolve('x.js'))('playwright'); } catch { try { pw = createRequire(import.meta.url)('playwright'); } catch {} } }
if (!pw) { console.error('Playwright is not installed: npm i -D playwright && npx playwright install chromium webkit'); process.exit(2); }

/* ---------- pages ---------- */
const pages = ['index.html', 'tokens/index.html', 'components/index.html', 'demo/index.html'];
for (const d of readdirSync(join(root, 'components'))) {
  const f = `components/${d}/${d}.html`;
  if (existsSync(join(root, f))) pages.push(f);
}
pages.push('components/base/themes.html');   /* themes on any container (issue 52) */
for (const f of readdirSync(join(root, 'templates'))) if (f.endsWith('.html')) pages.push('templates/' + f);
pages.push('explore/ideas.html', 'explore/degree-tracker.html');   /* the current quiz, in the Orion quiz UI (decision 0048) */
const DIALS_ONLY = process.argv.includes('--dials-only');
const targets = DIALS_ONLY ? [] : pages.filter((p) => !ONLY || p.includes(ONLY));

/* ---------- static server ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg' };
const server = createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = join(root, p);
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file)) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const ORIGIN = 'http://127.0.0.1:' + server.address().port;

/* ---------- checks that run inside the page ---------- */
function audit(opts) {
  const out = [];
  const vis = (el) => { if (!el.isConnected) return false; const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && !el.closest('[hidden], [inert]'); };
  const name = (el) => (el.getAttribute('aria-label') || '').trim() || (el.getAttribute('aria-labelledby') || '').split(/\s+/).map((id) => (document.getElementById(id) || {}).textContent || '').join(' ').trim() || (el.textContent || '').trim() || (el.getAttribute('title') || '').trim() || (el.querySelector && el.querySelector('img[alt]') ? el.querySelector('img[alt]').alt : '');
  const tag = (el) => { let s = el.tagName.toLowerCase(); if (el.id) s += '#' + el.id; else if (el.className && typeof el.className === 'string') s += '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.'); const t = (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 24); return t ? `${s} "${t}"` : s; };
  const inPreview = (el) => !!el.closest('[data-s4-skip], iframe');

  /* sideways scroll */
  const ov = document.documentElement.scrollWidth - window.innerWidth;
  if (ov > 1) {
    const wide = [...document.querySelectorAll('body *')].filter((e) => vis(e) && e.getBoundingClientRect().right > window.innerWidth + 1 && !e.closest('[data-scroll], .s4-table-wrap, [style*="overflow"]')).slice(0, 3).map(tag);
    out.push(`sideways scroll: page is ${ov}px wider than the screen (${wide.join(', ')})`);
  }
  /* icons */
  document.querySelectorAll('.s4-icon[data-icon]').forEach((i) => { if (!i.querySelector('svg') && !inPreview(i)) out.push(`icon not drawn: "${i.dataset.icon}"`); });
  /* decision 0059: a button group sets a value or changes how the same thing is shown; tabs swap panels */
  const gname = (e) => (e.getAttribute('aria-label') || e.id || '').trim();
  document.querySelectorAll('.s4-button-group').forEach((g) => {
    if (inPreview(g)) return;
    const targets = new Set(); let why = g.matches('[role="tablist"]') ? 'it is a tablist' : '';
    [...g.children].filter((b) => b.matches('.s4-button, .s4-icon-button')).forEach((b) => {
      if (b.matches('[role="tab"]')) why = 'its options are tabs';
      if (b.matches('[data-view], [data-page-open]')) why = 'an option opens a view or a page';
      (b.getAttribute('aria-controls') || '').split(/\s+/).filter(Boolean).forEach((id) => {
        const t = document.getElementById(id); if (!t) return; targets.add(t);
        if (t.matches('[role="tabpanel"], .s4-tab-panel, .s4-view, .s4-subpage') || (t.hidden && !b.hasAttribute('aria-expanded'))) why = `an option controls the panel #${id}`;
      });
    });
    if (!why && targets.size > 1) why = `its options control ${targets.size} different regions`;
    if (why) out.push(`button group "${gname(g)}" swaps panels (${why}): if it swaps what is on the screen, it is tabs`);
  });
  document.querySelectorAll('.s4-tabs').forEach((l) => {
    if (inPreview(l)) return;
    const tabs = [...l.querySelectorAll('.s4-tab')], bare = tabs.filter((t) => { const id = t.getAttribute('aria-controls'); return !id || !document.getElementById(id); });
    if (tabs.length && bare.length) out.push(`tabs "${gname(l)}" without panels (${bare.length} of ${tabs.length}): if it changes a value or how the same thing is shown, it is a button group`);
  });
  /* duplicate ids */
  const seen = new Map();
  document.querySelectorAll('[id]').forEach((e) => { if (e.id && !e.closest('svg')) seen.set(e.id, (seen.get(e.id) || 0) + 1); });
  for (const [id, n] of seen) if (n > 1) out.push(`duplicate id "${id}" (${n} times)`);
  /* names and labels */
  document.querySelectorAll('button, a[href], [role="button"], [role="tab"], [role="menuitem"], summary').forEach((el) => { if (vis(el) && !name(el)) out.push(`control without a name: ${tag(el)}`); });
  document.querySelectorAll('input:not([type="hidden"]), select, textarea').forEach((el) => {
    if (el.getAttribute('aria-hidden') === 'true' || el.hasAttribute('data-s4-native')) return;   /* replaced by a labelled Orion control */
    if (!vis(el) && !el.closest('label')) return;
    const labelled = el.labels && el.labels.length || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.getAttribute('title') || el.getAttribute('placeholder');
    if (!labelled && !el.closest('[hidden]')) out.push(`field without a label: ${tag(el)}`);
  });
  /* touch targets on a phone: the tappable box, counting an enlarged ::after hit area */
  if (opts.phone) {
    document.querySelectorAll('button, a[href], input, select, summary, [role="button"], [role="tab"]').forEach((el) => {
      if (!vis(el) || el.disabled || el.getAttribute('aria-disabled') === 'true' || el.tabIndex < 0 && el.tagName !== 'INPUT') return;
      if (el.closest('.ex-foot, .s4-prose, p, footer, li > a:only-child') && el.tagName === 'A') return;                    /* links inside text follow the text */
      let r = el.getBoundingClientRect(), w = r.width, h = r.height;
      if (el.tagName === 'INPUT' && el.closest('label, .s4-switch, .s4-checkbox, .s4-radio, .s4-slider, .s4-text-field, .s4-search')) { r = el.closest('label, .s4-switch, .s4-checkbox, .s4-radio, .s4-slider, .s4-text-field, .s4-search').getBoundingClientRect(); w = r.width; h = r.height; }
      for (const ps of ['::after', '::before']) { const cs = getComputedStyle(el, ps); if (cs.content !== 'none' && cs.position === 'absolute') { w = Math.max(w, parseFloat(cs.width) || 0); h = Math.max(h, parseFloat(cs.height) || 0); } }
      if (w < 24 || h < 24) out.push(`touch target ${Math.round(w)}x${Math.round(h)} is under 24px: ${tag(el)}`);
    });
  }
  return out;
}

/* nested corners (decision 0052): a rounded thing that sits tight in the corner of a rounded container must be
   concentric with it: its radius is the container's radius minus the gap (or it is a full pill). A squarer inner
   corner inside a rounder outer one is the mismatch people see at once. */
function nestAudit(minR) {
  const out = [];
  minR = typeof minR === 'number' ? minR : 12;      /* the dial presets pass 8: a firm container's corner is 10 */
  const px = (v) => (/%/.test(v) ? 0 : parseFloat(v) || 0);
  const solid = (cs) => { const c = cs.backgroundColor; return c && c !== 'transparent' && !/rgba?\([^)]*,\s*0\)$/.test(c) || cs.backgroundImage !== 'none' || cs.backdropFilter && cs.backdropFilter !== 'none'; };
  const tag = (el) => { let s = el.tagName.toLowerCase(); if (el.id) s += '#' + el.id; else if (el.className && typeof el.className === 'string') s += '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.'); return s; };
  const seen = new Set();
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el), r = el.getBoundingClientRect();
    if (r.width < 24 || r.height < 24 || cs.visibility === 'hidden' || cs.display === 'none' || el.closest('[hidden], svg, iframe, .rv-preview, [data-s4-skip]')) continue;
    if (!solid(cs)) continue;
    const mine = { tl: px(cs.borderTopLeftRadius), tr: px(cs.borderTopRightRadius), bl: px(cs.borderBottomLeftRadius), br: px(cs.borderBottomRightRadius) };
    const pill = Math.min(r.width, r.height) / 2 - 1;
    /* the nearest rounded surface it sits in */
    let p = el.parentElement, host = null, hcs = null;
    for (; p && p !== document.body; p = p.parentElement) { const c = getComputedStyle(p); if (px(c.borderTopLeftRadius) >= minR && (solid(c) || /hidden|clip/.test(c.overflow))) { host = p; hcs = c; break; } if (solid(c) && px(c.borderTopLeftRadius) < minR) break; }
    if (!host) continue;
    const h = host.getBoundingClientRect();
    const corners = [['tl', r.left - h.left, r.top - h.top, px(hcs.borderTopLeftRadius)], ['tr', h.right - r.right, r.top - h.top, px(hcs.borderTopRightRadius)], ['bl', r.left - h.left, h.bottom - r.bottom, px(hcs.borderBottomLeftRadius)], ['br', h.right - r.right, h.bottom - r.bottom, px(hcs.borderBottomRightRadius)]];
    for (const [k, gx, gy, R] of corners) {
      if (R < minR || gx < 0 || gy < 0 || gx > 14 || gy > 14 || Math.abs(gx - gy) > 6) continue;   /* only a corner tucked tight into a corner */
      if (R >= Math.min(h.width, h.height) / 2 - 1) continue;                                   /* the container is a pill */
      if ((gx + gy) / 2 < 3 && /hidden|clip|auto|scroll/.test(hcs.overflowX + hcs.overflowY)) continue;   /* flush against a container that clips it: the container's corner is the one you see */
      const want = Math.max(0, R - (gx + gy) / 2), have = mine[k];
      if (have >= pill || have >= want - 3) continue;
      const key = tag(el) + ' in ' + tag(host);
      if (seen.has(key)) continue; seen.add(key);
      out.push(`corner mismatch: ${tag(el)} has a ${Math.round(have)}px corner ${Math.round((gx + gy) / 2)}px inside ${tag(host)}'s ${Math.round(R)}px corner (concentric would be ${Math.round(want)}px)`);
    }
  }
  return out;
}

/* focus rings: focus each control the keyboard can reach and see whether its ring is cut off */
function focusAudit() {
  const out = [];
  const vis = (el) => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && !el.closest('[hidden], [inert]'); };
  const tag = (el) => { let s = el.tagName.toLowerCase(); if (el.id) s += '#' + el.id; else if (el.className && typeof el.className === 'string') s += '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.'); const t = (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 24); return t ? `${s} "${t}"` : s; };
  const els = [...document.querySelectorAll('button, a[href], input:not([type="hidden"]), select, textarea, summary, [tabindex]:not([tabindex="-1"])')].filter((e) => vis(e) && !e.disabled).slice(0, 120);
  const before = document.activeElement, sx = window.scrollX, sy = window.scrollY;
  for (const el of els) {
    try { el.focus({ preventScroll: true }); } catch (e) { continue; }
    if (document.activeElement !== el) continue;
    /* the ring may be drawn on the control or on its visual box (checkbox, switch, field) */
    const boxes = [el, ...[el.parentElement, el.parentElement && el.parentElement.parentElement].filter(Boolean), ...el.parentElement.querySelectorAll(':scope > *')];
    let ring = null;
    for (const b of boxes) {
      const cs = getComputedStyle(b), w = parseFloat(cs.outlineWidth) || 0;
      if (cs.outlineStyle !== 'none' && w >= 1 && cs.outlineColor !== 'rgba(0, 0, 0, 0)' && cs.outlineColor !== 'transparent') {
        const r = b.getBoundingClientRect(), g = w + (parseFloat(cs.outlineOffset) || 0);   /* a negative offset draws the ring inside */
        if (r.width && r.height) { ring = { el: b, l: r.left - g, t: r.top - g, r: r.right + g, b: r.bottom + g, box: r }; break; }
      }
    }
    if (!ring) continue;
    /* an ancestor that clips: only a problem when the control itself is fully inside it but its ring is not */
    for (let p = ring.el.parentElement; p && p !== document.documentElement; p = p.parentElement) {
      const cs = getComputedStyle(p);
      const cx = /hidden|clip|auto|scroll/.test(cs.overflowX), cy = /hidden|clip|auto|scroll/.test(cs.overflowY);
      if (!cx && !cy) continue;
      const c = p.getBoundingClientRect(), pad = 0.75;
      const inX = ring.box.left >= c.left - pad && ring.box.right <= c.right + pad, inY = ring.box.top >= c.top - pad && ring.box.bottom <= c.bottom + pad;
      const cut = [];
      if (cx && inX && inY) { if (ring.l < c.left - pad) cut.push('left'); if (ring.r > c.right + pad) cut.push('right'); }
      if (cy && inX && inY) { if (ring.t < c.top - pad) cut.push('top'); if (ring.b > c.bottom + pad) cut.push('bottom'); }
      /* a scrolling box can scroll the ring into view unless the control sits at its very start or end */
      const scrolls = (cx && p.scrollWidth > p.clientWidth + 1) || (cy && p.scrollHeight > p.clientHeight + 1);
      if (cut.length && !(scrolls && /auto|scroll/.test(cs.overflowX + cs.overflowY) && cut.every((s) => (s === 'top' && p.scrollTop > 0) || (s === 'bottom' && p.scrollTop + p.clientHeight < p.scrollHeight - 1) || (s === 'left' && p.scrollLeft > 0) || (s === 'right' && p.scrollLeft + p.clientWidth < p.scrollWidth - 1)))) {
        out.push(`focus ring cut off at the ${cut.join(' and ')} by ${tag(p)}: ${tag(el)}`); break;
      }
    }
    if (ring.box.left >= 0 && ring.box.right <= window.innerWidth && (ring.l < -0.75 || ring.r > window.innerWidth + 0.75)) out.push(`focus ring runs off the side of the screen: ${tag(el)}`);
  }
  if (before && before.focus) try { before.focus({ preventScroll: true }); } catch (e) {} else if (document.activeElement) document.activeElement.blur();
  window.scrollTo(sx, sy);
  return [...new Set(out)];
}

/* ---------- brand dial presets (decision 0055, round 0056) ---------- */
/* what the corner dial must reach, what must stay round under every dial (switches, radios, checkbox layers, sliders,
   progress, avatars, badges, date-picker discs, status dots) is listed in EXEMPT */
function dialAudit(opts) {
  const out = [];
  const tag = (el) => { let s = el.tagName.toLowerCase(); if (el.className && typeof el.className === 'string') s += '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.'); const t = (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 22); return t ? `${s} "${t}"` : s; };
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;left:0;top:0;width:400px;height:400px;visibility:hidden;border-radius:var(--s4-shape-control)';
  document.body.appendChild(probe);
  const dial = Math.min(200, parseFloat(getComputedStyle(probe).borderTopLeftRadius) || 0);
  probe.remove();
  const rad = (cs) => Math.min(...['TopLeft', 'TopRight', 'BottomLeft', 'BottomRight'].map((k) => parseFloat(cs['border' + k + 'Radius']) || 0));
  const shown = (el) => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return r.width >= 8 && r.height >= 8 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0 && !el.closest('[hidden], [inert], [data-s4-skip], svg'); };
  /* (a) corners: everything you click that is meant to follow the dial must not be a pill when the dial is not round */
  if (opts.dial) {
    const FOLLOW = '.s4-menubar-item, .s4-doc-tab, .s4-statusbar-item, .s4-tree-row, .s4-button, .s4-icon-button, .s4-chip, .s4-tab, .s4-nav-item, .s4-nav-indicator, .s4-nav-pill, .s4-menu-item, .s4-pagination a, .s4-pagination button, .s4-pagination li, .s4-breadcrumbs a, .s4-breadcrumbs [aria-current], .s4-fab, .s4-segment, .s4-button-group > :not(.s4-button-group-ink), .s4-status, .s4-tooltip, .s4-list-item, .s4-tabs-indicator, .s4-select-option, .s4-color-field-swatch, .s4-rating-star';
    const EXEMPT = '.s4-badge, .s4-avatar, .s4-chip-avatar, .s4-switch *, .s4-radio *, .s4-checkbox *, .s4-slider *, .s4-progress *, .s4-date-picker-day, .s4-status-dot, .s4-chip-remove, [data-shape="circle"]';
    const seen = new Set();
    for (const el of document.querySelectorAll(FOLLOW)) {
      if (!shown(el) || el.matches(EXEMPT)) continue;
      const r = el.getBoundingClientRect(), cs = getComputedStyle(el), have = rad(cs);
      const sq = Math.abs(r.width - r.height) < 2;           /* a round icon button is allowed to be a circle only when the dial is round */
      if (have > dial + 0.5 && have >= Math.min(r.width, r.height) / 2 - 1) { const k = tag(el).replace(/ ".*/, ''); if (!seen.has(k)) { seen.add(k); out.push(`corners ${dial}px: ${tag(el)} is still a pill (${Math.round(have)}px${sq ? ', square box' : ''}); route its radius through --s4-shape-control`); } }
    }
  }
  /* (d) a label must not be clipped or run past its control */
  const LABELS = '.s4-button, .s4-chip, .s4-tab, .s4-nav-label, .s4-menu-item, .s4-segment, .s4-pagination a, .s4-breadcrumbs a, .s4-app-bar-title, .s4-card-title, .s4-dialog-title, .s4-stat-value';
  const seenL = new Set();
  for (const el of document.querySelectorAll(LABELS)) {
    if (!shown(el)) continue;
    const cs = getComputedStyle(el);
    if (cs.textOverflow === 'ellipsis' || /auto|scroll/.test(cs.overflowX)) continue;
    const clipX = /hidden|clip/.test(cs.overflowX) && el.scrollWidth > el.clientWidth + 1;
    const clipY = /hidden|clip/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 2;
    if (clipX || clipY) { const k = tag(el).replace(/ ".*/, '') + (clipX ? 'x' : 'y'); if (!seenL.has(k)) { seenL.add(k); out.push(`clipped label (${clipX ? 'sideways' : 'height'}): ${tag(el)}`); } }
  }
  return out;
}

/* (c) text contrast as rendered, AA: 4.5, or 3 for large text; text on glass is checked against the worst backdrop
   after the glass's own filter and tint (the same method as skill/s4-orion/scripts/check.mjs) */
function contrastAudit(seeded) {
  const out = [];      /* seeded: colored FABs and the vibrant toolbar are glass in the accent's own color: the recorded exception (decisions 0028 and 0032) */
  const cv = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  const parse = (c) => {
    let m = c.match(/^rgba?\(([^)]+)\)/);
    if (m) { const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] == null ? 1 : p[3]]; }
    m = c.match(/^color\(srgb ([^)]+)\)/);
    if (m) { const p = m[1].split(/[\s/]+/).filter(Boolean).map(Number); return [p[0] * 255, p[1] * 255, p[2] * 255, p[3] == null ? 1 : p[3]]; }
    if (!c || c === 'transparent') return null;
    cv.clearRect(0, 0, 1, 1); cv.fillStyle = '#000'; cv.fillStyle = c; cv.fillRect(0, 0, 1, 1);
    const d = cv.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255];
  };
  const over = (top, bot) => { const a = top[3]; return [0, 1, 2].map((i) => top[i] * a + bot[i] * (1 - a)).concat(1); };
  const lum = (c) => { const v = c.slice(0, 3).map((x) => { x /= 255; return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const filterOf = (f) => { const c = /contrast\(([\d.]+)\)/.exec(f), b = /brightness\(([\d.]+)\)/.exec(f); return (v) => Math.min(255, Math.max(0, ((v - 127.5) * (c ? +c[1] : 1) + 127.5) * (b ? +b[1] : 1))); };
  const off = (e) => e.closest('[hidden],[inert],[aria-hidden="true"],.s4-visually-hidden,[disabled],[aria-disabled="true"],:disabled,[data-s4-skip]') || ['label', '.s4-text-field', '.s4-list-item'].some((q) => { const c = e.closest(q); return c && c.querySelector('input:disabled, select:disabled, textarea:disabled'); });
  const path = (e) => { const b = []; for (let n = e; n && n !== document.body && b.length < 3; n = n.parentElement) { let s = n.tagName.toLowerCase(); if (n.id) s += '#' + n.id; else if (n.classList.length) s += '.' + [...n.classList].slice(0, 2).join('.'); b.unshift(s); } return b.join(' > '); };
  const seen = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: (n) => n.nodeValue.trim() ? 1 : 2 });
  for (let t; (t = walker.nextNode());) {
    const el = t.parentElement; if (!el || seen.has(el) || off(el) || (seeded && el.closest('.s4-fab, .s4-toolbar[data-color="vibrant"]')) || /^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|OPTION)$/.test(el.tagName)) continue;
    seen.add(el);
    const cs = getComputedStyle(el), r = el.getBoundingClientRect();
    if (!r.width || !r.height || cs.visibility !== 'visible' || +cs.opacity === 0) continue;
    const fg = parse(cs.color); if (!fg) continue;
    const layers = []; let glass = null, opacity = 1, unknown = false;
    for (let n = el; n; n = n.parentElement) {
      const s = getComputedStyle(n); opacity *= +s.opacity;
      const bg = parse(s.backgroundColor), bf = s.backdropFilter || s.webkitBackdropFilter;
      if (bf && bf !== 'none' && bg && bg[3] < 1) { glass = { tint: bg, f: filterOf(bf) }; break; }
      if (s.backgroundImage !== 'none') unknown = true;
      if (bg && bg[3] > 0) { layers.push(bg); if (bg[3] >= 1) break; }
      if (n.matches('.s4-tab[aria-selected="true"], .s4-nav-item[aria-current]:not([aria-current="false"])')) { const pill = n.parentElement && n.parentElement.querySelector(':scope > .s4-tabs-indicator, :scope > .s4-nav-pill'); const pb = pill && parse(getComputedStyle(pill).backgroundColor); if (pb && pb[3] > 0) layers.push(pb); }
      if (n.matches('.s4-button-group[data-s4-ink] > [aria-pressed="true"]')) { const ink = n.parentElement.querySelector(':scope > .s4-button-group-ink:not([hidden])'); const ib = ink && parse(getComputedStyle(ink, '::before').backgroundColor); if (ib) { ib[3] *= +getComputedStyle(ink).opacity; if (ib[3] > 0) layers.push(ib); } }
    }
    if (unknown || opacity < 0.99) continue;
    const size = parseFloat(cs.fontSize), bold = +cs.fontWeight >= 700, large = size >= 24 || (bold && size >= 18.66), need = large ? 3 : 4.5;
    const bases = glass ? [0, 255].map((v) => { const x = glass.f(v); return over(glass.tint, [x, x, x, 1]); }) : [[255, 255, 255, 1]];
    let worst = Infinity;
    for (let base of bases) { for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base); worst = Math.min(worst, ratio(over(fg, base), base)); }
    if (worst < need) out.push(`contrast ${worst.toFixed(2)}:1 (needs ${need}) ${glass ? 'on glass ' : ''}"${t.nodeValue.trim().slice(0, 30)}" in ${path(el)}`);
  }
  return out;
}

/* ---------- using the page ---------- */
async function use(page, add, phone) {
  /* wait for motion to end rather than for a fixed time: a slow machine must not look like a bug */
  const settle = async (ms = 420) => {
    await page.waitForTimeout(Math.min(ms, 160));
    await page.waitForFunction(() => !document.getAnimations().some((a) => { try { return (a.playState === 'running' || a.pending) && a.effect.getComputedTiming().iterations !== Infinity; } catch (e) { return false; } }), null, { timeout: 4000 }).catch(() => {});
    await page.waitForTimeout(120);
  };
  const until = (fn, argv) => page.waitForFunction(fn, argv, { timeout: 3000 }).then(() => true, () => false);
  const visible = async (sel) => { const all = await page.locator(sel).all(); const out = []; for (const l of all) if (await l.isVisible().catch(() => false)) out.push(l); return out; };
  const fits = (id) => page.evaluate((id) => { const d = document.getElementById(id); if (!d) return 'missing'; const r = d.getBoundingClientRect(); if (!r.width || !r.height) return 'not shown'; return r.left < -1 || r.top < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1 ? `does not fit the screen (${Math.round(r.left)},${Math.round(r.top)} to ${Math.round(r.right)},${Math.round(r.bottom)} in ${innerWidth}x${innerHeight})` : ''; }, id);
  const click = async (l, what) => { try { await l.scrollIntoViewIfNeeded({ timeout: 5000 }); await l.click({ timeout: 5000 }); return true; } catch (e) { add(`${what}: could not be clicked (${String(e.message).split('\n')[0].slice(0, 90)})`); return false; } };
  const closeAll = async () => { for (let i = 0; i < 3; i++) { const open = await page.evaluate(() => document.querySelectorAll('dialog[open], .s4-menu:popover-open, [popover]:popover-open').length).catch(() => 0); if (!open) return; await page.keyboard.press('Escape'); await settle(350); } };

  /* every view of an app shell, then the checks inside each */
  const views = [...new Set(await page.evaluate(() => [...document.querySelectorAll('.s4-nav-item[data-view]')].map((a) => a.dataset.view)))];
  const rounds = views.length ? views : [null];
  for (const view of rounds) {
    if (view) {
      const nav = (await visible(`.s4-nav-item[data-view="${view}"]`))[0];
      if (!nav) { add(`view "${view}" has no visible navigation item`); continue; }
      if (!(await click(nav, `navigation to "${view}"`))) continue;
      /* the page must not get wider than the screen even while the views switch */
      let peak = 0; for (let i = 0; i < 8; i++) { peak = Math.max(peak, await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)); await page.waitForTimeout(30); }
      if (peak > 1) add(`view "${view}": the page is ${peak}px too wide while the views switch`);
      await settle(520);
      const shown = await until((v) => { const s = document.querySelector(`.s4-view[data-view="${v}"]`); return !s || !s.hidden; }, view);
      await settle();
      if (!shown) add(`view "${view}" did not show after its navigation item was clicked`);
      const ov = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (ov > 1) add(`view "${view}": sideways scroll (${ov}px)`);
    }
    /* dialogs and panels */
    const openers = await page.evaluate(() => { const seen = new Set(), out = []; document.querySelectorAll('[data-dialog], [data-sheet]').forEach((b) => { const id = b.dataset.dialog || b.dataset.sheet; if (seen.has(id)) return; const r = b.getBoundingClientRect(); if (r.width && !b.closest('[hidden]') && getComputedStyle(b).visibility !== 'hidden') { seen.add(id); out.push(id); } }); return out; });
    for (const id of openers) {
      const b = (await visible(`[data-dialog="${id}"], [data-sheet="${id}"]`))[0]; if (!b) continue;
      if (!(await click(b, `opener of "${id}"`))) continue;
      await settle(520);
      const isOpen = await page.evaluate((id) => { const d = document.getElementById(id); return !!d && d.open; }, id);
      if (!isOpen) { add(`dialog "${id}" did not open`); continue; }
      const f = await fits(id); if (f) add(`dialog "${id}" ${f}`);
      (await page.evaluate(nestAudit)).forEach(add);
      const fieldFocused = await page.evaluate((id) => { const a = document.activeElement, d = document.getElementById(id); return d.contains(a) && a.matches('input:not([type="checkbox"]):not([type="radio"]):not([type="range"]), textarea, select, [contenteditable]'); }, id);
      if (fieldFocused) add(`dialog "${id}" put the cursor in a text field when it opened (decision 0049)`);
      await page.keyboard.press('Escape'); await settle(520);
      const still = !(await until((id) => !document.getElementById(id).open, id));
      if (still) { add(`dialog "${id}" did not close with Escape`); await closeAll(); continue; }
      const back = await page.evaluate((id) => { const a = document.activeElement; return !!a && (a.dataset.dialog === id || a.dataset.sheet === id); }, id);
      if (!back) add(`dialog "${id}" did not give focus back to its opener`);
    }
    /* menus */
    const menus = await page.evaluate(() => { const seen = new Set(), out = []; document.querySelectorAll('[data-menu]').forEach((b) => { const id = b.dataset.menu; const r = b.getBoundingClientRect(); if (!seen.has(id) && r.width && !b.closest('[hidden], dialog:not([open])')) { seen.add(id); out.push(id); } }); return out; });
    for (const id of menus) {
      const b = (await visible(`[data-menu="${id}"]`))[0]; if (!b) continue;
      if (!(await click(b, `menu button for "${id}"`))) continue;
      await settle(480);
      const f = await fits(id); if (f) add(`menu "${id}" ${f}`);
      (await page.evaluate(nestAudit)).forEach(add);
      await page.keyboard.press('Escape'); await settle(380);
      const gone = await until((id) => { const m = document.getElementById(id); if (!m) return true; const r = m.getBoundingClientRect(); return !(r.width > 0 && getComputedStyle(m).visibility !== 'hidden' && getComputedStyle(m).display !== 'none'); }, id);
      if (!gone) { add(`menu "${id}" did not close with Escape`); await page.mouse.click(2, 2); await settle(300); }
    }
    /* website kit: the phone menu and other site panels open as floating glass, close with Escape and give focus back */
    const sitePanels = await visible('.s4-site-menu-button, [data-site-panel]');
    for (const b of sitePanels) {
      const what = await b.evaluate((x) => x.getAttribute('aria-label') || x.textContent.trim());
      if (!(await click(b, `site panel button "${what}"`))) continue;
      await settle(480);
      const st = await b.evaluate((x) => { const p = document.getElementById(x.getAttribute('aria-controls') || ''); if (!p) return { missing: true }; const r = p.getBoundingClientRect(), a = document.activeElement; return { exp: x.getAttribute('aria-expanded'), shown: p.hasAttribute('data-open') && r.width > 0 && r.height > 0, id: p.id, field: !!a && p.contains(a) && a.matches('input:not([type="checkbox"]):not([type="radio"]), textarea, select'), glass: getComputedStyle(p).backdropFilter !== 'none' || getComputedStyle(p).webkitBackdropFilter !== 'none' }; });
      if (st.missing) { add(`site panel "${what}" has no panel (aria-controls)`); continue; }
      if (st.exp !== 'true' || !st.shown) { add(`site panel "${what}" did not open`); continue; }
      const f = await fits(st.id); if (f) add(`site panel "${what}" ${f}`);
      if (st.field) add(`site panel "${what}" put the cursor in a text field (decision 0049)`);
      if (!st.glass) add(`site panel "${what}" is not glass`);
      await page.keyboard.press('Escape'); await settle(420);
      const closed = await until((id) => !document.getElementById(id).hasAttribute('data-open'), st.id);
      if (!closed) { add(`site panel "${what}" did not close with Escape`); continue; }
      if (!(await b.evaluate((x) => document.activeElement === x))) add(`site panel "${what}" did not give focus back to its button`);
    }
    /* website kit: the pricing period switch changes the prices; the comparison picker changes the column */
    for (const g of await visible('[data-period]')) {
      const off = g.locator('button[value]:not([aria-pressed="true"])').first();
      /* the switch's own values (monthly/yearly, a pack, a layer): whatever it names, its texts must change */
      const sel = await g.evaluate((x) => [...x.querySelectorAll('button[value]')].map((b) => '[data-period-' + b.value + ']').join(', '));
      const before = await page.evaluate((sel) => [...document.querySelectorAll(sel)].map((e) => e.textContent).join('|'), sel);
      if (!(await click(off, 'pricing period switch'))) continue;
      await settle(300);
      const after = await page.evaluate((sel) => [...document.querySelectorAll(sel)].map((e) => e.textContent).join('|'), sel);
      if (before === after) add('period switch ([data-period]) did not change its texts');
    }
    for (const c of await visible('.s4-compare > .s4-button-group')) {
      const off = c.locator('button[value]:not([aria-pressed="true"])').first();
      const v = await off.getAttribute('value');
      if (!(await click(off, 'comparison plan picker'))) continue;
      await settle(200);
      if ((await c.evaluate((x) => x.parentElement.dataset.show)) !== v) add('comparison plan picker did not change the column shown');
    }
    if (await page.locator('.s4-toc').isVisible().catch(() => false)) {
      const ok = await page.evaluate(async () => { const links = [...document.querySelectorAll('.s4-toc a[href^="#"]')]; const last = document.getElementById(links.at(-1).hash.slice(1)); window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 300)); const on = links.filter((a) => a.getAttribute('aria-current') === 'location'); window.scrollTo({ top: 0, behavior: 'instant' }); return !!last && on.length === 1 && on[0] === links.at(-1); });
      if (!ok) add('on-this-page contents did not mark the last section when scrolled to the end');
      await settle(200);
    }
    /* expand in place */
    const expands = await page.evaluate(() => [...new Set([...document.querySelectorAll('[data-expand]:not(.s4-nav-rail)')].filter((b) => b.getBoundingClientRect().width && !b.closest('[hidden]')).map((b) => b.dataset.expand))]);
    for (const id of expands) {
      const b = (await visible(`[data-expand="${id}"]`))[0]; if (!b) continue;
      const shownView = () => page.evaluate(() => { const v = document.querySelector('.s4-view:not([hidden])'); return v ? v.dataset.view : ''; });
      const before = await page.evaluate(() => document.documentElement.scrollHeight), viewBefore = await shownView();
      if (!(await click(b, `opener of expand "${id}"`))) continue;
      await settle(650);
      const st = await page.evaluate((id) => { const x = document.getElementById(id); return { hidden: x.hidden, h: x.getBoundingClientRect().height, exp: [...document.querySelectorAll(`[data-expand="${id}"]`)].every((o) => o.getAttribute('aria-expanded') === 'true'), inline: x.style.height || x.style.overflow }; }, id);
      if (st.hidden || st.h < 8) { add(`expand "${id}" did not open`); continue; }
      if (!st.exp) add(`expand "${id}": its opener does not say aria-expanded="true"`);
      if (await page.evaluate(() => { const a = document.activeElement; return !!a && a.matches('input:not([type="checkbox"]):not([type="radio"]):not([type="range"]), textarea, select, [contenteditable]'); })) add(`expand "${id}" put the cursor in a text field when it opened (decision 0049)`);
      if (st.inline) add(`expand "${id}" kept a leftover inline style after opening (${st.inline})`);
      const ov = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (ov > 1) add(`expand "${id}" causes sideways scroll (${ov}px)`);
      await page.keyboard.press('Escape'); await settle(650);
      const closed = await until((id) => document.getElementById(id).hidden, id);
      if (!closed) add(`expand "${id}" did not close with Escape`);
      const after = await page.evaluate(() => document.documentElement.scrollHeight);
      if (closed && (await shownView()) === viewBefore && Math.abs(after - before) > 2) add(`expand "${id}" left the page ${after - before}px taller after closing`);
    }
    /* pages: going in shows the page with Back in the bar, never a focused field; Back returns to where you were */
    const pageOpeners = await page.evaluate(() => [...new Set([...document.querySelectorAll('[data-page-open]')].filter((b) => b.getBoundingClientRect().width && !b.closest('[hidden]')).map((b) => b.dataset.pageOpen))]);
    for (const name of pageOpeners) {
      const b = (await visible(`[data-page-open="${name}"]`))[0]; if (!b) continue;
      const depth0 = await page.evaluate(() => +(document.querySelector('.s4-app').dataset.sub || 0));
      if (!(await click(b, `opener of page "${name}"`))) continue;
      await until((n) => { const p = document.querySelector(`.s4-subpage[data-page="${n}"]`); return !!p && !p.hidden; }, name);
      await settle(600);
      const st = await page.evaluate((n) => { const p = document.querySelector(`.s4-subpage[data-page="${n}"]`), k = document.querySelector('.s4-app-bar-back'), a = document.activeElement; return { shown: !!p && !p.hidden, back: !!k && !k.hidden, field: !!a && a.matches('input:not([type="checkbox"]):not([type="radio"]):not([type="range"]), textarea, select'), wide: document.documentElement.scrollWidth - innerWidth, hash: location.hash }; }, name);
      if (!st.shown) { add(`page "${name}" did not open`); await page.evaluate(() => { const a = document.querySelector('.s4-app'); if (a && window.S4 && S4.pages) S4.pages.reset(a); }); continue; }
      if (!st.back) add(`page "${name}": the top app bar shows no Back button`);
      if (st.field) add(`page "${name}" put the cursor in a text field when it opened (decision 0049)`);
      if (st.wide > 1) add(`page "${name}": sideways scroll (${st.wide}px)`);
      if (!st.hash.includes('/' + name)) add(`page "${name}" did not get its own URL (${st.hash})`);
      await page.goBack(); await settle(600);
      const out = await until((a) => +(document.querySelector('.s4-app').dataset.sub || 0) === a[0] && document.querySelector(`.s4-subpage[data-page="${a[1]}"]`).hidden, [depth0, name]);
      if (!out) { add(`page "${name}" did not close with the browser's Back`); await page.evaluate(() => S4.pages.reset(document.querySelector('.s4-app'))); }
    }
    /* the command palette: opens from its button without focusing its box, corners nest, Escape closes */
    const pal = (await visible('[data-palette]'))[0];
    if (pal && await click(pal, 'command palette button')) {
      await settle(520);
      const ps = await page.evaluate(() => { const d = document.querySelector('.s4-palette'); return { open: !!d && d.open, field: !!document.activeElement && document.activeElement.matches('input, textarea'), rows: d ? d.querySelectorAll('[data-i]').length : 0 }; });
      if (!ps.open) add('the command palette did not open'); else {
        if (ps.field) add('the command palette put the cursor in its box when opened by a click (decision 0049)');
        if (!ps.rows) add('the command palette has no commands');
        (await page.evaluate(nestAudit)).forEach(add);
        await page.keyboard.press('Escape'); await settle(420);
        if (!(await until(() => !document.querySelector('.s4-palette').open))) add('the command palette did not close with Escape');
      }
    }
    /* inline confirm */
    for (const b of await visible('[data-confirm]')) {
      const id = await b.getAttribute('data-confirm');
      if (!(await click(b, `confirm button for "${id}"`))) continue;
      await settle(350);
      if (await page.evaluate((id) => document.getElementById(id).hidden, id)) { add(`inline confirm "${id}" did not show`); continue; }
      await page.keyboard.press('Escape'); await settle(350);
      if (!(await page.evaluate((id) => document.getElementById(id).hidden, id))) add(`inline confirm "${id}" did not close with Escape`);
      if (!(await b.isVisible())) add(`inline confirm "${id}" did not bring its button back`);
    }
    /* tabs */
    for (const t of (await page.$$('.s4-tab[aria-selected="false"]')).slice(0, 6)) {
      if (!(await t.isVisible())) continue;
      const panel = await t.getAttribute('aria-controls'), label = ((await t.textContent()) || '').trim();
      try { await t.scrollIntoViewIfNeeded({ timeout: 1500 }); } catch (e) {}
      const lefts = () => t.evaluate((x) => [...x.closest('.s4-tabs').querySelectorAll('.s4-tab')].map((y) => Math.round(y.getBoundingClientRect().left - x.closest('.s4-tabs').getBoundingClientRect().left + x.closest('.s4-tabs').scrollLeft)).join(','));
      const before = await lefts();
      try { await t.click({ timeout: 2500 }); } catch (e) { add(`tab "${label}" could not be clicked`); continue; }
      await settle(460);
      if ((await t.getAttribute('aria-selected')) !== 'true') add(`tab "${label}" did not become selected`);
      if ((await lefts()) !== before) add(`tab "${label}": selecting it moved the other tabs (the heavier label must keep its width)`);
      const pill = await t.evaluate((x) => { const ind = x.parentElement.querySelector(':scope > .s4-tabs-indicator'); if (!ind) return ''; const a = ind.getBoundingClientRect(), b = x.getBoundingClientRect(); return Math.abs(a.left - b.left) > 1.5 || Math.abs(a.width - b.width) > 1.5 || Math.abs(a.top - b.top) > 1.5 || Math.abs(a.height - b.height) > 1.5 ? `${Math.round(a.left)},${Math.round(a.width)} vs ${Math.round(b.left)},${Math.round(b.width)}` : ''; });
      if (pill) add(`tab "${label}": the indicator did not land on it (${pill})`);
      if (panel && await page.evaluate((id) => { const p = document.getElementById(id); return !!p && p.hidden; }, panel)) add(`tab panel "${panel}" stayed hidden`);
    }
    /* connected button groups (the Ink Track, decision 0059): the ink lands on the option you pick */
    for (const g of (await visible('.s4-button-group[data-connected][data-select="single"]:not([data-brand-dial], [data-theme-mode], [data-theme-contrast], #mode, #contrast, #icon-set, .ex-bar *)')).slice(0, 4)) {
      const pick = await g.evaluate((x) => { const b = [...x.children].find((c) => c.matches('.s4-button, .s4-icon-button') && c.getAttribute('aria-pressed') === 'false' && !c.disabled); if (!b) return ''; const k = 'ink' + Math.random().toString(36).slice(2); b.setAttribute('data-ink-probe', k); return k; });
      if (!pick) continue;
      const off = page.locator(`[data-ink-probe="${pick}"]`);
      const what = (await g.getAttribute('aria-label')) || 'button group';
      if (!(await click(off, `option of "${what}"`))) continue;
      await settle(460);
      if ((await off.getAttribute('aria-pressed')) !== 'true') { add(`button group "${what}": the option did not become selected`); continue; }
      const miss = await off.evaluate((b) => {
        const g = b.parentElement, ink = g.querySelector(':scope > .s4-button-group-ink');
        if (!g.hasAttribute('data-s4-ink') || !ink || ink.hidden) return 'no ink';
        const pe = getComputedStyle(ink, '::before'), m = new DOMMatrix(pe.transform), gr = g.getBoundingClientRect(), br = b.getBoundingClientRect();
        const x = gr.left + g.clientLeft + m.m41, y = gr.top + g.clientTop + m.m42, w = parseFloat(pe.width), h = parseFloat(pe.height);
        return Math.abs(x - br.left) > 1.5 || Math.abs(y - br.top) > 1.5 || Math.abs(w - br.width) > 1.5 || Math.abs(h - br.height) > 1.5 ? `ink at ${Math.round(x)},${Math.round(w)}, option at ${Math.round(br.left)},${Math.round(br.width)}` : '';
      });
      if (miss) add(`button group "${what}": the ink did not land on the selected option (${miss})`);
    }
    /* brand dial groups (data-brand-dial): picking an option sets that key of S4.theme, and the group follows it back */
    for (const g of (await visible('.s4-button-group[data-brand-dial]')).slice(0, 2)) {
      const key = await g.getAttribute('data-brand-dial');
      const vals = await g.evaluate((x) => ({ was: (x.querySelector('[aria-pressed="true"]') || {}).value, to: (x.querySelector('[value][aria-pressed="false"]:not(:disabled)') || {}).value }));
      if (!vals.to || !vals.was) continue;
      if (!(await click(g.locator(`[value="${vals.to}"]`), `brand dial "${key}"`))) continue;
      await settle(300);
      const now = await page.evaluate((k) => String(S4.theme()[k]), key);
      if (now !== vals.to) add(`brand dial "${key}": picking ${vals.to} left S4.theme().${key} at ${now}`);
      await page.evaluate(([k, v]) => { const o = {}; o[k] = v; S4.theme(o); }, [key, vals.was]);
      await settle(300);
      if ((await g.locator(`[value="${vals.was}"]`).getAttribute('aria-pressed')) !== 'true') add(`brand dial "${key}": the group did not follow S4.theme() back to ${vals.was}`);
    }
    /* accordions */
    for (const s of (await page.$$('.s4-accordion-item:not([open]) > summary')).slice(0, 4)) {
      if (!(await s.isVisible())) continue;
      const label = ((await s.textContent()) || '').trim().slice(0, 30);
      try { await s.scrollIntoViewIfNeeded({ timeout: 1500 }); await s.click({ timeout: 2500 }); } catch (e) { add(`accordion "${label}" could not be clicked`); continue; }
      await settle(560);
      const st = await s.evaluate((x) => ({ open: x.parentElement.open, h: (x.parentElement.querySelector('.s4-accordion-body') || x).getBoundingClientRect().height }));
      if (!st.open || st.h < 4) add(`accordion "${label}" did not open`);
    }
    /* rich inputs (issue 59): every interaction they add, with the cursor left where the person put it (decision 0049) */
    const listFits = () => page.evaluate(() => { const p = [...document.querySelectorAll('.s4-combobox-menu')].find((x) => x.matches(':popover-open')); if (!p) return 'none'; const r = p.getBoundingClientRect(); return r.left < -1 || r.right > innerWidth + 1 || r.top < -1 || r.bottom > innerHeight + 1 ? 'off' : 'ok'; });
    for (const f of (await visible('.s4-combobox:not([data-s4-async]):not(:has(> input:disabled))')).slice(0, 2)) {
      const inp = f.locator(':scope > input[role="combobox"]');
      if (!(await click(inp, 'combobox'))) continue;
      await page.keyboard.press('ArrowDown'); await settle(420);
      const st = await inp.evaluate((i) => { const l = document.getElementById(i.getAttribute('aria-controls') || ''), a = document.getElementById(i.getAttribute('aria-activedescendant') || ''); return { exp: i.getAttribute('aria-expanded'), n: l ? l.querySelectorAll('[role="option"]').length : 0, active: !!a && a.getAttribute('role') === 'option', kept: document.activeElement === i }; });
      if (st.exp !== 'true' || !st.n) add('combobox: Down did not open its list of options');
      else {
        if (!st.active) add('combobox: Down did not make an option active (aria-activedescendant)');
        if (!st.kept) add('combobox: the cursor left the field while moving through the options');
        if ((await listFits()) === 'off') add('combobox list does not fit the screen');
        (await page.evaluate(nestAudit)).forEach(add);
      }
      await page.keyboard.press('Escape'); await settle(380);
      if ((await inp.getAttribute('aria-expanded')) !== 'false') add('combobox: Escape did not close its list');
      await page.evaluate(() => document.activeElement && document.activeElement.blur());
    }
    for (const f of (await visible('.s4-tag-input:not([data-s4-async]):not([data-full]):not(:has(input:disabled))')).slice(0, 1)) {
      const inp = f.locator('.s4-tag-input-row > input');
      const count = () => f.evaluate((x) => x.querySelectorAll('.s4-chip:not([data-leaving])').length);
      if (!(await click(inp, 'tag input'))) continue;
      const n = await count(), create = await f.evaluate((x) => x.hasAttribute('data-create'));
      if (create) { await page.keyboard.type('Zebra Crossing'); await page.keyboard.press('Enter'); }
      else { await page.keyboard.press('ArrowDown'); await settle(300); await page.keyboard.press('Enter'); }
      await settle(300);
      if ((await count()) !== n + 1) add('tag input: Enter did not add a chip');
      if (!(await inp.evaluate((i) => document.activeElement === i))) add('tag input: the cursor left the field after adding');
      await page.keyboard.press('Backspace'); await settle(420);
      if ((await count()) !== n) add('tag input: Backspace in the empty field did not remove the last chip');
      await page.keyboard.press('Escape');
      await page.evaluate(() => document.activeElement && document.activeElement.blur());
    }
    for (const f of (await visible('.s4-number-field:not(:has(input:disabled))')).slice(0, 1)) {
      const val = () => f.evaluate((x) => S4.numberField.value(x));
      const plus = f.locator('.s4-number-field-step[data-dir="1"]'), minus = f.locator('.s4-number-field-step[data-dir="-1"]');
      await page.evaluate(() => document.activeElement && document.activeElement.blur());
      const v0 = await val(), up = !(await plus.isDisabled());
      if (!(await click(up ? plus : minus, 'number field stepper'))) continue;
      const v1 = await val();
      if (up ? !(v1 > v0) : !(v1 < v0)) add(`number field: ${up ? 'plus' : 'minus'} did not step the value (${v0} -> ${v1})`);
      if (await f.evaluate((x) => x.contains(document.activeElement) && document.activeElement.tagName === 'INPUT')) add('number field: a stepper put the cursor in the field (decision 0049)');
      if (!(await click(f.locator(':scope > input'), 'number field'))) continue;
      await page.keyboard.press(up ? 'ArrowDown' : 'ArrowUp');
      const v2 = await val();
      if (v2 !== v0) add(`number field: the arrow key did not step back (${v1} -> ${v2}, expected ${v0})`);
      await page.evaluate(() => document.activeElement && document.activeElement.blur());
    }
    for (const f of (await visible('.s4-code-field:not(:has(input:disabled))')).slice(0, 1)) {
      const inp = f.locator(':scope > input');
      if (!(await click(inp, 'one-time code'))) continue;
      await page.keyboard.press('Control+A'); await page.keyboard.press('Backspace');
      await f.evaluate((x) => { x._suiteDone = ''; x.addEventListener('s4-complete', (e) => { x._suiteDone = e.detail.value; }, { once: true }); });
      await page.keyboard.type('12');
      const st = await f.evaluate((x) => ({ filled: x.querySelectorAll('.s4-code-field-slot[data-filled]').length, active: [...x.querySelectorAll('.s4-code-field-slot')].findIndex((s) => s.hasAttribute('data-active')) }));
      if (st.filled !== 2 || st.active !== 2) add(`one-time code: typing did not fill the boxes in order (${st.filled} filled, box ${st.active} active)`);
      const n = await f.evaluate((x) => x.querySelectorAll('.s4-code-field-slot').length);
      await page.keyboard.insertText(' 3-4 5 6 7 8 9 0');
      const st2 = await f.evaluate((x) => ({ v: x.querySelector(':scope > input').value, done: x._suiteDone }));
      if (st2.v.length !== n || !/^\d+$/.test(st2.v)) add(`one-time code: a pasted code with spaces and dashes did not fill every box ("${st2.v}")`);
      if (st2.done !== st2.v) add('one-time code: s4-complete did not fire when the last box filled');
      await page.keyboard.press('Control+A'); await page.keyboard.press('Backspace');
      await page.evaluate(() => document.activeElement && document.activeElement.blur());
    }
    for (const f of (await visible('.s4-upload:not([data-variant]):not([data-disabled])')).slice(0, 1)) {
      const zone = f.locator('.s4-upload-zone');
      /* the zone is a real button that opens the file chooser (never drag-only) */
      try {
        if (!(await zone.evaluate((z) => z.tagName === 'BUTTON' && !z.disabled && z.tabIndex >= 0))) add('upload: the drop zone is not a real button in the Tab order');
        await zone.scrollIntoViewIfNeeded({ timeout: 2000 });
        const [chooser] = await Promise.all([page.waitForEvent('filechooser', { timeout: 6000 }), zone.click({ timeout: 3000 })]);
        await chooser.setFiles({ name: 'suite-receipt.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 suite') });
      } catch (e) { add('upload: the drop zone did not open the file chooser (' + String(e.message).split('\n')[0].slice(0, 80) + ')'); continue; }
      await settle(400);
      const st = await f.evaluate((x) => { const l = S4.upload.files(x); const last = l[l.length - 1]; return { name: last && last.file.name, id: last && last.id, rows: x.querySelectorAll('.s4-upload-item:not([data-leaving])').length }; });
      if (st.name !== 'suite-receipt.pdf') { add('upload: a chosen file was not added'); continue; }
      const row = f.locator(`.s4-upload-item[data-id="${st.id}"]`);
      await f.evaluate((x, id) => S4.upload.progress(x, id, 0.5), st.id);
      if ((await row.locator('.s4-upload-progress').getAttribute('data-value')) !== '0.5') add('upload: S4.upload.progress did not move the bar');
      await f.evaluate((x, id) => S4.upload.fail(x, id, 'Couldn’t upload.'), st.id);
      const retry = row.locator('.s4-upload-retry');
      if (!(await retry.isVisible())) add('upload: a failed file shows no Try Again');
      else {
        await f.evaluate((x) => { x._suiteRetry = 0; x.addEventListener('s4-retry', () => { x._suiteRetry++; }, { once: true }); });
        await retry.click();
        if (!(await f.evaluate((x) => x._suiteRetry))) add('upload: Try Again did not fire s4-retry');
      }
      await row.locator('.s4-upload-remove').click(); await settle(450);
      if (await f.evaluate((x, id) => S4.upload.files(x).some((e) => e.id === id), st.id)) add('upload: Remove did not remove the file');
      await page.evaluate(() => document.activeElement && document.activeElement.blur());
    }
    for (const f of (await visible('.s4-time-field:not([data-error]):not([data-range-start]):not(:has(input:disabled))')).slice(0, 1)) {
      const inp = f.locator(':scope > input:not([type="hidden"])');
      if (!(await click(inp, 'time field'))) continue;
      await settle(420);
      const n = await inp.evaluate((i) => { const l = document.getElementById(i.getAttribute('aria-controls') || ''); return i.getAttribute('aria-expanded') === 'true' && l ? l.querySelectorAll('[role="option"]').length : 0; });
      if (!n) add('time field: a tap did not open its list of times');
      else if ((await listFits()) === 'off') add('time field list does not fit the screen');
      await page.keyboard.press('Escape'); await settle(300);
      await page.keyboard.press('Control+A'); await page.keyboard.type('545p');
      await page.evaluate(() => document.activeElement && document.activeElement.blur()); await settle(200);
      const v = await f.evaluate((x) => S4.timeField.value(x));
      if (v !== 17 * 60 + 45) add(`time field: "545p" was not read as 5:45 PM (got ${v})`);
    }
    for (const r of (await visible('.s4-rating:not([data-input])')).slice(0, 1)) {
      const st = await r.evaluate((x) => ({ label: x.getAttribute('aria-label') || '', num: (x.querySelector('.s4-rating-value') || {}).textContent || '' }));
      if (!/out of/.test(st.label) || !st.num.trim()) add('rating: a display has no number beside it or no spoken value');
    }
    for (const r of (await visible('.s4-rating[data-input]:not(:has(input:disabled))')).slice(0, 1)) {
      const stars = r.locator('.s4-rating-star');
      if (!(await click(stars.nth(2), 'rating star'))) continue;
      const v = await r.evaluate((x) => { const c = x.querySelector('input:checked'); return c ? +c.value : 0; });
      if (v !== 3) add(`rating: tapping the third star chose ${v}`);
      await page.keyboard.press('ArrowRight');
      const v2 = await r.evaluate((x) => ({ v: (x.querySelector('input:checked') || {}).value, on: x.querySelectorAll('.s4-rating-star[data-on]').length }));
      if (v2.v !== '4' || v2.on !== 4) add(`rating: the arrow key did not move to four stars (${v2.v}, ${v2.on} lit)`);
      await page.evaluate(() => document.activeElement && document.activeElement.blur());
    }
    for (const f of (await visible('.s4-color-field:not([data-theme-seed]):not(:has(input:disabled))')).slice(0, 1)) {
      const sw = f.locator('.s4-color-field-swatch');
      if (!(await click(sw, 'color swatch'))) continue;
      await settle(420);
      const st = await sw.evaluate((b) => { const p = document.getElementById(b.getAttribute('aria-controls')); const a = document.activeElement; const r = p.getBoundingClientRect(); return { open: p.matches(':popover-open'), exp: b.getAttribute('aria-expanded'), inside: p.contains(a) && a.classList.contains('s4-swatch'), fits: r.left >= -1 && r.right <= innerWidth + 1 && r.top >= -1 && r.bottom <= innerHeight + 1 }; });
      if (!st.open || st.exp !== 'true') { add('color field: the swatch did not open its panel'); continue; }
      if (!st.inside) add('color field: focus did not go to the chosen accent');
      if (!st.fits) add('color field panel does not fit the screen');
      const before = await f.evaluate((x) => S4.colorField.value(x));
      await page.keyboard.press('ArrowRight'); await page.keyboard.press('Enter'); await settle(200);
      if ((await f.evaluate((x) => S4.colorField.value(x))) === before) add('color field: choosing another accent with the keyboard did not change the value');
      await page.keyboard.press('Escape'); await settle(380);
      const back = await sw.evaluate((b) => ({ shut: !document.getElementById(b.getAttribute('aria-controls')).matches(':popover-open'), focus: document.activeElement === b }));
      if (!back.shut) add('color field: Escape did not close the panel'); else if (!back.focus) add('color field: focus did not return to the swatch');
      await page.evaluate(() => document.activeElement && document.activeElement.blur());
    }
    for (const f of (await visible('.s4-password:not(:has(input:disabled))')).slice(0, 1)) {
      const t = f.locator('.s4-password-toggle'), inp = f.locator(':scope > input');
      await page.evaluate(() => document.activeElement && document.activeElement.blur());
      if (!(await click(t, 'show password'))) continue;
      const st = await f.evaluate((x) => ({ type: x.querySelector(':scope > input').type, pressed: x.querySelector('.s4-password-toggle').getAttribute('aria-pressed'), field: document.activeElement === x.querySelector(':scope > input') }));
      if (st.type !== 'text' || st.pressed !== 'true') add('password: Show Password did not show the text and set aria-pressed');
      if (st.field) add('password: Show Password put the cursor in the field (decision 0049)');
      await t.click();
      if ((await inp.getAttribute('type')) !== 'password' || (await t.getAttribute('aria-pressed')) !== 'false') add('password: a second press did not hide it again');
    }
    for (const f of (await visible('.s4-password[data-strength]')).slice(0, 1)) {
      const w = await f.evaluate((x) => { const m = x.querySelector('.s4-password-strength'); return m && !m.hidden ? m.textContent : 'none'; });
      if (!/Strength: /.test(w) && w !== '') add('password: the strength meter has no words');
    }
    for (const el of (await visible('.s4-inline-edit:not(:has(input:disabled))')).slice(0, 1)) {
      const inp = el.locator(':scope > input');
      const before = await inp.inputValue();
      await el.evaluate((x) => { x._suiteChange = null; x.addEventListener('s4-change', (e) => { x._suiteChange = e.detail; }, { once: true }); });
      if (!(await click(inp, 'inline edit'))) continue;
      await page.keyboard.press('End'); await page.keyboard.type(' X'); await page.keyboard.press('Escape'); await settle(200);
      if ((await inp.inputValue()) !== before) add('inline edit: Escape did not put the saved value back');
      await inp.click(); await page.keyboard.press('End'); await page.keyboard.type(' X'); await page.keyboard.press('Enter'); await settle(300);
      const ch = await el.evaluate((x) => x._suiteChange);
      if (!ch || ch.previous !== before) add('inline edit: Enter did not save (no s4-change with the previous value)');
      const undo = page.locator('.s4-snackbar button', { hasText: 'Undo' }).first();
      if (await undo.isVisible().catch(() => false)) { await undo.click(); await settle(300); if ((await inp.inputValue()) !== before) add('inline edit: Undo did not put the previous value back'); }
      else add('inline edit: saving offered no Undo');
    }
    /* date fields and selects open their glass popup */
    for (const d of (await visible('.s4-date-picker-field')).slice(0, 2)) {
      if (!(await click(d, 'date field'))) continue;
      await settle(480);
      const pop = await page.evaluate(() => { const p = document.querySelector('.s4-date-picker:popover-open, .s4-date-picker[open], .s4-date-picker:not([hidden])'); if (!p) return 'none'; const r = p.getBoundingClientRect(); return r.left < -1 || r.right > innerWidth + 1 || r.top < -1 || r.bottom > innerHeight + 1 ? 'off' : 'ok'; });
      if (pop === 'off') add('date picker does not fit the screen');
      await page.keyboard.press('Escape'); await settle(380);
    }
    /* tooltips (pointer devices) */
    if (!phone) {
      const tip = (await visible('[data-tooltip]'))[0];
      if (tip) { try { await tip.scrollIntoViewIfNeeded({ timeout: 1000 }); await tip.hover({ timeout: 1500 }); await settle(700); await page.mouse.move(1, 1); await settle(300); } catch (e) {} }
    }
    await closeAll();
  }
  /* nothing may be left open or stuck mid-animation */
  await settle(700);
  const left = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('dialog[open]').forEach((d) => out.push(`dialog "${d.id}" was left open`));
    const stuck = document.getAnimations().filter((a) => { try { const t = a.effect.getComputedTiming(); return a.playState === 'running' && t.iterations !== Infinity && (a.currentTime || 0) > 1500; } catch (e) { return false; } });
    if (stuck.length) out.push(`${stuck.length} animation(s) still running long after they should have ended`);
    return out;
  }).catch(() => []);
  left.forEach(add);
}

/* ---------- desktop anatomy by keyboard (issue 60): menu bar, submenus, tree, document tabs, context menus ---------- */
async function desktopKeys(page, add) {
  const ev = (fn, a) => page.evaluate(fn, a);
  const openMenus = () => ev(() => [...document.querySelectorAll('.s4-menu')].filter((m) => m.matches(':popover-open') && !m._s4closing).map((m) => m.id));
  const active = () => ev(() => { const a = document.activeElement; return { menubar: !!(a && a.closest && a.closest('.s4-menubar')), inMenu: !!(a && a.closest && a.closest('.s4-menu')), text: a ? (a.textContent || '').trim().slice(0, 30) : '', sub: !!(a && a.dataset && a.dataset.submenu) }; });
  const settle = () => page.waitForTimeout(260);
  const mod = await ev(() => (window.S4 && S4.desktop && /mac|ios/.test(S4.desktop.platform)) ? 'Meta' : 'Control');
  /* menu bar */
  if (await ev(() => [...document.querySelectorAll('.s4-menubar')].some((b) => b.getClientRects().length && b.querySelector('.s4-menubar-item')))) {
    await ev(() => { if (document.activeElement) document.activeElement.blur(); });
    await page.keyboard.press('F10'); await settle();
    let a = await active();
    if (!a.menubar) add('menu bar: F10 did not move focus to the bar');
    else {
      const first = a.text;
      await page.keyboard.press('ArrowRight'); await settle(); a = await active();
      if (!a.menubar || a.text === first) add('menu bar: Right did not move along the bar');
      await page.keyboard.press('ArrowDown'); await settle();
      const m1 = await openMenus(); a = await active();
      if (!m1.length || !a.inMenu) add('menu bar: Down did not open a menu with focus in it');
      if (!a.sub) { await page.keyboard.press('ArrowRight'); await settle(); const m2 = await openMenus(); if (!m2.length || m2.join() === m1.join()) add('menu bar: Right inside a menu did not move to the next menu'); }
      await page.keyboard.press('Escape'); await settle(); a = await active();
      if ((await openMenus()).length || !a.menubar) add('menu bar: Escape did not close the menu and return to the bar');
      await page.keyboard.press('Escape'); await settle(); a = await active();
      if (a.menubar) add('menu bar: Escape on the bar did not give focus back');
    }
    /* a submenu: Right opens it, Left closes it */
    const sub = await ev(() => { for (const b of document.querySelectorAll('.s4-menubar-item')) { const m = document.getElementById(b.dataset.menu); if (m && m.querySelector('[data-submenu]') && b.getClientRects().length) { b.setAttribute('data-kt-sub', ''); return m.querySelector('[data-submenu]').textContent.trim(); } } return ''; });
    if (sub) {
      await page.click('[data-kt-sub]'); await settle();
      const ok = await ev(() => { const it = [...document.querySelectorAll('.s4-menu:popover-open [data-submenu]')][0]; if (!it) return false; it.focus(); return true; });
      if (ok) {
        await page.keyboard.press('ArrowRight'); await settle();
        const n = (await openMenus()).length; a = await active();
        if (n < 2 || !a.inMenu || a.sub) add(`menu bar: Right on "${sub}" did not open its submenu`);
        await page.keyboard.press('ArrowLeft'); await settle(); a = await active();
        if ((await openMenus()).length !== 1 || !a.sub) add(`menu bar: Left did not close the submenu of "${sub}" and return to it`);
      }
      await page.keyboard.press('Escape'); await settle(); await page.keyboard.press('Escape'); await settle();
      await ev(() => document.querySelectorAll('[data-kt-sub]').forEach((x) => x.removeAttribute('data-kt-sub')));
    }
  }
  /* tree */
  const hasTree = await ev(() => { const t = [...document.querySelectorAll('.s4-tree')].find((x) => x.getClientRects().length && x.querySelector('[role="treeitem"]')); if (!t) return false; t.setAttribute('data-kt-tree', ''); const it = t.querySelector('[role="treeitem"][tabindex="0"]'); if (!it) return 'none'; it.focus(); return true; });
  if (hasTree === 'none') add('tree: no item is in the tab order');
  else if (hasTree) {
    const st = () => ev(() => { const a = document.activeElement; return { item: !!(a && a.matches('[role="treeitem"]')), label: a && a.querySelector ? (a.querySelector(':scope > .s4-tree-row .s4-tree-label') || {}).textContent : '', exp: a && a.getAttribute && a.getAttribute('aria-expanded') }; });
    const s0 = await st();
    await page.keyboard.press('ArrowDown'); await settle(); const s1 = await st();
    if (!s1.item || s1.label === s0.label) add('tree: Down did not move to the next item');
    await page.keyboard.press('Home'); await settle(); const s2 = await st();
    if (!s2.item) add('tree: Home lost focus');
    /* a closed folder opens with Right and closes with Left */
    const folder = await ev(() => { const t = document.querySelector('[data-kt-tree]'); const f = [...t.querySelectorAll('[role="treeitem"][aria-expanded="false"]')].find((x) => x.getClientRects().length && !x.hasAttribute('data-lazy')); if (!f) return false; t.querySelectorAll('[role="treeitem"]').forEach((x) => { x.tabIndex = x === f ? 0 : -1; }); f.focus(); return true; });
    if (folder) {
      await page.keyboard.press('ArrowRight'); await page.waitForTimeout(450);
      if ((await st()).exp !== 'true') add('tree: Right did not open a closed folder');
      await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(450);
      if ((await st()).exp !== 'false') add('tree: Left did not close the open folder');
    }
    await ev(() => document.querySelectorAll('[data-kt-tree]').forEach((x) => x.removeAttribute('data-kt-tree')));
  }
  /* document tabs */
  const dt = await ev(() => { const b = [...document.querySelectorAll('.s4-doc-tabs')].find((x) => x.getClientRects().length && x.querySelectorAll('.s4-doc-tab').length > 1); if (!b) return false; b.setAttribute('data-kt-tabs', ''); b.querySelector('.s4-doc-tab-label[aria-selected="true"]').focus(); return true; });
  if (dt) {
    const st = () => ev(() => { const b = document.querySelector('[data-kt-tabs]'); return { n: b.querySelectorAll('.s4-doc-tab').length, sel: (b.querySelector('.s4-doc-tab-label[aria-selected="true"]') || {}).textContent, focus: !!(document.activeElement && document.activeElement.matches('.s4-doc-tab-label')) }; });
    const t0 = await st();
    await page.keyboard.press('ArrowRight'); await settle(); const t1 = await st();
    if (t1.sel === t0.sel || !t1.focus) add('document tabs: Right did not select the next tab');
    await page.keyboard.press('Delete'); await settle(); const t2 = await st();
    const kept = t2.n === t1.n;   /* an app may keep a tab open (its s4-close was cancelled) */
    if (!kept) {
      if (t2.n !== t1.n - 1 || !t2.focus) add('document tabs: Delete did not close the tab and keep focus in the row');
      await page.keyboard.press(`${mod}+Shift+KeyT`); await settle(); const t3 = await st();
      if (t3.n !== t1.n) add('document tabs: mod+Shift+T did not reopen the closed tab');
    }
    await ev(() => document.querySelectorAll('[data-kt-tabs]').forEach((x) => x.removeAttribute('data-kt-tabs')));
    await page.keyboard.press('Escape');
  }
  /* a right-click menu from the keyboard */
  const host = await ev(() => { const h = [...document.querySelectorAll('[data-context-menu]')].find((x) => x.getClientRects().length && (x.tabIndex >= 0 || x.matches('[role="treeitem"], [role="option"]')) && !x.closest('[hidden]')); if (!h) return false; h.focus(); return document.activeElement === h; });
  if (host) {
    await page.keyboard.press('Shift+F10'); await settle();
    if (!(await openMenus()).length) add('context menu: Shift+F10 did not open the menu of the focused element');
    await page.keyboard.press('Escape'); await settle();
  }
  await ev(() => { document.querySelectorAll('.s4-menu').forEach((m) => { if (m.matches(':popover-open') && window.S4 && S4.menu) S4.menu.close(m, false); }); if (document.activeElement) document.activeElement.blur(); });
}

/* ---------- run ---------- */
const MODES = [
  { key: 'phone-dark', viewport: { width: 390, height: 844 }, colorScheme: 'dark', phone: true },
  { key: 'desktop-light', viewport: { width: 1280, height: 800 }, colorScheme: 'light', phone: false },
];
const QUIET = [/favicon\.ico/, /Download the React DevTools/];
const failures = [];
let ran = 0, skipped = [];

async function runPage(browser, bname, rel, mode, reduced) {
  const label = `${bname} ${reduced ? 'reduced-motion' : mode.key}  ${rel}`;
  const ctx = await browser.newContext({ viewport: mode.viewport, colorScheme: mode.colorScheme, reducedMotion: reduced ? 'reduce' : 'no-preference', hasTouch: mode.phone && bname !== 'firefox', deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const found = new Set(), add = (m) => found.add(m);
  page.on('pageerror', (e) => add('script error: ' + String(e.message).split('\n')[0]));
  page.on('console', (m) => { if (m.type() === 'error' && !QUIET.some((q) => q.test(m.text()))) add('console error: ' + m.text().slice(0, 160)); });
  page.on('requestfailed', (r) => { if (!QUIET.some((q) => q.test(r.url())) && !/ERR_ABORTED|cancelled|Load cannot follow/.test(r.failure() ? r.failure().errorText : '')) add('request failed: ' + r.url().replace(ORIGIN, '')); });
  page.on('response', (r) => { if (r.status() >= 400 && !QUIET.some((q) => q.test(r.url()))) add(`request ${r.status()}: ` + r.url().replace(ORIGIN, '')); });
  try {
    await page.goto(ORIGIN + '/' + rel, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(450);
    if (!reduced) {
      (await page.evaluate(audit, { phone: mode.phone })).forEach(add);
      (await page.evaluate(nestAudit)).forEach(add);
      await page.keyboard.press('Tab');                                   /* keyboard modality, so rings show */
      (await page.evaluate(focusAudit)).forEach(add);
      await page.evaluate(() => { if (document.activeElement) document.activeElement.blur(); window.scrollTo(0, 0); });
    }
    await use(page, add, mode.phone);
    if (!reduced && !mode.phone) await desktopKeys(page, add);
    if (!reduced) (await page.evaluate(audit, { phone: false })).filter((m) => /sideways|icon not drawn|duplicate id/.test(m)).forEach((m) => add('after use: ' + m));
  } catch (e) { add('suite could not finish: ' + String(e.message).split('\n')[0].slice(0, 160)); }
  if (found.size && SHOTS) { mkdirSync(join(root, 'tests/out'), { recursive: true }); await page.screenshot({ path: join(root, 'tests/out', label.replace(/[^\w.-]+/g, '_') + '.png') }).catch(() => {}); }
  await ctx.close();
  ran++;
  if (found.size) failures.push({ label, list: [...found] });
}

const want = arg('browser', 'chromium,webkit').split(',');
for (const bname of want) {
  let browser;
  try { browser = await pw[bname].launch(); }
  catch (e) {
    const msg = `${bname} is not installed here (npx playwright install ${bname})`;
    if (CI) { failures.push({ label: bname, list: [msg] }); } else { skipped.push(msg); }
    continue;
  }
  const jobs = [];
  for (const rel of targets) { for (const mode of MODES) jobs.push([rel, mode, false]); if (bname === 'chromium' && /^(demo|templates)\//.test(rel)) jobs.push([rel, MODES[0], true]); }
  let i = 0;
  await Promise.all(Array.from({ length: WORKERS }, async () => { while (i < jobs.length) { const [rel, mode, reduced] = jobs[i++]; await runPage(browser, bname, rel, mode, reduced); } }));
  await browser.close();
}

/* ---------- dial presets pass ---------- */
const PRESETS = [
  ...(arg('preset', '') === 'baseline' ? [{ key: 'baseline', theme: {}, dial: true }] : []),
  { key: 'corners-soft', theme: { corners: 'soft' }, dial: true },
  { key: 'corners-firm', theme: { corners: 'firm' }, dial: true },
  { key: 'gray-warm', theme: { gray: 'warm' } },
  { key: 'gray-cool', theme: { gray: 'cool' } },
  { key: 'page-soft', theme: { page: 'soft' }, modes: ['desktop-light'] },   /* the soft page is a light-mode tone */
  { key: 'type-serif-rounded', theme: { display: 'serif', text: 'rounded' }, modes: ['phone-dark'] },   /* faces change widths, not colors: the phone is the tight case */
  { key: 'type-mono', theme: { display: 'mono', text: 'mono' }, modes: ['phone-dark'] },
  { key: 'combo-firm-cool-soft-mono', theme: { corners: 'firm', gray: 'cool', page: 'soft', display: 'mono' }, dial: true },
  { key: 'combo-tinted-blue', theme: { seed: '#0b57d0', surfaces: 'tinted', corners: 'soft', gray: 'warm', page: 'soft' }, dial: true },
];
/* every template, the showcase in each of its views, and the component pages that hold controls and their containers */
const DIAL_COMPONENTS = 'button button-group chip tabs menu dialog sheet snackbar toolbar nav-rail nav-bar text-field search list pagination breadcrumbs fab date-picker menubar doc-tabs statusbar tree desktop combobox tag-input number-field code-field upload time-field rating color-field password'.split(' ');
const dialPages = ['demo/index.html', ...pages.filter((p) => p.startsWith('templates/') && p !== 'templates/index.html')   /* the templates hub sets its own theme */, ...DIAL_COMPONENTS.map((d) => `components/${d}/${d}.html`)].filter((p) => existsSync(join(root, p)) && (!ONLY || p.includes(ONLY)));

/* the pressed shape must never be rounder than the resting one (decision 0055: the morph goes toward square) */
async function pressAudit(page, add) {
  const picks = await page.evaluate(() => {
    const seen = new Set(), out = [];
    document.querySelectorAll('.s4-button, .s4-icon-button, .s4-chip, .s4-fab, .s4-segment, .s4-button-group > :not(.s4-button-group-ink)').forEach((b, i) => {
      const r = b.getBoundingClientRect(); if (!r.width || b.disabled || b.closest('[hidden], dialog:not([open]), [data-s4-skip]')) return;
      if (r.bottom < 0 || r.top > innerHeight) return;
      const k = b.className + '|' + (b.dataset.variant || ''); if (seen.has(k) || out.length >= 5) return; seen.add(k);
      b.setAttribute('data-press-probe', String(i)); out.push(String(i));
    });
    return out;
  });
  const rad = (sel) => page.evaluate((sel) => { const cs = getComputedStyle(document.querySelector(sel)); return Math.min(...['TopLeft', 'TopRight', 'BottomLeft', 'BottomRight'].map((k) => parseFloat(cs['border' + k + 'Radius']) || 0)); }, sel);
  for (const i of picks) {
    const sel = `[data-press-probe="${i}"]`, loc = page.locator(sel);
    try {
      await page.mouse.move(1, 1); await page.waitForTimeout(200);
      const rest = await rad(sel), box = await loc.boundingBox(); if (!box) continue;
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await page.waitForTimeout(300);
      const pressed = await rad(sel), name = await loc.evaluate((e) => e.tagName.toLowerCase() + '.' + [...e.classList].slice(0, 2).join('.') + (e.dataset.variant ? '[' + e.dataset.variant + ']' : ''));
      await page.mouse.up(); await page.mouse.move(1, 1);
      if (pressed > rest + 0.5) add(`pressed shape is rounder than at rest (${rest.toFixed(1)}px -> ${pressed.toFixed(1)}px): ${name}`);
    } catch (e) { try { await page.mouse.up(); } catch (x) {} }
  }
}

async function runDialPage(browser, preset, rel, mode) {
  const label = `chromium dials ${preset.key} ${mode.key}  ${rel}`;
  const ctx = await browser.newContext({ viewport: mode.viewport, colorScheme: mode.colorScheme, hasTouch: false, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const found = new Set(), add = (m) => found.add(m);
  page.on('pageerror', (e) => add('script error: ' + String(e.message).split('\n')[0]));
  page.on('console', (m) => { if (m.type() === 'error' && !QUIET.some((q) => q.test(m.text()))) add('console error: ' + m.text().slice(0, 160)); });
  try {
    await page.goto(ORIGIN + '/' + rel, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(300);
    const ok = await page.evaluate((t) => { if (!window.S4 || !S4.theme) return false; S4.theme.key = null; S4.theme(t); return true; }, preset.theme);
    if (!ok) add('S4.theme is not available on this page');
    await page.waitForTimeout(350);
    /* colors transition when a dial changes: measure after they have arrived */
    await page.waitForFunction(() => !document.getAnimations().some((a) => { try { return (a.playState === 'running' || a.pending) && a.effect.getComputedTiming().iterations !== Infinity; } catch (e) { return false; } }), null, { timeout: 4000 }).catch(() => {});
    const views = await page.evaluate(() => [...new Set([...document.querySelectorAll('.s4-nav-item[data-view]')].map((a) => a.dataset.view))]);
    const checks = async (where) => {
      const tagw = (m) => (where ? `[${where}] ` : '') + m;
      (await page.evaluate(audit, { phone: false })).filter((m) => /sideways|icon not drawn/.test(m)).forEach((m) => add(tagw(m)));
      (await page.evaluate(dialAudit, { dial: !!preset.dial })).forEach((m) => add(tagw(m)));
      (await page.evaluate(contrastAudit, !!preset.theme.seed)).forEach((m) => add(tagw(m)));
      if (preset.dial) (await page.evaluate(nestAudit, 8)).forEach((m) => add(tagw(m)));
    };
    if (views.length) {
      for (const v of views) {
        await page.evaluate((v) => { const a = document.querySelector('.s4-app'); if (window.S4 && S4.app && a) S4.app.go(a, v); }, v);
        await page.waitForTimeout(450);
        await checks(`view ${v}`);
        if (preset.dial && (v === 'controls' || v === 'home')) await pressAudit(page, add);
      }
    } else { await checks(''); if (preset.dial) await pressAudit(page, add); }
    /* open each menu and dialog once: the containers of controls are where concentric corners show */
    if (preset.dial) {
      for (const sel of ['[data-menu]', '[data-dialog]', '[data-sheet]']) {
        const b = (await page.locator(sel).all()).slice(0, 3);
        for (const l of b) {
          if (!(await l.isVisible().catch(() => false))) continue;
          try { await l.scrollIntoViewIfNeeded({ timeout: 1000 }); await l.click({ timeout: 1500 }); await page.waitForTimeout(380); } catch (e) { continue; }
          (await page.evaluate(nestAudit, 8)).forEach((m) => add('open overlay: ' + m));
          (await page.evaluate(dialAudit, { dial: true })).forEach((m) => add('open overlay: ' + m));
          (await page.evaluate(contrastAudit, !!preset.theme.seed)).forEach((m) => add('open overlay: ' + m));
          await page.keyboard.press('Escape'); await page.waitForTimeout(320);
          await page.mouse.click(2, 2).catch(() => {});
        }
      }
    }
  } catch (e) { add('suite could not finish: ' + String(e.message).split('\n')[0].slice(0, 160)); }
  if (found.size && SHOTS) { mkdirSync(join(root, 'tests/out'), { recursive: true }); await page.screenshot({ path: join(root, 'tests/out', label.replace(/[^\w.-]+/g, '_') + '.png') }).catch(() => {}); }
  await ctx.close();
  ran++;
  if (found.size) failures.push({ label, list: [...found] });
}
if (!process.argv.includes('--no-dials') && want.includes('chromium')) {
  let b2;
  try { b2 = await pw.chromium.launch(); } catch (e) { b2 = null; }
  if (b2) {
    const jobs = [];
    for (const preset of PRESETS) if (!arg('preset', '') || preset.key.includes(arg('preset', ''))) for (const rel of dialPages) for (const mode of MODES) if (!preset.modes || preset.modes.includes(mode.key)) jobs.push([preset, rel, mode]);
    let i = 0;
    await Promise.all(Array.from({ length: WORKERS }, async () => { while (i < jobs.length) { const [pr, rel, mode] = jobs[i++]; await runDialPage(b2, pr, rel, mode); } }));
    await b2.close();
  }
}
server.close();

skipped.forEach((s) => console.warn('! skipped: ' + s));
if (failures.length) {
  const total = failures.reduce((n, f) => n + f.list.length, 0);
  console.error(`\nProduction suite: ${total} problem(s) on ${failures.length} of ${ran} page runs\n`);
  for (const f of failures.sort((a, b) => a.label.localeCompare(b.label))) console.error(f.label + '\n' + f.list.map((m) => '  x ' + m).join('\n'));
  process.exit(1);
}
console.log(`Production suite passed: ${targets.length} pages, ${ran} page runs (${want.filter((b) => !skipped.some((s) => s.startsWith(b))).join(' + ')}; 390 dark, 1280 light, reduced motion), nothing wrong. Dial presets: ${PRESETS.length} presets x ${dialPages.length} pages (showcase in every view, every template, ${DIAL_COMPONENTS.length} component pages) x 390 dark and 1280 light, Chromium.`);
