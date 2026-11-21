/* Board behaviour (decision 0063). For every .s4-board:
   - counts: each .s4-lane-count shows how many cards its lane holds ("4", or "4 / 3" when the lane has data-limit),
     the lane gets data-over past its limit, and the count's name is said in words. It follows every change.
   - add in place: a [data-lane-add] button at a lane's foot opens a draft (a field, Add and Cancel) in its place; Add
     fires s4-lane-add { value, lane, list } on the lane and the app makes the card. The field is not focused (0049):
     the person taps it. Escape or Cancel closes the draft and gives the button back.
   - keyboard: with focus on anything in a card, Alt+Up and Alt+Down move the card in its lane, Alt+Left and Alt+Right
     to the lane before or after (S4.reorder.move, so the app hears s4-reorder as for a drag). Dragging is
     components/direct (data-reorder, data-reorder-group). Each move is announced. */
S4.register('board', function (scope) {
  var live;
  function say(text) {
    if (!live) { live = document.createElement('div'); live.className = 's4-visually-hidden'; live.setAttribute('aria-live', 'polite'); document.body.appendChild(live); }
    live.textContent = ''; setTimeout(function () { live.textContent = text; }, 30);
  }
  function cards(list) { return [].filter.call(list.children, function (c) { return !c.hidden && !c.matches('[data-reorder-fixed], [data-lane-draft], .s4-reorder-gap'); }); }
  function count(lane) {
    var list = lane.querySelector('.s4-lane-items'), out = lane.querySelector('.s4-lane-count'); if (!list) return;
    var n = cards(list).length, limit = parseInt(lane.dataset.limit, 10), has = !isNaN(limit);
    lane.toggleAttribute('data-over', has && n > limit);
    if (!out) return;
    var text = has ? n + ' / ' + limit : String(n);
    if (out.textContent !== text) out.textContent = text;
    out.setAttribute('aria-label', n + (n === 1 ? ' card' : ' cards') + (has ? ', limit ' + limit + (n > limit ? ', over the limit' : '') : ''));
  }
  S4.util.all(scope, '.s4-board').forEach(function (board) {
    if (!S4.util.once(board, 'board')) return;
    var lanes = function () { return [].slice.call(board.querySelectorAll('.s4-lane')); };
    lanes().forEach(count);
    var queued = false;
    new MutationObserver(function () {
      if (queued) return; queued = true;
      Promise.resolve().then(function () { queued = false; lanes().forEach(count); });
    }).observe(board, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-limit', 'hidden'] });

    /* add in place */
    board.addEventListener('click', function (e) {
      var add = e.target.closest('[data-lane-add]'); if (!add || !board.contains(add)) return;
      var lane = add.closest('.s4-lane'), list = lane && lane.querySelector('.s4-lane-items'); if (!list) return;
      var title = lane.querySelector('.s4-lane-title'), what = (add.textContent || '').trim() || 'Add';
      var li = document.createElement('li'); li.setAttribute('data-lane-draft', ''); li.setAttribute('data-reorder-fixed', '');
      var id = 's4-lane-draft-' + Math.random().toString(36).slice(2, 8);
      li.innerHTML = '<form class="s4-lane-draft"><div class="s4-text-field"><input id="' + id + '" name="title" autocomplete="off" required></div>' +
        '<div class="s4-row"><button class="s4-button" data-variant="text" data-size="s" type="button" data-lane-cancel>Cancel</button><button class="s4-button" data-variant="filled" data-size="s" type="submit">Add</button></div></form>';
      var input = li.querySelector('input');
      input.setAttribute('aria-label', what + (title ? ' to ' + title.textContent.trim() : ''));
      input.placeholder = add.getAttribute('data-lane-add') || 'Title';
      list.appendChild(li); add.hidden = true;
      var close = function () { li.remove(); add.hidden = false; add.focus(); };
      li.querySelector('[data-lane-cancel]').addEventListener('click', close);
      li.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); close(); } });
      li.querySelector('form').addEventListener('submit', function (ev) {
        ev.preventDefault();
        var v = input.value.trim(); if (!v) return;
        li.remove(); add.hidden = false;
        S4.util.emit(lane, 's4-lane-add', { value: v, lane: lane, list: list });
        say((title ? title.textContent.trim() + ': ' : '') + 'added ' + v);
      });
    });

    /* keyboard: Alt and the arrow keys move the card that holds the focus */
    board.addEventListener('keydown', function (e) {
      if (!e.altKey || e.ctrlKey || e.metaKey || !/^Arrow(Up|Down|Left|Right)$/.test(e.key) || !S4.reorder) return;
      var list = e.target.closest('.s4-lane-items'); if (!list || !board.contains(list)) return;
      var item = e.target; while (item && item.parentElement !== list) item = item.parentElement;
      if (!item || item.matches('[data-reorder-fixed], [data-lane-draft]')) return;
      if (e.target.matches('input, textarea, select, [contenteditable]')) return;
      var lists = lanes().map(function (l) { return l.querySelector('.s4-lane-items'); }).filter(Boolean);
      var rtl = getComputedStyle(board).direction === 'rtl', li = lists.indexOf(list), i = cards(list).indexOf(item), to = null, toList = list;
      var back = rtl ? 'ArrowRight' : 'ArrowLeft', fwd = rtl ? 'ArrowLeft' : 'ArrowRight';
      if (e.key === 'ArrowUp' && i > 0) to = i - 1;
      else if (e.key === 'ArrowDown' && i < cards(list).length - 1) to = i + 1;
      else if (e.key === back && li > 0) { toList = lists[li - 1]; to = Math.min(i, cards(toList).length); }
      else if (e.key === fwd && li < lists.length - 1) { toList = lists[li + 1]; to = Math.min(i, cards(toList).length); }
      e.preventDefault();
      if (to == null) return;
      var focus = e.target, at = S4.reorder.move(item, to, toList);
      if (document.activeElement !== focus) focus.focus({ preventScroll: true });
      focus.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      var name = toList.getAttribute('aria-label') || '', head = item.querySelector('[data-reorder-label], .s4-card-title') || item;
      say(head.textContent.replace(/\s+/g, ' ').trim().slice(0, 60) + ', ' + (toList !== list && name ? name + ', ' : '') + 'position ' + (at + 1) + ' of ' + cards(toList).length);
    });
  });
});
