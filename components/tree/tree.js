/* Tree view (issue 60): nested things you open and close (folders and files, groups and records, chapters and scenes).
   WAI-ARIA tree pattern:
     <ul class="s4-tree" role="tree" aria-label="Files" [aria-multiselectable="true"] [data-item-menu="menu-id"]>
       <li class="s4-tree-item" aria-expanded="true">
         <div class="s4-tree-row"><span class="s4-icon" data-icon="folder"></span><span class="s4-tree-label">Quests</span>
           <span class="s4-tree-trailing"><span class="s4-tree-count">48</span></span></div>
         <ul role="group">…</ul>
       </li>
       <li class="s4-tree-item" aria-expanded="false" data-lazy>…<ul role="group"></ul></li>   children load when it opens
     </ul>
   The script adds roles, levels, the open/close chevron and one tab stop for the whole tree.
   Keys: Up and Down move, Right opens (or goes to the first child), Left closes (or goes to the parent), Home and End,
   a letter jumps by name, * opens every sibling, Enter (or a double-click) chooses the item, F2 renames it (Enter too
   on a Mac, as in the Finder). With aria-multiselectable: Shift with arrows or a click selects a range, Ctrl or ⌘ with a
   click adds or removes one, Ctrl or ⌘ with arrows moves without selecting and Space then adds the item, mod+A selects
   every shown item. Moving things: drag rows onto a folder with a mouse or pen, or mod+X then mod+V on the folder (the
   app's menu can offer the same: S4.tree.cut / S4.tree.paste); nothing is drag-only.
   Rename is the one time the tree puts the cursor in a field: you asked to type a name (F2, Enter on a Mac, or a Rename
   command), the way the palette takes typing when opened by a key (decision 0049). It never happens on load.
   Events on the tree: s4-change { items, item } when the selection changes; s4-select { item } when an item is chosen;
   s4-toggle { item, open }; s4-rename { item, value, old } (preventDefault keeps the old name); s4-move { items, target }
   (preventDefault cancels; otherwise the rows move into the target).
   Lazy children: S4.tree.load(tree, function (item) { return Promise.resolve([{ label, icon, count, children | lazy, id }]) }).
   S4.tree.render(tree, nodes), .select(item, { add, range }), .open(item, on), .rename(item), .selected(tree),
   .cut(items), .paste(target), .reveal(item). */
