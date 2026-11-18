/* Number field with steppers (WAI-ARIA spinbutton).
     <div class="s4-text-field s4-number-field">
       <label for="guests">Guests</label>
       <input id="guests" value="2" data-min="1" data-max="12" data-step="1">
       <span class="s4-text-field-affix" data-suffix>people</span>
       <div class="s4-text-field-supporting">Up to twelve.</div>
     </div>
   number-field.js adds the minus and plus buttons around the value (one box, one label), sets role="spinbutton",
   inputmode and aria-value*, and:
   - minus / plus step once on a tap and repeat while held (faster after a moment); they stop at min and max and are
     out of the Tab order (the field takes the keys)
   - keys: Up / Down step, Page Up / Page Down step by data-page-step (10 steps by default), Home / End go to min / max
   - typing is free; on blur or Enter the text is read in the page's language ("1.234,5" or "1,234.5"), and shown back
     with tabular figures and the step's decimals. Out of range or not a number is an error (data-msg-min, data-msg-max,
     data-msg-number), shown on blur by .s4-form or by the field itself.
   - data-inline on the field: the compact quantity stepper for a row in a list or cart (no label above: aria-label).
   Fires input and change on the input and s4-change { value } on the field (value is a number or null).
   S4.numberField.value(field), S4.numberField.set(field, n). */
