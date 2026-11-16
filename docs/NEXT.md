# Where S4 Orion stands (resume here)

Read [`framework.md`](framework.md) for how the system fits together and [`decisions/README.md`](decisions/README.md)
for what applies today. The full log up to 2026-11-13 is in [`history/NEXT-2026-10-to-11-13.md`](history/NEXT-2026-10-to-11-13.md).

## Now (2026-11-16, round 0056): wave 1 built, needs the owner's look

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

**Order from here (left to us):**
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
   Electron or Tauri shell example wired to `s4-window`.
6. Showcase: add the date picker, a floating side panel, status tones and a compact-density toggle.

## Backlog

- Filled toggle buttons (unselected = surface-container) look faint on surface-container-low in dark mode.
- Possible tokens: connected-group gap 2px, 18dp checkbox/chip check size, switch track 52, slider handle 44, stat-row min 160.
- Container queries use literal 600/840/1200px (var() isn't allowed in @container conditions).
- Untested in Safari/WebKit here: everything visual needs the owner's iPhone look.
- The labs in `explore/` load their own copies of m3color/Inter; could use `components/assets/`.
- Off-switch ring on glass; tables lab (the owner wanted tables explored in context).

## Session log

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
