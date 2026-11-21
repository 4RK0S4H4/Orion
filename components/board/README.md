# Board

S4 addition (decision 0063). Lanes of cards that move from stage to stage: stories, tickets, a sales pipeline, a week of
work. Pressroom and Moorings both rebuilt lane counts, limits and the add-in-place footer by hand; this is that once.

```html
<div class="s4-board" aria-label="Tonight’s Stories">
  <section class="s4-lane" data-limit="3" aria-labelledby="l-editing">
    <header class="s4-lane-head"><h2 class="s4-lane-title" id="l-editing">Editing</h2><span class="s4-lane-count"></span></header>
    <ul class="s4-lane-items" data-reorder data-reorder-group="tonight" aria-label="Editing">
      <li class="my-card">…</li>
    </ul>
    <footer class="s4-lane-foot">
      <button class="s4-button" data-variant="text" data-size="s" type="button" data-lane-add="Working headline">
        <span class="s4-icon" data-icon="add"></span>Add Story</button>
    </footer>
  </section>
  …
</div>
```

| Part / attribute | What | Default |
|---|---|---|
| `.s4-board` | lanes side by side, each at least `--s4-lane-min` wide; on a board narrower than 600 each lane is 85% of it and the board snaps lane to lane | 13rem |
| `.s4-lane` `data-limit` | a lane; past its limit the count turns the error tone and the lane gets `data-over` | — |
| `.s4-lane-head` | `.s4-lane-title` (a heading, title-small) and `.s4-lane-count` (filled in by board.js: "4", or "4 / 3" with a limit) | — |
| `.s4-lane-items` | the cards; add `data-reorder` and a shared `data-reorder-group` ([direct](../direct/)) so they drag between lanes | — |
| `.s4-lane-foot` with `[data-lane-add="placeholder"]` | the add-in-place footer: a draft (field, Cancel, Add) opens where the button was; Add fires `s4-lane-add { value, lane, list }` | — |

**Focus (decisions 0049, 0065):** Add opens the draft and holds the focus on the draft itself (a named group), never in
the field: the next Tab, or a tap, reaches the field. Add gives the focus back to the lane's add button for the next card;
Escape or Cancel does the same. Focus never drops to `<body>`.

**Keyboard:** with focus on anything in a card, Alt+Up and Alt+Down move it in its lane, Alt+Left and Alt+Right to the
lane before or after (mirrored right to left). The app hears `s4-reorder`, as for a drag, so Undo works the same way.
Each move is announced ("Rents rise fastest, Ready, position 1 of 3"). Dragging is [direct](../direct/): a mouse drags,
a finger holds then drags. Neither is the only way: give a card's page or menu a "Move To" action as well.

**A page with a board** starts with its rail collapsed (the lanes need the width); an app can still say otherwise with
`data-rail` or the rail's own `data-expand`.

**When to use what**
- A board: things that move through stages, where seeing every stage at once matters.
- A [list](../list/) grouped by status when people mostly read, not move; a [table](../table/) for many fields per item.
- A [month](../month/) or [timeline](../timeline/) when the stages are dates.

**Do**
- Keep a card short: a title, one or two facts, who has it. Open the rest as a page (decision 0050).
- Name lanes with nouns or stages in Title Case; put a limit only where the team works to one.
- Act at once on a move and offer Undo in a snackbar.

**Don't**
- Don't open a dialog to add a card; it is typed in place. Don't put the cursor in the field for the person (0049).
- Don't make dragging the only way to move a card.

**Accessibility:** lanes are sections named by their heading; each list is named; the count's name is in words
("4 cards, limit 3, over the limit"); moves are announced in a polite live region.

**Tokens:** `--md-sys-color-surface-container-low|highest`, `--md-sys-color-error-container`, `--md-sys-shape-corner-large|medium`,
`--s4-shape-chip`, `--md-sys-typescale-title-small|label-medium-*`, `--s4-space-*`.
