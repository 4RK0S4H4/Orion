# 0070: One accent job per screen, a balanced Showcase, and what a brand trial taught the skill (2026-11-22)

**Status:** built in round 0060, workstream B. Our calls, made under the owner's hand-over of 2026-11-21. The owner can
overrule any of it. Notes: [`history/round-0060/b.md`](../history/round-0060/b.md). Source: review 4, N1 and N6, and the
Visual Hierarchy note on the Showcase at 1600.

Refines: **0068** (one accent fill per job *in a region* becomes one per job *on the screen*), **0066** ("one filled
selection per screen", now spelled out), **0061/0068** (filter chips: none pressed at rest). Keeps **0059** (the nav
indicator is `secondary-container`). No motion pattern was added (0046). No check was weakened; the page checker gained
a warning.

## 1. The rule
Review 4 found Parley obeying 0068 in every region and still loud: four saturated reds at once (the rail's Next
Untranslated, the Strings indicator, the selected line, Approve). A person reads the window, not the regions. So at rest
a screen shows:
- **One filled action**: the one the person takes next on the work in front of them (Approve the open line, Reply to the
  open ticket). Every other action is `elevated`, `tonal` or `text`. A second place for the same action (the calendar's
  Book beside the rail's Book a Boat) is `elevated`.
- **One accent selection, and it is the navigation's** (rail or nav bar current place, 0059 unchanged). Other
  selections are neutral: `surface-container-highest`, `on-surface`, the heavier label.
- **No pressed chip.** A filter set that narrows a collection has no "All" chip.
- Not counted: accent as text, icons, meters, chart marks, sent messages; values in a field (tag chips); a site header's
  action (the hero's action kept in reach as the page scrolls).

## 2. What does it by itself
- **Rail** (`nav-rail.css`): while the open view or page shows a filled button (not in a hidden part, a dialog, a menu
  or a button group), the rail's `.s4-fab` takes the elevated look (neutral fill, accent label and icon); on a view
  with none it is filled again. `data-variant="elevated"` pins it. Parley, Relay, the Showcase's Controls view and the
  brand trial's Today and medicine page now step down; Calendar, Linnea, Scripts and the Showcase Home keep theirs.
- **List** (`list.css`): the open row of a list beside its detail (`data-split-open` + `aria-selected`/`aria-current`)
  is neutral with the heavier headline: the detail's heading names it.
- **Chips** (`chip.js`): `.s4-chip-set[data-select="single"][data-clearable]`: at most one pressed, pressing the pressed
  chip clears it, none pressed is everything.
- **Charts** (`chart.js`): columns are 16 wide at most (were 24): "marks are thin", and a wide pane spaces them rather
  than fattening them. This was most of the Showcase's black weight in monochrome.
- **Page checker** (`check.mjs`): warns when the first screen at rest shows more than one filled accent action (buttons
  and FABs drawn in their scope's primary, pressed chips), with a known-loud fixture in `tests/checker.mjs`. A warning,
  not an error: an app can have a reason, and one template (Linnea's All Records view chip) is workstream A's to fix.

## 3. Applied
- **Parley**: the rail's Next Untranslated steps down, the selected line is neutral; Strings and Approve are the screen's
  two accent jobs (the tag chips and the character meter stay: values and a reading).
- **Relay**: New Ticket steps down beside Reply; the open ticket's row is neutral.
- **Moorings (calendar)**: the day pane's Book is `elevated`; the picked day is neutral (the day pane names it), today's
  number keeps its accent mark.
- **Stock (gallery)** and **Showcase Home**: no "All" chip (`data-clearable`); Show All Records clears the pressed chip.
- **Showcase Controls**: the With Icon specimen is tonal, so the specimen row has one filled button.

## 4. Showcase at 1600
Black New Note + black All chip + black fat columns read heavy, and the side column (Your Week, Storage, Folders) ran
past the fold and longer than the notes. Now: no All chip, 16-wide columns, and Storage is the foot of the Folders pane
("Stored In This Browser"), so the side column is two panes, ends above the fold at 1280 and 1600, and is shorter than
the main column. New Note stays the one filled action.

## 5. Brand trial
A small product built from the skill alone with a brand handed over (Dosewise, a family's medicine tracker: cobalt
`#2457c5`, `humanist` display, `soft` corners, `large` scale), in `examples/brand-trial/`. It passed the checker on the
first run; the first pass looked like Orion in blue. Drawing the product's own element (the day as a milestones road,
each medicine's tile on a category color) and leading with the hero made it read as a product. What the skill lacked or
misled is in the notes; `references/patterns.md` gained "One accent job per screen" and "Making it the app's own", and
lost six statements that contradicted later decisions (focus the first invalid field, error-filled fields, pill fields,
an error-colored danger pane, hand-drawn charts as the default, the checker seeing only the first view).

## Rules bullet (for CLAUDE.md)
- Decision 0070: one accent job per screen (refines 0068): at rest the window shows one filled action (the next act on the work in front of you; the rail's action steps down to elevated by itself while the open view shows a filled button) and one accent selection, the navigation's (the open row beside its detail and the picked day beside its pane are neutral; `data-split-open` rows do it by themselves); no pressed chip at rest (no "All" chip: `data-select="single" data-clearable`); chart columns at most 16 wide; the page checker warns on a second filled action on the first screen.

## SKILL.md lines for A to paste
- Websites, "Selection" bullet: replace with "One accent job per screen (decision 0070): one filled action and one accent selection (the navigation's) at rest; other selections neutral, other actions `elevated`, `tonal` or `text`; no pressed chip at rest. A site header's action does not count (it is the hero's, kept in reach)."
- Page shape, rail bullet: "Its `.s4-fab` is the app's main action as a solid button; while the open view shows a filled button of its own it steps down to elevated by itself (0070)."
- Actions: after "One **filled** button per area": "and one per screen at rest (0070): the next act on the work in front of the person."
- Worked example: drop the pressed "All" chip; write `<div class="s4-chip-set" data-select="single" data-clearable aria-label="Filter bills">` with Due and Overdue only, and replace `.s4-page-header` there with the app's own head class (as every template does) or keep it (it exists, `patterns.md` documents it).
- Charts bullet under "Showing data" ("draw them in the app (SVG or divs)"): replace with "Charts: `.s4-chart` (one series the accent, several `--s4-chart-1…6`, a table view always); draw by hand only a shape it lacks." It currently contradicts the behaviours section.
- Type and writing: "`humanist`, `rounded` and `geometric` are system stacks: on Android and Linux they often fall back to plain sans. A brand whose face matters ships one file in a `custom` stack."
- Check before handing over: "It also warns on more than one filled action on the first screen (0070)."
