# Glass

The glass layer (decisions 0004, 0021, 0034 to 0037, 0043, 0064, 0080). `glass.css` loads after the components and turns
floating chrome into very clear glass; components never write it themselves. The full rules, numbers and fallbacks are in
[`docs/foundations/glass.md`](../../docs/foundations/glass.md).

```html
<div class="s4-glass">…a floating thing of the app's own…</div>
<div class="s4-toolbar" data-glass="off">…solid again…</div>
```

| What | Gets |
|---|---|
| Floating: menus, FABs, the floating toolbar, tooltips, snackbars, rich tooltips, floating panels, dialogs, `.s4-glass` | tint 75% (modal 90%, 96% on a phone), blur 8, saturate 150%, a thin rim top and bottom, and a soft glow (or an ink shade on a light surface) just inside it |
| Docked: the top app bar once content scrolls under it, the site header, the nav bar, a docked toolbar | the tint and the blur and one hairline on the edge that faces the content (0064) |
| High contrast, reduced transparency, no `backdrop-filter`, `data-glass="off"` | solid |

**The glow scales with the surface** (decision 0080): 0.144 on dark glass, 0.168 as a shade on light glass, reaching 15%
of the surface's height (`--s4-glass-glow-ratio`), 3 to 12px (`--s4-glass-glow-size`):

| Surface | Least height it names (`--_glass-h`) | Depth |
|---|---|---|
| Tooltip | `2 × space-1` + body-small line (24) | 3.6 |
| Snackbar | touch target (48); `glass.js` measures it once laid out (52 with one line) | 7.2, then 7.8 |
| FAB, extended FAB | its `--_h`: 56, 80, 96 | 8.4, 12, 12 |
| Glass toolbar (horizontal, or vertical with one tool) | `size-toolbar` (64) | 9.6 |
| Menu with one item | `2 × space-2` + touch target (64) | 9.6 |
| Rich tooltip without actions | `space-4` + `space-3` + body-medium line (48) | 7.2 |
| Composer (`.s4-composer.s4-glass`) | touch target + `2 × space-1` (56) | 8.4 |
| Menus of two items or more, rich tooltips with actions, panels, dialogs, the site's phone panel | (none: tall) | 12 |
| An app's own `.s4-glass` | measured by `glass.js` (ResizeObserver, layout height) | 15%, 3 to 12 |

The heights come from size tokens, so compact density, the scale dial and text size change them with no script.
`--_glass-h` never inherits. A component whose short height is new names it in its own stylesheet.

**Do**
- Use `class="s4-glass"` for something of your own that floats over content; `glass.js` sizes its glow.

**Don't**
- Don't set `--s4-glass-glow-ratio`, `-size`, `-alpha` or `-shade-alpha` in an app: the page checker and the suite fail
  a glow deeper than 15% of its surface plus 1px (`tests/fixtures/bad-glow.html`).
- Don't put glass on content (cards, lists, panes, fields) or give a docked bar a rim or a glow.

**Accessibility:** text on glass is `on-surface`, proven at 4.5:1 over any backdrop for every seed by
`scripts/check-glass.mjs`, and FAB labels likewise; the glow only gets weaker, so the proof is unchanged.
