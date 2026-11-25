# Orion re-grade 5 (commit 4081644), independent reviewer

Method: local server (`python3 -m http.server`, 127.0.0.1), Playwright Chromium 1.63 (the only browser installed here). 25 pages x (390 dark, 1280 light, 1600 light) = 75 shots: the hub, the Showcase, the components gallery, all 21 files in `templates/` (20 products and the templates index) and `examples/brand-trial`. **Zero horizontal overflow, zero page errors, zero console errors or warnings, zero failed requests on all 75.** I looked at the demo (390, 1600), desktop-app (390, 1600), dashboard, data-table (1280, 1600), docs, landing (390, 1600), kanban, settings and contact sheets of every page at 390 and 1280. Probes by hand: Tab order (demo, data-table, desktop-app), palette (mod+K, Escape twice, Escape with nothing focused), Back/Forward in the Showcase, 0078 range selection on Linnea, `S4.theme` with 15 odd values and four seeds, `corners: firm` + `scale: large`, the phone dialog, window controls in a stubbed Windows shell (LTR light, RTL dark, maximized), glass glow depth on the FAB, snackbar and tooltip, network transfer of 8 pages, `upgrade.mjs` dry run on `tests/fixtures/upgrade/app-1.0`.
Commands: `npm run check` passes; `npm run test:checker` passes ("Checker proofs passed."); `npm run test:back` passes ("Back keeps its place everywhere tried."); the page checker on all 21 templates, the Showcase and the brand trial: "0 error(s), 0 warning(s)". Shots, probes and logs: /tmp/claude-0/-home-user-s4-orion/41fbd5a5-7433-59f0-9952-e0cead264e41/scratchpad/regrade5/ (e.g. `shots/templates_desktop-app-1600l.png`, `table_range.png`, `crop_focusring.png`, `winctl_ltr_light_hover.png`, `phone_dialog.png`, `dial_yellow_firm_large.png`).
Not checked: WebKit and Firefox (not installed), real devices (swipe, iOS glass, modal drag, Safari subset font), screen readers, print, RTL and 200% text beyond the window controls, the full `npm test` (suite, reach, layout, lean, upgrade), Electron or Tauri for real. The touch grid hint (R4 N8) I did not re-drive.

| Area | R3 | R4 | R5 |
|---|---|---|---|
| Foundations | 9 | 9 | 9 |
| Behaviour | 8.5 | 9 | 9.5 |
| Accessibility | 8.5 | 8.5 | 9 |
| App Components | 9 | 9 | 9 |
| Visual Hierarchy | 8.5 | 8.5 | 9 |
| Desktop Apps | 8.5 | 8.5 | 9 |
| Websites | 8.5 | 9 | 9 |
| Per-App Customization | 9 | 9.5 | 9.5 |

Still no 10. The rounds since review 4 closed every R4 blocker that this environment can check, and behaviour is close. What keeps each area off 10 is a short list of real, fixable things (below), plus the device pass.

## Review 4's blockers (R4 listed eight)
1. **Parley's four reds (N1): fixed.** At 1600 Approve is the one filled action; Next Untranslated is elevated (neutral fill, red label); the open line is neutral; Strings is the one accent selection. Accent *text* is still everywhere on that screen (new N7).
2. **App bundle split (N2): fixed.** `orion.core.min` 42.7 + 39.5 KB gzip plus packs; dashboard loads core + data only. Caveat: every app page still loads `icons.js` at 103.1 KB gzip, the largest script on the page.
3. **iPhone pass (N3): not done** [device-only].
4. **Palette Escape with nothing focused (N4): fixed.** Fresh load, Ctrl+K, Escape: focus on `MAIN.s4-content`. With a query, the first Escape clears it and keeps the palette open, the second closes it and returns to the opener ("New Note").
5. **Columns button in the table (N5): fixed.** Tab order on Linnea: Search, Add Filter, All Filters, Sort, Columns, View Options, then the table's Select All; the button is outside the grid.
6. **Showcase 1600 balance (N6): fixed.** Side column (Your Week, Folders with "Stored In This Browser") ends at y 868 of 1000, the main column at 924; columns are 16 wide; no All chip.
7. **1.2.0 release (N7): not yet.** CHANGELOG still "## [1.2.0] - Unreleased", no `releases/1.2.0/`. Expected after this review.
8. **Grid hint on touch (N8): fixed per CHANGELOG and suite**; not re-driven here.

