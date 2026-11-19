# Template identity, batch 5 (issue 66): settings, sign-in, article

Branch `round56/tpl-b5`. Brief: [`template-identity-brief.md`](template-identity-brief.md). Three templates became
three products, each branded through the dials, each with elements only it has, drawn from Orion's rules. Archetype,
structure comments and behaviours (forms, expand in place, Undo, dialogs only for what cannot be undone, keyboard) are
kept. Each saves its theme under its own key (`larkline-theme`, `overhang-theme`, `penumbra-theme`); the pre-paint
script in each `<head>` reads that key.

## The three products and their dial sets (so other batches can avoid them)

| Template | Product | Accent | Dials | Scoped theme | Own elements |
|---|---|---|---|---|---|
| `settings.html` | **Larkline**: record a bird's song on your phone and learn who sang it (birders and walkers, Britain and Europe); this is its settings screen | umber `#7c4f24` (a wren's brown), `variant: 'fidelity'`, **`surfaces: 'tinted'`** (the app is the color of a field notebook) | `corners: soft`, `energy: calm`, `data-lists="segmented"`, display Inter (the visitor can pick a serif) | none | the **field card preview** (a wren drawn from shapes in the color roles, its song as a sonogram, so every dial shows on it), the notebook header (avatar, three tallies), the **storage bar** (song packs on the phone, one segment each, free space last) |
| `sign-in.html` | **Overhang**: a bouldering gym under railway arches (Leeds); the members' front door | chalk-bag magenta `#c8236b` (vibrant), neutral | `gray: cool`, display **custom condensed** (DIN Condensed, Avenir Next Condensed, Roboto Condensed, Arial Narrow), `energy: lively`, stock round corners | the wall and the busy meter: `data-theme="dark"` (the gym at night, in light mode too) | the **wall** (plywood panels, bolt holes, volumes, other problems' holds in the chart colors, this week's problem in the accent with START and TOP tape; its holds light one by one as the form is filled in), the **busy meter** (one bar an hour, past hours quieter, now in the accent, words under it) |
| `article.html` | **Penumbra**: an app and almanac for people who travel to stand under the sky; the guide to the total eclipse of 2 August 2027 | corona gold `#94680a`, `variant: 'fidelity'`, neutral | `gray: cool`, display **custom Didone** (Didot, Bodoni 72, Bodoni Moda, Noto Serif Display, Playfair Display), text Inter, `energy: calm`, stock round corners | every sky: the hero picture, the day planner, the countdown (`data-theme="dark"`) | the **eclipse over Karnak** (stars, corona and streamers, the Moon with one last bead, Venus, pylon, obelisk, columns, the Nile), **totality by place** (a bar a city, its time beside it, Luxor in the accent), **the day minute by minute** (a button group picks the city, a value; the five moments as discs and times), the **countdown** in days |

Taken before this batch (kept apart): Tally, Relay, Pressroom, Moorings, Slugline, Crate, Proof, Sprig, Hollis & Vane,
Tidewater, Mallet, Spool. `tpl-b3.md` did not exist yet when this batch chose. Larkline is the only warm **tinted** app
(the other tinted ones, Relay, Moorings and Sprig, are cool or green); Overhang is the only magenta and the only
condensed face; Penumbra is the only Didone and the only gold-on-night look (Crate's gold is a vibrant sticker gold on
warm grays with Futura).

## Every visible choice, and why

- **Larkline.** Settings start from the person (avatar, name, where they listen, three tallies), not from switches.
  The theme controls are the app's own section, **How Larkline Looks**: a field card on the left shows a sighting the
  way the notebook will draw it, and every control on the right is an `S4.theme` dial: **Day and Night** (mode),
  **Plumage** (the accent; each swatch is a bird: Wren, Kingfisher, Robin, Greenfinch, and Magpie for monochrome, so
  black and white is one bird among five, decision 0045), **Paper** (Field Notebook = tinted, Plain = neutral),
  **Bird Names** (Clean = Inter, Field Guide = serif), **Contrast**. The card's bird is drawn only in color roles
  (sky `secondary-container`, hill `primary-container`, body `primary`, a darker wing mixed toward `on-surface`, a
  pale brow and breast mixed toward `surface-container-lowest`), and its name, Latin name, match and sonogram change
  with the plumage. **Back to Larkline's Look** resets the brand (not day or night) and offers Undo. Below, two columns
  from 1200 (one on a phone): Recording (switch rows), Naming Birds (region select, a slider with its value beside
  the name and a sentence that changes with it, a switch row), Notifications (the dawn alarm's line says when it will
  ring), **Song Packs on This Phone** (the storage bar; Remove does it and offers Undo; Download turns into a progress
  bar in place, then the pack joins the bar), Account, and Delete Account last with a dialog (it cannot be undone).
