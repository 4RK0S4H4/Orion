/* Color field: a swatch in a field, with the color as a hex code you can type. The swatch opens a small glass panel
   with the named accents (the swatches component) and a hue slider. For "pick your accent" settings.
     <div class="s4-text-field s4-color-field" data-theme-seed>
       <label for="accent">Accent Color</label>
       <input id="accent" name="accent" value="#4f46e5">
       <template><button class="s4-swatch" data-seed="#000000" aria-label="Mono"></button>…</template>   optional accents
       <div class="s4-text-field-supporting">Used for buttons and selection.</div>
     </div>
   - Typing a hex code ("#4f46e5", "4F46E5", "#46e") updates the swatch; something else is an error on blur.
   - Choosing an accent or moving the hue fires input and change on the input and s4-change { value } on the field;
     data-theme-seed also themes the page (S4.theme({ seed })), and the field follows the theme when it changes elsewhere.
   - The panel is anchored glass (Follow): focus goes to the chosen accent, Escape or a tap outside closes it and gives
     focus back to the swatch. Never a text field focused by script (decision 0049). */
(function () {
  var S4 = window.S4, uid = 0;
  var ACCENTS = [['Mono', '#000000'], ['Indigo', '#4f46e5'], ['Blue', '#0b57d0'], ['Teal', '#00796b'], ['Green', '#2e7d32'], ['Amber', '#b26a00'], ['Rose', '#c2185b'], ['Purple', '#7b1fa2']];
  function hex(v) {
    var t = String(v || '').trim().replace(/^#/, '').toLowerCase();
    if (/^[0-9a-f]{3}$/.test(t)) t = t.split('').map(function (c) { return c + c; }).join('');
    return /^[0-9a-f]{6}$/.test(t) ? '#' + t : null;
  }
  function toHsl(h) {
    var r = parseInt(h.slice(1, 3), 16) / 255, g = parseInt(h.slice(3, 5), 16) / 255, b = parseInt(h.slice(5, 7), 16) / 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn, s = 0, hu = 0;
    if (d) { s = d / (1 - Math.abs(2 * l - 1)); hu = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; hu = (hu * 60 + 360) % 360; }
    return [hu, s, l];
  }
  function fromHsl(hu, s, l) {
    var c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((hu / 60) % 2 - 1)), m = l - c / 2, rgb;
    rgb = hu < 60 ? [c, x, 0] : hu < 120 ? [x, c, 0] : hu < 180 ? [0, c, x] : hu < 240 ? [0, x, c] : hu < 300 ? [x, 0, c] : [c, 0, x];
    return '#' + rgb.map(function (v) { return Math.round((v + m) * 255).toString(16).padStart(2, '0'); }).join('');
  }
  var openPanel = null;
  S4.colorField = { value: function (f) { return f._s4color ? f._s4color.get() : null; }, set: function (f, v) { if (f._s4color) f._s4color.set(v, true); }, hex: hex };

  S4.register('color-field', function (scope) {
    S4.util.all(scope, '.s4-color-field').forEach(function (f) {
      if (!S4.util.once(f, 'colorField')) return;
      var input = f.querySelector(':scope > input'); if (!input) return;
      var labelText = ((f.querySelector(':scope > label') || {}).textContent || input.getAttribute('aria-label') || 'Color').trim();
      var inForm = !!f.closest('form.s4-form');
      var theme = f.hasAttribute('data-theme-seed');
      input.setAttribute('autocomplete', 'off'); input.setAttribute('spellcheck', 'false'); input.setAttribute('autocapitalize', 'off');
      input.maxLength = 7;
      /* a pasted code is trimmed before the length limit cuts it ("  #abcdef " would have lost its end, decision 0076) */
      input.addEventListener('paste', function (e) {
        var t = ((e.clipboardData || window.clipboardData || { getData: function () { return ''; } }).getData('text') || '');
        if (t === t.trim() || !t.trim()) return;
        e.preventDefault(); input.setRangeText(t.trim(), input.selectionStart, input.selectionEnd, 'end'); input.dispatchEvent(new Event('input', { bubbles: true }));
      });
      var id = 's4-color-' + (++uid);

      /* the swatch: a button before the code */
      var sw = document.createElement('button'); sw.type = 'button'; sw.className = 's4-color-field-swatch';
      sw.setAttribute('aria-haspopup', 'dialog'); sw.setAttribute('aria-expanded', 'false'); sw.setAttribute('aria-controls', id);
      input.before(sw);

      /* the panel */
      var panel = document.createElement('div'); panel.className = 's4-color-field-panel s4-glass'; panel.id = id;
      panel.setAttribute('popover', 'manual'); panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', labelText);
      var tpl = f.querySelector(':scope > template');
      var group = document.createElement('div'); group.className = 's4-swatches'; group.setAttribute('aria-label', 'Accents');
      if (tpl) Array.prototype.forEach.call(tpl.content.querySelectorAll('.s4-swatch'), function (b) { group.appendChild(b.cloneNode(true)); });
      else ACCENTS.forEach(function (a) { var b = document.createElement('button'); b.type = 'button'; b.className = 's4-swatch'; b.dataset.seed = a[1]; b.setAttribute('aria-label', a[0]); group.appendChild(b); });
      var gl = document.createElement('div'); gl.className = 's4-color-field-heading'; gl.textContent = 'Accents';
      var hl = document.createElement('label'); hl.className = 's4-color-field-heading'; hl.textContent = 'Hue'; hl.htmlFor = id + '-hue';
      var hue = document.createElement('input'); hue.type = 'range'; hue.className = 's4-color-field-hue'; hue.id = id + '-hue'; hue.min = 0; hue.max = 359; hue.step = 1;
      var stops = []; for (var k = 0; k <= 360; k += 30) stops.push('hsl(' + k + ' 75% 48%)');
      hue.style.setProperty('--_hues', 'linear-gradient(to right, ' + stops.join(', ') + ')');   /* the spectrum is the content here, made from data */
      panel.appendChild(gl); panel.appendChild(group); panel.appendChild(hl); panel.appendChild(hue);
      (f.closest('dialog, [popover]') || document.body).appendChild(panel);
      if (S4.init) S4.init(panel);

      var value = hex(input.value) || '#000000';
      function paint() {
        sw.style.setProperty('--_color', value);
        sw.setAttribute('aria-label', 'Choose ' + labelText + ': ' + (nameOf(value) || value.toUpperCase()));
        Array.prototype.forEach.call(group.querySelectorAll('.s4-swatch'), function (b) { var on = hex(b.dataset.seed) === value; b.setAttribute('aria-pressed', String(on)); });
        var pressed = group.querySelector('.s4-swatch[aria-pressed="true"]') || group.querySelector('.s4-swatch');
        Array.prototype.forEach.call(group.querySelectorAll('.s4-swatch'), function (b) { b.tabIndex = b === pressed ? 0 : -1; });
        var hsl = toHsl(value); if (hsl[1] > 0.02) hue.value = Math.round(hsl[0]);
        hue.setAttribute('aria-valuetext', Math.round(+hue.value) + ' degrees');
      }
      function nameOf(v) { var b = Array.prototype.find.call(group.querySelectorAll('.s4-swatch'), function (x) { return hex(x.dataset.seed) === v; }); return b ? b.getAttribute('aria-label') : ''; }
      function sync() {
        var ok = !input.value.trim() || !!hex(input.value);
        input.setCustomValidity(ok ? '' : (input.dataset.msg || 'Enter a color like #4F46E5.'));
        if (!inForm && f.hasAttribute('data-error') && input.validity.valid) f.removeAttribute('data-error');
      }
      function set(v, events, fromTheme) {
        var h = hex(v); if (!h) return;
        var changed = h !== value || input.value !== h.toUpperCase();
        value = h; input.value = h.toUpperCase(); paint(); sync();
        if (events && changed) {
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          S4.util.emit(f, 's4-change', { value: h });
          if (theme && !fromTheme) S4.theme({ seed: h === '#000000' ? null : h });
        }
      }
      f._s4color = { get: function () { return value; }, set: set };
      if (hex(input.value)) set(value, false); else paint();   /* a code that is not a color stays as written, with its error */
      if (theme) {
        var cur = S4.theme && S4.theme().seed; if (cur) set(cur, false);
        document.addEventListener('s4-theme', function (e) { var s = (e.detail || S4.theme()).seed; set(s || '#000000', false, true); });
      }

      function place() {
        if (!panel.matches(':popover-open')) return;
        var r = sw.getBoundingClientRect(), fr = f.getBoundingClientRect(), p = panel.getBoundingClientRect();
        var vv = window.visualViewport, top0 = vv ? vv.offsetTop : 0, vh = vv ? vv.height : innerHeight, vw = document.documentElement.clientWidth, m = 8;
        var below = r.bottom + 8 + p.height <= top0 + vh - m || r.top - 8 - p.height < top0 + m;
        var rtl = getComputedStyle(f).direction === 'rtl';
        var left = rtl ? fr.right - p.width : fr.left;
        panel.style.left = Math.max(m, Math.min(left, vw - m - p.width)) + 'px';
        panel.style.top = Math.max(top0 + m, below ? r.bottom + 8 : r.top - 8 - p.height) + 'px';
        panel.dataset.side = below ? 'below' : 'above';
      }
      function open() {
        if (openPanel && openPanel !== close) openPanel();
        try { panel.showPopover(); } catch (e) { return; }
        place();
        sw.setAttribute('aria-expanded', 'true');
        S4.transition.follow(panel, { from: panel.dataset.side === 'above' ? 'bottom' : 'top' });
        var first = group.querySelector('.s4-swatch[tabindex="0"]'); if (first) first.focus({ preventScroll: true });
        openPanel = close;
      }
      var closing = false;
      function close(back) {
        if (!panel.matches(':popover-open') || closing) return;
        closing = true; sw.setAttribute('aria-expanded', 'false');
        if (openPanel === close) openPanel = null;
        S4.transition.follow(panel, { open: false }).then(function () { closing = false; try { panel.hidePopover(); } catch (e) {} S4.transition.restore && S4.transition.restore(panel); });
        if (back !== false) sw.focus({ preventScroll: true });
      }
      sw.addEventListener('click', function () { if (input.disabled) return; panel.matches(':popover-open') && !closing ? close() : open(); });
      group.addEventListener('s4-change', function (e) { e.stopPropagation(); var b = e.detail && e.detail.swatch || group.querySelector('.s4-swatch[aria-pressed="true"]'); if (b) set(b.dataset.seed || '#000000', true); });
      hue.addEventListener('input', function () {
        var hsl = toHsl(value), s = hsl[1] < 0.2 ? 0.7 : hsl[1], l = hsl[2] < 0.25 || hsl[2] > 0.75 ? 0.45 : hsl[2];
        set(fromHsl(+hue.value, s, l), true);
      });
      panel.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } else if (e.key === 'Tab') { var foc = panel.querySelectorAll('.s4-swatch[tabindex="0"], .s4-color-field-hue'); if (!e.shiftKey && document.activeElement === foc[foc.length - 1]) { e.preventDefault(); close(); } else if (e.shiftKey && document.activeElement === foc[0]) { e.preventDefault(); close(); } } });
      document.addEventListener('pointerdown', function (e) { if (panel.matches(':popover-open') && !panel.contains(e.target) && !sw.contains(e.target)) close(false); }, true);
      window.addEventListener('resize', place);
      input.addEventListener('input', function (e) { if (!e.isTrusted) return; var h = hex(input.value); if (h) { value = h; paint(); S4.util.emit(f, 's4-change', { value: h }); if (theme) S4.theme({ seed: h === '#000000' ? null : h }); } sync(); });
      input.addEventListener('blur', function () { var h = hex(input.value); if (h) input.value = h.toUpperCase(); sync(); if (!inForm && !input.validity.valid) f.setAttribute('data-error', input.validationMessage); });
      new MutationObserver(function () { sw.disabled = input.disabled; }).observe(input, { attributes: true, attributeFilter: ['disabled'] });
      sw.disabled = input.disabled;
    });
  });
})();
