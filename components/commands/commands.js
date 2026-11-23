/* Commands (issue 60): one list of what an app can do, written once, feeding every way of doing it: the menu bar,
   menus and right-click menus, keyboard shortcuts, the command palette, buttons, and a desktop shell's native menu.
     S4.commands.add([{ id: 'file.save', label: 'Save', group: 'File', icon: 'save', shortcut: 'mod+s',
                        run: function (ctx) {…}, enabled: function () { return dirty; },
                        type: 'check' | 'radio', checked: function () { return on; }, radio: 'zoom',
                        keywords: 'store write', palette: true }])
     S4.commands.menu('app', [ { label: 'File', items: ['file.new', 'file.open', '-', { label: 'Open Recent', items: […] }] }, … ])
     S4.commands.menu('row-menu', ['edit.copy', 'edit.rename', '-', 'edit.delete'])   a named menu: renders into
       .s4-menubar[data-menus="app"] and into <div class="s4-menu" id="row-menu"> (made if missing), so
       data-context-menu="row-menu" and data-menu="row-menu" just work.
     <button data-cmd="file.save">…</button>   clicking runs the command; label, disabled, pressed and its <kbd> follow it.
     data-cmd-plain on such a button runs a check command without showing its state (a panel's own Close button that
     runs view.inspector is an action, not a pressed toggle drawn in the accent).
   Item forms in a menu: 'id', '-' (divider), { heading: 'Label' }, { label, icon, items: [...] } (a submenu),
   { id, label } (another label for the same command here).
   State: enabled() and checked() are asked again whenever S4.commands.refresh() runs (after every command, on every
   menu open, and when the app calls it). Nothing here draws: menus are the glass menu, the palette is the palette.
   S4.commands.native('app') returns the menu as plain data with Electron-style accelerators, for a desktop shell.
   Events on document: s4-command { command, context } after a command runs; s4-commands when the list or a state
   changes (a shell listens to rebuild its native menu). */
