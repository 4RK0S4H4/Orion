# Round 0059, workstream B (branch `round59/b`, decision 0068)

Review 3's Top 10 items 6 to 9. Calls recorded in [`decisions/0068`](../../decisions/0068-one-accent-fill-per-region-wide-windows-site-icons.md).
Screenshots at 390 dark, 1280 light and 1600 light of every touched page were taken and looked at (zero horizontal
overflow, zero page errors): desktop-app, docs, dashboard, demo, landing, pricing, blog, site, the hub.

## What changed
- **Parley** (`templates/desktop-app.html`): list column `clamp(320px, 52%, 640px)`, status moved onto the key row; lines
  read in one or two rows at 1280 and 1600. Split was already `data-resizable` + `data-resize-key`. Accent calm-down: no
  "All" chip (none pressed = every line; pressing the pressed chip clears; the Review Queue's Open resets it), Copy Source
  `elevated`, placeholders neutral, empty-state text "Clear the status filter."
- **Rails** (`components/nav-rail/nav-rail.css`): a tree's selection in a rail that has a current item is neutral.
- **Mallet docs** (`templates/docs.html`): modifier keys neutral, held layer key `inverse-surface`.
- **Tally** (`templates/dashboard.html`): Coming Up is thirty days (7 items + In/Out/Net foot); new Where It Sits pane;
  Owed By Age gets a supporting line; grid areas at 840 and 1400 rearranged so nothing sits empty.
- **Showcase** (`demo/index.html`, `demo/demo.js`): Shared With You (3 new notes: garden, offsite, lunches) and a Folders
  pane (compact list; counts from the generated rows; opens All Notes filtered to the folder).
- **Site icons** (`scripts/build.mjs`, `components/core/core.js`): `icons-site.js` generated (37 icons, 10.9 KB gz),
  the five site templates and the hub load it; `core.js` fetches `icons-solar.js` once for a name outside the subset
  (checked: a `calendar` icon on the landing page drew after the fallback; all icons on all six site pages drew from the
  subset with no warning and no second request). Budget icons 12 / total 150 (was 180); site bundle 147.3 KB. The check
  fails a site page that loads another icon file. Skill templates' header comment names icons-site.js.

## For workstream A to merge (shared docs B did not touch)
- CLAUDE.md: paste the rules bullet at the end of decision 0068; in the 0057 and 0066 bullets, `icons-solar.js` becomes
  `icons-site.js`; 0066's "One filled selection per screen" is refined by 0068 (per region, per job).
- SKILL.md / site references: site pages load `icons-site.js` (copy `icons-solar.js` beside it for icons the templates
  do not use); the accent-fill rule in the hierarchy section.
- Decisions README: add 0068 (built, round 0059 B). CHANGELOG: the five bullets above.
- Every page's `?v=` stamp changed because `core.js` changed; rebuild after merging rather than resolving stamps by hand.

## App bundle split: the plan (not built this round)
Today an app loads `orion.min.css` (64 KB gz) and `orion.min.js` (116 KB gz). Measured per folder (gz, css + js): table
27, base 14, site 13, core 11, date-picker 10, filter 10, direct 10, chart 9, desktop 9, combobox 9, tree 8, upload 8,
doc-tabs 7, nav-rail 7. Plan:
1. **Core + shell** (always): tokens, base, dials, core, motion, buttons, fields, lists, cards, app shell, nav, menus,
   dialogs/sheets, snackbar, states, form. Target about 45 KB css + 55 KB js gz.
2. **Feature packs**, one file each, generated from groups in `scripts/build.mjs` (like `SITE_CSS`/`SITE_JS`):
   `data` (table at scale, filter, chart), `desktop` (desktop, menubar, doc-tabs, tree, inspector, statusbar, commands,
   palette), `direct` (reorder, swipe, select several, board), `inputs` (date picker, combobox, upload, rich inputs),
   `site` (already exists). A page links the packs it needs after the core files.
3. **Proof in the build**, the same way the site bundle is held: for every template, each `s4-` class it writes must be
   styled by core + the packs it links, and each component script it needs must be in them; a budget per pack and for
   core. Keep `orion.css`/`orion.js` (everything) for prototypes and the skill's quick start.
4. Lazy packs are not worth it: the packs are small and a page knows at write time what it uses.
Risk: the cross-component helpers in `core.js` (S4.util, transitions, icons) must stay in core; packs must not depend
on each other except through core. Estimated a full round with the template sweep.

## Unverified
- Real devices (iPhone Safari, desktop Firefox/WebKit) for the new layouts and the icon fallback.
- The full `npm test` run in one go (run as its parts; see the report).
