/* Command palette (decision 0051): search everything and run any action from one box. The desktop counterpart of the
   navigation bar; on a phone it is a full-width panel.
   - Opens with mod+K anywhere, or from any [data-palette] button. No markup needed: the palette builds itself.
   - Commands come from three places, in this order:
       S4.commands (components/commands/): every command the app registered, unless palette: false; the same list
       feeds the menu bar, menus and shortcuts. S4.palette.register([...]) adds to it (the older name).
       [data-command="Label"] on any button or link                                        runs by clicking it (its data-shortcut is shown)
       the app's navigation                                                                 "Go To Inbox", one per destination
                                                                                            (left out when a command of that name opens it)
     plus "Switch To Dark Mode" / "Light Mode" unless S4.palette.theme = false.
   - Type to filter (every word must match), Arrow keys move (Home, End, PageUp and PageDown too, when the box is empty or the
     focus is on the list), Enter runs, Escape closes; clearing the box (Escape, the cross) shows every command again.
   - S4.palette.open() / close(). Fires s4-open and s4-close on the dialog and s4-command { command } on document.
   Focus (decision 0049): opened with the keyboard, the cursor is in the box (you are already typing). Opened by tap or
   click it is not, so no keyboard jumps up on a phone; the first key you press goes into the box anyway.
   Motion: Pop. */
