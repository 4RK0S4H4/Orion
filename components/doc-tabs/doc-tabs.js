/* Document tabs (issue 60): the open documents of a desktop window (files, records, conversations), each closable,
   reorderable and remembered. Not the content tabs (components/tabs/): those switch between fixed views of one thing;
   these come and go as documents are opened and closed.
     <div class="s4-doc-tabs" id="docs">
       <div class="s4-doc-tabs-list" role="tablist" aria-label="Open Files">
         <div class="s4-doc-tab" data-modified>
           <button class="s4-doc-tab-label" type="button" role="tab" aria-selected="true" aria-controls="doc-1">
             <span class="s4-icon" data-icon="document"></span>dialogue.json</button>
         </div> …
       </div>
       <button class="s4-icon-button s4-doc-tabs-new" type="button" aria-label="New File" data-cmd="file.new">…</button>
     </div>
   The script adds each tab's close button (a dot while it has unsaved changes), the All Tabs menu when the tabs no
   longer fit, and a right-click menu (Close, Close Others, Close To The Right, Move Left, Move Right).
   Pointer: click selects, middle-click closes, drag reorders (with a finger: hold, then drag). Keys on a tab: Left and
   Right move and select, Home and End, Delete closes, mod+Shift+PageUp / PageDown move it. Anywhere in the window:
   mod+W closes the current tab, mod+Shift+T opens the last closed one again, mod+1 to mod+8 pick a tab and mod+9 the
   last, Ctrl+Tab and Ctrl+Shift+Tab (or Ctrl+PageDown / PageUp) step through them. A browser keeps some of these for
   itself (mod+W, Ctrl+Tab, mod+1…9); in an installed app or a desktop shell they all reach the page, and every one
   has a menu or a click that does the same.
   Events on .s4-doc-tabs: s4-change { tab, index, panel } on select; s4-close { tab, panel, modified } before a tab
   closes (preventDefault keeps it open); s4-reorder { item, from, to } (from components/direct/).
   S4.docTabs.add(bar, { label, icon, panel, modified, id, next, select }), .select(tab), .close(tab), .reopen(bar), .move(tab, index),
   .modified(tab, on), .tabs(bar), .current(bar). */
