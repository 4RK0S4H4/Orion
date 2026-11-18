# Password Field

Helpers for a [text field](../text-field/) that holds a password: a **Show Password** button, a **strength meter** that
says in words how strong the password is, and a **Caps Lock** notice. The form's own rules (`minlength`, `pattern`,
`required`) decide what is accepted; the meter only helps.

```html
<div class="s4-text-field s4-password" data-strength>
  <label for="pw">New Password</label>
  <input id="pw" type="password" autocomplete="new-password" minlength="12" required>
  <div class="s4-text-field-supporting">At least 12 characters. A few words work well.</div>
</div>
```

| Part | What |
|---|---|
| `.s4-password` on the field | Adds the Show Password button at the end of the box (no other trailing icon there). |
| `data-strength` | Four segments and a sentence under the supporting text: “Strength: Weak, add numbers or symbols”. Read out politely after a pause. |
| Caps Lock | “Caps Lock is on” under the field while it is on and you type there (on keyboards that report it). |
| Script | `S4.password.score(text)` → 0 (too short) to 4 (strong). |

**Show Password** is a toggle: `aria-pressed="true"` while the text shows, and its name (“Show Password”) never changes,
as the pattern asks; the icon changes from an eye to a closed eye. It never moves the cursor (and does not take it away
from the field while you type). The password is hidden again before the form is sent, so the browser offers to save it.

**The score** counts length (8, 12, 16), kinds of characters, and drops common and repeated passwords to Weak. The
segments' colors (error, warning, success) only repeat the words.

**When to use:** sign up, change password, sign in (the toggle only, no meter). **Not:** a PIN or a code (the
[one-time code](../code-field/)); a field that is not secret.

**Do** say the rule in the supporting text; use `autocomplete="new-password"` or `"current-password"`. **Don't** block
paste, show the meter on sign in, or make the meter the rule.

**Accessibility:** the toggle is a named button with `aria-pressed` and `aria-controls`; the strength sentence is a
polite live region; the Caps Lock notice is a status. Errors follow the text field and `.s4-form`.

**Tokens:** `--md-sys-color-error`, `--s4-color-warning`, `--s4-color-success`, `--md-sys-shape-corner-full` (segments).
**Motion:** State.
