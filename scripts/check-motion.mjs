#!/usr/bin/env node
/* One motion philosophy (decision 0046): every transition and animation in S4 Orion names one of the motion patterns.
   This check rejects anything off-pattern:
     CSS  - a transition or animation may only take its timing from a pattern token (--s4-motion-<pattern>), and only
            for the properties that pattern is for; `all`, raw durations, easings and spring tokens are refused;
          - a repeating animation is the Loop pattern: a --s4-*-cycle duration, switched off under reduced motion;
          - @keyframes may only change what their pattern allows.
     JS   - components never call element.animate(), pick a spring or write a transition by hand: they call
            S4.transition.<pattern>() (only core.js and motion.js may animate).
     Docs - every pattern token is described in docs/foundations/motion.md and used somewhere.
   Covers components/, demo/, templates/, the hub and the review lab kit (the tokens page plays raw springs on purpose). No dependencies. */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const COLOR = ['background-color', 'color', 'opacity', 'box-shadow', 'border-color', 'outline-color', 'fill', 'stroke'];
const PLACE = ['transform', 'translate', 'scale', 'rotate', 'left', 'top', 'inset-inline-start', 'width', 'height', 'inline-size', 'block-size'];
export const PATTERNS = {
  state: COLOR,
  ink: PLACE,
  'ink-calm': PLACE.concat('stroke-dasharray', 'stroke-dashoffset'),
  morph: ['border-radius', 'padding', 'margin', 'width', 'inline-size', 'max-width', 'transform', 'gap'],
  'morph-calm': ['inline-size', 'width', 'transform', 'grid-template-columns'],
  bend: ['transform', 'rotate'],
  'reveal-content': ['opacity', 'transform'],
};
const LOOP_EASING = ['linear', 'ease-in-out', 'var(--s4-motion-loop)'];
const problems = [];
const bad = (file, line, msg) => problems.push(`${file}:${line}  ${msg}`);
const lineOf = (text, i) => text.slice(0, i).split('\n').length;
const strip = (css) => css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
const used = new Set();

