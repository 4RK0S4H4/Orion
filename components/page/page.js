/* Pages: going somewhere (decision 0050). A page is a full screen you push into from a view or another page, with a
   Back button in the top app bar, its own title, its own URL and the phone's Back gesture.
     <section class="s4-view" data-view="inbox" data-title="Inbox"> … </section>
     <section class="s4-subpage" data-page="message" data-title="Message" hidden> … </section>     (a sibling of the views)
     <button data-page-open="message" data-page-id="42" data-page-title="Invoice for October">   opens it
     <button data-page-back>                                                                    goes back (so does the bar's Back)
   - S4.pages.open(app, name, { id, title }) / S4.pages.back(app) / S4.pages.home(app) / S4.pages.current(app) -> { name, id } | null
   - The page fires s4-open { id, from } just before it shows (fill it from your data there; set its data-title to
     name it in the bar) and s4-close when left.
   - The URL becomes #view/page/id; opening that link (or reloading) lands on the page, and Back returns to its view.
   - While a page is open the app has data-sub: the top app bar shows Back and the page's title, and on a phone the
     bottom navigation bar steps aside (a pushed page is not a destination). The rail stays on wide screens.
   - Coming back keeps your place: the scroll position of the view you left is restored once it shows again, and focus
     returns to the thing that opened the page (the trigger passed as opts.from, else the focused or last tapped
     control in the view), or to the view itself when that is gone. Focus never drops to <body>.
   - S4.pages.sub(app, { title, close }) gives the same chrome, URL-less, to something that swaps content itself
     (the list-detail split under 840 uses it), so every "one level in" behaves the same.
   Motion: Switch (forward going in, back coming out). Opening a page never focuses a field (decision 0049). */
