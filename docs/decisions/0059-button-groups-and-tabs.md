# 0059: Button groups are the Ink Track; tabs join the navigation family (2026-11-17)

**Status:** decided by the owner in the Button Groups Round 2 quiz
([`explore/review-button-group-2.html`](../../explore/review-button-group-2.html), issue 63) and in the follow-up
question below; built. **Supersedes [0026](0026-joined-capsule-and-accurate-glass-lab.md)** (the Joined Capsule) and
**amends [0009](0009-style-lab.md)** (the Segmented Tray for tabs).

## The answers
| Question | Answer |
|---|---|
| Which connected button group | **A, Ink Track**: one filled track, the options as words on it, an accent ink pill that slides to the choice, its front edge leading and its back edge trailing |
| Do pairs get their own form | **Same As The Take**: a pair is a group with two options, no separate Pair Switch |

## The question
Then the owner asked: "Are button groups and the tab switcher going to be the same thing pretty much? I don't want
overlap or confusion. I avoided making the button groups into a chip slider for this reason, but look at what other
frameworks do."

They were right. Tabs were the Segmented Tray (0009): a tray with a sliding ink pill. That is exactly the Ink Track.
Two controls with different jobs would have looked the same.

## What other frameworks do
- **Material 3** keeps them apart by job: segmented buttons (now connected button groups in M3 Expressive) select
  options, switch views or sort; tabs organize content across different screens and data sets, drawn as labels with an
  indicator, no container.
- **Ant Design** has Segmented (pick one of a few options) and Tabs (switch content panels), drawn differently.
- **Carbon** has a content switcher (alternate views of related content in the same space) and tabs (different groups
  of content), and says when to use which.
