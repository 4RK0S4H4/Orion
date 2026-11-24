# Orion Full QA pass 2 (commit 77d3c86, read-only, Chromium via Playwright)

Scratch: /tmp/claude-0/-home-user-s4-orion/41fbd5a5-7433-59f0-9952-e0cead264e41/scratchpad/qa2/ (shots in qa2/shots/, scripts in /tmp/qa2w/*.js, dial sweep results qa2/dials.json absent because the sweep found nothing).
Scope: scripted flows pass 1 did not cover, at 390 touch and 1280 mouse, light and dark. No console errors or page errors in any flow (only the known font-preload warning). All 7 dials-by-value sweeps (below) were clean at 360 and 430.
Not re-reported: everything in qa1/findings.md.

## Findings (most severe first)

1. [major] Focus falls to `<body>` after committing an edit (data table cell, inline edit) and after Ctrl+W (Parley)
   - Pages: templates/data-table.html (`data-edit` cells), components/inline-edit/inline-edit.html, templates/desktop-app.html (Close File).
   - Steps (table): focus first row, ArrowRight to the Drawer cell, Enter, type "KB-1", Enter. Steps (inline edit): click Owner, type, Enter. Steps (Parley): Ctrl+W on an open file.
   - Expected: decision 0065 and the table README ("Enter or leaving saves"): focus stays on the cell or lands on the next logical place; the suite is meant to fail `<body>`. Actual: `document.activeElement` is BODY; arrow keys then do nothing and Tab starts again from the top of the page. Same after Escape in inline-edit and after Ctrl+W (the menubar-less BODY).
   - Evidence: shots/dt_kbedit.png (state after commit); logs "after commit BODY. td- row-" (t6.js), "d enter ... BODY#" (ie1.js), "Control+w ... BODY#" (p3.js).
   - Rule idea: suite step "keyboard-commit then assert activeElement is inside the table/field's region" for every `data-edit`, `.s4-inline-edit` and every command in `S4.commands` that removes the focused thing.

2. [major] Swipe actions are not reachable with Tab, contrary to the README
   - Page: components/direct/direct.html (also any `data-swipe` row).
   - Steps: Tab through the Messages list; inspect `.s4-swipe-actions button`.
   - Expected (README Accessibility): "Swipe actions are real buttons reachable with Tab". Actual: `.s4-swipe-actions` is `visibility:hidden` until swiped, so the buttons cannot take focus at all; the `focusin`/`:focus-within` rescue in direct.js/direct.css can never fire. Tab skips the whole Messages list. In the demo the row is a plain div (no menu, no page), so there is no keyboard way to Archive or Delete a message.
   - Evidence: logs "swipe buttons vis [hidden ...]" and the Tab sequence jumping from the probe to Files (d2.js); shots/dm_swipe_d.png.
   - Rule idea: suite test that for every `[data-swipe]` an action button is focusable (or the row has a menu/Enter path) and that Tab count through the row is at least 1.

3. [major] Browser Back/Forward after switching views changes only the URL, not the screen
   - Page: demo/index.html (Showcase; any `.s4-app` with views).
   - Steps: click Settings in the nav, click Forms, then browser Back (or the phone Back gesture), Back again, Forward.
   - Expected: the view follows the URL (pages already do via popstate; the nav items are `href="#view"` and push history). Actual: URL goes to `#settings` / `#forms` while the screen stays on Forms; reload then shows a different view than the one you were looking at. Setting `location.hash='#forms'` also does nothing visible. app.js reads `location.hash` only at load; there is no hashchange or popstate for views.
   - Evidence: h1.js log ("back forms | #settings | forms,forms", "hash=#forms home | #forms").
   - Rule idea: `npm run test:back` extension: after N nav clicks, history.back() N times must land on the first view and `aria-current` must equal the hash view at every step.

4. [major] Column-resize grip: its middle (the column border) is covered by the next header, so grabbing the border hits the neighbour
   - Page: templates/data-table.html (`data-resizable`), components/table.
   - Steps: at 1280, press the mouse exactly on the grip centre at a column border and drag 80px; or double-click it to fit.
   - Expected: width changes (README: "drag it"; double-click fits). Actual: the 16px grip straddles the border, the right 8px is under the next `th` (elementFromPoint shows the next header, or for Collector the next column's sort button). Dragging from the centre does nothing; double-click is intercepted ("th intercepts pointer events"), and a click on the right half can sort or open the neighbour's menu. Only the left 8px work.
   - Evidence: log "hit: G G G G Tcol Tcol Tcol Tcol Tcol" and "after drag 126" unchanged (t2.js, t3.js).
   - Rule idea: checker or suite: for each `.s4-table-grip` assert elementFromPoint at its centre and both quarter points is the grip.

5. [major] Number cells in a data table accept anything and silently save a wrong number
   - Page: templates/data-table.html, Specimens column (`data-edit="number"`, `data-format="integer"`).
   - Steps: click a Specimens cell, type and press Enter: "abc", "1e3", "3.7", "-5", then clear it.
   - Expected: README ("`data-edit` ... a snackbar offers Undo", number field rules): invalid input is refused or shown as an error. Actual: "abc" saves 0, "1e3" saves 13, "3.7" saves 3.7 into an integer column, "-5" saves -5, empty saves empty and the footer total treats it as 0 (38,780 to 38,778). Every one raises "Specimens changed / Undo", so a typo is committed with a calm message. Also see 1: focus is lost after each.
   - Evidence: t5.js log "typed abc -> 0 ... Total 38,778", "1e3 -> 13".
   - Rule idea: `data-edit="number"` test: non-numeric input keeps the previous value and sets `aria-invalid`; `data-format="integer"` rounds or rejects.

6. [major] Snackbar actions and in-place actions leave focus on `<body>`; consecutive actions lose the earlier Undo
   - Pages and steps: data-table (select rows, Delete Selected, then Undo), kanban (Alt+Right, then Undo), direct (selection bar action then Undo), settings template (Download a pack: the focused Download button is hidden; Undo after Remove), inline-edit (Undo).
   - Expected: 0065 "no flow leaves focus on body"; the snackbar README says nothing about focus, and focus should return to what had it (or main). Actual: after clicking Undo, or after the selection bar hides, `document.activeElement` is BODY (the Remove action did land on the Download button, so it is inconsistent). The settings Download button sets `hidden` while focused, so focus drops and stays on BODY through "ready".
   - Second part: the snackbar shows one at a time, so two quick deletes (data-table) or two inline edits (inline-edit) leave the first one with no Undo: "NHM-00003 deleted", then "NHM-00004 deleted" offers only the second; after Undo one record is still gone. Same for two inline edits (Owner then Note; Undo only reverts Note).
   - Evidence: t7.js log "after delete ... focus BODY.#", "two deletes ... [ 'NHM-00004 deleted|Undo' ]", b1.js "undo ... BODY", d3.js "after bar action ... BODY", st1.js "downloading ... BODY", ie1.js "two edits / undo (only last)".
   - Rule idea: suite: after any snackbar action click, activeElement must not be body; add an "undo stack" mode (or text "2 deleted") to `S4.snackbar` when a new snackbar replaces one that still has an action.

7. [minor] Data table template: Undo of Delete puts rows back at the end, and the filter's "N records" label goes stale
   - Page: templates/data-table.html.
   - Steps: tick the first two rows, Delete Selected, Undo.
   - Expected: rows return where they were (README: `remove(ids)` "returns the removed rows, for Undo"; the placement of a restored row is the app's job but the API gives no index). Actual: `table.setRows(table.rows.concat(gone))` appends them at the end, so the register's first rows (NHM-00001, 00002) are gone from the top after Undo. The count line under the filter ("5,000 records") never changes after delete or Undo while the facts card and footer do ("4,999").
   - Evidence: t8.js (top rows before/after), t9.js ("5,000 records" with footer "4,999 Records"), shots/dt_undo_pos.png.
   - Rule idea: `remove()` returns `{row, index}` pairs or table offers `restore(rows)`; filter count listens to `s4-change type=view`.

8. [minor] `.s4-form` reset leaves errors, valid marks and touched state in place
   - Page: components/form/form.html (Create Account form).
   - Steps: leave Last Name empty, press Create Account (errors appear), press Clear (type=reset).
   - Expected: values and error states both reset. Actual: values clear but the "Enter your last name." error and `aria-invalid` remain on the field.
   - Evidence: f2.js "after reset last inv true Last Name|Enter your last name."; shots/form_reset.png.
   - Rule idea: form.js listens to `reset` and clears data-error, data-valid, aria-invalid, `s4Touched`.

9. [minor] Palette: Escape clears the box but leaves the filtered list; End drops the active option; Enter with no results closes silently
   - Page: any page with S4.palette (templates/desktop-app.html).
   - Steps: mod+K, type "sett", Escape. Then mod+K, press End.
   - Expected: either Escape closes, or clearing the box restores all commands. Actual: first Escape empties the input (native search clear) but the list still shows only "Settings" (1 of 27), a second Escape closes. End leaves no `aria-selected` option. PageDown does nothing. Enter on "No matches" closes the palette and lands focus on main with no feedback.
   - Evidence: p2.js ("esc1 {input:'',items:1,sel:'Settings'}", "end(input caret) undefined"), p1.js ("enter on empty").
   - Rule idea: suite: after any input event or Escape-clear, option count equals filter(query).

10. [minor] Code field: Select All and paste cannot replace a full code
    - Page: components/code-field/code-field.html.
    - Steps: type 123456, Ctrl+A (selection stays [6,6]), paste or type a new code.
    - Expected: a pasted code replaces the old one (the README says a paste fills the boxes). Actual: the caret is forced to the end, Ctrl+A is collapsed, a paste of "654321" is ignored and "987 654" over a 5-digit value fills only the last digit; the only way is six Backspaces.
    - Evidence: cf2.js log ("ctrl+v over select-all 123456").
    - Rule idea: when a paste arrives and the value is full, replace; or keep the selection on select-all.

11. [minor] Closed select trigger ignores ArrowDown, Alt+Down, Home/End and typeahead
    - Page: components/text-field/text-field.html (Category select), any `.s4-text-field-select`.
    - Steps: focus the trigger, press ArrowDown, then Alt+Down, then type "t".
    - Expected: a native select changes value or opens on these keys; the select-only combobox pattern opens on ArrowDown/Alt+Down. Actual: only Enter or Space opens. Once open, End/Home/typeahead work.
    - Evidence: s1.js, s2.js.

12. [minor] Inline edit: clearing a required field and pressing Enter reverts silently
    - Page: components/inline-edit/inline-edit.html (Owner, `required`).
    - Steps: click Owner, select all, Backspace, Enter.
    - Expected: an error message, or a visible reason (decision 0065 "silent failures", `.s4-form` errors on blur). Actual: the old value returns, no `aria-invalid`, no message, no snackbar.
    - Evidence: ie1.js "empty required ... null" with no snack.

13. [minor] Deep link to a missing page id leaves a lying URL
    - Page: templates/list-detail.html.
    - Steps: load `#queue/ticket/9999`.
    - Expected: not-found state or the URL normalised to `#queue`. Actual: the list shows with the hash still `#queue/ticket/9999`; reload repeats it, Back goes elsewhere. (Valid ids, Back/Forward x5, reload then Back all worked.)
    - Evidence: g1.js "deep #queue/ticket/9999".

14. [minor] Contract mismatch: `S4.theme.dials` lists `data-contrast: standard|medium|high` but `S4.theme({ contrast: 'high' })` warns and writes nothing (it wants 0, 0.5 or 1)
    - Steps: `S4.theme({ contrast: 'medium' })`. Warning: "theme contrast "medium" ignored (not written); use 0, 0.5 or 1." Decision 0067 says every dial has a list of values and the list is what is accepted.
    - Evidence: dl4.js output. Rule idea: suite loops `S4.theme.dials` and passes each value through `S4.theme`, expecting no warning.

15. [nit] Number field: "1,5" is read as 15 (comma as grouping) and shows "Enter 1 to 12."; an out-of-range typed value reports its raw number in `aria-valuenow` (99, and `1e+40` for 40 nines), beyond `aria-valuemax`.
    - Page: components/number-field/number-field.html. Evidence: n1.js.

16. [nit] Direct manipulation README says all three work with the keyboard, but starting a selection by keyboard is undocumented and only works by accident (Shift+Space or Shift+Enter fire a shift-click; Space and Ctrl+Enter do nothing). components/direct/README.md line 40.
    - Evidence: d3.js ("shift+space 1 Selected", "space/ctrl+enter 0").

17. [nit] Color field: a pasted code with a leading space ("  #abcdef ") is cut by the length limit to "  #abcd" and fails; trailing space is fine. Evidence: cf1.js.

18. [nit] Form: leaving an untouched empty required field (Tab through) shows no error (by design in form.js: only touched or non-empty fields are checked); the README says "Errors on leaving a field" without that exception. Board add-in-place: Enter on a blank draft does nothing and says nothing. Evidence: f2.js, b2.js.

## Things checked and found working (no finding)
- Forms: errors only after a value was entered and left; typing clears; inline check; submit with problems fires `s4-invalid` and scrolls; `s4-submit` carries the right values; autosave shows nothing while typing, "Saved" after settling; 400-character paste causes no overflow at 390 or 1280.
- Number field: step, Home/End/PageUp, limits and disabled buttons, snapping of typed values, hold-to-step with mouse and with real touch (CDP), tap never raises focus.
- Date picker: arrow/week/month/year keys, clamps at min and max, Escape returns focus to the field, disabled dates are aria-disabled and cannot be chosen by Enter or click.
- Table: sort cycle and multi-sort, 5,000 rows scrolled to the end and back (last row 5001 of 5002), keyboard resize (Shift+arrows, Enter mode, Escape restores), column menu keyboard and focus return, selection kept across virtual scroll, select all and toggle, stacked phone rows, edit Undo (text cell), Escape reverts.
- Board: Alt+arrows within and across lanes (clamped at ends, announced), add in place focus rules, Cancel/Escape return focus to the add button, mouse drag between lanes (from card and from the title button), long headline in a card does not overflow.
- Direct: handle reorder with Space/arrows/Escape, selection with toggle, tap, hold on touch (CDP), Escape ends selecting.
- Palette: opens with mod+K and by button, never focuses the field when opened by button, Esc and outside tap close and return focus, commands run (Show Sidebar, Close File, Settings). Parley shortcuts (Ctrl+S, J, Shift+J, B, Alt+I, F, Enter, /, W, comma) all ran the right command. Menubar: Left/Right/Up/Down/Home/End/Escape and check items. Doc tabs: arrow keys, Delete closes, Reopen restores, last tab protected. Tree: arrows, Home/End, collapse, F2 rename and Escape, Shift+F10 menu.
- Pages (list-detail): Back, Forward, 5 rapid Back/Forward pairs, reload on a page then Back, 8 odd deep links (no errors, no stuck overlay).
- Overlays: sheet then history.back, menu then dialog, dialog Tab cycle, rotation 390x844 to 844x390 with a sheet and with a dialog open (both fit, no clipping).
- Dials: all values of surfaces tinted (2 seeds), corners, scale, headings, gray, page, energy, density, display/text faces, plus one stacked combination, on demo + dashboard, data-table, kanban, settings, chat at 360 and 430, light and dark: no horizontal overflow, no new clipped labels, no errors (the checker was proven to catch an injected 500px element).

## Coverage table

| Area | 390 touch | 1280 mouse | Dark | Light | Result |
|---|---|---|---|---|---|
| .s4-form (send + autosave) | yes | yes | no | yes | findings 8, 18 |
| Number field | yes (+CDP touch) | yes | no | yes | 15 |
| Date picker | yes | yes | no | yes | ok |
| Select menu keyboard | yes | yes | no | yes | 11 |
| Search field Escape | yes | yes | no | yes | ok |
| Inline edit | yes | yes | no | yes | 1, 6, 12 |
| Color / code fields | yes | yes | no | yes | 10, 17 |
| Data table sort/virtual scroll | yes | yes | yes | yes | ok |
| Table resize drag + keyboard | no (desktop feature) | yes | no | yes | 4 |
| Table column menu | no | yes | no | yes | ok |
| Table data-edit + Undo | yes | yes | no | yes | 1, 5 |
| Table select several + delete + Undo | yes | yes | yes | yes | 6, 7 |
| Board Alt+arrows, add, drag | yes (drag via CDP) | yes | yes | no | ok (6 for Undo focus) |
| Direct: reorder, swipe, select | yes | yes | yes | no | 2, 16 |
| Snackbar/Undo after destructive actions | yes | yes | mixed | mixed | 6 |
| Palette | yes | yes | no | yes | 9 |
| S4.commands shortcuts (Parley) | no | yes | no | yes | 1 (Ctrl+W) |
| Menubar | no | yes | no | yes | ok |
| Doc tabs | no | yes | no | yes | ok |
| Tree | no | yes | no | yes | ok |
| Pages and Back/Forward (list-detail) | yes | yes | no | yes | 13 |
| View-level Back (Showcase) | yes | yes | no | yes | 3 |
| Two overlays in a row | yes | yes | yes | no | ok |
| Rotation with overlays | yes | n/a | yes | no | ok |
| Dials x demo + 5 templates at 360/430 | yes | n/a | yes | yes | 14 only |
| Parley at 390 and landscape | yes | yes | yes | yes | ok (screens checked, no overflow) |
