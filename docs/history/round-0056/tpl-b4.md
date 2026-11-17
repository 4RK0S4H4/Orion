# Round 0056, template identity batch 4: the five site templates (issue 66)

Branch `round56/tpl-b4`. The five website-kit templates were one monochrome product (Ledgerly). Each is now a
different organisation with its own brand, drawn pictures and at least one section no other template has. All five
keep their archetype, structure comments, one `h1`, meta description, Open Graph tags, skip link, phone menu panel and
the minified files. Each saves its theme under its own key (`sprig-site-theme`, `hollis-vane-theme`, `tidewater-theme`,
`mallet-docs-theme`, `spool-site-theme`), so a branded template never pushes its dials into another one.

## The five sites (so other batches can avoid repeating them)

| Template | Organisation | Accent and mode | Gray, page, corners | Faces | Other dials |
|---|---|---|---|---|---|
| `landing.html` | **Sprig**, a soil sensor for houseplants (consumer hardware launch, Utrecht) | leaf green `#4c7a2a`, **tinted** (tonal) | (tinted), plain, round | display `rounded`, text Inter | `energy: lively` |
| `site.html` | **Hollis & Vane**, a 14-person architecture practice (Glasgow) | terracotta `#a3482a`, variant `fidelity`, neutral | warm, plain, firm | display custom geometric (Futura, Century Gothic, Avenir Next), text Inter, display steps at weight 500 | `energy: calm`; a scoped dark band |
| `blog.html` | **Tidewater**, a quarterly journal of coasts and rivers (Harwich) | deep sea blue `#1f4e66`, variant `fidelity`, neutral | warm, plain, soft | one book serif for both (Iowan Old Style, Palatino), weight 500, masthead 400 | `density: roomy`, `energy: calm` |
| `docs.html` | **Mallet**, open-source firmware for split keyboards | cyan `#0088a3`, neutral | cool, plain, soft | display `mono`, text Inter | a scoped dark page head |
| `pricing.html` | **Spool**, hosted background jobs and cron (developer tool) | violet `#6a3de8`, neutral | pure, **soft page**, round | display and text `system` | `data-buttons="tonal"` (main actions name `filled`) |

Already taken elsewhere (hierarchy-wide): Tally green + serif + soft page, Relay indigo tinted + dark rail, Pressroom
orange + mono + dark band. Mallet moved from amber to cyan and Tidewater dropped the soft page to stay apart from them.

## What each page has that no other has

- **Sprig:** a drawn product hero (a fern in a pot with the sensor, inline SVG in the fixed color roles so the object
  looks the same in light and dark) with two real notifications on the stage; the sensor's **anatomy** with numbered
  callouts and a spec strip; three steps with their own small pictures; a **plant matcher** (a button group picks the
  plant, the care facts and a real phone screen with a ring answer in place); a battery bento and an away-mode week;
  the accent band is a **pre-order with a pack picker** whose price follows it (`[data-period]`).
- **Hollis & Vane:** a statement hero over a full-width **floor plan** made of filled shapes (walls take the text color,
  so the plan is poché in light mode and a negative in dark); selected work as plans (school, terrace, bothy) on a
  7/5 grid; an **index of every project** (new kit part `.s4-site-index`); a dark **On Site Now** band with
  `.s4-milestones`, three figures and a site diary; four practice stages with big numerals; the contact band holds a
  **drawn street map**.
- **Tidewater:** a **masthead** (issue line in small capitals, the name very large); the **current issue's cover** set
  in type over layered sea bands beside a **contents page** with page numbers; a featured essay with a drawn estuary;
  the latest writing **filtered by section in place** (chips) with a designed empty state; **back issues** as small
  covers in different tones; the newsletter band.
