# States

Every list, table and pane has a designed **loading, empty, error and offline** state, so an app never shows a blank
box. One container holds a part per state; the script shows the right one.

```html
<div class="s4-states" data-state="loading">
  <div data-when="loading" data-rows="4"></div>
  <div data-when="offline" class="s4-banner" role="status">…You’re offline…</div>
  <ul data-when="ready offline" class="s4-list">…</ul>
  <div data-when="empty" class="s4-empty">…All Caught Up…</div>
  <div data-when="error" class="s4-empty">…Couldn’t Load… <button class="s4-button" data-variant="tonal" data-retry>Try Again</button></div>
</div>
```

| Attribute | On | What |
|---|---|---|
| `data-state` | `.s4-states` | `loading`, `ready`, `empty`, `error`, `offline` (or any name of your own) |
| `data-when="a b"` | a direct child | the state or states this part belongs to |
| `data-rows="4"` | the loading part, left empty | draws that many skeleton rows |
| `data-retry` | a button | fires `s4-retry` on the container |
| `data-offline="auto"` | `.s4-states` | shows the offline parts while the device is offline |

Script: `S4.states.set(el, 'ready')`, `S4.states.get(el)`, and `S4.states.load(el, promise)`: loading while the
promise runs, then `ready`, `empty` when it resolves to `[]` or `{ empty: true }`, `error` when it rejects.
Event: `s4-state { state, previous }`.

**When to use what**
- **Loading:** skeleton rows shaped like the content (never a spinner on an empty page). Under about 300ms show nothing.
- **Empty:** say what will appear here and offer the action that fills it.
- **Error:** say what failed in plain words and offer Try Again. Never a dialog for an error you can retry.
- **Offline:** keep showing what was loaded, with a banner that says changes are kept and sent later.

**Do** keep the container the same size across states where you can, so the page does not jump.
**Don't** blank the content while refreshing something already shown: keep it and show a small progress bar.

**Accessibility:** `aria-busy` while loading; the container is a polite live region, so the new state is announced.
**Motion:** State (the arriving part fades in). **Tokens:** skeleton, empty state and banner tokens; `--s4-space-*`.