(function () {
  var S4 = window.S4, uid = 0, loaders = new WeakMap(), clip = null;
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function treeOf(el) { return el && el.closest ? el.closest('.s4-tree') : null; }
  function rowOf(item) { return item.querySelector(':scope > .s4-tree-row'); }
  function groupOf(item) { return item.querySelector(':scope > [role="group"]'); }
  function labelText(item) { var l = item.querySelector(':scope > .s4-tree-row .s4-tree-label'); return l ? l.textContent.trim() : ''; }
  function parentItem(item) { var g = item.parentElement; return g && g.getAttribute('role') === 'group' ? g.closest('.s4-tree-item') : null; }
  function isOpen(item) { return item.getAttribute('aria-expanded') === 'true'; }
  function multi(tree) { return tree.getAttribute('aria-multiselectable') === 'true'; }
  /* the items you can see, in order */
  function visible(tree) {
    var out = [];
    (function walk(list) {
      Array.prototype.forEach.call(list.children, function (li) {
        if (!li.classList.contains('s4-tree-item') || li.hasAttribute('data-loading')) return;
        out.push(li);
        if (isOpen(li) && !li.hasAttribute('data-closing')) { var g = groupOf(li); if (g) walk(g); }
      });
    })(tree);
    return out;
  }
  function focused(tree) { return tree.querySelector('.s4-tree-item[tabindex="0"]'); }
  function focus(item, scroll) {
    var tree = treeOf(item);
    tree.querySelectorAll('.s4-tree-item[tabindex="0"]').forEach(function (i) { if (i !== item) i.tabIndex = -1; });
    item.tabIndex = 0; item.focus({ preventScroll: true });
    if (scroll !== false) reveal(item);
  }
  function reveal(item) { var r = rowOf(item); if (r && r.scrollIntoView) r.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }

  /* ---------- structure ---------- */
  function prepare(tree) {
    if (!tree.getAttribute('role')) tree.setAttribute('role', 'tree');
    var menu = tree.dataset.itemMenu;
    (function walk(list, level) {
      Array.prototype.forEach.call(list.children, function (li) {
        if (!li.classList.contains('s4-tree-item')) return;
        if (li.hasAttribute('data-loading')) { li.setAttribute('role', 'none'); return; }
        li.setAttribute('role', 'treeitem');
        li.setAttribute('aria-level', String(level));
        if (!li.hasAttribute('tabindex')) li.tabIndex = -1;
        if (!li.hasAttribute('aria-selected')) li.setAttribute('aria-selected', 'false');
        if (menu) li.dataset.contextMenu = menu;
        var row = rowOf(li); if (!row) return;
        li.style.setProperty('--_depth', String(level - 1));
        var g = groupOf(li);
        if (g || li.hasAttribute('data-lazy')) {
          if (!li.hasAttribute('aria-expanded')) li.setAttribute('aria-expanded', 'false');
          if (!g) { g = document.createElement('ul'); g.setAttribute('role', 'group'); li.appendChild(g); }
          g.hidden = !isOpen(li);
          if (!row.querySelector(':scope > .s4-tree-toggle')) row.insertAdjacentHTML('afterbegin', '<span class="s4-tree-toggle" aria-hidden="true"><span class="s4-icon" data-icon="chevron-right"></span></span>');
          walk(g, level + 1);
        } else {
          li.removeAttribute('aria-expanded');
          if (!row.querySelector(':scope > .s4-tree-toggle')) row.insertAdjacentHTML('afterbegin', '<span class="s4-tree-toggle" aria-hidden="true"></span>');
        }
      });
    })(tree, 1);
    if (!focused(tree)) { var first = tree.querySelector('.s4-tree-item[aria-selected="true"]') || tree.querySelector('.s4-tree-item[role="treeitem"]'); if (first) first.tabIndex = 0; }
    if (S4.init) S4.init(tree);
  }
  function nodeHtml(n) {
    var kids = n.children && n.children.length, lazy = n.lazy && !kids, folder = Array.isArray(n.children) || lazy;
    return '<li class="s4-tree-item"' + (n.id ? ' data-id="' + esc(n.id) + '"' : '') + (folder ? ' aria-expanded="' + (n.open ? 'true' : 'false') + '"' : '') + (lazy ? ' data-lazy' : '') + (n.selected ? ' aria-selected="true"' : '') + '>' +
      '<div class="s4-tree-row">' + (n.icon ? '<span class="s4-icon" data-icon="' + esc(n.icon) + '"></span>' : '') +
      '<span class="s4-tree-label">' + esc(n.label) + '</span>' +
      (n.count != null || n.badge != null ? '<span class="s4-tree-trailing">' + (n.count != null ? '<span class="s4-tree-count">' + esc(n.count) + '</span>' : '') + (n.badge != null ? '<span class="s4-badge">' + esc(n.badge) + '</span>' : '') + '</span>' : '') +
      '</div>' + (folder ? '<ul role="group">' + (kids ? n.children.map(nodeHtml).join('') : '') + '</ul>' : '') + '</li>';
  }
  function render(tree, nodes, into) {
    (into || tree).innerHTML = nodes.map(nodeHtml).join('');
    prepare(tree);
  }

  /* ---------- open and close ---------- */
  function open(item, on) {
    var g = groupOf(item); if (!g) return;
    on = on == null ? !isOpen(item) : !!on;
    if (on === isOpen(item) && !item.hasAttribute('data-closing')) return;
    var tree = treeOf(item);
    item.setAttribute('aria-expanded', String(on));
    if (on) {
      item.removeAttribute('data-closing');
      g.hidden = false;
      if (item.hasAttribute('data-lazy')) load(item);
      S4.transition.reveal(g, { open: true });
    } else {
      item.setAttribute('data-closing', '');
      if (g.contains(document.activeElement)) focus(item);
      S4.transition.reveal(g, { open: false }).then(function (done) {
        if (!done || !item.hasAttribute('data-closing')) return;
        item.removeAttribute('data-closing'); g.hidden = true; S4.transition.restore(g);
      });
    }
    S4.util.emit(tree, 's4-toggle', { item: item, open: on });
  }
  function load(item) {
    var tree = treeOf(item), fn = loaders.get(tree), g = groupOf(item);
    if (!fn) return;
    item.removeAttribute('data-lazy');
    item.setAttribute('aria-busy', 'true');
    g.innerHTML = '<li class="s4-tree-item s4-tree-loading" data-loading role="none"><div class="s4-tree-row" style="--_depth:' + (+item.getAttribute('aria-level')) + '"><span class="s4-tree-toggle" aria-hidden="true"></span><span class="s4-tree-spinner" aria-hidden="true"></span><span class="s4-tree-label">Loading…</span></div></li>';
    Promise.resolve().then(function () { return fn(item); }).then(function (nodes) {
      item.removeAttribute('aria-busy');
      render(tree, nodes || [], g);
      if (!(nodes || []).length) g.innerHTML = '<li class="s4-tree-item s4-tree-loading" data-loading role="none"><div class="s4-tree-row" style="--_depth:' + (+item.getAttribute('aria-level')) + '"><span class="s4-tree-toggle" aria-hidden="true"></span><span class="s4-tree-label">Empty</span></div></li>';
      if (S4.transition && isOpen(item)) S4.transition.reveal(g, { open: true });
    }, function () {
      item.removeAttribute('aria-busy');
      item.setAttribute('data-lazy', '');
      g.innerHTML = '<li class="s4-tree-item s4-tree-loading" data-loading role="none"><div class="s4-tree-row" style="--_depth:' + (+item.getAttribute('aria-level')) + '"><span class="s4-tree-toggle" aria-hidden="true"></span><span class="s4-tree-label">Could not load.</span><button class="s4-button" data-variant="text" data-size="xs" type="button" data-tree-retry>Retry</button></div></li>';
      if (S4.init) S4.init(g);
    });
  }

  /* ---------- selection ---------- */
  var anchors = new WeakMap();
  function selected(tree) { return Array.prototype.slice.call(tree.querySelectorAll('.s4-tree-item[aria-selected="true"]')); }
  function select(item, opts) {
    opts = opts || {};
    var tree = treeOf(item), many = multi(tree), before = selected(tree);
    if (opts.range && many) {
      var all = visible(tree), a = anchors.get(tree) || item, i = all.indexOf(a), j = all.indexOf(item);
      if (i < 0) i = j;
      var lo = Math.min(i, j), hi = Math.max(i, j);
      if (!opts.add) before.forEach(function (x) { x.setAttribute('aria-selected', 'false'); });
      all.slice(lo, hi + 1).forEach(function (x) { x.setAttribute('aria-selected', 'true'); });
    } else if (opts.add && many) {
      item.setAttribute('aria-selected', String(item.getAttribute('aria-selected') !== 'true'));
      anchors.set(tree, item);
    } else {
      before.forEach(function (x) { if (x !== item) x.setAttribute('aria-selected', 'false'); });
      item.setAttribute('aria-selected', 'true');
      anchors.set(tree, item);
    }
    var now = selected(tree);
    if (now.length !== before.length || now.some(function (x, k) { return x !== before[k]; })) S4.util.emit(tree, 's4-change', { items: now, item: item });
  }

  /* ---------- rename (F2, Enter on a Mac, or a command) ---------- */
  function rename(item) {
    var tree = treeOf(item), l = item.querySelector(':scope > .s4-tree-row .s4-tree-label'); if (!l || item.querySelector(':scope > .s4-tree-row .s4-tree-rename')) return;
    var old = l.textContent.trim(), input = document.createElement('input');
    input.className = 's4-tree-rename'; input.type = 'text'; input.value = old; input.spellcheck = false;
    input.setAttribute('aria-label', 'Rename ' + old);
    l.hidden = true; l.insertAdjacentElement('afterend', input);
    input.focus();   /* you asked to type a name: the one time the tree puts the cursor in a field (see the header) */
    var dot = old.lastIndexOf('.'); input.setSelectionRange(0, dot > 0 && !groupOf(item) ? dot : old.length);
    var done = false;
    function finish(save) {
      if (done) return; done = true;
      var v = input.value.trim();
      input.remove(); l.hidden = false;
      if (save && v && v !== old) {
        var ev = new CustomEvent('s4-rename', { bubbles: true, cancelable: true, detail: { item: item, value: v, old: old } });
        if (tree.dispatchEvent(ev)) l.textContent = v;
      }
      focus(item);
    }
    input.addEventListener('keydown', function (e) {
      e.stopPropagation();
      if (e.key === 'Enter') { e.preventDefault(); finish(true); }
      else if (e.key === 'Escape') { e.preventDefault(); finish(false); }
    });
    input.addEventListener('blur', function () { finish(true); });
    input.addEventListener('click', function (e) { e.stopPropagation(); });
  }

  /* ---------- moving: drag, or cut and paste ---------- */
  function folderOf(item) { return item && groupOf(item) ? item : parentItem(item); }
  function moveInto(items, target) {
    var tree = treeOf(target);
    items = items.filter(function (x) { return x !== target && !x.contains(target); });
    if (!items.length) return false;
    var ev = new CustomEvent('s4-move', { bubbles: true, cancelable: true, detail: { items: items, target: target } });
    if (!tree.dispatchEvent(ev)) return false;
    var g = groupOf(target); if (!g) return false;
    items.forEach(function (x) { g.appendChild(x); });
    prepare(tree);
    open(target, true);
    return true;
  }
  function cut(items) {
    document.querySelectorAll('.s4-tree-item[data-cut]').forEach(function (x) { x.removeAttribute('data-cut'); });
    clip = items.slice(); clip.forEach(function (x) { x.setAttribute('data-cut', ''); });
  }
  function paste(target) {
    if (!clip || !clip.length) return false;
    var f = folderOf(target); if (!f) return false;
    var ok = moveInto(clip.filter(function (x) { return x.isConnected; }), f);
    clip.forEach(function (x) { x.removeAttribute('data-cut'); }); clip = null;
    return ok;
  }

  S4.tree = { render: render, load: function (tree, fn) { loaders.set(tree, fn); }, select: select, open: open, rename: rename,
    selected: selected, cut: cut, paste: paste, reveal: reveal, focus: focus, refresh: prepare };

  S4.register('tree', function (scope) {
    S4.util.all(scope, '.s4-tree').forEach(function (tree) {
      if (!S4.util.once(tree, 'tree')) { return; }
      prepare(tree);
      var typed = '', typedAt = 0, apple = S4.desktop && /mac|ios/.test(S4.desktop.platform);

      tree.addEventListener('click', function (e) {
        if (e.target.closest('.s4-tree-rename')) return;
        var retry = e.target.closest('[data-tree-retry]');
        if (retry) { var it = retry.closest('[role="group"]').closest('.s4-tree-item'); focus(it, false); load(it); return; }
        var row = e.target.closest('.s4-tree-row'), item = row && row.parentElement; if (!item || item.hasAttribute('data-loading')) return;
        var mod = apple ? e.metaKey : e.ctrlKey;
        if (e.target.closest('.s4-tree-toggle') && groupOf(item)) { open(item); focus(item, false); return; }
        select(item, { add: mod, range: e.shiftKey });
        focus(item, false);
        /* a folder in a single-select tree opens and closes with a click on its row, as in a sidebar */
        if (!multi(tree) && !mod && !e.shiftKey && groupOf(item) && tree.hasAttribute('data-open-on-click')) open(item);
      });
      tree.addEventListener('dblclick', function (e) {
        var row = e.target.closest('.s4-tree-row'), item = row && row.parentElement; if (!item || e.target.closest('.s4-tree-rename, .s4-tree-toggle')) return;
        if (groupOf(item)) open(item); else S4.util.emit(tree, 's4-select', { item: item });
      });
      /* right-click acts on what is under the pointer: it joins the selection unless it is already in it */
      tree.addEventListener('contextmenu', function (e) {
        var row = e.target.closest('.s4-tree-row'), item = row && row.parentElement; if (!item || item.hasAttribute('data-loading')) return;
        if (item.getAttribute('aria-selected') !== 'true') select(item);
        focus(item, false);
      }, true);
      /* the row the pointer comes from leans in first (decision 0044) */
      tree.addEventListener('pointerover', function (e) {
        var row = e.target.closest('.s4-tree-row'); if (!row || row.contains(e.relatedTarget)) return;
        var r = row.getBoundingClientRect(); row.style.setProperty('--_lean', e.clientY < r.top + r.height / 2 ? '0%' : '100%');
      });

      tree.addEventListener('keydown', function (e) {
        var item = e.target.closest('.s4-tree-item'); if (!item || e.target.closest('.s4-tree-rename') || e.target !== item) return;
        var all = visible(tree), i = all.indexOf(item), rtl = getComputedStyle(tree).direction === 'rtl';
        var mod = apple ? e.metaKey : e.ctrlKey, many = multi(tree), to = null;
        var inward = rtl ? 'ArrowLeft' : 'ArrowRight', outward = rtl ? 'ArrowRight' : 'ArrowLeft';
        if (e.key === 'ArrowDown') to = all[i + 1];
        else if (e.key === 'ArrowUp') to = all[i - 1];
        else if (e.key === 'Home') to = all[0];
        else if (e.key === 'End') to = all[all.length - 1];
        else if (e.key === inward) { e.preventDefault(); if (groupOf(item)) { if (!isOpen(item)) open(item, true); else { var c = visible(tree)[i + 1]; if (c && parentItem(c) === item) to = c; } } if (!to) return; }
        else if (e.key === outward) { e.preventDefault(); if (groupOf(item) && isOpen(item)) { open(item, false); return; } to = parentItem(item); if (!to) return; }
        else if (e.key === 'Enter' && !mod) { e.preventDefault(); if (apple && !e.shiftKey) rename(item); else if (groupOf(item)) open(item); else S4.util.emit(tree, 's4-select', { item: item }); return; }
        else if (e.key === 'F2') { e.preventDefault(); rename(item); return; }
        else if (e.key === ' ' && many) { e.preventDefault(); select(item, { add: true }); return; }
        else if (e.key === '*') { e.preventDefault(); var p = item.parentElement; Array.prototype.forEach.call(p.children, function (s) { if (s.classList.contains('s4-tree-item') && groupOf(s)) open(s, true); }); return; }
        else if (mod && !e.shiftKey && e.key.toLowerCase() === 'a' && many) { e.preventDefault(); all.forEach(function (x) { x.setAttribute('aria-selected', 'true'); }); S4.util.emit(tree, 's4-change', { items: selected(tree), item: item }); return; }
        else if (mod && !e.shiftKey && e.key.toLowerCase() === 'x') { e.preventDefault(); cut(selected(tree).length ? selected(tree) : [item]); return; }
        else if (mod && !e.shiftKey && e.key.toLowerCase() === 'v' && clip) { e.preventDefault(); paste(item); return; }
        else if (e.key === 'Escape' && clip) { e.preventDefault(); cut([]); clip = null; return; }
        else if (e.key.length === 1 && /\S/.test(e.key) && !mod && !e.altKey) {
          typed = (Date.now() - typedAt > 600 ? '' : typed) + e.key.toLowerCase(); typedAt = Date.now();
          var order = all.slice(i + (typed.length === 1 ? 1 : 0)).concat(all.slice(0, i + (typed.length === 1 ? 1 : 0)));
          to = order.filter(function (x) { return labelText(x).toLowerCase().indexOf(typed) === 0; })[0];
          if (!to) return;
          e.preventDefault(); focus(to); if (!many) select(to); return;
        } else return;
        if (!to) { e.preventDefault(); return; }
        e.preventDefault();
        focus(to);
        if (many && mod) return;                       /* move without selecting */
        select(to, { range: many && e.shiftKey });
      });
      tree.addEventListener('focusin', function (e) { var item = e.target.closest('.s4-tree-item'); if (item && e.target === item) { tree.querySelectorAll('.s4-tree-item[tabindex="0"]').forEach(function (x) { if (x !== item) x.tabIndex = -1; }); item.tabIndex = 0; } });

      /* drag rows onto a folder (mouse and pen; a finger scrolls, and uses the menu or cut and paste instead) */
      tree.addEventListener('pointerdown', function (e) {
        if (e.button || e.pointerType === 'touch' || tree.hasAttribute('data-no-drag')) return;
        var row = e.target.closest('.s4-tree-row'), item = row && row.parentElement; if (!item || item.hasAttribute('data-loading') || e.target.closest('.s4-tree-rename, .s4-tree-toggle, button')) return;
        var sx = e.clientX, sy = e.clientY, drag = null, over = null;
        function moveH(ev) {
          if (!drag) {
            if (Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) < 6) return;
            var items = item.getAttribute('aria-selected') === 'true' ? selected(tree) : [item];
            drag = { items: items };
            items.forEach(function (x) { x.setAttribute('data-dragging', ''); });
            document.documentElement.setAttribute('data-s4-dragging', '');
          }
          ev.preventDefault();
          var hit = document.elementFromPoint(ev.clientX, ev.clientY), r = hit && hit.closest && hit.closest('.s4-tree-row'), t = r && r.parentElement;
          var f = t && treeOf(t) === tree ? folderOf(t) : null;
          if (f && drag.items.some(function (x) { return x === f || x.contains(f); })) f = null;
          if (f !== over) { if (over) rowOf(over).removeAttribute('data-drop'); over = f; if (over) rowOf(over).setAttribute('data-drop', ''); }
        }
        function upH() {
          window.removeEventListener('pointermove', moveH, true); window.removeEventListener('pointerup', upH, true); window.removeEventListener('pointercancel', upH, true);
          if (!drag) return;
          drag.items.forEach(function (x) { x.removeAttribute('data-dragging'); });
          if (over) { rowOf(over).removeAttribute('data-drop'); moveInto(drag.items, over); }
          setTimeout(function () { document.documentElement.removeAttribute('data-s4-dragging'); });
        }
        window.addEventListener('pointermove', moveH, true); window.addEventListener('pointerup', upH, true); window.addEventListener('pointercancel', upH, true);
      });
    });
  });
})();
