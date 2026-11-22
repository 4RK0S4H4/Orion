# Open issues

The owner's critiques, waiting to be worked on. Each has a reference image in `img/`; open the image before starting the
issue. When an issue is done, move it to "Done" with the commit and decision number.

Goal across all of them (owner, 2026-11-14): **look good on both desktop and mobile** (check at 390 and 1280, light and
dark, and ask for an iPhone look).

**First step for all motion issues: a motion lab** ([`explore/motion-liquid.html`](../../explore/motion-liquid.html), answered 2026-11-14, see [0042](../decisions/0042-liquid-ink-motion.md); round 2: [`explore/motion-liquid-2.html`](../../explore/motion-liquid-2.html) for row hover, radio, menu and speed) (owner, 2026-11-14) to confirm that what's built matches what the
owner means by "liquid but subtle", before any motion issue is built. Show each candidate (liquid row hover 7, bending
chevron 11, liquid radio 19, snackbar 28, tooltip 29, menu 31, progress 26/27, skeleton 25) with the scrubber, plus
today's motion for comparison, and ask if the owner needs to explain it differently.

**Motion direction (owner, 2026-11-14):** the general animation theme should be **super subtle but liquidy**, with small
interesting moments (a shape that flows, an icon that bends into the next one) instead of plain fades and spins. Quick
enough to never be in the way, but never looking instant. This amends 0022 (simpler motion): keep its sturdiness rules
(transform and opacity, one transition per element, nothing cloned) unless the owner agrees otherwise; record as a new
decision and show options in a motion lab with the scrubber before building.

## Intake from app sessions

The owner builds his own apps in other sessions with this repo attached. They log Orion problems as GitHub issues
labelled `from-app` (form `.github/ISSUE_TEMPLATE/from-app.yml`) or as entries in [`inbox.md`](inbox.md) on a branch
`issues/<app>-<date>`. Every round starts by moving each of them here, numbered, with its image in `img/` (the Triage step
in [`../PLAN.md`](../PLAN.md)).

## Found by QA pass 1 (2026-11-22, round 0062)

The first Full QA pass ([`history/round-0062/qa-1.md`](../history/round-0062/qa-1.md), a fresh agent, Chromium, ~100 pages).
Each finding is fixed at its root and proven by a rule (decision 0073). Screenshots before and after are in the round's
notes, not committed.

- **73.** Done 2026-11-22 (round 0062, decision 0073). Combobox: Escape does not close the list when focus is on the Show Options toggle (found by
  QA pass 1; any width, mouse or touch). Root: the Escape handlers lived on the input only and the document handler stood
  down for anything inside the field. Rule: the suite opens every opener that has `aria-haspopup` or controls a popup
  and requires Escape to close it with focus on the opener, on every page.
- **74.** Done 2026-11-22 (round 0062, decision 0073). Share and Copy Recipe: an uncaught `writeText` rejection and a false "copied" when the
  clipboard refuses (found by QA pass 1; article, tool; data-table and desktop-app swallowed the failure and still said
  "copied"; the code block did it right). Root: four ways to do one job. Rule: `S4.util.copy` is the one helper; `npm run
  check:clipboard` and the page checker fail any other `writeText`; the suite runs with the clipboard refused.
- **75.** Done 2026-11-22 (round 0062, decision 0073). Filter panel at 320: "Conservation" breaks mid-word (found by QA pass 1). Root: a list row
  spent a third of a 320 screen on gaps and insets. Rule: the split-word rule runs at 320, at 320 with 200% text and with
  the modal panels and menus opened.
- **76.** Done 2026-11-22 (round 0062, decision 0073). Article at 320 with 200% text scrolls sideways by 144px (found by QA pass 1). Root: a
  one-column grid whose column is `auto` grows to the widest child (a fixed-column row), carrying breadcrumbs and
  headline past the edge. Rule: a reach pass at 320 with 200% text (the browser's text size and the doubled-text
  method) over every page fails on sideways scroll.
- **77.** Done 2026-11-22 (round 0062, decision 0073). Ink Track pill stays at its left-to-right offset when `dir` flips after load (found by QA
  pass 1; button group, motion page). Root: positions measured once. Rule: reach test flips `dir` after load and compares
  each selected option with its ink.
