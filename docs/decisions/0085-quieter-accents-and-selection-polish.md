# 0085: Quieter accent text, a selection bar with words, no resting selection on a phone (2026-11-25)

**Status:** our call under the owner's handover, built in round 0066, workstream B (review 5's N7, N10 and N11; issue 115).
Refines [0070](0070-one-accent-job-per-screen-brand-trial.md) (one accent job per screen: 0070 did not count accent text).

## The rules
1. **Neutral secondary actions.** `.s4-button[data-color="neutral"]`: a text button in `on-surface-variant`, an elevated or
   tonal one in `on-surface` on a neutral fill, a filled one as the inverse surface. Use it for the other actions in a row that
   holds the screen's main action (Previous, Next, Copy Source beside Approve) so the accent stays with the one accent job.
2. **The rail's stepped-down action is neutral.** When the open view shows a filled action, the rail's `.s4-fab` steps down to the
   elevated look with an `on-surface` label and icon (was the accent): the rail's accent is its current place.
3. **Scores and readings are not accents.** An app's own figures (a match score, a percentage) are `on-surface-variant`.
4. **The selection bar is the whole top bar, with words.** In a top app bar `.s4-selection-bar` spans the bar (it sat in the lead
   slot, a small pill over the title); its actions are text buttons with an icon and a `.s4-button-label`, on the bar's own
   color; under 840 the words go (the label stays the button's name) and the icons stay.
5. **No resting selection when the list is the only pane.** Under 840 a list-detail split shows one pane at a time; while the
   list is the pane shown (`.s4-split` without `data-open`) its open item has no fill and no heavier label.

## Applied
Parley: Copy Source, Previous, Next and the translation memory's Use are neutral, the match scores `on-surface-variant`, the rail's
Next Untranslated neutral while Approve is on screen. Linnea's selection bar: Send to Conservation, Export, Delete with words from
840. Parley at 390: the open line has no fill until its detail is open.

## Rules bullet (for CLAUDE.md)
- Decision 0085 (quieter accents, refines 0070): other actions in a row with the main action take `data-color="neutral"` (text `on-surface-variant`, elevated and tonal `on-surface`), the rail's stepped-down action is neutral, an app's own scores are `on-surface-variant`; a selection bar spans the top app bar with words beside its icons from 840 (`.s4-button-label`); under 840 a list beside a closed detail shows no resting selection.
