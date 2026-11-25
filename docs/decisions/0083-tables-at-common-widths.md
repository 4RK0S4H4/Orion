# 0083: Tables at common widths: column priority, a scroll-edge cue, and a row ring on every side (2026-11-25)

**Status:** our call under the owner's handover, built in round 0066, workstream B (review 5's N4 and N5; issues 112 and 113).
Amends [0061](0061-data-at-scale.md) (data tables). No motion pattern was added (the cue fades on State, 0046). No check was weakened.

## Why
Review 5: Linnea at 1280 put a 1453-wide table in a 990-wide wrap. Drawer and Status sat off to the side with no sign they were
there, Locality was cut mid-word under the pinned actions column, and the scrollbar was below the fold. And a focused row's
ring had no sides: the pinned checkbox, details and catalogue cells and the actions column painted over the row's outline.

## The rules
1. **Column priority.** A data table's `th[data-priority="1"…"5"]` may fold away when the window is too narrow for every
   column: the highest number folds first, until the rest fit. A column without a priority never folds, nor does a pinned one
   or the checkbox, details and actions columns. Give the column a person scans (a status) no priority. A folded column is
   listed unticked in the Columns menu with "Folded to Fit", and its value is shown in each row's details
   (`.s4-table-folded`, under the app's own details). Ticking it keeps it (saved with `data-key`); the table then scrolls.
   Stacked rows (under 600) fold nothing. Only data tables (`S4.table`) fold; a static table scrolls.
2. **The scroll-edge cue.** Every table that hides columns to one side fades that side of the visible table into the table's
   own surface over 32px, just inside the pinned columns (`.s4-table-cue`, a zero-height sticky layer `table.js` puts first in
   the wrap; `data-scrolled-start` / `data-scrolled-end` on the wrap). No shadow, no glass; forced colors and print leave it out.
3. **A focused row's ring shows on all four sides.** The cells draw it (`table/table-edges.css`): every cell the top and
   bottom, the first cell the start side, the last the end side, inside the cell; pinned cells draw their part over themselves,
   a cell scrolled under a pinned one is covered with its part. Stacked rows keep the row's outline. While a row holds the focus
   the cue steps aside.
4. **Proofs.** `ringAudit` (`skill/orion/scripts/silent.mjs`) in the page checker (1280) and the suite (every desktop page; Linnea
   in left to right and right to left, light and dark, scrolled so pinned cells cover cells) fails a ring missing on a side, under
   a pinned cell or under the cue (`tests/fixtures/bad-row-ring.html`). The suite fails a table that scrolls sideways with no cue
   on every page, and drives Linnea at 1024, 1280 and 1600: Status on screen without scrolling, folded columns in the menu and
   the details, the cue on the right side once a kept column makes the table scroll.

## Applied
Linnea: Drawer 5, Family 4, Collector 3, Collected 2, Locality 1. At 1600 Drawer and Family fold; at 1280 Collector and
Collected as well (Locality, Status and Specimens show in full); at 1024 Locality too. Nothing scrolls sideways at any of them.
The ring and cue CSS lives in `table/table-edges.css`, in the data pack, not in the site bundle (a site's static table has
no `table.js`).

## Rules bullet (for CLAUDE.md)
- Decision 0083 (tables at common widths): a data table's low-priority columns fold away when the window is too narrow (`th[data-priority="1…5"]`, highest folds first; the column a person scans has none; folded columns are unticked "Folded to Fit" in the Columns menu and shown in a row's details; ticking keeps one), a table that hides columns to one side fades that side into its surface inside the pinned columns (`.s4-table-cue`, never a shadow), and a focused row's ring is drawn by its cells so it shows on all four sides over pinned cells; `ringAudit` in the page checker and suite (`tests/fixtures/bad-row-ring.html`) and the suite's Linnea pass at 1024, 1280 and 1600 prove it.
