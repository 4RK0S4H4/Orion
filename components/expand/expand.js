/* Expand: content that opens in place (decision 0047, the first rung of the placement ladder).
   - [data-expand="id"] toggles <div class="s4-expand" id hidden>. [data-expand-close="value"] inside it, or Escape,
     closes it. Expands that share data-group="name" close each other.
   - Opening never focuses a text field (decision 0049: on a phone that throws the keyboard up before you have seen
     what opened). The expand itself takes focus, so Tab goes to its first control and Escape works; the person taps
     the field when they want to type. data-autofocus on a button (never a field) picks that button instead.
     Focus returns to the opener on close.
   - S4.expand.open(id | el, { from }) / close(id | el, value) / toggle(id | el). Fires s4-open and s4-close { value }.
   - Inline confirm: [data-confirm="id"] hides its own row (the closest [data-confirm-row], or the button) and shows
     <span class="s4-confirm" id hidden> in its place; [data-confirm-close="value"] puts the row back and fires
     s4-close { value } on the confirm. Nothing else on the page moves.
   Motion: Reveal for expands, Switch (enter) for the confirm. */
(function () {
  var S4 = window.S4;
  /* the navigation rail has its own data-expand="auto" (it widens by itself): not an opener */
  var OPENER = '[data-expand]:not(.s4-nav-rail)';
  function el(x) { return typeof x === 'string' ? document.getElementById(x) : x; }
  function openers(x) { return Array.prototype.slice.call(document.querySelectorAll('[data-expand="' + x.id + '"]')); }
  function isOpen(x) { return !x.hidden && !x._s4closing; }
  function open(id, opts) {
    var x = el(id); if (!x || isOpen(x)) return Promise.resolve(false);
    opts = opts || {};
    var group = x.dataset.group;
    if (group) document.querySelectorAll('.s4-expand[data-group="' + group + '"]').forEach(function (o) { if (o !== x && isOpen(o)) close(o, ''); });
    x._s4closing = false; x._s4from = opts.from || x._s4from || openers(x)[0] || null;
    x.hidden = false;
    openers(x).forEach(function (b) { b.setAttribute('aria-expanded', 'true'); });
    var p = S4.transition.reveal(x, { open: true });
    var want = x.querySelector('[data-autofocus]');
    if (!want || S4.util.typable(want)) { want = x; if (!x.hasAttribute('tabindex')) x.setAttribute('tabindex', '-1'); }
    want.focus({ preventScroll: true });
    p.then(function (done) { if (done && x.scrollIntoView) x.scrollIntoView({ block: 'nearest', behavior: S4.motion.reduced() ? 'auto' : 'smooth' }); });
    S4.util.emit(x, 's4-open', { from: x._s4from });
    return p;
  }
  function close(id, value) {
    var x = el(id); if (!x || !isOpen(x)) return Promise.resolve(false);
    x._s4closing = true;
    var from = x._s4from, hadFocus = x.contains(document.activeElement);
    openers(x).forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    if (hadFocus && from && from.isConnected) from.focus({ preventScroll: true });
    S4.util.emit(x, 's4-close', { value: value || '' });
    return S4.transition.reveal(x, { open: false }).then(function (done) {
      if (!done || !x._s4closing) return false;
      x.hidden = true; x._s4closing = false; S4.transition.restore(x);
      return true;
    });
  }
  function toggle(id, opts) { var x = el(id); return x && isOpen(x) ? close(x, '') : open(x, opts); }
  S4.expand = { open: open, close: close, toggle: toggle };

  /* inline confirm: the row becomes the question, in place */
  function rowOf(b) { return b.closest('[data-confirm-row]') || b; }
  function ask(b) {
    var c = el(b.dataset.confirm); if (!c) return;
    var row = rowOf(b); c._s4row = row; c._s4from = b;
    row.hidden = true; c.hidden = false;
    S4.transition.enter(c, 0);
    var first = c.querySelector('[data-confirm-close]'); if (first) first.focus({ preventScroll: true });
  }
  function answer(c, value) {
    var row = c._s4row; c.hidden = true;
    if (row) { row.hidden = false; S4.transition.enter(row, 0); }
    if (c._s4from && c._s4from.isConnected) c._s4from.focus({ preventScroll: true });
    S4.util.emit(c, 's4-close', { value: value || '' });
  }

  S4.register('expand', function (scope) {
    S4.util.all(scope, OPENER).forEach(function (b) {
      var x = el(b.dataset.expand);
      if (x && !b.hasAttribute('aria-expanded')) b.setAttribute('aria-expanded', String(!x.hidden));
      if (x && !b.hasAttribute('aria-controls')) b.setAttribute('aria-controls', x.id);
    });
    if (!S4.util.once(document.documentElement, 'expand')) return;
    document.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target : e.target.parentElement; if (!t) return;
      var b = t.closest(OPENER);
      if (b) { toggle(b.dataset.expand, { from: b }); return; }
      var c = t.closest('[data-expand-close]');
      if (c) { var x = c.closest('.s4-expand'); if (x) close(x, c.dataset.expandClose); return; }
      var q = t.closest('[data-confirm]');
      if (q) { ask(q); return; }
      var a = t.closest('[data-confirm-close]');
      if (a) { var box = a.closest('.s4-confirm'); if (box) answer(box, a.dataset.confirmClose); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      var t = e.target.closest ? e.target : null; if (!t) return;
      var box = t.closest('.s4-confirm');
      if (box) { e.preventDefault(); answer(box, ''); return; }
      var x = t.closest('.s4-expand');
      if (!x) { var o = t.closest(OPENER); x = o && el(o.dataset.expand); }   /* Escape on the opener closes what it opened */
      if (x && isOpen(x)) { e.preventDefault(); close(x, ''); }
    });
  });
})();
