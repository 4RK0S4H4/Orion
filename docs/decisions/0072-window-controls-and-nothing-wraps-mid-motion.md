# 0072: Window controls act like Windows', and nothing wraps mid-motion (2026-11-22)

**Status:** our call on the owner's notes of 2026-11-22 (issues 69 and 70). Built in round 0061, workstream titlebar.

## 1. Window controls (issue 69)

The owner, from the first real desktop app: "I really like how it's unique from windows, but I think we need to make
it act similar to windows in some ways like how if I am in the very top right corner then the hit box area still applies
to the close window button despite it not being exactly over it. also I think these buttons should be bigger and more
firm as I don't want it to be too different from the windows buttons."

Before: `.s4-window-control` was a 32 by 28 pill floating in the title bar, 12px from the window's end edge and 6px
below its top, with a Solar icon (the Bold Duotone Close is a round disc) and Close turning to the badge red on hover.
A pointer thrown into the corner landed on the title bar, which drags the window.

**What we do now** (`components/desktop/`):
- **The hit box is the whole cell, as on Windows.** Each control is 46 wide (`--s4-size-window-control`) and the bar's
  full height; they sit side by side with no gap, and the title bar keeps no end padding when it holds them, so the
  last one touches the window's end edge and all of them its top edge. The window's top corner pixel hits Close; the
  top edge hits the control below it (Fitts's law). The cell is square on purpose: a rounded cell would miss the corner.
- **What is drawn stays Orion.** Inside the cell a filled layer, inset 4 top and bottom and 2 at the sides, with firm
  corners (8: `corner-small`, the floor of every dial, never sharp and never a pill) answers hover and press (State).
  Window controls are platform chrome and keep these firm corners under every `corners` dial (the owner asked for
  "firm"); they are not in the dial audit. Close turns `error` / `on-error` only on hover and press, so at rest the bar
  holds no red (0070's one accent job still holds). Glyphs are drawn by the component (12px, 1.4 stroke, round caps,
  Solar Linear's weight): a line, a rounded square, two rounded squares for Restore, a cross. Any icon written inside
  the button is hidden, so apps built with the old markup get the new glyphs.
- **Order and states.** Minimize, Maximize (Restore while `<html data-window-state>` holds `maximized`: glyph and
  label, `data-label-restore` for another language), Close. A window not in front dims the glyphs a step. `s4-window`
  now carries `{ action, maximized }`.
- **Where they step out.** A Mac shell (the system draws the traffic lights at the start; Orion never draws traffic
  lights), the window controls overlay of an installed web app (the system draws its own), full screen.
- **Right to left.** Windows mirrors a right-to-left window: the caption buttons move to the left with Close at the far
  left. We follow it (logical properties do it): the corner rule then holds for the top left corner, and the Restore
  glyph mirrors. A Mac in a right-to-left language mirrors the traffic lights too, which `data-controls="start"` already
  does by padding the inline start.
- **Reach.** Both color modes, high contrast (the roles), forced colors (glyph `ButtonText`, hover `Highlight` with
  `HighlightText`), focus ring drawn on the firm layer inside the cell (never cut by the window edge), print hides them.
- **Drag and resize in a shell.** The controls and their strip are `app-region: no-drag`. A frameless window resizes
  from its edges: on Windows the system's invisible borders do the sides and bottom; along the top, Electron lets a
  drag region win over its resize band, so in a Windows or Linux shell (`data-shell`, not `pwa`, not a Mac) the bar's
  top 4px are kept free of drag regions while the window is neither maximized nor full screen. Restored, the shell's
  thin resize band at the very top wins over the corner, as Windows' own does; maximized (where throwing the pointer
  into the screen corner matters), there is nothing to resize and the corner is Close's. Tauri drags by the
  `data-tauri-drag-region` attribute: keep it on the bar, never on `.s4-window-controls`.
- **Shells.** Parley (`templates/desktop-app.html`) writes the controls `hidden data-shell-controls`;
  `examples/shell-bridge.js` shows them when the shell's state says `controls: 'own'`. The Electron example now uses a
  frameless window with Orion's controls on Windows and Linux by default (`ORION_CONTROLS=system` keeps the system's
  buttons drawn over the bar with `titleBarOverlay`); a Mac keeps its traffic lights.
- **Proof.** The page checker and the suite (`windowAudit` in `skill/orion/scripts/silent.mjs`) fail a control under 40
  wide or shorter than its bar, Close short of the end edge, and a corner or top-edge pixel that hits anything in the bar
  but its control; the suite also runs Parley in a stubbed Windows shell (left to right and right to left: the corner
  pixel hits Close, Close not red at rest and error on hover, Restore when maximized, a click reaches the shell) and a
  stubbed Mac shell (no controls). Known-bad page: `tests/fixtures/bad-window-controls.html`.

Not verified here: a real Electron or Tauri window on Windows or Linux (the top resize band, Snap Layouts on Maximize,
which only the system's own button offers, and double-click to maximize on the drag region are the shell's).

## 2. Nothing wraps or reflows mid-motion (issue 70)

The owner: "when maximizing the side bar there is a small animation glitch where it seems like the text wraps as the
side bar is resizing. I would hope that glitches like these are caught during bug reviews."

The rail's edge moves with Morph (its width), and everything inside followed the edge: mid-way, "New Script" stacked one
letter per line and the labels broke into glyph columns. Every check looked only at rest.

- **Rule:** while a container changes size, its contents keep the layout of their end size and the container's edge
  clips them; text fades (State) and is revealed or covered by the edge, never re-laid out. The rail does it with
  `data-s4-moving` (set by `nav-rail.js` for the length of the Morph, cleared on `transitionend`): its sections keep the
  expanded width, the main action keeps its expanded wrapping, the tree and group titles keep their expanded layout
  until a collapse has arrived.
- **The rest of the family was checked:** expand, accordion, dialogs, floating panels, menus and pages already reveal by
  transform, opacity and clipping and pass the new check; the inspector shows and hides without motion and only
  changes width under the person's own drag; Orion has no drawer (the phone's rail is the nav bar).
- **Proof:** `skill/orion/scripts/midmotion.mjs`, run by the page checker and the suite on every page: for the rail's
  toggle, a dialog, a floating panel, a menu, an expand, an accordion and a page it starts the motion and the motion
  back, freezes everything it started at 25, 50 and 75% of the longest animation (the scrubber's way), and fails a word
  split across lines, a box one glyph wide or the page scrolling sideways in any of those frames. Known-bad page:
  `tests/fixtures/bad-rail-motion.html`.

## Rules bullet (for CLAUDE.md)
- Decision 0072 (window controls, mid-motion): `.s4-window-control`s are full cells like Windows' (46 wide, the bar's
  height, no gap to the window's top and end edges, so the corner pixel hits Close; mirrored to the start in
  right-to-left), drawn in Orion (a firm 8 layer on hover and press, drawn glyphs, Close `error` only on hover and press,
  Restore while maximized); only in a frameless Windows or Linux shell, never beside the system's buttons. While anything
  changes size, its contents keep their end layout and are clipped or faded, never re-wrapped; the page checker and suite
  freeze every motion at 25/50/75% (`midmotion.mjs`).
