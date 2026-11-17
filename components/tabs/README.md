# Tabs

Move between different panels of content within one screen: a bill's Details, Payments and Notes; a workspace's
Overview, Activity and Files. Tabs belong to the **navigation family** with the nav bar and the nav rail (decision
0059, amending the Segmented Tray of 0009): no tray, the labels sit on the surface, and the selected tab gets the same
neutral indicator the nav bar and rail use, sliding from tab to tab; its label steps up in weight.

**Tabs, button group or chips?** If it swaps what is on the screen, it is tabs. If it changes a value or how the same
thing is shown (Week / Month / Year on a chart, list or grid), it is a [button group](../button-group/). If it narrows a
collection and there can be many, it is [chips](../chip/).

```html
<div class="s4-tabs" role="tablist" aria-label="Bill">
  <button class="s4-tab" type="button" role="tab" id="tab-details" aria-controls="panel-details" aria-selected="true">Details</button>
  <button class="s4-tab" type="button" role="tab" id="tab-payments" aria-controls="panel-payments" aria-selected="false">Payments</button>
</div>
<div class="s4-tab-panel" role="tabpanel" id="panel-details" aria-labelledby="tab-details">…</div>
<div class="s4-tab-panel" role="tabpanel" id="panel-payments" aria-labelledby="tab-payments" hidden>…</div>
```

| Attribute | Values | Default |
|---|---|---|
| `data-variant` | `secondary`: inside a pane or card. Smaller (32dp indicator, label-large) and quieter (the indicator is a 12% tint of the text color over whatever it sits on), icons inline | primary: 40dp indicator in `secondary-container`, title-small, icons stacked above the label |
| `data-scrollable` | adds scroll padding so the selected tab scrolls clear of the edge (any row scrolls sideways when the tabs do not fit; it never wraps) | — |
| `aria-selected` | `true` on the current tab | first tab |
| `aria-controls` | id of the tab's panel: **required**, every tab has a panel | — |
| icon | `<span class="s4-icon" data-icon="…">` before the label: stacked in primary (the indicator holds icon and label, as in the nav bar), inline in secondary | — |

Tabs sit at the start of the row and are as wide as their labels (16dp each side; 12 in secondary). The indicator's
corner is the nav indicator's (`--s4-shape-nav-indicator`, clamped to half its height), so it follows the corner dial.

**When to use what:** **primary** tabs right under the top app bar to organize the whole screen; **secondary** tabs
inside a pane or card to divide it further. Many tabs on a phone: the row scrolls (add `data-scrollable`).

**Behaviour (`tabs.js`):** one indicator slides between tabs on the Ink pattern, measured to the selected tab's box.
Each label's text is wrapped in `.s4-tab-label` (`data-text` holds it) so the heavier selected weight never changes the
tab's width or moves its neighbours. Panels switch with the shared axis pattern (Switch): the old panel slides 30px away
and fades out, the new one slides in from the side of the newly selected tab. Keys: Left / Right (wrapping, RTL aware),
Home / End, with automatic activation and a roving tabindex. Fires `s4-change { tab, index, panel }` on the tab list.
Missing ids, roles and `aria-labelledby` are filled in. Without JS each selected tab paints its own indicator.

**Do**
- Use short Title Case labels (one or two words) and keep the tab order stable.
- Put tabs at the top of the content they switch; give every tab a panel.

**Don't**
- Don't use tabs to set a value or change how the same content is shown (a period, a unit, list or grid): that is a
  button group. Tabs without panels fail the page checker and the suite.
- Don't use tabs for a sequence of steps (a stepper) or for actions.
- Don't nest primary tabs inside primary tabs; use secondary tabs.

**Accessibility:** WAI-ARIA tabs pattern; the tab list is one tab stop and panels are focusable. Selected shows as the
indicator, the label color and a heavier weight (and a solid icon), not color alone. Inner focus ring so a scrolling
row never clips it; the 48dp touch target sits inside the row's padding. Forced colors: the indicator is `Highlight`
and the selected label `HighlightText`.

**Tokens:** `--s4-size-button` / `--s4-size-button-small` (indicator height), `--s4-size-touch-target`,
`--s4-shape-nav-indicator`, `--md-sys-typescale-title-small-*` and `--md-sys-typescale-label-large-*` (labels; the
`emphasized` weights when selected), `--md-sys-color-secondary-container` / `on-secondary-container` (primary
indicator), `--md-sys-color-on-surface` (secondary indicator tint and label), `--md-sys-color-on-surface-variant`
(labels at rest), `--s4-motion-ink` (indicator), `--s4-motion-state` (label color), the Switch pattern
(`S4.transition.sharedAxis`) for panels.
