# Orion Full QA pass, commit 77d3c86 (read-only, Chromium 153 via Playwright)

Scratch dir: /tmp/claude-0/-home-user-s4-orion/41fbd5a5-7433-59f0-9952-e0cead264e41/scratchpad/qa1 (shots in /tmp/claude-0/-home-user-s4-orion/41fbd5a5-7433-59f0-9952-e0cead264e41/scratchpad/qa1/shots, scripts sweep.js, fuzz.js, mm.mjs, tab.js, t*.js).
Overall: the build is in good shape. Across ~100 pages (80 component pages, 22 templates, demo, hub, examples) I found no console errors, failed requests, broken images, page-level horizontal scroll at 390/1280, or mid-motion word breaks at 1600, 390 RTL, and only the cases below at 320. Findings, most severe first.

1. [major] Combobox: Escape does not close the list when focus is on the "Show Options" toggle
   - Page: components/combobox/combobox.html (any width, mouse or touch).
   - Steps: click or tap the chevron toggle button next to a combobox, list opens, focus stays on the toggle. Press Escape (twice too).
   - Expected: list closes, focus stays on the toggle (listbox pattern, and Orion's "Escape puts it away"). Actual: list stays open; only an outside click closes it. Probably the Escape handler lives on the input only.
   - Evidence: /tmp/claude-0/-home-user-s4-orion/41fbd5a5-7433-59f0-9952-e0cead264e41/scratchpad/qa1/cb1.png (open), /tmp/claude-0/-home-user-s4-orion/41fbd5a5-7433-59f0-9952-e0cead264e41/scratchpad/qa1/cb2.png (after Escape, still open); fuzz_1280.json / fuzz_390t.json ("stuck open after Escape").
   - Rule idea: suite test "every popup/listbox opened by a button closes on Escape with focus on that button", run over every [aria-expanded]/[aria-haspopup] opener on every page.

2. [major] Share / Copy Recipe: unhandled promise rejection and a false success message when the clipboard write is refused
   - Pages: templates/article.html (Share icon button, line 264) and templates/tool.html (Copy Recipe, line 195).
   - Steps: click Share / Copy Recipe in a context where clipboard write is denied (headless Chromium without permission, insecure origin, iframe, Safari without gesture).
   - Expected: failure handled (catch), snackbar says it could not copy or offers a fallback (decision 0065: no silent failures). Actual: `pageerror: Failed to execute 'writeText' on 'Clipboard': Write permission denied` (uncaught rejection) and the snackbar "Link copied" still appears. templates/data-table.html and desktop-app.html use `.catch(function(){})` (still say "copied"), components/code/code.js does it right (done(false)). Three different behaviours for one job.
   - Evidence: fuzz_390t.json, fuzz_1280.json. No screenshot (console error).
   - Rule idea: checker lint: any `clipboard.writeText(` call must be inside `S4.util.copy()` (one helper that returns a promise, shows the failure message); fixture with a bare writeText fails. Suite: run fuzz with clipboard permission denied and fail on pageerror.

3. [major] Filter panel at 320 wide: "Conservation" breaks mid-word at rest ("Conservatio / n")
   - Page: components/filter/filter.html, viewport 320x700, tap "All Filters".
   - Expected: label fits or wraps at a word boundary; Actual: headline column is only ~96px because the checkbox rows have a large leading gap (leading control sits ~70px in from the panel edge), so a 12-letter word is split. The same page is flagged by midmotion.mjs at 320 (panel opening 25/50/75%) so it is not a transient.
   - Screenshot: /tmp/claude-0/-home-user-s4-orion/41fbd5a5-7433-59f0-9952-e0cead264e41/scratchpad/qa1/fl_open.png.
   - Rule idea: run the page checker (words split across lines) also at 320 and with each modal panel/menu opened, not only 390 and the mid-motion frames of the first panel. Also review why the row inset is so wide at 320.

4. [minor] Article template at 200% text on a 320 phone: page scrolls sideways (144px), headline and breadcrumbs clipped
   - Page: templates/article.html, 320x700, html font-size 200%.
   - Expected: no horizontal page scroll (decision 0058: text size covered). Actual: breadcrumb nav is 16..464px wide (does not wrap or scroll inside itself), the H1 "Six Minutes in Luxor" and the standfirst run past the right edge.
   - Screenshot: /tmp/claude-0/-home-user-s4-orion/41fbd5a5-7433-59f0-9952-e0cead264e41/scratchpad/qa1/a1.png (full: /tmp/claude-0/-home-user-s4-orion/41fbd5a5-7433-59f0-9952-e0cead264e41/scratchpad/qa1/shots/z200m320__templates_article.html.png).
   - Rule idea: reach test pass at 320 + 200% for every template, failing scrollWidth > clientWidth (today reach.mjs seems to run a wider case).

5. [minor] Ink Track pill is not re-measured when dir flips at runtime (LTR to RTL)
   - Pages: components/button-group/button-group.html, components/motion/motion.html (any connected group).
   - Steps: load page, run `document.documentElement.dir='rtl'`. Expected: pill sits under the selected option (as it does when dir is set before load: /tmp/claude-0/-home-user-s4-orion/41fbd5a5-7433-59f0-9952-e0cead264e41/scratchpad/qa1/bg_rtl2.png). Actual: pill stays at its LTR offset, covering the wrong label and half of the next ("Dark" pill over "Light"), until the group is clicked. Page on motion.html also gains 338px of off-screen content to the left.
   - Screenshot: /tmp/claude-0/-home-user-s4-orion/41fbd5a5-7433-59f0-9952-e0cead264e41/scratchpad/qa1/bg_rtl.png (broken) vs /tmp/claude-0/-home-user-s4-orion/41fbd5a5-7433-59f0-9952-e0cead264e41/scratchpad/qa1/bg_rtl2.png (correct), /tmp/claude-0/-home-user-s4-orion/41fbd5a5-7433-59f0-9952-e0cead264e41/scratchpad/qa1/bg_rtl3.png (after click).
   - Cause guess: ink position cached in px/translateX at init, no re-measure on dir change (ResizeObserver does not fire). Matters for apps with a live language switch.
   - Rule idea: reach test flips dir after load and compares each selected option's rect with its ink rect (should overlap > 90%).

6. [minor] 200% text at 320: words split mid-word in several components
   - Seen (320 wide, 200%): nav-bar labels (Budget, Reports, Settings; components/nav-bar, themes), stat values (8.2K, 1.7K), checkbox labels (Northwind), number-field (Sourdough), table cells (Salmonidae, Kowalczyk...), toolbar, upload file names, filter catalogue numbers, settings (Recordings, Scandinavia), site template (Co-operative). Many are unbreakable single words in narrow columns; nav-bar labels and stat figures are the ones where a fix (smaller label, truncate, or scroll) is expected.
   - Screenshots: /tmp/claude-0/-home-user-s4-orion/41fbd5a5-7433-59f0-9952-e0cead264e41/scratchpad/qa1/shots/z200m320__components_nav-bar_nav-bar.html.png, ...z200m320__components_stat_stat.html.png. List: sweep2.json (midword).
   - Rule idea: same as 3, with 200% text at 320 and an allow-list of the five truncation places.

7. [minor] Long multi-word labels push the page wider than the viewport (320, injected 50-char phrases)
   - Pages: list, timeline, tree, search, sheet, upload, commands, desktop (nowrap trailing/meta spans: .s4-list-trailing, .s4-timeline-meta, .s4-tree-trailing), checkbox table, landing and blog buttons. Plausibly realistic for user-generated trailing text (status, amounts, tags).
   - Expected: trailing/meta text truncates or wraps inside the row. Actual: row grows, page gets 100-250px horizontal scroll.
   - Evidence: long.json (phrase/word modes), /tmp/claude-0/-home-user-s4-orion/41fbd5a5-7433-59f0-9952-e0cead264e41/scratchpad/qa1/long_landing.html.png. The headline columns of lists wrap/truncate correctly; only trailing slots do not.
   - Rule idea: inject-long-text pass in the suite (the harness longlbl.js) failing on documentElement.scrollWidth > clientWidth for text in trailing/meta slots.

8. [minor/nit] Pagination previous/next and month-day overflow their own box by 3-5px
   - components/pagination, templates/blog: .s4-page (prev/next, 40x40) has scrollWidth 44 vs clientWidth 40 (8px side padding + 24px icon + extra); month day buttons 32>27 at 200% text and 38>35 in forced-colors at 390. Visually not clipped in screenshots, but any border or ring drawn at the edge could clip; forced-colors outline may touch.
   - Evidence: sweep1.json, sweep2.json (textov).
   - Rule idea: lint "control content wider than its box (scrollWidth > clientWidth + 1) for any visible button/link without overflow:hidden".

## Checked, no bug found (selected)
- Tab order walk on demo, dashboard, settings, data-table, menu, dialog, tabs, kanban, checkout: no hidden or off-screen focus; focus never left on body inside the page (the body-at-end is the browser wrapping out of the page).
- Touch (isMobile, hasTouch): dialog opens with focus on the dialog, tap outside dismisses, focus returns to a button.
- Dial presets (firm corners + compact + editorial + tinted + warm + lively, green seed at 390; soft + large + cool, magenta seed at 1280) on demo and 18 templates/components: no overflow or contrast problem visible in sheets (/tmp/claude-0/-home-user-s4-orion/41fbd5a5-7433-59f0-9952-e0cead264e41/scratchpad/qa1/sheet_dial.png).
- 1600 and 1920 dashboard and desktop-app: fine (/tmp/claude-0/-home-user-s4-orion/41fbd5a5-7433-59f0-9952-e0cead264e41/scratchpad/qa1/sheet_1920.png).
- Mid-motion (midmotion.mjs) on every page at 1600 (clean), 390 RTL (clean), 320 (items 3 only; table menu 75% frame reported words breaking once but column width was unchanged at rest, not reproduced).
- Click/tap fuzz (up to 25 controls per page, 390 touch and 1280 mouse, Escape after each): only findings 1 and 2.

## Coverage
| Area | Exercised | Not covered |
|---|---|---|
| Pages | all 80 component pages, 22 templates, demo, hub, examples (static + fuzz) | examples/electron, installed-web-app PWA install, brand-trial interactions beyond load |
| Widths | 320, 390, 1280, 1600, 1920 (360 for RTL, 390/320 forms) | 360 and 430 only via RTL/load; 430 not run separately |
| Modes | dark and light, forced colors (390 static), reduced motion (not separately inspected beyond harness), RTL (360 static, 390 mid-motion), 200% text (320), touch emulation | Windows high contrast on real hardware, print |
| Dials | two combined presets (corners firm/soft, scale compact/large, headings editorial, tinted, gray warm/cool, energy lively, 2 seeds) on 20 pages | each dial singly, all seeds |
| Interaction | click/tap fuzz with Escape, Tab walk, dialog touch dismiss, combobox, table sort aria, clipboard actions | field typing/error-on-blur/clear, table resize/edit/undo, board moves, swipe/reorder keyboard alternatives, snackbar Undo, palette: not scripted by hand (only reached incidentally by the fuzz) |
| Browsers | Chromium 153 only | WebKit, Firefox (not installed here, not attempted), real iPhone/Android, screen readers (VoiceOver, NVDA, TalkBack) |
