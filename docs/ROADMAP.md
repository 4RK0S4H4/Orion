# Where S4 Orion is going

The long view (written 2026-11-15). [`NEXT.md`](NEXT.md) says what to do next session; this says **why, in what order,
and what Orion will not become**. Change it only with the owner.

## What Orion is

**A framework for any app, in one recognisable language.** Three things together:

1. **A look:** any accent color on a neutral base (or, when an app asks for it, the fully tinted M3 Expressive mode), filled and round, concentric corners, glass only on what floats, one motion philosophy.
2. **A set of behaviours:** where new things open (the placement ladder), how you go into a thing and back (pages),
   how lists, forms, charts and loading behave. The behaviours are as much "Orion" as the colors are.
3. **A skill** that applies both the same way every time, plus checks that fail when something drifts.

The owner's bar (2026-11-14): "make this framework for any app at all and super detailed", "polished, zero bugs,
ready for production", looking good on a phone and on a desktop.

## What it will not become

- **Not a clone of Material.** M3 is the foundation for roles and scales; the language on top is Orion's own.
- **Not a kit of parts without opinions.** Every component says when to use it and when not to. If two things can do
  one job, one of them goes.
- **Not a dependency tree.** One stylesheet, one script, no build step for apps. Playwright is the only tool, for tests.
- **Not decorated.** No shadows, no outlines, no confetti, no motion without a reason.

## The principles that settle arguments

When two good ideas conflict, the earlier line wins.

1. **It works with a finger, a mouse and a keyboard.** Nothing is hover-only, drag-only or shortcut-only.
2. **The person is never interrupted.** No dialog for what can be undone, no keyboard popping up, no cursor moved for
   you, no page jumping.
3. **Things open where you asked for them;** you go *into* a thing only when it deserves the whole screen.
4. **One way to do each thing,** the same in every app. A new component must name the pattern it uses.
5. **Proof over taste.** Contrast, glass, accents, motion and behaviour are checked by a machine on every push.
6. **Any accent, any app.** Nothing may depend on black and white, on one kind of content, or on one screen size.
7. **The app is the app** (0053). Orion is a language, not a kit of parts: an app keeps its own screens and elements, and Orion grows the component the app needs. The app is never bent to fit what is on the shelf.

## Where it stands (2026-11-15)

| Layer | State |
|---|---|
| Tokens, color, type, shape, glass | Settled (0003 to 0045). Open only: the owner's iPhone looks for 0037, 0040. |
| Motion | Settled: ten patterns, enforced (0046). |
| Places | Settled in principle: views, pages (0050), the placement ladder (0047). Tool panels (0054) settle modal versus live. |
| Components | 61. The app-level set is there (palette, states, forms, direct manipulation, charts); the first four made for a real app (ring, milestones, month, timeline; 0053). |
| Templates | 15 app archetypes. |
| Proof | `npm run check` (tokens, glass, accents, motion, stale output) and `npm test` (every page used like a person, Chromium and WebKit, in CI). |
| Skill | Packaged; needs its evals re-run against the new components. |

## The next three horizons

### Horizon 1: 1.2, "ready to build real apps with" (now)
The goal is that the owner can ask for any app and get something they would ship.
1. **The owner's looks** on a real iPhone and a real desktop for everything since 0037. Device-only bugs get fixed first.
2. **Build real apps end to end with the skill.** First: a mockup of the owner's WGU degree tracker (tinted mode), then one desktop app, and fix everything the skill gets
   wrong or has to invent. This is the real test of "any app"; the templates are not.
3. **Skill evals** re-run and extended to the new pieces (pages, expand, states, forms, charts, direct manipulation).
4. **Reach:** right-to-left, long text, 200% text size and print, as suite checks rather than promises.
5. **Icons for writing tools** (bold, italic, headings, lists, link): the editor borrows unrelated icons today.
6. **Release 1.2:** changelog date, tag, the skill re-packaged, the owner re-downloads it.

### Horizon 2: 1.3, "a desktop and data citizen"
1. **Non-modal floating panels** (write a message while reading another), if the owner wants them.
2. **A menu bar pattern** and a real Electron or Tauri shell example wired to `data-window`.
3. **Data at scale:** a table with column resize, pinned columns and row virtualisation; filters and saved views;
   charts with a time range control.
4. **Rich inputs:** combobox with search, tag input, file drop, time and date-time, a color field.
5. **Minified bundles** and per-set icon files, so an app ships only what it uses.

### Horizon 3: 2.0, "a language others could use"
1. **Prune:** remove the old aliases (motion names, sheet names, `outlined`), one name per thing.
2. **Idea A** (touched things turn into glass) decided one way or the other in a lab.
3. **Theming beyond accent:** density, corner and type presets as documented, checked sets.
4. **A docs site built in Orion** from the READMEs, replacing the reference pages.
5. A written **contribution contract**: what a new component must bring (README, reference page, pattern, suite coverage).

## How work is chosen

- Owner critiques come first, always as numbered issues with their screenshot.
- Then anything a machine check or a real app build found.
- Then the current horizon, in order. A later horizon is not started while an earlier one has open items the owner
  cares about.
- Every visible choice goes through a quiz in the Orion quiz UI; every answer becomes a numbered decision.

## Standing risks

| Risk | Guard |
|---|---|
| The system grows faster than it stays consistent | Every component names its motion pattern and its place on the ladder; `check:motion`; one name per concept (three clashes were caught on 2026-11-15: `s4-page`, `s4-page-header`, `data-expand`) |
| Looks right in Chromium, wrong on the owner's iPhone | WebKit in CI; the owner's device look before every release |
| The skill drifts from the repo | References are generated from the READMEs; templates are copied by the build |
| "Zero bugs" claimed, not proven | The suite only proves what it exercises: when a component gains an interaction, the suite learns it |
