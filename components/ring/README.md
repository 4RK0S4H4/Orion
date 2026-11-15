# Ring

S4 addition (decision 0053). One share of a whole, with what it means written in the middle: degree progress, a daily
goal, storage used. The big sibling of circular progress and drawn the same way: a thick round-capped arc, a gap, then
the track. Use progress for "something is working"; use a ring for "this is how far you are".

```html
<div class="s4-ring" data-value="0.36" aria-label="Degree Progress">
  <span class="s4-ring-value">36%</span>
  <span class="s4-ring-label">Complete</span>
</div>
```

| Part / attribute | Values | Default |
|---|---|---|
| `data-value` | 0 to 1; changing it later animates the arc (Ink) | 0 |
| `data-size` | `s` (72, value only), default (112), `l` (160) | default |
| `data-ink="current"` | on a colored surface: the arc takes the text color, the track a quarter of it | — |
| `.s4-ring-value` | the number, emphasized, tabular | — |
| `.s4-ring-label` | one or two words under it | — |
| `--s4-ring-size` | any size | 112 |

`ring.js` draws the SVG and sets `role="progressbar"`, `aria-valuenow` and `aria-valuetext` (the written value).
Always give it an `aria-label`.

**Do**
- Write the value in the middle; a ring with nothing in it is a circular progress.
- One ring per screen region. Several values side by side are stats or a chart.

**Don't**
- Don't put a marker dot, a second arc or an icon on the ring.
- Don't use it for something still loading (that is progress).
