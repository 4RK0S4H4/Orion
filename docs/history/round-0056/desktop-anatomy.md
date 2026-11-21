# Workstream desktop-anatomy: issue 60

Branch `round56/desktop-anatomy` (worktree `.claude/worktrees/desktop-anatomy`). Takes the review's Desktop Apps area
from "a title bar and shortcuts" to the whole anatomy of a desktop window, proven in a real template and a shell example.

## Built (paths)
| Piece | Where | Class / API |
|---|---|---|
| Command registry | `components/commands/` (new) | `S4.commands.add/remove/run/get/list/enabled/checked/menu/refresh/native/accelerator/build`, `[data-cmd]`, events `s4-command`, `s4-commands` |
| Menu bar | `components/menubar/` (new) | `.s4-menubar`, `.s4-menubar-item`, `data-menus`, `data-access`, `<html data-native-menu>`, `S4.menubar.render/focus` |
| Status bar | `components/statusbar/` (new, CSS only) | `.s4-statusbar`, `.s4-statusbar-item`, `.s4-statusbar-dot`, `.s4-statusbar-spacer` |
| Document tabs | `components/doc-tabs/` (new) | `.s4-doc-tabs`, `.s4-doc-tabs-list`, `.s4-doc-tab`, `.s4-doc-tab-label`, `-close`, `-text`, `data-modified`, `S4.docTabs.*` |
| Tree view | `components/tree/` (new) | `.s4-tree`, `.s4-tree-item`, `.s4-tree-row`, `.s4-tree-label`, `.s4-tree-count`, `data-lazy`, `data-item-menu`, `S4.tree.*` |
| Submenus | `components/menu/menu.js` | `data-submenu="id"` on an item; `S4.position(…, { side: true })` |
| Source list | `components/nav-rail/` | `.s4-nav-rail-group` + `button.s4-nav-rail-title` + `.s4-nav-rail-group-items`; a tree inside; `data-resizable` + `.s4-nav-rail-grip`; no leftover pill when the current item is in the footer |
| Window chrome | `components/desktop/` | `.s4-titlebar[data-variant="tabs"|"unified"]`, `.s4-titlebar-spacer`, `<html data-shell>` (traffic lights automatic on a Mac shell), `data-window-blurred`, `data-window-state` (fullscreen, overlay, maximized), keyboard context menus (Shift+F10, menu key), wider selection and cursor policy, `S4.desktop.matches`, command shortcuts |
| Inspector | `components/desktop/` | `.s4-inspector` (+ header, title, body, `details.s4-inspector-group`, `.s4-inspector-fields`, `.s4-inspector-row`, grip), `S4.desktop.inspector(el, on)`, `--s4-inspector-width` |
| Palette unified | `components/palette/palette.js` | lists `S4.commands` (enabled, `palette !== false`); `S4.palette.register` now adds to the registry |
| Tokens | `tokens/src/spacing.tokens.json`, `components/base/density.css` | `--s4-size-statusbar` 28, `-menubar-item` 28, `-doc-tab` 40 (compact 32), `-tree-row` 48 (compact 28), `-tree-indent` 20 (compact 14), `-inspector` 288 |
| Template | `templates/desktop-app.html` | **Parley**, a translation workbench (see below) |
| Shell examples | `examples/` (new top-level folder) | `electron/` (package.json, main.js, preload.js), `installed-web-app/` (manifest + page), `shell-bridge.js`, README with Tauri notes |
| Suite | `tests/suite.mjs` | `desktopKeys()`: menu bar (F10, Right, Down, Right inside a menu, Escape twice), a submenu (Right opens, Left closes), tree (Down, Home, Right opens, Left closes), document tabs (Right, Delete, mod+Shift+T), Shift+F10 context menu; new components in `DIAL_COMPONENTS` and `dialAudit`'s FOLLOW list |
| Docs | `components/desktop/README.md` (rewritten), READMEs of commands, menubar, statusbar, doc-tabs, tree; additions to menu, nav-rail, palette, tabs READMEs; `docs/framework.md` (anatomy, public API, events); `scripts/build.mjs` groups; `templates/index.html` (Parley's card only) |

## The product: Parley (so other batches can avoid it)
| | |
|---|---|
| Product | **Parley**, a translation workbench for game studios. Inès Moreau, French lead at Lanternfish Games, translating their lighthouse game *Saltreach* |
| Accent | signal vermilion `#e4572e`, `variant: 'fidelity'`, neutral surfaces |
| Dials on `<html>` | `data-gray="cool"`, `data-corners="firm"`, `data-type-display="system"`, `data-type-text="system"` (a desktop tool should read like the desktop it runs on), `data-energy="calm"`, `data-buttons="tonal"` (Approve names `filled`), `data-density="auto"` |
| Scoped theme | the in-game preview is `data-theme="dark"` (the night on Saltreach point, in light mode too) |
| Own elements | the in-game preview (a night scene drawn from shapes in the color roles; the game's own dialogue box with a portrait, clamped to its three lines, saying in words whether the line fits), the length meter (characters against the line's limit), placeholder pills (`{player}` in mono, missing ones in the error container), translation-memory matches with their percentage, language progress in the sidebar tree |

## Every visible choice, and why (for the decision record)
1. **One list of commands feeds everything** (`S4.commands`). The palette, menus, the menu bar, shortcuts, buttons and a
   shell's native menu read the same command, so a label, shortcut or disabled state can never disagree. `S4.palette.register`
   and `data-shortcut` stay (unified, not a third way): registered palette commands are registry commands.
2. **Menu bar items are quiet labels on the chrome**, filled (`secondary-container`) only while their menu is open; their
   corners follow the dial. Menus are the existing glass menu (Follow). Hidden under 600 and with `data-native-menu`.
3. **Check and radio items in command menus show a check mark, not a fill** (desktop convention; the fill reads as
   "selected row"). Disabled items stay in place.
4. **Submenus open beside their item** with the first item lined up, close with the arrow back or Escape, and keep their
   parents open; choosing closes the chain. Pointer rest of 160ms opens them.
5. **Status bar: text first, no fills at rest**, clickable segments a step stronger in color, tone dots only beside words;
   from 840 wide.
6. **Document tabs are filled pills, not the nav-family tabs** (0059): the current tab takes the content's own surface
   (it *is* the document), the rest are quiet labels; a dot replaces the close button while unsaved. No motion on
   switching (a document is not a view to slide to). Closing unsaved work closes and offers Reopen (0047), never asks first.
   Labels end in an ellipsis: **a sixth truncation place** beyond the five in 0058 (the full name is in All Tabs and the
   tab's title). Hidden under 600.
7. **Tree rows are small list rows**: Edges Lean hover (0044), `secondary-container` selection, corners from the dial,
   touch size by default and 28 in compact. Indent steps by 20 (14), **half steps past level four**, faint guide lines;
   labels wrap, never cut. Opening is Reveal, the chevron Bend. Drag to move is mouse and pen only; cut and paste and the
   item menu do the same.
8. **Rename is the one place a script puts the cursor in a field**: F2 (Enter on a Mac) or a Rename command is the person
   asking to type, the palette's reasoning in 0049. Flag for the owner: this reads 0049 as "never unasked"; if the owner
   wants it stricter, rename needs a second tap into the field.
9. **The sidebar is the rail** (no second navigation component): folding sections whose titles are buttons (a folded
   group still shows its icons when the rail is collapsed), a tree per section (hidden collapsed), account and Settings
   in the footer, a grip to resize (200 to 400; dragged below 150 it collapses).
10. **Inspector is solid and in the layout**, not floating: the content makes room; groups fold; compact fields (the
    rich inputs: combobox, number field, tag input). README has a table: inspector versus tool panel (0054).
11. **Settings is a view** (or a second window in a shell): categories and a pane in a `.s4-split`, search across
    categories with match counts, every change applies at once with Undo in a snackbar; mod+comma. On a phone the split
    is the list, then a category with Back. Uses number field, color field, combobox, tag input, time field, password.
12. **A window not in front steps back**: title bar, menu bar and status bar text to `on-surface-variant`, tree
    selections neutral (`surface-container-highest`). Content never dims. Kept AA.
13. **Title bar variants**: `tabs` (no title, tabs are the bar), `unified` (52 tall, title at the start, a toolbar);
    traffic-light room is automatic with `data-shell` on a Mac and given back in full screen.
14. **Keyboard hints on filled controls take the control's color** (`currentColor` 14%), fixing low contrast of a kbd on a
    filled button.

## Changelog lines
- Added: `S4.commands`, one list of an app's actions feeding the menu bar, menus, right-click menus, shortcuts, buttons
  (`data-cmd`), the palette and a shell's native menu (`S4.commands.native`).
- Added: menu bar (`.s4-menubar`), status bar (`.s4-statusbar`), document tabs (`.s4-doc-tabs`), tree view (`.s4-tree`). With commands, 77 components (72 + 5).
- Added: submenus in menus (`data-submenu`); keyboard context menus (Shift+F10, the menu key).
- Added: the rail as a source list: folding groups, a tree inside, `data-resizable`.
- Added: title bar variants `tabs` and `unified`; `<html data-shell>`, `data-native-menu`, `data-window-blurred`,
  `data-window-state`; the inspector pane (`.s4-inspector`).
- Added: tokens `--s4-size-statusbar`, `-menubar-item`, `-doc-tab`, `-tree-row`, `-tree-indent`, `-inspector`.
- Added: `examples/` with an Electron shell, an installed web app with window controls overlay, and a shell bridge.
- Changed: the desktop app template is Parley, a translation workbench with the whole desktop anatomy and its own brand.
- Changed: `S4.palette.register` adds to `S4.commands`; registered shortcuts now run from anywhere.
- Fixed: the rail's sliding highlight stayed on the list when the current destination was in the footer.
- Fixed: a collapsed rail's main action grew tall when its hidden label wrapped.
- Fixed: a keyboard hint inside a filled button had low contrast.

## What the skill should tell Claude
- Every desktop app: actions as `S4.commands`, menus as `S4.commands.menu(name, …)`; never write a menu's items, a
  shortcut handler and a palette entry separately.
- Use the anatomy only for the jobs the app has: a small tool is title bar, sidebar and content; add the menu bar,
  document tabs, inspector and status bar when there are files, properties and state to show.
- Document tabs only for things the person opens and closes; a fixed set of views is content tabs (0059).
- Inspector for properties of the selection used all day; tool panel (`data-modeless`) for occasional tools.
- Settings in a desktop app is a view with categories, search and instant changes with Undo; never a dialog.
- A shell: start from `examples/`; set `data-shell`, let a Mac shell draw the native menu from `S4.commands.native`.
- Standard shortcuts: mod+N/O/S/W/Z, mod+shift+Z, mod+F, mod+comma, F2 (Enter on a Mac), Shift+F10.

## Hub links to add
- `components/menubar/menubar.html`, `components/doc-tabs/doc-tabs.html`, `components/statusbar/statusbar.html`,
  `components/tree/tree.html`, `components/commands/commands.html`, `components/desktop/desktop.html` (updated).
- `templates/desktop-app.html` (Parley), `examples/README.md` (GitHub source link; not a page to open on Pages).

## Lessons (Parley)
- **Easy:** the dials alone made it a different product (system type plus firm corners plus cool gray reads "desktop
  tool" at once); the rich inputs fit the inspector and settings unchanged; the rail, split, palette and snackbar carried
  the archetype; a scoped dark region made the game preview without any custom colors.
- **Held back / worked around:**
  - Menus and panels live on `<body>`, so `data-density` on `.s4-app` did not reach them: density must be on `<html>`
    for a desktop app (now documented). *Small, do next:* say so in the density README.
  - The list's selected row in a fidelity accent is a strong fill; tonal looked calm but turned the brand brown. *Needs the
    owner:* a "selection strength" dial (accent selection versus neutral selection) would let a vivid brand keep calm rows.
  - Nested component init order: a control added by one component's init (doc tabs' All Tabs button) was not wired by
    an earlier component's init when scripts load one by one; fixed by calling `S4.init` on what the component adds.
    *Small, do next:* core could re-run inits for nodes added during boot.
  - `--s4-split-list` and the inspector width had to be set by the app at 1280 (list 320, inspector 288) for the detail
    to breathe; *small, do next:* a desktop window class (1280 to 1440) could step these down by itself (layout belongs to
    another workstream this round).
  - The nav rail's footer items and the sliding pill disagreed (fixed in this branch).
- **Change to Orion:** the six above; plus a token for chrome text size (status bar uses label-medium, menu bar
  label-large; both fine, but a `--s4-type-chrome` role would make desktop chrome consistent).

## Not finished or not verified
- The Electron and installed-web-app examples **cannot be run here** (no dependencies, no desktop); they follow the
  Electron and W3C APIs as documented. Tauri is notes only (README), deliberately, because its v2 menu API names should be
  checked against its docs. `trafficLightPosition` and `titleBarOverlay` colors are starting points to adjust by eye.
- No second desktop template (a document editor already exists as Slugline; a three-pane tool would repeat Parley's
  shape). The rail's `data-resizable` and the inspector grip are only tested by hand (screenshots and scripted drags),
  not in the suite.
- WebKit and Firefox not run (not installed here). Alt alone and F10 behave differently in real browsers on Windows
  (the browser's own menu may take Alt); in an installed app or Electron they reach the page.
- Browser-reserved keys (mod+W, mod+T, Ctrl+Tab, mod+1…9, mod+N) cannot be captured in a browser tab; every one has a
  menu item or click alternative.

## For the owner to look at
- On a real desktop (Windows or a Mac): `templates/desktop-app.html` at full size; the menu bar with F10 and Alt; right-
  click a line, a file and a tab; drag a tab and a file onto a folder; collapse and resize the sidebar; Settings (mod+comma).
- On the iPhone: the same template at phone width (nav bar, a line opens with Back, settings list then category).
- Decide: rename taking the cursor (choice 8), the sixth truncation place (choice 6), and a selection-strength dial.
