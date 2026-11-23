/* Inline edit: a value you click to change where it is. It is a real input that looks like plain text until you
   point at it, so your own tap puts the cursor in it (no script ever does, decision 0049).
     <div class="s4-inline-edit">
       <label for="name">Display Name</label>                 optional; otherwise aria-label on the input
       <input id="name" value="Ana Ribeiro" required>
     </div>
   - Enter or leaving the field saves; Escape puts the saved value back. An empty required value, or one the input
     rejects, is not saved: the old value comes back and a short message says why.
   - Focus stays where it is (decision 0076): after Enter or Escape the field still has it, or, on a touch screen (no keyboard to
     keep up), its own box does; never <body>. Several edits in a row each keep their Undo (see S4.snackbar).
   - Saving fires s4-change { value, previous } on the element and offers Undo in a snackbar (data-undo-text sets its
     words, "Display name changed" by default); Undo puts the previous value back and fires s4-change again.
   S4.inlineEdit.set(el, value). */
(function () {
  var S4 = window.S4, root = document.documentElement;
  S4.inlineEdit = { set: function (el, v) { if (el._s4edit) el._s4edit(v); } };
  S4.register('inline-edit', function (scope) {
    S4.util.all(scope, '.s4-inline-edit').forEach(function (el) {
      if (!S4.util.once(el, 'inlineEdit')) return;
      var input = el.querySelector(':scope > input, :scope > textarea'); if (!input) return;
      var label = el.querySelector(':scope > label');
      var name = (label ? label.textContent : input.getAttribute('aria-label') || 'Value').trim();
      var saved = input.value;
      input.setAttribute('autocomplete', input.getAttribute('autocomplete') || 'off');
      var hint = document.createElement('span'); hint.className = 's4-icon s4-inline-edit-hint'; hint.setAttribute('aria-hidden', 'true');
      input.after(hint); S4.icon.set(hint, 'edit');
      var msg = document.createElement('div'); msg.className = 's4-inline-edit-message'; msg.setAttribute('role', 'status'); el.appendChild(msg);
      if (!input.id) input.id = 's4-inline-' + Math.random().toString(36).slice(2, 7);
      msg.id = input.id + '-msg';
      input.setAttribute('aria-describedby', ((input.getAttribute('aria-describedby') || '') + ' ' + msg.id).trim());
      function size() { if (input.tagName === 'INPUT') input.style.inlineSize = 'calc(' + Math.max(4, input.value.length + 2) + 'ch + var(--s4-space-2) + var(--s4-space-3) + var(--s4-size-icon-small))'; }
      function say(t) { msg.textContent = t; el.toggleAttribute('data-message', !!t); if (t) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid'); }
      /* Enter and Escape finish the edit without losing the place. A keyboard keeps the field; a finger puts the keyboard away and
         the box that holds the field takes focus (a place-holder, ringed only for keys, decision 0065) */
      function done() {
        if (root.getAttribute('data-s4-input') === 'pointer') { if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: true }); }
      }
      function commit() {
        var v = input.value.trim();
        if (v === saved) { input.value = saved; size(); return; }
        if (!input.checkValidity() || (input.required && !v)) {
          var why = input.dataset.msg || (input.required && !v ? name + ' can’t be empty, so it was kept.' : input.validationMessage);
          input.value = saved; size(); say(why); return;
        }
        var previous = saved; saved = v; input.value = v; size(); say('');
        S4.util.emit(el, 's4-change', { value: v, previous: previous });
        if (S4.snackbar && !el.hasAttribute('data-no-undo')) S4.snackbar({ text: el.dataset.undoText || (name.charAt(0) + name.slice(1).toLowerCase()) + ' changed', action: 'Undo', onAction: function () { var now = saved; saved = previous; input.value = previous; size(); S4.util.emit(el, 's4-change', { value: previous, previous: now }); } });
      }
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && input.tagName === 'INPUT') { e.preventDefault(); commit(); done(); }
        else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); input.value = saved; size(); say(''); done(); }
      });
      input.addEventListener('focus', function () { say(''); });
      input.addEventListener('input', function () { size(); if (input.hasAttribute('aria-invalid')) say(''); });
      input.addEventListener('blur', commit);
      el._s4edit = function (v) { saved = String(v); input.value = saved; size(); };
      size();
    });
  });
})();
