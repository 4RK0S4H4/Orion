# Round 0056: website-kit (issue 53)

Branch `round56/website-kit`. Takes the review's Websites score from "one thin landing template" to a kit: fluid site
type, section rhythm, a section component family, five site templates, and lighter bundles for pages.

## What was built (paths)

- **Tokens** `tokens/src/site.tokens.json` (new file, so no merge with typography/spacing): `--s4-site-hero-*`,
  `--s4-site-title-*`, `--s4-site-lead-*` (font, size, line-height, tracking, weight), `--s4-site-section-space`
  (+ `-compact`, `-wide`), `--s4-site-section-gap`, `--s4-site-margin`, `--s4-site-width`, `--s4-site-measure`,
  `--s4-site-measure-wide`. Documented in `docs/foundations/typography.md` and `spacing.md`; a "Websites" group in the
  generated `references/tokens.md`.
- **Component** `components/site/` (`site.css`, `site.js`, `site.html` reference page, `README.md`), imported in
  `components/index.css` (after prose), README group "Websites" in `scripts/build.mjs`, gallery entry in
  `components/index.html`. Parts: skip link, announcement bar, site header + phone menu panel, sections and section
  heads, split heading, hero (text / split / stack), frames (phone, browser), stage (ratio, bleed), media figure
  (ratios, tones, empty/poster state, play control, caption), feature rows, checks, bento, icon feature list, site grid,
  logos, large quote, quote cards, numbers, pricing plans + period switch, comparison table, call to action, signup
  field, blog index (featured + list), docs layout (sidebar, toc, pager), footer.
- **Glass** `components/glass/glass.css`: `.s4-site-header[data-scrolled]` (docked: lit on its bottom edge only, like
  the top app bar) and `.s4-site-panel[data-open]` added to every glass list. Integrator: this is the one shared file
  edited; the change is additive (two selectors per list).
- **Templates**: `landing.html` rebuilt; new `pricing.html`, `blog.html` (posts open `article.html`), `docs.html`,
  `site.html` (studio/portfolio). Registered in `templates/index.html`; the build copies them into the skill.
  `docs/framework.md`: template count and "choosing a starting point" rows.
- **Performance** `scripts/build.mjs` now also writes `components/orion.min.css`, `components/orion.min.js`,
  `components/assets/icons-<set>.js` (all three sets) and skill copies (`orion.min.*`, `icons-solar.js`). All are in
  the build's outputs map, so `npm run check:bundle` fails when they are stale. `scripts/check-motion.mjs` skips them
  as generated copies (same as orion.css/js). `skill/s4-orion/scripts/inline.mjs` recognises `orion.min.js`.
  The five site templates load the min files and `icons-solar.js`, all scripts `defer`.
- **Suite** `tests/suite.mjs`: opens every `.s4-site-menu-button` / `[data-site-panel]` (must open, fit, be glass, not
  focus a field, close with Escape, give focus back), flips the pricing period (prices must change), the comparison
  picker (column must change), and scrolls the docs to the end (the last contents link must be current).

## Numbers (gzip -9)

| File | Before | After |
|---|---|---|
| CSS | orion.css 79.6 KB | orion.min.css 41.8 KB |
| JS | orion.js 70.8 KB | orion.min.js 48.5 KB |
| Icons | icons.js (3 sets) 78.9 KB | icons-solar.js 28.1 KB |
| Font | 165 KB (woff2) | unchanged; preloaded, `font-display: swap` already in base.css |

A site page goes from about 394 KB to about 283 KB over the wire. The minifier is deliberately conservative (no
parser): CSS strips comments and spare whitespace with strings protected; JS keeps line breaks (ASI unchanged) and only
drops comments and indentation. Checked: landing, docs and dashboard render pixel-identical with the min files.

## Visible choices (for a decision record)

1. **A site is a document, not an app**: `body.s4-site`, no app shell, no nav bar or rail; the window scrolls.
2. **Fluid type only for sites**: hero 36→57, section title 28→45, lead 17→22 between 360 and 1280 wide; the faces,
   weights (600) and tracking follow the display/body roles, so the display dial and serif drop Inter's tracking for
   free. App type unchanged.
3. **Rhythm**: 64→112 between sections, 32→56 from a heading to its content, margins 16→32, content on 1200.
4. **Toned bands are inset rounded blocks** (corner 28 on a phone, 48 from 600) on the site width, never full-bleed
   stripes. Tones: `low`, `high`, `accent`.
5. **One accent a page**: the accent is `primary-container`; inside it the roles are remapped (primary ←
   on-primary-container, on-primary ← primary-container), so buttons and text inside stay proven pairs in every seed.
   Used by the featured plan, the call-to-action band, one bento cell, a cover.
6. **Start-aligned by default**; centered only for a short hero (`stack`), pricing heading and a closing band.
   Section heads can split (title left, lead right) from 840.
7. **Header**: solid at the top, glass once content scrolls under it (docked edge like the top app bar). Navigation
   links are text buttons in the content color; the current page is the selection fill. Under 840 the links and
   secondary actions move into a **floating glass panel** under the bar (Pop; decision 0043, nothing slides from an
   edge); `data-keep` keeps the main action in the bar. It is a disclosure, not a modal: no scrim. The panel sits
   after the header, not inside it (a glass panel inside the glass header would only blur the header).
