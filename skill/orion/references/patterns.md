# Orion screen patterns

How the components combine into screens. Each pattern names the components and why; markup details for each
component are in `components.md`. Live demo app: https://4rk0s4h4.github.io/Orion/demo/

## Contents

- Layout helpers
- Dashboard
- List and detail
- Settings
- Dialogs and panels
- Forms
- Empty, loading and error states
- One accent job per screen
- Making it the app's own (from the brand trial)
- Theme controls
- Selecting several
- Saving data
- Theming API
- From the product templates

## Layout helpers

| Class | What it does |
|---|---|
| `.s4-page-header` | Title on the left, actions on the right, wraps on phones. Put the screen's headline and its filled/tonal buttons here. |
| `.s4-section` + `.s4-section-title` | A vertical group with its own heading (title-medium, emphasized). |
| `.s4-stack` | Column with the layout gap. `--s4-gap` changes it (a `--s4-space-*` token). |
| `.s4-row` | Wrapping row, 8 apart, centered. For button rows and chip-like groups. |
| `.s4-grid` | Responsive grid of equal columns, at least `--s4-min` (280px) wide. For cards and dashboard panes. |

Two-pane screens use the canonical layouts (`.s4-split`, below). Page width: `data-width="reading"` (720) on
`.s4-content` or a view for text, forms and settings; `wide` (1600) for tables and editors; the default (1200) for
dashboards. For anything else, write a small grid in the app's CSS with `--s4-space-*` gaps and a container query on
`.s4-app` at 840:

```css
.ledger-split { display: grid; gap: var(--s4-layout-gap); }
@container s4-app (width >= 840px) { .ledger-split { grid-template-columns: minmax(0, 2fr) minmax(0, 3fr); } }
```

## Dashboard

```
page header: "Overview" + period button group (connected, single)
grid of panes: KPI panes (label, emphasized number, delta status) · a chart pane · a short list pane ("Due This Week")
```

- Key numbers are **stats** (`.s4-stat`) in one pane with an `.s4-stat-row` (two per row on phones, four on desktop):
  label, a display-small emphasized number, the change as a `.s4-status`. Template: `templates/dashboard.html`.
- Period or scope switch: a **connected button group** with `data-select="single"` in the page header, not tabs.
  Tabs are for sibling content inside one screen.
- Charts: `<figure class="s4-chart" data-type="column|bar|line|area|donut|spark" data-labels data-values>` (decision
  0051): one series wears the accent, several use `--s4-chart-1…6`, and every chart has its table view. Draw a chart by
  hand only for a shape `.s4-chart` does not have (paired bars, an aging bar): role colors read at run time
  (`S4.util.css('--md-sys-color-primary')`), redrawn on the `s4-theme` event, gridlines `outline-variant`.
- A dashboard has no FAB unless one action clearly dominates the app.

## List and detail

Use the canonical layout (`references/components.md`, Layout), not a hand-made grid:

```html
<div class="s4-split">
  <section class="s4-split-pane" aria-label="Bills"><ul class="s4-list" role="listbox" aria-label="Bills">…rows with data-split-open…</ul></section>
  <section class="s4-split-pane" data-sticky aria-label="Bill">
    <div class="s4-row"><button class="s4-button" data-variant="text" type="button" data-split-back><span class="s4-icon" data-icon="back"></span>Bills</button></div>
    …detail: title, status, an .s4-dl of fields, one filled action…
  </section>
</div>
```

- **Phone and medium (< 840):** one pane at a time. A row with `data-split-open` shows the detail (shared axis), the
  phone's Back gesture or the `data-split-back` button returns to the list. Template: `templates/list-detail.html`.
- **Expanded (≥ 840):** list and detail side by side; the detail pane is sticky. Select the first item on load so
  the detail is never empty. Changing the selection just re-renders the detail; nothing slides between panes. The open
  row is marked neutral by itself (decision 0070): the detail's heading names it, the navigation keeps the accent.
