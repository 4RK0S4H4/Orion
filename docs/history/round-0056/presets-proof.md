# Round 0056: presets-proof (brand dials proven like accents)

## What was built
- `tests/suite.mjs`: a "dial presets" pass (Chromium; `--dials-only`, `--no-dials`, `--preset=<part of key>` flags).
  Presets: corners soft, corners firm, gray warm, gray cool, page soft (light only), serif display + rounded text and mono
  display + mono text (390 dark only), combo firm + cool + soft page + mono display, combo seeded blue in tinted mode with
  soft corners, warm gray and soft page. Each runs at 390 dark and 1280 light (except where noted) on the showcase in each
  of its four views, all templates except the templates hub (it sets its own theme), and the component pages for button,
  button-group, chip, tabs, menu, dialog, sheet, snackbar, toolbar, nav-rail, nav-bar, text-field, search, list,
  pagination, breadcrumbs, fab, date-picker. 612 page runs, about 4 minutes. Sampling: the unit tests of the normal pass
  are untouched; menus, dialogs and sheets (first 3 of each per page) are opened only under the corner presets (that is
  where containers of controls matter); the pressed-shape check samples 5 button kinds per page and runs under corner presets only.
  Assertions: (a) nothing that should follow the dial is still a pill (selector list in `dialAudit`; exempt: switches,
  radios, checkboxes, sliders, progress, avatars, badges, chip avatar and remove button, date-picker days, status dots,
  skeleton circles); (b) `nestAudit(8)`: the existing concentric check, now with a minimum container corner of 8 so firm
  containers are covered (also run inside every opened menu, dialog and sheet); (c) `contrastAudit`: text contrast AA as
  rendered, including text on glass against the worst backdrop (same method as `skill/s4-orion/scripts/check.mjs`);
  (d) overflow sideways and clipped labels (buttons, chips, tabs, nav labels, menu items, segments, pagination,
  breadcrumbs, titles, stat values); (e) `pressAudit`: pressed radius never above resting radius.
  No static `check:dials`: the proof needs computed styles, so the suite pass is it.

## Fixed (found by the pass)
- Tabs tray corner is now the control corner plus its 4px padding (it was a toolbar corner: mismatch under firm).
- Nav pill (docked nav bar, shared pill) follows the corner dial (`min(height/2, --s4-shape-nav-indicator)`), it was always 28.
- Chip remove button corner is concentric with the chip (`min(icon/2, max(4px, chip corner - 8px))`), a circle when the chip is a pill.
- Icon button pressed shape could be rounder than at rest under firm (size variants pressed to 12 from 10): now `min(pressed, rest)`.
- `corners: soft` now also brings `--md-sys-shape-corner-extra-large` down to the large-increased step (menus, dialogs, panels), as firm did.
- Error text (menu item, text button) and primary text buttons on glass panels were below 4.5:1 (they were never proven; the glass
  guarantee is for on-surface only; 3.0 to 3.2:1 even at the defaults): mixed toward on-surface in `glass.css`.
- Vibrant toolbar: tonal button and tonal icon button took dark text on a dark vibrant glass (1.1:1 in monochrome); they now use
  on-primary-container. The vibrant toolbar glass uses the colored-glass tint (90%, token `fab-color`).

## Issue 58
- Elevated button: fill = 10% of on-surface mixed into `--s4-surface-here` (set by card, pane, list, menu, dialog, sheet;
  the page surface otherwise). One step above whatever it sits on, lighter in dark and darker in light, no shadow. README updated.
- Unselected filled toggle buttons and icon buttons use the same "a step above the surface" (12%), which fixes the faint dark-mode look.
- Avatar group: overlap is an eighth of the avatar width (was 8px, a third on xs), 2px ring in the surface color of the surroundings; "+4" is a step above its surface.
- Breadcrumbs: the current page's chevron no longer sits inside its padding: 4px after the previous pill, 8px before the text.

## Visible choices for the decision record
- Colored FABs and the vibrant toolbar on glass are exempt from the AA text check when a seed is set (decisions 0028 and 0032 already
  record that these are below 4.5:1 for some seeds). Say so in the decision record; the owner may want to decide whether the vibrant toolbar should be solid.
- New internal token-like custom property `--s4-surface-here` (the surface a control sits on, for "a step above" fills). Grep showed no clash.

## Changelog lines
- Added: dial presets pass in the suite (corners, gray, page tone, typefaces, combined and seeded tinted presets).
- Changed: Elevated button is a fill one step above its surface (no shadow); unselected filled toggles likewise; avatar groups overlap less with a surface-colored ring.
- Fixed: corner dial now reaches the tabs tray, the nav pill and the chip remove button; pressed icon buttons are never rounder than at rest; error and text buttons on glass reach 4.5:1; vibrant toolbar tonal buttons readable; breadcrumb chevron spacing.

## For the skill
Brand dials are proven by the suite, not by hand: after changing component CSS, run `node tests/suite.mjs --dials-only --preset=corners-firm`. A new clickable component must use `--s4-shape-control` and be added to the FOLLOW selector list in `dialAudit`.

## Not finished / not verified
- WebKit not available; the dial pass is Chromium only. Fonts: serif and rounded resolve to whatever Chromium on Linux has, not New York or SF Rounded; check real widths on an iPhone.
- Accent text on glass: only the seed in the combined preset was tested, not all 210 accent schemes. `check-glass` could prove the text-button mix for every scheme (not done).
- Look at on a real iPhone: Elevated vs Tonal on a dark card (close in lightness), the avatar stack at xs, firm corners on the docked nav bar.
