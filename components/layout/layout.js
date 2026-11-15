/* Layout behaviour (canonical layouts).
   - [data-split-open] inside an .s4-split: activating it sets data-open on the split (under 840 the detail replaces the
     list). [data-split-back] clears it. Both fire s4-toggle { open } on the split.
   - Under 840 opening goes one level in like a page (decision 0050): the top app bar shows Back and the split's
     data-detail-title, the bottom navigation steps aside, and the phone's Back gesture returns to the list.
   - S4.split.open(split, true|false) does the same from code (e.g. after a listbox s4-change).
   - data-resizable on a split (decision 0051): from 840 a grip sits between the panes. Drag it, or focus it and use the
     arrow keys (Home and End for the limits); double-click or Enter collapses the side pane and brings it back.
     data-resize-key="name" remembers the width and the collapsed state in this browser. Fires s4-resize { size, collapsed }.
     S4.split.resize(split, px) and S4.split.collapse(split, true|false) do it from code. */
(function () {
  function narrow(split) {
    var app = split.closest('.s4-app');
    return (app ? app.clientWidth : window.innerWidth) < 840;
  }
  function set(split, on, fromHistory) {
    if (!split || split.hasAttribute('data-open') === !!on) return;
    var app = split.closest('.s4-app');
    /* inside an app, closing on a phone is "Back": the page stack closes it (and keeps the browser history in step) */
    if (!on && !fromHistory && narrow(split) && app && S4.pages && S4.pages.depth(app)) { S4.pages.back(app); return; }
    split.toggleAttribute('data-open', !!on);
    if (narrow(split)) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      var pane = split.querySelector(on ? '.s4-split-pane ~ .s4-split-pane' : '.s4-split-pane');
      /* a view switch: in from the side you're heading */
      if (pane) S4.transition.enter(pane, on ? 1 : -1);
      if (app && S4.pages) {
        /* inside an app: the same chrome and Back as a pushed page */
        if (on && !fromHistory) S4.pages.sub(app, { title: split.getAttribute('data-detail-title') || '', close: function () { set(split, false, true); } });
      } else if (!fromHistory) {
        if (on) history.pushState({ s4split: true }, '');
        else if (history.state && history.state.s4split) { history.back(); }
      }
    }
    S4.util.emit(split, 's4-toggle', { open: !!on });
  }
  /* ---------- resizable panes ---------- */
  var MIN = 200;
  function side(split) { return split.getAttribute('data-layout') === 'supporting' ? '--s4-split-support' : '--s4-split-list'; }
  function limits(split) { var w = split.getBoundingClientRect().width; return { min: Math.min(MIN, w / 3), max: Math.max(MIN, w * 0.6) }; }
  function store(split, v) { var k = split.getAttribute('data-resize-key'); if (!k) return; try { if (v === undefined) return JSON.parse(localStorage.getItem('s4-split:' + k) || 'null'); localStorage.setItem('s4-split:' + k, JSON.stringify(v)); } catch (e) {} return null; }
  function current(split) { var p = split.getAttribute('data-layout') === 'supporting' ? split.querySelector(':scope > .s4-split-pane:last-child') : split.querySelector(':scope > .s4-split-pane'); return p ? p.getBoundingClientRect().width : 0; }
  function sync(split) {
    var g = split.querySelector(':scope > .s4-split-grip'); if (!g) return;
    var l = limits(split), collapsed = split.hasAttribute('data-collapsed');
    g.setAttribute('aria-valuemin', Math.round(l.min)); g.setAttribute('aria-valuemax', Math.round(l.max));
    g.setAttribute('aria-valuenow', collapsed ? 0 : Math.round(current(split)));
    g.setAttribute('aria-valuetext', collapsed ? 'Collapsed' : Math.round(current(split)) + ' pixels');
  }
  function resize(split, px, quiet) {
    var l = limits(split), v = Math.round(Math.max(l.min, Math.min(l.max, px)));
    split.removeAttribute('data-collapsed');
    split.style.setProperty(side(split), v + 'px');
    sync(split);
    if (!quiet) { store(split, { size: v, collapsed: false }); S4.util.emit(split, 's4-resize', { size: v, collapsed: false }); }
  }
  function collapse(split, on) {
    on = on === undefined ? !split.hasAttribute('data-collapsed') : !!on;
    var size = on ? current(split) : null;
    if (on) split._s4size = size;
    split.toggleAttribute('data-collapsed', on);
    sync(split);
    store(split, { size: Math.round(split._s4size || current(split)), collapsed: on });
    S4.util.emit(split, 's4-resize', { size: on ? 0 : Math.round(current(split)), collapsed: on });
  }
  function resizable(split) {
    var panes = split.querySelectorAll(':scope > .s4-split-pane'); if (panes.length < 2) return;
    var g = document.createElement('div'); g.className = 's4-split-grip'; g.tabIndex = 0;
    g.setAttribute('role', 'separator'); g.setAttribute('aria-orientation', 'vertical'); g.setAttribute('aria-label', split.getAttribute('data-resize-label') || 'Resize panes');
    split.insertBefore(g, panes[1]);
    var saved = store(split);
    if (saved && saved.size) { split.style.setProperty(side(split), saved.size + 'px'); split._s4size = saved.size; if (saved.collapsed) split.setAttribute('data-collapsed', ''); }
    var supporting = split.getAttribute('data-layout') === 'supporting';
    g.addEventListener('pointerdown', function (e) {
      if (e.button) return;
      e.preventDefault(); g.setPointerCapture(e.pointerId); g.setAttribute('data-dragging', '');
      var rtl = getComputedStyle(split).direction === 'rtl';
      var move = function (ev) {
        var r = split.getBoundingClientRect(), fromStart = rtl ? r.right - ev.clientX : ev.clientX - r.left;
        resize(split, supporting ? r.width - fromStart : fromStart, true);
      };
      var up = function () {
        g.removeEventListener('pointermove', move); g.removeEventListener('pointerup', up); g.removeEventListener('pointercancel', up);
        g.removeAttribute('data-dragging');
        if (!split.hasAttribute('data-collapsed')) { var v = Math.round(current(split)); store(split, { size: v, collapsed: false }); S4.util.emit(split, 's4-resize', { size: v, collapsed: false }); }
      };
      g.addEventListener('pointermove', move); g.addEventListener('pointerup', up); g.addEventListener('pointercancel', up);
    });
    g.addEventListener('dblclick', function () { collapse(split); });
    g.addEventListener('keydown', function (e) {
      var rtl = getComputedStyle(split).direction === 'rtl', grow = (supporting ? -1 : 1) * (rtl ? -1 : 1), step = e.shiftKey ? 64 : 16, l = limits(split);
      if (e.key === 'ArrowRight') { e.preventDefault(); resize(split, current(split) + grow * step); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); resize(split, current(split) - grow * step); }
      else if (e.key === 'Home') { e.preventDefault(); resize(split, l.min); }
      else if (e.key === 'End') { e.preventDefault(); resize(split, l.max); }
      else if (e.key === 'Enter') { e.preventDefault(); collapse(split); }
    });
    sync(split);
    if (window.ResizeObserver) new ResizeObserver(function () { sync(split); }).observe(split);
  }

  S4.split = { open: function (split, on) { set(split, on !== false); }, resize: function (split, px) { resize(split, px); }, collapse: collapse };

  window.addEventListener('popstate', function () {
    document.querySelectorAll('.s4-split[data-open]').forEach(function (s) { if (narrow(s) && !(s.closest('.s4-app') && S4.pages)) set(s, false, true); });
  });

  S4.register('layout', function (scope) {
    S4.util.all(scope, '.s4-split').forEach(function (split) {
      if (!S4.util.once(split, 'split')) return;
      if (split.hasAttribute('data-resizable')) resizable(split);
      split.addEventListener('click', function (e) {
        var t = e.target.closest('[data-split-open], [data-split-back]');
        if (!t || t.closest('.s4-split') !== split) return;
        set(split, t.hasAttribute('data-split-open'));
      });
    });
  });
})();
