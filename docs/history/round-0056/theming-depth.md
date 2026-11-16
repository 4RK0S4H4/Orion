# Round 0056 notes: theming-depth (issue 52, motion energy, app defaults, roomy density)

Branch `round56/theming-depth`. Goal: the review's Per-App Customization score to 10.

## 0056 candidate: themes on any container, motion energy, app defaults

**Themes on any container.** Every dial and the light or dark mode work on any element and nest; the nearest one wins.
`data-theme="light|dark"`, `data-gray="warm|cool|pure"`, `data-page="soft"`, `data-corners="round|soft|firm"`,
`data-type-display`, `data-type-text`, a scoped accent `data-accent="blue|#hex"` (+ `data-accent-variant`,
`data-surfaces="tinted"`), and `data-energy`. Script: `S4.theme(options, element)` writes the same keys as attributes on
that element (nothing saved; `null` = follow the page again; a default value such as `round`, `pure`, `inter`,
`standard`, mode `light` = stock Orion inside a branded page). Contrast, reduced motion and reduced transparency stay
page-wide and reach into every scope. A scoped element paints its own surface and text (`s4.base`, components still win),
sets `color-scheme`, and glass inside it is made from its surfaces.

How (the mechanism, chosen to keep zero specificity and an app's unlayered CSS winning):
- `tokens.css`: the dark block's selector is `:where([data-theme="dark"])` (root included); a light scope
  `:where([data-theme="light"]:not(:root))` re-declares the light value of every token dark mode changes. High contrast and
  dark high contrast blocks add `:root[data-contrast="high"] [data-theme=…]` (and the device-media equivalents); reduced
  motion and transparency blocks also match `[data-theme]`.
- Aliases (`var(--…)` tokens) resolve where declared, so each scoping attribute re-declares the aliases that depend on it:
  color aliases on `[data-theme]`, `[data-gray]`, `[data-accent]`; shape aliases on `[data-corners]`; typescale fonts on
  `[data-type-*]`. `[data-corners="round"]`, `[data-type-display="inter"]`, `[data-type-text="inter"]` reset to stock.
- Glass tints: a glass element re-maps the surface roles for its items, so a light or dark scope that is itself glass (a
  dark nav bar) gets its glass tints as plain values of its mode (generated), not as aliases.
- Gray and accent cross into nested light or dark scopes, so they use `light-dark(light, dark)` inside `@scope` (nearest
  scope root wins by scope proximity, whatever the source order). Page tone uses `@scope (light region) to ([data-theme="dark"])`.
- `brand.css` selectors lost their `:root` (corners and faces work anywhere). `build-gray.mjs` adds scoped blocks.
- `core.js`: the runtime color writer also writes the page's accent into nested light/dark/gray scopes, and writes each
  scoped accent once (`#s4-scoped-color`, keyed by `data-s4-accent-id`) with `light-dark()` and page contrast.
- `brand.css` dials set in the page's own markup are now `S4.theme()`'s starting state (so saving does not drop them).

**Motion energy.** `data-energy="calm|standard|lively"` / `S4.theme({ energy })`, on the root or a container. Same ten
patterns. Calm: Ink, Morph, Bend (CSS) and Pop, Rise, Switch (script) on critically damped, slightly quicker springs,
travel x0.6 (also Follow, Reveal, tip). Lively: Ink, Morph, Bend, Pop, Rise only, overshoot 2.5 to 6.3% (standard 0 to
2.8%), Pop and Rise travel x1.25. Eight new spring tokens (`bend-calm`, `rise-calm`, `pop-calm`, `ink-lively`,
`fast-spatial-lively`, `bend-lively`, `spatial-lively`, `rise-lively`), all 0ms under reduced motion.
`check:motion` now checks: energy blocks only touch ink/morph/bend, calm springs never overshoot, lively at most 7%,
every energy spring 0ms under reduced motion, lively in motion.js only on Pop and Rise.

**App defaults** (`components/base/defaults.css`), four, each picking which existing variant is unmarked:
- `data-buttons="tonal"`: calm, tool-like apps where a screen full of black/accent pills shouts. `data-variant="filled"`
  now names filled, so the one main action still stands out. Toggles (aria-pressed) and error buttons are untouched.
- `data-cards="filled"`: apps whose cards sit on a soft page or need more separation. `data-variant="elevated"` names the low one.
- `data-lists="segmented"`: settings-like apps where every list is M3E segmented. Done by a zero-specificity selector
  extension in `list.css` (copying eight rules would fork the look). Any `data-style` opts a list out.
- `data-rail="expanded|collapsed|auto"`: where a rail with no `data-expand`/`data-expanded` of its own starts.
  Note: the templates write `data-expand="auto"` on their rails, which wins; an app wanting the app default removes it.
Not added (one way to do each thing): chip style, dialog vs panel, top bar style: either no real variant or a placement
decision, not a look.

**Roomy density.** `data-density="roomy"`: `--s4-layout-margin` 40, `-margin-compact` 20, `-gap` 24, `-pane-gap` 40,
`-content-reading` 760, body-large 18/28 (tokens `--s4-density-roomy-*`). Controls untouched. Meeting `website-kit`:
their section rhythm tokens should read `--s4-layout-gap`/`--s4-layout-margin` (or scale with them) so roomy widens
sections too; roomy should not define section spacing itself. If they add `--s4-section-*`, roomy can remap those in
`density.css` in the same block.

## Paths
`scripts/build-tokens.mjs`, `scripts/build-gray.mjs`, `scripts/check-scopes.mjs` (new, in `npm run check`),
`scripts/check-motion.mjs`, `tokens/src/motion.tokens.json`, `tokens/src/spacing.tokens.json`,
`components/base/{base,brand,density,defaults(new),themes.html(new)}`, `components/core/core.js`,
`components/motion/{motion.css,motion.js}`, `components/button/button.css`, `components/card/card.css`,
`components/list/list.css`, `components/nav-rail/nav-rail.js`, `components/index.css`, `demo/index.html`, `demo/demo.js`,
`tests/suite.mjs` (adds the themes page), `docs/framework.md`, `docs/foundations/{color,motion,shape,typography}.md`.

## Sizes
`tokens/tokens.css` 55,578 -> 71,433 bytes (+28.5%); gzip -9 7,106 -> 9,147 (+28.7%). About 8.5 KB of that is the
scoping (light reset, alias re-declarations, scoped high contrast); the rest is the eight energy springs (each a 40-step
`linear()`) and the roomy tokens. `orion.css` 415,154 -> 447,546 (gzip 71,828 -> 76,501), mostly tokens and gray.css
(the scoped gray blocks).

## Proof
- `npm run check:scopes`: a small cascade over tokens.css proves that a dark container on a light page, a light one on a
  dark page and three-deep nesting, with device and attribute high contrast, reduced transparency and reduced motion,
  get exactly the page-wide values of their mode (42 scenarios, ~18,000 values), so the 83 pairs hold in every scope;
  and that the scoped grays equal the page-wide ones. Scoped accents use the same scheme function as `check:accent`.
- Defaults unchanged: before/after screenshots of the showcase, dashboard, settings, landing, menu and nav-rail pages at
  390 dark and 1280 light were byte-identical (Chromium) after every step.

## Changelog
- Added: themes on any container (`data-theme`, `data-gray`, `data-page`, `data-corners`, `data-type-*`, `data-accent`
  on any element; `S4.theme(options, element)`); reference page `components/base/themes.html`; `npm run check:scopes`.
- Added: motion energy (`data-energy`, `S4.theme({ energy })`, `S4.transition.energy(el)`), eight spring tokens.
- Added: app defaults `data-buttons`, `data-cards`, `data-lists`, `data-rail`; `data-variant="filled"` on buttons and
  `data-variant="elevated"` on cards as explicit names.
- Added: `data-density="roomy"`.
- Added: showcase Make It Yours gets Motion (energy) and Dark Navigation (a scoped theme on the rail and nav bar).
- Changed: dials written in `<html>` markup are `S4.theme()`'s starting state.

## For the skill
Use scoped themes for a contrasting sidebar, a branded band or a preview of another brand; never to restyle one
component. Prefer the attributes in markup; `S4.theme(opts, el)` for runtime. Energy: calm for tools and dense data,
lively for playful consumer apps; never per component. App defaults: set once on `<html>`, only when the app's character
calls for it; still name `data-variant="filled"` on the one main action. Roomy only for content sites (articles, docs,
landing pages), never for app screens.

## Hub links
`components/base/themes.html` (Themes On Any Container) under Components or Foundations.

## Not finished or not verified
- WebKit/Safari not run (not installed). `light-dark()` and `@scope` need Safari 17.5+ and a recent Chrome; Firefox
  shipped `@scope` late (verify the version before relying on it): on older browsers scoped gray, scoped accents and scoped page tone silently do nothing
  (scoped light/dark, corners, faces and energy do not need them). Owner should check the themes page and the
  showcase's Dark Navigation on a real iPhone.
- Nesting limits: a scoped accent nests one level cleanly (two accents nested: the later-written one wins inside both);
  a plain page-tone region inside a soft one is not a dial; `data-buttons="tonal"` inside an explicit `filled` container
  is not supported (filled is the default anyway). Gray inside a tinted app's scope can override tinted surfaces.
- `data-page` clashes in name with `.s4-subpage[data-page="name"]`; only the exact value `soft` is used, so they do not
  collide, but a subpage named "soft" would.
- The page tone dial is light-mode only, as before.
- Energy was verified by script (durations, travel, reduced motion); not judged by eye on a device. The lively overshoot
  amounts are my call and are worth a scrubber look (`demo/index.html?scrub` with Motion set to Lively).
- No suite test drives `S4.theme(opts, el)` interactively beyond the themes page's mode buttons (the suite clicks them).

## Note for the integrator
`index.html` (the hub) changed only in the `?v=` stamps that `npm run build` writes; rebuild after merging. Final check: 20 screenshots (showcase, dashboard, settings, landing, article, menu, nav rail, list, card, button; 390 dark and 1280 light) are byte-identical to the base commit 5edff08.
