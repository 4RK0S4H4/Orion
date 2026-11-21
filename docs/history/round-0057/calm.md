# Round 0057, workstream `calm`: calm dialogs and docked glass (decision 0064)

Branch `round57/calm`. Decision record: [`docs/decisions/0064-calm-dialogs-docked-glass.md`](../../decisions/0064-calm-dialogs-docked-glass.md)
(audit table, reasons, what it amends). Review page: `explore/calm-dialogs.html`.

## Issues for docs/issues/README.md (the integrator adds them)
- **67. Docked glass bars look weird with the edge glow** (owner, 2026-11-21: "the glass nav bars that are like docks
  does look a bit weird with the edge glow"). Fixed by 0064: docked bars keep tint and blur, drop rim, glow and shade,
  and draw one device-pixel hairline on the content-facing edge. No reference image.
- **68. Dialogs are overused, too in your face, and feel weird on mobile** (owner, 2026-11-21). Fixed by 0064: audit
  moved the forms out of dialogs; on a phone dialogs and panels sit in the bottom in reach with answers filling the
  width, swipe down to dismiss, lighter scrim in light mode, firmer modal glass, calmer headline and answers. No
  reference image.

## Changelog lines
**Added**
- Phones: a swipe down puts a dialog or floating panel away (it follows the finger; past a quarter of its height or a
  flick it leaves, otherwise it settles back; `data-persistent` only settles back). `S4.transition.pop(el, { open: false,
  from })` leaves from where a finger let go.
- Tokens: `--s4-shape-screen` (48, a phone's own screen corner, for concentric bottom corners),
  `--s4-glass-tint-opacity-modal` (0.9).
- Page checker and suite: a dialog with fewer than two answers, or one holding a form (unless its answer is destructive),
  fails (decision 0064). Suite phone pass: every dialog and panel must sit at the bottom of the screen and close with a
  swipe down.
- `explore/calm-dialogs.html`: before and after on the live Showcase in phone frames (dialog, panel, docked bars).
- `skill/s4-orion/references/patterns.md`: a Dialogs and Panels section.

**Changed**
- On a phone, dialogs and modal panels are a card in the bottom of the screen: inset 16, bottom corners concentric with
  the screen, answers 48 high filling the width (two side by side, three or more stacked with Cancel at the bottom).
  `data-placement="center"` panels center only from 600.
- Dialogs everywhere: title-large start-aligned headline, icon at the start, as wide as the question needs (20 to 28rem),
  answers Cancel tonal and a destructive answer tonal error.
- Scrim: 16% in light mode (was 32%); dark and high contrast keep 32%.
- Dialogs and modal panels are 90% glass (was 75%); tool panels keep 75%.
- Docked glass (top bar scrolled, site header, nav bar, docked toolbar): no rim, glow or shade; one device-pixel hairline
  (`--s4-glass-edge-line`, now ink 20% light / white 16% dark) on the edge facing the content. Replaces 0039/0040.
- Showcase Filters is a tool panel (`data-modeless`, no Apply). Combobox Move to Folder is a floating panel. The dialog
  page shows the three true questions (delete, unsaved work, a permission) and a "Not a Dialog" example; Rename and the
  full-screen Edit Details dialogs are gone. The sheet page's second side panel is a task (Edit Bill). Motion page:
  "Discard this draft?".

**Fixed**
- Issue 67, issue 68.

## CLAUDE.md rule bullet to add (Rules that are easy to break)
- Decision 0064 (calm dialogs, docked glass): a dialog only asks a question the app cannot go on without (delete for
  good, leave unsaved work, a permission), with two or three named answers: Cancel tonal, a destructive answer tonal
  error; never one answer, never a form (page checker and suite fail both). On a phone dialogs and modal panels are a
  card in the bottom of the screen (inset 16, bottom corners `--s4-shape-screen` minus the inset, answers filling the
  width), dismissed by a tap outside, a swipe down, Escape or Back; this is automatic, never position them by hand. Scrim
  16% light / 32% dark; modal glass 90%. Docked glass bars (top bar scrolled, site header, nav bar, docked toolbar) have
  no rim, glow or shade: one device-pixel `--s4-glass-edge-line` hairline on the content-facing edge. Floating glass keeps
  the full edge. Amends 0043, replaces 0039/0040.

Also in the CLAUDE.md glass bullet, replace "the edge width scales with screen density" context with: "the edge is for
floating glass only; docked bars draw one hairline (0064)". The decisions list gains "0064 calm dialogs and docked glass".

## Skill guidance (SKILL.md)
- Walk the placement ladder before reaching for a dialog. A dialog is for a question the app cannot go on without:
  deleting something for good, leaving with unsaved work, a permission. A reversible action happens and offers Undo; a
  form goes in place (`.s4-expand`), in a floating panel or on a page; reading is a page. Expect one or two dialogs per
  app.
- Dialog markup: headline is the question in sentence case, one or two lines of content, `.s4-dialog-actions` with
  Cancel (`data-variant="tonal"`, `data-close="cancel"`) then the answer (`data-variant="tonal" data-color="error"` when
  it destroys, filled otherwise). Never one answer; never "OK".
- On a phone, dialogs and panels sit in the bottom of the screen with full-width answers and swipe-down dismissal
  automatically; never position or size them yourself. `data-persistent` blocks tap-outside and swipe.
- A filter or inspector panel is `data-modeless` with no Apply button.
- Docked bars are glass without an edge glow; never add a rim, glow, border or shadow to a nav bar, top bar or docked
  toolbar.
- The page checker fails a dialog with one answer or with a form.

## Hub links to add
- Explore: "Calm Dialogs and Docked Glass" → `explore/calm-dialogs.html` (review lab, before/after; registered in
  `explore/lib/questions.js` as `calm-dialogs`, three A/B questions).

## What the owner should check on an iPhone
- `explore/calm-dialogs.html`: tap into the B frames and swipe the card down; does the bottom card feel native, is
  Delete clear enough as a quiet red, is the light-mode scrim enough?
- `demo/index.html#forms` > Overlays: Dialog, Floating Panel (swipe down), Side Panel (a phone card here; a tool panel on
  a wide window). Settings > Delete All Notes.
- With the home indicator, the card sits above it; check whether the bottom corners look right against the real screen
  corners (they assume a 48pt screen corner).
- Scroll any app view under the nav bar and the top bar in light and dark: one hairline, no glow.
- A swipe that starts in a scrolled form inside a panel should scroll, not dismiss.

## Not finished / not verified
- Real iOS Safari touch handling of the swipe (`touchmove` with `preventDefault`) is verified only with synthetic touch
  events in Chromium; WebKit is not installed here.
- The scrim does not follow the finger during a swipe.
- No detents (half-height sheets).
- The other workstream owns SKILL.md, CLAUDE.md, NEXT, CHANGELOG, README, decisions README, hub: all of the above is text
  for the integrator.
- Templates touched (small, dialog only): `templates/settings.html` (Delete Account answers). Demo: `demo/index.html`
  (dialog answers, Filters panel), `demo/demo.js` (removed the Apply snackbar).
