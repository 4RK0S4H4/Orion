/* S4.snackbar({ text, action, onAction, closable, multiline, duration }) -> { dismiss }
   One shows at a time: a new snackbar replaces the one showing. Rises a little and fades in; sits above a nav bar, a docked
   toolbar or a FAB in the corner. Announced politely to screen readers. Stays while hovered or focused.
   Default duration: 4s, or 6s when it has an action; 0 keeps it until dismissed.
   Decision 0076: (1) several pending Undos each stay undoable: a snackbar with an action that a newer one replaces waits
   underneath, and comes back, newest first, once the newer one's action has run; when the showing one runs
   out on its own or is closed, the waiting ones are let go with it. (2) Acting on a snackbar or letting it go never leaves
   focus on <body>: it returns to what had focus when the snackbar was made (never into a text field, 0049: its cell or
   field's container instead), else to the main landmark (S4.util.land). */
(function () {
  var S4 = window.S4, host = null, current = null, waiting = [];
  function ensureHost() {
    if (host && host.isConnected) return host;
    host = document.createElement('div'); host.className = 's4-snackbar-host'; host.setAttribute('role', 'status'); host.setAttribute('aria-live', 'polite');
    host.setAttribute('data-s4-skip', '');
    document.body.appendChild(host);
    return host;
  }
  function offset() {   /* lift above anything fixed in the lower half (a FAB sits above the nav bar, so it isn't flush with the edge) */
    var lift = 0, vh = window.innerHeight;
    document.querySelectorAll('.s4-nav-bar, .s4-toolbar[data-type="docked"], .s4-fab[data-fixed], .s4-toolbar-dock').forEach(function (el) {
      var r = el.getBoundingClientRect(); if (r.height && getComputedStyle(el).display !== 'none' && r.top > vh / 2) lift = Math.max(lift, vh - r.top);
    });
    ensureHost().style.setProperty('--s4-snackbar-offset', lift + 'px');
  }
  /* where focus goes when the snackbar's button holds it: what had focus, or (a field) the cell or box round it */
  function back(op) { return op && S4.util.typable(op) ? op.closest('[tabindex], td') : op; }
  S4.snackbar = function (o) {
    o = typeof o === 'string' ? { text: o } : (o || {});
    var ae = document.activeElement, opener = ae !== document.body && !ae.closest('.s4-snackbar-host') ? ae : null;
    if (current) {
      var was = current;
      if (was.o.action) waiting.push(was.o);
      was.dismiss(true);
    }
    offset();
    var el = document.createElement('div'); el.className = 's4-snackbar';
    if (o.multiline) el.setAttribute('data-multiline', '');
    var t = document.createElement('span'); t.className = 's4-snackbar-text'; t.textContent = o.text || ''; el.appendChild(t);
    var gone = false, api;
    if (o.action) {
      var a = document.createElement('button'); a.type = 'button'; a.className = 's4-button s4-snackbar-action'; a.dataset.variant = 'text'; a.textContent = o.action;
      a.addEventListener('click', function () {
        S4.util.release(el, back(opener));
        if (o.onAction) o.onAction();
        api.dismiss(true);
        /* the one under it is undoable now */
        var next = waiting.pop(); if (next) S4.snackbar(next);
      });
      el.appendChild(a);
    }
    if (o.closable) {
      var c = document.createElement('button'); c.type = 'button'; c.className = 's4-icon-button'; c.setAttribute('aria-label', 'Dismiss');
      c.innerHTML = '<span class="s4-icon" data-icon="close"></span>'; c.addEventListener('click', function () { api.dismiss(false, true); });
      el.appendChild(c); S4.init(c);
    }
    ensureHost().appendChild(el);
    S4.transition.rise(el, { open: true });
    var ms = o.duration != null ? o.duration : (o.action ? 6000 : 4000), timer = null, held = false;
    function arm() { clearTimeout(timer); if (ms && !held) timer = setTimeout(function () { api.dismiss(false, true); }, ms); }
    el.addEventListener('pointerenter', function () { held = true; clearTimeout(timer); });
    el.addEventListener('pointerleave', function () { held = false; arm(); });
    el.addEventListener('focusin', function () { held = true; clearTimeout(timer); });
    el.addEventListener('focusout', function () { held = false; arm(); });
    api = {
      element: el, o: o,
      /* instant: no exit animation; replaced: made room for a newer one (its Undo waits); otherwise it ran out or was closed, so what waits is let go */
      dismiss: function (instant, letGo) {
        if (gone) return; gone = true; clearTimeout(timer); if (current === api) current = null;
        if (letGo) waiting.length = 0;
        S4.util.release(el, back(opener));
        if (instant) el.remove(); else S4.transition.rise(el, { open: false }).then(function () { el.remove(); });
      }
    };
    current = api; arm();
    return api;
  };
  window.addEventListener('resize', function () { if (current) offset(); });
})();
