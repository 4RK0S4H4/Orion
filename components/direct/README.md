# Direct manipulation

Move things with your hand instead of through a menu: **reorder** by dragging, **swipe** a row for its actions,
**select several** and act on all of them. All three work with mouse, finger and keyboard.

```html
<!-- reorder -->
<ul class="s4-list" data-reorder>
  <li><div class="s4-list-item"><button class="s4-drag-handle" type="button" aria-label="Move Budget draft"></button>…</div></li>
</ul>

<!-- swipe -->
<li data-swipe>
  <div class="s4-list-item">…</div>
  <div class="s4-swipe-actions"><button class="s4-icon-button" data-variant="tonal" aria-label="Archive" data-swipe-primary>…</button></div>
</li>

<!-- select several -->
<div class="s4-selection-bar" id="bar" hidden>
  <button class="s4-icon-button" aria-label="Clear Selection" data-selection-clear>…</button>
  <span class="s4-selection-count" data-selection-count></span>
  <button class="s4-icon-button" aria-label="Archive Selected">…</button>
</div>
<ul class="s4-list" data-selectable data-selection-bar="#bar">…</ul>
```

| Attribute | What |
|---|---|
| `data-reorder` (`="horizontal"` for a row of things) | its children can be reordered; fires `s4-reorder { item, from, to, fromList, toList }` |
| `data-reorder-group="name"` | lists that share it pass items between them (board columns) |
| `.s4-drag-handle` | the grip (a button). With one, only the grip drags; without, the whole item drags (a short hold on touch) |
| `data-reorder-fixed` | a child that stays where it is |
| `data-swipe` + `.s4-swipe-actions` | a row whose actions are uncovered by dragging it sideways; `data-swipe-primary` runs on a long swipe |
| `data-selectable` + `data-selection-bar="#id"` | rows can be picked; the bar shows the count and the actions |
| `data-select-toggle` | a part of a row (its picture) that starts selecting when tapped |

Script: `S4.reorder.move(item, toIndex, toList)`, `S4.swipe.open(row)` / `close(row)`, `S4.selection.items(el)`,
`clear(el)`, `all(el)`; event `s4-selection { items, count }`.

How selecting starts: hold a row on a touch screen, Ctrl/⌘-click or Shift-click with a mouse, **Shift+Space (or Ctrl+Space)
on a focused row with the keyboard**, or tap a `data-select-toggle`. After that a tap, a click, Space or Enter adds or
removes a row instead of opening it. Escape ends it (unless an open menu, dialog or panel takes the Escape first), and when
the bar goes away focus lands on a row (never `<body>`). Put the `.s4-selection-bar` inside the `.s4-top-app-bar` and it
takes the bar's place while anything is selected.

**Keys and clicks (decision 0078):** the shared selection model (`core/select.js`), the same as tables, trees and
listboxes. Up and Down move between items (in a grid of tiles, Left and Right along a line, Up and Down by a line);
Shift with them, Home, End, Page Up or Page Down extends the range from the anchor; Ctrl/⌘ with them moves without
selecting; Shift+click selects the range from the anchor (replacing the last range from it), Ctrl/⌘+click adds or removes
one, Ctrl+Shift+click adds a range; Ctrl/⌘+A selects every item shown. A plain click or Space opens the item until
something is selected (its items are links and buttons that open things); on touch nothing changed. Every change is said
("3 selected"). Picked rows keep `aria-checked` (the items are buttons, not options, so the list is not a listbox).

**When to use what**
- Reorder: anything whose order is the person's own (priorities, playlists, columns, steps, a board).
- Swipe: the one or two most common actions on a row, on phones. They must also be in the row's menu or on its page.
- Select several: lists where people clean up in bulk (mail, files, tasks).

**Do** give every handle an `aria-label` that names its item; act at once and offer Undo.
**Don't** make dragging the only way to do something; don't swipe to do something that cannot be undone.

**Accessibility:** a handle is a button: Space picks up, Arrow keys move (Left and Right cross between grouped
lists), Space drops, Escape puts it back, and each step is announced. Swipe actions are real buttons reachable with
Tab (decision 0076: they stay in the focus order, covered by the row, and Tab onto one opens its row; Tab away closes it;
an action that removes the row hands focus to the next one). Picked rows carry `aria-checked`.
**Motion:** Morph calm for rows making room and settling; nothing animates while your finger is down.
**Tokens:** `secondary-container`, `primary`, `surface-container-highest`, `--s4-size-touch-target`, `--s4-space-*`.
