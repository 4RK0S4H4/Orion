# Round 0060, workstream B (branch `round60/b`, decision 0070)

Review 4's N1 (Parley's four reds), the Showcase at 1600 (monochrome weight, N6 side column) and a third-party brand
trial. Calls recorded in [`decisions/0070`](../../decisions/0070-one-accent-job-per-screen-brand-trial.md).
Screenshots at 390 dark, 1280 light and 1600 light were taken and looked at for every touched page (desktop-app,
list-detail, calendar, gallery, data-table, editor, kanban, demo Home and Controls, the brand trial's four screens):
zero horizontal overflow, zero page errors.

## What changed
- `components/nav-rail/nav-rail.css`: the rail's main action steps down to elevated while the open view or page shows a
  filled button; `data-variant="elevated"` pins it. README updated.
- `components/list/list.css`: the open row of a list beside its detail (`data-split-open`) is neutral. README updated.
- `components/chip/chip.js`: `data-clearable` on a single-select chip set. README updated.
- `components/chart/chart.js`: column width 16 at most (was 24). README updated.
- `skill/s4-orion/scripts/check.mjs`: a screen-level warning for more than one filled accent action on the first screen
  (site headers not counted); `tests/fixtures/loud-screen.html` + a warning case in `tests/checker.mjs`.
- Templates: Parley and Relay (rail action plain again, steps down by itself), calendar (Book elevated, picked day
  neutral), gallery (no All chip, Show All Records clears). Demo: no All chip, Storage folded into Folders, With Icon
  specimen tonal.
- `components/checkbox/README.md` (described an 18dp outlined square; it is a 20dp filled circle) and
  `components/snackbar/README.md` ("slides up from the bottom edge"): stale text that reaches the skill's components.md.
- `skill/s4-orion/references/patterns.md`: see "What the skill lacked" below.
- `examples/brand-trial/`: Dosewise (`index.html`, `brand.css` from `brand.mjs`).

## For workstream A
- **Linnea (`templates/data-table.html`, yours):** the checker now warns "Accession" + a pressed "All Records" view chip.
  Make the saved views `data-clearable` with no All Records chip (none pressed = every record), or keep the chip and
  accept the warning. I did not touch the file.
- CLAUDE.md: the rules bullet at the end of 0070; 0066's "One filled selection per screen" and 0068 are refined by it.
- SKILL.md: the lines at the end of 0070 (selection bullet, rail bullet, actions, worked example's All chip, the charts
  bullet that contradicts `.s4-chart`, the display-stack warning, the checker warning).
- Decisions README: 0070 (built, round 0060 B). CHANGELOG: the bullets under "What changed".
- Every page's `?v=` stamp changes (nav-rail, list, chip, chart): rebuild after merging rather than resolving stamps.

## The brand trial: Dosewise
**Brief I gave myself, as a newcomer:** a family's medicine tracker for an older parent (Ruth takes eight doses a day,
her children tick them off and order refills). Brand handed over: cobalt `#2457c5`, a humanist display face, soft
corners, the large scale. Built from `SKILL.md`, `references/` and `templates/dashboard.html` only; it links the
skill's `assets/` (a real app copies them). Three views (Today, Medicines, This Week) and a medicine page.

**Checker:** 0 errors, 0 warnings on the first run (390 dark, 1280 light, every view).

**Bespoke or stock? Honestly: the first pass was stock.** Blue accent, soft corners and bigger type, but the screen was
pane, list, pane, the same rhythm as every template, and the humanist face rendered as Carlito here (a Calibri clone),
close enough to Inter to go unnoticed. What changed it: (1) the next dose as the hero with the one filled action beside
it, (2) the day as a `.s4-milestones` road (four dose times, morning done, lunch next), (3) each medicine's own tile on
`--s4-category-1…6`, used in Today, Medicines and This Week. With those it reads as a product made for this job;
the type and corners still do little on their own. The color carries most of the brand.

**What the skill lacked or misled** (fixed outside SKILL.md where I could):
1. *Contradictions in `patterns.md`* (fixed): forms said "move focus to the first invalid field on submit" (0049 forbids
   it), "an error is a filled error-container field" (0043: errors keep the fill), "text fields are a filled pill" (0024:
   12, never a pill); settings said a danger pane is `data-color="error"` (0066: neutral); dashboard said to hand-draw
   charts with primary/tertiary/secondary/error (0051: `.s4-chart`, `--s4-chart-1…6`); the empty state was inline
   styles instead of `.s4-empty`; loading said "linear progress" instead of `.s4-states` skeletons; build notes said the
   checker only sees the first view (it audits every view).
2. *Contradictions in SKILL.md* (for A): the worked example presses an "All" chip (0068/0070 say none at rest); "Charts:
   draw them in the app (SVG or divs)" contradicts the `.s4-chart` bullet further down; the selection bullet sits under
   Websites although it is the app rule.
3. *Stale component notes* (fixed in READMEs): checkbox described as an outlined 18dp square; snackbar "slides up from
   the bottom edge".
4. *Display faces*: SKILL.md lists `humanist`, `rounded`, `geometric` as dials without saying they are system stacks that
   fall back to plain sans on Android/Linux; a newcomer picks one and gets nothing visible. Now in `patterns.md`; a
   SKILL.md line for A.
5. *Icons*: the set has no health, food or sport nouns (no pill, leaf, dumbbell); the skill says `S4.icon.add` but not
   how to draw one in the set's style. I drew a duotone capsule; `patterns.md` now says how. Adding a few domain icons to
   `names.json` is a later job (icon build is outside my area).
6. *Bespoke*: nothing told a newcomer to look for the product's own element before laying out panes; the templates do it
   but the instruction is buried in 0053's rule. Now the first point of "Making it the app's own" in `patterns.md`.
7. *Rail action vs. view action*: SKILL.md says the rail's FAB "is the screen's main action as a solid button", which
   is exactly how Parley got loud. The rail now steps down by itself; SKILL.md wording for A.
8. Small: a long single list stretched to 1200 at 1600 reads empty (I capped Medicines at `data-width="reading"`; the
   top bar follows the column, which looks deliberate); a view's title repeats the app bar title, as in the templates.

## Unverified
- Real devices (iPhone Safari, Android Chrome) for the brand trial; the humanist face was only seen as Carlito.
- `:has()` cost of the rail rule on a page with a large live table (Linnea's rail action is filled and the rule did not
  visibly slow its scroll in Chromium; not measured).
- WebKit/Firefox rendering of the neutral open row and the elevated rail action.
