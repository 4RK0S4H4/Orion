# 0065: Your place and your focus are kept, silent failures fail, statuses are tints (2026-11-22)

**Status:** our call. The owner handed us the lead on 2026-11-21 ("I'll let you take the lead on this, and feel free to
change past rules as well and do anything you feel like it is for the best"). Built in round 0058, workstream A, from
an independent re-grade that listed what blocks a 10 in each area. The owner can overrule any of it.

Amends: **0050** (Back now also returns focus), **0061** (the header is its own Tab stop; Select All rests as a dot),
**0062** (mod+comma and the menu bar's second Escape land somewhere), **0063** (Select All no longer always full size),
the status component (accent tones are washes). Workstream B's decision 0066 runs beside this one.

## 1. Back keeps your place, focus never drops to `<body>`

| Flow | Before | Now |
|---|---|---|
| Back from a page (bar, browser, gesture) | the view came back scrolled to the top (the scroll was restored while the view was still hidden, so it clamped to 0); focus on `<body>` | the scroll is restored once the view shows again; focus returns to the item that opened the page (re-found by its `data-page-id` when the list was redrawn), or to the view |
| The board's Add (Pressroom) | the button hid itself and focus fell to `<body>`; Tab skipped the draft | the draft holds the focus (a named group, never the field: 0049); the next Tab reaches the field; Add and Cancel give the button back |
| `S4.app.go` (mod+comma for Settings) | the view switched, focus stayed on a hidden element | the new view takes the focus as a region named by its title, so the next Tab starts there; a switch from the navigation keeps focus on the navigation item |
| The menu bar, opened by a click, then Escape twice | `<body>` | back to where focus was before (also after F10 or Alt); with nowhere to go back to, the current view |
| The palette | "Settings" and "Go To Settings" | a destination a command already opens is listed once |

The suite now checks each of these, and after closing any menu or expand with Escape it fails focus left on `<body>`.

## 2. Data tables follow the grid pattern

0061 promised one Tab stop per table; the header was 27 more. Now a data table (`S4.table`) has **two Tab stops**, the
header and the body, and Tab leaves for the next control.
- **Header:** Left and Right move through Select All and each column's sort button, options button and grip, in that
  order in every column (the options button used to come first in number columns), Home and End, Down to the body.
- **Grips in the header** resize with Shift and the arrows, or Enter (or F2) then the arrows until Enter, Tab or Escape
  (which restores the width), the grid pattern's interaction mode. Plain tables keep plain arrows on their grips.
- **Body:** Home and End move within the row, Ctrl+Home and Ctrl+End to the first and last row (End used to scroll the
  focused row away and drop focus), Up from the first row reaches the header. The header's keys no longer ran twice.
- **Select All** rests as the same quiet dot as the row boxes and grows with the head row's hover or focus, or once
  anything is selected (amends 0063, where it was always full size: a gray disc above a column of dots).

## 3. Silent failures fail

A page could pass every check and still be broken. The page checker and the suite share `skill/s4-orion/scripts/silent.mjs`:
- **Unknown classes:** an `s4-` class that no stylesheet or script on the page knows (`.s4-card-content` styled nothing).
- **Broken words:** a word split across lines or a box one glyph wide (a table that could not stack, a FAB squeezed into
  the rail as a column of single letters).
- **Parts outside their component:** a nav item outside a bar or rail, a tab outside tabs, a menu item outside a menu,
  a lane outside a board, a card part outside a card, and a few more.
- **Loud statuses** (section 5).

And the two failures it found are made impossible: **a bare `.s4-table` gets its `.s4-table-wrap`** from table.js (unless
its parent already scrolls), so it scrolls and stacks like any other; **a `.s4-fab` anywhere in a `.s4-nav-rail`** (and
items written straight into it) is drawn as the rail's main action with the rail's inset, never glass. SKILL.md names
the header slot. Running the checks on every template found two more, now fixed: Linnea's loan register measured its
columns while its view was hidden (now measured when it shows, and never rounded below its text), and table cells broke
words in the middle ("Exhibition" over three lines): cells that do not stack now keep words whole and the wrap scrolls;
status pills keep words whole too.

**Right-aligned numbers:** `.s4-num` is the one documented class: tabular figures everywhere, and in a table cell or
header it right-aligns; a column whose every cell is `.s4-num` right-aligns its header by itself. `.num` still works.

## 4. One tonal tool per toolbar, Parley's finish

- **Linnea's filter bar** had five identical tonal buttons (two rows on a phone). Now Add Filter is the one tonal tool;
  All Filters, Sort and Columns are text buttons and View Options a plain icon button; on a phone the quiet tools show
  their icon only (the name stays for screen readers), so the tools fit one row under the search. The filter
  component's reference page and README teach the same.
- **Parley:** the inspector's first section was "Line" under the title "Line" (now Details); its close button showed the
  `view.inspector` command's checked state in the accent, reading as a red disc (`data-cmd-plain` runs a check command
  without showing its state); the list column is 44% of the split (320 to 512) and still resizable, and the inspector
  starts open from 1440 wide (View > Inspector or mod+alt+i opens it from 840), so lines wrap to two or three rows at
  1280, not five.

## 5. Statuses are tints

The rule: **a status is a tint.** Neutral (no tone) for the usual states and finished work (Approved, Paid, On Loan); a
warm tone only for the one state that needs action now (`error` late or broken, `warning` soon or waiting on someone);
`info` and `success` for plain facts; the accent tones (`primary`, `secondary`, `tertiary`) are now a 16% wash of the
accent with the surface's text, never the accent's container fill (in monochrome that fill is near black or white, so
"Approved" or "Shared" shouted louder than "Needs Review"). The checker and suite fail a status more than 2:1 from the
surface under it. Fixed by the component for every page (the Showcase's Shared, Linnea's types) and by meaning in Parley
(Untranslated and Approved neutral, Draft a wash, Needs Review warning) and Linnea (On Loan neutral, In Conservation info,
On Display a wash, loans due soon neutral, overdue error).

## 6. Drift

The foundations index, `glass.md` (the edge snippet had a side rim; items on glass were described as outlined), the
text field page and stylesheet comments, the outline token's description and SKILL.md's dialog answers (Cancel tonal,
a destructive answer tonal error, as 0064 says) now match the decisions. **`npm run check:words`** (part of `npm run
check`) fails a phrase that describes the old look ("slide from edge", "outlined button", "thin outline", "side rim",
"drop for menus", "outlined chip/field/card") anywhere in docs, the skill, component READMEs and reference pages;
decisions, history and the issue log are records and exempt. Issues 61, 62, 64 and 65 (fixed in d0a6c3f, 405528a and
a146b0f) are marked Done.

## Not done here
Light site bundle, the Showcase and hub for wide windows, grabber and drag-following scrim, firm corners reaching
containers, `scale` and `headings` dials: workstream B (0066). Owner device pass.
