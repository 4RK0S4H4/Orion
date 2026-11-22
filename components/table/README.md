# Table

S4 addition (M3 has no current data table spec). Compares rows across columns: bills, payments, invoices. Sorting,
row selection, clickable rows, a sticky header, and a stacked layout on phones so nothing scrolls sideways. Tables are
solid content surfaces, never glass.

```html
<div class="s4-table-wrap" data-sticky>
  <table class="s4-table">
    <caption>October Bills</caption>
    <thead><tr>
      <th scope="col" data-check><label class="s4-checkbox"><input type="checkbox" aria-label="Select All Bills"><span class="s4-checkbox-box"></span></label></th>
      <th scope="col" data-primary aria-sort="none"><button type="button" class="s4-table-sort">Vendor<span class="s4-icon" data-icon="chevron-down"></span></button></th>
      <th scope="col">Status</th>
      <th scope="col" class="s4-num" aria-sort="none"><button type="button" class="s4-table-sort">Amount<span class="s4-icon" data-icon="chevron-down"></span></button></th>
    </tr></thead>
    <tbody>
      <tr tabindex="0">
        <td data-check><label class="s4-checkbox"><input type="checkbox" aria-label="Select Iron Mountain INV-10482"><span class="s4-checkbox-box"></span></label></td>
        <td><a href="/bills/10482">Iron Mountain</a></td>
        <td><span class="s4-status" data-tone="tertiary">Due</span></td>
        <td class="s4-num" data-value="1240">$1,240.00</td>
      </tr>
    </tbody>
    <tfoot><tr><th scope="row" colspan="3">Total</th><td class="s4-num">$1,240.00</td></tr></tfoot>
  </table>
</div>
```

