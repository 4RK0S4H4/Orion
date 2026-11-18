/* One-time code: 4 to 8 boxes that act as one field. One real input underneath (so a phone offers the code from a
   message: autocomplete="one-time-code", inputmode="numeric"); the boxes only draw its characters.
     <div class="s4-text-field s4-code-field" data-length="6" data-group="3">
       <label for="otp">Verification Code</label>
       <input id="otp">
       <div class="s4-text-field-supporting">We sent it to •••• 4021.</div>
     </div>
   - Typing or pasting fills the boxes from the start (only digits, or letters and digits with data-type="alphanumeric",
     upper-cased); a pasted "123 456" or "123-456" fills all six. Backspace removes the last character.
   - When the last box fills, s4-complete { value } fires on the field (data-autosubmit also submits its form). The app
     checks the code, then sets data-error="That code didn’t work." (or data-success) on the field. Typing again clears it.
   - It never takes focus by itself (decision 0049): the person taps it, or the phone's suggestion fills it.
   S4.codeField.clear(field). */
(function () {
  var S4 = window.S4;
  S4.codeField = { clear: function (f) { var i = f.querySelector(':scope > input'); if (i) { i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); } } };
  S4.register('code-field', function (scope) {
    S4.util.all(scope, '.s4-code-field').forEach(function (f) {
      if (!S4.util.once(f, 'codeField')) return;
      var input = f.querySelector(':scope > input'); if (!input) return;
      var n = Math.max(4, Math.min(8, +f.dataset.length || (input.maxLength > 0 ? input.maxLength : 6)));
      var alnum = f.dataset.type === 'alphanumeric';
      var group = +f.dataset.group || 0;
      var inForm = !!f.closest('form.s4-form');
      input.removeAttribute('maxlength');   /* a pasted "123 456" is longer than the code: clean() trims it, not the browser */
      input.setAttribute('autocomplete', input.getAttribute('autocomplete') || 'one-time-code');
      input.setAttribute('inputmode', alnum ? 'text' : 'numeric');
      if (alnum) input.setAttribute('autocapitalize', 'characters');
      input.setAttribute('spellcheck', 'false');
      input.setAttribute('autocorrect', 'off');
      if (!input.getAttribute('pattern')) input.setAttribute('pattern', alnum ? '[A-Z0-9]{' + n + '}' : '[0-9]{' + n + '}');
      if (!input.dataset.msgPattern) input.dataset.msgPattern = 'Enter all ' + n + ' ' + (alnum ? 'characters' : 'digits') + '.';
      f.style.setProperty('--_n', n);
      /* a group's wider gap is an empty track between boxes, so every box keeps the same width */
      var slots = [], tracks = [], col = 0;
      for (var i = 0; i < n; i++) {
        if (group && i && i % group === 0) { tracks.push('0px'); col++; }
        tracks.push('minmax(0, var(--_slot))'); col++;
        var s = document.createElement('span'); s.className = 's4-code-field-slot'; s.setAttribute('aria-hidden', 'true');
        s.style.gridColumn = String(col);
        input.before(s); slots.push(s);
      }
      f.style.gridTemplateColumns = tracks.join(' ');
      var full = false;
      function clean(v) { v = String(v || ''); v = alnum ? v.toUpperCase().replace(/[^A-Z0-9]/g, '') : v.replace(/\D/g, ''); return v.slice(0, n); }
      function render() {
        var v = input.value, focused = document.activeElement === input;
        slots.forEach(function (s, i) {
          s.textContent = v[i] || '';
          s.toggleAttribute('data-filled', !!v[i]);
          s.toggleAttribute('data-active', focused && i === Math.min(v.length, n - 1));
        });
      }
      function end() { try { input.setSelectionRange(input.value.length, input.value.length); } catch (e) {} }
      input.addEventListener('input', function () {
        var v = clean(input.value);
        if (v !== input.value) input.value = v;
        end(); render();
        if (f.hasAttribute('data-success')) f.removeAttribute('data-success');
        if (!inForm && f.hasAttribute('data-error')) f.removeAttribute('data-error');
        var now = v.length === n;
        if (now && !full) {
          S4.util.emit(f, 's4-complete', { value: v });
          var form = f.closest('form');
          if (form && f.hasAttribute('data-autosubmit') && form.requestSubmit) form.requestSubmit();
        }
        full = now;
      });
      /* the caret always sits after the last character: the boxes fill in order */
      input.addEventListener('keydown', function (e) { if (/^(ArrowLeft|ArrowRight|Home|End)$/.test(e.key)) e.preventDefault(); });
      ['focus', 'click', 'select'].forEach(function (ev) { input.addEventListener(ev, function () { end(); render(); }); });
      input.addEventListener('blur', render);
      input.value = clean(input.value); full = input.value.length === n;
      render();
    });
  });
})();