## Per-area notes
**Foundations 9.** The upgrade path is real: `upgrade.mjs` dry run on app-1.0 changed nothing on disk, found the three motion renames in `app.js`, two repo URL moves, the `outlined` and lean-bundle judgment items with line numbers, and flagged the app's issue-70 workaround as possibly obsolete. `check:api` ("1545 public names of 1.1.0 all present or migrated"). Held at 9 by N1 (the font is fetched twice on 21 pages, so the budgets do not measure what a page loads), N9 (zero headroom) and N8 (drift).
**Behaviour 9.5.** Range selection works exactly as 0078 says: click NHM-00001, Shift+click 00004 (4 rows), Ctrl+click 00006 (5), Ctrl+Shift+click 00008 (7: 00006 to 00008 added), Shift+Down (8), Ctrl+A "5,000 Selected", Escape clears and the bar goes; a filter for "Corvus" keeps three selected and says "3 Selected, 2 Not Shown". Showcase Back from #settings shows #board, Forward shows #settings, focus on the view section. No page errors anywhere.
**Accessibility 9.** Focus never fell to `<body>` in anything I tried; the phone dialog takes focus on the dialog and Escape returns it to "Delete All Notes". Off 10: the focused grid row's ring is covered by pinned cells (N4); apps have no skip link or F6 (N6). Screen readers untested.
**App Components 9.** The selection model, number cells, Undo order and the glow are solid. Off 10: Linnea at 1280 hides Drawer and Status with no cue (N5); the selection bar is a small icon-only pill over the title at 1600 (N10); Parley at 390 shows a selected row with no detail open (N11).
**Visual Hierarchy 9.** Parley, Relay and the Showcase are calmer. Off 10: the Ink Track's accent ink is a second (to fourth) accent selection on many screens and nothing counts it (N2); Parley's accent text (N7).
**Desktop Apps 9.** In a stubbed Windows shell (`data-shell="electron" data-platform="windows"`, controls unhidden) the controls are 46 x 40 cells at x 1142, 1188, 1234 with 0px to the end edge; Close hover is a red layer inset 4 with corners "8px 4px 8px 8px"; RTL mirrors them to x 0, 46, 92; `data-window-state="maximized"` turns Maximize into "Restore" with `window-restore`. F10 reaches the menu bar; `S4.commands` lists `file.open:mod+o`, `file.save:mod+s` and more. Off 10: no F6 region cycling (N6), shells unproven [device-only].
**Websites 9.** Landing at 390 and 1600 is credible and calm (one filled hero action; the header's Pre-Order is the allowed site-header action). Off 10: N1, the real transfer is 226 to 232 KB on landing, docs, site and the hub against a 150 KB budget.
**Per-App Customization 9.5.** Bad `corners`, `gray`, `energy`, `scale`, `mode`, `headings`, `page` values warn and are not written. A yellow seed gives primary `#5f5f00` with on-primary `#fbfb0e`; firm + large renders cleanly. Off 10: N3, several inputs fail silently.

## New findings
**N1 [high: Websites, Foundations] The font is downloaded twice on 21 pages.** Each page preloads `../components/assets/inter-site.woff2?v=ccb9f71` (sites) or `inter-variable.woff2?v=2edaa7b` (apps), while the bundles' `@font-face` says `url("assets/inter-site.woff2")` with no `?v=`. Two URLs, two downloads. Measured in Chromium (sizes gzip-equivalent): landing 231.8 KB (`inter-site.woff2` 67.4 twice), docs 226.0, site 228.1, hub 226.9, dashboard 560.1 (`inter-variable.woff2` 161.3 twice). `check:bundle` says "site bundle ... = 150.0 KB" because it counts files, not requests. The preload predates review 4 (e1ea1cd); review 4 missed it too. Fix: stamp the `@font-face` url with the same content hash in `scripts/build.mjs` (or drop `?v=` from the preload); add a proof that loads each template, records requests and fails on the same file fetched twice and on a total above the budget.

**N2 [medium: Visual Hierarchy] The Ink Track breaks "one accent selection" and nothing counts it.** 0070: "One accent selection, and it is the navigation's ... Other selections are neutral." The connected button group's selected segment is a full accent fill: Larkline Settings at 1280 shows four dark-brown fills (Auto, Field Notebook, Clean, Standard); the Showcase Settings four (System, Standard, Firm, Pure); Tally shows mint Overview + green Month + filled New Invoice; Mallet cyan Layers + teal Base + filled Download; Proof (Country), Spool (Yearly). The page checker reports 0 warnings on all of them. Fix: record a decision: either the Ink Track's ink is neutral (`inverse-surface` or `secondary-container`) when it is not the screen's one accent job, or 0070 names it as exempt; then make `loud-screen` count it with a known-bad fixture.

**N3 [medium: Per-App Customization] `S4.theme` drops several inputs without a word.** `S4.theme({density:'tight'})`, `({density:'roomy'})` (a listed value), `({seed:'notacolor'})`, `({seed:'#zzz'})`, `({accent:'#12'})`, `({surfaces:'glossy'})` and `({icons:'fontawesome'})` all return normally, write nothing and log nothing; a bad seed leaves primary at `#000000`. Density is in `S4.theme.dials` (`["comfortable","compact","auto","roomy"]`) and 0055 lists it among the dials "set by S4.theme", but `S4.theme` has no `density` key. Decision 0076 (6): "a dial's listed values are what `S4.theme` accepts". Fix: accept `density` (write `data-density`), validate `seed` as `#rrggbb` or an accent name and warn otherwise, warn on unknown `surfaces` and on unknown keys; add each to `tests/checker.mjs`.

**N4 [medium: Accessibility, App Components] A focused grid row's ring is hidden under the pinned cells.** On Linnea after Shift+Down, the focused row (NHM-00009) shows only a top and bottom line from the Taxon column to Status (x 520 to 1528); the pinned checkbox, expand and catalogue cells and the actions column paint over it, so it has no sides (`crop_focusring.png`). Fix: draw the row ring above sticky cells (a `::after` on the focused row's first and last cells, or an outline on each pinned cell with a higher z-index); add a check that the focused row's ring is visible on all four sides.

