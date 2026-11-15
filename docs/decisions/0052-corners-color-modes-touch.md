# 0052: Concentric corners, two color modes, glass only on what floats, dragging on a real phone (2026-11-15)

**Status:** the owner's notes after trying 0051 on an iPhone; built.

## 1. Nested corners are concentric (issue 45)
The owner: "For the command palette make the search bar round so it fits with the corners of the command palette.
Make sure similar visual issues don't occur throughout the design language."

**Rule:** a rounded thing that sits tight in the corner of a rounded container is concentric with it:
**inner radius = outer radius minus the gap** (or it is a full pill). A squarer corner inside a rounder one is a bug.
- The palette's search box and rows use `calc(var(--s4-shape-dialog) - var(--s4-space-2))`.
- **Checked on every page:** the production suite measures every filled, rounded element that sits within 14px of a
  rounded container's corner (at rest, and inside every open dialog, menu and the palette) and fails on a mismatch.
  A child flush against a container that clips it is fine (the container's corner is the one you see).

## 2. Two color modes, both first class (owner, 2026-11-15)
"I know I said I want standard colors for light and dark mode with accent colors only as an accent, but I'd say make
it compatible with both. Keep what we have, but if I say so we can do the M3E way of making everything color themed."

| Mode | What it is | How |
|---|---|---|
| **Neutral** (the default, 0043 and 0045) | white or near-black surfaces; the color is an accent | `S4.theme({ seed })` |
| **Tinted** (M3 Expressive dynamic color) | every surface, container and text role takes the color | `S4.theme({ seed, surfaces: 'tinted' })` |

Tinted uses M3's calm "tonal" scheme unless the app names a variant (a whole screen in the vivid accent variant
is tiring; found by building the degree tracker mockup), and fixed neutral grays such as the empty checkbox take the
scheme's outline color.

Neither replaces the other. An app says which it is; an app that is already color themed (the WGU degree tracker)
stays tinted. Everything must work in both: `check-glass` already proves glass contrast with tinted surfaces, the
reference pages have a Surfaces control, and the showcase has "Color The Whole App" in Settings.

## 3. Glass is for what floats; what sits in the page is solid
The owner on the editor's formatting toolbar: "I wouldn't think that toolbar would be glass, I'd figure it would
just be a button group." Agreed, and it follows from 0004: glass belongs to chrome that floats over content.
- A toolbar that sits in the flow with the content it edits is a **joined button group** (solid), with words when
  the icon set has no clear icon for the action.
- `.s4-toolbar` (glass) stays for toolbars that float over content (a selection toolbar over a canvas, a docked bar).

## 4. Dragging on a real phone (issue 46)
The owner, on an iPhone: "Swipe a row is very glitchy for me, along with reordering items."
Two real causes, neither visible in desktop testing:
- **Reorder** moved the dragged element in the page while the finger was down. On iOS a touch ends when its element
  is re-inserted, so the drag kept cancelling. Now the item is lifted out of the flow where it is (never re-inserted
  mid-touch); an empty stand-in holds its place and travels through the lists; the item joins it on release. Rows are
  judged by where they are going, not where their glide is, so the slot cannot flicker. The page cannot scroll under
  a drag that has begun.
- **Swipe** settled with an animation that ended at "closed" and then snapped open. It now animates from where the
  finger left it to where it rests (`S4.transition.shift`), and the actions stay uncovered until the row has closed.

**Rule for anything dragged:** never re-insert the element being touched; never animate it while the finger is down;
settle with a Morph when the finger lifts.
**Honest limit:** this is tested with simulated touches in Chromium and by WebKit page loads in CI. Only the owner's
iPhone proves it; ask for that look.

## 5. First real-app test: the degree tracker mockup
[`explore/degree-tracker.html`](../../explore/degree-tracker.html): the owner's degree tracker rebuilt in Orion, tinted,
with the stage switching the whole app's color (teal, then navy). Invented sample data only: the real app's repo is
private and this site is public. Built only from Orion components plus about 30 lines of its own layout. What it
found and fixed in the system: tinted mode was far too vivid; empty controls stayed gray in tinted mode.
What it shows is still missing: a progress ring and a segmented "road" track had to be hand-drawn (candidates for
components), and there is no status pill tone for "on pace / at risk".
