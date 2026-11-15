/* Small rewards (decision 0051): the moments that make finishing something feel good. Each one is an existing motion
   pattern, so they never look like a different app.
   - A check that draws itself:   <span class="s4-done-mark"></span>, then set data-done on it (or S4.reward.done(el)).
     The disc arrives as Ink, the check is drawn on Ink calm. Remove data-done to take it back.
   - A number that counts to its value:   <span data-count-to="212.48" data-count-format="currency:USD">$0.00</span>
     counts once when it comes into view; S4.reward.count(el, to, { from, format, decimals, locale }) from code.
     Formats: number (default), currency:USD, percent, compact. The real value is in aria-label the whole time.
   - A row that settles after a drag comes with reorderable lists (components/reorder).
   Under reduced motion numbers show their value at once and the check simply appears. */
(function () {
  var S4 = window.S4;
  var CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12.5l4.5 4.5L19 7.5" pathLength="1"></path></svg>';
  function fmt(el, opts) {
    var spec = String(opts.format || el.getAttribute('data-count-format') || 'number').split(':'), kind = spec[0];
    var dec = opts.decimals != null ? opts.decimals : (el.hasAttribute('data-count-decimals') ? +el.getAttribute('data-count-decimals') : null);
    var o = kind === 'currency' ? { style: 'currency', currency: spec[1] || 'USD' } : kind === 'percent' ? { style: 'percent' } : kind === 'compact' ? { notation: 'compact' } : {};
    if (dec != null) { o.minimumFractionDigits = dec; o.maximumFractionDigits = dec; }
    var nf; try { nf = new Intl.NumberFormat(opts.locale || document.documentElement.lang || undefined, o); } catch (e) { nf = new Intl.NumberFormat(); }
    return function (v) { return nf.format(v); };
  }
  function count(el, to, opts) {
    opts = opts || {}; to = +to;
    var f = fmt(el, opts), from = opts.from != null ? +opts.from : 0;
    el.setAttribute('aria-label', f(to));
    if (el._s4count) cancelAnimationFrame(el._s4count);
    /* long enough to read as counting, short enough to never wait for: four reveals */
    var ms = S4.motion.reduced() ? 0 : (opts.duration || S4.transition.duration('reveal') * 2.5);
    if (!ms || from === to) { el.textContent = f(to); return; }
    var t0 = performance.now();
    (function tick(now) {
      var k = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - k, 3);
      el.textContent = f(from + (to - from) * e);
      if (k < 1) el._s4count = requestAnimationFrame(tick); else { el.textContent = f(to); el._s4count = 0; }
    })(t0);
  }
  function done(el, on) { el.toggleAttribute('data-done', on !== false); }
  S4.reward = { count: count, done: done };

  var io = window.IntersectionObserver ? new IntersectionObserver(function (list) {
    list.forEach(function (x) { if (x.isIntersecting) { io.unobserve(x.target); count(x.target, x.target.getAttribute('data-count-to')); } });
  }, { threshold: 0.4 }) : null;

  S4.register('reward', function (scope) {
    S4.util.all(scope, '.s4-done-mark').forEach(function (m) {
      if (!S4.util.once(m, 'done')) return;
      if (!m.querySelector('svg')) m.insertAdjacentHTML('beforeend', CHECK);
      if (!m.hasAttribute('aria-label')) m.setAttribute('aria-hidden', 'true');
    });
    S4.util.all(scope, '[data-count-to]').forEach(function (el) {
      if (!S4.util.once(el, 'count')) return;
      var f = fmt(el, {}), to = +el.getAttribute('data-count-to');
      el.setAttribute('aria-label', f(to));
      if (io && !S4.motion.reduced()) { el.textContent = f(0); io.observe(el); } else el.textContent = f(to);
    });
  });
})();
