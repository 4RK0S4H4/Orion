# Where S4 Orion stands (resume here)

Read [`framework.md`](framework.md) for how the system fits together and [`decisions/README.md`](decisions/README.md)
for what applies today. The full log up to 2026-11-13 is in [`history/NEXT-2026-10-to-11-13.md`](history/NEXT-2026-10-to-11-13.md).

## Now (2026-11-14, evening): waiting on the owner

Issues 38 to 41 are built and published; decisions 0046 to 0048 are recorded. Nothing is half done.

**Needs the owner's look or answer:**
1. [Motion page](https://4rk0s4h4.github.io/s4-orion/components/motion/motion.html): the ten named patterns, with
   the scrubber (0046). Small visible changes are listed in the decision.
2. Reply under the message: [list-detail](https://4rk0s4h4.github.io/s4-orion/templates/list-detail.html),
   [desktop app](https://4rk0s4h4.github.io/s4-orion/templates/desktop-app.html),
   [Expand In Place](https://4rk0s4h4.github.io/s4-orion/components/expand/expand.html) (0047). Open question in the
   decision: should floating panels become non-modal?
3. The new quiz look (0048) and the first quiz in it:
   [What To Build Next](https://4rk0s4h4.github.io/s4-orion/explore/ideas.html) (idea list B). **Build what the owner
   picks from it.**
4. Approve the release (see Plan 4) once 1 to 3 look right.

**Next session, without asking:** read the owner's quiz answers and build the picks, each on a motion pattern and the
placement ladder, each with a reference page that the suite covers. Keep `npm run check` and `npm test` green.

**How to verify WebKit:** this cloud environment cannot download WebKit (blocked by its network rules), so
`npm test` runs Chromium here and warns. CI (`.github/workflows/check.yml`, job `pages`) runs both browsers on every
push: read its result with the GitHub Actions tools after pushing and fix what it finds.

**Handoff gap to know about:** the previous session's notes said issues 38 to 41 were written in the issues file with
two reference images; only the titles and one image (Reply opens a dialog) were there. They were built from the
owner's instructions for this session. If the owner had a second screenshot, ask for it.

Still waiting on the owner's device looks: iPhone for 0037, 0040 and 0043 to 0048; a computer for the desktop template.

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
