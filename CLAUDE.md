# S4 Orion: working notes for Claude

S4 Orion is the owner's personal design system for web apps and pages: Material 3 Expressive plus a very clear,
contrast-guaranteed glass layer on floating chrome. It replaces the older **S4 Material** skill. **S4 Glass is a separate,
unrelated system**; don't mix the two. The repo was renamed from `s4-material` to `s4-orion` (2026-11); the product is **S4 Orion**.

**Start every session by reading [`docs/NEXT.md`](docs/NEXT.md)** (and [`docs/ROADMAP.md`](docs/ROADMAP.md) for the long view and what Orion will not become): current phase, the plan for what's left, the backlog
and the open questions. Update it (and the README phase table and CHANGELOG) before ending any session that changed
something, so the next session can pick up cold.

## How the owner works

- **Publish everything reviewable to GitHub Pages** and link it in the reply: https://4rk0s4h4.github.io/s4-orion/
  (deploys from `main`, repo root). The owner reviews on an iPhone, so check pages at 390px as well as desktop.
- **Drafts go on GitHub Pages** as quiz-style review labs, not Claude Design canvases (owner preference, 2026-11-11). Plain quiz layout, no toggles up top. Whole layouts: mobile only, the real demo restyled in 390px frames (`explore/lib/phone-review.js`, template `explore/review-direction.html`). Ask big questions (overall direction), not small tweaks.
- **Design decisions are made through review labs** in `explore/` (questionnaire style: options picked by tapping the
  option card right above its demo, answers saved in localStorage with an in-memory fallback, a Copy Answers button at
  the end). Labs are built on the live Orion bundle (decision 0048, which reversed "review blue"): use `S4Review.card` / `S4Review.page` from `explore/lib/review.js`; what is being judged goes inside a card's Preview, and a lab writes no colors, fonts or timings of its own outside it.
  `npm run build` stamps the `?v=` on every local asset a page loads (content hash), so never edit them by hand; **always append `?v=<short commit>` to page links in replies** (e.g. `.../explore/menu-motion.html?v=ab12cd3`, from `git rev-parse --short HEAD` after committing), so the owner never needs a hard refresh.
- **Motion labs get the scrubber** (`explore/lib/scrub.js`: a bar to freeze an animation and drag through it, so the owner can send screenshots of exact moments); the demo has it at `demo/index.html?scrub`.
- **Pause for approval** at the points named in `docs/NEXT.md`; otherwise keep going without asking.
- **Open issues live in [`docs/issues/README.md`](docs/issues/README.md)** with reference images in `docs/issues/img/`.
  Save any screenshot the owner sends with a critique there. Before working on an issue, open its image. **If an issue
  has a reference image you can't open or see, stop and ask the owner for the image (or explain why it can't be seen and
  how to fix that) before continuing.**
- Keep replies short and plain; lead with links and what needs a decision.
- **Subagents do the building** (owner, 2026-11-16): the main session orchestrates and reviews; give building, running builds and tests, and bulk edits to Opus or Sonnet subagents (Sonnet for mechanical work, Opus for design-sensitive work), so the main model's usage is not spent on execution.
- Recorded decisions live in `docs/decisions/` (0001 audit, 0002 repo, 0003 tokens, 0004 glass, 0005 phase 6 review, 0006 liquid glass, 0007 icons, 0008 owner critique, 0009 style lab, 0010 critique round 2, 0011 style lab 2, 0012 liquid glass webkit, 0013 glass edge and no shadow, 0014 calmer glass color, 0015 items on glass, 0016 thinner frost line, 0017 no shadows, 0018 menu emerges, 0019 liquid glass mirror, abandoned, 0020 own language, not adopted except glass, 0021 glass from the playground, 0022 simpler motion, 0023 filled and pills, 0024 tray groups and inputs, 0025 no sharp corners, glass FAB, more components, 0026 joined capsule groups, 0027 glass edge matches the playground, 0028 owner's latest glass numbers, edge glow and sheen, 0029 dynamic edge width, 0030 glow follows the edge light, 0031 edge light color from the surface, 0032 colored FABs at 90%, 0033 evenly lit edge, 0034 iOS-calibrated edge, 0035 owner's tailored glass set and light edge quiz, 0036 glow inverts into an edge shade on light surfaces, 0037 glow/shade flip at a lightness threshold, 0038 floating bars, tried and reverted, 0039 docked glass gets the full glass edge, 0040 docked glass lights only its free edge, 0041 framework layer, 0042 liquid ink motion, 0043 the overhaul (neutral color, density, side navigation, items on glass, floating panels, date picker, desktop apps), 0044 overhaul accepted, row hover Edges Lean, palette contrast, 0045 Crisper grays, any accent, list dividers, 0046 one motion philosophy, 0047 placement ladder, 0048 quizzes are Orion, 0049 never focus a field, 0050 pages, 0051 the eight ideas built, 0052 concentric corners, two color modes, dragging on a phone, 0053 the app is the app, 0054 tool panels, 0055 brand dials, 0056 themes on any container, energy, app defaults, roomy, 0057 website kit, 0058 reach and proven dials, 0059 button groups and tabs; status of each in `docs/decisions/README.md`). Don't reopen a
  decision without the owner; add a new numbered record for new ones.

