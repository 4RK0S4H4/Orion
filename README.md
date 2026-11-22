# S4 Orion

A personal design language for web apps and pages, built on **Material 3 Expressive**, with a **glass layer** reserved for floating chrome. It is the successor to the S4 Material skill (1.3) and is designed to be applied consistently by Claude, through the skill in [`/skill`](skill/), and by hand.

**Live site:** https://4rk0s4h4.github.io/s4-orion/ (demos, review labs and reference)

## What's in the repo

| Folder | What it holds | Source or generated |
|---|---|---|
| [`tokens/`](tokens/) | Design tokens. `src/*.tokens.json` (W3C Design Tokens format) is the single source of truth; `tokens.css` and `tokens.ts` are built from it. | JSON is source; CSS/TS generated |
| [`components/`](components/) | Reference implementations: one folder per component with its CSS and an HTML example, a small runtime (`orion.js`) for theming and motion, and React wrappers where they help. | Source |
| [`docs/`](docs/) | Philosophy, foundations, usage guidelines, do/don't examples and the decision log. | Source |
| [`skill/`](skill/) | The Claude skill (`skill/s4-orion/`): `SKILL.md`, reference files loaded on demand, and the built assets an app copies in. | `SKILL.md` and references are source; `assets/` is generated |
| [`templates/`](templates/) | Nineteen starters: fourteen apps (dashboard, list and detail, settings, sign-in, article, chat, tool, board, calendar, editor, gallery, checkout, onboarding, desktop app) and five websites (landing, pricing, blog, docs, site), also shipped in the skill. | Source |
| [`demo/`](demo/) | One showcase page that uses every component, built only from the skill and tokens. | Source |
| [`explore/`](explore/) | Review labs used to make design decisions (States and Shape, Motion, Transitions). Not part of the system. | Source |
| [`scripts/`](scripts/) | Build and check scripts (tokens → CSS/TS, bundle, skill references, contrast and glass checks). | Source |
| [`LICENSES/`](LICENSES/) | Third-party licences for bundled fonts, icons and libraries. | — |

The flow is one way: **tokens → components → skill assets → demo**. Change a value in `tokens/src`, run the build, and everything downstream picks it up. Generated files are committed so GitHub Pages can serve them, and are never edited by hand.

## Status

S4 Orion is being built phase by phase. Decisions are recorded in [`docs/decisions/`](docs/decisions/); the current plan, backlog and next steps are in [`docs/NEXT.md`](docs/NEXT.md).

