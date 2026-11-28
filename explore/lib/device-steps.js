/* The device checks: the steps only a real phone, a real desktop and a screen reader can show (docs/device-check.md).
   One list per page. A later round edits only this file: change a step, add one, drop one; the pages, the questions
   (registered into window.S4_REVIEW_DEMOS below, so the hub and Copy All see them) and the copied text follow.
   Step: { id, title (Title Case), todo (what to do), look (what should happen), open?: { href (from the repo root), label } }
   Keep an id when a step only changes wording, so answers already saved stay with it; give a new step a new id. */
window.S4_DEVICE_CHECKS = [
  {
    id: 'device-iphone', title: 'iPhone Check', href: 'explore/device-iphone.html',
    intro: 'Hold the phone upright and use Safari. For each step, open the page, try it, then come back here with Back and tap Looks Right or Problem. About 10 minutes.',
    steps: [
      { id: 'showcase', title: 'Open the Showcase', open: { href: 'demo/index.html', label: 'Open the Showcase' },
        todo: 'Open the Showcase and look over the first screen.',
        look: 'The page fits the screen, nothing is cut off on the right, and the text is sharp and in the same font everywhere.' },
      { id: 'glass', title: 'Glass Bars', open: { href: 'demo/index.html#home', label: 'Open Home' },
        todo: 'Scroll the Home view slowly so cards pass under the top bar and the bottom navigation bar.',
        look: 'The bars turn to frosted glass, their text stays easy to read, and the glass edge is a thin line, not a glow or a shadow.' },
      { id: 'navbar', title: 'The Navigation Bar', open: { href: 'demo/index.html', label: 'Open the Showcase' },
        todo: 'Tap each tab in the bar at the bottom.',
        look: 'The highlight moves to the tab you tapped and holds both its icon and label, the screen changes, and nothing jumps.' },
      { id: 'tooltip', title: 'A Tooltip and a Snackbar', open: { href: 'demo/index.html#controls', label: 'Open Controls' },
        todo: 'In Controls, press and hold an icon button until its tip shows. Then open a note on Home and tap Archive, which offers Undo at the bottom.',
        look: 'Both are glass and easy to read, with a soft light inside the edge, not a bright band.' },
      { id: 'dialog', title: 'A Dialog as a Bottom Card', open: { href: 'demo/index.html#settings', label: 'Open Settings' },
        todo: 'In Settings, tap Delete All Notes.',
        look: 'A card rises at the bottom, inset from the edges, its bottom corners follow the phone’s corners, and its buttons fill its width.' },
      { id: 'dialog-close', title: 'Close the Dialog Three Ways', open: { href: 'demo/index.html#settings', label: 'Open Settings' },
        todo: 'Open Delete All Notes again and tap outside it; open it again and swipe it down; open it again and tap Cancel.',
        look: 'Each time it closes, nothing is deleted, and the page behind is where you left it.' },
      { id: 'panel', title: 'A Panel You Can Drag', open: { href: 'demo/index.html#controls', label: 'Open Controls' },
        todo: 'In Controls, open Floating Panel. Drag the small bar at its top down slowly, let go a little way down, then drag further and let go.',
        look: 'The dimming behind follows your finger, a short drag settles back, and a long drag closes the panel.' },
      { id: 'back', title: 'The Back Gesture', open: { href: 'demo/index.html#home', label: 'Open Home' },
        todo: 'Scroll the list a little, open a note, then swipe in from the left edge of the screen to go back.',
        look: 'You are back on the list at the same place, and nothing has a ring or outline around it.' },
      { id: 'voiceover', title: 'VoiceOver on the Showcase', open: { href: 'demo/index.html', label: 'Open the Showcase' },
        todo: 'Turn VoiceOver on (Settings, Accessibility, VoiceOver). Swipe right a few times, then double-tap a tab.',
        look: 'Each control says what it is and its name (“Button”, “Tab, 2 of 4”, “Selected”), nothing is “unlabelled”, and the tab says its new view.' },
      { id: 'voiceover-table', title: 'VoiceOver on a Data Table', open: { href: 'templates/data-table.html', label: 'Open Linnea' },
        todo: 'With VoiceOver still on, swipe right until you reach the records, then double-tap a round checkbox. Turn VoiceOver off afterwards.',
        look: 'Each record reads as one row with its values, and selecting one says it is selected.' },
      { id: 'site', title: 'A Website on the Phone', open: { href: 'templates/landing.html', label: 'Open Sprig' },
        todo: 'Scroll to the bottom and back up, then tap the menu button in the header.',
        look: 'The header turns to glass as you scroll, the menu opens a floating glass panel, pictures are framed drawings, and nothing scrolls sideways.' }
    ]
  },
  {
    id: 'device-desktop', title: 'Desktop Check', href: 'explore/device-desktop.html',
    intro: 'Use your own app built on Orion in its desktop window (Electron or Tauri), or Parley through the Electron example. The window should have no Windows title bar of its own: Orion draws the title bar and its three buttons. About 8 minutes.',
    setup: { text: 'To run Parley in a window: in the repository, open examples/electron, run npm install, then npm start. Steps 5 and 6 also work in a desktop browser.', href: 'https://github.com/4RK0S4H4/Orion/tree/main/examples/electron', label: 'The Electron Example' },
    steps: [
      { id: 'controls', title: 'The Window Buttons',
        todo: 'Look at Minimize, Maximize and Close in the top right corner, then hover each one.',
        look: 'Thin line icons, evenly spaced, the full height of the title bar and touching the window’s top and right edges; a soft gray layer on hover, red only under Close.' },
      { id: 'corner', title: 'The Corner Pixel',
        todo: 'Move the mouse into the very top right corner pixel of the window (against the screen corner when maximized) and click.',
        look: 'The window closes: Close is hit even at the outermost pixel.' },
      { id: 'maximize', title: 'Double-Click To Maximize',
        todo: 'Open the app again and double-click an empty part of the title bar, then double-click again.',
        look: 'The window fills the screen and the middle button becomes Restore; the second double-click brings it back to its size.' },
      { id: 'resize', title: 'Resize From the Top Edge',
        todo: 'With the window not maximized, move the mouse to the top edge above the title until the pointer is a two-way arrow, then drag up and down.',
        look: 'The window resizes; it does not start moving or selecting text.' },
      { id: 'narrator', title: 'Narrator on the Rail', open: { href: 'templates/desktop-app.html', label: 'Open Parley in the Browser' },
        todo: 'Turn Narrator on (Ctrl+Windows+Enter). Press F6 until you reach the side rail, move with the arrow keys or Tab, then press F6 again. Turn Narrator off the same way.',
        look: 'Each place is read with its name and “selected” for the current one, Enter opens it, and the next F6 says you are in the main area.' },
      { id: 'skip', title: 'The Skip Link', open: { href: 'templates/desktop-app.html', label: 'Open Parley in the Browser' },
        todo: 'Reload the app and press Tab once, then press Enter.',
        look: 'A dark “Skip to Content” pill appears in the top left, and after Enter the next Tab lands on something in the main area, not on the rail.' }
    ]
  }
];
/* each check is a review page too: one question per step, answered Looks Right or Problem (a Problem carries its note) */
window.S4_REVIEW_DEMOS = window.S4_REVIEW_DEMOS || [];
window.S4_DEVICE_CHECKS.forEach(function (c) {
  if (window.S4_REVIEW_DEMOS.some(function (d) { return d.id === c.id; })) return;
  window.S4_REVIEW_DEMOS.push({
    id: c.id, title: c.title, href: c.href, unanswered: 'not checked',
    footer: 'Screenshots: attach one for each Problem, with its step number.',
    answersIntro: 'Your answers save on this device as you go. When you are done, copy them and paste them in chat with a screenshot for each Problem.',
    questions: c.steps.map(function (s, i) { return { id: s.id, label: (i + 1) + '. ' + s.title, options: [{ v: 'Looks Right', label: '' }, { v: 'Problem', label: '' }] }; })
  });
});
