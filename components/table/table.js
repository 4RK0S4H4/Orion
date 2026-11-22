/* Data table behaviour, for every table.s4-table:
   - Column names: copies each header's text into data-label on its body and footer cells (shown when the table reflows
     into stacked rows under 600), and th[data-primary] into data-primary. A cell's own data-label wins; data-label=""
     hides the name for that cell.
   - Sorting: th[aria-sort] > button.s4-table-sort cycles ascending → descending → none (original order), sorts each
     tbody by the cell's data-value or its text (numbers, amounts and dates in data-value sort as numbers), animates the
     rows into place and fires s4-change { type: 'sort', column, label, direction } on the table.
   - Selection: a checkbox in th[data-check] selects all rows (indeterminate when some are); row checkboxes in
     td[data-check]. Fires s4-change { type: 'select', rows } with the selected rows.
   - Clickable rows: tr[tabindex] fires s4-select { row } on click or Enter (and follows the row's first link, if any).
   - A table written without its .s4-table-wrap gets one (so it scrolls and stacks on a phone like any other). */
/* ---------- Tables at scale (round 0056) ----------
   Opt-in, on top of the plain table below; markup that does not ask for these behaves exactly as before.
   Columns (any table):
     data-resizable on the table   a grip between headers: drag (mouse or finger), or focus it and use the arrow keys
                                   (Shift for bigger steps); double-click or Enter fits the column to its content.
     th[data-pin] / data-pin="end" the column stays while the table scrolls sideways (solid, a tonal edge, no shadow).
     data-key="name" on the table  widths, order, hidden and pinned columns are saved per table under that name.
   Data (S4.table(el, options)): the rows come from data, not markup. Each th[data-field] is a column; the body is drawn
   for what is on screen only (virtual rows: thousands of rows, a scrollbar that never jumps, aria-rowcount and
   aria-rowindex on every row), with sorting, selection, grouping with subtotals, a sticky totals footer, expandable
   rows, inline editing with Undo, a row actions menu, the selection bar, a column menu and the states. See README. */
