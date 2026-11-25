/* Orion runtime core: window.S4.
   - S4.register(name, init): components register an init(root) that wires up every instance inside root. Inits run on
     DOMContentLoaded and again for anything added to the page later, so markup works without any app code.
   - S4.motion: springs read from the tokens (so reduced motion is respected automatically) and an animate helper.
   - S4.icon: draws <span class="s4-icon" data-icon="name"> from the registry in assets/icons.js.
   - S4.theme: seed color, light/dark, contrast; optional saving.
   Components never hard-code durations, easings, colors or sizes: they read tokens. */
(function () {
  'use strict';
  if (window.S4 && window.S4.version) return;
  var root = document.documentElement;
  var S4 = window.S4 = { version: '1.2.0' };   /* written by scripts/build.mjs from package.json; never edit by hand */
  var scriptSrc = (document.currentScript && document.currentScript.src) || '';

  /* ---------- registry and auto-init ---------- */
  var inits = [];
  S4.register = function (name, init) { inits.push({ name: name, init: init }); if (ready) init(document); };
  S4.init = function (scope) { inits.forEach(function (c) { try { c.init(scope || document); } catch (e) { console.error('S4 ' + c.name, e); } }); drawIcons(scope || document); };
  var ready = false;
  function boot() {
    ready = true; S4.init(document);
    /* the app's stamp (decision 0075): <meta name="orion" content="1.2.0"> says which Orion the markup was written for;
       loading another version's files is a half-done upgrade, so say so (the page checker fails S4: warnings) */
    var stamp = document.querySelector('meta[name="orion"]'), said = stamp && (stamp.getAttribute('content') || '').trim();
    if (said && said !== S4.version) console.warn('S4: this page is stamped Orion ' + said + ' (meta name="orion") but loads Orion ' + S4.version + '; finish the upgrade (node <skill>/scripts/upgrade.mjs <app-dir> --write) or load the ' + said + ' files.');
    new MutationObserver(function (list) {
      list.forEach(function (m) { m.addedNodes.forEach(function (n) { if (n.nodeType === 1 && !n.closest('[data-s4-skip]')) S4.init(n); }); });
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else setTimeout(boot);

  /* ---------- how focus arrived (issues 62, 64) ----------
     data-s4-focus on <html> is "pointer" when the last focus came from a tap or a click and "key" otherwise. A text input
     matches :focus-visible on a click as well, so things you type into read this: a tap shows their quiet state, the
     keyboard shows the full ring. Typing never changes it; only the next focus does. No script, no attribute: the ring. */
  var lastPointer = -1e9;
  document.addEventListener('pointerdown', function () { lastPointer = Date.now(); }, true);
  document.addEventListener('focusin', function () { root.setAttribute('data-s4-focus', Date.now() - lastPointer < 800 ? 'pointer' : 'key'); }, true);

  /* ---------- how the person is getting around (round 0061) ----------
     data-s4-input on <html> is "key" from the first key press that navigates (Tab, arrows, Escape, Enter…) until the next
     tap or click, "pointer" after a tap or a click, and absent until either happens. A container that takes focus only to
     hold the place (main, a view, a page, a dialog's own box: anything with tabindex="-1" that is not a control) draws its
     ring only while it is "key" (base.css). WebKit counts a script's focus after a tap as :focus-visible (a tap focuses no
     link or button there), so without this every view switch, Back or closed panel outlined the whole screen on an iPhone. */
  var NAV_KEY = /^(Tab|Escape|Enter| |Arrow\w+|Home|End|PageUp|PageDown|F6)$/;
  function input(kind) { if (root.getAttribute('data-s4-input') !== kind) root.setAttribute('data-s4-input', kind); }
  document.addEventListener('keydown', function (e) { if (NAV_KEY.test(e.key) || ((e.metaKey || e.ctrlKey) && e.key.length === 1)) input('key'); }, true);
  document.addEventListener('pointerdown', function () { input('pointer'); }, true);

  var layoutFns = [], layoutQueued = false;
  function layoutChanged() {
    if (layoutQueued) return; layoutQueued = true;
    requestAnimationFrame(function () { layoutQueued = false; layoutFns.slice().forEach(function (f) { try { f(); } catch (e) { /* one script's failure never stops the rest */ } }); });
  }
  if (window.MutationObserver) new MutationObserver(layoutChanged).observe(root, { attributes: true, subtree: true, attributeFilter: ['dir', 'lang', 'data-scale', 'data-density', 'data-headings', 'data-corners', 'data-type-display', 'data-type-text', 'data-type-display-weight'] });

  /* ---------- small utilities ---------- */
  S4.util = {
    emit: function (el, name, detail) { el.dispatchEvent(new CustomEvent(name, { bubbles: true, detail: detail })); },
    css: function (name, el) { return getComputedStyle(el || root).getPropertyValue(name).trim(); },
    /* true for anything that brings up a keyboard. Decision 0049: a script never moves focus into one of these;
       only the person does, by tapping it (opening something with a key press is the one exception, see S4.palette) */
    typable: function (el) { return !!el && el.matches && el.matches('input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="range"]), textarea, select, [contenteditable]'); },
    /* Decision 0069: where focus lands when whatever held it goes away and there is nothing to give it back to (a palette
       opened by Ctrl+K from a fresh load, then Escape): the main landmark of what is on screen, made focusable; never <body>.
       A pointer or touch shows no ring on it (app.css), the keyboard does. Returns the element, or null on a page with no main. */
    land: function () {
      var c = document.querySelectorAll('main, [role="main"]'), m = null;
      for (var i = 0; i < c.length && !m; i++) if (c[i].getClientRects().length && !c[i].closest('[hidden]')) m = c[i];
      m = m || document.querySelector('.s4-view:not([hidden])');
      if (!m) return null;
      if (!m.hasAttribute('tabindex')) m.setAttribute('tabindex', '-1');
      m.focus({ preventScroll: true });
      return m;
    },
    /* Decision 0076: before you hide or remove something that may hold focus (a selection bar, a button that turns into
       something else), move focus out of it: to `to` (an element, or nothing), else to main
       (land). Focus that drops to <body> on its own breaks the keyboard (Tab starts again from the top of the page). Call it
       BEFORE the change. Returns true when focus moved. */
    release: function (box, to) {
      var a = document.activeElement;
      if (!box.contains(a)) return;
      if (to && !box.contains(to)) { to.tabIndex = to.tabIndex; to.focus(); }
      if (document.activeElement === a || document.activeElement === document.body) S4.util.land();
    },
    /* Decision 0073: the one way to put text on the clipboard. Returns a promise of true or false that never rejects (a
       refused write, an insecure page, an iframe or a browser with no clipboard is "false", not an uncaught error), and says
       what happened in a snackbar: opts.done on success (default "Copied"), opts.fail on refusal (default says to copy it by
       hand), opts.silent to say nothing (the caller shows its own state). Nothing else calls clipboard.writeText
       (npm run check:clipboard and the page checker fail it). No hidden field is selected: a script never puts the cursor in one. */
    copy: function (text, opts) {
      opts = opts || {};
      var say = function (ok) {
        if (opts.silent || !S4.snackbar) return ok;
        try { S4.snackbar(ok ? (opts.done || 'Copied') : (opts.fail || 'Couldn\u2019t copy. Select the text and copy it yourself.')); } catch (e) { /* the message is a courtesy */ }
        return ok;
      };
      var cb = null;
      try { cb = navigator.clipboard; } catch (e) { /* a sandboxed frame throws on access */ }
      if (!cb || !cb.writeText) return Promise.resolve(say(false));
      var p; try { p = cb.writeText(String(text)); /* s4-clipboard-helper */ } catch (e) { return Promise.resolve(say(false)); }
      return Promise.resolve(p).then(function () { return say(true); }, function () { return say(false); });
    },
    /* Decision 0073 (issue 77): a script that measures the layout once (the sliding ink and highlights) calls this to measure again
       when something changes that no ResizeObserver sees: dir flipped on <html> or an ancestor (a live language switch), the
       language, a type or density dial, or a theme change. fn runs once per frame at most, after the change has been laid out. */
    onLayoutChange: function (fn) { layoutFns.push(fn); },
    /* each component instance is wired once */
    once: function (el, key) { var k = 's4' + key; if (el.dataset[k]) return false; el.dataset[k] = '1'; return true; },
    all: function (scope, sel) { var out = Array.prototype.slice.call(scope.querySelectorAll ? scope.querySelectorAll(sel) : []); if (scope.matches && scope.matches(sel)) out.unshift(scope); return out; }
  };

  /* ---------- motion ---------- */
  var reduce = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  /* M3 springs live under --md-sys-motion-spring-*; Orion's own (the -calm ones and decision 0042's ink, rise, settle, tip,
     reveal, bend) under --s4-motion-spring-* */
  var S4_SPRINGS = /-calm$|-lively$|^(ink|rise|settle|tip|reveal|bend)$/;
  var SPRING_TOKEN = function (name) { return S4_SPRINGS.test(name) ? '--s4-motion-spring-' + name : '--md-sys-motion-spring-' + name; };
  S4.motion = {
    /* { duration (ms), easing } for a spring name: fast-spatial, spatial, slow-spatial, fast-effects, effects, slow-effects, *-calm */
    spring: function (name) {
      var t = SPRING_TOKEN(name), d = parseFloat(S4.util.css(t + '-duration')) || 0;
      var spatial = !/effects/.test(name);
      if (spatial && (reduce.matches || root.dataset.motion === 'reduced')) d = 0;
      return { duration: d, easing: S4.util.css(t) || 'ease' };
    },
    reduced: function () { return reduce.matches || root.dataset.motion === 'reduced'; },
    /* el.animate with a spring; resolves when done. opts may override fill, delay, direction. */
    animate: function (el, keyframes, name, opts) {
      var s = S4.motion.spring(name), o = { duration: s.duration, easing: s.easing, fill: 'both' };
      for (var k in opts) o[k] = opts[k];
      if (!o.duration) { o.duration = 0; }
      return el.animate(keyframes, o);
    }
  };

  /* ---------- icons ---------- */
  /* a page on the site icon set (icons-site.js, decision 0068) that asks for an icon outside it loads the full set file
     from the same folder once; the full set replaces the registry and every icon is drawn again */
  var fullIcons = null;
  function loadFullIcons(url) {
    if (fullIcons) return; fullIcons = document.createElement('script'); fullIcons.src = url;
    fullIcons.onload = function () { drawIcons(document); };
    fullIcons.onerror = function () { console.warn('S4: could not load the full icon set from ' + url); };
    document.head.appendChild(fullIcons);
  }
  function drawIcons(scope) {
    var reg = window.S4_ICONS; if (!reg) return;
    S4.util.all(scope, '.s4-icon[data-icon]').forEach(function (el) {
      var name = el.getAttribute('data-icon');
      if (el.dataset.s4Drawn === name) return;
      var body = reg.icons[name];
      if (!body && reg.full) { loadFullIcons(reg.full); return; }   /* the site icon set lacks it: fetch the whole set once, then draw */
      if (!body) { console.warn('S4: unknown icon "' + name + '"'); return; }
      el.innerHTML = '<svg viewBox="' + reg.viewBox + '" aria-hidden="true" focusable="false">' + body + '</svg>';
      el.dataset.s4Drawn = name;
      if (!el.hasAttribute('aria-label')) el.setAttribute('aria-hidden', 'true');
    });
  }
  S4.icon = {
    set: function (el, name) { el.setAttribute('data-icon', name); drawIcons(el); },
    /* switch the whole page to another built-in set: S4.icon.use('phosphor-duotone', { save: 'app-key' }); S4.icon.use() returns the active set */
    use: function (id, opts) {
      var reg = window.S4_ICONS; if (!reg) return;
      if (!id) return reg.set;
      var s = reg.sets && reg.sets[id]; if (!s) { console.warn('S4: unknown icon set "' + id + '"'); return reg.set; }
      reg.set = id; reg.viewBox = s.viewBox; reg.icons = s.icons; reg.credit = s.credit;
      S4.util.all(document, '.s4-icon[data-s4-drawn]').forEach(function (el) { delete el.dataset.s4Drawn; });
      drawIcons(document);
      if (opts && opts.save) { try { localStorage.setItem(opts.save, id); } catch (e) {} }
      document.dispatchEvent(new CustomEvent('s4-icon-set', { detail: { set: id } }));
      return id;
    },
    restore: function (key) { try { var id = localStorage.getItem(key); if (id) S4.icon.use(id); } catch (e) {} },
    sets: function () { var r = window.S4_ICONS || {}; return Object.keys(r.sets || {}).map(function (k) { return { id: k, label: r.sets[k].label }; }); },
    add: function (map) { window.S4_ICONS = window.S4_ICONS || { viewBox: '0 0 24 24', icons: {} }; for (var k in map) window.S4_ICONS.icons[k] = map[k]; drawIcons(document); },
    names: function () { return Object.keys((window.S4_ICONS || {}).icons || {}); }
  };

  /* ---------- theme ----------
     S4.theme({ seed: '#0b57d0', variant: 'vibrant', surfaces: 'neutral'|'tinted', mode: 'system'|'light'|'dark', contrast: 0|0.5|1, save: 'app-key' })
     Monochrome (no seed) uses the roles already in tokens.css. A seed generates every M3 role with Material Color
     Utilities (m3color.js, loaded on demand) for light and dark, written in the same zero-specificity blocks as
     tokens.css, so device dark mode and high contrast keep working. */
  /* Decision 0045: Orion takes any color as its accent (S4.theme({ seed: '#0b57d0' }) or a named one from
     S4.theme.accents, e.g. 'blue'); 'mono' (black and white) is one choice among them, not the rule. */
  var state = { seed: null, variant: 'auto', mode: 'system', contrast: 0, surfaces: 'neutral' };
  /* m3color.js sits next to orion.js (skill assets) or in components/assets/ (repo); <script data-m3color="..."> overrides. */
  var m3src = (document.currentScript && document.currentScript.dataset.m3color) ||
    (scriptSrc.indexOf('/components/') >= 0 ? scriptSrc.slice(0, scriptSrc.indexOf('/components/')) + '/components/assets/m3color.js'
                                           : scriptSrc.replace(/[^/]*$/, '') + 'm3color.js');
  /* one request however many calls arrive before it loads (issue 107: two theme calls fetched it twice) */
  var colorWaiting = null;
  function loadColor(cb) {
    if (window.M3Color) return cb();
    if (colorWaiting) return colorWaiting.push(cb);
    colorWaiting = [cb];
    var s = document.createElement('script'); s.src = m3src;
    s.onload = function () { var w = colorWaiting; colorWaiting = null; w.forEach(function (f) { f(); }); };
    s.onerror = function () { colorWaiting = null; console.error('S4: could not load ' + m3src + ' (set data-m3color on the orion.js script tag)'); };
    document.head.appendChild(s);
  }
  /* color-kit:begin. The pure part of the color engine: no DOM, no S4. scripts/brand.mjs runs exactly this block in Node
     to write a brand file (decision 0063), so a fixed brand paints its color on the first frame and the runtime below
     recognises it instead of painting it again. M is M3Color; glass is { fab, color, lo, hi } (the FAB tints and the
     black and white backdrop after the glass's filter). */
  function colorKit(M, glass) {
    /* Decision 0060: a seed given without a variant keeps its own color when it is muted or deep (a brand color such as
       plum, terracotta, navy or espresso: 'fidelity'), and takes M3's 'vibrant' when it is already vivid (blue, magenta,
       orange). 'vibrant' raises a muted seed's chroma to about 74 and turns it neon. Tinted mode keeps 'tonal'.
       scripts/check-accent.mjs reads AUTO_VARIANT, so the proof follows this rule. */
    var AUTO_VARIANT = { chroma: 60, tone: 35 };
    function variantFor(seed) { var h = M.hct(seed); return h.chroma < AUTO_VARIANT.chroma || h.tone < AUTO_VARIANT.tone ? 'fidelity' : 'vibrant'; }
    function rolesCss(scheme) { return Object.keys(scheme).map(function (k) { return (k.charAt(0) === '-' ? k : '--md-sys-color-' + k) + ':' + scheme[k]; }).join(';'); }
    /* Decision 0043: by default a seed colors only the accents (primary and its container, the FAB, selection, focus);
       surfaces, text, outlines and status keep the neutral values in tokens.css. surfaces: 'tinted' is stock M3 (every
       role from the seed). */
    var ACCENT = ['primary', 'on-primary', 'primary-container', 'on-primary-container', 'inverse-primary', 'surface-tint',
      'primary-fixed', 'primary-fixed-dim', 'on-primary-fixed', 'on-primary-fixed-variant'];
    function schemeFor(dark, c, cfg) {
      /* Tinted (decision 0052): every role from the seed. Unless the app asked for a variant, tinted uses M3's calm
         "tonal" scheme (surfaces carry a little of the color, like stock Material You), not the vivid accent variant:
         a whole screen in a vivid tint is tiring. Controls that are a fixed neutral gray take the scheme's outline. */
      var tinted = cfg.surfaces === 'tinted';
      var variant = cfg.variantSet && cfg.variant && cfg.variant !== 'auto' ? cfg.variant : tinted ? 'tonal' : variantFor(cfg.seed);
      var s = M.scheme(cfg.seed, variant, dark, c);
      var pal = M.palettes(cfg.seed, variant), tone = function (t) { return pal.rows.Primary[pal.tones.indexOf(t)]; };
      if (tinted) { s['--s4-color-control'] = s.outline; return fabTints(s, c, tone); }
      var o = {}; ACCENT.forEach(function (k) { o[k] = s[k]; });
      /* selection: a soft tint of the accent (a deep one in dark mode, so it never competes with the main button). Decision
         0063: never more colorful than M3's calm tonal palette for the same hue, so a vivid accent (Parley's vermilion,
         an indigo) selects a row clearly but quietly instead of painting it a saturated block */
      var calm = M.palettes(cfg.seed, 'tonal'), sel = function (t, row) { var a = tone(t), b = calm.rows[row || 'Primary'][calm.tones.indexOf(t)]; return M.hct(b).chroma < M.hct(a).chroma ? b : a; };
      o['secondary-container'] = dark ? sel(25, 'Secondary') : sel(90);   /* dark: the quiet M3 secondary tone, a little lighter than the page's panes */
      o['on-secondary-container'] = sel(dark ? 90 : 10);
      o['--s4-focus-ring-color'] = s.primary;
      return fabTints(o, c, tone);
    }
    /* Glass in its own color (decisions 0060 and 0063, extends 0032): a floating button, or the vibrant toolbar, is glass
       tinted with its own color, and its label must read at 4.5:1 over anything behind it (a pure black or white
       backdrop after the glass's filter). The default FAB's icon and label (--s4-color-on-fab) are on-primary-container,
       or white or the accent's darkest tone when that keeps more of the glass. Every tint starts at the owner's (75% for
       the default FAB, 90% for a colored one and the vibrant toolbar) and rises only as far as its own label needs, one
       tint per color. Roles the seed does not write (neutral mode: secondary, tertiary) keep the monochrome values and
       the token tints (computed by the build with the same rule). scripts/check-glass.mjs proves the same rule. */
    var hexRgb = function (h) { return [1, 3, 5].map(function (i) { return parseInt(h.slice(i, i + 2), 16); }); };
    var lumOf = function (c) { var v = c.map(function (x) { x = Math.min(255, Math.max(0, x)) / 255; return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
    var ratioOf = function (a, b) { var x = lumOf(a), y = lumOf(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    function fabTint(bg, fg, from) {
      var b = hexRgb(bg), f = hexRgb(fg), at = function (t, k) { return b.map(function (v) { return v * t + k * (1 - t); }); };
      for (var t = from; t < 1; t = Math.round((t + 0.01) * 100) / 100) if (Math.min(ratioOf(f, at(t, glass.lo)), ratioOf(f, at(t, glass.hi))) >= 4.5) return t;
      return 1;
    }
    var COLORED = [['secondary-container', 'on-secondary-container', 'fab-secondary-container'], ['tertiary-container', 'on-tertiary-container', 'fab-tertiary-container'],
      ['primary', 'on-primary', 'fab-primary'], ['secondary', 'on-secondary', 'fab-secondary'], ['tertiary', 'on-tertiary', 'fab-tertiary'],
      ['primary-container', 'on-primary-container', 'toolbar-vibrant']];
    function fabTints(o, c, tone) {
      if (c >= 1) {   /* high contrast: solid, as in the tokens */
        o['--s4-glass-tint-opacity-fab'] = 1; o['--s4-color-on-fab'] = o['on-primary-container'];
        COLORED.forEach(function (p) { if (o[p[0]]) o['--s4-glass-tint-opacity-' + p[2]] = 1; });
        return o;
      }
      var best = null;
      [o['on-primary-container'], tone(100), tone(10)].forEach(function (fg) { var t = fabTint(o['primary-container'], fg, glass.fab); if (!best || t < best.t) best = { t: t, fg: fg }; });
      o['--s4-glass-tint-opacity-fab'] = best.t;
      o['--s4-color-on-fab'] = best.fg;
      COLORED.forEach(function (p) { if (o[p[0]] && o[p[1]]) o['--s4-glass-tint-opacity-' + p[2]] = fabTint(o[p[0]], o[p[1]], glass.color); });
      return o;
    }
    /* one role list as light-dark(light, dark): the element's own color-scheme (set by the token blocks for every light
       or dark scope) picks the value, so a scoped scheme follows whatever mode the element is in */
    function rolesLD(L, D) {
      var css = Object.keys(L).map(function (k) {
        if (typeof L[k] === 'number') return k + ':' + Math.max(L[k], D[k]);   /* a glass tint is a number: light-dark() takes colors only, so the larger one serves both */
        return (k.charAt(0) === '-' ? k : '--md-sys-color-' + k) + ':light-dark(' + L[k] + ',' + D[k] + ')';
      }).join(';');
      /* tinted: the glass tints follow the tinted surfaces (a light or dark scope gets them as plain values in tokens.css) */
      if (L['surface-container']) css += ';--s4-glass-tint-float:light-dark(' + L['surface-container'] + ',' + D['surface-container'] + ')' +
        ';--s4-glass-tint-fill:light-dark(' + L['surface-container-highest'] + ',' + D['surface-container-highest'] + ')';
      return css;
    }
    /* Scoped rules (issue 52) inside @scope: the nearest scope root wins, whatever the order. sel lists the subjects
       relative to :scope; the high-contrast copies put the page-wide contrast in front of each. */
    function scopedCss(scopeSel, subjects, L, D, LH, DH) {
      var pre = function (p) { return subjects.map(function (x) { return p + ' ' + x; }).join(','); };
      return '@scope (' + scopeSel + '){:where(' + subjects.join(',') + '){' + rolesLD(L, D) + '}}' +
        '@media (prefers-contrast: more){@scope (' + scopeSel + '){:where(' + pre(':root:not([data-contrast])') + '){' + rolesLD(LH, DH) + '}}}' +
        '@scope (' + scopeSel + '){:where(' + pre(':root[data-contrast="high"]') + '){' + rolesLD(LH, DH) + '}}';
    }
    /* the page's whole scheme for one seed, in the same zero-specificity blocks as tokens.css (light, dark, high contrast,
       and light or dark scopes inside the page), so device dark mode and high contrast keep working */
    function pageCss(cfg, contrast) {
      var c = contrast >= 1 ? 1 : contrast || 0;
      var L = schemeFor(false, c, cfg), D = schemeFor(true, c, cfg), LH = schemeFor(false, 1, cfg), DH = schemeFor(true, 1, cfg);
      var W = function (s) { return ':where(' + s + ')'; };
      return '@layer s4.tokens{' +
        W(':root') + '{' + rolesCss(L) + '}' +
        '@media screen and (prefers-color-scheme: dark){' + W(':root:not([data-theme="light"])') + '{' + rolesCss(D) + '}}' +
        '@media screen{' + W(':root[data-theme="dark"]') + '{' + rolesCss(D) + '}}' +
        '@media (prefers-contrast: more){' + W(':root:not([data-contrast])') + '{' + rolesCss(LH) + '}}' +
        W(':root[data-contrast="high"]') + '{' + rolesCss(LH) + '}' +
        '@media screen and (prefers-color-scheme: dark) and (prefers-contrast: more){' + W(':root:not([data-theme="light"]):not([data-contrast])') + '{' + rolesCss(DH) + '}}' +
        '@media screen and (prefers-color-scheme: dark){' + W(':root:not([data-theme="light"])[data-contrast="high"]') + '{' + rolesCss(DH) + '}}' +
        '@media screen{' + W(':root[data-theme="dark"][data-contrast="high"]') + '{' + rolesCss(DH) + '}}' +
        /* a light or dark scope (or a gray scope) inside the page keeps the page's accent; one inside a scoped accent takes that one
           (scoped roles use light-dark(), so they follow color-scheme, which is light in print) */
        scopedCss(':not(:root):is([data-theme], [data-gray]):not([data-accent], [data-accent] *)', [':scope'], L, D, LH, DH) + '}';
    }
    /* the names a brand file answers to: the seed, how its variant was asked for, and the color mode. A brand written for
       'auto' also answers to the variant auto resolves to, so variant: 'fidelity' and no variant meet the same file. */
    function brandKeys(cfg) {
      var seed = String(cfg.seed).toLowerCase(), surf = cfg.surfaces === 'tinted' ? 'tinted' : 'neutral';
      var asked = cfg.variantSet && cfg.variant && cfg.variant !== 'auto' ? cfg.variant : 'auto';
      var auto = surf === 'tinted' ? 'tonal' : variantFor(cfg.seed);
      return [seed + '/' + asked + '/' + surf].concat(asked === 'auto' ? [seed + '/' + auto + '/' + surf] : asked === auto ? [seed + '/auto/' + surf] : []);
    }
    return { AUTO_VARIANT: AUTO_VARIANT, variantFor: variantFor, schemeFor: schemeFor, scopedCss: scopedCss, pageCss: pageCss, brandKeys: brandKeys };
  }
  /* color-kit:end */
  var kit = null;
  function K() {
    if (kit) return kit;
    var n = function (name, d) { var v = parseFloat(S4.util.css(name)); return isNaN(v) ? d : v; };
    /* a brand file raises the default FAB's tint at :root, so it also carries the owner's floors it started from */
    var floors = S4.util.css('--s4-brand-floors').replace(/["']/g, '').split(/\s+/).map(parseFloat);
    var k = n('--s4-glass-backdrop-contrast-float', 1), br = n('--s4-glass-backdrop-brightness-float', 1);
    var filt = function (v) { return Math.min(255, Math.max(0, ((v - 127.5) * k + 127.5) * br)); };
    return (kit = colorKit(window.M3Color, { fab: floors[0] || n('--s4-glass-tint-opacity-fab', 0.75), color: floors[1] || n('--s4-glass-tint-opacity-fab-color', 0.9), lo: filt(0), hi: filt(255) }));
  }
  function schemeFor(dark, c, cfg) { return K().schemeFor(dark, c, cfg || state); }
  /* Brand files (decision 0063): a page that links the CSS scripts/brand.mjs wrote (after orion.css) already paints its
     brand on the first frame. The file names the schemes it holds in --s4-brand ("seed/variant/surfaces", the variant
     as asked, and as auto would resolve it); when the page's seed matches one, nothing is generated, loaded or repainted. Medium contrast (0.5) is
     not in the file, so it is generated as before. */
  function brandFile() {
    if (!state.seed || (state.contrast > 0 && state.contrast < 1)) return false;
    var names = S4.util.css('--s4-brand').replace(/["']/g, '').toLowerCase().split(/\s+/);
    var asked = state.variantSet && state.variant !== 'auto' ? state.variant : 'auto';
    return names.indexOf(String(state.seed).toLowerCase() + '/' + asked + '/' + (state.surfaces === 'tinted' ? 'tinted' : 'neutral')) >= 0;
  }
  /* Visitor-picked colors (decision 0063): with a save key, the generated scheme is kept under key + ':color', and the
     head snippet in the skill puts it back before the first paint (a color the visitor picked cannot be in a brand file). */
  function cacheColor(css) {
    if (!S4.theme.key) return;
    try { if (css) localStorage.setItem(S4.theme.key + ':color', css); else localStorage.removeItem(S4.theme.key + ':color'); } catch (e) {}
  }
  function writeColor() {
    var el = document.getElementById('s4-dynamic-color');
    var done = function () { writeScoped(); metaThemeColor(); S4.util.emit(document, 's4-theme', S4.theme()); };
    if (!state.seed || brandFile()) { if (el) el.remove(); cacheColor(null); return done(); }
    loadColor(function () {
      var css = K().pageCss(state, state.contrast);
      el = document.getElementById('s4-dynamic-color');
      if (!el) { el = document.createElement('style'); el.id = 's4-dynamic-color'; document.head.appendChild(el); }
      el.textContent = css;
      cacheColor(css);
      done();
    });
  }
  /* Scoped accents (issue 52): data-accent="blue | #0b57d0" on any element (optional data-accent-variant and
     data-surfaces="tinted"), or S4.theme({ seed, variant, surfaces }, element). Each distinct scheme is written once,
     keyed by data-s4-accent-id; contrast follows the page. */
  var scoped = {};
  function accentCfg(node) {
    var raw = node.getAttribute('data-accent'), seed = raw && (S4.theme.accents[raw.toLowerCase()] || raw);
    if (!seed || !/^#[0-9a-f]{6}$/i.test(seed)) return null;
    var v = node.getAttribute('data-accent-variant');
    return { seed: seed, variant: v || 'auto', variantSet: !!v && v !== 'auto', surfaces: node.getAttribute('data-surfaces') === 'tinted' ? 'tinted' : 'neutral' };
  }
  function writeScoped() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll('[data-accent]:not(html)'));
    if (!nodes.length && !document.getElementById('s4-scoped-color')) return;
    loadColor(function () {
      var c = state.contrast >= 1 ? 1 : state.contrast, css = '';
      nodes.forEach(function (node) {
        var cfg = accentCfg(node);
        if (!cfg) { node.removeAttribute('data-s4-accent-id'); return; }
        var key = (cfg.seed + '-' + (cfg.variantSet ? cfg.variant : '') + '-' + cfg.surfaces + '-' + c).toLowerCase().replace(/[^a-z0-9-]/g, '');
        node.setAttribute('data-s4-accent-id', key);
        if (!scoped[key]) scoped[key] = K().scopedCss('[data-s4-accent-id="' + key + '"]', [':scope', ':scope [data-theme]', ':scope [data-gray]'],
          schemeFor(false, c, cfg), schemeFor(true, c, cfg), schemeFor(false, 1, cfg), schemeFor(true, 1, cfg));
      });
      var used = {}; nodes.forEach(function (n) { var k = n.getAttribute('data-s4-accent-id'); if (k) used[k] = scoped[k]; });
      Object.keys(used).forEach(function (k) { css += used[k]; });
      var el = document.getElementById('s4-scoped-color');
      if (!el) { el = document.createElement('style'); el.id = 's4-scoped-color'; document.head.appendChild(el); }
      el.textContent = '@layer s4.tokens{' + css + '}';
    });
  }
  function metaThemeColor() {
    requestAnimationFrame(function () {
      var m = document.querySelector('meta[name="theme-color"]:not([media])');
      if (!m) { m = document.createElement('meta'); m.name = 'theme-color'; document.head.appendChild(m); }
      m.content = S4.util.css('--md-sys-color-surface');
    });
  }
  var FACES = ['serif', 'rounded', 'mono', 'system', 'geometric', 'humanist'];
  var BRAND = [
    { key: 'corners', attr: 'data-corners', base: 'round' },
    { key: 'gray', attr: 'data-gray', base: 'pure' },
    { key: 'page', attr: 'data-page', base: 'plain' },
    { key: 'display', attr: 'data-type-display', base: 'inter', prop: '--md-ref-typeface-brand' },
    { key: 'text', attr: 'data-type-text', base: 'inter', prop: '--md-ref-typeface-plain' },
    { key: 'displayWeight', attr: 'data-type-display-weight', base: 'semibold' },   /* regular, medium: for a display face lighter than Inter (decision 0060) */
    { key: 'energy', attr: 'data-energy', base: 'standard' },   /* motion energy: calm, standard, lively (motion.css, motion.js) */
    { key: 'scale', attr: 'data-scale', base: 'default' },   /* type and spacing together: compact, default, large (scale.css, decision 0066) */
    { key: 'headings', attr: 'data-headings', base: 'default' }   /* heading style: default, tight, editorial (brand.css, decision 0066) */
  ];
  /* Dial values (decision 0067): every dial takes a short list of values; anything else matches no rule and used to be
     written to the page silently (S4.theme({ scale: 'roomy' }) wrote data-scale="roomy" and nothing changed). S4.theme
     now warns, names the allowed values and does not write the attribute; the same list audits markup (S4.theme.audit)
     and the page checker fails what it finds. A typeface may also be any font-family value (written as "custom"). */
  var DIALS = {
    'data-theme': ['light', 'dark', 'system'],
    'data-contrast': ['standard', 'medium', 'high'],
    'data-surfaces': ['neutral', 'tinted'],
    'data-accent-variant': ['auto', 'tonal', 'vibrant', 'fidelity', 'expressive', 'content', 'neutral', 'monochrome', 'rainbow', 'fruit-salad'],
    'data-corners': ['round', 'soft', 'firm'],
    'data-gray': ['pure', 'warm', 'cool'],
    'data-page': ['plain', 'soft'],
    'data-type-display': ['inter'].concat(FACES, ['custom']),
    'data-type-text': ['inter'].concat(FACES, ['custom']),
    'data-type-display-weight': ['semibold', 'regular', 'medium'],
    'data-energy': ['calm', 'standard', 'lively'],
    'data-scale': ['default', 'compact', 'large'],
    'data-headings': ['default', 'tight', 'editorial'],
    'data-density': ['comfortable', 'compact', 'auto', 'roomy'],
    'data-buttons': ['filled', 'tonal'],
    'data-cards': ['filled', 'elevated'],
    'data-lists': ['plain', 'segmented'],
    'data-rail': ['auto', 'expanded', 'collapsed']
  };
  function sayList(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' or ' + a[a.length - 1]; }
  function dialMsg(attr, v) {
    var ok = DIALS[attr];
    if (!ok || v == null || v === '' || ok.indexOf(v) >= 0) return null;
    return 'S4: ' + attr + '="' + v + '" is not a value of that dial; use ' + sayList(ok) + '.';
  }
  var warned = {};
  function warnOnce(msg) { if (!warned[msg]) { warned[msg] = 1; console.warn(msg); } }
  function ownPage(n) { return n.classList.contains('s4-subpage') || n.hasAttribute('data-title'); }   /* data-page on a page is its id, not the dial */
  /* false, with a warning, for a value that is not on the dial's list: the caller leaves the attribute alone */
  function dialOk(attr, key, v) {
    if (v == null || v === '' || v === false) return true;
    var ok = DIALS[attr]; if (!ok || ok.indexOf(String(v)) >= 0) return true;
    warnOnce('S4: theme ' + key + ' "' + v + '" ignored (not written); use ' + sayList(ok) + '.');
    return false;
  }
  /* a typeface dial also takes a font-family value, so it is never checked as a preset */
  function brandOk(d, v) { return d.prop ? true : dialOk(d.attr, d.key, v); }
  function auditDials(scope) {
    var out = [], seen = {}, attrs = Object.keys(DIALS);
    [].slice.call((scope || document).querySelectorAll(attrs.map(function (a) { return '[' + a + ']'; }).join(','))).forEach(function (n) {
      attrs.forEach(function (a) {
        if (!n.hasAttribute(a) || (a === 'data-page' && ownPage(n))) return;
        var m = dialMsg(a, n.getAttribute(a));
        if (m && !seen[m]) { seen[m] = 1; out.push(m); }
      });
    });
    return out;
  }
  /* S4.theme(opts, element): the same dials on one container (issue 52). Nothing is saved; the attributes are the state.
     A key set to null or '' removes the attribute (the container follows the page again); a default value ('round',
     'pure', 'inter', mode 'light') is written, so the container goes back to stock Orion inside a branded page. */
  function themeElement(el, opts) {
    var attr = function (name, v) { if (v == null || v === '' || v === 'system') el.removeAttribute(name); else el.setAttribute(name, v); };
    if (opts) {
      if ('mode' in opts && dialOk('data-theme', 'mode', opts.mode)) attr('data-theme', opts.mode);
      if ('seed' in opts) attr('data-accent', opts.seed);
      if ('variant' in opts && dialOk('data-accent-variant', 'variant', opts.variant)) attr('data-accent-variant', opts.variant);
      if ('surfaces' in opts) attr('data-surfaces', opts.surfaces === 'tinted' ? 'tinted' : null);
      BRAND.forEach(function (d) {
        if (!(d.key in opts)) return;
        var v = opts[d.key];
        if (!brandOk(d, v)) return;
        if (d.key === 'page' && v === 'plain') v = null;   /* page tone only adds: a plain region inside a soft page is not a dial */
        if (!d.prop || !v || v === d.base || FACES.indexOf(v) >= 0) { attr(d.attr, v); if (d.prop) el.style.removeProperty(d.prop); return; }
        attr(d.attr, 'custom'); el.style.setProperty(d.prop, v);
      });
      if ('seed' in opts || 'variant' in opts || 'surfaces' in opts) writeScoped();
      S4.util.emit(el, 's4-theme', themeElement(el));
    }
    var o = { mode: el.getAttribute('data-theme') || null, seed: el.getAttribute('data-accent') || null,
      variant: el.getAttribute('data-accent-variant') || null, surfaces: el.getAttribute('data-surfaces') || null };
    BRAND.forEach(function (d) { var v = el.getAttribute(d.attr); o[d.key] = v === 'custom' ? el.style.getPropertyValue(d.prop).trim() : v; });
    return o;
  }
  S4.theme = function (opts, el) {
    if (el && el !== root) return themeElement(el, opts);
    if (!opts) return { seed: state.seed, variant: state.variantSet ? state.variant : 'auto', mode: state.mode, contrast: state.contrast, surfaces: state.surfaces,
      corners: state.corners || 'round', gray: state.gray || 'pure', page: state.page || 'plain', display: state.display || 'inter', text: state.text || 'inter', energy: state.energy || 'standard', displayWeight: state.displayWeight || 'semibold',
      scale: state.scale || 'default', headings: state.headings || 'default' };
    var colorChanged = false;
    opts = Object.assign({}, opts);   /* a value off the dial's list is dropped, with a warning, never written (decision 0067) */
    if ('mode' in opts && !dialOk('data-theme', 'mode', opts.mode)) delete opts.mode;
    if ('variant' in opts && !dialOk('data-accent-variant', 'variant', opts.variant)) delete opts.variant;
    /* the dial's own words (S4.theme.dials) are accepted too (decision 0076) */
    var cw = DIALS['data-contrast'].indexOf(opts.contrast); if (cw >= 0) opts.contrast = cw / 2;
    if ('contrast' in opts && opts.contrast !== '' && opts.contrast != null && !(+opts.contrast >= 0 && +opts.contrast <= 1)) { warnOnce('S4: theme contrast "' + opts.contrast + '" ignored (not written); use standard, medium or high.'); delete opts.contrast; }
    BRAND.forEach(function (d) { if (d.key in opts && !brandOk(d, opts[d.key])) delete opts[d.key]; });
    if ('seed' in opts) {
      var seed = opts.seed && S4.theme.accents[String(opts.seed).toLowerCase()] || opts.seed;
      state.seed = seed && String(seed).toLowerCase() !== '#000000' ? seed : null; colorChanged = true;
    }
    if (opts.variant) { state.variant = opts.variant; state.variantSet = opts.variant !== 'auto'; colorChanged = true; }
    if (opts.surfaces) { state.surfaces = opts.surfaces === 'tinted' ? 'tinted' : 'neutral'; colorChanged = true; }
    if (opts.mode) { state.mode = opts.mode; if (opts.mode === 'system') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', opts.mode); }
    if ('contrast' in opts) {
      state.contrast = +opts.contrast || 0; colorChanged = true;
      if (state.contrast >= 1) root.setAttribute('data-contrast', 'high');
      else if (state.contrast >= 0.5) root.setAttribute('data-contrast', 'medium');
      else root.setAttribute('data-contrast', 'standard');
    }
    /* Brand dials (decision 0055): corners, gray temperature, page tone and typefaces are attributes on <html>
       (base/brand.css, base/gray.css). A typeface is a preset name (serif, rounded, mono, system) or a font-family
       value; null or 'inter' / 'round' / 'pure' / 'plain' goes back to the default. */
    BRAND.forEach(function (d) {
      if (!(d.key in opts)) return;
      var v = opts[d.key]; if (v === d.base || !v) v = null;
      state[d.key] = v;
      if (!d.prop) { if (v) root.setAttribute(d.attr, v); else root.removeAttribute(d.attr); return; }
      var preset = !v || FACES.indexOf(v) >= 0;
      if (v) root.setAttribute(d.attr, preset ? v : 'custom'); else root.removeAttribute(d.attr);
      if (preset) root.style.removeProperty(d.prop); else root.style.setProperty(d.prop, v);
    });
    if (colorChanged) { writeColor(); writeScoped(); } else { metaThemeColor(); S4.util.emit(document, 's4-theme', S4.theme()); }
    var key = opts.save || S4.theme.key;
    if (key) { S4.theme.key = key; save(key); }
    return S4.theme();
  };
  /* the dials written in the page's own markup (<html data-energy="calm">) are the starting state, so a saved theme
     and S4.theme() report them instead of the default */
  BRAND.forEach(function (d) {
    var v = root.getAttribute(d.attr); if (!v || v === d.base) return;
    state[d.key] = v === 'custom' && d.prop ? (root.style.getPropertyValue(d.prop).trim() || null) : v;
  });
  S4.theme.dials = DIALS;
  S4.theme.audit = auditDials;   /* the dial attributes in the page whose value is not on the list, as messages (the page checker fails them) */
  S4.register('dial-values', function (scope) { auditDials(scope).forEach(warnOnce); });
  new MutationObserver(function (list) {
    list.forEach(function (m) { if (m.attributeName === 'data-page' && ownPage(m.target)) return; var msg = dialMsg(m.attributeName, m.target.getAttribute(m.attributeName)); if (msg) warnOnce(msg); });
  }).observe(root, { attributes: true, subtree: true, attributeFilter: Object.keys(DIALS) });
  S4.theme.accents = { mono: '#000000', blue: '#0b57d0', indigo: '#4f46e5', violet: '#7c3aed', pink: '#c2185b', red: '#c62828', orange: '#d9480f', amber: '#b26a00', green: '#2e7d32', teal: '#00796b' };
  /* Apply a saved theme (or the defaults on a first visit) and keep saving changes under key. Returns true if one was saved. */
  /* opts.only (decision 0060): the keys the visitor owns, e.g. { only: ['mode'] }. Only those are read
     from the saved theme and only those are saved; every other key comes from defaults on every visit, so a branded app
     keeps its fixed brand (and never writes it into a key other pages share) while the visitor's light or dark choice
     is remembered. Dials written on <html> in markup are already the starting state, so defaults need not repeat them. */
  S4.theme.restore = function (key, defaults, opts) {
    var saved = read(key), only = opts && opts.only ? [].concat(opts.only) : null;
    S4.theme.key = key; S4.theme.only = only;
    var o = {}, k;
    if (only) {
      for (k in defaults) o[k] = defaults[k];
      if (saved) only.forEach(function (n) { if (n in saved) o[n] = saved[n]; });
    } else { var t = saved || defaults || {}; for (k in t) o[k] = t[k]; }
    S4.theme(o);
    return !!saved;
  };
  function read(key) { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { return null; } }
  function save(key) {
    var t = S4.theme(), only = S4.theme.only;
    if (only) { var o = read(key) || {}; only.forEach(function (n) { o[n] = t[n]; }); t = o; }   /* other keys in a shared save stay as they were */
    try { localStorage.setItem(key, JSON.stringify(t)); } catch (e) {}
  }
  /* the variant a seed gets when none is named (see AUTO_VARIANT); needs m3color.js, so it answers 'vibrant' until that has loaded */
  S4.theme.variantFor = function (seed) {
    if (!window.M3Color || !seed) return 'vibrant';
    return K().variantFor(seed);
  };
  if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', metaThemeColor);
  /* declarative scoped accents: data-accent on any element added to the page, and (decision 0060) a data-accent,
     data-accent-variant or data-surfaces changed later with setAttribute, so a region's color follows its markup */
  S4.register('scoped-accent', function (scope) { if (S4.util.all(scope, '[data-accent]:not(html)').length) writeScoped(); });
  var scopedQueued = false;
  new MutationObserver(function (list) {
    var hit = false;
    list.forEach(function (m) {
      if (m.target === root) return;
      hit = true;
      if (!m.target.hasAttribute('data-accent')) m.target.removeAttribute('data-s4-accent-id');
    });
    if (hit && !scopedQueued) { scopedQueued = true; Promise.resolve().then(function () { scopedQueued = false; writeScoped(); }); }
  }).observe(root, { attributes: true, subtree: true, attributeFilter: ['data-accent', 'data-accent-variant', 'data-surfaces'] });
})();
