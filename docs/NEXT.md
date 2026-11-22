# Where Orion stands (resume here)

**The plan to a 10 in every area, the current stage (round 0060) and how sessions work is in [`PLAN.md`](PLAN.md). Read it next.**

Read [`framework.md`](framework.md) for how the system fits together and [`decisions/README.md`](decisions/README.md)
for what applies today. The full log up to 2026-11-13 is in [`history/NEXT-2026-10-to-11-13.md`](history/NEXT-2026-10-to-11-13.md).

## Now (2026-11-22, round 0061, integrated on `round61/int`, not yet published)

Four things landed together. **Window controls and mid-motion** (decision 0072, issues 69 and 70; notes in the decision): Windows-style full cells that hit Close in the corner; nothing wraps while a size changes; `skill/orion/scripts/midmotion.mjs` freezes every motion at 25/50/75% and the page checker and suite use it. **Two iPhone fixes** (issues 71 and 72, notes `history/round-0061/mobile.md`): a place-holding container rings only for the keyboard (`data-s4-input`), and the nav bar highlight is a rounded rectangle holding its label again. **Intake from app sessions:** CLAUDE.md, SKILL.md, `.github/ISSUE_TEMPLATE/from-app.yml` and `docs/issues/inbox.md` tell the owner's app-building sessions to log Orion problems instead of patching around them; PLAN.md's Triage step reads them first each round. **PLAN.md has a new stage, "Full QA pass"** before anything counts as a 10 and before release 1.2.
**Needs the owner:** an iPhone look at Dosewise (switch tabs, open a medicine, swipe Back: is there still a ring round a button or row after Back?) and the Showcase nav bar with Settings selected; a Windows or Linux shell for the window controls. WebKit could not be installed in the build session, so the phone fixes were replayed in Chromium. **Next:** publish (the main session), tag 1.2.0 only after the Full QA pass, review 5.

## Before (2026-11-22, round 0060): review 4's blockers, in two workstreams

**Workstream A** (decision 0069, built; B is decision 0070, notes in `history/round-0060/b.md`): the app bundle is split. An
app links `orion.core.min.css/js` (78 KB gzip, everything is 178) plus the packs it uses (`data`, `commands`, `desktop`,
`direct`, `inputs`, `sitekit`); `node scripts/packs.mjs page.html` says which; the 15 app templates use it; `npm run check`
holds budgets and fails a page that links too few or too many packs; `npm run test:lean` proves a lean page equals the full
bundle (computed styles of every element, runtime names, errors). Also: Escape from a palette opened with nothing focused lands
on main (`S4.util.land()`, the suite fails the old behaviour); Linnea's toolbar Columns button is outside the grid (the
reviewer hit the header's per-column buttons; the suite guards it); the grid-keys hint shows on a touch screen after the
first navigation key. **Workstream B** (decision 0070, merged): one accent job per screen (Parley's four reds are gone; the rail action steps down by itself; no pressed chip at rest, Linnea's All Records chip included), a balanced Showcase at 1600, the Dosewise brand trial in `examples/brand-trial/` and the skill fixes it taught. **Rename (0071):** the product is Orion, the skill `skill/orion/`, the repo `4RK0S4H4/Orion`, Pages `.../Orion/` (the old URL is dead); the `s4` prefix stays. **Next:** the owner updates the git remote, then full tests, publish (the main session tags 1.2.0 after review 5), review 5.

## Before (2026-11-22, round 0059): review 3's Top 10, in two workstreams

