# Where S4 Orion stands (resume here)

Read [`framework.md`](framework.md) for how the system fits together and [`decisions/README.md`](decisions/README.md)
for what applies today. The full log up to 2026-11-13 is in [`history/NEXT-2026-10-to-11-13.md`](history/NEXT-2026-10-to-11-13.md).

## Now (2026-11-14): nothing waiting on a lab

Accepted and built: the overhaul (0043), Edges Lean row hover and palette contrast (0044), Crisper base grays, any
accent with monochrome as one choice, new list dividers, checkbox fix ([0045](decisions/0045-crisper-grays-any-accent-dividers.md)).

Waiting only on the owner's device looks: iPhone for 0037, 0040 and everything in 0043 to 0045 (WebKit is untested
here), and a computer for the desktop template and compact density.

## Plan

1. Idea A (touched things turn into glass) as a lab.
3. Still unanswered from the framework review (0041): approve 0041, release, minified bundles and per-set icons, pruning.
   (Rail auto-expand and the rail FAB are settled by 0043.)
4. Release: CHANGELOG date, tag, re-package the skill, tell the owner to re-download it.
5. Desktop next steps: resizable split panes, a command palette (search + shortcuts), a menu bar pattern, a real
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

- 2026-11-14 (palette): Crisper grays, named accents and the any-accent check, list dividers, checkbox square fix (0045). Next: the plan below.
- 2026-11-14 (answers): 0043 accepted; row hover Edges Lean built; palette contrast fixes; Palette Review published (0044). Next: owner's palette answer.
- 2026-11-14 (overhaul): decision 0043 built (see Now). Overhaul Review published. Date picker README and the showcase additions are the loose ends. Next: owner's answers.
- 2026-11-14 (motion): Lab 2 answered; 0042 accepted and built (spring tokens ink/rise/settle/tip/reveal/bend; accordion, glass snackbar and tooltip, menu items follow, skeleton wave, progress, radio ink, rich tooltip corners). Issues 11, 19, 25-31 done. Open: row hover (owner reviews on a computer). Next: color (22) and the rest of the issues, in order.
- 2026-11-14 (lab 2): Lab 1 answered (0042: liquid only for ink, glass plain, faster; accordion/snackbar/tooltip/loading = B). Liquid Motion Lab 2 published (row hover edges, radio ink under windows, menu, speed). Next: owner's answers, then build the motion issues.
- 2026-11-14 (lab): Liquid Motion Lab published. Next: owner's answers, then decision 0042 and the motion issues.
- 2026-11-14: owner's 35 critiques, one idea and the liquid-motion direction recorded as issues with images (docs/issues). Next: work the issues.
- 2026-11-13 (framework): review + overhaul (0041), templates, layouts, content components, docs, hub. Next: owner's answers.
