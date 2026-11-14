# 0047: The placement ladder. Expand in place before anything floats (2026-11-14)

**Status:** built; awaiting the owner's look. Issue 38 ([screenshot](../issues/img/2026-11-14-reply-opens-dialog.png):
Reply in the mail template opened a "New Message" dialog in the middle of the screen, away from the message).

## Decision
When an action needs more room (a reply, a form, a question), the new content goes on the **first rung that fits**:

| Rung | Where | For | Component | Motion |
|---|---|---|---|---|
| 1 | **In place** | The thing itself changes: a switch, text edited where it is, a button that turns into its confirm question | the control; `.s4-confirm` | State, Ink, Switch |
| 2 | **Expand** | A reply, a comment, an add form, details, options: opens under what you touched and pushes the page | `.s4-expand` | Reveal |
| 3 | **Menu** | A short list of choices or a picker hanging from its button | `.s4-menu`, selects, date picker | Follow |
| 4 | **Pane** | A detail or an inspector beside the content, when the layout has room | `.s4-split`, supporting pane | Switch |
| 5 | **Floating panel** | A longer task with no place in the page: a new message, filters for the whole view | `.s4-bottom-sheet`, `.s4-side-sheet` | Pop |
| 6 | **Dialog** | Only when the app cannot go on without an answer: something serious that cannot be undone, leaving with unsaved work | `.s4-dialog` | Pop |

Rules that come with it:
- **A dialog is the last resort**, never the default for "the user clicked a button".
- **Do, then offer Undo** (a snackbar) instead of asking "Are you sure?" whenever the action can be reversed.
- An expand sits **directly under its opener**, inside the same pane, and is short (a few fields, one row of actions).
- Because the person asked for it right there, an expand **focuses its first field** (dialogs still never do, 0043).
- Escape closes an expand and returns focus to its opener. The page is never inert.

## Built
- `components/expand/`: `.s4-expand` (`data-variant="inset"`, `data-group`), `[data-expand]`, `[data-expand-close]`,
  `S4.expand.open | close | toggle`, events `s4-open` / `s4-close { value }`; inline confirm `.s4-confirm`,
  `[data-confirm]`, `[data-confirm-close]`. 49 components.
- `templates/list-detail.html`, `templates/desktop-app.html`: Reply and Forward open a composer under the message
  (the desktop row menu's Reply and its shortcut too). Compose (a new message, no place in the page) moved from a
  dialog to a floating panel. Archive and delete act at once with Undo.
- Showcase: New Note opens in place at the top of Home (was a bottom sheet); a new "In Place" pane shows the expand
  and the inline confirm.
- Kept as dialogs, on purpose: Delete Account (`settings.html`) and Delete All Notes (showcase): serious, cannot be
  undone.

## Open for the owner
- Floating panels are still modal (the page behind is dimmed and inert). A non-modal panel (write a new message while
  reading another) would be the next step if wanted.
