/* Rating: a read-only display with its number beside it (never the stars alone), and an input (a radio group).
     <span class="s4-rating" data-value="4.5" data-count="128"></span>                         display; half steps
     <fieldset class="s4-rating" data-input data-name="service" data-value="4" data-labels="Poor,Fair,Good,Very Good,Excellent">
       <legend>Rate the Service</legend>
     </fieldset>                                                                             input; whole steps
   data-max (default 5). The display rounds to halves and reads "Rated 4.5 out of 5, 128 reviews". The input is real radio
   buttons (arrow keys, forms, required); hovering previews, tapping the chosen star again clears it, and the words
   beside it ("Very Good", or "4 of 5") say the choice. Fires s4-change { value } on the input. S4.rating.set(el, n). */
(function () {
  var S4 = window.S4, uid = 0;
  var STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6-4.4-4.2 6-.8z"/></svg>';
  function star(fill) {
    var s = document.createElement('span'); s.className = 's4-rating-mark';
    s.innerHTML = '<span class="s4-rating-empty">' + STAR + '</span><span class="s4-rating-full">' + STAR + '</span>';
    if (fill != null) s.style.setProperty('--_fill', (fill * 100) + '%');
    return s;
  }
  S4.rating = { set: function (el, n) { if (el._s4rating) el._s4rating(n); } };
  S4.register('rating', function (scope) {
    S4.util.all(scope, '.s4-rating').forEach(function (r) {
      if (!S4.util.once(r, 'rating')) return;
      var lang = (r.closest('[lang]') || document.documentElement).getAttribute('lang') || undefined;
      var max = Math.max(1, +r.dataset.max || 5);
      var nf = new Intl.NumberFormat(lang, { minimumFractionDigits: 0, maximumFractionDigits: 1 });
      if (!r.hasAttribute('data-input')) {
        /* ---------- display ---------- */
        var draw = function (raw) {
          raw = Math.max(0, Math.min(max, +raw || 0));
          var v = Math.round(raw * 2) / 2;   /* the stars show halves; the number says the real value */
          r.innerHTML = '';
          var stars = document.createElement('span'); stars.className = 's4-rating-stars';
          for (var i = 0; i < max; i++) stars.appendChild(star(Math.max(0, Math.min(1, v - i))));
          r.appendChild(stars);
          var num = document.createElement('span'); num.className = 's4-rating-value'; num.textContent = nf.format(raw); r.appendChild(num);
          var count = r.dataset.count;
          if (count) { var c = document.createElement('span'); c.className = 's4-rating-count'; c.textContent = '(' + new Intl.NumberFormat(lang).format(+count) + ')'; r.appendChild(c); }
          r.setAttribute('role', 'img');
          r.setAttribute('aria-label', 'Rated ' + nf.format(raw) + ' out of ' + max + (count ? ', ' + new Intl.NumberFormat(lang).format(+count) + ' ' + (+count === 1 ? 'review' : 'reviews') : ''));
        };
        draw(r.dataset.value);
        r._s4rating = function (n) { r.dataset.value = n; draw(n); };
        return;
      }
      /* ---------- input: a radio group ---------- */
      var name = r.dataset.name || ('s4-rating-' + (++uid));
      var labels = (r.dataset.labels || '').split(',').map(function (s) { return s.trim(); });
      var required = r.hasAttribute('data-required');
      var row = document.createElement('span'); row.className = 's4-rating-stars';
      var radios = [];
      for (var i = 1; i <= max; i++) {
        var lab = document.createElement('label'); lab.className = 's4-rating-star';
        var inp = document.createElement('input'); inp.type = 'radio'; inp.name = name; inp.value = String(i);
        if (required && i === 1) inp.required = true;
        inp.setAttribute('aria-label', (labels[i - 1] ? labels[i - 1] + ', ' : '') + i + (i === 1 ? ' star' : ' stars'));
        lab.appendChild(inp); lab.appendChild(star(null));
        row.appendChild(lab); radios.push(inp);
      }
      var words = document.createElement('span'); words.className = 's4-rating-value'; words.setAttribute('aria-hidden', 'true');
      var legend = r.querySelector(':scope > legend');
      if (legend) legend.after(row); else r.prepend(row);
      row.after(words);
      var current = function () { var c = radios.find(function (x) { return x.checked; }); return c ? +c.value : 0; };
      var paint = function (n) { radios.forEach(function (x, k) { x.parentElement.toggleAttribute('data-on', k < n); }); };
      var say = function (n) { words.textContent = n ? (labels[n - 1] || n + ' of ' + max) : (r.dataset.emptyText || 'Not rated'); words.toggleAttribute('data-empty', !n); };
      var set = function (n, events) {
        radios.forEach(function (x) { x.checked = +x.value === n; });
        paint(n); say(n);
        if (events) { S4.util.emit(r, 's4-change', { value: n }); }
      };
      var start = Math.round(+r.dataset.value || 0);
      set(start, false);
      r._s4rating = function (n) { set(Math.round(n), false); };
      var downOn = 0;
      radios.forEach(function (x) {
        var lab = x.parentElement;
        lab.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse' && !x.disabled) paint(+x.value); });
        lab.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') paint(current()); });
        /* tapping the chosen star again clears the rating */
        lab.addEventListener('pointerdown', function () { downOn = x.checked ? +x.value : 0; });
        lab.addEventListener('click', function (e) {
          if (e.target !== x) return;
          if (downOn && downOn === +x.value && !required) { downOn = 0; x.checked = false; set(0, true); x.dispatchEvent(new Event('change', { bubbles: true })); return; }
          downOn = 0;
        });
        x.addEventListener('change', function () { if (x.checked) { paint(+x.value); say(+x.value); S4.util.emit(r, 's4-change', { value: +x.value }); } });
      });
      r.addEventListener('pointerleave', function () { paint(current()); });
      /* .s4-form puts its message on the first radio (a rating has no field around it): show it under the stars */
      if (required) {
        if (!radios[0].dataset.msgRequired) radios[0].dataset.msgRequired = r.dataset.msgRequired || 'Choose a rating.';
        var err = document.createElement('div'); err.className = 's4-rating-error'; err.hidden = true; err.id = name + '-error'; r.appendChild(err);
        radios.forEach(function (x) { x.setAttribute('aria-describedby', err.id); });
        var showErr = function () { var m = radios[0].getAttribute('data-error'); err.hidden = !m; err.textContent = m || ''; r.toggleAttribute('data-error', !!m); };
        new MutationObserver(showErr).observe(radios[0], { attributes: true, attributeFilter: ['data-error'] });
        r.addEventListener('s4-change', function () { if (current()) { radios[0].removeAttribute('data-error'); radios.forEach(function (x) { x.removeAttribute('aria-invalid'); }); } });
      }
      if (r.disabled || r.hasAttribute('disabled')) radios.forEach(function (x) { x.disabled = true; });
    });
  });
})();
