/* Menu bar (issue 60): the application menu inside the window (File, Edit, View, …), for Windows and Linux shells and
   for web apps in a window. On a Mac shell that builds the native menu bar from the same commands, <html
   data-native-menu> hides it. WAI-ARIA menubar pattern:
     <div class="s4-menubar" role="menubar" aria-label="Application" data-menus="app"></div>
       filled from S4.commands.menu('app', [{ label: 'File', items: ['file.new', …] }, …]); or written by hand:
     <div class="s4-menubar" role="menubar" aria-label="Application">
       <button class="s4-menubar-item" type="button" data-menu="m-file">File</button> …
     </div>
   Keys: Left and Right move along the bar (and switch the open menu), Down, Enter or Space open a menu at its first
   item, Up at its last, Home and End, a letter jumps to the menu that starts with it. Inside a menu, the arrow away from
   a submenu moves to the next menu of the bar. F10, or Alt pressed and let go, puts focus on the bar; Alt with a
   letter opens that menu; Escape gives focus back to where it was. With one menu open, pointing at another opens it.
   S4.menubar.render(bar, items), S4.menubar.focus(bar). */
(function () {
  var S4 = window.S4, uid = 0;
  function barItems(bar) { return Array.prototype.slice.call(bar.querySelectorAll('.s4-menubar-item')).filter(function (b) { return !b.disabled; }); }
  function menuOf(item) { return document.getElementById(item.dataset.menu); }
  function isOpen(m) { return !!m && (m.matches(':popover-open') || m.hasAttribute('data-open')) && !m._s4closing; }
  function openOf(bar) { return barItems(bar).filter(function (i) { return isOpen(menuOf(i)); })[0] || null; }
  function shown(bar) { return !!bar.getClientRects().length && getComputedStyle(bar).visibility !== 'hidden'; }
  function rove(bar, item) { barItems(bar).forEach(function (i) { i.tabIndex = i === item ? 0 : -1; }); }
  function openAt(bar, item, last) {
    var m = menuOf(item); if (!m) return;
    rove(bar, item);
    if (!isOpen(m)) S4.menu.open(m, item);
    var list = Array.prototype.filter.call(m.querySelectorAll('.s4-menu-item'), function (x) { return x.getAttribute('aria-disabled') !== 'true' && !x.disabled; });
    var to = last ? list[list.length - 1] : list[0];
    if (to) to.focus({ preventScroll: true });
  }

  function render(bar, items) {
    if (!bar.id) bar.id = 's4-menubar-' + (++uid);
    var html = '';
    items.forEach(function (top, i) {
      var id = bar.id + '-m' + i;
      S4.commands.build(id, top.items || [], top.label);
      html += '<button class="s4-menubar-item" type="button" data-menu="' + id + '">' + String(top.label).replace(/[&<>"]/g, '') + '</button>';
    });
    bar.innerHTML = html;
    setup(bar);
    S4.init(bar);   /* menu.js wires the new items as openers */
  }
  function setup(bar) {
    var all = barItems(bar);
    all.forEach(function (i) { i.setAttribute('role', 'menuitem'); });
    rove(bar, all[0]);
  }

  var before = null;   /* where focus was when the keyboard went to the bar */
  function focusBar(bar) {
    if (!bar || !shown(bar)) return false;
    if (!bar.contains(document.activeElement)) before = document.activeElement;
    var item = barItems(bar).filter(function (i) { return i.tabIndex === 0; })[0] || barItems(bar)[0];
    if (item) item.focus();
    return true;
  }
  function leave(bar) { var b = before; before = null; if (b && b.isConnected && b !== document.body && b.focus) b.focus({ preventScroll: true }); else if (document.activeElement) document.activeElement.blur(); }
  function activeBar() { return Array.prototype.filter.call(document.querySelectorAll('.s4-menubar'), shown)[0] || null; }
  /* which bar a menu (or a submenu of one) belongs to, and its item there */
  function rootItem(menu) {
    var m = menu, guard = 0;
    while (m && m._s4parent && guard++ < 10) m = m._s4parent;
    var a = m && m._s4anchor;
    return a && a.classList && a.classList.contains('s4-menubar-item') ? a : null;
  }

  S4.menubar = { render: render, focus: function (bar) { return focusBar(bar || activeBar()); } };

  S4.register('menubar', function (scope) {
    S4.util.all(scope, '.s4-menubar').forEach(function (bar) {
      if (!S4.util.once(bar, 'menubar')) return;
      if (!bar.getAttribute('role')) bar.setAttribute('role', 'menubar');
      if (bar.dataset.menus && S4.commands && S4.commands.menu(bar.dataset.menus) && !bar.querySelector('.s4-menubar-item')) render(bar, S4.commands.menu(bar.dataset.menus));
      else setup(bar);
      var typed = '', typedAt = 0;
      bar.addEventListener('keydown', function (e) {
        var item = e.target.closest('.s4-menubar-item'); if (!item) return;
        var list = barItems(bar), i = list.indexOf(item), rtl = getComputedStyle(bar).direction === 'rtl';
        var next = rtl ? 'ArrowLeft' : 'ArrowRight', prev = rtl ? 'ArrowRight' : 'ArrowLeft', to = null;
        if (e.key === next) to = list[(i + 1) % list.length];
        else if (e.key === prev) to = list[(i - 1 + list.length) % list.length];
        else if (e.key === 'Home') to = list[0];
        else if (e.key === 'End') to = list[list.length - 1];
        else if (e.key === 'ArrowUp') { e.preventDefault(); e.stopImmediatePropagation(); openAt(bar, item, true); return; }
        else if (e.key === 'ArrowDown') { e.preventDefault(); e.stopImmediatePropagation(); openAt(bar, item, false); return; }
        else if (e.key === 'Escape') { e.preventDefault(); leave(bar); return; }
        else if (e.key.length === 1 && /\S/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
          typed = (Date.now() - typedAt > 600 ? '' : typed) + e.key.toLowerCase(); typedAt = Date.now();
          to = list.filter(function (x) { return x.textContent.trim().toLowerCase().indexOf(typed) === 0; })[0] || null;
          if (!to) return;
        }
        if (!to) return;
        e.preventDefault();
        rove(bar, to); to.focus();
      }, true);
      /* with one menu open, pointing at another item of the bar switches to its menu */
      bar.addEventListener('pointerover', function (e) {
        var item = e.target.closest('.s4-menubar-item'); if (!item || e.pointerType === 'touch') return;
        var cur = openOf(bar); if (!cur || cur === item) return;
        rove(bar, item); S4.menu.open(menuOf(item), item);
      });
      bar.addEventListener('focusin', function (e) { var item = e.target.closest('.s4-menubar-item'); if (item) rove(bar, item); });
    });
  });

  /* inside a menu of the bar: the arrows that point away from it move along the bar */
  document.addEventListener('keydown', function (e) {
    if (e.defaultPrevented) return;
    var menu = e.target.closest && e.target.closest('.s4-menu'); if (!menu) return;
    var item = rootItem(menu); if (!item) return;
    var bar = item.closest('.s4-menubar'), rtl = getComputedStyle(bar).direction === 'rtl';
    var list = barItems(bar), i = list.indexOf(item), d = 0;
    if (e.key === (rtl ? 'ArrowLeft' : 'ArrowRight')) d = 1;
    else if (e.key === (rtl ? 'ArrowRight' : 'ArrowLeft') && !menu._s4parent) d = -1;
    if (!d) return;
    e.preventDefault();
    openAt(bar, list[(i + d + list.length) % list.length], false);
  });

  /* F10 or a lone Alt: to the bar and back; Alt + a letter opens that menu (Windows and Linux) */
  var altAlone = false;
  document.addEventListener('keydown', function (e) {
    var bar = activeBar(); if (!bar) { altAlone = false; return; }
    if (e.key === 'Alt') { altAlone = !e.repeat && !e.ctrlKey && !e.metaKey && !e.shiftKey; return; }
    altAlone = false;
    if (e.key === 'F10' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
      e.preventDefault();
      if (bar.contains(document.activeElement)) leave(bar); else focusBar(bar);
      return;
    }
    if (e.altKey && !e.ctrlKey && !e.metaKey && e.key.length === 1 && /[a-z]/i.test(e.code ? e.code.replace(/^Key/, '') : e.key)) {
      if (S4.util.typable(e.target) && document.documentElement.dataset.platform === 'mac') return;   /* ⌥ + a letter types a character on a Mac */
      var letter = (e.code && /^Key[A-Z]$/.test(e.code) ? e.code.slice(3) : e.key).toLowerCase();
      var hit = barItems(bar).filter(function (x) { var k = (x.dataset.access || x.textContent.trim().charAt(0)).toLowerCase(); return k === letter; })[0];
      if (!hit) return;
      e.preventDefault();
      if (!bar.contains(document.activeElement)) before = document.activeElement;
      openAt(bar, hit, false);
    }
  }, true);
  document.addEventListener('keyup', function (e) {
    if (e.key !== 'Alt' || !altAlone) return;
    altAlone = false;
    var bar = activeBar(); if (!bar) return;
    if (document.querySelector('.s4-menu:popover-open')) return;
    e.preventDefault();
    if (bar.contains(document.activeElement)) leave(bar); else focusBar(bar);
  }, true);
  document.addEventListener('pointerdown', function () { altAlone = false; }, true);
})();
