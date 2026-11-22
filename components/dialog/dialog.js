/* Dialogs and sheets share the opening machinery here.
   - [data-dialog="id"] opens <dialog class="s4-dialog" id> modally with a container transform from the opener
     (decision 0001: the opener becomes the dialog). [data-close="value"] or Escape closes it, collapsing back into the opener.
   - S4.dialog.open(id | el, { from: element }) / S4.dialog.close(id | el, value). The dialog fires s4-open and s4-close
     { value } (value is "" for Escape or a click on the scrim).
   - Focus: the dialog itself, never a text field (decisions 0043 and 0049: there is no opt-in for fields any more);
     [data-autofocus] on a button picks that button.
     Focus returns to the opener, else to what had it, else to the main landmark (S4.util.land, decision 0069), never <body>.
     Bottom and side sheets are floating panels and open the same way.
   - Tool panels (decision 0054): data-modeless on a floating panel opens it without a scrim and leaves the page behind
     it live (scroll it, tap it), from 600 wide. It closes with its Close button, Escape while focus is inside it, or
     its opener (a second tap). On a phone it is modal like any other panel. Dialogs are always modal.
   - Phones (decision 0064): dialogs and panels sit in the bottom of the screen (dialog.css, sheet.css), and a swipe down
     puts one away: it follows the finger, and past a quarter of its height (or after a flick) it leaves from where the
     finger let go; otherwise it settles back. data-persistent only settles back. Never the only way out: Cancel,
     Escape, Back (Android's Back closes a modal dialog natively, through the cancel event) and a tap outside work too. */
