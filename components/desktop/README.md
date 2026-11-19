# Desktop Windows

What an Orion app needs to live in a desktop window or ship as a desktop app (an installed web app, Electron, Tauri),
on the same shell and components (decision 0043), and the anatomy of a desktop window (issue 60).

```html
<html lang="en" data-density="auto">
<div class="s4-app" data-window>
  <header class="s4-titlebar">                                        <!-- drags the window -->
    <div class="s4-menubar" aria-label="Application" data-menus="app"></div>
    <span class="s4-titlebar-title">Ledger</span>
  </header>
  <nav class="s4-nav-rail" aria-label="Main" data-resizable>…</nav>   <!-- the sidebar / source list -->
  <div class="s4-app-body">
    <div class="s4-doc-tabs">…</div>                                  <!-- the open documents -->
    …
  </div>
  <aside class="s4-inspector" aria-label="Inspector">…</aside>        <!-- properties of the selection -->
  <footer class="s4-statusbar" aria-label="Status">…</footer>
</div>
```

## The anatomy

| Part | Where | What |
|---|---|---|
| Title bar | here, `.s4-titlebar` | Drags the window; holds the title, the menu bar, document tabs or a toolbar; room for the system's window buttons |
| Menu bar | [`menubar/`](../menubar/) | File, Edit, View… inside the window (Windows, Linux, web); hidden where the system draws it (Mac) |
| Commands | [`commands/`](../commands/) | One list of actions feeding the menu bar, menus, shortcuts, the palette and a shell's native menu |
| Sidebar | [`nav-rail/`](../nav-rail/) | The rail, expanded: destinations, folding sections, a [tree](../tree/), account and Settings at the foot; resizable, collapses to icons |
| Document tabs | [`doc-tabs/`](../doc-tabs/) | The open files or records: close, reorder, reopen, unsaved dot |
| Content | [`layout/`](../layout/) | List and detail (`.s4-split[data-resizable]`), each pane scrolling on its own |
| Inspector | here, `.s4-inspector` | A resizable pane at the window's end for the properties of the selection |
| Status bar | [`statusbar/`](../statusbar/) | Sync, selection, position, zoom, connection |
| Palette | [`palette/`](../palette/) | mod+K: every command and destination by name |

On a phone the same page is the normal touch app: the title bar, menu bar, document tabs, inspector and status bar
step out (under 600 or 840), the rail becomes the nav bar, and each list opens its detail as a page.

## Classes and attributes

| Class / attribute | What |
|---|---|
| `data-window` on `.s4-app` | The app fills the window and never scrolls as a page; the body and each pane scroll on their own. Thin scrollbars, arrow cursor on controls, chrome text can't be selected. |
| `data-density="auto"` (best on `<html>`, so menus and panels follow) | Pointer-sized controls where the pointer is a mouse (see `base/density.css`); `compact` forces it. |
| `.s4-titlebar` | A title bar that drags the window (`app-region: drag`). Buttons, links, fields, the menu bar, tabs and anything with `data-no-drag` stay clickable. Hidden under 600. |
| `data-variant="tabs"` on the title bar | The document tabs are the title bar (no title); the space around them drags. A browser-like document window. |
| `data-variant="unified"` on the title bar | A taller bar (52) that holds the window's toolbar: title at the start, then search and buttons. A tool window. |
| `.s4-titlebar-title`, `data-align="start"` | The title, centered (or at the start) |
| `.s4-titlebar-spacer` | Pushes what follows to the end |
| `data-controls="start"` on the title bar | Room for the Mac's traffic lights in a frameless window (also automatic with `<html data-platform="mac" data-shell="electron\|tauri">`) |
| `.s4-window-controls` > `.s4-window-control[data-window-action="minimize\|maximize\|close"]` | Window buttons for frameless shells that do not draw their own; each click fires `s4-window { action }` on the document. Wire it to the shell. |
| `.s4-inspector` (+ `.s4-inspector-header`, `-title`, `-body`, `details.s4-inspector-group`, `.s4-inspector-fields`, `.s4-inspector-row`) | The properties pane at the window's end: solid, resizable from its start edge (drag, arrows, Home/End, Enter hides it), `data-resize-key` remembers the width, groups fold with Reveal. From 840 wide. `S4.desktop.inspector(el, on)`; `--s4-inspector-width`. |
| `data-shortcut="mod+k"` | That key combination clicks the element. `mod` is ⌘ on Apple platforms, Ctrl elsewhere; also `shift`, `alt`. |
| `<kbd class="s4-kbd">` | Shows a shortcut. Empty inside a `data-shortcut` or `data-cmd` element (or with `data-for="id"`), it is filled in the platform's spelling. |
| `data-context-menu="menu-id"` | Right-click (long press on touch, Shift+F10 or the menu key) opens that menu at the pointer or under the element. The menu fires `s4-context { target }` and has `.contextTarget`. |
| `<html data-platform>` | `mac`, `windows`, `linux`, `ios`, `android`; set once by the script unless the page set it |
| `<html data-shell="electron\|tauri\|pwa">` | Set by your shell bridge (see `examples/`) |
| `<html data-native-menu>` | The shell draws the native menu bar: the in-window menu bar hides (a Mac shell sets it) |
| `<html data-window-blurred>` | Set while the window is not in front: title bar, menu bar and status bar step back to `on-surface-variant`, tree selections turn neutral |
| `<html data-window-state="fullscreen overlay maximized">` | `fullscreen` (no room kept for the traffic lights), `overlay` (an installed web app draws into the title bar area); set by the script where the browser knows, or by the shell |

