# 0044: Overhaul accepted; row hover "Edges Lean"; base palette contrast (2026-11-14)

**Status:** the first two parts are the owner's answers (accepted). The palette fixes are built on the owner's request
("look at the base light mode and dark mode colors and make sure contrast is not an issue, and that it looks nice in
general"); the taste question is open in the [Palette Review](../../explore/review-palette.html).

## Overhaul Review answers (accepts 0043)

| Question | Answer |
|---|---|
| Color with an accent | **A**, neutral surfaces |
| Size on a computer | **A**, compact with a mouse, opt-in (`data-density`); not the default |
| Selected chips | **A**, accent fill |
| Floating panels, side navigation, things on glass, error fields, controls, date picker, desktop template | **Keep** (all seven) |

## Liquid Motion Lab 2, answered again on a computer (closes 0042)

Row hover: **C, Edges Lean**. Radio, menu, speed and "liquid for ink, plain for glass" as already built.

Built: each interactive list row has its own hover box; nothing travels between rows. The box arrives slightly small
(scale 0.985 x 0.84) and its edges flow out on the `ink` spring. The edge nearest where the pointer came from arrives
first: `list.js` sets `--_lean` (0% from above, 100% from below), which is the box's transform origin. Transform and
opacity only (the lab animated the box's insets; the system version does the same thing with scale).

## Base palette: what was checked and fixed

Every text pair already passed (78 pairs in four modes). The gaps were in things the pair list didn't cover:

| Found | Was | Now |
|---|---|---|
| Empty checkbox and radio against their surface | about 1.2:1 light, 1.4:1 dark (nearly invisible in light mode) | `--s4-color-control`, 3:1 or better on every surface a control sits on, in the token check |
| Placeholder text on a field | 3.5:1 light (70% opacity) | 85% opacity: 4.9:1 light, 5.6:1 dark |
| Disabled empty controls | same as enabled | faded like other disabled content |

Not changed, on purpose: the slider's and progress bar's inactive track (about 1.3:1 light) is decoration around a
handle and an active track that carry the meaning; surface steps (page to pane about 1.05:1) are a look question, so
they are in the review as "Crisper" and "Crisper and Cool" beside today's grays.
