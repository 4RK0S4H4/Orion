# Round 0056, template identity batch 3: chat, checkout, onboarding (issue 66)

Branch `round56/tpl-b3`. The three templates were stock monochrome Orion with finance and shop content. Each is now a
real product with its own brand set through the dials, its own drawn elements, and real states. All three keep their
archetype, structure comments and behaviours (views, steps, `.s4-form` errors on blur, Undo, done mark, keyboard), pass
the page checker, and pass the suite, reach and layout passes on their own. Each saves its theme under its own key
(`velvet-theme`, `fetch-theme`, `puck-theme`), including in the pre-paint script.

## The three products (so other batches can avoid repeating them)

| Template | Product | Accent and mode | Gray, page, corners | Faces | Other dials |
|---|---|---|---|---|---|
| `checkout.html` | **The Velvet**, a three-screen independent cinema in Leith: seat booking | velvet crimson `#8f1d2c`, variant `fidelity`, neutral | warm, plain, soft | display: a Didone stack (Didot, Bodoni 72, Bodoni MT), text Inter | a scoped **dark auditorium** (`data-theme="dark"`) and a scoped **light code tile** (`data-theme="light"`) |
| `chat.html` | **Fetch**, dog walking in Bristol: the owner chats with their walker | tennis-ball chartreuse `#c8e021`, variant `fidelity`, neutral (dark olive accent in light, the ball itself in dark) | cool, plain, round | display `rounded`, text Inter | `energy: lively`, **Phosphor Bold** icons (`icons-phosphor-bold-duotone.js`) |
| `onboarding.html` | **Puck**, an espresso dial-in coach (first run) | espresso brown `#6f4e37`, variant `fidelity`, **tinted** (latte surfaces) | (tinted), plain, round | display: a humanist stack (Gill Sans, Seravek, Candara), text Inter | **Phosphor Duotone** icons (`icons-phosphor-duotone.js`); app color swatches with `data-variant="fidelity"` |

Kept apart from the taken looks: no other template uses crimson, chartreuse or brown, a Didone or humanist face, or a
Phosphor icon set (the first templates to use the icon set dial). Fetch shares `rounded` + `lively` with Sprig (a site,
tinted leaf green); its neutral cool page, the olive/ball pair and the Phosphor icons keep it apart at a glance.

## What each has that no other has

- **The Velvet (checkout):** the film's **poster set in type** (crimson tile, Didone title, a drawn lighthouse and its
  beam); the showing as an Ink Track (17:40 / 20:15 / 21:50, a value); the **seat plan in a dark auditorium**: a drawn
  screen, rows A to G of ten with an aisle, row H of **sofas for two** (joined pairs, square seam), taken seats smaller
  and dimmer (size, not only color), selected seats in the accent with their number; one tab stop with arrow keys,
  Home and End (RTL aware); **ticket types** (adult, concession, under 15) whose counts follow the seats; the **ticket
  stub** (Admit N, the film in Didone, seat tags, line items, "Booking fee: None, ever", the total counting, notches
  cut in the page's color); a **ten-minute seat hold** (timer text and a progress bar; at zero the seats are let go and a
  snackbar says so); changing the showing **keeps the seats that are free and offers Undo** for the ones it lets go;
  extras as a checkbox fieldset (the new option-group design) that add to the total; a **declined card** state (a card
  ending 0002) that keeps the seats; the **e-ticket** with a door code drawn from the booking reference on a scoped light
  tile (it stays scannable in dark mode) and an **Add To Calendar** `.ics`. Hero notes ("Doors 19:55", bar, step-free)
  join as a third column from 1100.
