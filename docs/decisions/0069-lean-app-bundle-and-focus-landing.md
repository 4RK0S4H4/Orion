# 0069: A lean app bundle, focus lands on main, the grid cue works on a tablet with a keyboard (2026-11-22)

**Status:** built in round 0060, workstream A. Our calls under the owner's hand-over of 2026-11-21; the owner can overrule
any of it. Source: independent re-grade 4 ([`history/round-0059/regrade-4.md`](../history/round-0059/regrade-4.md)),
blockers N2, N4, N5 and N8. No motion pattern was added (0046).

Amends: **0065** (no flow leaves focus on `<body>`: a dialog closed with no opener now lands on main), **0067** (the grid
hint is no longer hidden on coarse pointers), **0066** (the bundles: site and lean app, side by side).

## 1. The app bundle is split by component (N2)
An app that used three components still loaded all of Orion (64 KB css and 117 KB js gzip). Now there are three ways to load
it, all generated from the same `components/` folders by `scripts/build.mjs`:

| Way | Files | gzip (css + js) | For |
|---|---|---|---|
| Full | `orion.css`/`orion.js` (`orion.min.*` lighter copies) | 178 KB | prototypes, one-file pages, the Showcase; unchanged |
| Site | `orion.site.min.*`, `inter-site.woff2`, `icons-site.js` | 148 KB with font and icons | websites (0066) |
| **Lean app** | `orion.core.min.*` plus the packs the page uses | core 78 KB; 78 to 160 KB per template | finished apps |

- **Core** holds tokens, base, dials, the app shell, navigation, actions, containers, lists, fields (text, switch, checkbox,
  radio, chip, slider, swatches, form), menus, dialogs and sheets, feedback, the small data pictures (ring, meter,
  milestones, stat), prose, glass and motion. **Packs**, one css and one js file each: `data` (table at scale, filter,
  chart, month, timeline, code), `commands` (commands, palette, the desktop platform helpers), `desktop` (menu bar, status
  bar, document tabs, tree; calls `commands`), `direct` (reorder, swipe, select several, board), `inputs` (date and time
  pickers, combobox, tag input, upload, color, number, code field, rating, password, inline edit), `sitekit` (the website
  kit in an app).
- **Order:** core first, then each pack once; css in the head, scripts at the end. A pack depends on core only (and
  `desktop` on `commands`, declared in `PACK_NEEDS`); every other cross-pack call in a script is guarded, so a missing pack
  loses a feature and never throws (doc tabs reorder with `direct`: the picker adds it when doc tabs are used).
- **The picker:** `node scripts/packs.mjs page.html` (shipped in the skill) reads the page's classes, a short list of
  switching attributes and the `S4.` names it uses, against the generated `components/packs.json`, and prints the packs and
  the tags. The page checker runs the same reading on any page that links `orion.core.min.*`: a missing pack is an error, an
  unused pack a warning, linking the full bundle beside it an error.
- **Proof in `npm run check`** (`scripts/build.mjs`): every page that links the lean files (15 templates) links exactly the
  packs it uses, in order, and no other bundle; budgets (gzip KB): core css 44 and js 38, data 42, commands 12, desktop 13,
  direct 10, inputs 35, sitekit 10, each lean page 170, the full bundle 66 css and 120 js. A page that outgrows a budget
  fails the build.
- **Proof in the tests:** `npm run test:lean` loads every lean page at 390 dark and 1280 light twice, as written and with the
  lean files swapped for the full bundle, and compares errors, the `S4` runtime (names of unlinked packs excepted), the element
  count and every computed style of every element. It found one real gap on the way: the checked-item, shortcut and
  chevron rules of menus lived in `commands.css`, so a core menu looked different without the commands pack; they moved
  to `menu.css`.
- **Which templates use it:** every app template: article, calendar, chat, checkout, dashboard, data-table, desktop-app,
  editor, gallery, kanban, list-detail, onboarding, settings, sign-in, tool. The template hub and the Showcase keep the full
  bundle (they show everything). The skill's copies carry a header comment that names the files to copy.
- Not done, on purpose: lazy-loaded packs (a page knows at write time what it uses; the packs are small) and per-component
  files (a component that needs another's css or script is where split bundles go wrong; packs keep the unit a family).

## 2. Escape from a palette opened with nothing focused (N4)
Ctrl+K on a fresh load, then Escape, left `document.activeElement` on `<body>`: the palette had no opener to go back to.
`S4.dialog` (and so the palette, sheets and every dialog) now remembers what had focus when it opened and, on close,
returns focus to the opener, else to that element, else to the **main landmark** (`S4.util.land()`: the first visible
`main` or `[role=main]`, made focusable with `tabindex="-1"`, else the visible view; never `<body>`). `main:focus` shows
no ring for a pointer (`app.css`); the keyboard shows the normal one. The production suite fails the old behaviour (a
palette opened by Ctrl+K from nothing focused, then Escape, must leave focus in main).

## 3. Linnea's Columns button (N5)
Checked: the toolbar's `Columns` button (`data-menu="ln-columns"`) is outside the `<table>`; the reviewer's probe hit the
per-column options buttons in the header cells (`.s4-table-col-menu`), which belong there. No structure change. The suite
now fails any toolbar button that opens a table's column menu (`[data-table-columns]`) from inside a table, grid or treegrid.

## 4. The grid cue on a touch device with a keyboard (N8)
0067's hint line was `display: none` on coarse pointers, so an iPad with a keyboard got only the `aria-description`. Now
the line stays collapsed on a coarse pointer until the **first navigation key** (arrows, Tab, Home, End, Page keys) is pressed
inside the table (`table.js` sets `data-keys` on the hint), then it shows exactly as on a desktop (opacity follows
`:focus-visible`). A phone with no keyboard never sees it and loses no space. In print it is still hidden. The suite
checks it with a touch context: collapsed before a key, visible after.

## Rules bullet (for CLAUDE.md)
- Decision 0069 (lean app bundle, focus landing): an app links `orion.core.min.*` plus only the packs it uses (`data`, `commands`, `desktop`, `direct`, `inputs`, `sitekit`; core first, packs after; `node scripts/packs.mjs page.html` lists them, the page checker and `npm run check` fail a page that links too few or too many); `orion.css`/`orion.js` and `orion.min.*` still load everything (prototypes, the Showcase). Budgets live in `scripts/build.mjs`; `npm run test:lean` proves a lean page equals the full bundle. A pack never relies on another except through core (`desktop` on `commands`). Closing a dialog, sheet or palette with no opener returns focus to what had it, else to main (`S4.util.land()`), never `<body>`. The grid-keys hint shows on a touch screen after the first navigation key in the table.