- The list is a `role="listbox"` `.s4-list` when it drives a detail pane (arrow keys, `aria-selected`); fill the detail
  on its `s4-change`. Use plain links when each row navigates to its own page.
- Detail header: title, a `.s4-status`, and the item's actions as one filled button + icon buttons with a `more-vert`
  menu for the rest. Fields go in a description list (`.s4-dl`).

## Settings

- Group settings into `.s4-pane`s, one per topic, each with a `.s4-pane-title` and an optional `.s4-pane-supporting`.
- Inside a pane, a `.s4-list` of rows: a switch as the trailing element for on/off, a trailing value + chevron for a
  choice that opens a menu (a few options) or a page (many). Never a dialog for a choice.
- Switches apply immediately (no Save button). Confirm with nothing, or a snackbar only when the effect is invisible.
- A destructive setting goes last, in a neutral pane (never `data-color="error"` on the pane, decision 0066), with a
  `data-variant="tonal" data-color="error"` button that opens a confirm dialog (serious and cannot be undone: the one
  place a dialog is right; smaller removals use the inline confirm or act at once with Undo). Its answers: Cancel `data-variant="tonal"`, then the destructive one
  `data-variant="tonal" data-color="error"` named by what it does ("Delete Account").
- Appearance settings: see **Theme controls**.

## Dialogs and panels (decision 0064)

- Walk the placement ladder first (decision 0047): in place, an expand, a menu, a pane, a page, a floating panel. A
  dialog only for a question the app cannot go on without: deleting something for good, leaving with unsaved work, a
  permission. A reversible action just happens and offers Undo in a snackbar. Expect one or two dialogs in a whole app.
- A dialog asks: a headline that is the question in sentence case ("Delete this bill?"), one or two lines of what
  happens, and two answers that say what they do. Cancel first and `data-variant="tonal"`; the answer last
  (`data-variant="tonal" data-color="error"` when it destroys, filled otherwise). Never a single OK (something to read is
  a page, a notice is a snackbar) and never a form (the page checker fails both).
- On a phone, dialogs and floating panels sit in the bottom of the screen within reach of the thumb, the answers fill
  its width (two side by side, three or more stacked with Cancel at the bottom), and a tap outside, a swipe down,
  Escape or Back puts it away. This is automatic; do not position them yourself. `data-persistent` keeps a tap outside
  or a swipe from dismissing one (Escape and Cancel still do).
- A tool for the page behind it (filters, an inspector) is a `data-modeless` floating panel whose controls act at once:
  no Apply button (decision 0054).

## Forms

- One column, fields at full width up to about 560px (`max-width: 35rem` on the form). Group long forms into sections.
- Text fields are one look: filled, medium-rounded (12; never a pill, never squared, decision 0024), label above, no
  outline. An error keeps the field's normal fill and adds the message (decision 0043).
- Labels in Title Case, helper text and errors as sentences. `<form class="s4-form">` validates on leaving a field and on
  submit, never while typing; set `data-error="Enter an amount above $0.00."`. Never move the cursor into a field, not
  even the first invalid one after a submit (decision 0049): the error is shown on the field and named in the form's
  status; the person taps the field.
- Actions at the end, end-aligned: Cancel then the main action (filled), named by what it does ("Save Bill"). The
  screen's one filled action rule applies (below): a form inside a page that already has a filled action uses tonal.
- In a floating panel the same rules apply; the actions go in `.s4-sheet-actions` with `data-close` values, and the
  code handles `s4-close`. A form never goes in a dialog (decision 0064; the page checker fails it): a short one opens
  in place (`.s4-expand`), a task with no place in the page is a floating panel, a long one is a page.
- Required fields: mark the optional ones "(Optional)" instead when most fields are required.

## Empty, loading and error states

Every list, table and pane sits in `.s4-states` (decision 0051; `components.md`, States) with a part per state:

