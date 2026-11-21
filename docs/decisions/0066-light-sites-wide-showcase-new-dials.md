# 0066: A light site bundle, a wide Showcase and hub, quiet danger, a grabber, firm containers, scale and headings (2026-11-21)

**Status:** built in round 0058, workstream B. Our calls, made under the owner's hand-over of 2026-11-21 ("I'll let you
take the lead on this, and feel free to change past rules ... do anything you feel like it is for the best"). The owner
can overrule any of it. Notes, changelog lines and the iPhone list: [`history/round-0058/b.md`](../history/round-0058/b.md).
Source: the independent re-grade 2 (Websites 7.5, Visual Hierarchy 7.5, Per-App Customization 8; its top-10 items 6, 7, 9
and the "close behind" list).

Amends: **0057** (sites load the site bundle, not the app bundle's min files), **0055** (two more dials; `corners`
reaches containers), **0064** (modal panels get a grabber and a scrim that follows the drag on phones; modal glass is
firmer on phones), **0043/0047** (a danger zone is a neutral pane). No motion pattern was added (0046).

## 1. A site bundle and a Latin Inter
A landing page loaded the whole app runtime: about 213 KB gzip of CSS, JS and icons plus the 161 KB font.

- `npm run build` writes **`orion.site.min.css`** and **`orion.site.min.js`**: what a `body.s4-site` page uses (tokens and
  base with every dial, type, the site kit, buttons and groups, tabs, cards, lists, accordion, breadcrumbs, pagination, a
  static table, stat, ring, meter, milestones, description list, prose and code, fields, form, switch, checkbox, radio,
  chips, slider, badge, status, banner, empty state, menu, snackbar, tooltip, glass, motion). Left out: the app shell,
  navigation chrome, desktop anatomy, dialogs, sheets, palette, tables at scale, filters, charts, boards, direct
  manipulation, the rich inputs. A site needing one loads the full min files. The lists are `SITE_CSS` / `SITE_JS` in
  `scripts/build.mjs`.
- **`inter-site.woff2`**: Inter cut to Latin, Latin-1, the Western European extras and the punctuation, currency and
  arrows real copy uses, weights 400 to 900 (Orion writes 400 to 700), the optical size axis kept. Written by
  **`scripts/font-subset.mjs`**, a dependency-free WOFF2 subsetter (no network, no fontTools): glyph IDs stay, so GSUB,
  GPOS, GDEF and HVAR stay valid unchanged; the kept set is closed over the features Orion can reach (default features,
  figures, small capitals) and composite parts; unkept glyphs are emptied; the light half of the weight axis is dropped
  exactly (tuples that only act below the default weight); kerning and mark data that only unkept glyphs use is zeroed in
  place; null-transform WOFF2. Verified in Chromium: identical advance widths and identical rendering at 400 to 900, 14 to
  48px, tabular figures. The stale check compares the font's tables (not its bytes), so a Node with another Brotli never
  fails it.
- **Measured** (gzip -9; the font as sent): CSS 42.3 KB (was 63), JS 26.4 KB (was 114), font 67.4 KB (was 161), icons
  36.9 KB (unchanged): **173 KB**, was 375. A site template over the network (landing): 185 KB with its HTML and brand file.
- **Budget in `npm run check`**: CSS 44, JS 30, font 70, all four 180 KB. `check:bundle` also fails a site template that
  writes an `s4-` class the site stylesheet lacks, or uses a component whose script the site runtime leaves out (a site
  table gets its column names from site.js when table.js is absent). The five site templates and the hub load it.