(function () {
  var S4 = window.S4, list = [], byId = {}, menus = {}, seq = 0, queued = false;
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function call(f, c, ctx) { try { return typeof f === 'function' ? f.call(c, ctx) : f; } catch (e) { console.error('S4.commands ' + c.id, e); return undefined; } }
  function enabled(c) { return c.enabled == null ? true : call(c.enabled, c) !== false; }
  function checked(c) { return !!call(c.checked, c); }

  function add(cmds) {
    (Array.isArray(cmds) ? cmds : [cmds]).forEach(function (c) {
      if (!c) return;
      if (!c.id) c.id = 'cmd-' + (++seq);
      if (byId[c.id]) list.splice(list.indexOf(byId[c.id]), 1);
      byId[c.id] = c; list.push(c);
    });
    schedule();
    return (Array.isArray(cmds) ? cmds : [cmds]).map(function (c) { return c && c.id; });
  }
  function remove(id) { var c = byId[id]; if (!c) return; list.splice(list.indexOf(c), 1); delete byId[id]; schedule(); }
  function run(id, ctx) {
    var c = typeof id === 'string' ? byId[id] : id;
    if (!c || !enabled(c)) return false;
    call(c.run, c, ctx);
    /* a shortcut or the palette ran it: whatever it removed must not leave the keyboard on <body> (decision 0076) */
    if (ctx && /^(keyboard|palette)$/.test(ctx.source)) setTimeout(function () { if (document.activeElement === document.body && !document.querySelector('dialog[open]')) S4.util.land(); });
    S4.util.emit(document, 's4-command', { command: c, context: ctx });
    refresh();
    return true;
  }

  /* ---------- named menus ---------- */
  function itemHtml(it, withSlot, owner, n) {
    if (it === '-' || it === '|') return '<hr class="s4-menu-divider">';
    if (it && it.heading) return '<div class="s4-menu-label" role="presentation">' + esc(it.heading) + '</div>';
    if (it && it.items) {
      var sub = owner + '-' + n;   /* the same id every render, so a submenu is rebuilt in place */
      makeMenu(sub, it.items, it.label);
      return '<button class="s4-menu-item" type="button" role="menuitem" tabindex="-1" data-submenu="' + sub + '" aria-haspopup="menu" aria-expanded="false" aria-controls="' + sub + '">' +
        (withSlot ? (it.icon ? '<span class="s4-icon" data-icon="' + esc(it.icon) + '"></span>' : '<span class="s4-icon" data-slot></span>') : '') +
        '<span class="s4-menu-item-text">' + esc(it.label) + '</span><span class="s4-icon s4-menu-item-sub" data-icon="chevron-right"></span></button>';
    }
    var id = typeof it === 'string' ? it : it.id, c = byId[id] || {};
    var role = c.type === 'check' ? 'menuitemcheckbox' : c.type === 'radio' ? 'menuitemradio' : 'menuitem';
    var icon = c.type === 'check' || c.type === 'radio' ? 'check' : c.icon;
    return '<button class="s4-menu-item" type="button" tabindex="-1" role="' + role + '" data-cmd="' + esc(id) + '"' + (c.type ? ' data-check' : '') + '>' +
      (withSlot ? (icon ? '<span class="s4-icon" data-icon="' + esc(icon) + '"></span>' : '<span class="s4-icon" data-slot></span>') : '') +
      '<span class="s4-menu-item-text">' + esc((it && it.label) || c.label || id) + '</span><kbd class="s4-kbd"></kbd></button>';
  }
  /* an icon column for the whole menu when any item has an icon or a check, so labels line up */
  function slotted(items) { return items.some(function (it) { var c = typeof it === 'string' ? byId[it] : it && it.id ? byId[it.id] : null; return (it && it.icon) || (c && (c.icon || c.type)); }); }
  function makeMenu(id, items, label) {
    var m = document.getElementById(id);
    if (!m) { m = document.createElement('div'); m.className = 's4-menu'; m.id = id; document.body.appendChild(m); }
    if (label && !m.getAttribute('aria-label')) m.setAttribute('aria-label', label);
    m.classList.add('s4-command-menu');
    var slot = slotted(items);
    m.innerHTML = items.map(function (it, n) { return itemHtml(it, slot, id, n); }).join('');
    if (S4.init) S4.init(m);   /* wires a new menu once; draws the icons of a rebuilt one */
    sync(m);
    return m;
  }
  function menu(name, items) {
    if (items === undefined) return menus[name];
    menus[name] = items;
    render(name);
    return menus[name];
  }
  function render(name) {
    var items = menus[name]; if (!items) return;
    var bars = document.querySelectorAll('.s4-menubar[data-menus="' + name + '"]');
    if (bars.length) { if (S4.menubar) bars.forEach(function (b) { S4.menubar.render(b, items); }); }
    else makeMenu(name, items);
  }

  /* ---------- keep every [data-cmd] element in step with its command ---------- */
  function sync(scope) {
    S4.util.all(scope || document, '[data-cmd]').forEach(function (el) {
      var c = byId[el.dataset.cmd]; if (!c) return;
      var on = enabled(c), chk = c.type ? checked(c) : null;
      if (el.matches('.s4-menu-item, [role^="menuitem"]')) { if (on) el.removeAttribute('aria-disabled'); else el.setAttribute('aria-disabled', 'true'); }
      else if ('disabled' in el && el.tagName === 'BUTTON') el.disabled = !on;
      else if (on) el.removeAttribute('aria-disabled'); else el.setAttribute('aria-disabled', 'true');
      if (chk !== null) {
        if (el.matches('[role="menuitemcheckbox"], [role="menuitemradio"]')) el.setAttribute('aria-checked', String(chk));
        else if (el.tagName === 'BUTTON' && !el.hasAttribute('data-cmd-plain')) el.setAttribute('aria-pressed', String(chk));
      }
      var k = el.querySelector(':scope > .s4-kbd');
      if (k && c.shortcut && S4.desktop) k.textContent = S4.desktop.format(c.shortcut);
      if (!el.textContent.trim() && !el.getAttribute('aria-label') && c.label) el.setAttribute('aria-label', c.label);
    });
  }
  function refresh() { sync(document); S4.util.emit(document, 's4-commands', {}); }
  function schedule() { if (queued) return; queued = true; Promise.resolve().then(function () { queued = false; Object.keys(menus).forEach(render); refresh(); }); }

  /* ---------- a shell's native menu (Electron, Tauri): the same menu as plain data ---------- */
  function accel(s) {
    if (!s) return undefined;
    var NAMES = { comma: ',', space: 'Space', enter: 'Return', escape: 'Esc', arrowup: 'Up', arrowdown: 'Down', arrowleft: 'Left', arrowright: 'Right', delete: 'Delete', backspace: 'Backspace', pageup: 'PageUp', pagedown: 'PageDown' };
    return String(s).toLowerCase().split('+').map(function (p) {
      p = p.trim();
      if (p === 'mod') return 'CmdOrCtrl'; if (p === 'shift') return 'Shift'; if (p === 'alt') return 'Alt';
      return NAMES[p] || (p.length === 1 ? p.toUpperCase() : p.charAt(0).toUpperCase() + p.slice(1));
    }).join('+');
  }
  function plain(items) {
    return items.map(function (it) {
      if (it === '-' || it === '|') return { type: 'separator' };
      if (it && it.heading) return { label: it.heading, enabled: false };
      if (it && it.items) return { label: it.label, submenu: plain(it.items) };
      var id = typeof it === 'string' ? it : it.id, c = byId[id]; if (!c) return null;
      var o = { id: id, label: (it && it.label) || c.label, enabled: enabled(c), accelerator: accel(c.shortcut) };
      if (c.type === 'check') { o.type = 'checkbox'; o.checked = checked(c); }
      if (c.type === 'radio') { o.type = 'radio'; o.checked = checked(c); }
      return o;
    }).filter(Boolean);
  }
  function native(name) {
    var items = menus[name] || [];
    return items.some(function (it) { return it && it.items; }) && items.every(function (it) { return it && it.items; })
      ? items.map(function (m) { return { label: m.label, submenu: plain(m.items) }; }) : plain(items);
  }

  S4.commands = { add: add, remove: remove, run: run, get: function (id) { return byId[id]; }, list: function () { return list.slice(); },
    enabled: function (id) { var c = byId[id]; return !!c && enabled(c); }, checked: function (id) { var c = byId[id]; return !!c && checked(c); },
    menu: menu, menus: function () { return Object.keys(menus); }, refresh: refresh, native: native, accelerator: accel,
    build: makeMenu   /* build(id, items, label): one .s4-menu from items (the menu bar uses it for each of its menus) */ };

  /* clicking anything that names a command runs it (menu items, buttons, links) */
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-cmd]'); if (!el || !byId[el.dataset.cmd]) return;
    if (el.matches(':disabled, [aria-disabled="true"]')) return;
    if (el.tagName === 'A') e.preventDefault();
    var menuEl = el.closest('.s4-menu'), ctx = { source: el, target: menuEl && menuEl.contextTarget || null };
    run(el.dataset.cmd, ctx);
    if (menuEl && el.hasAttribute('data-check') && S4.menu) S4.menu.close(menuEl, true);   /* menu.js keeps a checkbox menu open; a command menu closes like a native one */
  });
  /* menus show the state of the moment they open */
  document.addEventListener('s4-open', function (e) { if (e.target.classList && e.target.classList.contains('s4-menu')) sync(e.target); });
  S4.register('commands', function (scope) { if (list.length) sync(scope); });
})();