```html
<div class="s4-states" data-state="loading" data-offline="auto">
  <div data-when="loading" data-rows="5"></div>
  <ul class="s4-list" data-when="ready offline">…</ul>
  <div data-when="empty" class="s4-empty">
    <span class="s4-empty-icon"><span class="s4-icon" data-icon="bills"></span></span>
    <h2 class="s4-empty-title">No Bills Yet</h2>
    <p class="s4-empty-text">Bills you add or forward to your inbox show up here.</p>
    <button class="s4-button" data-variant="tonal" type="button">Add Bill</button>
  </div>
  <div data-when="error" class="s4-empty">…<button class="s4-button" data-variant="tonal" type="button" data-retry>Try Again</button></div>
</div>
```

**Empty:** what will appear here and the one action that fills it. No search results: say what was searched and offer
to clear filters; no illustration.

**Loading:** skeleton rows shaped like the content (`data-rows`), never a lone spinner; under about 300ms show nothing.
Refreshing something already shown keeps it and shows a linear `.s4-progress` at the top of the area.

**Error:** inline where the content would be, as a sentence plus Try Again ("Couldn't load bills. Nothing was lost.").
A failed background action: snackbar with Retry. Never a dialog for a recoverable error.

## One accent job per screen

Decision 0070 (refines 0068). Look at the whole window, not one pane: at rest it shows **one filled action** and **one
accent selection**.

- **One filled action:** the action the person takes next on the work in front of them (Approve the open line, Reply
  to the open ticket, Mark Taken for the next dose). Every other action on the screen is `elevated`, `tonal` or `text`.
  The rail's main action steps down to elevated by itself while the open view shows a filled button, and is filled
  again on a view with none. A second place for the same action (a Book button in a day pane when the rail says Book a
  Boat) is `elevated`.
- **One accent selection, and it belongs to the navigation** (the rail's or nav bar's current place). Everything else
  that is selected is neutral (`surface-container-highest`, the heavier label): the open row of a list beside its detail
  (automatic for `data-split-open` rows), the picked day beside its day pane, a tree's open file in the rail (0068).
- **No pressed chip at rest:** a filter set that narrows a collection has no "All" chip. Use
  `.s4-chip-set[data-select="single"][data-clearable]` (none pressed is everything; pressing the pressed chip clears it).
- **Not counted:** the accent as text, icons, meters, chart marks and a sent message; values in a field (tag chips);
  a site header's action, which is the hero's action kept in reach. Chart columns are 16 wide at most, so a wide pane
  spaces them instead of fattening them.
- The page checker warns when the first screen shows more than one filled accent action (`check.mjs`).

## Making it the app's own (from the brand trial)

Lessons from building an app from this skill alone with a brand handed over (round 0060: a medicines app, cobalt, a
humanist display face, soft corners, the large scale). The dials gave it the brand's color, corners and size, and every
page passed the checker, but the first pass looked like Orion in blue. What made it the product's own:

- **Draw the one element the product is about**, from Orion's parts or rules (decision 0053): the day's doses as a
  `.s4-milestones` road under the next dose, each medicine's own tile on `--s4-category-1…6` named in words. Look for it
  before laying out panes: the thing people would sketch on a napkin.
- **Lead with the hero:** the number or moment the screen exists for as `.s4-stat[data-size="hero"]` with the one filled
  action beside it, then the lists. A screen that starts with a list reads as stock.
- **The display face is a system stack.** `humanist`, `rounded` and `geometric` resolve to faces the device has
  (Seravek, Calibri, Ubuntu…); where it has none they fall back to a near face, and on Android and Linux that is often
  plain sans. A brand whose face matters ships it: one `@font-face` file named first in a `custom` stack.
- **An icon the set lacks** (a pill, a leaf, a dumbbell) is drawn in the set's style (24 grid, a duotone half at
  `opacity=".5"`, `fill="currentColor"`) and added once with `S4.icon.add({ name: '<svg body>' })`.
