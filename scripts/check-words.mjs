#!/usr/bin/env node
/* Banned phrases (decision 0065): words that describe how Orion used to look, so the docs, the skill and the component
   pages never drift back to them. Records of the past (docs/decisions, docs/history, the issue log) and the packaged skill are left
   alone; everything a reader or Claude learns from today is checked.
   Usage: node scripts/check-words.mjs   (part of npm run check; exit 1 on a hit) */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
/* phrase -> what is true now */
const BANNED = [
  [/slides? from (the )?edge/i, 'nothing slides in from a screen edge: panels pop (decisions 0043, 0046)'],
  [/outlined buttons?/i, 'nothing is outlined: buttons are filled, tonal or text (decision 0023)'],
  [/thin outline/i, 'fields are filled, never outlined (decisions 0023, 0024)'],
  [/side rim/i, 'the glass edge has no side rim: top and bottom only (decision 0034)'],
  [/outlined (chips?|text fields?|cards?)/i, 'nothing is outlined (decision 0023)'],
  [/drop for menus/i, 'menus fade in place (decision 0042)'],
  [/S4 Orion/, 'the product is called Orion (decision 0071); the s4 prefix is only a technical namespace (s4- classes, --s4- tokens, S4.theme)'],
];
const SKIP_DIRS = new Set(['decisions', 'history', 'issues', 'dist', 'node_modules', 'out', 'img']);

function walk(dir, pick, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { if (!SKIP_DIRS.has(name)) walk(p, pick, out); }
    else if (pick(p)) out.push(p);
  }
  return out;
}
/* where the old product name may still stand (decision 0071): the changelog's past releases, and the skill's description, which names
   "formerly S4 Orion" and keeps the old name as a trigger word so earlier requests still find the skill */
const ORION_OK = (rel, line, lines, i) => (rel === 'CHANGELOG.md' && i >= lines.findIndex((l) => /^## \[1\.1\.0\]/.test(l))) || (rel === 'skill/orion/SKILL.md' && /^description: /.test(line)) || /formerly (named )?S4 Orion/.test(line);
const files = [
  ...walk(join(root, 'docs'), (p) => /\.(md|html)$/.test(p)),
  ...walk(join(root, 'skill'), (p) => /\.(md|mjs|html)$/.test(p)),
].filter((p) => !p.endsWith('check-words.mjs'));
/* the product name is checked in more places than the old-look phrases (labs and templates may show old looks on purpose) */
const nameFiles = [
  ...['README.md', 'CHANGELOG.md', 'CLAUDE.md', 'package.json', 'index.html'].map((f) => join(root, f)),
  ...walk(join(root, 'templates'), (p) => /\.html$/.test(p)),
  ...walk(join(root, 'demo'), (p) => /\.(html|js|md)$/.test(p)),
  ...walk(join(root, 'explore'), (p) => /\.(html|js)$/.test(p)),
  ...walk(join(root, 'examples'), (p) => /\.(html|md)$/.test(p)),
  ...walk(join(root, 'tests'), (p) => /\.(md|html)$/.test(p)),
  ...walk(join(root, 'components'), (p) => /\/README\.md$/.test(p) || /components\/([^/]+)\/\1\.html$/.test(p) || /components\/README\.md$/.test(p)),
].filter((p) => !p.endsWith('check-words.mjs') && !files.includes(p));

let hits = 0;
for (const f of files.concat(nameFiles)) {
  const nameOnly = nameFiles.includes(f);
  const lines = readFileSync(f, 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const [re, now] of BANNED) {
      if (nameOnly && re.source !== 'S4 Orion') continue;
      const m = re.exec(line);
      if (m && re.source === 'S4 Orion' && ORION_OK(relative(root, f), line, lines, i)) continue;
      if (m) { hits++; console.log(`${relative(root, f)}:${i + 1}: "${m[0]}": ${now}`); }
    }
  });
}
if (hits) { console.log(`\n${hits} banned phrase(s): the docs describe an old look. Fix the text (decisions and history are exempt).`); process.exit(1); }
console.log(`Words: ${files.length + nameFiles.length} files, no banned phrases.`);
