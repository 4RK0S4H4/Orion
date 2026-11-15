# 0051: The eight ideas the owner picked, built (2026-11-15)

**Status:** built; awaiting the owner's look. From the quiz [What To Build Next](../../explore/ideas.html): the owner
answered "Build It" to all seven ideas and "All Six" templates, with one note: "For direct manipulation I wasn't able
to move anything" (the quiz only showed a sketch; the real thing had to work with a finger).

| Idea | What was built | Where |
|---|---|---|
| Command palette | Opens with mod+K or `data-palette`; collects registered commands, `data-command` buttons and the navigation; type, arrows, Enter | `components/palette/` |
| Resizable panes | `data-resizable` on a split: drag the grip, arrow keys, double-click to collapse, `data-resize-key` remembers | `components/layout/` |
| Designed states | `.s4-states` with a part per state (loading, ready, empty, error, offline), `S4.states.load(el, promise)`, offline by itself | `components/states/` |
| Forms that behave | `.s4-form`: errors on leaving a field, a check when fixed, `data-autosave` with "Saving…" / "Saved", Undo instead of confirm | `components/form/` |
| Small rewards | `.s4-done-mark` (a check that draws itself), `data-count-to` (a number that counts) | `components/reward/` |
| Direct manipulation | Drag to reorder (handle or whole item, mouse, finger, keyboard, across grouped lists), swipe a row for its actions, select several with a bar | `components/direct/` |
| Charts | column, bar, line, area, donut, spark; legend, tooltip, keyboard, a Table view; `--s4-chart-1…6` | `components/chart/` |
| App templates | editor, calendar, kanban, gallery, checkout, onboarding | `templates/` |

## Rules these add
- **Dragging works with a finger.** A drag handle never scrolls the page (`touch-action: none`); with no handle a
  short hold starts the drag. Dragging is never the only way: every handle is a button the keyboard can use.
- **Swipe actions are a shortcut**, never the only place an action lives, and never for something that cannot be undone.
- **Every list, table and pane has its states.** A blank box or a lone spinner is a bug.
- **Errors wait until you leave the field.** Nothing validates while typing; nothing moves the cursor (0049).
- **Charts:** one series wears the accent; several wear the fixed chart colors (checked for color-blind separation on
  Orion's surfaces, light and dark); text never wears a series color; one y-scale per chart; every chart has a table.
- **Rewards are small and rare:** one moment, under a second, an existing motion pattern.
- The command palette focuses its box only when opened with the keyboard (0049); by tap or click the first key
  pressed goes into the box.

57 components.
