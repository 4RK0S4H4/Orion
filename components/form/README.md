# Forms

Forms that behave. Layout classes plus a script that gets the timing right.

```html
<form class="s4-form">
  <div class="s4-form-row">
    <div class="s4-text-field"><input id="f" required data-msg-required="Enter your first name."><label for="f">First Name</label></div>
    <div class="s4-text-field"><input id="l" required><label for="l">Last Name</label></div>
  </div>
  <div class="s4-text-field"><input id="e" type="email" required data-msg-type="That doesn’t look like an email address."><label for="e">Email</label></div>
  <div class="s4-form-actions"><span class="s4-form-status"></span><button class="s4-button" type="submit">Create Account</button></div>
</form>
```

| Rule | What happens |
|---|---|
| Errors on leaving a field | never while typing; typing in a field with an error clears it the moment it is right |
| Inline success | a field that was wrong and is now right shows a small check by its label |
| Submit with problems | every problem is shown, the first is scrolled into view, nothing is sent; `s4-invalid { fields }` |
| Submit when fine | `s4-submit { values }` (call `preventDefault()` to handle it yourself) |
| `data-autosave` on the form | `s4-save { values, done(ok), wait() }` after a change settles; `.s4-form-status` reads "Saving…" then "Saved" |
| Messages | `data-msg-required`, `-type`, `-pattern`, `-min`, `-max`, `-length`, or `data-msg` on the control |

Script: `S4.form.validate(form)`, `S4.form.values(form)`, `S4.form.saved(form, 'Saved')`.

**When to use what**
- A form you send (sign up, checkout, a new record): a submit button, errors on blur.
- Settings and anything edited in place: `data-autosave`, no Save button, a quiet "Saved".
- Something reversible (remove, archive, move): do it and offer **Undo** in a snackbar. Keep "Are you sure?" for what
  is serious and cannot be undone (the placement ladder, decision 0047).

**Do** write messages that say how to fix it ("Enter the email you signed up with."), in sentence case.
**Don't** disable the submit button until the form is valid (people cannot tell why); don't validate on every key.

**Accessibility:** errors set `aria-invalid` and are tied to the field with `aria-describedby`; the cursor is never
moved into a field for you (decision 0049); the saved mark is a status region.
**Tokens:** `--s4-color-success`, label type scale, `--s4-space-*`. **Motion:** State.