## Git and publishing

- Work on branch `s4-orion`; publish with `git push origin s4-orion && git push origin s4-orion:main` (fast-forward).
  No PRs needed for this repo; the owner reviews on Pages.
- **A new session starts on its own branch** (e.g. `claude/<name>`). Ignore it: `git fetch origin s4-orion main &&
  git checkout -B s4-orion origin/s4-orion`, work there, publish as above. Only if pushing to `s4-orion`/`main` is
  refused, push the session branch and open a PR into `main` instead (Pages updates when it's merged).
- Don't ask the owner which branch to use or whether to start the next phase: `docs/NEXT.md` says what's next.
- Commit after each meaningful step with a clear message. Never put model names or IDs in commits, code or docs.
- CI (`.github/workflows/check.yml`) runs `npm run check` on every push. It must stay green.

## Build and check (Node 20+, no dependencies; Playwright only for the page checker)

```sh
npm run build    # tokens -> tokens.css/ts/json; icons -> icons.js; components -> orion.css/js; skill assets + generated references
npm run check    # token validation + WCAG pairs, icons, glass guarantee (97 schemes), any-accent check (210 schemes), motion patterns, stale-output check
node skill/s4-orion/scripts/check.mjs page.html [--out dir]   # page checker: 390 dark + 1280 light, contrast, overflow, lint
```

Generated files are committed (Pages serves them) and never edited by hand: `tokens/tokens.*`, `components/orion.*`,
`components/base/gray.css`, `components/assets/icons.js`, `skill/s4-orion/assets/*`, and `skill/s4-orion/references/*` **except** `patterns.md`.

After changing the skill, re-package it with skill-creator's packager (path varies per environment; find it with
`find / -name package_skill.py -path '*skill-creator*' 2>/dev/null`), run from the skill-creator folder:
`python3 -m scripts.package_skill <repo>/skill/s4-orion <repo>/skill/dist` → `skill/dist/s4-orion.skill`.
Validate with `scripts/quick_validate.py <repo>/skill/s4-orion`. Keep `SKILL.md` under ~500 lines.

## Map

| Path | What |
|---|---|
| `tokens/src/*.tokens.json` | Source of truth (W3C DTCG; modes in `$extensions["com.s4.modes"]`). |
| `scripts/` | `build-tokens.mjs`, `generate-color.mjs`, `check-glass.mjs`, `build-icons.mjs`, `build.mjs` (bundle + skill). |
| `components/` | One folder per component (`.css`, `.js`, reference `.html`, `README.md`). Rules: `components/CONVENTIONS.md`. Gallery: `components/index.html`. |
| `docs/` | `framework.md` (layers, public API, versioning), `philosophy.md`, `foundations/*.md` (copied into the skill), `decisions/` (+ README index), `NEXT.md`, `history/`. |
| `skill/s4-orion/` | The Claude skill: `SKILL.md`, `references/`, `assets/`, `scripts/check.mjs`, `scripts/inline.mjs`, `evals/`. |
| `templates/` | Starter apps per archetype (copied into the skill by the build). Start new apps here. |
| `demo/` | Orion Showcase app (every element). |
| `explore/` | Review labs (not part of the system). |
| `index.html` | Pages hub linking everything. |

## Rules that are easy to break

- CSS: tokens only (no hex/rgb, raw ms, cubic-bezier), everything in `@layer s4.*`, mode blocks wrapped in `:where()`.
- Glass only on floating chrome and overlays, max two layers, solid in high contrast / reduced transparency / no
  backdrop-filter. Text on glass is `on-surface`. Content (cards, lists, panes, fields) is always solid.
