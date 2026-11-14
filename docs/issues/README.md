# Open issues

The owner's critiques, waiting to be worked on. Each has a reference image in `img/`; open the image before starting the
issue. When an issue is done, move it to "Done" with the commit and decision number.

Goal across all of them (owner, 2026-11-14): **look good on both desktop and mobile** (check at 390 and 1280, light and
dark, and ask for an iPhone look).

**First step for all motion issues: a motion lab** ([`explore/motion-liquid.html`](../../explore/motion-liquid.html), answered 2026-11-14, see [0042](../decisions/0042-liquid-ink-motion.md); round 2: [`explore/motion-liquid-2.html`](../../explore/motion-liquid-2.html) for row hover, radio, menu and speed) (owner, 2026-11-14) to confirm that what's built matches what the
owner means by "liquid but subtle", before any motion issue is built. Show each candidate (liquid row hover 7, bending
chevron 11, liquid radio 19, snackbar 28, tooltip 29, menu 31, progress 26/27, skeleton 25) with the scrubber, plus
today's motion for comparison, and ask if the owner needs to explain it differently.

**Motion direction (owner, 2026-11-14):** the general animation theme should be **super subtle but liquidy**, with small
interesting moments (a shape that flows, an icon that bends into the next one) instead of plain fades and spins. Quick
enough to never be in the way, but never looking instant. This amends 0022 (simpler motion): keep its sturdiness rules
(transform and opacity, one transition per element, nothing cloned) unless the owner agrees otherwise; record as a new
decision and show options in a motion lab with the scrubber before building.

## Open (2026-11-14)

Issues 1 to 6, 8 to 10, 12 to 18, 20 to 23 and 32 to 35 were built in the overhaul (decision 0043) and were accepted by the owner (0044). Issues 38 to 41 were built on 2026-11-14 (decisions 0046 to 0048, see Done); they wait for the owner's look. Open: idea A, and the owner's picks from idea list B ([quiz](../../explore/ideas.html)).

### 24. ~~Banner on glass~~ (scrapped)
Scrapped by the owner (2026-11-14): they meant snackbars, not banners. Banners stay solid content. See issue 28.

### A. Whatever you touch turns into glass
Owner's "crazy side idea" (2026-11-14), to spend real time on: anything you touch or that is active becomes glass. A
selected chip turns into glass (keeping its selected color, just on a different surface), a focused text field turns
into glass, with an animation between the two. Maybe glass has several states (resting, touched, selected) and this is
a middle phase between solid and full glass. Questions to explore: does it keep text contrast (extend check-glass to
tinted states)? Does it read on a solid content surface with nothing interesting behind it? Is it consistent with
"content is solid" (0004)? Try it in a lab on chips, fields, list rows and buttons before deciding anything.
![Chips](img/2026-11-14-chips-expanding-check.png)

### B. Ideas for "works for any app, intuitive and fun" (proposed 2026-11-14, owner to pick)
Published as one quiz in the new Orion quiz UI: [`explore/ideas.html`](../../explore/ideas.html). Build what the owner picks.
- **Command palette** (search everything and run any action, opened with mod+K): the desktop counterpart of the nav bar.
- **Resizable and collapsible panes** for list-detail and desktop apps, with remembered widths.
- **States as first-class patterns:** every list, table and pane has a designed empty, loading, error and offline state.
- **Forms:** validation timing (on blur, never while typing), inline success, autosave with a quiet "Saved" mark, undo instead of "Are you sure?".
- **Small rewards:** a check that draws itself on success, numbers that count to their value, a row that settles after a drag. Each uses an existing motion pattern, so "fun" never breaks consistency.
- **Direct manipulation:** drag to reorder, swipe actions on rows (phone), multi-select with a contextual toolbar that replaces the top bar.
- **Charts:** a small set of chart styles on the tokens (the system has stats but no charts).
- **Reach:** RTL, long-text and large-font checks; print styles for articles and tables.
- **App-type templates still missing:** editor or document app, calendar, kanban board, media gallery, checkout or multi-step form, onboarding.

## Done

