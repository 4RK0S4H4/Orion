# Round 0056: shared brief for the parallel build (2026-11-16)

The owner asked for every area of the Design Review (`explore/design-review.html`, issues 51 to 60 in
`docs/issues/README.md`) to be taken to a solid 10, left the order and the calls to us ("I defer to you in general
for everything"), and asked that building be done by subagents. Eight workstreams run in parallel, each in its own
git worktree and branch; an integrator merges them afterwards.

## Read first (every workstream)
`CLAUDE.md`, `docs/NEXT.md`, `docs/framework.md`, `components/CONVENTIONS.md`, `docs/decisions/0055-brand-dials.md`,
`docs/foundations/*.md`, and the README of any component you touch. Open `explore/design-review.html` in a browser
(or read its text) for the findings behind your workstream.

## Rules for every workstream
- Work only in your own worktree and commit there, on the branch you are on. **Never push. Never touch `main` or `s4-orion`.**
- Commit messages: plain description, no model names or IDs anywhere (commits, code, docs). End each message with
  the line `Claude-Session: https://claude.ai/code/session_0147K3pd1pzoTnTAYkc4cjyB` and no Co-Authored-By line.
- Every rule in CLAUDE.md "Rules that are easy to break" applies. In particular: tokens only (no hex, rgb, raw ms,
  cubic-bezier), `@layer s4.*`, filled never outlined, no shadows, glass only on what floats, only transform and
  opacity animate and only through the ten named motion patterns, no script ever focuses a field, concentric corners,
  both color modes (neutral and tinted), any accent, Title Case labels and sentence case sentences.
- **Brand dials (0055):** the corner of anything you click is `min(calc(var(--_h) / 2), var(--s4-shape-control))`
  (or `var(--s4-shape-control)` / `--s4-shape-chip` where the height is fixed and small), never `corner-full`.
  Fonts only through the typescale tokens. New work must look right with `corners: firm`, `gray: warm`,
  `page: soft`, `display: serif` and in tinted mode, not only at the defaults.
- Before naming any class, attribute, token or `S4.*` function, grep the repo for it. One name per thing.
- A new component is a folder in `components/` following CONVENTIONS.md: CSS, JS only if it behaves, a reference
  page with every variant and state and real content, a README (markup, attributes, when to use and when not, Do /
  Don't, accessibility, tokens), an `@import` in `components/index.css`, an entry in the README groups in
  `scripts/build.mjs`, and coverage in `tests/suite.mjs` for every interaction it gains. Keyboard follows the
  WAI-ARIA pattern. Works with finger, mouse and keyboard; nothing hover-only or drag-only.
- New icons only through `scripts/add-icons.mjs` (all three sets).
- Look at your own work: screenshot every page you add or change at 390 (dark) and 1280 (light), plus 1600 where
  layout matters, with Playwright (`require('playwright')` works anywhere; do not install anything), open the
  screenshots, and fix what a professional designer would not accept (alignment, rhythm, hierarchy, overflow,
  cramped or empty areas). Use `deviceScaleFactor: 1`. Keep screenshots out of the repo.
- Before your final commit: `npm run build` (twice), `npm run check`, `npm test` must all pass in your worktree.
  WebKit is not installed here; the "skipped: webkit" line is expected. Never weaken, skip or delete a check or a
  test to get green; fix the cause.
- **Do not edit** these shared files (the integrator writes them from your notes): `docs/NEXT.md`, `docs/ROADMAP.md`,
  `CHANGELOG.md`, `CLAUDE.md`, `README.md`, `docs/decisions/README.md`, `docs/issues/README.md`, `index.html` (the hub),
  `skill/s4-orion/SKILL.md`, `skill/dist/*`. Generated files are rebuilt by `npm run build`, never edited by hand.
- **Write your notes** to `docs/history/round-0056/<workstream>.md`: what you built (paths), every visible choice you
  made and why (these become a decision record), changelog lines (Added / Changed / Fixed), what the skill should
  tell Claude about it (when to use, when not), hub links to add, what you could not finish or verify, and anything
  you think the owner should look at on a real iPhone or a real desktop.
- Do not start work in another workstream's area. If you need something from one, note it and work around it.
- Final report to the orchestrator: your branch name and last commit hash, the last line of check and of test, a
  short list of what was built, and what is unfinished or unverified. Be exact; do not claim what you did not run.

## Workstreams
| Name | Area |
|---|---|
| `presets-proof` | Prove every brand dial preset in the suite; fix what that finds; issue 58 |
| `reach` | Right-to-left, print, 200% text, long text: built and checked |
| `theming-depth` | Themes on any container (issue 52), motion energy dial, per-app component defaults |
| `website-kit` | Issue 53: site sections, fluid type, section rhythm, site templates |
| `rich-inputs` | Issue 59 inputs: combobox, tag input, upload, time, number, one-time code, rating |
| `data-scale` | Issue 59 data: table at scale, filters and saved views, code block |
| `desktop-anatomy` | Issue 60: menu bar, status bar, document tabs, tree, settings window |
| `hierarchy-wide` | Issues 54 and 56: hierarchy and large-window layout across the showcase and app templates |
