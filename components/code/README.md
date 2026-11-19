# Code

A block of code people read or copy: a snippet in docs, a config file, a command, a change. It carries its file name
and language, line numbers, marked lines, a **Wrap** toggle and **Copy**. A diff shows added and removed lines with
their sign. Inline code and keys sit in running text. Code is solid content, never glass.

```html
<figure class="s4-code" data-lang="js" data-lines data-mark="6-8">
  <figcaption class="s4-code-head"><span class="s4-code-file">specimens/table.js</span></figcaption>
  <pre><code>const table = S4.table(el);
table.setRows(rows);</code></pre>
</figure>

<figure class="s4-code" data-variant="diff" data-lines>…<pre><code>- old line
+ new line</code></pre></figure>

<p>Fill it with <code class="s4-code-inline">setRows(rows)</code>; search with <span class="s4-keys"><kbd class="s4-kbd">Ctrl</kbd><kbd class="s4-kbd">K</kbd></span>.</p>
```

| Attribute / part | What | Default |
|---|---|---|
| `.s4-code` on a `<figure>` | the block: `surface-container` (one step up inside a card, pane or panel), large corners | — |
| `.s4-code-head` (`<figcaption>`) + `.s4-code-file` | the head: file name in the mono face; the language label and the buttons are added | no head: the buttons sit in the top corner |
| `data-lang` | `js`, `ts`, `json`, `css`, `html`, `xml`, `py`, `sh` (and long names) are colored by the built-in tokenizer; any other name only labels | no colors |
| `data-lines` | line numbers in a gutter that stays while the code scrolls sideways; never copied | none |
| `data-mark="3-4,9"` | marked lines: a step-up fill and an accent bar at the start | none |
| `data-wrap` | long lines wrap; the Wrap button toggles it (`aria-pressed`) | scroll sideways |
| `data-variant="diff"` | lines starting `+` are `<ins>` on the success container, `-` are `<del>` on the error container, `@@` and file lines are quiet; the sign keeps its own column | — |
| `data-plain` | keep the code as written, no colors | — |
| `data-no-actions` | no Wrap or Copy (a one-line example) | buttons |
| `<span class="s4-syntax-…">` inside the code | pre-tokenised code is kept: `keyword`, `string`, `number`, `comment`, `function`, `type`, `property`, `punctuation` | — |
| `.s4-code-inline` | inline code in running text | — |
| `.s4-kbd`, `.s4-keys` | one key (from the desktop component), a combination of keys | — |

Script: `S4.code.render(fig)` after you change the code; `S4.code.text(fig)` gives it as text; `S4.code.tokenize(text, lang)`
gives `[[role, text], …]`. Events: `s4-copy { text, ok }`, `s4-change { wrap }`.

**Colors** are tokens, `--s4-syntax-keyword | string | number | comment | function | type | property`: fixed hues, like the
status colors, so code reads the same with any accent. Each is proven at 4.5:1 on every surface in light, dark and both
high-contrast modes (6:1 there) by `npm run check:tokens`, and on the surfaces of every tinted scheme by
`npm run check:accent`. Comments are italic as well as gray. Plain code and punctuation are `on-surface` and
`on-surface-variant`.

**The tokenizer** is about 3 KB and covers the languages people paste most. It is a set of patterns, not a parser: it
is right for snippets and config, not for a code editor. For any other language, tokenise on the server (Shiki,
Pygments, highlight.js) and map its classes to the `s4-syntax-*` names; the block keeps them.

**When to use what**
- A block for anything people copy or read as code (more than a few words, or several lines).
- `.s4-code-inline` for a name, a value or a short command inside a sentence.
- `.s4-kbd` for keys; never for code.
- A diff for a change someone reviews; not for showing a whole new file.

**Do**
- Name the file in the head when there is one; it is what people search for.
- Mark the two or three lines the text talks about, and say in the text why.
- Keep examples short and real (names and values from the app).

**Don't**
- Don't use a code block for output people only glance at (a log line in a list is plain text).
- Don't add line numbers to a two-line snippet.
- Don't color code by hand outside the tokens; don't put a code block on glass.

**Accessibility:** the `<pre>` is a focusable, named region (from the file name), so the keyboard can scroll long
lines and a screen reader can find it; line numbers and the gutter are generated content and never read or copied;
added and removed lines are `<ins>` and `<del>` with their sign, never color alone; Copy says "Copied" in a polite live
region. Forced colors: the block, inline code and marked lines get a system border.
**Motion:** none (Copy's check is an icon swap). **Tokens:** `--s4-syntax-*`, `surface-container`,
`surface-container-high`, `surface-container-highest`, `primary` (the mark bar), `--s4-color-success-container`,
`error-container`, `--md-ref-typeface-mono`, body-medium size, body-large line height, label-large.
