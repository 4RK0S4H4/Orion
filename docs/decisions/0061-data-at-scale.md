# 0061: Data at scale: tables, filters and saved views, code (2026-11-21)

**Status:** our call. The owner left the calls of the design review's last areas to us on 2026-11-16 ("I trust your
judgement"); the owner can overrule any of it. Built in round 0056 (issue 59, the data half; the rich inputs half was
merged earlier in the round). Notes, measurements and every visible choice: [`docs/history/round-0056/data-scale.md`](../history/round-0056/data-scale.md).

## The question
Orion's table was a styled `<table>`: fine for a bill, not for a register of thousands of rows that people work in all
day. There was no way to narrow a collection beyond a search field, no saved views, no code block for docs and tools,
and charts had no time range. How does an Orion app hold a lot of data without becoming a different system?

## The answers
| Question | Answer |
|---|---|
| Thousands of rows | **Virtual rows from data**: `S4.table(el, opts).setRows(rows)` draws only the rows on screen between two spacer rows, so the scrollbar is the real length; it stays a real `<table>` with `aria-rowcount` and `aria-rowindex` |
| Keyboard | **One Tab stop per table** (the current row, roving): arrows, Page Up/Down, Home/End, Enter opens or edits, Space picks, Escape clears; controls inside rows are `tabindex="-1"` |
| Columns | **Grips, pins and menus**: `data-resizable` grips (24px hit area, fit measures the data), `th[data-pin]` pinned columns (solid, a 1px tonal edge only while something scrolls under them), a menu on every column (sort, group, pin, fit, move, hide), a Columns menu; saved per table with `data-key`. Never drag-only |
| Editing | **In place for short values** (`data-edit`): a real input that reads as text, Enter or leaving saves, Escape restores, Undo in a snackbar; anything longer is the record's page |
| Groups, details, totals | Tonal band rows with counts and subtotals; details open in place under the row (Reveal); a sticky totals footer |
| Phones | **Stacked rows** by default; `data-layout="scroll"` (a real table, first column pinned) only for numbers compared across a row |
| Narrowing a collection | **The filter component** (`.s4-filter`, `S4.filter`): views on top, then search, Add Filter, All Filters (a tool panel with facet counts, 0054), Sort; filters in force as input chips; a count that changes at once. No Apply |
| Saved views | Chips (0059: they narrow a collection), saved at once with a name from the filters, renamed in place, deleted with Undo; the state lives in the address query (`replaceState`), so `S4.pages` keeps the hash and a filtered view is a link |
| Code | **`.s4-code`**: `surface-container`, file name, language, Wrap and Copy, line numbers as generated content, marked lines with a fill and a 3px accent bar, diffs as `<ins>`/`<del>` on the success and error containers; `.s4-code-inline`, `.s4-keys` |
| Syntax colors | **Fixed hues** (`--s4-syntax-*`), not accent-derived, so code reads the same in every app; 5:1 on every neutral surface, 6:1 in high contrast, 4.5:1 on every tinted scheme |
| Charts over time | A **range control** (a connected button group, 0059; Custom opens a date range in place) and a legend that switches series (`data-legend="toggle"`); the table view keeps every series |

## The rule
- A table with more than about 50 rows, or rows from data, is a data table (`S4.table`) inside `.s4-states`, with the
  identifying column pinned. Tools people use daily add `data-resizable` and `data-key`; more than six columns add
  `data-column-menu`.
- A collection people narrow uses the filter component: choice facets for a handful of values, tags for long lists,
  ranges for numbers and years; two to five saved views named after the questions people ask; always a `no-results`
  state with Clear Filters. Never an Apply button.
- A record is a page (0050), never a dialog.
- Code is never colored by hand: `.s4-code` with a file name, or pre-tokenised spans with the `s4-syntax-*` names.
- Nothing about a table is drag-only: every column move has a menu item and Alt+arrows.

## How it is built
- `components/table/` (`S4.table`, `S4.tableColumns`), `components/filter/` (new), `components/code/` (new, a small
  tokenizer for js/ts, json, css, html/xml/svg, py, sh), `components/chart/` (range, legend).
- `tokens/src/syntax.tokens.json`: seven syntax tokens; their pairs are proven by `check:tokens` in four modes and by
  `check:accent` on every tinted scheme.
- Template **Linnea** (`templates/data-table.html`): a museum's collections register, 5,000 virtual rows.
- Icons `columns` and `pin` (all three sets). The suite checks data tables, filters, code and chart ranges, and they join
  the dial presets pass.

## Open for the owner
- A quieter resting checkbox inside dense tables (a column of filled discs is louder than the data).
- Whether table cells join the places where truncation is by design (0058 says text wraps; grids usually truncate).
- Performance was measured only in this sandbox (60 fps median on the reference page); a real iPhone and desktop look.
