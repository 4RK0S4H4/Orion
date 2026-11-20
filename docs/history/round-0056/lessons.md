# Round 0056: lessons from the template work, turned into Orion

The owner asked that each template be built as its own product and that we "use that as a lesson for what to add or
change on S4 Orion". This collects every lesson from the notes in this folder (hierarchy-wide, tpl-b2, tpl-b3, tpl-b4,
tpl-b5, critiques-61, rich-inputs, presets-proof, reach, theming-depth, website-kit), deduplicated. Branch
`round56/lessons`; what was built is recorded as decision [0060](../../decisions/0060-lessons-from-the-templates.md).

Templates: Tally (dashboard), Relay (list-detail), Pressroom (kanban), Moorings (calendar), Slugline (editor), Crate
(gallery), Proof (tool), The Velvet (checkout), Fetch (chat), Puck (onboarding), Sprig (landing), Hollis & Vane (site),
Tidewater (blog), Mallet (docs), Spool (pricing), Larkline (settings), Overhang (sign-in), Penumbra (article).

Status: **built** (in this branch, decision 0060) · **fixed earlier** (in a workstream branch this round) · **docs**
(written down in the skill or foundations; no code needed) · **next** (small, general, not built here) · **elsewhere**
(belongs to a workstream that owns those files now) · **owner** (a proposal below).

## The lessons

Recurring lessons first (the number of templates that hit them is in brackets).

