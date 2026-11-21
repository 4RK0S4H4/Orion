# Menu Bar

The application menu inside the window: File, Edit, View, Window, Help. For Windows and Linux shells and for web apps
in a window; on a Mac the system draws the menu bar, so a Mac shell builds the native menu from the same
[commands](../commands/) and sets `<html data-native-menu>`, which hides this one. Not shown on a phone (under 600):
the same commands are in the palette and in each screen's own menus.

```html
<header class="s4-titlebar">
  <div class="s4-menubar" aria-label="Application" data-menus="app"></div>
  <span class="s4-titlebar-title">Field Notes</span>
</header>
<script>S4.commands.menu('app', [{ label: 'File', items: ['file.new', 'file.open', '-', 'file.save'] }, …]);</script>

<!-- or by hand -->
<div class="s4-menubar" role="menubar" aria-label="Editor">
  <button class="s4-menubar-item" type="button" data-menu="m-file">File</button>
</div>
<div class="s4-menu" id="m-file" aria-label="File">…</div>
```

| Part / attribute | What |
|---|---|
| `.s4-menubar` | The bar (`role="menubar"`). In the title bar it never drags the window; or put it in its own row at the top |
| `data-menus="name"` | Fill it from `S4.commands.menu(name, [{ label, items }])` |
| `.s4-menubar-item` + `data-menu` | One menu's button (by hand); `data-access="x"` picks its Alt letter (default: its first letter) |
| `<html data-native-menu>` | Hide it: the shell draws the native menu bar (a Mac shell sets this) |
| Script | `S4.menubar.render(bar, items)`, `S4.menubar.focus(bar)` |

The menus are the glass [menu](../menu/), with submenus, check and radio items, disabled items and shortcut hints in the
platform's spelling (⌘S on a Mac, Ctrl+S elsewhere).

**Where things live (platform conventions):** File (New, Open, Open Recent, Save, Close; on Windows and Linux also
Settings and Exit), Edit (Undo, Redo, Cut, Copy, Paste, Find), View (panels, zoom, full screen), the app's own menus,
Window (on a Mac), Help (shortcuts, about). On a Mac, Settings and Quit live in the app menu the system draws; a shell
puts them there from the same commands (see `examples/`).

**Do:** keep menu names to one word; give every item a shortcut that the platform's apps use for the same thing; show
disabled items instead of removing them. **Don't:** put the only way to do something in the menu bar; don't build a
menu bar on a phone or a Mac shell.

**Accessibility:** WAI-ARIA menubar. Left and Right move along the bar (and switch the open menu), Down, Enter or Space
open a menu at its first item, Up at its last, Home and End, a letter jumps to a menu; inside a menu the arrow away from
it moves to the next menu, the arrow back closes a submenu. F10 or a lone Alt moves focus to the bar and back; Alt with
a letter opens that menu (not while typing on a Mac, where ⌥ types characters); Escape closes and returns focus. One tab
stop for the bar.

**Tokens:** `--s4-size-menubar-item`, `--s4-shape-control`, `--md-sys-color-secondary-container` (the open menu's item),
label-large type.
