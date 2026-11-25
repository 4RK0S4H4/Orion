/* App shell behaviour.
   - The nav bar and nav rail of one .s4-app show the same destinations: when one changes, the other follows (same index).
   - Views: if the chosen item has data-view="bills" and the app has <section class="s4-view" data-view="bills">, that
     view replaces the current one with the shared axis pattern (old slides 30px out and fades, new slides in from the
     side you're heading; movement on the spatial spring, fades on effects), the page scrolls to the top, and the top app
     bar title takes the view's data-title. Fires s4-change { view, previous } on the .s4-app after the switch starts.
   - S4.app.go(app, name) switches views from code (e.g. a "See All" link, a shortcut like mod+comma): focus moves to the
     new view (a region named by its data-title), so the next Tab starts there. A switch from the navigation keeps focus
     on the navigation item; focus left inside the view that went away also moves to the new view, never to <body>.
   - Deep links: nav items are <a href="#name">, so the URL follows the view; on load, #name opens that view.
   - Getting past the chrome (decision 0084): every app shell gets a skip link as the first Tab stop ("Skip to Content",
     hidden until it has the focus; Enter puts the focus on main). Nothing to write in markup. F6 region cycling for
     desktop apps is in desktop/desktop.js.
   - Back and Forward (decision 0076): the screen follows the URL both ways. A hash that names a view of the app (or no hash:
     the view the app started on) switches to that view when the browser's Back or Forward, the phone's Back gesture or a
     script (location.hash = '#forms') changes it; any open page closes first. */