(function () {
  var S4 = window.S4;
  function decimals(n) { var s = String(n); return s.indexOf('.') < 0 ? 0 : s.length - s.indexOf('.') - 1; }
  S4.numberField = {
    value: function (f) { return f._s4num ? f._s4num.get() : null; },
    set: function (f, n) { if (f._s4num) f._s4num.set(n, true); }
  };
  S4.register('number-field', function (scope) {
    S4.util.all(scope, '.s4-number-field').forEach(function (f) {
      if (!S4.util.once(f, 'numberField')) return;
      var input = f.querySelector(':scope > input'); if (!input) return;
      var lang = input.closest('[lang]') ? input.closest('[lang]').getAttribute('lang') : undefined;
      var num = function (k) { var v = input.getAttribute('data-' + k) || input.getAttribute(k); return v === null || v === '' ? null : parseFloat(v); };
      var min = num('min'), max = num('max'), step = num('step') || 1, page = num('page-step') || step * 10;
      var places = Math.max(decimals(step), input.hasAttribute('data-decimals') ? +input.dataset.decimals : 0);
      var fmt = new Intl.NumberFormat(lang, { minimumFractionDigits: places, maximumFractionDigits: Math.max(places, 6), useGrouping: !input.hasAttribute('data-no-grouping') });
      var parts = new Intl.NumberFormat(lang).formatToParts(12345.6);
      var group = (parts.find(function (p) { return p.type === 'group'; }) || {}).value || ',';
      var dec = (parts.find(function (p) { return p.type === 'decimal'; }) || {}).value || '.';
      input.type = 'text';
      input.removeAttribute('min'); input.removeAttribute('max'); input.removeAttribute('step');
      input.setAttribute('inputmode', places || (min !== null && min < 0) || min === null ? 'decimal' : 'numeric');
      if (min !== null && min < 0 || min === null) input.setAttribute('inputmode', 'text');
      input.setAttribute('role', 'spinbutton');
      input.setAttribute('autocomplete', 'off');
      if (min !== null) input.setAttribute('aria-valuemin', min);
      if (max !== null) input.setAttribute('aria-valuemax', max);
      var suffix = f.querySelector(':scope > .s4-text-field-affix[data-suffix]'), prefix = f.querySelector(':scope > .s4-text-field-affix[data-prefix]');
      var labelText = ((f.querySelector(':scope > label') || {}).textContent || input.getAttribute('aria-label') || '').trim();
      var inForm = !!f.closest('form.s4-form');

      function parse(text) {
        var t = String(text).trim().replace(/\s| | /g, '');
        if (!t) return null;
        t = t.split(group).join('');
        if (dec !== '.') t = t.replace(dec, '.');
        t = t.replace(/^−/, '-');
        if (!/^-?(\d+\.?\d*|\.\d+)$/.test(t)) return NaN;
        return parseFloat(t);
      }
      function clamp(n) { if (min !== null && n < min) n = min; if (max !== null && n > max) n = max; return n; }
      function round(n) { var base = min !== null ? min : 0; var k = Math.round((n - base) / step); return +(base + k * step).toFixed(places + 2); }
      var value = parse(input.value);
      if (value !== null && !isNaN(value)) input.value = fmt.format(value);

      /* the buttons: minus before the value, plus after it */
      var mk = function (icon, label) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 's4-icon-button s4-number-field-step'; b.tabIndex = -1;
        if (f.hasAttribute('data-inline')) b.dataset.size = 'xs';
        b.setAttribute('aria-label', label + (labelText ? ' ' + labelText : ''));
        var i = document.createElement('span'); i.className = 's4-icon'; b.appendChild(i); S4.icon.set(i, icon);
        return b;
      };
      var minus = mk('minus', 'Decrease'), plus = mk('plus', 'Increase');
      minus.dataset.dir = '-1'; plus.dataset.dir = '1';
      (prefix || input).before(minus);
      if (prefix) prefix.before(minus);
      (suffix || input).after(plus);
      var live = document.createElement('div'); live.className = 's4-visually-hidden'; live.setAttribute('role', 'status'); f.appendChild(live);
      var sayT = null;
      var say = function () { clearTimeout(sayT); sayT = setTimeout(function () { live.textContent = input.getAttribute('aria-valuetext') || input.value; }, 500); };

      function message(n) {
        if (n === null) return '';
        if (isNaN(n)) return input.dataset.msgNumber || 'Enter a number.';
        var range = min !== null && max !== null ? 'Enter ' + fmt.format(min) + ' to ' + fmt.format(max) + '.' : '';
        if (min !== null && n < min) return input.dataset.msgMin || range || 'Enter ' + fmt.format(min) + ' or more.';
        if (max !== null && n > max) return input.dataset.msgMax || range || 'Enter ' + fmt.format(max) + ' or less.';
        return '';
      }
      function sync() {
        var n = parse(input.value);
        input.setCustomValidity(message(n));
        if (n === null || isNaN(n)) { input.removeAttribute('aria-valuenow'); input.removeAttribute('aria-valuetext'); }
        else {
          input.setAttribute('aria-valuenow', n);
          var words = (prefix ? prefix.textContent.trim() : '') + fmt.format(n) + (suffix ? ' ' + suffix.textContent.trim() : '');
          input.setAttribute('aria-valuetext', words);
        }
        var cur = n === null || isNaN(n) ? null : n;
        minus.disabled = input.disabled || input.readOnly || (min !== null && cur !== null && cur <= min);
        plus.disabled = input.disabled || input.readOnly || (max !== null && cur !== null && cur >= max);
        if (!inForm && f.hasAttribute('data-error') && input.validity.valid) f.removeAttribute('data-error');
      }
      function set(n, events) {
        n = n === null ? null : clamp(round(n));
        var before = input.value;
        input.value = n === null ? '' : fmt.format(n);
        value = n;
        sync();
        if (events && input.value !== before) {
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          S4.util.emit(f, 's4-change', { value: n });
        }
      }
      function by(d) {
        if (input.disabled || input.readOnly) return;
        var n = parse(input.value);
        if (n === null || isNaN(n)) n = d > 0 ? (min !== null ? min - step : -step) : (max !== null ? max + step : step);
        n = (min !== null || max !== null) ? n : n;
        set(n + d, true);
        if (document.activeElement !== input) say();
      }
      f._s4num = { get: function () { var n = parse(input.value); return n === null || isNaN(n) ? null : n; }, set: set };

      /* hold to repeat: once at once, then after a pause again and again, a little faster as it goes */
      [minus, plus].forEach(function (b) {
        var t = null, n = 0, fired = false;
        var stop = function () { clearTimeout(t); t = null; };
        var tick = function () { n++; by(+b.dataset.dir); if (b.disabled) return stop(); t = setTimeout(tick, n < 6 ? 140 : n < 20 ? 80 : 40); };
        b.addEventListener('pointerdown', function (e) {
          if (e.button !== 0 || b.disabled) return;
          e.preventDefault();   /* never moves focus (or the phone's keyboard) */
          try { b.setPointerCapture(e.pointerId); } catch (x) {}
          fired = true; n = 0; by(+b.dataset.dir);
          t = setTimeout(tick, 450);
        });
        ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (ev) { b.addEventListener(ev, stop); });
        b.addEventListener('click', function () { if (fired) { fired = false; return; } by(+b.dataset.dir); });   /* a click with no pointer (assistive tech) */
      });

      input.addEventListener('keydown', function (e) {
        var k = e.key;
        if (k === 'ArrowUp' || k === 'ArrowDown') { e.preventDefault(); by(k === 'ArrowUp' ? step : -step); }
        else if (k === 'PageUp' || k === 'PageDown') { e.preventDefault(); by(k === 'PageUp' ? page : -page); }
        else if (k === 'Home' && min !== null) { e.preventDefault(); set(min, true); }
        else if (k === 'End' && max !== null) { e.preventDefault(); set(max, true); }
        else if (k === 'Enter') { var n = parse(input.value); if (n !== null && !isNaN(n) && !message(n)) set(n, true); }
      });
      /* by() moves by whole steps; the keys above pass the amount */
      by = (function (inner) { return function (d) { if (Math.abs(d) === 1 && (step !== 1)) d = d * step; return inner(d); }; })(by);
      input.addEventListener('input', function (e) { if (e.isTrusted) sync(); });
      input.addEventListener('blur', function () {
        var n = parse(input.value);
        if (n !== null && !isNaN(n) && !message(n)) { var r = round(n); if (r !== n || input.value !== fmt.format(r)) set(r, true); }
        sync();
        if (!inForm && !input.validity.valid) f.setAttribute('data-error', input.validationMessage);
      });
      new MutationObserver(sync).observe(input, { attributes: true, attributeFilter: ['disabled', 'readonly'] });
      sync();
    });
  });
})();
