# Commands

One list of what an app can do, written once, and every way of doing it drawn from that list: the
[menu bar](../menubar/), menus and right-click menus, keyboard shortcuts, the [command palette](../palette/), buttons,
and a desktop shell's native menu. A command knows its label, icon, shortcut, whether it can run now and whether it is
on, so every place shows the same words, the same shortcut and the same state.

```js
S4.commands.add([
  { id: 'file.save', label: 'Save', group: 'File', icon: 'save', shortcut: 'mod+s',
    enabled: function () { return doc.dirty; }, run: function (ctx) { save(); } },
  { id: 'view.wrap', label: 'Word Wrap', group: 'View', type: 'check', shortcut: 'alt+z',
    checked: function () { return wrap; }, run: function () { wrap = !wrap; } },
  { id: 'zoom.100', label: '100%', type: 'radio', radio: 'zoom', palette: false,
    checked: function () { return zoom === 100; }, run: function () { zoom = 100; } }
]);
S4.commands.menu('app', [                                   // the menu bar: a list of menus
  { label: 'File', items: ['file.new', 'file.open', { label: 'Open Recent', items: ['recent.1'] }, '-', 'file.save'] },
  { label: 'View', items: ['view.wrap', '-', { heading: 'Zoom' }, 'zoom.90', 'zoom.100'] }
]);
S4.commands.menu('row-menu', ['edit.copy', 'edit.rename', '-', 'edit.delete']);   // a right-click menu
```

```html
<div class="s4-menubar" aria-label="Application" data-menus="app"></div>
<li data-context-menu="row-menu">…</li>                     <!-- the menu is made for you -->
<button class="s4-button" type="button" data-cmd="file.save">Save<kbd class="s4-kbd"></kbd></button>
```

| Command field | What |
|---|---|
| `id` | A stable name (`file.save`). Made up if missing. |
| `label`, `icon`, `group`, `keywords` | Title Case label, icon name, palette group, extra words people type |
| `shortcut` | `mod+s`, `mod+shift+t`, `alt+z`, `f2`. Runs from anywhere (not while typing unless it uses mod); shown the platform's way in menus, buttons and the palette |
| `run(ctx)` | What it does. `ctx.source` is the element, `'keyboard'` or `'palette'`; `ctx.target` is what a right-click menu was opened on |
| `enabled()` | False greys it out everywhere and stops its shortcut |
| `type: 'check' \| 'radio'`, `checked()`, `radio` | A check item, or one of a radio group (`radio` names the group) |
| `palette: false` | Keep it out of the palette (radio items, recent files) |

| Menu item form | What |
|---|---|
| `'file.save'` | A command |
| `'-'` | A divider |
| `{ heading: 'Zoom' }` | A group label |
| `{ label, icon, items: [...] }` | A submenu |
| `{ id, label }` | The same command under another label in this menu |

| Script | |
|---|---|
| `S4.commands.add(list)`, `.remove(id)`, `.get(id)`, `.list()` | The list |
| `S4.commands.run(id, ctx)` | Run one (if enabled) |
| `S4.commands.enabled(id)`, `.checked(id)` | Ask its state |
| `S4.commands.menu(name, items)` / `.menu(name)` | Define or read a named menu: renders into `.s4-menubar[data-menus=name]`, else into `<div class="s4-menu" id=name>` |
| `S4.commands.refresh()` | Ask every `enabled()` and `checked()` again (after your app's state changes; menus also refresh as they open) |
| `S4.commands.native(name)` | The menu as plain data (`{ label, submenu }`, `{ id, label, accelerator, enabled, type, checked }`, `{ type: 'separator' }`) with Electron-style accelerators (`CmdOrCtrl+S`), for a shell's native menu (see `examples/`) |
| `S4.commands.accelerator('mod+s')` | `CmdOrCtrl+S` |
| `[data-cmd="id"]` | Clicking runs it; label, disabled, `aria-pressed` (check commands) and an empty `<kbd class="s4-kbd">` follow the command |
| Events on `document` | `s4-command { command, context }` after one runs; `s4-commands` when the list or a state changed |

**When to use:** every app with more than a handful of actions, and every desktop app. Write the app's actions once
here, then decide where each appears. `S4.palette.register` still works and adds to this list.

**Do**
- Name commands as verbs in Title Case ("Archive Message", "Close Others"); keep one shortcut per command.
- Use the standard shortcuts of the platform's apps: mod+N new, mod+O open, mod+S save, mod+W close, mod+Z undo,
  mod+shift+Z redo, mod+F find, mod+comma settings, F2 rename.
- Make every command reachable on screen too (a button, a menu): shortcuts and the palette are for people who know.

**Don't**
- Don't put the same action in two commands with two labels.
- Don't hide a command (remove it) because it can't run now: disable it, so people learn where it lives.

**Accessibility:** commands render as real menu items (`menuitem`, `menuitemcheckbox`, `menuitemradio`) and buttons;
disabled items keep their place and say so (`aria-disabled`).

**Tokens:** none of its own; menus, the menu bar and the palette draw it.
