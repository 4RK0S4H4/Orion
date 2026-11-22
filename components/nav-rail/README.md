# Navigation Rail

> **Decision 0043:** the rail is side navigation. Items are rows (icon, label beside it). Collapsed it is one icon wide
> (72) and labels become hover titles; expanded (240) the labels show; it expands by itself from 1200
> (`data-expand="off"` to stop that). The menu button is a hamburger. The header's `.s4-fab` is a solid primary button
> in the same row shape, never glass. Optional `.s4-nav-rail-title` group titles and a `.s4-nav-rail-footer` that stays
> at the bottom. Where the text below still describes labels under icons or a 96dp rail, this note wins.

Top-level destinations at the side of expanded windows (840 and up). M3 Expressive rail: collapsed (96dp) or expanded,
with an optional menu button and FAB. Uses the same `.s4-nav-item` as the [navigation bar](../nav-bar/) (styles in
`nav-bar.css`).

```html
<nav class="s4-nav-rail" aria-label="Main">
  <div class="s4-nav-rail-header">
    <button class="s4-icon-button" type="button" data-rail-toggle aria-expanded="false" aria-label="Expand Navigation"
            data-label-expand="Expand Navigation" data-label-collapse="Collapse Navigation"><span class="s4-icon" data-icon="menu"></span></button>
    <button class="s4-fab" type="button" aria-label="Add Bill"><span class="s4-icon" data-icon="add"></span><span class="s4-fab-label">Add Bill</span></button>
  </div>
  <div class="s4-nav-rail-items">
    <a class="s4-nav-item" href="#home" aria-current="page"><span class="s4-nav-indicator"><span class="s4-icon" data-icon="home"></span></span><span class="s4-nav-label">Home</span></a>
    …
  </div>
</nav>
```

| Attribute / part | Purpose |
|---|---|
| `data-expanded` | Expanded rail: wider (`--s4-nav-rail-expanded-width`, default 240), labels beside icons, label-large, a 56dp pill spanning icon and label, surface-container. |
| `[data-rail-toggle]` | Button that flips `data-expanded`; `aria-expanded` and the optional `data-label-expand/collapse` labels follow. |
| `data-s4-moving` (set by the script) | While the edge moves (Morph), the contents keep the expanded layout and the edge clips them, so no label wraps or reflows mid-motion (issue 70); cleared when the width arrives. Don't set it yourself. |
| `.s4-nav-rail-header` | Menu button and FAB slot. In the collapsed rail the FAB's label is hidden (icon FAB); expanded it shows (extended FAB). |
| `.s4-nav-rail-items` | The destinations (`.s4-nav-item`, see nav bar). |

**As a desktop source list (issue 60):** the expanded rail is the sidebar of a desktop app. It takes sections with
titles (`.s4-nav-rail-title`), sections that fold away, a [tree](../tree/), a footer for the account and Settings, a grip
to resize it, and it still collapses to icons. There is no second sidebar component.

```html
<nav class="s4-nav-rail" aria-label="Project" data-expanded data-resizable data-resize-key="app-sidebar">
  <div class="s4-nav-rail-items">
    <a class="s4-nav-item" href="#strings" aria-current="page">…</a>
    <div class="s4-nav-rail-group">
      <button class="s4-nav-rail-title" type="button" aria-expanded="true">Languages</button>
      <div class="s4-nav-rail-group-items"><a class="s4-nav-item" href="#fr">…</a>…</div>
    </div>
    <div class="s4-nav-rail-title">Files</div>
    <ul class="s4-tree" aria-label="Files" data-density="compact">…</ul>
  </div>
  <div class="s4-nav-rail-footer">…account, Settings…</div>
</nav>
```

| Part / attribute | What |
|---|---|
| `.s4-nav-rail-group` + `button.s4-nav-rail-title` + `.s4-nav-rail-group-items` | A section whose title folds it (Reveal); `aria-expanded` follows; remembered with `data-resize-key`. Collapsed to icons, a folded group still shows its icons |
| `.s4-tree` inside | A tree in a section; its icons line up with the items; hidden while the rail is collapsed |
| `data-resizable` (+ `data-resize-key`) | A grip on the end edge (`role="separator"`): drag, or Left / Right on it, Home / End for 200 and 400, Enter collapses or expands; dragged narrower than 150 it collapses. Fires `s4-resize { size, collapsed }` |

**Behaviour (`nav-rail.js`):** item clicks move `aria-current` and fire `s4-change { item, index, value }`; the toggle
fires `s4-toggle { expanded }`. The width animates on the spatial spring, labels fade in on effects; icons stay in place
because the expanded pill starts where the collapsed one did. In an [app shell](../app/) the rail is sticky at full
height from 840 and mirrors the nav bar.

**Do**
- Put the screen's main action in the FAB slot; give the FAB an `aria-label` (the label is hidden when collapsed).
- One filled action per screen (decision 0070): while the open view or page shows a filled button of its own (Approve,
  Reply, Order Refill), the rail's action steps down by itself to the elevated look (a neutral fill, the accent label
  and icon) and is filled again on a view with none. `data-variant="elevated"` on the FAB keeps it elevated.
- Keep destinations identical to the nav bar.

**Don't**
- Don't put secondary actions or settings toggles in the rail.
- Don't use the rail on compact windows; use the nav bar.

**Accessibility:** `nav` landmark with `aria-label`; `aria-current="page"`; the toggle exposes `aria-expanded`. Items keep
≥ 48dp targets. Forced colors: the rail gets an end border.

**Tokens:** `--s4-size-nav-rail`, `--s4-size-nav-indicator-*`, `--s4-shape-nav-indicator`, `--s4-size-icon-button`,
`--md-sys-color-surface` / `-surface-container`, `--md-sys-typescale-label-large-*`, `--md-sys-motion-spring-spatial`.
