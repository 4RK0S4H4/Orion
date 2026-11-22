# S4 Orion re-grade 2 (commit 8ca40e5, 2026-11-21), independent reviewer

Screenshots were taken in a session scratchpad (not kept). RG/ paths below refer to them.
Not checked: WebKit, Firefox, real devices, screen readers, print, RTL, 200% text, shells, full suites.

| Area | Before | Now |
|---|---|---|
| Foundations | 9 | 8.5 |
| Behaviour | 9 | 8 |
| Accessibility | 8 | 7.5 |
| App Components | 8 | 8.5 |
| Visual Hierarchy | 6 | 7.5 |
| Desktop Apps | 6 | 7.5 |
| Websites | 4 | 7.5 |
| Per-App Customization | 4 | 8 |

## Foundations 8.5
1. Bundle weight [large]: orion.min.css 496 KB (62 KB gz), orion.min.js 454 KB (113 KB gz); with icons (38 gz) + Inter (165) ~380 KB compressed per page.
2. Doc drift [small]: docs/foundations/README.md:10 "drop for menus, slide from edge"; foundations/glass.md "How it's built" snippet still has a side rim, lines 66-67 (and skill references/glass.md) describe outlined buttons/chips on glass; components/text-field/text-field.html:17 and text-field.css:11 comment say "thin outline ... focus turns the outline into a 2dp ink ring" (breaks 0023, contradicts issue 62); references/tokens.md:41 says outline role is for outlined buttons.
3. Hub stale [small]: index.html:32,34 "1.0 Release Candidate, 62 components, 14 app templates"; CHANGELOG 1.0.0 and 1.1.0 both Unreleased; no git tags.
4. Issues 61, 62, 64, 65 fixed but not marked Done [small].
5. Right-aligned numbers need bare `.num` (table.css:93); `.s4-num` only sets tabular figures [small].

## Behaviour 8
1. Back loses place [small]: page README:41 promises scroll restore; editor 517px -> 0, calendar 1047 -> 0 (bar Back and history.back); focus lands on body not the opened item. Likely page.js:86 restores scroll inside the view-switch callback before the view is tall again. No test.
2. Board add in place (Pressroom): Enter on Add Story puts focus on body; next Tab skips the draft field [small].
3. No grabber on modal panels; scrim doesn't follow the drag [decision: add grabber to modal panels only].
4. Danger panes louder than the calm dialog they open: Showcase Delete All Notes, Larkline Delete Account are red panes with a filled red trigger (RG/sheet-overlays-390.png, RG/templates_settings_html-390-dark.png).
5. At 90% tint the red trigger shows through the phone card as a pink smudge (RG/demo-dialog-390-light.png) [device-only].
6. Parley palette: "sett" lists both "Settings" and "Go To Settings" (RG/parley-palette.png) [small].

## Accessibility 7.5
1. Linnea table header Tab trap [large]: from search, 5 toolbar buttons, Select All, ~27 header stops (sort, options, resize grip per column) before first row; 0061 promises one Tab stop. In rows End sends focus to body, Home does nothing, Tab out lands on body. Collected/Specimens columns order header controls differently.
2. Focus to body after: Back from a page; board add in place; mod+comma opening Settings; menubar's second Escape (should return to where focus was before F10) [small].
3. Linnea Select All header is a big gray disc while row checkboxes are small dots [small].
4. Status emphasis doesn't follow meaning: Parley "Approved" loud accent fill vs "Needs Review" dark tint; Linnea "On Loan" near-black filled pill; Showcase "Shared" white filled vs "Recent" dark tint. Write a rule for which tones may be filled [small].

## App Components 8.5
1. Silent failures the page checker passes: a `.s4-table` without `.s4-table-wrap` never stacks on a phone (broken words "He alt hy", RG/custom-gauge-390-dark.png) though SKILL.md says tables stack; a `.s4-fab` directly in `.s4-nav-rail` (not `.s4-nav-rail-header`) renders as a 160px column of single letters (RG/custom-gauge-1280-light.png), SKILL.md:181 doesn't name the slot; unknown `.s4-card-content` passes. Fix: fail on unknown s4- classes, mid-word breaks / one-glyph-wide boxes, components outside their required container [small].
2. Linnea toolbar: five identical mint tonal buttons (two rows on phone) [small].
3. Firm corners stop at controls; panes keep large radii, reads half-applied [decision].
4. Showcase no longer shows every element: no pages, states, palette, meter, board, filter, charts, direct manipulation in demo/index.html [large].

## Visual Hierarchy 7.5
1. Showcase at 1280/1600 weakest screen: 1200px search field, rows 1200 wide with status 1100px from the name, empty lower half (RG/demo_index_html-1600-light.png).
2. Hub reads like a README: left text column, empty right half, file paths as subtitles (RG/index_html-1280-light.png).
3. Accent clusters of equal weight: Linnea toolbar; Mallet docs three cyan selection fills at once (RG/templates_docs_html-1600-light.png).
4. Tally at 1600 chart ~550px tall, period group floats mid-header; Relay at 1600 queue wraps titles to four lines beside empty panes.
5. Sprig "Sensor" and Hollis & Vane "Practice" nav items filled as current on the home page.

## Desktop Apps 7.5
1. Shells unproven [device-only].
2. Focus after mod+comma and menubar Escape [small].
3. Grid keyboard depth (A11y 1) [large].
4. Parley: inspector title "Line" above a section also "Line"; its close x is an accent disc that reads destructive; palette duplicate [small].
5. Parley list column ~330px wraps every line to 4-5 rows; wider or resizable start [decision].

## Websites 7.5
1. Page weight ~213 KB gz CSS/JS/icons + 165 KB Inter for a landing page (Tailwind/daisyUI 10-30 KB CSS). Needs a site-only bundle and subset Inter [large].
2. Hub undersells the system.
3. Scroll-spy fills on home nav.

## Per-App Customization 8
1. Silent FAB/table/unknown-class failures.
2. `.num` vs `.s4-num`.
3. Firm corners stop at controls.
4. A tinted rounded lively app came out as stock Material You: no dial for type scale, spacing rhythm or heading style (Tally/Tidewater did it in own CSS). Radix/daisyUI expose scaling; consider `scale` and `headings` dials.
5. SKILL.md:363 example gives Cancel data-variant="text" (0064 says tonal); SKILL.md:213 destructive confirms data-color="error" without tonal.

## Top 10
1. Back keeps place and returns focus (page.js:86) + suite check.
2. Page checker fails unknown s4- classes, mid-word breaks/one-glyph boxes, components outside required container.
3. Bare .s4-table stacks on phones; .s4-fab anywhere in the rail renders right.
4. Linnea grid keyboard: one Tab stop header+body; End/Home/Tab-out; same header control order; Select All size.
5. Focus seams: board add in place, mod+comma, menubar second Escape, palette duplicate.
6. Light site bundle (site-only CSS/JS, subset Inter).
7. Showcase home and hub for wide windows; counts; release tag.
8. Drift pass + banned-phrase check (list above) and issues marked Done.
9. Calm leftovers: quiet danger panes, one tonal button per toolbar, one filled selection per screen, a rule for filled status tones.
10. Owner device pass.
Close behind: grabber + scrim following the drag on modal panels; scale and headings dials; firm corners reach containers by one step; Showcase covers every element again.
