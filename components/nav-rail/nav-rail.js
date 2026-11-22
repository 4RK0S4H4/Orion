/* Navigation rail behaviour.
   - Items: same as the nav bar. Activating one moves aria-current="page" to it and fires s4-change { item, index, value }
     on the rail (value = data-view, else href). preventDefault() on the click vetoes it.
   - [data-rail-toggle]: expands / collapses the rail (data-expanded), keeps aria-expanded in sync, swaps the button's
     aria-label between data-label-expand / data-label-collapse if given, and fires s4-toggle { expanded }.
     Items are rows in both states, so only the rail's edge moves; the labels fade in CSS (decision 0043).
   - .s4-nav-rail-group with a button.s4-nav-rail-title: the title folds the group (data-collapsed, aria-expanded) and
     fires s4-toggle { group, open }; remembered per rail with data-resize-key.
   - data-resizable: a grip on the end edge (role="separator"): drag it, or Left / Right on it (Home / End for the
     limits, Enter to collapse or expand); dragged narrow, the rail collapses. Width remembered with data-resize-key.
     Fires s4-resize { size, collapsed }. (issue 60) */
S4.register('nav-rail', function (scope) {
  S4.util.all(scope, '.s4-nav-rail').forEach(function (rail) {
    if (!S4.util.once(rail, 'navrail')) return;
    var toggle = rail.querySelector('[data-rail-toggle]');
    S4.navPill(rail.querySelector('.s4-nav-rail-items'));

    function sync() {
      if (!toggle) return;
      var open = rail.hasAttribute('data-expanded');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      var label = open ? toggle.dataset.labelCollapse : toggle.dataset.labelExpand;
      if (label) toggle.setAttribute('aria-label', label);
    }
    /* collapsed, the labels are hidden: each item's label becomes its hover title (kept in data-title when expanded) */
    function titles() {
      var open = rail.hasAttribute('data-expanded');
      rail.querySelectorAll('.s4-nav-item').forEach(function (item) {
        var l = item.querySelector('.s4-nav-label');
        if (!l) return;
        if (open) item.removeAttribute('title'); else item.setAttribute('title', l.textContent.trim());
      });
    }
    new MutationObserver(titles).observe(rail, { attributes: true, attributeFilter: ['data-expanded'] });
    titles();
    /* issue 70: while the edge moves (Morph), what is inside keeps the expanded layout and the rail's edge clips it, so
       no label wraps or reflows mid-motion; data-s4-moving holds it until the width has arrived */
    var moving = null;
    function settle() { clearTimeout(moving); moving = null; rail.removeAttribute('data-s4-moving'); }
    new MutationObserver(function () {
      if (rail.hasAttribute('data-resizing')) return;
      var ms = Math.max.apply(null, getComputedStyle(rail).transitionDuration.split(',').map(function (d) { return (parseFloat(d) || 0) * 1000; }));
      if (!ms) { settle(); return; }
      rail.setAttribute('data-s4-moving', '');
      clearTimeout(moving);
      moving = setTimeout(settle, ms + 120);
    }).observe(rail, { attributes: true, attributeFilter: ['data-expanded'] });
    rail.addEventListener('transitionend', function (e) { if (e.target === rail && e.propertyName === 'inline-size' && moving) settle(); });

    /* data-expand="auto": expanded on large windows (1200 and up, M3 Expressive), collapsed below, until the person
       uses the toggle (their choice then sticks for the page's life) */
    var chosen = false;
    /* decision 0043: auto is the default, so labels show beside the icons whenever there is room. data-expand="off"
       (or a rail that starts with data-expanded and no data-expand) keeps the rail as the page wrote it. */
    /* an app may set its rail's default once (base/defaults.css): data-rail="expanded | collapsed | auto" on <html>,
       .s4-app or a container. A rail's own data-expand or data-expanded still wins. */
    var host = rail.dataset.expand || rail.hasAttribute('data-expanded') ? null : rail.closest('[data-rail]');
    var appRail = host ? host.getAttribute('data-rail') : null;
    /* decision 0063: a page whose app holds a board (.s4-board) starts with the rail collapsed, so the lanes get the width */
    var boardApp = rail.closest('.s4-app');
    if (!appRail && !rail.dataset.expand && !rail.hasAttribute('data-expanded') && boardApp && boardApp.querySelector('.s4-board')) appRail = 'collapsed';
    if (appRail === 'expanded') { rail.setAttribute('data-expanded', ''); sync(); }
    var auto = rail.dataset.expand === 'auto' || (!rail.dataset.expand && !rail.hasAttribute('data-expanded') && appRail !== 'collapsed');
    if (auto && window.ResizeObserver) {
      var host = rail.closest('.s4-app') || document.documentElement;
      new ResizeObserver(function () {
        if (chosen) return;
        var wide = host.clientWidth >= (parseFloat(S4.util.css('--s4-breakpoint-large')) || 1200);
        if (wide !== rail.hasAttribute('data-expanded')) { rail.toggleAttribute('data-expanded', wide); sync(); }
      }).observe(host);
    }

    rail.addEventListener('click', function (e) {
      if (e.defaultPrevented) return;
      if (toggle && e.target.closest('[data-rail-toggle]') === toggle) {
        chosen = true;
        rail.toggleAttribute('data-expanded');
        sync();
        S4.util.emit(rail, 's4-toggle', { expanded: rail.hasAttribute('data-expanded') });
        return;
      }
      var item = e.target.closest('.s4-nav-item');
      if (!item || !rail.contains(item) || item.matches(':disabled, [aria-disabled="true"]')) return;
      var current = item.getAttribute('aria-current');
      if (current && current !== 'false') return;
      var items = Array.prototype.slice.call(rail.querySelectorAll('.s4-nav-item'));
      items.forEach(function (x) { if (x !== item) x.removeAttribute('aria-current'); });
      item.setAttribute('aria-current', 'page');
      S4.util.emit(rail, 's4-change', { item: item, index: items.indexOf(item), value: item.dataset.view || item.getAttribute('href') });
    });
    sync();

    /* ---------- folding groups ---------- */
    var key = rail.dataset.resizeKey;
    function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function write(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
    var folded = (key && read(key + '-folded') || '').split('|').filter(Boolean);
    rail.querySelectorAll('.s4-nav-rail-group').forEach(function (g, i) {
      var t = g.querySelector(':scope > button.s4-nav-rail-title'), items = g.querySelector(':scope > .s4-nav-rail-group-items'); if (!t || !items) return;
      if (!items.id) items.id = (rail.id || 's4-rail') + '-group-' + i;
      t.setAttribute('aria-controls', items.id);
      var name = t.textContent.trim();
      if (folded.indexOf(name) >= 0) g.setAttribute('data-collapsed', '');
      t.setAttribute('aria-expanded', String(!g.hasAttribute('data-collapsed')));
      t.addEventListener('click', function () {
        var open = g.hasAttribute('data-collapsed');
        if (open) { g.removeAttribute('data-collapsed'); S4.transition.reveal(items, { open: true }); }
        else { S4.transition.reveal(items, { open: false }).then(function (done) { if (done) { g.setAttribute('data-collapsed', ''); S4.transition.restore(items); } }); }
        t.setAttribute('aria-expanded', String(open));
        if (key) { var all = Array.prototype.map.call(rail.querySelectorAll('.s4-nav-rail-group'), function (x) { var b = x.querySelector(':scope > button.s4-nav-rail-title'); return b && b.getAttribute('aria-expanded') === 'false' ? b.textContent.trim() : ''; }).filter(Boolean); write(key + '-folded', all.join('|')); }
        S4.util.emit(rail, 's4-toggle', { group: g, open: open });
      });
    });

    /* ---------- resizable ---------- */
    if (!rail.hasAttribute('data-resizable')) return;
    var MIN = 200, MAX = 400, SNAP = 150;
    var saved = key && parseFloat(read(key + '-width'));
    if (saved) rail.style.setProperty('--s4-nav-rail-expanded-width', saved + 'px');
    var grip = document.createElement('button');
    grip.type = 'button'; grip.className = 's4-nav-rail-grip';
    grip.setAttribute('role', 'separator'); grip.setAttribute('aria-orientation', 'vertical');
    grip.setAttribute('aria-label', 'Resize ' + (rail.getAttribute('aria-label') || 'Sidebar'));
    grip.setAttribute('aria-valuemin', String(MIN)); grip.setAttribute('aria-valuemax', String(MAX));
    rail.appendChild(grip);
    function now() { return Math.round(rail.getBoundingClientRect().width); }
    function setOpen(on) { chosen = true; rail.toggleAttribute('data-expanded', on); sync(); S4.util.emit(rail, 's4-toggle', { expanded: on }); }
    function size(px) {
      px = Math.round(Math.max(MIN, Math.min(MAX, px)));
      rail.style.setProperty('--s4-nav-rail-expanded-width', px + 'px');
      grip.setAttribute('aria-valuenow', String(px));
      if (key) write(key + '-width', String(px));
      S4.util.emit(rail, 's4-resize', { size: px, collapsed: false });
    }
    grip.setAttribute('aria-valuenow', String(now()));
    grip.addEventListener('keydown', function (e) {
      var rtl = getComputedStyle(rail).direction === 'rtl', grow = rtl ? 'ArrowLeft' : 'ArrowRight', shrink = rtl ? 'ArrowRight' : 'ArrowLeft';
      if (e.key === 'Enter') setOpen(!rail.hasAttribute('data-expanded'));
      else if (!rail.hasAttribute('data-expanded')) { if (e.key === grow) setOpen(true); else return; }
      else if (e.key === grow) size(now() + 16);
      else if (e.key === shrink) { if (now() - 16 < MIN) setOpen(false); else size(now() - 16); }
      else if (e.key === 'Home') size(MIN); else if (e.key === 'End') size(MAX);
      else return;
      e.preventDefault();
    });
    grip.addEventListener('pointerdown', function (e) {
      if (e.button) return;
      e.preventDefault();
      var x0 = e.clientX, w0 = now(), rtl = getComputedStyle(rail).direction === 'rtl';
      rail.setAttribute('data-resizing', ''); grip.setAttribute('data-dragging', ''); grip.setPointerCapture(e.pointerId);
      function mv(ev) {
        var w = w0 + (rtl ? x0 - ev.clientX : ev.clientX - x0);
        if (w < SNAP) { if (rail.hasAttribute('data-expanded')) setOpen(false); }
        else { if (!rail.hasAttribute('data-expanded')) setOpen(true); size(w); }
      }
      function up() { rail.removeAttribute('data-resizing'); grip.removeAttribute('data-dragging'); grip.removeEventListener('pointermove', mv); grip.removeEventListener('pointerup', up); grip.removeEventListener('pointercancel', up); }
      grip.addEventListener('pointermove', mv); grip.addEventListener('pointerup', up); grip.addEventListener('pointercancel', up);
    });
    grip.addEventListener('dblclick', function () { setOpen(!rail.hasAttribute('data-expanded')); });
  });
});
