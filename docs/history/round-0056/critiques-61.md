# Workstream critiques-61: owner critiques of 2026-11-17 (issues 61 to 65)

Branch `round56/critiques-61`. Each fix was reproduced in Playwright first (dark, monochrome, same page) and screenshotted
before and after (screenshots kept out of the repo).

## 61. Option groups in a pane (radio and checkbox lists)
- Cause: `checkout.html` (and the radio and checkbox reference pages) overrode the fieldset's padding with inline styles, so
  the component's 28px-cornered box sat with its radio discs 10px from the edge, right on the curve, and the legend was
  inside the box at a different inset from everything else.
- Fix in the component (`components/radio/radio.css`, which styles every `fieldset` of radios or checkboxes): the legend is
  now a label above the box, styled exactly like a text field's label, so it lines up with the pane title and the other
  labels at the content edge. The options sit in one filled box like a field's (field fill, `--s4-shape-text-field`
  corners, so it follows the corner dial), one 48px row each, separated by space only; every disc sits 16 from the box's
  side and 18 from its top and bottom, so nothing crowds a rounded corner (`firm` corners included). Logical properties, so RTL mirrors.
- Pages no longer restyle the fieldset or legend: `templates/checkout.html`, `demo/index.html` (Forms view and Filters
  panel), `components/radio/radio.html`, `components/checkbox/checkbox.html`. Radio README says not to.
- Checked: checkout pane, showcase Forms pane, Filters floating panel (glass dialog), radio and checkbox pages.

## 62 and 64. Focus for things you type into
Design ("quiet for a tap, ring for the keyboard, one mark only"):
- `core.js` sets `data-s4-focus="pointer|key"` on `<html>` at every `focusin` (pointer if a pointerdown happened in the
  last 800ms). Typing never changes it. With no script there is no attribute and the ring shows.
- **Tap or click**: the field keeps its hover fill and gets a 1.5px hairline *inside* its box, in the accent mixed 45% into the
  field fill (oklab). In monochrome dark that is a soft mid gray (about 3.3:1 against the fill), not a white wire; with a
  colour accent it is a gentle tint of the accent; errors use the error colour. The caret plus the hairline say "here".
