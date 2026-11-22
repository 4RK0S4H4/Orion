/* Orion Showcase: app glue. Components are wired by orion.js; this file only adds the demo's small behaviors. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* Home: the chips filter the list by tag (search is wired by orion.js via data-filter) */
  $('#note-filters').addEventListener('s4-change', function (e) {
    var chip = e.detail.chip || $('#note-filters [aria-pressed="true"]');
    var f = chip && chip.dataset.filterValue || 'all';
    $$('#note-list > li[data-tag]').forEach(function (li) { li.hidden = f !== 'all' && li.dataset.tag !== f; });
  });

  /* Snackbars, menus, dialogs */
  $('#snack-btn').addEventListener('click', function () { S4.snackbar({ text: 'Note archived', action: 'Undo', onAction: function () { S4.snackbar('Restored'); } }); });
  $('#notify-btn').addEventListener('click', function () { S4.snackbar({ text: '3 new mentions', action: 'View' }); });
  $('#more-menu').addEventListener('s4-select', function (e) { S4.snackbar(e.detail.item.textContent.trim() + ' selected'); });
  $('#account-menu').addEventListener('s4-select', function (e) { $('#account-value').textContent = e.detail.item.dataset.value; });
  /* New Note opens in place at the top of Home (decision 0047); from another view, go Home first */
  $('#new-note-form').addEventListener('submit', function (e) { e.preventDefault(); S4.expand.close('new-note', 'save'); e.target.reset(); S4.snackbar({ text: 'Note saved', action: 'Undo' }); });
  $$('[data-expand="new-note"][data-go]').forEach(function (b) { b.addEventListener('click', function () { var home = $('.s4-nav-item[data-view="home"]'); if (home && !home.hasAttribute('aria-current')) { home.click(); } }, true); });
  $('#share-note').addEventListener('s4-close', function (e) { if (e.detail.value === 'share') S4.snackbar('Note shared'); });
  $('#demo-comment').addEventListener('s4-close', function (e) { if (e.detail.value === 'post') S4.snackbar('Comment posted'); });
  $('#demo-confirm').addEventListener('s4-close', function (e) { if (e.detail.value === 'remove') S4.snackbar({ text: 'Tag removed', action: 'Undo' }); });
  $('#confirm-delete').addEventListener('s4-close', function (e) { if (e.detail.value === 'delete') S4.snackbar('All notes deleted'); });

  var app = $('.s4-app');

  /* Home: the notes load (a list always has its states, decision 0051); Try Again loads them again */
  var noteStates = $('#note-states');
  function loadNotes() { S4.states.set(noteStates, 'loading'); setTimeout(function () { S4.states.set(noteStates, $$('#note-list > li:not([data-archived])').length ? 'ready' : 'empty'); }, 450); }
  noteStates.addEventListener('s4-retry', loadNotes);
  loadNotes();

  /* archive: a swipe, a note's page or several picked at once; it happens at once and offers Undo (decision 0047) */
  function archive(lis) {
    lis.forEach(function (li) { li.hidden = true; li.setAttribute('data-archived', ''); });
    if (!$$('#note-list > li:not([data-archived])').length) S4.states.set(noteStates, 'empty');
    S4.snackbar({ text: lis.length === 1 ? 'Note archived' : lis.length + ' notes archived', action: 'Undo', onAction: function () {
      lis.forEach(function (li) { li.hidden = false; li.removeAttribute('data-archived'); }); S4.states.set(noteStates, 'ready');
    } });
  }
  $('#note-list').addEventListener('click', function (e) {
    var b = e.target.closest('[data-archive]'); if (!b) return;
    e.stopPropagation(); var li = b.closest('li'); S4.swipe.close(li); archive([li]);
  });
  $('#archive-selected').addEventListener('click', function () { var items = S4.selection.items($('#note-list')); S4.selection.clear($('#note-list')); archive(items); });
  $('#star-selected').addEventListener('click', function () { var n = S4.selection.items($('#note-list')).length; S4.selection.clear($('#note-list')); S4.snackbar({ text: n === 1 ? 'Note starred' : n + ' notes starred', action: 'Undo' }); });

  /* a note, as a page: filled from its id on s4-open, so a link or a reload shows the same note */
  var FOLDERS = ['Work', 'Personal', 'Travel', 'Recipes', 'Reading'], PEOPLE = ['Maya Chen', 'Jonas Weber', 'Priya Nair', 'Sam Ortiz', 'Lena Fischer', 'Ade Okafor'];
  var NOTES = {
    'design-review': { title: 'Design review notes', by: 'Maya Chen', when: 'Today', folder: 'Work', tags: ['Design', 'Team'], body: ['The new onboarding reads well on a phone. Two screens can go: the welcome carousel and the permissions explainer, which repeats what the system prompt already says.', 'Open questions: does the empty state need an illustration, and who owns the copy for the error states?', 'Next review is Thursday at ten. Bring the prototype with real notes in it, not placeholder text.'] },
    trip: { title: 'Trip itinerary', by: 'Jonas Weber', when: 'Yesterday', folder: 'Travel', tags: ['Travel'], body: ['Fly out Friday evening, train to the coast on Saturday morning. The guesthouse holds the room until nine.', 'Sunday is the long walk: start early, lunch at the harbour, back by the last bus at 17:40.'] },
    launch: { title: 'Launch checklist', by: 'Priya Nair', when: 'Monday', folder: 'Work', tags: ['Launch', 'Team'], body: ['Store listing, screenshots in both color modes, release notes in plain words.', 'Support has the FAQ; the status page is ready; the rollback plan is written down and tested once.'] },
    budget: { title: 'Budget draft', by: 'Sam Ortiz', when: 'Sunday', folder: 'Personal', tags: ['Money'], body: ['Rent and bills first, then savings on payday, then everything else. The holiday fund is at 60% of the goal.'] },
    photos: { title: 'Photo album', by: 'Lena Fischer', when: 'Oct 28', folder: 'Personal', tags: ['Family', 'Photos'], body: ['Pick forty from the summer, print the best twelve. Ask Grandma which ones she wants framed.'] },
    weekend: { title: 'Weekend Plans', by: 'You', when: 'Today', folder: 'Personal', tags: ['Home'], body: ['Fix the shelf, return the library books, call Mum about Sunday lunch.'] },
    reading: { title: 'Reading List', by: 'You', when: 'This week', folder: 'Reading', tags: ['Reading'], body: ['Nine articles saved this week: three on city gardens, two on sleep, four you will probably never open.'] }
  };
  var libRows = [];
  function noteFor(id) {
    if (NOTES[id]) return NOTES[id];
    var r = libRows.filter(function (x) { return x.id === id; })[0];
    if (!r) return { title: 'Note', by: 'You', when: '', folder: 'Personal', tags: [], body: ['This note was not found. It may have been archived.'] };
    return { title: r.title, by: r.author, when: new Date(r.updated).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }), folder: r.folder, tags: [r.folder], words: r.words, body: ['A note in ' + r.folder + ', ' + r.words.toLocaleString() + ' words long. Its text would be here.'] };
  }
  function esc(t) { var d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
  var openNote = null;
  $('[data-page="note"]').addEventListener('s4-open', function (e) {
    var n = noteFor(e.detail.id); openNote = e.detail.id;
    $('#note-title').textContent = n.title; $('#note-by').textContent = n.by; $('#note-when').textContent = n.when;
    $('#note-body').innerHTML = n.body.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');
    var words = n.words || n.body.join(' ').split(/\s+/).length;
    $('#note-facts').innerHTML = '<div class="s4-dl-row"><dt>Folder</dt><dd>' + esc(n.folder) + '</dd></div><div class="s4-dl-row"><dt>Words</dt><dd>' + words.toLocaleString() + '</dd></div><div class="s4-dl-row"><dt>Written By</dt><dd>' + esc(n.by) + '</dd></div>';
    $('#note-tags').innerHTML = n.tags.map(function (t) { return '<span class="s4-chip" data-type="assist">' + esc(t) + '</span>'; }).join('');
  });
  $('#note-archive').addEventListener('click', function () {
    var li = openNote && $('#note-list button[data-page-id="' + openNote + '"]'); li = li && li.closest('li');
    S4.pages.back(app);
    if (li) archive([li]); else S4.snackbar({ text: 'Note archived', action: 'Undo' });
  });

  /* All Notes: 480 notes in a table at scale, narrowed by the filter pattern (decision 0061) */
  (function () {
    var seed = 7; function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    var A = ['Weekly', 'Quick', 'Rough', 'Final', 'Shared', 'Late night', 'Morning', 'Draft', 'Second', 'Old'];
    var B = ['meeting notes', 'packing list', 'reading notes', 'recipe', 'gift ideas', 'plan', 'checklist', 'letter', 'shopping list', 'outline', 'journal', 'idea'];
    var start = Date.UTC(2024, 0, 1), span = Date.UTC(2026, 10, 20) - start;
    for (var i = 0; i < 480; i++) {
      libRows.push({ id: 'n' + (i + 1), title: A[Math.floor(rnd() * A.length)] + ' ' + B[Math.floor(rnd() * B.length)], folder: FOLDERS[Math.floor(rnd() * FOLDERS.length)],
        author: PEOPLE[Math.floor(rnd() * PEOPLE.length)], words: 40 + Math.floor(rnd() * rnd() * 2900), updated: new Date(start + Math.floor(rnd() * span)).toISOString().slice(0, 10) });
    }
  })();
  var libTable = S4.table($('#lib-table'), {
    noun: 'note', nouns: 'notes',
    cell: { title: function (v, r) { return '<button type="button" class="s4-table-link" data-page-open="note" data-page-id="' + esc(r.id) + '" data-page-title="' + esc(v) + '">' + esc(v) + '</button>'; } }
  });
  var libStates = $('#lib-states'), libFilter = null;
  function loadLibrary() {
    S4.states.set(libStates, 'loading');
    setTimeout(function () {
      libTable.setRows(libRows);
      if (!libFilter) libFilter = S4.filter($('#lib-filter'), {
        noun: 'note', nouns: 'notes', searchFields: ['title', 'folder', 'author'],
        facets: [
          { field: 'folder', label: 'Folder', type: 'choice', icon: 'folder' },
          { field: 'author', label: 'Written By', type: 'choice', icon: 'person' },
          { field: 'words', label: 'Words', type: 'range', icon: 'document', min: 0, max: 3000, grouping: false }
        ],
        views: [
          { id: 'all', name: 'All Notes' },
          { id: 'work', name: 'Work', state: { f: { folder: ['Work'] } } },
          { id: 'long', name: 'Long Reads', state: { f: { words: { min: 1500, max: 3000 } }, sort: { field: 'words', dir: 'descending' } } }
        ]
      });
    }, 450);
  }
  var libLoaded = false;
  $('[data-page="library"]').addEventListener('s4-open', function () { if (!libLoaded) { libLoaded = true; loadLibrary(); } });
  libStates.addEventListener('s4-retry', loadLibrary);
  $('#lib-states [data-filter-clear]').addEventListener('click', function () { if (libFilter) libFilter.clear(); });

  /* Board: Add Project puts a card in that lane (the field was never focused for the person, decision 0049) */
  $('#demo-board').addEventListener('s4-lane-add', function (e) {
    var li = document.createElement('li'); li.className = 'demo-card'; li.setAttribute('data-reorder-surface', '');
    li.innerHTML = '<button class="demo-card-title" type="button" data-page-open="note" data-page-id="new" data-page-title="' + esc(e.detail.value) + '" data-reorder-label>' + esc(e.detail.value) + '</button><span class="demo-card-meta"><span>You</span><span>Just now</span></span>';
    e.detail.list.appendChild(li);
    S4.snackbar({ text: e.detail.value + ' added', action: 'Undo', onAction: function () { li.remove(); } });
  });
  $('#demo-board').addEventListener('s4-reorder', function (e) {
    var to = e.detail.toList && e.detail.toList.getAttribute('aria-label');
    if (e.detail.toList && e.detail.toList !== e.detail.fromList) S4.snackbar({ text: 'Moved to ' + to, action: 'Undo', onAction: function () { S4.reorder.move(e.detail.item, e.detail.from, e.detail.fromList); } });
  });

  /* the command palette (mod+K): the app's real actions, named like its buttons */
  S4.palette.register([
    { label: 'New Note', group: 'Notes', icon: 'add', shortcut: 'mod+alt+n', run: function () { if (S4.pages.current(app)) S4.pages.home(app); var h = $('.s4-nav-item[data-view="home"]'); if (!h.hasAttribute('aria-current')) h.click(); S4.expand.open('new-note'); } },
    { label: 'Open All Notes', group: 'Notes', icon: 'list', keywords: 'library table archive', run: function () { S4.pages.open(app, 'library', { title: 'All Notes' }); } },
    { label: 'Share Note', group: 'Notes', icon: 'share', run: function () { S4.sheet.open('share-note'); } },
    { label: 'Delete All Notes', group: 'Notes', icon: 'delete', keywords: 'erase remove', run: function () { S4.dialog.open('confirm-delete'); } }
  ]);

  /* Settings: icon set (S4.icon.use switches every icon; the choice is remembered) */
  var CREDITS = { solar: 'Solar icons by 480 Design (CC BY 4.0)', 'phosphor-duotone': 'Phosphor Icons (MIT)', 'phosphor-bold-duotone': 'Phosphor Icons (MIT)' };
  function showIconSet() {
    var id = S4.icon.use();
    $$('#icon-set [value]').forEach(function (b) { b.setAttribute('aria-pressed', b.value === id); });
    $('#icon-credit').textContent = CREDITS[id] || '';
  }
  $('#icon-set').addEventListener('s4-change', function (e) { S4.icon.use(e.detail.value, { save: 'orion-showcase-icons' }); showIconSet(); });
  showIconSet();

  /* Settings: theme controls (patterns.md) */
  $('#mode').addEventListener('s4-change', function (e) { S4.theme({ mode: e.detail.value }); });
  $('#contrast').addEventListener('s4-change', function (e) { S4.theme({ contrast: +e.detail.value }); });
  /* decision 0052: off = neutral surfaces with the color as an accent; on = every surface takes the color (M3 Expressive) */
  $('#tinted').addEventListener('change', function () { S4.theme({ surfaces: this.checked ? 'tinted' : 'neutral' }); });
  /* the brand dials (decision 0055): data-brand-dial groups set and follow S4.theme by themselves (swatches.js, theme-controls) */
  /* themes on any container (issue 52): the navigation alone in dark mode, whatever the page is in */
  function darkNav(on) {
    $$('.s4-nav-rail, .s4-nav-bar').forEach(function (n) { S4.theme({ mode: on ? 'dark' : null }, n); });
    try { localStorage.setItem('orion-showcase-dark-nav', on ? '1' : ''); } catch (e) {}
  }
  var navOn = false; try { navOn = localStorage.getItem('orion-showcase-dark-nav') === '1'; } catch (e) {}
  $('#dark-nav').checked = navOn; if (navOn) darkNav(true);
  $('#dark-nav').addEventListener('change', function () { darkNav(this.checked); });
  var t = S4.theme();
  $('#tinted').checked = t.surfaces === 'tinted';
  $$('#mode [value]').forEach(function (b) { b.setAttribute('aria-pressed', b.value === t.mode); });
  $$('#contrast [value]').forEach(function (b) { b.setAttribute('aria-pressed', +b.value === t.contrast); });
})();
