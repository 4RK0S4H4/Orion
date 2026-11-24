# 0078: Selecting several, the desktop way (2026-11-24)

**Status:** our design, owner can overrule. Built in round 0064 for issue 104 ([`docs/issues/README.md`](../issues/README.md)).

The owner (2026-11-24): "I'd like tables to work with keyboards btw, like holding shift after selecting a row, then selecting
another row and having it select everything in between, stuff like that."

## What was there

Four collections selected several, each its own way: `S4.table` (Space and Ctrl+A on a row, Shift with Up and Down that only
ever added, a Shift+click that added a range from wherever the last pick was, and a click that opened the row), static tables
with a select column (checkboxes only, eight Tab stops, no keys), multi-select trees (a range and Ctrl+click, no Escape), the
multi-select listbox (a click toggled, nothing else), and select-several lists (`data-selectable`: Ctrl and Shift clicks, an
unanchored range, no keys at all; Shift+Space worked by accident, decision 0076). None replaced a range from the same anchor,
none said the change out loud, and none had a test.

## What changed

1. **One model, in core.** `components/core/select.js` (`S4.util.multiselect(o)`, core pack and the full bundle; the site
   bundle leaves it out, so decision 0066's budget holds) keeps the selected keys, the anchor and the range drawn from it,
   and turns every click and key into a change. Each collection keeps its own markup, focus and drawing and hands the model
   its items in order, a stable key per item, how to focus one, and how to draw a change. `S4.util.say(text)` is the one
   polite live region the model speaks through ("12 selected").
2. **The behaviour, everywhere** (Windows Explorer, the macOS Finder; the WAI-ARIA grid, listbox and tree multi-select):

   | | |
   |---|---|
   | Click | selects only that item and sets the anchor (tables and trees); in a multi-select listbox it adds or removes it; in a select-several list it opens the item until something is selected, then adds or removes it |
   | Shift+click | the range from the anchor, replacing the last range drawn from that anchor |
   | Ctrl+click (⌘ on a Mac) | adds or removes one, and moves the anchor |
   | Ctrl+Shift+click | adds a range |
   | A row's checkbox | adds or removes that row without clearing the others (Shift: the range) |
   | Touch | unchanged: a tap opens, a hold starts selecting, then a tap adds or removes |
   | Up, Down (and Page Up, Page Down) | move focus (a tree's plain arrow also selects the item, as a source list does) |
   | Shift with Up, Down, Page Up, Page Down, Home, End | extend the range from the anchor to where focus lands |
   | Ctrl/⌘ with Up, Down, Page Up, Page Down | move focus, the selection stays (Ctrl+Home and Ctrl+End: the first and last item) |
   | Space, Ctrl+Space | add or remove the focused item |
   | Shift+Space | select from the anchor to the focused item (with nothing selected it starts there: 0076's way to begin) |
   | Ctrl/⌘+A | every item the collection shows: in a data table every row the filter shows, drawn or not |
   | Escape | clears, only when nothing else took the Escape first (a cell returns to its row, an edit is cancelled, a cut is cancelled, a menu or dialog closes, first) |

   Single-select collections ignore the range keys. Clearing forgets the anchor, so the next range starts where focus is.
3. **Key conflicts, settled.** A data table selects rows, never cell ranges: Shift with Up or Down extends the rows from a cell
   too (focus moves to the row); Shift with Left and Right is not a selection key (in the header it resizes a column, 0065);
   plain Home and End stay the start and end of the row (the grid pattern), so Shift+Home and Shift+End are the ones that
   reach the first and last row; Space on the row selects, Space on a control in a cell presses it. In a grid of tiles
   (a gallery), Left and Right move along a line and Up and Down by a line, with Shift extending the same way.
4. **Selection is data.** `S4.table` keys it by row id, so it survives virtual scrolling, sorting and filtering. Selected rows
   that a filter hides stay selected; the bar says so ("12 Selected, 3 Not Shown") and the live region says it once. Select All
   and Ctrl+A select exactly the rows shown. API: `table.selection()` (ids), `table.select(ids, { add })`, `select('all')`,
   `table.clear()`, `table.selectedRows()`, and `s4-change { type: 'select', ids, rows, count, hidden, added, removed, why }`.
5. **A mouse click on a data table row selects it** (in a table with a select column). It opens by its own link, Enter or a
   double-click; a finger still opens it. A table without a select column has no selection, and a click opens the row as before.
6. **Said and marked.** Tables with a select column are `role="grid"` with `aria-multiselectable="true"` and `aria-selected` on
   each row; trees and listboxes keep `aria-selected`; select-several lists are lists of buttons, so their picked rows keep
   `aria-checked`. A static table with a select column becomes one Tab stop with the same keys (Right reaches a row's controls).
   The header keys line and `aria-description` (0067) lead with the selection keys. A Shift+click never selects text; a plain
   drag in a cell still does.

## Rules

- Every collection that selects several is driven by the one model; never hand-roll selection. The page checker (and the suite
  through `silentAudit`) fails a collection that says it selects several (`aria-multiselectable="true"`, a `.s4-table` with a
  select column, `data-selectable`) without the model's `data-s4-multiselect` mark (`tests/fixtures/bad-select.html`, a case in
  `tests/checker.mjs`).
- The suite's `selectAudit` drives every such collection on every page (Chromium, 1280) with the clicks and keys above and checks
  the selected set and the focus after each, the live region, `aria-multiselectable` and `aria-selected`, and that a single-select
  listbox or tree ignores Shift+Down. It fails on the code before this decision (proved in a temporary worktree).
- Budgets: the model costs about 1.8 KB in core; the core js budget is 40 KB (was 38), the data pack 44 (was 42), the full
  bundle's js 124 (was 120). The site bundle is unchanged.
