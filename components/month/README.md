# Month

S4 addition (decision 0053). A month you read, with marks on its days. The date picker is for choosing a date; this is
for seeing a plan: what is due, when you are busy, the day that must not be missed.

```html
<div class="s4-month" data-month="2026-11" data-legend aria-label="Schedule"
     data-marks='{"2026-11-18":"dot","2026-11-26":"band","2026-11-27":"band","2026-11-30":"flag"}'
     data-mark-labels='{"dot":"Course Due","band":"Busy","flag":"Deadline"}'></div>
```

Four marks, all filled (nothing outlined, nothing hatched):

| Mark | Looks like | Means |
|---|---|---|
| today | the accent circle | set by itself (or `data-today`) |
| `dot` | a small accent dot under the number | something happens that day |
| `band` | a tonal band; days in a row join into one capsule | a stretch of time: busy, away, booked |
| `flag` | a filled error-tone circle | the day that must not be missed |

| Attribute | Values | Default |
|---|---|---|
| `data-month` | `YYYY-MM` | this month |
| `data-marks` | JSON, date to mark(s), space separated | — |
| `data-mark-labels` | JSON, mark to words (read out, and the key) | — |
| `data-legend` | draws the key under the grid | — |
| `data-week-start` | `0` Sunday, `1` Monday | 0 |
| `data-min`, `data-max` | `YYYY-MM`: how far you can page | — |

Tapping a day presses it and fires `s4-select` (`{ date, marks }`); show what is on that day right below the month
(placement ladder: in place first). Paging fires `s4-month`. `S4.month.set(el, { month, marks, today })`,
`S4.month.select(el, date)`. Arrow keys move between days.

**Do**
- Keep the same marks meaning the same thing across the app, and show the key.
- Pair it with a list of the same things (a calendar is never the only way to read a plan).

**Don't**
- Don't add a fifth mark; if a day needs more, say it in the line that opens when it is tapped.
- Don't use it to pick a date for a field (that is the date picker).
