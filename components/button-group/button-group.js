/* Button group behaviour.
   data-select="single": exactly one button is pressed (radio-like); data-select="multi": each button toggles.
   Both keep aria-pressed in sync and fire s4-change on the group: { value, values, button } where value is the pressed
   button's value attribute (single) or the array of pressed values (multi).
   Connected and selecting groups are one tab stop with a roving tabindex: arrow keys move focus, Home/End jump to the
   ends, Space/Enter press.
   Connected groups (the Ink Track, decision 0059): while at most one option is pressed (any group but data-select="multi"),
   one ink pill behind the options slides to it, whoever changed aria-pressed (a click, the keyboard, a page script);
   with several pressed each option fills itself and button-group.js marks where a wrapped row starts, so a fused run of
   selected options never joins across rows.
   From script (decision 0060): S4.buttonGroup.set(group, value) presses the option with that value (an array for
   data-select="multi"), moves the tab stop and the ink with it, and fires no s4-change (the page made the change, as
   when a script sets an input's value), so a group can follow something else (the line type under the caret).
   S4.buttonGroup.value(group) reads it back. */
S4.buttonGroup = {
  set: function (g, value) { if (g && g._s4set) g._s4set(value); },
  value: function (g) { return g && g._s4value ? g._s4value() : null; }
};
S4.register('button-group', function (scope) {
  var ITEM = '.s4-button, .s4-icon-button';
  S4.util.all(scope, '.s4-button-group').forEach(function (g) {
    if (!S4.util.once(g, 'buttonGroup')) return;
    if (!g.hasAttribute('role')) g.setAttribute('role', 'group');
    var mode = g.dataset.select;
    var roving = !!mode || g.hasAttribute('data-connected');
    var items = function () {
      return Array.prototype.filter.call(g.children, function (b) { return b.matches(ITEM); });
    };
    var enabled = function () { return items().filter(function (b) { return !b.disabled && b.getAttribute('aria-disabled') !== 'true'; }); };
    var valueOf = function (b) { return b.value || b.getAttribute('value') || b.textContent.trim() || b.getAttribute('aria-label'); };
    var pressed = function () { return items().filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; }); };

    if (mode) {
      items().forEach(function (b) { if (!b.hasAttribute('aria-pressed')) b.setAttribute('aria-pressed', 'false'); });
      if (mode === 'single') {
        var on = pressed();
        if (!on.length && enabled()[0]) enabled()[0].setAttribute('aria-pressed', 'true');
        on.slice(1).forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
      }
    }

    /* roving tabindex: the tab stop is the focused, else the (first) pressed, else the first enabled button */
    var stop = function (current) {
      if (!roving) return;
      var list = enabled();
      var target = current && list.indexOf(current) >= 0 ? current : (pressed().filter(function (b) { return list.indexOf(b) >= 0; })[0] || list[0]);
      items().forEach(function (b) { b.tabIndex = b === target ? 0 : -1; });
    };
    stop();
    g._s4set = function (value) {
      var want = [].concat(value == null ? [] : value).map(String);
      var list = items(), hit = list.filter(function (b) { return want.indexOf(String(valueOf(b))) >= 0; });
      if (mode !== 'multi') hit = hit.slice(0, 1);
      if (mode === 'single' && !hit.length) return;   /* a single group always has one pressed option */
      list.forEach(function (b) { b.setAttribute('aria-pressed', hit.indexOf(b) >= 0 ? 'true' : 'false'); });
      if (!(document.activeElement && g.contains(document.activeElement))) stop();
    };
    g._s4value = function () { var v = pressed().map(valueOf); return mode === 'multi' ? v : (v[0] == null ? null : v[0]); };

    g.addEventListener('click', function (e) {
      var b = e.target.closest(ITEM);
      if (!b || b.parentElement !== g || b.disabled) return;
      if (mode === 'single') {
        if (b.getAttribute('aria-pressed') === 'true') return;
        items().forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        S4.util.emit(g, 's4-change', { value: valueOf(b), values: [valueOf(b)], button: b });
      } else if (mode === 'multi') {
        b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true');
        var vals = pressed().map(valueOf);
        S4.util.emit(g, 's4-change', { value: vals, values: vals, button: b });
      }
      stop(b);
    });

    if (g.hasAttribute('data-connected')) inkTrack(g, mode, items, pressed);

    if (!roving) return;
    g.addEventListener('focusin', function (e) { var b = e.target.closest(ITEM); if (b && b.parentElement === g) stop(b); });
    g.addEventListener('keydown', function (e) {
      var list = enabled(), i = list.indexOf(document.activeElement);
      if (i < 0) return;
      var rtl = getComputedStyle(g).direction === 'rtl';
      var next = { ArrowRight: rtl ? -1 : 1, ArrowDown: 1, ArrowLeft: rtl ? 1 : -1, ArrowUp: -1 }[e.key];
      var to = null;
      if (next) to = list[(i + next + list.length) % list.length];
      else if (e.key === 'Home') to = list[0];
      else if (e.key === 'End') to = list[list.length - 1];
      if (!to) return;
      e.preventDefault();
      stop(to);
      to.focus();
    });
  });

  /* the Ink Track: one ink pill (two copies of it, the front edge on Ink and the back on calm Ink: see the stylesheet)
     placed over the pressed option; the stylesheet moves it, the script only says where */
  function inkTrack(g, mode, items, pressed) {
    var ink = document.createElement('span');
    ink.className = 's4-button-group-ink';
    ink.setAttribute('aria-hidden', 'true');
    g.insertBefore(ink, g.firstChild);
    var placed = false;
    function attr(el, name, on) { if (el.hasAttribute(name) !== on) el.toggleAttribute(name, on); }
    function place(animate) {
      var list = items(), on = pressed();
      /* where a wrapped row starts (a fused run of selected options stops there) */
      var top = null;
      list.forEach(function (b, i) { var t = b.offsetTop; attr(b, 'data-s4-break', i > 0 && t > top + 1); top = t; });
      var one = mode !== 'multi' && on.length <= 1;
      attr(g, 'data-s4-ink', one);
      var b = on[0];
      if (!one || !b || !b.offsetWidth) { attr(ink, 'hidden', true); placed = false; return; }
      attr(ink, 'hidden', false);
      var gr = g.getBoundingClientRect(), br = b.getBoundingClientRect();
      attr(ink, 'data-animate', !!animate && placed);
      ink.style.setProperty('--_ix', (br.left - gr.left - g.clientLeft) + 'px');
      ink.style.setProperty('--_iy', (br.top - gr.top - g.clientTop) + 'px');
      ink.style.setProperty('--_iw', br.width + 'px');
      ink.style.setProperty('--_ih', br.height + 'px');
      placed = true;
    }
    place(false);
    new MutationObserver(function (records) {
      var moved = records.some(function (r) { return r.type === 'attributes'; });
      place(moved);
    }).observe(g, { attributes: true, subtree: true, childList: true, attributeFilter: ['aria-pressed', 'disabled'] });
    if ('ResizeObserver' in window) {
      var ro = new ResizeObserver(function () { place(false); });
      ro.observe(g);
      items().forEach(function (b) { ro.observe(b); });
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { place(false); });
    document.addEventListener('s4-theme', function () { requestAnimationFrame(function () { place(false); }); });
  }
});