8. **Pictures without image files**: real Orion components inside phone/browser frames (`inert`, `role="img"`), a
   phone hanging from the top of a stage and cut by its bottom edge (`data-bleed`), covers set in type on a tone, and a
   designed empty/poster state for media. No gray boxes, no gradients, no fake dashboards of gray bars.
9. **Bento** spans out of 12 from 840 (rows add to 12), two columns 600–839 (wide cells full, a last lone cell fills
   the row), one column on a phone. Fixes the 936-of-1200 hole the review found. Grids of equal items use
   `data-columns`, not auto-fill.
10. **Pricing**: period switch is the Joined Capsule; prices are plain text swapped in place (`data-period-<value>`);
    the featured plan is a fill, not an outline or shadow; the comparison table shows one plan column at a time under
    600, picked with its own Joined Capsule group.
11. **Docs**: sidebar of text buttons (sticky from 840; a floating glass panel behind "Browse Docs" on a phone),
    prose at reading width, "On This Page" from 1200 marking the section being read (`aria-current="location"`),
    previous/next as filled cards. Code blocks are the prose `pre` (the data-scale code block was not in this worktree).
12. **No lightbox**: reading and case studies go on a page (decision 0050).
13. Quotes use hanging punctuation; numbers use tabular figures on the title scale.

## Changelog lines

- Added: website kit `components/site/` (site header with phone menu panel, hero, feature rows, bento, icon list,
  logos, quotes, numbers, pricing with period switch and comparison table, call to action, media figures, blog index,
  docs layout with contents, footer).
- Added: site tokens: fluid display scale (`--s4-site-hero|title|lead-*`), section rhythm, site width and measures.
- Added: templates `pricing.html`, `blog.html`, `docs.html`, `site.html`.
- Added: `orion.min.css`, `orion.min.js` and one icon file per set (`icons-solar.js`, …), checked for staleness.
- Changed: `landing.html` rebuilt as a complete product home page on the kit.
- Changed: the site header and site panels are glass (glass.css lists).
- Fixed: the landing page's feature grid no longer leaves a hole at 1280 (issue 53).

## What the skill should tell Claude (SKILL.md is the integrator's)

- A marketing page, product home, studio/portfolio, pricing, blog or docs → start from `landing.html`, `site.html`,
  `pricing.html`, `blog.html` (+ `article.html` per post) or `docs.html`; read `components.md#site`.
- Order for a product home: split hero with the real product → logos → how it works (2–3 feature rows) → bento for
  the rest → one quote + numbers → FAQ beside its heading → one accent call-to-action band → footer.
- One `h1` (`.s4-hero-title`), section titles `.s4-site-title` (h2). Start-aligned; center only short blocks.
- Accent at most once a page (featured plan, call-to-action band, one bento cell or a cover).
- Images: no network fetches and no gray boxes. Use frames with real Orion components (`inert`, `role="img"`,
  `aria-label`), covers set in type on a tone, or the media empty state. Real images: `width`, `height`,
  `loading="lazy"` below the first screen, inside a `.s4-media-box` with a ratio.
- Bento spans add up to 12 per row; grids use `data-columns`.
- Glass only on the header and the phone panels; no gradients, shadows or outlines on sections.
- Load `orion.min.css`, `orion.min.js` and `icons-solar.js` (defer) on sites; keep the font preload. Copy those from
  assets (the template header comment still lists the full files; the integrator may want to word it per template).
- Every page must have the skip link, landmarks, meta description, Open Graph tags and `theme-color` (light and dark).

## Hub links to add

- Templates: `templates/pricing.html`, `templates/blog.html`, `templates/docs.html`, `templates/site.html`, and the
  rebuilt `templates/landing.html`.
- Component: `components/site/site.html` (Website Kit).

## Unfinished or unverified

- **WebKit / iPhone not verified** (not installable here). Look on a real iPhone at: the glass header while scrolling,
  the phone menu panel (Pop, Escape is not available there: tap outside / a link closes it), the docs "Browse Docs"
  panel, `scroll-padding` under the sticky header, and the hero phone bleeding off the stage.
- Brand dials: looked at the landing with `gray: warm + display: serif + corners: soft + rust` and with
  `tinted violet + rounded faces` at 1280 (and 390 light); both hold. Not screenshotted on every template, and
  `corners: firm`, `page: soft` were not looked at on sites. The rounded face falls back to the system face here.
- 1600-wide screenshots were taken for landing and docs only; other templates were checked at 390 dark and 1280 light.
- The reference page `components/site/site.html` covers every part but is plain (no 600–839 demos frame).
- No real `img`/`video` in any template (no image files and no network), so lazy loading and width/height are
  documented, not shown. The video slot is the designed empty state with a play link.
- The avatar group overlaps initials at the default size (existing component behaviour; seen in the hero trust line).
- `og:image` URLs point to example.com placeholders that the app must replace.
- Not done: a changelog-specific layout (the blog list carries "Changelog" posts), a lightbox (not wanted: 0050),
  a minified demo copy (the demo keeps its own full bundle).
- No decision record or quiz: the owner said "Build It" and left the design calls to us; the choices above are for
  the integrator to record. Owner's look on the iPhone and a desktop is still the real test.
