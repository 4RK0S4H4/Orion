# Button

Starts an action. M3 Expressive buttons: five variants, five sizes, round or square, with a shape morph on press.

```html
<button class="s4-button" type="button"><span class="s4-icon" data-icon="add"></span>Add Bill</button>
<button class="s4-button" data-variant="tonal" type="button">Export</button>
<button class="s4-button" data-variant="elevated" data-size="xs" type="button">Filter</button>
<button class="s4-button" data-toggle aria-pressed="false" type="button">Autopay</button>
<button class="s4-button" data-color="error" type="button">Delete All Data</button>
```

| Attribute | Values | Default |
|---|---|---|
| `data-variant` | `filled`, `tonal`, `elevated`, `text` (the old `outlined` still works as an alias and draws a filled button; nothing is outlined, decision 0023) | `filled` |
| `data-size` | `xs` (32), `s` (40), `m` (56), `l` (96), `xl` (136) | `s` |
| `data-shape` | `round`, `square` | `round` |
| `data-color` | `error` (destructive) | — |
| `data-toggle` + `aria-pressed` | toggle button; `data-label-on/off`, `data-icon-on/off` swap label and icon | — |

**When to use what:** one **filled** button for the most important action in an area; **tonal** for a strong secondary
action; **elevated** or **text** for the rest (decisions 0068, 0070); **elevated** when a button needs to read as raised: its fill is one step above whatever it sits on (the page, a card, a
pane, a menu), a tenth of the text color mixed into that surface, so it works in light and dark and on both a page and a card (Orion has no shadows).

**Do**
- Use Title Case labels that say what happens: "Save Changes", "Export to Excel".
- Put the icon before the label.
- Use `data-color="error"` only for a destructive answer: in a dialog and in a danger zone it is `data-variant="tonal"
  data-color="error"` (decisions 0064, 0066). A filled red button is louder than the question it leads to.

**Don't**
- Don't put two filled buttons side by side; make one tonal.
- Don't grey out the main action when there's nothing to do; hide it or explain why.
- Don't color every row's delete button red; a per-row delete is a plain icon button.

**Accessibility:** every size keeps a 48dp touch target; focus shows the M3 ring; disabled buttons use M3's 12% / 38%
opacities; forced-colors mode draws a real border. Icon-only actions use the [icon button](../icon-button/), which needs
an `aria-label`.

**Tokens:** `--s4-shape-button`, `--s4-shape-button-pressed`, `--s4-size-button*`, `--md-sys-typescale-label-large-*`,
`--md-sys-motion-spring-fast-spatial` (shape morph), `--md-sys-state-*`.
