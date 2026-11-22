# Shape

**Tokens:** `--md-sys-shape-corner-*` (scale) and `--s4-shape-*` (which step each component uses) · live:
[tokens page](https://4rk0s4h4.github.io/Orion/tokens/#shape)

Orion uses the **stock M3 Expressive corner scale** (decision 0001: Shape A): none 0, extra-small 4, small 8, medium 12,
large 16, large-increased 20, extra-large 28, extra-large-increased 32, extra-extra-large 48, full.

- Components use `--s4-shape-<component>`, which points at a step of the scale, so a component's corner is set in one place.
- **Buttons are pills that square off while pressed** (full → large): M3 Expressive's shape morph, animated with the
  fast-spatial spring. Never inside a rounded container (decision 0043).
- **The corners dial** (decision 0055): everything you click reads `--s4-shape-control`, clamped to half its height.
  `S4.theme({ corners })`: `round` (pills, the default), `soft` (14), `firm` (10). Never below 10, never sharp. Fields
  stay less round than controls, and containers of controls follow (concentric). In a component, write a control's
  corner as `min(calc(var(--_h) / 2), var(--s4-shape-control))`, never as `corner-full`.
- **Text fields** (the Quiet Box) round all corners at `--s4-shape-text-field` (medium, 12dp).
- **No sharp corners** anywhere a hover or press layer shows (decision 0025): list rows 16, segments 12.
- **Nested corners are concentric** (decision 0052): inner radius = outer radius minus the gap, or a full pill.
- Nothing docks to a screen edge (decision 0043): panels float clear of every edge, so no corner is squared off for one.
- Don't invent radii in app CSS; pick a step from the scale.

## Corners on a container
`data-corners="round|soft|firm"` works on any element and nests (decision 0055 dial, round 0056): every shape alias
re-resolves on that element, so a firm panel inside a round app is firm inside and still concentric.
`data-corners="round"` brings stock corners back inside a branded page.
