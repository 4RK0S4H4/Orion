# Dialog

> **A dialog is the last rung of the placement ladder (decision 0047).** Use it only for a question the app cannot go on without: deleting something for good, leaving with unsaved work, a permission. A reply, a comment, an add form, a rename or a filter opens in place with [expand](../expand/) or in a [floating panel](../sheet/); a reversible action just happens and offers Undo in a snackbar; something to read is a [page](../page/). Expect one or two dialogs in a whole app.

Asks one question with two (rarely three) answers. On a wide window it is a modest card in the middle, no wider than its
question needs. **On a phone (under 600) it sits in the bottom of the screen** (decision 0064): inset by the margin, within
reach of the thumb, its bottom corners parallel to the screen's own corners, its answers filling the width. It **pops**
in (rises 16px and fades in; Pop, decision 0046) over a light scrim, on firmer glass than menus (90%), and a tap
outside, a **swipe down**, Escape or Back puts it away.

```html
<button class="s4-button" data-color="error" data-dialog="confirm-delete">Delete Bill</button>
<dialog class="s4-dialog" id="confirm-delete" aria-labelledby="cd-h">
  <span class="s4-icon s4-dialog-icon" data-icon="delete"></span>
  <h2 class="s4-dialog-headline" id="cd-h">Delete this bill?</h2>
  <div class="s4-dialog-content">Staples, $72.40. It goes from every device and can’t be undone.</div>
  <div class="s4-dialog-actions">
    <button class="s4-button" data-variant="tonal" data-close="cancel">Cancel</button>
    <button class="s4-button" data-variant="tonal" data-color="error" data-close="delete">Delete</button>
  </div>
</dialog>
```

| Attribute / API | Use |
|---|---|
| `[data-dialog="id"]` | Opens the dialog (focus returns to this element when it closes) |
| `[data-close="value"]` | Closes it; the value comes back in `s4-close { value }` |
| `data-persistent` | A tap on the scrim or a swipe down doesn't close it (Escape and its answers still do) |
| `data-fullscreen="compact"` | Old: full screen on phones. A task that needs the whole screen is a [page](../page/) (decision 0050); kept so older markup works |
| JS | `S4.dialog.open(id, { from })`, `S4.dialog.close(id, value)`; events `s4-open`, `s4-close` |

**The answers:** Cancel first, `data-variant="tonal"`; the answer last, named by what it does ("Delete", "Discard",
"Allow", never "OK"). A destructive answer is `data-variant="tonal" data-color="error"` (clear, not shouting); any other
is filled. On a phone two answers sit side by side; three or more stack with Cancel at the bottom, nearest the thumb.
A text-variant answer gets a quiet fill on a phone so it never floats as a bare word.

**Swipe down (phones):** the card follows the finger; let go past a quarter of its height, or flick, and it leaves from
where it was let go; otherwise it settles back. It does not start on a field or a slider, or while the content inside
is scrolled. It is never the only way out.

**Focus:** the dialog itself takes focus when it opens, never a text field (decisions 0043 and 0049; there is no opt-in for fields). `data-autofocus` on a button picks that button. Tab then goes to the first control; focus is trapped inside (native modal `<dialog>`, the page behind is inert) and returns to the opener on close.

**Do:** questions as headlines in sentence case ("Delete this bill?"); one or two lines of what happens; answers that say
what they do. **Don't:** a dialog with one answer (something to read is a page, a notice is a snackbar); a form in a
dialog (it is a task: in place, a floating panel or a page); "Are you sure?" for something Undo can fix; stacked dialogs;
a dialog on a panel. The page checker and the suite fail the first two.

**Accessibility:** native `<dialog>` opened with `showModal()`: `aria-modal`, focus trap and inert page come from the
browser; give it `aria-labelledby`. Android's Back closes it through the native `cancel` event. Reduced motion: it only
fades. Reduced transparency and high contrast: solid, with the 32% scrim. Forced colors: a real border.

**Tokens:** `--s4-shape-dialog`, `--s4-shape-screen` (phone bottom corners), `--s4-space-4` (inset), `--s4-scrim-opacity`,
`--s4-glass-tint-opacity-modal`, `--s4-size-touch-target` (answers on a phone), title-large and body-medium type.
