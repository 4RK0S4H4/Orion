/* Tag input / multi-select: chosen values are input chips inside the field, the cursor after them.
     <div class="s4-text-field s4-tag-input" data-name="labels" data-values="Taxes, Urgent" data-max="5" data-create>
       <label for="labels">Labels</label>
       <input id="labels">
       <template><option>Taxes</option><option>Urgent</option>…</template>      suggestions (optional)
       <div class="s4-text-field-supporting">Up to five.</div>
     </div>
   - Type to filter the suggestions (the glass list, S4.listbox); Enter or a tap adds one. With data-create, Enter or a
     comma adds what was typed ("Add “…”" is offered first in the list); without it only suggestions can be added.
   - Pasting "a, b; c" (commas, semicolons or new lines) adds each. Duplicates are ignored (case and accents too).
   - Backspace in the empty field removes the last chip; each chip's remove button removes it (Delete or Backspace on it
     too). Removing is announced. Every chip's remove button is in the Tab order, before the field.
   - data-max: a counter "2 / 5" in the supporting row; past it nothing is added and a short message says why.
   - Each value is a hidden input named data-name (FormData gives an array). required (or data-required) on the input
     means at least one; .s4-form shows the message on blur (data-msg-required).
   - Fires s4-change { values } on the field. S4.tagInput.values(field), S4.tagInput.set(field, [values]),
     S4.tagInput.source(field, fn(query, signal) -> Promise<[{ value, label, supporting }]>).
   No script ever moves the cursor into the field (decision 0049). */
