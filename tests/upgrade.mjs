#!/usr/bin/env node
/* Upgrade proofs (decision 0075): "update to latest Orion" works with no guesswork, and a migration can't be forgotten.
   1. tests/fixtures/upgrade/app-1.0, a small app written against Orion 1.0.0 (old motion names, the old skill path and
      Pages address, an outlined button, an "Orion issue #70" workaround, no orion.json, no stamp), with the real 1.0.0
      files from releases/1.0.0 vendored, is upgraded to this repo's version: the dry run changes nothing; --write
      applies exactly the renames (every other byte is the same), replaces the vendored files with today's, writes the
      stamp and orion.json, lists the judgment items and the fixed workaround, and the page checker is clean. A second
      run finds nothing to do.
   2. tests/fixtures/upgrade/app-2 (stamped 1.2.0, a URL and a vendored file) is upgraded to a synthetic future major
      version (tests/fixtures/upgrade/orion-3: one rename of every kind, a removal, a redraw) and must equal
      tests/fixtures/upgrade/app-2.expected byte for byte: look-alikes (s4-chip-set, a word in a paragraph,
      data-variant="elevated-ish", --s4-gap-large, window.S4.snackbarLog) are untouched; the URL pins to releases/3.0.0.
   3. An app with no version anywhere counts as 1.0.0 and says so; a URL is never pinned to a version with no release.
   4. scripts/check-api.mjs fails a public name that disappears without a migration entry and a rename to a missing
      name, and passes once the entry is there.
   Usage: node tests/upgrade.mjs (the checker part needs Playwright; without it that one assertion is skipped). */
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, cpSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fx = join(root, 'tests/fixtures/upgrade'), out = join(root, 'tests/out/upgrade');
const script = join(root, 'skill/orion/scripts/upgrade.mjs');
const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
const fails = [];
const expect = (ok, what) => { if (!ok) fails.push(what); console.log(`  ${ok ? '✓' : '✗'} ${what}`); };
const run = (args, opts = {}) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', timeout: 600000, ...opts });
const hashDir = (d) => { const h = createHash('sha1'); const walk = (p) => { for (const n of readdirSync(p).sort()) { const f = join(p, n); if (statSync(f).isDirectory()) walk(f); else h.update(relative(d, f)).update(readFileSync(f)); } }; walk(d); return h.digest('hex'); };
const text = (p) => readFileSync(p, 'utf8');
rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true });

