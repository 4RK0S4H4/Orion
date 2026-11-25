# 0081: Budgets hold real requests, with headroom; apps load an icon pack; S4.theme never fails silently (2026-11-25)

**Status:** taken under the owner's handover (round 0066 workstream A, review 5's N1, N3, N8, N9 and N12; issues 107 to 110).
Amends [0066](0066-light-sites-wide-showcase-new-dials.md) and [0069](0069-lean-app-bundle-and-focus-landing.md) (what the budgets measure, what an app loads for icons) and [0067](0067-dial-values-header-keys-and-proofs.md) / [0076](0076-qa-pass-2-rules-from-the-second-bug-hunt.md) (6) (what `S4.theme` accepts).

Review 5 found the one claim it could not confirm: the budgets said 150 KB for a site while landing transferred 232 KB, because the
font was fetched twice (a preload with `?v=` and a `@font-face` without it). It also found no room left in any budget, every app loading
all three icon sets (103 KB, the largest script on the page), and `S4.theme` dropping `density`, bad seeds, a bad `surfaces` and unknown
keys without a word.

**Rules from now on:**
1. **One request per file, proven on the network.** A page fetches each file once. The build stamps the `@font-face` url in every repo
   bundle with the font's content hash, the same `?v=` the preload carries (a changed font changes the stylesheet, so caching stays right).
   `tests/network.mjs` (`npm run test:network`, in `npm test` and CI) loads every template, the Showcase, the hub and the brand trial from a
   gzipping server and fails on a file fetched twice, a failed request, or Orion files over the page kind's budget. A budget is a claim
   about what a page transfers, not only about files on disk.
2. **Budgets live in `scripts/budgets.mjs` and keep headroom.** The build and the network test read the same numbers. A budget is never
   raised to fit; when the built size comes within 5% of one, win room back first (minifier, dead or duplicated code, what a pack carries).
   Round 0066 left: site 141.2 of 150, core 42.2 + 37.7 of 44/40, lean pages at most 162 of 170, the full bundle 180 of 190.
3. **Apps load the app icon pack.** A lean page loads `icons-app.js` (the icons the app templates and the lean bundle's scripts draw; any
   other name fetches `icons-solar.js` once, and icons an app added stay) or one set's file; `icons.js` (every set) only when the page
   switches sets at run time. `scripts/packs.mjs` names the file, and the build and the page checker fail a lean page that loads `icons.js`
   without switching (`tests/fixtures/bad-icons.html`); `test:lean` compares every drawn icon with `icons.js` and fails a fetch of the full
   set at load. A script that draws an icon names it whole (`'window-close'`, not `'window-' + action`), so the pack finds it.
4. **`S4.theme` never fails silently.** Every dial in `S4.theme.dials` is a key of `S4.theme` (`density` and the app defaults `buttons`,
   `cards`, `lists`, `rail` joined), `S4.theme.keys` names each key and the attribute it writes, and a value off a list, a seed that is not
   `#rrggbb` or an accent name, and an unknown key each warn with what is expected and write nothing (on a container, `contrast` and `save`
   say they are page-wide). `tests/checker.mjs` drives every key with every listed value and the bad cases.

**Also in the round, no new rule:** icon paths at three decimals and `icons.js` without its duplicate copy of the active set; the site font
zeroes variation rows only unkept glyphs reach (and reads pair-set device offsets from the pair set, as OpenType says); the minifier drops
the spaces no token needs and joins lines that cannot end a statement (the full bundle parses to its source's syntax tree); the upgrade
report lists only the review items that matched and puts the rest on one line; `check:words` reads component pages, READMEs, templates
and the Showcase and bans a variant list that names "outlined".
