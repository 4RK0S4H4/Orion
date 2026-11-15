# Command palette

Search everything and run any action from one box. Opens with **mod+K** (⌘K or Ctrl K) anywhere, or from a button.
The desktop counterpart of the navigation bar; it works on a phone too.

The palette builds itself: there is no markup to write.

```html
<!-- a button that opens it -->
<button class="s4-icon-button" type="button" data-palette aria-label="Search And Commands"><span class="s4-icon" data-icon="search"></span></button>

<!-- any button or link becomes a command -->
<button class="s4-button" type="button" data-command="Archive Message" data-shortcut="mod+e">Archive</button>
```

```js
S4.palette.register([
  { label: 'New Message', group: 'Mail', icon: 'edit', shortcut: 'mod+n', run: function () { S4.sheet.open('compose'); } },
  { label: 'Export As CSV', group: 'Data', icon: 'export', keywords: 'download spreadsheet', run: exportCsv }
]);
```

| Where commands come from | How |
|---|---|
| The app's own | `S4.palette.register([{ label, group, icon, shortcut, keywords, run }])` |
| Buttons and links on the page | `data-command="Label"` (optional `data-command-group`, `data-command-keywords`); running it clicks the element; its `data-shortcut` is shown |
| The navigation | every destination appears as "Go To …" |
| Appearance | "Switch To Dark Mode" / "Light Mode" (turn off with `S4.palette.theme = false`) |

Script: `S4.palette.open()`, `S4.palette.close()`, `S4.palette.commands()`, `S4.palette.clear()`;
`S4.palette.shortcut = false` frees mod+K. `document` gets `s4-command { command }` when one runs.

**When to use what:** give every desktop app a palette: it is how people who know what they want skip the menus.
Put the app's ten or twenty real actions in it, named the way the buttons are. It does not replace visible
navigation or buttons; everything in it must also be reachable on screen.

**Do**
- Name commands as verbs in Title Case: "Archive Message", "Go To Settings".
- Group them (`group`) and add `keywords` for the words people actually type.
- Show the same shortcut in the palette, the menu and the tooltip.

**Don't**
- Don't put a destructive action that cannot be undone in the palette without its confirm.
- Don't open the palette by itself, and don't use mod+K for anything else.

**Accessibility:** a modal dialog with a combobox and a listbox; Arrow keys move, Enter runs, Escape closes, focus
returns to where it was. Opened with the keyboard, the cursor is in the box; opened by tap or click it is not, so no
keyboard jumps up on a phone (decision 0049), and the first key you press goes into the box.

**Motion:** Pop. **Tokens:** the dialog's glass, list and search tokens; `--s4-space-*`.
