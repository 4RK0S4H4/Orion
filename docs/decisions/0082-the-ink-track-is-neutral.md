# 0082: The Ink Track's selection is neutral, and the checker counts selections (2026-11-25)

**Status:** the owner's call ("Neutral fill", 2026-11-25), built in round 0066, workstream B (review 5's N2, issue 111).
Amends [0059](0059-button-groups-and-tabs.md) (the connected button group's ink was the accent) and
[0070](0070-one-accent-job-per-screen-brand-trial.md) (one accent selection per screen, which nothing counted). No motion pattern was added (0046).
No check was weakened: `check-glass`, `check-accent` and the page checker each gained a proof.

## Why
Review 5 found the Ink Track breaking 0070: its selected option was a full accent fill, so Larkline's Settings showed four accent
fills (Auto, Field Notebook, Clean, Standard), the Showcase's Settings four, Tally a mint Overview beside a green Month, Mallet a
cyan Layers beside a teal Base. The page checker reported none of them: its 0070 rule counted filled actions, not selections.

## The rule
1. **The Ink Track's selected option is a neutral selection**, like every selection that is not the navigation's (0068, 0070): the
   ink is `on-surface` at `--s4-selection-neutral-opacity` (0.12, a new token) over the track (`surface-container-highest`), and the
   selected label is `on-surface` (resting labels stay `on-surface-variant`). The label keeps its weight, because a heavier label is
   wider and the track's options are measured for the ink. The accent is left for the navigation's selection and the main action.
2. **Everything else about the track stays:** the Ink motion with its calm trailing copy, multi-select filling in place and fusing
   neighbours, concentric corners, the corner dial, forced colors (`Highlight`), and on glass the glass is the track. On glass the ink
   is `on-surface` at `--s4-glass-fill-selected-opacity`, a neutral tint like a filled item on glass.
3. **Proofs.** `check-glass` proves on-surface on the neutral tint over glass for every scheme (neutral and tinted surfaces);
   `check-accent` proves the label on the neutral ink off glass on the neutral base and on 282 tinted schemes, light and dark (worst
   6.84:1).
4. **The page checker counts selections.** Beside its 0070 count of filled actions it now counts **accent selections** on the first
   screen at rest: an element that says it is selected (`aria-selected`, `aria-current`, `aria-pressed`, a checked radio, tab or
   option) and is drawn in an accent fill in its own scope (`primary`, `primary-container` or the selection tone
   `secondary-container`), by itself, a pseudo-element, a part inside it, the pill behind a tab or nav item, or a connected group's
   ink. More than one is a warning, as 0070's count is. Not counted: pressed chips (counted with the filled actions), marks of where
   you are (`aria-current` `date`, `time`, `step`, a calendar's `data-today`) and chart marks (`.s4-chart`), which are readings
   (0070). Known-loud fixture: `tests/fixtures/loud-selection.html` (the rail's place, an accent list row and an Ink Track painted
   back in the accent), proven by `tests/checker.mjs`.

## Applied
Every connected group in every template and the Showcase changes by itself (Larkline, Tally, Mallet, Proof, Spool, Puck, Sprig, the
Showcase's Settings and Controls). Tally's custom bar chart marks the current month `aria-current="date"` (a reading, not a selection).
With the rule in place every template, the Showcase and the brand trial show at most one accent selection at rest.

## Rules bullet (for CLAUDE.md)
- Decision 0082 (the Ink Track is neutral, amends 0059 and 0070): a connected button group's selected option is a neutral selection (`on-surface` at `--s4-selection-neutral-opacity` over the track, `on-surface` label; on glass `on-surface` at the selected-fill opacity); the Ink motion, trailing copy, multi fusing and the on-glass track stay. The page checker warns on more than one accent selection fill on the first screen at rest (`tests/fixtures/loud-selection.html`); today, the current step or time and chart marks are readings and not counted.