- **Wide windows:** a long single list stretched to 1200 reads empty; give it a supporting column (what runs out next,
  the day so far) or cap the view at `data-width="reading"`.

## Theme controls

## Theme controls

An app that offers appearance settings uses exactly these, so every app feels the same. They need no script:
`data-theme-mode`, `data-theme-contrast` and `data-theme-seed` call `S4.theme` themselves and follow the restored theme.

```html
<section class="s4-pane" aria-labelledby="appearance">
  <h2 class="s4-pane-title" id="appearance">Appearance</h2>
  <div class="s4-button-group" data-connected data-select="single" data-theme-mode aria-label="Theme">
    <button class="s4-button" data-variant="tonal" type="button" value="light"><span class="s4-icon" data-icon="light-mode"></span>Light</button>
    <button class="s4-button" data-variant="tonal" type="button" value="system">System</button>
    <button class="s4-button" data-variant="tonal" type="button" value="dark"><span class="s4-icon" data-icon="dark-mode"></span>Dark</button>
  </div>
  <div class="s4-button-group" data-connected data-select="single" data-theme-contrast aria-label="Contrast">
    <button class="s4-button" data-variant="tonal" type="button" value="0">Standard</button>
    <button class="s4-button" data-variant="tonal" type="button" value="0.5">Medium</button>
    <button class="s4-button" data-variant="tonal" type="button" value="1">High</button>
  </div>
  <div class="s4-swatches" data-theme-seed aria-label="Theme Color">
    <button class="s4-swatch" type="button" data-seed="#000000" aria-label="Mono"></button>
    <button class="s4-swatch" type="button" data-seed="#4f46e5" aria-label="Indigo"></button>
    <button class="s4-swatch" type="button" data-seed="#00796b" aria-label="Teal"></button>
  </div>
</section>
```

- Mono is always the first swatch. Offer 3–6 seeds; the app's own seed (if it has one) is second.
- `S4.theme.restore(key, defaults)` at start-up (see the page shape in SKILL.md) makes every change save under that key.
  Use the same key in the head script that sets `data-theme` before first paint.
- Present the theme controls as the app's own Appearance section (ideally beside a small preview drawn in color roles);
  every control is declarative: `data-theme-mode`, `data-theme-contrast`, `.s4-swatches[data-theme-seed]` (40dp with
  `data-size="s"` inside a pane), `data-brand-dial="surfaces|gray|page|corners|display|text|energy|displayWeight"`.
- Template: `templates/settings.html`.

## Copying text (decision 0073)

- `S4.util.copy(text, { done: 'Copied', fail: '…' })` is the only way to write to the clipboard: it returns a promise of true or false
  that never rejects and shows the snackbar. Never call `navigator.clipboard.writeText` yourself; the page checker fails it.
- Code that measures layout once (a custom sliding highlight) calls `S4.util.onLayoutChange(fn)` to measure again when `dir`, `lang` or a type dial changes.

## Focus, Undo and numbers (decision 0076)

- **Focus never falls to `<body>`.** Before your code hides or removes something that may hold focus (a bar, a button that becomes a progress
  bar, a row), call `S4.util.release(box, to)`: focus moves to `to` (an element, or nothing for main). After an edit commits, a cancel, an Undo or
  a command, the keyboard must still be somewhere: the suite and the checker fail `<body>`.
- **Undo.** `S4.snackbar({ text, action: 'Undo', onAction })`: several in a row each stay undoable (newest first) and focus goes back to what had it.
  Removing table rows: `var gone = table.remove(ids)` then `table.restore(gone)` in Undo (the rows return where they were; `rows.concat(gone)` does not).
- **Numbers.** A table column `data-edit="number"` refuses garbage out loud; add `data-required`, `data-min`, `data-max` and `data-format="integer"` as the data needs.
- **Pages from an id.** In `s4-open`, if the id is not in your data call `event.preventDefault()`: the page does not open and the URL keeps the view's address.
- **Swipe rows** need their actions in the row's markup (they take Tab); starting a selection by keyboard is Shift+Space.

