# 0067: Dial values are validated, the grid's keys are said, the checker is proven (2026-11-22)

**Status:** built in round 0059, workstream A. Our calls under the owner's hand-over of 2026-11-21; the owner can overrule
any of it. Source: independent re-grade 3 ([`history/round-0058/regrade-3.md`](../history/round-0058/regrade-3.md)), its
Top 10 items 2, 3, 4, 5 and 10. No motion pattern was added (0046).

Amends: **0049** (one exception, below), **0055/0056/0066** (every dial now has a list of values that is enforced),
**0065** (the checker's silent-failure rules are proven on known-bad pages), **0050** (Back is tested on its own).

## 1. Dial values are validated
`S4.theme({ scale: 'roomy' })` used to write `data-scale="roomy"` to `<html>`; no rule matches it and nothing said so.
- **One list per dial**, `S4.theme.dials` (in `core.js`): `data-theme` (light, dark, system), `data-contrast` (standard,
  medium, high), `data-surfaces` (neutral, tinted), `data-accent-variant` (auto and the M3 variants), `data-corners`
  (round, soft, firm), `data-gray` (pure, warm, cool), `data-page` (plain, soft), `data-type-display` and `data-type-text`
  (inter, the six presets, custom), `data-type-display-weight` (semibold, regular, medium), `data-energy` (calm,
  standard, lively), `data-scale` (default, compact, large), `data-headings` (default, tight, editorial), and the app
  defaults `data-density` (comfortable, compact, auto, roomy), `data-buttons` (filled, tonal), `data-cards` (filled,
  elevated), `data-lists` (plain, segmented), `data-rail` (auto, expanded, collapsed).
- **`S4.theme(options)` and `S4.theme(options, element)`**: a key whose value is off its list logs
  `S4: theme scale "roomy" ignored (not written); use default, compact or large.` once and the attribute is **not
  written** (the rest of the options still apply). A typeface may also be any font-family value (written as `custom`);
  `contrast` takes a number from 0 to 1.
- **Markup**: `S4.theme.audit()` returns the dial attributes in the page whose value is off the list; the runtime warns
  about them on load and when one is changed later (`S4: data-scale="roomy" is not a value of that dial; use default,
  compact or large.`). `data-page` on a `.s4-subpage` is that page's id, not the dial, and is skipped.
- **The page checker** calls `S4.theme.audit()` in both views and fails every bad value (it already failed any `S4:`
  console warning, so a runtime `S4.theme` warning fails the page too).
- Proven by `tests/checker.mjs` (every dial's bad value is not written and warns) and the fixture `bad-dial.html`.

## 2. The grid's header keys are surfaced
A data table's header controls have no Tab stop (0065), so a keyboard user could not find them. `table.js` now sets an
`aria-description` on the table (Up from the first row reaches the headers; Left and Right move between sort, options and
resize; Down comes back) and adds a one-line `p.s4-table-hint` under the wrap that fades in while the keyboard is inside
(`:focus-visible`; its line is reserved so nothing moves; hidden on touch screens and in print; `data-hint="off"` leaves
it out, the description stays). A "Header keys" section in the table README and the skill reference.

## 3. Decision 0049 and shortcuts
0049 stays: no script puts the cursor in a field. **One case is the person's own action:** a palette or search that their
own keyboard shortcut opens (mod+K; mod+comma into the palette) may put the cursor in its search field, because their
keys are already going there. By tap or click it still never does (a phone keyboard must not jump up). The suite's guard
keeps failing every other case and now also proves this one: a palette opened by click has no cursor in its box, opened
by mod+K it has. (In the desktop template mod+comma opens Settings, whose view takes focus, not a field.)

## 4. The checker is proven on known-bad pages
A rule nobody has seen fail is a claim. `tests/fixtures/` holds three pages the checker must fail, and `tests/checker.mjs`
(`npm run test:checker`, in CI) runs the checker over them and expects the message:
- `bad-words.html`: a table with no wrap and no `orion.js` at 390 with long words: words break across lines. (With
  `orion.js` loaded, `table.js` adds the wrap and stacks the rows, 0065, so a bare table in a real page is fine.)
- `bad-fab-rail.html`: a `.s4-fab` straight in `.s4-nav-rail`. **The one-glyph-box rule did not fire here** (its label was 0px
  wide, and the rule only looked at words of four letters with a width): it now flags any block that holds words and is
  narrower than 1.2 of its own letters, unless it is hidden, faded, clipped or a 1px visually-hidden name on purpose.
  The templates and the Showcase stay clean (`npm run test:pages`).
- `bad-dial.html`: `data-scale="roomy"` and `data-corners="square"` on `<html>`.

## 5. Back is tested on its own
`tests/back.mjs` (`npm run test:back`, in CI): the editor's script page, the calendar's booking page and the Showcase's
note page, at 390 dark and a short 1280 window, by the browser's Back and by the top bar's Back button: the view's scroll
is where it was (within 4px, with a real position of 40px or more at 390), focus is on the opener and never `<body>`, and
no field got the cursor. The suite still checks the same in passing on every page.

## Release
CHANGELOG 1.0.0 is dated 2026-11-13 (the first commit that wrote it) and 1.1.0 2026-11-22 (the end of round 0058); the main
session tags 1.0.0 at `b72df1a^` and 1.1.0 at `383dedb` when it publishes. A 1.2.0 section collects round 0059.
