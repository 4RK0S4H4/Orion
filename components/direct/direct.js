/* Direct manipulation (decision 0051): move things with your hand instead of through a menu.
   1. Reorder.  <ul class="s4-list" data-reorder> … <li><div class="s4-list-item"><button class="s4-drag-handle" aria-label="Move Launch checklist">…</button>…</div></li>
      Drag an item by its .s4-drag-handle (mouse, pen or finger; the handle never scrolls the page). With no handle the
      whole item drags: at once with a mouse, after a short hold with a finger. Items make room as you go and the one you
      dropped settles into place. Containers that share data-reorder-group="name" pass items between them (boards).
      Keyboard: on a handle, Space picks the item up, Arrow keys move it, Space drops it, Escape puts it back.
      Fires s4-reorder { item, from, to, fromList, toList } on the list it lands in. S4.reorder.move(item, toIndex, toList).
   2. Swipe.  <li data-swipe><div class="s4-list-item">…</div><div class="s4-swipe-actions"><button …>Archive</button></div></li>
      On a touch screen, drag a row sideways to uncover its actions; let go past half way and they stay; a long swipe (past a little over half
      the row) runs the action marked data-swipe-primary, which fills the uncovered strip to show it. The same buttons are always reachable by keyboard and are in the row's menu.
   3. Select several.  <ul data-selectable data-selection-bar="#bar"> and <div class="s4-selection-bar" id="bar" hidden>
      Hold a row (or Ctrl/⌘-click it, or Shift-click for a range) to start selecting; after that a tap adds or removes a
      row. The bar shows the count and the actions for all of them; inside a .s4-top-app-bar it takes the bar's place.
      Escape or [data-selection-clear] ends it. Fires s4-selection { items, count }. S4.selection.items(el) / clear(el) / all(el).
   Motion: Morph calm (rows making room and settling); nothing else animates while your finger is down. */
