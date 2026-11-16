# 0054: Tool panels: a floating panel can leave the page live (2026-11-16)

**Status:** decided by the owner ("Sure, I'll go with your call. It does make sense for example for side filters");
built. Closes the question left open by 0047.

## The question
Every floating panel was modal: the page dims, nothing behind can be tapped or scrolled, a tap outside closes it.
That is right for a short task and wrong for a tool. With filters you want to tick a box, look at the list, scroll
it, tick another. With an inspector you want to click the next row and see the panel follow.

## The rule
Two kinds of floating panel:

| | Task panel (the default) | Tool panel (`data-modeless`) |
|---|---|---|
| What it is | a short task you finish or cancel: Add Expense, a small form | a tool for the page behind it: filters, an inspector, formatting, a color picker |
| The page behind | dimmed, not usable | bright and live: scroll it, tap it |
| Its controls | collected, then Save | act at once; no Apply button |
| Closes with | Save, Cancel, Escape, a tap outside | Close, Escape (focus inside), a second tap on its opener |

- **On a phone (under 600 wide) every panel is modal.** The panel covers most of the screen, so a live page behind
  it only causes accidental taps.
- **Dialogs are always modal.** A dialog is the app saying it cannot go on without an answer (0047).
- A tool panel never focuses a field when it opens (0049), like everything else.

## Built
- `data-modeless` on `.s4-side-sheet` / `.s4-bottom-sheet` (`components/dialog/dialog.js`, `components/sheet/`).
- Reference: the "Tool Panel" section of the Floating Panels page (filters that change a list as you tick them).

## Open
- A tool panel floats over the page's end side, so it can cover the end of wide rows. If that bothers the owner in
  a real app, the next step is letting the page make room for it (a supporting pane), not a different panel.
