# Prose

S4 addition. Long-form text: articles, help pages, release notes, terms, AI answers. The one place plain HTML elements
(`h2`, `p`, `ul`, `blockquote`, `pre`) get styled, and only inside `.s4-prose`.

```html
<main class="s4-content" data-width="reading">
  <article class="s4-prose">
    <h1>Getting Paid Faster</h1>
    <p class="s4-prose-lead">Three habits that cut the time between invoice and payment.</p>
    <h2>Send Invoices the Same Day</h2>
    <p>Clients pay in the order invoices arrive. <a href="#">See the data</a>.</p>
    <ul><li>…</li></ul>
    <blockquote>…</blockquote>
    <pre><code>…</code></pre>
  </article>
</main>
```

| Element | Look |
|---|---|
| text | body-large, line height +4, about 70 characters a line |
| `h1` / `h2` / `h3` / `h4` | headline-large / headline-small / title-large / title-medium, emphasized weight, Title Case |
| `.s4-prose-lead` | the intro paragraph, title-large size, on-surface-variant |
| `a` | primary, underlined |
| `blockquote`, `pre` | surface-container-low / -high, large corners |
| `code`, `kbd` | monospace on surface-container-high |
| `hr`, `figure`, `figcaption`, `img` | divider; captions body-small; images with large corners |

## Kicker and figure (decision 0063)

Two pieces for editorial pages, usable inside or outside `.s4-prose`:

```html
<p class="s4-kicker">Total Solar Eclipse · 2 August 2027</p>
<h1>Six Minutes in Luxor</h1>

<figure class="s4-figure">
  <img src="karnak.jpg" alt="The Temple of Karnak at noon">
  <figcaption>Totality over Karnak at 13:07. Photo: Amara Nwosu.</figcaption>
</figure>
```

| Class | Look |
|---|---|
| `.s4-kicker` | The short label above an editorial title, or a post's section. Accent color, `font-variant-caps: all-small-caps` with synthesis off: real small capitals where the text face has them (a serif such as Iowan Old Style or New York, `data-type-text` set), a size up and `--s4-type-caps-tracking` apart; in Inter, which has none, it stays the emphasized label in Title Case. Never faked. |
| `figure.s4-figure` | A picture (image, video, drawing, a block of your own) with large corners and the full width, its `figcaption` under it in body-small, on-surface-variant. Credit the maker at the end of the caption. |

Use the kicker for editorial content (articles, posts, magazine heads). A site's section heads keep `.s4-eyebrow`; an
app's group labels are labels, not kickers. There is no old-style figures dial: an editorial page that wants them sets
`font-variant-numeric: oldstyle-nums` on its own prose.

**Do**
- Use real heading levels in order; the look follows the level.
- Use a `data-width="reading"` page so the measure stays comfortable on desktop.

**Don't**
- Don't put app UI (lists of records, forms) inside prose; those are components.

**Accessibility:** links are underlined (not color alone); text meets AA in every mode.

**Tokens:** `--md-sys-typescale-*`, `--s4-type-caps-tracking`, `--md-sys-color-primary`, `--md-sys-color-surface-container-low/-high`,
`--md-sys-shape-corner-large`, `--s4-size-divider`.
