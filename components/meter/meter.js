/* Meter behaviour (decision 0063): reads data-value, data-min and data-max on .s4-meter (and data-value, data-from on
   each .s4-meter-fill, data-at on each .s4-meter-mark, data-steps), writes them as --value, --from and --at (0 to 100
   on the track), and gives the meter role="meter" with aria-valuemin, -max, -now and -valuetext (the written value).
   A plain meter with one fill and no data-value on it takes the meter's own value. Segments (data-segmented) follow one
   another unless a fill names data-from. Change any of these attributes later and the meter redraws. */
S4.register('meter', function (scope) {
  var num = function (v, d) { var n = parseFloat(v); return isNaN(n) ? d : n; };
  function draw(m) {
    var min = num(m.dataset.min, 0), max = num(m.dataset.max, 100), span = max - min || 1;
    var pct = function (v) { return Math.min(100, Math.max(0, (v - min) / span * 100)); };
    var fills = [].slice.call(m.querySelectorAll('.s4-meter-fill')), seg = m.hasAttribute('data-segmented');
    var at = min, total = 0, own = m.dataset.value != null;
    fills.forEach(function (f, i) {
      var v = f.dataset.value != null ? num(f.dataset.value, 0) : (own && fills.length === 1 ? num(m.dataset.value, 0) - min : null);
      if (v == null) return;
      var from = f.dataset.from != null ? num(f.dataset.from, min) : seg ? at : min;
      f.style.setProperty('--from', String(+pct(from).toFixed(3)));
      f.style.setProperty('--value', String(+Math.min(100 - pct(from), Math.max(0, v / span * 100)).toFixed(3)));
      f.toggleAttribute('data-zero', v <= 0);
      f.toggleAttribute('data-first', i === 0);
      f.toggleAttribute('data-last', seg && from + v >= max);
      at = from + v; total += v;
    });
    [].forEach.call(m.querySelectorAll('.s4-meter-mark[data-at]'), function (k) { k.style.setProperty('--at', String(+pct(num(k.dataset.at, min)).toFixed(3))); });
    if (m.dataset.steps) m.style.setProperty('--_steps', String(Math.max(1, Math.round(num(m.dataset.steps, 1))))); else m.style.removeProperty('--_steps');
    var now = own ? num(m.dataset.value, min) : min + total;
    m.setAttribute('role', 'meter');
    m.setAttribute('aria-valuemin', String(min));
    m.setAttribute('aria-valuemax', String(max));
    m.setAttribute('aria-valuenow', String(Math.min(max, Math.max(min, now))));
    var text = m.querySelector('.s4-meter-value');
    if (text && text.textContent.trim()) m.setAttribute('aria-valuetext', text.textContent.trim().replace(/\s+/g, ' '));   /* without a written value, the author's own aria-valuetext stays */
    if (!m.hasAttribute('aria-label') && !m.hasAttribute('aria-labelledby')) {
      var label = m.querySelector('.s4-meter-label');
      if (label) { if (!label.id) label.id = 's4-meter-' + Math.random().toString(36).slice(2, 8); m.setAttribute('aria-labelledby', label.id); }
    }
  }
  S4.util.all(scope, '.s4-meter').forEach(function (m) {
    if (!S4.util.once(m, 'meter')) return;
    draw(m);
    var queued = false;
    new MutationObserver(function () {
      if (queued) return; queued = true;
      Promise.resolve().then(function () { queued = false; draw(m); });
    }).observe(m, { attributes: true, subtree: true, characterData: true, childList: true, attributeFilter: ['data-value', 'data-min', 'data-max', 'data-from', 'data-at', 'data-steps'] });
  });
});