**Workstream A** (decision 0067, built; B is decision 0068, notes in `history/round-0059/b.md`): dial values are validated
(`S4.theme` warns and writes nothing for a value off a dial's list, the page checker fails bad `data-*` values); a data
table says its header keys (`aria-description` and a hint line); 0049 lets a palette or search the person's own shortcut
opened hold the cursor; the page checker's one-glyph-box rule was fixed (it missed a zero-width box) and, like mid-word
breaks, is proven on known-bad pages in `tests/fixtures` (`npm run test:checker`); Back restoring scroll and focus has a
test (`npm run test:back`); CHANGELOG 1.0.0 (2026-11-13) and 1.1.0 (2026-11-22) are dated, 1.2.0 collects this round.
**Workstream B** (decision 0068, merged): Parley's wider list, one accent fill per job in a region, wide-window content in Tally and the Showcase, a 37-icon site subset (`icons-site.js`, site budget 150 KB). The app bundle split is planned, not built (`history/round-0059/b.md`).
**For the main session at publish:** tag 1.0.0 at `b72df1a^`, 1.1.0 at `383dedb`; 1.2.0 after review 4.

## Before (2026-11-22, round 0058): the re-grade's blockers, in two workstreams

An independent re-grade listed what blocks a 10 in each area. Round 0058 takes them in two workstreams (owner's lead,
2026-11-21). **Workstream A** (decision 0065, built): Back keeps your place and focus; focus never drops to `<body>`
(board drafts, mod+comma, the menu bar, the palette); data tables follow the grid pattern (one header and one body Tab
stop, Home/End, Tab out); the page checker and suite fail silent failures (unknown classes, broken words, parts outside
their component, loud statuses); bare tables and rail FABs render right; `.s4-num` right-aligns; statuses are tints;
one tonal tool in the filter bar; Parley's inspector and list; a banned-phrase check; issues 61, 62, 64, 65 Done.
**Workstream B** (decision 0066): light site bundle, Showcase and hub for wide windows, grabber and scrim, firm corners,
`scale` and `headings` dials. **Both merged, checked and tested.** Next: publish, then the owner's device pass and
review 3 (see below and `PLAN.md`).

**Workstream B on a device (notes: [`history/round-0058/b.md`](history/round-0058/b.md)):** (1) the hub at 390: its live
preview's dials change only the preview; (2) Sprig on cellular: the 67 KB font arrives before the hero text swaps, and
Sprig, Tidewater and the hub show no missing glyph or wrong weight in Safari (the subset font); (3) the Showcase: swipe a
note (Archive with Undo), hold a note to pick several, open a note (Back returns), See All 480 Notes, the Board; (4) a
modal panel (Controls, Floating Panel): the grabber, then drag down slowly, the scrim lightens with the finger, let go
short and it settles, past a quarter and it leaves from there; a dialog has no grabber; (5) Settings, Delete All Notes
in light mode: no pink smudge behind the card; (6) Larkline settings: a calm pane with a pink tonal button.
**Not verified:** Firefox and WebKit (the subset font; the following scrim needs Safari 17.4+ or Firefox 120+); icons are
now the biggest site file (37 KB), per-page subsetting later.

## Earlier (2026-11-21, round 0056 finished): everything built, needs the owner's look

The owner asked for every area of the design review taken to a 10 and left the order and the calls to us ("I trust
your judgement", 2026-11-16). Round 0056 built all of it in workstreams and merged them (notes in
[`history/round-0056/`](history/round-0056/)); `npm run check` and `npm test` are green:
- **Wave 1:** themes on any container, motion energy, app defaults, roomy density (0056); the website kit (0057); reach
  and every dial preset proven (0058).
- **Wave 2:** hierarchy and wide windows (issues 54, 56); the owner's critiques 61 to 65; button groups are the Ink Track
  and tabs join the navigation family (0059, the owner's pick).
- **Templates as products** (issue 66, done): all 19 templates and the new Data Table are their own products with their
  own brands through the dials (Tally, Relay, Pressroom, Moorings, Slugline, Crate, Proof, The Velvet, Fetch, Puck, Sprig,
  Hollis & Vane, Tidewater, Mallet, Spool, Larkline, Overhang, Penumbra, Linnea, Parley).
- **Lessons from the templates** (0060): a seed keeps its own color (variant `auto`), glass FAB labels proven for every
  seed, `S4.theme.restore(…, { only: ['mode'] })`, category colors, `geometric` and `humanist` faces, the display weight
  dial, `S4.buttonGroup.set`, the hairline token, message notes, small swatches. All 52 lessons:
  [`history/round-0056/lessons.md`](history/round-0056/lessons.md).
- **Rich inputs** (issue 59): combobox, tag input, number, one-time code, upload, time, rating, color, password helpers.
- **Data at scale** (0061, issue 59): data tables with virtual rows, pinned and resizable columns, column menus, groups,
  editing in place; filters and saved views in the address; code blocks and syntax tokens; chart ranges; Linnea.
- **Desktop anatomy** (0062, issue 60): `S4.commands`, menu bar, status bar, document tabs, tree, the rail as a source
  list, inspector, settings as a view, window states, `examples/` shells; Parley.
78 components (81 folders with glass, motion and icons), 20 templates (15 app, five site) after round 0057 (0063).

**Needs the owner's look on an iPhone:**
1. `templates/data-table.html` (Linnea): stacked rows, scrolling the 5,000, details, tapping a Drawer cell to edit, the
   filters panel, Loans scrolling sideways with the borrower pinned.
2. `templates/desktop-app.html` (Parley) at phone width: the nav bar, a line opening with Back, settings list then category.
3. The templates' brands (each should feel like a different product): Tally's serif, Relay's tinted page and dark rail,
   Pressroom's mono headings; Crate's Futura, Proof's Optima, Moorings' rounded face (real faces only on the iPhone);
   Slugline's script page (the line-type group following the caret).
4. The rich inputs: the combobox list above the keyboard, the one-time code's autofill from Messages, the number field's
   keyboard and hold-to-repeat, the upload zone opening the photo picker.
5. From wave 1 and 2: the site templates' glass header and phone panel; the themes page and Dark Navigation (`@scope`
   needs Safari 17.5+); Lively energy with `demo/index.html?scrub`; Larger Text, `dir=rtl`, print preview from Safari;
   the field focus hairline on tap vs the ring from a keyboard; the Ink Track's lead and trail at speed.

**Needs a look on a desktop (Windows or a Mac):**
1. Parley at full size: the menu bar with F10 and Alt; right-click a line, a file and a tab; drag a tab and a file onto a
   folder; collapse and resize the sidebar; Settings (mod+comma).
2. Linnea at 1280 and 1600: column grips, column menus, pinned columns while scrolling sideways, the filters panel beside
   the register, the keyboard through the table; `components/code/code.html`.
3. Centred or start-aligned capped content on wide windows (showcase home and Settings at 1600 and 1920); pane titles at 600.

**Not verified here:** WebKit and Firefox (not installable; CI runs WebKit); data table performance on real devices
(60 fps median measured only in this sandbox); the Electron and installed-app examples (cannot run here; Tauri is notes
only); the rail's resize and the inspector grip (by hand only, not in the suite); print pagination; real system faces.

**Decided in 0063 (2026-11-21):** the owner handed us the lead on the eleven waiting decisions ("I'll let you take the
lead on this … do anything you feel like it is for the best"); we took every recommendation and built it in round 0057
(branch `round57/decisions`; record [0063](decisions/0063-the-eleven-calls.md)): brand files so a fixed brand paints on
the first frame (and a cache for visitor-picked colors), `.s4-kicker` and `figure.s4-figure`, the meter, the board,
quiet resting checkboxes in tables, one label rule for colored FABs and the vibrant toolbar, `data-dense` for maps of
real things, calmer selection in vivid accents; Inter stays the only bundled face; rename, the tab ellipsis and centred
wide content as built. 78 components (81 folders with glass, motion and icons). **Needs the owner's look on an iPhone:** the meter in Tally, Relay, Pressroom,
Moorings and Larkline; Pressroom's board (lanes snapping, hold-to-drag, add in place); The Velvet's seat plan; Linnea's
quiet checkboxes; Parley's selected row in dark mode; Tidewater's kicker and byline in Safari's serif (real small caps).

**Built alongside, decision 0064 (the owner's notes, issues 67 and 68):** dialogs are calmer and rarer (a dialog only asks
a question the app cannot go on without, with two or three named answers; the checker fails one answer or a form), on a
phone dialogs and modal panels are a card in the bottom of the screen with swipe-down dismissal, the light scrim is 16%,
modal glass 90%, and docked glass bars drop the rim and glow for one hairline. **Needs the owner's look on an iPhone:**
[`explore/calm-dialogs.html`](../explore/calm-dialogs.html) (swipe the cards down; is Delete clear as a quiet red; is
the light scrim enough), the Showcase's Overlays and Settings > Delete All Notes, the bottom corners against the real
screen corners, and one hairline (no glow) under the bars while scrolling, light and dark. Not verified: real iOS touch
handling of the swipe (synthetic touch in Chromium only).


**Order from here (left to us):** the owner's looks first (device-only bugs before anything new), then the meter and the
board if the owner agrees, then Horizon 1's real apps built end to end with the skill, skill evals, and release 1.2.

## Earlier (2026-11-16, round 0056 wave 1): built, needs the owner's look

The owner asked for every area of the design review taken to a 10 and left the order and the calls to us ("I trust
your judgement"). Wave 1 was built by four workstreams and merged (notes in [`history/round-0056/`](history/round-0056/)):
- **Themes on any container, motion energy, app defaults, roomy density** (0056, issue 52): every dial on any element,
  nesting; `data-energy`; `data-buttons|cards|lists|rail`; `data-density="roomy"`; `check:scopes`; themes page
  `components/base/themes.html`.
- **The website kit** (0057, issue 53): `components/site/`, site tokens, five site templates (landing rebuilt, pricing,
  blog, docs, site), `orion.min.*` and per-set icon files. 62 components, 19 templates.
- **Reach** (0058): right-to-left, print (light), 200% text and long text, forced colors, keyboard; `tests/reach.mjs` in `npm test`.
- **Dial presets proven** (0058, issue 58): a dial pass in the suite; Elevated button, avatar stack, breadcrumb fixes.

**Needs the owner's look on an iPhone:**
1. The site templates: the glass header while scrolling, the phone menu panel (tap outside or a link closes it), the docs
   "Browse Docs" panel, the hero phone cut by its stage, scrolling under the sticky header.
2. The themes page and the showcase's Dark Navigation (Settings, Make It Yours): `@scope` and `light-dark()` need Safari 17.5+.
3. Motion energy: `demo/index.html?scrub` with Motion set to Lively (the overshoot amounts are our call).
4. Larger Text on the showcase; `dir=rtl` in Safari (slider, switch); print preview from Safari.
5. Elevated vs Tonal on a dark card; the avatar stack at xs; firm corners on the docked nav bar; serif and rounded
   faces (only Linux fallbacks were seen here).

**Needs a look on a desktop:** the site templates at 1280 and 1600 (landing and docs were seen at 1600, the others at
1280 only), `corners: firm` and `page: soft` on the sites, the themes page.

**Not verified here:** WebKit and Firefox (not installable; CI runs WebKit); print pagination (screenshots only); accent
text on glass for all 210 schemes (one seed tested); the reach suite's exemptions listed in 0058.

**Order from here (left to us; all three done by 2026-11-21, see Now):**
1. Wave 2: hierarchy and wide-window layout across the showcase and app templates (issues 54, 56).
2. Rich inputs (combobox, tag input, upload, time, number, one-time code, rating) and data at scale (table at scale,
   filters and saved views, code block) (issue 59).
3. Desktop anatomy: menu bar, status bar, document tabs, tree, settings window (issue 60).
Horizon 1's "two real apps" runs alongside as the test of each step.

## Earlier (2026-11-15 to 16)

Everything the owner asked for on 2026-11-14 and 15 is built and published; decisions 0046 to 0051 are recorded.
The long view is in [`ROADMAP.md`](ROADMAP.md): read it before choosing new work.

**Needs the owner's look (links in the last reply, all on Pages):**
1. Nothing focuses a field any more (0049): Reply in the mail templates, the expand page.
2. Pages (0050): the Pages reference page; "Open Full Page" in the mail templates; on a phone, a message opens with
   Back in the bar.
3. The seven new components (0051): palette, states, forms, rewards, direct manipulation, charts, resizable panes.
4. The six new templates: board, calendar, editor, gallery, checkout, onboarding.
5. Still open from before: the motion page (0046). (Panels: settled by 0054.)

**Added 2026-11-15 (later):** decision 0052 (concentric corners with a suite check, tinted color mode as a first-class
second mode, solid editor toolbar, dragging reworked for a real iPhone) and the first real-app test,
`explore/degree-tracker.html` (the owner's degree tracker in Orion, tinted, invented data; the real repo
`4RK0S4H4/wgu-degree-tracker` is private and was only read). Waiting on the owner: does dragging and swiping now work
on the iPhone, and what do they think of the tracker mockup (it could become a redesign proposal for that app; its own
CLAUDE.md asks for before/after screenshots and approval first). Candidates it surfaced: a progress ring component, a
segmented road/track component.

**Added 2026-11-15 (latest):** decision 0053, "the app is the app" (adapt an app by keeping its screens and its own
elements, drawn in Orion; make the component the app needs instead of bending the app to a component). Four
components came out of it (ring, milestones, month, timeline; 61 now), the tracker mockup was rebuilt as that mixture,
and the long swipe was fixed (issue 48). Waiting on the owner: the long swipe on the iPhone; is the mockup the right
mixture (then it can become the redesign proposal for the tracker, with before/after screenshots first).

**Added 2026-11-16:** the owner approved the tracker mockup ("Looks great") and settled the last open question from
0047: decision 0054, tool panels (`data-modeless`; filters and inspectors leave the page live on wide windows; task
panels, dialogs and phones stay modal). The owner then confirmed the long swipe works on the iPhone (issue 48 closed) and said the tracker redesign is theirs
to do in that repo: the mockup stays a mockup here, do not propose or start work in the tracker repo. Nothing is
waiting on the owner.

**Added 2026-11-16 (design review):** the owner asked for an end-to-end review "like a professional web designer",
a comparison with other systems, and a way to make Orion "super customized as a base" per app. Published as
[`explore/design-review.html`](../explore/design-review.html): verdict, eleven findings (issues 51 to 60), the
comparison, a proposal for brand dials (what stays fixed, what opens up) with the same screen as four apps, and eight
big questions. **Waiting on the owner's answers**; they decide whether corners and typeface may change per app (that
would amend 0023 to 0025 and the Inter rule), letter spacing, hierarchy in neutral mode, a website kit, and what comes
first. Until then nothing from the review is built except one fix (the dashboard's revenue rise uses the success tone,
not the accent). Without asking, a next session may do issue 57 (document drift), 56 (card grids fill) and 58.

**Added 2026-11-16 (answers):** the owner answered the review's eight questions and left the order to us: decision
0055. Built: letter spacing tuned for Inter, headings at 600, and the first brand dials (`corners`, `gray`, `page`,
`display`, `text` on `S4.theme`; `components/base/brand.css` and the generated `gray.css`; "Make It Yours" in the
showcase Settings; a skill section). Document drift (issue 57) fixed. **Needs the owner's look:** the new type on
every page (it changes every app), and the dials in the showcase Settings on the iPhone.

**Order from here (the owner left it to us; 0055):**
1. A suite pass over every dial preset (concentric corners, contrast, overflow), so the dials are proven like accents are.
2. Issues 56 (card grids fill wide windows) and 58 (Elevated button, avatar stacks, breadcrumb chevrons).
3. Motion energy and per-app component defaults; themes on any container (issue 52).
4. The website kit (issue 53): site header and footer, hero with media, feature rows, pricing, testimonials, logo row,
   article index, docs layout, fluid display type, section rhythm, four site templates. Show the direction in a quiz first.
5. Rich inputs (59), then desktop anatomy (60). Horizon 1's "two real apps" runs alongside as the test of each step.

**Next session, without asking (Horizon 1 of the roadmap):**
1. Fix whatever the owner's looks turn up, as numbered issues with their screenshots.
2. Build two real apps end to end with the skill (one phone-first, one desktop) and fix what the skill gets wrong.
3. Re-run and extend the skill evals for the new pieces.
4. Reach checks in the suite: right-to-left, long text, 200% text size, print.
5. Icons for writing tools (the editor borrows unrelated icons).

**WebKit:** cannot be installed in this cloud environment (network rules); `npm test` runs Chromium here and CI runs
both on every push. Read the CI result with the GitHub Actions tools after pushing.

Still waiting on the owner's device looks: iPhone for 0037, 0040 and 0043 to 0051; a computer for the desktop template.

## Plan

1. Idea A (touched things turn into glass) as a lab.
3. Still unanswered from the framework review (0041): approve 0041, release, minified bundles and per-set icons, pruning.
   (Rail auto-expand and the rail FAB are settled by 0043.)
4. Release: CHANGELOG date, tag, re-package the skill, tell the owner to re-download it.
5. Desktop next steps (resizable panes and the command palette are in the idea quiz): a menu bar pattern, a real
   Electron or Tauri shell example wired to `s4-window`. Done in round 0056 (0062); the shells need a real desktop run.
6. Showcase: add the date picker, a floating side panel, status tones and a compact-density toggle.

## Backlog

- Filled toggle buttons (unselected = surface-container) look faint on surface-container-low in dark mode.
- Possible tokens: connected-group gap 2px, 18dp checkbox/chip check size, switch track 52, slider handle 44, stat-row min 160.
- Container queries use literal 600/840/1200px (var() isn't allowed in @container conditions).
- Untested in Safari/WebKit here: everything visual needs the owner's iPhone look.
- The labs in `explore/` load their own copies of m3color/Inter; could use `components/assets/`.
- Off-switch ring on glass; tables lab (the owner wanted tables explored in context).

## Session log

- 2026-11-22 (round 0058, workstream B, merged): a light site bundle (`orion.site.min.*`, Latin Inter, 173 KB gzip against a 180 KB budget, was 375 KB), the Showcase and hub for wide windows, quiet danger zones, grabber and following scrim on modal panels, firm corners reach containers, `scale` and `headings` dials (0066); merged into A, check and test green. Next: publish, the owner's device pass, review 3.
- 2026-11-22 (round 0058, workstream A): place, focus and silent failures (0065): Back restores scroll and focus, focus never on body, the grid keyboard for data tables, silent-failure checks in the checker and suite, bare tables and rail FABs, `.s4-num`, statuses are tints, one tonal tool per toolbar, Parley finish, drift and `check:words`. Next: merge workstream B (0066).

- 2026-11-21 (round 0057, calm): calm dialogs, phone cards with swipe-down, lighter scrim, firmer modal glass, docked bars with one hairline (0064, issues 67 and 68); merged with the decisions branch and published.
- 2026-11-21 (round 0057, decisions): the eleven calls taken as recommended and built (0063): brand files, kicker and figure, meter, board, quiet table checkboxes, one label rule, dense maps, calmer selection, small lessons 38, 39, 42, 43, Parley's phone bar. Next: merge with round57/calm, then the owner's looks.
- 2026-11-21 (round 0056, last merge): lessons (0060), data at scale (0061), desktop anatomy (0062) merged and fixed together; all templates are products (issue 66); decisions, docs, skill and hub updated; check and test green. Next: the owner's looks and the eleven decisions under Now.
- 2026-11-16 (round 0056, wave 1): themes on any container, energy, app defaults, roomy (0056); website kit (0057); reach and proven dial presets (0058); four workstreams merged, check and test green. Next: the owner's looks, then wave 2 (issues 54, 56), 59, 60.
- 2026-11-16 (brand dials): the owner's answers recorded as 0055; type retuned, first dials built, drift fixed. Next: the order above.
- 2026-11-16 (design review): end-to-end review, comparison and brand dials proposal published as a quiz; issues 51 to 60 logged. Next: the owner's eight answers, then a numbered decision.
- 2026-11-15 (any-app round): never focus a field (0049), pages (0050), the eight ideas built (0051): palette, resizable panes, states, forms, rewards, direct manipulation, charts, six templates; ROADMAP written. Next: the owner's looks, then Horizon 1.
- 2026-11-14 (production round): one motion philosophy (0046), placement ladder and expand in place (0047), quizzes on the live bundle (0048), production suite in Chromium and WebKit in CI, idea list B quiz. Next: the owner's looks and quiz picks.
- 2026-11-14 (handoff): owner's next round recorded as issues 38 to 41 and idea list B; nothing built. Next session: start at "Now".
- 2026-11-14 (palette): Crisper grays, named accents and the any-accent check, list dividers, checkbox square fix (0045). Next: the plan below.
- 2026-11-14 (answers): 0043 accepted; row hover Edges Lean built; palette contrast fixes; Palette Review published (0044). Next: owner's palette answer.
- 2026-11-14 (overhaul): decision 0043 built (see Now). Overhaul Review published. Date picker README and the showcase additions are the loose ends. Next: owner's answers.
- 2026-11-14 (motion): Lab 2 answered; 0042 accepted and built (spring tokens ink/rise/settle/tip/reveal/bend; accordion, glass snackbar and tooltip, menu items follow, skeleton wave, progress, radio ink, rich tooltip corners). Issues 11, 19, 25-31 done. Open: row hover (owner reviews on a computer). Next: color (22) and the rest of the issues, in order.
- 2026-11-14 (lab 2): Lab 1 answered (0042: liquid only for ink, glass plain, faster; accordion/snackbar/tooltip/loading = B). Liquid Motion Lab 2 published (row hover edges, radio ink under windows, menu, speed). Next: owner's answers, then build the motion issues.
- 2026-11-14 (lab): Liquid Motion Lab published. Next: owner's answers, then decision 0042 and the motion issues.
- 2026-11-14: owner's 35 critiques, one idea and the liquid-motion direction recorded as issues with images (docs/issues). Next: work the issues.
- 2026-11-13 (framework): review + overhaul (0041), templates, layouts, content components, docs, hub. Next: owner's answers.
