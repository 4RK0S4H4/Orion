# 0062: Desktop anatomy: one list of commands, the window's parts (2026-11-21)

**Status:** our call. The owner left the calls of the design review's last areas to us on 2026-11-16 ("I trust your
judgement"); the owner can overrule any of it. Built in round 0056 (issue 60). Notes and every visible choice:
[`docs/history/round-0056/desktop-anatomy.md`](../history/round-0056/desktop-anatomy.md).

## The question
Decision 0043 gave desktop apps a title bar, density and shortcuts. A real desktop app also has a menu bar, document
tabs, a source list, an inspector, a status bar, a settings window and a shell that hosts it. How does Orion draw all of
that without a second navigation system, and without labels and shortcuts drifting apart between the menus, the palette
and the buttons?

## The answers
| Question | Answer |
|---|---|
| Where actions live | **One list of commands** (`S4.commands`): the palette, menus, right-click menus, the menu bar, shortcuts, buttons (`data-cmd`) and a shell's native menu read the same command, so a label, shortcut or disabled state can never disagree. `S4.palette.register` adds to it |
| Menu bar | **Quiet labels on the chrome** (`.s4-menubar`), filled (`secondary-container`) only while their menu is open; the menus are the glass menu. Hidden under 600 and when a Mac shell draws the native menu (`data-native-menu`) |
| Check and radio commands | A check mark, not a fill (the fill reads as a selected row); disabled items stay in place |
| Submenus | Beside their item (`data-submenu`), first item lined up; Right opens, Left or Escape closes; choosing closes the chain |
| Document tabs | **Filled pills, not the navigation tabs** (`.s4-doc-tabs`): the current tab takes the content's own surface; a dot replaces Close while unsaved; no motion on switching; closing unsaved work closes and offers Reopen (0047). Labels end in an ellipsis: a sixth place where truncation is by design (the full name is in All Tabs and the tooltip). Hidden under 600 |
| Tree | **Small list rows** (`.s4-tree`): Edges Lean hover, `secondary-container` selection, touch size by default and 28 in compact, indent 20 (half steps past level four), labels wrap; opening is Reveal, the chevron Bend; drag to move is mouse and pen only, with cut and paste and the item menu doing the same |
| Sidebar | **The rail is the source list** (no second navigation component): folding groups, a tree per group, account and Settings at its foot, a grip to resize |
| Inspector | **Solid and in the layout** (`.s4-inspector`): the content makes room; groups fold; compact rich inputs. Occasional tools stay tool panels (0054) |
| Status bar | **Text first, no fills at rest** (`.s4-statusbar`), clickable segments a step stronger, tone dots only beside words; from 840 wide |
| Settings | **A view** (or a second window in a shell): categories and a pane, search across categories, every change at once with Undo; mod+comma. Never a dialog |
| A window in the background | Chrome text steps back to `on-surface-variant`, selections turn neutral (`data-window-blurred`); content never dims; still AA |
| Title bar | Variants `tabs` (the tabs are the bar) and `unified` (title and toolbar); traffic-light room is automatic with `<html data-shell>` on a Mac |
| Rename | F2 (Enter on a Mac) or a Rename command puts the cursor in the field: the person asked to type (read of 0049 as "never unasked") |
| Shells | `examples/`: an Electron shell (frameless window, native Mac menu from `S4.commands.native`, window state), an installed web app with window controls overlay, a page-side shell bridge |

## The rule
- Every desktop app writes its actions once, as `S4.commands`, and builds its menus with `S4.commands.menu(…)`; never a
  menu's items, a shortcut handler and a palette entry separately.
- Use only the parts the app's jobs need: a small tool is title bar, sidebar and content; files add document tabs,
  properties add the inspector, state adds the status bar.
- Document tabs only for things the person opens and closes; a fixed set of views is content tabs (0059).
- Inspector for properties of the selection used all day; a tool panel for occasional tools.
- Settings is a view with categories, search and instant changes with Undo.
- Standard shortcuts: mod+N/O/S/W/Z, mod+Shift+Z, mod+F, mod+comma, F2 (Enter on a Mac), Shift+F10; every key a browser
  reserves also has a menu item or a click.

## How it is built
- New components: `components/commands/`, `menubar/`, `statusbar/`, `doc-tabs/`, `tree/`; the inspector, window states
  and keyboard context menus in `components/desktop/`; submenus in `components/menu/`; the source list in
  `components/nav-rail/`.
- Tokens `--s4-size-statusbar`, `-menubar-item`, `-doc-tab`, `-tree-row`, `-tree-indent`, `-inspector`.
- Template **Parley** (`templates/desktop-app.html`): a translation workbench with the whole anatomy and its own brand.
- The suite drives the anatomy by keyboard (menu bar, submenus, tree, document tabs, Shift+F10) and the new components
  join the dial presets pass.

## Open for the owner
- Rename taking the cursor (above), the sixth truncation place (document tabs), and a selection-strength dial (a vivid
  accent's selected row is a strong fill).
- The Electron and installed-app examples could not be run here; Tauri is notes only.
