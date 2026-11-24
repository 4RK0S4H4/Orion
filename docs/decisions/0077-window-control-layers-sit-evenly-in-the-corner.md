# 0077: Window control layers sit evenly in the corner (2026-11-24)

**Status:** our call on the owner's note of 2026-11-24 (issue 103). Amends [0072](0072-window-controls-and-nothing-wraps-mid-motion.md)
section 1, "What is drawn stays Orion": the layer's inset and Close's outer corner. Everything else in 0072 and 0074 stands.

The owner, from his Windows desktop app: "they work but I feel like the buttons aren't aligned properly with edges, I
definitely noticed that the close button is way closer to the right edge than the top edge, it should be equal."
Image: [`2026-11-24-window-close-inset.png`](../issues/img/2026-11-24-window-close-inset.png).

**Cause.** 0072 inset the drawn layer 4 at the top and bottom but 2 at the sides (`inset: space-1 space-1/2`), so
neighbours would sit 4 apart. The cells are right (full height, flush with the top and end edges); the layer inside
Close was 4 from the top and 2 from the end, and Windows 11's rounded window corner made the end look tighter still.

**What we do now** (`components/desktop/`):
- **One inset on every side.** Every control's layer is inset 4 (`space-1`) all round: 38 by 32 in a 46 by 40 cell.
  Close's layer is 4 from the window's top edge and 4 from its end edge (start in right to left); Minimize and Maximize
  use the same inset, so the row is even and neighbours sit 8 apart. The cells, the hit area and the corner rule are
  unchanged.
- **Close is concentric with the window's corner (0052).** Its outer corner (`border-start-end-radius`) is the window's
  corner minus the inset where the window is rounded, and the firm 8 where it is square. The window's corner is
  `--s4-window-corner`: 0 by default (a browser tab, a maximized or full-screen window, Windows 10, Linux, whose
  frameless windows are square), 8 in a restored Windows shell (`<html data-shell data-platform="windows">`, Windows
  11's own corner), so Close's outer corner is 4 there. A page that draws the window in a rounded frame sets
  `--s4-window-corner` to the frame's radius (the component page: 16, so 12). The other three corners stay the firm 8.
- **Proof.** `windowAudit` (page checker and suite) fails Close's layer more than 1px nearer one of the top and end
  edges than the other, and a control whose layer is inset differently from Close's; the suite's stubbed Windows shell
  (left to right and right to left) measures Close's hovered layer and its concentric corner. Known-bad page:
  `tests/fixtures/bad-window-inset.html`. Before: 4 from the top, 2 from the end; after: 4 and 4.

Not verified here: a real Electron or Tauri window on Windows 11 (the system's 8px corner is assumed, as documented by
Windows; Tauri draws a rounded corner only with its window shadow on).
