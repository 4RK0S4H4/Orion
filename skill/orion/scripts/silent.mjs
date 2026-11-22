/* Silent failures (decision 0065): mistakes that render without an error and pass every contrast check, but leave a page
   broken. Shared by the page checker (check.mjs) and the production suite (tests/suite.mjs). Each function runs inside
   the page (pass it to page.evaluate); none of them changes the page.
     knownClasses()   async: every s4- name the page's stylesheets and scripts know (Orion's and the app's own), kept on
                      window.__s4known for the audit below
     silentAudit()    { unknown: [...], broken: [...], container: [...], loud: [...], nav: [...], overfull: [...] }
       unknown        an s4- class nothing defines (a misremembered name such as .s4-card-content styles nothing)
       broken         a word split across lines, or a box one glyph wide (a column too narrow for its words: a table
                      that cannot stack, a FAB squeezed into a rail)
       container      a part outside the component it belongs to (a .s4-nav-item outside a nav bar or rail …)
       loud           a status drawn as a fill rather than a tint (more than 2:1 against the surface it sits on): a
                      status is a tint, and only the state that needs action now is warm (error, warning)
       nav            a nav bar highlight (icon over label) that is a circle, or that a corner of its label pokes out of
                      (round 0061), or a hover layer that is not the selected highlight's box (issue 81)
       overfull       a button, link, tab, chip or pagination control whose content is wider than its own box
                      (scrollWidth > clientWidth + 1) and is not clipped or scrolled on purpose: a ring or a forced-colors
                      outline drawn at the edge clips, and a hit area that is smaller than what it holds misleads (decision 0073)
   Words that may truncate (decision 0058: the timeline label, top app bar title, title bar title, text field value and date
   value) never count as split: they stay on one line behind an ellipsis. */

export async function knownClasses() {
  const set = new Set();
  const add = (text) => { for (const m of String(text).matchAll(/s4-[a-z0-9]+(?:-[a-z0-9]+)*/g)) set.add(m[0]); };
  const walk = (rules) => { for (const r of rules) { if (r.selectorText) add(r.selectorText); if (r.cssRules) walk(r.cssRules); if (r.styleSheet) { try { walk(r.styleSheet.cssRules); } catch (e) { /* elsewhere */ } } } };   /* @import rules hold their sheet */
  for (const sh of document.styleSheets) { try { walk(sh.cssRules); } catch (e) { /* a stylesheet from another origin */ } }
  for (const s of document.scripts) {
    if (!s.src) { add(s.textContent); continue; }
    try { add(await (await fetch(s.src)).text()); } catch (e) { /* not reachable: its classes count as unknown */ }
  }
  window.__s4known = [...set];
  return set.size;
}

