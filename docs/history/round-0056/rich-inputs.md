# Workstream rich-inputs: issue 59, the input half

Branch `round56/rich-inputs`. Ten new component folders (nine items; the password item became two folders, password
helpers and inline edit, because `components/form/` had no inline edit). All are built on the existing Quiet Box text
field, the glass menu surface and the chip, and none edits `components/text-field/`, `button/`, `button-group/`,
`radio/`, `checkbox/` or `tabs/` (another workstream owns them). No template was touched (as instructed).

## Built (paths)
| Component | Folder | Class |
|---|---|---|
| Combobox / autocomplete (+ `S4.listbox`, the shared glass list) | `components/combobox/` | `.s4-text-field.s4-combobox` |
| Tag input / multi-select | `components/tag-input/` | `.s4-text-field.s4-tag-input` |
| Number field with steppers | `components/number-field/` | `.s4-text-field.s4-number-field` (`data-inline` for a cart row) |
| One-time code | `components/code-field/` | `.s4-text-field.s4-code-field` |
| File upload | `components/upload/` | `.s4-upload` (`data-variant="compact"`, `"avatar"`) |
| Time field, date and time, time range | `components/time-field/` | `.s4-text-field.s4-time-field`, `.s4-date-time`, `.s4-time-range` |
| Rating | `components/rating/` | `.s4-rating` (display), `fieldset.s4-rating[data-input]` |
| Color field | `components/color-field/` | `.s4-text-field.s4-color-field` |
| Password helpers | `components/password/` | `.s4-text-field.s4-password` (`data-strength`) |
| Inline edit | `components/inline-edit/` | `.s4-inline-edit` |

Each has CSS, JS, a reference page with every state, a README, an `@import` in `components/index.css` and an entry in
the Inputs group in `scripts/build.mjs`. New icons `minus` and `plus` (all three sets, `scripts/add-icons.mjs`).
Showcase: a "Rich Inputs" pane in the Forms view (`demo/index.html`) with one of each.
Suite (`tests/suite.mjs`, in `use()`): every interaction each input adds (see "Suite coverage" below); the ten pages also
joined `DIAL_COMPONENTS`, and `.s4-color-field-swatch`, `.s4-rating-star` joined `dialAudit`'s list.

## Visible choices and why (for a decision record)
1. **One field, many inputs.** Every input is the text field (same 48 box, label above, supporting text below, error
   keeps the fill, the new focus marks) with parts added inside it, so they sit beside plain fields at the same height.
   Where a part moves the input one level deeper (tag input) or draws its own boxes (code field), the focus marks are
   repeated behind the same selectors the text field uses (`[data-s4-focus="pointer"]` hairline, keyboard ring).
2. **Lists hang from the field, in glass, and the cursor stays in the field.** Combobox, tag input and time field share
   `S4.listbox`: a `.s4-glass` popover under the field's box (above it when there is no room; it measures
   `visualViewport`, so over a phone's keyboard it flips up, and if neither side has room it scrolls the field to the top).
   The active option is `aria-activedescendant`, drawn with the focus ring; the chosen one has the selection fill and a
   check. Motion: Follow. (`S4.menu.open` could not be reused because it moves focus into the menu.)
3. **One trailing button that changes job** (combobox): Show Options (chevron) while empty, Clear once there is text,
   so focus never falls off the page when it changes. The chevron is out of the Tab order (Down opens the list).
4. **Matches are bold, never colored** (contrast on glass for every accent).
5. **Tag input chips are tonal** (`secondary-container`): the plain chip fill is the field's own fill. Each chip's remove
   button stays in the Tab order (before the field) instead of arrow-key roving, because moving back into the field from
   a chip would be a script putting the cursor in a field (0049).
6. **Number field = minus, value, plus in one box**, value and unit centered together in tabular figures. `type="text"`
   with `role="spinbutton"` (a number input has its own spinners and cannot show "1,240"). The steppers never take
   focus, so a tap does not raise the phone keyboard. `inputmode` is the full keyboard when negatives are allowed (a
   phone's number pad has no minus). The Solar minus icon is drawn whole (its duotone half is lifted to full tone in the
   stepper only).
7. **One-time code = boxes over one real input** (`autocomplete="one-time-code"`), so the phone's suggestion and a paste
   fill every box; group gaps are empty grid tracks so all boxes keep the same width; 7 or 8 boxes use a 4px gap to fit a
   phone. `s4-complete` when full; the app sets `data-error` or `data-success`.
