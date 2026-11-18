# Color Field

A swatch and its hex code in one Quiet Box. The swatch opens a small glass panel with the named accents (the
[swatches](../swatches/)) and a hue slider; the code can be typed. Made for “pick your accent” settings: with
`data-theme-seed` it themes the page as people choose.

```html
<div class="s4-text-field s4-color-field" data-theme-seed>
  <label for="accent">Accent Color</label>
  <input id="accent" name="accent" value="#4f46e5">
  <div class="s4-text-field-supporting">Used for buttons, selection and focus.</div>
</div>

<!-- your own accents -->
<div class="s4-text-field s4-color-field">
  <label for="c">Project Color</label><input id="c" value="#00796b">
  <template>
    <button class="s4-swatch" type="button" data-seed="#00796b" aria-label="Teal"></button>
    <button class="s4-swatch" type="button" data-seed="#c2185b" aria-label="Rose"></button>
  </template>
</div>
```

| Attribute / API | What |
|---|---|
| `value` on the input | A hex code (`#4f46e5`, `4F46E5`, `#46e`). Shown upper-case. |
| `data-theme-seed` | Choosing a color calls `S4.theme({ seed })` (Mono is `seed: null`), and the field follows the theme when it changes elsewhere. |
| `<template>` of `.s4-swatch` | The accents in the panel (named with `aria-label`); otherwise Mono, Indigo, Blue, Teal, Green, Amber, Rose, Purple. |
| `data-msg` on the input | The message for a code that is not a color (default “Enter a color like #4F46E5.”). |
| Script | `S4.colorField.value(field)`, `S4.colorField.set(field, '#hex')`; `s4-change { value }` on the field, `input` and `change` on the input. |

**The panel** is anchored glass that follows the swatch (Follow): focus goes to the chosen accent (arrow keys move
between accents, as in any swatch group), Tab reaches the hue slider, Escape or a tap outside closes it and gives
focus back to the swatch. The hue slider keeps the color's saturation and lightness and turns its hue (a gray starts
from a middle tone).

**When to use:** an app's accent, a label or project color. **Not:** choosing from a few fixed colors only (the swatches
alone); a full color editor with alpha and spaces (out of scope); the theme of the whole system in Orion's showcase
(the brand dials).

**Do** name every accent; keep 4 to 8 of them. **Don't** use the field for status (status colors are fixed tokens) or let
people pick text colors that fail contrast: with `data-theme-seed`, `S4.theme` keeps every role readable.

**Accessibility:** the swatch is a button named with the field and the color (“Choose Accent Color: Indigo”), with
`aria-haspopup="dialog"` and `aria-expanded`; the panel is a labelled dialog; the slider says its degrees. The code is
the text equivalent of the color. Errors follow the text field and `.s4-form`.

**Tokens:** `--s4-shape-control` (the swatch), `--s4-shape-menu` (the panel), glass tokens, `--s4-size-touch-target`.
**Motion:** Follow (the panel), State.