- **Radix** separates a Toggle Group (one or several pressed buttons) from Tabs (a tab list with tab panels); **Fluent 2**
  likewise keeps toggle buttons (and a toolbar's radio group) apart from its TabList.
- **Polaris** has a segmented button group for choices and tabs for views within a page.
- **shadcn/ui** is the cautionary example: its Tabs are a muted tray with a raised active pill, the same picture as a
  segmented control, and apps use one for the other all the time.

The common thread: a role by job, and a look that follows the job.

## The rule
**If it swaps what is on the screen, it is tabs. If it changes a value or how the same thing is shown, it is a button
group. If it narrows a collection and there can be many, it is chips.**

- **Button group (Ink Track):** sets a value or changes how the same content is shown: Week / Month / Year on a chart,
  list or grid, units, alignment, a filter with 2 to 5 short fixed options. A filled track with the accent ink.
  Never scrolls; wraps if it must. `aria-pressed` (single: radio-like; multi: toggles), or a toolbar of actions.
- **Tabs (navigation family):** move between different panels of content within one screen (Overview / Activity /
  Files). No tray; labels on the surface; the selected tab gets the nav bar's and rail's neutral indicator
  (`secondary-container` / `on-secondary-container`, the nav indicator's corner) that slides on Ink; the label steps up in
  weight. Scrolls when there are many. `tablist` / `tab` / `tabpanel`, every tab with a panel.
- **Chips:** filter or tag a collection; many options, often several at once; wrap or scroll. Unchanged.

So at a glance: a button group is a filled shape with an accent fill inside; tabs are words on the page with a quiet
gray pill, like the nav rail's rows; chips are separate filled pills.

## What changed
**Button group** (`components/button-group/`), same markup and API, so every page keeps working:
- `data-connected` draws the Ink Track: track `surface-container-highest`, 4dp padding, corner concentric with the
  options (option corner `min(height / 2, --s4-shape-control)`, track adds its padding), so it follows the corner dial.
  Options are words on the track (`on-surface-variant`, `on-surface` on hover) whatever variant they name, a little less
  padding than a lone button (30% of the height) so four short options fit a phone. Press never squares an option.
- **Single** (any connected group while at most one option is pressed): `button-group.js` adds one ink element behind
  the options and places it over the pressed option, whoever changed `aria-pressed`. The ink is drawn twice, the front
  copy on `--s4-motion-ink` and the back copy on `--s4-motion-ink-calm` (ink leaving), so the edge in the direction of
  travel leads and the other trails, then they land together; it is one shape (the copies overlap). Only transform and
  size move (the Ink pattern; `check:motion` passes). A lively overshoot is clipped to the track. Reduced motion: it
  jumps; calm energy: both copies move alike. No script: the selected option paints its own pill.
- **Multi**: each selected option fills in place (State); selected neighbours fuse into one pill (their touching corners
  square on Morph). The script marks where a wrapped row starts so a run never joins across rows.
- **Icon options** are short pills (1.25 x the height), not circles. All five sizes. `data-fit="content"` groups are never
  stretched by a flex or grid parent.
- **On glass** the glass is the track (no fill of its own), the ink is the accent at `--s4-glass-fill-selected-opacity`,
  every label is `on-surface`: the selected item `check-glass` proves for 210 schemes. (A track fill under the ink would
  stack two tints; that was measured at 4.33:1 in a few tinted saturated schemes, so it is not used.)
- **Forced colors**: the track and every option get a border; the selected option is `Highlight` / `HighlightText`.
- **RTL**: the ink is placed by measurement, so it follows the mirrored order; arrow keys were already RTL aware.
- **200% text and long labels**: options are never narrower than their label (the critiques-61 fix holds); the group
  wraps onto rows and the ink moves between them.
- Pairs are a two-option group.

**Tabs** (`components/tabs/`), same markup and API:
- No tray. Tabs start-aligned and as wide as their labels. The indicator is measured to the selected tab's box and
  slides on Ink (unchanged motion); its corner is `--s4-shape-nav-indicator`, its color `secondary-container` with
  `on-secondary-container` text, the same as the nav bar's and rail's.
- The selected label steps up to the emphasized weight. `tabs.js` wraps each label's text in `.s4-tab-label` with a
  hidden copy at the heavier weight, so selecting a tab never moves its neighbours (the suite checks it).
- **Primary**: 40dp indicator, title-small; with icons the icon sits above the label and the indicator holds both, as in
  the nav bar. **Secondary** (inside a pane or card): 32dp indicator, label-large, icons inline, and the indicator is a
  12% tint of the text color over whatever it sits on (quieter, and visible on any card or pane).
- The row never wraps; it scrolls sideways when the tabs do not fit. The 48dp touch target sits in the row's padding so
  the scrolling row never clips it.
- Forced colors: the indicator is `Highlight`, the selected label `HighlightText`.

**Guard.** The page checker (`skill/s4-orion/scripts/check.mjs`) and the suite (`tests/suite.mjs`) fail when a button
group swaps panels (an option with `aria-controls` pointing at a tab panel, a view, a page or a hidden region, options
controlling two or more different regions, `role="tab"` options, a `tablist` group, or a `data-view` / `data-page-open`
hook on an option) and when `.s4-tabs` has a tab without a panel. The suite also clicks connected groups and checks the
ink lands on the chosen option, and clicks tabs and checks the indicator lands and no neighbour moved. Both contrast
checks count the ink as the background of the selected option.

**Audit.** Every `.s4-tabs` and `.s4-button-group` in the showcase, the templates, the component pages and the labs
was checked against the rule. Moved: the tabs reference page's secondary examples ("This Month / Last Month / This
Year" and "List / Calendar / Chart" were values and views of the same report, now a bill's Details / Payments / Notes
and a lease's Summary / History / Files) and its scrollable example (twelve months, a period value, now a workspace's
sections); the motion page's Ink demo (tabs without panels, now an Ink Track group). The pricing comparison's "Plan to
Show" stays a button group: it changes which plan the same table shows. Everything else was already right.

## Not changed
Chips, the standard (unconnected) button group and its press interaction, the nav bar and rail, the keyboard model of
both components, their events.
