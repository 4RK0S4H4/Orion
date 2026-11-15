/* States (decision 0051): every list, table and pane has a designed loading, empty, error and offline state.
     <div class="s4-states" data-state="loading">
       <div data-when="loading" data-rows="4"></div>                skeleton rows are drawn for you
       <div data-when="empty" class="s4-empty">…</div>
       <div data-when="error" class="s4-empty">… <button data-retry>Try Again</button></div>
       <div data-when="offline" class="s4-banner">…</div>           a part may belong to several states:
       <ul data-when="ready offline" class="s4-list">…</ul>         data-when="ready offline" shows the list under the banner
     </div>
   - S4.states.set(el, 'ready') switches; the part that arrives fades in. S4.states.get(el).
   - S4.states.load(el, promise): loading while it runs, then ready, or empty when it resolves to an empty list (or
     { empty: true }), or error when it rejects. Fires s4-state { state, previous } on the container.
   - [data-retry] inside fires s4-retry on the container (load again there).
   - data-offline="auto": when the device goes offline the container shows its offline parts, and returns when it is back.
   aria-busy is set while loading and changes are announced politely. Motion: State (a plain fade). */
(function () {
  var S4 = window.S4;
  function parts(el) { return Array.prototype.slice.call(el.querySelectorAll(':scope > [data-when]')); }
  function skeleton(part) {
    if (part.children.length || !part.hasAttribute('data-rows')) return;
    var n = Math.max(1, +part.getAttribute('data-rows') || 3), html = '';
    for (var i = 0; i < n; i++) html += '<div class="s4-states-row"><div class="s4-skeleton" data-shape="circle"></div><div class="s4-states-lines"><div class="s4-skeleton" data-shape="text"></div><div class="s4-skeleton" data-shape="text"></div></div></div>';
    part.innerHTML = html; part.setAttribute('aria-hidden', 'true');
  }
  function apply(el, state, animate) {
    var prev = el._s4state;
    el._s4state = state; el.setAttribute('data-state', state);
    if (state === 'loading') el.setAttribute('aria-busy', 'true'); else el.removeAttribute('aria-busy');
    parts(el).forEach(function (p) {
      var on = (' ' + p.getAttribute('data-when') + ' ').indexOf(' ' + state + ' ') >= 0, was = !p.hidden;
      if (on) skeleton(p);
      p.hidden = !on;
      if (on && !was && animate) S4.transition.fade(p, true);
    });
    if (prev !== state && animate) S4.util.emit(el, 's4-state', { state: state, previous: prev || null });
  }
  function set(el, state) { if (!el || el._s4state === state) return; el._s4base = state === 'offline' ? el._s4base : state; apply(el, state, true); }
  function load(el, promise) {
    set(el, 'loading');
    return Promise.resolve(promise).then(function (r) {
      var none = r && (r.empty === true || (Array.isArray(r) && !r.length));
      set(el, none ? 'empty' : 'ready'); return r;
    }, function (err) { set(el, 'error'); throw err; });
  }
  S4.states = { set: set, load: load, get: function (el) { return el._s4state || el.getAttribute('data-state'); } };

  function connection() {
    document.querySelectorAll('.s4-states[data-offline="auto"]').forEach(function (el) {
      if (navigator.onLine === false) apply(el, 'offline', true);
      else if (el._s4state === 'offline') apply(el, el._s4base || 'ready', true);
    });
  }
  window.addEventListener('offline', connection); window.addEventListener('online', connection);

  S4.register('states', function (scope) {
    S4.util.all(scope, '.s4-states').forEach(function (el) {
      if (!S4.util.once(el, 'states')) return;
      if (!el.hasAttribute('aria-live')) el.setAttribute('aria-live', 'polite');
      el._s4base = el.getAttribute('data-state') || 'ready';
      apply(el, el._s4base, false);
      el.addEventListener('click', function (e) { var r = e.target.closest('[data-retry]'); if (r && el.contains(r)) S4.util.emit(el, 's4-retry', {}); });
      if (el.getAttribute('data-offline') === 'auto' && navigator.onLine === false) apply(el, 'offline', false);
    });
  });
})();
