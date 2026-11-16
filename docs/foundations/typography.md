# Typography

**Tokens:** `--md-sys-typescale-<role>-{font,size,line-height,tracking,weight}`, `--md-sys-typescale-emphasized-<role>-weight`,
`--md-ref-typeface-{brand,plain,mono}` · live: [tokens page](https://4rk0s4h4.github.io/s4-orion/tokens/#type)

- **Typeface:** Inter by default (variable, all OpenType features), bundled as `inter-variable.woff2`. Load it from the bundle, not
  Google Fonts, so `tnum`, `case`, `zero` and `frac` work. Inter plays with its default glyphs.
- **Scale:** the 15 M3 roles (display, headline, title, body, label × large/medium/small) with M3's sizes and line
  heights. **Letter spacing is tuned for Inter** (decision 0055), not Material's Roboto values: about -0.01em at text
  sizes, tighter as size grows, slightly open at 11px.
- **Hierarchy** (decision 0055): display, headline and title-large are weight 600; **emphasized** (700) is for the
  one moment that needs more: a hero number, a key title. Titles and labels are 500, body 400.
- **An app's own faces** (decision 0055): `S4.theme({ display, text })` with `serif`, `rounded`, `mono`, `system` or a
  font-family value. The display face covers display, headline and title-large; the text face everything else. Any
  face but Inter drops Inter's letter spacing; set `--md-sys-typescale-<role>-tracking` if the face needs its own.
  Load a custom font file in the app; keep Inter for text unless the brand truly has a text face.
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
