# Round 0061, mobile fixes (branch `round61/mobile`)

Two phone bugs the owner sent from an iPhone (Safari) on 2026-11-22. Both reproduced in Playwright Chromium at 390
(WebKit could not be installed here: the download is blocked, so iOS's behaviour was replayed by hand, see below).
Screenshots at 390 dark and 390 light, before and after, were taken and looked at for both.

## Issue 71: a border round the whole screen (Dosewise and others)

Image: `docs/issues/img/2026-11-22-mobile-region-border.jpg`. "I notice this weird border on some apps on mobile": a
3px accent rectangle round the content region, under the top bar and above the nav bar.

**Cause.** The focus ring of the view itself. When a nav item switches views, `app.js` moves focus to the new
`.s4-view` (tabindex -1, decision 0065) if focus was on `<body>` or in the old view. On an iPhone (and in Safari on a
Mac) a tap or click never focuses a link or button, so focus is always on `<body>` and the view always takes it. WebKit
then counts that script focus as `:focus-visible`, so `base.css`'s ring drew round the whole screen. The guard that was
meant to stop this (`.s4-view:focus:not(:focus-visible)` and `main[tabindex="-1"]:focus:not(:focus-visible)` in
`app.css`) only works in Chromium, which does not match `:focus-visible` there after a click. The same happened after
closing a palette or dialog with nothing to give focus back to (`S4.util.land()` focusing main, round 0060), and on
Back to a view. Not a `:focus` rule: every ring in Orion is on `:focus-visible`.

Reproduced in Chromium by replaying the iPhone tap (a click that moves no focus): before, 39 rings on place-holders
across the 21 templates, the Showcase and the two examples (load, three view switches, a page and Back, a panel opened
and closed, the palette opened and closed with nothing focused); after, none.

**Fix.**
- `components/core/core.js`: `data-s4-input` on `<html>`, the last way the person got around: `key` from a key that
  navigates (Tab, arrows, Escape, Enter, Space, Home, End, Page Up/Down, F6, or a mod+letter shortcut), `pointer` from a
  tap or click, absent until either. Typing letters into a field does not change it.
- `components/base/base.css`: a container that takes focus only to hold the place (`tabindex="-1"` on anything that is
  not a control: main, a view, a page, a dialog's own box, an expand region) draws no outline unless `data-s4-input` is
  `key`. Controls (links, buttons, fields, menu items, tabs, options, tree items, table rows and cells) keep their rings
  exactly as before, so keyboard users lose nothing; a keyboard user still gets the ring round the view or main (decision
  0069), proven in `tests/back.mjs`.
- `tests/back.mjs`: replays the iPhone tap on the Showcase and Dosewise at 390 dark and fails a ring on the view; then
  the keyboard path must keep it. Fails on 754f4c6 (2 checks), passes now.
- `docs/foundations/accessibility.md` (Focus row) describes the rule.

Left as it is (worth a look on the iPhone): after Back, focus returns to the opener (a control), and WebKit may draw the
ring round that button or row after a swipe Back, since a script moved it. That is a real control, and the brief was to
keep rings on controls; if it reads as noise on the phone, the same `data-s4-input` can quiet it (a follow-up call).

## Issue 72: the nav bar's selected tab is a circle (Showcase)

Image: `docs/issues/img/2026-11-22-nav-bar-round-indicator.jpg`. "The selected tab is way too round and circular. This
feels like a new change, and on some tabs the text goes over the tab selected."

**Cause.** Commit 2a746b0 (2026-11-16, round 0056 dial presets, "corner dial reaches … nav pill") changed the sliding
highlight's corner from `corner-extra-large` (28) to `min(height / 2, --s4-shape-nav-indicator)`. At the default corners
that is half its height. Under 600 the highlight holds the icon over the label, a box about as tall as it is wide
(70x68 with five tabs at 390), so half its height made it a circle (34px corner), and the corners of a long label such as
"Settings" fell outside the curve. Wider bars (Dosewise, three tabs) only look like a capsule, so it showed on five tabs.
Nothing in 0069 (lean bundle) or 0068-0070 moved it.

**Fix.**
- `components/nav-bar/nav-bar.css`: under 600 (the bar's own container query) the highlight's corner is
  `min(height / 2, --s4-shape-nav-indicator, the 32dp indicator height / 2)`: 16 at round corners, 14 soft, firm less.
  The usual rounded rectangle; the corner dial can still make it squarer, never rounder. The rail and the 600+ horizontal
  bar keep their pill.
- `components/nav-bar/nav-bar.js`: the highlight keeps at least 8px between the label and its sides where the cell has
  room; a label as wide as the cell gets the whole cell, so the highlight is never narrower than its label.
- `skill/orion/scripts/silent.mjs` (shared by the page checker and the suite): a new `nav` result fails a nav bar
  highlight (icon over label) whose corner is more than 30% of its short side (a circle), or that a corner of the label's
  box pokes out of (rounded corners included). Reported by `check.mjs` and `tests/suite.mjs`.
- `tests/fixtures/bad-nav-pill.html` (five tabs in a 340 bar, corner forced to half the height) and two cases in
  `tests/checker.mjs`: the checker must fail it with both messages.
- `components/nav-bar/README.md`: a row for `.s4-nav-pill`.

Proven over 288 cases (widths 320, 360, 390, 430; three, four and five tabs; short and long labels: Overview, Medicines,
Appointments, Notifications, Preferences; corners round, soft, firm; scale default and large; first and last tab
current): 101 failed on 754f4c6, none now.

## Unverified
- Real iOS Safari (both fixes). WebKit is not installable here, so the iPhone tap was replayed in Chromium as a click that
  moves no focus, which gives the same `:focus-visible` on the view as the owner's screenshot. Worth one look on the phone:
  Dosewise (switch tabs, open a medicine and swipe Back) and the Showcase nav bar with Settings selected.
- Label widths on iOS are a little wider than in Chromium (the owner's "Settings" overflowed where Chromium's did not
  quite); the new 8px gap and the checker's corner test leave room for that, but only the phone can confirm it.

## Lines for the shared files (for the merge)

**docs/issues/README.md** (Owner notes, 2026-11-22):
- **71.** Done 2026-11-22 (round 0061). A ring round the whole screen on the phone (Dosewise and others): a view, main or
  page that takes focus only to hold the place rings only for the keyboard (`data-s4-input`), WebKit counts a script's
  focus after a tap as `:focus-visible`. Image: `img/2026-11-22-mobile-region-border.jpg`.
- **72.** Done 2026-11-22 (round 0061). The nav bar's selected tab was a circle the label poked out of (regression from
  2a746b0): under 600 the highlight is a rounded rectangle with the 32dp pill's corner and holds its label; the checker
  fails a round one. Image: `img/2026-11-22-nav-bar-round-indicator.jpg`.

**CHANGELOG** (round 0061):
- Fixed: on an iPhone a ring no longer outlines the whole screen after a view switch, Back or a closed panel; containers
  that hold the place ring only for the keyboard (`data-s4-input` on `<html>`).
- Fixed: the nav bar's selected tab is a rounded rectangle again under 600 (it had become a circle at five tabs) and
  always holds its label. The page checker and suite fail a round highlight or a label poking out of it
  (`tests/fixtures/bad-nav-pill.html`).

**CLAUDE.md** (Rules that are easy to break, a line under 0065 or a new bullet):
- A container that takes focus to hold the place (tabindex -1 on a non-control) rings only while `data-s4-input="key"`
  (core.js); never write a ring rule on `:focus` alone or rely on `:focus-visible` for containers (WebKit matches it after
  a tap). The nav bar's highlight is never given its own corner (the checker fails a round one).

**NEXT.md**: issues 71 and 72 done on `round61/mobile`; ask the owner for an iPhone look at Dosewise (tab switches,
Back) and the Showcase nav bar.

**SKILL.md**: no change needed (no new API to call; `data-s4-input` is set by the runtime). If a line fits under focus:
"Never style a ring on `:focus`; containers that take focus by script ring only for the keyboard."