(function () {
  var S4 = window.S4;
  var FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  function el(x) { return typeof x === 'string' ? document.getElementById(x) : x; }
  /* Decision 0043: opening never focuses a text field (on a phone that pops the keyboard up over the dialog that just
     appeared). [autofocus] or [data-autofocus] is the app asking for it explicitly; otherwise the dialog itself takes
     focus, so Tab goes to its first control and Escape and screen readers work as usual. */
  function initialFocus(d) {
    var a = d.querySelector('[autofocus], [data-autofocus]');
    if (a && !S4.util.typable(a)) return a;
    if (a) a.removeAttribute('autofocus');
    if (!d.hasAttribute('tabindex')) d.setAttribute('tabindex', '-1');
    return d;
  }
  function narrow() { return window.matchMedia && window.matchMedia('(max-width: 599.98px)').matches; }
  function modeless(d) { return d.hasAttribute('data-modeless') && !d.classList.contains('s4-dialog') && !narrow(); }
  function open(id, opts) {
    var d = el(id); if (!d || d.open) return;
    opts = opts || {};
    var from = opts.from || null;
    d._s4from = from; d.style.visibility = '';
    d._s4prev = document.activeElement && document.activeElement !== document.body ? document.activeElement : null;   /* what had focus, for the way back */
    d._s4modeless = modeless(d);
    /* the attribute, not show(): show() would put the cursor in the panel's first field (decision 0049) */
    if (d._s4modeless) { d.setAttribute('open', ''); d.setAttribute('aria-modal', 'false'); } else { d.removeAttribute('aria-modal'); d.showModal(); }
    initialFocus(d).focus({ preventScroll: true });
    S4.transition.restore(d);
    if (!d._s4modeless) S4.transition.scrim(d, true);
    var p = motion(d, true);
    S4.util.emit(d, 's4-open', { from: from });
    return p;
  }
  /* decision 0043: sheets are floating panels; like dialogs they pop in (rise or step in from their side, and fade) */
  function motion(d, open, pulled) {
    if (d.classList.contains('s4-side-sheet') && !narrow()) return S4.transition.pop(d, { open: open, axis: 'x' });
    return S4.transition.pop(d, { open: open, from: pulled });   /* pulled: how far a finger dragged it down (swipe) */
  }

  /* swipe down to put it away (phones, decision 0064). Starts only where nothing else wants the finger: not on a field,
     a slider or a scrolling area that is not at its top, and not a sideways or upward drag. The surface follows the
     finger (it is not animated under it, decision 0052); the way back or away is a transition from where it was let go. */
  function scrolled(t, d) {
    for (var n = t; n && n !== d.parentNode; n = n.parentNode) if (n.nodeType === 1 && n.scrollTop > 0) return true;
    return false;
  }
  function swipe(d) {
    var y0 = null, x0 = 0, t0 = 0, dy = 0, dragging = false;
    d.addEventListener('touchstart', function (e) {
      y0 = null;
      if (!narrow() || !d.open || d._s4closing || d._s4modeless || e.touches.length !== 1) return;
      if (e.target.closest && e.target.closest('input, textarea, select, [contenteditable], .s4-slider, [data-s4-noswipe]')) return;
      if (scrolled(e.target, d)) return;
      y0 = e.touches[0].clientY; x0 = e.touches[0].clientX; t0 = e.timeStamp; dy = 0; dragging = false;
    }, { passive: true });
    d.addEventListener('touchmove', function (e) {
      if (y0 === null) return;
      var y = e.touches[0].clientY - y0, x = e.touches[0].clientX - x0;
      if (!dragging) {
        if (Math.abs(y) < 8 && Math.abs(x) < 8) return;
        if (y <= 0 || Math.abs(x) > Math.abs(y)) { y0 = null; return; }   /* up or sideways: not ours */
        dragging = true;
      }
      e.preventDefault();
      dy = Math.max(0, y);
      d.style.transform = 'translateY(' + dy + 'px)';
      /* a modal panel's scrim follows the finger (decision 0066; opacity under direct manipulation, not a transition);
         a dialog's stays: it is a question, not a surface you move */
      if (!d.classList.contains('s4-dialog')) { d.setAttribute('data-s4-dragging', ''); d.style.setProperty('--s4-sheet-drag', String(Math.min(1, dy / Math.max(1, d.offsetHeight)))); }
    }, { passive: false });
    function end(e) {
      if (y0 === null) return;
      y0 = null;
      if (!dragging) return;
      dragging = false;
      var flick = dy > 24 && dy / Math.max(1, e.timeStamp - t0) > 0.5;
      d.removeAttribute('data-s4-dragging');
      if (!d.hasAttribute('data-persistent') && (dy > d.offsetHeight / 4 || flick)) { close(d, '', { pulled: dy }); return; }
      d.style.removeProperty('--s4-sheet-drag');   /* the scrim settles back with State (sheet.css) */
      d.style.transform = '';
      S4.transition.shift(d, 'translateY(' + dy + 'px)', 'none');   /* settles back */
    }
    d.addEventListener('touchend', end);
    d.addEventListener('touchcancel', end);
  }
  function close(id, value, opts) {
    var d = el(id); if (!d || !d.open || d._s4closing) return Promise.resolve();
    d._s4closing = true;
    var from = d._s4from;
    var drag = parseFloat(d.style.getPropertyValue('--s4-sheet-drag')) || 0;
    if (!d._s4modeless) S4.transition.scrim(d, false, drag ? { from: 1 - drag } : undefined);   /* from where the finger left it */
    var p = motion(d, false, opts && opts.pulled);
    return p.then(function () {
      d.close(value || '');
      S4.transition.restore(d);
      d.getAnimations({ subtree: true }).forEach(function (a) { a.cancel(); });
      d.style.transform = '';
      d.style.removeProperty('--s4-sheet-drag');
      d._s4closing = false;
      /* focus goes back to the opener; with none (opened by a shortcut with nothing focused) to what had focus; with neither
         to the main landmark, never <body> (decisions 0065 and 0069) */
      var back = [from, d._s4prev].filter(function (x) { return x && x.isConnected && x.getClientRects().length && !x.closest('[hidden]'); })[0];
      d._s4prev = null;
      if (back) back.focus({ preventScroll: true }); else if (!document.activeElement || document.activeElement === document.body) S4.util.land();
      S4.util.emit(d, 's4-close', { value: value || '' });
    });
  }
  S4.dialog = { open: open, close: close };
  S4.sheet = { open: open, close: close };

  S4.register('dialog', function (scope) {
    S4.util.all(scope, '[data-dialog], [data-sheet]').forEach(function (opener) {
      if (!S4.util.once(opener, 'opener')) return;
      opener.setAttribute('aria-haspopup', 'dialog');
      opener.addEventListener('click', function (e) {
        e.preventDefault();
        var d = el(opener.dataset.dialog || opener.dataset.sheet);
        if (d && d.open && d._s4modeless) close(d, ''); else open(d, { from: opener });   /* a tool panel's button also puts it away */
      });
    });
    S4.util.all(scope, 'dialog.s4-dialog, dialog.s4-bottom-sheet, dialog.s4-side-sheet').forEach(function (d) {
      if (!S4.util.once(d, 'dialog')) return;
      if (!d.classList.contains('s4-palette')) swipe(d);
      d.addEventListener('cancel', function (e) { e.preventDefault(); close(d, ''); });   /* Escape: animate out */
      d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && d._s4modeless && d.open && !e.defaultPrevented) { e.preventDefault(); close(d, ''); } });
      d.addEventListener('click', function (e) {
        var c = e.target.closest('[data-close]');
        if (c && d.contains(c)) { e.preventDefault(); close(d, c.getAttribute('data-close')); return; }
        if (e.target === d) {   /* a click on the scrim (outside the box) dismisses, unless the dialog asks not to */
          var r = d.getBoundingClientRect();
          var outside = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
          if (outside && !d.hasAttribute('data-persistent')) close(d, '');
        }
      });
    });
  });
})();