export function silentAudit() {
  const out = { unknown: [], broken: [], container: [], loud: [], nav: [], overfull: [] };
  const TRUNCATES = '.s4-timeline-label, .s4-app-bar-title, .s4-app-bar-collapsed-title, .s4-titlebar-title, .s4-date-picker-value';   /* the five places (decision 0058) */
  const known = new Set(window.__s4known || []);
  const skip = (e) => !!e.closest('[data-s4-skip], iframe, template, pre, code, .s4-code, svg, [hidden], [inert], [aria-hidden="true"], .s4-visually-hidden');
  const shown = (e) => { const r = e.getBoundingClientRect(); if (!(r.width > 0 && r.height > 0)) return false; return e.checkVisibility ? e.checkVisibility({ opacityProperty: true, visibilityProperty: true }) : getComputedStyle(e).visibility !== 'hidden'; };
  const path = (e) => { const bits = []; for (let n = e; n && n !== document.body && bits.length < 3; n = n.parentElement) { let s = n.tagName.toLowerCase(); if (n.id) s += '#' + n.id; else if (n.classList.length) s += '.' + [...n.classList].slice(0, 2).join('.'); bits.unshift(s); } return bits.join(' > '); };

  /* unknown s4- classes */
  if (known.size) {
    const seen = new Set();
    for (const el of document.querySelectorAll('[class*="s4-"]')) {
      if (el.closest('[data-s4-skip], iframe, template, pre, code')) continue;
      for (const c of el.classList) {
        if (!c.startsWith('s4-') || known.has(c) || seen.has(c)) continue;
        seen.add(c);
        out.unknown.push(`.${c} on ${path(el)}`);
      }
    }
  }

  /* words split across lines, boxes one glyph wide */
  const range = document.createRange(), flagged = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: (n) => /[A-Za-z]{4}/.test(n.nodeValue) ? 1 : 2 });
  let words = 0;
  for (let t; (t = walker.nextNode()) && words < 6000;) {
    const el = t.parentElement;
    if (!el || flagged.has(el) || skip(el) || !shown(el) || el.closest(TRUNCATES)) continue;
    const cs = getComputedStyle(el);
    if (cs.hyphens === 'auto' || /^(SCRIPT|STYLE|TEXTAREA|OPTION)$/.test(el.tagName)) continue;
    for (const m of t.nodeValue.matchAll(/[A-Za-z]{4,14}/g)) {
      words++;
      range.setStart(t, m.index); range.setEnd(t, m.index + m[0].length);
      const tops = new Set([...range.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top / 3)));
      if (tops.size > 1) { flagged.add(el); out.broken.push(`"${m[0]}" breaks across lines in ${path(el)} (${Math.round(el.getBoundingClientRect().width)}px wide)`); break; }
    }
  }

  /* a box one glyph wide (or none): a block that holds real words but is narrower than 1.2 of its own letters, so its text
     stacks one letter or word per line, or is gone (a FAB put straight in a rail instead of the rail's header, a column
     too narrow for its label). A box that is hidden, faded out or clipped away on purpose is not counted. */
  const ownWords = (e) => { for (const n of e.childNodes) if (n.nodeType === 3 && /[A-Za-z]{3}/.test(n.nodeValue)) return true; return false; };
  let narrow = 0;
  for (const el of document.body.querySelectorAll('*')) {
    if (narrow >= 8 || !ownWords(el) || flagged.has(el) || skip(el) || /^(SCRIPT|STYLE|TEXTAREA|OPTION|TITLE)$/.test(el.tagName)) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.display === 'inline' || cs.display === 'contents') continue;
    if (!(el.checkVisibility ? el.checkVisibility({ opacityProperty: true, visibilityProperty: true }) : cs.visibility !== 'hidden')) continue;
    const r = el.getBoundingClientRect(), fs = parseFloat(cs.fontSize) || 16;
    const lh = parseFloat(cs.lineHeight) || fs * 1.3, cw = Math.max(0, r.width - ['paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth'].reduce((a, k) => a + (parseFloat(cs[k]) || 0), 0));   /* the room the words have */
    if (cw >= fs * 1.2 || (cw < 2 && /hidden|clip/.test(cs.overflow))) continue;   /* clipped away on purpose */
    if (cw >= 2 && r.height < lh * 1.8) continue;   /* one line in a small box (a letter badge) is not a stack of letters */
    if (cs.clipPath !== 'none' || (cs.position === 'absolute' || cs.position === 'fixed') || (r.width <= 1.5 && r.height <= 1.5)) continue;   /* visually hidden on purpose: the name stays for screen readers */
    if (el.closest('[aria-expanded="false"], [data-collapsed], [data-s4-collapsed]') && cs.overflow !== 'visible') continue;
    narrow++; flagged.add(el);
    out.broken.push(`"${el.textContent.trim().replace(/\s+/g, ' ').slice(0, 24)}" is squeezed into a box ${Math.round(cw)}px wide, one glyph, in ${path(el)}`);
  }

  /* the box around what a control holds: its text runs and child boxes, leaving out anything hidden on purpose (visually
     hidden labels, clipped or zero-size parts, out-of-flow decoration such as a drawing hung off the box, the ::after hit area,
     which is not an element) */
  const contentBox = (root) => {
    let L = Infinity, R = -Infinity, T = Infinity, B = -Infinity;
    const take = (r) => { if (r.width > 0 || r.height > 0) { L = Math.min(L, r.left); R = Math.max(R, r.right); T = Math.min(T, r.top); B = Math.max(B, r.bottom); } };
    const rg = document.createRange();
    const walk = (n) => {
      for (const k of n.childNodes) {
        if (k.nodeType === 3) { if (!k.nodeValue.trim()) continue; rg.selectNodeContents(k); for (const r of rg.getClientRects()) take(r); }
        else if (k.nodeType === 1) {
          const cs = getComputedStyle(k), r = k.getBoundingClientRect();
          if (cs.display === 'none' || cs.visibility === 'hidden' || (cs.clipPath !== 'none') || (cs.position === 'absolute' || cs.position === 'fixed') || (r.width <= 1.5 && r.height <= 1.5) || +cs.opacity === 0) continue;
          if (cs.display === 'contents' || k.matches('svg *')) { walk(k); continue; }
          take(r);
        }
      }
    };
    walk(root);
    return L === Infinity ? null : { left: L, right: R, top: T, bottom: B, width: R - L, height: B - T };
  };
  /* a control whose content is wider than its box (decision 0073): the box is what draws the state layer, the ring and the
     forced-colors outline, and what a finger hits, so what it holds must fit inside it. A control that clips or scrolls
     its content on purpose (overflow other than visible) is a different thing and not counted. */
  let wide = 0;
  for (const el of document.body.querySelectorAll('button, a[href], [role="button"], [role="tab"], [role="menuitem"], [role="option"], .s4-button, .s4-icon-button, .s4-chip, .s4-page, .s4-fab, .s4-segment, .s4-month-day, summary')) {
    if (wide >= 8 || skip(el) || !shown(el) || flagged.has(el)) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'inline' || cs.display === 'contents' || cs.overflowX !== 'visible' || cs.position === 'fixed') continue;
    if (el.closest('[aria-expanded="false"], [data-collapsed], [data-s4-collapsed]') && el.matches('.s4-fab, [data-collapsed]')) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 8) continue;
    /* what the control holds, measured by its content's own boxes and text runs (a Range over its children). Its ::after hit area
       (the 48px touch target) is a pseudo-element and not content, so it is not counted, and scrollWidth would count it. */
    const c = contentBox(el);
    if (!c) continue;
    const tol = 1;
    const side = c.left < r.left - tol ? 'start' : c.right > r.right + tol ? 'end' : '';
    if (side) { wide++; out.overfull.push(`${path(el)} holds ${Math.round(c.width)}px of content in a ${Math.round(r.width)}px box, ${Math.round(Math.max(r.left - c.left, c.right - r.right))}px past its ${side} edge ("${el.textContent.trim().replace(/\s+/g, ' ').slice(0, 20)}")`); }
  }

  /* the nav bar's highlight (round 0061): where the icon sits over the label it holds both, so it is a rounded rectangle
     that contains the label's box, corners included; never a circle (a corner of half its height on a box about as wide
     as it is tall) that the label pokes out of */
  for (const pill of document.querySelectorAll('.s4-nav-bar > .s4-nav-pill')) {
    const bar = pill.parentElement, cur = bar.querySelector('.s4-nav-item[aria-current]:not([aria-current="false"])');
    const lab = cur && cur.querySelector('.s4-nav-label');
    if (!lab || skip(bar) || !shown(pill) || !shown(lab) || getComputedStyle(cur).flexDirection !== 'column') continue;
    const p = pill.getBoundingClientRect(), l = lab.getBoundingClientRect(), rad = Math.min(parseFloat(getComputedStyle(pill).borderTopLeftRadius) || 0, p.width / 2, p.height / 2);
    const name = `"${lab.textContent.trim().slice(0, 20)}"`;
    if (rad > Math.min(p.width, p.height) * 0.3 + 0.5) out.nav.push(`the nav bar's highlight on ${name} is a circle, not a rounded rectangle (corner ${Math.round(rad)}px on a ${Math.round(p.width)}x${Math.round(p.height)} box) in ${path(bar)}`);
    const t = 0.5, inside = (x, y) => {
      if (x < p.left - t || x > p.right + t || y < p.top - t || y > p.bottom + t) return false;
      const cx = Math.min(Math.max(x, p.left + rad), p.right - rad), cy = Math.min(Math.max(y, p.top + rad), p.bottom - rad);
      return Math.hypot(x - cx, y - cy) <= rad + t;
    };
    if (![[l.left, l.top], [l.right, l.top], [l.left, l.bottom], [l.right, l.bottom]].every(([x, y]) => inside(x, y))) out.nav.push(`the label ${name} sticks out of the nav bar's highlight (label ${Math.round(l.width)}x${Math.round(l.height)}, highlight ${Math.round(p.width)}x${Math.round(p.height)}, corner ${Math.round(rad)}px) in ${path(bar)}`);
  }

  /* the state layer of a tab is the selected highlight's box (issue 81, decision 0073): hover, focus and press fill the same
     rectangle the sliding highlight fills, never the icon alone. Read from the layer's computed box, so no pointer is needed. */
  for (const pill of document.querySelectorAll('.s4-nav-bar > .s4-nav-pill, .s4-nav-rail-items > .s4-nav-pill')) {
    const box = pill.parentElement, cur = box.querySelector('.s4-nav-item[aria-current]:not([aria-current="false"])');
    if (!cur || skip(box) || !shown(pill) || !shown(cur)) continue;
    const name = `"${(cur.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 20)}"`;
    const chip = getComputedStyle(cur.querySelector('.s4-nav-indicator') || cur, '::before');
    if (cur.querySelector('.s4-nav-indicator') && chip.content !== 'none' && chip.display !== 'none' && getComputedStyle(cur.querySelector('.s4-nav-indicator')).display !== 'contents')
      out.nav.push(`the state layer of ${name} is the icon's own chip (${chip.width} by ${chip.height}), not the highlight's box in ${path(box)} (issue 81)`);
    const cs = getComputedStyle(cur, '::before');
    if (cs.content === 'none' || cs.position !== 'absolute') { out.nav.push(`the tab ${name} has no state layer on the highlight's box in ${path(box)} (issue 81)`); continue; }
    const ir = cur.getBoundingClientRect(), p = pill.getBoundingClientRect();
    const L = ir.left + cur.clientLeft + parseFloat(cs.left), T = ir.top + cur.clientTop + parseFloat(cs.top), W = parseFloat(cs.width), H = parseFloat(cs.height);
    const d = Math.max(Math.abs(L - p.left), Math.abs(T - p.top), Math.abs(W - p.width), Math.abs(H - p.height));
    if (!(d <= 1)) out.nav.push(`the hover layer of ${name} is ${Math.round(W)}x${Math.round(H)} at ${Math.round(L - p.left)},${Math.round(T - p.top)} from the selected highlight (${Math.round(p.width)}x${Math.round(p.height)}); it must be the same box within 1px in ${path(box)} (issue 81)`);
  }

  /* parts outside the component they belong to */
  const NEED = [
    ['.s4-nav-item', '.s4-nav-bar, .s4-nav-rail', 'a navigation bar or rail'],
    ['.s4-tab', '.s4-tabs', '.s4-tabs'],
    ['.s4-menu-item', '.s4-menu', 'a .s4-menu'],
    ['.s4-lane', '.s4-board', 'a .s4-board'],
    ['.s4-split-pane', '.s4-split', 'a .s4-split'],
    ['.s4-list-content, .s4-list-headline', '.s4-list-item, .s4-list, .s4-tree, .s4-palette', 'a .s4-list-item'],
    ['.s4-card-title, .s4-card-media, .s4-card-actions, .s4-card-body', '.s4-card', 'a .s4-card'],
    ['.s4-stat-value', '.s4-stat', 'a .s4-stat'],
    ['.s4-meter-track', '.s4-meter', 'a .s4-meter'],
    ['.s4-step', '.s4-stepper', 'a .s4-stepper'],
    ['.s4-accordion-item', '.s4-accordion', 'an .s4-accordion'],
    ['.s4-app-bar-title', '.s4-top-app-bar, .s4-titlebar, .s4-app-bar, .s4-toolbar', 'a .s4-top-app-bar'],
  ];
  for (const [what, inside, name] of NEED) {
    for (const el of document.querySelectorAll(what)) {
      if (el.closest('[data-s4-skip], iframe, template') || el.closest(inside)) continue;
      out.container.push(`${path(el)} is outside ${name}`);
      if (out.container.length > 12) break;
    }
  }
  /* statuses are tints: a status more than 2:1 from the surface under it reads as a filled button, louder than the
     thing it describes (decision 0065) */
  const cv = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  const rgba = (c) => { if (!c || c === 'transparent' || c === 'rgba(0, 0, 0, 0)') return null; cv.clearRect(0, 0, 1, 1); cv.fillStyle = '#000'; cv.fillStyle = c; cv.fillRect(0, 0, 1, 1); const d = cv.getImageData(0, 0, 1, 1).data; return d[3] ? [d[0], d[1], d[2], d[3] / 255] : null; };
  const over = (top, bot) => [0, 1, 2].map((i) => top[i] * top[3] + bot[i] * (1 - top[3])).concat(1);
  const lum = (c) => { const v = c.slice(0, 3).map((x) => { x /= 255; return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const seenText = new Set();
  for (const st of document.querySelectorAll('.s4-status')) {
    if (skip(st) || !shown(st)) continue;
    const own = rgba(getComputedStyle(st).backgroundColor); if (!own) continue;
    const layers = []; let glass = false;
    for (let n = st.parentElement; n; n = n.parentElement) {
      const cs = getComputedStyle(n), bf = cs.backdropFilter || cs.webkitBackdropFilter;
      if (bf && bf !== 'none') { glass = true; break; }
      const bg = rgba(cs.backgroundColor); if (bg) { layers.push(bg); if (bg[3] >= 1) break; }
    }
    if (glass) continue;
    let base = [255, 255, 255, 1]; for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base);
    const r = ratio(over(own, base), base), text = st.textContent.trim().slice(0, 30);
    if (r > 2 && !seenText.has(text)) { seenText.add(text); out.loud.push(`status "${text}" is a fill (${r.toFixed(1)}:1 against its surface) in ${path(st)}`); }
  }
  return out;
}

/* Window controls (decision 0072): a frameless window's Minimize, Maximize and Close are full cells, as Windows draws
   them, so a pointer thrown into the window's top corner hits Close and one thrown at the top edge hits the control
   below it (Fitts's law). For every shown .s4-window-controls in a .s4-titlebar:
     - each control is at least 40 wide and the bar's whole height, starting at the bar's top edge;
     - Close touches the bar's end edge (the right, or the left in right-to-left) with no gap;
     - where the bar is on screen, the corner pixel and the top-edge pixel above each control hit that control (a
       rounded frame around a demo window may clip its very corner: only a hit inside the bar counts against it).
   Returns a list of problems. */
export function windowAudit() {
  const out = [];
  const path = (e) => { const bits = []; for (let n = e; n && n !== document.body && bits.length < 3; n = n.parentElement) { let s = n.tagName.toLowerCase(); if (n.id) s += '#' + n.id; else if (n.classList.length) s += '.' + [...n.classList].slice(0, 2).join('.'); bits.unshift(s); } return bits.join(' > '); };
  for (const set of document.querySelectorAll('.s4-titlebar .s4-window-controls')) {
    const sr = set.getBoundingClientRect();
    if (!sr.width || !sr.height || set.closest('[hidden], [inert]')) continue;
    const bar = set.closest('.s4-titlebar'), b = bar.getBoundingClientRect();
    const rtl = getComputedStyle(bar).direction === 'rtl', side = rtl ? 'left' : 'right';
    const ctrls = [...set.querySelectorAll('.s4-window-control')].filter((c) => c.getClientRects().length);
    const name = (c) => c.getAttribute('aria-label') || c.dataset.windowAction || 'control';
    for (const c of ctrls) {
      const r = c.getBoundingClientRect();
      if (r.width < 39.5 || r.height < b.height - 1 || r.top > b.top + 0.5)
        out.push(`window control "${name(c)}" is ${Math.round(r.width)}x${Math.round(r.height)}, ${Math.round(r.top - b.top)}px below the top of a ${Math.round(b.height)}px title bar (${path(bar)}): each is a full cell, at least 40 wide, the bar's whole height (decision 0072)`);
    }
    const close = ctrls.find((c) => c.dataset.windowAction === 'close');
    if (!close) { out.push(`window controls without Close in ${path(bar)} (decision 0072)`); continue; }
    const cr = close.getBoundingClientRect(), gap = rtl ? cr.left - b.left : b.right - cr.right;
    if (gap > 0.5) out.push(`Close stops ${Math.round(gap)}px short of the title bar's ${side} edge (${path(bar)}): the window's top ${side} corner must hit Close (decision 0072)`);
    if (b.top >= 0 && b.bottom <= innerHeight && b.left >= 0 && b.right <= innerWidth) {
      const y = Math.ceil(b.top), x = rtl ? Math.ceil(b.left) : Math.floor(b.right) - 1;
      const hit = document.elementFromPoint(x, y);
      if (hit && bar.contains(hit) && !close.contains(hit)) out.push(`the title bar's top ${side} corner pixel hits ${path(hit)}, not Close (decision 0072)`);
      for (const c of ctrls) {
        const r = c.getBoundingClientRect(), h = document.elementFromPoint(r.left + r.width / 2, y);
        if (h && bar.contains(h) && !c.contains(h)) out.push(`the top edge above "${name(c)}" hits ${path(h)}, not the control (decision 0072)`);
      }
    }
  }
  return out;
}
