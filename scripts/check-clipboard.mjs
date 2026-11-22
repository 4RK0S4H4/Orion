#!/usr/bin/env node
/* One clipboard helper (decision 0073, QA pass 1, issue 74): `S4.util.copy(text, opts)` in components/core/core.js is the
   only code that may call `clipboard.writeText`. A bare call is an uncaught rejection when the browser refuses (headless
   Chromium, an insecure origin, an iframe, Safari without a gesture) and usually shows "Copied" anyway; the helper never
   rejects and says what happened. Scans every shipped source: components (not generated bundles), templates, demo, examples,
   the skill's scripts. Labs in explore/ are not part of the system.
   Usage: node scripts/check-clipboard.mjs [file ...]   (without files: the whole repo; part of npm run check; exit 1 on a hit) */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set(['node_modules', 'out', 'dist', 'explore', 'docs', 'history', '.git', '.claude', 'fixtures']);
const GENERATED = /(^|\/)orion([.-][a-z]+)*(\.min)?\.js$|(^|\/)icons[\w.-]*\.js$|skill\/orion\/(assets|templates)\//;
const HELPER = 'components/core/core.js';
/* a call, with whatever sits between the dots (optional chaining, brackets, a variable that holds the clipboard) */
export const WRITE = /(\bwriteText\s*\(|\[\s*['"]writeText['"]\s*\])/;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { if (!SKIP_DIRS.has(name)) walk(p, out); }
    else if (/\.(js|mjs|html)$/.test(name)) out.push(p);
  }
  return out;
}
export function scan(text, file) {
  const hits = [];
  text.split('\n').forEach((line, i) => { if (WRITE.test(line.replace(/\/\*.*?\*\//g, '').replace(/^\s*\/\/.*$/, ''))) hits.push(`${file}:${i + 1}: ${line.trim().slice(0, 100)}`); });
  return hits;
}

const given = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const files = given.length ? given.map((f) => resolve(f)) : walk(root);
const bad = [];
for (const f of files) {
  const rel = relative(root, f).split('\\').join('/');
  if (!existsSync(f) || (!given.length && (GENERATED.test(rel) || rel === HELPER || rel.startsWith('scripts/') || rel.startsWith('tests/')))) continue;
  const hits = scan(readFileSync(f, 'utf8'), rel);
  /* the helper itself is the one allowed caller, and only the helper */
  if (!given.length || rel !== HELPER) bad.push(...hits);
}
if (bad.length) {
  console.error('Clipboard: call S4.util.copy(text, { done, fail }) instead of clipboard.writeText (decision 0073); it never rejects and says what happened:\n  ' + bad.join('\n  '));
  process.exit(1);
}
console.log(`Clipboard: no direct writeText outside S4.util.copy (${files.length} files scanned).`);
