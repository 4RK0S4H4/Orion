# 0050: Pages. Going somewhere, with Back, a title and a URL (2026-11-14)

**Status:** built; awaiting the owner's look.

The owner: "I feel like we never switch pages. Like maybe clicking on an email brings you to a reader view."

## Why
Until now an Orion app had top-level views (the navigation's destinations) and things that open over or inside a view
(the placement ladder). Nothing let you **go into** an item and come back. Every app needs that: a message, an order,
a profile, a document, a settings sub-page.

## Decision
A third kind of place, the **page**: a full screen pushed from a view or another page.

| Kind | What it is | How you get there | How you leave |
|---|---|---|---|
| **View** (`.s4-view`) | a top-level destination | the navigation bar or rail | pick another destination |
| **Page** (`.s4-subpage`) | one thing, full screen | `data-page-open`, `S4.pages.open` | Back (bar button, phone gesture, browser), `data-page-back` |
| **In place / overlay** | acting on what you see | the placement ladder (0047) | Escape, Cancel, the action |

What a page always gets (`components/page/`):
- **Back** in the top app bar (added by the script), the browser's and the phone's Back, and Forward.
- **Its own URL**, `#view/page/id`. A link or a reload lands on the page; the page fills itself from the id in `s4-open`.
- **The bar's title** becomes the page's, and returns when you leave.
- **On a phone the bottom navigation steps aside** while a page is open; the side navigation stays on wide screens.
  Tapping the destination you are in goes back to its start.
- **Your scroll position** in the view you left is restored.
- Pages stack. Motion is Switch (forward in, back out). Opening never focuses a field (0049).

The list-detail split on a phone now goes "one level in" through the same machinery (`S4.pages.sub`), so it has the
bar's Back and title and hides the bottom navigation exactly like a page.

## Rule for choosing
Acting on what you are looking at without leaving: the placement ladder. **Going to** a thing you want to read, work
on or link to: a page. Never a dialog for reading.

## Built
`components/page/` (49 -> 50 components), the reference page (a small orders app), a reader page in
`templates/list-detail.html` and `templates/desktop-app.html` (the "Open Full Page" button or a double-click on a
message), and suite coverage (page opens, Back shown, URL set, no field focused, browser Back closes it).
