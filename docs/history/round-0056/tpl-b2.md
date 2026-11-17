# Template identity, batch 2 (issue 66): calendar, editor, gallery, tool

Branch `round56/tpl-b2`. Brief: [`template-identity-brief.md`](template-identity-brief.md). Four templates became four
products, each branded through the dials only, each with elements of its own drawn from Orion's rules. Archetype,
structure comments and behaviours (pages, states, forms, Undo, placement ladder, keyboard) are kept.

## The four products and their dial sets (so other batches can avoid them)

| Template | Product | Accent | Dials on `<html>` | Scoped theme | Own elements |
|---|---|---|---|---|---|
| `calendar.html` | **Moorings**: boat bookings for a small sailing club (Larkspur Bay SC), members book five boats by the hour | sea teal `#006a6a`, `surfaces: 'tinted'` | `data-type-display="rounded"`, `data-energy="lively"`, `data-lists="segmented"`, round corners (stock) | `data-theme="dark"` on the conditions band (the night sea in light mode too) | tide curve (SVG, filled area + line, dark hours shaded, a now line), wind arrow turned once, fleet board (one track a boat 08–20, your bookings in the accent, others in `outline`, a boat in repair written in its track), wind marks on the month (kn on wide cells, a red bar on phones, a key), season in weeks (one pill a week), boats drawn from shapes |
| `editor.html` | **Slugline**: a TV writers' room writing a six-episode series (*Low Tide*) | plum `#6e2a5e`, `variant: 'fidelity'` | `data-page="soft"`, `data-corners="firm"`, `data-energy="calm"` | none | the screenplay page (`--md-ref-typeface-mono`, scene numbers hanging in the margin from a CSS counter, character / dialogue / parenthetical / transition indents, Enter makes the next element a script expects), the series strip (an episode is a stack of pages topped with its revision color), cast with line counts, revision colors (white, blue, pink, yellow, green from the chart palette, always named) |
| `gallery.html` | **Crate**: the stock room of a second-hand record shop (Spindle & Groove, Leith) | sticker gold `#e8b400` (vibrant) | `data-gray="warm"`, `data-type-display="custom"` with a Futura system stack, `data-energy="lively"`, round corners | the listening booth: `data-theme="dark"` + the sleeve's own color as `data-accent`, set with `S4.theme({ seed }, el)` per record | sleeves drawn from five shape layouts in the chart palette on fixed grounds, the record half out of its sleeve (grooves, label in the booth's accent), grading pills (media / sleeve, mono), crate spines |
| `tool.html` | **Proof**: a sourdough calculator for home bakers | bakery navy `#24406b`, `variant: 'fidelity'` | `data-gray="warm"`, `data-type-display="custom"` with an Optima system stack, `data-buttons="tonal"`, round corners | the result pane: `data-accent` + `data-surfaces="tinted"` (the one region colored all over) | the dough bar (share of weight per ingredient, legend with grams and baker's %), the day's timetable from the kitchen temperature (a dot a step, waits in `outline`), a baker's tip banner in place |

Already taken elsewhere: Tally (green tonal, warm, soft page, firm, serif, calm, filled cards), Relay (indigo tinted,
cool, soft, system display, lively, auto density, dark rail), Pressroom (orange, mono display, tonal buttons, collapsed
rail, dark edition band). Moorings was first drafted on a sea blue with cool grays and moved to teal without the gray
dial once Relay landed with tinted + cool + lively; Slugline was planned with a dark rail and dropped it for the same reason.

## Every visible choice, and why
- **Moorings.** The water decides whether you sail, so the day opens with conditions before bookings: a verdict in
  words ("Good for Dinghies", "Keelboat Only"), wind in knots with direction in words, the tide curve with high and low
  written under it, sunset and water temperature. The conditions are a scoped dark band so they read as "outside" in
  both modes. The fleet board answers "which boat is free" at a glance; the list under it is the accessible, tappable
  version and opens a booking as a page. Booking is in place under the day (0047); a clash is the Boat field's own
  error ("Kestrel is out 09:00–12:00. Pick another boat or a later time."). Cancel Booking does it and offers Undo.
  The rail's main action is Book a Boat. My Sails is a season hero (hours on the water, weeks as pills) beside a
  Logbook; Fleet is the five boats drawn from shapes, one In Repair, and a sixth tile to report damage in place.
- **Slugline.** A screenplay is a format, so the writing surface is the app's own element, not `.s4-prose`: Courier-
  style mono via the token, scene numbers in the margin, the industry indents. What the line is (Scene, Action,
  Character, Dialogue, Transition) is a single-select button group that follows the caret (0059: it changes a value);
  Enter after a character makes dialogue, after dialogue a character, after a scene action. The outline numbers the
  scenes (place, inside/outside, time of day) and counts each character's lines. Revision colors are the real
  convention (blue, pink, yellow, green pages), named beside every swatch. The soft page makes the script a white sheet
  on a gray desk; firm corners and calm motion keep it a work tool.
- **Crate.** A record shop sells sleeves, so the grid is sleeves with the text under them (never on them): artist,
  title and year, price, grades. Sleeves are drawn from shapes in the chart palette on the fixed roles
  (`secondary-fixed` / `on-secondary-fixed`), so artwork looks the same in light and dark. A record opens in a dark
  listening booth that takes the sleeve's main color as its accent; surfaces stay neutral there so the sleeve does not
  change color. Sorting is a button group (a value), sections are chips (narrowing a collection). Selecting several
  offers Print Price Labels, Move to Sale Bin (−20%, Undo) and Mark Sold (Undo). Crates shows the shop floor and a web
  shop sync in its error state with Try Again. From 1200 the week's arrivals sit beside the record of the week.
- **Proof.** Bakers think in baker's percentages, so the inputs are those (water, levain, whole grain, salt) with the
  value written large beside each slider and a line about what it means ("Very wet. Fold it in the tub..."). The
  recipe preset is a button group (it sets values). The result is the one tinted region: total dough, the dough bar,
  grams with percentages, and the day from mix to out of the oven, the bulk rise worked out from the room temperature.
  Start Over has Undo. A tip appears in place when the numbers ask for trouble.

## Lessons (what Orion made easy, what held me back, what I would change)

### Moorings (calendar)
- Easy: tinted mode plus one scoped `data-theme="dark"` gave the whole brand; the dark band picked up the tinted roles
  by itself. Split, expand, form errors, pages, states and Undo composed into a booking app with no system code.
- Held back: (1) **a select whose options or value change from script keeps a stale glass picker** until a `change`
  event fires (`text-field.js` rebuilds only on change): boats in repair stayed in the picker. Worked around by
  dispatching `change`. *Small, do next:* rebuild the picker on open, or observe the select's options. (2) The M3E
  tinted dark `tertiary-container` is a bright tone (`#b5e0fd`), so "other people's bookings" in it outshone mine in
  dark; used `outline` as a fill instead. *Needs the owner:* a documented "secondary series" fill for data (see Crate's
  category note). (3) No icons for the domain (wind, boat, sun); drew them. *Small, do next* if more apps need them,
  through `add-icons.mjs`. (4) A sticky supporting pane scrolls inside itself, so a button in its top corner had its
  focus ring cut; needed 8px of room in the app's own header. *Small, do next:* give `.s4-split-pane[data-sticky]` a
  focus-ring inset (padding equal to the ring) so no app has to.
- Change: a `.s4-board`-like day track (rows sharing a time scale) is the same element as Relay's clock and Tally's
  runway: support the "labelled track" component proposed by hierarchy-wide.

### Slugline (editor)
- Easy: the button group as a live "line is" indicator, pages with their own URL, autosave status, outline from the
  text, palette. The soft page tone turned the script into paper with one attribute.
- Held back: (1) **The default glass FAB's label fails contrast in dark mode with an accent** (2.33:1 with the
  fidelity plum, 3.57:1 vibrant, 3.23:1 tonal): the page checker and suite both fail it. Used `data-color="primary"`
  (as Relay did). The suite's dial pass already exempts a seeded FAB, but only when the preset seeds; a branded
  template seeds itself. *Needs the owner:* prove extended-FAB labels for seeded schemes in `check-glass` and give the
  label `on-surface` on glass when the pair fails, or make `primary` the default FAB color when a seed is set.
  (2) **Extended FAB label wrapped** ("New / Script"): `fab.js` measured `scrollWidth`, an integer that rounds a 81.4px
  label down. *Fixed in this branch* (`components/fab/fab.js` takes the larger of scrollWidth and the box width).
  (3) The default `vibrant` variant turns a deep plum into hot magenta; `fidelity` keeps the seed's own tone. Tally hit
  the same with green (used `tonal`). *Small, do next:* document in the skill's dial table which variant keeps a dark
  brand color dark (fidelity) vs calms it (tonal). (4) The button group's selected state is set by the group on click;
  setting `aria-pressed` from script (to follow the caret) works but is not a documented API. *Small, do next:*
  `S4.buttonGroup.set(group, value)` so the Ink Track (0059) can move its pill without a click.
