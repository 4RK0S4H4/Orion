/* Orion runtime core, part two: saying what changed, and selecting several (decision 0078). It is part of the core pack
   (orion.core.min.js) and the full bundle, and is left out of the site bundle (decision 0066: a site has no collection that
   selects several; a site's multi-select listbox keeps plain toggling). */
(function () {
  'use strict';
  var S4 = window.S4;
  if (!S4 || !S4.util || S4.util.multiselect) return;
  /* ---------- saying what changed (one polite live region for the page) ---------- */
  var live = null, liveT = 0;
  S4.util.say = function (text) {
    if (!live || !live.isConnected) { live = document.createElement('div'); live.className = 's4-visually-hidden'; live.setAttribute('role', 'status'); live.setAttribute('aria-live', 'polite'); document.body.appendChild(live); }
    clearTimeout(liveT); live.textContent = ''; liveT = setTimeout(function () { live.textContent = text; }, 60);
  };

  /* ---------- selecting several (decision 0078) ----------
     One selection model for every collection that selects several: data tables, static tables with a select column,
     multi-select listboxes and trees, and select-several lists. The collection keeps its own markup, focus and drawing;
     the model keeps which keys are selected, the anchor, and what each mouse and key gesture does, the way Windows
     Explorer and the macOS Finder do (WAI-ARIA grid, listbox and tree multi-select):
       click             only this one (click: 'select'), or adds and removes it (click: 'toggle')
       Shift+click       the range from the anchor, replacing the last range drawn from that anchor
       Ctrl/⌘+click      adds or removes one and moves the anchor;  Ctrl/⌘+Shift+click adds a range
       Shift+Up/Down, Shift+PageUp/PageDown, Shift+Home/End   extend the range from the anchor as focus moves
       Ctrl/⌘+Up/Down, Ctrl/⌘+PageUp/PageDown                  move focus and leave the selection alone
       Space / Ctrl+Space toggles the focused item;  Shift+Space selects from the anchor to it
       Ctrl/⌘+A          every item, the ones not drawn too (the collection says what "every" is: what its filter shows)
       Escape            clears, when something is selected and nothing else took the Escape first
     S4.util.multiselect(o) -> model. o: count() items in order; key(i) a stable key (an id, or the element itself);
     skip(i) true for an item that is not selectable (a group header); index(key) optional fast lookup; every() the keys
     Ctrl+A selects when they are more than the items in order (rows in a collapsed group, rows not drawn); focus(i) moves
     focus there and returns the index that took it; page() items per page; multi() false for single select (the range
     keys are ignored); read() for a collection whose markup is its data: the keys selected now; apply(added, removed)
     draws the change; changed({ why, added, removed }) fires the collection's own event; noun(n) for the announcement.
     model.selected is the Set of keys (the same object for the model's life). Every change is said: "12 selected". */
  function Multi(o) { this.o = o; this.selected = new Set(); this.base = new Set(); this.anchor = null; }
  Multi.prototype = {
    multi: function () { return !this.o.multi || this.o.multi(); },
    n: function () { return this.o.count(); },
    ok: function (i) { return i >= 0 && i < this.n() && !(this.o.skip && this.o.skip(i)); },
    index: function (k) { if (k == null) return -1; if (this.o.index) return this.o.index(k); for (var i = 0, n = this.n(); i < n; i++) if (this.o.key(i) === k) return i; return -1; },
    sync: function () { if (!this.o.read) return; var s = this.selected; s.clear(); this.o.read().forEach(function (k) { s.add(k); }); },
    /* replace the selection with `next` (a Set): only what changed is drawn, said and fired */
    commit: function (next, why) {
      var prev = this.selected, added = [], removed = [];
      next.forEach(function (k) { if (!prev.has(k)) added.push(k); });
      prev.forEach(function (k) { if (!next.has(k)) removed.push(k); });
      if (!added.length && !removed.length) return false;
      removed.forEach(function (k) { prev.delete(k); }); added.forEach(function (k) { prev.add(k); });
      if (this.o.apply) this.o.apply(added, removed);
      this.say();
      if (this.o.changed) this.o.changed({ why: why, added: added, removed: removed });
      return true;
    },
    say: function (extra) { var n = this.selected.size; S4.util.say((extra ? extra + ' ' : '') + (n ? n.toLocaleString() + ' selected' : 'Nothing selected')); },
    between: function (a, b) { var out = []; for (var i = Math.max(0, Math.min(a, b)), z = Math.min(this.n() - 1, Math.max(a, b)); i <= z; i++) if (this.ok(i)) out.push(this.o.key(i)); return out; },
    setAnchor: function (i) { this.anchor = this.ok(i) ? this.o.key(i) : this.anchor; },
    only: function (i, why) { this.sync(); if (!this.ok(i)) return false; this.anchor = this.o.key(i); this.base = new Set(); return this.commit(new Set([this.anchor]), why || 'click'); },
    toggle: function (i, on, why) {
      this.sync(); if (!this.ok(i)) return false;
      var k = this.o.key(i), next = new Set(this.selected); if (on === undefined) on = !next.has(k);
      if (!this.multi()) next.clear();
      if (on) next.add(k); else next.delete(k);
      this.anchor = k; this.base = new Set(next); this.base.delete(k);
      return this.commit(next, why || 'toggle');
    },
    /* the range from the anchor to item i; add keeps everything selected now (Ctrl+Shift), otherwise it replaces the last range */
    extend: function (i, add, why) {
      this.sync(); if (!this.multi()) return this.only(i, why);
      var a = this.index(this.anchor);
      if (a < 0) { this.anchor = this.ok(i) ? this.o.key(i) : null; a = i; this.base = new Set(this.selected); }
      var next = new Set(add ? this.selected : this.base);
      this.between(a, i).forEach(function (k) { next.add(k); });
      var done = this.commit(next, why || 'range');
      if (add) this.base = new Set(this.selected);
      return done;
    },
    all: function (why) {
      this.sync(); if (!this.multi()) return false;
      var next = new Set(this.o.every ? this.o.every() : []), n = this.n();
      if (!this.o.every) for (var i = 0; i < n; i++) if (this.ok(i)) next.add(this.o.key(i));
      this.base = new Set(); return this.commit(next, why || 'all');
    },
    clear: function (why) { this.sync(); this.base = new Set(); this.anchor = null; return this.commit(new Set(), why || 'clear'); },   /* nothing selected: the next range starts where focus is */
    set: function (keys, why) { this.sync(); this.base = new Set(); return this.commit(new Set(keys), why || 'set'); },
    /* a click on item i. mode: 'select' (only this one), 'toggle' (adds or removes it), or null (a plain click is the
       collection's own: it opens the item). Returns true when the click was a selection. */
    click: function (e, i, mode) {
      var mod = e.ctrlKey || e.metaKey, many = this.multi();
      if (many && e.shiftKey) return this.extend(i, mod, 'range') || true;
      if (many && mod) return this.toggle(i, undefined, 'toggle') || true;
      if (mode === 'select' || (!many && mode === 'toggle')) { this.only(i, 'click'); return true; }
      if (mode === 'toggle') { this.toggle(i, undefined, 'toggle'); return true; }
      return false;
    },
    /* a key on item i (the focused one). Returns true when the model took it (the caller stops there). */
    keydown: function (e, i) {
      if (e.defaultPrevented || e.altKey || !this.multi()) return false;
      var k = e.key, mod = e.ctrlKey || e.metaKey, n = this.n(), page = Math.max(1, (this.o.page && this.o.page()) || 10), to = -1;
      if (k === 'ArrowDown') to = i + 1; else if (k === 'ArrowUp') to = i - 1;
      else if (k === 'PageDown') to = i + page; else if (k === 'PageUp') to = i - page;
      else if (k === 'Home' && (e.shiftKey || mod)) to = 0; else if (k === 'End' && (e.shiftKey || mod)) to = n - 1;
      if (to !== -1 || k === 'Home' || k === 'End') {
        if (!e.shiftKey && !mod) return false;              /* plain movement is the collection's own */
        e.preventDefault();
        if (e.shiftKey && this.index(this.anchor) < 0) this.setAnchor(i);
        var at = this.o.focus(Math.max(0, Math.min(n - 1, to)));
        if (e.shiftKey) this.extend(at == null ? to : at, false, 'range');
        return true;
      }
      if (k === ' ' || k === 'Spacebar') {
        if (!this.ok(i)) return false;
        e.preventDefault();
        if (e.shiftKey) this.extend(i, mod, 'range'); else this.toggle(i, undefined, 'toggle');
        return true;
      }
      if (mod && !e.shiftKey && (k === 'a' || k === 'A')) { e.preventDefault(); this.all('all'); return true; }
      if (k === 'Escape' && this.selected.size) { this.sync(); if (!this.selected.size) return false; e.preventDefault(); this.clear('escape'); return true; }
      return false;
    }
  };
  S4.util.multiselect = function (o) { return new Multi(o); };
  /* a multi-select listbox (list.js): its enabled options in order, the option itself as the key, aria-selected the data */
  S4.util.listbox = function (list, enabled, focus, value) {
    list.setAttribute('data-s4-multiselect', '');
    return new Multi({
      count: function () { return enabled().length; },
      key: function (i) { return enabled()[i]; },
      index: function (o) { return enabled().indexOf(o); },
      read: function () { return enabled().filter(function (o) { return o.getAttribute('aria-selected') === 'true'; }); },
      focus: function (i) { focus(enabled()[i]); return i; },
      apply: function (added, removed) { added.forEach(function (o) { o.setAttribute('aria-selected', 'true'); }); removed.forEach(function (o) { o.setAttribute('aria-selected', 'false'); }); },
      changed: function (d) {
        if (d.added.length + d.removed.length === 1) { var o = d.added[0] || d.removed[0]; S4.util.emit(o, 's4-select', { item: o, value: o.dataset.value || o.textContent.trim(), selected: !!d.added.length }); }
        S4.util.emit(list, 's4-change', { value: value(), added: d.added, removed: d.removed, why: d.why });
      }
    });
  };
  /* Shift+click extends a range: the browser would select the text between the two clicks, so it does not (text in a
     cell is still selectable with a plain drag) */
  document.addEventListener('mousedown', function (e) {
    if (!e.shiftKey || e.button || !e.target.closest) return;
    var c = e.target.closest('[data-s4-multiselect]');
    if (c && !S4.util.typable(e.target) && !e.target.closest('[contenteditable], .s4-table-grip')) e.preventDefault();
  });
})();
