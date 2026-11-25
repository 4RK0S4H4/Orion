# Button Group

Groups related buttons. A **standard** group reacts as one when pressed; a **connected** group is one control for
choosing a value: the **Ink Track** (decision 0059), one filled track with the options on it and a neutral ink pill that
slides to the choice (decision 0082: the accent is left for the navigation's selection and the main action).

**Button group, tabs or chips?** If it swaps what is on the screen, it is [tabs](../tabs/). If it changes a value or how
the same thing is shown, it is a button group. If it narrows a collection and there can be many, it is
[chips](../chip/).

```html
<!-- standard: actions -->
<div class="s4-button-group">
  <button class="s4-button" data-variant="tonal" type="button">Edit</button>
  <button class="s4-button" type="button">Mark Paid</button>
</div>

<!-- connected, single select: a value -->
<div class="s4-button-group" data-connected data-select="single" aria-label="Period">
  <button class="s4-button" type="button" value="week">Week</button>
  <button class="s4-button" type="button" value="month" aria-pressed="true">Month</button>
  <button class="s4-button" type="button" value="year">Year</button>
</div>

<!-- connected, several at once, icons -->
<div class="s4-button-group" data-connected data-select="multi" data-fit="content" aria-label="Attach">
  <button class="s4-icon-button" type="button" value="photos" aria-label="Photos" aria-pressed="true"><span class="s4-icon" data-icon="image"></span></button>
  <button class="s4-icon-button" type="button" value="links" aria-label="Links"><span class="s4-icon" data-icon="link"></span></button>
</div>
```

| Attribute (on the group) | Values | Default |
|---|---|---|
| `data-connected` | the Ink Track: a filled track (`surface-container-highest`, 4dp padding, corner concentric with the options) holding the options as words; the selected option is the neutral ink (`on-surface` at `--s4-selection-neutral-opacity` over the track, `on-surface` label, decision 0082) | standard: buttons 8dp apart |
| `data-select` | `single` (exactly one pressed, radio-like: the ink slides), `multi` (each toggles: each selected option fills in place, selected neighbours fuse into one pill) | none: plain buttons |
| `data-fit` | `content`: as wide as the labels (never stretched by its parent) | connected groups stretch to fill (equal weights) |
| `aria-label` | names the choice ("Period") | — |

Children are `.s4-button` or `.s4-icon-button`; the group follows their `data-size` (xs 32, s 40, m 56, l 96, xl 136).
In a connected group their `data-variant` does not matter: every option is words on the track. Standard groups have
the M3 Expressive press interaction: the pressed button widens ~15% while its neighbours give way.

**Behaviour** (`button-group.js`): manages `aria-pressed` for `data-select`, fires `s4-change { value, values, button }`
on the group (`value` is the pressed button's `value` attribute, or the array of values for multi). Connected and
selecting groups are one tab stop (roving tabindex): Arrow keys move focus (RTL aware), Home / End jump, Space / Enter
press; disabled buttons are skipped. Groups get `role="group"`.

**From script:** `S4.buttonGroup.set(group, 'month')` (an array for `data-select="multi"`) presses that option, moves the
tab stop and slides the ink, and fires no `s4-change`, so a group can follow something the page knows (the line type
under the caret, a value restored from storage) without a loop. `S4.buttonGroup.value(group)` reads it. Setting
`aria-pressed` yourself also moves the ink, but `set` keeps exactly one option pressed in a single group.

**The ink** (connected groups while at most one option is pressed): one pill behind the options, placed by script over
the pressed option whoever changed `aria-pressed` (a click, the keyboard, a page script). It is drawn twice, the front
copy on Ink (`--s4-motion-ink`) and the back copy on calm Ink (`--s4-motion-ink-calm`), so the edge in the direction of
travel leads and the other trails, then they land together. Reduced motion: it jumps. Calm energy: both copies move
alike. A lively overshoot is clipped to the track. Without script the selected option paints its own pill. When a
group wraps (larger text, a narrow pane), options keep their full label width and the ink moves between rows; a fused
run of selected options never joins across a row break.

**When to use what:** connected + `single` for 2 to 5 short, fixed options that set a value or change how the same
content is shown (Week / Month / Year on a chart, list or grid, units, alignment); a pair (Monthly / Yearly) is the same
form with two options. Connected + `multi` for independent options shown together (formatting, attachments). Standard
for a set of related actions. A toolbar of actions can be connected (`role="toolbar"`).

**Do**
- Give each button a `value` and the group an `aria-label`; icon options need their own `aria-label`.
- Keep labels short and parallel; use the same size for every button in a group.

**Don't**
- Don't use a button group to swap panels of content (`aria-controls` pointing at a panel, a script that shows one
  region and hides another): that is tabs. The page checker and the suite fail on it.
- Don't put more than five options in a connected group; use a select or chips.
- Don't make it scroll; it wraps.

**On glass** (inside a glass bar, panel, menu or dialog): items on glass are tints (decision 0043). The glass is the
track (no fill of its own: a fill under the ink would stack two tints); the ink is `on-surface` at
`--s4-glass-fill-selected-opacity` (neutral, decision 0082); every label is `on-surface`. `scripts/check-glass.mjs` proves
that neutral tint for every scheme, and `scripts/check-accent.mjs` proves the label on the neutral ink off glass.

**Accessibility:** buttons stay native `<button>`s with `aria-pressed`; one tab stop per group with arrow keys; the
focus ring stays above the neighbours; selection shows as fill and label color, never color alone. Forced colors: the
track and every option get a border; the selected option is `Highlight` with `HighlightText`.

**Tokens:** `--s4-space-1` (track padding), `--s4-space-2` (standard gap), `--s4-shape-control` (option corner, clamped to
half the height; the track adds its padding), `--md-sys-color-surface-container-highest` (track),
`--md-sys-color-on-surface-variant` (labels), `--md-sys-color-on-surface` and `--s4-selection-neutral-opacity` (ink and its label), `--s4-motion-ink`,
`--s4-motion-ink-calm` (the ink), `--s4-motion-morph` (press and fusing corners), `--s4-motion-state` (colors),
`--s4-glass-fill-selected-opacity` (on glass), plus the button and icon-button tokens.