| # | What | Templates | Change | Status |
|---|---|---|---|---|
| 1 | The default `vibrant` variant turns muted brand seeds neon (terracotta coral, navy cyan, green mint, plum hot pink) [10] | Tally, Slugline, Proof, Velvet, Fetch, Puck, Hollis & Vane, Tidewater, Larkline, Penumbra | Variant `auto` by default: `fidelity` when the seed's HCT chroma < 60 or tone < 35, else `vibrant`; tinted keeps `tonal`; `S4.theme.variantFor(seed)`; swatches keep the page's variant; `check:accent` proves the named accents in their default variant (216 schemes). Chosen from a side-by-side render of 15 seeds in light and dark | built |
| 2 | The glass FAB's label fails 4.5:1 with a seed (2.3 to 3.6:1), so templates switched to `data-color="primary"` [3] | Slugline, Relay, the dial presets pass | `core.js` picks the default FAB's label (on-primary-container, white or the accent's tone 10, whichever keeps the most glass) and raises a FAB's tint per scheme only as far as its label needs; `check-glass` proves FAB labels for 192 seeded schemes (neutral and tinted) and the monochrome default FAB; the suite no longer exempts seeded FABs | built |
| 3 | `S4.theme.restore` cannot keep a fixed brand and save only the visitor's light/dark choice; seven templates hand-wrote a mode-only restore [8] | Tally, Relay, Pressroom, Moorings, Slugline, Crate, Proof, Tidewater | `S4.theme.restore(key, brand, { only: ['mode'] })`: only those keys are read and saved (merged into a shared save); the seven templates use it. Also fixed: `S4.theme()` reported `variant: 'vibrant'` when none was set, so a restored tinted app switched from tonal to vibrant | built |
| 4 | The brand accent arrives only after the color script loads: branded pages paint monochrome first [5] | Sprig, Velvet, Fetch, Puck, Larkline | see "For the owner" 1 | owner |
| 5 | No categorical palette but the chart's; tags, desks, revision colors, sleeves borrow `--s4-chart-*` [4] | Pressroom, Crate, Slugline, Moorings | `--s4-category-1…6`, aliases of the chart palette, fixed in both modes, named in words; documented in color foundations | built |
| 6 | A display face lighter than Inter is too heavy at 600 (Didone, book serif, Futura) [3] | Hollis & Vane, Tidewater, Penumbra | Dial `displayWeight: 'medium' \| 'regular'` (`data-type-display-weight`), on any element, in `data-brand-dial`, in the dial presets pass | built |
| 7 | Face presets: `rounded` falls back to the system sans off Apple; no geometric or humanist preset, so apps hand-wrote Futura, Gill Sans, Optima stacks [6] | Sprig, Fetch, Moorings, Crate, Hollis & Vane, Puck, Proof | `rounded` gains Hiragino Maru Gothic, Nunito, Quicksand, Comfortaa, Arial Rounded (display), Calibri; new presets `geometric` (Futura, Century Gothic, URW Gothic, Avenir Next, Corbel) and `humanist` (Seravek, Gill Sans, Calibri, Candara, Ubuntu, Noto Sans); Didone, condensed and classical humanist stacks documented for `custom` | built |
| 8 | No 2dp token for seams (paired bars, keys, segmented bars) [2] | Tally, Mallet | `--s4-space-hairline` (2px); components that wrote `calc(var(--s4-space-1) / 2)` use it | built |
| 9 | A select whose options or value change from script keeps a stale glass picker | Moorings | The picker rebuilds on open, on option changes (observer) and when `value` / `selectedIndex` are set as properties | built |
| 10 | No documented way to move a button group's selection from script (to follow the caret) | Slugline | `S4.buttonGroup.set(group, value)` and `.value(group)`; the Ink Track follows; no `s4-change` | built |
| 11 | `data-accent` set with `setAttribute` after load does nothing | Crate | `core.js` watches `data-accent`, `data-accent-variant` and `data-surfaces` on any element | built |
| 12 | The page checker's style lint splits at commas inside `:is()` and flags the pieces as bare selectors | Hollis & Vane | Selector lists split at their own commas only | built |
| 13 | No hero-number size [2] | Tally, Proof | `.s4-stat[data-size="hero"]` (display-medium); the layout pass already lets `.s4-stat-value` outrank the title | built |
| 14 | A sticky split pane clips the focus ring of a button in its corner | Moorings | The sticky pane keeps ring-sized padding and gives it back with a negative margin | built |
| 15 | Layout pass: "3.4 GB" read as words larger than the title; a leading avatar in a chat bar failed the align check [2] | Larkline, Fetch | A number with a short unit ranks by size; a leading `.s4-avatar` may start the bar | built |
| 16 | Six swatches wrap inside a pane at 390 | Larkline | `.s4-swatches[data-size="s"]` (40dp) | built |
| 17 | The showcase's own brand-dial handler is redundant once `data-brand-dial` works by itself | Larkline | Removed from `demo/demo.js` | built |
| 18 | No internal-note or card kind in a thread [2] | Relay, Fetch | `.s4-message[data-kind="note"]` (warning container across the thread) and `[data-kind="card"]` (no bubble) | built |
| 19 | A dark docs sidebar needed `.s4-docs-nav` restyled | Mallet | A scoped theme on `.s4-docs-nav` makes a toned, rounded block from 840 | built |
| 20 | Swatches read `data-variant` but the README did not say so | Puck | Documented, and the default is now the page's own variant | built |
| 21 | A scoped theme paints its own surface, so a scope on a square wrapper shows a square patch [2] | Overhang, Penumbra | Rule in the skill and patterns: put `data-theme` on the rounded block | docs |
| 22 | Artwork changes ground with the mode; the fixed roles do not [2] | Crate, Sprig | Documented: drawings of real objects on the fixed roles | docs |
| 23 | Own headings fall back to the text face | Velvet | Documented: take the typescale font token or a type class | docs |
| 24 | Custom face set twice (on `<html>` and in restore) to avoid a flash | Tidewater | Already fixed by 0056 (dials in markup are the starting state); now documented with restore | docs |
| 25 | A one-task screen at desktop (split onboarding), an article head, a structured writing format (a script), words over a picture (stack, never a fixed margin), a scrolling chip row takes the whole row [5] | Puck, Penumbra, Slugline, Overhang, Crate | "From the product templates" in `references/patterns.md` | docs |
| 26 | Extended FAB label wrapped (rounded `scrollWidth`) | Slugline | `fab.js` measures the box | fixed earlier (tpl-b2) |
| 27 | Slider stop dots widened a printed page | Proof | No stop dots in print | fixed earlier (tpl-b2) |
| 28 | The reach keys pass read a native time field's parts as a Tab loop; it ignored sideways scroll [2] | Proof, Pressroom | Both fixed in `tests/reach.mjs` | fixed earlier (tpl-b2, hierarchy-wide) |
| 29 | No Loop cycle token for an app's own live dots | Fetch | `--s4-loop-cycle` | fixed earlier (tpl-b3) |
| 30 | Number stepper and a minus icon missing [2] | Velvet, Proof | `.s4-number-field` (`data-inline`), icons `minus`, `plus` | fixed earlier (rich-inputs) |
| 31 | Labels broke mid-word in button groups ("Devi/ce", "Enterprise") [2] | Tally, Spool | Segments never narrower than their label; the group wraps | fixed earlier (critiques-61) |
| 32 | The connected button group's selected segment was the darkest thing on a pale page | Sprig | The Ink Track (0059) | fixed earlier (0059) |
| 33 | Brand dial groups needed app wiring | Larkline | `data-brand-dial` in `swatches.js` | fixed earlier (tpl-b5) |
| 34 | `[data-period]` assumed monthly/yearly | Sprig, Mallet | Any values | fixed earlier (tpl-b4) |
| 35 | Lively energy pushed the nav pill past the screen edge | Relay | Clipped | fixed earlier (hierarchy-wide) |
| 36 | `.s4-chart` has no paired or grouped columns, no tick thinning in a narrow pane, no small "month of bars" for a card [2] | Tally, Spool | `data-type="column" data-group`, tick thinning, a compact bar series | elsewhere (chart) |
| 37 | No code block with a copy button or file name in the site kit | Mallet | The data-scale code block, linked from the docs template | elsewhere (data-scale) |
| 38 | A list row shows one trailing status; a desk needs two (SLA and priority) | Relay | Document stacking two `.s4-status` in `.s4-list-trailing` (or a second trailing line) | next |
| 39 | A slider with its value as a heading, and an exact-value field for big numbers [2] | Proof, Spool | `.s4-slider[data-value="heading"]` (label and value on one row above the track) with an optional paired number field | next |
| 40 | A picture outside prose has no caption treatment | Penumbra | `.s4-caption` (body-small, on-surface-variant, under the figure) or `figure.s4-figure` | next |
| 41 | `.s4-post` has no slot for a section label and byline | Tidewater | `.s4-post-kicker`, `.s4-post-byline` in the site kit | next |
| 42 | A swatch group could show its picked name | Larkline | `data-show-name` writes the pressed swatch's label beside the group | next |
| 43 | No icons for weather and sky (wind, sun, moon, star), boats, climbing [3] | Moorings, Penumbra, Overhang | A weather and sky set through `scripts/add-icons.mjs` (all three sets) | next |
| 44 | Lane counts, limits and the add-in-place footer re-implemented on every board; a board needs the rail collapsed [2] | Pressroom, Moorings | see "For the owner" 4 | owner |
| 45 | A labelled track (runway, response clock, word meter, fleet track, storage bar) drawn five times | Tally, Relay, Pressroom, Moorings, Larkline | see "For the owner" 3 | owner |
| 46 | Small capitals and old-style figures for editorial type | Tidewater | see "For the owner" 2 | owner |
| 47 | Dense map-like pickers (seats) fit a phone only with trimmed padding under the 24px target rule | Velvet | see "For the owner" 5 | owner |
| 48 | System stacks vary most for condensed and Didone faces; one bundled brand face? [3] | Overhang, Velvet, Penumbra | see "For the owner" 6 | owner |
| 49 | Monochrome FAB with `data-color="tertiary-container"` and a label: 3.85:1 over a pure white backdrop (found by the new check) | `check-glass` | see "For the owner" 7 | owner |
| 50 | The vibrant toolbar on glass is exempt from the AA text check with a seed | presets-proof | see "For the owner" 8 | owner |
| 51 | In tinted dark mode `tertiary-container` is a bright tone, too loud for "other people's bookings" | Moorings | Not a role change: a second series of the same kind uses `outline` as a fill, or a category color; noted in color foundations under categories | docs |
| 52 | Ticket notches need the page color by hand | Velvet | An app element; no change | no change |

## Elsewhere (for the workstreams that own these files)
- `components/chart/`: paired and grouped columns (`data-type="column" data-group`), tick thinning when the plot is
  narrow, a compact bar series for a card ("a month as 31 bars"), labels that do not collide at 200% text (Tally, Spool).
- data-scale: a code block with a file name and Copy, usable inside the site kit's docs page (Mallet).
- `components/table/`, `components/desktop/`: no lesson from the templates touched them.

## For the owner

1. **The brand color arrives late** (Sprig, Velvet, Fetch, Puck, Larkline). A seed needs `m3color.js` (100 KB) at run
   time, so a branded page paints monochrome for a moment, then turns its color. Options: (a) **a brand file at build
   time**: the skill's `inline.mjs` (or a small `scripts/brand.mjs --seed … --variant …`) writes the generated scheme as
   CSS the app links in its `<head>`; no flash on any visit, no color script for a fixed brand; the cost is one more
   build step and a file to regenerate when the brand changes. (b) **a runtime cache**: `core.js` keeps the generated CSS
   in `localStorage` and the head pre-paint snippet injects it; no build step, but the first visit still flashes and
   every app needs the longer snippet. (c) do nothing. **Recommendation: (a)** for templates and apps with a fixed brand
   (most of them), plus (b) later for apps where the visitor picks a color.
2. **Editorial type: small capitals and old-style figures** (Tidewater). Real small caps and old-style figures exist in
   the system serifs (New York, Iowan Old Style, Georgia) and in Inter only partly. Option: an opt-in
   `data-type-numbers="oldstyle"` for prose and a `.s4-kicker` role that uses `font-variant-caps: all-small-caps` where the
   face has it and falls back to the label role. Trade-off: one more dial, and faked small caps where a face lacks them.
   **Recommendation:** yes for `.s4-kicker` (editorial sites need it now), no for a figures dial until a second
   editorial template asks.
3. **A meter: the labelled track** (Tally's runway, Relay's response clock, Pressroom's word meter, Moorings' fleet
   track, Larkline's storage bar: five drawings of one element). Proposal: `.s4-meter`: a label, the value in words, a
   filled track with a fill and an optional target mark, a tone by state (on track, near, over), segments for a share of
   a whole with a legend; one series = the accent, segments = categories. Trade-off: one more component to keep proven
   in every dial preset. **Recommendation: build it**; it is the most repeated element the templates drew.
4. **A board: lanes** (Pressroom, Moorings' fleet board, any pipeline or calendar week). Proposal: `.s4-board` with
   `.s4-lane` (head with count and an optional limit that turns the count to the error tone, an add-in-place footer,
   horizontal snap on a phone, reorder through `components/direct/`); a board page collapses the rail by default.
   Trade-off: lanes are layout plus behaviour, a larger component. **Recommendation: build it** after the meter.
5. **Dense map-like pickers** (Velvet's seat plan). WCAG 2.5.8 allows a smaller target when targets are 24px apart. The
   suite asks for a 24px box. Proposal: an opt-in `data-dense` on a picker that the suite checks against the spacing
   rule (24px pitch, at least 18px drawn) instead. **Recommendation: yes**, opt-in only, for maps of real things (seats,
   keys, calendar cells), never for ordinary controls.
6. **One bundled brand face** (Overhang's condensed face, Velvet's and Penumbra's Didone). System stacks vary most for
   exactly these, so Windows and Android see a different width. A bundled variable face costs 100 to 200 KB and a
   license review. **Recommendation: no**; keep Inter as the only bundled face, keep the presets, and document how an
   app ships its own `@font-face` (one file, `font-display: swap`, its name first in `custom`).
7. **Monochrome colored FAB labels** (found by the new check). A monochrome FAB with
   `data-color="tertiary-container"` and a label is 3.85:1 over a pure white backdrop at your 90% tint (decision 0032);
   icons pass (3:1). With a seed this is now solved per scheme. Options: raise the monochrome tint for that one color in
   light mode to 97%, or compute the monochrome FAB tints at build time with the same rule. **Recommendation:** the
   same rule at build time, so every FAB in every scheme follows one rule.
8. **The vibrant toolbar on glass** keeps its recorded exception with a seed (decision 0032). The FAB rule of 0060
   (tint rises only as far as the text needs) would cover it too. **Recommendation:** apply the same rule; it changes
   your 90% only where a seed's pair needs it.
