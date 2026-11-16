#!/usr/bin/env node
/* Prove themes on any container (issue 52). The token build proves 83 contrast pairs for the page in light, dark, high
   contrast and dark high contrast. This check proves that a scoped element gets exactly those values, token for token,
   so every proven pair holds inside it too:
     - it reads tokens/tokens.css, runs a small cascade over its blocks (source order, :where so no specificity) for a
       chain of elements (root > … > element), with the device settings as media queries, and inherits custom
       properties down the chain;
     - for each scenario (a dark container on a light page, a light one on a dark page, three deep, each with high
       contrast from the device or from data-contrast, and with reduced transparency) the scoped element must equal
       the page-wide mode it asks for;
     - the scoped gray temperatures (gray.css, light-dark()) must equal the page-wide warm and cool values.
   Usage: node scripts/check-scopes.mjs */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(root, 'tokens/tokens.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

/* ---------- parse: blocks with their media conditions ---------- */
const rules = [];
{
  const stack = [];
  for (const raw of css.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (line.endsWith('{')) {
      const head = line.slice(0, -1).trim();
      if (head.startsWith('@media')) stack.push({ media: head.slice(6).trim() });
      else if (head.startsWith('@supports')) stack.push({ supports: true });
      else if (head.startsWith('@layer')) stack.push({ layer: true });
      else { const r = { sel: head, media: stack.filter((s) => s.media).map((s) => s.media), supports: stack.some((s) => s.supports), decls: [] }; rules.push(r); stack.push({ rule: r }); }
    } else if (line === '}') stack.pop();
    else { const top = stack[stack.length - 1]; const m = line.match(/^([-\w]+):\s*(.*);$/); if (top?.rule && m) top.rule.decls.push([m[1], m[2]]); }
  }
}

/* ---------- media ---------- */
function mediaOk(q, env) {
  return q.split(/\s+and\s+/).every((part) => {
    const neg = part.startsWith('not ');
    const f = part.replace(/^not\s+/, '').trim();
    const v = f === 'screen' ? !env.print : f === 'print' ? env.print
      : f === '(prefers-color-scheme: dark)' ? env.dark : f === '(prefers-contrast: more)' ? env.more
      : f === '(prefers-reduced-motion: reduce)' ? env.motion : f === '(prefers-reduced-transparency: reduce)' ? env.transparency
      : (() => { throw new Error('check-scopes: unknown media feature ' + f); })();
    return neg ? !v : v;
  });
}

/* ---------- selectors: :where( list ) of complex selectors made of compounds with :root, [a], [a="v"], :not(…) ---------- */
function splitTop(s, sep) {
  const out = []; let depth = 0, cur = '';
  for (const ch of s) {
    if (ch === '(' || ch === '[') depth++;
    if (ch === ')' || ch === ']') depth--;
    if (depth === 0 && (sep === ' ' ? /\s/.test(ch) : ch === sep)) { if (cur.trim()) out.push(cur.trim()); cur = ''; } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
function compoundOk(c, el) {
  let rest = c;
  while (rest) {
    let m;
    if ((m = rest.match(/^:root/))) { if (!el.isRoot) return false; }
    else if ((m = rest.match(/^:not\(((?:[^()]|\([^()]*\))*)\)/))) { if (splitTop(m[1], ',').some((x) => compoundOk(x, el))) return false; }
    else if ((m = rest.match(/^\[([-\w]+)(?:="([^"]*)")?\]/))) { const v = el.attrs[m[1]]; if (v === undefined || (m[2] !== undefined && v !== m[2])) return false; }
    else throw new Error('check-scopes: cannot read selector part ' + rest);
    rest = rest.slice(m[0].length);
  }
  return true;
}
function complexOk(sel, chain) {   /* chain: [root, …, element]; descendant combinators only */
  const parts = splitTop(sel, ' ');
  if (!compoundOk(parts[parts.length - 1], chain[chain.length - 1])) return false;
  let i = chain.length - 2;
  for (let p = parts.length - 2; p >= 0; p--) { while (i >= 0 && !compoundOk(parts[p], chain[i])) i--; if (i < 0) return false; i--; }
  return true;
}
function matches(sel, chain) {
  const inner = sel.match(/^:where\((.*)\)$/)[1];
  return splitTop(inner, ',').some((s) => complexOk(s, chain));
}

/* ---------- cascade with inheritance ---------- */
function compute(chainAttrs, env) {
  let inherited = {};
  const chain = chainAttrs.map((attrs, i) => ({ attrs, isRoot: i === 0 }));
  for (let i = 0; i < chain.length; i++) {
    const own = { ...inherited };
    for (const r of rules) {
      if (r.supports) continue;   /* backdrop-filter is supported in the browsers Orion targets */
      if (!r.media.every((q) => mediaOk(q, env))) continue;
      if (!matches(r.sel, chain.slice(0, i + 1))) continue;
      for (const [n, v] of r.decls) own[n] = v;
    }
    inherited = own;
  }
  return inherited;
}

/* ---------- scenarios ---------- */
const ENV = { dark: false, more: false, motion: false, transparency: false, print: false };
const env = (o) => ({ ...ENV, ...o });
const page = (rootAttrs, e) => compute([rootAttrs], e);
let failures = 0, compared = 0, scenarios = 0;
/* an alias and the plain value it stands for are the same value (scoped glass tints are written plainly) */
function deref(map, v, n = 0) { const m = v && v.match(/^var\((--[\w-]+)\)$/); return m && n < 9 ? deref(map, map[m[1]], n + 1) : v; }
function same(name, got, want) {
  scenarios++;
  for (const k of Object.keys(want)) {
    if (!k.startsWith('--') && k !== 'color-scheme') continue;
    compared++;
    if (deref(got, got[k]) !== deref(want, want[k])) { failures++; if (failures < 25) console.error(`  x ${name}: ${k} is ${got[k]}, page-wide it is ${want[k]}`); }
  }
}
const D = { 'data-theme': 'dark' }, L = { 'data-theme': 'light' };
for (const [label, rootExtra, e] of [
  ['', {}, env({})],
  ['device high contrast, ', {}, env({ more: true })],
  ['data-contrast=high, ', { 'data-contrast': 'high' }, env({})],
  ['reduced transparency, ', {}, env({ transparency: true })],
  ['data-glass=off, ', { 'data-glass': 'off' }, env({})],
  ['reduced motion, ', { 'data-motion': 'reduced' }, env({})],
]) {
  const wantDark = page({ ...rootExtra, ...D }, e), wantLight = page({ ...rootExtra, ...L }, e);
  same(label + 'dark container on a light page', compute([{ ...rootExtra }, {}, D], e), wantDark);
  same(label + 'dark container on a data-theme=light page', compute([{ ...rootExtra, ...L }, D], e), wantDark);
  same(label + 'light container on a device-dark page', compute([{ ...rootExtra }, L], { ...e, dark: true }), wantLight);
  same(label + 'light container on a data-theme=dark page', compute([{ ...rootExtra, ...D }, {}, L], e), wantLight);
  same(label + 'light > dark > light > dark, innermost', compute([{ ...rootExtra, ...L }, D, L, D], e), wantDark);
  same(label + 'dark > light > dark > light, innermost', compute([{ ...rootExtra, ...D }, L, D, L], e), wantLight);
  same(label + 'device dark: dark > light > dark, innermost', compute([{ ...rootExtra }, L, D], { ...e, dark: true }), page({ ...rootExtra }, { ...e, dark: true }));
}

/* print is light (reach, round 0056): a dark page or a dark container prints with the light values, also on a dark device */
const printLight = page({}, env({ print: true }));
same('print: data-theme=dark page', page(D, env({ print: true, dark: true })), printLight);
same('print: dark container on a light page', compute([{}, {}, D], env({ print: true })), printLight);
same('print: device dark, light > dark > light > dark', compute([{}, L, D, L, D], env({ print: true, dark: true })), printLight);

/* ---------- scoped gray temperatures equal the page-wide ones ---------- */
const gray = readFileSync(join(root, 'components/base/gray.css'), 'utf8');
const block = (open) => { const i = gray.indexOf(open); return Object.fromEntries([...gray.slice(i + open.length, gray.indexOf('}', i)).matchAll(/(--[-\w]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()])); };
let grayPairs = 0;
const pureL = page({}, env({})), pureD = page(D, env({}));
for (const t of ['warm', 'cool', 'pure']) {
  const scopedOpen = `@scope ([data-gray="${t}"]) {`;
  const i = gray.indexOf(scopedOpen);
  if (i < 0) { failures++; console.error(`  x gray.css has no scoped ${t} block`); continue; }
  const body = gray.slice(gray.indexOf('{', i + scopedOpen.length) + 1, gray.indexOf('}', i + scopedOpen.length));
  const rootL = t === 'pure' ? {} : block(`:where(:root[data-gray="${t}"]:not([data-contrast="high"])) {`);
  const rootD = t === 'pure' ? {} : block(`:where(:root[data-gray="${t}"]:not([data-contrast="high"])[data-theme="dark"]) {`);
  for (const m of body.matchAll(/(--[-\w]+):\s*light-dark\((#[0-9a-f]{6}),\s*(#[0-9a-f]{6})\);/g)) {
    grayPairs++;
    const look = (rootM, pureM, name, k = 0) => { const v = rootM[name] || pureM[name]; const r = v && v.match(/^var\((--[\w-]+)\)$/); return r && k < 9 ? look(rootM, pureM, r[1], k + 1) : v; };
    const [, n, l, d] = m, wl = look(rootL, pureL, n), wd = look(rootD, pureD, n);
    if (l !== wl || d !== wd) { failures++; console.error(`  x scoped gray ${t}: ${n} is light-dark(${l}, ${d}), page-wide ${wl} / ${wd}`); }
  }
}

if (failures) { console.error(`${failures} scoped value(s) differ from the page-wide mode.`); process.exit(1); }
console.log(`Scopes: ${scenarios} scoped scenarios (dark in light, light in dark, three deep; with high contrast, reduced transparency and reduced motion) match the page-wide modes token for token (${compared} values), dark scopes print light, so the 83 proven pairs hold in every scope; scoped gray: ${grayPairs} light-dark() values match the page-wide warm, cool and pure grays.`);
