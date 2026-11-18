/* Time field: type a time any way ("9", "930", "9:30 pm", "21.30") or pick one from a short list in the glass menu.
     <div class="s4-text-field s4-time-field" data-step="30" data-min="08:00" data-max="18:00">
       <label for="start">Start</label>
       <input id="start" value="09:30">
       <input type="hidden" name="start">                    optional: receives "HH:MM" (24 hours)
       <div class="s4-text-field-supporting">Office hours.</div>
     </div>
   - Shown in the page's language: "9:30 AM" or "09:30" (data-hour-cycle="12" or "24" to choose). Stored as "HH:MM".
   - The list (S4.listbox, the combobox's glass list) offers every data-step minutes (default 30) between data-min and
     data-max; typing narrows it ("93" -> 9:30 AM, 9:30 PM) and a typed time that is not on the list is offered first.
   - data-range-start="id" on an end field: its list starts at the start time and says how long each choice is
     ("11:00 AM, 1 h 30 min"); an end before the start is an error.
   - Not a time, or outside min and max, is an error on blur (data-msg-time, data-msg-range), shown by .s4-form or by the
     field itself. Fires input and change on the input and s4-change { value, minutes } on the field.
   No clock dial: typing and a short list are faster on every device. No script moves the cursor into it (0049). */
