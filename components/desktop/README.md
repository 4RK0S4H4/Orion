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
| `.s4-window-controls` > `.s4-window-control[data-window-action="minimize\|maximize\|close"]` | Window buttons for frameless Windows and Linux shells that draw none (decision 0072): empty buttons with an `aria-label`, in that order, last in the title bar. Full cells like Windows' (46 by the bar's height, touching the window's top and end edges: the corner pixel hits Close), a firm layer on hover and press, Orion's Line Duotone `window-*` icons written in by `desktop.js` (decisions 0074, 0079), Close `error` on hover and press only. Each click fires `s4-window { action, maximized }` on the document: wire it to the shell. Hidden on a Mac shell, in the window controls overlay and in full screen. |
| `data-label-restore` on Maximize | The label while `<html data-window-state>` holds `maximized` (default Restore); the icon changes to `window-restore` with it |
| `hidden data-shell-controls` on `.s4-window-controls` | Written in the page, shown by `examples/shell-bridge.js` when the shell says it draws no buttons (`controls: 'own'`) |
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
`S4.desktop.inspector(el, on)`. Events: `s4-window { action, maximized }`, `s4-context { target }`.

## The window

**Drag regions.** The title bar is `app-region: drag` (Electron and installed web apps; Tauri reads a
`data-tauri-drag-region` attribute instead: see `examples/README.md`). Everything you click in it is `no-drag`. Never make content
draggable as a window.

**Window buttons.** On a Mac they are the traffic lights at the start: a frameless window keeps about 80 of room for
them (`data-controls="start"`), full screen gives it back. On Windows and Linux they are at the end: an installed web app
with window controls overlay draws its title bar into `env(titlebar-area-*)` (`.s4-titlebar` already reads it), and
Electron's `titleBarOverlay` does the same. Draw `.s4-window-controls` only in a frameless shell that draws none.

**Orion's own window controls** (decision 0072, issue 69) look like Orion and act like Windows':

```html
<header class="s4-titlebar">
  <span class="s4-titlebar-title">Ledger</span>
  <div class="s4-window-controls">
    <button class="s4-window-control" type="button" data-window-action="minimize" aria-label="Minimize"></button>
    <button class="s4-window-control" type="button" data-window-action="maximize" aria-label="Maximize"></button>
    <button class="s4-window-control" type="button" data-window-action="close" aria-label="Close"></button>
  </div>
</header>
```

- *Hit area:* each control is a full cell, 46 wide (`--s4-size-window-control`) and the bar's whole height, with no gap
  between them or to the window's top and end edges (the bar drops its end padding when it holds them). Throw the
  pointer into the top corner and it is on Close; along the top edge it is on the control below (Fitts's law). The cell
  is square on purpose: a rounded cell would miss the corner pixel.
- *Look:* a firm filled layer (8) on hover and press (State), never a disc or a pill, inset 4 on every side (decision
  0077), so Close's layer is as far from the window's top edge as from its end edge. Close's outer corner is concentric
  with the window's: `--s4-window-corner` minus the inset where the window is rounded (8 in a restored Windows shell, as
  Windows 11 draws it; set it to a frame's radius when the page draws the window in a rounded frame), the firm 8 where
  it is square (a browser tab, maximized, Linux); Orion's duotone
  icons `window-minimize`, `window-maximize`, `window-restore`, `window-close` (Solar's square tiles) at 24
  (`--s4-size-window-control-icon`), written in by `desktop.js` (decision 0074; any other icon inside is hidden); Close turns `error` on hover and press only, never red at rest. While
  `<html data-window-state>` holds `maximized` (the shell sets it), Maximize draws Restore and is labelled Restore.
  A window not in front dims the icons. On Close's error fill the second tone sits at 0.5, so the tile stays visible.
- *Right to left:* they mirror to the start with Close at the far start, as Windows mirrors a right-to-left window;
  the corner rule holds for the top left.
- *Drag and resize:* the controls are `app-region: no-drag`. In a Windows or Linux shell, while the window is neither
  maximized nor full screen, the bar's top 4px are not a drag region, so the shell's resize band along the top edge
  still works (Electron lets a drag region win over it); the system's invisible borders resize the other edges. So, as
  on Windows, the very top pixel resizes a restored window and is Close's in a maximized one. Tauri: put
  `data-tauri-drag-region` on the bar only, never on the controls.
- *Proof:* the page checker and the suite fail a control under 40 wide or shorter than its bar, Close short of the
  window's end edge, a corner or top-edge pixel that hits anything else in the bar, Close's layer more than 1px nearer
  one of the top and end edges than the other, and a control whose layer is inset differently from Close's (0077).

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
| Window buttons | Traffic lights at the start (the system's) | At the end; mirrored to the start in right-to-left | At the end (GNOME: close only, by default) |
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

**Tokens:** `--s4-size-titlebar`, `--s4-size-window-control`, `--s4-size-menubar-item`, `--s4-size-doc-tab`, `--s4-size-statusbar`,
`--s4-size-tree-row`, `--s4-size-tree-indent`, `--s4-size-inspector`, `--s4-density-compact-*`.

**A real shell:** [`examples/`](../../examples/) has an Electron skeleton (frameless window, drag regions, traffic
lights or the Windows overlay, the native menu built from `S4.commands.native`, focus and full-screen states) and an
installed web app with window controls overlay. Neither can be run in this repository's CI; they are kept small and
follow the documented APIs.
