# Pages

Going somewhere: a full screen you push into from a view or from another page, with Back in the top app bar, its own
title, its own URL and the phone's Back gesture. Use it whenever a thing deserves the whole screen: reading a message,
an order, a profile, a document, a step-by-step task.

```html
<main class="s4-content">
  <section class="s4-view" data-view="inbox" data-title="Inbox">
    <button class="s4-list-item" data-page-open="message" data-page-id="42" data-page-title="Maya Chen">…</button>
  </section>
  <section class="s4-subpage" data-page="message" data-title="Message" hidden>
    <header class="s4-subpage-header">
      <h2 class="s4-subpage-title">Invoice for October</h2>
      <div class="s4-subpage-meta"><span>Maya Chen</span><span>9:41</span></div>
    </header>
    …
  </section>
</main>
```

| Attribute | On | What |
|---|---|---|
| `data-page="name"` | `.s4-subpage` | the page's name (a sibling of the `.s4-view`s, starts `hidden`) |
| `data-title` | `.s4-subpage` | the top app bar title while it is open |
| `data-page-open="name"` | any control | opens that page; `data-page-id` and `data-page-title` say which item and what to call it |
| `data-page-back` | any control | goes back one level (the top app bar's Back button is added for you) |
| `data-detail-title` | `.s4-split` | the bar title when the split shows its detail on a phone (it goes one level in the same way) |

Script: `S4.pages.open(app, name, { id, title })`, `S4.pages.back(app)`, `S4.pages.home(app)` (all the way out),
`S4.pages.current(app)` gives `{ name, id }` or `null`. The page fires `s4-open { id, from }` just before it shows:
fill it from your data there. It fires `s4-close` when left.

**What it does for you**
- **Back, three ways:** the bar's Back button, the phone's Back gesture or the browser's Back button, and
  `data-page-back`. Forward works too.
- **A URL per page:** `#inbox/message/42`. Opening or reloading that link lands on the page; Back returns to its view.
- **The bar follows:** Back appears, the title becomes the page's, and both return when you leave.
- **On a phone the bottom navigation steps aside** while a page is open (a pushed page is not a destination). The
  side navigation stays on wide screens. Tapping the destination you are in takes you back to its start.
- **Your place is kept:** the view you left is scrolled back to where you were (once it shows again), and focus returns
  to the item that opened the page, or to the view itself if that item is gone. Focus never drops to `<body>` (decision 0065).
- **Pages can stack:** a page can open another page.

**When to use what (where things open)**
1. In place, an expand, a menu, a pane, a floating panel, a dialog: the placement ladder (see [expand](../expand/)) is
   for acting on what you are looking at **without leaving**.
2. **A page** is for **going to** something: you want to read it, work on it or come back to it later by link.
3. **A view** (`.s4-view` + the navigation) is a top-level destination of the app.

On a wide screen a list with a detail pane (`.s4-split`) shows both; give the detail an "Open Full Page" button for
focused reading. On a phone the split already behaves like a page.

**Do**
- Give every page a clear title and, when it shows one item, an id, so its link can be shared.
- Fill the page in `s4-open`, from the id: a reload must show the same thing.
- Keep the page's main actions at its end or in the top app bar's actions.

**Don't**
- Don't open a page for a quick answer or a short form: that is the placement ladder.
- Don't put top-level destinations on a page; don't hide Back.
- Don't focus a field when a page opens (decision 0049).

**Accessibility:** the page takes focus when it opens (so a screen reader starts there) and focus is never moved into
a field. Back is a real button named "Back". The URL changes, so browser history, reload and sharing work.

**Motion:** Switch: forward going in, back coming out.

**Tokens:** type scale `headline-medium`, `body-medium`; `on-surface`, `on-surface-variant`; spacing `--s4-space-*`.
