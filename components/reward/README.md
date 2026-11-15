# Small rewards

The small moments that make finishing something feel good. Each is an existing motion pattern, so fun never breaks
consistency.

```html
<span class="s4-done-mark"></span>                       <!-- set data-done (or S4.reward.done(el)) and the check draws itself -->
<span class="s4-num" data-count-to="6240" data-count-format="currency:USD"></span>   <!-- counts to its value when it comes into view -->
```

| Thing | How | Pattern |
|---|---|---|
| A check that draws itself | `.s4-done-mark` (`data-size="s|l"`), `data-done` | Ink (the disc), Ink calm (the stroke) |
| A number that counts | `data-count-to`, `data-count-format="number|currency:USD|percent|compact"`, `data-count-decimals`; `S4.reward.count(el, to, { from })` | a count of under a second |
| A row that settles after a drag | reorderable lists ([direct](../direct/)) | Morph calm |

**When to use what:** once, at the moment something is finished or a figure changes because of what the person did.
A check for done; a count for a total that moved.

**Do** keep it under a second and let the result be readable the whole time.
**Don't** celebrate routine things (every save, every click), loop a reward, or add confetti: Orion's fun is small.

**Accessibility:** the number's real value is its `aria-label` from the start; the mark is decorative unless you give
it an `aria-label`. Under reduced motion both show their end state at once.
**Tokens:** `--s4-color-success-container`, `--s4-color-on-success-container`, `--s4-space-*`.
