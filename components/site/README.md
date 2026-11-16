# Website Kit

S4 addition (issue 53). Sections for marketing pages, blogs and documentation: a site header with a phone menu,
heroes, feature rows, a bento grid, an icon list, proof (logos, quotes, numbers), pricing with a comparison table, a
call to action, media with captions, a blog index, a docs layout and a footer. A site is a plain document that scrolls,
not an app: no app shell, no nav bar. Big type is fluid and the space between sections follows the section rhythm
(`--s4-site-*`, see the typography and spacing foundations). Templates: `landing`, `pricing`, `blog`, `docs`, `site`.

```html
<body class="s4-site">
  <a class="s4-skip-link" href="#main">Skip to Content</a>
  <div class="s4-announce"><span class="s4-status" data-tone="primary">New</span><span>Bank Sync for Europe.</span><a href="/news">Read More<span class="s4-icon" data-icon="forward"></span></a></div>
  <header class="s4-site-header">
    <div class="s4-site-bar">
      <a class="s4-site-logo" href="/"><span class="s4-site-logo-mark" aria-hidden="true">L</span>Ledgerly</a>
      <nav class="s4-site-nav" aria-label="Main"><ul>
        <li><a class="s4-button" data-variant="text" href="/" aria-current="page">Product</a></li>
        <li><a class="s4-button" data-variant="text" href="/pricing">Pricing</a></li>
      </ul></nav>
      <div class="s4-site-actions">
        <a class="s4-button" data-variant="text" href="/sign-in">Sign In</a>
        <a class="s4-button" href="/start" data-keep>Start Free</a>
        <button class="s4-icon-button s4-site-menu-button" type="button" aria-label="Menu"><span class="s4-icon" data-icon="menu"></span></button>
      </div>
    </div>
  </header>
  <main id="main">
    <section class="s4-site-section" aria-labelledby="hero-h">
      <div class="s4-hero" data-layout="split">
        <div class="s4-hero-text">
          <p class="s4-eyebrow">For Households</p>
          <h1 class="s4-hero-title" id="hero-h">Every Bill Paid on Time</h1>
          <p class="s4-site-lead">One sentence that says what it is and who it is for.</p>
          <div class="s4-site-actions-row"><a class="s4-button" data-size="m" href="/start">Start Free</a><a class="s4-button" data-variant="tonal" data-size="m" href="#how">See How It Works</a></div>
          <p class="s4-hero-trust">Trusted by 40,000 households</p>
        </div>
        <div class="s4-hero-media s4-site-stage" data-bleed>
          <div class="s4-frame" data-device="phone" role="img" aria-label="What the screen shows"><div class="s4-frame-screen" inert>…</div></div>
        </div>
      </div>
    </section>
    <section class="s4-site-section" aria-labelledby="how-h">
      <div class="s4-site-section-head" data-layout="split">
        <p class="s4-eyebrow">How It Works</p>
        <h2 class="s4-site-title" id="how-h">Three Steps</h2>
        <p class="s4-site-lead">…</p>
      </div>
      …feature rows, bento, features, quotes, plans…
    </section>
    <section class="s4-site-section" data-tone="accent"><div class="s4-cta">…</div></section>
  </main>
  <footer class="s4-site-footer">…</footer>
</body>
```

## Parts

