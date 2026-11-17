# Round 0056: hierarchy-wide (issues 54, 56, 66)

Branch `round56/hierarchy-wide`. The scope changed mid-round with the owner's issue 66: the system-level hierarchy and
wide-window rules stayed (applied to the showcase, which stays monochrome and stock), and three app templates became
products of their own (dashboard, list-detail, kanban) instead of being polished as neutral starters. The mid-word
label break was dropped from this workstream (critiques-61 owns buttons, button groups, fields and the composer).

## What was built (paths)

**Wide windows (issue 56), in the system**
- `components/base/base.css`: `.s4-grid` fills its row (`auto-fit`); `--s4-grid-fill: auto-fill` for a collection that
  filters, so one result keeps a tile's size.
- `components/layout/layout.css`: one alignment policy: capped content is centred beside the rail at every width and
  the top app bar's title and actions follow the same column (the content's or the visible view's `data-width`).
  A third list-detail pane, `data-join="extra-large"` (shown from 1600, `--s4-split-join`, 360), also with
  `data-resizable`.
- `components/search/search.css` (minimal edit, not my folder): a search with `data-filter` spans the column of what it
  filters; the 720 cap stays for a standalone search.
- `components/nav-bar/nav-bar.css` (minimal edit): the bar clips its sliding pill sideways, so a lively spring that
  overshoots past the last item never widens the page (the suite caught it on Relay's last tab).
- Docs: `docs/foundations/spacing.md` (rhythm rule, the window ladder table, the alignment policy and why),
  `components/layout/README.md` (join attribute, ≥1600 row, policy).

**Hierarchy (issue 54), in the system**
- `components/pane/pane.css`: a pane title takes the heading weight (600) at title-medium size, so it outranks the card
  titles, list headlines and labels inside it (it read the same as the field labels in the showcase Settings).
- `docs/foundations/typography.md`: "Which role where on an app screen" table (page title, page heading, hero number,
  section/pane title, card title and list headline, labels, supporting text, metadata) and three rules.

**Checks**
- `tests/layout.mjs` (in `npm test` as `test:layout`): showcase in every view and every app template at 1280, 1600,
  1920 light and 390 dark. fill (a `.s4-grid` never leaves a column empty at its end), reading (a multi-line
  paragraph never runs past 760), title (the page title is the largest words; hero numbers exempt), align (the bar
  starts on the content's edge; a leading icon button's box hangs 8 outside), steps (a card, pane, field, chip or
  tonal button never has the same fill as the surface it sits on). Thresholds in one `T` block at the top.
- `tests/reach.mjs` (one-line correctness fix in the keys pass): positions are measured inside a sideways scroller
  (scrollLeft, as scrollTop already was), so moving focus into a board's next lane is not a "jump up the page".

**Showcase** (`demo/index.html`): Settings and Forms at `data-width="reading"`; home cards fill their row; titles align.

**Templates (issue 66)**: `templates/dashboard.html` (Tally), `templates/list-detail.html` (Relay),
`templates/kanban.html` (Pressroom). Each keeps the hub's light/dark choice but sets its accent with `S4.theme` without
saving it (the shared `orion-template-theme` key would otherwise carry one template's brand into the next).

## Visible choices and why (for a decision record)
1. **Centred, not start-aligned**, at every width class from expanded up. A start-aligned capped column leaves all spare
   width on one side (400px at 1920); the rail already anchors the start edge; the bar follows the column so the title
   names what is under it. (Owner may prefer start-aligned; see "for the owner".)
2. **Nothing joins at large (1200–1599)**: the rail auto-expands there and eats the extra 144; a third pane would
   squeeze the detail under 400. Joins happen at 1600: third list-detail pane, dashboard third column, wide pages grow.
3. **Grids fill** (`auto-fit`): two cards share a row instead of floating at its start; filtering collections opt out.
4. **Pane title weight, not size**: pane title 16/600 over card title 16/500 over labels 14/500 keeps panes calm
   (title-large would compete with the 24–28 page heading on dashboards).
5. Showcase Settings and Forms at reading width (a 1000px segmented control is not a setting).

## Before and after (sample audit: showcase home, controls, settings; dashboard; list-detail; kanban)
- **Showcase home 1280/1600.** Before: first read was the search field; two 236 cards beside 500px of nothing; search
  stopped at 720 while the list ran to 1200; at 1600 the title "Home" sat 56px left of the centred column. After:
  cards share the row, search spans the list's column, title on the column edge. Remaining: the first read is still
  the search bar (fine for a notes app).
- **Showcase settings 1280/1600.** Before: pane titles ("Appearance") indistinguishable from field labels ("Corners");
  segmented controls 1000px wide. After: reading width, centred, pane titles at 600; three levels read at a glance.
- **Dashboard (stock) before.** "October" and the 4 stat values were the only ranking; the one black bar was the only
  accent; Week/Month/Year broke mid-word. After: Tally (below).
- **List-detail (stock) before.** At 1600 the detail stopped at a short pane with half the window empty. After: Relay
  with the joined customer pane.
- **Kanban (stock) before.** At 1280 the fourth lane was cut off with no sign it scrolls. After: Pressroom, five lanes fit.

## The three templates, and the lessons (issue 66)

### Tally (dashboard): cash and invoices for a small design studio
Who: the studio owner, Monday morning. First read: Cash On Hand ($84,320, display-medium) and the runway meter (7.2
months against a safe line of 6); second: money in and out over twelve months; third: who owes us (Needs A Nudge, by
age). Dials: green seed with `variant: 'tonal'`, `data-gray="warm"`, `data-page="soft"`, `data-corners="firm"`,
`data-type-display="serif"`, `data-energy="calm"`, `data-cards="filled"`. Own elements: runway meter, paired in/out
bars (quarter ticks only in a narrow pane; Show As Table opens a table in place), aging bar with named amounts,
dated Coming Up tiles that fill a row at 840–1599 and become the third column at 1600. States: accounts sync error
banner with Reconnect; New Invoice is a modal task panel.
- Easy: the dials from `<html>` change everything at once (the serif reaches stat values); pane, stat row, list,
  table, banner, expand all fit a finance product unchanged.
- Held back: (1) the default `vibrant` variant turns a deep green seed into a neon mint secondary container (nav
  indicator, tonal buttons); needed `variant: 'tonal'`. (2) No 2dp token for hairline gaps (paired bars, segmented
  bars): wrote `calc(var(--s4-space-1) / 2)`. (3) No hero-number size: used `.s4-display-medium.s4-emphasized` plus
  `data-hero`. (4) `.s4-chart` has no paired/grouped column chart, so the bars are hand-drawn, and its labels would
  collide at 200% text the way mine did. (5) The button group's labels still break mid-word in a header (critiques-61).
- Proposals: a `variant` guard (pick tonal or clamp secondary-container chroma for dark seeds) or document it in
  the accent table; `--s4-space-hairline` (2dp; also the joined capsule gap); `.s4-stat[data-size="hero"]`;
  `.s4-chart data-type="column" data-group` with tick thinning in narrow containers.

### Relay (list-detail): the support desk of a shipping-software company
Who: a support agent working a queue all day. First read: the ticket whose clock runs out first (sorted, a red "Late
20m"), then its thread, then the customer. Dials: indigo seed, `surfaces: 'tinted'`, `data-gray="cool"`,
`data-corners="soft"`, `data-type-display="system"`, `data-energy="lively"`, `data-density="auto"`, and a scoped dark
rail (`data-theme="dark"` on the rail). Own elements: the response clock (words first, a bar of time used, tone by
state), internal notes in the thread (warning container, lock icon, never a bubble), suggested replies (assist chips
that fill the reply, never focusing it), the customer card (plan, pay, volume, since, earlier tickets) which joins as a
third pane at 1600 and opens in place from a Customer button below it. States: no search match, customer list error
with Try Again (`S4.states.load`), Solved empty, ticket as a page with its own URL.
- Easy: the split, listbox, pages, expand, thread and states compose into a real desk with little code; the joined
  pane needed one attribute; the scoped dark rail is one attribute.
- Held back: (1) in tinted dark mode the default glass FAB's label is 3.19:1 (page checker); used
  `data-color="primary"`. `check-glass` proves FAB icons at 3:1 but not FAB labels in tinted schemes. (2) Lively energy
  made the nav bar's pill overshoot past the screen edge (fixed in nav-bar.css). (3) A list row has one trailing slot
  for status, so SLA and priority could not both show; (4) no "note" variant of `.s4-message`.
- Proposals: prove extended-FAB labels in `check-glass` across tinted schemes (or make the tinted FAB label use
  on-surface on glass); a second trailing line in list rows (`.s4-list-trailing` stacking two statuses is fine, but a
  documented pattern); `.s4-message[data-kind="note"]`; a `.s4-clock`/meter component (Tally's runway, Relay's clock
  and Pressroom's word meter are the same element three times: a labelled track with a tone).

### Pressroom (kanban): a city newsroom's story board
Who: the night editor. First read: the edition band (closes in 3h 20m, front page 3 of 4), then the Editing lane
that is over its limit, then the late story inside it. Dials: orange seed, `data-type-display="mono"`,
`data-buttons="tonal"`, `data-rail="collapsed"` (five lanes fit at 1280), stock neutral page and round corners; a
scoped dark band (`data-theme="dark"` on the edition section). Own elements: edition band with front page slots,
desk tags in the chart palette with their names, word count meter per story, a lane limit (`data-limit`, an "Over 3"
status and a red count). Story opens as a page; Spike Story with Undo; a new pitch typed in place.
- Easy: reorder across lanes, pages, palette, Undo and the dark band all worked without new system code.
- Held back: (1) chart colors are the only categorical palette, so desk tags borrow `--s4-chart-*` (no named
  "category" tokens); (2) a board needs the rail collapsed by default to fit, set per app; (3) the reach keys pass
  measured focus jumps without the board's sideways scroll (fixed in the test); (4) no lane/column component, so
  every board re-implements lanes, counts and limits in app CSS.
- Proposals: `--s4-category-1…6` aliases of the chart palette for tags; a `.s4-board`/`.s4-lane` component (lane
  head with count and limit, add-in-place footer, horizontal snap on phones) since kanban, calendar-week and
  pipelines all need it.

### Across all three
- The template theme script: templates shared one localStorage key and `S4.theme.restore` saves the whole theme, so a
  branded template would push its corners, fonts and accent into every other template. Fixed per template by
  reading only the mode; the other app templates still use `restore` (fine while they are stock). Proposal:
  `S4.theme.restore(key, defaults, { only: ['mode'] })`.
- Nothing needed restyling a component by class; one wrapper (`.tl-period { flex: none }`) placed a button group.

## Changelog lines
- Added: `data-join="extra-large"` third pane for list-detail; `--s4-grid-fill`; `tests/layout.mjs` (`npm run test:layout`).
- Added: three product templates: Tally (dashboard), Relay (list-detail), Pressroom (board), each branded by dials.
- Changed: `.s4-grid` fills its row; content stays centred and the top app bar aligns with the content column; pane
  titles weight 600; a filtering search spans its column; showcase Settings and Forms at reading width.
- Fixed: nav bar pill overshoot widened the page under lively energy; reach keys pass ignored sideways scroll.

## For the skill (when to use, when not)
- Page width by content: reading for forms/settings/prose, default for dashboards and home, wide for tables/boards.
  Never start-align a capped page by hand; the shell centres it and aligns the bar.
- Use `data-join="extra-large"` for context of the open item; never put anything only there.
- `.s4-grid` fills its row; set `--s4-grid-fill: auto-fill` on galleries and results that filter.
- Typography: follow the "which role where" table; rank with size, then weight, then on-surface-variant; never the accent.
- A branded template sets its accent with `S4.theme({ mode, seed, … })` without `restore`, so it does not save over others.

## Hub links to add
`templates/dashboard.html` (Tally), `templates/list-detail.html` (Relay), `templates/kanban.html` (Pressroom): the hub
cards still call them Dashboard, List and Detail, Board; their blurbs should name the product.

## For the owner (taste calls, best judged on a real screen)
1. **Centred or start-aligned capped content** on wide windows. Centred (built): showcase home at 1600 has even 80px
   margins and the "Home" title sits on the column's edge. Start-aligned: the column hugs the rail and the right side
   holds all spare width. Look at the showcase home and Settings at 1600 and 1920.
2. **Pane title weight 600** vs the old 500: Settings panes now read as headings; on a dense page some may find them
   heavy.
3. **The three templates' brands** on the iPhone: Tally's serif (New York on iOS), Relay's tinted lavender page with a
   dark rail, Pressroom's monospaced headings and dark edition band. Each should feel like a different product.

## Not finished or not verified
- Only three of the fifteen app templates were made into products (the order said three this window). Settings,
  sign-in, article, chat, tool, calendar, editor, gallery, checkout and onboarding remain stock; the layout pass
  covers them and they pass.
- The full 1280/1600/1920 matrix with `page: 'soft'` and a tinted accent was checked only through the suite's dial
  presets, not by eye; the showcase controls view was audited at 1280 only.
- No case was found for changing a gray value: the layout pass's surface-step check finds no adjacent nested
  surfaces with the same fill in the showcase or app templates at any width.
- Safari/WebKit not run here.
