#!/usr/bin/env node
/* Migrations are complete (decision 0075). Part of npm run check.
   1. Releases never change: every file listed in releases/index.json exists with its SHA-1 (an app pinned to a release
      URL can never break).
   2. Every migration file is well formed (migrations/<version>.json: renames, removals, judgment items), and every
      released version after the first, and the version being built when it is past the last release, has one.
   3. Nothing public disappears silently: every name in the last released API snapshot (releases/<v>/api.json: classes,
      tokens, data attributes and their values, S4.* functions, events, icon names, shipped files, packs, the skill's name)
      that this build no longer answers to (scripts/api.mjs present()) must be renamed or removed by a migration entry
      after that release; and every rename's new name must exist.
   Options (for the proofs in tests/upgrade.mjs): --base <api.json> compares with that snapshot instead of the last
   release, --migrations <dir> reads migrations from there. Exit 1 with one line per problem. No dependencies. */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';
import { root, present, treeReader, KINDS, KIND_OF } from './api.mjs';

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const problems = [];
const cmp = (a, b) => { const x = a.split('.').map(Number), y = b.split('.').map(Number); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i]; return 0; };
const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;

/* 1. releases are immutable */
const index = existsSync(join(root, 'releases/index.json')) ? JSON.parse(readFileSync(join(root, 'releases/index.json'), 'utf8')) : { versions: {} };
const released = Object.keys(index.versions).sort(cmp);
for (const v of released) for (const [f, sum] of Object.entries(index.versions[v].files)) {
  const p = join(root, 'releases', v, f);
  if (!existsSync(p)) problems.push(`releases/${v}/${f} is missing (a release is never changed or removed)`);
  else if (createHash('sha1').update(readFileSync(p)).digest('hex') !== sum) problems.push(`releases/${v}/${f} changed after its release (releases are immutable: cut a new version)`);
}
if (released.length && index.latest !== released[released.length - 1]) problems.push(`releases/index.json: latest is ${index.latest}, expected ${released[released.length - 1]}`);

/* 2. migration files */
const migDir = resolve(arg('--migrations') || join(root, 'migrations'));
const MIG_KINDS = new Set(Object.values(KIND_OF).concat('url'));
const migs = {};
for (const f of existsSync(migDir) ? readdirSync(migDir).filter((f) => f.endsWith('.json')) : []) {
  const where = `migrations/${f}`;
  let m; try { m = JSON.parse(readFileSync(join(migDir, f), 'utf8')); } catch (e) { problems.push(`${where}: not JSON (${e.message})`); continue; }
  if (!/^\d+\.\d+\.\d+\.json$/.test(f) || m.version !== f.slice(0, -5)) { problems.push(`${where}: "version" must equal the file name`); continue; }
  for (const k of ['renames', 'removals', 'judgment']) if (!Array.isArray(m[k])) problems.push(`${where}: "${k}" must be a list (it may be empty)`);
  if (typeof m.summary !== 'string' || !m.summary) problems.push(`${where}: a one-paragraph "summary" is required`);
  for (const r of m.renames || []) if (!MIG_KINDS.has(r.kind) || !r.from || !r.to) problems.push(`${where}: a rename needs kind (${[...MIG_KINDS].join(', ')}), from and to: ${JSON.stringify(r)}`);
  for (const r of m.removals || []) if (!MIG_KINDS.has(r.kind) || !r.name || !r.what) problems.push(`${where}: a removal needs kind, name and what to do instead ("what"): ${JSON.stringify(r)}`);
  for (const j of m.judgment || []) if (!j.id || !j.decision || !j.title || !j.what) problems.push(`${where}: a judgment item needs id, decision, title and what: ${JSON.stringify(j)}`);
  migs[m.version] = m;
}
for (const v of released.slice(1)) if (!migs[v]) problems.push(`release ${v} has no migrations/${v}.json`);
const last = released.filter((v) => cmp(v, version) < 0).pop();
if (last && cmp(version, last) > 0 && !migs[version]) problems.push(`package.json is ${version}, past release ${last}: write migrations/${version}.json (empty lists are fine when nothing public changed)`);

/* 3. nothing public disappears without an entry */
const basePath = arg('--base') ? resolve(arg('--base')) : (released.filter((v) => cmp(v, version) <= 0).length ? join(root, 'releases', released.filter((v) => cmp(v, version) <= 0).pop(), 'api.json') : null);
if (basePath) {
  const base = JSON.parse(readFileSync(basePath, 'utf8'));
  const now = present(treeReader());
  const norm = (kind, n) => (kind === 'api' ? String(n).replace(/^S4\./, '') : String(n));
  const covered = {};
  for (const [v, m] of Object.entries(migs)) {
    if (base.version && cmp(v, base.version) <= 0) continue;
    if (cmp(v, version) > 0) continue;
    for (const r of m.renames || []) (covered[r.kind] ||= new Set()).add(norm(r.kind, r.from));
    for (const r of m.removals || []) (covered[r.kind] ||= new Set()).add(norm(r.kind, r.name));
    for (const r of m.renames || []) {
      const list = Object.keys(KIND_OF).find((k) => KIND_OF[k] === r.kind);
      if (list && now[list] && !now[list].includes(norm(r.kind, r.to))) problems.push(`migrations/${v}.json renames ${r.kind} ${r.from} to ${r.to}, which this build does not have`);
    }
  }
  let n = 0;
  for (const list of KINDS) for (const name of base[list] || []) {
    n++;
    if ((now[list] || []).includes(name)) continue;
    const kind = KIND_OF[list];
    if (covered[kind] && covered[kind].has(norm(kind, name))) continue;
    problems.push(`${kind} ${list === 'api' ? 'S4.' : ''}${name} is in the ${base.version || 'base'} API but not in this build, and no migration after ${base.version || 'it'} renames or removes it (add it to migrations/${version}.json)`);
  }
  if (!problems.length) console.log(`API: ${n} public names of ${base.version || basePath} all present or migrated; ${released.length} releases intact; migrations ${Object.keys(migs).sort(cmp).join(', ') || 'none'}.`);
}
if (problems.length) { console.error(problems.map((p) => '  x ' + p).join('\n')); process.exit(1); }
if (!basePath) console.log('API: no release to compare with yet.');
