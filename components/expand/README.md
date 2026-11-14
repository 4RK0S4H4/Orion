# Expand in place

Content that opens right where you asked for it and pushes the rest of the page down. The first rung of the placement
ladder (decision 0047): reach for this before a menu, a panel or a dialog.

```html
<div class="s4-row"><button class="s4-button" type="button" data-expand="reply">Reply</button></div>
<div class="s4-expand" id="reply" data-variant="inset" hidden>
  <form class="s4-expand-body">
    <div class="s4-text-field"><textarea id="r" rows="3"></textarea><label for="r">Reply To Maya Chen</label></div>
    <div class="s4-expand-actions">
      <button class="s4-button" data-variant="text" type="button" data-expand-close="cancel">Cancel</button>
      <button class="s4-button" type="submit">Send</button>
    </div>
  </form>
</div>
```

Inline confirm (the button turns into the question):

```html
<button class="s4-button" data-variant="tonal" type="button" data-confirm="rm">Remove Card</button>
<span class="s4-confirm" id="rm" hidden>
  <span class="s4-confirm-text">Remove this card?</span>
  <button class="s4-button" data-variant="text" data-size="s" type="button" data-confirm-close="">Keep</button>
  <button class="s4-button" data-color="error" data-size="s" type="button" data-confirm-close="remove">Remove</button>
</span>
```

| Attribute | On | Values | Default |
|---|---|---|---|
| `data-expand="id"` | any button | opens or closes that expand; gets `aria-expanded` and `aria-controls` | |
| `data-variant` | `.s4-expand` | `inset` (a filled, rounded container for a composer or small form) | none: plain, part of the page |
| `data-group` | `.s4-expand` | a shared name: opening one closes the others (Reply and Forward) | independent |
| `data-autofocus` | a button inside | that button takes focus when it opens (never a field) | the expand itself |
| `data-expand-close="value"` | a button inside | closes it; `value` arrives in `s4-close` | |
| `data-confirm="id"` / `data-confirm-close="value"` | buttons | swap a button (or its `[data-confirm-row]`) for a `.s4-confirm` and back | |

Script: `S4.expand.open(id, { from })`, `S4.expand.close(id, value)`, `S4.expand.toggle(id)`. Events: `s4-open`,
`s4-close { value }` (value is `""` for Escape). The expand is a direct child of the container it opens in (a pane, a
`.s4-stack`); it cancels the container's gap itself, so nothing jumps.

**When to use what (the placement ladder):**
1. **In place:** the thing itself changes (a switch, an inline confirm, text you edit where it is).
2. **Expand:** a reply, a short form, details or options open under what you touched. This component.
3. **Menu** (anchored glass): a short list of choices or a picker hanging from its button.
4. **Pane:** a detail or inspector beside the content, when the layout has room.
5. **Floating panel:** a longer task that has no place in the page (a new message, filters for the whole view).
6. **Dialog:** only when the app cannot continue without an answer: an action that cannot be undone, or leaving with
   unsaved work. Prefer doing the thing and offering Undo in a snackbar.

**Do**
- Put the expand directly under the control that opens it, inside the same pane.
- Keep it short: a few fields and one row of actions. Longer tasks are a pane or a panel.
- After the action, close it and confirm with a snackbar (with Undo where you can).

**Don't**
- Don't open a dialog for a reply, a comment, a rename, an add form or a filter.
- Don't open an expand far from its button, or more than one at a time in the same place (use `data-group`).
- Don't use the inline confirm for something serious that cannot be undone: that is what a dialog is for.

**Accessibility:** the opener carries `aria-expanded` and `aria-controls`. Opening moves focus to the expand itself,
never into a field (decision 0049: no keyboard pops up until the person taps the field); Tab goes to its first
control. Escape closes and returns focus to the opener. The page is never inert.
The inline confirm moves focus to its first answer and back to the button.

**Motion:** Reveal (the box grows on the calm reveal spring, its content follows); the confirm uses Switch.

**Tokens:** `surface-container-high`, `on-surface`, shape `large`, spacing `--s4-space-*`, `--s4-expand-gap` (public
knob: the gap of the container it sits in, when that is not 16).
