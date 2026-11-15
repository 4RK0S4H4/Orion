# Where S4 Orion stands (resume here)

Read [`framework.md`](framework.md) for how the system fits together and [`decisions/README.md`](decisions/README.md)
for what applies today. The full log up to 2026-11-13 is in [`history/NEXT-2026-10-to-11-13.md`](history/NEXT-2026-10-to-11-13.md).

## Now (2026-11-15): waiting on the owner

Everything the owner asked for on 2026-11-14 and 15 is built and published; decisions 0046 to 0051 are recorded.
The long view is in [`ROADMAP.md`](ROADMAP.md): read it before choosing new work.

**Needs the owner's look (links in the last reply, all on Pages):**
1. Nothing focuses a field any more (0049): Reply in the mail templates, the expand page.
2. Pages (0050): the Pages reference page; "Open Full Page" in the mail templates; on a phone, a message opens with
   Back in the bar.
3. The seven new components (0051): palette, states, forms, rewards, direct manipulation, charts, resizable panes.
4. The six new templates: board, calendar, editor, gallery, checkout, onboarding.
5. Still open from before: the motion page (0046); should floating panels become non-modal (0047)?

**Added 2026-11-15 (later):** decision 0052 (concentric corners with a suite check, tinted color mode as a first-class
second mode, solid editor toolbar, dragging reworked for a real iPhone) and the first real-app test,
`explore/degree-tracker.html` (the owner's degree tracker in Orion, tinted, invented data; the real repo
`4RK0S4H4/wgu-degree-tracker` is private and was only read). Waiting on the owner: does dragging and swiping now work
on the iPhone, and what do they think of the tracker mockup (it could become a redesign proposal for that app; its own
CLAUDE.md asks for before/after screenshots and approval first). Candidates it surfaced: a progress ring component, a
segmented road/track component.

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
