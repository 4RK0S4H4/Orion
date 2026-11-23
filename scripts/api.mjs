#!/usr/bin/env node
/* Orion's public API, read off a source tree (decision 0075).
   snapshot(read, list) -> { version, skill, classes, tokens, attrs, values, api, events, icons, files, packs }, where
   read(path) returns a file's text (or null) and list(dir) its entries, so the same code reads the working tree, a git
   tag (git show) or a release. "Public" is what docs/framework.md calls public: an s4- class a component README names
   and the stylesheet defines, every --s4-/--md- token in tokens.css and the public knobs, a data- attribute a README
   names and the code reads, the values of those attributes the stylesheet styles plus every dial value
   (S4.theme.dials), an S4.* function the docs name and the runtime defines, the events, icon names, the files the
   skill ships and the pack names.
   present(read, list) is the looser set of names the code still answers to (documented or not, aliases included):
   scripts/check-api.mjs fails a name in the last released snapshot that is not present and has no migration entry.
   Run: node scripts/api.mjs [--ref <git-ref>] prints a snapshot as JSON. No dependencies. */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

export const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const KINDS = ['classes', 'tokens', 'attrs', 'values', 'api', 'events', 'icons', 'files', 'packs', 'skill'];
/* the migration entry kind that covers each snapshot list */
export const KIND_OF = { classes: 'class', tokens: 'token', attrs: 'attr', values: 'value', api: 'api', events: 'event', icons: 'icon', files: 'file', packs: 'pack', skill: 'skill' };

export const treeReader = (dir = root) => ({
  read: (p) => (existsSync(join(dir, p)) ? readFileSync(join(dir, p), 'utf8') : null),
  list: (d) => (existsSync(join(dir, d)) && statSync(join(dir, d)).isDirectory() ? readdirSync(join(dir, d)) : []),
});
export const gitReader = (ref, dir = root) => {
  const files = execFileSync('git', ['ls-tree', '-r', '--name-only', ref], { cwd: dir, encoding: 'utf8', maxBuffer: 1 << 26 }).split('\n').filter(Boolean);
  return {
    read: (p) => (files.includes(p) ? execFileSync('git', ['show', `${ref}:${p}`], { cwd: dir, encoding: 'utf8', maxBuffer: 1 << 28 }) : null),
    list: (d) => [...new Set(files.filter((f) => f.startsWith(d + '/')).map((f) => f.slice(d.length + 1).split('/')[0]))],
  };
};

const uniq = (a) => [...new Set(a)].sort();
const words = (t, re) => [...(t || '').matchAll(re)].map((m) => m[1]);

function sources({ read, list }) {
  const skill = list('skill').filter((d) => list(`skill/${d}`).includes('SKILL.md'))[0] || null;
  const css = read('components/orion.css') || '', js = read('components/orion.js') || '';
  const readmes = list('components').map((d) => read(`components/${d}/README.md`) || '').join('\n');
  const framework = read('docs/framework.md') || '';
  return { skill, css, js, readmes, framework, tokens: read('tokens/tokens.css') || '', icons: read('components/icons/names.json'), packs: read('components/packs.json'),
    assets: skill ? list(`skill/${skill}/assets`).filter((f) => !f.startsWith('.')) : [], core: read('components/core/core.js') || '' };
}

