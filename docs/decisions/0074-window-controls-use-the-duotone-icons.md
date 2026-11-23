# 0074: Window controls use the duotone icons (2026-11-23)

**Status:** the owner's call (issue 82). Amends [0072](0072-window-controls-and-nothing-wraps-mid-motion.md) section 1, "What
is drawn stays Orion": the drawn line glyphs are replaced; everything else in 0072 stands.

The owner, after 0072: "For the title bar window buttons I like the change, but I did like the duotone icons btw, you can
still use them. My main concern was that I felt they were too small and round, and didn't behave like normal windows
title bar buttons."

0072 answered "too small and round" and "behave like Windows" with full cells, a firm layer and the corner rule. It also
swapped the Solar icons for 12px line glyphs, which the owner did not ask for. The glyphs go; the icons come back, square.

**What we do now** (`components/desktop/`):
- **Orion's icons, through the icon registry.** Four semantic names in `components/icons/names.json`: `window-minimize`,
  `window-maximize`, `window-restore`, `window-close`. In Solar Bold Duotone they are the square tiles `minus-square`,
  `maximize-square` (arrows out), `minimize-square` (arrows in) and `close-square`: one family, the tile in the second
  tone and the mark in the first, rounded squares rather than the discs the owner found too round. Phosphor:
  `minus-square`, `corners-out`, `corners-in`, `x-square`. `S4.icon.use()` switches them with every other icon.
- **Written in by the component.** The markup stays an empty button with its `aria-label`; `desktop.js` writes one
  `.s4-icon[data-window-icon]` into each control and swaps Maximize's to `window-restore` while `<html
  data-window-state>` holds `maximized`. Any other icon written inside a control is still hidden, so every app gets the
  same four.
- **Bigger.** `--s4-size-window-control-icon` is 24, the standard icon size, a step above the title bar's other icons
  (20): the old glyphs were 12.
- **The error fill.** On Close's hover and press the second tone sits at Solar's own 0.5 instead of the page's 0.42 (0.38
  dark), where the tile is as clear of the red as the cross is of the tile. Measured against the shipped roles: light 2.5
  and 2.6:1, dark 2.7 and 2.8:1, high contrast light 4.2 and 3.4:1, high contrast dark 3.9 and 4.8:1 (tile on fill, mark
  on tile); the mark on the fill is 6.4:1 or more everywhere. No second tone can give both pairs 3:1 in light (a lighter
  tile costs the mark what it gives the tile), so halfway is the balance; the icon's shape is carried by the tile edge and
  the mark together, as with every duotone icon in Orion.
- **Kept from 0072:** 46-wide full-height cells, the corner pixel hits Close, the firm 8 layer on hover and press, Close
  `error` only on hover and press, Restore while maximized (icon and label), right to left mirrored to the start (the
  Maximize and Restore arrows mirror with it), hidden on a Mac shell, in the window controls overlay and in full screen,
  a window not in front dims the icons a step, forced colors (icon `ButtonText`, hover `Highlight` with `HighlightText`),
  print hides them.
- **Proof.** The suite's stubbed Windows shell (left to right and right to left) now requires each control to draw its
  `window-*` icon at 16px or more and Maximize to draw `window-restore` while maximized.
