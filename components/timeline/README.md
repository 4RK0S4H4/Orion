# Timeline

S4 addition (decision 0053). When each thing happens along one shared span of time: courses in a term, phases of a
project, bookings in a week. Every row has the same track; its bar sits where the thing starts and ends.

```html
<ol class="s4-timeline" data-now="0.34" aria-label="Course Timeline">
  <li data-start="0" data-end="0.2" data-state="done">
    <span class="s4-timeline-label">Composition</span><span class="s4-timeline-meta">Oct 1 → Oct 19</span>
  </li>
  <li data-start="0.2" data-end="0.46" data-state="current">…</li>
  <li data-start="0.46" data-end="0.7">…</li>
</ol>
```

| Part / attribute | Values | Default |
|---|---|---|
| `li[data-start]`, `li[data-end]` | 0 to 1 of the whole span | 0, 1 |
| `li[data-state]` | `done` (quiet), `current` (accent), none (upcoming) | none |
| `data-now` (on the list) | 0 to 1: draws the "now" marker on every track | — |
| `.s4-timeline-label` | the name (one line, ellipsis) | — |
| `.s4-timeline-meta` | the dates, always written out | — |

Inside a surface that is not a pane, set `--_gap` on the list to that surface's color (the marker's cut-out).

**Do**
- Always write the dates; the bar is the picture, the text is the fact.
- Order rows by start.

**Don't**
- Don't use it for one value (that is progress) or for amounts (that is a bar chart).
