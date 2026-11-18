/* Password helpers on the text field: show / hide, a strength meter with words, and a Caps Lock notice.
     <div class="s4-text-field s4-password" data-strength>
       <label for="pw">New Password</label>
       <input id="pw" type="password" autocomplete="new-password" minlength="12">
       <div class="s4-text-field-supporting">At least 12 characters.</div>
     </div>
   - A Show Password button (aria-pressed true while the text shows; its name never changes) ends the field.
   - data-strength: four segments and a word ("Weak: add numbers or symbols"), updated as you type and read out politely
     after a pause. Not a rule: the form's own minlength / pattern decide what is accepted.
   - Caps Lock on while typing in the field: a short notice under it (only on keyboards that report it).
   S4.password.score(text) -> 0..4. */
(function () {
  var S4 = window.S4;
  var COMMON = /^(password|passw0rd|qwerty|letmein|welcome|admin|iloveyou|monkey|dragon|abc123|123456|111111)/i;
  function score(t) {
    if (!t) return -1;
    var s = 0;
    if (t.length >= 8) s++;
    if (t.length >= 12) s++;
    if (t.length >= 16) s++;
    var kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter(function (r) { return r.test(t); }).length;
    if (kinds >= 3) s++;
    if (kinds === 4 && t.length >= 10) s++;
    if (COMMON.test(t) || /^(.)\1+$/.test(t) || /^(0123|1234|abcd)/i.test(t)) s = Math.min(s, 1);
    if (t.length < 8) s = 0;
    return Math.max(0, Math.min(4, s));
  }
  var WORDS = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];
  function tip(t, s) {
    if (t.length < 8) return 'use at least 8 characters';
    if (s >= 4) return '';
    if (!/\d/.test(t) || !/[^A-Za-z0-9]/.test(t)) return 'add numbers or symbols';
    if (t.length < 12) return 'make it longer';
    return 'a few more words make it stronger';
  }
  S4.password = { score: score };
  S4.register('password', function (scope) {
    S4.util.all(scope, '.s4-password').forEach(function (f) {
      if (!S4.util.once(f, 'password')) return;
      var input = f.querySelector(':scope > input'); if (!input) return;
      var labelText = ((f.querySelector(':scope > label') || {}).textContent || 'Password').trim();
      input.setAttribute('autocapitalize', 'off'); input.setAttribute('spellcheck', 'false'); input.setAttribute('autocorrect', 'off');
      /* show / hide */
      var btn = document.createElement('button'); btn.type = 'button'; btn.className = 's4-icon-button s4-password-toggle';
      btn.setAttribute('aria-label', 'Show ' + (/password/i.test(labelText) ? 'Password' : labelText));
      btn.setAttribute('aria-pressed', 'false');
      if (input.id) btn.setAttribute('aria-controls', input.id);
      btn.innerHTML = '<span class="s4-icon" aria-hidden="true"></span>'; S4.icon.set(btn.firstChild, 'visible');
      input.after(btn);
      btn.addEventListener('pointerdown', function (e) { if (document.activeElement === input) e.preventDefault(); });   /* keep the cursor where it is, never put it there */
      btn.addEventListener('click', function () {
        var show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.setAttribute('aria-pressed', String(show));
        S4.icon.set(btn.firstChild, show ? 'hidden' : 'visible');
      });
      /* hide again before the form is sent, so the browser offers to save it as a password */
      var form = input.form; if (form) form.addEventListener('submit', function () { if (input.type === 'text') btn.click(); });
      new MutationObserver(function () { btn.disabled = input.disabled; }).observe(input, { attributes: true, attributeFilter: ['disabled'] });
      btn.disabled = input.disabled;

      /* strength */
      if (f.hasAttribute('data-strength')) {
        var meter = document.createElement('div'); meter.className = 's4-password-strength';
        var bars = document.createElement('span'); bars.className = 's4-password-bars'; bars.setAttribute('aria-hidden', 'true');
        for (var i = 0; i < 4; i++) bars.appendChild(document.createElement('span'));
        var word = document.createElement('span'); word.className = 's4-password-word';
        var live = document.createElement('span'); live.className = 's4-visually-hidden'; live.setAttribute('aria-live', 'polite');
        meter.appendChild(bars); meter.appendChild(word); meter.appendChild(live);
        f.appendChild(meter);
        var t = null;
        var update = function () {
          var v = input.value, s = score(v);
          meter.dataset.score = String(s);
          meter.hidden = !v;
          var tipText = v ? tip(v, s) : '';
          word.textContent = v ? 'Strength: ' + WORDS[Math.max(0, s)] + (tipText ? ', ' + tipText : '') : '';
          clearTimeout(t); t = setTimeout(function () { live.textContent = word.textContent; }, 900);
        };
        input.addEventListener('input', update); update();
      }
      /* Caps Lock */
      var caps = document.createElement('div'); caps.className = 's4-password-caps'; caps.hidden = true; caps.setAttribute('role', 'status');
      var ci = document.createElement('span'); ci.className = 's4-icon'; ci.setAttribute('aria-hidden', 'true'); caps.appendChild(ci); S4.icon.set(ci, 'warning');
      caps.appendChild(document.createTextNode('Caps Lock is on'));
      f.appendChild(caps);
      var check = function (e) { if (e.getModifierState) caps.hidden = !e.getModifierState('CapsLock'); };
      input.addEventListener('keydown', check); input.addEventListener('keyup', check);
      input.addEventListener('blur', function () { caps.hidden = true; });
    });
  });
})();
