#!/usr/bin/env node
/* Upgrade an app to a newer Orion (decision 0075). Dry run by default: it prints what it would do and changes nothing.
     node <skill>/scripts/upgrade.mjs <app-dir>                 dry run to the Orion this script ships with
     node <skill>/scripts/upgrade.mjs <app-dir> --write         do it, write orion-upgrade.md, run the page checker
     node <skill>/scripts/upgrade.mjs <app-dir> --init          only write orion.json (a new app, or one that has none)
   Options: --to <version> (default: the version of the Orion it reads), --source <dir> (an Orion repo checkout or an
   unpacked skill; default: this skill), --migrations <dir> (more migration files, repeatable), --report <file>,
   --no-check (skip the page checker), --json (print the result as JSON).
   What it does, in order:
   1. Finds the app's Orion version: orion.json, then <meta name="orion">, the banners of vendored Orion files and pinned
      release URLs; the oldest wins, so no migration is skipped. An app with none counts as 1.0.0 and is reported.
   2. Replaces vendored Orion files (orion*.css/js, icons, m3color, fonts, packs.json) with the new version's, and
      regenerates brand files from the seed in their header. URLs to Orion move to an exact release,
      https://4rk0s4h4.github.io/Orion/releases/<version>/<file>, never to a moving address; a version with no release is
      left alone and reported.
   3. Applies every mechanical migration between the two versions (migrations/<version>.json) across the app's HTML,
      CSS and JS, by context: a class only inside class="" and selectors and as a whole word in JS strings, a token only
      as a whole --name, an attribute only as an attribute, a value only on its attribute, an S4.* name only whole. Text
      that merely looks similar (s4-chip-set for s4-chip, a word in a paragraph) is never touched.
   4. Lists every removal it could not apply and every judgment item (a rule or behaviour to review) with its decision
      and the places in the app it concerns, links new packs a lean page now needs, and lists the app's own
      workarounds ("Orion issue #N" comments and orion.json overrides) whose issue is fixed in between. It never edits
      a workaround.
   5. Updates every page's <meta name="orion"> and orion.json, writes orion-upgrade.md, and runs the page checker on
      the app's pages when Playwright is installed.
   No dependencies. */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync, copyFileSync, unlinkSync } from 'node:fs';
import { join, dirname, relative, resolve, basename, extname, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const flag = (k) => argv.includes(k);
const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const opts = (k) => argv.flatMap((a, i) => (a === k ? [argv[i + 1]] : []));
const appArg = argv.find((a, i) => !a.startsWith('--') && !['--to', '--source', '--migrations', '--report'].includes(argv[i - 1]));
if (!appArg) { console.error('Usage: node upgrade.mjs <app-dir> [--to <version>] [--write] [--init] [--source <orion-dir>] [--no-check] [--json]'); process.exit(2); }
const APP = resolve(appArg), WRITE = flag('--write'), INIT = flag('--init');
if (!existsSync(APP) || !statSync(APP).isDirectory()) { console.error(`upgrade: ${APP} is not a folder`); process.exit(2); }

/* ---------- versions ---------- */
const VER = /^\d+\.\d+\.\d+$/;
const cmp = (a, b) => { const x = a.split('.').map(Number), y = b.split('.').map(Number); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i]; return 0; };
const BANNER = /^\/\* (?:S4 )?Orion (\d+\.\d+\.\d+) /;   /* "S4 " is the 1.0.0 banner */
const PAGES_BASE = 'https://4rk0s4h4.github.io/Orion/';
const EARLIEST = '1.0.0';

/* ---------- where the new Orion is: a repo checkout, an unpacked skill, or a test fixture with the same folders ---------- */
const SRC = resolve(opt('--source') || join(here, '..'));
const pick = (...ps) => ps.map((p) => join(SRC, p)).find((p) => existsSync(p)) || null;
const src = {
  assets: pick('skill/orion/assets', 'assets'),
  migrations: pick('migrations'),
  releasesIndex: pick('releases/index.json', 'migrations/releases.json'),
  releasesDir: pick('releases'),
  decisions: pick('docs/decisions'),
  issues: pick('docs/issues/README.md'),
  checker: pick('skill/orion/scripts/check.mjs', 'scripts/check.mjs'),
  packs: pick('skill/orion/scripts/packs.mjs', 'scripts/packs.mjs'),
  brand: pick('skill/orion/scripts/brand.mjs', 'scripts/brand.mjs'),
};
if (!src.assets) { console.error(`upgrade: no Orion assets in ${SRC} (expected skill/orion/assets or assets)`); process.exit(2); }
const versionOfText = (t) => ((t || '').match(BANNER) || [])[1] || null;
const srcVersion = ['orion.js', 'orion.core.min.js', 'orion.min.js', 'orion.css'].map((f) => join(src.assets, f)).filter(existsSync).map((f) => versionOfText(readFileSync(f, 'utf8').slice(0, 200))).find(Boolean);
if (!srcVersion) { console.error(`upgrade: cannot read the version of ${src.assets}`); process.exit(2); }
const TO = opt('--to') || srcVersion;
if (!VER.test(TO)) { console.error(`upgrade: --to ${TO} is not a version (x.y.z); "latest" is the default`); process.exit(2); }
const releases = src.releasesIndex ? JSON.parse(readFileSync(src.releasesIndex, 'utf8')) : { versions: {} };

