# Charts

A small set of chart styles drawn from the tokens, with the reading aids built in.

```html
<figure class="s4-chart" data-type="column" data-labels="Jun,Jul,Aug" data-values="820,640,910" data-format="currency:USD" data-name="Spending">
  <figcaption class="s4-chart-title">Spending By Month</figcaption>
</figure>

<figure class="s4-chart" data-type="line" data-labels="Jun,Jul,Aug"
        data-series='[{"name":"Income","values":[5200,5200,5600]},{"name":"Spending","values":[3820,3640,3910]}]'>…</figure>
```

| Attribute | Values |
|---|---|
| `data-type` | `column` (default), `bar`, `line`, `area`, `donut`, `spark` |
| `data-labels` | comma-separated category names |
| `data-values` / `data-name` | one series and what it is called |
| `data-series` | JSON: `[{ "name": "…", "values": […] }]`, six series at most |
| `data-format` | `number` (default), `currency:USD`, `percent` |
| `data-total-label` | the word under a donut's total |
| `data-no-table` | drops the Table button (only when the numbers are shown elsewhere on the page) |

Script: `S4.chart(el, { labels, series })` draws or redraws. Charts redraw when their box changes size.

**Which chart**
| The data's job | Use |
|---|---|
| Amounts over time, a few periods | `column` |
| A trend over many points | `line`, or `area` for one series |
| Ranking things with long names | `bar` |
| Parts of one whole, five at most | `donut` |
| Which way a stat is going | `spark` beside the number |
| One number | not a chart: a [stat](../stat/) |

**What every chart gets:** round axis ticks, hairline gridlines, thin marks with rounded data ends (columns 16 wide at most; a wide pane spaces them, decision 0070), a legend when
there are two or more series (none for one: the title names it), one value label on what matters, a tooltip on hover,
tap or arrow keys, and a **Table** button with the same numbers as rows.

**Color:** one series wears the accent (`primary`), so the chart follows the app. Several wear `--s4-chart-1 … 6` in
that fixed order: a set checked for color-blind separation on Orion's light and dark surfaces. Text never wears a
series color.

**Do** title the chart with what it shows, in Title Case; give money and percent a `data-format`.
**Don't** use two different y-scales in one chart (make two charts); don't use more than six series (group the rest
as "Other"); don't use a donut for more than five parts; don't use the status colors for series.

**Accessibility:** the SVG is an image with a spoken summary; it takes focus and the arrow keys walk its points,
announcing each; the Table button gives the full data.
**Tokens:** `primary`, `--s4-chart-1…6`, `outline-variant`, `on-surface`, `on-surface-variant`, `inverse-surface`,
label type scale. **Motion:** State (marks dim on hover).