(function () {
  var S4 = window.S4;
  function hm(v) { var m = /^(\d{1,2}):(\d{2})/.exec(v || ''); return m ? +m[1] * 60 + +m[2] : null; }
  function iso(min) { return String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0'); }
  function parse(t) {
    t = String(t || '').trim().toLowerCase().replace(/\s+/g, '');
    if (!t) return null;
    var ap = null, m = /([ap])\.?m?\.?$/.exec(t);
    if (m) { ap = m[1]; t = t.slice(0, m.index); }
    t = t.replace(/[.h]/g, ':');
    var h, mi;
    if (t.indexOf(':') >= 0) { var p = t.split(':'); h = p[0]; mi = p[1] || '0'; }
    else if (/^\d{1,2}$/.test(t)) { h = t; mi = '0'; }
    else if (/^\d{3,4}$/.test(t)) { h = t.slice(0, t.length - 2); mi = t.slice(-2); }
    else return NaN;
    if (!/^\d{1,2}$/.test(h) || !/^\d{1,2}$/.test(mi)) return NaN;
    h = +h; mi = +mi;
    if (mi > 59) return NaN;
    if (ap) { if (h < 1 || h > 12) return NaN; h = h % 12 + (ap === 'p' ? 12 : 0); }
    else if (h > 23) return NaN;
    return h * 60 + mi;
  }
  function span(d) { var h = Math.floor(d / 60), m = d % 60; return (h ? h + ' h' : '') + (h && m ? ' ' : '') + (m || !h ? m + ' min' : ''); }
  S4.timeField = {
    parse: parse,
    value: function (f) { return f._s4time ? f._s4time.get() : null; },
    set: function (f, v) { if (f._s4time) f._s4time.set(typeof v === 'number' ? v : hm(v), true); }
  };

  S4.register('time-field', function (scope) {
    S4.util.all(scope, '.s4-time-field').forEach(function (f) {
      if (!S4.util.once(f, 'timeField')) return;
      var input = f.querySelector(':scope > input:not([type="hidden"])'); if (!input) return;
      var hidden = f.querySelector(':scope > input[type="hidden"]');
      var lang = (f.closest('[lang]') || document.documentElement).getAttribute('lang') || undefined;
      var cycle = f.dataset.hourCycle;
      var h12 = cycle ? cycle === '12' : /h1[12]/.test(new Intl.DateTimeFormat(lang, { hour: 'numeric' }).resolvedOptions().hourCycle || '');
      var fmt = new Intl.DateTimeFormat(lang, { hour: 'numeric', minute: '2-digit', hour12: h12 });
      var show = function (min) { return fmt.format(new Date(2000, 0, 1, Math.floor(min / 60), min % 60)); };
      var step = Math.max(5, +f.dataset.step || 30);
      var min = hm(f.dataset.min), max = hm(f.dataset.max);
      var startField = f.dataset.rangeStart ? document.getElementById(f.dataset.rangeStart) : null;
      if (startField && !startField.matches('.s4-time-field')) startField = startField.closest('.s4-time-field');
      var inForm = !!f.closest('form.s4-form');
      input.type = 'text';
      input.setAttribute('autocomplete', 'off');
      input.setAttribute('inputmode', 'text');
      input.setAttribute('spellcheck', 'false');
      var value = parse(input.value);
      if (typeof value !== 'number' || isNaN(value)) value = hm(input.value);
      if (value != null) { input.value = show(value); if (hidden) hidden.value = iso(value); }

      var lb = S4.listbox(f, input, { autocomplete: 'list', minWidth: 200, onChoose: function (it) { set(it.minutes, true); lb.close(); } });
      var btn = document.createElement('button'); btn.type = 'button'; btn.className = 's4-icon-button s4-time-field-toggle'; btn.tabIndex = -1;
      btn.setAttribute('aria-label', 'Show Times'); btn.setAttribute('aria-controls', lb.list.id); btn.setAttribute('aria-expanded', 'false');
      btn.innerHTML = '<span class="s4-icon" aria-hidden="true"></span>'; S4.icon.set(btn.firstChild, 'schedule');
      input.after(btn);
      f.addEventListener('s4-open', function (e) { if (e.target === f) btn.setAttribute('aria-expanded', 'true'); });
      f.addEventListener('s4-close', function (e) { if (e.target === f) btn.setAttribute('aria-expanded', 'false'); });

      function start() { return startField && startField._s4time ? startField._s4time.get() : null; }
      function bounds() { var lo = min != null ? min : 0, hi = max != null ? max : 24 * 60 - 1, s = start(); if (s != null) lo = Math.max(lo, s + step); return [lo, hi]; }
      function message(v) {
        if (v === null) return '';
        if (isNaN(v)) return input.dataset.msgTime || 'Enter a time like ' + show(9 * 60 + 30) + '.';
        var s = start();
        if (s != null && v <= s) return input.dataset.msgRange || 'End after the start, ' + show(s) + '.';
        if ((min != null && v < min) || (max != null && v > max)) return input.dataset.msgRange || 'Choose a time from ' + show(min != null ? min : 0) + ' to ' + show(max != null ? max : 1439) + '.';
        return '';
      }
      function sync() {
        var v = parse(input.value);
        input.setCustomValidity(message(v));
        if (!inForm && f.hasAttribute('data-error') && input.validity.valid) f.removeAttribute('data-error');
      }
      function set(v, events) {
        var before = input.value;
        value = v;
        input.value = v == null ? '' : show(v);
        if (hidden) hidden.value = v == null ? '' : iso(v);
        sync();
        if (events && (input.value !== before || events === 'force')) {
          f._s4quiet = true;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          f._s4quiet = false;
          S4.util.emit(f, 's4-change', { value: v == null ? '' : iso(v), minutes: v });
        }
      }
      f._s4time = { get: function () { var v = parse(input.value); return typeof v === 'number' && !isNaN(v) ? v : null; }, set: set };

      function options(q) {
        var b = bounds(), s = start(), out = [];
        for (var t = Math.ceil(b[0] / step) * step; t <= b[1]; t += step) out.push(t);
        var digits = String(q || '').toLowerCase().replace(/[^0-9apm]/g, '');
        var typed = parse(q);
        if (digits) {
          out = out.filter(function (t) { var l = show(t).toLowerCase().replace(/[^0-9apm]/g, ''); var l24 = iso(t).replace(':', ''); return l.indexOf(digits) === 0 || l24.indexOf(digits) === 0 || l24.replace(/^0/, '').indexOf(digits) === 0; });
          if (typeof typed === 'number' && !isNaN(typed) && out.indexOf(typed) < 0 && !message(typed)) out.unshift(typed);
        }
        return out.map(function (t) { return { value: iso(t), label: show(t), minutes: t, supporting: s != null ? span(t - s) : '' }; });
      }
      function open(all) {
        var res = options(all ? '' : input.value);
        lb.render(res, '', function (it) { return it.minutes === f._s4time.get(); });
        if (!res.length) lb.state('empty', 'No times match. Type a time like ' + show(9 * 60 + 30) + '.'); else lb.state(null);
        lb.open();
        /* start at the chosen time (or the nearest), not at midnight */
        var cur = f._s4time.get(), idx = -1;
        if (cur != null) { var best = Infinity; res.forEach(function (it, i) { var d = Math.abs(it.minutes - cur); if (d < best) { best = d; idx = i; } }); }
        if (all && idx >= 0) { var o = lb.list.querySelectorAll('[role="option"]')[idx]; if (o) lb.pop.scrollTop = o.offsetTop - lb.pop.clientHeight / 2 + o.offsetHeight / 2; }
        return idx;
      }
      input.addEventListener('input', function () { if (f._s4quiet) return; sync(); if (input.value.trim()) open(false); else lb.close(); });
      input.addEventListener('keydown', function (e) {
        var isOpen = lb.isOpen();
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          if (!isOpen) { var i = open(!input.value.trim() || f._s4time.get() != null); if (i >= 0) lb.setActive(i); else lb.move(e.key === 'ArrowDown' ? 1 : -1); }
          else lb.move(e.key === 'ArrowDown' ? 1 : -1);
        } else if (e.key === 'Enter') {
          if (isOpen && lb.current()) { e.preventDefault(); set(lb.current().minutes, true); lb.close(); }
          else { var v = parse(input.value); if (typeof v === 'number' && !isNaN(v) && !message(v)) { e.preventDefault(); set(v, 'force'); lb.close(); } }
        } else if (e.key === 'Escape') { if (isOpen) { e.preventDefault(); e.stopPropagation(); lb.close(); } }
        else if (e.key === 'Tab') { if (isOpen) lb.close(); }
      });
      input.addEventListener('click', function () { if (!lb.isOpen() && !input.readOnly) open(true); });
      input.addEventListener('blur', function () {
        setTimeout(function () { if (document.activeElement !== input) lb.close(); }, 0);
        var v = parse(input.value);
        if (typeof v === 'number' && !isNaN(v) && !message(v)) set(v, true);
        sync();
        if (!inForm && input.value && !input.validity.valid) f.setAttribute('data-error', input.validationMessage);
      });
      var wasOpen = false;
      btn.addEventListener('pointerdown', function () { wasOpen = lb.isOpen(); });
      btn.addEventListener('click', function (e) { var o = e.detail ? wasOpen : lb.isOpen(); if (o) lb.close(); else open(true); });
      if (startField) startField.addEventListener('s4-change', function () { sync(); if (inForm || f.hasAttribute('data-error')) { if (input.value && !input.validity.valid) f.setAttribute('data-error', input.validationMessage); else f.removeAttribute('data-error'); } });
      new MutationObserver(function () { btn.disabled = input.disabled || input.readOnly; }).observe(input, { attributes: true, attributeFilter: ['disabled', 'readonly'] });
      btn.disabled = input.disabled || input.readOnly;
      sync();
    });
  });
})();