- **Keyboard (or no script)**: the same ring every other control has: `--s4-focus-ring-width` (3px) in
  `--s4-focus-ring-color`, `--s4-focus-ring-offset` outside the box (drawn as an outline on the field's box, the ::before);
  error fields ring in the error colour. This meets WCAG 2.2 focus appearance like the rest of Orion.
- **Never two**: the composer (`.s4-composer`) and the search bar (`.s4-search`, also the palette's input) are the field;
  they carry the one mark and the input inside none. The composer's inner text field no longer picks up the field focus
  fill or ring (that was the double white ring of issue 64: the field's focus rule out-specified the composer's reset). The
  composer's quiet ring is on ::after so its glass edge stays. Search keeps its ring inside the edge (it sits flush under bars).
- Covers text field, textarea, select, the select button, the date field, search, palette, composer, and fields on glass.
- Why not a bottom accent line or a soft halo: both were prototyped. The full-width line read as Material's active
  indicator, a short one read as a typed underscore; the halo went muddy in dark mode. The inset hairline is calm, keeps
  0023's "a focus ring is the only line allowed", and works for any accent in neutral and tinted modes.
- Reach suite: `ringInfo` in `tests/reach.mjs` now also reads the outline on a text field's box (::before), measured
  against what is behind the field, as for any outside ring; nothing is exempted. The keys pass passes.
- READMEs updated: text field, search, message (composer).

## 65. Onboarding step dots
`templates/onboarding.html`: the current dot was an 8px circle scaled 2.5x on X (an ellipse) with extra margins (off the
row's rhythm). Now it is a real 24x8 pill, `align-items: center` on the row, no margins; only its colour fades (State),
its length changes at once (no size animation). Checked with `dir="rtl"` and `data-corners="firm"`.

## Labels breaking mid-word in groups ("Devi/ce", "Standa/rd")
Cause: connected group segments had `min-width: min(max-content, 100%)`, which is invalid CSS (intrinsic keywords are not
allowed inside `min()`), so it fell back to button.css's `min-width: 0`; with `flex: 1 1 0` every segment got an equal
share and the longer label (plus `overflow-wrap: anywhere`) broke. Now `min-inline-size: fit-content`: never narrower than
its label, never wider than the group, and the group wraps. Long text pass still passes (a 136-character word still breaks
inside its button). Fixed on every page that uses a connected group, including the reference page header.

## 63. Lab: `explore/review-button-group-2.html`
Reopens 0026 at the owner's request; the shipped component is unchanged. Built on the live bundle with `S4Review.card` /
`S4Review.page`, questions `button-group-2` in `explore/lib/questions.js` (`take`, `pairs`), listed in `explore/README.md`.
Every preview is live (tapping inside a preview never answers) and has rows for 2, 3 and 4 options, icons with several
choices, small (32) and large (56), on glass over a colour backdrop, and teal with firm corners (scoped `S4.theme`).
Lab CSS lives in the previews; the shell uses Orion type classes and tokens only.
- **A. Ink Track**: one filled capsule, options as words; the selection is an inset accent ink pill that slides, front edge
  on `--s4-motion-ink`, back edge on `--s4-motion-ink-calm` (it stretches as it travels). Multi-select: selected
  neighbours fuse into one longer pill.
- **B. Lone Pill**: no tray; words in a row; only the selection is filled, the fill grows in place (Ink).
- **C. Linked Beads**: separate pills joined by short rounded bridges (drawn under the pills so their ends vanish); a run
  of selected beads fills its bridges too.
- **D. Break Out**: unselected options are one joined capsule with no lines; the selection breaks out as its own accent
  pill with a 4px gap each side (corners and gaps on Morph).
- **E. Lifted Tone**: one capsule; the selection is the outermost surface tone (white in light, near black in dark) with the
  label in the accent at 600. No strong fill anywhere.
- **Keep**: the shipped Joined Capsule.
- Question 2, pairs: **Same** (each take with two options, shown) or **Pair Switch** (two equal halves, a knob that slides end
  to end on Ink, a tap anywhere flips it).
- On glass, trays are a 10% tint of the text colour and the selection an 88% accent tint (items on glass are tints).
- Screens checked at 390 dark and 1280 light; no console errors, no sideways scroll.

## Changelog lines
- Fixed: option groups (a fieldset of radios or checkboxes) put the legend above like a field label and the options in one
  filled box, inset from every corner, one comfortable row each (issue 61).
- Changed: focus on things you type into: a quiet accent hairline inside the box after a tap or click, the focus ring
  outside it from the keyboard, never both; the composer and search bar carry the one mark for their input (issues 62, 64).
  `core.js` sets `data-s4-focus="pointer|key"` on `<html>`.
- Fixed: the chat composer showed two rings (the bar and the field inside) (issue 64).
- Fixed: onboarding step dots: the current step is a clean pill on the row's centre line (issue 65).
- Fixed: connected button group labels broke mid-word ("Devi/ce"); segments are never narrower than their label and the group wraps.
- Added: `explore/review-button-group-2.html`, five new connected group takes and a Pair Switch (issue 63).

## For the skill
- Don't restyle a fieldset of radios or checkboxes or its legend; the component draws the group.
- Never add focus styles to fields, search or composer; never put an indicator on both a container and its input.

## Unverified
- The pointer/keyboard split on a real iPhone (tap should show the hairline; an external keyboard's Tab the ring) and in
  Safari on a Mac (Safari does not focus buttons on click, irrelevant to fields but worth a look).
- The Ink Track's lead and trail is subtle at the current ink spring speed; judge it on the device (the scrubber was not added).
- WebKit is not installed here; "skipped: webkit" is expected.
