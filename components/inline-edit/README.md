# Inline Edit

A value you change where it is: a name, a title, an amount on a detail page. It reads as plain text and is a real input
underneath, so the person's own tap puts the cursor in it (no script ever does, decision 0049). Pointing at it shows the
field's fill and a pencil; on a touch screen the pencil always shows. Enter or leaving saves, Escape puts it back, and a
snackbar offers **Undo**. No Edit button, no dialog, no Save button (the placement ladder, decision 0047).

```html
<div class="s4-inline-edit"><label for="owner">Owner</label><input id="owner" value="Ana Ribeiro" required></div>

<!-- a heading that can be renamed: it keeps the heading's type -->
<div class="s4-inline-edit s4-headline-small"><input aria-label="Project Name" value="Kitchen Renovation" required></div>
```

| Attribute / API | What |
|---|---|
| `<label>` or `aria-label` | Its name (the label is shown small above, like a field's). |
| `required`, `pattern`, `maxlength` on the input | An empty or rejected value is not saved: the saved one comes back with a short message (`data-msg` for your own words). |
| `data-undo-text` | The snackbar's words (default “Owner changed”). `data-no-undo` for no snackbar. |
| Events | `s4-change { value, previous }` on save and again on Undo. |
| Script | `S4.inlineEdit.set(el, value)` (no events). |

**When to use:** one value on a detail page or a list row that people change now and then. **Not:** a form with several
related values (a [form](../form/) with autosave); anything that needs a choice from a list (a select or a
[combobox](../combobox/)); long text (a page or an expand with a textarea).

**Do** keep it to short values; give each a label. **Don't** put two inline edits on one line, or ask “Are you sure?”
(Undo is enough).

**Focus:** the text field's marks: a quiet hairline after a tap, the focus ring from the keyboard.
**Accessibility:** a real `<input>` with its label; the message is tied with `aria-describedby` and announced.
**Tokens:** `--s4-shape-text-field`, `--md-sys-color-surface-container-high` (hover), the focus tokens. **Motion:** State.