Script: `S4.desktop.platform`, `S4.desktop.format('mod+k')` (⌘K or Ctrl+K), `S4.desktop.matches(event, 'mod+k')`,
`S4.desktop.inspector(el, on)`. Events: `s4-window { action }`, `s4-context { target }`.

## The window

**Drag regions.** The title bar is `app-region: drag` (Electron and installed web apps; Tauri reads a
`data-tauri-drag-region` attribute instead: see `examples/README.md`). Everything you click in it is `no-drag`. Never make content
draggable as a window.

**Window buttons.** On a Mac they are the traffic lights at the start: a frameless window keeps about 80 of room for
them (`data-controls="start"`), full screen gives it back. On Windows and Linux they are at the end: an installed web app
with window controls overlay draws its title bar into `env(titlebar-area-*)` (`.s4-titlebar` already reads it), and
Electron's `titleBarOverlay` does the same. Draw `.s4-window-controls` only in a frameless shell that draws none.

**In front or not.** A window that is not in front dims its chrome a step and its selections turn gray, as every
desktop does, so you can tell which window has the keyboard. Content never dims.

**Selection and cursor.** Chrome (title bar, menu bar, rail, tabs, status bar, buttons, labels) cannot be selected as
text and keeps the arrow cursor; content (messages, documents, fields, tables) stays selectable, and links in content
keep the pointing hand.

**Full screen.** Nothing is kept for window buttons; the title bar stays (it holds the menu bar and tabs).

## Platform conventions (express them in Orion, don't copy their look)

| | Mac | Windows | Linux (GNOME, KDE) |
|---|---|---|---|
| Menu bar | The system's, at the top of the screen (shell builds it from the commands) | In the window (`.s4-menubar`), or none with everything in the palette and toolbars | In the window |
| Window buttons | Traffic lights at the start | At the end | At the end (GNOME: close only, by default) |
| Settings | App menu, "Settings…", ⌘, | File or Tools menu, "Settings", Ctrl+, | Main menu, "Preferences" or "Settings", Ctrl+, |
| Quit | App menu, ⌘Q | File, Exit (Alt+F4 closes) | File, Quit, Ctrl+Q |
| Rename | Enter | F2 | F2 |
| Delete | ⌘⌫ | Delete | Delete |
| Redo | ⇧⌘Z | Ctrl+Y (and Ctrl+Shift+Z) | Ctrl+Shift+Z |
| Context menu key | none (Ctrl-click) | Shift+F10, menu key | Shift+F10, menu key |

## Settings: a window, not a dialog

On a desktop, settings are their own surface: a view (or, in a shell, a second window) with a sidebar of categories
and a pane, a search box that finds a setting across categories, and every change applied at once with Undo in a
snackbar: no Save button, no OK and Cancel. mod+comma opens it. On a phone the same settings are the
[settings template](../../templates/settings.html)'s list, then a page per category. The
[desktop template](../../templates/desktop-app.html) shows both from one markup: a `.s4-split` of categories and pane.

## Inspector or tool panel?

| | Inspector (`.s4-inspector`) | Tool panel (`.s4-side-sheet[data-modeless]`, decision 0054) |
|---|---|---|
| Shows | The properties of what is selected, and changes them | A tool that works on the whole page: filters, find and replace, a color picker |
| Lives | In the window's layout, at its end, solid; the content makes room | Floats over the content (glass) and can be moved away |
| Follows | The selection: it changes as you pick another item | Nothing: it stays as it is |
| On a phone | Steps out; the same properties belong in the item's own page | Becomes a modal panel |
| Use when | People edit properties of items all day (an editor, a design or data tool) | People reach for the tool now and then |

## When, Do, Don't

**When:** `data-window` for anything used like an application (mail, an editor, a dashboard that stays open). A page
people read (article, landing page) keeps normal page scrolling. Add the menu bar, document tabs, inspector and status
bar only when the app has those jobs: a small tool is a title bar, a sidebar and content.

**Do:** give every primary action a command with a shortcut and show it in its menu item and tooltip; keep right-click
menus short and make every item reachable another way; keep chrome quiet so content leads (one weight of type, no
fills at rest, solid surfaces).

**Don't:** draw `.s4-window-controls` when the system already draws its own; don't put the only way to do something in
a context menu, the menu bar or a shortcut; don't make the window scroll as a page; don't put glass on the title bar,
sidebar, status bar or inspector (they don't float).

**Accessibility:** shortcuts never fire while typing unless they use `mod`; context menus are normal menus (arrows,
Escape, typeahead) and return focus; the grips are separators with values and arrow keys; every landmark has a name.

**Tokens:** `--s4-size-titlebar`, `--s4-size-menubar-item`, `--s4-size-doc-tab`, `--s4-size-statusbar`,
`--s4-size-tree-row`, `--s4-size-tree-indent`, `--s4-size-inspector`, `--s4-density-compact-*`.

**A real shell:** [`examples/`](../../examples/) has an Electron skeleton (frameless window, drag regions, traffic
lights or the Windows overlay, the native menu built from `S4.commands.native`, focus and full-screen states) and an
installed web app with window controls overlay. Neither can be run in this repository's CI; they are kept small and
follow the documented APIs.
