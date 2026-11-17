# Motion

**One page, ten named patterns** (decision [0046](../decisions/0046-one-motion-philosophy.md)). Every transition and
animation in S4 Orion is one of the patterns below. Nothing else may set a duration or an easing: `npm run check:motion`
rejects it. Live, with the scrubber: [motion page](https://4rk0s4h4.github.io/s4-orion/components/motion/motion.html).

## The philosophy

1. **Motion says what happened, nothing more.** A thing moves because it changed state, arrived, left or went
   somewhere. No motion for decoration.
2. **Subtle but liquid.** Quick enough to never be in the way, never instant. The small interesting moments (a fill
   that flows, an icon that bends into the next one) belong to **ink**, the solid fills that show state.
3. **Glass moves plainly.** Glass and other surfaces only move a few pixels and fade. They never stretch, scale,
   change shape or slide in from a screen edge.
4. **What you touched answers where you touched it.** A control changes in place; new content opens where you asked
   for it and pushes its neighbors away (reveal) before anything is allowed to float over the page.
5. **One pattern per situation, the same everywhere.** If two things do the same job, they move the same way. A new
   component picks a pattern from the table; it never invents one.
6. **Sturdy.** One transition per element at a time (a new one starts from where the old one was). Nothing is cloned.
   Under reduced motion everything that moves takes 0ms and only fades remain.

## The patterns

| | Pattern | When | What moves | How to use it |
|---|---|---|---|---|
| **In place** | **State** | A control answers: hover, press, focus, selected, disabled | Color, opacity, shadow. 90ms, no overshoot | `--s4-motion-state` |
| | **Ink** | A state fill moves or grows: nav and tab pill, the button group's ink (front edge on Ink, back edge on calm Ink), switch handle, check and radio fill, slider label, the row lean | Position and size of the fill. 250ms, a subtle liquid overshoot | `--s4-motion-ink`; `--s4-motion-ink-calm` when it must land exactly (progress fills, ink leaving) |
| | **Morph** | A control changes its own shape or size: press to square, a segment widening, the FAB's label, the rail's edge | Corner, padding, width. 220ms, a small overshoot | `--s4-motion-morph`; `--s4-motion-morph-calm` when it must land exactly (the rail, rows after a sort: `S4.transition.move(el, dx, dy)`) |
| | **Bend** | An icon turns into its next state: chevrons, sort arrows | The icon turns over. 200ms | `--s4-motion-bend` |
| **Appear** | **Reveal** | Content opens in the page, where you asked for it: accordion, inline expand, a composer under a message, a row's details | The box grows on a calm 300ms spring and pushes what is below; what is inside fades in just behind, rising 4px | `S4.transition.reveal(el, { open })` (the script sizes the box); `--s4-motion-reveal-content` for the fade without script |
| | **Follow** | Anchored glass: menus, selects, the date picker | The glass fades in where it sits (never out of the button); its items follow one after another, each rising 4px | `S4.transition.follow(menu, { open })` |
| | **Pop** | Floating glass that takes over: dialogs, floating panels | Rises 16px and fades in; leaves with a quick 8px drop and fade. The page behind dims with `S4.transition.scrim(dialog, open)` | `S4.transition.pop(el, { open })` |
| | **Rise** | A notice arrives: snackbars, a new message; tooltips are the small rise | Rises 14px (tooltips 4px) and fades in | `S4.transition.rise(el, { open })`, `S4.transition.tip(el, { open })` |
| **Change view** | **Switch** | Sibling views: tabs, destinations, steps, a pane on a phone, the next month | The old view slides 30px away and fades, the new one comes in from the side you are heading | `S4.transition.sharedAxis(from, to, dir)`; one view on its own: `S4.transition.enter(view, dir)` |
| **Wait** | **Loop** | Loading: skeleton wave, progress | The only motion that repeats. One slow cycle; still under reduced motion | `animation: <name> var(--s4-…-cycle) var(--s4-motion-loop) infinite` |

A plain fade with no movement (`S4.transition.fade(el, open)`) is State applied to something that appears, such as
a scrim.

**Picking one:** did a control change (State, Ink, Morph, Bend)? Did something new show up (Reveal in the page, Follow
if it hangs from a control, Pop if it must take over, Rise if it is a notice)? Did the view change (Switch)? Is the app
waiting (Loop)? Where new content should go is the placement ladder (decision 0047): in place first.

## In CSS

A pattern token is a `<duration> <easing>` pair:

```css
transition: transform var(--s4-motion-ink), background-color var(--s4-motion-state);
```

Each pattern only takes the properties it is for (State: colors, opacity, shadow; Ink: transform, position, size of a
fill; Morph: corners, padding, width; Bend: transform). Never `transition: all`, never a raw duration,
`cubic-bezier()` or a spring token in a component. Don't add a reduced-motion query: the tokens handle it.

## In script

Components never call `element.animate()` or pick a spring. They call the pattern: `S4.transition.reveal`,
`S4.transition.follow`, `S4.transition.pop`, `S4.transition.scrim`, `S4.transition.rise`, `S4.transition.tip`,
`S4.transition.sharedAxis`, `S4.transition.enter`, `S4.transition.move`, `S4.transition.fade`. Each returns a Promise
(true when it finished, false when a newer transition replaced it); after hiding something that closed, call
`S4.transition.restore(el)`. Old names (`drop`, `slide`, `containerTransform`, `unfold`) still work.

## The springs underneath

Patterns are built from springs stored as physics (stiffness, damping, duration) in `tokens/src/motion.tokens.json`;
the build samples each into a CSS `linear()` easing (`--md-sys-motion-spring-*`, `--s4-motion-spring-*`). Spatial
springs may overshoot a little; effects springs never do, so a color never passes its target. Only
`components/motion/` uses springs directly. To retune a pattern, change its line in `components/motion/motion.css` or
its function in `motion.js`: every component follows.

## Never

- Scale a surface or its content to make it appear, or grow it out of a button (it stretches text).
- Slide anything in from a screen edge, or dock it (decision 0043).
- Animate clip-path, blur or backdrop-filter; clone an element to animate it.
- Use liquid motion (overshoot, leading and trailing edges) on glass: it is for ink only (decision 0042).
- Run two transitions on one element, or a transition longer than 300ms outside Loop.

## Energy
`data-energy="calm|standard|lively"` on `<html>` or any container (or `S4.theme({ energy })`) changes the amounts of
the patterns, never the patterns. **Calm**: Ink, Morph, Bend, Pop, Rise and Switch take critically damped springs that
are a little quicker (`*-calm`, no overshoot) and surfaces travel 60% as far. **Lively**: Ink, Morph, Bend, Pop and Rise
only take `*-lively` springs with a little more overshoot (7% at most) and Pop and Rise travel 25% further. State,
Reveal, Loop and the `-calm` patterns never change. Reduced motion still wins: every energy spring is 0ms under it.
CSS gets the energy through the pattern tokens (`motion.css`), script through `S4.transition.*` (`S4.transition.energy(el)`
reports it); `npm run check:motion` checks the bounds.