| Part | What | Options |
|---|---|---|
| `body.s4-site` | The page: surface background, sticky footer at the bottom of short pages, smooth anchor scrolling (not under reduced motion) with room for the header | — |
| `.s4-skip-link` | First thing in the body; shows on focus | — |
| `.s4-announce` | A one-line notice above the header (scrolls away) | — |
| `.s4-site-header` > `.s4-site-bar` | Sticky header on the site width: `.s4-site-logo` (`.s4-site-logo-mark` or an img/svg), `.s4-site-nav`, `.s4-site-actions`, `.s4-site-menu-button` | `data-keep` on the action that stays in the bar under 840 |
| `.s4-site-menu` | The phone menu: a floating glass panel made by site.js from the nav and actions (or your own, linked with `aria-controls`) | — |
| `.s4-site-section` | One band of the page; pads half the section rhythm top and bottom and lines content up on the site width; a container for its sections' container queries | `data-tone="low|high|accent"` (an inset rounded band), `data-space="compact|none"` |
| `.s4-site-section-head` | Eyebrow (`.s4-eyebrow`), title (`.s4-site-title`), lead (`.s4-site-lead`) | `data-align="center"`, `data-layout="split"` (title left, lead right from 840) |
| `.s4-site-split` | Heading beside its content (FAQ, contact); the heading stays in view | — |
| `.s4-site-actions-row` | One or two actions; full width under 600 | — |
| `.s4-site-more` | A text link with an arrow that leans forward on hover | — |
| `.s4-hero` | `.s4-hero-text` (`.s4-hero-title` = the one `h1`, lead, actions, `.s4-hero-trust`) and `.s4-hero-media` | `data-layout="text"` (default), `split`, `stack` |
| `.s4-frame` > `.s4-frame-screen` | A real screen as a picture (phone or browser), concentric corners | `data-device="phone|browser"`; browser adds `.s4-frame-bar` > `.s4-frame-address` |
| `.s4-site-stage` | A soft panel that holds a composition | `data-ratio` (from 600), `data-bleed` (hangs from the top, cut by the bottom edge), `data-tone="accent"` |
| `.s4-media` > `.s4-media-box` + `.s4-media-caption` | A figure at a fixed ratio; img, video or iframe fill it; `.s4-media-empty` is the designed empty / poster state; `.s4-media-play` floats a play control | `data-ratio="16:9|4:3|3:2|1:1|4:5|21:9"`, `data-tone="low|secondary|tertiary|accent"` |
| `.s4-feature-rows` > `.s4-feature-row` | `.s4-feature-text` beside `.s4-feature-media`; every second row flips from 840 | — |
| `.s4-checks` | A short list with check icons | — |
| `.s4-bento` > `.s4-bento-cell` | Cells of different sizes that always fill the row; `.s4-bento-title`, `.s4-bento-visual`, `.s4-bento-figure` | `data-span="3…12"` (of 12; each row adds up to 12), `data-rows="2"`, `data-tone="accent"` (one at most) |
| `.s4-features` > `.s4-feature` | Icon, `.s4-feature-name`, one sentence; 1 / 2 / 3 columns | `data-columns="2|4"` |
| `.s4-site-grid` | Equal items (projects, posts) that fill every row; 1 / 2 / 3 columns | `data-columns="2|4"` |
| `.s4-logos` | A line of text and a row of wordmarks (`.s4-logo`) or logo images | — |
| `.s4-quote` | One large quote (`blockquote` + `.s4-quote-cite`), hanging punctuation | `data-align="center"` |
| `.s4-quotes` | Short quotes as filled cards, 1 then 3 columns | — |
| `.s4-numbers` > `.s4-number` | Big numbers: a `dl` with `dt` (label) and `dd` (value) | `data-columns="3"` |
| `.s4-plans-period` | Holds the period switch: a Joined Capsule group with `data-period` | — |
| `.s4-plans` > `.s4-plan` | `.s4-plan-head` (`.s4-plan-name`), `.s4-plan-price` (`.s4-plan-amount`, `.s4-plan-per`), a button, `.s4-checks` | `data-featured` (the accent fill) |
| `[data-period-<value>]` | Text shown for that period, on any element in the same section (or `[data-period-scope]`) | — |
| `.s4-compare` | A comparison table; under 600 one plan column at a time, picked with its own Joined Capsule group (values 1…4) | `tbody[data-group]` starts a group with a `th scope="rowgroup"` row |
| `.s4-cta` | Words and actions in a band | `data-align="center"` |
| `.s4-site-signup` | An email field and a button on one line | — |
| `.s4-post-featured`, `.s4-posts` > `.s4-post` | A featured post (cover + text) and a dated list (`.s4-post-meta`, `h3` link, sentence, tags) | — |
| `.s4-docs` | Docs page: `.s4-docs-bar` (phone), `.s4-docs-nav`, `.s4-docs-main`, `.s4-toc`, `.s4-docs-pager` | — |
| `[data-site-panel="id"]` | A button that opens that element as a floating glass panel on a phone (the docs sidebar) | — |
| `.s4-site-footer` | `.s4-site-footer-top` (`.s4-site-footer-brand`, `.s4-site-footer-links`) and `.s4-site-footer-base` (small print, a theme switch) | `data-columns="2|3"` on the links (4 default) |

