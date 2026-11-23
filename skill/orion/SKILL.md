---
name: orion
description: "Orion (formerly S4 Orion), the user's own design system: Material 3 Expressive (M3 color roles from one seed, M3 type and shape scales, springs) with a very clear, contrast-guaranteed glass layer on floating chrome, Inter, Solar icons, Title Case labels, monochrome by default. Ships orion.css + orion.js with 78 components (app shell, navigation, cards, lists, data tables, filters, fields, menus, dialogs, desktop menu bar…), 15 app templates (dashboard, data table, desktop app, board, chat…), five site templates, tokens, and a page checker. Use it whenever the user wants a web app, tool, dashboard, page, prototype or mockup built or restyled in Orion, S4 Orion, S4 Material, Material / Material You / M3 / M3E or a Google/Android look, or asks to apply their design system to an app that already uses Orion, S4 Orion or S4 Material, or says \"update to latest Orion\" (upgrade an app). It replaces the S4 Material skill. Not for S4 Glass or S4 Flat, and not for documents, slides or charts on their own."
---

# Orion

Orion is the user's design system for web apps and pages. It is built on Material 3 Expressive: the same color roles,
type scale, shape scale, state layers, springs and components, under M3's own names. The personal layer on top is short
and deliberate:

- **Inter** as the typeface, **Solar** icons (Bold Duotone, Linear arrows) behind neutral names. Phosphor Duotone and Phosphor Bold Duotone are built in as alternatives: `S4.icon.use('phosphor-duotone')` switches the page (credit the set in use).
- **Title Case** labels; sentences stay sentence case.
- **Any accent color on a neutral base.** Surfaces, text and outlines are neutral gray; one accent colors the main button, FAB, selection, switches and focus (decisions 0043, 0045). The accent can be any color; black and white (`mono`, what the stylesheet ships with) is one choice, not the rule. Status uses the fixed tones `success`, `warning`, `info`, `error`.
- **Very clear glass on floating chrome only** (app bars over scrolled content, nav bar, toolbars, menus, dialogs, sheets),
  with a contrast floor that keeps text WCAG AA over any backdrop. Content is always solid.
- **Simple, sturdy motion:** dialogs and floating panels pop in, menus fade in place with their items following, ink (state fills) moves with a subtle liquid spring, shared axis between views; only movement and fades, on M3 Expressive springs.

When a question isn't answered here or in the references, do what stock Material 3 Expressive does. That keeps every app
predictable and lets M3 guidance apply directly. Inventing new components, colors or radii is how a design system drifts.

## Get the files

Everything ships in this skill's `assets/` folder: `orion.css` (tokens, every component, glass, motion), `orion.js`
(runtime), `icons.js` (icon registry), `m3color.js` (seed → roles, loaded on demand), `inter-variable.woff2`.

- **App or repo:** copy the five files next to the page (or into the project's static folder) and link them as below.
- **Lean app (decision 0069, prefer it for a finished app):** instead of `orion.css` and `orion.js`, link
  `orion.core.min.css` / `orion.core.min.js` and one pair per pack the page uses (`data`, `commands`, `desktop`, `direct`,
  `inputs`, `sitekit`), core first, packs after it. `node <skill>/scripts/packs.mjs page.html` lists exactly which and
  prints the tags; the page checker fails a lean page that links too few. Core is about 78 KB gzip, everything 178 KB.
  Most templates already use it (see their header comment). Prototypes and one-file pages keep `orion.css`/`orion.js`.
- **One self-contained HTML file** (only when asked for a single file): build the page with the normal links, then run
  `node <skill>/scripts/inline.mjs page.html` to inline the CSS, JS, icons and font. Run it again after edits.
- **A fixed brand color** (decision 0063): write its brand file once, `node <skill>/scripts/brand.mjs --seed '#4c7a2a'
  [--variant fidelity] [--surfaces tinted] --out brand.css`, and link it right after `orion.css` (it needs the same
  `S4.theme` seed). The page then paints its brand on the first frame and loads no `m3color.js`. Regenerate it when the
  brand changes or Orion is updated. Templates with a brand carry theirs in `templates/brand/`.
- **Never edit `orion.css` for one app.** Everything sits in `@layer s4.*`, so the app's own unlayered CSS wins; override
  with tokens and documented attributes instead. The source of truth is the repo (github.com/4RK0S4H4/Orion).

## Start from a template

Every new app or page starts from the closest file in this skill's `templates/` folder (copy it next to the five assets,
rename, replace the content). They are complete, checker-clean pages; keep their structure and swap the words and data.

