/* Site behaviour (issue 53): the header's glass, the phone menu and docs panel, the pricing period, the comparison
   table on a phone, and the "on this page" contents that follow the reader.
   - .s4-site-header: data-scrolled while content is under it (glass.css turns it into glass).
   - .s4-site-menu-button: opens a floating glass panel (.s4-site-menu, made from the header's links and actions when
     the page has none) with Pop. Escape, a tap outside, choosing a link or growing past 840 close it; focus goes back
     to the button. It is a disclosure (aria-expanded), not a modal.
   - [data-site-panel="id"] on a button: the same for another panel (the docs sidebar on a phone).
   - [data-period] on a joined capsule group or a single-select chip set: each element with data-period-<value> in the same section shows that text.
   - .s4-compare: its button group (values 1..4) picks the plan column shown under 600.
   - .s4-toc: the link of the section being read gets aria-current="location". */
S4.register('site', function (scope) {
  var wide = window.matchMedia('(width >= 840px)');

  /* ---------- a floating panel opened by a button ---------- */
  function panel(button, el) {
    if (!S4.util.once(button, 'sitepanel')) return;
    if (!el.id) el.id = 's4-panel-' + Math.random().toString(36).slice(2, 8);
    button.setAttribute('aria-controls', el.id);
    button.setAttribute('aria-expanded', 'false');
    function isOpen() { return el.hasAttribute('data-open'); }
    function open() {
      if (isOpen()) return;
      el.setAttribute('data-open', '');
      button.setAttribute('aria-expanded', 'true');
      S4.transition.pop(el, { open: true });
      var first = el.querySelector('[aria-current]:not([aria-current="false"]), a[href], button:not([disabled])');
      if (first && !S4.util.typable(first)) first.focus({ preventScroll: true });
      document.addEventListener('pointerdown', outside, true);
      document.addEventListener('keydown', key);
    }
    function close(returnFocus) {
      if (!isOpen()) return;
      button.setAttribute('aria-expanded', 'false');
      document.removeEventListener('pointerdown', outside, true);
      document.removeEventListener('keydown', key);
      if (returnFocus) button.focus({ preventScroll: true });
      S4.transition.pop(el, { open: false }).then(function (done) {
        if (done && button.getAttribute('aria-expanded') === 'false') el.removeAttribute('data-open');
      });
    }
    function outside(e) { if (!el.contains(e.target) && !button.contains(e.target)) close(false); }
    function key(e) { if (e.key === 'Escape') { e.preventDefault(); close(true); } }
    button.addEventListener('click', function () { if (isOpen()) close(false); else open(); });
    el.addEventListener('click', function (e) { if (e.target.closest('a[href]')) close(false); });
    el.addEventListener('focusout', function (e) {
      if (e.relatedTarget && !el.contains(e.relatedTarget) && e.relatedTarget !== button) close(false);
    });
    wide.addEventListener('change', function () { if (wide.matches && isOpen()) { el.removeAttribute('data-open'); button.setAttribute('aria-expanded', 'false'); } });
  }

  /* ---------- header ---------- */
  S4.util.all(scope, '.s4-site-header').forEach(function (header) {
    if (!S4.util.once(header, 'siteheader')) return;
    var sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'display:block;height:0;margin:0;padding:0;border:0;flex:none';
    header.parentNode.insertBefore(sentinel, header);
    var queued = false;
    function update() { queued = false; header.toggleAttribute('data-scrolled', sentinel.getBoundingClientRect().top < -0.5); }
    window.addEventListener('scroll', function () { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
    update();

    var button = header.querySelector('.s4-site-menu-button');
    if (!button) return;
    var menu = button.getAttribute('aria-controls') && document.getElementById(button.getAttribute('aria-controls'));
    if (!menu) {
      /* made from the header's own links and actions. It sits after the header, not inside it: a glass panel inside the
         glass header would only blur the header */
      menu = document.createElement('nav');
      menu.className = 's4-site-menu';
      menu.setAttribute('aria-label', button.getAttribute('aria-label') || 'Menu');
      var links = header.querySelector('.s4-site-nav ul');
      if (links) {
        var ul = links.cloneNode(true);
        ul.className = 's4-site-menu-links';
        ul.querySelectorAll('.s4-button').forEach(function (b) { b.setAttribute('data-size', 'm'); });
        menu.appendChild(ul);
      }
      var actions = header.querySelector('.s4-site-actions');
      if (actions && actions.children.length) {
        var row = document.createElement('div');
        row.className = 's4-site-menu-actions';
        Array.prototype.forEach.call(actions.children, function (a) {
          if (a === button || a.classList.contains('s4-site-menu-button')) return;
          var c = a.cloneNode(true);
          c.removeAttribute('data-keep');
          c.removeAttribute('id');
          if (c.matches('.s4-button[data-variant="text"]')) c.setAttribute('data-variant', 'tonal');
          row.appendChild(c);
        });
        if (row.children.length) menu.appendChild(row);
      }
      header.parentNode.insertBefore(menu, header.nextSibling);
    }
    menu.classList.add('s4-glass');
    panel(button, menu);
  });

  /* ---------- other panels (the docs sidebar on a phone) ---------- */
  S4.util.all(scope, '[data-site-panel]').forEach(function (button) {
    var el = document.getElementById(button.getAttribute('data-site-panel'));
    if (!el) return;
    el.classList.add('s4-site-panel');
    panel(button, el);
  });

  /* ---------- pricing period ---------- */
  S4.util.all(scope, '[data-period]').forEach(function (group) {
    if (!S4.util.once(group, 'period')) return;
    function show(value) {
      var root = group.closest('[data-period-scope], .s4-site-section, main') || document;
      root.querySelectorAll('[data-period-' + value + ']').forEach(function (el) { el.textContent = el.getAttribute('data-period-' + value); });
    }
    group.addEventListener('s4-change', function (e) {
      if (e.detail && typeof e.detail.value === 'string') return show(e.detail.value);
      /* a single-select chip set works the same way: the pressed chip's value (a pack, a size, a plan) */
      var chip = e.target.closest && e.target.closest('.s4-chip[value]');
      if (chip && chip.getAttribute('aria-pressed') === 'true') show(chip.value);
    });
    var on = group.querySelector('[aria-pressed="true"][value]');
    if (on) show(on.value);
  });

  /* ---------- comparison table on a phone ---------- */
  S4.util.all(scope, '.s4-compare').forEach(function (c) {
    if (!S4.util.once(c, 'compare')) return;
    var group = c.querySelector(':scope > .s4-button-group');
    if (!group) return;
    var on = group.querySelector('[aria-pressed="true"][value]');
    if (on && !c.dataset.show) c.dataset.show = on.value;
    group.addEventListener('s4-change', function (e) { if (e.detail && e.detail.value) c.dataset.show = e.detail.value; });
  });

  /* ---------- on this page ---------- */
  S4.util.all(scope, '.s4-toc').forEach(function (toc) {
    if (!S4.util.once(toc, 'toc')) return;
    var links = Array.prototype.filter.call(toc.querySelectorAll('a[href^="#"]'), function (a) { return a.hash.length > 1 && document.getElementById(decodeURIComponent(a.hash.slice(1))); });
    if (!links.length) return;
    var targets = links.map(function (a) { return document.getElementById(decodeURIComponent(a.hash.slice(1))); });
    var queued = false;
    function update() {
      queued = false;
      var line = (parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0) + 8, current = 0;
      targets.forEach(function (t, i) { if (t.getBoundingClientRect().top <= line) current = i; });
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) current = targets.length - 1;
      links.forEach(function (a, i) { if (i === current) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
    }
    window.addEventListener('scroll', function () { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  });
});
