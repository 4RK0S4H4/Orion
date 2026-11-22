# 0071: The design language is called Orion (2026-11-22)

**Status:** the owner's call, 2026-11-22. Built in round 0060, workstream A.

The product was "S4 Orion"; it is now **Orion**, and the skill with it (`orion`, formerly S4 Orion). The owner also renamed
the GitHub repository to `4RK0S4H4/Orion`.

## What changed
- **Prose:** "S4 Orion" became "Orion" in every product name outside the past: docs, READMEs, the hub, page titles, the
  Showcase, templates, labs' visible text, SKILL.md and its references, the generated bundle banners and `package.json`.
  Decision records, `docs/history`, the issue log and CHANGELOG entries before 1.2.0 keep the old name: they are records.
- **The skill:** `skill/s4-orion/` is now `skill/orion/` (every path in the build, tests, scripts and docs follows);
  SKILL.md has `name: orion` and its description reads "Orion (formerly S4 Orion)" and keeps the S4 Orion and S4 Material
  trigger words, so earlier requests still find it. Packaged as `skill/dist/orion.skill`; `s4-orion.skill` is gone.
- **Links:** the repository is `https://github.com/4RK0S4H4/Orion` and Pages is `https://4rk0s4h4.github.io/Orion/`.
  **The old Pages address (`.../s4-orion/`) stops working: GitHub does not redirect Pages after a rename**, so any
  bookmark or link the owner sent earlier needs the new address. The git branch stays `s4-orion` (the publishing flow
  uses it); the remote configuration is the owner's to update.
- **Guard:** `npm run check:words` now bans the phrase "S4 Orion" in the docs, skill, templates, demo, labs, examples,
  tests and the root files, with three exceptions: decisions and history (not scanned), CHANGELOG from 1.1.0 down, the
  skill's description line, and any line that says "formerly S4 Orion".

## What did not change, on purpose
**"s4" stays as a technical namespace.** The `s4-` classes, `--s4-` tokens, `data-s4-*` attributes, `window.S4` and
`S4.theme`, file names such as `orion.css` and `orion.js`, and the `s4-` storage keys are unchanged: renaming them would
break every app already built, and a name is not worth that. The product is Orion; its code says `s4-`. S4 Glass, S4 Flat
and S4 Material (the older skill) are other systems and keep their names.

## Rules bullet (for CLAUDE.md)
- Decision 0071 (the name): the product is **Orion** (formerly S4 Orion); never write "S4 Orion" outside decisions, history, old CHANGELOG entries and the skill's "formerly" line (`npm run check:words` fails it). The skill lives in `skill/orion/` and packages to `skill/dist/orion.skill`. The `s4` prefix (classes, tokens, `data-s4-*`, `S4.*`, `s4-` storage keys) is a technical namespace and never changes. Repo `4RK0S4H4/Orion`, Pages `https://4rk0s4h4.github.io/Orion/` (the old `/s4-orion/` address no longer works); the branch is still `s4-orion`.
