<!-- GENERATED copy of docs/foundations/typography.md (scripts/build.mjs). Edit the original. -->
# Typography

**Tokens:** `--md-sys-typescale-<role>-{font,size,line-height,tracking,weight}`, `--md-sys-typescale-emphasized-<role>-weight`,
`--md-ref-typeface-{brand,plain,mono}` · live: [tokens page](https://4rk0s4h4.github.io/Orion/tokens/#type)

- **Typeface:** Inter by default (variable, all OpenType features), bundled as `inter-variable.woff2`. Load it from the bundle, not
  Google Fonts, so `tnum`, `case`, `zero` and `frac` work. Inter plays with its default glyphs.
- **Scale:** the 15 M3 roles (display, headline, title, body, label × large/medium/small) with M3's sizes and line
  heights. **Letter spacing is tuned for Inter** (decision 0055), not Material's Roboto values: about -0.01em at text
  sizes, tighter as size grows, slightly open at 11px.
- **Hierarchy** (decision 0055): display, headline and title-large are weight 600; **emphasized** (700) is for the
  one moment that needs more: a hero number, a key title. Titles and labels are 500, body 400.
- **An app's own faces** (decisions 0055, 0060): `S4.theme({ display, text })` with `serif`, `rounded`, `mono`,
  `system`, `geometric` (Futura, Century Gothic, URW Gothic, Avenir Next), `humanist` (Seravek, Gill Sans, Calibri,
  Candara, Ubuntu) or a font-family value. Every preset is a system stack with fallbacks off Apple devices (rounded falls
  back to Hiragino Maru Gothic, Nunito, Quicksand, Arial Rounded for display, then Calibri), so it degrades to a near
  face, never to Inter. The display face covers display, headline and title-large; the text face everything else. Any
  face but Inter and system drops Inter's letter spacing; set `--md-sys-typescale-<role>-tracking` if the face needs its
  own. Inter is the only face Orion bundles (decision 0063). An app that ships its own face loads **one** file with
  `@font-face { font-family: "Brand Display"; src: url(brand-display.woff2) format("woff2"); font-weight: 100 900;
  font-display: swap; }` (preload it like Inter), and names it first in a `custom` stack with system fallbacks:
  `S4.theme({ display: '"Brand Display", Didot, ui-serif, serif' })`. Keep Inter for text unless the brand truly has a
  text face. Stacks worth
  knowing for `custom`: Didone `Didot, "Bodoni 72", "Bodoni MT", "Bodoni Moda", ui-serif, serif`; condensed
  `"DIN Condensed", "Avenir Next Condensed", "Roboto Condensed", "Arial Narrow", sans-serif`; classical humanist
  `Optima, Candara, "Noto Sans", sans-serif`.
- **Kicker** (decision 0063): the short label above an editorial title or a post's section is `.s4-kicker`: the accent,
  real small capitals where the text face has them (`font-variant-caps: all-small-caps`, synthesis off, a size up and
  `--s4-type-caps-tracking` apart), the emphasized label in Title Case in Inter, which has none. Never faked. There is
  no old-style figures dial; an editorial page that wants them sets `font-variant-numeric: oldstyle-nums` on its prose.
- **Display weight** (decision 0060): `S4.theme({ displayWeight: 'medium' | 'regular' })` (`data-type-display-weight`)
  draws the display face's roles at 500 or 400 instead of 600, with emphasized at 600. A Didone, a book serif or a
  geometric face is drawn lighter than Inter and loses its contrast at 600; Inter and system stay at the default.
- **Own headings** (decision 0060): an element the app draws itself takes its face from the role it plays,
  `font: … var(--md-sys-typescale-headline-small-font)` or a type class (`.s4-headline-small`); a bare `h2` styled by
  hand is the text face, and the display dial misses it.
- **Body text is 16px** (`body-large`) by default; `body-medium` (14px) for dense secondary content.
- **Numbers:** tabular figures (`font-variant-numeric: tabular-nums`) on anything compared or scanned: amounts, counts,
  dates, IDs, table cells and inputs. Running text stays proportional.
- **Capitalisation:** Title Case for labels (buttons, tabs, headings, column headers, menu items); sentence case for
  sentences (helper text, toasts, dialog questions, empty states).

| Role | Use |
|---|---|
| display-* | Hero numbers and very short headlines |
| headline-* | Page and section titles |
| title-large | Top app bar title, dialog-adjacent headings |
| title-medium / small | Card and pane titles, list headlines |
| body-* | Running text, list supporting text |
| label-* | Buttons, chips, tabs, badges, captions |

## Faces on a container
`data-type-display` and `data-type-text` work on any element and nest (`inter` brings Inter and its letter spacing back
inside a branded page). An element with `data-type-text` sets its own font, since the font is inherited from `<body>`.

## Roomy density
`data-density="roomy"` is for content sites: wider margins, gaps and reading column (`--s4-layout-*`) and body text at
18/28. Control sizes do not change.

## Websites: the fluid display scale (issue 53)

**Tokens:** `--s4-site-{hero,title,lead}-{font,size,line-height,tracking,weight}` (`tokens/src/site.tokens.json`).

Apps keep the fixed M3 roles. A website's big type grows with the window instead, from the phone size of an M3 role
to the desktop size of the next one up (between a 360 and a 1280 window, then it stops):

| Token | Phone → desktop | Use |
|---|---|---|
| `--s4-site-hero-*` | display-small 36/44 → display-large 57/64 | The page's one `h1` (`.s4-hero-title`) |
| `--s4-site-title-*` | headline-medium 28/36 → display-medium 45/52 | Section titles (`.s4-site-title`), big numbers, prices |
| `--s4-site-lead-*` | 17/26 → title-large 22/31 | The paragraph under a hero or section title (`.s4-site-lead`) |

Faces, weights and tracking follow the display and body roles, so the brand dials (`display: serif`, any face) apply
to sites with no extra rules. Headings are 600 with Inter's tight tracking; a lead is the body face at 400. Smaller
headings inside a section use the fixed roles (headline-small, title-large). One `h1` per page.

## Which role where on an app screen (issue 54)

Three levels must be told apart at a glance on every screen: **what this is** (the page), **the parts** (sections and
panes), **the things in a part** (cards, rows, fields). Size carries the first step, weight the second, color
(`on-surface` vs `on-surface-variant`) the third. Never use the accent to make something rank.

| Level | Where | Role | Weight | Color |
|---|---|---|---|---|
| Page title | top app bar title (`.s4-app-bar-title`) | title-large (22) | 600 | on-surface |
| Page heading in content | `.s4-page-header` h2, `.s4-subpage-title` | headline-small (24) to headline-medium (28) | 600 to 700 | on-surface |
| Hero number | `.s4-stat-value` | display-small (36); `data-size="small"` headline-small | 700 | on-surface |
| Section / pane title | `.s4-pane-title`, `.s4-section-title` | title-medium (16) | 600 (pane), 700 (section) | on-surface |
| Card title, list headline | `.s4-card-title`, `.s4-list-headline` | title-medium / body-large (16) | 500 / 400 | on-surface |
| Field and control labels | stat label, segmented labels, table header | label-large / title-small (14) | 500 | on-surface-variant |
| Supporting text | `.s4-pane-supporting`, `.s4-card-supporting`, `.s4-list-supporting` | body-medium (14) | 400 | on-surface-variant |
| Metadata | times, counts, `.s4-stat-meta`, captions | body-small / label-small (12 / 11) | 400 / 500 | on-surface-variant |

- **The page title is the largest words in a view;** only a hero number may be larger. `tests/layout.mjs` checks it.
- A pane title and the card titles inside it share a size, so the pane title takes the heading weight (600): weight,
  not size, separates them, and the card stays the reader's target.
- Numbers people compare are tabular; a number that needs attention gets size or position (first in the row), never
  a second color. Status tones (`.s4-status`) are for state words, the same tone for the same state everywhere.