- **Overhang.** A front door, not a card on white: the gym's wall at night fills one side (on top on a phone), with
  the name set large in the condensed face (HANG in the accent) and this week's problem written beside its holds
  ("Pink holds, start low on the two taped holds. Set on Monday by Priya."). The form is short (email, password with
  Show, Keep Me Signed In, Sign In, a passkey) and errors appear on leaving a field (`.s4-form`). As the email becomes
  valid and the password long enough, the problem's holds light up from START; signing in lights the TOP ("Topped
  out", with what is left on the pass). Forgot Password opens in place under its button and brings the email along.
  **Right Now** tells a member, before they sign in, how busy it is (62 climbing, quieter after 20:30), a second dark
  block under the wall on a desktop and after the form on a phone.
- **Penumbra.** A magazine head above the prose (kicker with the date, a Didone title at display size, a long lead,
  the byline with the author's record "eleven totalities, two of them clouded out"), then the picture, then the
  text. The prose is Orion's `.s4-prose`; the pictures the text needs sit inside it: totality by place, the day for a
  chosen city (Cádiz, Tangier, Benghazi, Luxor; a button group because it changes a value shown in the same place),
  the eye-safety banner, a packing list, a quote, clouds. The supporting pane holds a dark countdown card, **In This
  Guide** (Roman numerals in the display face; hidden on a phone, where the pane follows the article) and **Read
  Next**. Save for Offline toggles with Undo. The file name and reading layout are unchanged, so Tidewater's and
  Mallet's links still land on a reading page; it is its own product, not theirs.

## Lessons (what Orion made easy, what held me back, what I would change)

### Larkline (settings)
- Easy: tinted mode from a brown seed with `fidelity` gave a warm notebook paper at once, in both modes; the swatches
  take `data-variant="fidelity"`; `S4.theme.restore` under the app's own key keeps the visitor's whole look (here the
  brand and the visitor's choices are the same dials, so the restore limitation noted by tpl-b2 does not bite).
  Segmented lists, switch rows, the slider, the select, progress in place and Undo composed with no system code.
- Held back: (1) **Only mode and contrast had declarative controls**; Paper and Bird Names needed hand-written
  wiring to set `S4.theme` and to follow it back after a reset or Undo. *Fixed in this branch:*
  `components/swatches/swatches.js` (`theme-controls`) now also handles `data-brand-dial="surfaces|gray|page|corners|
  display|text|energy"` on a connected group (the attribute the showcase already used, until now only through
  `demo/demo.js`); README updated; `tests/suite.mjs` clicks a brand dial group and checks `S4.theme()` and the group
  follow each other. The showcase's own handler in `demo/demo.js` is now redundant (harmless: both call `S4.theme`
  with the same value); *small, do next:* delete it (not touched here, not this batch's area). (2) Six swatches wrap
  to two rows inside a pane at 390 (48dp each plus gaps); dropped one bird. *Small, do next:* a `data-size="s"`
  swatch (40) for in-pane pickers. (3) The plumage name beside the swatches is hand-built (an `output`); a swatch group
  could announce and show its picked name. *Small, do next.* (4) The page checker and layout pass treat "3.4 GB" as
  words larger than the title (the number filter allows K/M/B but not unit words); marked it `data-hero`. *Small, do
  next:* let the title rule skip a number followed by a short unit (GB, km, °C).

### Overhang (sign-in)
- Easy: one scoped `data-theme="dark"` made the wall night in both modes, and the accent and button groups carried
  into it; `.s4-form` gave the right error timing; the expand put Forgot Password where it was asked for; the layout
  pass, reach suite and dial presets all ran on a page with no app bar and no navigation.
- Held back: (1) **A scoped theme paints its own surface on the element that carries it**, so a scoped block that is
  not itself the rounded shape shows a square corner behind (seen on the busy meter and on Penumbra's figure). Put
  `data-theme` on the rounded element itself. *Small, do next:* say so in the theming docs and the skill. (2) At 200%
  text, a picture-with-text overlay (the problem card over the wall, kept clear of the meter by a fixed margin)
  collided with the meter; moved the meter under the wall as its own block. Lesson for any hero with overlaid text:
  stack, never reserve space with a fixed margin. (3) No icons for the domain (holds, a wall, a person climbing);
  drew them. (4) A condensed display face is only a system stack: on Linux and Windows without Arial Narrow it falls
  back to a normal width, so the wordmark is wider than designed. *Needs the owner:* whether Orion should ship one
  more bundled face (a condensed or a display serif) for brands, since system stacks vary most for exactly these.

### Penumbra (article)
- Easy: `.s4-split data-layout="supporting"` gave the reading column plus a sticky pane at 840+ and the right order on
  a phone; `.s4-prose` kept the reading measure and rhythm while own elements sat inside it; the connected button
  group in a dark region just worked; Didone through `data-type-display="custom"` reached every display token.
- Held back: (1) **Headings take the emphasized weight (600)**: a Didone at 600 is heavy and loses its contrast. My
  own title and countdown use 500, but the prose headings and the app bar title stay at 600 (I cannot change them
  without restyling Orion's classes). Tidewater and Hollis & Vane hit the same. *Small, do next:* a display weight knob
  (`--s4-display-weight`, or a weight per face preset) that `S4.theme({ display })` can set. (2) The prose `h1` is
  headline-large, too small for a magazine title, so the title is my own element above the prose. Fine, but worth a
  documented "article head" pattern (kicker, display title, lead, byline) in the prose README. *Small, do next.*
  (3) Pictures need a caption under them; there is no `figure` treatment for a picture outside prose (wrote
  `.pn-caption`). (4) No sun, moon or star icons; drew them.

### Across the batch
- The dials did the brand in a few lines each; the scoped dark regions and the drawings did the rest. Every drawing is
  inline SVG filled with color roles, so it follows the accent, the color mode and light and dark.
- Nothing restyles an Orion component by its class and `orion.css` is untouched; the one system change is general.
- Check after every product: `check.mjs`, `tests/layout.mjs`, `tests/suite.mjs` and `tests/reach.mjs` with `--only`.

## Fixed in this branch (system)
- `components/swatches/swatches.js`: `data-brand-dial` groups set and follow `S4.theme` (surfaces, gray, page,
  corners, display, text, energy); `components/swatches/README.md`.
- `tests/suite.mjs`: a check that a brand dial group sets its key and follows a change made elsewhere.

## Tests changed (and why)
- `tests/suite.mjs`: added the brand dial check above (new coverage, nothing weakened). No test assumed these
  templates were stock; none needed changing.

## Changelog lines
- Changed: Settings is now Larkline (a birdsong recorder: the theme dials as a designed Appearance section with a live
  preview), Sign In is now Overhang (a bouldering gym's front door: the wall at night and a busy meter), Article is now
  Penumbra (a sky guide to the 2027 eclipse: drawings, totality by place, the day minute by minute).
- Added: `data-brand-dial` on a connected button group sets and follows one brand dial with no app script.

## What the skill should say
- An app's settings should present its theme controls as its own Appearance section, ideally with a preview drawn in
  color roles; every control is declarative: `data-theme-mode`, `data-theme-contrast`, `.s4-swatches[data-theme-seed]`
  (+ `data-variant`), `data-brand-dial`. Save under the app's own key with `S4.theme.restore`.
- Put `data-theme` (a scoped theme) on the rounded block itself.
- A sign-in screen can be a front door: the brand's picture beside one short form, and something useful before
  signing in.

## Hub links
`templates/settings.html`, `templates/sign-in.html`, `templates/article.html` (names and blurbs updated in
`templates/index.html`).

## For the owner to look at on a real iPhone
- Overhang's condensed face (DIN Condensed) and Penumbra's Didot were only seen here as fallbacks (Inter-like sans
  and Liberation Serif).
- Larkline: change the plumage and paper and watch the whole page and the field card follow; first paint shows the
  stock colors for a moment before the brown arrives (the color is generated by script, lesson Sprig 1 in tpl-b4).
- Overhang at 390: the wall band and the holds lighting as you type.

## Not finished or not verified
- WebKit is not installed here; the suite's WebKit runs were skipped.
- The eclipse times and durations are rounded and marked "about"; they are plausible content for a template, not
  checked against an ephemeris.
