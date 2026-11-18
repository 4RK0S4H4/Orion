# One-Time Code

Four to eight boxes that act as one field, for a verification code, a PIN or a backup code. Underneath is a single real
input, so a phone offers the code from the message it just received (`autocomplete="one-time-code"`), a paste fills
every box at once, and a screen reader hears one field with one label. The boxes only draw its characters.

```html
<div class="s4-text-field s4-code-field" data-length="6" data-group="3">
  <label for="otp">Verification Code</label>
  <input id="otp">
  <div class="s4-text-field-supporting">We sent it to •••• 4021.</div>
</div>
```

| Attribute / API | What |
|---|---|
| `data-length` | Number of boxes, 4 to 8 (default 6). |
| `data-group` | A wider gap after every so many boxes (3 for six, 4 for eight). |
| `data-type="alphanumeric"` | Letters and digits (upper-cased); otherwise digits only. |
| `data-autosubmit` | Submit the form when the last box fills. |
| `data-error="…"` / `data-success` on the field | The result of the app's check: the label and message turn the error color (boxes keep their fill), or the message turns the success color with a check. Typing again clears either. |
| Events | `s4-complete { value }` on the field when the last box fills; `input` on the input. |
| Script | `S4.codeField.clear(field)`. |

The script sets `inputmode` (numeric, or text for letters), `autocomplete="one-time-code"` (keep `autocomplete="off"` for a
PIN), `pattern` and a message for an unfinished code (“Enter all 6 digits.”). Spaces and dashes in a paste are dropped;
anything past the last box is ignored. The caret always sits after the last character.

**Focus:** the box that takes the next character carries the field's marks: a quiet hairline after a tap, the focus
ring from the keyboard. **It never takes focus by itself** (decision 0049), not even on a page that is only this field:
the person taps it, or the phone's suggestion fills it.

**When to use:** a short code sent to the person, a PIN. **Not:** passwords (a text field with the password helpers);
long codes people copy (a plain text field); anything people would want to see while typing in the middle.

**Do** say where the code was sent and how long it lasts; offer “Send a New Code” beside it, not a timer that moves.
**Don't** clear the boxes after a wrong code (people fix one digit), or check while they are still typing.

**Accessibility:** one input with the field's label and supporting text (`aria-describedby`); the boxes are
`aria-hidden`. Errors follow the text field and `.s4-form` (on blur, `aria-invalid`).

**Tokens:** `--s4-shape-text-field` (each box), the field's fill and focus tokens, title-large type, `--s4-color-success`.
**Motion:** State.
