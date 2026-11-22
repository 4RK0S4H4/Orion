# S4 Orion re-grade 3 (commit c089ade), independent reviewer

Method: local server, Playwright chromium; 23 pages x (390 dark, 1280 light, 1600 light) screenshotted and looked at (zero horizontal overflow, zero page errors on all 69); keyboard, dialog, dial and checker probes; `npm run check` passes (incl. check:words, check:bundle). Screenshots/scripts: /tmp/claude-0/-home-user-s4-orion/41fbd5a5-7433-59f0-9952-e0cead264e41/scratchpad/regrade3/ (e.g. demo_index_html-w.png, templates_data-table_html-w.png, dialog-390.png, danger-390.png, dial1.png).
Not checked: WebKit, Firefox, real devices (swipe/touch feel, iOS glass), screen readers, print, RTL, 200% text, the full `npm test`, Electron shells. The phone swipe was a synthetic CDP touch drag, not a finger.

| Area | R1 | R2 | Now |
|---|---|---|---|
| Foundations | 9 | 8.5 | 9 |
| Behaviour | 9 | 8 | 8.5 |
| Accessibility | 8 | 7.5 | 8.5 |
| App Components | 8 | 8.5 | 9 |
| Visual Hierarchy | 6 | 7.5 | 8.5 |
| Desktop Apps | 6 | 7.5 | 8.5 |
| Websites | 4 | 7.5 | 8.5 |
| Per-App Customization | 4 | 8 | 9 |

Nothing is a 10 yet; most of what is left is not visible in headless Chromium (device pass) or is polish.