- **Fetch (chat):** the **live walk card** in the ball's own color (pulsing Out Now dot, three big numbers, a **drawn
  route map** with the walked part solid, the rest dotted and a pulsing "here" marker, progress in words and a bar);
  a **photo drawn from shapes** (the dog with a stick, a ball in the air); the **walk report** (three numbers, "Drank
  Water / Poo Bagged / Played Fetch" pills, Jess's note); **quick replies** (suggestion chips) and **typing dots**
  (Loop) before Jess answers; the **walker and "What Jess Knows" beside the thread from 1100** (sticky); real **Walks**
  and **Biscuit** views (a drawn dog avatar); the bar's subtitle follows the view and Call belongs to the chat only.
- **Puck (onboarding):** a wordmark (a drawn puck); three drawn pictures on a big latte tile with real words over them
  (the **cup with its recipe tags**, the **taste dial** from sour to bitter, the **bag and its freshness weeks**); a
  setup of two button groups (brew method, strength: values) that **work out the starting recipe in place** (dose, yield
  or water, time, a tip), a color for the app, a reminder switch; the done step repeats the recipe. **From 960 each step
  is a split**: the picture on a square tile, the words beside it, the dots and buttons under both.

## Tabs, button groups and chips (decision 0059)
Velvet's showing, Puck's brew method and strength: **button groups** (values). Fetch's quick replies: **suggestion
chips** (actions, many). No tabs: nothing in the batch swaps panels inside a screen (steps and views use their own
patterns).

## Lessons (per template; what was easy, what held back, what to change)

### The Velvet (checkout)
- Easy: `variant: 'fidelity'` gave a true crimson and a soft pink `secondary-container` for the stub; a scoped
  `data-theme="dark"` turned one block into an auditorium with every token right inside it, and a scoped
  `data-theme="light"` made the door code scannable in dark mode: two lines of markup each. `S4.reward.count`,
  `S4.snackbar` with Undo, `.s4-form` and the stepper carried the flow unchanged.
- Held back: (1) **my own headings fall back to the text face**: an `h2` I style is Inter unless I set
  `font-family: var(--md-sys-typescale-…-font)` myself; the display dial only reaches Orion's classes. *Small, do next*:
  a short note in the skill ("own headings take the typescale font token, or a `.s4-headline-*` class"). (2) **The suite's
  24px touch target is right but tight for a seat plan**: ten seats and an aisle fit at 390 only after trimming the
  room's padding. *Needs the owner* if dense pickers (seats, keys, calendar cells) should get the WCAG spacing exception
  (24px pitch) instead of a 24px box. (3) No **number stepper** component (− count +); I used tonal icon buttons with
  glyphs. *Small, do next*: a `.s4-stepper-input` (or number field variant) with `−`/`+` icons; there is no `remove`
  (minus) icon in the vocabulary either. (4) A **ticket shape** (notches) needs the page color by hand; fine as an app
  element.
### Fetch (chat)
- Easy: the icon set dial is one script tag (load the one-set file instead of `icons.js`), no flash; `fidelity` on a
  bright seed gives two very different but both on-brand accents (olive in light, the ball in dark) with contrast proved;
  suggestion chips, avatars and panes dropped in.
- Held back: (1) **No Loop cycle token for apps**: every Loop duration lived inside a component, so a live dot or
  typing dots could not be written without a raw `ms`. *Fixed in this branch*: `--s4-loop-cycle` (1600ms) in
  `components/motion/motion.css`, named in `docs/foundations/motion.md`; `check:motion` accepts it as a Loop cycle.
  (2) **The thread has no rich-message slot**: cards in the thread (live walk, report) are my own `li`s; the bubble
  only knows text and prose. *Small, do next*: document "any `li` in `.s4-thread` that is not a message is a card; align
  it start" or add `.s4-message[data-kind="card"]`. (3) **The layout test's title rule caught hero numbers** in a pane
  (the month's stats); `data-hero` on the `dl` is the documented escape, fine but easy to miss. (4) The top app bar title
  must come first for the align check, so a leading avatar in a chat bar fails it; I left the avatar to the side pane.
  *Small, do next*: let the align check accept a leading `.s4-avatar` as the bar's first thing.
### Puck (onboarding)
- Easy: tinted + fidelity from a brown made every surface latte and every control coffee with one call; the swatches
  already honour `data-variant`, so the app color picker keeps fidelity; button groups computed the recipe with two
  `s4-change` listeners.
- Held back: (1) **Swatches read `data-variant` but the README does not say so**; without it a brown or caramel turns
  orange. *Small, do next*: document `data-variant` on `.s4-swatches` and default it to the page's variant. (2) Drawings
  with **words over them** need absolute positions by hand (tags around the cup); `inset-inline` keeps them RTL-safe but a
  centered tag cannot use `translate` (not logical). (3) A **split onboarding** at desktop is my own layout; nothing in
  Orion says "one-task screen, two columns from 960". *Small, do next*: a pattern note in `references/patterns.md`.
### Across the batch
- Never restyled a component by class; every own element is a new `vl-`, `ft-` or `pk-` class drawn from tokens.
- Seven icons added through `scripts/add-icons.mjs` (all three sets): `ticket`, `pet`, `coffee`, `seat`, `route`,
  `timer`, `water`. `skill/s4-orion/references/icons.md` is generated.
- `fidelity` again: every muted or very bright brand seed in this batch needed it (crimson, chartreuse, brown). Second
  batch to say it: *small, do next*: pick `fidelity` by default when a seed is given without a variant in neutral mode,
  or at least name it in the dial table.
- Custom faces were seen here only as fallbacks (DejaVu Serif for Didot, DejaVu Sans for Gill Sans and SF Rounded).

## Tests changed (and why)
None. Two targeted findings were fixed in the pages: the seat that holds the plan's tab stop was 23.9px wide at 390
(padding trimmed), and a `transform` transition on a seat was off the State pattern (removed).

## Changelog lines
- Changed: the chat, checkout and onboarding templates are now Fetch (dog walking chat), The Velvet (cinema seat
  booking) and Puck (espresso coach first run), each with its own dials, drawings and states.
- Added: `--s4-loop-cycle`, one Loop cycle for an app's own repeating motion (live dots, typing dots).
- Added: icons `ticket`, `pet`, `coffee`, `seat`, `route`, `timer`, `water` (Solar and both Phosphor sets).

## For the skill
- Own headings take `font-family: var(--md-sys-typescale-<role>-font)` (or a type class), or the display dial misses them.
- A live dot or typing indicator is Loop: `animation: <name> var(--s4-loop-cycle) var(--s4-motion-loop) infinite`, off
  under reduced motion.
- Scoped `data-theme="light"` for anything that must stay dark-on-light (a scannable code); `data-theme="dark"` for a
  room (an auditorium, a booth).
- The icon set dial: load `icons-phosphor-duotone.js` or `icons-phosphor-bold-duotone.js` instead of `icons.js`.

## Hub links
`templates/index.html`: subheads and blurbs for Chat (Fetch), Checkout (The Velvet), Onboarding (Puck).

## For the owner, on a real iPhone
Didot on The Velvet, SF Rounded on Fetch and Gill Sans / Seravek on Puck (only seen here as fallbacks); the seat plan's
tap targets at 390 (about 25px each, 29px pitch); the first paint is monochrome for a moment before each accent arrives
(the known lesson from batch 4).