- **78.** Done 2026-11-22 (round 0062, decision 0073). 200% text at 320: nav-bar labels and stat figures split mid-word (found by QA pass 1).
  Rule: the split-word rule at 320 with 200% text, with the five truncation places of decision 0058 as its allow-list.
- **79.** Done 2026-11-22 (round 0062, decision 0073). Trailing and meta slots (`.s4-list-trailing`, `.s4-timeline-meta`, `.s4-tree-trailing`,
  upload meta, banners, buttons) widen the page when the text is long (found by QA pass 1, 320 wide, 50-character
  phrases). Rule: the inject-long-text pass fails any page that scrolls sideways.
- **80.** Done 2026-11-22 (round 0062, decision 0073). Controls whose content is wider than their box: month days at 200% text and in forced
  colors; the pagination arrows were reported too, but their 44px was the 48px touch-target pseudo-element, not content
  (found by QA pass 1). Rule: the page checker and suite fail a button, link, tab or chip whose content (not its hit
  area) sticks out of its box.
- **81.** Done 2026-11-22 (round 0062, decision 0073; owner, 2026-11-22). Nav bar hover: "When hovering over a nav bar tab I notice that only the icon
  gets a chip hover effect. I actually prefer if the hover effect was basically the size of the selected tab that way it's
  consistent." Root: the state layer lived on the 56x32 icon indicator while the selected highlight is the box round icon
  and label. Now an item draws its hover, focus and pressed layer on exactly the highlight's box (same size, corner and
  inset, at every width; the rail's rows already were); a selected tab layers its state on the highlight. Rule: the page
  checker fails a layer that is not the highlight's box within 1px (two known-bad fixtures).

## Owner notes (2026-11-22)

- **69.** Done 2026-11-22 (decision 0072). Title bar window controls: "I really like how it's unique from windows, but I
  think we need to make it act similar to windows in some ways like how if I am in the very top right corner then the
  hit box area still applies to the close window button despite it not being exactly over it. also I think these
  buttons should be bigger and more firm as I don't want it to be too different from the windows buttons." The controls
  are full 46-wide cells to the window's top and end edges, a firm layer inside, Close error only on hover.
  Image: `img/2026-11-22-titlebar-window-buttons.png`.
- **70.** Done 2026-11-22 (decision 0072). Rail expand: "when maximizing the side bar there is a small animation glitch
  where it seems like the text wraps as the side bar is resizing. I would hope that glitches like these are caught during
  bug reviews." The rail's contents keep the expanded layout while its edge moves; the checker and suite now freeze
  every motion at 25, 50 and 75%. Images: `img/2026-11-22-rail-expand-wrap-1.png` (collapsed),
  `img/2026-11-22-rail-expand-wrap-2.png` (mid-way: "New Script" one letter per line), `img/2026-11-22-rail-expand-wrap-3.png`
  (expanded).

- **71.** Done 2026-11-22 (round 0061). A ring round the whole screen on the phone (Dosewise and others): a view, main or
  page that takes focus only to hold the place rings only for the keyboard (`data-s4-input`); WebKit counts a script's
  focus after a tap as `:focus-visible`. Image: `img/2026-11-22-mobile-region-border.jpg`.
- **72.** Done 2026-11-22 (round 0061). The nav bar's selected tab was a circle the label poked out of (regression from
  2a746b0): under 600 the highlight is a rounded rectangle with the 32dp pill's corner and holds its label; the checker
  fails a round one. Image: `img/2026-11-22-nav-bar-round-indicator.jpg`.

## Owner notes (2026-11-21)

- **67.** Done 2026-11-21 (decision 0064). Docked glass bars "look a bit weird with the edge glow": docked bars keep tint
  and blur, drop rim, glow and shade, and draw one device-pixel hairline on the content-facing edge. No reference image.
- **68.** Done 2026-11-21 (decision 0064). Dialogs "overused, way too in your face, and just feels weird on mobile": the
  audit moved forms out of dialogs; on a phone dialogs and panels are a card in the bottom in reach with answers filling
  the width, swipe down to dismiss, a lighter scrim in light mode, firmer modal glass, a calmer headline and answers.
  No reference image.

## Owner critiques (2026-11-17)

Sent with screenshots after the round 0056 publish; "more minor critiques and ideas for you to carry forward".

