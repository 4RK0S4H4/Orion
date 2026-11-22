# 0068: One accent fill per job in a region, wide windows get more to read, a site icon set (2026-11-22)

**Status:** built in round 0059, workstream B. Our calls, made under the owner's hand-over of 2026-11-21. The owner can
overrule any of it. Notes: [`history/round-0059/b.md`](../history/round-0059/b.md). Source: review 3, Top 10 items 6 to 9.

Amends: **0066** ("one filled selection per screen" becomes the region rule below), **0057/0066** (site pages load
`icons-site.js`, not `icons-solar.js`), **0062** (a tree's selection in a rail that marks a current item is neutral).
No motion pattern was added (0046). No check was weakened; the site budget went down.

## 1. One accent fill per job in a region
A region is a rail, a pane, an inspector, a card, a header, a page section. At rest a region shows **at most one accent
selection fill** (where you are there) **and at most one accent action fill** (its filled main action). Everything else
selected in it is neutral (`surface-container-highest`, `on-surface`, the heavier label); every other button is
`elevated` (neutral fill, accent label) or `text`. Accent as text, icons, meters and chart marks is not a fill. A pressed
filter chip may add a second fill while the person is narrowing (it is their own temporary act), never at rest.

- **Rails** (systemic, `nav-rail.css`): while a rail marks a current item, a tree's selection inside it (the open file,
  the current language) is neutral. A rail with no current item keeps the tree's accent fill.
- **Parley**: rail = main action + Strings; French and dialogue.json neutral. List pane = the selected line only (the
  "All" chip is gone: nothing pressed is every line, pressing the pressed chip clears it). Detail = Approve; Copy Source
  `elevated`; placeholders neutral pills (missing ones stay error).
- **Mallet docs**: the keymap card's one fill is the layer switch; modifier keys are a quieter neutral fill and the held
  layer key is `inverse-surface`. Header (Download), sidebar (Layers) and the neutral TOC already followed the rule.

## 2. Parley's list column
The list takes 52% of the strings view (320 to 640 px) and the status sits on the key's row, so the text runs the
whole row: a line reads in one or two rows at 1280 and 1600 (was about 450 px and four rows). The split stays
`data-resizable` with `data-resize-key="parley-split"` (drag, arrows, Home/End, double-click to collapse; remembered).

## 3. Wide windows get more to read, not more air
We fill with real content rather than cap the shell: capping a 1600 window leaves the same vertical emptiness and wastes
the side margins. A wide layout earns its columns with things the app really has.
- **Tally**: Coming Up is the next thirty days (seven items, then In / Out / Net pinned to the pane's foot) in the third
  column beside the hero and the chart; a new **Where It Sits** pane (Operating and Savings, a split bar) closes the
  bottom row; Owed By Age gains a line on how fast clients pay. At 840 to 1399 Coming Up runs full width under them.
- **Showcase Home**: **Shared With You** (three notes others shared, opening as pages) under This Week, and a
  **Folders** pane in the side column (counts from the data; a folder opens All Notes narrowed to it with the filter's
  own state, so Clear All and Back work).

## 4. A site icon set
`npm run build` writes **`components/assets/icons-site.js`** (and the skill copy): the default set cut to every icon
name a site page or the site runtime can draw (any quoted word in those files that names an icon). 37 icons, 10.9 KB gz
(the whole set was 36.9 KB). A name outside it still works: `core.js` loads `icons-solar.js` from the same folder once
and redraws. One shared file rather than one per page, so a visitor's cache serves every page of the site.
Budgets (`npm run check:bundle`): icons 12 KB, total **150 KB** (was 180); the site bundle is now 147 KB. The check
also fails a site page that loads any icon file other than `icons-site.js`.

## Rules bullet (for CLAUDE.md)
- Decision 0068: one accent fill per job in a region (at rest a rail, pane, card or header shows at most one accent selection fill and one filled main action; other selections neutral, other buttons `elevated` or `text`; a tree's selection in a rail with a current item is neutral); a wide window gets more real content, not a capped shell; site pages load `icons-site.js` (the icons the site templates draw; any other name fetches `icons-solar.js` once), site budget 150 KB.
