/* Forms that behave (decision 0051).
     <form class="s4-form" novalidate data-autosave>
       <div class="s4-text-field"><input id="e" type="email" required data-msg-required="Enter your email." data-msg-type="That doesn’t look like an email address."><label for="e">Email</label></div>
       <span class="s4-form-status"></span>
     </form>
   - Errors appear when you leave a field that you typed in (or that has a value), never while you type, and never for a field you
     only tabbed through: an empty required field is reported by Submit. Reset clears errors, checks and touched state too. Typing in a field with an error clears it at once.
   - A field that was wrong and is now right shows a quiet check (data-valid) until you move on.
   - Submit with something wrong: every problem is shown, the first one is scrolled into view (never focused, decision
     0049), s4-invalid { fields } fires and nothing is sent. Otherwise s4-submit { values } fires (cancel it to stop the
     browser sending the form).
   - Messages: data-msg-required, data-msg-type, data-msg-pattern, data-msg-min, data-msg-max, data-msg-length on the
     control, or data-msg for any problem; the browser's own text if none is given.
   - data-autosave: after a change settles (and the form is valid) s4-save { values, done(ok) } fires and
     .s4-form-status reads "Saving…", then "Saved" when done() is called (at once if the handler does not call
     detail.wait()). No Save button, no "Are you sure?": offer Undo in a snackbar instead.
   - S4.form.validate(form) -> true | false, S4.form.values(form), S4.form.saved(form, text). */
(function () {
  var S4 = window.S4;
  var CONTROL = 'input:not([type="hidden"]):not([type="button"]):not([type="submit"]), select, textarea';
  function wrap(c) { return c.closest('.s4-text-field, .s4-checkbox, .s4-radio, .s4-switch') || c; }
  function message(c) {
    var v = c.validity, d = c.dataset;
    if (v.valid) return '';
    var m = v.valueMissing ? d.msgRequired : v.typeMismatch ? d.msgType : v.patternMismatch ? d.msgPattern
      : (v.rangeUnderflow || v.tooShort) ? (d.msgMin || d.msgLength) : (v.rangeOverflow || v.tooLong) ? (d.msgMax || d.msgLength) : '';
    return m || d.msg || c.validationMessage || 'Check this field.';
  }
  function check(c, show) {
    if (c.disabled || !c.willValidate) return true;
    var w = wrap(c), msg = message(c);
    if (msg) { if (show) { w.removeAttribute('data-valid'); w.setAttribute('data-error', msg); if (!w.matches('.s4-text-field')) c.setAttribute('aria-invalid', 'true'); } return false; }
    var had = w.hasAttribute('data-error');
    w.removeAttribute('data-error'); if (!w.matches('.s4-text-field')) c.removeAttribute('aria-invalid');
    if (had && show) w.setAttribute('data-valid', '');   /* it was wrong and now it is right: a quiet check */
    return true;
  }
  function controls(form) { return Array.prototype.slice.call(form.querySelectorAll(CONTROL)); }
  function validate(form, show) {
    var bad = controls(form).filter(function (c) { return !check(c, show !== false); });
    return bad;
  }
  function values(form) { var o = {}; new FormData(form).forEach(function (v, k) { if (k in o) o[k] = [].concat(o[k], v); else o[k] = v; }); return o; }
  function status(form, text, done) {
    var s = form.querySelector('.s4-form-status'); if (!s) return;
    s.textContent = text; s.toggleAttribute('data-done', !!done); s.toggleAttribute('data-on', !!text);
    if (!s.hasAttribute('role')) s.setAttribute('role', 'status');
  }
  function save(form) {
    if (validate(form, false).length) return;
    var waited = false, finished = false;
    var done = function (ok) { finished = true; status(form, ok === false ? 'Couldn’t save' : (form.getAttribute('data-saved-text') || 'Saved'), ok !== false); };
    status(form, form.getAttribute('data-saving-text') || 'Saving…', false);
    S4.util.emit(form, 's4-save', { values: values(form), done: done, wait: function () { waited = true; } });
    if (!waited && !finished) done(true);
  }
  S4.form = {
    validate: function (form) { return !validate(form, true).length; },
    values: values,
    saved: function (form, text) { status(form, text || 'Saved', true); }
  };

  S4.register('form', function (scope) {
    S4.util.all(scope, 'form.s4-form').forEach(function (form) {
      if (!S4.util.once(form, 'form')) return;
      form.setAttribute('novalidate', '');
      var timer = null, auto = form.hasAttribute('data-autosave');
      var later = function (ms) { clearTimeout(timer); timer = setTimeout(function () { save(form); }, ms); };
      /* leaving a field is when it is checked */
      form.addEventListener('focusout', function (e) {
        var c = e.target; if (!c.matches || !c.matches(CONTROL)) return;
        if (c.dataset.s4Touched || c.value) { c.dataset.s4Touched = '1'; check(c, true); }
      });
      /* typing never shows an error; it only removes one */
      form.addEventListener('input', function (e) {
        var c = e.target; if (!c.matches || !c.matches(CONTROL)) return;
        c.dataset.s4Touched = '1';
        var w = wrap(c);
        if (w.hasAttribute('data-error') && c.validity.valid) { w.removeAttribute('data-error'); if (!w.matches('.s4-text-field')) c.removeAttribute('aria-invalid'); w.setAttribute('data-valid', ''); }
        else if (!w.hasAttribute('data-error')) w.removeAttribute('data-valid');
        if (auto) { status(form, '', false); later(900); }
      });
      form.addEventListener('change', function (e) {
        var c = e.target; if (!c.matches || !c.matches(CONTROL)) return;
        if (/^(checkbox|radio|range|date|color|file)$/.test(c.type) || c.tagName === 'SELECT') check(c, true);
        if (auto) later(250);
      });
      /* Reset puts the form back to the state it loaded in (decision 0076): values, and the errors, valid marks and "touched" that came
         with them, and the autosave status; the reset event fires before the values change, so this waits one tick */
      form.addEventListener('reset', function () {
        setTimeout(function () {
          controls(form).forEach(function (c) { var w = wrap(c); delete c.dataset.s4Touched; c.removeAttribute('aria-invalid'); w.removeAttribute('data-error'); w.removeAttribute('data-valid'); });
          status(form, '', false);
        }, 0);
      });
      form.addEventListener('submit', function (e) {
        var bad = validate(form, true);
        if (bad.length) {
          e.preventDefault();
          var first = wrap(bad[0]);
          if (first.scrollIntoView) first.scrollIntoView({ block: 'center', behavior: S4.motion.reduced() ? 'auto' : 'smooth' });
          S4.util.emit(form, 's4-invalid', { fields: bad });
          return;
        }
        var ev = new CustomEvent('s4-submit', { bubbles: true, cancelable: true, detail: { values: values(form) } });
        if (!form.dispatchEvent(ev)) e.preventDefault();
      });
    });
  });
})();