- **61.** Done 2026-11-17 (commit d0a6c3f: the legend is a label above, the options one filled box inset from every corner; marked in decision 0065). Radio list in a pane (checkout, Delivery): "layout is a little bad here and looks glitched, with where the
  text is and the radio button so close to the corner, conflicted with the corner radius."
  Image: `img/2026-11-17-radio-list-corner.png`.
- **62.** Done 2026-11-17 (commit 405528a: a quiet accent hairline after a tap or click, the focus ring from the keyboard; marked in decision 0065). Text field focus is "a bit too harsh and contrasty, especially in monochrome, either find a different way to
  indicate or use diff colors." Image: `img/2026-11-17-field-focus-harsh.png`.
- **63.** Done 2026-11-17 (decision 0059: the owner picked A, Ink Track, in `explore/review-button-group-2.html`, pairs the same; tabs moved to the navigation family so the two never look alike; the page checker and suite guard which is which). Connected button group (the Joined Capsule, decision 0026): "I want a different take ... too similar to
  material 3 expressive, and I think it looks a bit odd. something with the same level of creativity, but not
  material. looks odd especially for 2 buttons." This reopens 0026 at the owner's request: show options in a quiz.
  Images: `img/2026-11-17-button-group-connected.png`, `img/2026-11-17-button-group-sizes.png`.
- **64.** Done 2026-11-17 (commit 405528a: one ring, never the field and the bar at once; marked in decision 0065). Chat composer: "on the text box select focus, this looks super bad, not sure why the whole message bar is
  outlined in white as well, that's weird." Two rings at once (the field and the bar).
  Image: `img/2026-11-17-composer-double-ring.png`.
- **65.** Done 2026-11-17 (commit a146b0f: the current step is a clean pill on the row's center line; marked in decision 0065). Onboarding step dots: "also bug here" (the active dot is a squashed ellipse, not a clean pill, and sits off
  the row). Image: `img/2026-11-17-onboarding-dots.png`.
- **66.** Done 2026-11-21 (all 19 templates plus the new Data Table are their own products, each with its own brand through the dials; the lessons became decision 0060, proposals in `docs/history/round-0056/lessons.md`). Direction for templates: monochrome stays for Orion's own pages (the design language site, showcase,
  reference pages). **Every template should be its own thing**: "super unique", a high quality standalone page with
  Orion as the base, showing "how far this framework can be customized in all aspects ... focus on making the page
  fulfill that purpose and see in what ways S4 Orion holds you back or what you would want different. Similar to how
  other CSS frameworks are super customizable." Each template build is also a lesson: what it had to work around
  becomes a change to Orion.

## From the design review (2026-11-16)

Found by the end-to-end review ([`explore/design-review.html`](../../explore/design-review.html)), not by the owner; no
reference images (the review page shows each one). The big ones wait on the owner's answers to the review's eight
questions; the small ones can be fixed without asking.

- **51.** Done 2026-11-16 (decision 0055; motion energy and per-app defaults in 0056, every preset proven by the suite in 0058; needs the owner's iPhone look). An app can only change its color: corners follow tokens halfway (54 height-computed pills, 56 direct uses of
  the full corner), `--s4-shape-button`, `--s4-shape-icon-button` and `--s4-shape-snackbar` are read by nothing, no
  type, gray-temperature or motion-energy dial. Waits on review questions 1 to 3.