- Change: a "document surface" note in the skill: a structured writing format (script, poem, recipe, legal) is the
  app's own element on the mono or serif token, not `.s4-prose` restyled.

### Crate (gallery)
- Easy: `S4.theme({ seed }, el)` on a region per record is exactly the "branded band" of 0056 and made the booth;
  selection, chips, sort group, states with Try Again, pages with next and previous, Undo for every bulk action.
- Held back: (1) **Artwork changes with the mode**: every surface role flips in dark, so drawn covers changed ground.
  Found the M3 *fixed* roles (`secondary-fixed`, `on-secondary-fixed`) stay the same in both modes and used them; a
  tinted scope tints them too, so the booth keeps neutral surfaces. *Small, do next:* name this in the docs
  ("artwork and illustration grounds: the fixed roles") or add `--s4-art-paper` / `--s4-art-ink` aliases.
  (2) **No categorical palette but the chart's**; sleeves and revision colors borrow `--s4-chart-1…6` (Pressroom did
  the same for desks). *Needs the owner:* `--s4-category-1…6` aliases (hierarchy-wide's proposal), seconded.
  (3) Setting `data-accent` with `setAttribute` after load does nothing until `S4.theme({ seed }, el)` is called (the
  scoped scheme is written by `writeScoped`). Fine once known; *small, do next:* say so in the README of theming, or
  observe `data-accent` changes. (4) A custom display face is two pieces (`data-type-display="custom"` plus
  `--md-ref-typeface-brand` inline on `<html>`); the page checker and suites accept it, but there is no preset for the
  common Apple system faces (Futura, Avenir Next, Optima, Charter). *Needs the owner:* a "geometric" and a "humanist"
  preset as system stacks.
- Layout: a chip row with `data-scroll` beside a button group overlapped it at 200% text (the chip scroller bleeds to
  the edge). Put the sort on its own row with a "Showing 14 records" line. *Small, do next:* the chip set's bleed
  should stop at a sibling, or the skill should say "a scrolling chip row takes the whole row".

### Proof (tool)
- Easy: a scoped tinted result in a neutral app is one attribute pair; sliders, the button group, fields with suffixes
  and errors, the banner in place, Undo.
- Held back: (1) **Slider stops widened a printed page**: the stop layer reaches half a step past the track, and in
  print (no pane padding at the sheet's edge) it ran 19px past the sheet. *Fixed in this branch*
  (`components/slider/slider.css`: no stop dots in print). (2) **The reach keys pass stopped early** when a native
  time field took one Tab per part (hours, minutes, AM/PM) and read it as a loop, so Copy Recipe was "never reached".
  *Fixed in this branch* (`tests/reach.mjs`: a repeated native date/time field is not a loop). (3) No number stepper
  with − and + (the rich-inputs workstream is building one); used a number field. (4) A hero number needs
  hand-written type (`display-medium` + tabular figures); seconds Tally's `.s4-stat[data-size="hero"]`. (5) The value
  beside a slider is hand-built (`output` in a row); a slider "with its value as a heading" variant would serve every
  calculator. *Small, do next.*

### Across the batch
- The dials did most of the brand; the scoped themes (a dark band, a branded booth, a tinted result) did the rest and
  are what makes each page memorable. What needed the most app CSS was the product's own pictures, as 0053 expects.
- `S4.theme.restore` cannot keep a fixed brand while saving the visitor's mode (it replaces the defaults with whatever
  was saved). Every branded template reads the mode from the shared key and calls `S4.theme({ mode, seed, … })`
  without saving. *Small, do next:* `S4.theme.restore(key, defaults, { brand: { seed, … } })` or a `keep` list.
- Nothing restyles an Orion component by its class; no `orion.css` edits; the three system fixes are general.

## Fixed in this branch (system)
- `components/fab/fab.js`: an extended FAB's label width is measured from its box, not the rounded `scrollWidth`.
- `components/slider/slider.css`: slider stop dots are not printed.
- `tests/reach.mjs`: the keys pass no longer treats a native time or date field's parts as a Tab loop (the template
  was right; the test assumed one Tab per control).