(function () {
  var S4 = window.S4;
  var sources = new WeakMap();
  S4.tagInput = {
    source: function (field, fn) { sources.set(field, fn); field.setAttribute('data-s4-async', ''); },
    values: function (field) { return field._s4tags ? field._s4tags.values() : []; },
    set: function (field, list) { if (field._s4tags) field._s4tags.set(list); }
  };

  S4.register('tag-input', function (scope) {
    S4.util.all(scope, '.s4-tag-input').forEach(function (f) {
      if (!S4.util.once(f, 'tagInput')) return;
      var input = f.querySelector(':scope > input:not([type="hidden"])'); if (!input) return;
      var norm = S4.combobox ? S4.combobox.norm : function (s) { return String(s).toLowerCase(); };
      var tpl = f.querySelector(':scope > template');
      var all = tpl && S4.combobox ? S4.combobox.parse(tpl) : [];
      var create = f.hasAttribute('data-create') || !all.length && !sources.get(f);
      var max = +f.dataset.max || 0;
      var name = f.dataset.name || input.name || '';
      input.removeAttribute('name');
      var required = input.required || f.hasAttribute('data-required');
      input.required = false;
      var labelEl = f.querySelector(':scope > label');
      var labelText = (labelEl ? labelEl.textContent : input.getAttribute('aria-label') || '').trim();
      var noun = (f.dataset.noun || labelText || 'items').toLowerCase();
      var inForm = !!f.closest('form.s4-form');
      input.setAttribute('autocomplete', 'off');

      /* the row that holds the chips and the input, in the field's box */
      var row = document.createElement('div'); row.className = 's4-tag-input-row';
      var chips = document.createElement('div'); chips.className = 's4-tag-input-chips'; chips.setAttribute('role', 'list');
      chips.setAttribute('aria-label', labelText ? 'Chosen ' + noun : 'Chosen');
      input.before(row); row.appendChild(chips); row.appendChild(input);
      /* counter */
      var counter = null;
      if (max) { counter = document.createElement('span'); counter.className = 's4-text-field-counter'; counter.setAttribute('aria-hidden', 'true'); f.appendChild(counter); }
      var lb = S4.listbox ? S4.listbox(f, input, { multi: true, onChoose: function (it) { if (it.create) add(it.value, true); else add(it.label, false, it.value); after(); } }) : null;

      function chipEls() { return Array.prototype.slice.call(chips.querySelectorAll(':scope > .s4-chip:not([data-leaving])')); }
      function values() { return chipEls().map(function (c) { return c.dataset.value; }); }
      function has(v) { var n = norm(v).trim(); return chipEls().some(function (c) { return norm(c.dataset.label).trim() === n || norm(c.dataset.value).trim() === n; }); }
      function sync(fireEvents) {
        var n = chipEls().length;
        if (counter) counter.textContent = n + ' / ' + max;
        f.toggleAttribute('data-full', !!max && n >= max);
        f.toggleAttribute('data-filled', n > 0);
        input.setCustomValidity(required && !n ? (input.dataset.msgRequired || f.dataset.msgRequired || 'Add at least one.') : '');
        if (!inForm && f.hasAttribute('data-error') && input.validity.valid) f.removeAttribute('data-error');
        if (inForm && n && f.hasAttribute('data-error')) { f.removeAttribute('data-error'); f.setAttribute('data-valid', ''); }
        if (fireEvents) {
          f._s4quiet = true;
          input.dispatchEvent(new Event('change', { bubbles: true }));
          f._s4quiet = false;
          S4.util.emit(f, 's4-change', { values: values() });
        }
      }
      function chip(label, value) {
        var c = document.createElement('span'); c.className = 's4-chip'; c.dataset.type = 'input'; c.setAttribute('role', 'listitem');
        c.dataset.value = value; c.dataset.label = label;
        var t = document.createElement('span'); t.className = 's4-tag-input-label'; t.textContent = label; c.appendChild(t);
        var b = document.createElement('button'); b.type = 'button'; b.className = 's4-chip-remove'; b.setAttribute('aria-label', 'Remove ' + label);
        var i = document.createElement('span'); i.className = 's4-icon'; b.appendChild(i); S4.icon.set(i, 'close'); c.appendChild(b);
        if (name) { var h = document.createElement('input'); h.type = 'hidden'; h.name = name; h.value = value; c.appendChild(h); }
        b.disabled = input.disabled;
        b.addEventListener('click', function (e) { e.stopPropagation(); remove(c, true); });
        b.addEventListener('keydown', function (e) { if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); remove(c, true); } });
        return c;
      }
      function add(text, typed, value) {
        var label = String(text).trim().replace(/\s+/g, ' ');
        if (!label) return false;
        if (has(label)) { lb && lb.say(label + ' is already added.'); return false; }
        if (max && chipEls().length >= max) { lb && lb.say('You can add up to ' + max + ' ' + noun + '.'); f.setAttribute('data-max-hit', ''); setTimeout(function () { f.removeAttribute('data-max-hit'); }, 1600); return false; }
        if (!value) {
          var hit = all.find(function (x) { return norm(x.label) === norm(label); });
          if (hit) { label = hit.label; value = hit.value; }
          else if (!create) { lb && lb.say('Choose ' + noun + ' from the list.'); return false; }
          else value = label;
        }
        chips.appendChild(chip(label, value));
        lb && lb.say('Added ' + label + '.');
        return true;
      }
      function remove(c, fromButton) {
        if (input.disabled) return;
        var ev = new CustomEvent('s4-remove', { bubbles: true, cancelable: true, detail: { chip: c, value: c.dataset.value } });
        if (!c.dispatchEvent(ev)) return;
        var list = chipEls(), i = list.indexOf(c), next = list[i + 1] || list[i - 1];
        c.setAttribute('data-leaving', '');
        var h = c.querySelector('input[type="hidden"]'); if (h) h.remove();
        var label = c.dataset.label;
        sync(true);
        if (lb) lb.say('Removed ' + label + '.');
        var gap = parseFloat(getComputedStyle(chips).columnGap) || 0;
        var done = function () { c.remove(); };
        if (fromButton && document.activeElement === c.querySelector('.s4-chip-remove') && next) next.querySelector('.s4-chip-remove').focus();
        S4.transition.reveal(c, { open: false, axis: 'x', gap: gap }).then(done, done);
        if (lb && lb.isOpen()) refresh();
      }
      function after() { input.value = ''; sync(true); if (lb && lb.isOpen()) refresh(); }

      /* suggestions */
      var timer = null, seq = 0;
      function suggestions(q) {
        var res = (S4.combobox ? S4.combobox.filter(all, q) : all).filter(function (x) { return !has(x.label); });
        return res;
      }
      function show(res, q) {
        var t = q.trim();
        if (t && create && !has(t) && !res.some(function (x) { return norm(x.label) === norm(t); })) res = [{ value: t, label: t, create: true, html: 'Add “<b>' + t.replace(/[&<>"]/g, '') + '</b>”', icon: 'add' }].concat(res);
        lb.render(res, t);
        if (!res.length) lb.state('empty', t ? (f.dataset.emptyText || 'No matches for “{q}”.').replace('{q}', t) : (f.dataset.doneText || 'Nothing more to add.'));
        else lb.state(null);
        lb.open();
      }
      function refresh(showAll) {
        if (!lb) return;
        var q = showAll ? '' : input.value;
        var src = sources.get(f);
        if (!src) { if (!q.trim() && !showAll) { lb.close(); return; } show(suggestions(q), q); return; }
        if (!q.trim()) { lb.close(); return; }
        lb.render([], q); lb.state('loading', f.dataset.loadingText || 'Searching…'); lb.open();
        clearTimeout(timer); var my = ++seq;
        timer = setTimeout(function () {
          Promise.resolve().then(function () { return src(q.trim()); }).then(function (res) {
            if (my !== seq) return;
            res = (res || []).map(function (r) { return typeof r === 'string' ? { value: r, label: r } : r; }).filter(function (x) { return !has(x.label); });
            res.forEach(function (x) { if (!all.some(function (a) { return a.value === x.value; })) all.push(x); });
            show(res, q);
          }, function () { if (my === seq) { lb.render([], q); lb.state('error', f.dataset.errorText || 'Couldn’t load suggestions.', function () { refresh(); }); } });
        }, 220);
      }
      function commitTyped() {
        var t = input.value.trim(); if (!t) return false;
        if (add(t, true)) { after(); return true; }
        return false;
      }

      input.addEventListener('input', function () { if (f._s4quiet) return; if (/[,;\n]/.test(input.value)) { var parts = input.value.split(/[,;\n]+/); var last = parts.pop(); parts.forEach(function (p) { add(p, true); }); input.value = last; sync(true); } refresh(); });
      input.addEventListener('paste', function (e) {
        var text = (e.clipboardData || window.clipboardData).getData('text');
        if (!/[,;\n\t]/.test(text)) return;
        e.preventDefault();
        var n = 0; text.split(/[,;\n\t]+/).forEach(function (p) { if (add(p, true)) n++; });
        if (lb) lb.say(n === 1 ? 'Added 1.' : 'Added ' + n + '.');
        after();
      });
      input.addEventListener('keydown', function (e) {
        var open = lb && lb.isOpen();
        if (e.key === 'ArrowDown' && lb) { e.preventDefault(); if (!open) refresh(true); lb.move(1); }
        else if (e.key === 'ArrowUp' && lb) { e.preventDefault(); if (!open) refresh(true); lb.move(-1); }
        else if (e.key === 'Enter') {
          if (open && lb.current()) { e.preventDefault(); var it = lb.current(); if (it.create) add(it.value, true); else add(it.label, false, it.value); after(); }
          else if (input.value.trim()) { e.preventDefault(); commitTyped(); }
        } else if (e.key === ',' || e.key === ';') { if (input.value.trim()) { e.preventDefault(); commitTyped(); } }
        else if (e.key === 'Backspace' && !input.value && input.selectionStart === 0) {
          var list = chipEls(); if (list.length) { e.preventDefault(); remove(list[list.length - 1], false); }
        } else if (e.key === 'Escape') { if (open) { e.preventDefault(); e.stopPropagation(); lb.close(); } }
        else if (e.key === 'Tab') { if (open) lb.close(); }
      });
      input.addEventListener('blur', function () {
        setTimeout(function () { if (lb && document.activeElement !== input) lb.close(); }, 0);
        if (input.value.trim() && create) commitTyped();
        if (!inForm && required && !chipEls().length && input.dataset.s4Touched) f.setAttribute('data-error', input.validationMessage);
      });
      input.addEventListener('focus', function () { input.dataset.s4Touched = '1'; });
      input.addEventListener('click', function () { if (lb && !lb.isOpen() && all.length && !sources.get(f)) refresh(true); });

      /* start values */
      var start = (f.dataset.values || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      start.forEach(function (v) { var hit = all.find(function (x) { return x.value === v || norm(x.label) === norm(v); }); chips.appendChild(chip(hit ? hit.label : v, hit ? hit.value : v)); });
      f._s4tags = {
        values: values,
        set: function (list) { chipEls().forEach(function (c) { c.remove(); }); (list || []).forEach(function (v) { add(v, true); }); sync(false); }
      };
      new MutationObserver(function () { chips.querySelectorAll('.s4-chip-remove').forEach(function (b) { b.disabled = input.disabled; }); }).observe(input, { attributes: true, attributeFilter: ['disabled'] });
      sync(false);
    });
  });
})();
