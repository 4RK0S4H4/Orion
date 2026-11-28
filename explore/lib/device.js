/* The device check pages (explore/device-*.html): one card per step from device-steps.js, built from Orion parts and
   the review kit (S4Review.card for the answers, S4Review.page for saving, the summary and Copy Answers).
   Page: <main id="dv"></main> … S4Device.render('device-iphone'). Layout lives in device.css; looks come from Orion. */
(function () {
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  /* the page was opened with ?v=<commit>: the pages it opens carry the same, so the phone shows the newest version too */
  function withVersion(href) {
    var v = (location.search.match(/[?&]v=([\w.-]+)/) || [])[1], i = href.indexOf('#');
    var path = i < 0 ? href : href.slice(0, i), hash = i < 0 ? '' : href.slice(i);
    return '../' + path + (v ? '?v=' + v : '') + hash;
  }

  function render(id) {
    var check = (window.S4_DEVICE_CHECKS || []).filter(function (c) { return c.id === id; })[0];
    if (!check) throw new Error('S4Device: no check "' + id + '" in device-steps.js');
    var main = document.getElementById('dv'), total = check.steps.length;

    var intro = el('section', 'dv-intro');
    intro.appendChild(el('p', null, check.intro));
    if (check.setup) {
      var setup = el('div', 'dv-setup');
      setup.appendChild(el('p', null, check.setup.text));
      var sl = el('a', 's4-button', check.setup.label); sl.dataset.variant = 'text'; sl.href = check.setup.href;
      setup.appendChild(sl);
      intro.appendChild(setup);
    }
    var meter = el('div', 's4-meter'); meter.dataset.max = String(total); meter.dataset.steps = String(total); meter.dataset.value = '0';
    meter.innerHTML = '<div class="s4-meter-head"><span class="s4-meter-label">Progress</span><span class="s4-meter-value"></span></div><div class="s4-meter-track"><i class="s4-meter-fill"></i></div>';
    intro.appendChild(meter);
    main.appendChild(intro);

    var notes = {};
    check.steps.forEach(function (s, i) {
      var sec = el('section', 'dv-step'); sec.id = 'step-' + s.id; sec.setAttribute('aria-labelledby', 'dv-h-' + s.id);
      var h = el('h2', null, (i + 1) + '. ' + s.title); h.id = 'dv-h-' + s.id;
      sec.appendChild(h);
      sec.appendChild(el('p', 'dv-todo', s.todo));
      var look = el('p', 'dv-look'); look.appendChild(el('b', null, 'Look For ')); look.appendChild(document.createTextNode(s.look));
      sec.appendChild(look);
      if (s.open) {
        var a = el('a', 's4-button', s.open.label); a.dataset.variant = 'tonal'; a.href = withVersion(s.open.href);
        var row = el('div', 'dv-open'); row.appendChild(a); sec.appendChild(row);
      }
      var g = el('div', 'rv-group dv-answers'); g.setAttribute('role', 'radiogroup'); g.setAttribute('aria-label', 'Step ' + (i + 1) + ': ' + s.title);
      g.appendChild(S4Review.card({ pick: s.id + ':Looks Right', title: 'Looks Right', desc: 'It did what the step says.' }));
      g.appendChild(S4Review.card({ pick: s.id + ':Problem', title: 'Problem', desc: 'Something looked or worked wrong.' }));
      sec.appendChild(g);
      var f = el('div', 's4-text-field dv-note'); f.hidden = true;
      f.innerHTML = '<textarea id="dv-note-' + s.id + '" rows="2"></textarea><label for="dv-note-' + s.id + '">What You Saw</label><div class="s4-text-field-supporting">Optional. Send a screenshot with your answers too.</div>';
      sec.appendChild(f);
      notes[s.id] = f;
      main.appendChild(sec);
    });

    var capture = {};
    check.steps.forEach(function (s) { capture[s.id + ':Problem'] = function () { return notes[s.id].querySelector('textarea').value.trim(); }; });
    var api = S4Review.page(id, { capture: capture, change: function (answers) {
      var done = 0, problems = 0;
      check.steps.forEach(function (s) {
        var a = answers[s.id], f = notes[s.id], ta = f.querySelector('textarea');
        if (a) done++;
        var problem = !!(a && a.v === 'Problem'); if (problem) problems++;
        f.hidden = !problem;
        if (document.activeElement !== ta) { if (problem) ta.value = a.extra || ''; else if (!a) ta.value = ''; }
      });
      meter.dataset.value = String(done);
      meter.querySelector('.s4-meter-value').innerHTML = '<strong>' + done + '</strong> of ' + total + ' checked' + (problems ? ', ' + problems + (problems === 1 ? ' problem' : ' problems') : '');
    } });
    check.steps.forEach(function (s) {
      notes[s.id].querySelector('textarea').addEventListener('input', function (e) { api.extra(s.id, e.target.value.trim()); });
    });
  }
  window.S4Device = { render: render };
})();
