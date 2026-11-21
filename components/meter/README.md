# Meter

S4 addition (decision 0063). How much of something there is, against a whole, a limit or a target: a label, the value
in words, a filled track. Five templates drew one by hand (Tally's runway, Relay's response clock, Pressroom's word
count, Moorings' fleet day, Larkline's storage); this is that element once.

```html
<div class="s4-meter" data-value="7.2" data-max="12">
  <div class="s4-meter-head">
    <span class="s4-meter-label">Runway</span>
    <span class="s4-meter-value"><strong>7.2</strong> of 12 months; safe line at 6</span>
  </div>
  <div class="s4-meter-track">
    <i class="s4-meter-fill"></i>
    <i class="s4-meter-mark" data-at="6" aria-hidden="true"></i>
  </div>
  <div class="s4-meter-scale" aria-hidden="true"><span>Dec</span><span>Nov ’27</span></div>
</div>

<!-- a share of a whole -->
<div class="s4-meter" data-segmented data-max="8" data-size="l">
  <div class="s4-meter-head"><span class="s4-meter-label">On This Phone</span><span class="s4-meter-value"><strong>3.4 GB</strong> of 8 GB</span></div>
  <div class="s4-meter-track">
    <i class="s4-meter-fill" data-value="1.9" data-category="1"></i>
    <i class="s4-meter-fill" data-value="0.8" data-category="2"></i>
  </div>
  <ul class="s4-meter-legend"><li data-category="1">Recordings <b>1.9 GB</b></li><li data-category="2">Guidebooks <b>0.8 GB</b></li><li data-track>Free <b>4.6 GB</b></li></ul>
</div>
```

| Part / attribute | Values | Default |
|---|---|---|
| `.s4-meter` `data-value`, `data-min`, `data-max` | the reading, in the app's own units | 0, 0, 100 |
| `data-state` | `on-track` (success), `near` (warning), `over` (error; the value text turns error too) | the accent |
| `data-segmented` | a share of a whole: fills follow one another with a hairline seam | — |
| `data-steps` | counted units (months, seats, days): the track is cut into that many steps | — |
| `data-size` | `s` 4, default 8, `l` 16, `xl` 32 (fills inset, for ranges on a day) | 8 |
| `data-ink="current"` | on a colored surface: the fill takes the text color, the track a quarter of it | — |
| `.s4-meter-head` | `.s4-meter-label` (label-large, emphasized) and `.s4-meter-value` (body-medium; a `<strong>` inside is the number, title-medium) | — |
| `.s4-meter-fill` `data-value`, `data-from`, `data-category="1…6"`, `data-tone="quiet"` | one fill per series or segment; `data-from` places a range (a booking from 09:00); `quiet` is a second series of the same kind (other people's bookings) | the meter's own value |
| `.s4-meter-mark` `data-at` | a target, a limit or "now": a short line across the track | — |
| `.s4-meter-scale` | ends or ticks under the track, label-small | — |
| `.s4-meter-legend` > `li` | `data-category`, `data-tone="quiet"` or `data-track` (what is left); the amount in `<b>` | — |

`meter.js` turns the values into the fills (`--value`, `--from`, `--at` from 0 to 100 on the track) and gives the meter
`role="meter"` with `aria-valuemin`, `-max`, `-now` and `-valuetext` (the written value), labelled by its label. Change
any `data-value`, `data-max`, `data-from` or `data-at` later and it redraws.

**When to use what**
- A meter is a **reading**: storage used, time left on a promise, words against a target, months of runway.
- A task the app is doing (uploading, syncing) is [progress](../progress/). One share shown big is a [ring](../ring/).
- Something the person sets is a [slider](../slider/). Values compared across many rows or over time are a [chart](../chart/).

**Do**
- Say the value in words beside the track ("8 min left of 1 hour", "3.4 GB of 8 GB"); the track only shows it.
- One series takes the accent; segments take category colors named in a legend (decision 0060).
- Use `data-state` for a limit that matters, and say it in the words too ("20 min late").

**Don't**
- Don't animate a meter: it is a reading, it changes in place.
- Don't use more than six segments; group the rest as "Other".
- Don't restyle the class for a brand: the brand comes through the dials (accent, corners, faces).

**Accessibility:** `role="meter"` with the written value as `aria-valuetext`; marks and scales are decoration
(`aria-hidden`) and their meaning is in the value text; state is never color alone. Forced colors draw the track border
and the fills in CanvasText.

**Tokens:** `--md-sys-color-primary`, `--md-sys-color-surface-container-highest`, `--md-sys-color-outline`,
`--s4-color-success|warning`, `--md-sys-color-error`, `--s4-category-1…6`, `--s4-shape-chip`, `--s4-space-hairline`,
`--md-sys-shape-corner-extra-small`, `--md-sys-typescale-label-large|body-medium|title-medium|label-small|body-small-*`.