(function () {
  var S4 = window.S4;
  var live;
  function say(text) {
    if (!live) { live = document.createElement('div'); live.className = 's4-visually-hidden'; live.setAttribute('aria-live', 'assertive'); document.body.appendChild(live); }
    live.textContent = ''; setTimeout(function () { live.textContent = text; }, 30);
  }
  function kids(list) { return Array.prototype.filter.call(list.children, function (c) { return !c.hidden && !c.matches('.s4-list-subheader, [data-reorder-fixed], .s4-reorder-gap'); }); }
  function label(item) { var h = item.querySelector('.s4-list-headline, .s4-card-title, [data-reorder-label]'); return (h ? h.textContent : item.textContent).replace(/\s+/g, ' ').trim().slice(0, 60); }

  /* ---------- 1. reorder ---------- */
  /* move a node and let everything that shifted glide from where it was (FLIP) */
  function place(item, list, before, skip) {
    var movers = kids(item.parentElement).concat(list !== item.parentElement ? kids(list) : []).filter(function (x) { return x !== skip; });
    var was = movers.map(function (x) { return x.getBoundingClientRect(); });
    list.insertBefore(item, before || null);
    /* from where each one is showing right now (even mid-glide) to where it now belongs */
    movers.forEach(function (x, i) { var r = resting(x), dx = was[i].left - r.left, dy = was[i].top - r.top; if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) S4.transition.move(x, dx, dy); });
  }
  function groupLists(list) {
    var g = list.getAttribute('data-reorder-group');
    return g ? Array.prototype.slice.call(document.querySelectorAll('[data-reorder][data-reorder-group="' + g + '"]')) : [list];
  }
  /* where an element sits in the layout, ignoring a glide it may be in the middle of (so rows that are still making
     room are judged by where they are going, and the slot never flickers between two places) */
  function resting(k) {
    var r = k.getBoundingClientRect(), t = getComputedStyle(k).transform;
    if (!t || t === 'none') return r;
    var m = new DOMMatrixReadOnly(t);
    return { left: r.left - m.m41, top: r.top - m.m42, width: r.width, height: r.height, right: r.right - m.m41, bottom: r.bottom - m.m42 };
  }
  function drag(list, item, e) {
    var lists = groupLists(list), fromList = list, fromIndex = kids(list).indexOf(item);
    var r0 = item.getBoundingClientRect(), grabX = e.clientX - r0.left, grabY = e.clientY - r0.top, pid = e.pointerId, x = e.clientX, y = e.clientY, raf = 0, ended = false;
    item.getAnimations().forEach(function (a) { a.cancel(); });
    /* The item is lifted out of the flow where it is: it is NOT moved in the page while your finger is down (on an
       iPhone a touch ends the moment its element is re-inserted). An empty stand-in keeps its place, and it is the
       stand-in that travels through the lists; the item joins it when you let go. */
    var gap = document.createElement(item.tagName === 'LI' ? 'li' : 'div');
    gap.className = 's4-reorder-gap'; gap.setAttribute('aria-hidden', 'true');
    gap.style.blockSize = r0.height + 'px'; gap.style.inlineSize = list.getAttribute('data-reorder') === 'horizontal' ? r0.width + 'px' : '';
    item.parentElement.insertBefore(gap, item.nextSibling);
    var keep = item.getAttribute('style');
    item.style.position = 'fixed'; item.style.left = '0'; item.style.top = '0'; item.style.margin = '0'; item.style.boxSizing = 'border-box';
    item.style.inlineSize = r0.width + 'px'; item.style.blockSize = r0.height + 'px';
    item.setAttribute('data-dragging', ''); document.documentElement.setAttribute('data-s4-dragging', '');
    function follow() {
      item.style.transform = 'none';
      var r = item.getBoundingClientRect();
      item.style.transform = 'translate(' + (x - grabX - r.left) + 'px, ' + (y - grabY - r.top) + 'px)';
    }
    function others(l) { return kids(l).filter(function (k) { return k !== item && k !== gap; }); }
    function target() {
      /* the list under the pointer (or the nearest one sideways), then the slot by the middles of its items */
      var best = null, bd = Infinity;
      lists.forEach(function (l) { var r = l.getBoundingClientRect(), dx = x < r.left ? r.left - x : x > r.right ? x - r.right : 0, dy = y < r.top ? r.top - y : y > r.bottom ? y - r.bottom : 0, d = dx * 3 + dy; if (d < bd) { bd = d; best = l; } });
      var horizontal = best.getAttribute('data-reorder') === 'horizontal', before = null;
      /* the item's own middle decides, so it trades places when it is half way over a neighbour */
      var cx = x - grabX + r0.width / 2, cy = y - grabY + r0.height / 2;
      others(best).some(function (k) {
        var r = resting(k);
        if (horizontal ? cx < r.left + r.width / 2 : cy < r.top + r.height / 2) { before = k; return true; }
        return false;
      });
      return { list: best, before: before };
    }
    function settleGap() {
      var t = target(), after = null, n = gap.nextElementSibling;
      while (n && (n === item || kids(gap.parentElement).indexOf(n) < 0)) n = n.nextElementSibling;
      after = n || null;
      if (!(t.list === gap.parentElement && t.before === after)) place(gap, t.list, t.before, item);
    }
    function step() {
      raf = 0; if (ended) return;
      settleGap(); follow();
      /* near the top or bottom of the window: scroll, so long lists can be crossed in one drag */
      var edge = 56, sc = y < edge ? -(edge - y) / 4 : y > window.innerHeight - edge ? (y - (window.innerHeight - edge)) / 4 : 0;
      if (sc) { window.scrollBy(0, sc); raf = requestAnimationFrame(step); }
    }
    function move(ev) { if (ev.pointerId !== pid) return; ev.preventDefault(); x = ev.clientX; y = ev.clientY; if (!raf) raf = requestAnimationFrame(step); }
    /* once a drag has begun the page must not scroll under the finger (touch-action cannot be changed mid-touch) */
    function noScroll(ev) { if (ev.cancelable) ev.preventDefault(); }
    function finish(cancel) {
      if (ended) return;
      if (!cancel) { settleGap(); follow(); }   /* the last movement may not have been drawn yet */
      ended = true;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', move, true); window.removeEventListener('pointerup', up, true); window.removeEventListener('pointercancel', stop, true); window.removeEventListener('keydown', key, true);
      window.removeEventListener('touchmove', noScroll, { capture: true });
      var shown = item.getBoundingClientRect();
      if (!cancel) gap.parentElement.insertBefore(item, gap);   /* the touch is over: now the item really moves */
      gap.remove();
      if (keep === null) item.removeAttribute('style'); else item.setAttribute('style', keep);
      var rest = item.getBoundingClientRect();
      item.removeAttribute('data-dragging'); document.documentElement.removeAttribute('data-s4-dragging');
      S4.transition.move(item, shown.left - rest.left, shown.top - rest.top);   /* it settles where it belongs */
      var toList = item.parentElement, to = kids(toList).indexOf(item);
      if (!cancel && (toList !== fromList || to !== fromIndex)) {
        S4.util.emit(toList, 's4-reorder', { item: item, from: fromIndex, to: to, fromList: fromList, toList: toList });
        say(label(item) + ' moved to position ' + (to + 1) + ' of ' + kids(toList).length);
      }
    }
    function up(ev) { if (ev.pointerId === pid) finish(false); }
    function stop(ev) { if (ev.pointerId === pid) finish(true); }
    function key(ev) { if (ev.key === 'Escape') { ev.preventDefault(); finish(true); } }
    window.addEventListener('pointermove', move, true); window.addEventListener('pointerup', up, true); window.addEventListener('pointercancel', stop, true); window.addEventListener('keydown', key, true);
    window.addEventListener('touchmove', noScroll, { capture: true, passive: false });
    follow();
  }
  function moveTo(item, toIndex, toList) {
    var from = item.parentElement, list = toList || from, fromIndex = kids(from).indexOf(item);
    var others = kids(list).filter(function (k) { return k !== item; });
    place(item, list, others[Math.max(0, toIndex)] || null);
    var to = kids(list).indexOf(item);
    if (list !== from || to !== fromIndex) S4.util.emit(list, 's4-reorder', { item: item, from: fromIndex, to: to, fromList: from, toList: list });
    return to;
  }
  S4.reorder = { move: moveTo };

  document.addEventListener('pointerdown', function (e) {
    if (e.button || !e.target.closest) return;
    var list = e.target.closest('[data-reorder]'); if (!list) return;
    var item = e.target; while (item && item.parentElement !== list) item = item.parentElement;
    if (!item || item.matches('.s4-list-subheader, [data-reorder-fixed]')) return;
    var handle = e.target.closest('.s4-drag-handle'), hasHandle = !!item.querySelector('.s4-drag-handle');
    if (hasHandle && !handle) return;
    if (!hasHandle && e.target.closest('input, textarea, select, [contenteditable], .s4-swipe-actions')) return;
    var sx = e.clientX, sy = e.clientY, started = false, timer = null;
    var begin = function (ev) { if (started) return; started = true; cleanup(); drag(list, item, ev || e); };
    var cleanup = function () { clearTimeout(timer); window.removeEventListener('pointermove', pre, true); window.removeEventListener('pointerup', cleanup, true); window.removeEventListener('pointercancel', cleanup, true); };
    var pre = function (ev) {
      var far = Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) > 6;
      if (handle || e.pointerType === 'mouse') { if (far) { ev.preventDefault(); begin(ev); } }
      else if (far) cleanup();   /* a finger that moves before the hold ends is scrolling */
    };
    if (handle) e.preventDefault();   /* the handle never selects text or scrolls */
    window.addEventListener('pointermove', pre, true); window.addEventListener('pointerup', cleanup, true); window.addEventListener('pointercancel', cleanup, true);
    if (!handle && e.pointerType !== 'mouse') timer = setTimeout(function () { if (navigator.vibrate) try { navigator.vibrate(8); } catch (x) {} begin(e); }, 350);
  }, true);
  /* a drag must not end as a click on what was dragged */
  document.addEventListener('click', function (e) { if (document.documentElement.hasAttribute('data-s4-dragging')) { e.preventDefault(); e.stopPropagation(); } }, true);

  /* keyboard: Space on a handle picks up, arrows move, Space drops, Escape puts it back */
  document.addEventListener('keydown', function (e) {
    var h = e.target.closest ? e.target.closest('.s4-drag-handle') : null; if (!h) return;
    var list = h.closest('[data-reorder]'); if (!list) return;
    var item = h; while (item && item.parentElement !== list && !(item.parentElement && item.parentElement.hasAttribute('data-reorder'))) item = item.parentElement;
    if (!item) return;
    var held = h.getAttribute('aria-pressed') === 'true';
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (!held) { h.setAttribute('aria-pressed', 'true'); h._s4home = { list: item.parentElement, next: item.nextElementSibling }; say(label(item) + ' picked up. Use the arrow keys to move it, Space to drop it, Escape to cancel.'); }
      else { h.setAttribute('aria-pressed', 'false'); say(label(item) + ' dropped at position ' + (kids(item.parentElement).indexOf(item) + 1)); }
      return;
    }
    if (!held) return;
    var cur = item.parentElement, all = kids(cur), i = all.indexOf(item), lists = groupLists(cur), li = lists.indexOf(cur);
    var horizontal = cur.getAttribute('data-reorder') === 'horizontal', prevKey = horizontal ? 'ArrowLeft' : 'ArrowUp', nextKey = horizontal ? 'ArrowRight' : 'ArrowDown';
    if (e.key === 'Escape') { e.preventDefault(); h.setAttribute('aria-pressed', 'false'); if (h._s4home) place(item, h._s4home.list, h._s4home.next && h._s4home.next.parentElement === h._s4home.list ? h._s4home.next : null); h.focus(); say('Move cancelled'); return; }
    var to = null, toList = cur;
    if (e.key === prevKey && i > 0) to = i - 1;
    else if (e.key === nextKey && i < all.length - 1) to = i + 1;
    else if (!horizontal && e.key === 'ArrowLeft' && li > 0) { toList = lists[li - 1]; to = Math.min(i, kids(toList).length); }
    else if (!horizontal && e.key === 'ArrowRight' && li < lists.length - 1) { toList = lists[li + 1]; to = Math.min(i, kids(toList).length); }
    else if (/^Arrow/.test(e.key)) { e.preventDefault(); return; }
    else return;
    e.preventDefault();
    var at = moveTo(item, to, toList); h.focus();
    say(label(item) + ', position ' + (at + 1) + ' of ' + kids(toList).length + (toList !== cur && toList.getAttribute('aria-label') ? ', ' + toList.getAttribute('aria-label') : ''));
  });

  /* ---------- 2. swipe ---------- */
  var openRow = null;
  function swipeParts(row) { return { face: row.querySelector(':scope > .s4-list-item, :scope > [data-swipe-face]'), acts: row.querySelector(':scope > .s4-swipe-actions') }; }
  function swipeSet(row, on) {
    var p = swipeParts(row); if (!p.face || !p.acts) return;
    var rtl = getComputedStyle(row).direction === 'rtl', w = p.acts.getBoundingClientRect().width, now = new DOMMatrixReadOnly(getComputedStyle(p.face).transform).m41;
    var to = on ? (rtl ? w : -w) : 0;
    p.face.style.transform = to ? 'translateX(' + to + 'px)' : '';
    /* the actions stay uncovered until the row has finished closing over them */
    row.setAttribute('data-swiping', '');
    S4.transition.shift(p.face, 'translateX(' + now + 'px)', to ? 'translateX(' + to + 'px)' : 'none').then(function (done) { if (done) row.removeAttribute('data-swiping'); });
    row.toggleAttribute('data-swiped', !!on);
    if (on) { if (openRow && openRow !== row) swipeSet(openRow, false); openRow = row; } else if (openRow === row) openRow = null;
  }
  S4.swipe = { open: function (row) { swipeSet(row, true); }, close: function (row) { swipeSet(row || openRow, false); } };
  document.addEventListener('pointerdown', function (e) {
    if (!e.target.closest) return;
    var row = e.target.closest('[data-swipe]');
    if (openRow && openRow !== row) swipeSet(openRow, false);
    if (!row || e.pointerType === 'mouse' || e.target.closest('.s4-swipe-actions, .s4-drag-handle')) return;
    var p = swipeParts(row); if (!p.face || !p.acts) return;
    var rtl = getComputedStyle(row).direction === 'rtl', sign = rtl ? 1 : -1, w = p.acts.getBoundingClientRect().width, full = row.getBoundingClientRect().width;
    var sx = e.clientX, sy = e.clientY, base = row.hasAttribute('data-swiped') ? sign * w : 0, dx = base, active = false, pid = e.pointerId;
    var primary = p.acts.querySelector('[data-swipe-primary]');
    function move(ev) {
      if (ev.pointerId !== pid) return;
      var mx = ev.clientX - sx, my = ev.clientY - sy;
      if (!active) { if (Math.abs(mx) < 8 || Math.abs(mx) < Math.abs(my) * 1.2) { if (Math.abs(my) > 10) end(); return; } active = true; p.face.getAnimations().forEach(function (a) { a.cancel(); }); row.setAttribute('data-swiping', ''); }
      ev.preventDefault();
      dx = base + mx;
      if (dx * sign < 0) dx = 0;                                           /* only toward the actions */
      if (Math.abs(dx) > full) dx = sign * full;
      /* A long swipe: past a little over half the row, letting go runs the main action. The row follows the finger
         all the way (no resistance: on a phone that made the long swipe impossible to reach) and the main action
         takes over the uncovered strip, so you can see what letting go will do. */
      var commit = !!primary && Math.abs(dx) > Math.max(w + 40, full * 0.55);
      if (commit !== row.hasAttribute('data-swipe-commit')) { row.toggleAttribute('data-swipe-commit', commit); if (commit && navigator.vibrate) try { navigator.vibrate(8); } catch (x) {} }
      p.face.style.transform = 'translateX(' + dx + 'px)';
    }
    function end() {
      window.removeEventListener('pointermove', move, true); window.removeEventListener('pointerup', up, true); window.removeEventListener('pointercancel', up, true);
      window.removeEventListener('touchmove', hold, { capture: true });
      if (!active) row.removeAttribute('data-swiping');
    }
    /* once the row is following the finger, the page must not also scroll or go back a page */
    function hold(ev) { if (active && ev.cancelable) ev.preventDefault(); }
    function up(ev) {
      if (ev.pointerId !== pid) return; end(); if (!active) return;
      if (ev.type === 'pointercancel') { row.removeAttribute('data-swipe-commit'); swipeSet(row, row.hasAttribute('data-swiped')); return; }
      var far = row.hasAttribute('data-swipe-commit');
      document.documentElement.setAttribute('data-s4-dragging', ''); setTimeout(function () { document.documentElement.removeAttribute('data-s4-dragging'); }, 0);
      /* run it on the next tick, after the guard that swallows the stray click a drag leaves behind has lifted */
      if (far && primary) { row.removeAttribute('data-swipe-commit'); swipeSet(row, false); setTimeout(function () { primary.click(); }, 0); }
      else swipeSet(row, Math.abs(dx) > w / 2);
    }
    window.addEventListener('pointermove', move, { capture: true, passive: false }); window.addEventListener('pointerup', up, true); window.addEventListener('pointercancel', up, true);
    window.addEventListener('touchmove', hold, { capture: true, passive: false });
  });
  document.addEventListener('focusin', function (e) { var a = e.target.closest ? e.target.closest('.s4-swipe-actions') : null; if (a && !a.parentElement.hasAttribute('data-swiped')) swipeSet(a.parentElement, true); });
  document.addEventListener('click', function (e) { var a = e.target.closest ? e.target.closest('.s4-swipe-actions') : null; if (a && a.parentElement.hasAttribute('data-swiped')) setTimeout(function () { swipeSet(a.parentElement, false); }, 0); });

  /* ---------- 3. select several ---------- */
  function sItems(el) { return Array.prototype.filter.call(el.querySelectorAll(':scope > li, :scope > [data-select-item], :scope > tr'), function (x) { return !x.matches('.s4-list-subheader'); }); }
  function picked(el) { return sItems(el).filter(function (x) { return x.hasAttribute('data-picked'); }); }
  function bar(el) { var s = el.getAttribute('data-selection-bar'); return s ? document.querySelector(s) : null; }
  function sync(el) {
    var items = picked(el), n = items.length, b = bar(el);
    el.toggleAttribute('data-selecting', n > 0);
    sItems(el).forEach(function (x) { if (el.hasAttribute('data-selecting')) x.setAttribute('aria-checked', String(x.hasAttribute('data-picked'))); else x.removeAttribute('aria-checked'); });
    if (b) {
      var c = b.querySelector('[data-selection-count]'); if (c) c.textContent = n + ' Selected';
      var was = !b.hidden; b.hidden = !n;
      var top = b.closest('.s4-top-app-bar'); if (top) top.toggleAttribute('data-selecting', n > 0);
      if (n && !was) S4.transition.fade(b, true);
    }
    S4.util.emit(el, 's4-selection', { items: items, count: n });
  }
  function toggle(el, item, on) { item.toggleAttribute('data-picked', on === undefined ? !item.hasAttribute('data-picked') : on); el._s4anchor = item; sync(el); }
  function clear(el) { picked(el).forEach(function (x) { x.removeAttribute('data-picked'); }); sync(el); }
  S4.selection = {
    items: picked, clear: clear,
    all: function (el) { sItems(el).forEach(function (x) { if (!x.hidden) x.setAttribute('data-picked', ''); }); sync(el); },
    toggle: function (el, item, on) { toggle(el, item, on); }
  };
  function itemOf(el, t) { var x = t; while (x && x.parentElement !== el) x = x.parentElement; return x && sItems(el).indexOf(x) >= 0 ? x : null; }
  var holdDone = false;
  document.addEventListener('pointerdown', function (e) {
    holdDone = false;
    if (!e.target.closest || e.pointerType === 'mouse') return;
    var el = e.target.closest('[data-selectable]'); if (!el || el.hasAttribute('data-selecting') || e.target.closest('.s4-drag-handle, .s4-swipe-actions, input, textarea')) return;
    var item = itemOf(el, e.target); if (!item) return;
    var sx = e.clientX, sy = e.clientY;
    var t = setTimeout(function () { off(); holdDone = true; if (navigator.vibrate) try { navigator.vibrate(8); } catch (x) {} toggle(el, item, true); }, 450);
    function mv(ev) { if (Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) > 8) off(); }
    function off() { clearTimeout(t); window.removeEventListener('pointermove', mv, true); window.removeEventListener('pointerup', off, true); window.removeEventListener('pointercancel', off, true); }
    window.addEventListener('pointermove', mv, true); window.addEventListener('pointerup', off, true); window.addEventListener('pointercancel', off, true);
  }, true);
  document.addEventListener('contextmenu', function (e) { if (holdDone) e.preventDefault(); }, true);
  /* while selecting, a tap on a row adds or removes it instead of opening it */
  document.addEventListener('click', function (e) {
    if (!e.target.closest) return;
    var c = e.target.closest('[data-selection-clear]');
    if (c) { var b = c.closest('.s4-selection-bar'); document.querySelectorAll('[data-selectable]').forEach(function (el) { if (!b || bar(el) === b) clear(el); }); return; }
    var el = e.target.closest('[data-selectable]'); if (!el) return;
    var item = itemOf(el, e.target); if (!item) return;
    if (holdDone) { holdDone = false; e.preventDefault(); e.stopPropagation(); return; }   /* the tap that ended the hold */
    var pick = e.target.closest('[data-select-toggle]');
    if (!(el.hasAttribute('data-selecting') || e.ctrlKey || e.metaKey || e.shiftKey || pick)) return;
    if (e.target.closest('.s4-swipe-actions, .s4-drag-handle')) return;
    e.preventDefault(); e.stopPropagation();
    if (e.shiftKey && el._s4anchor) {
      var all = sItems(el), a = all.indexOf(el._s4anchor), z = all.indexOf(item);
      all.slice(Math.min(a, z), Math.max(a, z) + 1).forEach(function (x) { x.setAttribute('data-picked', ''); });
      sync(el);
    } else toggle(el, item);
  }, true);
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var any = false;
    document.querySelectorAll('[data-selectable][data-selecting]').forEach(function (el) { any = true; clear(el); });
    if (any) e.preventDefault();
  });
  S4.register('direct', function (scope) {
    S4.util.all(scope, '[data-selectable]').forEach(function (el) { if (S4.util.once(el, 'selectable')) { var b = bar(el); if (b) b.hidden = true; } });
    S4.util.all(scope, '.s4-drag-handle').forEach(function (h) { if (!h.hasAttribute('aria-pressed')) h.setAttribute('aria-pressed', 'false'); });
  });
})();
