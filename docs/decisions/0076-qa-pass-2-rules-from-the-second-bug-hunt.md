# 0076: QA pass 2, rules from the second bug hunt (2026-11-23)

**Status:** our call. Built in round 0063 from the second Full QA pass ([`docs/history/round-0063/qa-2.md`](../history/round-0063/qa-2.md), a fresh
agent, Chromium, flows pass 1 did not exercise: field typing, table edit and resize, Undo, board and swipe keyboard paths, the palette,
each dial alone). Eighteen findings (six major) are issues 84 to 101 in [`docs/issues/README.md`](../issues/README.md); the page-checker
false positive on `S4.util.copy`'s own `writeText` is issue 102. Every finding is fixed where it comes from (a component, not the page
that showed it) and every rule is only a rule once a known-bad case fails it (decision 0067): the suite's `qa2Audit`, a fixture in
`tests/fixtures` with a case in `tests/checker.mjs`, and `tests/back.mjs`.

## What the pass found, and what changed

1. **Focus never falls to `<body>` (issues 84, 89).** Committing a table cell redrew the row and focused the old, detached cell; Enter and Escape
   in an inline edit blurred the field; Undo, a hidden selection bar, a button that turns into a progress bar, a moved card and a closed document all
   dropped focus. Now: `S4.table` keeps focus on the same cell when it redraws a row (`update`), puts a removed row's focus on the nearest row
   (`remove`, `restore`) and hands the selection bar's focus to the table; inline edit keeps focus in its field after Enter or Escape (on a touch
   screen its own box takes it, so the keyboard goes away); `S4.snackbar` returns focus to what had it when it was made (never into a text
   field, 0049: its cell or box instead), else main; `S4.util.release(box, to)` is the one call for "I am about to hide what has focus";
   `S4.reorder.move` gives a moved element its focus back before anyone hears `s4-reorder`; a closed document tab whose panel had focus hands it to the
   next tab; a command run from the keyboard or the palette that leaves focus on `<body>` lands on main. *Rule:* no flow leaves focus on `<body>`,
   including after a cell or inline edit commits and after a document tab closes (suite `qa2Audit`: inline edit, table cell, Undo, Ctrl+W, the
   palette).
2. **Nothing is gesture-only (issue 85).** `.s4-swipe-actions` was `visibility: hidden`, so its buttons could not take Tab and the README's promise
   was false; it is `opacity: 0` now (the row covers them), Tab onto an action opens its row and Tab away closes it, and an action that removes
   its row hands focus to the next. Starting a selection by keyboard is Shift+Space or Shift+Enter on a row, documented (issue 99).
   *Rule:* every direct-manipulation action has a keyboard path; the suite focuses the first action of every `[data-swipe]` row.
3. **The screen follows the URL (issue 86).** `app.js` read the hash at load only. A `hashchange` that names a view (or empties, which is the view
   the app started on) switches to it, closing any open page first, without a new history entry. *Rule:* `npm run test:back` clicks through the
   Showcase's views and goes Back and Forward.
4. **A grip is its own box (issue 87).** The column-resize grip hung 8px past its header and sat under the next sticky header, so the border
   itself hit the neighbour. It lives inside its header on the end edge. *Rule:* the suite hit-tests the middle and both quarter points of every grip.
5. **Numbers are read, not coerced (issues 88, 98).** A `data-edit="number"` cell read "abc" as 0 and "1e3" as 13. It now accepts digits with a sign,
   a point and grouping commas in groups of three, refuses the rest, keeps the old value, sets `aria-invalid` and says why ("Specimens needs a
   whole number. "3.7" was not saved."); `data-format="integer"` refuses fractions; `data-min`, `data-max` and `data-required` apply. The
   number field no longer reads "1,5" as 15 and never reports an `aria-valuenow` past its limits. *Rule:* number inputs reject garbage with a
   visible message instead of coercing.
6. **Several Undos each stay undoable (issue 89).** A snackbar that a newer one replaces waits underneath and comes back, newest first, when the
   newer one's action has run; when the showing one runs out or is closed the others are let go. *Rule:* several pending Undos each stay
   undoable (suite: two snackbars, two Undos, both run, newest first).
7. **Undo restores the place (issue 90).** `table.remove(ids)` returns the rows with `.at` (their indices) and `table.restore(rows)` puts them back
   there; the filter's count line follows the table (`s4-change` type `view`). *Rule:* Undo restores an item at its original index.
8. **Smaller findings.** `.s4-form` Reset clears errors, valid marks and touched state (91). The palette's list follows its box (Escape, the cross),
   End, Home and PageUp or PageDown move the active option, Enter with no match stays open and says so (92). A code takes a paste over a full code and
   Select All stays selected (93). A closed select trigger opens on Down, Up, Alt+Down, and Home, End or a letter go to that option (94). An
   inline edit refuses an empty required value with `aria-invalid` and its message (95). A page whose `s4-open` handler calls `preventDefault()`
   does not open and the URL keeps the view's address; the templates do it for an id that is not there (96). `S4.theme({ contrast: 'high' })` accepts the
   dial's own words (`standard`, `medium`, `high`) as well as 0, 0.5, 1 (97). A pasted color code is trimmed before its length limit (100). The form README says
   which fields are checked on leaving, and an empty board draft says "Enter a title" (101).
9. **The clipboard lint exempts only the helper's own call (issue 102).** The call in `S4.util.copy` carries the marker `/* s4-clipboard-helper */`;
   `npm run check:clipboard` and the page checker skip the first marked line of a file and no more (fixture `bad-clipboard-marker.html`).

## Rules to remember

- No flow leaves focus on `<body>`: a commit, a cancel, an Undo, a hidden bar, a removed row, a closed tab, a command. Call `S4.util.release(box, to)` before hiding what may hold focus.
- Every direct-manipulation action has a keyboard path (swipe actions take Tab; Shift+Space starts selecting).
- Undo restores an item at its original index (`table.restore`), and several pending Undos each stay undoable (`S4.snackbar` keeps them).
- A number typed by a person is refused with a visible message, never coerced; a refused field says `aria-invalid` and keeps its old value.
- A page whose id is not there does not open (`event.preventDefault()` in `s4-open`); a URL never names what is not shown.
- The listed values of a dial are what `S4.theme` accepts.
- The browser's Back and Forward change the screen as well as the URL.

## Not covered (pass 3)

WebKit and Firefox, real devices and screen readers, dark mode for the pass-2 flows, and keyboard paths for drag-only gestures in apps' own components.
