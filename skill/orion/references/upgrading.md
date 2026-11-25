<!-- GENERATED copy of docs/upgrading.md (scripts/build.mjs). Edit the original. -->
# Upgrading an app to a newer Orion

Decision 0075. An app built with Orion knows which version it was written for, every version that changed anything
public has a machine-readable migration, and one script applies them. "Update to latest Orion" in an app's session
means the steps below, with no guesswork.

## What an app keeps

- **A stamp in every page** that loads Orion: `<meta name="orion" content="1.2.0">` (after `<meta charset>`). The
  templates carry it. `core.js` warns in the console, and the page checker fails, when the stamp and the loaded files
  disagree (a half-done upgrade).
- **`orion.json` at the app's root**, written by `node <skill>/scripts/upgrade.mjs <app-dir> --init` when the app is
  started and kept by every upgrade:

```json
{
  "orion": "1.2.0",
  "load": { "files": ["static/orion.core.min.css", "static/orion.core.min.js", "static/icons.js"], "urls": [], "bundle": "lean" },
  "packs": ["data"],
  "pages": ["index.html"],
  "brand": { "seed": "#4c7a2a", "file": "static/brand.css", "dials": { "data-corners": "soft" } },
  "overrides": [ { "what": "Taller rows in the orders table", "where": "app.css", "issue": "https://github.com/4RK0S4H4/Orion/issues/123" } ],
  "ignore": ["dist"]
}
```

  `load` says how Orion arrives: vendored `files` (paths in the app) or `urls`, which always name an exact release
  (`https://4rk0s4h4.github.io/Orion/releases/1.2.0/orion.core.min.css`), never a moving address. `overrides` lists the
  app's own workarounds for Orion defects, each with its issue (written by hand when the workaround is added; the
  stylesheet comment says the same: `/* Orion issue #123: ... */`). `ignore` lists folders the upgrade must not touch
  (build output).

## Update to latest Orion (the app session's steps)

1. **Get the latest Orion.** If the repo `4RK0S4H4/Orion` is attached, `git pull` it and use it as the source
   (`--source <repo>`). Otherwise download the latest skill and use the unpacked folder as the source, even when an
   older skill is installed:
   `curl -L -o orion.skill https://github.com/4RK0S4H4/Orion/raw/main/skill/dist/orion.skill && unzip -o orion.skill -d /tmp/orion-latest`
   (source `/tmp/orion-latest/orion`). Its `migrations/releases.json` lists the published releases.
2. **Read `orion.json`** (and `orion-upgrade.md` from the last upgrade, if any). No `orion.json`: the script finds the
   version from the stamps, the banners of vendored files or release URLs; an app with none of them counts as 1.0.0
   and the report says so.
3. **Dry run:** `node <source>/scripts/upgrade.mjs <app-dir> --source <source>` (in a repo checkout the script is
   `skill/orion/scripts/upgrade.mjs`). Read the plan: the files it will replace, every rename, anything blocked.
4. **Apply:** the same with `--write`. It replaces vendored files, pins URLs, applies the renames by context, links
   packs a lean page now needs, regenerates the brand file, updates the stamps and `orion.json`, writes
   `orion-upgrade.md` and runs the page checker when Playwright is installed.
5. **Work through the judgment items** in `orion-upgrade.md`: each names its decision and the places in the app it
   concerns. Tick each off. Changed rules whose search found nothing in the app share one line at the end of the list:
   glance at the screens for them. Try removing each workaround whose issue the report says is fixed; keep it if the checker
   or the screens disagree.
6. **Check:** `node <source>/scripts/check.mjs` on every page, then look at the screens at 390 and 1280, light and dark.
7. **Commit** ("Update to Orion 1.2.0"), and log any Orion defect found on the way (SKILL.md, "Found a problem in
   Orion?"): a `from-app` issue, never a patch to Orion's files.

**A major version** (`"major": true` in its migration) changes how things should look. After the mechanical part,
redraw each screen in the new rules from the new templates and references, and keep every screen and element the app
has (decision 0053, the app is the app): a chart stays a chart, a custom element is redrawn from Orion's rules, nothing
is swapped for the nearest stock component.

## What the script guarantees

- **Dry run by default**; `--write` changes files. `--to <version>` stops at an earlier version (vendored files come
  from `releases/<version>/` in a repo checkout).
- **Token-aware, not search and replace:** a class is renamed only inside `class=""`, in selectors and as a whole word
  in JavaScript strings; a token only as a whole `--name`; an attribute only as an attribute; a value only on its
  attribute; an `S4.*` name only whole. `s4-chip-set` is not `s4-chip`, and a word in a paragraph is never a class.
- **Removals are never guessed:** each one is listed with every place it occurs and what to do instead.
- **URLs pin to an exact release.** When the target version has no published release yet, URLs are left alone and the
  report says so (use `--to` with the latest release, or vendor the files).
- **Workarounds are never edited.** Those whose issue is fixed in between are listed as "may now be unnecessary".

## Migration files (for Orion's own sessions)

`migrations/<version>.json`, one per version that changed anything public, copied into the skill by the build:

```json
{
  "version": "2.0.0", "from": "1.2.0", "date": "2027-01-10", "major": true,
  "summary": "One paragraph: what changed and why.",
  "renames": [
    { "kind": "class", "from": "s4-old", "to": "s4-new", "decision": "0080" },
    { "kind": "value", "from": "data-variant=outlined", "to": "data-variant=tonal" },
    { "kind": "api", "from": "S4.transition.drop", "to": "S4.transition.follow", "alias": true }
  ],
  "removals": [ { "kind": "token", "name": "--s4-old", "what": "what to use instead", "decision": "0080" } ],
  "judgment": [ { "id": "2.0.0-x", "decision": "0080", "title": "Short title", "what": "What to review and how", "find": { "classes": [], "attrs": [], "text": ["regex"] } } ],
  "fixed": [84, 85]
}
```

Kinds: `class`, `token`, `attr`, `value` (`data-x=v`), `api`, `event`, `icon`, `file` (a shipped file's name), `pack`,
`skill`, `url` (a prefix). `fixed` lists the issue numbers fixed in that version, so the script can point at
workarounds that may go.

**The policy** (`docs/framework.md`, Versioning): an old name keeps working as an alias for at least one minor version
and is listed as a rename with `"alias": true`; every removal of a public name needs a migration entry.
`npm run check` (`scripts/check-api.mjs`) compares the public API (`components/api.json`, written by the build from
`scripts/api.mjs`) with the last release's snapshot and fails when a name is gone without an entry, when a rename points
at a name that does not exist, or when a released file changed.

## Releases

`node scripts/release.mjs` (after the CHANGELOG entry is dated) copies the shipped files of the current version into
`releases/<version>/` with its API snapshot and records their SHA-1 in `releases/index.json`; then `npm run build` and
re-package the skill. Releases are immutable and kept forever, so a pinned URL never breaks. Git tags are not needed.