(function () {
  var S4 = window.S4;
  var slice = function (l) { return Array.prototype.slice.call(l); };
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function store(key, val) {
    if (!key) return null;
    try { if (val === undefined) return JSON.parse(localStorage.getItem('s4-table:' + key) || 'null'); localStorage.setItem('s4-table:' + key, JSON.stringify(val)); } catch (e) {}
    return null;
  }
  var rtl = function (el) { return getComputedStyle(el).direction === 'rtl'; };
  /* a table needs its wrap (the scroller, and the container that stacks rows on a phone): a bare one gets it here
     (decision 0065), so it never squeezes a phone into broken words */
  function wrapOf(table) {
    var w = table.closest('.s4-table-wrap');
    if (w || !table.parentNode || table.parentNode.nodeType !== 1) return w;
    if (/auto|scroll/.test(getComputedStyle(table.parentNode).overflowX)) return null;   /* the page gave it its own scroller */
    w = document.createElement('div'); w.className = 's4-table-wrap'; w.setAttribute('data-s4-wrapped', '');
    table.parentNode.insertBefore(w, table); w.appendChild(table);
    return w;
  }
  S4.tableWrap = wrapOf;
  /* right-aligned figures: .s4-num (the documented class) or .num (the older name, still read) */
  function isNum(el) { return el.classList.contains('s4-num') || el.classList.contains('num'); }
  S4.tableIsNum = isNum;
  /* icons drawn into row markup directly (rows come and go while scrolling; the page-wide icon pass never has to visit them) */
  function icon(name) {
    var reg = window.S4_ICONS, body = reg && reg.icons[name];
    return '<span class="s4-icon" data-icon="' + name + '"' + (body ? ' data-s4-drawn="' + name + '"' : '') + ' aria-hidden="true">' + (body ? '<svg viewBox="' + reg.viewBox + '" aria-hidden="true" focusable="false">' + body + '</svg>' : '') + '</span>';
  }
  /* text width without layout: one canvas, the font read once per call */
  var canvas;
  function textWidth(texts, el) {
    canvas = canvas || document.createElement('canvas');
    var ctx = canvas.getContext('2d'), cs = getComputedStyle(el), w = 0;
    ctx.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
    for (var i = 0; i < texts.length; i++) w = Math.max(w, ctx.measureText(texts[i]).width);
    return Math.ceil(w);
  }

  /* ======================= columns: resize, pin, order, hide (any table) ======================= */
  function Columns(table) {
    var self = this;
    this.table = table; this.wrap = wrapOf(table);
    this.key = table.getAttribute('data-key');
    this.resizable = table.hasAttribute('data-resizable');
    var saved = store(this.key) || {};
    this.saved = saved;
    var row = table.tHead && table.tHead.rows[table.tHead.rows.length - 1];
    this.cols = row ? slice(row.cells).map(function (th, i) {
      var kind = th.hasAttribute('data-check') ? 'check' : th.hasAttribute('data-row-expand') ? 'expand' : th.hasAttribute('data-row-actions') ? 'actions' : 'field';
      var field = th.getAttribute('data-field') || (kind === 'field' ? 'c' + i : kind);
      var label = (th.getAttribute('data-label') || th.textContent).trim();
      return { th: th, kind: kind, field: field, label: label, index: i, pin: th.getAttribute('data-pin') === 'end' ? 'end' : th.hasAttribute('data-pin') ? 'start' : '', hidden: th.hidden, width: 0 };
    }) : [];
    /* the order, pins and hidden columns saved last time */
    if (saved.order) {
      var at = {}; saved.order.forEach(function (f, i) { at[f] = i; });
      this.cols.sort(function (a, b) { return (a.field in at ? at[a.field] : 1e3 + a.index) - (b.field in at ? at[b.field] : 1e3 + b.index); });
    }
    if (saved.hidden) this.cols.forEach(function (c) { if (c.kind === 'field') c.hidden = saved.hidden.indexOf(c.field) >= 0; });
    if (saved.pins) this.cols.forEach(function (c) { if (c.field in saved.pins) c.pin = saved.pins[c.field]; });
    this.cols.forEach(function (c) { c.width = (saved.widths && saved.widths[c.field]) || 0; c.th.hidden = c.hidden; });
    this.pinSort();
    this.colgroup = table.querySelector(':scope > colgroup[data-s4]');
    if (!this.colgroup) { this.colgroup = document.createElement('colgroup'); this.colgroup.setAttribute('data-s4', ''); table.insertBefore(this.colgroup, table.firstChild.nodeName === 'CAPTION' ? table.firstChild.nextSibling : table.firstChild); }
    this.headerOrder();
    if (this.resizable) this.grips();
    table.setAttribute('data-s4-cols', '');
    if (this.wrap) {
      this.wrap.addEventListener('scroll', function () { self.edges(); }, { passive: true });
      if (window.ResizeObserver) new ResizeObserver(function () { self.layout(); }).observe(this.wrap);
    }
    requestAnimationFrame(function () { self.layout(); });
  }
  Columns.prototype = {
    visible: function () { return this.cols.filter(function (c) { return !c.hidden; }); },
    /* pinned columns sit together at their edge: start pins first, end pins last */
    pinSort: function () {
      /* the checkbox and details columns lead the row and travel with the start pins */
      var lead = function (c) { return c.kind === 'check' ? 0 : c.kind === 'expand' ? 1 : 2; };
      var startPins = this.cols.some(function (c) { return c.kind === 'field' && c.pin === 'start'; });
      this.cols.forEach(function (c) { if (c.kind === 'check' || c.kind === 'expand') c.pin = startPins ? 'start' : ''; });
      var rank = function (c) { return c.pin === 'start' ? 0 : c.pin === 'end' ? 2 : 1; };
      this.cols = this.cols.map(function (c, i) { return [c, i]; }).sort(function (a, b) {
        var r = rank(a[0]) - rank(b[0]); if (r) return r;
        var l = lead(a[0]) - lead(b[0]); if (l && (lead(a[0]) < 2 || lead(b[0]) < 2)) return l;
        return a[1] - b[1];
      }).map(function (x) { return x[0]; });
    },
    headerOrder: function () {
      var row = this.cols.length && this.cols[0].th.parentNode; if (!row) return;
      this.cols.forEach(function (c) { if (row.lastElementChild !== c.th) row.appendChild(c.th); });
      this.cols.forEach(function (c) { if (c.pin) c.th.setAttribute('data-pin', c.pin); else c.th.removeAttribute('data-pin'); });
    },
    save: function () {
      if (!this.key) return;
      var o = { widths: {}, order: this.cols.map(function (c) { return c.field; }), hidden: [], pins: {} };
      this.cols.forEach(function (c) { if (c.width) o.widths[c.field] = Math.round(c.width); if (c.hidden) o.hidden.push(c.field); if (c.kind === 'field') o.pins[c.field] = c.pin; });
      store(this.key, o);
    },
    min: function (c) { return c.kind === 'field' ? Math.max(64, textWidth([c.label], c.th) * 0.5 + 48) : 0; },
    /* measure the widths the browser chose once, then hold them: table-layout fixed from here on */
    layout: function () {
      var t = this.table, self = this, vis = this.visible();
      if (!this.wrap || getComputedStyle(t).display !== 'table') { t.removeAttribute('data-fixed'); return; }
      if (!this.wrap.clientWidth) return;   /* not on screen (a view not shown yet): measure when it shows (the wrap's ResizeObserver) */
      if (t._s4data && !t._s4data.sized) return;   /* a data table takes its first widths from its data */
      if (!this.measured) {
        var w = vis.map(function (c) { return c.width || c.th.getBoundingClientRect().width; });
        vis.forEach(function (c, i) { c.width = Math.max(self.min(c), Math.ceil(w[i]));   /* never round a column below its text: the last letter would wrap */ });
        this.measured = true;
      }
      /* the fill column takes what is left when the columns are narrower than the table */
      var fill = vis.filter(function (c) { return c.th.hasAttribute('data-fill'); })[0] || vis.filter(function (c) { return c.th.hasAttribute('data-primary'); })[0] || vis.filter(function (c) { return c.kind === 'field' && !c.pin; })[0];
      var total = vis.reduce(function (a, c) { return a + c.width; }, 0), room = this.wrap.clientWidth;
      var extra = Math.max(0, room - total);
      var html = vis.map(function (c) { return '<col style="width:' + (c.width + (c === fill ? extra : 0)) + 'px">'; }).join('');
      if (this.colgroup.innerHTML !== html) this.colgroup.innerHTML = html;
      t.style.setProperty('--_table-w', (total + extra) + 'px');
      t.setAttribute('data-fixed', '');
      this.pins();
      if (this.onLayout) this.onLayout();
    },
    /* pinned offsets from the real widths: one read of the pinned headers, one write of variables */
    pins: function () {
      var t = this.table, vis = this.visible(), at = 0, i, starts = [], ends = [];
      for (i = 0; i < vis.length && vis[i].pin === 'start'; i++) starts.push(vis[i]);
      for (i = vis.length - 1; i >= 0 && vis[i].pin === 'end'; i--) ends.push(vis[i]);
      var ws = starts.concat(ends).map(function (c) { return c.th.getBoundingClientRect().width; });
      starts.forEach(function (c, k) { t.style.setProperty('--s4-pin-' + c.field, at + 'px'); c.th.style.setProperty('--_pin-at', at + 'px'); at += ws[k]; });
      at = 0;
      ends.forEach(function (c, k) { t.style.setProperty('--s4-pin-' + c.field, at + 'px'); c.th.style.setProperty('--_pin-at', at + 'px'); at += ws[starts.length + k]; });
      this.lastStart = starts.length ? starts[starts.length - 1].field : null;
      this.firstEnd = ends.length ? ends[ends.length - 1].field : null;
      this.cols.forEach(function (c) { c.th.toggleAttribute('data-pin-edge', c.field === this.lastStart || c.field === this.firstEnd); }, this);
      t.toggleAttribute('data-pinned', !!(starts.length || ends.length));
      this.edgeKey = this.lastStart + '|' + this.firstEnd;
      this.edges();
    },
    /* the tonal edge shows only while something is under it */
    edges: function () {
      var w = this.wrap; if (!w) return;
      var x = Math.abs(w.scrollLeft), max = w.scrollWidth - w.clientWidth;
      w.toggleAttribute('data-scrolled-start', x > 1);
      w.toggleAttribute('data-scrolled-end', x < max - 1);
    },
    style: function (c) {
      return c.pin ? ' data-pin="' + c.pin + '" style="--_pin-at:var(--s4-pin-' + c.field + ',0px)"' + (c.field === this.lastStart || c.field === this.firstEnd ? ' data-pin-edge' : '') : '';
    },
    grips: function () {
      var self = this;
      this.cols.forEach(function (c) {
        if (c.kind !== 'field' || c.th.querySelector(':scope > .s4-table-grip')) return;
        var g = document.createElement('span');
        g.className = 's4-table-grip'; g.tabIndex = 0;
        g.setAttribute('role', 'separator'); g.setAttribute('aria-orientation', 'vertical'); g.setAttribute('aria-label', 'Resize ' + c.label);
        g.setAttribute('aria-valuemin', String(Math.round(self.min(c))));
        g.setAttribute('aria-valuemax', '960');
        c.th.appendChild(g); c.grip = g;
        g.addEventListener('keydown', function (e) {
          var dir = rtl(g) ? -1 : 1, d = 0, roving = !!self.table._s4data, resizing = g.hasAttribute('data-resizing');
          /* in a data table the header is one Tab stop whose arrows move along it (the grid pattern): a grip resizes with
             Shift and the arrows, or after Enter (or F2) until Enter, Escape (puts the width back) or Tab */
          if (roving && !resizing) {
            if (e.key === 'Enter' || e.key === 'F2') { e.preventDefault(); e.stopPropagation(); g.setAttribute('data-resizing', ''); g._s4was = c.width; self.say('Resizing ' + c.label + '. Left and Right change the width, Enter to finish'); return; }
            if (!e.shiftKey || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
          }
          if (roving && resizing && (e.key === 'Enter' || e.key === 'F2' || e.key === 'Escape' || e.key === 'Tab')) {
            if (e.key !== 'Tab') { e.preventDefault(); e.stopPropagation(); }
            if (e.key === 'Escape' && g._s4was) self.width(c.field, g._s4was);
            g.removeAttribute('data-resizing'); self.say(c.label + ' is ' + Math.round(c.width) + ' pixels wide'); return;
          }
          var step = e.shiftKey && !roving ? 64 : 16;
          if (e.key === 'ArrowRight') d = step * dir; else if (e.key === 'ArrowLeft') d = -step * dir;
          else if (e.key === 'Enter' && !roving) { e.preventDefault(); self.fit(c.field); return; }
          else if (e.key === 'Home' && !roving) { e.preventDefault(); self.width(c.field, self.min(c)); return; }
          else return;
          e.preventDefault(); e.stopPropagation(); self.width(c.field, c.width + d);
        });
        g.addEventListener('blur', function () { g.removeAttribute('data-resizing'); });
        g.addEventListener('dblclick', function (e) { e.preventDefault(); self.fit(c.field); });
        g.addEventListener('pointerdown', function (e) {
          if (e.button) return;
          e.preventDefault(); e.stopPropagation();
          g.setPointerCapture(e.pointerId);
          var x0 = e.clientX, w0 = c.width, dir = rtl(g) ? -1 : 1, raf = 0, next = w0;
          g.setAttribute('data-active', '');
          function move(ev) { next = w0 + (ev.clientX - x0) * dir; if (!raf) raf = requestAnimationFrame(function () { raf = 0; self.width(c.field, next, true); }); }
          function up() { g.removeEventListener('pointermove', move); g.removeEventListener('pointerup', up); g.removeEventListener('pointercancel', up); g.removeAttribute('data-active'); cancelAnimationFrame(raf); self.width(c.field, next); }
          g.addEventListener('pointermove', move); g.addEventListener('pointerup', up); g.addEventListener('pointercancel', up);
        });
        g.addEventListener('click', function (e) { e.stopPropagation(); });
      });
      this.syncGrips();
    },
    say: function (text) { if (this.table._s4data) this.table._s4data.say(text); },
    syncGrips: function () { this.cols.forEach(function (c) { if (c.grip) { c.grip.setAttribute('aria-valuenow', String(Math.round(c.width))); c.grip.setAttribute('aria-valuetext', Math.round(c.width) + ' pixels'); } }); },
    col: function (field) { return this.cols.filter(function (c) { return c.field === field; })[0]; },
    width: function (field, px, live) {
      var c = this.col(field); if (!c) return;
      c.width = Math.round(Math.max(this.min(c), Math.min(960, px)));
      this.layout(); this.syncGrips();
      if (!live) { this.save(); S4.util.emit(this.table, 's4-change', { type: 'resize', field: field, width: c.width }); }
    },
    /* fit: the widest value (from the data when there is data, otherwise the cells), plus the header and padding */
    fit: function (field) {
      var c = this.col(field); if (!c) return;
      var texts = this.texts ? this.texts(field) : slice(this.table.querySelectorAll('tbody tr')).map(function (tr) { var cell = tr.cells[c.th.cellIndex]; return cell ? cell.textContent.trim() : ''; });
      var body = this.table.querySelector('tbody td') || c.th;
      var w = Math.max(textWidth(texts, body), textWidth([c.label], c.th) + (c.th.hasAttribute('aria-sort') ? 24 : 0)) + 32 + 16;
      this.width(field, w);
    },
    hide: function (field, hidden) {
      var c = this.col(field); if (!c || c.kind !== 'field') return;
      if (hidden && this.visible().filter(function (x) { return x.kind === 'field'; }).length <= 1) return;   /* never hide the last column */
      c.hidden = !!hidden; c.th.hidden = c.hidden;
      this.changed('columns');
    },
    move: function (field, to) {
      var c = this.col(field); if (!c) return;
      var from = this.cols.indexOf(c); to = Math.max(0, Math.min(this.cols.length - 1, to));
      this.cols.splice(from, 1); this.cols.splice(to, 0, c);
      this.pinSort(); this.headerOrder();
      this.changed('columns');
    },
    pin: function (field, side) {
      var c = this.col(field); if (!c || c.kind !== 'field') return;
      c.pin = side === 'end' ? 'end' : side ? 'start' : '';
      this.pinSort(); this.headerOrder();
      this.changed('columns');
    },
    changed: function (type) {
      this.measured = this.cols.every(function (c) { return c.width; });
      this.save(); this.layout();
      if (this.onChange) this.onChange(type);
      S4.util.emit(this.table, 's4-change', { type: type, columns: this.cols.map(function (c) { return { field: c.field, label: c.label, hidden: c.hidden, pin: c.pin, width: c.width }; }) });
    }
  };
  S4.tableColumns = function (table) { return table._s4cols || (table._s4cols = new Columns(table)); };

  /* ======================= data: S4.table(el, options) ======================= */
  var FMT = {};
  function formatter(spec) {
    spec = spec || '';
    if (FMT[spec]) return FMT[spec];
    var p = spec.split(':'), lang = document.documentElement.lang || undefined, f;
    try {
      if (p[0] === 'currency') { var nf = new Intl.NumberFormat(lang, { style: 'currency', currency: p[1] || 'USD' }); f = function (v) { return v == null || v === '' ? '' : nf.format(v); }; }
      else if (p[0] === 'number' || p[0] === 'integer') { var n2 = new Intl.NumberFormat(lang, { maximumFractionDigits: p[0] === 'integer' ? 0 : +(p[1] || 2) }); f = function (v) { return v == null || v === '' ? '' : n2.format(v); }; }
      else if (p[0] === 'percent') { var pf = new Intl.NumberFormat(lang, { style: 'percent', maximumFractionDigits: 1 }); f = function (v) { return v == null || v === '' ? '' : pf.format(v); }; }
      else if (p[0] === 'date') { var df = new Intl.DateTimeFormat(lang, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }); f = function (v) { if (!v) return ''; var d = new Date(v); return isNaN(d) ? String(v) : df.format(d); }; }
      else f = function (v) { return v == null ? '' : String(v); };
    } catch (e) { f = function (v) { return v == null ? '' : String(v); }; }
    return (FMT[spec] = f);
  }
  var collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
  function title(t) { return String(t).replace(/(^|\s)\S/g, function (c) { return c.toUpperCase(); }); }
  function compare(a, b) {
    var an = a == null || a === '', bn = b == null || b === '';
    if (an || bn) return an && bn ? 0 : an ? 1 : -1;                     /* empty values last */
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return collator.compare(String(a), String(b));
  }
  var AGG = {
    sum: function (vs) { return vs.reduce(function (a, v) { return a + (+v || 0); }, 0); },
    avg: function (vs) { var n = vs.filter(function (v) { return v !== '' && v != null; }); return n.length ? AGG.sum(n) / n.length : null; },
    min: function (vs) { var n = vs.filter(function (v) { return v !== '' && v != null; }); return n.length ? Math.min.apply(null, n) : null; },
    max: function (vs) { var n = vs.filter(function (v) { return v !== '' && v != null; }); return n.length ? Math.max.apply(null, n) : null; },
    count: function (vs) { return vs.length; }
  };

  function Data(table, opts) {
    var self = this;
    this.table = table; this.opts = opts || {};
    this.wrap = wrapOf(table);
    this.states = table.closest('.s4-states');
    table._s4data = this;
    if (table._s4mo) table._s4mo.disconnect();
    this.c = S4.tableColumns(table);
    this.c.texts = function (field) { var col = self.c.col(field), f = formatter(col.th.getAttribute('data-format')); return self.view.map(function (i) { return f(self.rows[i][field]); }); };
    this.c.onChange = function () { self.draw(true); };
    this.c.onLayout = function () { if (self.edgeKey !== self.c.edgeKey) { self.edgeKey = self.c.edgeKey; if (self.loaded) self.draw(true); } else self.schedule(); };
    this.idKey = this.opts.id || 'id';
    this.rows = []; this.view = []; this.items = [];
    this.selected = new Set(); this.expanded = new Set(); this.collapsed = new Set();
    this.sortBy = null; this.pred = null; this.query = ''; this.groupBy = this.opts.group || table.getAttribute('data-group') || null;
    this.rendered = new Map(); this.current = 0; this.measuredAt = {};
    this.body = table.tBodies[0] || table.appendChild(document.createElement('tbody'));
    this.body.textContent = '';
    this.top = this.spacer(); this.bottom = this.spacer();
    this.body.append(this.top, this.bottom);
    if (this.wrap) {
      this.wrap.setAttribute('data-virtual', '');
      this.wrap.addEventListener('scroll', function () { self.schedule(); }, { passive: true });
      if (window.ResizeObserver) new ResizeObserver(function () { self.viewport = 0; self.headH = null; self.measuredAt = {}; self.measuredRow = false; self.schedule(); if (self.headRoving) self.headRove(); }).observe(this.wrap);
    }
    var head = table.tHead && table.tHead.rows[table.tHead.rows.length - 1];
    if (head) head.setAttribute('aria-rowindex', '1');
    this.menu = this.opts.rowMenu || (table.getAttribute('data-row-menu') && document.querySelector(table.getAttribute('data-row-menu')));
    this.bar = table.getAttribute('data-selection-bar') && document.querySelector(table.getAttribute('data-selection-bar'));
    this.wire();
    this.columnMenus();
    this.headKeys();
    this.hint();
    this.skeletons();
  }
  Data.prototype = {
    spacer: function () { var tr = document.createElement('tr'); tr.className = 's4-table-spacer'; tr.setAttribute('aria-hidden', 'true'); tr.innerHTML = '<td colspan="99"></td>'; return tr; },
    id: function (row, i) { return row[this.idKey] != null ? String(row[this.idKey]) : String(i); },
    fields: function () { return this.c.cols.filter(function (c) { return c.kind === 'field'; }); },
    /* first widths from the data itself (a sample of it), never from whichever rows happen to be drawn */
    size: function () {
      var self = this, sample = this.rows.length > 400 ? this.rows.filter(function (r, i) { return i % Math.ceil(self.rows.length / 400) === 0; }) : this.rows;
      var body = this.table.tHead.rows[0].cells[0], pad = 36;
      this.c.cols.forEach(function (c) {
        if (c.width) return;
        if (c.kind !== 'field') { c.width = 52; return; }
        var f = formatter(c.th.getAttribute('data-format')), custom = self.opts.cell && self.opts.cell[c.field];
        var data = textWidth(sample.map(function (r) { return f(r[c.field]); }), self.table) + (custom ? 24 : 0) + (c.th.hasAttribute('data-edit') ? 16 : 0);
        var touch = window.matchMedia && matchMedia('(hover: none)').matches;
        var head = textWidth([c.label], c.th) + (c.th.hasAttribute('aria-sort') ? 24 : 0) + (touch && self.table.hasAttribute('data-column-menu') ? 36 : 0);
        c.width = Math.round(Math.min(320, Math.max(self.c.min(c), data, head) + pad));
      });
      this.c.measured = true; this.sized = true;
      this.c.layout(); this.c.syncGrips && this.c.syncGrips();
    },
    /* ---------- the data ---------- */
    setRows: function (rows) {
      this.rows = (rows || []).slice(); this.loaded = true;
      this.index = {}; for (var i = 0; i < this.rows.length; i++) this.index[this.id(this.rows[i], i)] = i;
      var ids = this.index; this.selected.forEach(function (id) { if (!(id in ids)) this.selected.delete(id); }, this);
      if (this.rows.length && !this.sized) this.size();
      this.draw(); return this;
    },
    filter: function (fn) { this.pred = fn || null; this.draw(); return this; },
    search: function (q, fields) { this.query = String(q || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim(); this.searchFields = fields || null; this.draw(); return this; },
    sort: function (field, dir) {
      this.sortBy = field && dir && dir !== 'none' ? { field: field, dir: dir } : null;
      this.c.cols.forEach(function (c) { if (c.th.hasAttribute('aria-sort')) c.th.setAttribute('aria-sort', this.sortBy && c.field === field ? dir : 'none'); }, this);
      this.draw(); return this;
    },
    group: function (field) { this.groupBy = field || null; this.collapsed.clear(); this.draw(); return this; },
    /* indices of the rows that pass the filter and search, in sort order */
    compute: function () {
      var rows = this.rows, pred = this.pred, q = this.query, self = this, view = [];
      var fs = this.searchFields || this.fields().map(function (c) { return c.field; });
      for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        if (pred && !pred(r)) continue;
        if (q) {
          var hit = false;
          for (var k = 0; k < fs.length && !hit; k++) { var v = r[fs[k]]; if (v != null && String(v).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').indexOf(q) >= 0) hit = true; }
          if (!hit) continue;
        }
        view.push(i);
      }
      if (this.sortBy) { var f = this.sortBy.field, d = this.sortBy.dir === 'descending' ? -1 : 1; view.sort(function (a, b) { return compare(rows[a][f], rows[b][f]) * d || a - b; }); }
      this.view = view;
      /* display items: group headers, rows, details */
      var items = [];
      var push = function (i) { items.push({ t: 'r', i: i }); if (self.expanded.has(self.id(rows[i], i))) items.push({ t: 'd', i: i }); };
      if (this.groupBy) {
        var g = this.groupBy, groups = new Map();
        view.forEach(function (i) { var k = rows[i][g] == null || rows[i][g] === '' ? '—' : String(rows[i][g]); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(i); });
        var keys = Array.from(groups.keys()); if (!this.sortBy || this.sortBy.field !== g) keys.sort(collator.compare); else if (this.sortBy.dir === 'descending') keys.reverse();
        keys.forEach(function (k) { var list = groups.get(k); items.push({ t: 'g', key: k, list: list }); if (!self.collapsed.has(k)) list.forEach(push); });
      } else view.forEach(push);
      this.items = items;
    },
    draw: function (columns) {
      if (!this.rows) return;
      var keep = this.items[this.current] && this.keyOf(this.items[this.current]);
      this.compute();
      this.estimate();
      this.heights = new Float64Array(this.items.length);
      for (var i = 0; i < this.items.length; i++) this.heights[i] = this.est[this.items[i].t];
      this.dirty = true;
      if (keep) { var at = this.find(keep); this.current = at >= 0 ? at : Math.min(this.current, Math.max(0, this.items.length - 1)); }
      this.rendered.forEach(function (tr) { tr.remove(); }); this.rendered.clear();
      this.table.setAttribute('aria-rowcount', String(this.items.length + 1 + (this.hasTotals() ? 1 : 0)));
      this.totals();
      this.syncAll();
      this.paint();
      this.announce();
      if (columns !== true) S4.util.emit(this.table, 's4-change', { type: 'view', count: this.view.length, total: this.rows.length });
    },
    keyOf: function (it) { return it.t === 'g' ? 'g' + it.key : it.t + this.id(this.rows[it.i], it.i); },
    find: function (key) { for (var i = 0; i < this.items.length; i++) if (this.keyOf(this.items[i]) === key) return i; return -1; },
    estimate: function () {
      var row = parseFloat(S4.util.css('--s4-size-table-row', this.table)) || 52;
      this.est = this.est || { r: row, d: row * 3, g: row };
      if (!this.measuredRow) this.est.r = this.est.g = row;
    },
    /* ---------- states ---------- */
    announce: function () {
      if (this.states && S4.states && this.loaded) {
        var cur = S4.states.get(this.states);
        if (!((cur === 'error' || cur === 'offline') && this._s4loaded === this.rows)) {
          this._s4loaded = this.rows;
          var parts = this.states.querySelectorAll(':scope > [data-when]'), has = function (n) { return slice(parts).some(function (p) { return (' ' + p.getAttribute('data-when') + ' ').indexOf(' ' + n + ' ') >= 0; }); };
          var next = !this.rows.length ? 'empty' : !this.view.length && has('no-results') ? 'no-results' : 'ready';
          if (cur !== next) S4.states.set(this.states, next);
        }
      }
    },
    skeletons: function () {
      var host = this.states; if (!host) return;
      var vis = this.c.visible();
      host.querySelectorAll('[data-table-skeleton]').forEach(function (part) {
        if (part.children.length) return;
        var n = Math.max(1, +part.getAttribute('data-table-skeleton') || 6), cols = vis.filter(function (c) { return c.kind === 'field'; }).slice(0, 6), html = '<div class="s4-table-skeleton-head">' + cols.map(function () { return '<span class="s4-skeleton" data-shape="text"></span>'; }).join('') + '</div>';
        for (var i = 0; i < n; i++) html += '<div class="s4-table-skeleton-row">' + cols.map(function (c, k) { return '<span class="s4-skeleton" data-shape="text" style="inline-size:' + [72, 88, 56, 64, 80, 48][(i + k) % 6] + '%"></span>'; }).join('') + '</div>';
        part.classList.add('s4-table-skeleton'); part.style.setProperty('--_cols', String(cols.length));
        part.innerHTML = html; part.setAttribute('aria-hidden', 'true');
      });
    },
    /* ---------- painting what is on screen ---------- */
    schedule: function () { var self = this; if (this.raf) return; this.raf = requestAnimationFrame(function () { self.raf = 0; self.paint(); }); },
    offsets: function () {
      if (!this.dirty) return;
      var n = this.items.length, o = this.offs = new Float64Array(n + 1);
      for (var i = 0; i < n; i++) o[i + 1] = o[i] + this.heights[i];
      this.dirty = false;
    },
    at: function (y) { var o = this.offs, lo = 0, hi = this.items.length - 1; while (lo < hi) { var mid = (lo + hi + 1) >> 1; if (o[mid] <= y) lo = mid; else hi = mid - 1; } return Math.max(0, lo); },
    paint: function () {
      if (!this.wrap || !this.heights) return;
      this.offsets();
      var n = this.items.length, w = this.wrap;
      /* the one read per frame: where the scroller is and how tall it is (and where the body starts in it) */
      var top = w.scrollTop, h = this.viewport || (this.viewport = w.clientHeight), headH = this.headH != null ? this.headH : (this.headH = this.body.offsetTop);
      var y0 = Math.max(0, top - headH), over = 6;
      var first = n ? Math.max(0, this.at(y0) - over) : 0, last = n ? Math.min(n - 1, this.at(y0 + h) + over) : -1;
      /* keep the focused row on the page while it is close, so the keyboard never loses its place */
      var a = document.activeElement, ftr = a && this.body.contains(a) && a.closest('tr[data-n]'), fi = ftr ? +ftr.dataset.n : -1;
      if (fi >= 0 && fi < n) { if (fi < first && first - fi < 200) first = fi; if (fi > last && fi - last < 200) last = fi; }
      var want = new Map(), i;
      for (i = first; i <= last; i++) want.set(this.keyOf(this.items[i]), i);
      this.rendered.forEach(function (tr, key) { if (!want.has(key)) { tr.remove(); this.rendered.delete(key); } }, this);
      var cursor = this.top.nextSibling, fresh = [];
      for (i = first; i <= last; i++) {
        var key = this.keyOf(this.items[i]), tr = this.rendered.get(key);
        if (!tr) { tr = this.make(this.items[i], i); this.rendered.set(key, tr); fresh.push(tr); }
        else if (+tr.dataset.n !== i) this.renumber(tr, i);
        if (tr === cursor) cursor = cursor.nextSibling; else this.body.insertBefore(tr, cursor);
      }
      this.first = first; this.last = last;
      this.spacers(n ? this.offs[first] : 0, n && last >= 0 ? this.offs[n] - this.offs[last + 1] : 0);
      this.roving();
      /* measure what was just drawn, all reads together; only items not measured at this width */
      var changed = false, self = this, reads = [];
      this.rendered.forEach(function (tr) { var k = +tr.dataset.n; if (!self.measuredAt[self.keyOf(self.items[k])]) reads.push([tr, k]); });
      if (reads.length) {
        var hs = reads.map(function (r) { return r[0].getBoundingClientRect().height; });
        reads.forEach(function (r, j) {
          var it = self.items[r[1]], hgt = hs[j]; if (!hgt) return;
          self.measuredAt[self.keyOf(it)] = 1;
          if (it.t !== 'd' && !self.measuredRow) { self.est[it.t] = hgt; self.measuredRow = true; }
          if (Math.abs(self.heights[r[1]] - hgt) > 0.5) { self.heights[r[1]] = hgt; changed = true; }
        });
        /* every unmeasured row of the same kind takes the new estimate, so the scrollbar settles at once */
        if (changed && reads.length > 2) {
          for (i = 0; i < n; i++) if (!this.measuredAt[this.keyOf(this.items[i])]) this.heights[i] = this.est[this.items[i].t];
        }
        if (changed) { this.dirty = true; this.offsets(); this.spacers(this.offs[first], last >= 0 ? this.offs[n] - this.offs[last + 1] : 0); }
      }
      if (fresh.length && this.onPaint) this.onPaint(fresh);
    },
    spacers: function (a, b) {
      a = Math.round(a) + 'px'; b = Math.round(b) + 'px';
      if (this.top.firstChild.style.blockSize !== a) this.top.firstChild.style.blockSize = a;
      if (this.bottom.firstChild.style.blockSize !== b) this.bottom.firstChild.style.blockSize = b;
    },
    renumber: function (tr, i) { tr.dataset.n = String(i); tr.setAttribute('aria-rowindex', String(i + 2)); },
    /* ---------- one row ---------- */
    make: function (it, n) {
      var tr = document.createElement('tr'), vis = this.c.visible(), self = this;
      tr.dataset.n = String(n); tr.setAttribute('aria-rowindex', String(n + 2));
      if (it.t === 'g') {
        tr.className = 's4-table-group';
        var collapsed = this.collapsed.has(it.key), firstField = vis.filter(function (c) { return c.kind === 'field'; })[0];
        tr.dataset.key = it.key; tr.tabIndex = -1;
        tr.innerHTML = vis.map(function (c) {
          var pin = self.c.style(c);
          if (c === firstField) return '<th scope="rowgroup"' + pin + '><button type="button" class="s4-table-group-toggle" aria-expanded="' + !collapsed + '" tabindex="-1">' + icon('chevron-down') + '<span class="s4-table-group-name">' + esc(it.key) + '</span><span class="s4-table-group-count">' + it.list.length.toLocaleString() + '</span></button></th>';
          var agg = c.th.getAttribute('data-total');
          if (agg && AGG[agg] && c.kind === 'field') { var vals = it.list.map(function (i) { return self.rows[i][c.field]; }); return '<td class="s4-num"' + pin + ' data-label="' + esc(c.label) + '">' + esc(formatter(agg === 'count' ? 'integer' : c.th.getAttribute('data-format'))(AGG[agg](vals))) + '</td>'; }
          return '<td' + pin + ' data-label=""></td>';
        }).join('');
        return tr;
      }
      var row = this.rows[it.i], id = this.id(row, it.i);
      tr.dataset.id = id;
      if (it.t === 'd') {
        tr.className = 's4-table-detail';
        tr.id = this.detailId(id);
        var html = this.opts.detail ? this.opts.detail(row) : '';
        tr.innerHTML = '<td colspan="' + vis.length + '" data-label=""><div class="s4-table-detail-body">' + (typeof html === 'string' ? html : '') + '</div></td>';
        if (html && typeof html !== 'string') tr.querySelector('.s4-table-detail-body').appendChild(html);
        return tr;
      }
      tr.tabIndex = -1;
      if (this.selected.has(id)) tr.setAttribute('data-picked', '');
      var name = this.name(row), cells = [];
      for (var k = 0; k < vis.length; k++) cells.push(this.cell(vis[k], row, id, name));
      tr.innerHTML = cells.join('');
      if (this.opts.row) this.opts.row(tr, row);
      /* one Tab stop for the whole table (the current row): what is inside a row is reached with the arrow keys */
      tr.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])').forEach(function (x) { x.tabIndex = -1; });
      return tr;
    },
    name: function (row) {
      var p = this.c.cols.filter(function (c) { return c.th.hasAttribute('data-primary'); })[0] || this.fields()[0];
      return p ? String(row[p.field] == null ? '' : row[p.field]) : '';
    },
    detailId: function (id) { return (this.table.id || 's4t') + '-detail-' + String(id).replace(/[^\w-]/g, '_'); },
    cell: function (c, row, id, name) {
      var pin = this.c.style(c);
      if (c.kind === 'check') return '<td data-check' + pin + '><label class="s4-checkbox"><input type="checkbox" tabindex="-1" aria-label="Select ' + esc(name) + '"' + (this.selected.has(id) ? ' checked' : '') + '><span class="s4-checkbox-box"></span></label></td>';
      if (c.kind === 'expand') { var open = this.expanded.has(id); return '<td data-row-expand data-label=""' + pin + '><button type="button" class="s4-icon-button s4-table-expand" data-size="xs" tabindex="-1" aria-expanded="' + open + '" aria-controls="' + this.detailId(id) + '" aria-label="Details for ' + esc(name) + '">' + icon('chevron-down') + '</button></td>'; }
      if (c.kind === 'actions') return '<td data-row-actions data-label=""' + pin + '><button type="button" class="s4-icon-button s4-table-row-menu" data-size="xs" tabindex="-1" aria-haspopup="menu" aria-expanded="false"' + (this.menu ? ' aria-controls="' + this.menu.id + '"' : '') + ' aria-label="Actions for ' + esc(name) + '">' + icon('more-vert') + '</button></td>';
      var v = row[c.field], th = c.th, cls = isNum(th) ? ' class="s4-num"' : '';
      var attrs = cls + pin + ' data-label="' + esc(c.label) + '"' + (th.hasAttribute('data-primary') ? ' data-primary' : '') + (th.hasAttribute('data-wrap') ? ' data-wrap' : '');
      var edit = th.getAttribute('data-edit');
      if (edit != null) {
        var shown = edit === 'number' ? (v == null ? '' : String(v)) : (v == null ? '' : String(v));
        return '<td' + attrs + ' data-edit tabindex="-1"><input class="s4-table-input" tabindex="-1" autocomplete="off"' + (edit === 'number' ? ' inputmode="decimal"' : '') + ' aria-label="' + esc(c.label + ', ' + name) + '" value="' + esc(shown) + '"></td>';
      }
      var custom = this.opts.cell && this.opts.cell[c.field];
      var body = custom ? custom(v, row) : esc(formatter(th.getAttribute('data-format'))(v));
      return '<td' + attrs + '>' + body + '</td>';
    },
    /* ---------- totals footer (sticky): only when a column asks for one ---------- */
    hasTotals: function () { return this.fields().some(function (c) { return c.th.hasAttribute('data-total'); }) && !this.table.hasAttribute('data-no-totals'); },
    totals: function () {
      var t = this.table, foot = t.tFoot;
      if (!this.hasTotals()) { if (foot && foot.hasAttribute('data-s4')) foot.remove(); return; }
      if (!foot) { foot = t.createTFoot(); foot.setAttribute('data-s4', ''); }
      var vis = this.c.visible(), rows = this.rows, view = this.view, self = this, first = vis.filter(function (c) { return c.kind === 'field'; })[0];
      foot.innerHTML = '<tr aria-rowindex="' + (this.items.length + 2) + '">' + vis.map(function (c) {
        var pin = self.c.style(c), agg = c.th.getAttribute('data-total');
        if (c === first) return '<th scope="row"' + pin + '>Total <span class="s4-table-foot-count">' + view.length.toLocaleString() + ' ' + title(view.length === 1 ? (self.opts.noun || 'row') : (self.opts.nouns || 'rows')) + '</span></th>';
        if (agg && AGG[agg]) { var v = AGG[agg](view.map(function (i) { return rows[i][c.field]; })); return '<td class="s4-num"' + pin + ' data-label="' + esc((agg === 'avg' ? 'Average ' : agg === 'count' ? 'Count of ' : '') + c.label) + '">' + esc(formatter(agg === 'count' ? 'integer' : c.th.getAttribute('data-format'))(v)) + '</td>'; }
        return '<td' + pin + ' data-label=""></td>';
      }).join('') + '</tr>';
    },
    /* ---------- focus: one row is in the Tab order; arrows move ---------- */
    roving: function () {
      var cur = Math.min(this.current, this.items.length - 1), self = this, set = false;
      var want = null;
      this.rendered.forEach(function (tr) { if (+tr.dataset.n === cur && !tr.classList.contains('s4-table-detail')) want = tr; });
      if (!want) { var firstTr = this.top.nextElementSibling; if (firstTr && firstTr !== this.bottom && !firstTr.classList.contains('s4-table-detail')) want = firstTr; }
      /* only touch the rows that change: an attribute written each frame would restyle every row */
      if (this.tabRow && this.tabRow !== want && this.tabRow.tabIndex !== -1) this.tabRow.tabIndex = -1;
      if (want && want.tabIndex !== 0) want.tabIndex = 0;
      this.tabRow = want;
    },
    row: function (n) { var it = this.items[n]; return it ? this.rendered.get(this.keyOf(it)) : null; },
    go: function (n, cellTarget) {
      n = Math.max(0, Math.min(this.items.length - 1, n));
      if (this.items[n] && this.items[n].t === 'd') n += n > this.current ? 1 : -1;
      n = Math.max(0, Math.min(this.items.length - 1, n));
      this.current = n;
      this.reveal(n);
      var tr = this.row(n); if (!tr) return;
      this.roving();
      tr.focus({ preventScroll: true });
    },
    /* scroll so item n is in view (under the sticky header, above the sticky footer), then draw */
    reveal: function (n) {
      this.offsets();
      var w = this.wrap, headH = this.table.tHead ? this.table.tHead.getBoundingClientRect().height : 0, footH = this.table.tFoot ? this.table.tFoot.getBoundingClientRect().height : 0;
      var y = this.offs[n] + (this.headH || 0), h = this.heights[n], top = w.scrollTop, view = w.clientHeight;
      if (y - headH < top) w.scrollTop = y - headH;
      else if (y + h > top + view - footH) w.scrollTop = y + h - view + footH;
      this.paint();
    },
    targets: function (tr) { return slice(tr.querySelectorAll('td[data-edit], button, a[href], input[type="checkbox"]')).filter(function (t) { return !t.closest('td[data-edit]') || t.matches('td[data-edit]'); }); },
    activate: function (tr) {
      var it = this.items[+tr.dataset.n]; if (!it || it.t !== 'r') return;
      var row = this.rows[it.i], open = tr.querySelector('[data-page-open], a[href]');
      if (open) open.click();
      S4.util.emit(tr, 's4-select', { row: tr, data: row });
    },
    /* ---------- selection ---------- */
    pick: function (id, on) {
      if (on === undefined) on = !this.selected.has(id);
      if (on) this.selected.add(id); else this.selected.delete(id);
      var tr = this.rendered.get('r' + id);
      if (tr) { tr.toggleAttribute('data-picked', on); var b = tr.querySelector('[data-check] input'); if (b) b.checked = on; }
    },
    syncAll: function () {
      var a = this.table.querySelector('thead [data-check] input'), self = this;
      var n = this.view.reduce(function (k, i) { return k + (self.selected.has(self.id(self.rows[i], i)) ? 1 : 0); }, 0);
      if (a) { a.checked = n > 0 && n === this.view.length; a.indeterminate = n > 0 && n < this.view.length; }
      var count = this.selected.size;
      if (this.bar) {
        var c = this.bar.querySelector('[data-selection-count]'); if (c) c.textContent = count.toLocaleString() + ' Selected';
        var was = !this.bar.hidden; this.bar.hidden = !count;
        var top = this.bar.closest('.s4-top-app-bar'); if (top) top.toggleAttribute('data-selecting', count > 0);
        if (count && !was) S4.transition.fade(this.bar, true);
      }
    },
    selectionChanged: function () { this.syncAll(); S4.util.emit(this.table, 's4-change', { type: 'select', rows: this.selectedRows(), count: this.selected.size }); },
    selectedRows: function () { var self = this; return Array.from(this.selected).map(function (id) { return self.rows[self.index[id]]; }).filter(Boolean); },
    /* ---------- expand ---------- */
    expand: function (id, open) {
      id = String(id); if (open === undefined) open = !this.expanded.has(id);
      if (open === this.expanded.has(id)) return;
      var self = this, tr = this.rendered.get('r' + id), btn = tr && tr.querySelector('.s4-table-expand');
      if (btn) btn.setAttribute('aria-expanded', String(open));
      if (open) {
        this.expanded.add(id); this.redraw();
        var d = this.rendered.get('d' + id), body = d && d.querySelector('.s4-table-detail-body');
        if (body) S4.transition.reveal(body, { open: true }).then(function () { S4.transition.restore(body); body.style.overflow = ''; delete self.measuredAt['d' + id]; self.schedule(); });
      } else {
        var dd = this.rendered.get('d' + id), b2 = dd && dd.querySelector('.s4-table-detail-body');
        var done = function () { self.expanded.delete(id); self.redraw(); };
        if (b2) S4.transition.reveal(b2, { open: false }).then(done); else done();
      }
      S4.util.emit(this.table, 's4-toggle', { id: id, open: open, row: this.rows[this.index[id]] });
    },
    /* recompute the items but keep every drawn row (no flash, nothing re-inserted that did not move) */
    redraw: function () {
      var keep = this.items[this.current] && this.keyOf(this.items[this.current]);
      var old = this.heights, oldItems = this.items, oldKeys = {}, self = this;
      oldItems.forEach(function (it, i) { oldKeys[self.keyOf(it)] = old[i]; });
      this.compute();
      this.heights = new Float64Array(this.items.length);
      this.items.forEach(function (it, i) { var k = self.keyOf(it); self.heights[i] = k in oldKeys ? oldKeys[k] : self.est[it.t]; });
      this.dirty = true;
      if (keep) { var at = this.find(keep); if (at >= 0) this.current = at; }
      this.table.setAttribute('aria-rowcount', String(this.items.length + 1 + (this.hasTotals() ? 1 : 0)));
      this.totals();
      this.paint();
    },
    /* ---------- editing ---------- */
    update: function (id, patch, silent) {
      var i = this.index[String(id)]; if (i == null) return;
      var row = this.rows[i]; for (var k in patch) row[k] = patch[k];
      var tr = this.rendered.get('r' + id);
      if (tr) { var fresh = this.make({ t: 'r', i: i }, +tr.dataset.n); tr.replaceWith(fresh); this.rendered.set('r' + id, fresh); this.roving(); }
      this.totals();
      if (!silent) S4.util.emit(this.table, 's4-change', { type: 'update', id: String(id), row: row, patch: patch });
    },
    remove: function (ids) {
      var gone = {}; (ids || []).forEach(function (id) { gone[String(id)] = true; });
      var self = this, removed = [];
      this.rows = this.rows.filter(function (r, i) { var g = gone[self.id(r, i)]; if (g) removed.push(r); return !g; });
      ids.forEach(function (id) { self.selected.delete(String(id)); self.expanded.delete(String(id)); });
      this.setRows(this.rows); this.selectionChanged();
      return removed;
    },
    commit: function (input) {
      var td = input.closest('td'), tr = td.closest('tr'), it = this.items[+tr.dataset.n]; if (!it) return;
      var c = this.c.visible()[td.cellIndex], row = this.rows[it.i], id = this.id(row, it.i), before = row[c.field];
      var raw = input.value.trim(), num = c.th.getAttribute('data-edit') === 'number', val = raw;
      if (num) { val = raw === '' ? null : +raw.replace(/[^\d.\-]/g, ''); if (raw !== '' && isNaN(val)) { input.value = before == null ? '' : before; S4.snackbar((c.label) + ' needs a number'); return; } }
      if (String(val == null ? '' : val) === String(before == null ? '' : before)) return;
      if (!num && !raw && c.th.hasAttribute('data-required')) { input.value = before; S4.snackbar(c.label + ' can’t be empty'); return; }
      var self = this, patch = {}; patch[c.field] = val;
      this.update(id, patch);
      S4.util.emit(this.table, 's4-change', { type: 'edit', id: id, field: c.field, value: val, previous: before, row: row });
      S4.snackbar({ text: c.label + ' changed', action: 'Undo', onAction: function () { var p = {}; p[c.field] = before; self.update(id, p); S4.util.emit(self.table, 's4-change', { type: 'edit', id: id, field: c.field, value: before, previous: val, row: row, undo: true }); } });
    },
    /* ---------- events ---------- */
    wire: function () {
      var self = this, t = this.table;
      t.addEventListener('click', function (e) {
        var sortBtn = e.target.closest('.s4-table-sort');
        if (sortBtn && t.tHead.contains(sortBtn)) {
          var th = sortBtn.closest('th[aria-sort]'), f = self.c.cols.filter(function (c) { return c.th === th; })[0]; if (!f) return;
          var next = { none: 'ascending', ascending: 'descending', descending: 'none' }[th.getAttribute('aria-sort')] || 'ascending';
          self.sort(f.field, next);
          S4.util.emit(t, 's4-change', { type: 'sort', field: f.field, label: f.label, direction: next });
          return;
        }
        var tr = e.target.closest('tbody tr'); if (!tr || !self.body.contains(tr)) return;
        var n = +tr.dataset.n, it = self.items[n]; if (!it) return;
        if (it.t === 'g') { var k = it.key; if (self.collapsed.has(k)) self.collapsed.delete(k); else self.collapsed.add(k); self.current = n; self.redraw(); var g = self.row(n); if (g) g.focus({ preventScroll: true }); return; }
        if (it.t !== 'r') return;
        self.current = n; self.roving();
        var id = self.id(self.rows[it.i], it.i);
        var exp = e.target.closest('.s4-table-expand'); if (exp) { self.expand(id); return; }
        var menuBtn = e.target.closest('.s4-table-row-menu');
        if (menuBtn && self.menu) { self.menuRow = self.rows[it.i]; self.menuId = id; if (self.menu.matches(':popover-open') && self.menu._s4anchor === menuBtn) S4.menu.close(self.menu); else S4.menu.open(self.menu, menuBtn); return; }
        if (e.target.closest('[data-check]')) return;
        if (e.target.closest('a, button, input, label, select, textarea')) return;
        /* while rows are picked, a tap picks (like a list) */
        if (self.selected.size && t.querySelector('thead [data-check]') || e.ctrlKey || e.metaKey) { self.pick(id); self.anchor = n; self.selectionChanged(); return; }
        if (e.shiftKey && self.anchor != null) { self.range(self.anchor, n); return; }
        self.activate(tr);
      });
      t.addEventListener('change', function (e) {
        var box = e.target; if (!box.matches('[data-check] input[type="checkbox"]')) return;
        if (box.closest('thead')) {
          var on = box.checked; self.view.forEach(function (i) { self.pick(self.id(self.rows[i], i), on); });
        } else { var tr = box.closest('tr'), it = self.items[+tr.dataset.n]; self.pick(self.id(self.rows[it.i], it.i), box.checked); self.anchor = +tr.dataset.n; }
        self.selectionChanged();
      });
      /* editing: a real input that reads as text. Enter (or leaving it) saves, Escape puts it back */
      t.addEventListener('keydown', function (e) {
        var input = e.target.closest && e.target.closest('.s4-table-input');
        if (input) {
          if (e.key === 'Enter') { e.preventDefault(); self.commit(input); var td = input.closest('td'); td.focus(); }
          else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); input.value = input.defaultValue; input._s4cancel = true; input.closest('td').focus(); }
          return;
        }
        self.keys(e);
      });
      t.addEventListener('focusout', function (e) {
        var input = e.target.closest && e.target.closest('.s4-table-input');
        if (input) { if (input._s4cancel) { input._s4cancel = false; return; } self.commit(input); }
      });
      t.addEventListener('focusin', function (e) { var tr = e.target.closest && e.target.closest('tbody tr[data-n]'); if (tr && self.body.contains(tr) && !tr.classList.contains('s4-table-detail')) { self.current = +tr.dataset.n; self.roving(); } });
      if (this.menu) this.menu.addEventListener('s4-select', function (e) {
        if (!self.menuRow) return;
        S4.util.emit(t, 's4-row-action', { action: e.detail.value, row: self.menuRow, id: self.menuId });
      });
      if (this.bar) this.bar.addEventListener('click', function (e) { if (e.target.closest('[data-selection-clear]')) self.clear(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && self.selected.size && t.contains(document.activeElement) && !document.activeElement.matches('.s4-table-input')) { self.clear(); } });
    },
    clear: function () { var self = this; Array.from(this.selected).forEach(function (id) { self.pick(id, false); }); this.selectionChanged(); },
    range: function (a, b) {
      var self = this;
      for (var n = Math.min(a, b); n <= Math.max(a, b); n++) { var it = this.items[n]; if (it && it.t === 'r') this.pick(this.id(this.rows[it.i], it.i), true); }
      this.selectionChanged();
    },
    keys: function (e) {
      if (e.defaultPrevented) return;
      var self = this, a = document.activeElement, tr = a && a.closest && a.closest('tbody tr[data-n]');
      if (!tr || !this.body.contains(tr)) return;
      var n = +tr.dataset.n, it = this.items[n], onRow = a === tr, page = Math.max(1, Math.floor(this.wrap.clientHeight / this.est.r) - 2);
      var dir = rtl(this.table) ? -1 : 1, k = e.key;
      if (k === 'ArrowUp' && !e.shiftKey && n === 0 && this.headTo()) { e.preventDefault(); return; }
      if (k === 'ArrowDown' || k === 'ArrowUp') { e.preventDefault(); if (e.shiftKey && it.t === 'r') { this.pick(this.id(this.rows[it.i], it.i), true); } this.go(n + (k === 'ArrowDown' ? 1 : -1)); if (e.shiftKey) { var it2 = this.items[this.current]; if (it2 && it2.t === 'r') this.pick(this.id(this.rows[it2.i], it2.i), true); this.selectionChanged(); } return; }
      if (k === 'PageDown' || k === 'PageUp') { e.preventDefault(); this.go(n + (k === 'PageDown' ? page : -page)); return; }
      /* Ctrl+Home and Ctrl+End: the first and last row; Home and End: the start and end of this row (the grid pattern) */
      if ((k === 'Home' || k === 'End') && (e.ctrlKey || e.metaKey || it.t !== 'r')) { e.preventDefault(); this.go(k === 'Home' ? 0 : this.items.length - 1); return; }
      if (k === 'Home' || k === 'End') {
        e.preventDefault();
        var row = this.targets(tr), to = k === 'End' && row.length ? row[row.length - 1] : tr;
        to.focus({ preventScroll: true }); this.scrollCell(to === tr ? tr.cells[0] : to); return;
      }
      if (it.t === 'g') {
        if (k === 'Enter' || k === ' ' || (k === 'ArrowRight') === (dir > 0) && (k === 'ArrowRight' || k === 'ArrowLeft')) {
          var key = it.key, open = !this.collapsed.has(key), want = k === 'Enter' || k === ' ' ? !open : (k === 'ArrowRight') === (dir > 0);
          e.preventDefault(); if (want !== open) { if (want) this.collapsed.delete(key); else this.collapsed.add(key); this.redraw(); var g = this.row(n); if (g) g.focus({ preventScroll: true }); }
        }
        return;
      }
      if (it.t !== 'r') return;
      var ts = this.targets(tr), ti = ts.indexOf(a.closest('td[data-edit]') || a);
      var fwd = (k === 'ArrowRight' && dir > 0) || (k === 'ArrowLeft' && dir < 0), back = (k === 'ArrowLeft' && dir > 0) || (k === 'ArrowRight' && dir < 0);
      if (fwd && ts.length) { e.preventDefault(); var nx = ts[Math.min(ts.length - 1, ti + 1)]; nx.focus({ preventScroll: true }); this.scrollCell(nx); return; }
      if (back) { e.preventDefault(); if (ti <= 0) { tr.focus({ preventScroll: true }); this.scrollCell(tr.cells[0]); } else { ts[ti - 1].focus({ preventScroll: true }); this.scrollCell(ts[ti - 1]); } return; }
      if (k === 'Escape' && !onRow) { e.preventDefault(); e.stopPropagation(); tr.focus({ preventScroll: true }); return; }
      if (onRow) {
        var id = this.id(this.rows[it.i], it.i);
        if (k === ' ' && this.table.querySelector('thead [data-check]')) { e.preventDefault(); this.pick(id); this.anchor = n; this.selectionChanged(); return; }
        if (k === 'Enter') { e.preventDefault(); this.activate(tr); return; }
        if (k === 'F10' && e.shiftKey || k === 'ContextMenu') { var m = tr.querySelector('.s4-table-row-menu'); if (m) { e.preventDefault(); m.click(); } return; }
        if ((k === '+' || k === '-') && tr.querySelector('.s4-table-expand')) { e.preventDefault(); this.expand(id, k === '+'); return; }
        if (k === 'a' && (e.ctrlKey || e.metaKey) && this.table.querySelector('thead [data-check]')) { e.preventDefault(); this.view.forEach(function (i) { self.pick(self.id(self.rows[i], i), true); }); this.selectionChanged(); return; }
      }
      /* a cell that edits: Enter puts the cursor in it (a key press is the person asking, decision 0049) */
      if (a.matches('td[data-edit]') && (k === 'Enter' || k === 'F2')) { e.preventDefault(); var inp = a.querySelector('input'); inp.defaultValue = inp.value; inp.focus({ preventScroll: true }); inp.select(); return; }
      if (a.matches('td[data-edit], button') && k === 'Enter' && a.tagName === 'BUTTON') return;   /* buttons press themselves */
    },
    scrollCell: function (el) {
      var w = this.wrap, r = el.getBoundingClientRect(), wr = w.getBoundingClientRect();
      var pinS = 0, pinE = 0;
      this.table.querySelectorAll('thead th[data-pin="start"]').forEach(function (th) { pinS += th.getBoundingClientRect().width; });
      this.table.querySelectorAll('thead th[data-pin="end"]').forEach(function (th) { pinE += th.getBoundingClientRect().width; });
      if (el.closest('[data-pin]')) return;
      var ltr = !rtl(w), left = ltr ? wr.left + pinS : wr.left + pinE, right = ltr ? wr.right - pinE : wr.right - pinS;
      if (r.left < left) w.scrollLeft -= left - r.left; else if (r.right > right) w.scrollLeft += r.right - right;
    },
    /* ---------- the header: one Tab stop, arrows move along it (WAI-ARIA grid) ---------- */
    headTargets: function () {
      var row = this.table.tHead && this.table.tHead.rows[this.table.tHead.rows.length - 1]; if (!row) return [];
      return slice(row.querySelectorAll('input, button, a[href], .s4-table-grip')).filter(function (x) { return !x.disabled && !x.closest('th[hidden]') && x.getClientRects().length; });
    },
    /* the grid's header keys are not on screen anywhere, so they are said: aria-description on the table for a screen reader,
       and a short line under the wrap that fades in while the keyboard is inside the table (decision 0067). data-hint="off"
       on the table leaves the visible line out (the description stays). */
    hint: function () {
      var t = this.table;
      if (!t.hasAttribute('aria-description')) t.setAttribute('aria-description', 'Arrow keys move between rows and cells. Up from the first row reaches the column headers: Left and Right move between each column\'s sort, options and resize controls, and Down returns to the rows.');
      if (t.getAttribute('data-hint') === 'off' || !this.wrap || (this.wrap.nextElementSibling && this.wrap.nextElementSibling.classList.contains('s4-table-hint'))) return;
      var h = document.createElement('p'); h.className = 's4-table-hint'; h.setAttribute('aria-hidden', 'true');
      h.textContent = 'Up from the first row reaches the column headers: Left and Right choose sort, options or resize, Down comes back.';
      this.wrap.parentNode.insertBefore(h, this.wrap.nextSibling);
    },
    headRove: function (to) {
      var ts = this.headTargets(); if (!ts.length) return;
      if (to && ts.indexOf(to) >= 0) this.headCur = to;
      if (!this.headCur || ts.indexOf(this.headCur) < 0) this.headCur = ts[0];
      var cur = this.headCur, row = cur.closest('tr');
      /* every header control leaves the Tab order, shown or not (a hidden one may show at another width), but one */
      slice(row.querySelectorAll('input, button, a[href], .s4-table-grip')).forEach(function (x) { var want = x === cur ? 0 : -1; if (x.tabIndex !== want) x.tabIndex = want; });
    },
    /* to the header from the body (Up on the first row) */
    headTo: function () { this.headRove(); if (!this.headCur) return false; this.headCur.focus({ preventScroll: true }); return true; },
    headKeys: function () {
      var self = this, t = this.table, head = t.tHead; if (!head) return;
      this.headRoving = true;
      this.headRove();
      /* the header changes (columns moved, hidden, menus and grips added): keep exactly one Tab stop */
      new MutationObserver(function () { if (self.headQueued) return; self.headQueued = true; requestAnimationFrame(function () { self.headQueued = false; self.headRove(); }); }).observe(head, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
      head.addEventListener('focusin', function (e) { var ts = self.headTargets(); if (ts.indexOf(e.target) >= 0) self.headRove(e.target); });
      head.addEventListener('keydown', function (e) {
        if (e.defaultPrevented || e.altKey) return;
        var ts = self.headTargets(), i = ts.indexOf(document.activeElement); if (i < 0) return;
        var dir = rtl(t) ? -1 : 1, k = e.key, to = null;
        if (k === 'ArrowRight') to = ts[Math.min(ts.length - 1, i + dir)] || ts[i];
        else if (k === 'ArrowLeft') to = ts[Math.max(0, i - dir)] || ts[i];
        else if (k === 'Home') to = ts[0];
        else if (k === 'End') to = ts[ts.length - 1];
        else if (k === 'ArrowDown' && !document.activeElement.matches('[aria-haspopup], [data-menu]')) { e.preventDefault(); if (self.items.length) self.go(self.current); return; }
        else return;
        e.preventDefault();
        self.headRove(to); to.focus({ preventScroll: true });
        var cell = to.closest('th'); if (cell && self.wrap) self.scrollCell(cell);
      });
    },
    /* ---------- menus: a column's own menu, and the Columns menu (show, hide, order) ---------- */
    columnMenus: function () {
      var self = this, t = this.table;
      var colsMenu = document.querySelector('.s4-menu[data-table-columns="#' + t.id + '"]');
      if (colsMenu) {
        this.colsMenu = colsMenu;
        var fill = function () {
          colsMenu.innerHTML = '<div class="s4-menu-label">Show Columns</div>' + self.fields().map(function (c) {
            return '<button class="s4-menu-item" type="button" role="menuitemcheckbox" tabindex="-1" aria-checked="' + !c.hidden + '" value="' + esc(c.field) + '"><span class="s4-menu-item-text">' + esc(c.label) + '</span>' + (c.pin ? '<span class="s4-menu-item-trailing">' + icon('pin') + '</span>' : '') + '</button>';
          }).join('') + '<div class="s4-menu-label s4-table-menu-hint">Alt and the arrow keys move a column</div>';
        };
        fill();
        colsMenu.addEventListener('click', function (e) { var it = e.target.closest('[role="menuitemcheckbox"]'); if (!it) return; setTimeout(function () { self.c.hide(it.value, it.getAttribute('aria-checked') !== 'true'); if (self.c.col(it.value).hidden !== (it.getAttribute('aria-checked') !== 'true')) it.setAttribute('aria-checked', 'true'); }); });
        colsMenu.addEventListener('keydown', function (e) {
          if (!e.altKey || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
          var it = e.target.closest('[role="menuitemcheckbox"]'); if (!it) return;
          e.preventDefault(); e.stopImmediatePropagation();
          var f = it.value, fs = self.fields(), i = fs.indexOf(self.c.col(f)), to = fs[i + (e.key === 'ArrowDown' ? 1 : -1)]; if (!to) return;
          self.c.move(f, self.c.cols.indexOf(to)); fill();
          var again = colsMenu.querySelector('[value="' + f + '"]'); if (again) again.focus();
          self.say(self.c.col(f).label + ' moved to position ' + (self.fields().indexOf(self.c.col(f)) + 1) + ' of ' + self.fields().length);
        }, true);
        /* fill it before menu.js opens it (it focuses the first item), never after */
        document.querySelectorAll('[data-menu="' + colsMenu.id + '"]').forEach(function (b) { b.addEventListener('click', fill, true); b.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') fill(); }, true); });
      }
      if (!t.hasAttribute('data-column-menu')) return;
      var m = document.getElementById(t.id + '-column-menu');
      if (!m) {
        m = document.createElement('div'); m.className = 's4-menu'; m.id = t.id + '-column-menu'; m.setAttribute('aria-label', 'Column options');
        document.body.appendChild(m);
      }
      this.colMenu = m;
      this.fields().forEach(function (c) {
        if (c.th.querySelector('.s4-table-col-menu')) return;
        var b = document.createElement('button'); b.type = 'button'; b.className = 's4-icon-button s4-table-col-menu'; b.dataset.size = 'xs';
        b.setAttribute('data-menu', m.id); b.setAttribute('aria-label', c.label + ' Column Options'); b.innerHTML = icon('more-vert');
        c.th.insertBefore(b, c.grip || null);   /* the same order in every column: name, options, grip */
        b.addEventListener('click', function () { self.menuCol = c.field; self.fillColMenu(); }, true);
      });
      m.addEventListener('s4-select', function (e) {
        var c = self.c.col(self.menuCol); if (!c) return;
        var v = e.detail.value, vis = self.c.cols, i = vis.indexOf(c), ltr = !rtl(t);
        var step = function (d) { var j = i + d; while (vis[j] && (vis[j].hidden || vis[j].kind !== 'field')) j += d; if (vis[j]) self.c.move(c.field, j); };
        if (v === 'asc' || v === 'desc') self.sort(c.field, v === 'asc' ? 'ascending' : 'descending');
        else if (v === 'fit') self.c.fit(c.field);
        else if (v === 'pin') self.c.pin(c.field, c.pin ? '' : 'start');
        else if (v === 'left') step(ltr ? -1 : 1);
        else if (v === 'right') step(ltr ? 1 : -1);
        else if (v === 'hide') self.c.hide(c.field, true);
        else if (v === 'group') self.group(self.groupBy === c.field ? null : c.field);
      });
    },
    fillColMenu: function () {
      var c = this.c.col(this.menuCol), m = this.colMenu; if (!c || !m) return;
      var fs = this.fields().filter(function (x) { return !x.hidden; }), i = fs.indexOf(c), ltr = !rtl(this.table);
      var item = function (v, label, ic, dis) { return '<button class="s4-menu-item" type="button" role="menuitem" tabindex="-1" value="' + v + '"' + (dis ? ' disabled' : '') + '>' + icon(ic) + '<span class="s4-menu-item-text">' + label + '</span></button>'; };
      var sortable = c.th.hasAttribute('aria-sort'), canGroup = c.th.hasAttribute('data-groupable');
      m.innerHTML = '<div class="s4-menu-label">' + esc(c.label) + '</div>' +
        (sortable ? item('asc', 'Sort Ascending', 'chevron-up') + item('desc', 'Sort Descending', 'chevron-down') + '<hr class="s4-menu-divider">' : '') +
        (canGroup ? item('group', this.groupBy === c.field ? 'Stop Grouping' : 'Group by ' + esc(c.label), 'list') : '') +
        item('pin', c.pin ? 'Unpin Column' : 'Pin Column', 'pin') + item('fit', 'Fit to Content', 'columns') +
        item('left', 'Move Left', 'chevron-left', ltr ? i <= 0 : i >= fs.length - 1) + item('right', 'Move Right', 'chevron-right', ltr ? i >= fs.length - 1 : i <= 0) +
        '<hr class="s4-menu-divider">' + item('hide', 'Hide Column', 'hidden', fs.length <= 1);
      m.querySelectorAll('.s4-menu-item').forEach(function (b) { b.tabIndex = -1; });
    },
    say: function (text) {
      var live = this.live; if (!live) { live = this.live = document.createElement('span'); live.className = 's4-visually-hidden'; live.setAttribute('role', 'status'); this.table.parentNode.insertBefore(live, this.table); }
      live.textContent = ''; setTimeout(function () { live.textContent = text; }, 30);
    }
  };

  /* S4.table(el, options) -> the controller (created once per table). el is the table or its wrap. */
  S4.table = function (el, opts) {
    var t = el && (el.matches('table') ? el : el.querySelector('table.s4-table')); if (!t) return null;
    if (!t._s4data) new Data(t, opts); else if (opts) for (var k in opts) t._s4data.opts[k] = opts[k];
    return t._s4data;
  };
})();

S4.register('table', function (scope) {
  S4.util.all(scope, 'table.s4-table').forEach(function (table) {
    if (!S4.util.once(table, 'table')) return;
    if (S4.tableWrap) S4.tableWrap(table);
    var slice = function (l) { return Array.prototype.slice.call(l); };
    var bodies = function () { return slice(table.tBodies); };
    var bodyRows = function () { return bodies().reduce(function (a, b) { return a.concat(slice(b.rows)); }, []); };
    var headRow = function () { var h = table.tHead; return h && h.rows.length ? h.rows[h.rows.length - 1] : null; };
    var counter = 0, isNum = S4.tableIsNum;

    /* header cell for each column index, honouring colspan */
    function columns() {
      var out = [], row = headRow(); if (!row) return out;
      slice(row.cells).forEach(function (th) { for (var i = 0; i < (th.colSpan || 1); i++) out.push(th); });
      return out;
    }
    function cellAt(row, col) {
      var c = 0, cells = row.cells;
      for (var i = 0; i < cells.length; i++) { if (col < c + (cells[i].colSpan || 1)) return cells[i]; c += cells[i].colSpan || 1; }
      return null;
    }

    /* ---------- column names on cells, original order ---------- */
    function label() {
      var cols = columns();
      /* a column whose every body cell is a figure (.s4-num) right-aligns its header too */
      cols.forEach(function (th, i) {
        if (isNum(th) || th.hasAttribute('data-check')) return;
        var cells = bodyRows().map(function (tr) { return cellAt(tr, i); }).filter(Boolean);
        if (cells.length && cells.every(function (c) { return isNum(c) && (c.colSpan || 1) === 1; })) th.classList.add('s4-num');
      });
      var rows = bodyRows().concat(table.tFoot ? slice(table.tFoot.rows) : []);
      rows.forEach(function (tr) {
        if (tr.parentNode.tagName === 'TBODY' && !tr.dataset.s4Order) tr.dataset.s4Order = String(counter++);
        var c = 0;
        slice(tr.cells).forEach(function (cell) {
          var th = cols[c]; c += cell.colSpan || 1;
          if (!th || th.hasAttribute('data-check') || cell.hasAttribute('data-check')) return;
          if (!cell.hasAttribute('data-label') && (cell.colSpan || 1) === 1) cell.setAttribute('data-label', th.textContent.trim());
          if (th.hasAttribute('data-primary')) cell.setAttribute('data-primary', '');
          if (isNum(th) && (cell.colSpan || 1) === 1) cell.classList.add('s4-num');
        });
      });
    }

    /* ---------- sorting ---------- */
    var NUM = /^[\s(+\-−$€£¥]*\d[\d,.\s]*%?\)?$/;
    function key(cell) {
      if (!cell) return { n: null, s: '' };
      var raw = cell.hasAttribute('data-value') ? cell.getAttribute('data-value') : cell.textContent.trim();
      if (cell.hasAttribute('data-value') ? raw !== '' && !isNaN(+raw) : NUM.test(raw)) {
        var neg = /^[\s]*[(\-−]/.test(raw);
        var n = parseFloat(raw.replace(/[^\d.]/g, ''));
        if (!isNaN(n)) return { n: neg ? -n : n, s: raw };
      }
      return { n: null, s: raw };
    }
    var collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
    function sort(col, dir) {
      var before = new Map();
      bodyRows().forEach(function (tr) { before.set(tr, tr.getBoundingClientRect().top); });
      bodies().forEach(function (tb) {
        var rows = slice(tb.rows);
        rows.sort(function (a, b) {
          if (dir === 'none') return +a.dataset.s4Order - +b.dataset.s4Order;
          var x = key(cellAt(a, col)), y = key(cellAt(b, col)), r;
          if (x.n !== null && y.n !== null) r = x.n - y.n;
          else if (x.n !== null || y.n !== null) r = x.n !== null ? -1 : 1;   /* numbers before text */
          else r = collator.compare(x.s, y.s);
          if (r === 0) r = +a.dataset.s4Order - +b.dataset.s4Order;           /* stable */
          return dir === 'descending' ? -r : r;
        });
        rows.forEach(function (tr) { tb.appendChild(tr); });
      });
      /* FLIP: each row slides from where it was */
      bodyRows().forEach(function (tr) {
        var dy = before.get(tr) - tr.getBoundingClientRect().top;
        S4.transition.move(tr, 0, dy);
      });
    }
    table.addEventListener('click', function (e) {
      if (table._s4data) return;   /* a data table (S4.table) sorts its rows itself */
      var btn = e.target.closest('.s4-table-sort'); if (!btn || !table.contains(btn)) return;
      var th = btn.closest('th[aria-sort]'); if (!th) return;
      var next = { none: 'ascending', ascending: 'descending', descending: 'none' }[th.getAttribute('aria-sort')] || 'ascending';
      table.querySelectorAll('th[aria-sort]').forEach(function (h) { h.setAttribute('aria-sort', 'none'); });
      th.setAttribute('aria-sort', next);
      var col = columns().indexOf(th);
      sort(col, next);
      S4.util.emit(table, 's4-change', { type: 'sort', column: col, label: th.textContent.trim(), direction: next });
    });

    /* ---------- selection ---------- */
    var all = function () { return table.querySelector('thead [data-check] input[type="checkbox"]'); };
    var boxes = function () { return slice(table.querySelectorAll('tbody [data-check] input[type="checkbox"]')).filter(function (b) { return !b.disabled; }); };
    function syncAll() {
      var a = all(); if (!a) return;
      var b = boxes(), n = b.filter(function (x) { return x.checked; }).length;
      a.checked = n > 0 && n === b.length;
      a.indeterminate = n > 0 && n < b.length;
    }
    function selected() { return boxes().filter(function (b) { return b.checked; }).map(function (b) { return b.closest('tr'); }); }
    table.addEventListener('change', function (e) {
      if (table._s4data) return;
      var box = e.target; if (!box.matches || !box.matches('[data-check] input[type="checkbox"]')) return;
      if (box === all()) boxes().forEach(function (b) { b.checked = box.checked; });
      syncAll();
      S4.util.emit(table, 's4-change', { type: 'select', rows: selected() });
    });

    /* ---------- clickable rows ---------- */
    var INTERACTIVE = 'a, button, input, select, textarea, label, [data-check]';
    function activate(tr, e) {
      var link = tr.querySelector('a[href]');
      if (link && !(e && e.target.closest('a'))) link.click();
      S4.util.emit(tr, 's4-select', { row: tr });
    }
    table.addEventListener('click', function (e) {
      if (table._s4data) return;
      var tr = e.target.closest('tbody tr[tabindex]'); if (!tr || !table.contains(tr)) return;
      if (e.target.closest(INTERACTIVE)) return;
      activate(tr, e);
    });
    table.addEventListener('keydown', function (e) {
      if (table._s4data || e.key !== 'Enter' || !e.target.matches('tbody tr[tabindex]')) return;
      e.preventDefault();
      activate(e.target, null);
    });

    label();
    syncAll();
    /* rows added or removed later */
    table._s4mo = new MutationObserver(function () { if (!table._s4data) { label(); syncAll(); } });
    table._s4mo.observe(table, { childList: true, subtree: true });
    if (table.hasAttribute('data-resizable') || table.querySelector('th[data-pin]')) S4.tableColumns(table);
  });
});
