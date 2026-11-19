# Rating

Stars in the accent, always with their number beside them: the picture alone is never the only way to read a rating.
A **display** is read-only and shows half steps; an **input** is a group of real radio buttons.

```html
<span class="s4-rating" data-value="4.5" data-count="128"></span>

<fieldset class="s4-rating" data-input data-name="service" data-value="4" data-labels="Poor,Fair,Good,Very Good,Excellent">
  <legend>Rate the Service</legend>
</fieldset>
```

| Attribute | What |
|---|---|
| `data-value` | Display: any number (stars round to halves, the number beside them is the real value). Input: the starting choice (whole). |
| `data-max` | Number of stars (default 5). |
| `data-count` | Display: the number of reviews, shown as “(128)” and spoken. |
| `data-size="l"` | Display: bigger, for a heading. |
| `data-input` on a `<fieldset>` | The input; give it a `<legend>` (shown like a field's label). |
| `data-name` | The radios' name (form value 1 to max). |
| `data-labels` | Words for each value (“Poor,Fair,Good,Very Good,Excellent”), shown beside the stars and spoken. Otherwise “4 of 5”. |
| `data-required`, `data-msg-required` | A rating must be chosen; inside `.s4-form` the message shows under the stars. |
| `disabled` on the fieldset | Locked (a past rating). |
| Script | `S4.rating.set(el, n)`; the input fires `s4-change { value }` (0 when cleared). |

**Input:** hover previews (mouse only), a tap chooses, a tap on the chosen star clears it (unless required). Arrow keys
move through the stars as in any radio group; the stars are 48 wide touch targets, the first lines up with the legend.

**When to use:** reviews and quick feedback. Display: lists of places, products, vendors (beside the name, small).
**Not:** a score that is not a rating (a number, a [stat](../stat/), a [progress ring](../ring/)); a choice between named
options (radios or a button group); half-star input (people cannot aim at half a star on a phone).

**Do** show the count with an average; use words for the input when the scale means something specific.
**Don't** color stars yellow or by score: a star is the accent, empty stars are the 3:1 control gray.

**Accessibility:** the display is `role="img"` named “Rated 4.5 out of 5, 128 reviews”; the input is a `fieldset` of
radios named “Very Good, 4 stars”, with the focus ring on the star. Not color alone: the number or the words are always
beside the stars.

**Tokens:** `--md-sys-color-primary` (filled), `--s4-color-control` (empty), `--s4-size-icon-large` (input stars),
`--s4-size-touch-target`, `--s4-shape-control` (the focus ring's corner). **Motion:** State (a star filling).