(function () {
  var S4 = window.S4, dlg, input, list, empty, shown = [], active = -1;
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function text(el) { return (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim(); }
  function build() {
    if (dlg) return;
    dlg = document.createElement('dialog'); dlg.className = 's4-dialog s4-palette'; dlg.setAttribute('aria-label', 'Command palette');
    dlg.innerHTML = '<div class="s4-search s4-palette-search" role="search"><span class="s4-icon" data-icon="search"></span>' +
      '<input class="s4-search-input" type="search" placeholder="Search Or Run A Command" aria-label="Search or run a command" autocomplete="off" spellcheck="false" role="combobox" aria-expanded="true" aria-controls="s4-palette-list"></div>' +
      '<ul class="s4-list s4-palette-list" id="s4-palette-list" role="listbox" aria-label="Commands"></ul>' +
      '<p class="s4-palette-empty" role="status" hidden>No matches. Try another word.</p>';
    document.body.appendChild(dlg);
    input = dlg.querySelector('input'); list = dlg.querySelector('ul'); empty = dlg.querySelector('.s4-palette-empty');
    input.addEventListener('input', function () { render(input.value); });
    input.addEventListener('search', function () { render(input.value); });   /* the field's own clear (Escape, the cross) fires no input event: the list follows the box (decision 0076) */
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      /* the first Escape clears the box and the list with it (the search field may have cleared the box already and said so by consuming the key); the next one closes */
      else if (e.key === 'Escape' && (input.value || e.defaultPrevented)) { e.preventDefault(); input.value = ''; render(''); }
      else if (e.key === 'PageDown' || e.key === 'PageUp') { e.preventDefault(); if (shown.length) mark(Math.max(0, Math.min(shown.length - 1, active + (e.key === 'PageDown' ? 8 : -8)))); }
      else if ((e.key === 'Home' || e.key === 'End') && (document.activeElement !== input || !input.value)) { e.preventDefault(); if (shown.length) mark(e.key === 'Home' ? 0 : shown.length - 1); }   /* in a typed query they move the caret */
      else if (e.key === 'Enter') {
        e.preventDefault();
        if (shown[active]) run(shown[active]);
        else { input.setAttribute('aria-invalid', 'true'); empty.hidden = false; empty.textContent = ''; empty.textContent = 'No matches. Try another word.'; }   /* nothing to run: say so again, stay open */
      }
      else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && document.activeElement !== input) input.focus({ preventScroll: true });   /* your own key press starts the typing */
    });
    list.addEventListener('click', function (e) { var li = e.target.closest('[data-i]'); if (li) run(shown[+li.dataset.i]); });
    list.addEventListener('pointermove', function (e) { var li = e.target.closest('[data-i]'); if (li && +li.dataset.i !== active) mark(+li.dataset.i, false); });
    dlg.addEventListener('s4-close', function () { input.value = ''; });
  }
  /* everything that can be run right now */
  function commands() {
    var out = S4.commands ? S4.commands.list().filter(function (c) { return c.palette !== false && c.label && S4.commands.enabled(c.id); }).map(function (c) {
      var label = c.type && c.paletteLabel ? (typeof c.paletteLabel === 'function' ? c.paletteLabel() : c.paletteLabel) : c.label;
      return { id: c.id, label: label, group: c.group || 'Commands', icon: c.icon || '', shortcut: c.shortcut || '', keywords: c.keywords || '', registered: true };
    }) : [];
    document.querySelectorAll('[data-command]').forEach(function (el) {
      if (el.disabled || el.closest('.s4-palette')) return;
      var icon = el.querySelector('.s4-icon[data-icon]');
      out.push({ label: el.dataset.command || text(el), group: el.dataset.commandGroup || 'Actions', icon: icon ? icon.dataset.icon : '', shortcut: el.dataset.shortcut || '', keywords: el.dataset.commandKeywords || '', el: el });
    });
    var nav = document.querySelector('.s4-app .s4-nav-rail, .s4-app .s4-nav-bar');
    /* one row per thing: a destination that a command already opens ("Settings", mod+comma) is not listed twice */
    var have = {}; out.forEach(function (c) { have[c.label.toLowerCase()] = true; });
    if (nav) nav.querySelectorAll('.s4-nav-item').forEach(function (a) {
      var icon = a.querySelector('.s4-icon[data-icon]'), label = a.querySelector('.s4-nav-label'), name = label ? label.textContent.trim() : text(a);
      if (have[name.toLowerCase()] || have[('go to ' + name).toLowerCase()]) return;
      out.push({ label: 'Go To ' + name, group: 'Go To', icon: icon ? icon.dataset.icon : '', el: a });
    });
    if (S4.palette.theme !== false && S4.theme) {
      var dark = (S4.theme() || {}).mode === 'dark' || ((S4.theme() || {}).mode !== 'light' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
      out.push({ label: dark ? 'Switch To Light Mode' : 'Switch To Dark Mode', group: 'Appearance', icon: dark ? 'light-mode' : 'dark-mode', keywords: 'theme appearance', run: function () { S4.theme({ mode: dark ? 'light' : 'dark' }); } });
    }
    return out;
  }
  function render(q) {
    var words = String(q || '').toLowerCase().split(/\s+/).filter(Boolean), all = commands();
    shown = all.filter(function (c) { var hay = (c.label + ' ' + (c.group || '') + ' ' + (c.keywords || '')).toLowerCase(); return words.every(function (w) { return hay.indexOf(w) >= 0; }); });
    if (words.length) shown.sort(function (a, b) { return (a.label.toLowerCase().indexOf(words[0]) === 0 ? 0 : 1) - (b.label.toLowerCase().indexOf(words[0]) === 0 ? 0 : 1); });
    var html = '', group = null;
    shown.forEach(function (c, i) {
      var g = words.length ? '' : (c.group || '');
      if (g && g !== group) { html += '<li class="s4-list-subheader" role="presentation">' + esc(g) + '</li>'; group = g; }
      html += '<li role="none"><div class="s4-list-item" role="option" id="s4-palette-o' + i + '" data-i="' + i + '" aria-selected="false">' +
        (c.icon ? '<span class="s4-icon" data-icon="' + esc(c.icon) + '"></span>' : '<span class="s4-palette-noicon"></span>') +
        '<span class="s4-list-content"><span class="s4-list-headline">' + esc(c.label) + '</span></span>' +
        (c.shortcut ? '<span class="s4-list-trailing"><kbd class="s4-kbd">' + esc(S4.desktop ? S4.desktop.format(c.shortcut) : c.shortcut) + '</kbd></span>' : '') + '</div></li>';
    });
    list.innerHTML = html; list.hidden = !shown.length; empty.hidden = !!shown.length; input.removeAttribute('aria-invalid');
    if (S4.init) S4.init(list);
    mark(shown.length ? 0 : -1, false);
  }
  function mark(i, scroll) {
    active = i;
    list.querySelectorAll('[data-i]').forEach(function (o) { o.setAttribute('aria-selected', String(+o.dataset.i === i)); });
    var cur = i >= 0 ? list.querySelector('[data-i="' + i + '"]') : null;
    if (cur) { input.setAttribute('aria-activedescendant', cur.id); if (scroll !== false) cur.scrollIntoView({ block: 'nearest' }); } else input.removeAttribute('aria-activedescendant');
  }
  function move(d) { if (shown.length) mark((active + d + shown.length) % shown.length); }
  function run(c) {
    close().then(function () {
      if (!c.registered) S4.util.emit(document, 's4-command', { command: c });   /* registered commands announce themselves */
      if (c.registered) S4.commands.run(c.id, { source: 'palette' }); else if (c.run) c.run(); else if (c.el) c.el.click();
    });
  }
  function open(opts) {
    build(); if (dlg.open) return;
    render('');
    S4.dialog.open(dlg, { from: opts && opts.from });
    if (opts && opts.keyboard) input.focus({ preventScroll: true });   /* you opened it by typing: keep typing */
  }
  function close() { return dlg && dlg.open ? Promise.resolve(S4.dialog.close(dlg, '')) : Promise.resolve(); }
  S4.palette = {
    open: open, close: close, commands: commands,
    register: function (cmds) { (cmds || []).forEach(function (c) { if (!c.group) c.group = 'Commands'; }); return S4.commands.add(cmds || []); },
    clear: function () { S4.commands.list().forEach(function (c) { S4.commands.remove(c.id); }); }
  };

  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'k' && S4.palette.shortcut !== false) {
      e.preventDefault();
      if (dlg && dlg.open) close(); else open({ keyboard: true });
    }
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-palette]');
    if (b) { e.preventDefault(); open({ from: b }); }
  });
})();
