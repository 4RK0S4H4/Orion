/* S4 Orion runtime core: window.S4.
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
  var S4 = window.S4 = { version: '1.0.0' };
  var scriptSrc = (document.currentScript && document.currentScript.src) || '';

  /* ---------- registry and auto-init ---------- */
  var inits = [];
  S4.register = function (name, init) { inits.push({ name: name, init: init }); if (ready) init(document); };
  S4.init = function (scope) { inits.forEach(function (c) { try { c.init(scope || document); } catch (e) { console.error('S4 ' + c.name, e); } }); drawIcons(scope || document); };
  var ready = false;
  function boot() {
    ready = true; S4.init(document);
    new MutationObserver(function (list) {
      list.forEach(function (m) { m.addedNodes.forEach(function (n) { if (n.nodeType === 1 && !n.closest('[data-s4-skip]')) S4.init(n); }); });
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else setTimeout(boot);

  /* ---------- small utilities ---------- */
  S4.util = {
    emit: function (el, name, detail) { el.dispatchEvent(new CustomEvent(name, { bubbles: true, detail: detail })); },
    css: function (name, el) { return getComputedStyle(el || root).getPropertyValue(name).trim(); },
    /* true for anything that brings up a keyboard. Decision 0049: a script never moves focus into one of these;
       only the person does, by tapping it (opening something with a key press is the one exception, see S4.palette) */
    typable: function (el) { return !!el && el.matches && el.matches('input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="range"]), textarea, select, [contenteditable]'); },
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
  function drawIcons(scope) {
    var reg = window.S4_ICONS; if (!reg) return;
    S4.util.all(scope, '.s4-icon[data-icon]').forEach(function (el) {
      var name = el.getAttribute('data-icon');
      if (el.dataset.s4Drawn === name) return;
      var body = reg.icons[name];
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
  var state = { seed: null, variant: 'vibrant', mode: 'system', contrast: 0, surfaces: 'neutral' };
  /* m3color.js sits next to orion.js (skill assets) or in components/assets/ (repo); <script data-m3color="..."> overrides. */
  var m3src = (document.currentScript && document.currentScript.dataset.m3color) ||
    (scriptSrc.indexOf('/components/') >= 0 ? scriptSrc.slice(0, scriptSrc.indexOf('/components/')) + '/components/assets/m3color.js'
                                           : scriptSrc.replace(/[^/]*$/, '') + 'm3color.js');
  function loadColor(cb) {
    if (window.M3Color) return cb();
    var s = document.createElement('script'); s.src = m3src; s.onload = cb;
    s.onerror = function () { console.error('S4: could not load ' + m3src + ' (set data-m3color on the orion.js script tag)'); };
    document.head.appendChild(s);
  }
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
    cfg = cfg || state;
    var M = window.M3Color, tinted = cfg.surfaces === 'tinted';
    var s = M.scheme(cfg.seed, tinted && !cfg.variantSet ? 'tonal' : cfg.variant, dark, c);
    if (tinted) { s['--s4-color-control'] = s.outline; return s; }
    var pal = M.palettes(cfg.seed, cfg.variant), tone = function (t) { return pal.rows.Primary[pal.tones.indexOf(t)]; };
    var o = {}; ACCENT.forEach(function (k) { o[k] = s[k]; });
    o['secondary-container'] = tone(dark ? 20 : 90);       /* selection: a soft tint of the accent (a deep one in dark mode, so it never competes with the main button) */
    o['on-secondary-container'] = tone(dark ? 90 : 10);
    o['--s4-focus-ring-color'] = s.primary;
    return o;
  }
  /* one role list as light-dark(light, dark): the element's own color-scheme (set by the token blocks for every light
     or dark scope) picks the value, so a scoped scheme follows whatever mode the element is in */
  function rolesLD(L, D) {
    var css = Object.keys(L).map(function (k) { return (k.charAt(0) === '-' ? k : '--md-sys-color-' + k) + ':light-dark(' + L[k] + ',' + D[k] + ')'; }).join(';');
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
  function writeColor() {
    var el = document.getElementById('s4-dynamic-color');
    if (!state.seed) { if (el) el.remove(); return; }
    loadColor(function () {
      var c = state.contrast >= 1 ? 1 : state.contrast;
      var L = schemeFor(false, c), D = schemeFor(true, c), LH = schemeFor(false, 1), DH = schemeFor(true, 1);
      var W = function (s) { return ':where(' + s + ')'; };
      var css = '@layer s4.tokens{' +
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
      if (!el) { el = document.createElement('style'); el.id = 's4-dynamic-color'; document.head.appendChild(el); }
      el.textContent = css;
      writeScoped();
      metaThemeColor();
      S4.util.emit(document, 's4-theme', S4.theme());
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
    return { seed: seed, variant: v || 'vibrant', variantSet: !!v, surfaces: node.getAttribute('data-surfaces') === 'tinted' ? 'tinted' : 'neutral' };
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
        if (!scoped[key]) scoped[key] = scopedCss('[data-s4-accent-id="' + key + '"]', [':scope', ':scope [data-theme]', ':scope [data-gray]'],
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
  var FACES = ['serif', 'rounded', 'mono', 'system'];
  var BRAND = [
    { key: 'corners', attr: 'data-corners', base: 'round' },
    { key: 'gray', attr: 'data-gray', base: 'pure' },
    { key: 'page', attr: 'data-page', base: 'plain' },
    { key: 'display', attr: 'data-type-display', base: 'inter', prop: '--md-ref-typeface-brand' },
    { key: 'text', attr: 'data-type-text', base: 'inter', prop: '--md-ref-typeface-plain' },
    { key: 'energy', attr: 'data-energy', base: 'standard' }   /* motion energy: calm, standard, lively (motion.css, motion.js) */
  ];
  /* S4.theme(opts, element): the same dials on one container (issue 52). Nothing is saved; the attributes are the state.
     A key set to null or '' removes the attribute (the container follows the page again); a default value ('round',
     'pure', 'inter', mode 'light') is written, so the container goes back to stock Orion inside a branded page. */
  function themeElement(el, opts) {
    var attr = function (name, v) { if (v == null || v === '' || v === 'system') el.removeAttribute(name); else el.setAttribute(name, v); };
    if (opts) {
      if ('mode' in opts) attr('data-theme', opts.mode);
      if ('seed' in opts) attr('data-accent', opts.seed);
      if ('variant' in opts) attr('data-accent-variant', opts.variant);
      if ('surfaces' in opts) attr('data-surfaces', opts.surfaces === 'tinted' ? 'tinted' : null);
      BRAND.forEach(function (d) {
        if (!(d.key in opts)) return;
        var v = opts[d.key];
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
    if (!opts) return { seed: state.seed, variant: state.variant, mode: state.mode, contrast: state.contrast, surfaces: state.surfaces,
      corners: state.corners || 'round', gray: state.gray || 'pure', page: state.page || 'plain', display: state.display || 'inter', text: state.text || 'inter', energy: state.energy || 'standard' };
    var colorChanged = false;
    if ('seed' in opts) {
      var seed = opts.seed && S4.theme.accents[String(opts.seed).toLowerCase()] || opts.seed;
      state.seed = seed && String(seed).toLowerCase() !== '#000000' ? seed : null; colorChanged = true;
    }
    if (opts.variant) { state.variant = opts.variant; state.variantSet = true; colorChanged = true; }
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
    if (key) { S4.theme.key = key; try { localStorage.setItem(key, JSON.stringify(S4.theme())); } catch (e) {} }
    return S4.theme();
  };
  /* the dials written in the page's own markup (<html data-energy="calm">) are the starting state, so a saved theme
     and S4.theme() report them instead of the default */
  BRAND.forEach(function (d) {
    var v = root.getAttribute(d.attr); if (!v || v === d.base) return;
    state[d.key] = v === 'custom' && d.prop ? (root.style.getPropertyValue(d.prop).trim() || null) : v;
  });
  S4.theme.accents = { mono: '#000000', blue: '#0b57d0', indigo: '#4f46e5', violet: '#7c3aed', pink: '#c2185b', red: '#c62828', orange: '#d9480f', amber: '#b26a00', green: '#2e7d32', teal: '#00796b' };
  /* Apply a saved theme (or the defaults on a first visit) and keep saving changes under key. Returns true if one was saved. */
  S4.theme.restore = function (key, defaults) {
    var saved = null; try { saved = JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) {}
    S4.theme.key = key;
    var t = saved || defaults || {};
    var o = {}; for (var k in t) o[k] = t[k];
    S4.theme(o);
    return !!saved;
  };
  if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', metaThemeColor);
  /* declarative scoped accents: data-accent on any element added to the page */
  S4.register('scoped-accent', function (scope) { if (S4.util.all(scope, '[data-accent]:not(html)').length) writeScoped(); });
})();