## Selecting several (decision 0078)

- Every collection that selects several uses Orion's one selection model (`core/select.js`): `S4.table` or a `.s4-table` with a
  select column, a `.s4-list[role="listbox"][aria-multiselectable="true"]`, a `.s4-tree[aria-multiselectable="true"]`, or
  `data-selectable` (select several). Never hand-roll selection: the page checker fails a multi-select collection the model
  does not drive.
- What people get, everywhere: click selects one (in a select-several list, a click opens until something is selected),
  Shift+click a range from the anchor, Ctrl/⌘+click one more, Ctrl+Shift+click another range, a row's checkbox one more;
  Shift with the arrows, Home, End, Page Up and Page Down extend, Ctrl with the arrows moves without selecting, Space and
  Shift+Space, Ctrl/⌘+A every item shown (rows not drawn too), Escape clears. Touch is unchanged (hold, then tap). Each change
  is said ("12 selected"). Single-select collections ignore the range keys.
- In a data table read the selection from data, never the DOM: `table.selection()` (ids), `table.selectedRows()`,
  `table.select(ids, { add })`, `table.clear()`, and `s4-change` with `type: 'select'` (`ids`, `count`, `hidden`, `added`,
  `removed`, `why`). Selected rows a filter hides stay selected and the bar says "N Not Shown"; act on what the bar counts.
- A data table with a select column: a mouse click on a row selects it; the row opens by its own link, Enter or a
  double-click. Give every row a link or `data-page-open` in its name cell so a single click can still open it.

## Saving data

- Small apps: `localStorage` under one key per app (`'<app-name>-data'`), JSON, written after each change. Wrap reads in
  try/catch and fall back to defaults; storage can be blocked.
- Use the same app-name prefix for the theme key, so an app's settings are easy to find and clear.
- Anything bigger, shared or sensitive belongs on a server; say so rather than storing it in the browser.
- After a destructive change, keep the removed item in memory until the Undo snackbar times out.

## Theming API

```js
S4.theme()                                     // → { seed, variant, mode, contrast, … }
S4.theme({ seed: '#2e7d32' })                  // every accent role from a seed; variant 'auto': fidelity for a muted or deep seed, vibrant for a vivid one
S4.theme({ seed: '#e4002b', variant: 'fidelity' })   // or name it: 'fidelity' | 'tonal' | 'vibrant' | 'expressive' | 'auto'
S4.theme.variantFor('#6e2a5e')                 // → 'fidelity': what auto picks for a seed
S4.theme({ seed: null })                       // back to monochrome
S4.theme({ mode: 'system' | 'light' | 'dark' })
S4.theme({ contrast: 0 | 0.5 | 1 })            // standard, medium, high
S4.theme.restore('app-theme', { mode: 'system' })   // apply the saved theme or defaults, keep saving under the key
S4.theme.restore('app-theme', { mode: 'system', seed: '#a3482a', display: 'serif' }, { only: ['mode'] })
                                               // a fixed brand: only the visitor's light/dark choice is read and saved
document.addEventListener('s4-theme', (e) => redrawCharts(e.detail))   // after any change
S4.util.css('--md-sys-color-primary')          // read a token's current value (for canvas, charts)
```

A region can carry its own theme (decision 0056): any dial works on any element and nests.

```html
<nav class="s4-nav-rail" data-theme="dark">…</nav>                       <!-- a dark rail in a light app -->
<section class="s4-site-section" data-accent="#0b6e4f" data-surfaces="tinted">…</section>   <!-- a branded band -->
```
```js
S4.theme({ mode: 'dark', corners: 'firm' }, el)    // the same at runtime on one element; nothing is saved
el.setAttribute('data-accent', '#0b6e4f')          // also works: a data-accent changed later recolors its element
S4.theme({ energy: 'calm' })                       // motion energy: calm | standard | lively
```

