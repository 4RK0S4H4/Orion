# Workstream data-scale: issue 59, the data half

Branch `round56/data-scale` (worktree `.claude/worktrees/data-scale`, started from `s4-orion` at e7eaf3d). No existing
template was edited (as instructed); `components/table/`, `components/chart/` and the new `components/filter/` and
`components/code/` are this workstream's. The tree view was left to desktop-anatomy.

## Built (paths)
| What | Where |
|---|---|
| Tables at scale: column grips (pointer, touch, keyboard, fit), pinned columns (start and end), column menus (sort, group, pin, fit, move, hide), a Columns menu (show, hide, Alt+arrows to move), widths/order/pins saved per table (`data-key`) | `components/table/table.js` (`S4.tableColumns`), `table.css`, `README.md`, `table.html` |
| Data tables: `S4.table(el, opts).setRows(rows)`, virtual rows (10,000 on the reference page), `aria-rowcount`/`aria-rowindex`, sort, select (checkbox, Space, Shift, Ctrl+A, the selection bar), groups with subtotals, sticky totals footer, details in place (Reveal), inline editing with Undo, row actions menu (`s4-row-action`), states (`ready`, `empty`, `no-results`, skeleton rows shaped like the table), stacked rows on phones, `data-layout="scroll"` for a real table on a phone | same |
| Filters and saved views | `components/filter/` (new: `filter.css`, `filter.js`, `filter.html`, `README.md`), `S4.filter(el, opts)` |
| Code blocks, inline code, keys, diff | `components/code/` (new), `S4.code` |
| Syntax colors | `tokens/src/syntax.tokens.json` (`--s4-syntax-keyword|string|number|comment|function|type|property`); pairs in `scripts/build-tokens.mjs`; tinted proof in `scripts/check-accent.mjs` |
| Chart time range control and a legend that switches series | `components/chart/chart.js`, `chart.css`, `chart.html`, README |
| Icons `columns`, `pin` (all three sets) | `scripts/add-icons.mjs` |
| Template **Linnea** (Data Table) | `templates/data-table.html`, card in `templates/index.html`, a row in `docs/framework.md` |
| Suite coverage | `tests/suite.mjs` (`use()`: data tables, filters, code blocks, chart legends and ranges; `table filter code chart` joined `DIAL_COMPONENTS`) |
| Registered | `components/index.css` (filter after table, code after prose), `scripts/build.mjs` README groups (filter in Containment and data, code in Content) |

## Linnea (for the template batches: avoid repeating)
| Template | Product | Accent | Dials on `<html>` | Scoped theme | Own elements |
|---|---|---|---|---|---|
| `data-table.html` | **Linnea**: the collections register of the (invented) Whitlow Museum of Natural History, Norwich; registrars and curators | bottle-glass green `#24573f`, `variant: 'fidelity'`, neutral | `data-gray="cool"`, `data-page="soft"`, `data-corners="firm"`, `data-type-display="serif"`, `data-energy="calm"`, `data-density="auto"`, `data-buttons="tonal"` | none | the decade strip (when the collection was gathered), the specimen label on each record's page, the record's history, "same species in the register" |

Views: Records (the register: views, filter bar, the filters in force, the count, a 5,000-row table with the catalogue
number pinned, column grips and menus, details in place, editing Drawer and Specimens in place, bulk Send to
Conservation, Export, Delete with Undo), a page per record (`#records/record/NHM-00001`), Loans (a real table that stays
a table on a phone, `data-layout="scroll"`, borrower pinned), Insights (a range control and a switchable legend; the
largest families). Accession is a modal floating panel (a task you save or cancel).

## Every visible choice, and why (for a decision record)
1. **A data table draws only the rows on screen**, between two spacer rows that hold the rest of the height, so the
   scrollbar is the real length at once and never jumps; heights of groups, details and stacked phone rows are measured
   as they are drawn (one batch of reads after the writes, never inside a loop). The table stays a real `<table>`
   (screen readers keep their table commands) with `aria-rowcount` and `aria-rowindex`.
