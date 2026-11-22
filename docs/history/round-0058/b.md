# Round 0058, workstream B: notes for the integrator

Branch `round58/b`. Decision record: [`docs/decisions/0066-light-sites-wide-showcase-new-dials.md`](../../decisions/0066-light-sites-wide-showcase-new-dials.md)
(every visible choice and why). This file holds what workstream A merges into the shared docs.

## What was built (paths)
| Item | Paths |
|---|---|
| Site bundle | `scripts/build.mjs` (`SITE_CSS`, `SITE_JS`, `SITE_BUDGET`, coverage and budget check), outputs `components/orion.site.min.css`, `components/orion.site.min.js`, `skill/s4-orion/assets/orion.site.min.*` |
| Latin Inter | `scripts/font-subset.mjs` (new), outputs `components/assets/inter-site.woff2`, `skill/s4-orion/assets/inter-site.woff2` |
| Site templates on it | `templates/{landing,pricing,blog,docs,site}.html`; `components/site/site.js` (column names for a site table when table.js is absent; header scroll-spy); `components/site/README.md` (performance section rewritten) |
| Showcase | `demo/index.html`, `demo/demo.js`, `demo/demo.css` (Home wide layout, states, swipe, select several, note page, All Notes table + filter, Board view, palette, Controls in two columns); `components/direct/direct.css` (segmented swipe rows) |
| Hub | `index.html` (rewritten); `scripts/build.mjs` writes its component groups, labs, counts and version |
| Templates at 1600 | `templates/dashboard.html` (Tally layout, period switch, compact + tight), `templates/list-detail.html` (Relay queue width), `templates/landing.html`, `templates/site.html` (nav links to sections, no static current), `components/site/site.css` (one selection per docs screen) |
| Quiet danger | `demo/index.html`, `templates/settings.html`, `components/pane/{pane.css,pane.html,README.md}`, `components/dialog/dialog.html`, `components/button/README.md` |
| Grabber, following scrim | `components/sheet/sheet.css`, `components/dialog/dialog.js`, `components/motion/motion.js` (`scrim(d, open, { from })`), `components/glass/glass.css` + token `--s4-glass-tint-opacity-modal-phone` (`tokens/src/glass.tokens.json`), tokens `--s4-size-grabber-width|height` (`tokens/src/spacing.tokens.json`) |
| Firm containers | `components/base/brand.css` |
| Scale and headings | `scripts/build-tokens.mjs` (generates `components/base/scale.css`), `components/index.css` (imports it), `components/base/brand.css` (headings), `components/core/core.js` (`S4.theme` keys), `components/swatches/swatches.js` (`data-brand-dial`), `tests/suite.mjs` (two presets), `scripts/check-scopes.mjs` (proof), `templates/blog.html` (Tidewater editorial) |

