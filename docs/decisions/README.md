# Decisions

Every design decision, with what still applies. Read this instead of the forty records; open a record only for its
reasoning. A decision isn't reopened without the owner; a new one gets the next number.

**Status:** **Active** (applies today) · **Refined** (applies, with later records adjusting details) · **Superseded**
(replaced; the newer record wins) · **Not adopted / Abandoned** (explored, dropped) · **History** (a review or a log).

## What applies today, by topic

| Topic | Read |
|---|---|
| Base system: M3 Expressive roles, type, shape, springs, monochrome default, Inter, Title Case | 0001, 0003 |
| Color: neutral base (Crisper grays), any accent color only on accents, fixed status colors | 0043, 0045 |
| Density (comfortable, compact), desktop windows and desktop apps | 0043 |
| Side navigation: rows, hamburger, solid main action | 0043 |
| Floating panels (the former sheets), date picker, controls without halos | 0043 |
| Repo, build, generated files | 0002, 0041 |
| Glass: where it goes (chrome and overlays only, two layers max, solid fallbacks, AA floor) | 0004 |
| Glass: the look (tint 75%, blur 8px, saturate 150%, no shadow) | 0021, 0028, 0035, 0017 |
| Glass: the edge (thin rim top and bottom, glow or shade by lightness, a soft glow 15% of the surface's height, width by screen density, docked bars a hairline) | 0034, 0036, 0037, 0080, 0029, 0064 |
| Items on glass are tints, not solid patches | 0043 (replaces 0015) |
| Motion: pop, drop, slide, rise, shared axis; only transform and opacity | 0022, amended by 0042 (liquid ink) |
| Shape and fill: nothing outlined, small things are pills, no sharp corners, inputs medium-rounded | 0023, 0024, 0025 |
| Button groups (the Ink Track) and tabs (the navigation family): which is which | 0059 |
| FAB: glass tinted with its own color | 0025, 0032 |
| Icons: Solar; menu = hamburger (Line Duotone) | 0007, amended by 0043 |
| Framework: layouts, page widths, templates, new content components | 0041 |

## All records

| # | Decision | Status |
|---|---|---|
| 0001 | Phase 1 audit of S4 Material and the base decisions | Active (motion parts superseded by 0022, glass by 0004/0021) |
| 0002 | Repo structure | Active (templates added in 0041) |
| 0003 | Tokens | Active |
| 0004 | The glass layer: where glass goes and its contrast guarantee | Active (the numbers superseded by 0021 and later) |
| 0005 | Phase 6 review of the demo | History |
| 0006 | Liquid glass, the Material way | Not adopted |
| 0007 | Icon Lab answers (menu = dots) | Active (menu is a hamburger since 0043) |
| 0008 | Owner critique 2026-11-07 | Refined (motion parts superseded by 0022) |
| 0009 | Style Lab: text fields, checkboxes, tabs | Refined by 0023, 0024 (checkboxes are filled circles); tabs amended by 0059 (no tray, the nav indicator) |
| 0010 | Owner critique round 2: pill snackbar, round tabs, sliding nav highlight | Active |
| 0011 | Style Lab 2: notched groups, centered-card phone sheet | Groups superseded by 0026, then 0059; phone sheet superseded by 0043 (floating panels) |
| 0012 | Liquid glass on real pages (WebKit) | Superseded by 0019, then abandoned |
| 0013 | Thin frost line edge, glass without shadow | Edge superseded by 0021+; no shadow active (0017) |
| 0014 | Calmer color through glass | Superseded by 0021 (saturate 150%) |
| 0015 | Items on glass | Superseded by 0043 |
| 0016 | Thinner frost line on bars | Superseded by 0027+ and 0040 |
| 0017 | No shadows anywhere | Active |
| 0018 | Menus emerge from under their button | Superseded by 0022 (menus drop) |
| 0019 | Liquid glass through a mirror | Abandoned |
| 0020 | Orion as its own flat language | Not adopted, except the glass (0021) |
| 0021 | Glass from the playground | Active (numbers refined by 0028, 0035) |
| 0022 | Simpler motion | Active |
| 0023 | Filled and pills; the Orion Showcase demo | Active |
| 0024 | Tray groups, squarer inputs, glass drop-downs | Active (tray groups replaced by 0026, then 0059) |
| 0025 | No sharp corners, glass FAB, eight more components | Active |
| 0026 | Joined Capsule button groups | Superseded by 0059 (the Ink Track); its glass lab part stands |
| 0027 | Glass edge matches the playground | Refined by 0028–0037 |
| 0028 | Owner's glass numbers, edge glow and sheen | Refined by 0034–0037 |
| 0029 | Edge width follows the screen density | Active |
| 0030 | Glow follows the edge light | Refined by 0036, 0037 |
| 0031 | Edge light color from the surface | Active |
| 0032 | Colored FABs at 90% tint | Active |
| 0033 | Top and bottom lit equally | Active |
| 0034 | Edge calibrated to the iOS tab bar | Active (glow strength and depth amended by 0080) |
| 0035 | Owner's tailored glass set; light edge quiz | Active |
| 0036 | Glow inverts into an edge shade on light surfaces | Active (strength and depth amended by 0080) |
| 0037 | Glow / shade flip at OKLCH lightness 0.6 | Active, awaiting the owner's iPhone check (strength and depth amended by 0080) |
| 0038 | Floating bars | Tried and reverted |
| 0039 | Docked glass gets the full edge | Superseded by 0040 |
| 0040 | Docked glass lights only its free edge | Active, awaiting the owner's iPhone check |
| 0041 | Orion as a framework: layouts, templates, content components | Proposed (built, awaiting the owner's review) |
| 0042 | Liquid motion for ink, plain motion for glass | Active (row hover settled in 0044) |
| 0043 | The overhaul: neutral color, density, side navigation, items on glass, floating panels, date picker, desktop apps | Active (accepted in 0044) |
| 0044 | Overhaul accepted; row hover Edges Lean; base palette contrast (control color, placeholders) | Active |
| 0045 | Crisper base grays; any accent color, monochrome is one choice; list dividers between rows | Active |
| 0046 | One motion philosophy: ten named patterns, pattern tokens, `check:motion` | Active (built; owner to look at the motion page) |
| 0047 | The placement ladder: expand in place before a menu, pane, panel or dialog | Active (built; owner to look) |
| 0048 | Orion on every page, quizzes included (reverses "review blue") | Active (built; owner to look) |
| 0049 | Nothing puts the cursor in a text field by itself | Active (owner's rule) |
| 0050 | Pages: going into a thing, with Back, a title and a URL | Active (built; owner to look) |
| 0051 | The eight ideas the owner picked: palette, resizable panes, states, forms, rewards, direct manipulation, charts, six templates | Active (built; owner to look) |
| 0052 | Concentric nested corners (checked), neutral and tinted color modes both first class, glass only on what floats, dragging that survives a real phone | Active (owner's notes; needs the owner's iPhone look for dragging) |
| 0053 | The app is the app: adapt an app by keeping its screens and elements and drawing them in Orion; make the component the app needs. Ring, milestones, month, timeline. Long swipe | Active (approved by the owner 2026-11-16) |
| 0054 | Tool panels: `data-modeless` floating panels leave the page live from 600 wide (filters, inspectors); task panels and dialogs stay modal; phones always modal | Active (owner's call; built) |
| 0055 | Brand dials: corners (soft range), typefaces, gray temperature, page tone; letter spacing tuned for Inter; stronger type; a website kit to come | Active (owner's quiz answers; first dials built) |
| 0056 | Themes on any container (every dial on any element, nesting), motion energy, four app defaults, roomy density | Active (our call, owner can overrule; built in round 0056) |
| 0057 | The website kit: site type, rhythm, sections, five site templates; lighter files for pages | Active (our call, owner can overrule; built in round 0056) |
| 0058 | Reach: right-to-left, print, text size, forced colors, keyboard, the reach suite; the dial presets proven in the suite | Active (our call, owner can overrule; built in round 0056) |
| 0059 | Button groups are the Ink Track (sliding accent ink on a filled track); tabs join the navigation family (no tray, the nav indicator); the rule: swaps the screen = tabs, a value or a view of the same thing = button group, narrowing a collection = chips; the page checker and suite guard it | Active (owner's quiz answers and question; built) |
| 0060 | Lessons from the templates: a seed keeps its own color (variant auto), glass FAB labels proven for every seed, restore with a fixed brand, category colors, geometric and humanist faces, display weight, small API gaps | Active (our call, owner can overrule; built in round 0056) |
| 0061 | Data at scale: virtual data tables (one Tab stop, pinned and resizable columns, column menus, groups, editing in place with Undo), filters and saved views in the address, code blocks with fixed syntax colors, chart ranges | Active (our call, owner can overrule; built in round 0056) |
| 0062 | Desktop anatomy: one list of commands feeds menus, the menu bar, shortcuts, buttons, the palette and a shell's native menu; menu bar, document tabs, tree, source-list rail, inspector, status bar, settings as a view, shell examples | Active (our call, owner can overrule; built in round 0056) |
| 0063 | The eleven calls: brand files (no late paint), `.s4-kicker` and `figure.s4-figure`, the meter, the board, quiet table checkboxes (amends 0044 there), one label rule for FABs and the vibrant toolbar, `data-dense` maps, calmer selection in vivid accents; Inter stays the only bundled face; rename, tab ellipsis and centred wide content kept | Active (our call; the owner handed us the lead 2026-11-21) |
| 0064 | Calm dialogs and docked glass: a dialog only asks a question the app cannot go on without, two or three named answers, never a form; on a phone dialogs and modal panels are a card in the bottom with swipe-down dismissal; scrim 16% light; modal glass 90%; docked bars drop rim and glow for one hairline (replaces 0039/0040, amends 0043) | Active (owner's notes 2026-11-21, issues 67 and 68; built; owner to look on an iPhone) |
| 0065 | Your place and focus are kept (Back restores scroll and focus, board drafts, mod+comma, menu bar Escape; focus never on `<body>`), data tables follow the grid pattern (one header and one body Tab stop), silent failures fail (unknown classes, broken words, parts outside their component), bare tables and rail FABs render right, `.s4-num` right-aligns, statuses are tints, one tonal tool per toolbar, banned-phrase check | Active (our call; the owner handed us the lead 2026-11-21; round 0058 A) |
| 0066 | Light sites and a wide Showcase: a site bundle (`orion.site.min.*`, Latin Inter, size budget), the Showcase and hub for wide windows, quiet danger zones, grabber and following scrim on modal panels, firm corners reach containers, `scale` and `headings` dials, one filled selection per screen | Active (our call, owner can overrule; built in round 0058) |
| 0067 | Dial values are validated (`S4.theme` warns and writes nothing for a value off a dial's list; the page checker fails bad `data-*` dial values), the grid's header keys are said (`aria-description`, a hint line, README), 0049 allows the cursor in a palette or search the person's own shortcut opened, the one-glyph-box rule is proven on known-bad pages, Back is tested on its own | Active (our call, owner can overrule; built in round 0059)
| 0068 | One accent fill per job in a region (Parley, Mallet docs, rails), wide windows get more real content (Tally, Showcase, Parley's wider list), a site icon subset (`icons-site.js`, site budget 150 KB) | Active (our call, owner can overrule; built in round 0059)
| 0069 | A lean app bundle (`orion.core.min.*` plus packs `data`, `commands`, `desktop`, `direct`, `inputs`, `sitekit`; a picker, budgets in check, a computed-style test against the full bundle; 15 templates use it, core 78 KB against 178 KB), focus lands on main when a dialog or palette closes with no opener, Linnea's toolbar Columns button confirmed outside the grid (suite guards it), the grid-keys hint shows on a touch screen after the first key | Active (our call, owner can overrule; built in round 0060)
| 0070 | One accent job per screen (refines 0068): one filled action and one accent selection (the navigation's) at rest, the rail's action steps down by itself, no pressed chip at rest (`data-clearable`), thinner chart columns, a balanced Showcase at 1600, a brand trial (Dosewise) whose lessons fed the skill; the checker warns on a second filled action | Active (our call, owner can overrule; built in round 0060)
| 0071 | The design language is called Orion (formerly S4 Orion): prose, the skill (`skill/orion/`, `orion.skill`) and links renamed, repo `4RK0S4H4/Orion` and Pages `.../Orion/` (the old Pages address stops working); the `s4` prefix stays as a technical namespace; `check:words` bans "S4 Orion" outside records | Active (the owner's call; built in round 0060)
| 0072 | Window controls act like Windows' (full 46-wide cells to the window's top and end edges, so the corner pixel hits Close; firm layer, drawn glyphs, Close error only on hover, Restore when maximized, mirrored in right-to-left; Electron example uses them by default), and nothing wraps mid-motion (the rail keeps its expanded layout while its edge moves; the checker and suite freeze every motion at 25/50/75%) | Active (owner's notes 2026-11-22, issues 69 and 70; built in round 0061)
| 0073 | QA pass 1, rules from the bug hunt (round 0062, issues 73 to 81): every opener closes on Escape with focus on it (suite over every page); one clipboard helper `S4.util.copy` that never rejects and says when it could not (`check:clipboard`, page checker, suite with the clipboard refusing); `S4.util.onLayoutChange` re-measures ink, tabs and nav highlights when `dir` flips; no word split at 320 with 200% text (reach `reflowz`, allow-list: the five truncation places) and no sideways scroll; trailing, meta and status slots wrap and never widen the page (reach `long320`); a control's content never sticks out of its box (page checker lint); a nav tab's hover, focus and pressed layer is the selected highlight's box (owner, 2026-11-22) | Built in round 0062 |
| 0074 | Window controls use the duotone icons (amends 0072): Minimize, Maximize, Restore and Close are the icon names `window-minimize`, `window-maximize`, `window-restore`, `window-close` (Solar Bold Duotone square tiles), written in by `desktop.js` at 24px; the second tone sits at 0.5 on Close's error fill; cells, corner rule, firm layer and the rest of 0072 stay | Active (owner, 2026-11-23, issue 82; built in round 0063) |
| 0075 | Versions, migrations and upgrades: one version from `package.json` (`S4.version`, banners, a `<meta name="orion">` stamp; core.js and the page checker catch a mismatch), `orion.json` in every app, `migrations/<version>.json` (renames, removals, judgment items, fixed issues; 1.1.0 and 1.2.0 backfilled), `check:api` against the last release's API snapshot, immutable `releases/<version>/` for pinned URLs (1.0.0, 1.1.0 backfilled), `skill/orion/scripts/upgrade.mjs` and the skill's "Update to latest Orion" (issue 83) | Active (our design, owner can overrule) |
| 0076 | QA pass 2, rules from the second bug hunt (round 0063, issues 84 to 102): no flow leaves focus on `<body>` (commits, Undo, hidden bars, removed rows, closed tabs, commands; `S4.util.release`); nothing is gesture-only (swipe actions take Tab, Shift+Space starts selecting); Undo restores the original index and several pending Undos stay undoable; numbers are refused with a message, never coerced; a missing page id opens nothing; a dial's listed values are what `S4.theme` accepts; Back and Forward change the screen; the clipboard lint exempts only the helper's own call. Proofs in the suite's `qa2Audit`, `tests/checker.mjs` and `tests/back.mjs`. | our call |
| 0077 | Window control layers sit evenly in the corner (amends 0072, issue 103): every control's hover and press layer is inset 4 on every side, so Close's is as far from the window's top edge as from its end edge; Close's outer corner is the window's corner (`--s4-window-corner`, 8 in a restored Windows shell) minus the inset, the firm 8 where the window is square. `windowAudit` and the stubbed Windows shell prove it (`tests/fixtures/bad-window-inset.html`). | our call |
| 0078 | Selecting several, the desktop way (issue 104): one selection model in `core/select.js` for data and static tables with a select column, multi-select trees and listboxes and select-several lists; click, Shift+click (the range from the anchor, replacing the last one), Ctrl/⌘+click, Ctrl+Shift+click; Shift and Ctrl with the arrows, Home, End and Page keys; Space, Shift+Space, Ctrl/⌘+A (every row the filter shows), Escape; touch unchanged; selection is data (ids) and survives virtual rows, sorting and filtering; a mouse click on a data table row selects it; every change is said. Proofs: the suite's `selectAudit`, `tests/fixtures/bad-select.html`. | Active (our design, owner can overrule) |
| 0079 | Window controls use the line duotone icons (amends 0074, issue 105): `window-minimize`, `window-maximize`, `window-restore`, `window-close` are Solar Line Duotone (`minus`, `full-screen`, `quit-full-screen`, `close`, strokes 1.5 at 24, no tile); the second tone is one token, `--s4-window-control-tone` (0.65), at rest, hover and press (Close's 0.5 is gone); Phosphor keeps its square tiles (no stroke equivalent); cells, corner rule and layer from 0072 and 0077 stand | Active (owner, 2026-11-24, issue 105, lab `review-window-icons`, answer C) |
| 0080 | A softer glow, scaled to the surface (amends 0034, 0036, 0037; issue 106): glow 0.144 and shade 0.168 (60%), reaching 15% of the surface's height (`--s4-glass-glow-ratio`), 3 to 12px; each short component names its least height from its size tokens, `glass.js` measures app-made `.s4-glass`; proofs: `glowAudit` in the page checker and suite, `tests/fixtures/bad-glow.html`. | Active (owner, 2026-11-25, lab `review-glass-glow`, answer A "Softer") |

Round 0061 also fixed two iPhone bugs with no decision of their own (issues 71, 72 in `docs/issues/README.md`; notes `docs/history/round-0061/mobile.md`): a place-holding container rings only for the keyboard (`data-s4-input`), and the nav bar's highlight is a rounded rectangle holding its label again.
