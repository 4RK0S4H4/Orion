#!/usr/bin/env node
/* Orion checker proofs (round 0059, decision 0067): a rule is only a rule if a known-bad page fails it. Runs the page
   checker (skill/orion/scripts/check.mjs) over the pages in tests/fixtures and expects each to fail with the named
   message, so the claim "the checker catches it" is regression tested; then proves the dial values at runtime:
   S4.theme with a value off a dial's list warns, names the allowed values and writes nothing; every key in S4.theme.keys takes every
   value S4.theme.dials lists, and a seed that is no color, a bad surfaces and an unknown key warn and change nothing (issue 108).
     bad-words.html     a table nothing wraps or stacks, squeezed at 390 until its words break across lines
     bad-fab-rail.html  a .s4-fab straight in .s4-nav-rail, squeezed to a box one glyph wide
     bad-nav-pill.html  five destinations at 390 with the highlight's corner at half its height: a circle "Settings" pokes out of
     bad-dial.html      data-scale="roomy" and data-corners="square" on <html>
     bad-icons.html     a lean page that loads icons.js (every set) without switching sets (issue 109)
     bad-nav-hover.html / bad-nav-hover-box.html  a tab's hover layer that is the icon chip, or narrower than the selected highlight (issue 81)
     bad-rail-motion.html  a rail whose labels follow its moving edge and wrap mid-motion (issue 70)
     bad-window-controls.html  small window controls with a gap to the window's top and end edges (decision 0072)
     bad-window-inset.html     Close's layer nearer the window's end edge than its top edge, Minimize inset differently (decision 0077)
     bad-clipboard.html a bare clipboard.writeText (page checker and npm run check:clipboard; decision 0073)
     bad-swipe.html, bad-grip.html  a swipe action nothing can focus, a column grip covered by the next header (decision 0076)
     bad-select.html                a multi-select listbox and grid that the selection model does not drive (decision 0078)
     bad-clipboard-marker.html  a second call under the helper's exemption marker (decision 0076)
     bad-overfull.html  a control whose label is wider than its box (decision 0073)
     bad-row-ring.html  a focused data-table row drawn with the row's own outline, under its pinned cells (issue 113)
     bad-glow.html      a glass glow turned up to 40% of the surface's height on a FAB and a toolbar (decision 0080)
     bad-nav-200.html, bad-dirflip.html, bad-long-slot.html  proofs for the reach passes reflowz, dirflip and long320 (decision 0073)
     bad-stamp.html     <meta name="orion"> says 0.9.0 but the page loads this version (decision 0075)
     loud-screen.html   two filled actions and a pressed "All" chip on one screen (a warning, decision 0070)
     loud-selection.html  the rail's place, an accent list row and an Ink Track painted back in the accent (a warning, decision 0082)
   Usage: node tests/checker.mjs */
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, resolve } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fails = [];
const expect = (ok, what) => { if (!ok) fails.push(what); console.log(`  ${ok ? '✓' : '✗'} ${what}`); };

