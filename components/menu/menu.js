/* Menus: [data-menu="id"] opens <div class="s4-menu" id popover role="menu">. Unfold motion (decision 0001), positioning
   against the anchor (flips above when there's no room), keyboard (arrows, Home/End, Escape, typeahead), radio/checkbox
   items, and light dismiss from the popover API. Choosing an item fires s4-select { value, item } on the menu and closes it.
   Submenus (issue 60): an item with data-submenu="id" opens that menu beside it (on click, Enter, Space, the arrow
   toward it, or resting the pointer on it); the arrow back, or Escape, closes only the submenu. A submenu keeps its
   parent menus open, and choosing in it closes the whole chain.
   S4.menu.open(menu, anchor) / S4.menu.close(menu) / S4.position(popup, anchor, { align, gap, side }). */
(function () {
  var S4 = window.S4;
  function items(menu) { return Array.prototype.filter.call(menu.querySelectorAll('.s4-menu-item'), function (i) { return !i.disabled && i.getAttribute('aria-disabled') !== 'true'; }); }

  /* place popup next to anchor: below (or above if it doesn't fit), start- or end-aligned, kept inside the viewport */
  S4.position = function (popup, anchor, opts) {
    opts = opts || {};
    var gap = opts.gap != null ? opts.gap : 4, m = 8, a = anchor.getBoundingClientRect(), p = popup.getBoundingClientRect();
    var vw = document.documentElement.clientWidth, vh = document.documentElement.clientHeight;
    if (opts.side) {   /* beside the anchor (a submenu): at its inline end, flipped to the other side when there is no room */
      var rtl = getComputedStyle(anchor).direction === 'rtl', pad = opts.inset || 0;
      var after = rtl ? a.left - gap - p.width >= m : a.right + gap + p.width <= vw - m;
      var x = (rtl ? !after : after) ? a.right + gap : a.left - gap - p.width;
      var y = Math.max(m, Math.min(a.top - pad, vh - m - p.height));
      popup.style.left = Math.max(m, Math.min(x, vw - m - p.width)) + 'px'; popup.style.top = y + 'px';
      return 'top';
    }
    var below = a.bottom + gap + p.height <= vh - m || a.top - gap - p.height < m;
    var top = below ? a.bottom + gap : a.top - gap - p.height;
    /* start and end are inline: in right-to-left the start edge is the right one */
    var rtl = getComputedStyle(anchor && anchor.nodeType === 1 ? anchor : document.documentElement).direction === 'rtl';   /* the anchor may be a plain rectangle (date picker) */
    var end = opts.align === 'end' || (opts.align !== 'start' && (rtl ? a.right - p.width < m : a.left + p.width > vw - m));
    var left = end !== rtl ? a.right - p.width : a.left;
    left = Math.max(m, Math.min(left, vw - m - p.width));
    top = Math.max(m, Math.min(top, vh - m - p.height));
    popup.style.left = left + 'px'; popup.style.top = top + 'px';
    return below ? 'top' : 'bottom';
  };

  function isOpen(menu) { return menu.matches(':popover-open') || menu.hasAttribute('data-open'); }
  /* a submenu's chain: the menus it was opened from */
  function ancestors(menu) { var out = []; for (var p = menu._s4parent; p && out.indexOf(p) < 0; p = p._s4parent) out.push(p); return out; }
  function openChildren(menu) { return Array.prototype.filter.call(document.querySelectorAll('.s4-menu'), function (o) { return o !== menu && isOpen(o) && !o._s4closing && ancestors(o).indexOf(menu) >= 0; }); }
  function open(menu, anchor) {
    if (isOpen(menu) && !menu._s4closing) return;
    menu._s4closing = false;
    menu._s4anchor = anchor;
    var parent = anchor && anchor.closest ? anchor.closest('.s4-menu') : null;
    menu._s4parent = parent && parent !== menu ? parent : null;
    try { menu.showPopover(); } catch (e) { menu.setAttribute('data-open', ''); }
    var pad = parseFloat(getComputedStyle(menu).paddingTop) || 0;
    var from = menu._s4from = menu._s4parent ? S4.position(menu, anchor, { side: true, gap: 0, inset: pad }) : S4.position(menu, anchor, { align: menu.dataset.align });
    var keep = ancestors(menu);
    Array.prototype.forEach.call(document.querySelectorAll('.s4-menu'), function (o) { if (o !== menu && isOpen(o) && keep.indexOf(o) < 0) close(o, false); });
    if (anchor) anchor.setAttribute('aria-expanded', 'true');
    S4.transition.follow(menu, { from: from });
    var first = menu.querySelector('.s4-menu-item[aria-checked="true"]') || items(menu)[0];
    if (first) first.focus({ preventScroll: true });
    S4.util.emit(menu, 's4-open', {});
  }
  function close(menu, restoreFocus) {
    var anchor = menu._s4anchor;
    if (anchor) anchor.setAttribute('aria-expanded', 'false');
    if (!isOpen(menu) || menu._s4closing) return;
    openChildren(menu).forEach(function (c) { close(c, false); });
    menu._s4closing = true;
    S4.transition.follow(menu, { open: false, from: menu._s4from }).then(function () {
      if (!menu._s4closing) return;   /* reopened meanwhile */
      menu._s4closing = false;
      try { menu.hidePopover(); } catch (e) {} menu.removeAttribute('data-open');
      menu.getAnimations().forEach(function (a) { a.cancel(); });
    });
    if (restoreFocus !== false && anchor) anchor.focus({ preventScroll: true });
    S4.util.emit(menu, 's4-close', {});
  }
  S4.menu = { open: open, close: close };

  /* submenus: the item names its menu with data-submenu="id" */
  function openSub(item, focusFirst) {
    var sub = document.getElementById(item.dataset.submenu); if (!sub) return;
    if (isOpen(sub) && !sub._s4closing) { if (focusFirst) { var f = items(sub)[0]; if (f) f.focus({ preventScroll: true }); } return; }
    open(sub, item);
    if (!focusFirst) item.focus({ preventScroll: true });   /* by pointer: the submenu shows, the pointer decides */
  }
  var hoverT = null;
  document.addEventListener('pointerover', function (e) {
    if (e.pointerType === 'touch') return;
    var item = e.target.closest && e.target.closest('.s4-menu .s4-menu-item'); if (!item) return;
    var menu = item.closest('.s4-menu'); clearTimeout(hoverT);
    hoverT = setTimeout(function () {
      if (!isOpen(menu) || menu._s4closing) return;
      openChildren(menu).forEach(function (c) { if (c._s4anchor !== item) close(c, false); });
      if (item.dataset.submenu && !item.matches('[aria-disabled="true"]')) openSub(item, false);
    }, 160);
  });

  S4.register('menu', function (scope) {
    S4.util.all(scope, '[data-menu]').forEach(function (anchor) {
      if (!S4.util.once(anchor, 'menuAnchor')) return;
      var menu = document.getElementById(anchor.dataset.menu); if (!menu) return;
      anchor.setAttribute('aria-haspopup', 'menu'); anchor.setAttribute('aria-expanded', 'false'); anchor.setAttribute('aria-controls', menu.id);
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        isOpen(menu) && !menu._s4closing ? close(menu) : open(menu, anchor);
      });
      anchor.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); open(menu, anchor); } });
    });
    S4.util.all(scope, '.s4-menu').forEach(function (menu) {
      if (!S4.util.once(menu, 'menu')) return;
      /* manual: we close it ourselves (animated), so a click on the open menu's own button toggles instead of reopening */
      menu.setAttribute('popover', 'manual');
      if (!menu.getAttribute('role')) menu.setAttribute('role', 'menu');
      items(menu).forEach(function (i) {
        if (!i.getAttribute('role')) i.setAttribute('role', 'menuitem'); i.tabIndex = -1;
        if (i.dataset.submenu) { i.setAttribute('aria-haspopup', 'menu'); i.setAttribute('aria-expanded', 'false'); i.setAttribute('aria-controls', i.dataset.submenu); }
      });
      /* light dismiss (click outside) closes through the popover API: keep aria-expanded in sync */
      menu.addEventListener('toggle', function (e) { if (e.newState === 'closed' && menu._s4anchor) menu._s4anchor.setAttribute('aria-expanded', 'false'); });
      menu.addEventListener('click', function (e) {
        var item = e.target.closest('.s4-menu-item'); if (!item || !menu.contains(item)) return;
        if (item.dataset.submenu) { openSub(item, false); return; }
        var role = item.getAttribute('role');
        if (role === 'menuitemradio') menu.querySelectorAll('[role="menuitemradio"]').forEach(function (r) { r.setAttribute('aria-checked', r === item); });
        if (role === 'menuitemcheckbox') { item.setAttribute('aria-checked', item.getAttribute('aria-checked') !== 'true'); return; }
        S4.util.emit(menu, 's4-select', { value: item.value || item.dataset.value || item.textContent.trim(), item: item });
        var top = ancestors(menu).pop();
        close(menu, !top);
        if (top) close(top);   /* chose in a submenu: the whole chain closes, focus goes back to where it all started */
      });
      var typed = '', typedAt = 0;
      menu.addEventListener('keydown', function (e) {
        var list = items(menu), i = list.indexOf(document.activeElement);
        var rtl = getComputedStyle(menu).direction === 'rtl', toward = rtl ? 'ArrowLeft' : 'ArrowRight', back = rtl ? 'ArrowRight' : 'ArrowLeft';
        var cur = document.activeElement;
        if ((e.key === toward || e.key === 'Enter' || e.key === ' ') && cur && cur.dataset && cur.dataset.submenu && menu.contains(cur)) { e.preventDefault(); openSub(cur, true); return; }
        if (e.key === back && menu._s4parent) { e.preventDefault(); close(menu); return; }
        if (e.key === 'ArrowDown') { e.preventDefault(); list[(i + 1) % list.length].focus(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); list[(i - 1 + list.length) % list.length].focus(); }
        else if (e.key === 'Home') { e.preventDefault(); list[0].focus(); }
        else if (e.key === 'End') { e.preventDefault(); list[list.length - 1].focus(); }
        else if (e.key === 'Escape') { e.preventDefault(); close(menu); }
        else if (e.key === 'Tab') { close(ancestors(menu).pop() || menu, false); }
        else if (e.key.length === 1 && /\S/.test(e.key)) {
          typed = (Date.now() - typedAt > 600 ? '' : typed) + e.key.toLowerCase(); typedAt = Date.now();
          var hit = list.find(function (x) { return x.textContent.trim().toLowerCase().indexOf(typed) === 0; }); if (hit) hit.focus();
        }
      });
    });
  });
  document.addEventListener('pointerdown', function (e) {
    document.querySelectorAll('.s4-menu').forEach(function (m) {
      if (!isOpen(m) || m._s4closing || m.contains(e.target)) return;
      if (openChildren(m).some(function (c) { return c.contains(e.target); })) return;   /* inside one of its submenus */
      if (m._s4anchor && m._s4anchor.contains(e.target)) return;   /* a click on the anchor toggles it */
      close(m, false);
    });
  }, true);
  window.addEventListener('resize', function () {
    document.querySelectorAll('.s4-menu:popover-open').forEach(function (m) { if (m._s4anchor && !m._s4parent) S4.position(m, m._s4anchor, { align: m.dataset.align }); else if (m._s4parent) close(m, false); });
  });
})();