/* ---------- 1. a 1.0.0 app to this version ---------- */
console.log(`a 1.0.0 app upgraded to ${version}`);
const app1 = join(out, 'app-1.0');
cpSync(join(fx, 'app-1.0'), app1, { recursive: true });
mkdirSync(join(app1, 'vendor'));
for (const f of ['orion.css', 'orion.js', 'icons.js', 'm3color.js', 'inter-variable.woff2']) cpSync(join(root, 'releases/1.0.0', f), join(app1, 'vendor', f));
const before = hashDir(app1);
const dry = run([app1, '--json']);
const dryR = JSON.parse(dry.stdout || '{}');
expect(dry.status === 0 && hashDir(app1) === before, 'the dry run changes nothing');
expect(dryR.from === '1.0.0' && !dryR.assumed && dryR.versionsFound.some(([v, w]) => v === '1.0.0' && /vendor\/orion\.css \(banner\)/.test(w)), 'the version comes from the vendored files\' 1.0.0 banners');
const wr = run([app1, '--write', '--json']);
const R = JSON.parse(wr.stdout || '{}');
expect(wr.status === 0, `--write exits 0 (exit ${wr.status}${wr.stderr ? ': ' + wr.stderr.trim().split('\n').pop() : ''})`);
const orig = (f) => text(join(fx, 'app-1.0', f));
const want = {
  'app.js': orig('app.js').replace('S4.transition.drop(', 'S4.transition.follow(').replace('S4.transition.slide(', 'S4.transition.pop(').replace('S4.transition.unfold(', 'S4.transition.follow('),
  'README.md': orig('README.md').replace('skill/s4-orion/', 'skill/orion/').replace('`s4-orion.skill`', '`orion.skill`').replace('https://4rk0s4h4.github.io/s4-orion/', 'https://4rk0s4h4.github.io/Orion/').replace('https://github.com/4RK0S4H4/s4-orion', 'https://github.com/4RK0S4H4/Orion'),
  'index.html': orig('index.html').replace('<meta charset="utf-8">', `<meta charset="utf-8">\n<meta name="orion" content="${version}">`),
  'app.css': orig('app.css'),
};
for (const [f, t] of Object.entries(want)) expect(text(join(app1, f)) === t, `${f}: exactly the expected renames and nothing else`);
expect(/S4\.transition\.dropdown is not an Orion name/.test(text(join(app1, 'app.js'))) && /\.s4-orion-crumbs/.test(text(join(app1, 'app.css'))), 'look-alikes (S4.transition.dropdown, .s4-orion-crumbs) untouched');
const assets = join(root, 'skill/orion/assets');
expect(['orion.css', 'orion.js', 'icons.js', 'm3color.js', 'inter-variable.woff2'].every((f) => readFileSync(join(app1, 'vendor', f)).equals(readFileSync(join(assets, f)))), `vendored files replaced with ${version}'s`);
const oj = JSON.parse(text(join(app1, 'orion.json')));
expect(oj.orion === version && oj.pages.join() === 'index.html' && oj.load.files.includes('vendor/orion.css') && oj.load.bundle === 'full', `orion.json says ${version}, the page and the vendored files`);
const md = existsSync(join(app1, 'orion-upgrade.md')) ? text(join(app1, 'orion-upgrade.md')) : '';
expect(/# Orion upgrade: 1\.0\.0 to /.test(md) && /\*\*1\.1\.0\*\*/.test(md) && /\*\*1\.2\.0\*\*/.test(md), 'the report lists both steps');
expect(/S4\.transition\.containerTransform is deprecated\*\* \(1\.2\.0, decision \[0046\]\([^)]+0046-one-motion-philosophy\.md\)\)[^\n]*Places: app\.js:11/.test(md), 'the report lists a judgment item with its decision link and place');
expect(/\*\*Nothing is outlined\*\*[^\n]*Places: index\.html:29/.test(md), 'the report finds the outlined button');
expect(/app\.css:6: [^\n]*Orion issue #70[^\n]*Issue 70 is fixed in 1\.2\.0: this workaround may now be unnecessary/.test(md), 'the report flags the workaround whose issue is fixed, and leaves it in place');
if (R.check && /Playwright is not installed/.test(R.check)) console.log('  ! Playwright is not installed: the page checker part is skipped');
else expect(/0 error\(s\)/.test(R.check || '') && R.checkStatus === 0, `the page checker is clean after the upgrade (${(R.check || 'not run').split('\n')[0]})`);
const again = JSON.parse(run([app1, '--json']).stdout || '{}');
expect(again.from === version && Object.keys(again.files).length === 0 && again.replaced.length === 0, 'a second run finds nothing to do');

/* ---------- 2. a synthetic future major version ---------- */
console.log('a 1.2.0 app upgraded to a synthetic 3.0.0');
const app2 = join(out, 'app-2');
cpSync(join(fx, 'app-2'), app2, { recursive: true });
const w2 = run([app2, '--source', join(fx, 'orion-3'), '--write', '--no-check', '--json']);
const R2 = JSON.parse(w2.stdout || '{}');
expect(w2.status === 0 && R2.from === '1.2.0' && R2.to === '3.0.0', 'upgrades 1.2.0 to 3.0.0');
for (const f of ['index.html', 'app.css', 'app.js', 'orion.json', 'vendor/orion.js']) expect(text(join(app2, f)) === text(join(fx, 'app-2.expected', f)), `${f} equals app-2.expected/${f}`);
const md2 = text(join(app2, 'orion-upgrade.md'));
expect(/\*\*Major version 3\.0\.0: how things should look changed\.\*\*[^\n]*decision 0053/.test(md2), 'a major version says to redraw and keep every screen (decision 0053)');
expect(/\*\*class s4-skeleton\*\*[^\n]*Found at index\.html:24/.test(md2), 'a removal is listed with its place, never applied');
expect(/\[ \] \*\*Cards are drawn flat\*\*[^\n]*Places: index\.html:25/.test(md2), 'the judgment item is listed with its place');
expect(/Issue 101 is fixed in 3\.0\.0/.test(md2) && /issue 7: not marked fixed/.test(md2), 'workarounds: the fixed one is flagged, the open one kept');

/* ---------- 3. no version; URLs never pin to an unpublished version ---------- */
console.log('an app with no version, loading Orion from an address');
const app3 = join(out, 'app-url');
mkdirSync(app3);
writeFileSync(join(app3, 'index.html'), '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<title>Old</title>\n<link rel="stylesheet" href="https://4rk0s4h4.github.io/s4-orion/components/orion.css">\n</head>\n<body><main class="s4-content"><p>Hello</p></main>\n<script src="https://4rk0s4h4.github.io/s4-orion/components/orion.js"></script>\n</body>\n</html>\n');
const R3 = JSON.parse(run([app3, '--source', root, '--to', '1.1.0', '--json']).stdout || '{}');
expect(R3.assumed === true && R3.from === '1.0.0', 'no version anywhere: treated as 1.0.0 and reported');
expect(R3.urls.length === 2 && R3.urls.every((u) => /→ https:\/\/4rk0s4h4\.github\.io\/Orion\/releases\/1\.1\.0\/orion\.min\.(css|js)$/.test(u)), 'URLs pin to an exact release (releases/1.1.0, the minified copies)');
const released = JSON.parse(text(join(root, 'releases/index.json'))).versions;
if (!released[version]) {
  const R4 = JSON.parse(run([app3, '--source', root, '--json']).stdout || '{}');
  expect(R4.urls.length === 0 && R4.blocked.some((b) => /has no published release/.test(b)), `${version} is not released yet: URLs are left alone and the report says so`);
}

/* ---------- 4. migrations are complete ---------- */
console.log('check-api fails a public name that disappears without a migration');
const api = JSON.parse(text(join(root, 'releases/1.1.0/api.json')));
api.classes.push('s4-gone'); api.tokens.push('--s4-gone');
writeFileSync(join(out, 'api-gone.json'), JSON.stringify(api));
const ck = (args) => spawnSync(process.execPath, [join(root, 'scripts/check-api.mjs'), ...args], { encoding: 'utf8' });
const c1 = ck(['--base', join(out, 'api-gone.json')]);
expect(c1.status === 1 && /class s4-gone is in the 1\.1\.0 API but not in this build/.test(c1.stderr) && /token --s4-gone/.test(c1.stderr), 'a vanished class and token fail with their names');
const migs = join(out, 'migrations');
cpSync(join(root, 'migrations'), migs, { recursive: true });
const m12 = JSON.parse(text(join(migs, `${version}.json`)));
m12.removals.push({ kind: 'class', name: 's4-gone', what: 'nothing' }, { kind: 'token', name: '--s4-gone', what: 'nothing' });
writeFileSync(join(migs, `${version}.json`), JSON.stringify(m12));
const c2 = ck(['--base', join(out, 'api-gone.json'), '--migrations', migs]);
expect(c2.status === 0, `with removal entries in migrations/${version}.json it passes (exit ${c2.status} ${c2.stderr.trim().split('\n')[0] || ''})`);
m12.removals = []; m12.renames.push({ kind: 'class', from: 's4-gone', to: 's4-nowhere' }, { kind: 'token', from: '--s4-gone', to: '--s4-space-2' });
writeFileSync(join(migs, `${version}.json`), JSON.stringify(m12));
const c3 = ck(['--base', join(out, 'api-gone.json'), '--migrations', migs]);
expect(c3.status === 1 && /renames class s4-gone to s4-nowhere, which this build does not have/.test(c3.stderr) && !/token --s4-gone is in/.test(c3.stderr), 'a rename to a missing name fails; a rename to a real one passes');
m12.renames = m12.renames.filter((r) => r.kind !== 'skill' && !/gone/.test(r.from));
writeFileSync(join(migs, `${version}.json`), JSON.stringify(m12));
const c4 = ck(['--migrations', migs]);
expect(c4.status === 1 && /skill s4-orion is in the 1\.1\.0 API/.test(c4.stderr), 'the real 1.2.0 skill rename is required: dropping its entry fails');

console.log(fails.length ? `\n${fails.length} upgrade proof(s) failed.` : '\nAll upgrade proofs hold.');
process.exit(fails.length ? 1 : 0);
