# Time Field

Type a time any way you like (“9”, “930”, “9:30 pm”, “21.30”) or pick one from a short list in the glass menu. Times
are shown in the page's language (“9:30 AM” or “09:30”) and stored as `HH:MM`. Pairs with the
[date picker](../date-picker/) for a date and time, and with itself for a range. **No clock dial:** typing and a short
list are quicker with a finger, a mouse or a keyboard.

```html
<div class="s4-text-field s4-time-field" data-step="30" data-min="08:00" data-max="18:00">
  <label for="slot">Delivery Slot</label>
  <input id="slot" value="09:30">
  <input type="hidden" name="slot">                          <!-- gets "HH:MM" -->
  <div class="s4-text-field-supporting">Between 8 AM and 6 PM.</div>
</div>

<!-- date and time -->
<div class="s4-date-time">
  <div class="s4-text-field"><label for="d">Meeting Date</label><input id="d" type="date"></div>
  <div class="s4-text-field s4-time-field"><label for="t">Time</label><input id="t"></div>
</div>

<!-- a range: the end names its start -->
<div class="s4-time-range">
  <div class="s4-text-field s4-time-field" id="from-field"><label for="from">From</label><input id="from"></div>
  <div class="s4-text-field s4-time-field" data-range-start="from-field"><label for="until">Until</label><input id="until"></div>
</div>
```

| Attribute | What |
|---|---|
| `value` on the input | A starting time, `HH:MM` (or anything the field can read). |
| `data-step` | Minutes between times in the list (default 30, at least 5). Typed times need not be on a step. |
| `data-min`, `data-max` | `HH:MM`. The list keeps inside them; a typed time outside is an error. |
| `data-hour-cycle="12"` / `"24"` | Force 12 or 24 hours; otherwise the page's language decides. |
| `data-range-start="id"` | On an end field: its list starts after the start time, each choice says how long (“1 h 30 min”), and an end at or before the start is an error. |
| `data-msg-time`, `data-msg-range` | Messages (defaults: “Enter a time like 9:30 AM.”, “Choose a time from 8:00 AM to 6:00 PM.”). |
| Script | `S4.timeField.value(field)` (minutes since midnight or null), `S4.timeField.set(field, 'HH:MM')`, `S4.timeField.parse(text)`; `s4-change { value, minutes }` on the field. |

**Typing:** “9” is 9:00, “930” is 9:30, “9:30 pm”, “9p”, “21.30” and “21h30” all work. Typing narrows the list (“93” shows
9:30 AM and 9:30 PM) and a typed time that is not on the list is offered first. On blur or Enter the text is tidied into
the page's format.

**Keyboard:** Down and Up open the list at the current time and move through it, Enter chooses, Escape closes, Tab
leaves. The clock button opens the list for a pointer and is out of the Tab order.

**When to use:** a time of day: reminders, slots, opening hours, a meeting. **Not:** a duration (a number field with a
unit); a date and time far apart in a list of events (show them as text).

**Accessibility:** a `combobox` with a `listbox` of times (the combobox's list), labelled by the field's label; the cursor
stays in the field (`aria-activedescendant`). Errors follow the text field and `.s4-form`.

**Tokens:** the text field's and the combobox list's. **Motion:** Follow (the list).
