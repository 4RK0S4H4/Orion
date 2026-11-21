#!/usr/bin/env node
/* Build S4 Orion tokens: tokens/src/*.tokens.json (W3C DTCG format) -> tokens/tokens.css, tokens.ts, tokens.json.
   No dependencies; Node 20+.

   Source conventions
   - A token is any object with "$value". "$type" is inherited from the nearest group that sets it.
   - The CSS name is the token path joined with "-": md.sys.color.primary -> --md-sys-color-primary.
   - Aliases are "{path.to.token}". In CSS an alias becomes var(--path-to-token), so a run-time change to the target
     (e.g. a new seed color) flows through. Inside composite values (shadows) aliases are resolved to plain values.
   - Modes live on the token in $extensions["com.s4.modes"]: dark, high-contrast, dark-high-contrast, reduced-motion,
     reduced-transparency. The light, standard-contrast value is $value.
   - A group with $extensions["com.s4.spring"] = true holds stiffness, damping and duration; the build also emits the
     group itself as a CSS linear() easing that follows that spring for that duration.

   Usage: node scripts/build-tokens.mjs           build
          node scripts/build-tokens.mjs --check   fail if the committed outputs are stale or a check fails */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'tokens/src');
const CHECK = process.argv.includes('--check');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const errors = [];
const fail = (msg) => errors.push(msg);

/* ---------- load and merge ---------- */
const files = readdirSync(SRC).filter((f) => f.endsWith('.tokens.json')).sort();
const tree = {};
function merge(into, from, where) {
  for (const [k, v] of Object.entries(from)) {
    if (k === '$description' || (k === '$extensions' && where === '')) continue;   /* file-level metadata */
    if (v && typeof v === 'object' && !Array.isArray(v) && !('$value' in v) && !k.startsWith('$')) {
      into[k] = into[k] || {}; merge(into[k], v, where + '.' + k);
    } else {
      if (k in into && !k.startsWith('$')) fail(`Duplicate token ${where.slice(1)}.${k}`);
      into[k] = v;
    }
  }
}
for (const f of files) merge(tree, JSON.parse(readFileSync(join(SRC, f), 'utf8')), '');

/* ---------- flatten ---------- */
const tokens = new Map();   /* path -> { path, type, value, modes, description } */
const springs = [];         /* spring group paths */
const MODES = ['dark', 'high-contrast', 'dark-high-contrast', 'reduced-motion', 'reduced-transparency'];
(function walk(node, path, type) {
  if (node.$type) type = node.$type;
  if ('$value' in node) {
    if (!type) fail(`${path.join('.')} has no $type`);
    const modes = node.$extensions?.['com.s4.modes'] || {};
    for (const m of Object.keys(modes)) if (!MODES.includes(m)) fail(`${path.join('.')}: unknown mode "${m}"`);
    tokens.set(path.join('.'), { path, type, value: node.$value, modes, description: node.$description, labelTint: node.$extensions?.['com.s4.label-tint'] });
    return;
  }
  if (node.$extensions?.['com.s4.spring']) springs.push(path.join('.'));
  for (const [k, v] of Object.entries(node)) if (!k.startsWith('$') && v && typeof v === 'object') walk(v, [...path, k], type);
})(tree, [], undefined);

/* ---------- aliases ---------- */
const ALIAS = /^\{([^}]+)\}$/;
function resolve(value, seen = []) {
  if (typeof value === 'string' && ALIAS.test(value)) {
    const target = value.match(ALIAS)[1];
    if (seen.includes(target)) { fail(`Alias cycle: ${[...seen, target].join(' -> ')}`); return null; }
    const t = tokens.get(target);
    if (!t) { fail(`Unknown alias {${target}}`); return null; }
    return resolve(t.value, [...seen, target]);
  }
  if (Array.isArray(value)) return value.map((v) => resolve(v, seen));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolve(v, seen)]));
  return value;
}
const cssName = (path) => '--' + path.join('-');

/* ---------- label tints (decision 0063) ----------
   A token with $extensions["com.s4.label-tint"] = { surface, label, floor } is the glass tint of a floating thing in
   its own color (a FAB in a color, the vibrant toolbar): the owner's floor where the label reads at 4.5:1 over a pure
   black or white backdrop (after the glass's backdrop filter), raised one step at a time only as far as the label
   needs, per mode. The same rule core.js applies to every seed and scripts/check-glass.mjs proves. */
