# Milestones

S4 addition (decision 0053). A road made of steps, with a marker where you are: courses toward a degree, chapters of a
book, payments on a loan. One pill per step, 4dp apart; done steps are filled, the current one is filled as far as you
are and carries the marker (an upright pill, the M3 Expressive slider handle). A stepper says which page of a task you
are on; milestones say how far along a long road you are.

```html
<div class="s4-row" style="justify-content:space-between"><span class="s4-label-large">Road To Graduation</span><span class="s4-body-small">Goal Jun 30</span></div>
<ol class="s4-milestones" aria-label="8 courses, 3 done">
  <li data-state="done" data-label="Composition"></li>
  <li data-state="current" data-value="0.45" data-label="Accounting"></li>
  <li data-label="Statistics"></li>
</ol>
```

| Part / attribute | Values | Default |
|---|---|---|
| `li[data-state]` | `done`, `current`, none (still ahead) | none |
| `li[data-value]` | on the current step: how far through it, 0 to 1 | 0 |
| `li[data-label]` | the step's name, read out and shown as a tooltip ("Accounting, you are here") | — |
| `data-here`, `data-done` | the words added to the current and finished steps | "you are here", "done" |
| `data-ink="current"` | on a colored surface | — |

**Do**
- Say the same thing in words next to it ("3 of 8 courses done").
- Keep it to about 20 steps on a phone; group beyond that.

**Don't**
- Don't label every step under the road; the row above and the line below carry the words.
- Don't make steps tappable here; the list of the same things is where you act.
