<!-- GENERATED copy of docs/foundations/accessibility.md (scripts/build.mjs). Edit the original. -->
# Accessibility

S4 Orion builds accessibility into tokens and components so apps get it without extra work. These are the guarantees, and
the few things an app still has to do.

## Built in

| Area | What S4 Orion does | Where |
|---|---|---|
| Color contrast | 83 pairs pass WCAG AA in light, dark and both high-contrast modes; the build fails otherwise | `scripts/build-tokens.mjs` |
| Contrast on glass | Text on glass is ≥ 4.5:1 over any backdrop for every seed (backdrop compression + `on-surface` only) | `glass.css`, `scripts/check-glass.mjs` |
| Contrast levels | Standard, medium, high; device "more contrast" picks high unless the app chose a level | tokens, `S4.theme({ contrast })` |
| Focus | 3dp `secondary` ring, 2dp outside, on every interactive element (`:focus-visible`) | `base.css` |
| Touch targets | ≥ 48dp on every control, even when the visual is 32 or 40dp | components (`::after` hit areas) |
| Dense maps of real things | `data-dense` on a seat plan, a keyboard, a calendar's cells (never on ordinary controls): each target drawn ≥ 18px and ≥ 24px from the centre of its nearest neighbour (WCAG 2.5.8's spacing rule), arrow keys between them (decision 0063) | the suite's phone pass |
| Reduced motion | Spatial springs become instant; fades remain; JS animations read the same tokens; the reach suite checks nothing keeps looping | tokens, `S4.motion` |
| Reduced transparency | Glass becomes solid (`prefers-reduced-transparency`, `data-glass="off"`, no `backdrop-filter` support) | tokens |
| Forced colors | Decorative layers drop out; buttons, icon buttons, fields, checkboxes and radios keep a real 1px or 2px system-color edge; sliders and switches paint in Highlight. The reach suite checks every control has a boundary | `base.css`, each component |
| Semantics | Native elements underneath (`button`, `input`, `dialog`, `popover`); state in ARIA (`aria-pressed`, `aria-selected`, `aria-current`, `aria-checked`, `aria-expanded`) | every component |
| Keyboard | WAI-ARIA patterns: tabs, menus, button groups and toolbars use arrows/Home/End; dialogs trap focus and return it; Escape closes overlays | component JS |
| Dialog focus | Starts on the first non-destructive action, so Enter never confirms a delete by accident | `dialog.js` |
| Tooltips | Hoverable, dismissible with Escape, linked with `aria-describedby` without replacing existing ids | `tooltip.js` |
| Announcements | Snackbars are announced politely | `snackbar.js` |
| Right-to-left | Set `dir="rtl"` on `<html>` and the whole app mirrors: logical properties everywhere, the rail and menus start on the right, sliders, progress, steppers and switches fill from the inline start, back, next, send and undo icons mirror (`data-mirror` adds another, `data-mirror="off"` keeps one), arrow keys follow the reading direction, swipe and shared-axis motion flip. Charts keep their data axes as drawn. Safe-area insets stay physical | components, `base.css`, `menu.js` |
| Print | Paper is white with dark text whatever the screen scheme (dark tokens apply to screens only). Navigation, FABs, toolbars, snackbars, tooltips and window controls are hidden; glass is solid; cards, panes, rows and figures never split across sheets; tables are tables at any width with the header repeated; prose uses the full sheet and prints the address after its links (only there). Mark anything else screen-only with `data-s4-print="hide"` | `components/base/print.css` |
| Larger text | Buttons, FABs, chips, status labels, list rows, nav items and the nav bar grow with larger text or long labels and never clip them; groups and tab strips wrap or scroll instead of overlapping; long words break (`overflow-wrap: anywhere`) instead of widening the page. Initials in an avatar stay inside the disc. The type scale stays in px (M3 dp), so what is proven is text-only zoom, not a rem scale | components |
| Reflow | No sideways scroll at 320 CSS px (a 1280 window at 400% zoom) | reach suite |
| Keyboard | Every control Tab can reach shows a focus ring of at least 2dp and 3:1 against what is behind it (also on glass, on the accent fill and in vibrant toolbars), and focus order follows the reading order | `base.css`, reach suite |

## What the suite proves
`npm run test:reach` (`tests/reach.mjs`) loads the showcase, every template and every component page and checks: right-to-left
(no sideways scroll, rail on the right, leading icons before text, menus, panels and tooltips inside the screen), print
(light on white, no glass, no chrome, tables as tables), 200% text-only zoom and 320px reflow (no clipping, overlap or
sideways scroll), forced colors (every control has a boundary), reduced motion, and the keyboard (everything reachable,
ring contrast, order). New components are covered by selectors, not by edits to the suite.

## The app's job
- Give every icon-only control an `aria-label` (icon buttons, FABs without a label).
- Label every field with a real `<label>`; put errors in the supporting text and set `aria-invalid="true"`.
- Use headings in order; give each view one `h1` (usually the top app bar title).
- Don't convey status by color alone: use a [status](../../components/status/) label or text.
- Put text over photos on a scrim or a solid chip, never on glass.
- Keep `html[lang]` set and don't disable zoom. Set `dir="rtl"` (and `lang`) together for right-to-left languages.
- Give a truncated name a `title` or show it in full somewhere; only the timeline label, the top app bar title, the title bar, field values and the date value truncate by design.
- Put your own screen-only chrome behind `data-s4-print="hide"`, and give your own buttons a border in `@media (forced-colors: active)`.
