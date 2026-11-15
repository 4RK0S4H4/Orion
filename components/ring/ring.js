/* Ring behaviour: <div class="s4-ring" data-value="0.36" aria-label="…"><span class="s4-ring-value">36%</span>…</div>
   Draws the SVG, sets role="progressbar", aria-valuenow (0–100), aria-valuetext (the written value) and --_value from
   data-value (0–1, clamped). Changing data-value later (el.dataset.value = 0.5) updates and animates the arc. */
S4.register('ring', function (scope) {
  var SVG = '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">' +
    '<circle class="s4-ring-track" cx="50" cy="50" r="44" pathLength="100"></circle>' +
    '<circle class="s4-ring-indicator" cx="50" cy="50" r="44" pathLength="100"></circle></svg>';
  function sync(el) {
    if (!el.querySelector(':scope > svg')) el.insertAdjacentHTML('afterbegin', SVG);
    var v = Math.min(1, Math.max(0, +el.getAttribute('data-value') || 0));
    el.style.setProperty('--_value', String(v));
    el.setAttribute('role', 'progressbar');
    el.setAttribute('aria-valuemin', '0');
    el.setAttribute('aria-valuemax', '100');
    el.setAttribute('aria-valuenow', String(Math.round(v * 100)));
    var text = el.querySelector('.s4-ring-value');
    if (text && text.textContent.trim()) el.setAttribute('aria-valuetext', text.textContent.trim()); else el.removeAttribute('aria-valuetext');
  }
  S4.util.all(scope, '.s4-ring').forEach(function (el) {
    if (!S4.util.once(el, 'ring')) return;
    sync(el);
    new MutationObserver(function () { sync(el); }).observe(el, { attributes: true, attributeFilter: ['data-value'] });
  });
});