Set the seed once at start-up for an app with a brand color: `S4.theme.restore('app-theme', { seed: '#2e7d32', mode: 'system' })`.
If the brand is fixed (the visitor never picks a color), pass `{ only: ['mode'] }` so the brand is never saved and
never leaks into another page that shares the key. Dials written on `<html>` in markup are already the starting state.
Put `data-theme` (a scoped theme) on the rounded block itself: the element that carries it paints its own surface, so a
scope on a square wrapper shows a square patch behind a rounded child.
Color is generated with Material Color Utilities (`m3color.js`, loaded on demand from next to `orion.js`); it writes
the same zero-specificity blocks as the token file, so dark mode, high contrast and glass keep working.

## From the product templates

Lessons from building the templates as real products (decision 0060).

- **One-task screen on a desktop** (onboarding, sign-in, a calculator's input): from 960 make the step a split, the
  picture or preview on one side on a square tile, the words and controls beside it, the step dots and buttons under both.
  On a phone, the picture on top.
- **An article head** above `.s4-prose`: a kicker (`label-large`, often the date or section), the title on
  `display-small` or larger in the display face, a lead in `body-large`, the byline with avatar. The prose `h1` is a
  section heading, too small for a magazine title.
- **A structured writing format** (a screenplay, a recipe, a poem, a contract) is the app's own element on the mono or
  serif token, with its own indents and numbering, never `.s4-prose` restyled.
- **Artwork and drawings of real objects** (a product, a record sleeve, a plant pot) sit on the fixed roles
  (`primary-fixed`, `secondary-fixed`, `on-secondary-fixed`), which stay the same in light and dark. Kinds of things
  (tags, desks, revision colors) take `--s4-category-1…6`, always named in words.
- **Words over a picture:** stack them (the picture, then the words, or a grid area each); never keep them apart with
  a fixed margin, which collides at 200% text. A label centered on a point uses `inset-inline-start: 50%` plus a grid or
  a wrapper, not `translate`, so it mirrors in right-to-left.
- **A scrolling chip row** (`data-scroll`) takes the whole row; a sort or view switch beside it goes on its own row.
- **A number the screen exists for** is `.s4-stat[data-size="hero"]`, once.
- **A group that follows something else** (the line type under the caret) is set with `S4.buttonGroup.set(group, v)`;
  a select whose options change is changed in place, its picker follows.
- **In a thread:** an internal note is `.s4-message[data-kind="note"]`; a card the thread carries (an order, a report)
  is `.s4-message[data-kind="card"]` with the card inside.

## Build notes (from the Phase 6 demo)

- **Rail FAB:** in the app shell the view's FAB is `data-fixed` inside its view. On wide screens put the same action in the
  rail's FAB slot instead of a second FAB (the rail's slot is the only second place it may appear). From 840 the app
  shell hides the views' `data-fixed` FABs when the rail has one, so the pinned FAB never floats over content.
- **List and detail on wide screens:** a list with a detail pane splits side by side from 840; below that the detail is a
  page (`.s4-subpage`, decision 0050), never a dialog.
- **Validating before a sheet closes:** `data-close="save"` closes at once. To validate first, give Save no `data-close`,
  check the fields, then call `S4.sheet.close(id, 'save')`.
- **Search plus your own filters:** `data-filter-empty` needs an element of its own ("No bills match “zzz”"); keep the
  first-run empty state in a different element. After re-rendering a filtered list, dispatch `input` on the search field.
- **Charts in tabs or hidden views:** a canvas in a hidden panel has zero size; redraw on `s4-theme`, on tab change, or
  with a `ResizeObserver`. Take sizes and colors from tokens (`S4.util.css`); don't hard-code pixels in canvas code.
- **Status pills in panes:** a pane stacks its children, so a pill stretches; wrap it in `.s4-row` to keep it inline.
- The page checker audits every app-shell view, not only the one visible on load; pages (`.s4-subpage`) and states
  other than the first are still worth a look by hand (open them with their link, `#view/page/id`).