(function () {
  var S4 = window.S4, uid = 0, lastBar = null;
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function barOf(el) { return el && el.closest ? el.closest('.s4-doc-tabs') : null; }
  function listOf(bar) { return bar.querySelector('.s4-doc-tabs-list'); }
  function tabs(bar) { return Array.prototype.slice.call(listOf(bar).querySelectorAll(':scope > .s4-doc-tab')); }
  function labelOf(tab) { return tab.querySelector('.s4-doc-tab-label'); }
  function textOf(tab) { var l = labelOf(tab); return l ? l.textContent.replace(/\s+/g, ' ').trim() : ''; }
  function current(bar) { var l = listOf(bar).querySelector('.s4-doc-tab-label[aria-selected="true"]'); return l ? l.closest('.s4-doc-tab') : null; }
  function panelOf(tab) { var id = labelOf(tab) && labelOf(tab).getAttribute('aria-controls'); return id ? document.getElementById(id) : null; }
  function shown(el) { return !!el && !!el.getClientRects().length; }

  function prepare(bar, tab) {
    if (!bar.id) bar.id = 's4-doc-tabs-' + (++uid);
    var label = labelOf(tab); if (!label) return;
    if (!label.id) label.id = 's4-doc-tab-' + (++uid);
    label.setAttribute('role', 'tab');
    if (label.tagName === 'BUTTON' && !label.type) label.type = 'button';
    tab.setAttribute('role', 'presentation');
    var close = tab.querySelector('.s4-doc-tab-close');
    if (!close) {
      close = document.createElement('button');
      close.className = 's4-doc-tab-close'; close.type = 'button'; close.tabIndex = -1;
      close.innerHTML = '<span class="s4-icon" data-icon="close"></span>';
      tab.appendChild(close);
    }
    close.setAttribute('aria-label', 'Close ' + textOf(tab) + (tab.hasAttribute('data-modified') ? ' (unsaved changes)' : ''));
    tab.dataset.contextMenu = bar.id + '-tab-menu';
    var p = panelOf(tab);
    if (p) { if (!p.getAttribute('role')) p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', label.id); if (!p.hasAttribute('tabindex')) p.tabIndex = 0; }
  }

  function select(tab, focus) {
    var bar = barOf(tab); if (!bar) return;
    var old = current(bar);
    var mine = panelOf(tab);
    tabs(bar).forEach(function (t) {
      var on = t === tab, l = labelOf(t), p = panelOf(t);
      l.setAttribute('aria-selected', String(on)); l.tabIndex = on ? 0 : -1;
      if (p && p !== mine) p.hidden = true;
    });
    if (mine) mine.hidden = false;   /* tabs may share one panel (a list that shows the chosen file) */
    if (focus) labelOf(tab).focus({ preventScroll: true });
    reveal(tab);
    lastBar = bar;
    if (old !== tab) S4.util.emit(bar, 's4-change', { tab: tab, index: tabs(bar).indexOf(tab), panel: panelOf(tab) });
  }
  function reveal(tab) {
    var list = tab.parentElement, lr = list.getBoundingClientRect(), tr = tab.getBoundingClientRect();
    if (tr.left < lr.left) list.scrollLeft -= lr.left - tr.left + 8;
    else if (tr.right > lr.right) list.scrollLeft += tr.right - lr.right + 8;
  }

  var closed = new WeakMap();   /* per bar: the tabs closed, newest last, so mod+Shift+T and Undo bring them back */
  function close(tab) {
    var bar = barOf(tab); if (!bar) return false;
    var panel = panelOf(tab), all = tabs(bar), i = all.indexOf(tab), wasCurrent = current(bar) === tab;
    var ev = new CustomEvent('s4-close', { bubbles: true, cancelable: true, detail: { tab: tab, panel: panel, modified: tab.hasAttribute('data-modified') } });
    if (!bar.dispatchEvent(ev)) return false;
    var hadFocus = bar.contains(document.activeElement);
    var stack = closed.get(bar) || []; stack.push({ tab: tab, panel: panel, index: i, next: panel ? panel.nextElementSibling : null, parent: panel ? panel.parentElement : null }); closed.set(bar, stack.slice(-20));
    tab.remove();
    if (panel && !tabs(bar).some(function (t) { return panelOf(t) === panel; })) panel.remove();
    else panel = null;
    var rest = tabs(bar);
    if (wasCurrent && rest.length) select(rest[Math.min(i, rest.length - 1)], hadFocus);
    else if (hadFocus && rest.length) labelOf(current(bar) || rest[0]).focus({ preventScroll: true });
    bar.toggleAttribute('data-empty', !rest.length);
    fit(bar);
    return true;
  }
  function reopen(bar) {
    var stack = closed.get(bar) || [], last = stack.pop(); if (!last) return null;
    var list = listOf(bar), all = tabs(bar);
    list.insertBefore(last.tab, all[last.index] || null);
    if (last.panel && last.parent) last.parent.insertBefore(last.panel, last.next && last.next.parentElement === last.parent ? last.next : null);
    bar.removeAttribute('data-empty');
    select(last.tab, bar.contains(document.activeElement));
    fit(bar);
    return last.tab;
  }
  function add(bar, o) {
    o = o || {};
    var tab = document.createElement('div');
    tab.className = 's4-doc-tab';
    if (o.modified) tab.setAttribute('data-modified', '');
    tab.innerHTML = '<button class="s4-doc-tab-label" type="button" role="tab" aria-selected="false" tabindex="-1"' + (o.id ? ' id="' + esc(o.id) + '"' : '') + (o.panel ? ' aria-controls="' + esc(o.panel) + '"' : '') + '>' +
      (o.icon ? '<span class="s4-icon" data-icon="' + esc(o.icon) + '"></span>' : '') + '<span class="s4-doc-tab-text">' + esc(o.label) + '</span></button>';
    var after = o.next ? current(bar) : null;   /* at the end, or right after the current tab with next: true */
    listOf(bar).insertBefore(tab, after ? after.nextElementSibling : null);
    prepare(bar, tab);
    bar.removeAttribute('data-empty');
    if (S4.init) S4.init(tab);
    if (o.select !== false) select(tab);
    fit(bar);
    return tab;
  }
  function move(tab, to) {
    var bar = barOf(tab); if (!bar || !S4.reorder) return;
    var n = tabs(bar).length; to = Math.max(0, Math.min(n - 1, to));
    S4.reorder.move(tab, to);
    reveal(tab);
  }
  function modified(tab, on) {
    tab.toggleAttribute('data-modified', !!on);
    var c = tab.querySelector('.s4-doc-tab-close');
    if (c) c.setAttribute('aria-label', 'Close ' + textOf(tab) + (on ? ' (unsaved changes)' : ''));
  }

  /* ---------- the All Tabs menu, shown when the tabs no longer fit ---------- */
  function fit(bar) {
    var list = listOf(bar), more = bar.querySelector('.s4-doc-tabs-all'); if (!more) return;
    more.hidden = list.scrollWidth <= list.clientWidth + 1;
  }
  function fillAll(bar) {
    var m = document.getElementById(bar.id + '-all'); if (!m) return;
    var cur = current(bar);
    m.innerHTML = tabs(bar).map(function (t, i) {
      return '<button class="s4-menu-item" type="button" role="menuitemradio" tabindex="-1" data-check data-index="' + i + '" aria-checked="' + (t === cur) + '"><span class="s4-icon" data-icon="check"></span><span class="s4-menu-item-text">' + esc(textOf(t)) + (t.hasAttribute('data-modified') ? ' •' : '') + '</span></button>';
    }).join('');
    if (S4.init) S4.init(m);
  }

  S4.docTabs = { add: add, select: function (t) { select(t, false); }, close: close, reopen: reopen, move: move, modified: modified,
    tabs: tabs, current: current };

  S4.register('doc-tabs', function (scope) {
    S4.util.all(scope, '.s4-doc-tabs').forEach(function (bar) {
      if (!S4.util.once(bar, 'doctabs')) return;
      if (!bar.id) bar.id = 's4-doc-tabs-' + (++uid);
      var list = listOf(bar); if (!list) return;
      list.setAttribute('role', 'tablist');
      list.setAttribute('data-reorder', 'horizontal');
      /* the right-click menu, one per bar */
      var menu = document.createElement('div');
      menu.className = 's4-menu'; menu.id = bar.id + '-tab-menu'; menu.setAttribute('aria-label', 'Tab Actions');
      var k = function (s) { return S4.desktop ? '<kbd class="s4-kbd">' + S4.desktop.format(s) + '</kbd>' : ''; };
      menu.innerHTML = '<button class="s4-menu-item" type="button" data-value="close"><span class="s4-menu-item-text">Close</span>' + k('mod+w') + '</button>' +
        '<button class="s4-menu-item" type="button" data-value="others"><span class="s4-menu-item-text">Close Others</span></button>' +
        '<button class="s4-menu-item" type="button" data-value="right"><span class="s4-menu-item-text">Close To The Right</span></button>' +
        '<hr class="s4-menu-divider">' +
        '<button class="s4-menu-item" type="button" data-value="left"><span class="s4-menu-item-text">Move Left</span>' + k('mod+shift+pageup') + '</button>' +
        '<button class="s4-menu-item" type="button" data-value="later"><span class="s4-menu-item-text">Move Right</span>' + k('mod+shift+pagedown') + '</button>';
      document.body.appendChild(menu);
      menu.addEventListener('s4-context', function () {
        var t = menu.contextTarget, all = tabs(bar), i = all.indexOf(t), set = function (v, off) { var b = menu.querySelector('[data-value="' + v + '"]'); if (off) b.setAttribute('aria-disabled', 'true'); else b.removeAttribute('aria-disabled'); };
        set('others', all.length < 2); set('right', i === all.length - 1); set('left', i === 0); set('later', i === all.length - 1);
      });
      menu.addEventListener('s4-select', function (e) {
        var t = menu.contextTarget; if (!t || !t.isConnected) return;
        var v = e.detail.item.dataset.value, all = tabs(bar), i = all.indexOf(t);
        if (v === 'close') close(t);
        else if (v === 'others') { select(t); all.forEach(function (x) { if (x !== t) close(x); }); }
        else if (v === 'right') all.slice(i + 1).forEach(close);
        else if (v === 'left') move(t, i - 1);
        else if (v === 'later') move(t, i + 1);
        setTimeout(function () { var c = current(bar); if (c) labelOf(c).focus({ preventScroll: true }); });
      });
      /* the All Tabs menu button */
      var all = document.createElement('div');
      all.className = 's4-menu'; all.id = bar.id + '-all'; all.setAttribute('aria-label', 'All Tabs'); all.dataset.align = 'end';
      document.body.appendChild(all);
      var more = document.createElement('button');
      more.className = 's4-icon-button s4-doc-tabs-all'; more.type = 'button'; more.hidden = true;
      more.setAttribute('aria-label', 'All Tabs'); more.dataset.tooltip = 'All Tabs'; more.dataset.menu = all.id;
      more.innerHTML = '<span class="s4-icon" data-icon="chevron-down"></span>';
      list.insertAdjacentElement('afterend', more);
      more.addEventListener('click', function () { fillAll(bar); }, true);
      all.addEventListener('s4-select', function (e) { var t = tabs(bar)[+e.detail.item.dataset.index]; if (t) select(t, true); });

      tabs(bar).forEach(function (t) { prepare(bar, t); });
      select(current(bar) || tabs(bar)[0] || null, false);
      if (!tabs(bar).length) bar.setAttribute('data-empty', '');
      if (S4.init) { S4.init(menu); S4.init(all); }

      list.addEventListener('click', function (e) {
        var c = e.target.closest('.s4-doc-tab-close'); if (c) { e.preventDefault(); close(c.closest('.s4-doc-tab')); return; }
        var l = e.target.closest('.s4-doc-tab-label'); if (l) select(l.closest('.s4-doc-tab'));
      });
      list.addEventListener('mousedown', function (e) { if (e.button === 1 && e.target.closest('.s4-doc-tab')) e.preventDefault(); });   /* no autoscroll */
      list.addEventListener('auxclick', function (e) { var t = e.target.closest('.s4-doc-tab'); if (t && e.button === 1) { e.preventDefault(); close(t); } });
      list.addEventListener('keydown', function (e) {
        var t = e.target.closest('.s4-doc-tab'); if (!t || !e.target.matches('.s4-doc-tab-label')) return;
        var all = tabs(bar), i = all.indexOf(t), rtl = getComputedStyle(bar).direction === 'rtl';
        var next = rtl ? 'ArrowLeft' : 'ArrowRight', prev = rtl ? 'ArrowRight' : 'ArrowLeft', mod = S4.desktop && /mac|ios/.test(S4.desktop.platform) ? e.metaKey : e.ctrlKey, to = null;
        if (mod && e.shiftKey && (e.key === 'PageUp' || e.key === 'PageDown')) { e.preventDefault(); move(t, i + (e.key === 'PageUp' ? -1 : 1)); labelOf(t).focus({ preventScroll: true }); return; }
        if (e.key === next) to = all[(i + 1) % all.length];
        else if (e.key === prev) to = all[(i - 1 + all.length) % all.length];
        else if (e.key === 'Home') to = all[0];
        else if (e.key === 'End') to = all[all.length - 1];
        else if (e.key === 'Delete' || (e.key === 'Backspace' && e.metaKey)) { e.preventDefault(); close(t); return; }
        if (!to) return;
        e.preventDefault(); select(to, true);
      });
      list.addEventListener('s4-reorder', function (e) { reveal(e.detail.item); fit(bar); });
      list.addEventListener('scroll', function () { fit(bar); }, { passive: true });
      bar.addEventListener('focusin', function () { lastBar = bar; });
      if ('ResizeObserver' in window) new ResizeObserver(function () { fit(bar); }).observe(list);
      fit(bar);
    });
  });

  /* window-wide keys act on the tabs you last used (or the first ones on screen) */
  function active() {
    if (lastBar && lastBar.isConnected && shown(lastBar)) return lastBar;
    return Array.prototype.filter.call(document.querySelectorAll('.s4-doc-tabs:not([data-keys="off"])'), shown)[0] || null;
  }
  document.addEventListener('keydown', function (e) {
    if (e.defaultPrevented || e.altKey) return;
    var apple = S4.desktop && /mac|ios/.test(S4.desktop.platform), mod = apple ? e.metaKey : e.ctrlKey;
    var tabStep = e.ctrlKey && (e.key === 'Tab' || e.key === 'PageDown' || e.key === 'PageUp') && !(e.key !== 'Tab' && e.shiftKey);
    if (!mod && !tabStep) return;
    if (document.querySelector('dialog[open]')) return;
    var bar = active(); if (!bar) return;
    var all = tabs(bar), cur = current(bar), i = all.indexOf(cur), k = e.key.toLowerCase();
    if (tabStep) { if (!all.length) return; e.preventDefault(); var d = e.key === 'PageUp' || (e.key === 'Tab' && e.shiftKey) ? -1 : 1; select(all[(i + d + all.length) % all.length], bar.contains(document.activeElement)); return; }
    if (k === 'w' && !e.shiftKey) { if (cur) { e.preventDefault(); close(cur); } return; }
    if (k === 't' && e.shiftKey) { e.preventDefault(); reopen(bar); return; }
    if (!e.shiftKey && /^[1-9]$/.test(e.key)) { var t = e.key === '9' ? all[all.length - 1] : all[+e.key - 1]; if (t) { e.preventDefault(); select(t, bar.contains(document.activeElement)); } }
  });
})();
