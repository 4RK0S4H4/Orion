# Template identity: brief for every batch (owner's direction, issue 66, 2026-11-17)

The owner: monochrome stays for Orion's own pages (hub, showcase, reference pages, quizzes). **Every template should be
its own thing**: "super unique", a high quality standalone page with S4 Orion as the base, showing "how far this
framework can be customized in all aspects ... focus on making the page fulfill that purpose and see in what ways S4
Orion holds you back or what you would want different. Similar to how other CSS frameworks are super customizable."

You are the designer of a real product, not the author of a neutral starter. Read first: `CLAUDE.md`,
`docs/history/round-0056-brief.md` (its rules, do-not-edit list, notes file and report format all apply),
`docs/decisions/0053-the-app-is-the-app.md`, `0055-brand-dials.md`, `0056-*.md`, `0057-*.md`, the "Make it this app's own"
and "Websites" sections of `skill/s4-orion/SKILL.md`, and `explore/degree-tracker.html` (the one existing example of an
app with its own identity and its own elements).

## For each template in your batch
1. **Decide the product.** A specific, believable product with a name, an audience and a job (not "Dashboard": for
   example a clinic's appointment desk, a vineyard's harvest tracker, a climbing gym's route setter, a record shop's
   stock room). Vary the domains across your batch and avoid finance/bills (the old templates all used it). Write real
   content: names, numbers, dates, copy with a voice. No lorem ipsum, no gray boxes.
2. **Give it a brand through the dials**, set in the template's own `<html>` attributes / one `S4.theme.restore` call:
   accent or tinted mode and variant, gray temperature, page tone, corners, display and text faces, density, motion
   energy, app defaults, icon set, a scoped theme (a dark rail, a branded band) where it suits. Fonts: the bundled
   Inter or system stacks only (`serif`, `rounded`, `mono`, `system` presets or a system font-family); nothing from the
   network. Light and dark must both be designed. The templates in one batch, and across batches, must look clearly
   different from each other and from stock Orion at a glance. Record the product, palette and dial set per template
   in your notes so other batches can avoid repeating them; check the other batches' notes files in
   `docs/history/round-0056/` if they exist.
3. **Go beyond the dials** in the template's own stylesheet: the elements only this product has (0053), a hero moment,
   its own data pictures, illustration made from tokens and shapes, a layout that fits its job at 390, 1280 and 1600.
   Draw them from Orion's rules: tokens only, filled, round, no shadows or outlines, a named motion pattern or none,
   text beside every picture, both color modes, any accent. Every state a real product needs (empty, loading, error
   where it matters).
4. **Do not fork.** Never restyle an Orion component by its class from the template, never edit `orion.css`. Where
   you find you want to, stop and treat it as a lesson: either the system should change (make the change in the
   component or tokens if it is small, general and clearly right, with the suite still green and the stock look of
   Orion's own pages unchanged) or write it down.
5. **Keep what the template is for.** It is still the starting point the skill copies for that kind of app or page:
   keep its archetype, its structure comments and its behaviours (pages, states, forms, undo, placement ladder,
   keyboard). It must pass `node skill/s4-orion/scripts/check.mjs templates/<name>.html`, the production suite, the
   dial presets pass and the reach suite (right-to-left, print, 200% text, long text, forced colors, keyboard).
   If a suite pass assumes a template is stock (for example the dial presets pass setting attributes the template
   already sets), fix the test to respect a template's own brand rather than weakening it, and say so in your notes.
6. **Look at it.** Screenshot at 390 light and dark, 1280 light and dark, and 1600 light. Critique it as a senior
   designer would (first read, hierarchy, rhythm, alignment, dead areas, type), fix, and repeat until you would put it
   in a portfolio. Compare your batch side by side and push apart any two that feel alike.

## Lessons (as important as the pages)
In your notes file, per template: what Orion made easy; what held you back or needed a workaround; and the concrete
change you would make to Orion (a token, a dial or preset, a component variant, a missing component, a rule that is
too strict or too loose). Mark each as "fixed in this branch", "small, do next" or "needs the owner". This list is what
the owner asked for: "use that as a lesson for what to add or change on S4 Orion".

## Practical
- Work only in your worktree and branch; never push; commit after each finished template.
- Other workstreams are changing these right now, so do not edit them: `components/text-field/`, `components/button/`,
  `components/button-group/`, `components/radio/`, `components/checkbox/`, the chat composer component, the onboarding
  step dots, `components/layout/`, `components/table/`, `components/desktop/`, and any template outside your batch.
  If your template needs something from them, work with what is there and note it.
- `npm test` has three parts and takes 10 to 15 minutes: run it once near the end; use targeted runs while working.
- Update `templates/index.html` only for your own templates' names and descriptions.