- **43.** Reply focused its field and the keyboard came up ([image](img/2026-11-14-reply-focuses-field.jpg)); "I never want this to happen anywhere": done 2026-11-14 (nothing focuses a field by itself, decision 0049; the suite checks it).
- **44.** "We never switch pages" (a message should open a reader view): done 2026-11-14 (pages with Back, title, URL and the Back gesture, decision 0050).
- **40.** One motion philosophy (owner, 2026-11-14: audit every transition, one page, a small fixed set of named patterns, a check): done 2026-11-14 (ten patterns, pattern tokens, every component moved, `npm run check:motion`, [motion page](../../components/motion/motion.html) with the scrubber, decision 0046).
- **38.** Expand in place instead of dialogs ([image](img/2026-11-14-reply-opens-dialog.png): Reply opened a "New Message" dialog away from the message): done 2026-11-14 (the placement ladder, `.s4-expand` and the inline confirm, Reply and Forward open a composer under the message in both mail templates, New Note opens in place in the showcase, decision 0047). The handoff named two reference images; only this one was saved.
- **39.** Orion on every GitHub Pages page, quizzes included: done 2026-11-14 (the review lab kit is built on the live bundle, reversing "review blue", decision 0048).
- **41.** Production pass (polished, zero bugs, ready for production): suite built 2026-11-14 (`tests/suite.mjs`: every component page, template and the showcase in Chromium and WebKit, in CI). Found and fixed: focus rings cut off in the accordion, in scrolling chip rows and in the desktop title bar; Escape on an expand's opener; a `data-expand` clash with the rail; three reference pages missing the motion script; the page going 14px too wide for a moment whenever views switched. CI passes in both browsers (265 page runs) as of 5a473dc. Not covered by a machine: how it looks on a real iPhone and a real desktop window (the owner's look).
- **42.** Search bar's focus ring cut off at the top (owner's screenshot, 2026-11-14, not saved: it arrived without a file): done 2026-11-14 (the ring is drawn inside the bar's edge). Issue 41's test pass should look for other rings clipped by a bar or a scrolling edge.
- **36.** List dividers overhang the rounded hover box ([image](img/2026-11-14-list-dividers-hover.png)): done 2026-11-14 (dividers sit between rows, inset, and fade beside an active row, decision 0045).
- **37.** Checkbox flashes a square when unchecked: done 2026-11-14 (the mark keeps its mask, decision 0045).
- **7.** Liquid hover between list rows: done 2026-11-14 (Edges Lean, decision 0044).
- **1.** Rail collapse animation glitches: done 2026-11-14 (rail is rows; only its edge moves, decision 0043).
- **2.** Duotone icons turn completely white when selected: done 2026-11-14 (selected icons keep both tones, decision 0043).
- **3.** Rail items on desktop: label beside the icon, hamburger menu button: done 2026-11-14 (rows with the label beside the icon, hamburger, solid main action, decision 0043).
- **4.** Solid controls on glass look out of place: done 2026-11-14 (items on glass are tints, proven by check-glass, decision 0043).
- **5.** Duotone icon tones are too close together: done 2026-11-14 (faded tone 0.42 / 0.38, decision 0043).
- **6.** Selected list rows touch the side edges but not the top: done 2026-11-14 (lists inset on every side, decision 0043).
- **8.** Switch hover looks bad; no hover halo: done 2026-11-14 (no halo; the handle grows a little, decision 0043).
- **9.** No glass on tables: done 2026-11-14 (flat rows, solid header, thin scrollbar, decision 0043).
- **10.** Table row hover looks bad: done 2026-11-14 (flat band, no checkbox halo, decision 0043).
- **12.** Composer send button height looks bugged: done 2026-11-14 (the composer is one pill, decision 0043).
- **13.** Press-to-square only where it fits: done 2026-11-14 (buttons stay round inside rounded containers, decision 0043).
- **14.** Selects must open the glass menu: done 2026-11-14 (the reference page loads the menu script, decision 0043).
- **15.** A real date picker: done 2026-11-14 (glass calendar with range, keyboard and a phone panel, decision 0043).
- **16.** Error fields: the red is too intense: done 2026-11-14 (normal fill; label, message and ring carry the error, decision 0043).
- **17.** Selected chips must not change size: done 2026-11-14 (chips keep one size; options in the Overhaul Review, decision 0043).
- **18.** Checkbox marks are too big: done 2026-11-14 (thin small marks, decision 0043).
- **20.** Slider must reach both ends: done 2026-11-14 (the handle travels the whole track, decision 0043).
- **21.** No stop dot peeking out under the handle: done 2026-11-14 (dots near the handle and at the ends are hidden, decision 0043).
- **22.** Color: normal, contrast-safe colors; accents stay accents: done 2026-11-14 (neutral surfaces, accent only on accents; options in the Overhaul Review, decision 0043).
- **23.** Badges look washed out in dark mode: done 2026-11-14 (one red badge in both modes, decision 0043).
- **32.** Don't autofocus fields in dialogs and sheets: done 2026-11-14 (the dialog takes focus, never a field, decision 0043).
- **33.** Field focus ring on glass feels off: done 2026-11-14 (hover fill stays during focus; fields on glass are tints, decision 0043).
- **34.** Replace bottom and side sheets with floating glass panels: done 2026-11-14 (floating glass panels, decision 0043).
- **35.** Side sheet: no edge glow down the side: done 2026-11-14 (panels float clear of every edge, decision 0043).
- **11.** Accordion: too fast, chevron should bend, not spin: done 2026-11-14 (accordion reveal + bending chevron, decision 0042).
- **19.** Radio: liquid selection, no inner dot: done 2026-11-14 (ink fill, no dot (window idea dropped by the owner), decision 0042).
- **25.** Skeleton: glitchy, and a wave instead of a blink: done 2026-11-14 (one sheen wave, decision 0042).
- **26.** Circular progress: 100% is a full circle; a more creative indeterminate: done 2026-11-14 (full ring, breathing arc, decision 0042).
- **27.** Linear progress: full at 100%, creative indeterminate, a realistic download demo: done 2026-11-14 (full bar, drop-like line, download demo on the progress page, decision 0042).
- **28.** Snackbars on glass, with a liquid arrival: done 2026-11-14 (glass, rises 14px, decision 0042).
- **29.** Tooltips: a bit faster and a better entrance: done 2026-11-14 (glass, rises 4px, appears after 350ms, decision 0042).
- **30.** Rich tooltips: rounder, with room around the action: done 2026-11-14 (extra-large corners, room around actions, decision 0042).
- **31.** Menus in the new motion style: done 2026-11-14 (items follow, decision 0042).
