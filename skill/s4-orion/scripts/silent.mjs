/* Silent failures (decision 0065): mistakes that render without an error and pass every contrast check, but leave a page
   broken. Shared by the page checker (check.mjs) and the production suite (tests/suite.mjs). Each function runs inside
   the page (pass it to page.evaluate); none of them changes the page.
     knownClasses()   async: every s4- name the page's stylesheets and scripts know (Orion's and the app's own), kept on
                      window.__s4known for the audit below
     silentAudit()    { unknown: [...], broken: [...], container: [...], loud: [...] }
       unknown        an s4- class nothing defines (a misremembered name such as .s4-card-content styles nothing)
       broken         a word split across lines, or a box one glyph wide (a column too narrow for its words: a table
                      that cannot stack, a FAB squeezed into a rail)
       container      a part outside the component it belongs to (a .s4-nav-item outside a nav bar or rail …)
       loud           a status drawn as a fill rather than a tint (more than 2:1 against the surface it sits on): a
                      status is a tint, and only the state that needs action now is warm (error, warning) */

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
  const out = { unknown: [], broken: [], container: [], loud: [] };
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
    if (!el || flagged.has(el) || skip(el) || !shown(el)) continue;
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
    if (r.width >= fs * 1.2 || r.height === 0 && r.width === 0 && cs.overflow !== 'visible') continue;
    if (cs.clipPath !== 'none' || (cs.position === 'absolute' && cs.clip !== 'auto') || (r.width <= 1.5 && r.height <= 1.5)) continue;   /* visually hidden on purpose: the name stays for screen readers */
    if (el.closest('[aria-expanded="false"], [data-collapsed], [data-s4-collapsed]') && cs.overflow !== 'visible') continue;
    narrow++; flagged.add(el);
    out.broken.push(`"${el.textContent.trim().replace(/\s+/g, ' ').slice(0, 24)}" is squeezed into a box ${Math.round(r.width)}px wide, one glyph, in ${path(el)}`);
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
