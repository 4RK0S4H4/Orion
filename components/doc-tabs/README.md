# Document Tabs

The open documents of a desktop window: files, records, conversations. Each tab is a thing you opened: it closes,
carries a dot while it has unsaved changes, moves, and comes back after you close it by mistake.

**Not the [content tabs](../tabs/).** Content tabs switch between a fixed set of views of one thing (Overview,
Activity, Settings) and belong to the navigation family (decision 0059): they never close, never move and their set
does not change. Document tabs are made and closed by the person, as many as they like, and can be reordered. If the
set of tabs is fixed by the app, use content tabs.

```html
<div class="s4-doc-tabs">
  <div class="s4-doc-tabs-list" aria-label="Open Files">
    <div class="s4-doc-tab" data-modified>
      <button class="s4-doc-tab-label" type="button" aria-selected="true" aria-controls="doc-1">
        <span class="s4-icon" data-icon="document"></span><span class="s4-doc-tab-text">dialogue.json</span></button>
    </div>
  </div>
  <button class="s4-icon-button s4-doc-tabs-new" type="button" aria-label="New File" data-cmd="file.new"><span class="s4-icon" data-icon="add"></span></button>
</div>
<section id="doc-1">…</section>
```

| Part / attribute | What |
|---|---|
| `.s4-doc-tabs` | The row (on chrome). In a title bar: `.s4-titlebar[data-variant="tabs"]` |
| `.s4-doc-tabs-list` | The tabs (`role="tablist"`); scrolls sideways when full |
| `.s4-doc-tab` + `.s4-doc-tab-label` | One tab: the label is the `role="tab"` button; `aria-controls` names its panel |
| `data-modified` on a tab | Unsaved changes: the close button is a dot until you point at the tab |
| `.s4-doc-tabs-new` | Your new-tab button (wire it to a command) |
| Added by the script | Each tab's close button, the All Tabs menu button (shown only when the tabs don't fit), the right-click menu (Close, Close Others, Close To The Right, Move Left, Move Right) |
| `data-keys="off"` | This row ignores the window-wide keys |
| Events on `.s4-doc-tabs` | `s4-change { tab, index, panel }`; `s4-close { tab, panel, modified }` before closing (`preventDefault()` keeps it); `s4-reorder { item, from, to }` |
| Script | `S4.docTabs.add(bar, { label, icon, panel, modified, select, next })`, `.select(tab)`, `.close(tab)`, `.reopen(bar)`, `.move(tab, index)`, `.modified(tab, on)`, `.tabs(bar)`, `.current(bar)` |

**Keys and pointer:** click selects, middle-click closes, drag reorders (a finger: hold, then drag). On a tab: Left and
Right (move and select), Home, End, Delete (close), mod+Shift+PageUp / PageDown (move). Anywhere: mod+W closes the
current tab, mod+Shift+T reopens the last closed one, mod+1 to mod+8 pick a tab and mod+9 the last, Ctrl+Tab and
Ctrl+Shift+Tab (or Ctrl+PageDown / PageUp) step through them. A browser keeps mod+W, Ctrl+Tab and mod+1…9 for its own
tabs; in an installed app or a desktop shell they all work, and each has a click or a menu item that does the same.

**Closing unsaved work:** do, then offer the way back (decision 0047): close it and show a snackbar with Reopen
(`S4.docTabs.reopen`), rather than asking first. Keep the unsaved changes with the closed tab.

**Look:** the current tab takes the content's surface (it is the document under it); the others are quiet labels with
the state layer on hover. Corners follow the dial. Labels end in an ellipsis when long (the one place besides the title
bar title where a desktop window cuts text); the full name is in the All Tabs menu. Under 600 wide the row hides: a phone
shows one document at a time. Switching shows the panel at once (no motion: a document is not a view to slide to).

**Do:** show the file's or record's name and an icon of its kind; put a new-tab button at the end. **Don't:** use
document tabs for a fixed set of views; don't nest them; don't close a tab with unsaved work without a way back.

**Accessibility:** tabs pattern with one tab stop; close buttons are out of the tab order (Delete closes); the close
button's name says "unsaved changes" when the dot shows; forced colors give every tab a border.

**Tokens:** `--s4-size-doc-tab`, `--s4-shape-control`, `--md-sys-color-surface` (current tab),
`--md-sys-color-surface-container-low` (the row), label-large type.
