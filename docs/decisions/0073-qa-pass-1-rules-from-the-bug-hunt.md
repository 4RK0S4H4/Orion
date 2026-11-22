# 0073: QA pass 1, rules from the bug hunt (2026-11-22)

**Status:** our call. Built in round 0062 from the first Full QA pass ([`docs/history/round-0062/qa-1.md`](../history/round-0062/qa-1.md), a fresh
agent that did not build the work, Chromium, about 100 pages) and one owner request that arrived during the round (issue 81).
Issues 73 to 81 in [`docs/issues/README.md`](../issues/README.md). Every finding is fixed where it comes from (a component, not a
page) and every new rule is only a rule once a known-bad page fails it (decision 0067): the fixtures are in `tests/fixtures`,
the proofs in `tests/checker.mjs`.

## What the pass found, and what changed

1. **Escape from any opener (issue 73).** The combobox closed on Escape only when the cursor was in its input; from the Show
   Options button (a tap or a click leaves focus there) nothing happened. The document handler now closes every open list
   unless the input has focus (the input handles its own), and leaves focus where it was. *Rule:* the suite finds every button
   on every page that has `aria-haspopup` or controls a popover, dialog, listbox, menu or expand, clicks it, and requires
   Escape to close what opened and focus to be on the button (`openerAudit`).
2. **One clipboard helper (issue 74).** Four pages wrote to the clipboard four ways; two threw an uncaught rejection when the
   browser refused and three said "copied" anyway. `S4.util.copy(text, { done, fail, silent })` returns a promise of true or
   false that never rejects and shows the snackbar ("Copied", or "Couldn't copy. Select the text and copy it yourself."); the
   code block, the article, the tool, the data table and the desktop app use it. No hidden field is selected to fake a copy: a
   script never puts the cursor in one (0049). *Rules:* `npm run check:clipboard` (part of `npm run check`) fails any
   `writeText` outside the helper; the page checker fails it in a page's own scripts; the suite runs every page with the
   clipboard refusing, fails on a script error, clicks every Copy and Share button and requires a message that says it could not,
   and `apiAudit` proves the helper's contract.
3. **Rows on a 320 screen (issue 75).** A list row spent a third of its width on gaps and insets, so a checkbox, a word and a
   count did not fit (the filter panel's "Conservation"). Under 360 wide a row's gaps are 12. *Rule:* see 4.
4. **A grid that grows (issue 76).** An article at 320 with larger text scrolled sideways by 144px: a one-column grid whose
   column is `auto` grows to its widest child (a row with fixed columns), carrying the breadcrumbs and the headline past the
   edge. Children of `.s4-stack` and `.s4-split-pane` are `min-inline-size: 0`; the apps' own grids name their column
   (`minmax(0, 1fr)`). *Rule:* the reach pass `reflowz` loads every page at 320 with text at 200% two ways (the browser's text size,
   `html { font-size: 200% }`, and every element's text doubled as `zoom` does) and fails on sideways scroll.
5. **Measured once (issue 77).** The Ink Track's pill, the tabs' indicator and the nav bar's highlight were measured at load
   and on resize; a `dir` flipped by a live language switch changes no size, so they stayed where they were. `S4.util.onLayoutChange(fn)`
   runs a script's measure again, once a frame, when `dir`, `lang` or a type, density or corner dial changes on `<html>` or
   anywhere below it. *Rule:* the reach pass `dirflip` flips `dir` after load and compares each ink, indicator and highlight with
   its selected option.
6. **Words at 200% text (issue 78).** At 320 with larger text, nav-bar labels, stat figures, table cells, upload names, site logos
   and several app layouts broke words in the middle. Labels wrap between words and an item is as wide as its longest word (the bar scrolls inside
   itself, never splits a name); a stat row has one column when a figure would be narrower than 8em; a stacked table cell moves its value under its label;
   a table keeps its longest word and scrolls in its wrap; the site header's actions wrap under the logo; toolbars with labels wrap to a
   second row (never a fixed height on what holds text, 0058). *Rule:* the same `reflowz` pass fails any word split across lines
   (the page checker's rule, `silentAudit`) and any control whose content sticks out of its box. **Allow-list:** only the five
   places decision 0058 lets truncate (the timeline label, top app bar title, title bar title, text field value, date value) are
   exempt; they stay on one line behind an ellipsis and never split.
7. **Trailing and meta slots (issue 79).** `.s4-list-trailing` and its kin were `nowrap` and unshrinkable, so 50 characters of status
   pushed the page 100 to 250px sideways. The slot wraps inside the row and, when the headline would get less than six ems, moves
   under it; amounts and counts (`.s4-list-amount`, `.s4-num`) stay on one line. Upload rows put their actions under the name before
   they squeeze it. These are not among the five truncation places, so nothing here truncates. *Rule:* the reach pass `long320`
   injects a 50-character phrase and an unbroken word into every trailing, meta, supporting, label and name slot at 320 and fails on
   sideways scroll.
8. **Controls whose content sticks out (issue 80).** Month days at larger text and in forced colors were reported, and the
   pagination arrows too: 44px of content in 40, which turned out to be the 48px touch-target pseudo-element, not content. The lint
   measures what a control really holds (its text runs and child boxes, not its `::after` hit area, not visually hidden labels, not
   decoration hung off the box) against its own box. *Rule:* `silentAudit` (the page checker and the suite) fails a button, link, tab, chip,
   FAB or day whose content is more than 1px past its box, unless it clips or scrolls on purpose.

## The owner's request (issue 81)

"When hovering over a nav bar tab I notice that only the icon gets a chip hover effect. I actually prefer if the hover effect was
basically the size of the selected tab that way it's consistent." The hover, focus and pressed layers lived on the 56 by 32
icon indicator, while the selected highlight is the box round icon and label (a rounded rectangle under 600, decision 0072's
round 0061 fix; the whole row from 600 and in the rail). Now an item draws its own state layer on exactly the highlight's box:
`nav-bar.js` writes each item's highlight insets, height and corner cap, `nav-bar.css` fills that box with a State fade (0046)
and nothing beyond it (no halo, 0043). A selected tab layers its state on the highlight. The rail's rows already filled the highlight's box and
now read the same variables. *Rule:* `silentAudit` computes the layer's box from its computed style (no pointer needed) and fails a layer
that is not the highlight's box within 1px, or an indicator chip that still draws one (fixtures `bad-nav-hover.html` and `bad-nav-hover-box.html`).

## Rules to remember

- A script puts text on the clipboard with `S4.util.copy`, never `clipboard.writeText`.
- A script that measures layout once re-measures through `S4.util.onLayoutChange`.
- A grid in an app names its column (`minmax(0, 1fr)`); children of a stack or pane may shrink.
- A word is never split to make a box fit (outside the five truncation places): wrap between words, move under, scroll inside a wrap, or scale.
- Trailing, meta and supporting text wraps; it never widens the page and is not one of the five truncation places.
- A tab's hover, focus and pressed layer is the selected highlight's box.

## Not covered (pass 2)

Field typing and error-on-blur, table resize, edit and Undo, board moves, swipe and reorder keyboard alternatives, snackbar Undo,
the palette, each dial alone, 360 and 430 wide, WebKit and Firefox, real devices and screen readers.
