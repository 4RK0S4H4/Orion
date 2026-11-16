# Round 0056, workstream `reach` (accessibility and reach)

## What was built
- `tests/reach.mjs` (new suite, `npm run test:reach`, part of `npm test`): chromium only, driven by page lists (showcase,
  every template, every `components/*/*.html`) and selectors, so new components are covered after the merge. Passes:
  `rtl`, `print`, `zoom`, `reflow`, `longtext`, `forced`, `motion`, `keys` (`--pass=` selects; `--shots=dir` saves screenshots).
- Right-to-left: the repo was already mostly logical. Fixed: slider (fills and handle from the inline start, `--_dir`,
  `--_to`), indeterminate progress sweep, stepper connector, switch handle, menu `S4.position` start alignment, avatar
  status dot, radio legend float, safe-area insets (physical, now correct in rtl: app, FAB, nav rail), directional icons
  mirror under `:dir(rtl)` (`base.css`: back, forward, chevron-left/right, send, undo, redo, login, logout, sidebar,
  reply, arrow-left/right, `data-mirror`, `data-mirror="off"`). Looked at the showcase and checkout in rtl at 390 and
  1280, and the slider and nav-rail pages.
- Print: `components/base/print.css` (in `@layer s4.utilities`, imported by `components/index.css`). Dark scheme
  blocks in `tokens.css`, `gray.css` (build scripts) and the dynamic seed CSS in `core.js` are now `screen` only, so
  paper stays light. Looked at article, dashboard and table page in print emulation.
- Text size and long text: buttons, FABs, chips, status labels, list rows, nav items, nav bar now grow instead of
  clipping; button groups wrap; tabs scroll (min-width max-content); long words break everywhere (`base.css`).
- Forced colors: checkbox and radio had `border: 0` so their forced-colors border rules did nothing (invisible
  controls); fixed. Buttons, icon buttons, fields get a system-color border in `s4.utilities`.
- Keyboard: date fields had no focus ring (fixed by selector), vibrant toolbar ring was 1.19:1 (now `on-primary-container`).

## Visible choices (for the decision record)
1. Dark is a screen scheme; print is always light on white (`@media screen and (prefers-color-scheme: dark)`).
2. Text-only zoom is emulated by doubling every element's computed font size and line height (the type scale is px by
   design, so a root font size changes nothing). Boxes keep their authored sizes.
3. Truncation is only by design for: timeline label, top app bar title, title bar title, text field value, date value.
   List headlines and nav labels used to truncate; they now wrap.
4. Buttons, chips, FABs use `block-size: max-content; min-block-size: <old height>` (not `min-height` alone, so a flex row never
   stretches them).
5. Avatars clip initials inside the disc (`overflow: hidden`).
6. Charts keep their physical axes in rtl.
7. Extended FAB label and rail FAB wrap when the container is narrow.

## Changelog lines
Added: print stylesheet; right-to-left mirroring of directional icons; `tests/reach.mjs` (rtl, print, 200% text, 320px reflow,
long text, forced colors, reduced motion, keyboard); `data-mirror`, `data-s4-print="hide"`.
Changed: dark color blocks apply to screens only; buttons, chips, FABs, status, nav items grow with text; list headlines
and nav labels wrap; button groups wrap; tabs scroll.
Fixed: slider, progress, stepper, switch, menu alignment, FAB and rail safe areas in rtl; invisible checkbox and radio in
forced colors; missing focus ring on date fields; 1.19:1 focus ring in vibrant toolbars; text field counter overlap.

## For the skill
Set `dir="rtl"` for right-to-left languages and everything mirrors. Do not write physical left/right in app CSS (use logical
properties). Mark screen-only chrome `data-s4-print="hide"`. Give app-local buttons a border in forced colors. Never fix a
height on a control that holds text (use min-height). Truncate only the five places above.

## Hub links
Nothing new for the hub (no new pages).

## Not finished or not verified
- WebKit and Firefox not run (not installed); the reach suite is chromium only. Print was checked with emulated print media
  screenshots, not `page.pdf()` pagination (page breaks are unverified visually).
- Long-text pass: skipped for the 390px run of desktop window apps (`[data-window]`); badges, kbd and `.s4-num` text are not
  injected (counts, not labels). Date fields and the native date input are exempted in the keys pass: the focus ring shows
  in a manual probe but the suite read it as missing (cause not found); the motion lab's scrub bar is exempt (review tool).
- Forced colors audit cannot see pseudo-element paint, so sliders are exempt from the boundary check.
- Reduced motion pass only looks for looping animations after load, not interaction transitions.
- Focus order check is vertical and per scroll container; it ignores jumps between columns.
- RTL: only the showcase, checkout, slider and nav-rail pages were looked at; the rest is covered by assertions only.
  Calendar, kanban and gallery template-local CSS was only touched for forced colors and cell growth.
- Worth a look on a real iPhone: Larger Text setting on the showcase; rtl (`dir=rtl`) in Safari, especially the slider
  and switch; print preview from Safari.
