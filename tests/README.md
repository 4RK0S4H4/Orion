# Production suite

`npm test` runs these (the first two are the long ones):

1. **`npm run test:suite`** (`tests/suite.mjs`): every component reference page, every template, the showcase, the
   hub and the tokens page, in **Chromium and WebKit**, as a 390px dark phone and a 1280px light desktop, plus a
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
5. **`npm run test:back`** (`tests/back.mjs`): Back from a page (the browser's Back and the top bar's) restores the
   view's scroll and returns focus to the opener, in the editor, the calendar and the Showcase, at 390 and a short desktop window.

6. **`npm run test:upgrade`** (`tests/upgrade.mjs`, decision 0075, a few seconds): a fixture app written against Orion 1.0.0
   (`tests/fixtures/upgrade/app-1.0`, with the real 1.0.0 files from `releases/1.0.0`) is upgraded to this version by
   `skill/orion/scripts/upgrade.mjs`: the dry run changes nothing, `--write` applies exactly the renames, replaces the vendored
   files, writes the stamp and `orion.json`, reports the judgment items and the fixed workaround, and the page checker is
   clean; a synthetic future major (`orion-3`) must turn `app-2` into `app-2.expected` byte for byte (look-alikes untouched);
   `scripts/check-api.mjs` must fail a public name that vanishes without a migration entry. `test:checker` also proves
   `bad-stamp.html` (a stamp that disagrees with the loaded files).

Options: `node tests/suite.mjs --browser=chromium --only=list-detail --shots --workers=4`. Screenshots of failing
pages go to `tests/out/` (not committed).

Needs Playwright (`npm i --no-save playwright && npx playwright install chromium webkit`). CI runs it on every push
(`.github/workflows/check.yml`, job `pages`). A browser that is missing fails the run in CI and is skipped with a
warning elsewhere.

When a component gains a new kind of interaction, teach `use()` in `suite.mjs` to exercise it.