8. **Upload zone is a filled button** (nothing dashed or outlined); a drag takes the selection fill. Its corner follows
   the dial (`min(28, 2 x control)`). Refused files stay as rows with the reason. The avatar variant is a circle at every
   corner dial (a person's photo, like `.s4-avatar`).
9. **Time field: typing plus a short list, no dial**; 12 or 24 hours from the page's language; a range's end list says
   the duration of each choice.
10. **Rating stars are the accent; empty stars are the 3:1 control gray**; the display always prints the real number
    (stars round to halves, "3.8" stays 3.8) and the review count; the input is native radios, whole steps only, a second
    tap clears. Stars are drawn by the component (rounded points), not taken from the icon set, so they never change
    with `S4.icon.use`.
11. **Color field: swatch (a round button) + hex code**; the panel is the swatches component plus a hue slider whose
    track is the spectrum (built from data in script, the only literal colors, like a swatch's `data-seed`).
12. **Password**: the toggle keeps the name "Show Password" and flips `aria-pressed`; the meter's colors only repeat its
    words; it hides the password again before the form is sent.
13. **Inline edit is a real input that reads as text** (pencil on hover, always on touch), so the person's own tap edits
    it; Enter or leaving saves, Escape restores, Undo in a snackbar.

## Changelog lines
- Added: combobox (`.s4-combobox`, `S4.combobox.source`) and `S4.listbox`, the glass list a field opens without taking
  the cursor out of it.
- Added: tag input (`.s4-tag-input`, `S4.tagInput`), number field (`.s4-number-field`, `S4.numberField`), one-time code
  (`.s4-code-field`, `S4.codeField`), file upload (`.s4-upload`, `S4.upload`), time field (`.s4-time-field`,
  `.s4-date-time`, `.s4-time-range`, `S4.timeField`), rating (`.s4-rating`, `S4.rating`), color field
  (`.s4-color-field`, `S4.colorField`), password helpers (`.s4-password`, `S4.password.score`), inline edit
  (`.s4-inline-edit`, `S4.inlineEdit`). 72 components.
- Added: icons `minus` and `plus`.
- Added: a Rich Inputs pane in the showcase's Forms view.
- New events: `s4-complete` (code field), `s4-upload`, `s4-retry`, `s4-reject` (upload).

## What the skill should say
- Pick by the data: more than ~7 options or server results, one value: combobox; several values from an open set: tag
  input; small counts people nudge: number field (`data-inline` in cart rows); a code sent to the person: one-time code
  (never focus it); files: upload (the app sends; call `S4.upload.progress/done/fail`); a time of day: time field (never
  a clock dial; `.s4-date-time` with the date picker); reviews: rating (number always beside); an accent setting: color
  field with `data-theme-seed`; passwords: `.s4-password` (`data-strength` only for new passwords); one value on a detail
  page: inline edit.
- Don't add trailing icons to combobox, time, password or color fields (the place is taken), or leading icons to tag
  inputs. Put a combobox's hidden value input after the visible one.
- Still never: autofocus, dialogs for these, outlined drop zones, yellow stars.

## Hub links to add
`components/combobox/combobox.html`, `tag-input/tag-input.html`, `number-field/number-field.html`,
`code-field/code-field.html`, `upload/upload.html`, `time-field/time-field.html`, `rating/rating.html`,
`color-field/color-field.html`, `password/password.html`, `inline-edit/inline-edit.html`. The components gallery (`components/index.html`) has the ten cards in its Inputs group.

## Suite coverage (tests/suite.mjs, `use()`)
Combobox: Down opens, an option becomes active, cursor stays, list fits, Escape closes. Tag input: Enter adds, cursor
stays, Backspace removes. Number field: a stepper steps without focusing the field, an arrow key steps back. One-time
code: typing fills in order, a paste with spaces and dashes fills all, `s4-complete` fires. Upload: the zone is a
button in the Tab order and opens the chooser, a chosen file is added, progress moves the bar, a failure shows Try
Again which fires `s4-retry`, Remove removes. Time field: a tap opens the list (fits), "545p" reads as 5:45 PM. Rating:
the display has a number and a spoken value; a tap chooses, an arrow key moves. Color field: the swatch opens the panel
(fits), focus goes to the chosen accent, the keyboard changes the value, Escape closes and returns focus. Password: Show
Password shows and sets `aria-pressed` without focusing the field, a second press hides; the meter has words. Inline
edit: Escape restores, Enter saves with the previous value, Undo restores.

## Not finished or not verified
- Not run on WebKit / a real iPhone (WebKit is not installed here). On an iPhone, look at: the combobox list above the
  keyboard (the `visualViewport` flip and the scroll-to-top nudge), the one-time code's autofill suggestion from Messages,
  the number field's keyboard (`inputmode`), hold-to-repeat on the steppers, and the upload zone opening the photo picker.
- Locale coverage is English only in the pages: time parsing understands a.m./p.m. in Latin letters, not other scripts.
- The tag input and combobox have no virtualised list: fine for hundreds of options, not thousands.
- The hub (`index.html`) is left to the integrator (it is on the do-not-edit list).
