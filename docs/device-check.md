# The device check (about 20 minutes, once)

Some things only a real phone, a real Windows desktop and a screen reader can show. This is the one time Orion needs your
hands. Do the steps in order; each says what should happen.

**How to report a problem:** take a screenshot, send it in chat with one line: the step number and what you saw (for
example "7: the dialog stayed open after I swiped down"). Nothing else is needed. If a step works, skip it; no need to
report it. If you run out of time, stop anywhere and send what you have.

All links are on the hub: https://4rk0s4h4.github.io/Orion/ (add `?v=` and anything after it from the link I send you, so
you see the newest version).

## Part 1: iPhone, Safari (about 10 minutes)

Hold the phone upright. The pages are made for a 390-wide screen, which is most iPhones.

1. **Open the Showcase** (hub, then Showcase). Look: the page fits the screen, nothing is cut off on the right, the text is
   sharp and the letters look like the same font everywhere (no odd fallback font, no missing letters).
2. **Glass.** Scroll the Home view slowly so cards pass under the top bar and the bottom navigation bar. Look: the bars turn
   to frosted glass, the text on them stays easy to read over light and dark content, and the edge of the glass is a thin
   line, not a glow or a shadow.
3. **The navigation bar.** Tap each tab at the bottom. Look: the highlight moves to the tab you tapped and holds both the
   icon and its label; the screen changes; nothing jumps.
4. **A tooltip and a snackbar.** In Controls, press and hold an icon button until its tip appears, then do something that
   shows a message at the bottom (for example archive a note, which offers Undo). Look: both are glass, readable, with a
   soft light inside the edge (not a bright band).
5. **A dialog as a bottom card.** In Settings, tap Delete All Notes. Look: a card rises at the bottom of the screen, inset
   from the edges, with rounded bottom corners that follow the phone's corners, and its buttons fill its width.
6. **Close it three ways.** Open it again and tap outside it; then again and swipe it down; then again and tap Cancel.
   Look: each time it closes, nothing is deleted, and the page underneath is where you left it.
7. **A panel you can drag.** In Controls, open Floating Panel. Drag the small bar at its top down slowly: the dimming behind
   follows your finger. Let go a little way down: it settles back. Drag further and let go: it closes.
8. **The Back gesture.** Open a note, then swipe from the left edge of the screen to go back. Look: you are back on the list
   at the same place you scrolled to, and nothing has a ring or outline around it.
9. **VoiceOver on the Showcase.** Turn VoiceOver on (Settings, Accessibility, VoiceOver, or triple-click the side button if
   you have set that up). On the Showcase, swipe right a few times. Listen: each control says what it is ("Button",
   "Tab, 2 of 4", "Selected") and its name; nothing is read as "unlabelled". Double-tap a tab: it says the new view.
10. **VoiceOver on a data table.** Open Linnea (hub, Templates, Data Table). Swipe right until you reach the records.
    Listen: each record reads as one row with its values; selecting one (double-tap its round checkbox) says it is
    selected. Turn VoiceOver off when you are done.
11. **A website on the phone.** Open Sprig (hub, Templates, Landing). Scroll to the bottom and back. Look: the header turns
    to glass as you scroll, the menu button opens a floating glass panel, pictures are framed drawings (no gray boxes), and
    nothing scrolls sideways.

## Part 2: your Windows desktop app (about 8 minutes)

Use your own app built on Orion, in its desktop window (Electron or Tauri), or Parley through the Electron example in
`examples/`. The window should have no Windows title bar of its own: Orion draws the title bar and the three buttons.

12. **The window buttons.** Look at Minimize, Maximize and Close in the top right corner: thin line icons, evenly spaced,
    the full height of the title bar, touching the window's top and right edges. Hover each: a soft gray layer, and red only
    under Close.
13. **The corner.** Move the mouse into the very top right corner pixel of the window (push it against the corner of the
    screen when the window is maximized) and click. Look: the window closes (Close is hit even at the outermost pixel).
14. **Double-click to maximize.** Open the app again. Double-click an empty part of the title bar: the window fills the
    screen and the middle button changes to Restore. Double-click again: it comes back to its size.
15. **Resize from the top edge.** With the window not maximized, move the mouse to the top edge above the title text until
    the pointer becomes a two-way arrow, then drag up and down. Look: the window resizes; it does not start moving or
    selecting text.
16. **Narrator on the rail.** Turn Narrator on (Ctrl+Windows+Enter). Press F6 until you reach the side rail, then use the
    arrow keys or Tab. Listen: each place is read with its name and "selected" for the current one; Enter opens it. Press
    F6 again: Narrator says you are in the main area. Turn Narrator off with Ctrl+Windows+Enter.
17. **Skip link.** Reload the app and press Tab once. Look: a dark "Skip to Content" pill appears in the top left. Press
    Enter: the focus moves into the main area (the next Tab lands on something there, not on the rail).

## Part 3: done

18. Send the screenshots and lines in chat. Anything you found becomes an issue in round 0067; anything you could not try
    (no Windows machine at hand, for example) just say so and we will note it as not checked.
