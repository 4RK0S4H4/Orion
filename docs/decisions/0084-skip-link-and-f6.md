# 0084: Getting past the chrome: a skip link in every app shell, F6 between regions in desktop apps (2026-11-25)

**Status:** our call under the owner's handover, built in round 0066, workstream B (review 5's N6; issue 114). Amends
[0062](0062-desktop-anatomy.md) (desktop anatomy: F10 reached the menu bar, nothing moved between regions) and
[0057](0057-website-kit.md) (the skip link's style moves from the site kit to base, unchanged). No motion pattern was added.

## Why
Review 5: Linnea takes 15 Tab stops to reach its grid and Parley 17 to reach main. Sites had `.s4-skip-link`; app shells had none,
and desktop apps had no F6 region cycling (WCAG 2.4.1 Bypass Blocks; F6 is what Windows and macOS apps use to move between panes).

## The rules
1. **Every app shell has a skip link, written by the shell.** `app.js` puts `<a class="s4-skip-link">Skip to Content</a>` first
   in the document for the page's first `.s4-app` (unless the page wrote its own): the first Tab stop, out of sight until it
   has the focus, then an Orion pill (`inverse-surface`, the control corner, 40 high) fixed in the window's top start corner.
   Enter (or a click) puts the focus on main (made focusable, `tabindex="-1"`) and never changes the address: an app's views
   and pages live in the hash. Nothing to write in markup.
2. **F6 moves between regions in a desktop app.** `desktop.js` (the commands pack every desktop app loads): F6 and Shift+F6, and
   Ctrl+F6 / Ctrl+Shift+F6 where a browser keeps F6 for its address bar, move the focus through the regions on screen in reading
   order: the menu bar, the rail, main, the inspector, the status bar, and round again. Each region gets back what last had the
   focus in it (never a text field: 0049), else the rail its current place, the menu bar its first menu, another region its
   first control, main itself. A dialog, the palette or an open menu keeps the focus. `S4.desktop.regions()` lists them.
3. **Proofs.** The suite loads every template and the Showcase with an app shell: one Tab focuses the skip link, which is a
   visible pill reading "Skip to Content"; Enter leaves the focus on main with the address unchanged. In a desktop app, F6 visits
   every region in order and comes round, Shift+F6 goes back, Ctrl+F6 moves on, and focus never falls to `<body>`.

## Rules bullet (for CLAUDE.md)
- Decision 0084 (getting past the chrome): every app shell gets a skip link as its first Tab stop from `app.js` ("Skip to Content", hidden until focused, an Orion pill; Enter focuses main and never changes the address; never write one by hand in an app), and desktop apps move between regions with F6 / Shift+F6 (and Ctrl+F6) from `desktop.js`: menu bar, rail, main, inspector, status bar, each to what last had the focus in it; the suite proves one Tab plus Enter reaches main and that F6 cycles.
