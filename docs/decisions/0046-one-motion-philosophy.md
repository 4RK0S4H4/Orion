# 0046: One motion philosophy, ten named patterns, a check (2026-11-14)

**Status:** built; awaiting the owner's look at the [motion page](../../components/motion/motion.html). Issue 40.

## Why
Motion had grown decision by decision (0001, 0018, 0022, 0042, 0044). An audit found 63 transitions and animations in
the stylesheets and 20 in scripts, using 15 springs picked one at a time: the nav bar's pill and the rail's pill moved
on different springs, the FAB and the buttons morphed at different speeds, five components animated by hand in script.

## Decision
1. **One page:** [`docs/foundations/motion.md`](../foundations/motion.md) holds the philosophy (six sentences) and the
   only patterns allowed.
2. **Ten named patterns in four families.** In place: **State, Ink, Morph, Bend**. Appear: **Reveal, Follow, Pop,
   Rise**. Change view: **Switch**. Wait: **Loop**.
3. **Pattern tokens:** `--s4-motion-state | ink | ink-calm | morph | morph-calm | bend | reveal-content | loop` (a duration and easing pair, defined once in `components/motion/motion.css`). In script, `S4.transition.reveal
   | follow | pop | scrim | rise | tip | sharedAxis | enter | move | fade`.
4. **Every component is on a pattern.** Components no longer name a spring or call `element.animate()`.
5. **A check:** `npm run check:motion` (part of `npm run check`) rejects any transition or animation that is not a
   pattern token used for a property that pattern allows, any repeating animation that is not a Loop, and any script
   that animates by hand. It also fails if a pattern is missing from the motion page's doc.

## What visibly changed (all small)
| Thing | Before | Now |
|---|---|---|
| Nav bar pill and tab indicator | `spatial` spring, 260ms | Ink, 250ms (same as the rail's pill) |
| Switch handle | `fast-spatial`, 220ms | Ink, 250ms |
| FAB extending | `spatial`, 260ms | Morph, 220ms (same as buttons) |
| Progress fills | 260ms | Ink calm, 200ms |
| Rows after a table sort | 260ms | Morph calm, 220ms |
| A new chat message | 10px on `spatial` | Rise (14px, like a snackbar) |
| Next month in the date picker | fade + 8px on effects | Switch (8px, movement on the spatial spring) |

Nothing else changed its look: accordion, menus, dialogs, snackbars, tooltips, row hover, radio, checkbox, skeleton
and loading are the patterns the owner already picked in 0042 and 0044, now named.

## Kept from earlier decisions
0022's sturdiness (surfaces that appear only move and fade; one transition per element; nothing cloned) and 0042's
split (liquid for ink, plain for glass) are now sentences 3 and 6 of the philosophy. Reveal is the one pattern that
sizes a box, and only the box being opened.

## API
New: `S4.transition.reveal`, `follow` (was `drop`), `scrim`, `enter`, `move`. `drop`, `slide` (now pops: nothing slides
from an edge since 0043), `containerTransform` and `unfold` remain as old names.