**N5 [medium: App Components] At 1280 Linnea hides two columns with no cue.** The table is 1453 wide in a 990 wrap; Drawer and Status are off to the side, Locality is cut mid-word ("Scolt Head Islar", "Foulden Comm"), the horizontal scrollbar sits at the bottom of the wrap below the fold, and there is no edge fade. Status is the one column a person scans. Fix: column priority (`data-priority` that hides Family and Drawer below a width, with the Columns menu showing them), and an inline-end scroll shadow whenever a wrap scrolls sideways.

**N6 [small-medium: Accessibility, Desktop Apps] Apps have no way past the chrome.** Linnea takes 15 Tab stops before the grid; Parley 17 before main. Sites have `.s4-skip-link`; app shells have none, and desktop apps have no F6 region cycling (only F10 for the menu bar). Fix: a skip link in the app shell ("Skip to Content", to main), and F6 / Shift+F6 cycling rail, main, inspector, status bar in `desktop.js`.

**N7 [small: Visual Hierarchy] Parley at 1600 is still red-heavy in text.** Besides Strings and Approve: the label of Next Untranslated, Copy Source, Previous, Next, 86%, 61% and two Use buttons are accent red, plus the red meter and salmon tags. 0070 does not count accent text, but the window still reads red. Fix: text buttons in a toolbar row and translation-memory scores in `on-surface-variant`; keep accent text for one thing per region.

