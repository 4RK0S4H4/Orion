/* Filters and saved views (round 0056): one pattern for narrowing a collection.
     <div class="s4-filter" id="f" data-for="#records" data-key="records" data-url>
       <div class="s4-filter-views" aria-label="Saved Views"></div>        named views (chips; filled by script)
       <div class="s4-filter-bar"> search, Add Filter, All Filters, Sort, View Options (see README) </div>
       <div class="s4-filter-active" aria-label="Active Filters"></div>    the filters in force, each removable, Clear All
       <p class="s4-filter-count"></p>                                       "1,204 of 5,000 records", announced politely
     </div>
     <dialog class="s4-side-sheet" data-modeless id="f-panel">… <div class="s4-filter-facets"></div> …</dialog>
   S4.filter(el, { facets, views, sorts, noun, nouns }) wires it to the S4.table named in data-for (or any target with
   { onChange }). Facets: { field, label, type: 'choice' | 'range' | 'tags', values?, format? }. State lives in the URL
   query (data-url): ?q=owl&family=Strigidae|Corvidae&year=1900..1950&sort=year:descending&view=on-loan, so a view can be
   linked; S4.pages keeps using the hash. Fires s4-change { state, count, total } on the element. */
(function () {
  var S4 = window.S4;
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function norm(s) { return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim(); }
  var nf = function (n) { return Number(n).toLocaleString(document.documentElement.lang || undefined); };
  var uid = 0;
  function copy(o) { return JSON.parse(JSON.stringify(o || {})); }
  function blank() { return { q: '', f: {}, sort: null }; }
  function same(a, b) { return JSON.stringify(clean(a)) === JSON.stringify(clean(b)); }
  function clean(s) {
    var o = { q: s.q || '', f: {}, sort: s.sort || null };
    Object.keys(s.f || {}).sort().forEach(function (k) { var v = s.f[k]; if (Array.isArray(v) ? v.length : v && (v.min != null || v.max != null)) o.f[k] = Array.isArray(v) ? v.slice().sort() : v; });
    return o;
  }

  function Filter(el, opts) {
    var self = this;
    this.el = el; this.opts = opts || {}; el._s4filter = this;
    this.id = el.id || (el.id = 's4-filter-' + (++uid));
    this.target = this.opts.table || (el.getAttribute('data-for') && S4.table(document.querySelector(el.getAttribute('data-for'))));
    this.facets = this.opts.facets || [];
    this.key = el.getAttribute('data-key');
    this.noun = this.opts.noun || 'record'; this.nouns = this.opts.nouns || 'records';
    this.state = blank();
    this.builtin = (this.opts.views || []).map(function (v) { return { id: v.id, name: v.name, state: clean(Object.assign(blank(), v.state || {})), builtin: true }; });
    if (!this.builtin.length) this.builtin = [{ id: 'all', name: 'All', state: clean(blank()), builtin: true }];
    var saved = this.load();
    this.views = this.builtin.concat(saved.views || []);
    this.view = saved.view || this.views[0].id;
    this.parts();
    this.panelFacets();
    var fromUrl = this.readUrl();
    if (fromUrl) { this.state = fromUrl.state; this.view = fromUrl.view || (this.views.filter(function (v) { return same(v.state, fromUrl.state); })[0] || {}).id || null; }
    else { var v = this.viewOf(this.view); this.state = copy(v ? v.state : blank()); }
    if (this.target && this.target.table) this.target.table.addEventListener('s4-change', function (e) {
      if (e.detail.type === 'sort' && !self.applying) { self.state.sort = e.detail.direction === 'none' ? null : { field: e.detail.field, dir: e.detail.direction }; self.after(false); }
      if (e.detail.type === 'update' || e.detail.type === 'edit') self.counts();
    });
    this.apply(false);
  }
  Filter.prototype = {
    $: function (sel) { return this.el.querySelector(sel); },
    load: function () { if (!this.key) return {}; try { return JSON.parse(localStorage.getItem('s4-filter:' + this.key) || '{}'); } catch (e) { return {}; } },
    save: function () { if (!this.key) return; try { localStorage.setItem('s4-filter:' + this.key, JSON.stringify({ views: this.views.filter(function (v) { return !v.builtin; }), view: this.view })); } catch (e) {} },
    viewOf: function (id) { return this.views.filter(function (v) { return v.id === id; })[0]; },
    facet: function (f) { return this.facets.filter(function (x) { return x.field === f; })[0]; },
    rows: function () { return this.target && this.target.rows || this.opts.rows || []; },

    /* ---------- the parts in the markup ---------- */
    parts: function () {
      var self = this, el = this.el;
      this.viewsEl = this.$('.s4-filter-views');
      this.activeEl = this.$('.s4-filter-active');
      this.countEl = this.$('.s4-filter-count');
      if (this.countEl) { this.countEl.setAttribute('role', 'status'); this.countEl.setAttribute('aria-live', 'polite'); }
      this.search = this.$('.s4-filter-bar .s4-search input, .s4-filter-bar input[type="search"]');
      if (this.search) {
        var t = 0;
        this.search.addEventListener('input', function () { clearTimeout(t); t = setTimeout(function () { self.state.q = self.search.value; self.after(true); }, 120); });
        this.search.closest('.s4-search').addEventListener('s4-change', function () { if (self.search.value !== self.state.q) { self.state.q = self.search.value; self.after(true); } });
      }
      /* Add Filter: a menu of the facets; choosing one opens the panel at that facet */
      this.addMenu = el.querySelector('[data-filter-add]') && document.getElementById(el.querySelector('[data-filter-add]').getAttribute('data-menu'));
      if (this.addMenu) {
        this.addMenu.innerHTML = '<div class="s4-menu-label">Filter By</div>' + this.facets.map(function (f) { return '<button class="s4-menu-item" type="button" value="' + esc(f.field) + '">' + (f.icon ? '<span class="s4-icon" data-icon="' + f.icon + '"></span>' : '') + esc(f.label) + '</button>'; }).join('');
        S4.init(this.addMenu);
        this.addMenu.addEventListener('s4-select', function (e) { self.openPanel(e.detail.value); });
      }
      this.panel = this.$('[data-filter-panel]') && document.getElementById(this.$('[data-filter-panel]').getAttribute('data-sheet'));
      /* Sort: one menu, a radio per sortable column and the direction */
      this.sortBtn = this.$('[data-filter-sort]');
      this.sortMenu = this.sortBtn && document.getElementById(this.sortBtn.getAttribute('data-menu'));
      if (this.sortMenu) this.sortMenu.addEventListener('s4-select', function (e) {
        var v = e.detail.value, cur = self.state.sort || {};
        if (v === 'ascending' || v === 'descending') self.state.sort = { field: cur.field || (self.sorts()[0] || {}).field, dir: v };
        else if (v === 'none') self.state.sort = null;
        else self.state.sort = { field: v, dir: cur.dir || (self.sorts().filter(function (s) { return s.field === v; })[0] || {}).dir || 'ascending' };
        self.after(false);
      });
      /* View Options: save, update, rename, delete */
      this.viewBtn = this.$('[data-filter-views]');
      this.viewMenu = this.viewBtn && document.getElementById(this.viewBtn.getAttribute('data-menu'));
      if (this.viewMenu) {
        this.viewMenu.addEventListener('s4-select', function (e) { self.viewAction(e.detail.value); });
        this.viewBtn.addEventListener('click', function () { self.fillViewMenu(); }, true);
      }
      if (this.viewsEl) {
        this.viewsEl.classList.add('s4-chip-set'); this.viewsEl.setAttribute('role', 'group');
        this.viewsEl.addEventListener('click', function (e) { var c = e.target.closest('.s4-chip[data-view]'); if (c) self.useView(c.dataset.view); });
      }
      if (this.activeEl) {
        this.activeEl.classList.add('s4-chip-set'); this.activeEl.setAttribute('role', 'group');
        this.activeEl.addEventListener('click', function (e) {
          var r = e.target.closest('.s4-chip-remove'); if (r) { self.drop(r.dataset.field, r.dataset.value, r); return; }
          if (e.target.closest('[data-filter-clear]')) self.clear();
        });
      }
      el.addEventListener('click', function (e) { if (e.target.closest('[data-filter-clear]') && !(self.activeEl && self.activeEl.contains(e.target))) self.clear(); });
    },
    sorts: function () {
      if (this.opts.sorts) return this.opts.sorts;
      var t = this.target && this.target.c; if (!t) return [];
      return t.cols.filter(function (c) { return c.th.hasAttribute('aria-sort'); }).map(function (c) { return { field: c.field, label: c.label }; });
    },
    /* ---------- the panel: every facet, with counts ---------- */
    panelFacets: function () {
      var self = this, host = this.panel && this.panel.querySelector('.s4-filter-facets'); if (!host) return;
      this.facetsEl = host;
      host.innerHTML = this.facets.map(function (f) {
        var id = self.id + '-' + f.field;
        var head = '<h3 class="s4-filter-facet-title" id="' + id + '-h">' + esc(f.label) + '</h3>';
        if (f.type === 'range') {
          return '<section class="s4-filter-facet" data-facet="' + esc(f.field) + '" aria-labelledby="' + id + '-h">' + head + '<div class="s4-filter-range">' +
            '<div class="s4-text-field s4-number-field"><label for="' + id + '-min">From</label><input id="' + id + '-min" data-bound="min"' + (f.min != null ? ' data-min="' + f.min + '"' : '') + (f.max != null ? ' data-max="' + f.max + '"' : '') + (f.step ? ' data-step="' + f.step + '"' : '') + (f.grouping === false ? ' data-no-grouping' : '') + '></div>' +
            '<div class="s4-text-field s4-number-field"><label for="' + id + '-max">To</label><input id="' + id + '-max" data-bound="max"' + (f.min != null ? ' data-min="' + f.min + '"' : '') + (f.max != null ? ' data-max="' + f.max + '"' : '') + (f.step ? ' data-step="' + f.step + '"' : '') + (f.grouping === false ? ' data-no-grouping' : '') + '></div></div></section>';
        }
        if (f.type === 'tags') {
          var opts = self.values(f).map(function (v) { return '<option>' + esc(v) + '</option>'; }).join('');
          return '<section class="s4-filter-facet" data-facet="' + esc(f.field) + '" aria-labelledby="' + id + '-h">' + head + '<div class="s4-text-field s4-tag-input" data-noun="' + esc(f.noun || f.label.toLowerCase()) + '"><label for="' + id + '-t">' + esc(f.placeholder || 'Any ' + f.label) + '</label><input id="' + id + '-t"><template>' + opts + '</template></div></section>';
        }
        return '<section class="s4-filter-facet" data-facet="' + esc(f.field) + '" aria-labelledby="' + id + '-h">' + head + '<ul class="s4-list s4-filter-options" aria-labelledby="' + id + '-h"></ul></section>';
      }).join('');
      S4.init(host);
      host.addEventListener('change', function (e) {
        var box = e.target, sec = box.closest('[data-facet]'); if (!sec) return;
        var f = self.facet(sec.dataset.facet);
        if (f.type === 'choice' || !f.type) {
          if (!box.matches('input[type="checkbox"]')) return;
          var list = (self.state.f[f.field] || []).slice(), at = list.indexOf(box.value);
          if (box.checked && at < 0) list.push(box.value); if (!box.checked && at >= 0) list.splice(at, 1);
          self.state.f[f.field] = list; self.after(false);
        } else if (f.type === 'range') {
          var r = self.state.f[f.field] || {}, num = function (inp) { var v = inp.value.replace(/[^\d.\-]/g, ''); return v === '' ? null : +v; };
          r = { min: num(sec.querySelector('[data-bound="min"]')), max: num(sec.querySelector('[data-bound="max"]')) };
          self.state.f[f.field] = r; self.after(false);
        }
      });
      host.addEventListener('s4-change', function (e) {
        var sec = e.target.closest('[data-facet]'); if (!sec) return;
        var f = self.facet(sec.dataset.facet);
        if (f.type === 'tags' && e.detail && e.detail.values) { if (self.syncing) return; self.state.f[f.field] = e.detail.values.slice(); self.after(false); }
        if (f.type === 'range' && e.target.matches('.s4-number-field')) { var ev = new Event('change', { bubbles: true }); sec.dispatchEvent(ev); }
      });
    },
    values: function (f) {
      if (f.values) return f.values;
      var seen = {}, out = [];
      this.rows().forEach(function (r) { var v = r[f.field]; if (v != null && v !== '' && !seen[v]) { seen[v] = 1; out.push(String(v)); } });
      return out.sort(new Intl.Collator(undefined, { numeric: true }).compare);
    },
    openPanel: function (field) {
      if (!this.panel) return;
      if (!this.panel.open) S4.sheet.open(this.panel, this.$('[data-filter-panel]'));
      var sec = field && this.panel.querySelector('[data-facet="' + field + '"]');
      if (sec) { sec.scrollIntoView({ block: 'nearest' }); sec.setAttribute('data-flash', ''); setTimeout(function () { sec.removeAttribute('data-flash'); }, 1200); }
    },
    /* ---------- applying ---------- */
    test: function (r, skip) {
      var f = this.state.f;
      for (var k in f) {
        if (k === skip) continue;
        var v = f[k], x = r[k];
        if (Array.isArray(v)) { if (v.length && v.indexOf(String(x)) < 0) return false; }
        else if (v) { if (v.min != null && !(x >= v.min)) return false; if (v.max != null && !(x <= v.max)) return false; }
      }
      return true;
    },
    matchesQ: function (r) {
      var q = norm(this.state.q); if (!q) return true;
      var fs = this.opts.searchFields || (this.target ? this.target.fields().map(function (c) { return c.field; }) : Object.keys(r));
      for (var i = 0; i < fs.length; i++) if (norm(r[fs[i]]).indexOf(q) >= 0) return true;
      return false;
    },
    apply: function (pushUrl) {
      var self = this, t = this.target;
      this.applying = true;
      if (t && t.filter) {
        var active = Object.keys(this.state.f).some(function (k) { var v = self.state.f[k]; return Array.isArray(v) ? v.length : v && (v.min != null || v.max != null); });
        t.pred = active ? function (r) { return self.test(r); } : null;
        t.query = norm(this.state.q); t.searchFields = this.opts.searchFields || null;
        if (this.state.sort) t.sort(this.state.sort.field, this.state.sort.dir);
        else t.sort(null);
      }
      this.applying = false;
      if (this.opts.onChange) this.opts.onChange(this.state);
      if (this.search && this.search.value !== this.state.q) { this.search.value = this.state.q; var clr = this.search.parentNode.querySelector('.s4-search-clear'); if (clr) clr.hidden = !this.state.q; }
      this.chips(); this.drawViews(); this.drawSort(); this.counts(); this.syncPanel();
      if (this.el.hasAttribute('data-url')) this.writeUrl();
      this.announce();
      S4.util.emit(this.el, 's4-change', { state: copy(this.state), count: t ? t.view.length : null, total: t ? t.rows.length : null, view: this.view });
    },
    /* after a change made here: the selected view stays selected while it still matches; otherwise no view is current */
    after: function () { var v = this.viewOf(this.view); if (v && !same(v.state, this.state)) this.modified = true; else this.modified = false; this.apply(); },
    clear: function () {
      var before = copy(this.state), self = this;
      this.state.f = {}; this.state.q = '';
      this.after();
      if (Object.keys(clean(before).f).length) S4.snackbar({ text: 'Filters cleared', action: 'Undo', onAction: function () { self.state = before; self.after(); } });
    },
    drop: function (field, value, btn) {
      var v = this.state.f[field];
      if (Array.isArray(v)) this.state.f[field] = v.filter(function (x) { return x !== value; }); else delete this.state.f[field];
      var next = btn && btn.closest('.s4-chip'), to = next && (next.nextElementSibling || next.previousElementSibling);
      this.after();
      /* focus goes to the neighbouring chip's remove button (or Add Filter), never lost */
      var target = to && this.activeEl.querySelector('[data-field="' + (to.querySelector('[data-field]') || {}).dataset?.field + '"]');
      var fallback = this.activeEl.querySelector('.s4-chip-remove, [data-filter-clear]') || this.$('[data-filter-add]');
      if (btn) (target || fallback || this.el).focus();
    },
    /* ---------- drawing ---------- */
    label: function (f, v) { return f.format ? f.format(v) : v; },
    chips: function () {
      if (!this.activeEl) return;
      var self = this, html = '';
      if (this.state.q) html += '<span class="s4-chip" data-type="input"><span class="s4-icon" data-icon="search"></span>“' + esc(this.state.q) + '”<button class="s4-chip-remove" type="button" data-field="__q" aria-label="Remove search ' + esc(this.state.q) + '"><span class="s4-icon" data-icon="close"></span></button></span>';
      this.facets.forEach(function (f) {
        var v = self.state.f[f.field];
        if (Array.isArray(v)) v.forEach(function (x) { html += '<span class="s4-chip" data-type="input"><span class="s4-filter-chip-key">' + esc(f.label) + '</span>' + esc(self.label(f, x)) + '<button class="s4-chip-remove" type="button" data-field="' + esc(f.field) + '" data-value="' + esc(x) + '" aria-label="Remove ' + esc(f.label + ' ' + x) + '"><span class="s4-icon" data-icon="close"></span></button></span>'; });
        else if (v && (v.min != null || v.max != null)) {
          var text = v.min != null && v.max != null ? self.label(f, v.min) + '–' + self.label(f, v.max) : v.min != null ? 'From ' + self.label(f, v.min) : 'Up to ' + self.label(f, v.max);
          html += '<span class="s4-chip" data-type="input"><span class="s4-filter-chip-key">' + esc(f.label) + '</span>' + esc(text) + '<button class="s4-chip-remove" type="button" data-field="' + esc(f.field) + '" aria-label="Remove ' + esc(f.label) + ' range"><span class="s4-icon" data-icon="close"></span></button></span>';
        }
      });
      if (html) html += '<button class="s4-button" data-variant="text" data-size="xs" type="button" data-filter-clear>Clear All</button>';
      this.activeEl.innerHTML = html;
      this.activeEl.hidden = !html;
      this.activeEl.querySelectorAll('[data-field="__q"]').forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); self.state.q = ''; self.after(); var n = self.activeEl.querySelector('.s4-chip-remove, [data-filter-clear]'); (n || self.search || self.el).focus && (n || self.$('[data-filter-add]')) && (n || self.$('[data-filter-add]')).focus(); }); });
      S4.init(this.activeEl);
      var badge = this.$('[data-filter-panel] .s4-badge'), n = Object.keys(clean(this.state).f).length;
      if (badge) { badge.textContent = n ? String(n) : ''; badge.hidden = !n; }
      var pb = this.$('[data-filter-panel]'); if (pb) pb.setAttribute('aria-label', n ? 'All Filters, ' + n + ' active' : 'All Filters');
    },
    drawViews: function () {
      if (!this.viewsEl) return;
      var self = this;
      this.viewsEl.innerHTML = this.views.map(function (v) {
        var on = v.id === self.view;
        return '<button class="s4-chip" data-type="filter" type="button" data-view="' + esc(v.id) + '" aria-pressed="' + on + '">' + esc(v.name) + (on && self.modified ? '<span class="s4-filter-modified" aria-label="changed"></span>' : '') + '</button>';
      }).join('');
      S4.init(this.viewsEl);
    },
    drawSort: function () {
      var s = this.state.sort, self = this, list = this.sorts();
      if (this.sortBtn) {
        var lab = s ? (list.filter(function (x) { return x.field === s.field; })[0] || { label: s.field }).label : null;
        var txt = this.sortBtn.querySelector('.s4-filter-sort-label') || this.sortBtn;
        txt.textContent = lab ? lab : 'Sort';
        this.sortBtn.setAttribute('aria-label', lab ? 'Sort: ' + lab + ', ' + s.dir : 'Sort');
        var ic = this.sortBtn.querySelector('.s4-icon'); if (ic) ic.toggleAttribute('data-descending', !!(s && s.dir === 'descending'));
      }
      if (this.sortMenu) {
        this.sortMenu.innerHTML = '<div class="s4-menu-label">Sort By</div>' + list.map(function (x) { return '<button class="s4-menu-item" type="button" role="menuitemradio" value="' + esc(x.field) + '" aria-checked="' + !!(s && s.field === x.field) + '">' + esc(x.label) + '</button>'; }).join('') +
          '<hr class="s4-menu-divider"><button class="s4-menu-item" type="button" role="menuitemradio" value="ascending" aria-checked="' + !!(s && s.dir === 'ascending') + '"' + (s ? '' : ' disabled') + '>Ascending</button><button class="s4-menu-item" type="button" role="menuitemradio" value="descending" aria-checked="' + !!(s && s.dir === 'descending') + '"' + (s ? '' : ' disabled') + '>Descending</button>' +
          (s ? '<button class="s4-menu-item" type="button" value="none">Original Order</button>' : '');
        this.sortMenu.querySelectorAll('.s4-menu-item').forEach(function (i) { i.tabIndex = -1; });
      }
    },
    /* counts for each choice: the rows that pass every other filter and the search, so a count is what you would get */
    counts: function () {
      if (!this.facetsEl) return;
      var self = this, rows = this.rows();
      this.facets.forEach(function (f) {
        if (f.type && f.type !== 'choice') return;
        var ul = self.facetsEl.querySelector('[data-facet="' + f.field + '"] .s4-filter-options'); if (!ul) return;
        var n = {}, vals = self.values(f), chosen = self.state.f[f.field] || [];
        rows.forEach(function (r) { if (self.test(r, f.field) && self.matchesQ(r)) { var k = String(r[f.field]); n[k] = (n[k] || 0) + 1; } });
        ul.innerHTML = vals.map(function (v) {
          var on = chosen.indexOf(v) >= 0, c = n[v] || 0;
          return '<li><label class="s4-list-item"' + (c || on ? '' : ' data-zero') + '><span class="s4-list-leading"><span class="s4-checkbox"><input type="checkbox" value="' + esc(v) + '"' + (on ? ' checked' : '') + '><span class="s4-checkbox-box"></span></span></span><span class="s4-list-content"><span class="s4-list-headline">' + esc(self.label(f, v)) + '</span></span><span class="s4-list-trailing"><span class="s4-filter-option-count">' + nf(c) + '</span></span></label></li>';
        }).join('');
      });
    },
    syncPanel: function () {
      if (!this.facetsEl) return;
      var self = this;
      this.facets.forEach(function (f) {
        var sec = self.facetsEl.querySelector('[data-facet="' + f.field + '"]'); if (!sec) return;
        var v = self.state.f[f.field];
        if (f.type === 'range') {
          ['min', 'max'].forEach(function (b) {
            var inp = sec.querySelector('[data-bound="' + b + '"]'), val = v && v[b] != null ? String(v[b]) : '';
            if (document.activeElement !== inp && inp.value.replace(/[^\d.\-]/g, '') !== val) inp.value = val;
          });
        } else if (f.type === 'tags') {
          var tf = sec.querySelector('.s4-tag-input'), cur = S4.tagInput ? S4.tagInput.values(tf) : [];
          if (S4.tagInput && JSON.stringify(cur) !== JSON.stringify(v || [])) { self.syncing = true; S4.tagInput.set(tf, v || []); self.syncing = false; }
        }
      });
      var done = this.panel && this.panel.querySelector('[data-filter-done]');
      if (done && this.target) done.textContent = 'Show ' + nf(this.target.view.length) + ' ' + (this.target.view.length === 1 ? cap(this.noun) : cap(this.nouns));
    },
    announce: function () {
      if (!this.countEl || !this.target) return;
      var self = this, n = this.target.view.length, total = this.target.rows.length;
      clearTimeout(this.sayT);
      var text = n === total ? nf(total) + ' ' + (total === 1 ? this.noun : this.nouns) : nf(n) + ' of ' + nf(total) + ' ' + this.nouns;
      /* the number on screen changes at once; screen readers hear it when typing pauses */
      this.countEl.setAttribute('aria-live', 'off'); this.countEl.textContent = text;
      this.sayT = setTimeout(function () { self.countEl.setAttribute('aria-live', 'polite'); self.countEl.textContent = ''; self.countEl.textContent = text; }, 450);
    },
    /* ---------- views ---------- */
    useView: function (id) {
      var v = this.viewOf(id); if (!v) return;
      this.view = id; this.modified = false; this.state = copy(v.state);
      this.save(); this.apply();
    },
    summary: function () {
      var self = this, parts = [];
      if (this.state.q) parts.push('“' + this.state.q + '”');
      this.facets.forEach(function (f) { var v = self.state.f[f.field]; if (Array.isArray(v) && v.length) parts.push(v.length > 2 ? v.length + ' ' + f.label : v.join(', ')); else if (v && !Array.isArray(v) && (v.min != null || v.max != null)) parts.push(f.label + ' ' + (v.min != null ? v.min : '') + '–' + (v.max != null ? v.max : '')); });
      return parts.join(' · ').slice(0, 40) || 'My View';
    },
    fillViewMenu: function () {
      var v = this.viewOf(this.view), own = v && !v.builtin;
      var item = function (val, label, icon, dis, color) { return '<button class="s4-menu-item" type="button" value="' + val + '"' + (dis ? ' disabled' : '') + (color ? ' data-color="' + color + '"' : '') + '><span class="s4-icon" data-icon="' + icon + '"></span>' + label + '</button>'; };
      this.viewMenu.innerHTML = '<div class="s4-menu-label">Views</div>' + item('save', 'Save as New View', 'bookmark') + (own ? item('update', 'Update “' + esc(v.name) + '”', 'save', !this.modified) + item('rename', 'Rename View', 'edit') + '<hr class="s4-menu-divider">' + item('delete', 'Delete View', 'delete', false, 'error') : '');
      S4.init(this.viewMenu);
      this.viewMenu.querySelectorAll('.s4-menu-item').forEach(function (i) { i.tabIndex = -1; });
    },
    viewAction: function (a) {
      var self = this, v = this.viewOf(this.view);
      if (a === 'save') {
        var nv = { id: 'v' + Date.now().toString(36), name: this.summary(), state: clean(this.state) };
        var prev = this.view;
        this.views.push(nv); this.view = nv.id; this.modified = false; this.save(); this.apply();
        S4.snackbar({ text: 'View “' + nv.name + '” saved', action: 'Undo', onAction: function () { self.views = self.views.filter(function (x) { return x !== nv; }); self.view = prev; self.after(); self.save(); } });
        this.rename(nv.id);
      } else if (a === 'update' && v && !v.builtin) {
        var old = v.state; v.state = clean(this.state); this.modified = false; this.save(); this.apply();
        S4.snackbar({ text: 'View “' + v.name + '” updated', action: 'Undo', onAction: function () { v.state = old; self.after(); self.save(); } });
      } else if (a === 'rename' && v && !v.builtin) this.rename(v.id);
      else if (a === 'delete' && v && !v.builtin) {
        var at = this.views.indexOf(v);
        this.views.splice(at, 1); this.view = this.views[0].id; this.modified = !same(this.views[0].state, this.state); this.save(); this.apply();
        S4.snackbar({ text: 'View “' + v.name + '” deleted', action: 'Undo', onAction: function () { self.views.splice(at, 0, v); self.view = v.id; self.modified = !same(v.state, self.state); self.save(); self.apply(); } });
      }
    },
    /* rename in place: the name becomes a field where the chips are (never focused for you: tap it to type) */
    rename: function (id) {
      var self = this, v = this.viewOf(id); if (!v || !this.viewsEl) return;
      var box = this.el.querySelector('.s4-filter-rename');
      if (!box) {
        box = document.createElement('div'); box.className = 's4-filter-rename';
        box.innerHTML = '<div class="s4-text-field"><label for="' + this.id + '-name">View Name</label><input id="' + this.id + '-name" maxlength="40" autocomplete="off"></div><button class="s4-button" type="button" data-variant="tonal" data-rename-done>Done</button>';
        this.viewsEl.after(box); S4.init(box);
        var input = box.querySelector('input');
        var done = function () { var name = input.value.trim(); var w = self.viewOf(box.dataset.view); if (w && name) { w.name = name; self.save(); self.drawViews(); } box.hidden = true; var c = self.viewsEl.querySelector('[data-view="' + box.dataset.view + '"]'); if (c) c.focus(); };
        box.querySelector('[data-rename-done]').addEventListener('click', done);
        input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); done(); } else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); box.hidden = true; } });
      }
      box.dataset.view = id; box.hidden = false;
      box.querySelector('input').value = v.name;
      S4.transition.reveal(box, { open: true }).then(function () { S4.transition.restore(box); box.style.overflow = ''; });
    },
    /* ---------- the URL: ?q=…&family=a|b&year=1900..1950&sort=year:descending&view=id ---------- */
    writeUrl: function () {
      var u = new URL(location.href), p = u.searchParams, self = this;
      ['q', 'sort', 'view'].concat(this.facets.map(function (f) { return f.field; })).forEach(function (k) { p.delete(k); });
      if (this.state.q) p.set('q', this.state.q);
      this.facets.forEach(function (f) { var v = self.state.f[f.field]; if (Array.isArray(v) && v.length) p.set(f.field, v.join('|')); else if (v && !Array.isArray(v) && (v.min != null || v.max != null)) p.set(f.field, (v.min != null ? v.min : '') + '..' + (v.max != null ? v.max : '')); });
      if (this.state.sort) p.set('sort', this.state.sort.field + ':' + this.state.sort.dir);
      if (this.view && !this.modified && this.view !== this.views[0].id) p.set('view', this.view);
      var next = u.pathname + (p.toString() ? '?' + p.toString() : '') + location.hash;
      if (next !== location.pathname + location.search + location.hash) history.replaceState(history.state, '', next);
    },
    readUrl: function () {
      if (!this.el.hasAttribute('data-url')) return null;
      var p = new URLSearchParams(location.search), self = this, st = blank(), any = false;
      if (p.get('view') && this.viewOf(p.get('view'))) { st = copy(this.viewOf(p.get('view')).state); any = true; }
      if (p.has('q')) { st.q = p.get('q'); any = true; }
      this.facets.forEach(function (f) {
        if (!p.has(f.field)) return; any = true;
        var raw = p.get(f.field);
        if (f.type === 'range') { var m = raw.split('..'); st.f[f.field] = { min: m[0] === '' ? null : +m[0], max: m[1] === '' || m[1] == null ? null : +m[1] }; }
        else st.f[f.field] = raw.split('|').filter(Boolean);
      });
      if (p.get('sort')) { var s = p.get('sort').split(':'); st.sort = { field: s[0], dir: s[1] === 'descending' ? 'descending' : 'ascending' }; any = true; }
      return any ? { state: st, view: p.get('view') } : null;
    }
  };
  function cap(s) { return s.replace(/(^|\s)\S/g, function (c) { return c.toUpperCase(); }); }

  S4.filter = function (el, opts) { if (!el) return null; return el._s4filter || new Filter(el, opts); };
  S4.register('filter', function (scope) {
    /* the panel's Done button closes it (on a phone the panel covers the list); nothing to apply: filters act at once */
    S4.util.all(scope, '[data-filter-done]').forEach(function (b) {
      if (!S4.util.once(b, 'filterDone')) return;
      b.addEventListener('click', function () { var d = b.closest('dialog'); if (d) S4.sheet.close(d); });
    });
  });
})();
