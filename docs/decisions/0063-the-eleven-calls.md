# 0063: The eleven calls: brand files, editorial type, meter, board, quiet table checkboxes, one label rule, dense maps, calmer selection (2026-11-21)

**Status:** our call. Round 0056 left eleven decisions waiting for the owner, each with a recommendation (NEXT.md;
details in [`history/round-0056/lessons.md`](../history/round-0056/lessons.md) "For the owner",
[`data-scale.md`](../history/round-0056/data-scale.md) and [`desktop-anatomy.md`](../history/round-0056/desktop-anatomy.md)).
On 2026-11-21 the owner handed us the lead: "I'll let you take the lead on this, and feel free to change past rules as
well and do anything you feel like it is for the best." We took the recommendation on all eleven and built them
(round 0057). The owner can overrule any of it.

## The answers

| # | Question | Answer | Why |
|---|---|---|---|
| 1 | The brand color arrives late (a branded page paints monochrome first) | **A brand file written at build time**, plus a small cache for colors a visitor picks | A fixed brand is most apps; a file costs one link and paints the brand on the first frame with no color script |
| 2 | Editorial type | **`.s4-kicker`** with real small capitals (never faked); **no** old-style figures dial | Editorial sites need a section label now; figures can wait for a second editorial template |
| 3 | A meter | **Build `.s4-meter`** | Five templates drew the same labelled track by hand |
| 4 | A board with lanes | **Build `.s4-board` / `.s4-lane`** | Two templates rebuilt lane counts, limits and the add-in-place footer |
| 5 | Dense map-like pickers | **Opt-in `data-dense`**, checked against WCAG 2.5.8's spacing rule, only for maps of real things | A seat plan fits a phone only by trimming the room around it |
| 6 | One bundled brand face | **No**: Inter stays the only bundled face; the skill says how an app ships its own | 100 to 200 KB and a license review for one look |
| 7 | Monochrome colored FAB labels (3.85:1) | **The 0060 rule at build time**, one tint per color | Every FAB in every scheme follows one rule |
| 8 | The vibrant toolbar on glass with a seed | **The same rule**; the exception is gone | The rule already covers it; no recorded exception left |
| 9 | Desktop: rename taking the cursor, document-tab ellipsis, a selection-strength dial | **Keep rename (F2 is the person asking) and the tab ellipsis as built; no dial**: selection is calmer for every vivid accent instead | Parley's selected row was a saturated block in dark mode; the cause was general, so the fix is too |
| 10 | Data: a quieter resting checkbox; may cells truncate | **A quiet resting mark in tables** (amends 0044 there); **cells keep wrapping** (0058) | A column of gray discs was louder than the data; truncation hides data |
| 11 | Wide windows: centred or start-aligned capped content | **Centred**, as built | Reads as a document on a wide screen; no change |

## What was built

**Brand files (1).** `scripts/brand.mjs --seed <hex> [--variant …] [--surfaces tinted] --out brand.css` writes a seed's
scheme for light and dark, standard and high contrast, with the light or dark scopes inside the page, as CSS the app
links right after `orion.css`. It runs the color engine in `core.js` itself (the pure block between `color-kit:begin`
and `color-kit:end`), so the file is byte for byte what the browser would write. The file names the schemes it holds
(`--s4-brand: "seed/variant/surfaces"`, with the variant as asked and as `auto` resolves it); `core.js` sees a match
and generates, loads and repaints nothing (medium contrast is still generated). Every template with a fixed seed links
`templates/brand/<name>.css`, written by `npm run build` from the seed in its own script and covered by the stale check;
the skill carries the script (`skill/s4-orion/scripts/brand.mjs`) and the files. `inline.mjs` leaves out `m3color.js`
for a page whose brand file holds its only color. **Visitor-picked colors:** with a save key, `core.js` keeps the
generated CSS under `key + ':color'` and a one-line head snippet (after the stylesheets) puts it back before the first
paint; Larkline and Puck use it. Verified: with the color script and the whole runtime blocked, Sprig, The Velvet,
Fetch, Puck and Larkline paint their brand on the first frame; with them allowed, no `m3color.js` is requested.

**Editorial type (2).** `.s4-kicker` (components/prose): the accent label above an editorial title, `font-variant-caps:
all-small-caps` with synthesis off, so a face with small capitals shows them (a size up, `--s4-type-caps-tracking`
apart) and a face without them (Inter) shows the emphasized label in Title Case. `figure.s4-figure`: a picture with
large corners and a caption, inside or outside prose. `.s4-post-byline` in the site kit (names in `<b>`, small capitals
where the face has them). Lesson 41 asked for `.s4-post-kicker`; a post's section is a kicker, so it is `.s4-kicker`
(one name per thing). Tidewater, Penumbra and Hollis & Vane use them.