- Motion (decision 0022): only transform and opacity animate (never clip-path, size, color or blur; nothing cloned).
  Dialogs and floating panels pop (rise 16px + fade), snackbars rise,
  shared axis between views. One transition per element at a time. No origin scaling. Decision 0042 amends this: menus
  fade in place with their items following (not out of the button); snackbars and tooltips are glass and rise; liquid
  motion (the `ink` spring, edges that lead and trail) only for ink (state fills), never for glass.
- Glass (decisions 0021, 0027-0029): tint 75%, blur 8px, saturate 150%, top-light edge via `--s4-glass-edge-*` inset shadows (its color is the surface's own color lifted toward white, never pure white; top and bottom are lit equally so surfaces never look raised; calibrated to the iOS tab bar, decision 0034: thin rim top and bottom, none on the sides, a soft glow inside it that inverts into an edge shade on light surfaces, decision 0036; flips at a lightness threshold, same top/bottom geometry in both modes, decision 0037); the edge width scales with screen density (1.5x standard, 2x large standard screens).
- Decision 0025: no sharp corners anywhere a hover/press layer shows (lists 16, segments 12); FABs are glass tinted with their own color (tint 75%, default monochrome FAB icon proven at 3:1+ by `check-glass`); 41 components (added avatar, accordion, banner, skeleton, breadcrumbs, pagination, stepper, empty state); 0041 adds layout, stat, description list, prose, messages (46).
- Decision 0024: things you click are round; things you type into are medium-rounded (12), never pills or squared; selects open the glass menu; connected button groups are the Ink Track (0059).
- Decision 0023: nothing is outlined (everything filled); small things are pills, never squared or sharp. The demo is a generic mobile app (Orion Showcase) that shows every element; quizzes show only the one element being changed, not the app.
- Decision 0043 (the overhaul): a seed colors only accents (primary, selection, focus), surfaces stay neutral, status colors are fixed tokens (`--s4-color-success|warning|info|badge`); items on glass are tints (never solid patches; `check-glass` proves them); sheets are floating glass panels that pop (nothing slides from a screen edge, nothing docks); the rail is rows with a hamburger and a solid main action; no hover halos (controls answer in place); a chip never changes size; dialogs never focus a text field; errors keep the field's normal fill; lists are inset on every side, table rows are flat bands; press-to-square never inside a rounded container. Density: comfortable (touch) and compact (`data-density`); desktop apps use `data-window` + `.s4-titlebar` (`components/desktop/`). 48 components.
- Decision 0044: list rows hover with Edges Lean (own box per row, scale from `--_lean`, never a travelling highlight); an empty checkbox or radio uses `--s4-color-control` (3:1); placeholders at 85%. Compact density is opt-in, never the default.
- Decision 0045: Orion is any accent color on a neutral base; monochrome is one accent (the shipped one and the owner's favorite), never "the" look, so nothing may be designed to work only in black and white (`npm run check:accent` proves 210 accent schemes). Base grays are "Crisper" (white page, deep black), set by hand in `scripts/generate-color.mjs`. List dividers sit in the gap between rows, inset, and fade beside a hovered or selected row.
- Decision 0046 (one motion philosophy): every transition is one of ten named patterns (State, Ink, Morph, Bend, Reveal, Follow, Pop, Rise, Switch, Loop; `docs/foundations/motion.md`). CSS uses only pattern tokens (`--s4-motion-<pattern>`), script only `S4.transition.<pattern>()`; `npm run check:motion` rejects anything else. Never add a pattern without the owner.
- Decision 0047 (placement ladder): new content goes in place first (`.s4-expand`, inline `.s4-confirm`), then a menu, a pane, a floating panel; a dialog only when the app cannot go on without an answer. Do, then offer Undo, instead of "Are you sure?". 49 components.
- Decision 0049: no script ever puts the cursor in a text field, textarea or select (no `autofocus`, no `.focus()` on a field when anything opens, not even after a validation error). Only the person's own tap does. The suite fails on it.
- Decision 0050 (pages): three kinds of place. A view (`.s4-view`) is a destination; a page (`.s4-subpage`, `data-page-open`, `S4.pages`) is going into one thing, with Back in the bar, a title, a URL `#view/page/id` and the Back gesture; the placement ladder is for acting without leaving. Never a dialog for reading.
- Decision 0051: app behaviours are part of the language: `.s4-states` (loading, empty, error, offline for every list and pane), `.s4-form` (errors on blur, autosave, Undo), `components/direct/` (reorder with a finger, swipe, select several: never the only way to do a thing), `S4.palette` (mod+K), `data-resizable` splits, `.s4-chart` (one series = accent, several = `--s4-chart-1…6`, a table view always), small rewards. 57 components, 15 templates.
- Decision 0052: (1) nested corners are concentric: inner radius = outer radius minus the gap, or a full pill (the suite fails on a mismatch); (2) two color modes, both first class: neutral (default) and tinted (`S4.theme({ seed, surfaces: 'tinted' })`, the M3E everything-is-colored look); never design for only one, and keep an already tinted app tinted; (3) glass is for what floats over content: a toolbar in the page flow is a solid joined button group; (4) never re-insert an element while it is being touched, never animate it under the finger.
- Decision 0053 (the app is the app): Orion is a language, not a kit of parts. Adapting an existing app keeps its screens and its own elements and redraws each in Orion's style; never drop one or swap it for the nearest stock component (a chart is not a calendar). When an app needs an element Orion lacks, make it from Orion's rules (tokens, filled, round, a named motion pattern or none, text beside the picture, both color modes), first in the app's stylesheet, then in `components/` once it is general. Added that way: `.s4-ring`, `.s4-milestones`, `.s4-month` (marks: today, dot, band, flag), `.s4-timeline`. 61 components.
- Decision 0054 (tool panels): a floating panel that is a tool for the page behind it (filters, an inspector) takes `data-modeless`: from 600 wide no scrim, the page stays live, its controls act at once (no Apply). Task panels (a form you save or cancel) and all dialogs stay modal; on a phone every panel is modal.
- Decision 0055 (brand dials): what an app may change is a short list of attributes on `<html>`, set by `S4.theme`: accent, color mode, `gray` (pure, warm, cool), `page` (plain, soft), `corners` (round, soft, firm: never sharp), `display` and `text` typefaces, density, icon set. Everything you click reads `--s4-shape-control` clamped to half its height; never write a pill as `corner-full` on a control. Fixed in every app: filled, no shadows, glass only on what floats, concentric corners, the motion patterns, the behaviours. Letter spacing is tuned for Inter; headings are weight 600. `components/base/gray.css` is generated (`scripts/build-gray.mjs`, `npm run check:gray`).
- Decision 0056: every dial works on any element and nests (`data-theme`, `data-gray`, `data-page`, `data-corners`, `data-type-*`, `data-accent`, `data-energy`; `S4.theme(opts, el)`); scoped themes are for regions (a dark sidebar, a band), never one component; contrast and reduced motion/transparency stay page-wide (`npm run check:scopes`). `data-energy` calm/standard/lively, never per component. App defaults on `<html>` only pick the unmarked variant (`data-buttons="tonal"`, `data-cards="filled"`, `data-lists="segmented"`, `data-rail`); the main action still names `data-variant="filled"`. `data-density="roomy"` is for content sites only.
- Decision 0057 (website kit): a site is a document (`body.s4-site`, no app shell), fluid site type only on sites, section rhythm tokens, toned bands are inset rounded blocks, one accent a page, start-aligned, header solid then glass with a floating glass phone panel, pictures are real components in frames (never gray boxes or gradients), bento spans add to 12. Site pages load `orion.min.css`, `orion.min.js`, `icons-solar.js` (defer). 62 components, 19 templates.
- Decision 0058 (reach): `dir="rtl"` mirrors everything (logical properties only; directional icons flip); dark is screen-only, print is light (`data-s4-print="hide"`); controls that hold text use `min-block-size`, never a fixed height, and truncate only in the five listed places; forced colors and focus rings are covered. `npm test` runs `tests/reach.mjs` and a dial-preset pass; a new clickable component reads `--s4-shape-control` and joins `dialAudit`.
- Decision 0059 (button groups and tabs): if it swaps what is on the screen, it is tabs; if it changes a value or how the same thing is shown, it is a button group; if it narrows a collection and there can be many, it is chips. Connected button groups are the Ink Track (a filled track, the accent ink slides on Ink with a calm-Ink trailing copy; multi fills in place and fuses neighbours; on glass the glass is the track). Tabs are the navigation family (no tray, labels on the surface, the nav indicator in `secondary-container`, heavier selected label, every tab has a panel). The page checker and suite fail a group that swaps panels and tabs without panels. Supersedes 0026, amends 0009.
- Before naming a class or attribute, grep for it: `s4-page`, `s4-page-header` and `data-expand` all clashed with existing ones on 2026-11-15.
- Inter; Solar icons (Bold Duotone, Linear arrows)
  behind semantic names in `components/icons/names.json`. Title Case labels, sentence case sentences.
