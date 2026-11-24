# Review labs

Interactive pages used to make Orion's design decisions with the owner. They are **not** part of the design system,
but since decision 0048 they are **built with it**: the quiz UI (`lib/review.css`, `lib/review.js`) is the live Orion
bundle, so a decision made in one quiz shows in the next. What is being judged sits in a "Preview" well inside its
option card. Answers are saved in the browser so several labs can be worked through at once.

| Page | Decided |
|---|---|
| `direction.html` | Superseded by design drafts (0020 accepted): the overhaul to Orion's own language (surfaces, corners, controls, depth, nav, type, motion, framework shape, token names) ([0020](../docs/decisions/0020-own-language.md)) |
| `states-shape.html` | States A (stock M3), Shape A (stock M3 Expressive), default color Mono |
| `motion.html` | Springs D (M3 Expressive) |
| `liquid-glass.html` | Not adopted: liquid glass (refraction + frost) was explored and shelved; 0004 glass stays ([0006](../docs/decisions/0006-liquid-glass.md)) |
| `liquid5.html` | Abandoned 2026-11-10: liquid glass over real pages via a mirror (a live copy of the content with the SVG lens filter on it), iPhone-safe ([0019](../docs/decisions/0019-liquid-glass-mirror.md)); phone page `liquid5-app.html` |
| `liquid4.html` | Open: the WebGL liquid glass over a real DOM page, using a snapshot of the page as the texture (needs the iPhone check) |
| `liquid3.html` | Open: glass with a magnified-rim copy of the content behind it (iPhone-safe, no WebGL) |
| `review-direction.html` | Superseded by [0023](../docs/decisions/0023-filled-and-pills.md): the owner kept the current direction, filled and pills (it restyles the old demo and no longer fits the new one) |
| `review-icon-set.html` | Open: icon set (Solar Bold Duotone today, Phosphor Duotone, Phosphor Bold Duotone); also switchable live in the showcase, Settings, Icon Style |
| `glass-playground.html` | Tool, not a quiz: tune the real glass (tint, blur, boost, edge, floating button tint) over three backdrops, with the live contrast guarantee; send the numbers back |
| `review-button-group.html` | Answered: E, Joined Capsule ([0026](../docs/decisions/0026-joined-capsule-and-accurate-glass-lab.md), superseded by 0059) |
| `review-button-group-2.html` | Answered 2026-11-17: A, Ink Track; pairs Same As The Take (issue 63, [0059](../docs/decisions/0059-button-groups-and-tabs.md), which also moved tabs to the navigation family). Its Keep card now shows the shipped Ink Track |
| `review-lens-edge.html` | Open: a lens rim in place of today's glass edge (the body unchanged, an even band of clear glass that deepens what is behind it): overall with or without glow, width, strength, blur, docked bars |
| `review-window-icons.html` | Open: window control icons, Bold Duotone circles (minus, full screen, quit full screen, close) against today's squares, at rest, hovered and maximized, light and dark |
| `review-light-edge.html` | Open: how glass edges should read on light mode (today, hairline outline, shaded rim, edge shade); dark unchanged |
| `review-depth.html` | Open: how glass and the solid base combine as elevation (chrome only, three levels, one glass hero, glass sheet) |
| `review-edge-refract.html` | Open: glass rim line (clear rim that shows and brightens the backdrop; today, hairline, bright, wide) |
| `style2.html` | Open: button groups, sliders, phone sheets and glass edge looks |
| `style.html` | Open: alternative looks (less Material) for text fields, checkboxes, tables and tab headers |
| `icons.html` | Open: plain or boxed glyphs for add, close, check and menu (Solar Bold Duotone either way) |
| `transitions.html` | Unfold menus, container transform for dialogs, sheets and list-to-detail, shared axis between views, snackbars slide from the edge |

`lib/` holds the shared review tooling: `review.js` and `questions.js` (the questionnaire), `theme.js` (seed to M3 roles),
`springs.js` (spring presets as CSS `linear()` easings), `liquid-glass.js` (the liquid glass engine: WebGL2 refraction over a canvas backdrop everywhere, SVG `backdrop-filter` refraction in Chromium), plus copies of `m3color.js`, Inter and a few Solar icons. Once the
build exists, the labs will load these from the built assets instead.
