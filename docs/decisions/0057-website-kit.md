# 0057: The website kit, and lighter files for pages (2026-11-16)

**Status:** built in round 0056 (issue 53; 0055 answered "Build it"). The owner left the calls to us on 2026-11-16
("I trust your judgement") and can overrule any of them. Notes:
[`docs/history/round-0056/website-kit.md`](../history/round-0056/website-kit.md).

## The question
Orion had one thin landing template. The review found a feature grid with a hole at 1280, no section rhythm and app
type on a marketing page. What should a website in Orion look like?

## The answers (every visible choice)
1. **A site is a document, not an app**: `body.s4-site`, no app shell, no nav bar or rail; the window scrolls.
2. **Fluid type only for sites**: hero 36 to 57, section title 28 to 45, lead 17 to 22, between 360 and 1280 wide
   (`--s4-site-hero|title|lead-*`). Faces, weights (600) and tracking follow the display and body roles, so the type
   dials apply. App type is unchanged.
3. **Rhythm**: 64 to 112 between sections, 32 to 56 from a heading to its content, margins 16 to 32, content on 1200.
   Roomy density (0056) widens it.
4. **Toned bands are inset rounded blocks** (corner 28 on a phone, 48 from 600) on the site width, never full-bleed
   stripes. Tones: `low`, `high`, `accent`.
5. **One accent a page**: `primary-container`, with the roles inside remapped so buttons and text stay proven pairs in
   every seed. Used by the featured plan, the call-to-action band, one bento cell or a cover.
6. **Start-aligned by default**; centered only for a short hero (`stack`), the pricing heading and a closing band.
   Section heads split (title left, lead right) from 840.
7. **Header**: solid at the top, glass once content scrolls under it (docked edge, like the top app bar). Links are text
   buttons; the current page is the selection fill. Under 840 links move into a floating glass panel under the bar
   (Pop; nothing slides from an edge); `data-keep` keeps the main action in the bar. A disclosure, not a modal: no scrim.
8. **Pictures without image files**: real Orion components inside phone or browser frames (`inert`, `role="img"`, an
   `aria-label`), a phone cut by its stage (`data-bleed`), covers set in type on a tone, and a designed empty state for
   media. No gray boxes, gradients or fake dashboards. Real images: `width`, `height`, `loading="lazy"` below the first
   screen, inside a ratio box.
9. **Bento**: spans out of 12 from 840 (rows add to 12), two columns 600 to 839, one on a phone. Equal grids use
   `data-columns`, not auto-fill.
10. **Pricing**: the period switch is the Joined Capsule; prices swap in place; the featured plan is a fill (no outline,
    no shadow); under 600 the comparison table shows one plan at a time, picked with its own Joined Capsule.
11. **Docs**: a sidebar of text buttons (sticky from 840; a floating glass panel behind "Browse Docs" on a phone), prose
    at reading width, "On This Page" from 1200 marking the section being read, previous and next as filled cards.
12. **No lightbox**: reading and case studies go on a page (0050).
13. Quotes hang their punctuation; numbers use tabular figures. The hero trust line uses the avatar stack (0058).

## Lighter files for pages
The build also writes `components/orion.min.css`, `orion.min.js` and one icon file per set (`icons-solar.js`,
`icons-phosphor.js`, `icons-phosphor-bold.js`), checked for staleness by `check:bundle`. Site templates load the min
files and `icons-solar.js`, all scripts `defer`: about 394 KB down to about 283 KB over the wire. The minifier is
deliberately plain (comments and spare whitespace only; JS keeps its line breaks). Apps may keep the full files.

## Templates
`landing.html` (product home, rebuilt), `pricing.html`, `blog.html` (posts open `article.html`), `docs.html`,
`site.html` (studio or portfolio). Product home order: split hero with the real product, logos, how it works (two or
three feature rows), bento for the rest, one quote and numbers, FAQ beside its heading, one accent band, footer.
