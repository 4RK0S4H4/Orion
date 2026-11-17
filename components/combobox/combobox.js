/* Combobox / autocomplete (WAI-ARIA combobox with a listbox popup), and S4.listbox, the glass list it opens.
     <div class="s4-text-field s4-combobox" data-free>
       <label for="city">City</label>
       <input id="city" autocomplete="off">
       <input type="hidden" name="city">                          optional: receives the chosen option's value
       <template><optgroup label="Portugal"><option value="lis" data-supporting="Lisbon District">Lisbon</option></optgroup></template>
       <div class="s4-text-field-supporting">Start typing a city.</div>
     </div>
   - Typing filters the options (case and accent insensitive) and opens the list; the matching part is drawn bold.
   - Without data-free only an option may be chosen: other text makes the control invalid ("Choose one of the options in
     the list.", or data-msg-option), shown on blur by .s4-form (or by the combobox itself outside a form).
   - S4.combobox.source(field, function (query, signal) { return Promise<[{ value, label, group, supporting }]> })
     makes the list asynchronous: loading, empty and error (with Try Again) states; data-min-chars (default 1).
   - The trailing button is Show Options (a chevron) while the field is empty and Clear once it has text: one button, so
     focus never falls off the page. No script ever moves the cursor into the field (decision 0049).
   - Choosing fires input and change on the input and s4-change { value, label, item } on the field.
   Keyboard (APG): Down / Up open and move, Alt+Down opens, Enter chooses, Escape closes (then clears), Tab leaves. The
   cursor stays in the field throughout; the active option is aria-activedescendant. */