(function () {
  var S4 = window.S4;
  function st(app) { return app._s4pages || (app._s4pages = { stack: [], axis: {}, base: null }); }
  function scroller(app) { return app.hasAttribute('data-window') ? app.querySelector(':scope > .s4-app-body') : null; }
  function getScroll(app) { var b = scroller(app); return b ? b.scrollTop : window.scrollY; }
  function setScroll(app, y) { var b = scroller(app); if (b) b.scrollTop = y; else window.scrollTo({ top: y, behavior: 'instant' }); }
  function bar(app) { return app.querySelector('.s4-top-app-bar'); }
  function backButton(app) {
    var b = bar(app); if (!b) return null;
    var k = b.querySelector('.s4-app-bar-back');
    if (!k) {
      k = document.createElement('button'); k.type = 'button'; k.className = 's4-icon-button s4-app-bar-back'; k.hidden = true;
      k.setAttribute('aria-label', 'Back'); k.setAttribute('data-page-back', '');
      k.innerHTML = '<span class="s4-icon" data-icon="back"></span>';
      b.insertBefore(k, b.firstChild);
      if (S4.init) S4.init(k);
    }
    return k;
  }
  /* the top app bar and the app follow the stack */
  function chrome(app) {
    var s = st(app), top = s.stack[s.stack.length - 1], k = backButton(app);
    var t = bar(app) && bar(app).querySelector('.s4-app-bar-title');
    if (s.stack.length) app.dataset.sub = String(s.stack.length); else delete app.dataset.sub;
    if (k) k.hidden = !top;
    if (t) {
      if (top) { if (s.base == null) s.base = t.textContent; t.textContent = top.title || s.base; }
      else if (s.base != null) { t.textContent = s.base; s.base = null; }
    }
  }
  function shown(app) {
    var s = st(app);
    for (var i = s.stack.length - 1; i >= 0; i--) if (s.stack[i].el) return s.stack[i].el;
    return app.querySelector('.s4-view:not([hidden])');
  }
  function viewName(app) { var v = app.querySelector('.s4-view:not([hidden])') || (st(app).stack[0] && st(app).stack[0].from); return v && v.dataset ? v.dataset.view || '' : ''; }
  var FOCUSABLE = 'a[href],button,input,select,textarea,summary,[tabindex]';
  /* the control that opened a page: passed in, focused, or last tapped inside the view being left */
  function opener(app, from, given) {
    var c = [given, document.activeElement, app._s4tapped];
    for (var i = 0; i < c.length; i++) {
      var el = c[i]; if (!el || el === document.body || !el.closest) continue;
      el = el.closest(FOCUSABLE) || el;
      if (!from || from.contains(el)) return el;
    }
    return null;
  }
  /* back where you were: focus the opener if it is still there and visible, else the view, never <body> */
  function refocus(app, entry, to) {
    var el = entry.opener;
    if (el && el.isConnected && !el.closest('[hidden]') && el.getClientRects().length) {
      if (!el.matches(FOCUSABLE)) el = el.querySelector(FOCUSABLE) || null;
    } else el = null;
    if (!el && entry.openerId && to) el = to.querySelector('[data-page-id="' + entry.openerId.replace(/"/g, '') + '"]');
    if (!el) { el = to || shown(app); if (el && !el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1'); }
    if (el) el.focus({ preventScroll: true });
  }
  function find(app, name) { return typeof name === 'string' ? app.querySelector('.s4-subpage[data-page="' + name + '"]') : name; }

  function open(app, name, opts) {
    opts = opts || {};
    var page = find(app, name); if (!page) return false;
    var s = st(app), from = shown(app), id = opts.id == null ? '' : String(opts.id);
    if (from === page && page.dataset.pageId === id) return true;
    var prev = from === page ? s.stack[s.stack.length - 1] : null;
    var entry = { el: page, from: prev ? prev.from : from, title: opts.title || page.dataset.title || '', id: id, scroll: prev ? prev.scroll : getScroll(app), name: page.dataset.page,
      opener: prev ? prev.opener : opener(app, from, opts.from), openerId: prev ? prev.openerId : id };
    if (from === page) s.stack.pop();
    s.stack.push(entry);
    page.dataset.pageId = id;
    S4.util.emit(page, 's4-open', { id: id, from: opts.from || null });
    if (!opts.title && page.dataset.title) entry.title = page.dataset.title;   /* the s4-open handler may have set data-title */
    if (!opts.silent) {
      var base = viewName(app) || (s.stack[0].from && s.stack[0].from.dataset.view) || '';
      history.pushState({ s4page: s.stack.length, name: entry.name, id: id, title: entry.title }, '', '#' + [base, entry.name].concat(id ? [encodeURIComponent(id)] : []).join('/'));
    }
    var swap = function () { chrome(app); setScroll(app, 0); if (!page.hasAttribute('tabindex')) page.setAttribute('tabindex', '-1'); Promise.resolve().then(function () { page.focus({ preventScroll: true }); }); };
    if (opts.instant || from === page) { if (entry.from && entry.from !== page) entry.from.hidden = true; page.hidden = false; swap(); }
    else S4.transition.sharedAxis(entry.from, page, 1, s.axis, swap);
    return true;
  }
  /* something that swaps its own content (the split on a phone) borrows the chrome and the Back gesture */
  function sub(app, opts) {
    var s = st(app); opts = opts || {};
    s.stack.push({ el: null, title: opts.title || '', close: opts.close, scroll: getScroll(app), opener: opener(app, null, opts.from) });
    history.pushState({ s4page: s.stack.length }, '');
    chrome(app);
  }
  function leave(app, entry, animate) {
    var s = st(app);
    if (!entry.el) { if (entry.close) entry.close(); chrome(app); setScroll(app, entry.scroll || 0); refocus(app, entry, null); return; }
    S4.util.emit(entry.el, 's4-close', { id: entry.id });
    /* the view must be showing (and tall again) before its scroll can come back: the swap runs before it unhides */
    var to = entry.from, swap = function () { if (to) to.hidden = false; chrome(app); setScroll(app, entry.scroll || 0); refocus(app, entry, to); };
    if (!animate || !to) { entry.el.hidden = true; if (to) to.hidden = false; swap(); }
    else S4.transition.sharedAxis(entry.el, to, -1, s.axis, swap);
  }
  function popTo(app, depth, animate) {
    var s = st(app);
    while (s.stack.length > depth) { var e = s.stack.pop(); leave(app, e, animate && s.stack.length === depth); }
  }
  function back(app) { if (st(app).stack.length) history.back(); }
  function home(app) { var n = st(app).stack.length; if (n) history.go(-n); }
  /* a top-level destination was chosen while pages were open: they close at once, the view switch does the motion */
  function reset(app) {
    var s = st(app); if (!s.stack.length) return;
    var root = s.stack[0].from;
    s.stack.forEach(function (e) { if (e.el) { e.el.hidden = true; S4.util.emit(e.el, 's4-close', { id: e.id }); } else if (e.close) e.close(); });
    s.stack = []; if (root) root.hidden = false; chrome(app);
  }
  function current(app) { var s = st(app), e = s.stack[s.stack.length - 1]; return e && e.el ? { name: e.name, id: e.id } : null; }
  S4.pages = { open: open, back: back, home: home, sub: sub, reset: reset, current: current, depth: function (app) { return st(app).stack.length; } };

  window.addEventListener('popstate', function (e) {
    var depth = (e.state && e.state.s4page) || 0;
    document.querySelectorAll('.s4-app').forEach(function (app) {
      var s = app._s4pages; if (!s) return;
      if (depth < s.stack.length) popTo(app, depth, true);
      else if (depth === s.stack.length + 1 && e.state && e.state.name) open(app, e.state.name, { id: e.state.id, title: e.state.title, silent: true });   /* Forward */
    });
  });

  S4.register('page', function (scope) {
    S4.util.all(scope, '.s4-app').forEach(function (app) {
      if (!S4.util.once(app, 'pages')) return;
      app.querySelectorAll('.s4-subpage').forEach(function (p) { p.hidden = true; });
      /* remember the last control tapped, for openers that call S4.pages.open from code */
      app.addEventListener('pointerdown', function (e) { var t = e.target.closest && e.target.closest(FOCUSABLE); app._s4tapped = t || e.target; }, true);
      app.addEventListener('click', function (e) {
        var t = e.target.closest ? e.target : e.target.parentElement; if (!t) return;
        var b = t.closest('[data-page-back]');
        if (b && app.contains(b)) { e.preventDefault(); back(app); return; }
        var o = t.closest('[data-page-open]');
        if (o && app.contains(o)) { e.preventDefault(); open(app, o.dataset.pageOpen, { id: o.dataset.pageId, title: o.dataset.pageTitle, from: o }); return; }
        /* tapping the destination you are already in goes back to its start */
        var nav = t.closest('.s4-nav-item[aria-current="page"]');
        if (nav && st(app).stack.length) { e.preventDefault(); home(app); }
      });
      /* a link straight to a page: #view/page/id */
      var parts = decodeURIComponent(location.hash.slice(1)).split('/');
      if (parts[1] && find(app, parts[1])) {
        history.replaceState(null, '', '#' + parts[0]);
        open(app, parts[1], { id: parts[2] || '', instant: true });
      }
    });
  });
})();
