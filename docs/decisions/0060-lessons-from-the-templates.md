# 0060: Lessons from the templates (2026-11-20)

**Status:** our call. The owner asked that each template be built as its own product and that we "use that as a lesson
for what to add or change on S4 Orion", and left these calls to us ("I defer to you in general for everything"). The
owner can overrule any of it. The full list of lessons, with what was built, what was only written down and the
proposals that need the owner, is [`docs/history/round-0056/lessons.md`](../history/round-0056/lessons.md).

## The question
Eighteen templates became eighteen products with their own brands (round 0056, issue 66). Each team wrote down where
Orion held them back. Several lessons came back in batch after batch: a muted brand color turned neon, the glass FAB's
label failed contrast with any seed, a fixed brand could not be restored without saving it, faces fell back badly off
Apple devices, lighter display faces were too heavy. Which of these should Orion change, and how?

## The answers
| Lesson | Answer |
|---|---|
| A seed without a variant | **`auto`**: `fidelity` when the seed is muted or deep (HCT chroma under 60 or tone under 35), `vibrant` when it is vivid; tinted mode keeps `tonal`. Picked from a side-by-side render of 15 seeds (the named accents and the templates' brand colors) in light and dark: vibrant turned every muted seed neon (terracotta coral, navy cyan, forest green mint, plum hot pink, espresso orange) and made no difference to the vivid ones; fidelity kept every brand color as the brand drew it. `S4.theme.variantFor(seed)` |
| Glass FAB labels with a seed | **The label and the tint are chosen per scheme**: the default FAB's icon and label are on-primary-container, or white or the accent's tone 10 when that keeps more of the glass; a FAB's tint stays at the owner's 75% (90% for a colored FAB) where the label reaches 4.5:1 over a black or white backdrop and rises only as far as it needs. Deep brand colors keep 75% glass; a fidelity FAB on a mid-tone seed is nearly solid. Extends 0032 |
| A fixed brand and the visitor's mode | **`S4.theme.restore(key, brand, { only: ['mode'] })`**: only the listed keys are read from and saved to the key (merged, so a shared key keeps the rest) |
| Category colors | **`--s4-category-1…6`**: the chart palette under a name for things that are not charts; always named in words |
| Faces | **Two more presets, better fallbacks**: `geometric` and `humanist` system stacks; `rounded` falls back to rounded faces on Windows, Android and Linux before the system sans |
| Lighter display faces | **A display weight dial**: `displayWeight: 'medium' \| 'regular'` (`data-type-display-weight`), on any element |
| Small API gaps | `S4.buttonGroup.set` / `.value`; a select changed from script redraws its picker; `data-accent` set later recolors its element; the 2dp `--s4-space-hairline`; `.s4-stat[data-size="hero"]`; small swatches; message kinds `note` and `card`; a themed docs sidebar; a sticky pane keeps room for focus rings |

## The rule
- A brand color keeps its own color unless the app asks for a brighter version (`variant: 'vibrant'`).
- Every FAB label reads at 4.5:1 with every seed; no template switches a FAB's color to get contrast. `check-glass`
  proves it for 192 seeded schemes (neutral and tinted), and the suite no longer exempts seeded FABs.
- A fixed brand is never saved: restore it with `{ only: ['mode'] }`.
- Kinds of things take category colors, named in words; drawings of real objects sit on the fixed roles.
- The display face's weight follows the face: lighter faces take `displayWeight`.

## What changed
- `components/core/core.js`: variant `auto` (`AUTO_VARIANT`, `S4.theme.variantFor`); FAB label and tint per scheme
  (`--s4-color-on-fab`, `--s4-glass-tint-opacity-fab`, `--s4-glass-tint-opacity-fab-color` written with the scheme, also
  for scoped accents); `S4.theme()` reports `variant: 'auto'` when none was named (a restored tinted app no longer
  switches from tonal to vibrant); `restore(…, { only })`; `geometric`, `humanist` and `displayWeight`; a watcher for
  `data-accent`, `data-accent-variant`, `data-surfaces`.
- `components/base/brand.css`: the face stacks and the display weight dial. `components/fab/fab.css`: `--s4-color-on-fab`.
- `components/button-group/button-group.js`: `S4.buttonGroup`. `components/text-field/text-field.js`: the select picker
  follows the select. `components/swatches/`: the page's own variant, `data-size="s"`, `displayWeight` dial.
  `components/stat/`: hero. `components/message/`: kinds. `components/layout/layout.css`: sticky pane ring room.
  `components/site/site.css`: themed docs nav. Tokens: `--s4-space-hairline`, `--s4-category-1…6`.
- Checks: `check-glass` proves FAB labels; `check-accent` proves the named accents in their default variant (216
  schemes); the page checker's selector lint splits lists at their own commas; the layout pass reads a number with a
  short unit and a leading avatar; the suite runs dial presets for a muted seed and the new faces, checks the new script
  APIs, and no longer exempts seeded FABs.
- The seven templates that hand-wrote a mode-only restore use `restore(…, { only: ['mode'] })`. Two templates that
  named no variant (Crate's gold, Mallet's cyan) now get `fidelity`: calmer, the brand's own color.
- Docs: color and typography foundations, spacing, the skill (dial table, variant rule, drawn things) and
  `references/patterns.md` ("From the product templates").

## Not decided here
Eight proposals wait for the owner (the late brand color, editorial small caps, a meter, a board, dense pickers, a
bundled brand face, monochrome colored FAB labels, the vibrant toolbar exception): see "For the owner" in the lessons file.