- **Mallet:** a **dark page head** (scoped `data-theme="dark"`) with breadcrumbs, `# Layers`, version and edit link; a
  **live keymap** (42 real key cells, column-staggered, legends swap with the layer through `[data-period]`, the held
  thumb key lights through `:has()`); callouts (new kit part `.s4-callout`); per-platform commands in tabs; a table
  that stacks on a phone; **Was This Page Helpful?** answered in place.
- **Spool:** four plans with one accent; a **cost calculator** (two sliders; the estimate, a month drawn as 31 bars,
  the line items and the cheapest plan, with where the next plan starts to pay off, all update as you drag); **what
  counts** as a job / compute minute / never billed, each with a small picture; a five-column comparison table.

## Site kit changes (`components/site/`, this batch owned it)

- Added `.s4-site-index` (`-row`, `-n`, `-title`, `-meta`, `-year`): a numbered list of everything (projects, issues,
  an archive). Meta under the title on a phone, its own columns from 840; rounded hover fill; dividers fade beside a
  hovered row (0045).
- Added `.s4-callout` with `data-tone="warning|success|neutral"` (info by default): a filled note with an icon and a
  title, for docs and prose. Uses the fixed status containers.
- Fixed: the signup button no longer squeezes its label ("Subscrib/e" at 390 with a long field label).
- Fixed: a media poster with a play control goes 4:3 under 600, so the control no longer covers the poster's words.
- `[data-period]` is documented as a value switch for any connected button group (packs, sizes, layers), not only
  billing periods. (A chip-set variant was tried and removed again under the owner's tabs / button group / chips rule.)
- Not done: the reference page `components/site/site.html` does not yet demo `.s4-site-index` or `.s4-callout` (the
  templates do); worth adding before the skill is re-packaged.

## Tabs, button groups and chips (owner's rule, decision 0059)

Checked every use in the five pages: billing period, comparison column, keymap layer, Sprig's pack and plant pickers
and the theme switch are **button groups** (a value, or how the same thing is shown); the per-platform commands are
**tabs** (they swap the panel); Tidewater's sections are **chips** (they narrow a collection). Changed in this pass:
Sprig's pack and plant pickers went from chips to button groups (the plant list was cut to three so the group fits a
phone), and Mallet's "Was this helpful" went from chips to two plain buttons (they are answers, not a filter).

## Lessons (per template; what was easy, what held back, what to change)

### Sprig (landing)
- Easy: tinted mode plus three attributes made it a different product at a glance; the ring, button group, phone
  frame and accordion carried the product unchanged; fixed color roles make product drawings mode-proof.
- Held back: (1) **the accent only arrives after script**: a seed needs `m3color.js` at run time, so every branded
  page paints monochrome first and then turns green. *Needs the owner*: a build step that writes a branded app's
  scheme to CSS, or `<html data-accent>` honoured by a pre-paint script. (2) **`rounded` has no fallback outside Apple**
  (Linux and Windows get the system sans): *small, do next*: add a rounded face that ships on Windows (e.g. Arial
  Rounded MT, bold only) or say so in the dial table. (3) The connected button group's selected segment is the
  inverse color, the darkest thing on a pale tinted page and jarring on an accent band (being replaced by 0059's Ink
  Track: *in another branch*). (4) No product-drawing tokens: I used the fixed roles by hand; *small, do next*: name
  them in the skill as "colors for drawings of real objects".
### Hollis & Vane (site)
- Easy: `variant: 'fidelity'` gave a true terracotta; the scoped dark band and milestones dropped in with one
  attribute; plans as filled SVG follow both modes for free.
- Held back: (1) **the default `vibrant` variant turns muted brand colors neon** (terracotta became coral, the navy
  journal became cyan). Same finding as Tally. *Small, do next*: pick `fidelity` for neutral mode when the seed's
  chroma is low, or name the variant in the dial table. (2) A display face lighter than Inter needs the site weights
  turned down: I set `--s4-site-hero-weight` / `--s4-site-title-weight: 500` on `:root`. *Small, do next*: a
  `data-type-weight` dial or per-face weights in the presets. (3) The page checker's selector lint splits on commas
  inside `:is()` and calls `:nth-child(…)` a bare element selector. *Small, do next* (`skill/s4-orion/scripts/check.mjs`).