2. **One Tab stop per table** (the current row, roving). Up/Down rows, Page Up/Down screens, Home/End ends; Right/Left
   move through a row's controls and cells that edit; Enter opens a row or edits a cell; Space picks; Escape clears.
   Every control inside a row is `tabindex="-1"` so Tab never walks 5,000 rows (the reach suite caught this).
3. **Editing in place is a real input that reads as text** (like inline edit): a tap edits (the person's own tap), the
   keyboard edits with Enter on the cell (a key press, the 0049 exception). Enter or leaving saves, Escape restores, a
   snackbar offers Undo. No Save button, no dialog.
4. **Pinned columns are solid**: the table's surface with the row's selection or state color mixed in (so hover and
   selection read across the pin), and a 1px tonal edge in `outline-variant` only while something scrolls under them.
   No shadow, no glass. The checkbox and details columns travel with the start pins; the row menu can pin to the end.
5. **Column grips are thin bars that appear on hover** (always on touch), primary while dragged or focused; 24px hit
   area. Fit measures the data with a canvas (no layout), not just the drawn rows.
6. **Every column has a menu** (sort, group, pin, fit, move left/right, hide) because reordering must never be drag-only;
   the Columns menu shows and hides (Alt+arrows also move). With a pointer the column menu button floats over the
   header's end and shows on hover or focus; on touch it is always there.
7. **Groups are tonal band rows** (`surface-container`) with a chevron, the group's name, its count and subtotals in the
   columns that total; Enter or Right/Left open and close them.
8. **Details open in place** under the row (Reveal), sticky to the start so they stay readable when the table is
   scrolled sideways.
9. **Widths start from the data**, not from whichever rows happen to be drawn; the spare width goes to one fill column
   (`data-fill`, else the primary).
10. **Phones keep the stacked rows** for data tables (headline first whatever the column order, details button under the
    checkbox, row menu in the top corner, sort buttons in one row that scrolls). `data-layout="scroll"` is the documented
    exception for numbers compared across a row (loans, prices, timetables), with the first column pinned.
11. **Print**: the table takes the sheet's width, no pins, no row controls.
12. **Filters**: views on top (they change everything below), the bar (search, Add Filter, All Filters with a count
    badge, Sort, View Options), the filters in force as input chips with Clear All, then a count that changes at once
    and is announced when typing pauses. Views and filters are chips (they narrow a collection and there can be many,
    decision 0059). The panel is a tool panel (0054): counts per choice are what you would get with every other filter
    kept; long lists use the tag input, numbers the number field (rich inputs, reused). No Apply; on a phone the panel's
    Show button closes it. Saving a view does it at once, names it from the filters, offers Undo and opens the name in
    place to change (never focused for you). Deleting offers Undo. A dot on the chosen view says it was changed since.
13. **The URL is the query string** (`?q=…&family=a|b&year=1900..1950&sort=year:descending&view=on-loan`) through
    `replaceState`, so `S4.pages` keeps the hash (`#records/record/NHM-00001`) and a filtered view is a link.
14. **Code blocks**: `surface-container` (a step up inside cards and panels), the file name in the mono face, the
    language label, Wrap (a text toggle) and Copy (an icon that turns into a check, "Copied" announced); line numbers are
    generated content (never copied) in a gutter that stays while scrolling sideways; marked lines get a step-up fill and
    a 3px accent bar (never color alone); diffs are `<ins>`/`<del>` lines with their sign in its own column on the
    success and error containers; comments are italic as well as gray.
15. **Syntax colors are fixed hues** (violet keywords, green strings, amber numbers, slate comments, blue functions,
    teal types, rose properties), set by contrast: 5:1 on the worst neutral surface in light and dark, 6:1 in both
    high-contrast modes; proven on all 8 surfaces x 4 modes (`check:tokens`, 139 pairs now) and on the surfaces of 276
    tinted schemes (`check:accent`, worst 4.62:1). Fixed rather than accent-derived so code reads the same in every app.
16. **The tokenizer is about 3 KB of patterns** for js/ts, json, css, html/xml/svg, py, sh; anything else is
    pre-tokenised spans with the `s4-syntax-*` names.
17. **Chart ranges are a connected button group** (Week, Month, Quarter, Custom: a value of the same chart, 0059);
    Custom opens a date range in place (Reveal, the existing date picker). The legend's names become buttons with
    `data-legend="toggle"`; a series switched off keeps its color slot, its key fades and its name is struck through;
    one series always stays; the Table view keeps every series.

## Performance (measured, Chromium headless in this sandbox, software rendering)
Reference page `components/table/table.html`, 10,000 rows:
- `setRows` of 10,000 rows to first paint: 19 to 25 ms; sorting 10,000 rows: 31 to 43 ms.
- Rows in the page: about 20 (19 at rest, 26 at most while scrolling); elements in the table: 624 at rest, 827 at most
  while scrolling top to bottom (bounded, independent of the row count). `aria-rowcount` 10,002; the last row reads
  `aria-rowindex` 10,001.
- A smooth scroll (48px a frame, 300 frames): median frame 16.7 ms (60 fps), 95th percentile 21.8 ms, 1 frame over 34 ms.
- Jumping 2,000px a frame (every row new): about 15 ms a frame, of which about 12 ms is style recalculation.
Template `templates/data-table.html` (5,000 rows, a full app shell): smooth scroll median 17.6 to 21 ms, 95th
percentile 36 to 38 ms, about 20 of 300 frames over 34 ms; up to 30 rows and 1,084 elements in the table.
What costs: style recalculation of the newly inserted rows (about 6 ms per inserted row in this sandbox for the
template; moving one row of the plain static bills table costs about 1.8 ms here, moving a page section 3 ms, so the
sandbox is slow everywhere). Script is under 1 ms a frame; `S4.init` for new rows about 0.15 ms a row. Not measured on a
phone or a real desktop GPU.

## Changelog lines
- Added: tables at scale: `data-resizable` column grips, `th[data-pin]` pinned columns, `data-column-menu`, a Columns
  menu (`.s4-menu[data-table-columns]`), saved layout (`data-key`), `S4.tableColumns`.
- Added: data tables, `S4.table(el, options)`: virtual rows, groups and subtotals, a sticky totals footer, details in
  place, editing in place with Undo, a row menu (`s4-row-action`), the selection bar, states with skeleton rows,
  `data-layout="scroll"` for a real table on a phone.
- Added: filters and saved views (`.s4-filter`, `S4.filter`), state in the address query.
- Added: code blocks (`.s4-code`, `S4.code`), inline code (`.s4-code-inline`), key combinations (`.s4-keys`), diffs.
- Added: syntax color tokens `--s4-syntax-*`, proven in four modes and on every tinted scheme.
- Added: chart time range control (`.s4-chart-range`, `s4-range`) and a legend that switches series (`data-legend="toggle"`).
- Added: icons `columns` and `pin`.
- Added: template Data Table (Linnea, a museum's collections register). 20 templates.
- Changed: table header sort buttons draw their focus ring inside (a scrolling wrap no longer cuts it).
- Changed: `components/table/table.html` loads the bundle (it needs menus, snackbars and states now).
- Components: 72 + filter + code = 74 (count from the merged branch).

## What the skill should say
- **A table with more than about 50 rows, or rows from data**: `S4.table(table, { cell, detail }).setRows(rows)` inside
  a `.s4-states`, with `data-sticky` on the wrap and a height (`--s4-table-max-height`). Pin the identifying column
  (`data-pin`), add `data-resizable` and `data-key` for tools people use daily, `data-column-menu` when there are more
  than six columns. Editing in place only for short values (`data-edit`); anything else is the record's page.
- **Narrowing a collection**: the filter component, not a hand-made bar. Facets: choice for a handful of values, tags
  for long lists, range for numbers and years. Two to five saved views named after the questions people ask. Always a
  `no-results` state with Clear Filters.
- **A record**: a page (`data-page-open` in the primary cell), not a dialog.
- **Phones**: stacked rows by default; `data-layout="scroll"` only for numbers compared across a row.
- **Code**: `.s4-code` with a file name; never color code by hand; `.s4-code-inline` in sentences, `.s4-kbd` for keys.
- **Charts over time**: a `.s4-chart-range` above the chart; `data-legend="toggle"` when there are three or more series.
- Do not: build a sideways-scrolling table for a phone list; add an Apply button to filters; drag-only column order.

## Hub links to add
- Template: `templates/data-table.html` (Linnea).
- Components: `components/filter/filter.html` (Filters and Views), `components/code/code.html` (Code); updated
  `components/table/table.html` (At Scale, Pinned and Resizable), `components/chart/chart.html` (Time Range and Series).

## Lessons (what Orion made easy, what held back, what to change)
- **Easy:** the states component, the menu, the snackbar's Undo, pages with URLs, the floating panel's `data-modeless`,
  the tag input and number field (reused in the filter panel as they are), the brand dials (Linnea is five attributes and
  one seed). *No change needed.*
- **Held back: style cost per inserted element.** The bundle (600 KB, many `:has()` and attribute selectors) makes every
  inserted row cost several milliseconds of style work here. Killing all `:has()` rules cut the template's style time by
  about a quarter. *Small, do next:* measure on a real iPhone and desktop; if it shows, audit the broad `:has()` rules on
  ancestors (`.s4-app:has(…)`, `tr:has(…)`), and give rows fewer elements (icons as one node).
- **Held back: the checkbox's look in a dense table.** Rows show the filled disc of the checkbox at rest; in a 5,000-row
  register a column of gray discs is louder than the data. *Needs the owner:* a quieter resting checkbox inside tables
  (another workstream owns the checkbox this round).
- **Held back: the reach rule "text grows, not cut" vs data grids.** Cells wrap (0058) rather than truncate; in a
  resizable grid a narrowed column now wraps to two lines and the row grows (measured, so the virtual list copes). Most
  grids truncate with the full value on hover. *Needs the owner:* whether table cells join the five places where
  truncation is by design.
- **Held back: no `S4.position`-style anchored panel without menu semantics.** The Columns chooser had to be a real menu
  (show/hide as check items) plus a column menu for order, because a menu cannot hold a row of buttons. *Small, do next:*
  a non-menu anchored glass popover (`.s4-popover`) for small tool panels.
- **Fixed in this branch:** `.s4-table` header sort buttons' focus ring (was cut by a scrolling wrap); `table.html` now
  loads the bundle.
- **Would change:** a token for compact row height in data tables independent of density, and a `--s4-size-icon-button-xs`
  token (I used spacing tokens for the col menu's offsets).

## Tests changed (and why)
- `tests/suite.mjs`: new checks in `use()` for data tables (row count and indices, bounded rows after scrolling far,
  header sort orders the data, ArrowDown moves one row, Space picks and shows the selection bar, Escape clears, Right
  reaches an editable cell, Enter edits, Escape cancels, Enter saves with Undo, details open in place, a grip resizes
  with the arrow keys), filters (a search that matches nothing shows no rows, becomes a chip and goes into the address,
  clearing restores; choosing a saved view selects it), code (Wrap and the block agree), charts (a legend switch hides
  its series; a range button sends `s4-range`). `table filter code chart` joined `DIAL_COMPONENTS`. No check was weakened.

## Not finished or not verified
- WebKit and Firefox: not run here (CI runs WebKit). Sticky cells inside a `table-layout: fixed` table with sticky
  header and footer, `scrollbar-gutter`, `100cqi` on the details and the canvas text measure all need a Safari look.
- Performance on real devices: not measured (numbers above are this sandbox).
- A data table prints only the rows that are drawn (documented); a full print needs a report view.
- Column reordering by dragging a header is deliberately not built (menus and Alt+arrows only).
- The dashboard's Reports view was not upgraded to the filter bar (existing templates were off limits this round); the
  filter component is ready for it (`S4.filter` on its table).

## For the owner to look at
- On an iPhone: `templates/data-table.html` (stacked rows, scroll the 5,000, open details, tap a Drawer cell to edit,
  the filters panel, Loans scrolling sideways with the borrower pinned).
- On a desktop: the same at 1280 and 1600 (column grips, column menus, pinned columns while scrolling sideways, the
  filters panel beside the register, keyboard through the table), `components/code/code.html`.