## Changelog lines
- Added: four product templates branded by dials: Moorings (calendar), Slugline (editor), Crate (gallery), Proof (tool).
- Fixed: extended FAB labels no longer wrap when their width has a fraction; slider stops no longer widen a printed
  page; the reach keys pass reaches controls after a native time field.

## What the skill should say
- Calendar, editor, gallery and tool templates are now products; copying one means replacing its brand (the `<html>`
  attributes and the `S4.theme` call) and its data, keeping its structure.
- Artwork and illustrations drawn in an app use the fixed roles for grounds so they keep their look in both modes.
- A structured writing format (a script) is the app's own element, not prose restyled.
- A record, product or project page may take its own color with `S4.theme({ seed }, region)`.

## Hub links
`templates/calendar.html`, `templates/editor.html`, `templates/gallery.html`, `templates/tool.html` (hub descriptions
updated in `templates/index.html`).

## For the owner to look at on a real iPhone
- Crate's Futura and Proof's Optima are system faces: on the iPhone they are the real faces; here they fall back.
- Moorings' tide curve and fleet board at 390; the rounded display face (SF Pro Rounded).
- Slugline's script page: typing, Enter between character and dialogue, the line-type group following the caret.

## Not finished or not verified
- WebKit not installed here: the suite's WebKit runs were skipped.
- The Ink Track button group and navigation-look tabs (0059) are being built in another branch; my templates use the
  current button group with `aria-pressed` and will pick the new look up without changes (Slugline sets
  `aria-pressed` from script to follow the caret: check that the Ink Track's pill follows an attribute change).