/* 1. known-bad pages must fail the checker with the right message */
const CASES = [
  ['bad-words.html', /breaks across lines/, 'a word split across lines'],
  ['bad-fab-rail.html', /breaks across lines in div\.s4-nav-rail-items/, 'a rail label squeezed by a FAB straight in the rail'],
  ['bad-fab-rail.html', /"Add Bill" is squeezed into a box \d+px wide, one glyph/, 'a box one glyph wide'],
  ['bad-nav-pill.html', /the nav bar's highlight on "Settings" is a circle, not a rounded rectangle/, 'a nav bar highlight drawn as a circle'],
  ['bad-nav-pill.html', /the label "Settings" sticks out of the nav bar's highlight/, 'a nav label poking out of its highlight'],
  ['bad-nav-hover.html', /the state layer of "Settings" is the icon's own chip/, 'a nav tab hover layer drawn as the icon chip'],
  ['bad-nav-hover-box.html', /the hover layer of "Settings" is \d+x\d+ at -?\d+,-?\d+ from the selected highlight/, 'a nav tab hover layer narrower than the selected highlight'],
  ['bad-clipboard.html', /calls clipboard\.writeText directly; use S4\.util\.copy/, 'a bare clipboard.writeText call'],
  ['bad-clipboard-marker.html', /calls clipboard\.writeText directly; use S4\.util\.copy/, 'a second call under the helper\'s exemption marker'],
  ['bad-swipe.html', /a swipe action that cannot take focus[^\n]*decision 0076/, 'a swipe action hidden until swiped (no keyboard path)'],
  ['bad-select.html', /div#bs-tags: a collection that selects several that Orion's selection model does not drive[^\n]*decision 0078/, 'a multi-select listbox written by hand (no Shift, Ctrl+A or Escape)'],
  ['bad-select.html', /table\.bs-grid: a collection that selects several that Orion's selection model does not drive/, 'a hand-made grid that says aria-multiselectable'],
  ['bad-grip.html', /the column grip is covered at \d+% of its width by [^\n]*, so the border cannot be grabbed/, 'a column grip that overhangs under the next header'],
  ['bad-overfull.html', /button\.s4-button\.bf-day holds \d+px of content in a 28px box, \d+px past its (start|end) edge \("1000"\)/, 'a button whose label is wider than its box'],
  ['bad-glow.html', /the glass glow on [^\n]*button\.s4-fab reaches 12\.0px into a 56px surface, more than 15% of its height[^\n]*decision 0080/, 'a glow deeper than 15% of a FAB'],
  ['bad-glow.html', /the glass glow on [^\n]*div\.s4-toolbar reaches 12\.0px into a 64px surface/, 'a glow deeper than 15% of a toolbar'],
  ['bad-icons.html', /lean bundle: the page loads icons\.js \(every icon set\) but never switches sets; load icons-app\.js/, 'a lean page that loads every icon set (issue 109)'],
  ['bad-dial.html', /data-scale="roomy" is not a value of that dial; use default, compact or large/, 'an unknown data-scale value'],
  ['bad-stamp.html', /this page is stamped Orion 0\.9\.0 \(meta name="orion"\) but loads Orion \d+\.\d+\.\d+/, 'a stamp that disagrees with the loaded files'],
  ['bad-dial.html', /data-corners="square" is not a value of that dial; use round, soft or firm/, 'an unknown data-corners value'],
  ['bad-rail-motion.html', /mid-motion \(rail [a-z ]+, (25|50|75)%\): "(Scripts|Starred|Translations)" breaks across lines/, 'rail labels that wrap while the rail widens'],
  ['bad-window-controls.html', /window control "Close" is 32x28, \d+px below the top of a 40px title bar/, 'a window control smaller than a full cell'],
  ['bad-window-controls.html', /Close stops 12px short of the title bar's right edge/, 'Close short of the window edge'],
  ['bad-window-controls.html', /the title bar's top right corner pixel hits header\.s4-titlebar, not Close/, 'the corner pixel misses Close'],
  ['bad-row-ring.html', /the focused row's ring in #br-records "Records" is missing on its left side: the row's outline is under the pinned cell/, 'a focused row whose ring sits under its pinned cells (issue 113)'],
  ['bad-window-inset.html', /Close's hover layer is 4\.0px from the title bar's top edge and 2\.0px from its right edge/, 'Close\'s layer nearer the end edge than the top edge'],
  ['bad-window-inset.html', /the hover layer of window control "Minimize" is inset differently from Close's/, 'a control inset differently from Close'],
];
const ran = {};
console.log('known-bad pages fail the page checker');
for (const [file, re, what] of CASES) {
  if (!ran[file]) ran[file] = spawnSync(process.execPath, [join(root, 'skill/orion/scripts/check.mjs'), join(root, 'tests/fixtures', file), '--out', join(root, 'tests/out/checker')], { encoding: 'utf8', timeout: 120000 });
  const r = ran[file];
  expect(r.status === 1 && re.test(r.stdout), `${file}: ${what} is an error (exit ${r.status})`);
}

/* 1b. known-loud pages pass but warn with the right message */
const WARN_CASES = [
  ['loud-screen.html', /more than one filled action on one screen at rest \(decision 0070[^\n]*3 accent fills: "All", "Next Untranslated", "Approve"/, 'two filled actions and a pressed All chip'],
  ['loud-selection.html', /more than one accent selection on one screen at rest \(decisions 0070, 0082[^\n]*3 accent selections: "Notes", "Month", "Shopping"/, 'three accent selections, an Ink Track among them'],
];
for (const [file, re, what] of WARN_CASES) {
  const r = spawnSync(process.execPath, [join(root, 'skill/orion/scripts/check.mjs'), join(root, 'tests/fixtures', file), '--out', join(root, 'tests/out/checker')], { encoding: 'utf8', timeout: 120000 });
  expect(re.test(r.stdout), `${file}: ${what} is a warning (exit ${r.status})`);
}

/* 1c. the repo-wide clipboard lint, and the reach passes that need a known-bad page (decision 0073) */
console.log('clipboard lint and reach passes fail known-bad pages');
const clip = spawnSync(process.execPath, [join(root, 'scripts/check-clipboard.mjs'), join(root, 'tests/fixtures/bad-clipboard.html')], { encoding: 'utf8' });
expect(clip.status === 1 && /bad-clipboard\.html:\d+: .*writeText/.test(clip.stderr), `check:clipboard fails a bare writeText (exit ${clip.status})`);
const clipMark = spawnSync(process.execPath, [join(root, 'scripts/check-clipboard.mjs'), join(root, 'tests/fixtures/bad-clipboard-marker.html')], { encoding: 'utf8' });
expect(clipMark.status === 1 && /bad-clipboard-marker\.html:19/.test(clipMark.stderr), `check:clipboard exempts only the first marked call, in one file (exit ${clipMark.status})`);
const clipOk = spawnSync(process.execPath, [join(root, 'scripts/check-clipboard.mjs')], { encoding: 'utf8' });
expect(clipOk.status === 0, `check:clipboard passes the repo (exit ${clipOk.status})`);
const REACH = [
  ['reflowz', 'bad-nav-200.html', /text size 200%\] "(Preferences|Reports|Budgets)" breaks across lines/, 'nav labels that split at 200% text on a 320 screen'],
  ['dirflip', 'bad-dirflip.html', /the Ink Track pill is \d+px from its selected option after dir changed/, 'an ink that is not measured again when dir flips'],
  ['long320', 'bad-long-slot.html', /long text in a slot: sideways scroll/, 'a trailing slot that widens the page with a long phrase'],
];
for (const [pass, file, re, what] of REACH) {
  const r = spawnSync(process.execPath, [join(root, 'tests/reach.mjs'), `--pass=${pass}`, `--file=tests/fixtures/${file}`], { encoding: 'utf8', timeout: 120000 });
  expect(r.status === 1 && re.test(r.stderr + r.stdout), `reach ${pass}: ${file}: ${what} is an error (exit ${r.status})`);
}

/* 2. dial values at runtime */
let pw;
try { pw = await import('playwright'); } catch { try { pw = createRequire(resolve('x.js'))('playwright'); } catch { pw = createRequire(import.meta.url)('playwright'); } }
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.json': 'application/json' };
const server = createServer((req, res) => {
  const file = join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' }); res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const browser = await pw.chromium.launch();
const page = await browser.newPage();
const warns = [];
page.on('console', (m) => { if (m.type() === 'warning') warns.push(m.text()); });
await page.goto(`http://127.0.0.1:${server.address().port}/components/base/themes.html`, { waitUntil: 'load' });
await page.waitForTimeout(400);
console.log('S4.theme validates dial values');
const BAD = { scale: 'roomy', corners: 'square', gray: 'neutral', page: 'tinted', energy: 'wild', headings: 'huge', displayWeight: 'bold', mode: 'sepia', variant: 'pastel', contrast: 3 };
const ATTR = { scale: 'data-scale', corners: 'data-corners', gray: 'data-gray', page: 'data-page', energy: 'data-energy', headings: 'data-headings', displayWeight: 'data-type-display-weight', mode: 'data-theme', variant: 'data-accent-variant', contrast: 'data-contrast' };
for (const [key, val] of Object.entries(BAD)) {
  warns.length = 0;
  const wrote = await page.evaluate(([k, v, a]) => { S4.theme({ [k]: v }); return document.documentElement.getAttribute(a); }, [key, val, ATTR[key]]);
  expect(wrote !== String(val) && !(key === 'contrast' && wrote === 'high'), `${key}: "${val}" is not written to <html> (found ${JSON.stringify(wrote)})`);
  expect(warns.some((w) => /^S4: theme /.test(w) && w.includes(`"${val}"`) && /use .+\./.test(w)), `${key}: "${val}" warns and names the allowed values`);
}
/* every value a dial lists is accepted without a warning (decision 0076: the list is the contract; contrast listed words S4.theme refused) */
{
  const listed = await page.evaluate(() => { const w = []; const real = console.warn; console.warn = (m) => w.push(String(m)); const out = []; const D = S4.theme.dials; const KEY = { 'data-contrast': 'contrast', 'data-theme': 'mode', 'data-accent-variant': 'variant', 'data-corners': 'corners', 'data-gray': 'gray', 'data-page': 'page', 'data-energy': 'energy', 'data-scale': 'scale', 'data-headings': 'headings', 'data-surfaces': 'surfaces' }; for (const attr of Object.keys(KEY)) for (const v of D[attr] || []) { w.length = 0; S4.theme({ [KEY[attr]]: v }); if (w.some((m) => /^S4: theme /.test(m))) out.push(attr + '=' + v); } console.warn = real; S4.theme({ contrast: 0, mode: 'system', corners: 'round', gray: 'pure', page: 'plain', energy: 'standard', scale: 'default', headings: 'default', variant: 'auto', surfaces: 'neutral' }); return out; });
  expect(listed.length === 0, `every value a dial lists is accepted by S4.theme (refused: ${listed.join(', ') || 'none'})`);
}
/* issue 108: every key, every bad-value case. S4.theme.keys names each key and its attribute; every dial in S4.theme.dials has a
   key; every listed value of every key is accepted, written, and read back by S4.theme(); a value off the list, a seed that is no
   color, a bad surfaces and an unknown key each warn, saying what is expected, and change nothing (attributes, the color block) */
{
  const r = await page.evaluate(() => {
    const w = []; const real = console.warn; console.warn = (m) => w.push(String(m));
    const K = S4.theme.keys, D = S4.theme.dials, h = document.documentElement, out = { missing: [], refused: [], unwritten: [], unread: [] };
    for (const a of Object.keys(D)) if (!Object.values(K).includes(a)) out.missing.push(a);
    const reset = { mode: 'system', contrast: 0, corners: 'round', gray: 'pure', page: 'plain', energy: 'standard', scale: 'default', headings: 'default', density: 'comfortable', buttons: 'filled', cards: 'elevated', lists: 'plain', rail: 'auto', displayWeight: 'semibold', display: 'inter', text: 'inter', variant: 'auto', surfaces: 'neutral' };
    for (const [key, attr] of Object.entries(K)) {
      if (key === 'seed') continue;
      for (const v of D[attr] || []) {
        if (v === 'custom') continue;
        w.length = 0; const got = S4.theme({ [key]: v });
        if (w.some((m) => /^S4: theme /.test(m))) out.refused.push(key + '=' + v);
        const at = h.getAttribute(attr), base = reset[key];
        const shown = key === 'contrast' ? ['standard', 'medium', 'high'][Math.round(got.contrast * 2)] : got[key];
        if (key !== 'contrast' && key !== 'variant' && key !== 'surfaces' && v !== base && v !== 'system' && at !== v) out.unwritten.push(`${key}=${v} wrote ${at}`);
        if (String(shown) !== String(v) && !(key === 'mode' && v === 'system')) out.unread.push(`${key}=${v} reads ${shown}`);
      }
      S4.theme(reset);
    }
    console.warn = real; return out;
  });
  expect(r.missing.length === 0, `every dial in S4.theme.dials is a key of S4.theme (missing: ${r.missing.join(', ') || 'none'})`);
  expect(r.refused.length === 0, `every listed value of every key is accepted (refused: ${r.refused.join(', ') || 'none'})`);
  expect(r.unwritten.length === 0, `every listed value is written to <html> (${r.unwritten.join('; ') || 'all written'})`);
  expect(r.unread.length === 0, `S4.theme() reads every value back (${r.unread.join('; ') || 'all read'})`);
  const density = await page.evaluate(() => { S4.theme({ density: 'roomy' }); const a = document.documentElement.getAttribute('data-density'); S4.theme({ density: 'comfortable' }); return [a, document.documentElement.getAttribute('data-density')]; });
  expect(density[0] === 'roomy' && density[1] === null, `density roomy is written and comfortable removes it (${density.join(', ')})`);
  const CASES = [
    [{ density: 'tight' }, /density "tight" ignored .*use comfortable, compact, auto or roomy/, 'data-density'],
    [{ seed: 'notacolor' }, /seed "notacolor" ignored .*#rrggbb or an accent name: mono, blue/, null],
    [{ seed: '#zzz' }, /seed "#zzz" ignored .*#rrggbb/, null],
    [{ seed: '#12' }, /seed "#12" ignored/, null],
    [{ seed: 42 }, /seed "42" ignored/, null],
    [{ surfaces: 'glossy' }, /surfaces "glossy" ignored .*use neutral or tinted/, 'data-surfaces'],
    [{ accent: '#12' }, /key "accent" ignored; use seed instead\. S4\.theme takes mode, seed/, null],
    [{ icons: 'fontawesome' }, /key "icons" ignored; use S4\.icon\.use/, null],
    [{ sparkle: true }, /key "sparkle" ignored; S4\.theme takes .*density.* or save\./, null],
    [{ buttons: 'outlined' }, /buttons "outlined" ignored .*use filled or tonal/, 'data-buttons'],
    [{ rail: 'wide' }, /rail "wide" ignored .*auto, expanded or collapsed/, 'data-rail'],
  ];
  for (const [opts, re, attr] of CASES) {
    warns.length = 0;
    const res = await page.evaluate(([o, a]) => {
      const h = document.documentElement, before = { attrs: [...h.attributes].map((x) => x.name + '=' + x.value).join(' '), color: (document.getElementById('s4-dynamic-color') || {}).textContent || '', primary: getComputedStyle(h).getPropertyValue('--md-sys-color-primary') };
      S4.theme(o);
      return new Promise((r) => setTimeout(() => r({ same: before.attrs === [...h.attributes].map((x) => x.name + '=' + x.value).join(' ') && before.color === ((document.getElementById('s4-dynamic-color') || {}).textContent || '') && before.primary === getComputedStyle(h).getPropertyValue('--md-sys-color-primary'), attr: a ? h.getAttribute(a) : null }), 300));
    }, [opts, attr]);
    const label = JSON.stringify(opts);
    expect(res.same, `${label} changes nothing on the page`);
    expect(warns.some((w) => re.test(w)), `${label} warns (${re}); got ${JSON.stringify(warns.filter((w) => /^S4/.test(w)).slice(0, 2))}`);
  }
  warns.length = 0;
  const seeds = await page.evaluate(() => { const r = []; for (const v of ['blue', 'Teal', '#0B57D0', 'mono', null]) { S4.theme({ seed: v }); r.push(S4.theme().seed); } return r; });
  expect(!warns.some((w) => /^S4: theme/.test(w)) && seeds[0] === '#0b57d0' && seeds[2] === '#0B57D0' && seeds[3] === null && seeds[4] === null, `a named accent, #rrggbb, mono and null are accepted (${JSON.stringify(seeds)})`);
  /* on a container: the same checks, and the page-wide keys say so */
  warns.length = 0;
  const box = await page.evaluate(() => { const d = document.createElement('div'); document.body.appendChild(d); S4.theme({ density: 'compact', seed: 'nope', surfaces: 'shiny', contrast: 1, accent: 'red' }, d); return [...d.attributes].map((x) => x.name + '=' + x.value).join(' '); });
  expect(box === 'data-density=compact', `a container takes density and drops the bad seed, surfaces, contrast and accent (${box})`);
  for (const re of [/seed "nope" ignored/, /surfaces "shiny" ignored/, /contrast is page-wide/, /key "accent" ignored/]) expect(warns.some((w) => re.test(w)), `a container warns: ${re}`);
}
/* the same on a container, and the good values still work */
warns.length = 0;
const el = await page.evaluate(() => { const d = document.createElement('div'); document.body.appendChild(d); S4.theme({ scale: 'cozy', corners: 'firm' }, d); return { scale: d.getAttribute('data-scale'), corners: d.getAttribute('data-corners') }; });
expect(el.scale === null && el.corners === 'firm', `a container: bad scale not written, good corners written (${JSON.stringify(el)})`);
expect(warns.some((w) => /scale "cozy"/.test(w)), 'a container: the bad scale warns');
const good = await page.evaluate(() => { S4.theme({ scale: 'large', headings: 'editorial', energy: 'calm' }); const h = document.documentElement; const r = [h.dataset.scale, h.dataset.headings, h.dataset.energy]; S4.theme({ scale: 'default', headings: 'default', energy: 'standard' }); return r; });
expect(good.join() === 'large,editorial,calm', `good values are written (${good.join()})`);
/* markup: an unknown value in the page is reported by S4.theme.audit and warned about when it is set later */
warns.length = 0;
const audit = await page.evaluate(() => { const d = document.createElement('section'); document.body.appendChild(d); d.setAttribute('data-energy', 'frantic'); return S4.theme.audit(); });
expect(audit.some((m) => /data-energy="frantic"/.test(m) && /calm, standard or lively/.test(m)), 'S4.theme.audit lists an unknown data-energy in the markup');
await page.waitForTimeout(100);
expect(warns.some((m) => /data-energy="frantic"/.test(m)), 'an unknown dial attribute set on an element warns');
await browser.close(); server.close();

console.log(fails.length ? `\n${fails.length} checker proof(s) failed.` : '\nChecker proofs passed.');
process.exit(fails.length ? 1 : 0);
