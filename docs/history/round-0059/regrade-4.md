# S4 Orion re-grade 4 (commit 032c225), independent reviewer

Method: local server, Playwright chromium; 15 pages x (390 dark, 1280 light, 1600 light) = 45 shots (index, demo, components gallery, 12 templates); zero horizontal overflow and zero page errors on all 45; I looked at demo, desktop-app (Parley), dashboard (Tally), data-table (Linnea), docs (Mallet), landing (Sprig, 390), kanban (1600) and a dial combo. Keyboard, dial and site-bundle probes below. `npm run check` passes (bundle: site 148.3 KB vs 150 budget); `npm run test:checker` and `npm run test:back` pass. Files in /tmp/claude-0/-home-user-s4-orion/41fbd5a5-7433-59f0-9952-e0cead264e41/scratchpad/regrade4/ (e.g. templates_desktop-app_html-x.png, templates_dashboard_html-x.png, grid_hint.png, dial_7a3cff.png).
Not checked: WebKit, Firefox, real devices (swipe, iOS glass, modal drag/scrim), screen readers, print, RTL, 200% text, full `npm test`, Electron shells. I did not re-drive the phone dialog by hand this round (relied on R3 evidence plus test:back).

| Area | R2 | R3 | R4 |
|---|---|---|---|
| Foundations | 8.5 | 9 | 9 |
| Behaviour | 8 | 8.5 | 9 |
| Accessibility | 7.5 | 8.5 | 8.5 |
| App Components | 8.5 | 9 | 9 |
| Visual Hierarchy | 7.5 | 8.5 | 8.5 |
| Desktop Apps | 7.5 | 8.5 | 8.5 |
| Websites | 7.5 | 8.5 | 9 |
| Per-App Customization | 8 | 9 | 9.5 |

Nothing is a 10: what remains is mostly device-only, plus a few real polish items. I am holding Accessibility and Hierarchy flat because the fixes were mostly small and I found new minor issues.

## Review-3 Top 10
1. Owner iPhone pass [device-only]: **not fixable here**, still open. Unverified.
2. Dial validation: **fixed.** `S4.theme({scale:'roomy',corners:'square',gray:'warm'})` warned for both ("S4: theme scale "roomy" ignored (not written); use default, compact or large."), wrote neither, still applied gray=warm; `S4.theme.audit()` returns []. `tests/checker.mjs` proves it for every dial (passes).
3. Release tags: **fixed.** `git tag` shows v1.0.0 and v1.1.0.
4. Grid header keys: **fixed.** Table has `aria-description`; with the keyboard on the header (ArrowUp from first row) `.s4-table-hint` goes to opacity 1 ("Up from the first row reaches the column headers: Left and Right choose sort, options or resize, Down comes back."); at rest it is 0 and its line is reserved. Hidden on coarse pointers and print.
5. mod+comma/palette focus rule: **fixed (rule text).** 0067 section 3 states the person's own shortcut may put the cursor in the palette; mod+K focused the search input here, and Escape returned focus to the opener ("New Note"). Escape with no prior focus lands on body (nothing opened it); minor, see N4.
6. Parley list column: **fixed.** 1600 shot: list is about half the strings view, lines read in 1-2 rows, status on the key row; 390 reads fine too.
7. Accent clusters: **partly.** Mallet docs is now clean (one cyan nav fill, one teal layer switch, neutral TOC and keys). Parley is per-region compliant (rail: filled action + Strings; list: selected line; detail: Approve; French and dialogue.json neutral), but the screen still shows a big red "Next Untranslated", a salmon nav fill, a salmon selected row, a red Approve and pink tag chips. Rule met, one-accent-job impression not. See N1.
8. Wide-window emptiness: **mostly fixed.** Tally 1600 now has Coming Up in the third column with totals, a third bottom row (Needs A Nudge, Owed By Age, Where It Sits); Showcase Home adds Shared With You and Folders. Kanban 1600 still has empty space under short columns, which is natural for a board.
9. Payload: **site half fixed, app half not.** Landing requests `inter-site.woff2`, `orion.site.min.css/js`, `icons-site.js` (37 icons, 10.9 KB gz) and nothing else; total 148.3 KB (budget cut to 150). App bundle (about 64 KB css + 116 KB js gz) is unsplit [large, unchanged].
10. Checker proofs and Back tests: **fixed.** Three known-bad fixtures fail with the expected messages; `test:back` passes (scroll restored 633 -> 633px, focus on opener, no field focus). I did not run the one-glyph rule on the old gauge page myself; the fixtures do.