- **52.** Themes only work on the whole page (every token block is on `:root`, aliases resolve there): no dark sidebar
  in a light app, no branded band. Done 2026-11-16 (decision 0056: every dial on any element, `check:scopes`; needs the
  owner's iPhone look, `@scope` needs Safari 17.5+).
- **53.** Websites: one thin landing template; no site header, footer, pricing, testimonials, media hero, feature rows,
  article index, docs layout, fluid display type or section rhythm. Done 2026-11-16 (decision 0057: `components/site/`,
  five site templates, lighter files; needs the owner's iPhone and desktop look).
- **54.** Done 2026-11-16 (decision 0055: headings at 600, `page: 'soft'`). Neutral mode read flat.
- **55.** Done 2026-11-16 (decision 0055). Letter spacing was Material's (tuned for Roboto) on Inter.
- **56.** Wide windows are left-anchored: showcase home cards 236 wide beside 500px of nothing at 1280; landing feature
  cards stop at 936 of 1200. Card grids should fill their row. Partly done 2026-11-16: the landing grid fills its row
  (0057); the showcase and app templates are wave 2 (with 54's hierarchy).
- **57.** Done 2026-11-16 (the list below was corrected). Documents had drifted from the decisions: `framework.md` ("Nine complete starter apps"), `philosophy.md`
  section 4 (menus drop out of their button, sheets slide from the edge), `foundations/shape.md` (full to small,
  square sheet edge, extra-small segments), `foundations/color.md` and `accessibility.md` ("42 pairs"; 78 are checked),
  the skill description ("46 components", "eight app templates") and its opening ("It **is** Material 3 Expressive").
- **58.** Small things: the Elevated button looks like the Text button on a card (no shadow to elevate with); avatar
  stacks cover each other's initials; breadcrumb chevrons sit unevenly between pills and the current page. Done
  2026-11-16 (decision 0058; look on an iPhone at Elevated vs Tonal on a dark card and the stack at xs).
- **59.** Done 2026-11-21 (rich inputs merged earlier in round 0056; data at scale in decision 0061: data tables with virtual rows, pinned and resizable columns, filters and saved views, code blocks; the tree came with 0062; needs the owner's iPhone and desktop look at `templates/data-table.html`). Rich inputs and data at scale (combobox, tag input, upload, time, number, one-time code, tree, table resize /
  pinning / virtual rows): already Horizon 2; the review argues for pulling rich inputs forward.
- **60.** Partly done 2026-11-21 (decision 0062: commands, menu bar, status bar, document tabs, tree, inspector, settings as a view, Parley; the Electron and installed-app examples in `examples/` could not be run here, Tauri is notes only; needs a look on a real desktop). Desktop anatomy beyond the title bar: menu bar, status bar, document tabs, sidebar tree, settings window, a
  real shell example.
- **Reach** (Horizon 1 item 4): right-to-left, print, 200% text, long text, forced colors, keyboard. Done 2026-11-16
  (decision 0058, `tests/reach.mjs`). Left: WebKit and Firefox runs, print pagination, the exemptions listed in 0058
  (date fields in the keys pass, sliders in forced colors, desktop windows at 390 in long text).

## Open (2026-11-14)

Issues 1 to 6, 8 to 10, 12 to 18, 20 to 23 and 32 to 35 were built in the overhaul (decision 0043) and were accepted by the owner (0044). Issues 38 to 41 were built on 2026-11-14 (decisions 0046 to 0048, see Done); they wait for the owner's look. Open: idea A. The owner's picks from idea list B (all of them) were built on 2026-11-15 (decision 0051).

### 24. ~~Banner on glass~~ (scrapped)
Scrapped by the owner (2026-11-14): they meant snackbars, not banners. Banners stay solid content. See issue 28.

### A. Whatever you touch turns into glass
Owner's "crazy side idea" (2026-11-14), to spend real time on: anything you touch or that is active becomes glass. A
selected chip turns into glass (keeping its selected color, just on a different surface), a focused text field turns
into glass, with an animation between the two. Maybe glass has several states (resting, touched, selected) and this is
a middle phase between solid and full glass. Questions to explore: does it keep text contrast (extend check-glass to
tinted states)? Does it read on a solid content surface with nothing interesting behind it? Is it consistent with
"content is solid" (0004)? Try it in a lab on chips, fields, list rows and buttons before deciding anything.
![Chips](img/2026-11-14-chips-expanding-check.png)

### B. Ideas for "works for any app, intuitive and fun" (proposed 2026-11-14, owner to pick)
Published as one quiz in the new Orion quiz UI: [`explore/ideas.html`](../../explore/ideas.html). Build what the owner picks.
- **Command palette** (search everything and run any action, opened with mod+K): the desktop counterpart of the nav bar.
- **Resizable and collapsible panes** for list-detail and desktop apps, with remembered widths.
- **States as first-class patterns:** every list, table and pane has a designed empty, loading, error and offline state.
- **Forms:** validation timing (on blur, never while typing), inline success, autosave with a quiet "Saved" mark, undo instead of "Are you sure?".
- **Small rewards:** a check that draws itself on success, numbers that count to their value, a row that settles after a drag. Each uses an existing motion pattern, so "fun" never breaks consistency.
- **Direct manipulation:** drag to reorder, swipe actions on rows (phone), multi-select with a contextual toolbar that replaces the top bar.
- **Charts:** a small set of chart styles on the tokens (the system has stats but no charts).
- **Reach:** RTL, long-text and large-font checks; print styles for articles and tables.
- **App-type templates still missing:** editor or document app, calendar, kanban board, media gallery, checkout or multi-step form, onboarding.

## Done

- **45.** The command palette's search box was squarer than the palette's corners; "make sure similar visual issues don't occur throughout the design language" (owner, 2026-11-15, no screenshot): done (concentric corners as a rule and a suite check on every page, decision 0052).
- **46.** Swipe a row and reorder were "very glitchy" on the owner's iPhone (no screenshot): reworked 2026-11-15 (the dragged element is never re-inserted mid-touch; swipe settles from where the finger left it, decision 0052). **Needs the owner's iPhone look to close.**
- **50.** Accordions were "glitchy when collapsing" (owner, 2026-11-16, no screenshot): fixed 2026-11-16. The body could not shrink below its own padding, so the last 16px stalled and then snapped shut; Reveal now closes the padding with the height (this also smooths `.s4-expand`).
- **48.** Long swipe on a row did nothing on the owner's iPhone ("swiping a row works mostly, but long swiping is not working", 2026-11-15, no screenshot): fixed 2026-11-15 (the row follows the finger all the way, the action color fills the row past the point of no return, letting go runs the main action; decision 0053). Confirmed working by the owner on the iPhone, 2026-11-16.
- **49.** The tracker mockup dropped the app's own elements ("the calendar was gone"); the owner wants a mixture that keeps the app and draws its custom elements in Orion's style: rebuilt 2026-11-15 with four new components (decision 0053). Approved by the owner 2026-11-16 ("Looks great").
- **47.** The editor's formatting toolbar should not be glass: done 2026-11-15 (a solid joined button group; glass only on what floats, decision 0052).
- **B.** Idea list B, all eight picked by the owner ("For direct manipulation I wasn't able to move anything" on the quiz sketch): done 2026-11-15 (command palette, resizable panes, states, forms, rewards, direct manipulation that works with a finger, charts, six templates, decision 0051).
- **43.** Reply focused its field and the keyboard came up ([image](img/2026-11-14-reply-focuses-field.jpg)); "I never want this to happen anywhere": done 2026-11-14 (nothing focuses a field by itself, decision 0049; the suite checks it).
- **44.** "We never switch pages" (a message should open a reader view): done 2026-11-14 (pages with Back, title, URL and the Back gesture, decision 0050).
- **40.** One motion philosophy (owner, 2026-11-14: audit every transition, one page, a small fixed set of named patterns, a check): done 2026-11-14 (ten patterns, pattern tokens, every component moved, `npm run check:motion`, [motion page](../../components/motion/motion.html) with the scrubber, decision 0046).
- **38.** Expand in place instead of dialogs ([image](img/2026-11-14-reply-opens-dialog.png): Reply opened a "New Message" dialog away from the message): done 2026-11-14 (the placement ladder, `.s4-expand` and the inline confirm, Reply and Forward open a composer under the message in both mail templates, New Note opens in place in the showcase, decision 0047). The handoff named two reference images; only this one was saved.
- **39.** Orion on every GitHub Pages page, quizzes included: done 2026-11-14 (the review lab kit is built on the live bundle, reversing "review blue", decision 0048).
- **41.** Production pass (polished, zero bugs, ready for production): suite built 2026-11-14 (`tests/suite.mjs`: every component page, template and the showcase in Chromium and WebKit, in CI). Found and fixed: focus rings cut off in the accordion, in scrolling chip rows and in the desktop title bar; Escape on an expand's opener; a `data-expand` clash with the rail; three reference pages missing the motion script; the page going 14px too wide for a moment whenever views switched. CI passes in both browsers (265 page runs) as of 5a473dc. Not covered by a machine: how it looks on a real iPhone and a real desktop window (the owner's look).
- **42.** Search bar's focus ring cut off at the top (owner's screenshot, 2026-11-14, not saved: it arrived without a file): done 2026-11-14 (the ring is drawn inside the bar's edge). Issue 41's test pass should look for other rings clipped by a bar or a scrolling edge.
- **36.** List dividers overhang the rounded hover box ([image](img/2026-11-14-list-dividers-hover.png)): done 2026-11-14 (dividers sit between rows, inset, and fade beside an active row, decision 0045).
- **37.** Checkbox flashes a square when unchecked: done 2026-11-14 (the mark keeps its mask, decision 0045).
- **7.** Liquid hover between list rows: done 2026-11-14 (Edges Lean, decision 0044).
- **1.** Rail collapse animation glitches: done 2026-11-14 (rail is rows; only its edge moves, decision 0043).
- **2.** Duotone icons turn completely white when selected: done 2026-11-14 (selected icons keep both tones, decision 0043).
- **3.** Rail items on desktop: label beside the icon, hamburger menu button: done 2026-11-14 (rows with the label beside the icon, hamburger, solid main action, decision 0043).
- **4.** Solid controls on glass look out of place: done 2026-11-14 (items on glass are tints, proven by check-glass, decision 0043).
- **5.** Duotone icon tones are too close together: done 2026-11-14 (faded tone 0.42 / 0.38, decision 0043).
- **6.** Selected list rows touch the side edges but not the top: done 2026-11-14 (lists inset on every side, decision 0043).
- **8.** Switch hover looks bad; no hover halo: done 2026-11-14 (no halo; the handle grows a little, decision 0043).
- **9.** No glass on tables: done 2026-11-14 (flat rows, solid header, thin scrollbar, decision 0043).
- **10.** Table row hover looks bad: done 2026-11-14 (flat band, no checkbox halo, decision 0043).
- **12.** Composer send button height looks bugged: done 2026-11-14 (the composer is one pill, decision 0043).
- **13.** Press-to-square only where it fits: done 2026-11-14 (buttons stay round inside rounded containers, decision 0043).
- **14.** Selects must open the glass menu: done 2026-11-14 (the reference page loads the menu script, decision 0043).
- **15.** A real date picker: done 2026-11-14 (glass calendar with range, keyboard and a phone panel, decision 0043).
- **16.** Error fields: the red is too intense: done 2026-11-14 (normal fill; label, message and ring carry the error, decision 0043).
- **17.** Selected chips must not change size: done 2026-11-14 (chips keep one size; options in the Overhaul Review, decision 0043).
- **18.** Checkbox marks are too big: done 2026-11-14 (thin small marks, decision 0043).
- **20.** Slider must reach both ends: done 2026-11-14 (the handle travels the whole track, decision 0043).
- **21.** No stop dot peeking out under the handle: done 2026-11-14 (dots near the handle and at the ends are hidden, decision 0043).
- **22.** Color: normal, contrast-safe colors; accents stay accents: done 2026-11-14 (neutral surfaces, accent only on accents; options in the Overhaul Review, decision 0043).
- **23.** Badges look washed out in dark mode: done 2026-11-14 (one red badge in both modes, decision 0043).
- **32.** Don't autofocus fields in dialogs and sheets: done 2026-11-14 (the dialog takes focus, never a field, decision 0043).
- **33.** Field focus ring on glass feels off: done 2026-11-14 (hover fill stays during focus; fields on glass are tints, decision 0043).
- **34.** Replace bottom and side sheets with floating glass panels: done 2026-11-14 (floating glass panels, decision 0043).
- **35.** Side sheet: no edge glow down the side: done 2026-11-14 (panels float clear of every edge, decision 0043).
- **11.** Accordion: too fast, chevron should bend, not spin: done 2026-11-14 (accordion reveal + bending chevron, decision 0042).
- **19.** Radio: liquid selection, no inner dot: done 2026-11-14 (ink fill, no dot (window idea dropped by the owner), decision 0042).
- **25.** Skeleton: glitchy, and a wave instead of a blink: done 2026-11-14 (one sheen wave, decision 0042).
- **26.** Circular progress: 100% is a full circle; a more creative indeterminate: done 2026-11-14 (full ring, breathing arc, decision 0042).
- **27.** Linear progress: full at 100%, creative indeterminate, a realistic download demo: done 2026-11-14 (full bar, drop-like line, download demo on the progress page, decision 0042).
- **28.** Snackbars on glass, with a liquid arrival: done 2026-11-14 (glass, rises 14px, decision 0042).
- **29.** Tooltips: a bit faster and a better entrance: done 2026-11-14 (glass, rises 4px, appears after 350ms, decision 0042).
- **30.** Rich tooltips: rounder, with room around the action: done 2026-11-14 (extra-large corners, room around actions, decision 0042).
- **31.** Menus in the new motion style: done 2026-11-14 (items follow, decision 0042).