(function () {
  var S4 = window.S4, uid = 0;
  var norm1 = function (c) { return c.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); };
  var norm = function (s) { return Array.from(String(s == null ? '' : s)).map(norm1).join(''); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  function mark(label, q) {
    q = norm(q).trim();
    var n = norm(label), i = q ? n.indexOf(q) : -1;
    if (i < 0) return esc(label);
    var chars = Array.from(label);
    return esc(chars.slice(0, i).join('')) + '<mark class="s4-combobox-match">' + esc(chars.slice(i, i + q.length).join('')) + '</mark>' + esc(chars.slice(i + q.length).join(''));
  }
  /* the field's box (between its label and its supporting text): what the list hangs from */
  function boxRect(field) {
    var r = field.getBoundingClientRect(), lab = field.querySelector(':scope > label'), sup = field.querySelector(':scope > .s4-text-field-supporting, :scope > .s4-text-field-counter');
    var top = lab && lab.offsetParent !== null ? lab.getBoundingClientRect().bottom : r.top;
    var bottom = sup && sup.offsetParent !== null && sup.textContent.trim() ? sup.getBoundingClientRect().top : r.bottom;
    return { left: r.left, right: r.right, width: r.width, top: top, bottom: bottom };
  }
  var openLists = [];

  /* ---------- S4.listbox: the glass list a field opens without taking the cursor out of it ---------- */
  S4.listbox = function (field, input, opts) {
    opts = opts || {};
    var id = 's4-listbox-' + (++uid), items = [], active = -1, state = null, closing = false;
    var pop = document.createElement('div');
    pop.className = 's4-combobox-menu s4-glass';
    pop.setAttribute('popover', 'manual');
    var list = document.createElement('div');
    list.className = 's4-combobox-list'; list.id = id; list.setAttribute('role', 'listbox');
    if (opts.multi) list.setAttribute('aria-multiselectable', 'true');
    var label = field.querySelector(':scope > label');
    if (label) { if (!label.id) label.id = id + '-label'; list.setAttribute('aria-labelledby', label.id); }
    else if (input.getAttribute('aria-label')) list.setAttribute('aria-label', input.getAttribute('aria-label'));
    var note = document.createElement('div'); note.className = 's4-combobox-note'; note.hidden = true;
    pop.appendChild(list); pop.appendChild(note);
    (field.closest('dialog, [popover]') || document.body).appendChild(pop);
    var live = document.createElement('div'); live.className = 's4-visually-hidden'; live.setAttribute('role', 'status');
    field.appendChild(live);
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', opts.autocomplete || 'list');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-controls', id);
    /* a tap on the list must not take focus from the field (and never puts it there either) */
    pop.addEventListener('pointerdown', function (e) { if (!e.target.closest('button')) e.preventDefault(); });
    pop.addEventListener('mousedown', function (e) { e.preventDefault(); });
    pop.addEventListener('click', function (e) {
      var o = e.target.closest('[role="option"]'); if (!o || o.getAttribute('aria-disabled') === 'true') return;
      var i = +o.dataset.i; setActive(i, false);
      if (opts.onChoose) opts.onChoose(items[i], i);
    });
    var sayTimer = null;
    function say(text) { clearTimeout(sayTimer); sayTimer = setTimeout(function () { live.textContent = text; }, 350); }

    function isOpen() { return pop.matches(':popover-open') && !closing; }
    function place() {
      if (!pop.matches(':popover-open')) return;
      var b = boxRect(field), vv = window.visualViewport, m = 8, gap = 4;
      var vTop = vv ? vv.offsetTop : 0, vH = vv ? vv.height : document.documentElement.clientHeight;
      var vw = document.documentElement.clientWidth;
      var w = Math.min(Math.max(b.width, opts.minWidth || 0), vw - 2 * m);
      pop.style.width = w + 'px';
      pop.style.maxHeight = '';
      var natural = Math.min(pop.scrollHeight, opts.maxHeight || 336);
      var below = vTop + vH - b.bottom - gap - m, above = b.top - vTop - gap - m;
      var down = below >= Math.min(natural, 168) || below >= above;
      var room = Math.max(96, down ? below : above);
      var h = Math.min(natural, room);
      pop.style.maxHeight = h + 'px';
      var rtl = getComputedStyle(field).direction === 'rtl';
      var left = rtl ? b.right - w : b.left;
      left = Math.max(m, Math.min(left, vw - m - w));
      pop.style.left = left + 'px';
      pop.style.top = (down ? b.bottom + gap : b.top - gap - h) + 'px';
      pop.dataset.side = down ? 'below' : 'above';
      return down;
    }
    function open() {
      if (isOpen()) { place(); return; }
      closing = false;
      try { pop.showPopover(); } catch (e) { return; }
      place();
      /* on a phone with the keyboard up, neither side may have room: bring the field to the top of what is visible */
      var vv = window.visualViewport;
      if (vv && matchMedia('(pointer: coarse)').matches) {
        var b = boxRect(field), below = vv.offsetTop + vv.height - b.bottom, above = b.top - vv.offsetTop;
        if (below < 200 && above < 200 + 120) { field.style.scrollMarginTop = '16px'; field.scrollIntoView({ block: 'start', behavior: 'auto' }); place(); }
      }
      input.setAttribute('aria-expanded', 'true');
      if (openLists.indexOf(api) < 0) openLists.push(api);
      S4.transition.follow(pop, { from: pop.dataset.side === 'above' ? 'bottom' : 'top' });
      S4.util.emit(field, 's4-open', {});
    }
    function close() {
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
      active = -1;
      openLists = openLists.filter(function (x) { return x !== api; });
      if (!pop.matches(':popover-open') || closing) return;
      closing = true;
      S4.transition.follow(pop, { open: false }).then(function () {
        if (!closing) return;
        closing = false;
        try { pop.hidePopover(); } catch (e) {}
        S4.transition.restore && S4.transition.restore(pop);
      });
      S4.util.emit(field, 's4-close', {});
    }
    function setActive(i, scroll) {
      var opts2 = list.querySelectorAll('[role="option"]');
      opts2.forEach(function (o) { o.removeAttribute('data-active'); });
      active = i;
      var o = opts2[i];
      if (!o) { input.removeAttribute('aria-activedescendant'); return; }
      o.setAttribute('data-active', '');
      input.setAttribute('aria-activedescendant', o.id);
      if (scroll !== false) {
        var pr = pop.getBoundingClientRect(), r = o.getBoundingClientRect(), pad = 8;
        if (r.top < pr.top + pad) pop.scrollTop -= pr.top + pad - r.top;
        else if (r.bottom > pr.bottom - pad) pop.scrollTop += r.bottom - (pr.bottom - pad);
      }
    }
    function move(d) {
      var n = items.length; if (!n) return;
      var i = active, guard = 0;
      do { i = i < 0 ? (d > 0 ? 0 : n - 1) : (i + d + n) % n; guard++; } while (items[i].disabled && guard <= n);
      setActive(i);
    }
    function render(data, q, selected) {
      items = data.slice(); active = -1;
      input.removeAttribute('aria-activedescendant');
      list.innerHTML = '';
      var group = null, groupName = null;
      items.forEach(function (it, i) {
        var host = list;
        if (it.group) {
          if (it.group !== groupName) {
            groupName = it.group;
            group = document.createElement('div'); group.className = 's4-combobox-group'; group.setAttribute('role', 'group');
            var gl = document.createElement('div'); gl.className = 's4-menu-label'; gl.id = id + '-g' + i; gl.setAttribute('role', 'presentation'); gl.textContent = it.group;
            group.setAttribute('aria-labelledby', gl.id);
            group.appendChild(gl); list.appendChild(group);
          }
          host = group;
        } else { groupName = null; }
        var o = document.createElement('div');
        o.className = 's4-menu-item s4-combobox-option'; o.setAttribute('role', 'option'); o.id = id + '-o' + i; o.dataset.i = i;
        var sel = !!(selected && selected(it));
        o.setAttribute('aria-selected', String(sel));
        if (it.disabled) o.setAttribute('aria-disabled', 'true');
        if (it.create) o.setAttribute('data-create', '');
        o.innerHTML = (it.icon ? '<span class="s4-icon" aria-hidden="true"></span>' : '') +
          '<span class="s4-menu-item-text">' + (it.html || mark(it.label, q)) + (it.supporting ? '<span class="s4-menu-item-supporting">' + esc(it.supporting) + '</span>' : '') + '</span>' +
          '<span class="s4-icon s4-combobox-check" aria-hidden="true"></span>';
        if (it.icon) S4.icon.set(o.querySelector('.s4-icon'), it.icon);
        S4.icon.set(o.querySelector('.s4-combobox-check'), 'check');
        host.appendChild(o);
      });
      place();
    }
    function setState(kind, text, retry) {
      state = kind;
      note.innerHTML = '';
      note.hidden = !kind;
      note.removeAttribute('data-kind');
      if (!kind) return;
      note.setAttribute('data-kind', kind);
      if (kind === 'loading') {
        var p = document.createElement('div'); p.className = 's4-progress'; p.dataset.type = 'circular'; p.setAttribute('aria-hidden', 'true'); note.appendChild(p);
        if (S4.init) S4.init(note);
      }
      var t = document.createElement('span'); t.className = 's4-combobox-note-text'; t.textContent = text; note.appendChild(t);
      if (kind === 'error' && retry) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 's4-button'; b.dataset.variant = 'text'; b.dataset.size = 'xs'; b.textContent = 'Try Again';
        b.addEventListener('click', function () { retry(); });
        note.appendChild(b);
      }
      say(text);
      place();
    }
    var api = {
      field: field, input: input, pop: pop, list: list,
      open: open, close: close, isOpen: isOpen, place: place, render: render, state: setState, move: move, setActive: setActive, say: say,
      active: function () { return active; }, items: function () { return items; }, current: function () { return active >= 0 ? items[active] : null; },
      kind: function () { return state; }
    };
    return api;
  };
  /* keep open lists beside their field while the page scrolls or the keyboard moves; close on a tap elsewhere */
  var reflow = function () { openLists.forEach(function (l) { l.place(); }); };
  window.addEventListener('resize', reflow);
  window.addEventListener('scroll', reflow, true);
  if (window.visualViewport) { visualViewport.addEventListener('resize', reflow); visualViewport.addEventListener('scroll', reflow); }
  document.addEventListener('pointerdown', function (e) {
    openLists.slice().forEach(function (l) { if (!l.pop.contains(e.target) && !l.field.contains(e.target)) l.close(); });
  }, true);
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || !openLists.length) return;
    if (openLists.some(function (l) { return l.field.contains(document.activeElement); })) return;   /* the field handles its own */
    openLists.slice().forEach(function (l) { l.close(); });
  });

  /* ---------- the combobox ---------- */
  function parse(tpl) {
    var out = [];
    Array.prototype.forEach.call(tpl.content.children, function (el) {
      var add = function (o, group) { out.push({ value: o.value, label: (o.label || o.textContent).trim(), supporting: o.dataset.supporting || '', icon: o.dataset.icon || '', group: group || '', disabled: o.disabled }); };
      if (el.tagName === 'OPTGROUP') Array.prototype.forEach.call(el.children, function (o) { add(o, el.label); });
      else if (el.tagName === 'OPTION') add(el);
    });
    return out;
  }
  function filter(all, q) {
    q = norm(q).trim();
    if (!q) return all.slice();
    var starts = [], has = [];
    all.forEach(function (it) { var n = norm(it.label); if (n.indexOf(q) === 0) starts.push(it); else if (n.indexOf(q) > 0 || norm(it.supporting).indexOf(q) >= 0) has.push(it); });
    /* keep groups together, best matches first inside each */
    var res = starts.concat(has);
    if (all.some(function (x) { return x.group; })) {
      var order = []; all.forEach(function (x) { if (order.indexOf(x.group) < 0) order.push(x.group); });
      res.sort(function (a, b) { return order.indexOf(a.group) - order.indexOf(b.group); });
    }
    return res;
  }
  var sources = new WeakMap();
  function fire(input) { input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true })); }

  S4.combobox = {
    source: function (field, fn) { sources.set(field, fn); },
    set: function (field, value) { if (field._s4combo) field._s4combo.set(value); },
    filter: filter, mark: mark, norm: norm, parse: parse
  };

  S4.register('combobox', function (scope) {
    S4.util.all(scope, '.s4-combobox').forEach(function (f) {
      if (!S4.util.once(f, 'combobox')) return;
      var input = f.querySelector(':scope > input:not([type="hidden"])'); if (!input) return;
      var hidden = f.querySelector(':scope > input[type="hidden"]');
      var tpl = f.querySelector(':scope > template');
      var all = tpl ? parse(tpl) : [];
      var free = f.hasAttribute('data-free');
      var minChars = f.hasAttribute('data-min-chars') ? +f.dataset.minChars : 1;
      var inForm = !!f.closest('form.s4-form');
      var current = null, results = [], seq = 0, timer = null, ctrl = null;
      input.setAttribute('autocomplete', input.getAttribute('autocomplete') || 'off');
      input.setAttribute('spellcheck', 'false');
      if (hidden && hidden.value && !input.value) { var pre = all.find(function (x) { return x.value === hidden.value; }); if (pre) { input.value = pre.label; current = pre; } }
      else if (input.value) current = all.find(function (x) { return norm(x.label) === norm(input.value); }) || null;

      var lb = S4.listbox(f, input, { onChoose: function (it) { choose(it); } });
      /* one trailing button: Show Options while empty, Clear once there is text */
      var btn = document.createElement('button'); btn.type = 'button'; btn.className = 's4-icon-button s4-combobox-toggle';
      btn.innerHTML = '<span class="s4-icon" aria-hidden="true"></span>';
      input.after(btn);
      var labelText = (f.querySelector(':scope > label') || {}).textContent || input.getAttribute('aria-label') || '';
      function syncBtn() {
        var has = !!input.value;
        btn.disabled = input.disabled || input.readOnly;
        if (has) { btn.setAttribute('aria-label', 'Clear ' + labelText.trim()); btn.removeAttribute('aria-expanded'); btn.removeAttribute('aria-controls'); btn.dataset.mode = 'clear'; S4.icon.set(btn.firstChild, 'close'); }
        else { btn.setAttribute('aria-label', 'Show Options'); btn.setAttribute('aria-expanded', String(lb.isOpen())); btn.setAttribute('aria-controls', lb.list.id); btn.dataset.mode = 'show'; S4.icon.set(btn.firstChild, 'chevron-down'); }
        btn.tabIndex = has ? 0 : -1;   /* the chevron is for pointers; the keyboard opens the list with Down */
      }
      f.addEventListener('s4-open', function (e) { if (e.target === f && btn.dataset.mode === 'show') btn.setAttribute('aria-expanded', 'true'); });
      f.addEventListener('s4-close', function (e) { if (e.target === f && btn.dataset.mode === 'show') btn.setAttribute('aria-expanded', 'false'); });

      function matchText() { var q = norm(input.value).trim(); if (!q) return null; return all.concat(results).find(function (x) { return norm(x.label) === q; }) || null; }
      function validity() {
        if (free) { input.setCustomValidity(''); return; }
        var ok = !input.value.trim() || (current && norm(current.label) === norm(input.value)) || !!matchText();
        input.setCustomValidity(ok ? '' : (input.dataset.msgOption || f.dataset.msgOption || 'Choose one of the options in the list.'));
      }
      function isSel(it) { return !!current && it.value === current.value && it.label === current.label; }
      function show(res, q) {
        results = res;
        lb.render(res, q, isSel);
        if (!res.length) lb.state('empty', (f.dataset.emptyText || 'No matches for “{q}”.').replace('{q}', q));
        else { lb.state(null); lb.say(res.length === 1 ? '1 result' : res.length + ' results'); }
        lb.open();
      }
      function update(all2, then) {
        var q = all2 ? '' : input.value.trim();
        var src = sources.get(f);
        if (!src) { if (!q && !all2) { lb.close(); return; } show(filter(all, q), q); if (then) then(); return; }
        if (q.length < minChars) { if (all2 && minChars === 0) {} else { lb.close(); return; } }
        lb.render([], q); lb.state('loading', f.dataset.loadingText || 'Searching…'); lb.open();
        clearTimeout(timer);
        var my = ++seq;
        timer = setTimeout(function () {
          if (ctrl) try { ctrl.abort(); } catch (e) {}
          ctrl = window.AbortController ? new AbortController() : null;
          Promise.resolve().then(function () { return src(q, ctrl && ctrl.signal); }).then(function (res) {
            if (my !== seq || document.activeElement !== input && !lb.isOpen()) return;
            show((res || []).map(function (r) { return typeof r === 'string' ? { value: r, label: r } : Object.assign({ value: r.label, label: r.value }, r); }), q);
            if (then) then();
          }, function (err) {
            if (my !== seq || (err && err.name === 'AbortError')) return;
            results = []; lb.render([], q);
            lb.state('error', f.dataset.errorText || 'Couldn’t load results.', function () { update(all2); });
          });
        }, 220);
      }
      function choose(it) {
        if (!it || it.disabled) return;
        current = it;
        input.value = it.label;
        if (hidden) hidden.value = it.value;
        lb.close(); syncBtn(); validity();
        if (!inForm) f.removeAttribute('data-error');
        fire(input);
        S4.util.emit(f, 's4-change', { value: it.value, label: it.label, item: it });
      }
      function clear() {
        current = null; input.value = ''; if (hidden) hidden.value = '';
        lb.close(); syncBtn(); validity(); fire(input);
        S4.util.emit(f, 's4-change', { value: '', label: '', item: null });
      }
      f._s4combo = { set: function (v) { var it = all.concat(results).find(function (x) { return x.value === v || x.label === v; }); if (it) { current = it; input.value = it.label; if (hidden) hidden.value = it.value; } else if (free) { input.value = v; } syncBtn(); validity(); } };

      input.addEventListener('input', function (e) {
        if (!e.isTrusted && e.target === input && input.value === (current && current.label)) return;   /* our own echo */
        if (current && norm(current.label) !== norm(input.value)) { current = null; if (hidden) hidden.value = free ? input.value : ''; }
        if (free && hidden) hidden.value = current ? current.value : input.value;
        syncBtn(); validity(); update(false);
        if (!inForm && f.hasAttribute('data-error') && input.validity.valid) f.removeAttribute('data-error');
      });
      input.addEventListener('keydown', function (e) {
        var open = lb.isOpen();
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (lb.kind() === 'error') { update(!input.value); return; }
          if (!open) update(!input.value.trim(), function () { if (!e.altKey) lb.move(1); });
          else lb.move(1);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (e.altKey) { if (open && lb.current()) choose(lb.current()); else lb.close(); return; }
          if (!open) update(!input.value.trim(), function () { lb.move(-1); }); else lb.move(-1);
        } else if (e.key === 'Enter') {
          if (open && lb.current()) { e.preventDefault(); choose(lb.current()); }
          else if (open) { lb.close(); }
        } else if (e.key === 'Escape') {
          if (open) { e.preventDefault(); e.stopPropagation(); lb.close(); }
          else if (input.value) { e.preventDefault(); e.stopPropagation(); clear(); }
        } else if (e.key === 'Tab') { if (open) lb.close(); }
      });
      /* the person's own tap on the field opens the list of a fixed set of options */
      input.addEventListener('click', function () { if (!sources.get(f) && !lb.isOpen() && !input.readOnly && all.length) update(!input.value.trim() || !!current); });
      input.addEventListener('blur', function () {
        setTimeout(function () { if (document.activeElement !== input && !f.contains(document.activeElement) && !lb.pop.contains(document.activeElement)) lb.close(); }, 0);
        if (!free && !current) { var m = matchText(); if (m) { current = m; input.value = m.label; if (hidden) hidden.value = m.value; syncBtn(); } }
        validity();
        if (!inForm && input.value && !input.validity.valid) f.setAttribute('data-error', input.validationMessage);
      });
      var wasOpen = false;
      btn.addEventListener('pointerdown', function () { wasOpen = lb.isOpen(); });
      btn.addEventListener('click', function (e) {
        if (btn.dataset.mode === 'clear') { clear(); return; }
        var o = e.detail ? wasOpen : lb.isOpen(); wasOpen = false;
        if (o) lb.close(); else update(true);
      });
      syncBtn(); validity();
    });
  });
})();