**Meter (3).** `.s4-meter`: a label, the value in words, a filled track; `data-value|min|max`; a target or now mark;
tone by state (`data-state="on-track|near|over"`, the status colors); segments for a share of a whole with a legend
(one series = the accent, segments = category colors); counted steps (`data-steps`); ranges on a track (`data-from`);
sizes s, default, l, xl; `data-ink="current"` on colored surfaces; `role="meter"` with the written value. Never
animated: a reading. Tally's runway, Relay's response clock, Pressroom's word count, Moorings' fleet day and Larkline's
storage bar use it, each keeping its brand through the dials. Larkline's storage segments moved from role colors to
category colors (0060: kinds of things take categories).

**Board (4).** `.s4-board` with `.s4-lane`: a head with a count that reads "4 / 3" and turns the error tone past
`data-limit`, an add-in-place footer (`[data-lane-add]` opens a draft; `s4-lane-add` hands the value to the app; the
field is never focused for the person, 0049), Alt and the arrow keys move a card within and between lanes (dragging
stays components/direct; never drag-only), lanes are 85% of a narrow board and snap, at least `--s4-lane-min` on a wide
one; a page with a board starts with its rail collapsed. Pressroom runs on it.

**Quiet table checkboxes (10).** In `.s4-table` (and `S4.table`), an empty box in a resting row is a dot half the
size, in the same 3:1 control color, so it still reads as a control (WCAG 1.4.11) without a column of discs; it grows
to the full box on row hover or focus, and every box shows in full while anything is selected. The Select All box
always shows in full. Amends 0044 inside tables only.

**One label rule (7, 8).** A colored FAB and the vibrant toolbar each have their own glass tint token
(`--s4-glass-tint-opacity-fab-<color>`, `-toolbar-vibrant`), computed by the token build from the owner's 90% with the
0060 rule (raised only as far as the label needs, per mode); monochrome `tertiary-container` rises to 0.99 in light
mode, everything else keeps 90%. `core.js` writes the same per color for every seed. `check-glass` proves every
monochrome label at 4.5:1 at its own tint and the vibrant toolbar for 192 seeded schemes; the suite's vibrant-toolbar
exemption is removed. Removing it showed one pair no check covered: a tonal button on the vibrant toolbar kept the
selection fill under the bar's text color (3.97:1 with a muted seed in dark mode); it is now the accent pair, the bar's
strong action. The page checker skips brand files as it skips `orion.css` (they are generated scheme, not app CSS).

**Dense maps (5).** `data-dense` on a map of real things (seats, keys, calendar cells): the suite's phone pass asks
each target to be drawn at least 18px and 24px from its nearest neighbour's centre, instead of a 24px box. The Velvet's
seat plan uses it and gets its padding back.

**Calmer selection (9).** The selection container a seed writes (`secondary-container`, neutral mode) is never more
colorful than M3's tonal palette for the same hue: in dark mode the quiet secondary tone 25, in light mode the accent's
tone 90 capped at the tonal chroma. A vivid accent selects a row clearly but quietly. check-accent and check-glass
mirror it. Parley's phone title bar also lost a search button that sat right above its filter field.

**Small lessons.** 38: two statuses stack in a list row's trailing slot (Relay: time left over priority). 39:
`.s4-slider[data-value="heading"]` puts the label and the value above the track, with an optional paired exact-value
field that shows big numbers grouped (Proof's dials, Spool's calculator). 42: swatches `data-show-name` (Larkline's
plumage). 43: wind, sun, moon, night sky, cloud, rain, sunrise, sunset, temperature, compass and hike icons in all
three sets (Moorings, Penumbra, Overhang). Solar has no boat or mountain, so none was added for those.

**Kept as built (9, 11) and documented (6).** Rename takes the cursor (F2 or the menu is the person asking);
document-tab labels truncate (the sixth place); wide content is centred. Inter is the only bundled face; the skill and
typography foundations say how an app ships its own: one `@font-face` file, `font-display: swap`, its family name first
in a `custom` stack.

## The rule
- A fixed brand ships its brand file (`brand.mjs`), linked right after `orion.css`; regenerate it with the brand or
  after updating Orion. Visitor-picked colors use the cache snippet.
- An editorial label is `.s4-kicker`; a picture with a caption is `figure.s4-figure`.
- A labelled track is `.s4-meter`; lanes of cards are `.s4-board`. Never drag-only, never a dialog to add a card.
- In a table, an empty resting checkbox is a quiet dot; selection mode shows the boxes.
- Everything floating in its own color follows one label rule; no exemptions.
- `data-dense` only for maps of real things, never for ordinary controls.

## Not done here
- Boat and mountain icons (Solar has none); a non-menu anchored popover; a compact row-height token for data tables.
- Dialogs, sheets, glass, the nav and top app bars were the parallel round's ([0064](0064-calm-dialogs-docked-glass.md),
  merged with this one). The two agree: 0063 adds no dialog (the board adds cards in place), the calmer selection and
  the per-color FAB tints sit beside 0064's modal glass tint and docked hairline without touching them.
