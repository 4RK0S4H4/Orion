# Tag Input

Several values in one field (a multi-select). Each chosen value is an input chip inside the Quiet Box and the cursor
sits after them. The box grows a line at a time and keeps its corners; the label and supporting text never move.
Suggestions open in the same glass list as the [combobox](../combobox/).

```html
<div class="s4-text-field s4-tag-input" data-name="labels" data-values="Taxes, Household" data-max="5" data-create>
  <label for="labels">Labels</label>
  <input id="labels">
  <template><option>Taxes</option><option>Household</option><option>Urgent</option></template>
  <div class="s4-text-field-supporting">Up to five.</div>
</div>
```

| Attribute / API | What |
|---|---|
| `<template>` of `<option>` | Suggestions (`value`, `data-supporting`). Already chosen ones are left out of the list. |
| `data-create` | People may add their own values: Enter or a comma adds what was typed, and “Add “…”” is offered first in the list. Without it (and with suggestions) only suggestions can be added. A field with no suggestions always creates. |
| `data-values` | The starting values, comma-separated. |
| `data-name` | Each value is a hidden input with this name inside its chip (FormData gives an array). |
| `data-max` | A counter (“2 / 5”) under the field; past it nothing is added and the reason is announced. |
| `data-noun` | What the values are, for announcements (“Removed Taxes.”, “You can add up to 5 labels.”). |
| `required` on the input | At least one value; the message (`data-msg-required`) shows on blur, inside `.s4-form` or not. |
| `S4.tagInput.source(field, fn)` | Asynchronous suggestions: `fn(query)` returns a Promise of `[{ value, label, supporting }]`. |
| `S4.tagInput.values(field)`, `S4.tagInput.set(field, list)` | Read or replace the values from script. |
| Events | `s4-change { values }` on the field, a cancelable `s4-remove { chip, value }` on a chip before it goes, `change` on the input. |

**Typing:** a comma, a semicolon or Enter adds; pasting “Rent, Car; Gifts” (commas, semicolons, tabs or new lines) adds
each; duplicates are ignored (case and accents too). **Removing:** each chip's remove button (also Delete or Backspace on
it), or Backspace in the empty field for the last chip. A removed chip closes up sideways (Reveal); focus moves to the
next chip's remove button.

**When to use:** labels, recipients, skills, filters someone types: several values from a long or open set. **Not:** a
few fixed options (filter chips or checkboxes, where every option is visible); one value (the combobox).

**Do** keep values short (a chip never truncates a word it can show; very long ones end in an ellipsis). Say the limit in
the supporting text. **Don't** add a leading or trailing icon to the field (the chips and the cursor fill the box), or
use it for free text with commas in it.

**Accessibility:** the chips are a list (“Chosen labels”) before the input; each remove button is named “Remove Taxes”
and is in the Tab order. Additions, removals, duplicates and the limit are announced politely. The input is a
`combobox` with a multi-select `listbox` when there are suggestions. The cursor is never put in the field by script
(decision 0049).

**Focus:** the field's own marks: a quiet hairline inside the box after a tap, the focus ring outside it from the
keyboard (repeated in `tag-input.css` for the input that sits one level deeper).

**Tokens:** `--s4-shape-text-field` (the box), `--s4-shape-chip`, `--md-sys-color-secondary-container` (the chips, so they
stand off the field in both color modes and on glass), `--s4-size-chip`. **Motion:** Reveal (a chip leaving), Follow
(the list).
