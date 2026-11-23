#!/usr/bin/env node
/* Cut a release (decision 0075): pinned, never-changing copies of what an app loads, so a URL can name an exact version.
     node scripts/release.mjs                      the working tree, at package.json's version, dated today
     node scripts/release.mjs --ref v1.1.0         backfill from a git ref (its version comes from its own bundle)
     options: --date YYYY-MM-DD, --dry
   Writes releases/<version>/ (the skill's shipped assets of that version: the minified bundles, site bundle, core and
   packs, icons, m3color, fonts, packs.json; the unminified orion.css/orion.js only when that version had no .min copy),
   releases/<version>/api.json (the public API, scripts/api.mjs) and an entry in releases/index.json with each file's
   SHA-1. A release is immutable: running it again for a version that exists only succeeds when every file is identical,
   and npm run check (scripts/check-api.mjs) fails if a released file changes or disappears. Release only after the
   CHANGELOG entry is dated; then npm run build (the skill copies releases/index.json) and re-package the skill.
   Pages serves releases/ from main: https://4rk0s4h4.github.io/Orion/releases/<version>/<file>. No dependencies. */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { root, snapshot, treeReader, gitReader } from './api.mjs';

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const ref = arg('--ref'), DRY = process.argv.includes('--dry');
const sha = (b) => createHash('sha1').update(b).digest('hex');

const reader = ref ? gitReader(ref) : treeReader();
const bytes = ref ? (p) => execFileSync('git', ['show', `${ref}:${p}`], { cwd: root, maxBuffer: 1 << 28 }) : (p) => readFileSync(join(root, p));
const snap = snapshot(reader);
const version = ref ? snap.version : JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
if (!version) { console.error('release: cannot read the version'); process.exit(1); }
snap.version = version;
const date = arg('--date') || (ref ? execFileSync('git', ['log', '-1', '--format=%ad', '--date=short', ref], { cwd: root, encoding: 'utf8' }).trim() : new Date().toISOString().slice(0, 10));
const skillDir = `skill/${snap.skill[0]}/assets`;
const shipped = reader.list(skillDir).filter((f) => !f.startsWith('.') && f !== 'api.json');
const files = shipped.filter((f) => !(/^orion\.(css|js)$/.test(f) && shipped.includes(f.replace(/\.(css|js)$/, '.min.$1'))));

const dir = join(root, 'releases', version);
const indexFile = join(root, 'releases/index.json');
const index = existsSync(indexFile) ? JSON.parse(readFileSync(indexFile, 'utf8')) : { note: 'Released Orion versions (scripts/release.mjs, decision 0075). Each folder is immutable; URLs pin to https://4rk0s4h4.github.io/Orion/releases/<version>/<file>.', latest: null, versions: {} };
const entry = { date, files: {} };
const writes = [];
for (const f of files) { const b = bytes(`${skillDir}/${f}`); entry.files[f] = sha(b); writes.push([join(dir, f), b]); }
const api = JSON.stringify(snap, null, 1) + '\n';
entry.files['api.json'] = sha(Buffer.from(api)); writes.push([join(dir, 'api.json'), Buffer.from(api)]);

const old = index.versions[version];
if (old) {
  const diff = Object.keys({ ...old.files, ...entry.files }).filter((f) => old.files[f] !== entry.files[f]);
  if (diff.length) { console.error(`release ${version} exists and is immutable; these files differ: ${diff.join(', ')}. Bump the version instead.`); process.exit(1); }
  console.log(`release ${version} already exists with identical files.`); process.exit(0);
}
index.versions[version] = entry;
const cmp = (a, b) => { const x = a.split('.').map(Number), y = b.split('.').map(Number); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i]; return 0; };
index.versions = Object.fromEntries(Object.entries(index.versions).sort(([a], [b]) => cmp(a, b)));
index.latest = Object.keys(index.versions).sort(cmp).pop();
if (DRY) { console.log(`would write releases/${version}/ (${files.length + 1} files) dated ${date}`); process.exit(0); }
mkdirSync(dir, { recursive: true });
for (const [p, b] of writes) writeFileSync(p, b);
writeFileSync(indexFile, JSON.stringify(index, null, 1) + '\n');
console.log(`released ${version} (${date}): releases/${version}/ with ${files.join(', ')} and api.json; latest is ${index.latest}. Now run npm run build and re-package the skill.`);
