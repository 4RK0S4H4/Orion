# 0075: Versions, migrations and "update to latest Orion" (2026-11-23)

**Status:** active (issue 83, the owner's request; our design, the owner can overrule).

The owner: "I want this design language to be easily used to update apps to the latest version. make sure this repo and
skill makes that possible, maybe versioning, idk, you can figure it out. like if I make an app using orion 2.0, but then I
make some big changes and improvements in Orion 3.0, I should just be able to say to that app's session 'update to latest
Orion' and it can do it."

Before this, an app did not know which Orion it was built with (the runtime said 1.0.0 while the stylesheet said 1.1.0
and the CHANGELOG 1.2.0), nothing listed what changed in a machine-readable way, and a URL to Orion always pointed at the
moving files on Pages (the old `/s4-orion/` address now answers nothing).

**What we do now:**

1. **One version, everywhere.** `package.json` is the source (1.2.0, unreleased, as the CHANGELOG says). The build writes
   it into `S4.version` (core.js), every banner, the tokens and a `<meta name="orion" content="1.2.0">` stamp in every
   template, example and the Showcase. `core.js` warns when a page's stamp differs from the loaded files, and the page
   checker fails that warning (`tests/fixtures/bad-stamp.html`).
2. **The app keeps `orion.json`**: the version, how Orion is loaded (vendored files or pinned URLs, lean, site or full),
   the packs, the brand (seed, brand file, dials), the pages, its own workarounds with their issue (`overrides`) and
   folders to leave alone. `upgrade.mjs --init` writes it when the skill starts an app; every upgrade keeps it.
3. **Migrations are data.** `migrations/<version>.json` for every version that changed anything public: mechanical
   renames and removals (class, token, attribute, attribute value, `S4.*`, event, icon, file, pack, skill, URL prefix),
   judgment items (a rule or behaviour to review, with its decision and where to look) and the issues fixed. Backfilled:
   1.1.0 (the public API only grew; sixteen review items from decisions 0023 and 0043 to 0065) and 1.2.0 (the skill and
   address renames of 0071, the deprecated motion names `drop`, `unfold`, `slide` renamed, `containerTransform` and nine
   review items). The human guide is `docs/upgrading.md`, copied into the skill as `references/upgrading.md`.
4. **A migration can't be forgotten.** `scripts/api.mjs` reads the public API (documented classes the stylesheet
   defines, every token, documented attributes and their styled values plus every dial value, documented `S4.*` names
   the runtime defines, events, icons, shipped files, packs, the skill's name) off any tree or git ref; the build writes
   `components/api.json`. `npm run check:api` compares what the code answers to with the last release's snapshot and
   fails a name gone without a migration entry, a rename to a missing name, and any change to a released file.
5. **Releases you can pin.** `scripts/release.mjs` copies a version's shipped files (minified bundles, packs, icons,
   fonts, `packs.json`; the unminified bundle only for 1.0.0, which had nothing else) and its `api.json` into
   `releases/<version>/` with SHA-1s in `releases/index.json`. Immutable and kept forever; Pages serves them at
   `https://4rk0s4h4.github.io/Orion/releases/<version>/<file>`. 1.0.0 and 1.1.0 are backfilled from their tags; 1.2.0 is
   cut when its CHANGELOG entry is dated. Nothing depends on git tags.
6. **One script upgrades.** `skill/orion/scripts/upgrade.mjs <app-dir> [--to] [--write]`, dry run by default: finds the
   version (orion.json, stamps, banners, release URLs; the oldest wins; none counts as 1.0.0 and is reported), replaces
   vendored files, regenerates brand files, pins URLs to an exact release (never "latest"; an unreleased target leaves
   them and says so), applies the renames by context (a class only in `class=""`, selectors and whole words in JS
   strings; a token whole; an attribute only as one; an `S4.*` name whole and never in prose), links packs a lean page
   now needs, lists removals and judgment items with their places, lists workarounds whose issue is fixed (never edits
   them), updates stamps and `orion.json`, writes `orion-upgrade.md` and runs the page checker.
7. **The skill** says "update to latest Orion" in its description and has a short section: get the latest Orion first
   (the attached repo, else the skill package from `raw/main`), read `orion.json`, dry run, `--write`, the judgment
   items, the checker and the screens at 390 and 1280, commit, log Orion defects. A major version (`"major": true`)
   means redraw in the new rules and keep every screen and element (0053).
8. **The policy** (framework.md, Versioning): an old name stays as an alias for at least one minor version and is
   listed as a rename with `"alias": true`; every removal or rename of a public name needs a migration entry.

**Proof:** `npm run test:upgrade` (a 1.0.0 fixture app with the real 1.0.0 files upgraded to 1.2.0: exact renames and
nothing else, files replaced, stamp, orion.json, report, checker clean, a second run a no-op; a synthetic 3.0.0 major
turning `app-2` into `app-2.expected` byte for byte; no-version and unreleased-URL cases; check-api's failures), in CI's
pages job; `npm run test:checker` proves the stamp rule.
