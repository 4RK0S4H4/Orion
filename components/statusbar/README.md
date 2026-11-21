# Status Bar

A slim solid bar along the bottom of a desktop window for the state of things: saved and synced, what is selected,
where the cursor is, the zoom, the connection. Quiet chrome: small type, no fills at rest, the content leads.

```html
<footer class="s4-statusbar" aria-label="Status">
  <span class="s4-statusbar-item"><span class="s4-statusbar-dot" data-tone="success"></span>Saved</span>
  <span class="s4-statusbar-item" role="status" aria-live="polite">3 Selected</span>
  <span class="s4-statusbar-spacer"></span>
  <button class="s4-statusbar-item" type="button" data-menu="zoom-menu">100%</button>
</footer>
```

| Part / attribute | What |
|---|---|
| `.s4-statusbar` | The bar. In a `data-window` app it spans the window's last row; shown from 840 wide |
| `.s4-statusbar-item` | A segment: text, optionally an icon or dot before it. A `button` (or `a`) segment opens a menu (`data-menu`), a panel (`data-sheet`) or runs a command (`data-cmd`) |
| `data-tone="error"` on an item | The words turn error colored |
| `.s4-statusbar-dot[data-tone="success\|warning\|info\|error"]` | A dot beside words that already say the state |
| `.s4-statusbar-spacer` | Pushes what follows to the end |

**When to use:** a desktop app whose state people glance at while they work (an editor, a mail client, a data tool).
Not for actions (use the toolbar or the menus), not on a phone (each screen shows its own state), not in a web page.

**Do:** put what changes as you work on the left (sync, selection, position) and settings of the view on the right
(language, zoom, connection); write states as words ("Saved", "Offline: 3 changes waiting"). **Don't:** make a
segment the only way to reach what it opens; don't use color alone; don't fill it with buttons.

**Accessibility:** a `footer` with a name. A segment that changes as people work gets `role="status"` and
`aria-live="polite"` so it is announced without moving focus. Clickable segments are real buttons in the tab order.

**Tokens:** `--s4-size-statusbar`, `--md-sys-color-surface-container-low`, label-medium type, `--s4-color-success`,
`--s4-color-warning`, `--s4-color-info`.