## Behaviour (`site.js`)

- The header gets `data-scrolled` (glass) once content is under it.
- The menu button opens the menu panel with Pop; Escape, a tap outside, a link, or a window growing past 840 closes it.
  Focus moves to the current link when it opens and back to the button on Escape. It is a disclosure, not a modal.
- `[data-period]` groups swap prices; `.s4-compare` groups pick the column; `.s4-toc` marks the section being read
  with `aria-current="location"`.

## When to use what

- **A product or project home page:** `landing.html`. One split hero, proof, how it works, the rest, one accent band.
- **A studio, portfolio or about page:** `site.html` (stacked hero, work as figures, services, contact).
- **Plans:** `pricing.html`. **Writing:** `blog.html` for the index, `article.html` for each post. **Help:** `docs.html`.
- An app's own screens stay in the app shell; a site never uses the nav bar or rail.

**Do**
- One `h1` per page (`.s4-hero-title`), section titles as `h2`, then `h3` inside.
- Use the accent once a page: the featured plan, or the call-to-action band, or one bento cell.
- Make pictures from real screens (`.s4-frame` with real components inside, `inert`, `role="img"` and a label) or set
  covers in type; give every img and video `width`, `height` and `loading="lazy"` below the first screen.
- Start-align sections; center only a short hero or a closing band.

**Don't**
- Don't center everything, and don't make a page of three identical cards.
- Don't use gradients, shadows, outlines or glass on sections; glass is only for the header and the phone menu.
- Don't put reading in a dialog or a lightbox: a post or a case study is a page (decision 0050).
- Don't leave a hole in a grid: bento spans add up to 12, grids use `data-columns`.

## Accessibility

Skip link first; landmarks (`header`, `nav` with labels, `main`, `footer`); one `h1`. The menu button has
`aria-expanded` and `aria-controls`; the current page is `aria-current="page"`, the section being read
`aria-current="location"`. Frames are pictures (`role="img"` with a label, `inert` inside). Comparison cells use
icons with labels ("Included", "Not included"). Prices that change with the period are plain text in place.

## Performance (pages that count every kilobyte)

The site templates load the lighter files the build also writes (same code, comments and spare whitespace out;
`npm run check:bundle` fails if they are stale). Gzipped: `orion.min.css` 42 KB (orion.css 80), `orion.min.js` 48 KB
(orion.js 71), `icons-solar.js` 28 KB (icons.js, all three sets, 79). The font (165 KB) is the biggest file left.

```html
<link rel="preload" href="inter-variable.woff2" as="font" type="font/woff2" crossorigin>   <!-- first, so text never waits -->
<link rel="stylesheet" href="orion.min.css">                                               <!-- @font-face uses font-display: swap -->
…
<script src="icons-solar.js" defer></script>   <!-- one icon set; load icons.js instead only if the page switches sets -->
<script src="orion.min.js" defer></script>
<script>addEventListener('DOMContentLoaded', function () { S4.theme.restore('app-key', { mode: 'system' }); });</script>
```

Give every `img` and `video` a `width` and `height` (or put it in a `.s4-media-box` with a ratio) and `loading="lazy"`
below the first screen.

## Tokens

`--s4-site-hero-*`, `--s4-site-title-*`, `--s4-site-lead-*`, `--s4-site-section-space(-compact|-wide)`,
`--s4-site-section-gap`, `--s4-site-margin`, `--s4-site-width`, `--s4-site-measure(-wide)`; surfaces
`surface-container-low|high|highest`, the accent `primary-container` / `on-primary-container`, selection
`secondary-container`; shapes `corner-extra-large`, `corner-extra-extra-large`, `--s4-shape-control`, `--s4-shape-sheet`;
motion `--s4-motion-state`, `--s4-motion-bend`, `S4.transition.pop`.