## Review-2 blockers
- Back loses place / focus: **fixed** in the cases tried. editor 400 -> 328 and calendar -> 1047 (the opener's own position, not 0); Showcase Back returns focus to the "Open" button, not body. One residual: Showcase opener scrolled above the fold returned to 0 (the scroll at click time was 0), probably fine. No guarantee without a suite test I did not run.
- Board add in place: **fixed**. Enter on Add Story focuses the draft form (`FORM.s4-lane-draft`), next Tab is the field.
- Modal-panel grabber: **fixed** in CSS (sheet.css:14, :91, decision 0066); the following scrim and drag are device-only, not verified.
- Danger panes loud: **fixed**. Showcase Delete All Notes is a quiet pane with a tonal pink button; dialog is a bottom card, 16px inset, Cancel tonal + Delete tonal error; swipe down closed it (danger-390.png, dialog-390.png). Pink smudge at 90% tint: not visible in light mode here; real device still to confirm [device-only].
- Palette duplicate: **fixed** ("sett" gives one `Settings Ctrl+,`).
- Linnea Tab trap: **fixed**. Search -> 5 toolbar buttons -> Select All -> one body stop (the row). Header controls have 0 tab stops and are reached by ArrowUp then arrows (sort, column menu, grip, next column). Arrows, Home/End (row start/end), Ctrl+Home/End (first/last of 5,000 rows), PageDown, Enter opens the page all work (dt.js). Select All is the small dot now.
- Focus seams: mod+comma lands in the palette search (a field, but opened by a shortcut; see N3); menubar F10 -> File, Esc returns to the list row on first Escape: **fixed**.
- Silent failures: **partly**. Checker now fails unknown classes ("unknown class .s4-card-content ..." confirmed). I did not get a clean run proving mid-word-break or one-glyph-box detection on the old broken custom-gauge page.
- Linnea five identical mint buttons: **fixed** (one tonal Add Filter, rest text buttons).
- Firm corners stop at controls: **fixed** (dial1.png: cards and list rows go firm too).
- Showcase no longer shows every element: **partly**. Home is now a proper wide layout (search + chips + featured + list, side column with stats, chart, meter); Board, Controls, Forms, Settings views exist. I did not audit that every one of the 78 components appears.
- Doc drift: **fixed**: "slide from edge" gone, text-field outline comment gone, hub says 1.1.0 / 78 / 20 / 216 accents. **Not fixed**: no git tags, CHANGELOG 1.1.0 still "Unreleased".
- Bundle weight: **fixed for sites**: site bundle 43 KB css + 27 KB js gz, Inter subset 69 KB (was 165), icons 110 KB raw (37 gz); total 173 KB vs ~380. App bundle unchanged (64 KB css + 116 KB js gz, Inter 165 KB raw).
- Hub: **fixed** (hero, live dials preview, stats, nav; hub is now a front page).
- scale and headings dials: **fixed** (compact + editorial + firm + tinted rendered cleanly, dial1.png).
- Hierarchy items (Showcase 1600, Mallet three cyan fills, Tally/Relay at 1600, filled home-nav): **mostly fixed**. Mallet docs now one cyan nav fill, the TOC fill and keycap fills are the remaining cluster (templates_docs_html-w.png); Tally 1600 chart is still ~210px of bars with a tall empty right column below "Coming Up".
- Rule for filled status tones: **fixed** (statuses are tints everywhere I looked: Linnea, Parley, Showcase). Parley's list column is still ~450px and wraps to 4 lines (templates_desktop-app_html-w.png) [decision, unchanged].
- SKILL.md Cancel text variant: grep found no `data-variant="text"` Cancel at the old lines; not re-read in full.

## Per-area findings
**Foundations 9.** Tokens, layers, check suite are the strongest part; check is fast and green, banned-phrase check added. Remaining: app bundle still 180 KB gz JS+CSS with no app-side split; a bad `data-scale="roomy"` is silently accepted and written to `<html>` (SKILL lists only compact/large) [small]; no release tag.
**Behaviour 8.5.** Back, focus, board, palette, dialogs behave. Docked/phone behaviours and drag are device-only. Screen-reader announcements of the grid (roving header controls, virtual rows) unverifiable here.
**Accessibility 8.5.** The grid now follows the ARIA grid pattern; focus never fell to body in my seams except Tab off the last grid row into browser chrome (expected). Header controls reachable only through grid keys: undiscoverable for a sighted keyboard user unless documented [small]. Contrast proven by check suite; VoiceOver not tested.
**App Components 9.** 78 components consistent across the templates; 20 products look like different products (Tally serif, Mallet mono, Sprig, Spool). Checker catches unknown classes. Leftover: mid-word/one-glyph failure detection unverified by me.
**Visual Hierarchy 8.5.** 1600 layouts are mostly fine now (Showcase, Linnea, Tally). Weak spots: Tally and Showcase leave an empty lower/right area at 1600; Parley list column wraps; Parley's loud red primary "Next Untranslated" plus red-tint selected row plus red-tint selected list item plus red Approve is one accent doing four jobs.
**Desktop Apps 8.5.** Menu bar, F10/Escape, tabs, tree, inspector, status bar, palette, Ctrl+, all work in Parley; Linnea grid strong. Shells (Electron) unproven [device-only]. Parley inspector close x is still a gray disc, ok.
**Websites 8.5.** Landing/docs/pricing are credible at 390 and 1280; 173 KB gz total is acceptable but still above a typical marketing page (icons 37 KB gz is the biggest file; no per-page subset). Firefox/WebKit subset-font rendering unverified.
**Per-App Customization 9.** Dials (accent, corners, scale, headings, surfaces tinted, gray, display) compose and render without console errors in 3 combos; scoped themes on regions. No dial for icon weight beyond set choice; invalid values not validated.

## Ranked Top 10 (new and remaining)
1. [device-only] Owner iPhone pass: dialog swipe + corner radius, modal-panel drag with following scrim (Safari 17.4+), docked hairline, Linnea/Parley at phone width, subset Inter in Safari; VoiceOver on dialog and grid.
2. [small] Validate dial values: `S4.theme({scale:'roomy'})` writes `data-scale="roomy"` silently (dial2). Warn in dev and in the page checker for unknown `data-*` dial values.
3. [small] Tag a release: CHANGELOG 1.1.0/1.0.0 "Unreleased", no tags; set the date and `git tag`.
4. [small] Document and surface the grid's header keys (ArrowUp from first row, arrows to sort/menu/grip): add a visible hint/aria-description on the table and a line in components/table README.
5. [small] mod+comma moves focus into the palette search field; fine for a palette (0049 exempts only the person's own action) but verify the rule text says shortcuts opening a palette are allowed, or move focus to the dialog.
6. [decision] Parley list column too narrow (~450px, four-line wraps): wider default or a resizable split starting wider.
7. [small] Accent clusters on one screen: Parley (red nav item, red list item, red Approve, red FAB-style primary), Mallet (docs TOC + keycap fills). One filled selection per region rule applied to nav + list.
8. [small] Wide-window emptiness: Tally 1600 right column empty under "Coming Up"; Showcase lower third empty. Add a second column row or cap the shell width.
9. [large] Site payload: per-page icon subset (110 KB raw icons file) and a size cap lower than 180 KB for landing; app bundle (64+116 KB gz) split so apps load only used components.
10. [small] Prove the checker's mid-word-break and one-glyph-box rules on a known-bad page (the old custom-gauge case) and add that page to the evals so the claim is regression tested; also confirm Back scroll restore by a suite test (editor/calendar).