## 2. The Showcase at 1280 and 1600, and every element again
The Showcase is still a generic notes app (0023), not a wall of parts:
- **Home** is two columns from 1000 wide: the notes (search, filters, pinned cards, the week's list) and "Your Week"
  (two stats, a column chart with its table, a storage meter). The list has its **states** (loading, offline, empty,
  error with Try Again), rows **swipe** to archive and can be **picked several** (hold, or tap the picture) with a
  selection bar in the top bar. Notes open as a **page** (`data-page-open`, a link per note). "See All 480 Notes" opens
  **All Notes**: a **table at scale** (`S4.table`, 480 rows) narrowed by the **filter** pattern (saved views, a tool panel
  with counts, sort), with a no-results state.
- A **Board** view (four lanes, a limit, add in place, drag or Alt+arrows), and the **command palette** (top bar, mod+K)
  with the app's real actions. Controls flows in two columns on a wide window.
- The rail starts by width (`data-rail="auto"`), so a board in the app no longer collapses it on Home.
- Segmented lists keep their segment fill and corners on swipeable rows (direct.css): the swipe face had painted the
  plain surface over them.

## 3. The hub is a front page
`index.html` is a monochrome front page (issue 66) on the site bundle it describes: what Orion is, a **live preview**
whose dials (corners, headings, mode) are set on that region alone (`S4.theme(opts, el)`), the twenty templates as
**specimens** in their own display face, corners, grays and heading style (dials on the card, no screenshots), the
component groups with each name linking to its reference page, the docs and the labs. The build writes the component
groups, the lab list, the counts and the version into it, so the front page can never state a stale number.
**Counts:** 78 documented components (folders with a README and a reference page; docs that say 81 also count glass,
motion and icons), 20 templates (15 apps, 5 sites), version 1.1.0.

## 4. Wide templates and one selection per screen
- **Tally**: the chart has a reading height and runs the width under the hero and the numbers; "Needs a Nudge" and the
  aging bar sit under it; the period switch sits beside New Invoice (it had taken the title's `margin-inline-end: auto`).
- **Relay**: from 1400 the queue is 28rem wide (titles in one or two lines, not four); dragging the seam still wins.
- **Sprig, Hollis & Vane**: the header nav marks the section being read (`aria-current="location"`, site.js), and
  nothing while the hero is at the top; no static `aria-current="page"` on an in-page link. Sensor and Practice now link
  to their sections.
- **Mallet docs**: one filled selection per screen. On a page with a docs sidebar, the sidebar's page wears the fill;
  the header's section and "On This Page" are a neutral fill with heavier text (site.css, for every docs page).

## 5. Quiet danger zones (decided)
A danger zone is a **neutral pane, last on the page, with a `tonal` + `error` button**; the confirm dialog carries the
weight. `data-color="error"` on a pane is old markup (kept so it still reads; documented as old). Changed: the Showcase
(Delete All Notes), Larkline (Delete Account), the pane and dialog reference pages, the pane and button READMEs.

## 6. Modal panels: a grabber and a scrim that follows (decided)
On a phone a **modal panel** (`.s4-bottom-sheet`, `.s4-side-sheet` when modal) draws a grabber (32 x 4, on-surface-variant
at 40%, decorative; never on a `data-persistent` panel, never on a dialog). While a finger drags it down the scrim's
opacity follows (`--s4-sheet-drag`, written by dialog.js; direct manipulation, not a transition); let go short and the
scrim settles back with **State**; let go past the threshold and the scrim leaves from where it was
(`S4.transition.scrim(d, false, { from })`). Dialogs keep their scrim: a question is not a surface you move.
**Modal glass on a phone** is tinted 96% (`--s4-glass-tint-opacity-modal-phone`): the card often sits over the button
that opened it, and at 90% a saturated button showed through as a smudge. Wide windows keep 90%. check-glass is green.

## 7. Firm corners reach containers (decided)
`corners: firm` moves every container corner one step down the scale (cards 12 to 8, panes and list rows 16 to 12, list
groups 20 to 16, menus, dialogs and panels 28 to 20, extra-large-increased 32 to 24, bands 48 to 32); `soft` goes
halfway (10, 14, 18, 20, 28, 40). Written from `corner-small` (8) and `corner-extra-small` (4), which never change, so
nothing is sharper than 8, the control corner keeps its value (firm 10, soft 14), and every concentric inset follows.
The default `round` look is unchanged.

## 8. Two new dials: scale and headings (decided)
| Dial | `S4.theme` key | Attribute | Values | Default |
|---|---|---|---|---|
| Scale | `scale` | `data-scale` | `compact` (type x0.92, never under 11px; spacing x0.875), `large` (type x1.08, spacing x1.125) | `default` |
| Headings | `headings` | `data-headings` | `tight` (700, emphasized 800, tracking -3%, leading 1.12), `editorial` (400, title-large 500, tracking -1.5%, leading 1.2) | `default` |

- **Scale** multiplies every type size, line height and tracking, every spacing step (on the 2px grid) and the site's
  fluid type and section rhythm, like Radix Themes' scaling. Control heights and touch targets never change (density's
  job). `components/base/scale.css` is **generated** by `scripts/build-tokens.mjs` from the tokens (aliases are declared
  again in the scope so they follow), loaded before density.css so compact density still maps onto the scaled sizes.
- **Headings** sets weight, tracking (in em, so it follows the size a heading is actually set at) and leading of the
  heading roles (display, headline, title-large) and the site kit's hero and section titles. Body, labels and
  title-medium/small never change. It is written after the face presets, so it wins over a face's tracking reset.
- Both work on any element and nest (0056), are in `data-brand-dial` groups, the dial presets pass
  (`scale-compact-headings-tight` on the phone, `scale-large-headings-editorial` with a serif face), and
  `check:scopes` proves neither declares a color or a mode value.
- Used where they replace hand-written CSS: **Tidewater** (`editorial`: its masthead and cover lost their own weight and
  letter-spacing), **Tally** (`compact` and `tight`: a denser ledger with confident headings, no CSS of its own).

## Not done / open
- The icon file (37 KB gzip, every Solar icon) is now the largest script on a site; a per-page icon subset would need the
  build to know which icons a page draws (scripts can add icons at run time). Left for a later round.
- The font subset drops Cyrillic, Greek and Vietnamese; such a site loads `inter-variable.woff2` with its own
  `@font-face`. GSUB lookups no site reaches are kept whole (zeroing them safely needs a full layout-table walker).
- Firefox and WebKit were not available here to verify the subset font. The null transform for glyf and loca is part of
  the WOFF2 1.0 specification (section 5.1) and Chromium's sanitizer accepted the file; Safari and Firefox need a look.
