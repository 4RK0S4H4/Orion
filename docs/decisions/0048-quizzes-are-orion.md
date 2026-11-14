# 0048: Orion on every page, quizzes included (2026-11-14)

**Status:** built; awaiting the owner's look. Issue 39. **Reverses** the "review blue" rule (labs used their own blue
UI so the questionnaire never looked like the design being reviewed).

## Decision
Every page on GitHub Pages is S4 Orion: the hub, the component pages, the templates, the showcase and the review labs.
The quiz UI is built on the **live bundle** (`components/orion.css`), not on a copy and not on its own palette, so a
decision made in one quiz (a color, a corner, a motion pattern, a button) shows in the next quiz without anyone
touching the labs.

## How the quiz stays readable as a quiz
The old reason for review blue was that the questionnaire must not be confused with the option being judged. That is
now done by placement, not by color:
- What is being judged always sits in a recessed **Preview** well inside its option card.
- Everything outside a Preview is the quiz: Orion cards, radios, chips, buttons, a text field for notes, a pane for
  "Your Answers", an Orion FAB for the answer count.
- A picked card is Orion's selected fill (`secondary-container`) with a "Selected" status.

## Built
- `explore/lib/review.css`: rewritten on Orion tokens and motion pattern tokens; layout only.
- `explore/lib/review.js`: cards carry a real Orion radio; answer options are Orion filter chips; buttons are
  `.s4-button`; notes are a `.s4-text-field`; the answers box is a `.s4-pane`; the floating count is a `.s4-fab`.
  Labs that predate the bundle get `orion.css` added by the script (it lives in cascade layers, so a lab's own demo
  styles still win).
- `explore/lib/scrub.js`: the scrubber is an Orion bar (inverse surface) and now also freezes CSS transitions, so
  State, Ink, Morph and Bend can be scrubbed.
- The kit is covered by `npm run check:motion`.
- All 36 lab pages load with no errors.

## Rules from now on
- A new lab loads `../components/orion.css` and `orion.js` and uses `S4Review.card` / `S4Review.page`; it writes no
  colors, fonts or timings of its own outside a Preview.
- An option that changes the look does it inside its Preview only (a scoped style or a frame), never on the page.