/* the files of the target version: the source's assets when it is that version, else its pinned release folder */
const targetDir = TO === srcVersion ? src.assets : (src.releasesDir && existsSync(join(src.releasesDir, TO)) ? join(src.releasesDir, TO) : null);
if (!targetDir) { console.error(`upgrade: ${SRC} is Orion ${srcVersion} and has no releases/${TO}/; get Orion ${TO} first (see references/upgrading.md)`); process.exit(2); }
const targetFiles = new Set(readdirSync(targetDir));

/* ---------- migrations ---------- */
const migrations = {};
for (const d of [src.migrations, ...opts('--migrations').map((p) => resolve(p))].filter(Boolean)) {
  for (const f of readdirSync(d).filter((f) => /^\d+\.\d+\.\d+\.json$/.test(f))) migrations[f.slice(0, -5)] = JSON.parse(readFileSync(join(d, f), 'utf8'));
}

/* ---------- the app's files ---------- */
const TEXT_EXT = new Set(['.html', '.htm', '.css', '.scss', '.less', '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.vue', '.svelte', '.astro', '.md']);
const MARKUP_EXT = new Set(['.html', '.htm', '.vue', '.svelte', '.astro']);
const CSS_EXT = new Set(['.css', '.scss', '.less']);
const SKIP = new Set(['node_modules', 'bower_components', 'vendor-cache']);
let orionJson = existsSync(join(APP, 'orion.json')) ? JSON.parse(readFileSync(join(APP, 'orion.json'), 'utf8')) : null;
const ignore = (orionJson && orionJson.ignore) || [];
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name), rel = relative(APP, p).split(sep).join('/');
    if (name.startsWith('.') || SKIP.has(name) || ignore.some((g) => rel === g || rel.startsWith(g.replace(/\/?$/, '/')))) continue;
    const st = statSync(p);
    if (st.isDirectory()) { if (!existsSync(join(p, 'SKILL.md'))) walk(p, out); }   /* a copy of a skill is not the app */
    else if (st.size < 4e6) out.push(rel);
  }
  return out;
}
const all = walk(APP);
const read = (rel) => readFileSync(join(APP, rel), 'utf8');
const edits = {};   /* rel -> new text, written only with --write */
const textOf = (rel) => (rel in edits ? edits[rel] : read(rel));
const writesBin = [], deletes = [];   /* [to, from] copies of the new version's files; files renamed away */
const ORION_NAMES = /^(orion(\.[a-z]+)?(\.min)?\.(css|js)|icons(-[a-z-]+)?\.js|m3color\.js|inter-(variable|site)\.woff2|packs\.json)$/;
const isOrionText = (t) => BANNER.test(t) || /^\/\* Orion icons/.test(t) || /^window\.S4_ICONS\s*=/.test(t) || /^\{\s*"needs"\s*:/.test(t);
/* vendored Orion files: an Orion name and an Orion banner (fonts and m3color.js: an Orion name beside an Orion file) */
const vendored = [];
for (const rel of all) {
  const b = basename(rel);
  if (!ORION_NAMES.test(b)) continue;
  if (/\.(woff2)$/.test(b) || b === 'm3color.js') continue;
  if (isOrionText(read(rel).slice(0, 300))) vendored.push(rel);
}
const vendorDirs = new Set(vendored.map((r) => dirname(r)));
for (const rel of all) { const b = basename(rel); if ((/\.woff2$/.test(b) || b === 'm3color.js') && ORION_NAMES.test(b) && vendorDirs.has(dirname(rel))) vendored.push(rel); }
const brandFiles = all.filter((r) => r.endsWith('.css') && /^\/\* Orion brand: /.test(read(r).slice(0, 40)));
const vendoredSet = new Set(vendored.concat(brandFiles));
const textFiles = all.filter((r) => TEXT_EXT.has(extname(r).toLowerCase()) && !vendoredSet.has(r));
const htmlFiles = textFiles.filter((r) => MARKUP_EXT.has(extname(r).toLowerCase()));

/* Orion URLs: Pages (old and new address), raw GitHub, jsDelivr; a path into components/, the skill's assets or a release */
const URL_RE = /https?:\/\/(?:4rk0s4h4\.github\.io\/(?:Orion|s4-orion)\/|github\.com\/4RK0S4H4\/(?:Orion|s4-orion)\/raw\/[^/\s"'`]+\/|raw\.githubusercontent\.com\/4RK0S4H4\/(?:Orion|s4-orion)\/[^/\s"'`]+\/|cdn\.jsdelivr\.net\/gh\/4RK0S4H4\/(?:Orion|s4-orion)@[^/\s"'`]+\/)(?:components\/(?:assets\/)?|skill\/(?:s4-)?orion\/assets\/|releases\/(\d+\.\d+\.\d+)\/)([\w.-]+)/gi;
const pages = htmlFiles.filter((r) => { const t = read(r); return vendored.some((v) => t.includes(basename(v))) || new RegExp(URL_RE.source, 'i').test(t) || /<meta name="orion"/.test(t); });

/* ---------- 1. the app's version ---------- */
const found = [];
if (orionJson && VER.test(orionJson.orion || '')) found.push([orionJson.orion, 'orion.json']);
for (const r of pages) { const m = read(r).match(/<meta name="orion" content="(\d+\.\d+\.\d+)"/); if (m) found.push([m[1], `${r} (meta)`]); }
for (const r of vendored) { const v = /\.(css|js)$/.test(r) ? versionOfText(read(r).slice(0, 200)) : null; if (v) found.push([v, `${r} (banner)`]); }
for (const r of textFiles) for (const m of read(r).matchAll(URL_RE)) if (m[1]) found.push([m[1], `${r} (release URL)`]);
const FROM = found.length ? found.map((f) => f[0]).sort(cmp)[0] : EARLIEST;
const report = { app: APP, from: FROM, to: TO, write: WRITE, versionsFound: found, assumed: !found.length, files: {}, replaced: [], urls: [], blocked: [], removals: [], judgment: [], packs: [], overrides: [], stamps: [], check: null };

if (INIT) {
  const data = buildOrionJson(found.length ? FROM : srcVersion);
  writeFileSync(join(APP, 'orion.json'), JSON.stringify(data, null, 2) + '\n');
  console.log(`wrote orion.json (Orion ${data.orion}, ${data.load.files.length} vendored files, ${data.load.urls.length} URLs, ${data.pages.length} pages${found.length ? '' : '; no version found in the app, so it says the version of this skill'})`);
  process.exit(0);
}
if (cmp(FROM, TO) > 0) { console.error(`upgrade: the app is already on Orion ${FROM}, newer than ${TO}`); process.exit(2); }

const steps = Object.keys(migrations).filter((v) => cmp(v, FROM) > 0 && cmp(v, TO) <= 0).sort(cmp);
const gaps = [];
{ let at = FROM; for (const v of steps) { if (migrations[v].from && cmp(migrations[v].from, at) > 0) gaps.push(`${at} to ${migrations[v].from}`); at = v; } }
if (gaps.length) report.blocked.push(`no migration file covers ${gaps.join(', ')}; the upgrade may miss renames there`);

/* ---------- text editing by context ---------- */
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
/* split JavaScript into code and string-literal spans (comments count as code; template literals are strings) */
function jsSpans(t) {
  const out = []; let i = 0, start = 0;
  const push = (end, str) => { if (end > start) out.push({ s: t.slice(start, end), str }); start = end; };
  while (i < t.length) {
    const c = t[i], d = t[i + 1];
    if (c === '/' && d === '/') { const e = t.indexOf('\n', i); i = e < 0 ? t.length : e; continue; }
    if (c === '/' && d === '*') { const e = t.indexOf('*/', i + 2); i = e < 0 ? t.length : e + 2; continue; }
    if (c === '"' || c === "'" || c === '`') {
      push(i, false); let j = i + 1;
      while (j < t.length && t[j] !== c) { if (t[j] === '\\') j++; else if (c !== '`' && t[j] === '\n') break; j++; }
      i = Math.min(j + 1, t.length); push(i, true); continue;
    }
    i++;
  }
  push(t.length, false);
  return out;
}
const inStrings = (t, fn) => jsSpans(t).map((p) => (p.str ? fn(p.s) : p.s)).join('');
const inCode = (t, fn) => jsSpans(t).map((p) => (p.str ? p.s : fn(p.s))).join('');
/* split markup into markup, <style> and <script> (inline JavaScript only) */
function markupSpans(t) {
  const out = []; let last = 0;
  for (const m of t.matchAll(/(<style\b[^>]*>)([\s\S]*?)(<\/style>)|(<script\b([^>]*)>)([\s\S]*?)(<\/script>)/gi)) {
    out.push({ s: t.slice(last, m.index), ctx: 'markup' });
    if (m[1]) { out.push({ s: m[1], ctx: 'markup' }, { s: m[2], ctx: 'css' }, { s: m[3], ctx: 'markup' }); }
    else { const js = !/\bsrc=/.test(m[5]) && !/type=["'](?!module|text\/javascript|application\/javascript)/i.test(m[5]); out.push({ s: m[4], ctx: 'markup' }, { s: m[6], ctx: js ? 'js' : 'data' }, { s: m[7], ctx: 'markup' }); }
    last = m.index + m[0].length;
  }
  out.push({ s: t.slice(last), ctx: 'markup' });
  return out;
}
const camel = (a) => a.replace(/^data-/, '').replace(/-([a-z])/g, (m, c) => c.toUpperCase());
const word = (n) => new RegExp(`(?<![\\w-])${esc(n)}(?![\\w-])`, 'g');
const splitValue = (v) => { const i = v.indexOf('='); return [v.slice(0, i), v.slice(i + 1)]; };
const apiName = (n) => (n.startsWith('S4.') ? n : 'S4.' + n);

/* one rename in one context; returns the new text */
function renameIn(text, ctx, r) {
  const { kind } = r;
  if (kind === 'token') return text.replace(word(r.from), r.to);
  if (kind === 'api') return ctx === 'css' ? text : text.replace(new RegExp(`(?<![\\w$.])${esc(apiName(r.from))}(?![\\w$])`, 'g'), apiName(r.to));
  if (kind === 'url') return text.split(r.from).join(r.to);
  if (kind === 'skill') {
    const t = text.replace(new RegExp(`(?<=skills?/)${esc(r.from)}(?=/)`, 'g'), r.to).replace(new RegExp(`(?<![\\w-])${esc(r.from)}\\.skill\\b`, 'g'), `${r.to}.skill`);
    return ctx === 'md' ? t.replace(new RegExp(`(?<![\\w./-])${esc(r.from)}(?![\\w/-])`, 'g'), r.to) : t;   /* the bare name only in prose */
  }
  if (ctx === 'md' || ctx === 'data') return text;
  if (kind === 'file') return text.replace(new RegExp(`(?<=[/"'(=\\s]|^)${esc(r.from)}(?=[?#"'\`)\\s]|$)`, 'gm'), r.to);
  if (kind === 'class') {
    if (ctx === 'markup') return text.replace(/(\s(?:class|className)\s*=\s*)(["'])([^"']*)\2/g, (m, a, q, v) => a + q + v.replace(word(r.from), r.to) + q);
    if (ctx === 'css') return text.replace(new RegExp(`\\.${esc(r.from)}(?![\\w-])`, 'g'), '.' + r.to);
    return inStrings(text, (s) => s.replace(word(r.from), r.to));
  }
  if (kind === 'attr') {
    if (ctx === 'markup') return text.replace(/<[a-zA-Z][^>]*>/g, (tag) => tag.replace(new RegExp(`(\\s)${esc(r.from)}(?=[\\s=/>])`, 'g'), `$1${r.to}`));
    if (ctx === 'css') return text.replace(new RegExp(`\\[${esc(r.from)}(?=[\\]=~|^$*\\s])`, 'g'), '[' + r.to);
    return inCode(inStrings(text, (s) => s.replace(word(r.from), r.to)), (s) => s.replace(new RegExp(`\\bdataset\\.${camel(r.from)}\\b`, 'g'), `dataset.${camel(r.to)}`));
  }
  if (kind === 'value') {
    const [fa, fv] = splitValue(r.from), [ta, tv] = splitValue(r.to);
    const attrEq = new RegExp(`${esc(fa)}(\\s*=\\s*)(\\\\?["']?)${esc(fv)}\\2(?=[\\s\\]>/]|$)`, 'g');
    if (ctx === 'markup') return text.replace(/<[a-zA-Z][^>]*>/g, (tag) => tag.replace(new RegExp(`(\\s)${esc(fa)}(\\s*=\\s*)(["'])${esc(fv)}\\3`, 'g'), `$1${ta}$2$3${tv}$3`));
    if (ctx === 'css') return text.replace(new RegExp(`\\[${esc(fa)}=(["']?)${esc(fv)}\\1\\]`, 'g'), `[${ta}=$1${tv}$1]`);
    let out = inStrings(text, (s) => s.replace(attrEq, `${ta}$1$2${tv}$2`));
    out = out.replace(new RegExp(`(["'])${esc(fa)}\\1(\\s*,\\s*)(["'])${esc(fv)}\\3`, 'g'), `$1${ta}$1$2$3${tv}$3`);   /* setAttribute('data-x', 'v') */
    return out.replace(new RegExp(`(\\bdataset\\.)${camel(fa)}(\\s*={1,3}\\s*)(["'])${esc(fv)}\\3`, 'g'), `$1${camel(ta)}$2$3${tv}$3`);
  }
  if (kind === 'event') return ctx === 'js' ? inStrings(text, (s) => (s.slice(1, -1) === r.from ? s[0] + r.to + s[s.length - 1] : s)) : text.replace(new RegExp(`(["'])${esc(r.from)}\\1`, 'g'), `$1${r.to}$1`);
  if (kind === 'icon') {
    const t = text.replace(new RegExp(`(data-icon\\s*=\\s*\\\\?["'])${esc(r.from)}(?=\\\\?["'])`, 'g'), `$1${r.to}`);
    return ctx === 'js' ? t.replace(new RegExp(`(S4\\.icon\\.\\w+\\([^)]*?["'])${esc(r.from)}(?=["'])`, 'g'), `$1${r.to}`) : t;
  }
  if (kind === 'pack') return text.replace(new RegExp(`(?<=orion\\.)${esc(r.from)}(?=\\.min\\.(css|js))`, 'g'), r.to);
  return text;
}
function ctxOf(rel) { const e = extname(rel).toLowerCase(); return e === '.md' ? 'md' : CSS_EXT.has(e) ? 'css' : MARKUP_EXT.has(e) ? 'markup' : 'js'; }
function applyAll(rel, text, fn) {
  const ctx = ctxOf(rel);
  if (ctx !== 'markup') return fn(text, ctx);
  return markupSpans(text).map((p) => fn(p.s, p.ctx)).join('');
}
const linesWith = (text, re) => { const out = []; text.split('\n').forEach((l, i) => { re.lastIndex = 0; if (re.test(l)) out.push(i + 1); }); return out; };

/* ---------- 2..4. plan every change in memory ---------- */
const setText = (rel, t, why) => { if (t !== textOf(rel)) { edits[rel] = t; (report.files[rel] ||= new Set()).add(why); } };

/* mechanical renames, oldest version first */
const renames = steps.flatMap((v) => (migrations[v].renames || []).map((r) => ({ ...r, version: v })));
for (const rel of textFiles) for (const r of renames) {
  if (ctxOf(rel) === 'md' && !['skill', 'url'].includes(r.kind)) continue;
  const before = textOf(rel), after = applyAll(rel, before, (t, ctx) => renameIn(t, ctx, r));
  setText(rel, after, `${r.kind} ${r.from} → ${r.to} (${r.version}${r.decision ? ', decision ' + r.decision : ''})`);
}
const fileRenames = renames.filter((r) => r.kind === 'file');
const newName = (b) => fileRenames.reduce((n, r) => (n === r.from ? r.to : n), b);

/* URLs to Orion: an exact release, never a moving address */
const rel_ = releases.versions && releases.versions[TO];
for (const rel of textFiles) {
  const before = textOf(rel);
  const after = before.replace(URL_RE, (m, pinned, file) => {
    let f = newName(file);
    if (rel_ && !rel_.files[f] && rel_.files[f.replace(/\.(css|js)$/, '.min.$1')]) f = f.replace(/\.(css|js)$/, '.min.$1');   /* releases keep the minified copy of the full bundle */
    if (!rel_) { report.blocked.push(`${rel}: ${m} stays: Orion ${TO} has no published release to pin to (releases/index.json); keep vendored files or upgrade to ${releases.latest || 'a released version'} with --to`); return m; }
    if (!rel_.files[f]) { report.blocked.push(`${rel}: ${m}: release ${TO} has no ${f}`); return m; }
    const url = `${PAGES_BASE}releases/${TO}/${f}`;
    if (url !== m) report.urls.push(`${rel}: ${m} → ${url}`);
    return url;
  });
  setText(rel, after, `Orion URLs pinned to releases/${TO}/`);
}

/* vendored files: the new version's copy, under its new name */
for (const rel of vendored) {
  const b = basename(rel), nb = newName(b);
  let from = targetFiles.has(nb) ? join(targetDir, nb) : null;
  if (!from) { report.removals.push({ kind: 'file', name: rel, what: `Orion ${TO} no longer ships ${nb}; remove it and its <link>/<script>, or see the migration notes`, where: [] }); continue; }
  const to = join(dirname(rel), nb).split(sep).join('/');
  const same = existsSync(join(APP, to)) && readFileSync(from).equals(readFileSync(join(APP, rel)));
  if (!same || nb !== b) { writesBin.push([to, from]); report.replaced.push(nb !== b ? `${rel} → ${to} (Orion ${TO})` : `${rel} (Orion ${TO})`); }
  if (nb !== b) deletes.push(rel);
}
/* brand files: written again from their seed by the new version's engine (decision 0063) */
let brandCss = null;
if (brandFiles.length && src.brand) ({ brandCss } = await import(pathToFileURL(src.brand).href));
for (const rel of brandFiles) {
  const m = read(rel).match(/^\/\* Orion brand: (#[0-9a-fA-F]{6}), variant (\w[\w-]*), (\w+) surfaces/);
  if (!m || !brandCss) { report.judgment.push({ id: 'brand-file', decision: '0063', title: `Regenerate ${rel}`, what: `Run node <skill>/scripts/brand.mjs with the app's seed, variant and surfaces and --out ${rel}.`, where: [] }); continue; }
  const css = brandCss({ seed: m[1], variant: m[2], surfaces: m[3] });
  if (css !== read(rel)) { edits[rel] = css; (report.files[rel] ||= new Set()).add(`brand file regenerated (${m[1]}, ${m[2]}, ${m[3]})`); }
}

/* removals: never applied, every occurrence listed */
for (const v of steps) for (const r of migrations[v].removals || []) {
  const re = r.kind === 'api' ? new RegExp(`${esc(apiName(r.name))}(?![\\w$])`) : r.kind === 'value' ? new RegExp(`${esc(splitValue(r.name)[0])}\\s*=\\s*\\\\?["']?${esc(splitValue(r.name)[1])}\\b`) : new RegExp(`(?<![\\w-])${esc(r.name)}(?![\\w-])`);
  const where = textFiles.flatMap((rel) => linesWith(textOf(rel), re).map((n) => `${rel}:${n}`));
  report.removals.push({ ...r, version: v, where });
}
/* judgment items, with the places they concern */
for (const v of steps) for (const j of migrations[v].judgment || []) {
  const res = [].concat((j.find && j.find.classes || []).map((c) => new RegExp(`(?<![\\w-])${esc(c)}(?![\\w-])`)), (j.find && j.find.attrs || []).map((a) => new RegExp(`(?<![\\w-])${esc(a)}(?=[\\s=\\]"'>])`)), (j.find && j.find.text || []).map((t) => new RegExp(t)));
  const where = res.length ? textFiles.filter((rel) => ctxOf(rel) !== 'md').flatMap((rel) => { const t = textOf(rel); const ls = [...new Set(res.flatMap((re) => linesWith(t, re)))].sort((a, b) => a - b); return ls.length ? [`${rel}:${ls.slice(0, 6).join(',')}${ls.length > 6 ? ` (+${ls.length - 6})` : ''}`] : []; }) : [];
  report.judgment.push({ ...j, version: v, major: !!migrations[v].major, where });
}

/* lean pages: link the packs the markup now needs (decision 0069) */
if (src.packs && targetFiles.has('packs.json')) {
  const { needsOf, linkedPacks } = await import(pathToFileURL(src.packs).href);
  const index = JSON.parse(readFileSync(join(targetDir, 'packs.json'), 'utf8'));
  for (const rel of pages) {
    let t = textOf(rel);
    if (!/orion\.core\.min\.css/.test(t)) continue;
    const need = new Set(needsOf(t, index).packs); for (const p of [...need]) for (const n of (index.needs || {})[p] || []) need.add(n);
    const have = linkedPacks(t, index);
    for (const p of need) {
      if (have.has(p)) continue;
      const css = [...t.matchAll(/<link[^>]+href="([^"]*?)orion\.([a-z]+)\.min\.css([^"]*)"[^>]*>/g)].pop(), js = [...t.matchAll(/<script[^>]+src="([^"]*?)orion\.([a-z]+)\.min\.js([^"]*)"[^>]*><\/script>/g)].pop();
      if (!css || !js) { report.packs.push(`${rel}: needs the ${p} pack; link orion.${p}.min.css and .js after the others`); continue; }
      t = t.slice(0, css.index + css[0].length) + `\n${css[0].replace(`orion.${css[2]}.min.css`, `orion.${p}.min.css`)}` + t.slice(css.index + css[0].length);
      const js2 = [...t.matchAll(/<script[^>]+src="([^"]*?)orion\.([a-z]+)\.min\.js([^"]*)"[^>]*><\/script>/g)].pop();
      t = t.slice(0, js2.index + js2[0].length) + `\n${js2[0].replace(`orion.${js2[2]}.min.js`, `orion.${p}.min.js`)}` + t.slice(js2.index + js2[0].length);
      report.packs.push(`${rel}: linked the ${p} pack (${needsOf(textOf(rel), index).why[p] ? needsOf(textOf(rel), index).why[p].slice(0, 3).join(', ') : 'needed'})`);
      const dirRel = (css[1].startsWith('http') ? null : join(dirname(rel), css[1]).split(sep).join('/'));
      if (dirRel != null) for (const ext of ['css', 'js']) { const f = `orion.${p}.min.${ext}`; if (targetFiles.has(f)) writesBin.push([join(dirRel, f).split(sep).join('/'), join(targetDir, f)]); }
    }
    for (const p of have) if (p !== 'core' && !need.has(p)) report.packs.push(`${rel}: links the ${p} pack but uses nothing from it now; remove its two tags`);
    setText(rel, t, 'packs linked (decision 0069)');
  }
}

/* the app's own workarounds: listed, never edited */
const fixedIn = {};
for (const v of steps) for (const n of migrations[v].fixed || []) fixedIn[n] = v;
const overrideNotes = [];
for (const o of (orionJson && orionJson.overrides) || []) { const n = Number(String(o.issue || '').match(/(\d+)\s*$/)?.[1]); overrideNotes.push({ where: 'orion.json', what: o.what || o.note || JSON.stringify(o), issue: n || o.issue, fixed: n ? fixedIn[n] || null : null }); }
for (const rel of textFiles.filter((r) => ctxOf(r) !== 'md')) {
  read(rel).split('\n').forEach((l, i) => { const m = l.match(/Orion issue #?(\d+)/i); if (m) overrideNotes.push({ where: `${rel}:${i + 1}`, what: l.trim().slice(0, 140), issue: Number(m[1]), fixed: fixedIn[Number(m[1])] || null }); });
}
report.overrides = overrideNotes;

/* stamps */
for (const rel of pages) {
  const t = textOf(rel);
  let out;
  if (/<meta name="orion" content="[^"]*">/.test(t)) out = t.replace(/<meta name="orion" content="[^"]*">/, `<meta name="orion" content="${TO}">`);
  else if (/<meta charset[^>]*>/i.test(t)) out = t.replace(/(<meta charset[^>]*>)/i, `$1\n<meta name="orion" content="${TO}">`);
  else out = t.replace(/(<head[^>]*>)/i, `$1\n<meta name="orion" content="${TO}">`);
  if (out !== t) { report.stamps.push(rel); setText(rel, out, `stamp <meta name="orion" content="${TO}">`); }
}

/* ---------- orion.json ---------- */
function buildOrionJson(version) {
  const prev = orionJson || {};
  const urls = [...new Set(textFiles.flatMap((r) => [...textOf(r).matchAll(URL_RE)].map((m) => m[0])))].sort();
  const files = [...new Set(vendored.map((r) => join(dirname(r), newName(basename(r))).split(sep).join('/')).concat(writesBin.map((w) => w[0])))].sort();
  const linked = new Set();
  for (const r of pages) for (const m of textOf(r).matchAll(/orion\.([a-z]+)\.min\.css/g)) if (!['site'].includes(m[1])) linked.add(m[1]);
  const first = pages.map((r) => textOf(r)).find((t) => /<html/i.test(t)) || '';
  const htmlTag = (first.match(/<html\b[^>]*>/i) || [''])[0];
  const DIAL_ATTRS = ['data-theme', 'data-contrast', 'data-surfaces', 'data-accent-variant', 'data-corners', 'data-gray', 'data-page', 'data-type-display', 'data-type-text', 'data-type-display-weight', 'data-energy', 'data-scale', 'data-headings', 'data-density', 'data-buttons', 'data-cards', 'data-lists', 'data-rail'];
  const dials = {};
  for (const m of htmlTag.matchAll(/\s(data-[a-z-]+)="([^"]*)"/g)) if (DIAL_ATTRS.includes(m[1])) dials[m[1]] = m[2];
  const seed = (first.match(/\bseed:\s*'(#[0-9a-fA-F]{6})'/) || [])[1] || null;
  return {
    $schema: 'Orion app record (decision 0075). Kept by node <skill>/scripts/upgrade.mjs; edit "overrides" and "ignore" by hand.',
    orion: version,
    load: { files, urls, bundle: linked.has('core') ? 'lean' : files.concat(urls).some((f) => /orion\.site\.min/.test(f)) ? 'site' : 'full' },
    packs: [...linked].filter((p) => p !== 'core').sort(),
    pages: pages.slice().sort(),
    brand: { ...(prev.brand || {}), seed: (prev.brand && prev.brand.seed) || seed, file: brandFiles[0] || (prev.brand && prev.brand.file) || null, dials: Object.keys(dials).length ? dials : (prev.brand && prev.brand.dials) || {} },
    overrides: prev.overrides || [],
    ignore: prev.ignore || [],
  };
}

/* ---------- 5. write, check, report ---------- */
const nextJson = buildOrionJson(TO);
const jsonText = JSON.stringify(nextJson, null, 2) + '\n';
if (!orionJson || JSON.stringify(orionJson) !== JSON.stringify(nextJson)) (report.files['orion.json'] ||= new Set()).add(orionJson ? `orion: ${orionJson.orion} → ${TO}` : 'created');

function decisionLink(d) {
  if (!/^\d{4}$/.test(String(d))) return String(d);
  const f = src.decisions && readdirSync(src.decisions).find((x) => x.startsWith(d + '-'));
  return f ? `[${d}](${PAGES_BASE}docs/decisions/${f})` : d;
}
function markdown() {
  const L = [];
  L.push(`# Orion upgrade: ${FROM} to ${TO}`, '');
  L.push(`App: \`${basename(APP)}\`. ${WRITE ? 'Applied' : 'Dry run (nothing changed; run again with --write)'} on ${new Date().toISOString().slice(0, 10)} by \`scripts/upgrade.mjs\` from ${relative(process.cwd(), SRC) || '.'} (Orion ${srcVersion}).`, '');
  if (report.assumed) L.push(`**No Orion version found** in the app (no orion.json, no <meta name="orion">, no banner or release URL): treated as ${EARLIEST}, the earliest, so every migration was applied. Check the result closely.`, '');
  else L.push(`Versions found: ${found.map(([v, w]) => `${v} (${w})`).join('; ')}. The oldest, ${FROM}, was used.`, '');
  const major = steps.filter((v) => migrations[v].major);
  if (major.length) L.push(`**Major version${major.length > 1 ? 's' : ''} ${major.join(', ')}: how things should look changed.** Redraw each screen in the new rules and keep every screen and element the app has (decision 0053, the app is the app): never drop one or swap it for the nearest stock component.`, '');
  L.push('## Steps', '');
  for (const v of steps) L.push(`- **${v}**${migrations[v].major ? ' (major)' : ''}: ${migrations[v].summary}`);
  if (!steps.length) L.push('- Nothing between these versions.');
  if (report.blocked.length) { L.push('', '## Blocked: needs a decision', ''); for (const b of report.blocked) L.push(`- ${b}`); }
  L.push('', '## Changed files', '');
  const fs_ = Object.entries(report.files);
  if (!fs_.length && !report.replaced.length) L.push('- None.');
  for (const r of report.replaced) L.push(`- ${r}: replaced with the new version's file`);
  for (const [f, whys] of fs_) L.push(`- \`${f}\`: ${[...whys].join('; ')}`);
  for (const u of report.urls) L.push(`- URL ${u}`);
  for (const p of report.packs) L.push(`- ${p}`);
  L.push('', '## Removals to do by hand', '');
  if (!report.removals.length) L.push('- None.');
  for (const r of report.removals) L.push(`- **${r.kind} ${r.name}** (${r.version || TO}${r.decision ? ', decision ' + decisionLink(r.decision) : ''}): ${r.what}${r.where.length ? `. Found at ${r.where.slice(0, 12).join(', ')}` : '. Not used by this app.'}`);
  L.push('', '## Review (judgment items)', '', 'Each is a rule or behaviour that changed. Read the decision, look at the places listed (and the screens at 390 and 1280), and change the app where it no longer follows the rule. Tick each one off.', '');
  if (!report.judgment.length) L.push('- None.');
  for (const j of report.judgment) L.push(`- [ ] **${j.title}** (${j.version || TO}, decision ${decisionLink(j.decision)}): ${j.what}${j.where.length ? ` Places: ${j.where.join('; ')}.` : ' Nothing in the app matched the search; check the screens anyway.'}`);
  L.push('', '## The app\'s own workarounds', '');
  if (!report.overrides.length) L.push('- None recorded (orion.json "overrides" and "Orion issue #N" comments).');
  for (const o of report.overrides) L.push(`- ${o.where}: ${o.what}${o.fixed ? ` **Issue ${o.issue} is fixed in ${o.fixed}: this workaround may now be unnecessary. Try the page without it; remove it only if the page checker and the screens agree.**` : o.issue ? ` (issue ${o.issue}: not marked fixed between ${FROM} and ${TO}; keep it)` : ''}`);
  L.push('', '## Page checker', '');
  L.push(report.check ? report.check : WRITE ? 'Not run.' : 'Runs after --write.');
  L.push('', '## Then', '', '1. Work through every review item above.', '2. Run the page checker on every page and look at its screenshots (390 dark, 1280 light).', '3. Commit with a message naming the versions, e.g. "Update to Orion ' + TO + '".', '4. Anything broken in Orion itself: log it (SKILL.md, "Found a problem in Orion?"), and put the workaround in the app\'s own stylesheet with an "Orion issue #N" comment.');
  return L.join('\n') + '\n';
}

if (WRITE) {
  for (const [rel, t] of Object.entries(edits)) writeFileSync(join(APP, rel), t);
  for (const [to, from] of writesBin) { mkdirSync(dirname(join(APP, to)), { recursive: true }); copyFileSync(from, join(APP, to)); }
  for (const rel of deletes) if (existsSync(join(APP, rel))) unlinkSync(join(APP, rel));
  writeFileSync(join(APP, 'orion.json'), jsonText);
  /* the page checker, when Playwright is there */
  if (!flag('--no-check') && src.checker && pages.length) {
    const out = join(tmpdir(), `orion-upgrade-check-${process.pid}`);
    const r = spawnSync(process.execPath, [src.checker, ...pages.map((p) => join(APP, p)), '--out', out], { encoding: 'utf8', timeout: 600000, cwd: APP });
    if (r.status === 2 || /Playwright is not installed/.test(r.stderr || '')) report.check = 'Playwright is not installed here, so the page checker did not run. Run it yourself: `node <skill>/scripts/check.mjs page.html`.';
    else {
      const summary = (r.stdout.trim().split('\n').pop() || '').trim();
      const problems = r.stdout.split('\n').filter((l) => /^\s+[✗!] /.test(l)).slice(0, 40);
      report.check = `\`node check.mjs ${pages.join(' ')}\`: ${summary}${problems.length ? '\n\n' + problems.map((l) => '    ' + l.trim()).join('\n') : ''}\n\nScreenshots: ${out}`;
      report.checkStatus = r.status;
    }
  }
  const reportFile = opt('--report') ? resolve(opt('--report')) : join(APP, 'orion-upgrade.md');
  writeFileSync(reportFile, markdown());
  report.reportFile = reportFile;
}
const md = markdown();
if (flag('--json')) console.log(JSON.stringify({ ...report, files: Object.fromEntries(Object.entries(report.files).map(([k, v]) => [k, [...v]])) }, null, 1));
else { console.log(md); if (WRITE) console.log(`Report written to ${report.reportFile}.`); }
process.exit(WRITE && report.checkStatus === 1 ? 1 : 0);