/* the dial lists, evaluated from core.js's own literal (S4.theme.dials), so a dial value is public the day it is listed */
function dials(core) {
  const m = core.match(/var DIALS = (\{[\s\S]*?\n\s*\});/);
  if (!m) return {};
  const faces = (core.match(/var FACES = (\[[^\]]*\])/) || [])[1] || '[]';
  try { return vm.runInNewContext(`var FACES = ${faces}; (${m[1]})`, {}); } catch (e) { return {}; }
}
const cssClasses = (css) => uniq(words(css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/url\([^)]*\)|"[^"]*"|'[^']*'/g, ''), /\.(s4-[a-z0-9-]+)/g));
const cssValues = (css) => uniq(words(css, /\[(data-[a-z0-9-]+="[^"]*")\]/g).map((p) => p.replace('="', '=').slice(0, -1)));
const kebab = (s) => s.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());

/* S4.a, S4.a.b and S4.a.b/c/d as the docs write them */
function docNames(text) {
  const out = [];
  for (const m of (text || '').matchAll(/\bS4\.([a-zA-Z]+)(?:\.([a-zA-Z][a-zA-Z/]*))?/g)) {
    if (!m[2]) out.push(m[1]); else for (const b of m[2].split('/')) if (b) out.push(m[1] + '.' + b);
  }
  return uniq(out);
}
function defines(js, name) {
  const [a, b] = name.split('.');
  const top = new RegExp(`\\bS4\\.${a}\\s*=[^=]|\\bS4\\s*=\\s*window\\.S4\\s*=\\s*\\{[^}]*\\b${a}\\s*:`).test(js);
  if (!b) return top || (a === 'version' && /version:\s*'/.test(js));
  if (!top) return false;
  return new RegExp(`\\bS4\\.${a}\\.${b}\\s*=[^=]|[{,\\s]${b}\\s*:\\s*[\\w(]|\\bfunction ${b}\\b`).test(js);
}

export function snapshot(reader) {
  const s = sources(reader);
  const D = dials(s.core);
  const docClasses = new Set(words(s.readmes, /\b(s4-[a-z0-9-]+)\b/g));
  const classes = cssClasses(s.css).filter((c) => docClasses.has(c));
  const knobs = words((s.framework.match(/\*\*Public knobs\*\*:[^\n]*(?:\n {2}[^\n]*)*/) || [''])[0], /`(--s4-[a-z0-9-]+)`/g);
  const tokens = uniq(words(s.tokens, /(--(?:s4|md)-[a-z0-9-]+)\s*:/g).concat(knobs));
  const codeAttrs = new Set(words(s.css + s.js, /\b(data-[a-z0-9-]+)/g).concat(words(s.js, /\bdataset\.([a-zA-Z]+)/g).map((x) => 'data-' + kebab(x))));
  const attrs = uniq(words(s.readmes + s.framework, /\b(data-[a-z0-9-]+)/g).filter((a) => codeAttrs.has(a)).concat(Object.keys(D)));
  const attrSet = new Set(attrs);
  const values = uniq(cssValues(s.css).filter((p) => attrSet.has(p.split('=')[0])).concat(Object.entries(D).flatMap(([a, vs]) => vs.map((v) => `${a}=${v}`))));
  const api = docNames(s.readmes + '\n' + s.framework).filter((n) => defines(s.js, n));
  const evLine = (s.framework.match(/\*\*Events\*\*[^\n]*/) || [''])[0];
  const events = uniq(words(evLine, /`(s4-[a-z-]+)`/g).filter((e) => s.js.includes(`'${e}'`) || s.js.includes(`"${e}"`)));
  let icons = [];
  try { const I = JSON.parse(s.icons); icons = Object.keys(I.sets[I.set].names).sort(); } catch (e) { /* none */ }
  let packs = [];
  try { packs = ['core', ...Object.keys(JSON.parse(s.packs).packs)].sort(); } catch (e) { /* before decision 0069 */ }
  const version = ((s.js.match(/^\/\* (?:S4 )?Orion (\d+\.\d+\.\d+) runtime/) || [])[1]) || null;
  return { version, skill: s.skill ? [s.skill] : [], classes, tokens, attrs, values, api, events, icons, files: uniq(s.assets), packs };
}

/* what the code still answers to: every name above without the "documented" filter, aliases and old values included */
export function present(reader) {
  const s = sources(reader), snap = snapshot(reader), D = dials(s.core);
  const jsWords = new Set(words(s.js, /\b(s4-[a-z0-9-]+)\b/g));
  const out = { ...snap };
  out.classes = uniq(cssClasses(s.css).concat([...jsWords]));
  out.tokens = uniq(snap.tokens.concat(words(s.css, /(--(?:s4|md)-[a-z0-9-]+)\s*:/g)));
  out.attrs = uniq(words(s.css + s.js, /\b(data-[a-z0-9-]+)/g).concat(words(s.js, /\bdataset\.([a-zA-Z]+)/g).map((x) => 'data-' + kebab(x))));
  out.values = uniq(cssValues(s.css).concat(Object.entries(D).flatMap(([a, vs]) => vs.map((v) => `${a}=${v}`)), words(s.readmes, /\b(data-[a-z0-9-]+="[^"]*")/g).map((p) => p.replace('="', '=').slice(0, -1))));
  out.api = uniq(docNames(s.js + '\n' + s.readmes + '\n' + s.framework).filter((n) => defines(s.js, n)));
  out.events = uniq(words(s.js, /['"](s4-[a-z-]+)['"]/g));
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const i = process.argv.indexOf('--ref');
  const reader = i > 0 ? gitReader(process.argv[i + 1]) : treeReader();
  console.log(JSON.stringify(process.argv.includes('--present') ? present(reader) : snapshot(reader), null, 1));
}