| Attribute / part | Values | Default |
|---|---|---|
| `.s4-table-wrap` | surface-container-low, large corners, scrolls sideways if it must; the container the compact layout measures | — |
| `data-sticky` (wrap or table) | header stays at the top while rows scroll inside the wrap; height from `--s4-table-max-height` | header + 8 rows |
| `th`, `td` | header 56 (title-small, on-surface-variant), rows 52 (body-medium), 16 side padding, tabular figures | — |
| `.s4-num` on `th` / `td` | figures: tabular and right-aligned (table.js copies it from the header to the column's cells, and a column whose every cell is `.s4-num` right-aligns its header). `.num` is the older name and still works | start |
| `data-wrap` on `th` / `td` | let a long column wrap (min 192) | no wrap |
| `th[aria-sort]` + `button.s4-table-sort` | click cycles `ascending` → `descending` → `none` (original order); sorts each tbody by `data-value` or text; `s4-change { type: 'sort', column, label, direction }` | — |
| `data-value` on `td` | the sort key: a number for amounts, an ISO date for dates | the text |
| `th[data-check]`, `td[data-check]` | checkbox column; header box selects all (indeterminate for some); checked rows get secondary-container; `s4-change { type: 'select', rows }` | — |
| `tr[tabindex="0"]` | clickable row: state layer, click or Enter fires `s4-select { row }` and follows the row's first link | — |
| `th[data-primary]` | in the stacked layout, that column's cell is the block's headline | — |
| `data-label` on `td` | column name shown in the stacked layout; table.js copies it from the header; `data-label=""` hides it | header text |
| `tfoot` | totals, title-small | — |

**Compact (the wrap under 600):** each row becomes a block: the primary cell as a headline, then one line per cell with
its column name on the left and the value on the right. The header row becomes a toolbar with select-all and the sort
buttons; plain column names are hidden (each cell carries its own). A selectable row's checkbox sits at the block's top
start.

## At scale (round 0056)

Everything below is opt-in; markup without these attributes behaves exactly as above.

### Columns (any table, markup or data)

| Attribute | What |
|---|---|
| `data-resizable` on the table | a grip at the end of each header: drag it (mouse or finger), or Tab to it and use Left / Right (Shift for bigger steps), Home for the narrowest; double-click or Enter fits the column to its content. In a data table the header is one Tab stop: arrows move along it and a grip resizes with Shift+Left / Right, or Enter then the arrows (see Keyboard below); its column menu's Fit to Content fits. The grip is a `role="separator"` with `aria-valuenow`. |
| `th[data-pin]`, `th[data-pin="end"]` | the column stays while the table scrolls sideways. Pinned cells are solid (the table's surface, the row's selection or state mixed in) with a tonal edge only while something is under them; never a shadow, never glass. The checkbox and details columns travel with the start pins. |
| `data-key="name"` on the table | widths, order, hidden and pinned columns are kept in this browser under that name |
| `th[data-fill]` | the column that takes the spare width when the columns are narrower than the table (default: the `data-primary` one) |
| `data-column-menu` on a data table | a menu on every column header: Sort Ascending, Sort Descending, Group by (with `th[data-groupable]`), Pin, Fit to Content, Move Left, Move Right, Hide. Never drag-only. With a pointer the button shows on hover or focus; on touch it is always there. |
| `.s4-menu[data-table-columns="#table-id"]` | a Columns menu for that table: a check item per column to show or hide it; Alt and Up / Down move the focused column |

### Data (`S4.table`)

```html
<div class="s4-states" data-state="loading">
  <div data-when="loading" data-table-skeleton="8"></div>
  <div class="s4-table-wrap" data-when="ready" data-sticky style="--s4-table-max-height: 70vh">
    <table class="s4-table" id="records" data-key="records" data-resizable data-column-menu
           data-row-menu="#row-menu" data-selection-bar="#bar">
      <thead><tr>
        <th scope="col" data-check><label class="s4-checkbox"><input type="checkbox" aria-label="Select All Shown Records"><span class="s4-checkbox-box"></span></label></th>
        <th scope="col" data-row-expand><span class="s4-visually-hidden">Details</span></th>
        <th scope="col" data-field="catalogue" data-pin aria-sort="none"><button type="button" class="s4-table-sort">Catalogue No.<span class="s4-icon" data-icon="chevron-down"></span></button></th>
        <th scope="col" data-field="taxon" data-primary data-edit>Taxon</th>
        <th scope="col" data-field="count" class="s4-num" data-format="integer" data-edit="number" data-total="sum">Specimens</th>
        <th scope="col" data-row-actions data-pin="end"><span class="s4-visually-hidden">Actions</span></th>
      </tr></thead>
      <tbody></tbody>
    </table>
  </div>
  <div data-when="no-results" class="s4-empty">…Clear Filters…</div>
  <div data-when="empty" class="s4-empty">…</div>
  <div data-when="error" class="s4-empty">…<button data-retry>Try Again</button></div>
</div>
```
```js
const t = S4.table(document.getElementById('records'), {
  id: 'id', noun: 'record', nouns: 'records',
  cell: { status: (v, row) => `<span class="s4-status">${v}</span>` },   // optional HTML per column
  detail: (row) => `<p>…</p>`                                            // what a row's details show
});
t.setRows(rows);                      // 10,000 rows: only what is on screen is drawn
```

| Header attribute | What |
|---|---|
| `data-field` | the row property the column shows |
| `data-format` | `number`, `integer`, `currency:EUR`, `percent`, `date` (or a `cell` function) |
| `data-edit`, `data-edit="number"` | the cell is a real input that reads as text: tap it to type; with the keyboard, Right to the cell and Enter. Enter or leaving saves, Escape puts it back, a snackbar offers Undo. Never focused for you (decision 0049). `data-required` refuses an empty value. |
| `data-total="sum|avg|min|max|count"` | a sticky totals footer (over the rows that pass the filters) and a subtotal on each group's row |
| `data-groupable` | offered in the column menu as Group by |
| `th[data-row-expand]` | a details button per row: the details open in place under it (Reveal), the first rung of the placement ladder |
| `th[data-row-actions]` + `data-row-menu="#menu"` | a row menu button; choosing an item fires `s4-row-action { action, row, id }` on the table |
| `data-selection-bar="#bar"` on the table | the `.s4-selection-bar` that shows the count and bulk actions while rows are picked |

Script: `setRows(rows)`, `filter(fn)`, `search(text, fields)`, `sort(field, 'ascending'|'descending'|null)`,
`group(field|null)`, `expand(id, open)`, `update(id, patch)`, `remove(ids)` (returns the removed rows, for Undo),
`selectedRows()`, `clear()`, `.rows`, `.view` (indices of the rows shown), `.selected`. Columns: `S4.tableColumns(table)`:
`width(field, px)`, `fit(field)`, `hide(field, on)`, `move(field, index)`, `pin(field, 'start'|'end'|'')`.
Events on the table: `s4-change` with `type` `view` (`count`, `total`), `sort`, `select` (`rows`, `count`), `edit`
(`field`, `value`, `previous`, `undo`), `update`, `resize`, `columns`; `s4-select { row, data }` when a row opens;
`s4-toggle { id, open }` for details; `s4-row-action`. The [filter](../filter/) component drives `filter`, `search` and
`sort` and writes them into the address.

**Rows on screen only.** The body holds the rows in view plus a few either side, between two spacer rows whose height
is the rest of the table, so the scrollbar is the real length from the start and never jumps. Each frame reads the
scroll position once, draws, then measures the new rows together (no reading inside a loop). Measured on the reference
page (10,000 rows, Chromium in this sandbox): first draw of the data 25 ms, sorting 10,000 rows 43 ms, about 20 rows in
the page at any time (under 830 elements in the table while scrolling from top to bottom), a smooth scroll at 60 frames a
second with the median frame at 16.7 ms. Every drawn row carries `aria-rowindex`; the table carries `aria-rowcount`, so a
screen reader says "row 4,812 of 5,002".

**Keyboard (data tables, the WAI-ARIA grid pattern, decision 0065):** two Tab stops, the header and the body, and Tab
leaves the table for the next control. **Header:** Left and Right move through every header control (Select All, each
column's sort button, its options button and its grip, in that order in every column), Home and End to the first and
last, Down to the body. On a grip, Shift with Left or Right resizes, or Enter (or F2) starts resizing with the plain
arrows until Enter, Tab or Escape (which puts the width back). **Body** (the current row): Up and Down move a row (Up
from the first row goes to the header), Page Up and Page Down a screen, Ctrl+Home and Ctrl+End the first and last row;
Right and Left move through the row's controls and cells that edit, Home and End to the start and end of the row; Enter opens the row (its `data-page-open` link) or edits a cell; Space picks the row, Shift with Up or Down
extends, Ctrl+A picks every row shown, Escape clears; `+` and `-` open and close details; Shift+F10 opens the row menu.
On a group row, Enter or Right and Left open and close the group.

**Header keys, said out loud (decision 0067):** the header's sort, options and resize controls have no Tab stop, so
nothing on screen shows how to reach them: the way is **Up from the first row**, then Left and Right, then Down to come
back. A data table therefore says so twice. `table.js` gives the table an `aria-description` with the same words (a
screen reader reads it with the table's name; write your own `aria-description` to replace it), and puts a one-line
`p.s4-table-hint` under the wrap that fades in while focus is visibly inside the table (keyboard focus only; its line is
reserved so nothing moves; never on a touch screen or in print). `data-hint="off"` on the table leaves the visible line
out when the page explains the keys itself (the description stays). Don't tell the person the keys in a tooltip on each
header: the hint is one place.

**The wrap:** a table always sits in `.s4-table-wrap` (the scroller, and the container that stacks rows under 600);
table.js adds one around a bare `.s4-table`, unless its parent already scrolls sideways. Cells that do not stack keep
words whole: a column is at least as wide as its longest word and the wrap scrolls (decision 0065).

**Phones:** the stacked layout stays the default for data tables too (rows are measured as they are drawn): headline,
then one line per value, details under the checkbox, the row menu in the top corner, the sort buttons in one row that
scrolls sideways. Use `data-layout="scroll"` on the wrap instead when people compare numbers across a row (a price grid,
a timetable, a register of loans): the real table stays, scrolls sideways, and its pinned first column keeps every row
named.

**States:** inside a `.s4-states`, `setRows` shows `ready` (or `empty` for no rows), and a filter that leaves nothing
shows a `no-results` part when there is one (a Clear Filters button there). `data-table-skeleton="8"` on the loading part
draws skeleton rows shaped like the table's columns.

**Print:** the table takes the sheet's width, nothing is pinned, the checkbox, details and menu columns are left out.
A data table prints the rows that are drawn: print from a report view of the rows that matter.

**When to use what:** a table when people compare values across columns or sort; a [list](../list/) when each item is
read on its own. Keep tables to the columns that matter; put the rest on the detail page.

**Do**
- Right-align amounts and counts (`.s4-num`), and give them `data-value` so they sort as numbers.
- Make one column `data-primary` (usually the name) so stacked rows read well on phones.
- Show status with a [status](../status/) pill (a label and a tone).
- Label every row checkbox with what it selects ("Select Staples INV-10451").

**Don't**
- Don't make a row clickable and also fill it with buttons; one action per row, or a trailing icon button with
  `tabindex` off the row.
- Don't rely on sideways scrolling on phones; the stacked layout is there so you don't need it.
- Don't sort columns where order means nothing (descriptions).

**Selecting rows (decision 0063, amends 0044 inside tables):** an empty box in a resting row is a quiet dot, half the
size, in the same 3:1 control color; it grows into the full box when its row is hovered or holds the focus, and every
box shows in full while anything is selected. The Select All box rests as the same dot and grows when the head row
is hovered or holds the focus, or while anything is selected (decision 0065). Cells keep wrapping
(0058); they never truncate.

**Accessibility:** a real `<table>` with `<caption>`, `scope`d headers and `aria-sort`, so screen readers announce the
column and sort order. Sorting is a native button in the header. Clickable rows are focusable with an inner focus ring and
open on Enter; the link inside stays the accessible way in. Forced-colors mode draws the wrap's border and outlines
checked rows.

**Tokens:** `--s4-size-table-header` (and with the scale additions `--s4-shape-text-field` for cells that edit, `surface-container`, `surface-container-high`, `surface-container-highest`, `outline`, `primary` for the active grip, `--s4-motion-bend`, Reveal for details), `--s4-size-table-row`, `--s4-size-touch-target`, `--md-sys-shape-corner-large`,
`--md-sys-color-surface-container-low`, `--md-sys-color-secondary-container`, `--md-sys-color-on-secondary-container`,
`--md-sys-color-outline-variant`, `--md-sys-typescale-title-small-*`, `-body-medium-*`, `-title-medium-*`,
`-label-large-*`, `--md-sys-state-*`, `--md-sys-motion-spring-spatial` (rows slide into their sorted place),
`--md-sys-motion-spring-fast-spatial` (sort arrow).