| Template | For | Layout |
|---|---|---|
| `dashboard.html` | analytics, finance, admin, status, trackers | shell + views; stats, chart pane, attention list, table view |
| `list-detail.html` | mail, CRM, tickets, orders, contacts, any CRUD | `.s4-split` list-detail, reply composer in place (`.s4-expand`), compose panel, FAB |
| `desktop-app.html` | anything that ships as a desktop app or lives in a desktop window all day (installed web app, Electron, Tauri) | `data-window`, title bar with menu bar, source-list rail with trees, document tabs, list-detail, inspector, status bar, settings view, all from `S4.commands` |
| `data-table.html` | registers, inventories, admin tables, anything with hundreds or thousands of records compared, filtered and changed in bulk | filter bar and saved views, a virtual `S4.table` with pinned and resizable columns, editing in place, bulk actions, a page per record |
| `settings.html` | any app's settings | reading width; theme controls, segmented lists, danger pane |
| `sign-in.html` | sign-in, sign-up, onboarding, one-task screens | no navigation, reading width, centered pane |
| `article.html` | help, docs, blog, release notes, legal | reading width, breadcrumbs, `.s4-prose` |
| `chat.html` | messaging, support, comments, AI assistants | thread + glass composer |
| `tool.html` | calculators, converters, generators, editors | supporting-pane split: inputs + sticky result |
| `landing.html` | a product or app home page | site: split hero with the real product, logos, feature rows, bento, quote, numbers, FAQ, one accent band, footer |
| `pricing.html` | plans and prices | site: period switch, plans with one featured, comparison table, FAQ |
| `blog.html` | a blog, news or changelog index (each post is an `article.html`) | site: featured post, post list |
| `docs.html` | product documentation | site: sidebar, prose at reading width, On This Page, previous and next |
| `site.html` | a studio, portfolio or personal site | site: hero, work, quotes, contact |
| `kanban.html` | tasks, pipelines, hiring, orders, anything that moves through stages | columns with `data-reorder-group`, add in place, a card page, charts view |
| `calendar.html` | schedules, bookings, shifts, content plans | month grid (a table of buttons) + day agenda in a resizable supporting split, event page |
| `editor.html` | notes, docs, wikis, posts, anything people write | reorderable document list, document page, formatting toolbar, outline pane, autosave |
| `gallery.html` | photos, files, products, designs, anything browsed as a grid | tile grid, filter chips, `data-selectable` with the bar in the top app bar, viewer page |
| `checkout.html` | checkout, booking, sign-up, applications, any task in a few steps | stepper + `.s4-form` steps (Switch between them), summary in a supporting split, done mark |
| `onboarding.html` | first-run welcome and setup | no shell; steps with dots, Skip, accent swatches, done mark |

**Every new app records its Orion version:** keep the template's `<meta name="orion" content="…">` in every page, and
once the files are in place run `node <skill>/scripts/upgrade.mjs <app-dir> --init`, which writes `orion.json` at the app's
root (version, how Orion is loaded, packs, brand and dials, and an `overrides` list for workarounds with their issue).
Commit it; it is what "update to latest Orion" reads later.

Mixed apps combine them: a dashboard app whose Clients view is the list-detail screen, with the settings screen as its
last destination. Keep one shell (`.s4-app`) per page.

## Websites

A marketing page, product home, portfolio, pricing, blog or docs is a **site**, not an app (decision 0057): start
from `landing.html`, `site.html`, `pricing.html`, `blog.html` (+ `article.html` per post) or `docs.html` and read
`references/components.md#site`. `body.s4-site`, no app shell, no nav bar or rail; the window scrolls.

- **Order for a product home:** split hero with the real product, logos, how it works (two or three feature rows),
  bento for the rest, one quote and numbers, FAQ beside its heading, one accent call-to-action band, footer.
- **Type:** one `h1` (`.s4-hero-title`), section titles `.s4-site-title` (h2), `.s4-site-lead` under them; site type
  is fluid, app type is not. Start-aligned; center only short blocks (a short hero, the pricing heading, a closing band).
- **One accent a page:** the featured plan, the call-to-action band, one bento cell or a cover. Toned bands are inset
  rounded blocks, never full-bleed stripes. Bento spans add up to 12 per row; equal grids use `data-columns`.
