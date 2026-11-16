# 0053: The app is the app; four components the tracker needed; long swipe (2026-11-15)

**Status:** the owner's notes on the first degree tracker mockup; built. Needs the owner's look.

## 1. The app is the app
The owner, on the first mockup (which had swapped the tracker's calendar for a column chart and its own elements for
the nearest stock component): "I'd prefer a 1:1 adaptation for most elements, like I saw the calendar was gone. I want
this design language to be a general philosophy as well to where the app is the app and whatever components are needed
for the app can be created using Orion, and not the app being made based on existing components." And: "when I say
1:1, I don't mean fully, I just mean make a mixture but look at some custom elements and try to make those in our
style."

**Rule:** Orion is a language, not a kit of parts. An app is designed from what it does; Orion is how it is drawn.

- **Adapting an existing app keeps the app.** Its screens, its order of things and its own elements stay. Each
  element is redrawn in Orion's language. Nothing is dropped, and nothing is swapped for a stock component because
  one happened to be on the shelf.
- **A mixture, not a copy.** Where Orion already says how a thing is done (navigation, lists, forms, the placement
  ladder, Undo, no auto-focus), the app takes Orion's way. Where the app has something of its own, it is kept and
  drawn in Orion's style.
- **When the app needs an element Orion does not have, make it,** from Orion's rules: tokens only, filled never
  outlined, round and concentric, one of the ten motion patterns or none, text always beside the picture, both color
  modes, 390px. Start it in the app's own stylesheet. It moves into `components/` when it is general (a second app
  would want it).
- **Do not bend the app to a component.** A chart is not a calendar; a stepper is not a road. If the nearest
  component changes what the element says, it is the wrong component.

## 2. Four components, made the way the rule says
The tracker's own elements, drawn "in our language's style for these kinds of things" and general enough to ship:

| Component | What it is | Orion's way of drawing it |
|---|---|---|
| `.s4-ring` | one share of a whole, the value written in the middle | the circular progress grown up: thick round-capped arc, a gap, the track; no marker dot on it |
| `.s4-milestones` | a road of steps with a marker where you are | one pill per step, 4dp apart; the marker is the upright M3 Expressive slider handle, not a pin or a ring |
| `.s4-month` | a month you read, with marks on days | four filled marks: today (accent circle), dot (something happens), band (a stretch; days in a row join into one capsule), flag (the day not to miss). No outlines, no hatching. The key is part of it. |
| `.s4-timeline` | when each thing happens along one span | rows sharing one track; done is quiet, current is the accent; dates always written |

`data-ink="current"` on the ring and the milestones draws them in the text color, for colored surfaces (the hero).
None of the four animates except the ring's arc (Ink). 61 components.

## 3. Long swipe (issue 48)
The owner: "swiping a row works mostly, but long swiping is not working." Two causes: the row moved with resistance
past its actions, so the finger could not reach the threshold; and the click that runs the main action was swallowed
by the guard that stops a drag from clicking. Now the row follows the finger all the way; past the point of no return
the action color fills the row and only the main action stays (with a tick on phones that can); letting go there runs
it. Letting go before that leaves the actions open, as before.

## Built
- `components/ring|milestones|month|timeline/` (css, js, README, reference page), in the bundle, gallery and skill.
- `explore/degree-tracker.html` rebuilt as the mixture: the tracker's screens (Today, Courses, Schedule, the stage
  switch, a course, degree progress, settings behind the button in the bar) and its elements (hero with ring, days,
  pace pill and road; behind-plan notice with Re-Plan; due list; Busy Today; pace and streak; current course; up
  next; filters, Edit Order, Add Course; the plan calendar with its key; course timeline; busy days; Mark Course
  Complete; Life Happened), tinted, invented data only.
- `components/direct/`: long swipe.

## Closed (2026-11-16)
- The owner confirmed the long swipe works on the iPhone.
- The owner approved the mockup ("Looks great") and will do the tracker's redesign in that repo themselves; the
  mockup stays here as the example of the rule.
