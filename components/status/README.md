# Status

S4 addition. A small pill that names the state of a thing: a bill, a payment, a sync. The label always says the status
in words; the tone and the optional dot only reinforce it, so status never relies on color alone.

```html
<span class="s4-status">Paid</span>
<span class="s4-status" data-tone="tertiary">Due</span>
<span class="s4-status" data-tone="error" data-dot>Overdue</span>
<span class="s4-status"><span class="s4-icon" data-icon="check"></span>Paid</span>
```

| Attribute | Values | Default |
|---|---|---|
| `data-tone` | `success`, `warning`, `info`, `error`: the status color's pale container; `primary`, `secondary`, `tertiary`: a 16% wash of the accent with the surface's own text (never the accent's container fill) | neutral: surface-container-high / on-surface-variant |
| `data-dot` | a 6dp leading dot in the text color | — |
| leading `.s4-icon` | a 16dp icon instead of the dot | — |

24 high, 8 side padding, small corners (8), label-medium, tabular figures; words stay whole (a column is sized to them).

**A status is a tint (decision 0065).** Pick tones by meaning and keep them consistent across an app:
- **Neutral** (no tone) for the usual states and for finished work: Paid, Approved, Returned, On Loan, Done. A finished
  state is quiet; it never outshouts the state that needs someone.
- **Warm** only for the one state that needs action now: `error` for late or broken (Overdue, Failed), `warning` for
  soon or waiting on someone (Needs Review, Due Tomorrow). One meaning per tone; don't escalate with more colors.
- `info` and `success` for plain facts that help scanning (In Conservation, Synced); the accent tones (`primary`,
  `secondary`, `tertiary`) are washes for a kind of thing, not a state that needs action.
- Never a filled pill: the page checker and the suite fail a status more than 2:1 from the surface under it (a black,
  white or brand slab reads as a button and is louder than the row it describes).
For bills: Paid and Scheduled are neutral, In Review is warning, Overdue and Failed are error.

**Do**
- Use one or two words in Title Case ("Due", "Payment Failed"); add a date when it helps ("Due Nov 2").
- Put the pill next to the thing it describes (in the row, after the amount).

**Don't**
- Don't make a status clickable; to filter by status, use a filter chip.
- Don't use the error tone for anything that isn't a problem.
- Don't use a badge for status; badges count things.

**Accessibility:** the text is the status, so screen readers read it as is, and it works in grayscale and forced colors
(which draws a border). Container / on-container pairs pass AA in every scheme.

**Tokens:** `--md-sys-color-surface-container-high`, `--md-sys-color-on-surface-variant`,
`--s4-color-{success,warning,info}-container` and their `on-` roles, `--md-sys-color-error-container`, `--md-sys-color-on-error-container`,
`--md-sys-color-{primary,secondary,tertiary}` (the wash, at `--md-sys-state-dragged-state-layer-opacity`), `--md-sys-color-on-surface`,
`--md-sys-typescale-label-medium-*`, `--md-sys-shape-corner-small`, `--s4-space-1`, `--s4-space-2`, `--s4-space-6`.