- **One accent job per screen (decision 0070):** one filled action and one accent selection (the navigation's) at rest; other selections neutral, other actions `elevated`, `tonal` or `text`; no pressed chip at rest. A site header's action does not count (it is the hero's, kept in reach as the page scrolls).
  docs sidebar) is quieter. A site header never opens with a nav item selected.
- **Pictures:** no network fetches, no gray boxes, no gradients. Show real Orion components in a phone or browser frame
  (`inert`, `role="img"`, an `aria-label`), covers set in type on a tone, or the media empty state. Real images get
  `width`, `height`, `loading="lazy"` below the first screen, inside a `.s4-media-box` with a ratio.
- **Glass** only on the site header (once content scrolls under it) and the phone menu panel. No shadows or outlines.
- **Files (decision 0066):** link `inter-site.woff2` (preload), `orion.site.min.css`, the brand file, then
  `icons-site.js` and `orion.site.min.js` (both `defer`; copy `icons-solar.js` beside them for an icon the templates do not use): 147 KB gzip in all. It has the site kit and what a site
  normally shows (buttons, groups, tabs, cards, lists, accordion, static table, stat, ring, meter, prose, code, field
  basics, chips, slider, menu, snackbar, tooltip, glass). A site that needs an app part (dialog, sheet, data table,
  filter, chart, board, rich inputs) loads `orion.min.css` and `orion.min.js` instead. Text outside Latin: use
  `inter-variable.woff2` with its own `@font-face` (same family name) after the stylesheet. Every page has the skip link, landmarks, a meta description, Open Graph tags and `theme-color`
  for light and dark. `data-density="roomy"` widens margins, gaps and section rhythm for content-heavy sites.

## Make it this app's own (brand dials)

Orion looks finished with no settings. When an app has a character of its own, give it one with the brand dials, in
one call before first paint, and never by restyling components (decision 0055):

```js
S4.theme.restore('my-app-theme', { seed: '#a33a12', gray: 'warm', corners: 'soft', display: 'serif' });
```

| Dial | Values | Reach for it when |
|---|---|---|
| `seed` (+ `variant`) | any color, or a named accent; variant `auto` (default) keeps a muted or deep seed's own color | the app has a brand color |
| `surfaces` | `neutral` (default), `tinted` | the app should be colored all over, Material You style |
| `gray` | `pure` (default), `warm`, `cool` | warm: editorial, food, craft, personal. cool: technical, data, developer tools |
| `page` | `plain` (default), `soft` | dashboards and card-heavy screens: white cards on a soft gray page |
| `corners` | `round` (default), `soft`, `firm` | soft: friendly but less playful. firm: dense professional tools. Never sharper |
| `display` | `inter` (default), `serif`, `rounded`, `mono`, `system`, `geometric`, `humanist`, or a font-family | headings and big numbers carry the brand |
| `displayWeight` | `semibold` (default), `medium`, `regular` | a display face drawn lighter than Inter (Didone, book serif, geometric) |
| `text` | the same | only when the brand truly has a text face; otherwise keep Inter |
| `scale` | `compact`, `large` | type and spacing step together: compact for dense tools read at a desk, large for reading-first or older audiences. Never to fix one component |
| `headings` | `tight`, `editorial` | tight: bold, tracked in (product, tool); editorial: regular weight, open leading (magazine, studio). Use it instead of weight or tracking on headings; pair editorial with a serif display, tight with Inter |
| `data-density` | comfortable, `compact`, `auto` | desktop tools |

A value that is not in this table is a mistake, not a variation (decision 0067): `S4.theme({ scale: 'roomy' })` logs a warning naming the allowed values and writes nothing, and the page checker fails `data-scale="roomy"` in markup.

Pick at most three dials beyond the accent; an app that turns every dial stops looking designed. Pair them with intent:
editorial = warm + serif display + soft; pro tool = cool + firm + compact (+ mono display for numbers); friendly
consumer = tinted + rounded display + round. A danger zone is the last pane of settings, neutral, with `<button class="s4-button" data-variant="tonal" data-color="error" data-dialog="confirm">`: never `data-color="error"` on the pane, never a filled red button. What an app can never change: filled (no outlines), no shadows, glass only
on floating chrome, the motion patterns, the behaviours. Elements only this app has are drawn from Orion's rules in the
app's own stylesheet (decision 0053). A custom corner is `--s4-shape-control` on `:root`, 10px or more.

**More dials (decision 0056):**
- **Energy:** `S4.theme({ energy: 'calm' | 'standard' | 'lively' })` (`data-energy`). Calm for tools and dense data,
  lively for playful consumer apps. Same ten motion patterns; never per component.
- **Themes on any container:** every dial also works on any element and nests: `data-theme="dark"` on a sidebar of a
  light app, `data-accent="#0b6e4f"` (+ `data-surfaces="tinted"`) on a branded band, `data-corners`, `data-gray`,
  `data-type-display` on a region. At runtime `S4.theme(options, element)` (nothing saved; `null` follows the page).
  For regions only, never to restyle one component. Contrast and reduced motion stay page-wide. Put the scope on the
  rounded block itself (it paints its own surface); `setAttribute('data-accent', …)` later recolors the region.
- **Drawn things** (decision 0060): artwork of real objects on the fixed roles (`secondary-fixed`…, the same in both
  modes); kinds of things in `--s4-category-1…6`, named in words; the app's own headings take a typescale font token
  or a type class, or the display face misses them. More in `references/patterns.md`, "From the product templates".
- **App defaults**, once on `<html>`, only when the app's character calls for it: `data-buttons="tonal"` (calm tools;
  still write `data-variant="filled"` on the one main action), `data-cards="filled"`, `data-lists="segmented"`
  (settings-like apps), `data-rail="expanded|collapsed|auto"` (a rail's own `data-expand` still wins).
- **Roomy density:** `data-density="roomy"` for content sites (articles, docs, landing pages), never app screens.

## Page shape

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Orion Showcase</title>
<script>/* theme before first paint: no flash of the wrong mode */
(function (k) { try { var t = JSON.parse(localStorage.getItem(k) || 'null'); if (t && t.mode && t.mode !== 'system') document.documentElement.dataset.theme = t.mode; } catch (e) {} })('app-theme');
</script>
<link rel="preload" href="inter-variable.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="orion.css">
<style>/* the app's own layout, tokens only */</style>
</head>
<body>
<div class="s4-app">
  <nav class="s4-nav-rail" aria-label="Main">                                          <!-- shown from 840 -->
    <div class="s4-nav-rail-header">…menu button, then the main action (.s4-fab) here…</div>
    <div class="s4-nav-rail-items">…same items as the nav bar…</div>
  </nav>
  <div class="s4-app-body">
    <header class="s4-top-app-bar">
      <div class="s4-app-bar-title-group"><h1 class="s4-app-bar-title">Bills</h1></div>
      <div class="s4-app-bar-actions"><button class="s4-icon-button" aria-label="Search" type="button"><span class="s4-icon" data-icon="search"></span></button></div>
    </header>
    <main class="s4-content">
      <section class="s4-view" data-view="bills" data-title="Bills">…</section>
      <section class="s4-view" data-view="budget" data-title="Budget" hidden>…</section>
    </main>
  </div>
  <nav class="s4-nav-bar" aria-label="Main">                                          <!-- shown under 840 -->
    <a class="s4-nav-item" href="#bills" data-view="bills" aria-current="page"><span class="s4-nav-indicator"><span class="s4-icon" data-icon="bills"></span></span><span class="s4-nav-label">Bills</span></a>
    <a class="s4-nav-item" href="#budget" data-view="budget"><span class="s4-nav-indicator"><span class="s4-icon" data-icon="wallet"></span></span><span class="s4-nav-label">Budget</span></a>
  </nav>
</div>
<script src="icons.js"></script>
<script src="orion.js"></script>
<script>S4.theme.restore('app-theme', { mode: 'system' });   /* then the app's own script */</script>
</body>
</html>
```

- The window scrolls; the top app bar, rail and nav bar are sticky. The top app bar turns to glass by itself when content
  scrolls under it. Don't add your own fixed bars or an inner full-height scroller.
- Window classes are container queries on `.s4-app`: compact < 600 (nav bar), medium 600–839 (nav bar), expanded ≥ 840
  (rail). A one-screen tool drops both navs and keeps the top app bar.
- Markup works without app code: `orion.js` wires every component on load and anything added later.
- **Page width:** `data-width="reading"` (720) on `.s4-content` or a view for text, forms, settings and sign-in;
  `data-width="wide"` (1600) for tables, boards and editors; the default (1200) for dashboards.
- **Two panes:** `.s4-split` (list-detail, the default) or `.s4-split[data-layout="supporting"]`: one pane at a time on
  phones, side by side from 840. Don't hand-build split grids.
- **The rail is side navigation:** rows with the label beside the icon; it shows labels by itself from 1200 and is one icon wide below that. Add a `[data-rail-toggle]` menu button (icon `menu`, a hamburger) when there are more than four destinations. Its `.s4-fab` is the app's main action as a solid button; while the open view shows a filled button of its own it steps down to elevated by itself (0070).
- **Desktop apps and desktop-first tools:** `data-window data-density="auto"` on `.s4-app` (the window never scrolls as a page, controls are pointer-sized with a mouse), a `.s4-titlebar`, `data-shortcut="mod+n"` on primary actions with `<kbd class="s4-kbd"></kbd>` in their menu items, and `data-context-menu="id"` on rows. Never restyle components to make them smaller: density does it.
- Read `references/patterns.md` for screen patterns (dashboard, list and detail, settings, forms, empty states, theming).

## Decision rules

**The app is the app** (decision 0053). Orion is a language, not a kit of parts: design the app from what it does, then draw it in Orion.
- **Restyling or adapting an existing app:** keep its screens, their order and its own elements (its calendar, its progress road, its hero). Redraw each in Orion's style. Never drop one, and never swap one for the nearest stock component (a chart is not a calendar, a stepper is not a road). Take Orion's way only where Orion already says how a thing is done (navigation, lists, forms, the placement ladder, Undo).
- **When the app needs an element Orion lacks, make it** in the app's own stylesheet from Orion's rules: tokens only, filled never outlined, round and concentric, a named motion pattern or none, the fact in text beside the picture, both color modes, 390px. Look first: `.s4-ring` (a share of a whole with the value in the middle), `.s4-milestones` (a road of steps with a "you are here" marker), `.s4-month` (a month with marks on days: today, dot, band, flag, and a key), `.s4-timeline` (bars along one span of time) were all made this way.

**Color**
- **Choose the accent for the app.** A brand or named color wins: `S4.theme({ seed: '#2e7d32' })`, or a ready-made one: `S4.theme({ seed: 'blue' })` (`mono`, `blue`, `indigo`, `violet`, `pink`, `red`, `orange`, `amber`, `green`, `teal`). With nothing to go on, ask, or use `mono` (the owner's own favorite). Every accent is proven against the neutral base by `check-accent`, so none needs hand-tuning.
- **Pick the variant by the seed** (decision 0060): leave it out. `auto` gives a muted or deep brand color (plum,
  terracotta, navy, espresso, forest green: HCT chroma under 60 or tone under 35) `fidelity`, which keeps it as is, and
  a vivid one (the named accents, a magenta) `vibrant`. Name `vibrant` only when the user wants a brighter version of a
  muted color (it turns terracotta coral and navy cyan); `tonal` for subtle or photo-derived colors (tinted mode's default).
- A fixed brand that the visitor never changes: `S4.theme.restore(key, brand, { only: ['mode'] })`, so only light or dark
  is saved. Never hand-write a mode-only restore. Glass FAB labels are proven for every seed: never switch a FAB to
  `data-color` to get contrast. Every FAB color and the vibrant toolbar follow one label rule; no exemptions (0063).
- A color the visitor picks (swatches): keep a save key and add the one-line cache snippet after the stylesheets
  (`references/color.md`, "A fixed brand paints on the first frame"), so it is back before the first paint.
- Use roles, never hex: page `surface`; cards and panes `surface-container-low`; menus and nav `surface-container`;
  dialogs `surface-container-high`; fields `surface` (Quiet Box); text `on-surface`, secondary text
  `on-surface-variant`; selection `secondary-container`; the one main action `primary`; standout container (FAB)
  `primary-container`; errors `error`. If you're reaching for a hex value, there is a role for it.
- Raise contrast with `S4.theme({ contrast: 0.5 | 1 })`, never by darkening one color.

**Actions**
- One **filled** button per area for the main action, and one per screen at rest (0070: the next act on the work in front of the person); **tonal** for a strong second; **text** for the rest. Nothing is ever outlined (decision 0023): fields, chips, checkboxes, radios and cards are filled; the old `outlined` variants draw filled. Small things are pills (chips, status, buttons, fields, FAB); no sharp or squared corners on them.
- A **FAB** only when one action dominates a screen (Add Bill); never two FABs.
- Icon-only actions are icon buttons with `aria-label` and usually a `data-tooltip`.
- **Tabs, button group or chips** (decision 0059): if it swaps what is on the screen, it is **tabs** (`.s4-tabs`, every tab with a `tabpanel`); if it changes a value or how the same thing is shown (Week / Month / Year on a chart, list or grid, units), it is a **connected button group** (`data-connected data-select="single|multi"`, 2 to 5 short options, the Ink Track); if it narrows a collection and there can be many, it is **filter chips**. Never a button group with `aria-controls` panels, never tabs without panels: the page checker fails both.
- A destructive answer is `data-variant="tonal" data-color="error"` (the error container, never a red slab) and Cancel is `tonal` (decision 0064); a per-row delete stays a plain icon button.

**Showing data**
- Items people scan and open: a **list** (`data-style="segmented"` for grouped rows on a card-like surface).
- Rows people compare across columns: a **table** (it stacks into rows on phones by itself, in its `.s4-table-wrap`, which
  table.js adds when it is missing). Right-align numbers with `.s4-num` on their cells. A data table (`S4.table`) says its
  header keys itself (an `aria-description` and a hint line while the keyboard is in it: Up from the first row reaches
  the sort, options and resize controls); keep both, and never add a second explanation.
- A few rich, independent things: **cards** in an `.s4-grid`. Sections of settings or a dashboard: **panes**.
- State of a thing: a **status** pill with a word ("Overdue"), never color alone. A status is a tint (decision 0065): no
  tone for usual and finished states (Approved, Paid), `error` or `warning` only for the one state that needs action
  now, `info`/`success` for plain facts; never paint a status as a filled pill (the checker fails it).
- Toolbars: **one tonal tool** (the main one, e.g. Add Filter); the rest `text` or plain icon buttons.
- Numbers people check over time (KPIs): **stats** (`.s4-stat`) in one pane's `.s4-stat-row`, not a pane per number.
- An item's fields on a detail screen: a **description list** (`.s4-dl`).
- A reading against a whole, a limit or a target (storage, time left, words, runway): a **meter** (`.s4-meter`,
  `data-value`/`data-max`, `data-state="near|over"`, `data-segmented` with a legend, `data-steps`); never a hand-drawn bar.
- Things moving through stages: a **board** (`.s4-board` > `.s4-lane`, `data-limit`, `[data-lane-add]` for add in
  place, `data-reorder-group` to drag; Alt and the arrow keys move a card). Never a dialog to add a card.
- A map of real things too dense for 48px targets (seats, keys, calendar cells): `data-dense` on the map, each target
  drawn 18px or more and 24px apart, arrow keys between them. Never for ordinary controls.
- A slider whose number is what people read: `.s4-slider[data-value="heading"]` (label and value above the track; add
  an `<input inputmode="numeric">` inside for an exact value).
- Long text (articles, help, AI answers): **prose** (`.s4-prose`) on a reading-width page. Conversations: **messages**
  (`.s4-thread`, `.s4-message[data-from="me"]`) with a glass `.s4-composer`.
- Charts: `.s4-chart` (one series the accent, several `--s4-chart-1…6`, a table view always); draw by hand only a shape it lacks, from role colors, with a text alternative (`role="img"` + `aria-label`).

**Data at scale** (decision 0061; markup in `references/components.md`)
- Keyboard: a data table is two Tab stops (header, body); never add `tabindex` to cells or header controls yourself.
- More than about 50 rows, or rows from data: `S4.table(table, { cell, detail }).setRows(rows)` inside `.s4-states`, `data-sticky` on the wrap and a height (`--s4-table-max-height`). Pin the identifying column (`th[data-pin]`); `data-resizable` and `data-key` for tools used daily; `data-column-menu` past six columns; `data-edit` only for short values (Undo follows). A record opens as a page, never a dialog. Phones stack rows; `data-layout="scroll"` only for numbers compared across a row.
- Narrowing a collection: `.s4-filter` (`S4.filter`), not a hand-made bar: saved views (two to five, named after the questions people ask), search, Add Filter, an All Filters tool panel (choice facets for a few values, tags for long lists, ranges for numbers and years), filters in force as chips, a count; always a `no-results` state with Clear Filters. Never an Apply button; never drag-only column order.
- Code: `.s4-code` with a file name (`S4.code` colors it with the fixed `--s4-syntax-*` tokens; never by hand); `.s4-code-inline` in sentences, `.s4-keys` / `.s4-kbd` for keys. Charts over time: `.s4-chart-range` above the chart; `data-legend="toggle"` with three or more series.

**Desktop windows** (decision 0062; start from `desktop-app.html`, shells from the repo's `examples/`)
- Write every action once: `S4.commands.add([...])`; menus come from `S4.commands.menu(name, …)`, buttons take `data-cmd`; the menu bar, right-click menus, shortcuts, the palette and a shell's native menu read the same list. Never a menu's items, a key handler and a palette entry written separately.
- Use only the parts the app's jobs need: title bar, sidebar (the rail as a source list, `.s4-tree` inside) and content for a small tool; add `.s4-menubar`, `.s4-doc-tabs` (only for things opened and closed; a fixed set of views is tabs), `.s4-inspector` (solid, in the layout, for properties used all day) and `.s4-statusbar` when there are files, properties and state.
- Window buttons: on a Mac and in an installed web app the system draws them. Only a frameless Windows or Linux shell draws `.s4-window-controls` (Minimize, Maximize, Close as `.s4-window-control[data-window-action]`, empty buttons with an `aria-label`): full cells to the window's top and end edges so the corner hits Close (decision 0072); never restyle them smaller or pad them away from the edge.
- Settings is a view with categories, search and instant changes with Undo (mod+comma), never a dialog. Standard keys: mod+N/O/S/W/Z, mod+Shift+Z, mod+F, mod+comma, F2 (Enter on a Mac) to rename, Shift+F10 for the context menu. Put `data-density` on `<html>` so menus and panels follow it.

**Two color modes** (decision 0052): neutral (default: white or near-black surfaces, the seed is an accent) and tinted (`S4.theme({ seed, surfaces: 'tinted' })`: every surface takes the color, the M3 Expressive look). Use tinted when the user asks for a color-themed app or the app already is one; never mix. **Nested corners are concentric:** something rounded sitting tight in a rounded container's corner has radius = outer radius minus the gap (`calc(var(--s4-shape-dialog) - var(--s4-space-2))`), or is a pill. **Glass is only for what floats over content;** a toolbar in the page flow is a solid joined button group.

**Three kinds of place** (decision 0050): a **view** (`.s4-view`, a destination in the navigation); a **page** (`<section class="s4-subpage" data-page="order" hidden>`, opened with `data-page-open="order" data-page-id="42"`: going *into* one thing, with Back in the bar, its own title and URL `#view/page/id`; fill it in its `s4-open { id }` event); and acting **in place** (the ladder below). Reading or working on one item is a page, never a dialog.

**App behaviours that are part of the language** (decision 0051; markup in `references/components.md`)
- **States:** every list, table and pane sits in `.s4-states` with `data-when` parts for loading (skeleton rows), empty, error (Try Again) and offline. Never a blank box or a lone spinner. `S4.states.load(el, promise)`.
- **Forms:** `<form class="s4-form">`: errors appear on leaving a field, never while typing; settings use `data-autosave` and a `.s4-form-status` ("Saved"), no Save button; reversible actions just happen and offer Undo.
- **Direct manipulation:** `data-reorder` + `.s4-drag-handle` (works with a finger; always also a keyboard path), `data-swipe` rows on phones, `data-selectable` + `.s4-selection-bar` for acting on several.
- **Command palette:** opens with mod+K or `data-palette` and lists the app's `S4.commands` (desktop apps: see Desktop windows below); `S4.palette.register([...])` adds to the same list.
- **Resizable panes:** `data-resizable data-resize-key="name"` on a `.s4-split`.
- **Charts:** `<figure class="s4-chart" data-type="column|bar|line|area|donut|spark" data-labels data-values>`; one series wears the accent, several use `--s4-chart-1…6`; never two y-scales, never more than six series.
- **Rewards:** `.s4-done-mark` when something is finished, `data-count-to` for a total that changed. Rare and small.

**Where new content goes: the placement ladder** (decision 0047; use the first rung that fits)
1. **In place:** the thing itself changes (a switch, an inline confirm: `data-confirm="id"` + `.s4-confirm`).
2. **Expand:** a reply, comment, add form, details or options open under what was touched and push the page:
   `<button data-expand="id">` + `<div class="s4-expand" id data-variant="inset" hidden><div class="s4-expand-body">…<div class="s4-expand-actions">…</div></div></div>`.
3. **Menu:** a short list of choices from a button. 4. **Pane:** detail beside the content (`.s4-split`).
5. **Floating panel:** a longer task with no place in the page (`.s4-bottom-sheet` quick add, `.s4-side-sheet` filters, a new message). Panels are glass, inset from every edge, and never slide or dock.
6. **Dialog:** only when the app cannot go on without an answer (serious and cannot be undone). Never open a dialog for a reply, a rename, an add form or a filter.
- **A dialog** (decision 0064) only asks a question the app cannot go on without: delete for good, leave unsaved work,
  a permission. Expect one or two per app. The headline is the question in sentence case, one or two lines of content,
  then `.s4-dialog-actions` with Cancel (`data-variant="tonal"`, `data-close="cancel"`) and the answer
  (`data-variant="tonal" data-color="error"` when it destroys, filled otherwise). Never one answer, never "OK", never a
  form (the page checker fails all three); a form goes in place, in a floating panel or on a page.
- On a phone, dialogs and panels sit in the bottom of the screen with full-width answers and swipe-down dismissal by
  themselves; never position or size them. `data-persistent` blocks tap-outside and swipe. A filter or inspector panel
  is `data-modeless` with no Apply button.
- Confirmation after an action: **snackbar** with Undo. Naming an icon: **tooltip**.
- Confirm only what can't be undone. Prefer Undo in a snackbar.

**Motion** (decision 0046: ten named patterns, nothing else; full table in `references/motion.md`)
- In CSS a transition names a pattern token: `transition: transform var(--s4-motion-ink), background-color var(--s4-motion-state);` State (color, opacity), Ink (a state fill moving), Morph (a control's own shape or size), Bend (an icon turning). Never a raw duration, easing, spring token or `transition: all`.
- In script call the pattern, never `element.animate()`: `S4.transition.reveal(el, { open })` (content opening in place), `follow` (menus), `pop` (dialogs, panels), `rise` / `tip` (snackbars, tooltips), `sharedAxis` / `enter` (switching views), `move` (reorder). Most are built into the components.
- Decision 0049: nothing ever puts the cursor in a text field by itself: no `autofocus`, no `.focus()` on an input when a dialog, panel, expand or page opens. The person taps the field. The one exception (decision 0067) is a palette or search the person's own keyboard shortcut opens (mod+K, mod+comma into the palette): their keys are already going there, so the cursor may be in its search field; by tap or click it never is. Decision 0043: date fields are plain `<input type="date">` in a text field (the glass calendar is automatic; `data-range-end="id"` for a range); errors are `data-error="Message"` on the field, never a red fill; a selected chip is `aria-pressed="true"` and never gets a check icon.
- Liquid motion (overshoot, leading edges) only for ink, the solid fills that show state; glass moves plainly (a few pixels and a fade). Never scale a surface to make it appear, never slide from a screen edge, never clone elements.

**Glass** (read `references/glass.md` before adding any)
- Only floating chrome and overlays get glass, and the components already have it. Content is never glass.
- Text on glass is `on-surface`; at most two glass layers overlap; `data-glass="off"` keeps one element solid.
- Docked bars (nav bar, scrolled top bar, site header, docked toolbar) are glass with one hairline and no edge glow
  (0064); never add a rim, glow, border or shadow to them. Floating glass keeps the full edge.
- A custom floating panel can opt in with `class="s4-glass"`; a card can't.

**Type and writing**
- `humanist`, `rounded` and `geometric` are system stacks: on Android and Linux they often fall back to plain sans. A brand whose face matters ships one file in a `custom` stack.
- Use the type scale classes (`.s4-headline-small`, `.s4-title-medium`, `.s4-body-medium`, `.s4-label-large`…) or the
  `--md-sys-typescale-*` tokens; add `.s4-emphasized` for the M3 Expressive weight on a key number or title.
- Numbers people compare (amounts, counts, dates, IDs) get `.s4-num` (tabular figures); in a table cell or header it also
  right-aligns the column (a column of `.s4-num` cells right-aligns its header by itself; `.num` is the older name).
- Editorial pages: `.s4-kicker` above a title or as a post's section (real small capitals where the face has them,
  never faked), `figure.s4-figure` for a picture with its caption, `.s4-post-byline` under a post.
- Inter is the only bundled face. A brand face is one `@font-face` file with `font-display: swap`, named first in a
  `custom` stack: `S4.theme({ display: '"Brand Display", Didot, ui-serif, serif' })`.
- **Title Case** for labels: buttons, tabs, headings, column headers, menu items, field labels, chips, nav labels.
  Sentence case for sentences: helper and error text, snackbars, dialog questions ("Delete this bill?"), empty states.
- Name actions by what happens ("Pay Bill", "Export to Excel"), and keep the same word through the flow (Archive → "Bill archived").

**Icons**
- `<span class="s4-icon" data-icon="name"></span>` with names from `references/icons.md` (or `S4.icon.names()` in the
  console). Common: home, search, bills, wallet, settings, add, edit, delete, more, more-vert,
  close, check, chevron-down/up/left/right, back, forward, notifications, account, calendar, filter, sort, export,
  download, upload, copy, share, info, warning, error, star, favorite, chart, dashboard, document, card, history, lock,
  visible, hidden, light-mode, dark-mode, menu, refresh, undo, sparkle, mail, chat; weather and outdoors: wind, sun,
  moon, night-sky, cloud, rain, sunrise, sunset, temperature, compass, hike. Unknown names log a console warning.
- Need another Solar icon: `S4.icon.add({ name: '<svg body>' })`. Credit "Solar icons by 480 Design (CC BY 4.0)" in the
  page footer or about screen.

**Task panel or tool panel** (decision 0054): a floating panel for a short task you save or cancel is modal (the default). A panel that is a tool for the page behind it (filters, an inspector, formatting) gets `data-modeless`: from 600 wide the page stays bright and live, its controls act at once and there is no Apply button. Phones and dialogs are always modal.

## Common mistakes

| Mistake | Why it's wrong | Instead |
|---|---|---|
| Hex or rgb colors in app CSS | Breaks dark mode, seeds and contrast levels | A `--md-sys-color-*` role |
| `backdrop-filter` or `.s4-glass` on cards, lists, panes | Glass is for floating chrome; it hurts legibility and performance | Solid `surface-container-*` |
| Two filled buttons side by side | Nothing reads as the main action | One filled, one tonal or text |
| Grey text with `opacity` or alpha colors | Fails contrast unpredictably | `on-surface-variant` |
| Inventing radii, sizes or durations | Drift from the system | `--md-sys-shape-corner-*`, `--s4-size-*`, `--s4-space-*`, spring tokens |
| `position: fixed` app bars or a full-height scrolling `main` | Fights the shell's sticky bars and phone browser behavior | The `.s4-app` shell, window scroll |
| Sentence-case buttons ("Save changes") or Title Case sentences | Breaks the house writing style | "Save Changes"; "Your changes are saved." |
| Status shown only by color | Fails for color-blind users | `.s4-status` with a word |
| Tabs to pick a period or a list / grid view, or a button group that shows and hides panels | Two controls look alike and do each other's job | A value or a view of the same thing: button group; different panels: tabs (decision 0059) |
| Icon-only button without `aria-label` | Unusable with a screen reader | Add `aria-label` (and `data-tooltip`) |
| Styling bare elements (`button {}`, `h2 {}`) in app CSS | Leaks into components | Style the app's own classes |
| Editing `orion.css` / copying component CSS into the app | Forks the system | App CSS with tokens; ask to change the system |
| Tinting surfaces with the accent, or a second accent color | The base stays neutral; one accent keeps selection and actions readable | One `seed`; status tones for meaning |
| Hand-written `transition: all .3s ease` | Wrong curve, ignores reduced motion | a pattern token: `transform var(--s4-motion-ink)` |

## Worked example

Request: "Add a screen to my expenses app listing this month's bills, with a way to add one."

```html
<section class="s4-view" data-view="bills" data-title="Bills">
  <div class="s4-page-header">
    <h2 class="s4-headline-small">October</h2>
    <span class="s4-num s4-title-large s4-emphasized">$4,459.13</span>
  </div>
  <div class="s4-chip-set" data-select="single" data-clearable aria-label="Filter bills">
    <button class="s4-chip" data-type="filter" aria-pressed="false" type="button"><span class="s4-chip-check"></span>Due</button>
    <button class="s4-chip" data-type="filter" aria-pressed="false" type="button"><span class="s4-chip-check"></span>Overdue</button>
  </div>
  <ul class="s4-list" data-style="segmented">
    <li class="s4-list-subheader">This Week <span class="s4-list-subtotal">$1,629.95</span></li>
    <li><a class="s4-list-item" href="#bill-10482">
      <span class="s4-list-leading"><span class="s4-avatar">IM</span></span>
      <span class="s4-list-content"><span class="s4-list-headline">Iron Mountain</span><span class="s4-list-supporting">Due Oct 28</span></span>
      <span class="s4-list-trailing"><span class="s4-list-amount">$1,240.00</span><span class="s4-status" data-tone="error">Overdue</span></span>
    </a></li>
  </ul>
  <button class="s4-fab" data-fixed data-sheet="add-bill" type="button"><span class="s4-icon" data-icon="add"></span><span class="s4-fab-label">Add Bill</span></button>
</section>
<dialog class="s4-bottom-sheet" id="add-bill" aria-labelledby="add-bill-h">
  <h2 class="s4-sheet-title" id="add-bill-h">Add Bill</h2>
  <div class="s4-sheet-content">
    <div class="s4-text-field"><input id="vendor"><label for="vendor">Vendor</label></div>
    <div class="s4-text-field"><span class="s4-text-field-affix" data-prefix>$</span><input id="amount" inputmode="decimal"><label for="amount">Amount</label></div>
  </div>
  <div class="s4-sheet-actions"><button class="s4-button" data-variant="tonal" data-close="cancel" type="button">Cancel</button><button class="s4-button" data-close="save" type="button">Save Bill</button></div>
</dialog>
```

Why it looks like this: a list (scan and open), grouped with a subtotal; a status word, not a red row; one FAB for the one
dominant action, inside its view so it floats above the nav bar and leaves with the screen, and it opens the sheet; Title Case labels,
sentence-case nothing here; amounts in tabular figures; no colors, sizes or motion written by hand. Handle
`s4-close` on the sheet (`e.detail.value === 'save'`) and confirm with `S4.snackbar({ text: 'Bill added', action: 'Undo' })`.

## Check before handing over

Run `node <skill>/scripts/check.mjs page.html` (Playwright). It loads the page as a 390px dark phone and a 1280px light
desktop (every app-shell view, not just the first) and reports console errors, unknown icons, sideways scroll, text below WCAG AA as rendered (including on glass),
app CSS that breaks the rules above (hex colors, `!important`, glass on content, raw durations, bare element
selectors), and silent failures: an `s4-` class nothing defines (a misremembered name styles nothing), a word split
across lines or a box one glyph wide, a part outside its component, window controls short of the window's edges, and the
same word and overflow checks frozen in the middle of every motion (rail, dialog, panel, menu, expand, page). Look at the two screenshots it saves too. Fix what it reports, run it once more, then hand over.

It also warns on more than one filled action on the first screen (0070), and fails a control whose content is wider than its box and any direct `clipboard.writeText` (decision 0073): copy with `S4.util.copy(text, { done: 'Link copied' })`, which never rejects and says when the browser refused. A nav tab's hover is the selected highlight's box. An app's own grid names its column (`grid-template-columns: minmax(0, 1fr)`), and trailing or meta text wraps (it never truncates or widens the page).

Also check by eye: one filled button per area, Title Case labels, status words, the nav bar on a phone and the rail on a
desktop, and both themes.

## Update to latest Orion

When the user says **"update to latest Orion"** (or "upgrade Orion", "move this app to Orion 2"), follow
`references/upgrading.md`. In short (decision 0075):

1. **Get the latest Orion first**, even if this skill is older: the attached repo `4RK0S4H4/Orion` (pull it), else download
   `https://github.com/4RK0S4H4/Orion/raw/main/skill/dist/orion.skill` and unzip it; use that folder as `<source>`.
2. Read the app's `orion.json` (and its last `orion-upgrade.md`).
3. Dry run: `node <source>/scripts/upgrade.mjs <app-dir> --source <source>`; read the plan.
4. Apply with `--write`: vendored files replaced, URLs pinned to `releases/<version>/` (never a moving address), renames
   applied by context, packs linked, brand file regenerated, stamps and `orion.json` updated, `orion-upgrade.md` written.
5. Work through every judgment item in the report (each names its decision); try removing workarounds whose issue it
   says is fixed.
6. Run the page checker on every page and look at the screens at 390 and 1280, light and dark; commit
   ("Update to Orion x.y.z"); log any Orion defect as below.

A **major** version changes how things should look: after the script, redraw each screen in the new rules and keep every
screen and element the app has (decision 0053); never swap one for the nearest stock component.

## Found a problem in Orion?

If a component, token, rule or the checker is broken, missing something the app needs, or surprising: do not patch Orion's files from the app and do not work around it silently. Log it. Where the repo `4RK0S4H4/Orion` is attached, follow "If you are a session building another app with Orion" in its `CLAUDE.md`: a GitHub issue with the `from-app` form (app name, component or page, what happened, what was expected, steps, screenshot, browser/device/shell, Orion version from `CHANGELOG.md`), else an entry in `docs/issues/inbox.md` on a branch `issues/<app>-<date>` (never push `s4-orion` or `main`). With only this skill, tell the owner in chat in that same shape. One problem per report. The app's workaround goes in its own stylesheet with a comment naming the issue. A missing element Orion's rules can make is not a defect: build it in the app's stylesheet (decision 0053).

## References (read when needed)

| File | Read it when |
|---|---|
| `templates/*.html` | Starting any new app or page (see Start from a template). |
| `references/components.md` | Writing markup for any component: classes, attributes, events, do/don't. Search it for the class you need (e.g. `s4-table`, `data-select`) rather than reading it all. |
| `references/patterns.md` | Laying out a screen: dashboards, list and detail, settings, forms, empty and loading states, theme controls, saving data. |
| `references/icons.md` | Picking an icon name. |
| `references/tokens.md` | You need a token name or value (color roles, type, shape, spacing, sizes, z-index, springs, glass). |
| `references/glass.md` | Anything about glass, transparency, blur or overlays. |
| `references/motion.md` | Choosing or writing an animation or transition. |
| `references/color.md`, `typography.md`, `shape.md`, `spacing.md`, `elevation.md` | The reasoning and rules behind each foundation. |
| `references/upgrading.md` | Updating an app to a newer Orion: `orion.json`, the upgrade script, migrations, releases. |
| `references/accessibility.md` | What the system guarantees and what the app must still do. |
