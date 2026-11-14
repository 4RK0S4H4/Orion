# 0049: Nothing puts the cursor in a text field by itself (2026-11-14)

**Status:** decided by the owner; built. Issue 43 ([screenshot](../issues/img/2026-11-14-reply-focuses-field.jpg):
tapping Reply opened the composer with the field already selected, so the phone keyboard came up at once).

The owner: "when I click on reply the keyboard pops up right away and text box is automatically selected. I never want
this to happen anywhere."

## Decision
**No script ever moves focus into a text field, a textarea, a select or anything else you type into.** Only the person
does, by tapping or tabbing to it. This holds for dialogs and panels (already so since 0043), and now also for expands,
pages, the command palette, validation errors, and anything built later.

- The one part of 0047 this reverses: an expand no longer focuses its first field. The expand itself takes focus (so
  Tab goes to its first control and Escape works).
- There is no opt-in any more: `autofocus` / `data-autofocus` on a field is ignored. On a button it still works.
- A failed form shows its error on the field; it does not jump the cursor there.
- `S4.util.typable(el)` tells a component whether an element would bring up a keyboard.

## Checked by
The production suite fails if a text field holds the cursor after a dialog, panel, expand or page opens.

## Not covered
The person tapping a search box, or the clear button inside a field they are already typing in, keeps the cursor
there: that is their own tap in that field.
