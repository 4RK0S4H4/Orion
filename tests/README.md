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
2. **`npm run test:pages`**: the skill's page checker (`skill/s4-orion/scripts/check.mjs`) over the templates and the
   showcase: text contrast as rendered (on glass too), and lint of each page's own CSS.

3. **`npm run test:checker`** (`tests/checker.mjs`, decision 0067): known-bad pages in `tests/fixtures` (a table nothing
   stacks, a FAB straight in a rail, unknown dial values) must fail the page checker with the named message, and
   `S4.theme` with a value off a dial's list must warn and write nothing. A rule that no known-bad page fails is not a rule.
4. **`npm run test:back`** (`tests/back.mjs`): Back from a page (the browser's Back and the top bar's) restores the
   view's scroll and returns focus to the opener, in the editor, the calendar and the Showcase, at 390 and a short desktop window.

Options: `node tests/suite.mjs --browser=chromium --only=list-detail --shots --workers=4`. Screenshots of failing
pages go to `tests/out/` (not committed).

Needs Playwright (`npm i --no-save playwright && npx playwright install chromium webkit`). CI runs it on every push
(`.github/workflows/check.yml`, job `pages`). A browser that is missing fails the run in CI and is skipped with a
warning elsewhere.

When a component gains a new kind of interaction, teach `use()` in `suite.mjs` to exercise it.
