/* Slider behaviour: draws the handle, value label and stops for .s4-slider > input[type=range], keeps --_value (0..1)
   and --_steps in sync, and fires s4-change { value } on the slider for every change (the native input and change
   events still fire as usual). data-prefix / data-suffix format the value label and aria-valuetext.
   data-value="heading": the label and the value (or a paired number field) on one row above the track. */
S4.register('slider', function (scope) {
  S4.util.all(scope, '.s4-slider').forEach(function (s) {
    if (!S4.util.once(s, 'slider')) return;
    var input = s.querySelector(':scope > input[type="range"]');
    if (!input) return;
    var mk = function (cls, parent) { var e = document.createElement('span'); e.className = cls; e.setAttribute('aria-hidden', 'true'); (parent || s).appendChild(e); return e; };
    var stops = mk('s4-slider-stops');
    var handle = mk('s4-slider-handle');
    var label = mk('s4-slider-label', handle);
    s.insertBefore(stops, input); s.insertBefore(handle, input);   /* the input stays last, on top */
    /* data-value="heading" (decision 0063): the label and the value on one row above the track, and an optional paired
       number field for an exact value; both stay in step with the range */
    var out = null, exact = null;
    if (s.dataset.value === 'heading') {
      var head = s.querySelector(':scope > .s4-slider-head');
      if (!head) { head = document.createElement('div'); head.className = 's4-slider-head'; s.insertBefore(head, s.firstChild); }
      var lab = s.querySelector(':scope > label'); if (lab) head.appendChild(lab);
      if (!lab && !head.querySelector('label') && input.getAttribute('aria-label')) { var t = document.createElement('label'); t.textContent = input.getAttribute('aria-label'); if (input.id) t.htmlFor = input.id; head.appendChild(t); }
      var EXACT = 'input[type="number"], input[inputmode="numeric"], input[inputmode="decimal"]';
      exact = s.querySelector(EXACT.split(', ').map(function (x) { return ':scope > ' + x + ', :scope > .s4-slider-head > ' + x; }).join(', '));
      out = s.querySelector(':scope > output, :scope > .s4-slider-head > output');
      if (!out && !exact) { out = document.createElement('output'); if (input.id) out.htmlFor = input.id; }
      if (out) head.appendChild(out);
      if (exact) {
        head.appendChild(exact);
        ['min', 'max', 'step'].forEach(function (a) { if (!exact.hasAttribute(a) && input.hasAttribute(a)) exact.setAttribute(a, input.getAttribute(a)); });
        if (!exact.getAttribute('aria-label') && !exact.labels.length) exact.setAttribute('aria-label', ((head.querySelector('label') || {}).textContent || 'Value').trim() + ', Exact');
        /* a text field with inputmode shows the number grouped ("2,400,000") while it is not being typed in */
        var grouped = exact.type !== 'number';
        exact.addEventListener('focus', function () { if (grouped) exact.value = input.value; });
        exact.addEventListener('blur', function () { if (grouped) exact.value = Number(input.value).toLocaleString(); });
        exact.addEventListener('change', function () {
          var v = parseFloat(String(exact.value).replace(/[^\d.\-]/g, '')); if (isNaN(v)) { exact.value = grouped ? Number(input.value).toLocaleString() : input.value; return; }
          input.value = v; sync(); exact.value = document.activeElement === exact || !grouped ? input.value : Number(input.value).toLocaleString();
          input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true }));
        });
      }
    }
    var fmt = function (v) {
      var n = Number(v), dec = (String(input.step).split('.')[1] || '').length;
      var txt = n.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec });
      return (s.dataset.prefix || '') + txt + (s.dataset.suffix || '');
    };
    var sync = function () {
      var min = parseFloat(input.min || 0), max = parseFloat(input.max || 100), step = parseFloat(input.step) || 1;
      var v = parseFloat(input.value);
      s.style.setProperty('--_value', max > min ? (v - min) / (max - min) : 0);
      s.style.setProperty('--_steps', Math.max(1, Math.round((max - min) / step)));
      label.textContent = fmt(v);
      if (out) out.textContent = fmt(v);
      if (exact && document.activeElement !== exact) exact.value = exact.type === 'number' ? input.value : Number(input.value).toLocaleString();
      if (s.dataset.prefix || s.dataset.suffix) input.setAttribute('aria-valuetext', fmt(v));
    };
    input.addEventListener('input', function () { sync(); S4.util.emit(s, 's4-change', { value: input.valueAsNumber }); });
    /* keep the label up while a touch drag is in progress (no :active on some touch browsers) */
    input.addEventListener('pointerdown', function () { s.setAttribute('data-dragging', ''); });
    ['pointerup', 'pointercancel', 'blur'].forEach(function (t) { input.addEventListener(t, function () { s.removeAttribute('data-dragging'); }); });
    sync();
  });
});