| Phase | What | State |
|---|---|---|
| 1 | Audit of S4 Material 1.3 and decisions | Done ([0001](docs/decisions/0001-phase-1-audit.md)) |
| 2 | Repo structure | Done ([0002](docs/decisions/0002-repo-structure.md)) |
| 3 | Tokens and build script | Done ([0003](docs/decisions/0003-tokens.md), [tokens page](https://4rk0s4h4.github.io/s4-orion/tokens/)) |
| 4 | Components and the glass layer | Done ([0004](docs/decisions/0004-glass.md), [components](https://4rk0s4h4.github.io/s4-orion/components/)) |
| 5 | Claude skill | Done, approved ([skill](skill/), [download](skill/dist/s4-orion.skill)) |
| 6 | Demo and review against the skill | Built; end-to-end review and motion fixes done 2026-11-03; awaiting the owner's iPhone check ([0005](docs/decisions/0005-phase-6-review.md)) |
| 8 | Framework layer: templates, canonical layouts, content components, framework guide | Built 2026-11-13, awaiting the owner ([0041](docs/decisions/0041-framework-layer.md), [review](docs/reviews/2026-11-13-framework-review.md), [templates](https://4rk0s4h4.github.io/s4-orion/templates/)) |
| 7 | Glass from the playground and simpler motion | Done 2026-11-11 ([0021](docs/decisions/0021-glass-from-the-playground.md), [0022](docs/decisions/0022-simpler-motion.md)); design review with proposals ([review](docs/reviews/2026-11-11-design-review.md)) awaiting the owner |
| 9 | One motion philosophy, expand in place, Orion on every page, production suite | Built 2026-11-14, awaiting the owner ([0046](docs/decisions/0046-one-motion-philosophy.md), [0047](docs/decisions/0047-placement-ladder.md), [0048](docs/decisions/0048-quizzes-are-orion.md), [motion page](https://4rk0s4h4.github.io/s4-orion/components/motion/motion.html), [tests](tests/README.md)) |
| 10 | Any app: pages, no auto-focus, palette, states, forms, direct manipulation, charts, six more templates | Built 2026-11-15, awaiting the owner ([0049](docs/decisions/0049-never-focus-a-field.md), [0050](docs/decisions/0050-pages.md), [0051](docs/decisions/0051-ideas-built.md); the long view: [ROADMAP](docs/ROADMAP.md)) |
| 11 | Brand dials, themes on any container, motion energy, the website kit, reach (rtl, print, text size), every dial preset proven | Built 2026-11-16, awaiting the owner ([0055](docs/decisions/0055-brand-dials.md), [0056](docs/decisions/0056-themes-energy-defaults.md), [0057](docs/decisions/0057-website-kit.md), [0058](docs/decisions/0058-reach-and-proven-dials.md)) |
| 12 | Templates as products, their lessons, button groups and tabs, rich inputs, data at scale, desktop anatomy (79 components, 20 templates) | Built 2026-11-21, awaiting the owner ([0059](docs/decisions/0059-button-groups-and-tabs.md), [0060](docs/decisions/0060-lessons-from-the-templates.md), [0061](docs/decisions/0061-data-at-scale.md), [0062](docs/decisions/0062-desktop-anatomy.md), [templates](https://4rk0s4h4.github.io/s4-orion/templates/)) |
| 13 | The eleven calls: brand files, editorial kicker and figure, meter, board, quiet table checkboxes, one label rule, dense maps, calmer selection; calm dialogs, phone cards and docked glass (78 components (81 folders with glass, motion and icons), 20 templates) | Built 2026-11-21, awaiting the owner ([0063](docs/decisions/0063-the-eleven-calls.md), [0064](docs/decisions/0064-calm-dialogs-docked-glass.md), [calm dialogs](https://4rk0s4h4.github.io/s4-orion/explore/calm-dialogs.html), [meter](https://4rk0s4h4.github.io/s4-orion/components/meter/meter.html), [board](https://4rk0s4h4.github.io/s4-orion/components/board/board.html)) |
| 14 | Round 0058: places and focus kept, grid keyboard, silent failures fail, statuses as tints (0065); light site bundle, wide Showcase and hub, quiet danger zones, grabber sheets, firm containers, `scale` and `headings` dials (0066) | Built 2026-11-22, awaiting the owner ([0065](docs/decisions/0065-place-focus-and-silent-failures.md), [0066](docs/decisions/0066-light-sites-wide-showcase-new-dials.md)) |
| 15 | Round 0059: dial values validated (`S4.theme` warns and writes nothing; the checker fails bad values), the grid's header keys said (hint and `aria-description`), 0049 allows a shortcut-opened palette to hold the cursor, checker rules proven on known-bad pages, a Back test (0067); workstream B in 0068 | In progress 2026-11-22 ([0067](docs/decisions/0067-dial-values-header-keys-and-proofs.md)) |

How it fits together, what apps can rely on and how to extend it: [`docs/framework.md`](docs/framework.md).

## Building

Node 20+, no dependencies (`npm test` needs Playwright, see [`tests/README.md`](tests/README.md)).

```sh
npm run build          # tokens -> tokens.css/ts/json, icons -> icons.js, components -> orion.css/orion.js + skill assets
npm run check          # token, contrast and glass-guarantee checks; fails if anything generated is stale (runs in CI)
npm run generate:color # regenerate the default color roles from the seed in tokens/src/color.tokens.json
```

## Credits

See [`LICENSES/`](LICENSES/) and [`NOTICE.md`](NOTICE.md).