const modeValue = (t, mode) => (mode === 'light' ? t.value : t.modes[mode] ?? (mode === 'dark-high-contrast' ? t.modes.dark ?? t.modes['high-contrast'] : undefined) ?? t.value);
function inMode(value, mode, seen = 0) {
  if (typeof value === 'string' && ALIAS.test(value) && seen < 9) { const t = tokens.get(value.match(ALIAS)[1]); return t ? inMode(modeValue(t, mode), mode, seen + 1) : null; }
  return value && typeof value === 'object' && value.hex ? value.hex : value;
}
{
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const L = (c) => { const v = c.map((x) => { x = Math.min(255, Math.max(0, x)) / 255; return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
  const R = (a, b) => { const [x, y] = [L(a), L(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  for (const t of tokens.values()) {
    if (!t.labelTint) continue;
    const { surface, label, floor } = t.labelTint, out = {};
    for (const mode of ['light', 'dark', 'high-contrast', 'dark-high-contrast', 'reduced-transparency']) {
      const m = mode === 'reduced-transparency' ? 'light' : mode;
      const from = +inMode(floor, mode), bg = inMode(surface, m), fg = inMode(label, m);
      const k = +inMode('{s4.glass.backdrop-contrast.float}', m), br = +inMode('{s4.glass.backdrop-brightness.float}', m);
      if (!bg || !fg || isNaN(from)) { fail(`${t.path.join('.')}: label-tint needs a surface, a label and a floor`); break; }
      const filt = (v) => Math.min(255, Math.max(0, ((v - 127.5) * k + 127.5) * br)), lo = filt(0), hi = filt(255), b = hex(bg), f = hex(fg);
      const at = (x, back) => b.map((v) => v * x + back * (1 - x));
      let x = from;
      while (x < 1 && Math.min(R(f, at(x, lo)), R(f, at(x, hi))) < 4.5) x = Math.round((x + 0.01) * 100) / 100;
      out[mode] = Math.min(1, x);
    }
    t.value = out.light;
    t.modes = Object.fromEntries(Object.entries(out).filter(([m, v]) => m !== 'light' && v !== out.light));
  }
}

/* ---------- values -> CSS ---------- */
const round = (n, d = 4) => +n.toFixed(d);
function color(v) {
  if (typeof v === 'string') return v;
  const a = v.alpha ?? 1;
  if (a === 1 && v.hex) return v.hex;
  const [r, g, b] = v.components.map((c) => Math.round(c * 255));
  return `rgb(${r} ${g} ${b} / ${round(a, 3)})`;
}
const dimension = (v) => (typeof v === 'string' ? v : `${v.value}${v.unit}`);
const duration = (v) => (typeof v === 'string' ? v : `${v.value}${v.unit}`);
const family = (v) => (Array.isArray(v) ? v : [v]).map((f) => (/^[a-z-]+$/i.test(f) && !/\s/.test(f) && f !== 'Inter' ? f : `"${f}"`)).join(', ');
function shadow(v) {
  const layers = Array.isArray(v) ? v : [v];
  if (!layers.length) return '0 0 0 0 transparent';   /* not 'none', so a shadow token can be combined with others in one box-shadow */
  return layers.map((l) => `${l.inset ? 'inset ' : ''}${dimension(l.offsetX)} ${dimension(l.offsetY)} ${dimension(l.blur)} ${dimension(l.spread)} ${color(l.color)}`).join(', ');
}
function toCss(type, raw) {
  if (typeof raw === 'string' && ALIAS.test(raw)) {
    const target = raw.match(ALIAS)[1];
    if (!tokens.has(target)) fail(`Unknown alias {${target}}`);
    else if (tokens.get(target).type !== type) fail(`Alias {${target}} is a ${tokens.get(target).type}, used as a ${type}`);
    return `var(${cssName(target.split('.'))})`;
  }
  const v = resolve(raw);
  switch (type) {
    case 'color': return color(v);
    case 'dimension': return dimension(v);
    case 'duration': return duration(v);
    case 'number': case 'fontWeight': return String(v);
    case 'fontFamily': return family(v);
    case 'shadow': return shadow(v);
    case 'cubicBezier': return `cubic-bezier(${v.join(', ')})`;
    default: fail(`Unsupported $type "${type}"`); return String(v);
  }
}

/* ---------- springs -> linear() ---------- */
function springEasing(k, z, ms, steps = 40) {
  const w = Math.sqrt(k), T = ms / 1000;
  const x = (t) => {
    if (z >= 1) return 1 - Math.exp(-w * t) * (1 + w * t);
    const wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t));
  };
  const pts = [];
  for (let i = 0; i <= steps; i++) pts.push(i === 0 ? '0' : i === steps ? '1' : `${round(x((T * i) / steps), 3)} ${round((100 * i) / steps, 2)}%`);
  let peak = 0; for (let i = 0; i <= 400; i++) peak = Math.max(peak, x((T * i) / 400));
  return { easing: `linear(${pts.join(', ')})`, overshoot: round(Math.max(0, peak - 1) * 100, 1) };
}

/* ---------- collect declarations per mode ---------- */
const base = [], byMode = Object.fromEntries(MODES.map((m) => [m, []])), json = {};
for (const t of tokens.values()) {
  const name = cssName(t.path), value = toCss(t.type, t.value);
  base.push([name, value]);
  const entry = { type: t.type, value, ...(t.description ? { description: t.description } : {}) };
  const modes = {};
  for (const [m, mv] of Object.entries(t.modes)) modes[m] = toCss(t.type, mv);
  /* dark + high contrast needs a value whenever either one changes the token, otherwise the high-contrast (light) value
     would leak into dark mode: explicit, else dark, else high-contrast. */
  if ((modes.dark || modes['high-contrast']) && !modes['dark-high-contrast']) modes['dark-high-contrast'] = modes.dark || modes['high-contrast'];
  for (const [m, mv] of Object.entries(modes)) byMode[m].push([name, mv]);
  if (Object.keys(modes).length) entry.modes = modes;
  json[name] = entry;
}
for (const s of springs) {
  const g = (k) => resolve(tokens.get(`${s}.${k}`)?.value);
  const k = g('stiffness'), z = g('damping'), d = g('duration');
  if (k == null || z == null || !d) { fail(`Spring ${s} needs stiffness, damping and duration`); continue; }
  const { easing, overshoot } = springEasing(k, z, d.value);
  const name = cssName(s.split('.'));
  base.push([name, easing]);
  json[name] = { type: 'easing', value: easing, description: `Spring: stiffness ${k}, damping ${z}, ${d.value}ms, overshoot ${overshoot}%.` };
}

/* ---------- contrast checks (WCAG) ---------- */
function lum(hex) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const roleIn = (role, mode) => { const e = json[role.startsWith('--') ? role : `--md-sys-color-${role}`]; return mode === 'light' ? e?.value : e?.modes?.[mode] ?? e?.value; };
const SURFACES = ['surface', 'surface-container-lowest', 'surface-container-low', 'surface-container', 'surface-container-high', 'surface-container-highest', 'surface-dim', 'surface-bright'];
const PAIRS = [
  ...['primary', 'secondary', 'tertiary', 'error'].flatMap((r) => [[`on-${r}`, r, 4.5], [`on-${r}-container`, `${r}-container`, 4.5]]),
  ...SURFACES.flatMap((s) => [['on-surface', s, 4.5], ['on-surface-variant', s, 4.5], ['primary', s, 3], ['outline', s, 3]]),
  ['inverse-on-surface', 'inverse-surface', 4.5], ['inverse-primary', 'inverse-surface', 3],
  /* status colors (decision 0043): text on every surface, text on its own container, the badge */
  ...['success', 'warning', 'info'].flatMap((r) => [...SURFACES.map((s) => [`--s4-color-${r}`, s, 4.5]), [`--s4-color-on-${r}-container`, `--s4-color-${r}-container`, 4.5]]),
  ...['surface', 'surface-container-lowest', 'surface-container-low', 'surface-container', 'surface-container-high'].map((s) => ['--s4-color-control', s, 3]),
  ...SURFACES.map((s) => ['error', s, 4.5]), ['--s4-color-on-badge', '--s4-color-badge', 4.5],
  /* syntax colors (code blocks, round 0056): text on every surface */
  ...['keyword', 'string', 'number', 'comment', 'function', 'type', 'property'].flatMap((r) => SURFACES.map((s) => [`--s4-syntax-${r}`, s, 4.5])),
];
const contrastReport = [];
for (const mode of ['light', 'dark', 'high-contrast', 'dark-high-contrast']) {
  let worst = Infinity;
  for (const [fg, bg, min] of PAIRS) {
    const a = roleIn(fg, mode), b = roleIn(bg, mode);
    if (!a || !b) { fail(`Contrast check: missing role ${!a ? fg : bg}`); continue; }
    const r = ratio(a, b); worst = Math.min(worst, r / min);
    if (r < min) fail(`Contrast ${mode}: ${fg} on ${bg} is ${r.toFixed(2)}:1, needs ${min}:1`);
  }
  contrastReport.push(`${mode}: ${PAIRS.length} pairs pass`);
}

/* ---------- write CSS ---------- */
const decl = (list, indent = '    ') => list.map(([n, v]) => `${indent}${n}: ${v};`).join('\n');
const block = (sel, list, extra = []) => (list.length ? `  ${sel} {\n${decl([...extra, ...list])}\n  }\n` : '');
const media = (q, inner) => (inner ? `  @media ${q} {\n${inner.replace(/^/gm, '  ')}  }\n` : '');
const W = (s) => `:where(${s})`;
const SCHEME = (v) => [['color-scheme', v]];
const header = `/* S4 Orion tokens ${pkg.version}. GENERATED by scripts/build-tokens.mjs from tokens/src/*.tokens.json. Do not edit.
   Every selector is wrapped in :where() so all blocks have the same (zero) specificity and source order decides:
   base -> dark -> light scope -> scoped aliases -> high contrast -> dark + high contrast -> reduced motion -> reduced transparency.
   Opt in or out with attributes on <html>: data-theme="light|dark", data-contrast="standard|medium|high",
   data-motion="reduced", data-glass="off". Without attributes, the device settings apply.
   Themes on any container (issue 52): data-theme="light|dark" also works on any element and nests. The element
   re-declares every token its mode changes (and color-scheme), so what is inside follows; contrast, reduced motion and
   reduced transparency stay page-wide and reach into scoped elements. An alias token (var(--…)) resolves where it is
   declared, so every element that carries a theming attribute re-declares the aliases that depend on that dial. */\n`;
let css = header + '@layer s4.tokens {\n';
css += block(W(':root'), base, SCHEME('light'));
const DARK_AUTO = ':root:not([data-theme="light"])', HC_AUTO = ':root:not([data-contrast])';   /* any data-contrast value is an explicit choice */
const HC_ON = ':root[data-contrast="high"]';
const baseOf = new Map(base);
/* a light scope (inside a dark page) gets back the light value of every token dark mode changes */
const lightReset = byMode.dark.map(([n]) => [n, baseOf.get(n)]);
/* dark is a screen scheme: print stays light, on paper (components/base/print.css); that holds for scoped dark elements too */
css += media('screen and (prefers-color-scheme: dark)', block(W(DARK_AUTO), byMode.dark, SCHEME('dark')));
css += media('screen', block(W('[data-theme="dark"]'), byMode.dark, SCHEME('dark')));
css += block(W('[data-theme="light"]:not(:root)'), lightReset, SCHEME('light'));
/* aliases resolve where they are declared, so a scoped dial re-declares the ones that depend on it */
const pathIs = (re) => (t) => re.test(t.path.join('.'));
const isAlias = (t) => typeof t.value === 'string' && ALIAS.test(t.value);
/* The glass tints are aliases of surface roles, but a glass element re-maps those roles for the items on it, so a light
   or dark scope that is itself glass (a dark nav bar) could not re-resolve them there. A scoped light or dark element
   gets them as plain values of its mode instead. */
const glassAliases = [...tokens.values()].filter((t) => isAlias(t) && t.type === 'color' && pathIs(/^s4\.glass\./)(t));
const modeMap = (mode) => new Map([...base, ...(mode === 'light' ? [] : byMode[mode])]);
const literal = (mode) => { const m = modeMap(mode); const val = (n, seen = 0) => { const v = m.get(n); const r = v && v.match(/^var\((--[\w-]+)\)$/); return r && seen < 9 ? val(r[1], seen + 1) : v; }; return glassAliases.map((t) => [cssName(t.path), val(cssName(t.path))]); };
css += media('screen', block(W('[data-theme="dark"]:not(:root)'), literal('dark')));
css += block(W('[data-theme="light"]:not(:root)'), literal('light'));
const pick = (pred) => [...tokens.values()].filter(pred).map((t) => [cssName(t.path), baseOf.get(cssName(t.path))]);
const DISPLAY_ROLES = /^md\.sys\.typescale\.(display|headline)-|^md\.sys\.typescale\.title-large\./;
css += block(W('[data-theme]:not(:root), [data-gray]:not(:root), [data-accent]:not(:root)'), pick((t) => isAlias(t) && t.type === 'color' && !glassAliases.includes(t)));
css += block(W('[data-gray]:not(:root), [data-accent]:not(:root)'), pick((t) => glassAliases.includes(t)));
css += block(W('[data-corners]:not(:root)'), pick((t) => isAlias(t) && pathIs(/^(md\.sys|s4)\.shape\./)(t)));
css += block(W('[data-corners="round"]:not(:root)'), pick((t) => !isAlias(t) && pathIs(/^(md\.sys|s4)\.shape\./)(t)));
css += block(W('[data-type-display]:not(:root), [data-type-text]:not(:root)'), pick((t) => isAlias(t) && t.type === 'fontFamily'));
css += block(W('[data-type-display="inter"]:not(:root)'), pick((t) => pathIs(/^md\.ref\.typeface\.brand$/)(t) || (pathIs(DISPLAY_ROLES)(t) && t.path.at(-1) === 'tracking')));
css += block(W('[data-type-text="inter"]:not(:root)'), pick((t) => pathIs(/^md\.ref\.typeface\.plain$/)(t) || (pathIs(/^md\.sys\.typescale\./)(t) && !pathIs(DISPLAY_ROLES)(t) && t.path.at(-1) === 'tracking')));
/* contrast is page-wide: it reaches every scoped light or dark element */
css += media('(prefers-contrast: more)', block(W(`${HC_AUTO}, ${HC_AUTO} [data-theme="light"]`), byMode['high-contrast']));
css += block(W(`${HC_ON}, ${HC_ON} [data-theme="light"]`), byMode['high-contrast']);
css += media('(prefers-contrast: more)', block(W(`${HC_AUTO} [data-theme="light"]`), literal('high-contrast')));
css += block(W(`${HC_ON} [data-theme="light"]`), literal('high-contrast'));
const dhc = byMode['dark-high-contrast'];
css += media('screen and (prefers-color-scheme: dark) and (prefers-contrast: more)', block(W(`${DARK_AUTO}${HC_AUTO.slice(5)}`), dhc));
css += media('screen and (prefers-color-scheme: dark)', block(W(`${DARK_AUTO}[data-contrast="high"]`), dhc));
css += media('screen and (prefers-contrast: more)', block(W(`:root[data-theme="dark"]${HC_AUTO.slice(5)}, ${HC_AUTO} [data-theme="dark"]`), dhc));
css += media('screen', block(W(`:root[data-theme="dark"][data-contrast="high"], ${HC_ON} [data-theme="dark"]`), dhc));
css += media('screen and (prefers-contrast: more)', block(W(`${HC_AUTO} [data-theme="dark"]`), literal('dark-high-contrast')));
css += media('screen', block(W(`${HC_ON} [data-theme="dark"]`), literal('dark-high-contrast')));
/* reduced motion and reduced transparency are page-wide too: they win inside any element that re-declares their tokens */
const RM = ':root, [data-theme]', RT = ':root, [data-theme]';
css += media('(prefers-reduced-motion: reduce)', block(W(RM), byMode['reduced-motion']));
css += block(W(RM.split(', ').map((s) => s === ':root' ? ':root[data-motion="reduced"]' : `:root[data-motion="reduced"] ${s}`).join(', ')), byMode['reduced-motion']);
const rt = byMode['reduced-transparency'];
css += media('(prefers-reduced-transparency: reduce)', block(W(RT), rt));
css += block(W(':root[data-glass="off"], :root[data-glass="off"] [data-theme]'), rt);
css += `  @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {\n${block(W(RT), rt).replace(/^/gm, '  ')}  }\n`;
css += '}\n';

/* ---------- write TS and JSON ---------- */
const ts = `/* S4 Orion tokens ${pkg.version}. GENERATED by scripts/build-tokens.mjs. Do not edit. */
export const version = ${JSON.stringify(pkg.version)};
export const tokens = ${JSON.stringify(json, null, 2)} as const;
export type TokenName = keyof typeof tokens;
export type Mode = ${MODES.map((m) => JSON.stringify(m)).join(' | ')};
/** CSS reference for a token, e.g. cssVar('--md-sys-color-primary') -> 'var(--md-sys-color-primary)'. */
export const cssVar = (name: TokenName): string => \`var(\${name})\`;
`;
/* ---------- the scale dial (decision 0066): type and spacing step together, like Radix Themes' scaling ----------
   data-scale="compact | large" on <html> or any element (S4.theme({ scale })). Generated here from the token values, so it
   can never drift: every type size, line height and tracking, every spacing step and the site's fluid type and section
   rhythm are multiplied; tokens that alias one of those are declared again in the scope so they follow it (a value
   written on :root would not). Control heights and touch targets are density's job and never change here. */
const SCALES = { compact: { type: 0.92, space: 0.875, floor: 11 }, large: { type: 1.08, space: 1.125 } };
const scaleCss = (() => {
  const isType = (n) => /^--md-sys-typescale-.*-(size|line-height|tracking)$/.test(n);
  const isSpace = (n) => /^--s4-space-(1|2|3|4|5|6|8|10|12|16)$/.test(n);
  const isSite = (n) => /^--s4-site-(hero|title|lead)-(size|line-height)$|^--s4-site-(section-space|head-space)(-roomy|-wide)?$/.test(n);
  const px = (v) => { const m = /^(-?[\d.]+)px$/.exec(v); return m ? +m[1] : null; };
  const round = (x, step) => Math.round(x / step) * step;
  const blocks = [];
  for (const [name, f] of Object.entries(SCALES)) {
    const lines = [], scaled = new Set();
    for (const [n, e] of Object.entries(json)) {
      if (e.modes || typeof e.value !== 'string') continue;
      const v = e.value, p = px(v);
      if (isType(n) && p != null) {
        let x = /-tracking$/.test(n) ? round(p * f.type, 0.05) : /-size$/.test(n) ? round(p * f.type, 0.5) : Math.round(p * f.type);
        if (f.floor && /-size$/.test(n)) x = Math.max(x, Math.min(p, f.floor));
        lines.push(`    ${n}: ${+x.toFixed(2)}px;`); scaled.add(n);
      } else if (isSpace(n) && p != null) { lines.push(`    ${n}: ${round(p * f.space, 2)}px;`); scaled.add(n); }   /* on the 2px grid */
      else if (isSite(n) && !/var\(/.test(v)) { lines.push(`    ${n}: calc(${v} * ${/size|line/.test(n) ? f.type : f.space});`); scaled.add(n); }
    }
    /* aliases of a scaled token, declared again so they resolve inside the scope (to a fixed point) */
    for (let grew = true; grew;) {
      grew = false;
      for (const [n, e] of Object.entries(json)) {
        if (scaled.has(n) || e.modes || typeof e.value !== 'string') continue;
        const refs = [...e.value.matchAll(/var\((--[\w-]+)\)/g)].map((m) => m[1]);
        if (refs.some((r) => scaled.has(r))) { lines.push(`    ${n}: ${e.value};`); scaled.add(n); grew = true; }
      }
    }
    blocks.push(`  :where([data-scale="${name}"]) {\n${lines.join('\n')}\n    font-size: var(--md-sys-typescale-body-large-size);\n    line-height: var(--md-sys-typescale-body-large-line-height);\n  }`);
  }
  return `/* Scale dial (decision 0066). GENERATED by scripts/build-tokens.mjs from the tokens: do not edit.
   compact: type x${SCALES.compact.type} (never under ${SCALES.compact.floor}px), spacing x${SCALES.compact.space}; large: type x${SCALES.large.type}, spacing x${SCALES.large.space}.
   Loaded before density.css, so compact density still maps its sizes onto the scaled ones. */
@layer s4.tokens {
${blocks.join('\n')}
}
`;
})();
const out = { 'components/base/scale.css': scaleCss, 'tokens/tokens.css': css, 'tokens/tokens.ts': ts, 'tokens/tokens.json': JSON.stringify({ version: pkg.version, tokens: json }, null, 2) + '\n' };

if (errors.length) { console.error(errors.map((e) => '  x ' + e).join('\n')); console.error(`\n${errors.length} problem(s); nothing written.`); process.exit(1); }
if (CHECK) {
  const stale = Object.entries(out).filter(([f, c]) => !existsSync(join(root, f)) || readFileSync(join(root, f), 'utf8') !== c).map(([f]) => f);
  if (stale.length) { console.error(`Stale generated files (run npm run build:tokens): ${stale.join(', ')}`); process.exit(1); }
  console.log(`Tokens up to date: ${tokens.size} tokens + ${springs.length} spring easings. Contrast: ${contrastReport.join('; ')}.`);
} else {
  for (const [f, c] of Object.entries(out)) writeFileSync(join(root, f), c);
  console.log(`Built ${tokens.size} tokens + ${springs.length} spring easings from ${files.length} files -> tokens.css, tokens.ts, tokens.json`);
  console.log(`Contrast: ${contrastReport.join('; ')}`);
}
