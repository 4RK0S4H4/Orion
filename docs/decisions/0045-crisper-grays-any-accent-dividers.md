# 0045: Crisper base grays; any accent, monochrome is a choice; list dividers (accepted, 2026-11-14)

**Status:** the owner's Palette Review answers and two notes from the same day; built.

## Palette Review answers
| Question | Answer |
|---|---|
| The base grays | **B, Crisper**: pure gray, a white page in light mode, a deeper black in dark mode, clearer steps |
| Empty checkboxes and radios (the 3:1 gray of 0044) | **Keep** |

Built: the neutral roles of the default scheme are set by hand in `scripts/generate-color.mjs` (light: surface
`#ffffff`, containers `#f5f5f5` `#efefef` `#e9e9e9` `#e2e2e2`, text `#171717` / `#454545`; dark: surface `#0e0e0e`,
containers `#181818` `#1e1e1e` `#282828` `#333333`, text `#ededed` / `#bdbdbd`). Both high-contrast modes keep the
generated values. All 83 pairs pass in four modes; `check-glass` now reads the default scheme from the tokens.

## Monochrome is a choice, not the language
The owner: "monochrome is just a choice, it shouldn't be built into the design language as the main … this design
language should be able to be universal with any colors."

- Orion is **any accent color on a neutral base**. The stylesheet still ships with the black-and-white accent (the
  owner's favorite), but docs and the skill no longer call monochrome the default look or forbid a color; the skill
  picks the accent that fits the app.
- **Named accents:** `S4.theme({ seed: 'blue' })`: mono, blue, indigo, violet, pink, red, orange, amber, green, teal
  (`S4.theme.accents`); any hex works as before.
- **Proof:** `scripts/check-accent.mjs` (in `npm run check`) builds the accent roles as the runtime does for 24 hues x
  4 variants plus the named accents, light and dark, and checks text on accent fills (4.5:1) and the accent against
  every neutral surface (3:1). Worst cases today: 4.52:1 and 4.30:1.
- Rule for new work: nothing may be designed so that it only works in black and white. Check a component with at
  least one strong accent as well as mono. [Accent gallery](../../explore/accents.html).

## Fixes from the owner's notes
- **Checkbox flashed a square when unchecked:** the mark lost its mask before it finished fading. The check is now the
  mark's default mask. (The radio's ink shrinks as a disc; checked frame by frame, no square.)
- **List dividers** ([screenshot](../issues/img/2026-11-14-list-dividers-hover.png)): the line ran the full width and
  overhung the rounded hover box. Dividers are now a hairline in the gap between two rows, inset to the rows' content,
  and they fade out beside a row that is hovered, focused, pressed or selected.