(function () {
  /* shared axis lives in motion/motion.js (S4.transition.sharedAxis) */
  function sharedAxis(from, to, dir, state, onSwap) { return S4.transition.sharedAxis(from, to, dir, state, onSwap); }

  function views(app) { return Array.prototype.slice.call(app.querySelectorAll('.s4-view[data-view]')); }

  /* the view itself takes the focus (never a field in it, decision 0049): a region named by its title */
  function focusView(view) {
    if (!view.hasAttribute('tabindex')) view.setAttribute('tabindex', '-1');
    if (!view.hasAttribute('aria-label') && !view.hasAttribute('aria-labelledby') && view.dataset.title) view.setAttribute('aria-label', view.dataset.title);
    view.focus({ preventScroll: true });
  }
  function show(app, name, dir) {
    var list = views(app), to = null, from = null;
    list.forEach(function (v) { if (v.dataset.view === name) to = v; else if (!v.hidden) from = v; });
    if (!to) return false;
    var state = app._s4views || (app._s4views = {});
    /* any other view still visible from an interrupted switch goes away now */
    list.forEach(function (v) { if (v !== to && v !== from) v.hidden = true; });
    if (to === from || (!from && !to.hidden)) return true;
    /* the title and the scroll reset wait for the moment of the swap, so the old view doesn't jump while it fades out */
    var a = document.activeElement, move = app._s4goFocus || !a || a === document.body || (from && from.contains(a));
    app._s4goFocus = false;
    sharedAxis(from, to, dir || 1, state, function () {
      if (move) { to.hidden = false; focusView(to); }   /* the swap runs just before the view unhides */
      var title = to.dataset.title, bar = app.querySelector('.s4-top-app-bar .s4-app-bar-title');
      if (title && bar) bar.textContent = title;
      window.scrollTo({ top: 0, behavior: 'instant' });
      var body = app.querySelector(':scope > .s4-app-body'); if (body) body.scrollTop = 0;   /* data-window: the body scrolls, not the page */
    });
    S4.util.emit(app, 's4-change', { view: name, previous: from ? from.dataset.view : null });
    return true;
  }

  function mirror(app, source, index) {
    app.querySelectorAll('.s4-nav-bar, .s4-nav-rail').forEach(function (nav) {
      if (nav === source || nav.closest('.s4-app') !== app) return;
      var items = nav.querySelectorAll('.s4-nav-item');
      items.forEach(function (x, i) { if (i === index) x.setAttribute('aria-current', 'page'); else x.removeAttribute('aria-current'); });
    });
  }

  S4.app = {
    go: function (app, name) {
      var nav = app.querySelector('.s4-nav-bar, .s4-nav-rail');
      var items = nav ? Array.prototype.slice.call(nav.querySelectorAll('.s4-nav-item')) : [];
      var target = items.filter(function (x) { return x.dataset.view === name; })[0];
      app._s4goFocus = true;
      if (target) target.click(); else show(app, name, 1);
      /* already there (no switch happened): the view still takes the focus */
      if (app._s4goFocus) { var v = views(app).filter(function (x) { return x.dataset.view === name && !x.hidden; })[0]; if (v && !v.contains(document.activeElement)) focusView(v); }
      app._s4goFocus = false;
    }
  };

  /* ---------- getting past the chrome (decision 0084) ---------- */
  function mainOf(app) {
    var all = app.querySelectorAll('main, [role="main"]');
    for (var i = 0; i < all.length; i++) if (all[i].getClientRects().length && !all[i].closest('[hidden]')) return all[i];
    return all[0] || null;
  }
  function toMain(app) {
    var m = mainOf(app); if (!m) return false;
    if (!m.hasAttribute('tabindex')) m.setAttribute('tabindex', '-1');
    m.focus({ preventScroll: true });
    m.scrollIntoView({ block: 'nearest' });
    return true;
  }
  /* the skip link: a real Orion pill (base.css), first in the document so it is the first Tab stop; a page that wrote its own keeps it */
  function skipLink(app) {
    if (document.querySelector('.s4-skip-link') || !mainOf(app)) return;
    var m = mainOf(app);
    if (!m.id) m.id = 's4-main';
    var a = document.createElement('a');
    a.className = 's4-skip-link'; a.href = '#' + m.id; a.textContent = 'Skip to Content';
    a.setAttribute('data-s4-skip-link', '');
    /* the link never changes the address (an app's views and pages live in the hash): it moves the focus */
    a.addEventListener('click', function (e) { if (toMain(app)) e.preventDefault(); });
    document.body.insertBefore(a, document.body.firstChild);
  }
  /* the view an app started on: the deep link, else the current destination, else the first view */
  function name0(app, deep, cur, list) { return deep || (cur ? cur.dataset.view : list.length ? list[0].dataset.view : ''); }

  S4.register('app', function (scope) {
    S4.util.all(scope, '.s4-app').forEach(function (app) {
      if (!S4.util.once(app, 'app')) return;
      if (app === document.querySelector('.s4-app')) skipLink(app);   /* one shell per page has the skip link */
      /* start with only the current destination's view visible */
      var cur = app.querySelector('.s4-nav-item[aria-current="page"][data-view]');
      var list = views(app);
      /* deep links: #name in the URL opens that view (reload, shared links); the nav follows */
      var hash = decodeURIComponent(location.hash.slice(1)).split('/')[0], deep = null;   /* #view or #view/page/id (page.js) */
      if (hash && list.some(function (v) { return v.dataset.view === hash; })) {
        app.querySelectorAll('.s4-nav-item[data-view]').forEach(function (x) {
          if (x.dataset.view === hash) x.setAttribute('aria-current', 'page'); else x.removeAttribute('aria-current');
        });
        cur = app.querySelector('.s4-nav-item[aria-current="page"][data-view]');
        var t = list.filter(function (v) { return v.dataset.view === hash; })[0].dataset.title;
        var bar = app.querySelector('.s4-top-app-bar .s4-app-bar-title');
        if (t && bar) bar.textContent = t;
        deep = hash;
      }
      if (list.length) {
        var name = deep || (cur ? cur.dataset.view : list[0].dataset.view);
        list.forEach(function (v) { v.hidden = v.dataset.view !== name; });
      }
      var home = name0(app, deep, cur, list);
      window.addEventListener('hashchange', function () {
        if (!app.isConnected) return;
        var want = decodeURIComponent(location.hash.slice(1)).split('/')[0] || home;
        if (!list.some(function (v) { return v.dataset.view === want; })) return;
        var now = app.querySelector('.s4-nav-bar .s4-nav-item[aria-current="page"][data-view], .s4-nav-rail .s4-nav-item[aria-current="page"][data-view]');
        if (now && now.dataset.view === want) return;
        if (!now && views(app).some(function (v) { return !v.hidden && v.dataset.view === want; })) return;
        if (S4.pages) S4.pages.reset(app);
        /* the navigation item is clicked for the app's own handlers, but its link must not navigate: the URL is already where the person put it (a new entry would cut off Forward) */
        var veto = function (e) { e.preventDefault(); };
        document.addEventListener('click', veto, { once: true });
        S4.app.go(app, want);
        document.removeEventListener('click', veto);
      });
      app.addEventListener('s4-change', function (e) {
        var nav = e.target;
        if (!nav.matches || !nav.matches('.s4-nav-bar, .s4-nav-rail') || !e.detail || !e.detail.item) return;
        var items = Array.prototype.slice.call(nav.querySelectorAll('.s4-nav-item'));
        var prev = app._s4lastIndex;
        if (prev == null) {
          var visible = views(app).filter(function (v) { return !v.hidden; })[0];
          items.forEach(function (x, i) { if (visible && x.dataset.view === visible.dataset.view) prev = i; });
        }
        mirror(app, nav, e.detail.index);
        app._s4lastIndex = e.detail.index;
        var view = e.detail.item.dataset.view;
        if (view && S4.pages) S4.pages.reset(app);   /* a destination was chosen: any pushed page closes first */
        if (view) show(app, view, prev == null || e.detail.index >= prev ? 1 : -1);
      });
    });
  });
})();
