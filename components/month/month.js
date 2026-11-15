/* Month behaviour: <div class="s4-month" data-month="2026-11" data-marks='{"2026-11-20":"dot"}' …>.
   Draws the title, the previous and next buttons, the weekday row, the days (buttons) and, with data-legend, the key.
     data-month        "YYYY-MM" (default: this month)
     data-marks        JSON: { "YYYY-MM-DD": "dot" | "band" | "flag" | "dot band" }
     data-mark-labels  JSON: { dot: "Course Due", band: "Busy", flag: "Deadline", today: "Today" } (read out and in the key)
     data-today        "YYYY-MM-DD" (default: the real today)        data-week-start  0 Sunday (default), 1 Monday
     data-min / data-max  "YYYY-MM": the first and last month you can page to
   Tapping a day presses it (one at a time) and fires s4-select { date, marks }; paging fires s4-month { month }.
   S4.month.set(el, { month, marks, today }) changes any of them; S4.month.select(el, 'YYYY-MM-DD') presses a day. */
S4.register('month', function (scope) {
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(y, m, d) { return y + '-' + pad(m + 1) + '-' + pad(d); }
  function json(el, name) { try { return JSON.parse(el.getAttribute(name) || '{}') || {}; } catch (e) { return {}; } }
  function ym(el) {
    var m = /^(\d{4})-(\d{1,2})/.exec(el.getAttribute('data-month') || ''), now = new Date();
    return m ? { y: +m[1], m: +m[2] - 1 } : { y: now.getFullYear(), m: now.getMonth() };
  }
  function lang(el) { return (el.closest('[lang]') || document.documentElement).lang || undefined; }
  function fmt(el, opts, date) { try { return new Intl.DateTimeFormat(lang(el), opts).format(date); } catch (e) { return new Intl.DateTimeFormat(undefined, opts).format(date); } }

  function draw(el, dir) {
    var at = ym(el), marks = json(el, 'data-marks'), labels = json(el, 'data-mark-labels'), start = +el.getAttribute('data-week-start') === 1 ? 1 : 0;
    var now = new Date(), today = el.getAttribute('data-today') || iso(now.getFullYear(), now.getMonth(), now.getDate());
    var first = new Date(at.y, at.m, 1), days = new Date(at.y, at.m + 1, 0).getDate(), lead = (first.getDay() - start + 7) % 7;
    var picked = el.getAttribute('data-selected') || '', html = '', i;
    if (!el.querySelector(':scope > .s4-month-head')) {
      el.innerHTML = '<div class="s4-month-head"><h3 class="s4-month-title" aria-live="polite"></h3>' +
        '<button class="s4-icon-button" type="button" data-month-step="-1"><span class="s4-icon" data-icon="chevron-left"></span></button>' +
        '<button class="s4-icon-button" type="button" data-month-step="1"><span class="s4-icon" data-icon="chevron-right"></span></button></div>' +
        '<div class="s4-month-body"><div class="s4-month-grid"></div></div>';
      if (!el.hasAttribute('role')) el.setAttribute('role', 'group');
    }
    var prev = el.querySelector('[data-month-step="-1"]'), next = el.querySelector('[data-month-step="1"]'), key = at.y + '-' + pad(at.m + 1);
    prev.setAttribute('aria-label', el.getAttribute('data-label-previous') || 'Previous Month');
    next.setAttribute('aria-label', el.getAttribute('data-label-next') || 'Next Month');
    prev.disabled = !!el.getAttribute('data-min') && key <= el.getAttribute('data-min');
    next.disabled = !!el.getAttribute('data-max') && key >= el.getAttribute('data-max');
    el.querySelector('.s4-month-title').textContent = fmt(el, { month: 'long', year: 'numeric' }, first);
    for (i = 0; i < 7; i++) html += '<span class="s4-month-weekday" aria-hidden="true">' + fmt(el, { weekday: 'narrow' }, new Date(2023, 0, 1 + start + i)) + '</span>';   /* Jan 1 2023 was a Sunday */
    for (i = 0; i < lead; i++) html += '<span></span>';
    function has(d, mark) { return d >= 1 && d <= days && (' ' + (marks[iso(at.y, at.m, d)] || '') + ' ').indexOf(' ' + mark + ' ') >= 0; }
    for (var d = 1; d <= days; d++) {
      var date = iso(at.y, at.m, d), m = String(marks[date] || '').trim(), col = (lead + d - 1) % 7, run = '';
      if (has(d, 'band')) {
        var before = col > 0 && has(d - 1, 'band'), after = col < 6 && has(d + 1, 'band');   /* a band never wraps a week */
        run = before && after ? 'mid' : before ? 'end' : after ? 'start' : 'single';
      }
      var words = [fmt(el, { weekday: 'long', month: 'long', day: 'numeric' }, new Date(at.y, at.m, d))];
      if (date === today) words.push(labels.today || 'Today');
      m.split(/\s+/).forEach(function (k) { if (k) words.push(labels[k] || k); });
      html += '<button class="s4-month-day" type="button" data-date="' + date + '"' + (m ? ' data-marks="' + m + '"' : '') + (run ? ' data-run="' + run + '"' : '') +
        (date === today ? ' data-today aria-current="date"' : '') + ' aria-pressed="' + (date === picked) + '" aria-label="' + words.join(', ').replace(/"/g, '&quot;') + '">' + d +
        (has(d, 'dot') ? '<span class="s4-month-dot"></span>' : '') + '</button>';
    }
    var grid = el.querySelector('.s4-month-grid');
    grid.innerHTML = html;
    if (dir && S4.transition) S4.transition.enter(grid, dir);
    var legend = el.querySelector(':scope > .s4-month-legend');
    if (el.hasAttribute('data-legend')) {
      var keys = ['today'].concat(Object.keys(labels).filter(function (k) { return k !== 'today'; }));
      var items = keys.map(function (k) { var t = document.createElement('span'); t.textContent = labels[k] || 'Today'; return '<li><span class="s4-month-key" data-mark="' + k.replace(/[^a-z]/g, '') + '"></span>' + t.innerHTML + '</li>'; }).join('');
      if (!legend) { legend = document.createElement('ul'); legend.className = 's4-month-legend'; el.appendChild(legend); }
      if (legend.innerHTML !== items) legend.innerHTML = items;
    } else if (legend) legend.remove();
    S4.init(el.querySelector('.s4-month-head'));
  }
  function step(el, by) {
    var at = ym(el), date = new Date(at.y, at.m + by, 1), month = date.getFullYear() + '-' + pad(date.getMonth() + 1);
    el._s4dir = by;
    el.setAttribute('data-month', month);
    S4.util.emit(el, 's4-month', { month: month });
  }
  function select(el, date) {
    if (date) el.setAttribute('data-selected', date); else el.removeAttribute('data-selected');
    S4.util.all(el, '.s4-month-day').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-date') === date)); });
  }

  S4.month = S4.month || {
    set: function (el, opts) {
      opts = opts || {};
      if (opts.marks) el.setAttribute('data-marks', JSON.stringify(opts.marks));
      if (opts.labels) el.setAttribute('data-mark-labels', JSON.stringify(opts.labels));
      if (opts.today) el.setAttribute('data-today', opts.today);
      if (opts.month) el.setAttribute('data-month', opts.month);
    },
    select: select,
    step: step
  };

  S4.util.all(scope, '.s4-month').forEach(function (el) {
    if (!S4.util.once(el, 'month')) return;
    draw(el);
    el.addEventListener('click', function (e) {
      var nav = e.target.closest('[data-month-step]'), day = e.target.closest('.s4-month-day');
      if (nav && el.contains(nav)) { step(el, +nav.getAttribute('data-month-step')); return; }
      if (!day || !el.contains(day)) return;
      var date = day.getAttribute('data-date'), on = day.getAttribute('aria-pressed') !== 'true';
      select(el, on ? date : '');
      S4.util.emit(el, 's4-select', { date: on ? date : null, marks: on ? (day.getAttribute('data-marks') || '').split(/\s+/).filter(Boolean) : [] });
    });
    /* arrow keys move between days, as in any grid of dates */
    el.addEventListener('keydown', function (e) {
      var day = e.target.closest && e.target.closest('.s4-month-day'); if (!day) return;
      var by = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key]; if (!by) return;
      var all = S4.util.all(el, '.s4-month-day'), to = all[all.indexOf(day) + by * (Math.abs(by) === 1 && getComputedStyle(el).direction === 'rtl' ? -1 : 1)];
      if (to) { e.preventDefault(); to.focus(); }
    });
    new MutationObserver(function () { var dir = el._s4dir || 0; el._s4dir = 0; draw(el, dir); })
      .observe(el, { attributes: true, attributeFilter: ['data-month', 'data-marks', 'data-mark-labels', 'data-today', 'data-week-start', 'data-legend'] });
  });
});
