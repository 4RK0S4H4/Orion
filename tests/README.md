# Production suite

`npm test` runs these (the first two are the long ones):

1. **`npm run test:suite`** (`tests/suite.mjs`): every component reference page, every template, the showcase, the
   hub and the tokens page, in **Chromium and WebKit** by default (Firefox too with `--browser`, see below), as a 390px dark phone and a 1280px light desktop, plus a
   reduced-motion pass over the templates and the showcase. On each page it checks the load (no errors, no failed
   requests, no sideways scroll, every icon drawn, no duplicate ids, every control named, every field labelled),
   focus rings (none cut off by a bar, a scrolling pane or the screen edge), touch targets (24px at 390), and then
   **uses the page**: opens and closes every dialog, panel, menu, expand, inline confirm, accordion, tab and date
   picker, visits every view. Overlays must fit the screen, close with Escape and give focus back; nothing may be left
   open or stuck mid-animation.
2. **`npm run test:pages`**: the skill's page checker (`skill/orion/scripts/check.mjs`) over the templates and the
   showcase: text contrast as rendered (on glass too), and lint of each page's own CSS.

3. **`npm run test:checker`** (`tests/checker.mjs`, decision 0067): known-bad pages in `tests/fixtures` (a table nothing
   stacks, a FAB straight in a rail, unknown dial values) must fail the page checker with the named message, and
   `S4.theme` with a value off a dial's list must warn and write nothing. A rule that no known-bad page fails is not a rule.
4. **`npm run test:reach`** also runs (decision 0073) `reflowz` (320 wide, text at 200% two ways: no sideways scroll, no split word, no control
   whose content sticks out of its box), `dirflip` (dir flipped after load: ink, tabs and nav highlight re-measure) and `long320` (long phrases and
   words in every trailing, meta and label slot at 320). `test:suite` clicks every popup opener and requires Escape to close it with focus on it,
   and runs every page with the clipboard refusing. `test:checker` proves each on a known-bad fixture.
   `test:suite` also runs `selectAudit` (decision 0078) in Chromium at 1280: every collection that selects several (a table with a select column,
   a multi-select tree or listbox, `data-selectable`), on a fresh copy of its page, is driven with click, Shift+click, Ctrl+click, Shift+Up,
   Ctrl+Down, Space, Escape, Ctrl+A, Shift+Space, Shift+Home and Shift+PageDown, and the selected set, the focus, the live region and
   `aria-selected` are checked after each; a single-select listbox or tree must ignore Shift+Down. With `SUITE_PROGRESS=1` it prints one
   `select …` line per collection.
5. **`npm run test:back`** (`tests/back.mjs`): Back from a page (the browser's Back and the top bar's) restores the
   view's scroll and returns focus to the opener, in the editor, the calendar and the Showcase, at 390 and a short desktop window.

6. **`npm run test:upgrade`** (`tests/upgrade.mjs`, decision 0075, a few seconds): a fixture app written against Orion 1.0.0
   (`tests/fixtures/upgrade/app-1.0`, with the real 1.0.0 files from `releases/1.0.0`) is upgraded to this version by
   `skill/orion/scripts/upgrade.mjs`: the dry run changes nothing, `--write` applies exactly the renames, replaces the vendored
   files, writes the stamp and `orion.json`, reports the judgment items and the fixed workaround, and the page checker is
   clean; a synthetic future major (`orion-3`) must turn `app-2` into `app-2.expected` byte for byte (look-alikes untouched);
   `scripts/check-api.mjs` must fail a public name that vanishes without a migration entry. `test:checker` also proves
   `bad-stamp.html` (a stamp that disagrees with the loaded files).

7. **`npm run test:network`** (`tests/network.mjs`, issue 107, about 30 seconds): every template, the Showcase, the hub and the brand
   trial are loaded in Chromium from a server that gzips text like a static host, and every request is recorded. It fails on one file
   fetched twice (the font preloaded with `?v=` and asked for again without it was review 5's N1), a failed request, and Orion files
   that transfer more than the page kind's budget in `scripts/budgets.mjs` (site total; lean bundle, font and icons; full bundle).

8. **Round 0066 additions to `test:suite`** (Chromium): `ringAudit` (issue 113: a focused table row's ring shows on all four sides,
   never under a pinned cell or the scroll-edge cue; also in the page checker, proven by `tests/fixtures/bad-row-ring.html`) on every
   desktop page and on Linnea left to right and right to left, light and dark; a scroll-edge cue on every table that hides columns to one
   side (decision 0083); Linnea at 1024, 1280 and 1600 (Status on screen without scrolling, folded columns in the Columns menu and a row's
   details, the cue when a kept column makes the table scroll); and in every app shell, one Tab reaches the skip link and Enter puts the
   focus on main, and in a desktop app F6, Shift+F6 and Ctrl+F6 move through the regions (decision 0084).

## WebKit and Firefox (round 0066, issue 116)

Both scripts take `--browser`: `node tests/suite.mjs --browser=webkit` (or `firefox`, or a list such as `chromium,webkit`), and
`node tests/reach.mjs --browser=firefox` (default `chromium`). Firefox gets no touch emulation (Playwright has none for it), so its
phone runs are a narrow window with a mouse.

CI (`.github/workflows/check.yml`): the blocking job `pages` runs the suite in **Chromium** (dial presets and the Chromium-only audits
included), the page checker and the other tests. The job **`browsers`** installs WebKit and Firefox on Ubuntu and runs, once per
engine, the whole suite without the dial presets (`--no-dials --shots`, every page at 390 dark, 1280 light and reduced motion) and
every reach pass. It is **non-blocking** (`continue-on-error: true`): a failure shows as a red step and uploads `tests/out` as
`suite-output-<browser>`, but does not stop publishing. Round 0067 triages what it finds and then makes the job blocking. Locally,
install the engines with `npx playwright install webkit firefox`.

Options: `node tests/suite.mjs --browser=chromium --only=list-detail --shots --workers=4`. Screenshots of failing
pages go to `tests/out/` (not committed).
A full run takes about 20 minutes and prints its problems only at the end: `SUITE_PROGRESS=1` writes one `run <browser> <mode>  <page>` line
to stderr per page run (the dial-preset phase is the long one), so a stall shows as a line that does not change. A browser that dies
mid-run is relaunched and the page it was on is run again; a page that kills it twice is reported as a failure.

Needs Playwright (`npm i --no-save playwright && npx playwright install chromium webkit`). CI runs it on every push
(`.github/workflows/check.yml`, job `pages` in Chromium, job `browsers` in WebKit and Firefox). A browser that is missing fails the run in CI and is skipped with a
warning elsewhere.

When a component gains a new kind of interaction, teach `use()` in `suite.mjs` to exercise it.
