# Tree View

Nested things you open and close: folders and files, chapters and scenes, regions and sites. In a desktop sidebar, in a
phone's file browser, in a pane.

```html
<ul class="s4-tree" aria-label="Files" aria-multiselectable="true" data-item-menu="file-menu">
  <li class="s4-tree-item" aria-expanded="true">
    <div class="s4-tree-row"><span class="s4-icon" data-icon="folder"></span><span class="s4-tree-label">Quests</span>
      <span class="s4-tree-trailing"><span class="s4-tree-count">412</span></span></div>
    <ul role="group">
      <li class="s4-tree-item"><div class="s4-tree-row"><span class="s4-icon" data-icon="document"></span><span class="s4-tree-label">dialogue.json</span></div></li>
    </ul>
  </li>
  <li class="s4-tree-item" aria-expanded="false" data-lazy><div class="s4-tree-row">…</div></li>
</ul>
```

| Part / attribute | What |
|---|---|
| `.s4-tree` | The tree (`role="tree"`); give it an `aria-label` |
| `.s4-tree-item` + `.s4-tree-row` | An item and its row; a folder has `aria-expanded` and a `ul[role="group"]` |
| `.s4-tree-label`, `.s4-tree-trailing`, `.s4-tree-count`, `.s4-badge` | Name, end slot, a quiet count, an attention badge |
| `aria-selected="true"` | Selected (filled, `secondary-container`) |
| `aria-multiselectable="true"` | Several can be selected |
| `data-lazy` on a folder | Its children load when it first opens (`S4.tree.load`) |
| `data-item-menu="menu-id"` | Every item gets that right-click menu (`menu.contextTarget` is the item) |
| `data-open-on-click` | A single click on a folder row opens it too (a sidebar of groups) |
| `data-no-drag` | No dragging rows |
| `--s4-tree-guides` | The guide line color (`transparent` drops them) |

| Script | |
|---|---|
| `S4.tree.render(tree, nodes)` | Build from data: `{ label, icon, count, badge, id, open, selected, children: [] | lazy: true }` |
| `S4.tree.load(tree, fn)` | `fn(item)` returns a Promise of nodes; a loading row shows meanwhile, an error row offers Retry |
| `.select(item, { add, range })`, `.selected(tree)`, `.open(item, on)`, `.focus(item)`, `.reveal(item)` | Selection, opening, focus |
| `.rename(item)` | Start renaming (F2 does it) |
| `.cut(items)`, `.paste(folder)` | Move without dragging |
| Events on the tree | `s4-change { items, item }`, `s4-select { item }` (chosen: Enter or double-click), `s4-toggle { item, open }`, `s4-rename { item, value, old }`, `s4-move { items, target }` (both cancelable) |

**Keys:** Up and Down move, Right opens or goes to the first child, Left closes or goes to the parent, Home and End,
a letter jumps by name, `*` opens every sibling, Enter chooses (on a Mac it renames, as in the Finder), F2 renames.
Several (the shared selection model, decision 0078): a click or a plain arrow selects the one it lands on (a source list);
Shift with a click, the arrows, Home, End, Page Up or Page Down selects the range from the anchor (replacing the last
range from it); Ctrl or ⌘ with a click adds or removes one, with Shift it adds a range; Ctrl or ⌘ with the arrows moves
without selecting, then Space adds or removes and Shift+Space selects to the anchor; mod+A selects every item shown;
Escape clears (after a cut, Escape cancels the cut first). Each change is said ("4 selected"). mod+X then mod+V on a
folder moves.
Shift+F10 or the menu key opens the item's menu.

**Moving:** drag rows onto a folder with a mouse or pen (the folder fills); never drag-only: cut and paste, and the
item's menu, do the same. A finger scrolls the tree and long-presses for the menu.

**Rename** is the one time the tree puts the cursor in a field: you asked to type a name (F2, Enter on a Mac, or a
Rename command), the same reasoning as the palette opened by a key (decision 0049). It never happens on its own.

**Look:** rows are small list rows: touch size by default (48) and 28 in compact density; hover is its own box that
leans in from where the pointer came (decision 0044); corners follow the dial. Each level steps in by
`--s4-size-tree-indent` (20, compact 14) and past the fourth level by half, so deep paths fit a narrow sidebar; a faint
guide line runs down each open folder. Labels wrap, never cut. Opening is Reveal and the chevron turns (Bend). In a
window that is not in front, selected rows turn neutral.

**When to use:** a hierarchy people browse and act on. For one level, use a [list](../list/); for two short levels, a
list with subheaders or the rail's groups.

**Do:** put counts at the end, quietly; give folders and items different icons. **Don't:** nest deeper than people can
follow without a breadcrumb; don't make a click on a file both select and open in a desktop app (Enter or a
double-click opens).

**Accessibility:** WAI-ARIA tree: roles, `aria-level`, `aria-expanded`, `aria-selected`, one tab stop with roving focus;
the focused row shows the ring; loading folders are `aria-busy`. Forced colors: the selection is Highlight.

**Tokens:** `--s4-size-tree-row`, `--s4-size-tree-indent`, `--s4-shape-control`, `--md-sys-color-secondary-container`,
`--md-sys-color-outline-variant` (guides), label-large type, `--s4-motion-bend`, Reveal.
