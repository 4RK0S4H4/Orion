# Combobox

A text field that suggests as you type (WAI-ARIA combobox with a listbox popup). The list opens in glass right under
the field, or above it when there is no room (over a phone's keyboard it measures the visible part of the screen). The
part of each option that matches is bold. The cursor never leaves the field: the active option is
`aria-activedescendant`. One value.

```html
<div class="s4-text-field s4-combobox">
  <label for="country">Country</label>
  <input id="country">
  <input type="hidden" name="country">                       <!-- optional: gets the chosen option's value -->
  <template>
    <optgroup label="Europe">
      <option value="pt" data-supporting="Lisbon">Portugal</option>
      <option value="es" data-supporting="Madrid">Spain</option>
    </optgroup>
  </template>
  <div class="s4-text-field-supporting">Where the account is registered.</div>
</div>
```

| Attribute / API | What |
|---|---|
| `<template>` of `<option>` / `<optgroup>` | The options. `value`, `disabled`, `data-supporting` (a second line), `data-icon` (a leading icon). |
| `data-free` | The options are suggestions; any text is the value. Without it only an option may be chosen: other text is invalid ("Choose one of the options in the list.", or `data-msg-option`), shown when you leave the field. |
| `<input type="hidden">` after the text input | Receives the chosen option's `value` (with `data-free`, the text). |
| `S4.combobox.source(field, fn)` | Asynchronous options: `fn(query, signal)` returns a Promise of `[{ value, label, group, supporting, icon }]` (or strings). Shows Searching…, the results, “No matches” or an error with Try Again. |
| `data-min-chars` | Characters before an asynchronous search starts (default 1). |
| `data-loading-text`, `data-empty-text` (`{q}` is the query), `data-error-text` | The notes in the list. |
| `S4.combobox.set(field, value)` | Choose a value from script (no events). |
| Events | `input` and `change` on the input, `s4-change { value, label, item }` on the field, `s4-open` / `s4-close`. |

The trailing button is **Show Options** (a chevron) while the field is empty and **Clear** once it has text: one button,
so focus never falls off the page when it changes. A tap on the field opens a fixed list; an asynchronous one opens
when you type.

**Keyboard:** Down and Up open the list and move through it (wrapping), Alt+Down opens it without moving, Enter
chooses, Escape closes the list (a second Escape clears the field), Tab leaves. With an error showing, Down tries again.

**When to use:** more than about seven options, or options from a server (people, places, products), or a value that may
be new (`data-free`). **Not:** up to about seven fixed options (a select, which opens the same glass list, or radios);
several values (the [tag input](../tag-input/)); a command (the [palette](../palette/)); filtering a page (the [search](../search/) bar).

**Do** name the options as people know them and add a supporting line when two could be confused. Put the list's
`<template>` in the order you want it shown; matches that start with the text come first. **Don't** put actions in the
list, open it on page load or move the cursor into the field from script (decision 0049). Don't add a trailing icon to
the field: that place belongs to the Show Options / Clear button.

**Placement:** an anchored list (Follow), never a dialog. Inside a dialog the list stays inside the dialog's top layer.

**Accessibility:** `role="combobox"`, `aria-autocomplete="list"`, `aria-expanded`, `aria-controls`,
`aria-activedescendant` on the input; the list is a `listbox` labelled by the field's label, groups are `group`s named by
their heading, each option has `aria-selected`. The number of results, Searching… and errors are announced politely.
Inside `.s4-form` it is validated like any field (on blur, `aria-invalid`, the message in the supporting text).

**Tokens:** `--s4-shape-menu`, `--s4-shape-menu-item` (follows the corner dial), `--s4-focus-ring-*`, glass tokens,
`--md-sys-color-secondary-container`. **Motion:** Follow for the list, Bend for the chevron.