## Per-area findings
**Foundations 9.** Check suite is fast and green, new fixture-based proof of the checker's own rules, release tags exist, dial lists are single-sourced in `S4.theme.dials`. Still: app bundle unsplit; CHANGELOG has 1.2.0 collecting round 0059 but no tag for it yet (expected).
**Behaviour 9.** Palette, Back (tested), board add-in-place, grid keys all behave; dial validation warns instead of silently writing. Touch drag, modal-panel scrim and swipe remain unverified [device-only].
**Accessibility 8.5.** Grid hint plus `aria-description` closes the discoverability gap for sighted keyboard users; focus never fell to body in cases tried except Escape from a palette opened with nothing focused. Hint is hidden to touch; the header keys are not reachable on a screen reader without the description being read (unverified). Contrast is suite-proven. VoiceOver/NVDA untested keeps this off 9.
**App Components 9.** The 20 products still look like different products (Tally serif, Mallet mono, Pressroom mono display, Sprig humanist); tints for status are consistent. Kanban, Linnea, Tally all clean. No new component defects found.
**Visual Hierarchy 8.5.** Better: Parley list reads, Tally fills its width, Showcase Home has a real shape. Weak: Parley's loud saturated "Next Untranslated" competes with Approve and two salmon fills; the Showcase 1600 still has a black filled "New Note" + black "All" chip + black chart bars in the monochrome seed (fine by 0068 since they are different regions, but heavy at a glance).
**Desktop Apps 8.5.** Menubar, tabs, tree, inspector, status bar all present and tidy at 1600; shells (Electron) unproven [device-only]. Parley at 390 is a clean list with bottom nav.
**Websites 9.** Landing at 390 is credible, hierarchy clear (one filled CTA, one tonal); site bundle trimmed to 148 KB with a working icons-site.js fallback design (a name outside the set fetches icons-solar.js once; I did not trigger it). Firefox/WebKit subset-font rendering unverified.
**Per-App Customization 9.5.** A tinted + firm + large + editorial seed (dial_7a3cff.png) and a compact warm/cool lively one both render cleanly with no errors; bad values warn and are not written, markup audit exists, checker fails them. A real 10 needs the device pass and some third-party-brand trial.

## New blockers, ranked
N1 [decision] Parley still shows four saturated reds at once at 1600 (templates_desktop-app_html-x.png: Next Untranslated, Strings fill, selected row, Approve). Consider making "Next Untranslated" `elevated`/tonal when a row is already selected, or a brand with a calmer chroma.
N2 [large] App bundle split so an app loads only the components it uses (unchanged from R3 #9).
N3 [device-only] iPhone pass: dialog swipe and radius, modal-panel drag + scrim, docked hairline, glass at 90-96%, Inter subset in Safari, VoiceOver on dialog and grid.
N4 [small] Escape from a palette opened with no prior focus leaves `document.activeElement` on BODY (demo, fresh load, Ctrl+K, Esc). Rule 0065 says no flow leaves focus on body: restore to the main landmark or skip link.
N5 [small] On data-table, programmatic Tab order from the page start is FAB, 3 nav items, Help, then chips: fine, but the toolbar's "Columns" button reported `closest('table')` true in my probe; confirm the toolbar is not inside the table element (possible ARIA table/grid semantics leak). Low confidence.
N6 [small] Showcase Home 1600 below-the-fold list/Folders end up taller than the main column; check the bottom edge at 1600x900 for lopsidedness (folders pane clipped in my viewport, not necessarily wrong).
N7 [small] 1.2.0 release: CHANGELOG section exists; tag and date when published.
N8 [small] Hint line for grid keys is hidden on touch; if a table is used with an external keyboard on iPad, the `aria-description` is the only cue.

## Honest ceiling
I would ship all eight areas to a good product team today (9 range). I would not call any a 10 until the device pass (N3) and a screen reader run on the grid and dialogs are done by a person; those are not testable from this environment and are not counted against the scores.
