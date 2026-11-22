# Filters and Views

One pattern for narrowing a collection (records, orders, specimens, tickets): a **search** that filters as you type,
the **filters in force** as chips (each removable, and Clear All), **Add Filter**, a **filters panel** with every facet
and what each choice would give, a **sort** control and **saved views** (named sets of filters, search and sort) that
can be saved, updated, renamed and deleted with Undo. The state is in the address, so a view can be linked.

```html
<div class="s4-filter" id="records-filter" data-for="#records" data-key="records" data-url aria-label="Filter records">
  <div class="s4-filter-views" aria-label="Saved Views"></div>
  <div class="s4-filter-bar">
    <div class="s4-search" role="search">…<input class="s4-search-input" type="search" aria-label="Search records">…</div>
    <button class="s4-button" data-variant="tonal" type="button" data-filter-add data-menu="add-filter">Add Filter</button>
    <div class="s4-menu" id="add-filter" aria-label="Add a filter"></div>
    <button class="s4-button" data-variant="text" type="button" data-filter-panel data-sheet="filters"><span class="s4-icon" data-icon="filter"></span><span class="s4-filter-label">All Filters</span><span class="s4-badge" hidden></span></button>
    <button class="s4-button" data-variant="text" type="button" data-filter-sort data-menu="sort"><span class="s4-icon" data-icon="sort"></span><span class="s4-filter-sort-label">Sort</span></button>
    <div class="s4-menu" id="sort" aria-label="Sort"></div>
    <button class="s4-icon-button" type="button" data-filter-views data-menu="view-options" aria-label="View Options">…</button>
    <div class="s4-menu" id="view-options" data-align="end" aria-label="View options"></div>
  </div>
  <div class="s4-filter-active" aria-label="Active Filters" hidden></div>
  <p class="s4-filter-count"></p>
</div>
<dialog class="s4-side-sheet" id="filters" data-modeless aria-labelledby="filters-h">
  <div class="s4-sheet-header"><h2 class="s4-sheet-title" id="filters-h">Filters</h2><button class="s4-icon-button" data-close aria-label="Close Filters">…</button></div>
  <div class="s4-sheet-content"><div class="s4-filter-facets"></div></div>
  <div class="s4-sheet-actions"><button class="s4-button" type="button" data-filter-done>Show Records</button></div>
</dialog>
```

```js
const filter = S4.filter(document.getElementById('records-filter'), {
  noun: 'record', nouns: 'records',
  facets: [
    { field: 'family', label: 'Family', type: 'choice', icon: 'tag' },          // checkboxes with counts
    { field: 'collector', label: 'Collector', type: 'tags' },                   // many values: a tag input with suggestions
    { field: 'year', label: 'Collected', type: 'range', min: 1800, max: 2026, grouping: false }   // two number fields
  ],
  views: [{ id: 'all', name: 'All Records' }, { id: 'on-loan', name: 'On Loan', state: { f: { status: ['On Loan'] } } }]
});
```

| Part / attribute | What |
|---|---|
| `data-for="#table"` | the [data table](../table/) it narrows (`S4.table`); or pass `{ table }`, or `{ rows, onChange(state) }` for anything else |
| `data-key` | saved views and the chosen view are kept in this browser under that name |
| `data-url` | the state is written to the address query and read back on load: `?q=owl&family=Strigidae|Corvidae&year=1900..1950&sort=year:descending&view=on-loan`. It uses `replaceState` and keeps the hash, so `S4.pages` links (`#view/page/id`) still work |
| `.s4-filter-views` | the views as single-select filter chips; a dot on the chosen one says it was changed since |
| `[data-filter-add]` + its menu | Add Filter: one item per facet; choosing one opens the panel at that facet |
| `[data-filter-panel]` (`data-sheet`) | All Filters, with a badge counting the filters in force |
| `[data-filter-sort]` + its menu | the sortable columns and the direction (follows the table's own header sort) |
| `[data-filter-views]` + its menu | Save as New View, Update, Rename (in place), Delete (with Undo) |
| `.s4-filter-active` | the filters in force as input chips (Delete or Backspace on a chip's remove button works), and Clear All |
| `.s4-filter-count` | “1,204 of 5,000 records”: changes at once, announced politely when typing pauses |
| `.s4-filter-facets` in a `data-modeless` panel | every facet: choices with counts (what you would get with every other filter kept), a tag input for long lists, a range |
| `[data-filter-done]` | the panel's Show button: closes it (on a phone the panel covers the list); there is nothing to apply |

Script: `S4.filter(el, options)` returns the controller: `.state` (`{ q, f, sort }`), `.clear()` (with Undo),
`.useView(id)`, `.views`. Event: `s4-change { state, count, total, view }` on the element.

**When to use what**
- A search alone when people look for one thing by name; the full bar when they narrow by several properties.
- Choice facets for a handful of values (status, type); a tag input for long lists (people, places); a range for numbers
  and years. Five or six facets at most in the bar's Add Filter; the panel can hold more.
- Views for the questions people ask every week (“On Loan”, “Needs Conservation”). Not for one-off searches.
- Chips are right here because views and filters narrow a collection and there can be many (decision 0059); a button
  group is for one value that changes how the same thing is shown, and tabs are for swapping what is on the screen.

**Do**
- Keep the count next to the results; show the no-results state (`.s4-states` with a `no-results` part) with Clear Filters.
- Name views after the question they answer, in Title Case.
- One tonal tool: Add Filter (the main thing the bar is for); All Filters, Sort and Columns are `text` buttons with their
  label in `.s4-filter-label`, and View Options a plain icon button. On a phone the quiet tools show their icon only
  (the label stays for screen readers), so the tools fit one row under the search (decision 0065).

**Don't**
- Don't add an Apply button: filters act at once (decision 0054).
- Don't hide the filters in force behind the panel; the chips are how people see why something is missing.
- Don't focus the search when anything opens (decision 0049); the person taps it.

**Accessibility:** the bar is a `role="search"` field and real buttons; the views and the filters in force are labelled
groups; each chip's remove button names the filter (“Remove Family Strigidae”) and focus moves to the next chip when one
goes; facets are sections headed by their name, choices are real checkboxes with their count; the count is a polite
status that waits for typing to pause.
**Motion:** Reveal for renaming a view in place; Follow for the menus; Pop for the panel; State elsewhere.
**Tokens:** chip, search, list and floating panel tokens; label-large for the count and option counts, title-small for
facet titles; `--s4-space-*`.
