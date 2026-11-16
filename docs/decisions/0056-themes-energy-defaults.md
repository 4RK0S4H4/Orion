# 0056: Themes on any container, motion energy, app defaults, roomy density (2026-11-16)

**Status:** built in round 0056. The owner left the calls to us on 2026-11-16 ("I trust your judgement") and can
overrule any of them. Notes: [`docs/history/round-0056/theming-depth.md`](../history/round-0056/theming-depth.md).

## The question
0055 gave an app its own dials, but only on `<html>`: a dark sidebar in a light app, a branded band or a preview of
another brand was not possible (issue 52). Motion had one character, every app got the same unmarked variants, and a
content site had no roomier spacing.

## The answers
| Question | Answer |
|---|---|
| Where can a dial be set | **On any element**, and it nests; the nearest one wins |
| Which dials | `data-theme` (light, dark), `data-gray`, `data-page`, `data-corners`, `data-type-display`, `data-type-text`, `data-accent` (+ `data-accent-variant`, `data-surfaces`), `data-energy` |
| What stays page-wide | Contrast, reduced motion and reduced transparency: they reach into every scope |
| Motion character | **One dial, three steps**: `data-energy="calm|standard|lively"`, same ten patterns |
| Per-app defaults | **Four**, each only picks which existing variant is unmarked: `data-buttons="tonal"`, `data-cards="filled"`, `data-lists="segmented"`, `data-rail="expanded|collapsed|auto"` |
| Roomier spacing | `data-density="roomy"` for content sites only |

## The rule
- A scoped theme is for a region: a contrasting sidebar or nav, a branded band, a preview. Never to restyle one
  component. Prefer the attribute in markup; `S4.theme(options, element)` sets it at runtime (nothing saved; `null`
  follows the page again; a default value such as `round` or `inter` brings stock Orion back inside a branded page).
- A scoped element paints its own surface and text, sets `color-scheme`, and glass inside it is made from its surfaces.
  `npm run check:scopes` proves every scope gets exactly the page-wide values of its mode, so the 83 proven pairs hold.
- Dark is a screen scheme in scopes too: a dark container prints light (0058).
- Energy: calm for tools and dense data (critically damped, travel x0.6), lively for playful consumer apps (overshoot on
  Ink, Morph, Bend, Pop and Rise only, at most 7%; Pop and Rise travel x1.25). Never per component. All energy springs
  are 0ms under reduced motion. `check:motion` enforces this.
- App defaults are set once on `<html>`. The one main action still names `data-variant="filled"`. Not added: chip style,
  dialog vs panel, top bar style (no real variant, or a placement decision rather than a look).
- `data-rail` is where a rail with no choice of its own starts. A rail that writes `data-expand` keeps its own choice;
  the templates no longer write one, so the app default applies there.
- Roomy: margins 40, gaps 24, pane gap 40, reading column 760, body text 18/28; controls keep their size. Site section
  rhythm grows with it (0057). Never for app screens.

## Limits
- Scoped gray, scoped accents and the scoped page tone need `@scope` and `light-dark()` (Safari 17.5+, recent Chrome);
  on older browsers they do nothing. Scoped light/dark, corners, faces and energy do not need them.
- One scoped accent nests cleanly; two nested accents: the later-written one wins inside both.
- `data-page` is also the name a `.s4-subpage` uses; only the value `soft` is a dial, so a subpage must not be called "soft".
