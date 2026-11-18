# Number Field

A number with minus and plus in one Quiet Box (WAI-ARIA spinbutton). Same height, label and supporting text as every
field; the value sits in the middle in tabular figures, next to its unit. Tap to step, hold to keep stepping (faster
after a moment), or type.

```html
<div class="s4-text-field s4-number-field">
  <label for="guests">Guests</label>
  <input id="guests" value="2" data-min="1" data-max="12">
  <span class="s4-text-field-affix" data-suffix>people</span>
  <div class="s4-text-field-supporting">Up to twelve.</div>
</div>

<!-- in a list or cart row -->
<span class="s4-text-field s4-number-field" data-inline><input aria-label="Quantity of Oat Milk" value="2" data-min="0" data-max="20"></span>
```

| Attribute (on the input) | What |
|---|---|
| `data-min`, `data-max` (or `min`, `max`) | The limits. The steppers stop at them (and are disabled there); typing past them is an error on blur. |
| `data-step` (default 1) | How far a stepper or an arrow key moves; typed values snap to it on blur. Its decimals set how the value is shown. |
| `data-page-step` | Page Up / Page Down (default ten steps). |
| `data-decimals` | Always show this many decimals (money: 2). |
| `data-no-grouping` | No thousands separator (years, codes). |
| `data-msg-min`, `data-msg-max`, `data-msg-number` | Messages; the defaults say the range (“Enter 1 to 8.”). |
| `data-inline` (on the field) | The small quantity stepper (40 high, buttons 32, no label above: give the input an `aria-label`). |
| Affixes | `.s4-text-field-affix[data-prefix]` / `[data-suffix]` for the unit ($, kg, people). |
| Script | `S4.numberField.value(field)` (a number or null), `S4.numberField.set(field, n)`; `s4-change { value }` on the field, `input` and `change` on the input. |

The input is `type="text"` with `role="spinbutton"` (a browser's number input has its own spinners, eats scroll and
cannot show “1,240”); the script sets `inputmode` (numeric, decimal, or the full keyboard when negatives are allowed,
since a phone's number pad has no minus sign), `aria-valuenow`, `aria-valuemin`, `aria-valuemax` and `aria-valuetext`
(“$4.50”, “2 people”). Values are read and written in the page's language (`lang`): “1.234,5” in Portuguese.

**Keyboard:** Up and Down step, Page Up and Page Down by the page step, Home and End go to the minimum and maximum, Enter
tidies what was typed. The minus and plus buttons are out of the Tab order (the field takes the keys) and never move
the cursor into the field, so tapping them on a phone does not raise the keyboard.

**When to use:** small counts and amounts people nudge (guests, quantity, retries, a tip). **Not:** long numbers people
type but never nudge (an amount of money in a form, a card number: a plain text field with `inputmode`); a value on a
continuous scale (a slider); a rating (the [rating](../rating/)).

**Do** put the unit beside the value, not in the label; keep limits real and say them in the supporting text. **Don't**
use the inline stepper outside a row that names what it counts.

**Accessibility:** spinbutton semantics on the input; the buttons are named “Increase Guests” / “Decrease Guests”; when
a button changes the value without the field focused, the new value is announced politely. Errors follow `.s4-form`
(on blur, `aria-invalid`, the message in the supporting text).

**Tokens:** the text field's, `--s4-size-icon-button`, `--s4-size-button-small` (inline buttons).
**Motion:** State only (the buttons' press layer).
