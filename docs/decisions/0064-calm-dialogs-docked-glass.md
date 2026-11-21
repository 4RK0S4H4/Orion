# 0064: Calm dialogs, phone cards and docked glass (2026-11-21)

**Status:** built; awaiting the owner's look on an iPhone ([review page](../../explore/calm-dialogs.html)). Issues 67
(docked glass edge glow looks weird) and 68 (dialogs overused, in your face, weird on mobile).

The owner (2026-11-21), handing us the lead and allowing past rules to change, glass included: "the glass nav bars that
are like docks does look a bit weird with the edge glow ... my only hiccup is I feel like dialog boxes are overused, way
too in your face, and just feels weird on mobile."

Amends: **0043** (floating panels: on a phone they now take a swipe down and concentric bottom corners; panels are still
never docked and never slide in from an edge), **0039 and 0040** (docked glass: replaced), **0047** (the ladder: a dialog
now has a shape it must have, and the checker enforces it), **0021/0034** (the glass edge now applies only to floating
glass), M3's 32% scrim (light mode). Motion stays inside 0022/0046: Pop is unchanged, it only learned to leave from where
a finger let go; no pattern was added.

## 1. The audit: every dialog and modal panel

Before: 7 `.s4-dialog`s and 7 modal floating panels in the Showcase, the templates and the component pages (plus the
command palette, a modal search that is not a question). After: **5 dialogs, 5 modal panels, 2 more tool panels**.

| Where | What it was | What it is for | Ladder says | Now |
|---|---|---|---|---|
| Showcase, Settings > Delete All Notes (and the Overlays "Dialog" button) | Dialog | Deletes every note for good | Dialog (cannot be undone) | **Dialog**, calmer answers |
| `templates/settings.html` Delete Account | Dialog | Deletes the notebook on every device | Dialog | **Dialog** |
| `components/motion/` Discard Draft | Dialog | Leaving with unsaved work | Dialog | **Dialog** ("Discard this draft?") |
| `components/dialog/` Delete Bill | Dialog | Cannot be undone | Dialog | **Dialog** |
| `components/dialog/` Rename Bill | Dialog with a field | Editing a name | In place (inline edit) | **Removed**: the page now shows the three true questions (delete, unsaved work, a permission) and a "Not a Dialog" example (Archive acts at once with Undo) |
| `components/dialog/` Edit Details (`data-fullscreen`) | Full-screen dialog with fields | A task | A page (0050) | **Removed**; `data-fullscreen` kept for old markup and documented as old |
| `components/combobox/` Move to Folder | Dialog with a field | A short task | Floating panel | **Floating panel** (`.s4-bottom-sheet`) |
| Showcase Share Note | Modal panel | A short task with no place in the page | Floating panel | **Modal panel**, phone card |
| Showcase Filters (side) | Modal panel with Apply | A tool for the page behind | Tool panel (0054) | **Tool panel** (`data-modeless`), no Apply |
| `components/sheet/` Filters (side) | Modal panel with Apply | Duplicated the tool panel above it | Task example | **Edit Bill**, a modal side task panel (Cancel / Save) |
| `components/sheet/` Add Expense, Tool Panel | Modal panel; tool panel | Task; tool | As is | **As is** |
| `templates/dashboard.html` New Invoice | Modal panel | A short form | Floating panel | **As is**, phone card |
| `templates/list-detail.html` New Ticket | Modal panel | A short form | Floating panel | **As is**, phone card |
| `templates/data-table.html` Accession a Specimen | Modal panel | A short form | Floating panel | **As is**, phone card |
| `templates/data-table.html`, `components/filter/` filters | Tool panels | Tools | Tool panel | **As is** |
| Command palette (`S4.palette`) | Modal `.s4-dialog.s4-palette` | Search and run | Its own thing | **As is**: stays near the top (a search, like Spotlight), excluded from the phone card |
| `skill/.../patterns.md` | "a choice that opens a dialog", "the detail is a container-transform dialog" | | Menu or page; page | **Rewritten**, plus a Dialogs and Panels section |

Most of the overuse had already been removed in 0047 and 0050; what was left was how the remaining ones felt, which is
the larger part of "in your face".

## 2. How a dialog feels now

What the platforms do: iOS keeps centered alerts for rare critical questions and puts everything else in sheets and
action sheets near the bottom, in reach, dismissed by a swipe down (iOS 26 sheets float inset with corners concentric to
the device; alerts went start-aligned with capsule buttons side by side). Android M3 keeps centered dialogs on phones but
moves most tasks to bottom sheets with a 32% scrim and a drag to dismiss. Good web apps (Linear, GitHub mobile, Vaul-style
drawers) center a modest box on a desktop and use a bottom drawer on a phone.