**N8 [small: Foundations] Drift.** The components gallery still describes Button as "Filled, tonal, outlined, elevated and text", Card as "Elevated, filled or outlined" and Text Field as "Filled and outlined fields" (0023: nothing is outlined); `components/button/README.md` says "**outlined** and **text** for the rest". The CHANGELOG 1.2.0 intro says "Rounds 0059, 0060, 0061 and 0062 (decisions 0067 to 0073)" but the entry runs to 0080; NEXT.md opens with "the current stage (round 0060)"; `migrations/1.2.0.json`'s summary stops at 0075 (no 0076, 0078, 0080). Fix: correct the copy; let `check:words` flag "outlined" in descriptive text outside decisions, history and migrations.

**N9 [small: Foundations, Websites] No headroom in the budgets.** "site bundle ... = 150.0 KB (budgets 44/30/70/12/150)", core js 39.5 of 40, lean pages "82 to 169 KB (budget 170)". The next component breaks the build. Fix: win back 5 to 10% (a tighter Latin subset, a smaller icon subset per app, moving rarely used core parts to packs) before adding anything.

**N10 [small: App Components, Desktop Apps] The selection bar is a small pill over the title.** With 8 rows selected at 1600 it is a 245-wide mint pill at the top-left (x 244, y 8) that replaces the Linnea title, with three unlabeled icons (archive, export, delete) in a 1340-wide bar (`table_range.png`). Fix: labels beside the icons from 840 wide, and the bar aligned with the table's toolbar.

**N11 [small: App Components] Parley at 390 shows a selected row with no detail open.** The first line has the neutral selected fill in the single-pane phone layout. Fix: no resting selection when the list is the only pane.

**N12 [small: Foundations] The upgrade report is noisy.** For a three-file app it lists 26 review items, 21 of them "Nothing in the app matched the search; check the screens anyway." Fix: put matched items first and fold the unmatched ones into one short list.

**N13 [device-only]** iPhone (dialog swipe, modal drag and scrim, docked hairline, glass at 90 to 96%, Safari subset font, the new glow on a tooltip and snackbar), WebKit and Firefox runs, VoiceOver and NVDA on the grid, dialogs and the selection announcements, a real Electron or Tauri shell on Windows.

## Top 10 for the next round (ordered by impact on reaching 10)
1. **N1 one font download.** Stamp the `@font-face` url like the preload; prove it with a request log per template that fails on a duplicate file and on a total over budget.
2. **N2 the Ink Track and one accent job.** Decide neutral ink or an exemption, apply it to Settings, Tally, Mallet, Proof, Spool and the Showcase, and make the checker count it.
3. **N3 `S4.theme` never fails silently.** Accept `density`, validate `seed` and `surfaces`, warn on unknown keys, with fixtures.
4. **N5 data tables at common widths.** Column priority plus a sideways-scroll cue; Status stays on screen at 1280.
5. **N4 a full focus ring on grid rows** above pinned cells, with a check.
6. **N6 bypass blocks.** A skip link in the app shell, F6 region cycling in desktop apps.
7. **QA pass 3 where this environment cannot reach:** WebKit and Firefox in CI for the page checker and back tests, then the owner's iPhone and a screen reader on the grid and dialogs (N13).
8. **N9 budget headroom** of 5 to 10% on the site bundle, core js and lean pages; also an app-sized icon subset (icons.js is 103 KB gzip on every app).
9. **Polish on Parley and selection:** N7 accent text, N10 the selection bar, N11 no resting selection on a phone.
10. **N8 and N12, then release 1.2.0:** fix the drift, quiet the upgrade report, date the CHANGELOG and `migrations/1.2.0.json`, `node scripts/release.mjs`, build, re-package the skill.

## Honest ceiling
I would ship all eight areas today. Behaviour and Customization are one small round from a 10 here (N3, and the device pass for behaviour). Websites and Foundations need N1 fixed and proven on real requests, since a budget that does not match the network is the one claim I found untrue. Hierarchy needs a decision on N2. None of the areas should be called a 10 before the device and screen-reader pass (N13), which this environment cannot do and which is not counted in the scores.
