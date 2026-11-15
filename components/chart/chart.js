/* Charts (decision 0051): a small set of chart styles drawn from the tokens.
     <figure class="s4-chart" data-type="column" data-labels="Jun,Jul,Aug" data-values="820,640,910" data-format="currency:USD" data-name="Spending">
       <figcaption class="s4-chart-title">Spending By Month</figcaption>
     </figure>
   Several series: data-series='[{"name":"Income","values":[…]},{"name":"Spending","values":[…]}]' (or S4.chart(el, { labels, series })).
   Types: column, bar (sideways, for long labels and ranking), line, area, donut (parts of one whole, five at most),
   spark (a small line with no axes, for a stat).
   What every chart gets: clean axis ticks, hairline gridlines, thin marks, a legend when there are two or more series
   (never for one: the title names it), the value at the tip of what the story is about, a tooltip on hover, tap or
   arrow keys, and a "Table" button that shows the same numbers as a table.
   Color: one series wears the accent (primary); several wear --s4-chart-1 … 6 in fixed order (never more than six:
   group the rest as "Other"). Text is never colored like its series.
   S4.chart(el, data?) draws or redraws; charts redraw themselves when their box changes size. */
(function () {
  var S4 = window.S4, NS = 'http://www.w3.org/2000/svg', uid = 0;
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function formatter(spec, compact) {
    var p = String(spec || 'number').split(':'), o = p[0] === 'currency' ? { style: 'currency', currency: p[1] || 'USD', maximumFractionDigits: compact ? 0 : 2 } : p[0] === 'percent' ? { style: 'percent', maximumFractionDigits: 1 } : { maximumFractionDigits: 2 };
    if (compact && p[0] !== 'percent') { o.notation = 'compact'; o.maximumFractionDigits = 1; }
    var nf; try { nf = new Intl.NumberFormat(document.documentElement.lang || undefined, o); } catch (e) { nf = new Intl.NumberFormat(); }
    return function (v) { return nf.format(v); };
  }
  /* round axis: 0 and three or four clean steps above the largest value */
  function ticks(max) {
    if (!(max > 0)) return [0, 1];
    var raw = max / 4, pow = Math.pow(10, Math.floor(Math.log10(raw))), n = raw / pow, step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * pow, out = [];
    for (var v = 0; v < max + step * 0.999; v += step) out.push(+v.toPrecision(12));
    return out;
  }
  function read(el) {
    var d = el._s4data;
    if (!d) {
      d = { labels: (el.getAttribute('data-labels') || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean) };
      if (el.hasAttribute('data-series')) { try { d.series = JSON.parse(el.getAttribute('data-series')); } catch (e) { d.series = []; } }
      else d.series = [{ name: el.getAttribute('data-name') || '', values: (el.getAttribute('data-values') || '').split(',').map(Number) }];
    }
    d.series = (d.series || []).slice(0, 6).map(function (s) { return { name: s.name || '', values: (s.values || []).map(function (v) { return +v || 0; }) }; });
    return d;
  }
  function color(i, n) { return n === 1 ? 'var(--md-sys-color-primary)' : 'var(--s4-chart-' + (i + 1) + ')'; }
  function svgEl(tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
  /* a column with a rounded data end and a square foot */
  function column(x, y, w, h, r) { r = Math.min(r, w / 2, h); return 'M' + x + ' ' + (y + h) + 'V' + (y + r) + 'q0 ' + (-r) + ' ' + r + ' ' + (-r) + 'h' + (w - 2 * r) + 'q' + r + ' 0 ' + r + ' ' + r + 'V' + (y + h) + 'Z'; }
  function barH(x, y, w, h, r) { r = Math.min(r, h / 2, w); return 'M' + x + ' ' + y + 'h' + (w - r) + 'q' + r + ' 0 ' + r + ' ' + r + 'v' + (h - 2 * r) + 'q0 ' + r + ' ' + (-r) + ' ' + r + 'H' + x + 'Z'; }

  function draw(el, data) {
    if (data) el._s4data = data;
    var d = read(el), type = el.getAttribute('data-type') || 'column', n = d.series.length;
    var fmt = formatter(el.getAttribute('data-format')), short = formatter(el.getAttribute('data-format'), true);
    var plot = el.querySelector(':scope > .s4-chart-plot');
    if (!plot) {
      plot = document.createElement('div'); plot.className = 's4-chart-plot'; el.appendChild(plot);
      var tip = document.createElement('div'); tip.className = 's4-chart-tip'; tip.hidden = true; tip.setAttribute('role', 'status'); el.appendChild(tip);
    }
    var tipEl = el.querySelector(':scope > .s4-chart-tip');
    var title = el.querySelector('.s4-chart-title'), name = el.getAttribute('aria-label') || (title ? title.textContent.trim() : 'Chart');
    var W = Math.max(120, Math.round(plot.clientWidth || el.clientWidth || 320)), spark = type === 'spark';
    var H = spark ? Math.max(24, Math.round(plot.clientHeight || 32)) : type === 'donut' ? Math.min(W, 200) : type === 'bar' ? Math.max(60, d.labels.length * 36 + 28) : Math.round(Math.max(160, Math.min(260, W * 0.5)));
    plot.textContent = '';
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, role: 'img', 'aria-label': name + '. ' + summary(d, fmt), tabindex: spark ? '-1' : '0' }, plot);
    var max = Math.max.apply(null, [0].concat.apply([0], d.series.map(function (s) { return s.values; })));
    var hits = [];   /* { x, y, w, h, i (label index), s (series index or -1 for all) } */

    if (type === 'donut') {
      var vals = d.series[0].values.slice(0, 5), total = vals.reduce(function (a, b) { return a + b; }, 0) || 1, r = H / 2 - 12, cx = W / 2, cy = H / 2, at = -90, gap = vals.length > 1 ? 2 : 0;
      svgEl('circle', { cx: cx, cy: cy, r: r, class: 's4-chart-track' }, svg);
      vals.forEach(function (v, i) {
        var sweep = v / total * 360, a0 = at + gap / 2, a1 = at + sweep - gap / 2; at += sweep;
        if (a1 <= a0) return;
        var p = function (a) { var t = a * Math.PI / 180; return (cx + r * Math.cos(t)).toFixed(2) + ' ' + (cy + r * Math.sin(t)).toFixed(2); };
        var seg = svgEl('path', { d: 'M' + p(a0) + 'A' + r + ' ' + r + ' 0 ' + (a1 - a0 > 180 ? 1 : 0) + ' 1 ' + p(a1), class: 's4-chart-arc', style: 'stroke:' + color(i, Math.max(2, vals.length)) }, svg);
        seg.dataset.i = i;
      });
      var c1 = svgEl('text', { x: cx, y: cy - 2, class: 's4-chart-total', 'text-anchor': 'middle' }, svg); c1.textContent = short(total);
      var c2 = svgEl('text', { x: cx, y: cy + 16, class: 's4-chart-axis', 'text-anchor': 'middle' }, svg); c2.textContent = el.getAttribute('data-total-label') || 'Total';
      legend(el, d.labels.slice(0, 5).map(function (l, i) { return { name: l + ' · ' + fmt(vals[i]), color: color(i, Math.max(2, vals.length)) }; }));
      svg.addEventListener('pointermove', function (e) { var t = e.target.closest('.s4-chart-arc'); if (t) show(el, tipEl, d.labels[t.dataset.i], [{ name: '', value: fmt(vals[t.dataset.i]) + ' · ' + Math.round(vals[t.dataset.i] / total * 100) + '%', color: color(+t.dataset.i, Math.max(2, vals.length)) }], e); else hide(tipEl); });
      svg.addEventListener('pointerleave', function () { hide(tipEl); });
      table(el, d, fmt, name);
      return;
    }

    var tk = ticks(max), top = tk[tk.length - 1];
    var padL = spark ? 2 : type === 'bar' ? Math.min(W * 0.4, Math.max.apply(null, d.labels.map(function (l) { return l.length; }).concat(4)) * 7 + 12) : Math.max.apply(null, tk.map(function (t) { return short(t).length; })) * 7 + 10;
    var padR = spark ? 6 : 14, padT = spark ? 4 : 18, padB = spark ? 4 : type === 'bar' ? 22 : 24;
    var pw = W - padL - padR, ph = H - padT - padB, count = d.labels.length || d.series[0].values.length;

    if (type === 'bar') {
      var band = ph / count, bh = Math.min(24, band - 8);
      tk.forEach(function (t) { var x = padL + t / top * pw; svgEl('line', { x1: x, x2: x, y1: padT, y2: padT + ph, class: 's4-chart-grid' }, svg); var tx = svgEl('text', { x: x, y: H - 6, class: 's4-chart-axis', 'text-anchor': 'middle' }, svg); tx.textContent = short(t); });
      d.series[0].values.forEach(function (v, i) {
        var y = padT + i * band + (band - bh) / 2, w = Math.max(1, v / top * pw);
        svgEl('path', { d: barH(padL, y, w, bh, 4), class: 's4-chart-mark', style: 'fill:' + color(0, 1), 'data-i': i }, svg);
        var lx = svgEl('text', { x: padL - 8, y: y + bh / 2 + 4, class: 's4-chart-axis', 'text-anchor': 'end' }, svg); lx.textContent = d.labels[i] || '';
        var room = pw - w > short(v).length * 7 + 10;
        var vx = svgEl('text', { x: room ? padL + w + 6 : padL + w - 6, y: y + bh / 2 + 4, class: room ? 's4-chart-value' : 's4-chart-value s4-chart-value-in', 'text-anchor': room ? 'start' : 'end' }, svg); vx.textContent = short(v);
        hits.push({ x: padL, y: padT + i * band, w: pw, h: band, i: i, ax: padL + w, ay: y + bh / 2 });
      });
    } else {
      /* gridlines and the y axis */
      if (!spark) tk.forEach(function (t) {
        var y = padT + ph - t / top * ph;
        svgEl('line', { x1: padL, x2: W - padR, y1: y, y2: y, class: 's4-chart-grid' }, svg);
        var tx = svgEl('text', { x: padL - 8, y: y + 4, class: 's4-chart-axis', 'text-anchor': 'end' }, svg); tx.textContent = short(t);
      });
      var lineLike = type !== 'column', band2 = pw / (lineLike ? Math.max(1, count - 1) : count);
      var X = function (i) { return lineLike ? padL + (count > 1 ? i * band2 : pw / 2) : padL + i * band2 + band2 / 2; };
      /* a spark shows direction, not size: it uses the full height between its lowest and highest value */
      var lo = spark ? Math.min.apply(null, d.series[0].values) : 0, span = spark ? (max - lo) || 1 : top;
      var Y = function (v) { return padT + ph - (span ? (v - lo) / span : 0) * ph; };
      /* x labels: as many as fit */
      if (!spark) { var every = Math.max(1, Math.ceil(count / Math.max(1, Math.floor(pw / 56)))); d.labels.forEach(function (l, i) { if (i % every) return; var tx = svgEl('text', { x: X(i), y: H - 6, class: 's4-chart-axis', 'text-anchor': lineLike && i === 0 ? 'start' : lineLike && i === count - 1 ? 'end' : 'middle' }, svg); tx.textContent = l; }); }
      if (!lineLike) {
        var gw = Math.min(24 * n + 2 * (n - 1), band2 - 8), bw = (gw - 2 * (n - 1)) / n;
        d.series.forEach(function (s, si) { s.values.forEach(function (v, i) {
          var h = Math.max(1, (top ? v / top : 0) * ph), x = X(i) - gw / 2 + si * (bw + 2);
          svgEl('path', { d: column(x, padT + ph - h, bw, h, 4), class: 's4-chart-mark', style: 'fill:' + color(si, n), 'data-i': i }, svg);
        }); });
        /* one value on the cap: the tallest column of a single series */
        if (n === 1) { var vs = d.series[0].values, hi = vs.indexOf(Math.max.apply(null, vs)); var vt = svgEl('text', { x: X(hi), y: Y(vs[hi]) - 6, class: 's4-chart-value', 'text-anchor': 'middle' }, svg); vt.textContent = short(vs[hi]); }
        for (var i = 0; i < count; i++) hits.push({ x: padL + i * band2, y: padT, w: band2, h: ph, i: i, ax: X(i), ay: Y(Math.max.apply(null, d.series.map(function (s) { return s.values[i] || 0; }))) });
      } else {
        d.series.forEach(function (s, si) {
          var pts = s.values.map(function (v, i) { return X(i).toFixed(1) + ' ' + Y(v).toFixed(1); });
          if (type === 'area' && n === 1) svgEl('path', { d: 'M' + pts.join('L') + 'L' + X(s.values.length - 1) + ' ' + (padT + ph) + 'L' + X(0) + ' ' + (padT + ph) + 'Z', class: 's4-chart-area', style: 'fill:' + color(si, n) }, svg);
          svgEl('path', { d: 'M' + pts.join('L'), class: 's4-chart-line', style: 'stroke:' + color(si, n) }, svg);
          var last = s.values.length - 1;
          svgEl('circle', { cx: X(last), cy: Y(s.values[last]), r: spark ? 3 : 4, class: 's4-chart-dot', style: 'fill:' + color(si, n) }, svg);
          if (!spark && n === 1) { var et = svgEl('text', { x: X(last) - 8, y: Y(s.values[last]) - 10, class: 's4-chart-value', 'text-anchor': 'end' }, svg); et.textContent = short(s.values[last]); }
        });
        for (var j = 0; j < count; j++) hits.push({ x: X(j) - band2 / 2, y: padT, w: band2, h: ph, i: j, ax: X(j), ay: Y(Math.max.apply(null, d.series.map(function (s) { return s.values[j] || 0; }))) });
      }
    }
    if (spark) return;
    /* hover, tap and arrow keys share one "current point" */
    var cross = svgEl('line', { class: 's4-chart-cross', y1: padT, y2: padT + ph, x1: 0, x2: 0 }, svg); cross.style.display = 'none';
    var cur = -1;
    function point(i, ev) {
      cur = i; var h = hits[i]; if (!h) return leave();
      if (type !== 'bar') { cross.setAttribute('x1', h.ax); cross.setAttribute('x2', h.ax); cross.style.display = type === 'column' ? 'none' : ''; }
      svg.querySelectorAll('.s4-chart-mark').forEach(function (m) { m.toggleAttribute('data-dim', +m.dataset.i !== h.i); });
      var r = svg.getBoundingClientRect(), at = ev || { clientX: r.left + h.ax, clientY: r.top + h.ay };
      show(el, tipEl, d.labels[h.i] || '', d.series.map(function (s, si) { return { name: n > 1 ? s.name : '', value: fmt(s.values[h.i] || 0), color: color(si, n) }; }), at);
    }
    function leave() { cur = -1; cross.style.display = 'none'; svg.querySelectorAll('[data-dim]').forEach(function (m) { m.removeAttribute('data-dim'); }); hide(tipEl); }
    svg.addEventListener('pointermove', function (e) {
      var r = svg.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, hit = -1;
      hits.forEach(function (h, i) { if (x >= h.x && x <= h.x + h.w && y >= h.y - 8 && y <= h.y + h.h + 8) hit = i; });
      if (hit < 0) leave(); else point(hit, e);
    });
    svg.addEventListener('pointerleave', leave);
    svg.addEventListener('blur', leave);
    svg.addEventListener('keydown', function (e) {
      var prev = type === 'bar' ? 'ArrowUp' : 'ArrowLeft', next = type === 'bar' ? 'ArrowDown' : 'ArrowRight';
      if (e.key === next) { e.preventDefault(); point(Math.min(hits.length - 1, cur + 1)); }
      else if (e.key === prev) { e.preventDefault(); point(Math.max(0, cur < 0 ? 0 : cur - 1)); }
      else if (e.key === 'Home') { e.preventDefault(); point(0); } else if (e.key === 'End') { e.preventDefault(); point(hits.length - 1); }
      else if (e.key === 'Escape') leave();
    });
    legend(el, n > 1 ? d.series.map(function (s, si) { return { name: s.name, color: color(si, n) }; }) : []);
    table(el, d, fmt, name);
  }
  function summary(d, fmt) {
    return d.series.map(function (s) { var v = s.values; if (!v.length) return ''; return (s.name ? s.name + ': ' : '') + 'from ' + fmt(v[0]) + ' to ' + fmt(v[v.length - 1]) + ', highest ' + fmt(Math.max.apply(null, v)); }).join('; ');
  }
  function legend(el, items) {
    var lg = el.querySelector(':scope > .s4-chart-legend');
    if (!items.length) { if (lg) lg.remove(); return; }
    if (!lg) { lg = document.createElement('ul'); lg.className = 's4-chart-legend'; el.appendChild(lg); }
    lg.innerHTML = items.map(function (it) { return '<li><span class="s4-chart-key" style="background:' + it.color + '"></span>' + esc(it.name) + '</li>'; }).join('');
  }
  function show(el, tip, head, rows, ev) {
    tip.innerHTML = (head ? '<b>' + esc(head) + '</b>' : '') + rows.map(function (r) { return '<span><i style="background:' + r.color + '"></i>' + (r.name ? esc(r.name) + ' ' : '') + '<em>' + esc(r.value) + '</em></span>'; }).join('');
    tip.hidden = false;
    var box = el.getBoundingClientRect(), t = tip.getBoundingClientRect();
    var x = ev.clientX - box.left + 12, y = ev.clientY - box.top - t.height - 12;
    if (x + t.width > box.width) x = Math.max(0, ev.clientX - box.left - t.width - 12);
    if (y < 0) y = ev.clientY - box.top + 16;
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
  }
  function hide(tip) { tip.hidden = true; }
  /* the same numbers as a table, one tap away: for screen readers, for copying, for anyone who prefers rows */
  function table(el, d, fmt, name) {
    if (el.hasAttribute('data-no-table')) return;
    var wrap = el.querySelector(':scope > .s4-chart-table'), btn = el.querySelector(':scope > .s4-chart-toggle');
    if (!wrap) {
      var id = 's4-chart-t' + (++uid);
      btn = document.createElement('button'); btn.type = 'button'; btn.className = 's4-button s4-chart-toggle'; btn.dataset.variant = 'text'; btn.dataset.size = 'xs'; btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', id); btn.textContent = 'Table';
      wrap = document.createElement('div'); wrap.className = 's4-chart-table'; wrap.id = id; wrap.hidden = true;
      el.appendChild(btn); el.appendChild(wrap);
      btn.addEventListener('click', function () { var on = wrap.hidden; wrap.hidden = !on; btn.setAttribute('aria-expanded', String(on)); btn.textContent = on ? 'Chart' : 'Table'; el.toggleAttribute('data-table', on); });
    }
    var heads = d.series.length > 1 || d.series[0].name ? d.series.map(function (s) { return s.name || 'Value'; }) : ['Value'];
    wrap.innerHTML = '<table class="s4-table"><caption class="s4-visually-hidden">' + esc(name) + '</caption><thead><tr><th scope="col"></th>' + heads.map(function (h) { return '<th scope="col" class="num">' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      d.labels.map(function (l, i) { return '<tr><th scope="row">' + esc(l) + '</th>' + d.series.map(function (s) { return '<td class="num">' + esc(fmt(s.values[i] || 0)) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
  }
  S4.chart = function (el, data) { draw(el, data); };

  var ro = window.ResizeObserver ? new ResizeObserver(function (list) {
    list.forEach(function (x) { var el = x.target, w = Math.round(x.contentRect.width); if (el._s4w !== w) { el._s4w = w; draw(el); } });
  }) : null;
  S4.register('chart', function (scope) {
    S4.util.all(scope, '.s4-chart').forEach(function (el) {
      if (!S4.util.once(el, 'chart')) return;
      draw(el); el._s4w = Math.round(el.clientWidth);
      if (ro) ro.observe(el);
    });
  });
})();
