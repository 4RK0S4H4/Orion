<!-- GENERATED copy of docs/foundations/spacing.md (scripts/build.mjs). Edit the original. -->
# Spacing, size and layout

**Tokens:** `--s4-space-*`, `--s4-size-*`, `--s4-layout-*`, `--s4-breakpoint-*`, `--s4-z-*` · live:
[tokens page](https://4rk0s4h4.github.io/s4-orion/tokens/#spacing)

- **4dp grid:** spacing steps 0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64. Use the step names (`--s4-space-4` = 16px), not raw values.
- **Touch targets** are at least 48dp everywhere (decision 0001: M3 sizes everywhere). Visual size can be smaller (a 40px
  icon button) as long as the target is 48.
- **Component sizes** are M3's: buttons 40 (small 32, medium 56, large 96), FAB 56, chips 32, text fields 56, list items
  56/72/88, top app bar 64, nav bar 80, nav rail 96.
- **Margins:** 16 on compact windows, 24 from 600 up. Panes sit 24 apart. Page content is capped at 1200.
- **Window size classes (M3):** compact < 600, medium 600–839, expanded 840–1199, large 1200–1599, extra-large ≥ 1600.
  Under 840 the nav bar sits at the bottom; from 840 a nav rail sits at the side.
- **Rhythm:** the gap between sections is always larger than the gap inside one: 4 between a title and its supporting
  line, 16 between items in a pane (`--s4-layout-gap`), 24 between panes and sections (`--s4-layout-pane-gap`), 32 or
  more before a new part of a page. A pane is padded 24 (16 on a phone), so its content never sits closer to its
  edge than to its neighbours.

## Wide windows (issue 56)

| Window | Navigation | Content | What joins |
|---|---|---|---|
| compact < 600 | nav bar | one column, 16 margins | nothing |
| medium 600–839 | nav bar | one column, 24 margins | grids gain a column |
| expanded 840–1199 | rail (icons) | up to the cap | list-detail shows two panes; supporting pane sits beside |
| large 1200–1599 | rail expands (labels) | up to the cap | grids gain columns; nothing else (the rail takes the extra 144) |
| extra-large ≥ 1600 | rail expanded | default pages reach their 1200 cap; `wide` pages grow to 1600 | a third pane joins list-detail (`data-join="extra-large"`); dashboards may add a supporting column |

- **One alignment policy:** capped content is **centred** in the space beside the rail, at every width, and the top
  app bar's title and actions follow the same column (`layout.css`). Why centred and not start-aligned: from 1600 a
  start-aligned column leaves all the spare width on one side (a 400px hole at 1920), and the eye reads a centred
  column as deliberate; the rail already anchors the start edge. A search field that filters the content below it
  spans that content's column.
- **Pick the width by content:** `reading` (720) for prose, forms and settings, which never stretch past the reading
  measure; the default (1200) for dashboards, home screens and card grids; `wide` (1600) for tables, boards and editors.
- **Grids fill their row:** `.s4-grid` uses `auto-fit`, so two cards share the row instead of floating at its start.
  A collection that filters (gallery, results) sets `--s4-grid-fill: auto-fill` so one result keeps a tile's size.
- **1920 and wider:** nothing grows past its cap; the column stays centred with even space on both sides.
- `tests/layout.mjs` checks this at 1280, 1600 and 1920 (thresholds at the top of the file).
- **Stacking:** use the `--s4-z-*` names (app-bar, navigation, fab, scrim, sheet, dialog, menu, snackbar, tooltip) instead
  of raw numbers.

## Websites: section rhythm and widths (issue 53)

**Tokens:** `--s4-site-section-space`, `--s4-site-section-space-compact`, `--s4-site-section-space-wide`,
`--s4-site-section-gap`, `--s4-site-margin`, `--s4-site-width`, `--s4-site-measure`, `--s4-site-measure-wide`.

| Token | Value | Use |
|---|---|---|
| `--s4-site-section-space` | 64 on a phone → 112 from 1280 (fluid) | Between two sections (each `.s4-site-section` pads half of it top and bottom) |
| `--s4-site-section-space-compact` / `-wide` | 64 / 112 | The two ends, for a tight band (`data-space="compact"`, a logo row) |
| `--s4-site-section-gap` | 32 → 56 (fluid) | Inside a section: heading block to content, column gaps, the padding of a toned band |
| `--s4-site-margin` | 16 → 32 (fluid) | Side margin of a site page |
| `--s4-site-width` | 1200 (= `--s4-layout-content-max`) | Header, sections and footer line up on it |
| `--s4-site-measure` | 600 | Line length of a lead or a section intro |
| `--s4-site-measure-wide` | 800 | A centered hero or heading block |

Rhythm, in one sentence: big gaps between sections, a medium gap between a section's heading and its content, the
4dp grid inside components. Toned bands (`data-tone`) are inset rounded blocks on the site width, never full-bleed
stripes, so the page stays calm and the corners stay round.