function checkCss(file, raw, offset = 0) {
  const css = strip(raw);
  const at = (i) => lineOf(css, i) + offset;
  for (const m of css.matchAll(/(?<![\w-])(transition|animation)(-[a-z-]+)?\s*:\s*([^;{}]+)/g)) {
    const [, kind, long, valueRaw] = m, value = valueRaw.trim().replace(/\s+/g, ' ');
    if (long) {
      if (long === '-timing-function' && kind === 'animation' && LOOP_EASING.includes(value)) continue;   /* inside a loop's keyframes */
      if (/^-(name|play-state|fill-mode|delay|behavior|property)$/.test(long) && !/\d(ms|s)\b/.test(value.replace(/var\([^)]*\)/g, ''))) continue;
      bad(file, at(m.index), `${kind}${long}: set the whole ${kind} with a pattern token instead (${value})`); continue;
    }
    if (value === 'none' || value === 'inherit') continue;
    if (kind === 'transition') {
      for (const part of value.split(/,(?![^(]*\))/).map((x) => x.trim())) {
        const mm = part.match(/^([a-z-]+) var\(--s4-motion-([a-z-]+)\)$/);
        if (!mm) { bad(file, at(m.index), `transition "${part}" is off-pattern: write "<property> var(--s4-motion-<pattern>)"`); continue; }
        const [, prop, pat] = mm;
        if (!PATTERNS[pat]) { bad(file, at(m.index), `unknown motion pattern "${pat}"`); continue; }
        used.add(pat);
        if (!PATTERNS[pat].includes(prop)) bad(file, at(m.index), `"${prop}" does not belong to the ${pat} pattern (${PATTERNS[pat].join(', ')})`);
      }
    } else {
      const loop = /\binfinite\b/.test(value);
      if (loop) {
        used.add('loop');
        const rest = value.replace(/\binfinite\b/, '').trim().split(' ');
        const dur = rest.find((x) => /^var\(--s4-[a-z-]*(cycle|spin)\)$/.test(x));
        const ease = rest.filter((x) => x !== dur).slice(1).join(' ');
        if (!dur) bad(file, at(m.index), `a repeating animation is a Loop: its duration must be a --s4-*-cycle token (${value})`);
        if (!LOOP_EASING.includes(ease)) bad(file, at(m.index), `Loop easing must be one of ${LOOP_EASING.join(', ')} (${value})`);
      } else {
        const mm = value.match(/^([\w-]+) var\(--s4-motion-([a-z-]+)\)( (both|backwards|forwards))?$/);
        if (!mm || !PATTERNS[mm[2]]) bad(file, at(m.index), `animation "${value}" is off-pattern: write "<name> var(--s4-motion-<pattern>)"`);
        else used.add(mm[2]);
      }
    }
  }
  for (const m of css.matchAll(/var\(--(md-sys|s4)-motion-spring-[a-z-]+\)/g)) bad(file, at(m.index), `${m[0]}: components use pattern tokens (--s4-motion-<pattern>), not springs`);
  for (const m of css.matchAll(/\bcubic-bezier\(|\bsteps\(/g)) bad(file, at(m.index), `${m[0]}…): no hand-made easings`);
}
function checkJs(file, raw, offset = 0) {
  const js = raw.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/(^|[^:'"])\/\/[^\n]*/g, '$1');
  const rules = [
    [/\.animate\(/g, 'animate() by hand: call S4.transition.<pattern>() instead'],
    [/S4\.motion\.spring\(/g, 'picking a spring by hand: call S4.transition.<pattern>() instead'],
    [/\.style\.(transition|animation)\w*\s*=(?!\s*['"](none)?['"])/g, 'a transition written in script: use a pattern token in the stylesheet'],
    [/requestAnimationFrame\([^)]*\)[^\n]*(opacity|transform)/g, 'hand-rolled animation frame motion'],
  ];
  for (const [re, msg] of rules) for (const m of js.matchAll(re)) bad(file, lineOf(js, m.index) + offset, msg);
}
function checkHtml(file, html) {
  for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) checkCss(file, m[1], lineOf(html, m.index) - 1);
  for (const m of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) checkJs(file, m[1], lineOf(html, m.index) - 1);
  for (const m of html.matchAll(/style="[^"]*(transition|animation)[^"]*"/g)) checkCss(file, m[0].slice(7, -1), lineOf(html, m.index) - 1);
}

const ENGINE = ['components/core/core.js', 'components/motion/motion.js'];
const GENERATED = /(^|\/)(orion(\.min)?\.(css|js)|icons(-[\w-]+)?\.js|m3color\.js|tokens\.css)$/;   /* generated copies of sources this check reads */
function walk(dir, out = []) {
  if (!existsSync(join(root, dir))) return out;
  for (const f of readdirSync(join(root, dir))) {
    const rel = dir + '/' + f;
    if (statSync(join(root, rel)).isDirectory()) walk(rel, out); else out.push(rel);
  }
  return out;
}
/* explore/ holds old review labs (history, not the system); the lab kit that new labs share is checked */
const KIT = ['explore/lib/review.css', 'explore/lib/review.js', 'explore/lib/scrub.js', 'explore/lib/phone-review.js'].filter((f) => existsSync(join(root, f)));
const files = ['index.html'].concat(walk('components'), walk('demo'), walk('templates'), KIT)
  .filter((f) => !GENERATED.test(f) && !ENGINE.includes(f) && f !== 'components/motion/motion.css');
let n = 0;
for (const f of files) {
  const t = () => readFileSync(join(root, f), 'utf8');
  if (f.endsWith('.css')) { checkCss(f, t()); n++; } else if (f.endsWith('.js')) { checkJs(f, t()); n++; } else if (f.endsWith('.html')) { checkHtml(f, t()); n++; }
}
/* the pattern tokens, the checker's list and the motion page must agree */
const tokenCss = readFileSync(join(root, 'components/motion/motion.css'), 'utf8');
const defined = [...tokenCss.matchAll(/^\s*--s4-motion-([a-z-]+):/gm)].map((m) => m[1]);
const doc = readFileSync(join(root, 'docs/foundations/motion.md'), 'utf8');
for (const p of defined) {
  if (p !== 'loop' && !PATTERNS[p]) bad('components/motion/motion.css', 1, `--s4-motion-${p} is not in the checker's pattern list`);
  if (!doc.includes('--s4-motion-' + p)) bad('docs/foundations/motion.md', 1, `--s4-motion-${p} is not described`);
  if (!used.has(p)) bad('components/motion/motion.css', 1, `--s4-motion-${p} is not used by any component: remove it or use it`);
}
for (const p of Object.keys(PATTERNS)) if (!defined.includes(p)) bad('scripts/check-motion.mjs', 1, `pattern ${p} has no token in components/motion/motion.css`);
const api = readFileSync(join(root, 'components/motion/motion.js'), 'utf8');
for (const fn of ['reveal', 'follow', 'pop', 'scrim', 'rise', 'tip', 'sharedAxis', 'enter', 'move', 'fade']) {
  if (!new RegExp('\\b' + fn + ':').test(api)) bad('components/motion/motion.js', 1, `S4.transition.${fn} is missing`);
  if (!doc.includes('S4.transition.' + fn)) bad('docs/foundations/motion.md', 1, `S4.transition.${fn} is not described`);
}

/* Motion energy (data-energy, S4.theme({ energy })): the same patterns with other amounts, never a new pattern.
   - motion.css energy blocks re-declare only Ink, Morph and Bend, and only with springs of their own energy;
   - calm springs never overshoot, lively ones overshoot a little (at most 7%), and every one is 0ms under reduced motion;
   - in motion.js lively touches only Pop and Rise. */
const T = JSON.parse(readFileSync(join(root, 'tokens/tokens.json'), 'utf8')).tokens;
const overshoot = (name) => { const m = (T[name]?.description || '').match(/overshoot ([\d.]+)%/); return m ? +m[1] : null; };
let energySprings = 0;
for (const m of tokenCss.matchAll(/:where\(\[data-energy="(\w+)"\][^)]*\)\s*\{([^}]*)\}/g)) {
  const [, level, body] = m;
  for (const d of body.matchAll(/--s4-motion-([a-z-]+):\s*var\((--[\w-]+)-duration\) var\((--[\w-]+)\)/g)) {
    const [, pat, durOf, spring] = d;
    if (!['ink', 'morph', 'bend'].includes(pat)) bad('components/motion/motion.css', 1, `energy ${level} may not change --s4-motion-${pat} (only ink, morph, bend)`);
    if (durOf !== spring) bad('components/motion/motion.css', 1, `energy ${level}: --s4-motion-${pat} mixes ${durOf} with ${spring}`);
    const o = overshoot(spring);
    if (o === null) { bad('components/motion/motion.css', 1, `energy ${level}: ${spring} is not a spring token`); continue; }
    energySprings++;
    if (level === 'calm' && (o > 0 || !/-calm$/.test(spring))) bad('components/motion/motion.css', 1, `energy calm: ${spring} must be a -calm spring with no overshoot (${o}%)`);
    if (level === 'lively' && (!/-lively$/.test(spring) || o > 7)) bad('components/motion/motion.css', 1, `energy lively: ${spring} must be a -lively spring with at most 7% overshoot (${o}%)`);
  }
}
for (const [name, t] of Object.entries(T)) {
  if (!/^--s4-motion-spring-[a-z-]+-(calm|lively)-duration$/.test(name)) continue;
  if (t.modes?.['reduced-motion'] !== '0ms') bad('tokens/src/motion.tokens.json', 1, `${name} must be 0ms under reduced motion`);
  const o = overshoot(name.replace(/-duration$/, ''));
  if (/-calm-/.test(name) && o > 0) bad('tokens/src/motion.tokens.json', 1, `${name.replace(/-duration$/, '')} is calm but overshoots ${o}%`);
  if (/-lively-/.test(name) && o > 7) bad('tokens/src/motion.tokens.json', 1, `${name.replace(/-duration$/, '')} overshoots ${o}% (7% at most)`);
}
const table = api.match(/var ENERGY = \{([\s\S]*?)\n  \};/);
if (!table) bad('components/motion/motion.js', 1, 'the ENERGY table is missing');
else {
  const lively = table[1].match(/lively:[^\n]*spring: \{([^}]*)\}/);
  for (const k of [...(lively ? lively[1] : '').matchAll(/(\w+):/g)].map((x) => x[1])) if (!['spatial', 'rise'].includes(k)) bad('components/motion/motion.js', 1, `lively energy may only change Pop and Rise springs, not ${k}`);
  for (const sp of [...table[1].matchAll(/'([a-z-]+)'/g)].map((x) => x[1])) if (!/^(tip|rise|spatial)$/.test(sp) && overshoot(SPRING(sp)) === null) bad('components/motion/motion.js', 1, `energy spring ${sp} is not a token`);
}
function SPRING(n) { return /-calm$|-lively$|^(ink|rise|settle|tip|reveal|bend)$/.test(n) ? '--s4-motion-spring-' + n : '--md-sys-motion-spring-' + n; }

if (problems.length) { console.error('Motion check failed:\n' + problems.map((p) => '  x ' + p).join('\n')); process.exit(1); }
console.log(`Motion on pattern: ${n} files, ${new Set(defined).size} pattern tokens (${[...new Set(defined)].join(', ')}), every transition and animation named; energy: ${energySprings} remapped pattern springs within bounds.`);
