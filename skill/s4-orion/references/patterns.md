# S4 Orion screen patterns

How the components combine into screens. Each pattern names the components and why; markup details for each
component are in `components.md`. Live demo app: https://4rk0s4h4.github.io/s4-orion/demo/

## Contents

- Layout helpers
- Dashboard
- List and detail
- Settings
- Forms
- Empty, loading and error states
- Theme controls
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
- Charts: draw with role colors read at run time (`S4.util.css('--md-sys-color-primary')`), redraw on the `s4-theme`
  event. Series beyond two: `primary`, `tertiary`, `secondary`, `error` in that order. Gridlines `outline-variant`.
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
- **Expanded (≥ 840):** list (360) and detail side by side; the detail pane is sticky. Select the first item on load so
  the detail is never empty. Changing the selection just re-renders the detail; nothing slides between panes.
- The list is a `role="listbox"` `.s4-list` when it drives a detail pane (arrow keys, `aria-selected`); fill the detail
  on its `s4-change`. Use plain links when each row navigates to its own page.
- Detail header: title, a `.s4-status`, and the item's actions as one filled button + icon buttons with a `more-vert`
  menu for the rest. Fields go in a description list (`.s4-dl`).

## Settings

- Group settings into `.s4-pane`s, one per topic, each with a `.s4-pane-title` and an optional `.s4-pane-supporting`.
- Inside a pane, a `.s4-list` of rows: a switch as the trailing element for on/off, a trailing value + chevron for a
  choice that opens a dialog or menu.
- Switches apply immediately (no Save button). Confirm with nothing, or a snackbar only when the effect is invisible.
- A destructive setting goes last, in a pane with `data-color="error"`, with a tonal error button that opens a
  confirm dialog (serious and cannot be undone: the one place a dialog is right; smaller removals use the inline
  confirm or act at once with Undo).
- Appearance settings: see **Theme controls**.

## Forms

- One column, fields at full width up to about 560px (`max-width: 35rem` on the form). Group long forms into sections.
- Text fields are one look: a filled pill (label above, no outline; a textarea gets large corners). An error is a filled error-container field.
- Labels in Title Case, helper text and errors as sentences. Validate on blur and on submit, not on every keystroke;
  set `data-error="Enter an amount above $0.00."` and move focus to the first invalid field on submit.
- Actions at the end, end-aligned: Cancel (text) then the main action (filled), named by what it does ("Save Bill").
- In a dialog or sheet the same rules apply; the actions go in `.s4-dialog-actions` / `.s4-sheet-actions` with
  `data-close` values, and the code handles `s4-close`.
- Required fields: mark the optional ones "(Optional)" instead when most fields are required.

## Empty, loading and error states

**Empty** (nothing yet, or no search results), centered in the space the content would fill:

```html
<div class="s4-stack" style="--s4-gap: var(--s4-space-3); align-items: center; text-align: center; padding-block: var(--s4-space-12);">
  <span class="s4-icon" data-icon="bills" style="--s4-icon-size: var(--s4-size-icon-large)"></span>
  <h2 class="s4-title-large">No Bills Yet</h2>
  <p class="s4-body-medium s4-on-surface-variant">Bills you add or forward to your inbox show up here.</p>
  <button class="s4-button" data-variant="tonal" type="button">Add Bill</button>
</div>
```

(In app code, put those inline styles on an app class.) No search results: say what was searched and offer to clear
filters; no illustration.

**Loading:** under a second, show nothing. Longer: a linear indeterminate `.s4-progress` at the top of the area being
loaded (or under the top app bar for the whole screen); keep the old content visible when refreshing. A button that
starts work can show a circular progress in place of its icon and `aria-disabled="true"`.

**Error:** inline where the content would be, as a sentence plus a Retry button ("Couldn't load bills. Check your
connection and try again."). A failed background action: snackbar with Retry. Never a dialog for a recoverable error.

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
  container-transform dialog opened with `S4.dialog.open(id, { from: row })`.
- **Validating before a sheet closes:** `data-close="save"` closes at once. To validate first, give Save no `data-close`,
  check the fields, then call `S4.sheet.close(id, 'save')`.
- **Search plus your own filters:** `data-filter-empty` needs an element of its own ("No bills match “zzz”"); keep the
  first-run empty state in a different element. After re-rendering a filtered list, dispatch `input` on the search field.
- **Charts in tabs or hidden views:** a canvas in a hidden panel has zero size; redraw on `s4-theme`, on tab change, or
  with a `ResizeObserver`. Take sizes and colors from tokens (`S4.util.css`); don't hard-code pixels in canvas code.
- **Status pills in panes:** a pane stacks its children, so a pill stretches; wrap it in `.s4-row` to keep it inline.
- The page checker only inspects the view that is visible on load. Check the other views by hand.