### Tidewater (blog)
- Easy: one custom stack set display and text; roomy density made the index read like a magazine; the section filter
  plus empty state was a few lines.
- Held back: (1) Custom faces go on `<html style>` *and* in `S4.theme.restore`, twice, to avoid a flash. *Small, do
  next*: let `S4.theme.restore` read the dials already in markup as its defaults (it does for preset names, not for a
  custom family's value when no save exists). (2) Small capitals and old-style figures are what make editorial type;
  Orion has no token for either. *Needs the owner*: an editorial type option (`font-variant` roles for eyebrows and
  numbers). (3) `.s4-post` has no slot for a section label and byline; I used my own spans.
### Mallet (docs)
- Easy: `[data-period]` turned out to be a general "show the text for this value" switch, so the keymap needed no
  script; `.s4-table` stacks on a phone; tabs carried the code panels.
- Held back: (1) No code block with a copy button or file name in the site kit (the data-scale code block was not
  here). (2) **A dark sidebar was the obvious brand move but needs `.s4-docs-nav` restyled** (it paints no surface and
  has no corner when scoped), so I put the dark scope on a page head instead. *Small, do next*: `data-tone` on
  `.s4-docs-nav`. (3) Keys and other small drawn controls want a 2dp gap token (same as Tally).
### Spool (pricing)
- Easy: soft page + `data-buttons="tonal"` changed the whole page's weight with two attributes; the comparison table
  handled five columns and its phone picker unchanged.
- Held back: (1) **four plans with long names**: the phone column picker wrapped "Enterprise" mid-word, so the plan
  is called Scale. *Small, do next*: button group labels should shrink or truncate before breaking a word. (2) The
  slider has no paired "exact value" field for big numbers; I wrote the value beside the label in an `output`. (3) No
  chart for "a month of bars" in `.s4-chart` that fits a card; drew it.
### Across the batch
- Never restyled a component by class: every own element is a new class drawn from tokens. The one place I wanted
  to (the docs sidebar) is lesson Mallet (2).
- Rule bent: **none of the five centers a hero except Spool's pricing heading** (allowed). Sprig uses the accent in
  the CTA band only; the plant matcher is a `low` band. Tidewater's cover uses the accent (a cover is an allowed use)
  and the CTA band is `low`. Hollis & Vane uses it in the contact band; the plans use the accent tint for the one room
  that matters, which is drawing, not a band.

## Changelog lines
- Changed: the five site templates are now Sprig (product launch), Hollis & Vane (studio), Tidewater (journal),
  Mallet (docs) and Spool (pricing), each with its own dials, drawings and sections.
- Added: `.s4-site-index` and `.s4-callout` in the website kit.
- Fixed: site signup button label squeezed at 390; poster play control covering its words on a phone.

## For the skill
- Websites: "give the site its own brand with the dials, its own drawings (inline SVG filled with color roles; the
  fixed roles for real objects), and one section only it has"; name `.s4-site-index` (portfolios, archives) and
  `.s4-callout` (docs); a value picker on a site is a button group with `[data-period]`; each branded template saves
  under its own theme key.
- Muted brand colors: use `variant: 'fidelity'` in neutral mode.

## Hub links
`templates/index.html` names and blurbs updated for the five. Pages: `templates/landing.html`, `site.html`,
`blog.html`, `docs.html`, `pricing.html`.

## For the owner, on a real iPhone
The rounded face (SF Rounded) on Sprig, Futura on Hollis & Vane, Iowan Old Style on Tidewater and SF Mono on Mallet
were only seen here as fallbacks (system sans, DejaVu Serif, DejaVu Mono). The first paint flashes monochrome before
each accent arrives (lesson Sprig 1).
