# 0058: Reach (right-to-left, print, text size, forced colors, keyboard) and proven dial presets (2026-11-16)

**Status:** built in round 0056. The owner left the calls to us on 2026-11-16 ("I trust your judgement") and can
overrule any of them. Notes: [`docs/history/round-0056/reach.md`](../history/round-0056/reach.md) and
[`docs/history/round-0056/presets-proof.md`](../history/round-0056/presets-proof.md).

## The question
Orion was checked at default settings only: left-to-right, on screen, at standard text size, with the default dials.
Could a person reading Arabic, printing a page, using Larger Text, Windows high contrast or only a keyboard rely on it?
And did the brand dials (0055) hold everywhere?

## The answers
1. **Right-to-left**: set `dir="rtl"` and everything mirrors. Directional icons (back, forward, chevrons, send, undo,
   redo, arrows, sidebar, reply, sign in and out) flip under `:dir(rtl)`; `data-mirror` flips any other icon,
   `data-mirror="off"` keeps one. Charts keep their physical axes. App CSS uses logical properties only.
2. **Print is light**: dark is a screen scheme (`@media screen and (prefers-color-scheme: dark)`), in page tokens,
   gray temperatures, a seed's colors and scoped themes alike. `components/base/print.css` gives paper a white page,
   hides chrome, uses the full sheet and prints link addresses in prose only. `data-s4-print="hide"` hides anything else.
3. **Text grows, it is not cut**: buttons, chips and FABs are `block-size: max-content; min-block-size: <height>`;
   list headlines and nav labels wrap; button groups wrap; tabs scroll; long words break anywhere. Truncation is by
   design only for the timeline label, top app bar title, title bar title, text field value and date value. Avatars clip
   initials inside the disc. Never fix a height on a control that holds text.
4. **Forced colors**: buttons, icon buttons and fields get a system-color border; checkboxes and radios are visible.
5. **Keyboard**: every focusable thing shows the focus ring at 3:1 or more (date fields and the vibrant toolbar fixed).

## What the reach suite proves (`tests/reach.mjs`, part of `npm test`)
Showcase, every template and every component page, in Chromium: `rtl` (nothing overflows or flips wrongly), `print`
(light, nothing cut), `zoom` (text at 200%), `reflow` (320 wide), `longtext` (long labels), `forced` (controls have a
boundary), `motion` (nothing loops under reduced motion), `keys` (focus ring and order).

Exempt, and why: the long-text pass skips desktop window apps at 390 and does not inject badges, `kbd` or numbers
(counts, not labels); date fields are exempt from the keys pass (the ring shows by hand; the suite reads it as missing,
cause unknown); the motion lab's scrub bar (a review tool); sliders in the forced-colors boundary check (pseudo-element
paint is invisible to the audit). Focus order is checked per scroll container, top to bottom. WebKit and Firefox are
not run here.

## Proven dial presets
`tests/suite.mjs` runs a dial pass: corners soft and firm, gray warm and cool, page soft, serif and mono faces, and two
combinations (firm + cool + soft page + mono; a seeded tinted blue with soft corners, warm gray and soft page), at 390
dark and 1280 light, on the showcase, every app template and the control component pages. It asserts nothing that
should follow the corner dial is still a pill, nested corners stay concentric (also inside opened menus, dialogs and
panels), text passes AA as rendered (on glass against the worst backdrop), nothing overflows or clips, and a pressed
shape is never rounder than at rest. A new clickable component reads `--s4-shape-control` and joins `dialAudit`.

Exempt, and why: colored FABs and the vibrant toolbar when a seed is set (0028 and 0032 already record them below 4.5:1
for some seeds; the owner may want the vibrant toolbar solid).

## Fixed on the way (issue 58)
- Elevated button: a fill one step above the surface it sits on (`--s4-surface-here`), no shadow. Unselected filled
  toggles likewise.
- Avatar stack: overlap an eighth of the width, a ring in the surrounding surface color, "+4" a step above its surface.
- Breadcrumb chevron spacing; the corner dial reaches the tabs tray, nav pill and chip remove button; error and text
  buttons on glass reach 4.5:1; vibrant toolbar tonal buttons readable.