Orion now:
- **Phones (under 600): a calm card in the bottom of the screen** for both dialogs and modal panels. Inset by the margin
  (16) and above the home indicator, the full width minus the inset; top corners the dialog/panel radius, **bottom
  corners concentric with the screen** (`--s4-shape-screen` 48 minus the inset: 32), so the card sits in the phone like
  an iOS sheet. Within thumb reach; nothing is centered in the middle of the screen any more.
- **Answers fill the bottom of the card**, 48 high: two side by side, three or more stacked with the first (Cancel) at the
  bottom, nearest the thumb. A text-variant answer gets the quiet fill so no answer is a bare word.
- **Answers are named and quiet**: Cancel `tonal`; a destructive answer `tonal` + `error` (error container: clear, not a
  red slab; iOS 26 does the same with red text on a quiet capsule); any other answer filled.
- **Headline calmer everywhere**: title-large, start-aligned, balanced wrapping; the icon sits at the start above it
  instead of a centered poster. Wide windows keep a modest centered card, now as wide as its question needs
  (20 to 28rem, was always 560px).
- **Lighter scrim**: `--s4-scrim-opacity` 0.16 in light mode (M3's 0.32 turned a white page mid-gray, the loudest thing
  on the screen); 0.32 in dark (a dark page barely dims) and in high contrast.
- **Firmer modal glass**: dialogs and modal panels are tinted `--s4-glass-tint-opacity-modal` (0.9) instead of 0.75. The
  scrim already separates them; the page showing through only added noise behind the question or the form. Tool panels
  (page live) keep 0.75. Solid in high contrast and reduced transparency as before.
- **Motion**: Pop, unchanged (rise 16px and fade over the scrim fading in). On a phone that reads as rising into place
  from the bottom; nothing slides in from the edge.
- **Dismiss**: tap outside, **swipe down** (new), Escape, Back (Android's Back closes a modal `<dialog>` natively through
  `cancel`). The swipe: the card follows the finger (direct manipulation, not an animation under the finger, 0052);
  past a quarter of its height or after a flick it leaves from where it was let go (`S4.transition.pop(el, { open:false,
  from })`); otherwise it settles back (`S4.transition.shift`). It never starts on a field, a slider, or content that is
  scrolled; sideways and upward drags are ignored. `data-persistent` only settles back. Never the only way out.
- **Unchanged**: native modal `<dialog>` (aria-modal, focus trap, inert page, focus returned), the dialog itself takes
  focus and never a field (0049), reduced motion fades only, forced colors border.

## 3. Docked glass

The nav bar, the top bar once content scrolls under it, the site header and a docked toolbar had the floating edge
switched to their free side (0040): a bright rim plus a 12px glow in dark mode, and in light mode an ink "shade" band.
On a full-width bar that reads as a bevel, as if the bar were a raised slab; a bar that runs off the screen on three sides
is not an object you hold. The iPhone tab bar and toolbar end in a single device-pixel hairline; Android's nav bar has
no line at all.

Decision: **docked glass keeps the tint and the blur and loses the rim, glow and shade. It draws one device-pixel hairline
on the edge that faces the content** (`--s4-glass-edge-line`, the token 0021 had named for this and nobody used: ink 20%
in light, white 16% in dark, 0 where glass is solid). 1px on standard screens, 0.5px at 2x, a third at 3x. Floating
glass (menus, FABs, floating toolbar, tooltips, panels, dialogs) keeps the full edge: it floats clear of every edge, so
it is an object, and that edge is what the owner tuned in 0028 to 0037. The glass contrast guarantee is unaffected (the
edge never carried text; check-glass stays green).

## 4. Guards
- Page checker (`skill/s4-orion/scripts/check.mjs`) and suite (`tests/suite.mjs`) fail a `.s4-dialog` (not the palette)
  with fewer than two distinct answers (`data-close` values): reading is a page, a notice is a snackbar. And one that
  holds a form field, unless it has a destructive answer (typing a name to confirm a delete is legitimate). Neither
  fires on any page in the repo now; both fired on the old Rename, Edit Details and Move to Folder dialogs.
- Suite, phone pass: every dialog and panel must sit within 64px of the bottom of the screen (palette and
  `data-fullscreen` excepted) and close with a swipe down (a persistent one must settle back), then give focus back.

## Not done / open
- The phone card uses one assumed screen corner (48). A browser cannot read the real one; on an iPhone with a home
  indicator the card sits above it, so concentricity is approximate there.
- The scrim does not fade with the finger during a swipe (it fades when the card leaves).
- Detents (a half-height sheet that can be pulled up) were not added: Orion panels size to their content.