Small edits in A's area, needed for the site bundle (please keep when merging):
- `skill/s4-orion/scripts/check.mjs` line 28: `SYSTEM_CSS` also matches `orion.site.min.css` (otherwise the page checker lints Orion's own site stylesheet as page CSS and reports 5,000 errors).
- `skill/s4-orion/scripts/inline.mjs`: recognises `orion.site(.min).js` when deciding whether to inline `m3color.js`.
- `scripts/check-motion.mjs` line 91: the generated-copies pattern includes `orion.site.min.*`.

## Measured
| Gzip -9 (font as sent) | Before (app min files) | Site bundle | Budget |
|---|---|---|---|
| CSS | 63.0 KB | 42.3 KB | 44 KB |
| JS | 113.7 KB | 26.4 KB | 30 KB |
| Font | 161.3 KB | 67.4 KB | 70 KB |
| Icons (`icons-solar.js`) | 36.9 KB | 36.9 KB | |
| Total | 375 KB | 173 KB | 180 KB |
Network for `templates/landing.html` (all requests): 185 KB. `templates/docs.html`: 181 KB.

## Changelog lines
- Added: the site bundle, `orion.site.min.css` and `orion.site.min.js` (what a `body.s4-site` page uses: 42 KB + 26 KB gzip, was 63 + 114), and `inter-site.woff2` (Inter cut to Latin and weights 400 to 900: 67 KB, was 161), written by a dependency-free subsetter (`scripts/font-subset.mjs`). The five site templates and the hub load it; `npm run check` holds a size budget (CSS 44, JS 30, font 70, total 180 KB) and fails a site template that needs something the site bundle leaves out.
- Added: two brand dials, `scale` (`compact`, `large`: type and spacing step together; `components/base/scale.css`, generated from the tokens) and `headings` (`tight`, `editorial`: weight, tracking and leading of the heading roles), through `S4.theme`, `data-*` on any element and `data-brand-dial`. Tally uses compact and tight; Tidewater uses editorial in place of its own heading CSS.
- Added: a grabber on modal panels on a phone, and a scrim that follows a downward drag and leaves from where the finger let go (`S4.transition.scrim(d, open, { from })`). Dialogs keep their scrim.
- Added: the Showcase covers every element again: pages (a note opens as a page), states, swipe and select several, a table at scale with filters and saved views (All Notes), a board, a chart, a meter and the command palette.
- Changed: `corners: firm` reaches containers (cards 8, panes 12, list groups 16, menus, dialogs and panels 20, bands 32); `soft` goes halfway. The default look is unchanged.
- Changed: danger zones are neutral panes with a tonal error button; the dialog carries the weight (`data-color="error"` on a pane is old markup).
- Changed: modal dialogs and panels on a phone are tinted 96% (no show-through of the button behind them).
- Changed: the hub is a front page: a live preview with dials, the templates as specimens, the component groups and labs written by the build, counts and version stamped from the repo.
- Changed: Showcase Home is two columns on a wide window; Controls flows in two columns.
- Changed: a site header marks the section being read and nothing over the hero; on a docs page only the sidebar's page wears the selection fill.
- Fixed: Tally's chart no longer stretches to its neighbour's height and its period switch sits beside the main action; Relay's queue no longer wraps titles to four lines at 1600; Sprig and Hollis & Vane no longer open with a nav item selected; Mallet no longer shows three accent fills at once.
- Fixed: swipeable rows in a segmented list keep the segment fill and corners.

## CLAUDE.md bullet (for "Rules that are easy to break")
- Decision 0066: sites load the site bundle (`orion.site.min.css`, `orion.site.min.js`, `inter-site.woff2`, `icons-solar.js`), never the app bundle, unless they need a part it leaves out (`npm run check` holds the budget and fails a site template that uses one). Danger zones are neutral panes with a `tonal` + `error` button; the dialog carries the weight. Modal panels on a phone have a grabber and a scrim that follows the drag (dialogs do not); modal glass is 96% on a phone. `corners: firm|soft` reach containers. Two more dials: `scale` (compact, large) and `headings` (tight, editorial), on any element. One filled selection per screen. A site header never opens with a nav item selected. The hub's counts are written by the build.

## SKILL.md guidance (for the Websites and "Make it this app's own" sections)
- **Files for a site:** link `inter-site.woff2` (preload), `orion.site.min.css`, the brand file, then `icons-solar.js` and `orion.site.min.js` (both `defer`). It has the site kit and everything a site normally shows (buttons, groups, tabs, cards, lists, accordion, a static table, stat, ring, meter, milestones, prose and code, fields and form basics, chips, slider, menu, snackbar, tooltip, glass, motion). A site that needs an app part (dialog, sheet, data table, filter, chart, board, rich inputs) loads `orion.min.css` and `orion.min.js` instead. Text outside Latin: use `inter-variable.woff2` with its own `@font-face` (same family name) after the stylesheet.
- **Scale:** `S4.theme({ scale: 'compact' | 'large' })` or `data-scale` on any element: type and spacing together. Compact for dense tools and dashboards read on a desk; large for reading-first or older audiences. Never to fix one component, never instead of density (control sizes) or roomy (content sites' margins).
- **Headings:** `S4.theme({ headings: 'tight' | 'editorial' })` or `data-headings`: tight is bold and tracked in (a confident product or tool), editorial is regular weight and open leading (a magazine, a studio). Use it instead of writing font-weight or letter-spacing on headings or on `.s4-hero-title`; pair editorial with a serif display face, tight with Inter, system or a grotesque.
- **Danger zone:** the last pane of settings, neutral, with `<button class="s4-button" data-variant="tonal" data-color="error" data-dialog="confirm">`. Never `data-color="error"` on the pane and never a filled red button.
- **Selection:** one filled selection per screen; a second "you are here" mark (a table of contents, the header beside a docs sidebar) is quieter.

## Hub / README changes
- The hub is rewritten (`index.html`); nothing else to add there. Its counts say **78 components** (folders with a README and reference page) and **20 templates**; CLAUDE.md, README and framework.md say 81 (they also count glass, motion and icons). The docs drift pass should make the two agree (either "78 components, plus glass, motion and icons" or change the hub's wording); the hub's number is written by the build from `GROUPS` in `scripts/build.mjs`.
- README phase table / decisions index: add 0066 (status: built, our call).

## What to check on an iPhone
1. **Hub** at 390: the live preview's three dials (corners, headings, mode) change only the preview; the specimens two per row.
2. **A site template's weight**: open Sprig on cellular; the font (67 KB) should arrive before the hero text swaps.
3. **Subset font rendering in Safari**: Sprig, Tidewater and the hub; any missing glyph (a box) or wrong weight means the null-transform WOFF2 needs a second look.
4. **Showcase**: swipe a note left (Archive with Undo), hold a note to pick several (the top bar turns into the selection bar), open a note (Back gesture returns), See All 480 Notes (stacked rows, filters panel), the Board (hold a card, drag between lanes).
5. **Modal panel**: Showcase, Controls, Floating Panel: the grabber, then drag the card down slowly: the scrim lightens with the finger; let go short (both settle back), let go past a quarter (it leaves from there). A dialog (Settings, Delete All Notes) has no grabber and its scrim stays.
6. **No pink smudge**: Settings, Delete All Notes in light mode: the card is quiet over the red-tinted button behind it.
7. **Larkline settings**: the danger zone is a calm pane with a pink tonal button.

## Unfinished / unverified
- Icons are the biggest file a site loads now (37 KB); per-page icon subsetting is left for later.
- Firefox and WebKit were not available to verify the subset font and the following scrim (`::backdrop` inheriting a custom property needs Safari 17.4+ / Firefox 120+; older ones simply do not fade it with the finger).
- A third template on the new dials was not done (Tally and Tidewater use them).
