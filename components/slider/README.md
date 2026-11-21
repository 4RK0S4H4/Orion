# Slider

Picks a value from a range. M3 Expressive slider on a native `<input type="range">`.

```html
<label for="budget">Monthly Budget</label>
<div class="s4-slider" data-label data-prefix="$">
  <input type="range" id="budget" min="0" max="2000" step="10" value="1240">
</div>
<div class="s4-slider" data-stops data-label data-suffix="%">
  <input type="range" aria-label="Tip" min="0" max="25" step="5" value="15">
</div>
```

| Attribute (on `.s4-slider`) | Meaning |
|---|---|
| `data-label` | value label above the handle while dragging or keyboard-focused |
| `data-stops` | a stop dot for every step (discrete slider) |
| `data-prefix`, `data-suffix` | format the label and `aria-valuetext` ("$1,240", "15%") |
| `min`, `max`, `step`, `value`, `disabled` on the input | native |

16dp track: active primary, inactive secondary-container, 6dp gaps either side of a 4dp × 44dp primary handle (2dp
while pressed); outer track corners round, inner corners 2dp; a stop indicator at the end of the track (primary on the
inactive track, secondary-container on the active one). The value label is an inverse-surface pill.

**Behaviour** (`slider.js`): adds the handle, label and stops; keeps `--_value` (0–1) and `--_steps` in sync; fires
`s4-change { value }` on `.s4-slider` for every change (native `input` / `change` still fire). The native thumb is sized
to match the drawing, so the handle stays exactly under the pointer.

## Value as a heading (decision 0063)

```html
<div class="s4-slider" data-value="heading" data-suffix="%">
  <label for="hyd">Water</label>
  <input type="range" id="hyd" min="55" max="90" value="78">
</div>
<!-- with an exact-value field for big numbers -->
<div class="s4-slider" data-value="heading">
  <label for="jobs">Jobs a Month</label>
  <input type="text" inputmode="numeric" aria-label="Jobs a Month, Exact">
  <input type="range" id="jobs" min="100000" max="20000000" step="100000" value="2400000">
</div>
```

`data-value="heading"` puts the label and the value on one row above the track (the label at the start, the value in
title-large at the end), for a tool where the number is what people read: a recipe's hydration, a calculator's input.
An `<output>` you write yourself is kept; without one, slider.js adds it and fills it with the formatted value. An
`<input type="number">` (or a text input with `inputmode="numeric"`, which shows the number grouped, "2,400,000",
while it is not being typed in) in the slider becomes a paired exact-value field (filled, medium corners) that stays in step
with the range both ways: use it when the range is too large to land on an exact value by dragging.

**Do:** pair with a visible label and, for money, a text field for exact entry; use `data-stops` when only a few values
are valid.
**Don't:** use a slider for precise values or very large ranges.

**Accessibility:** the native range input is on top (invisible), so drag, click, arrow keys / Page Up / Home / End and
screen readers are native; focus ring on the handle; 48dp tall target.

**Tokens:** `--md-sys-color-primary`, `secondary-container`, `inverse-surface`, `inverse-on-surface`, `--s4-space-*`,
`--md-sys-typescale-label-large-*`, `--md-sys-motion-spring-fast-spatial`.
