/* Timeline behaviour: <ol class="s4-timeline" data-now="0.2"><li data-start="0" data-end="0.25" data-state="…">.
   Adds each row's track and places its bar from data-start to data-end (0–1 of the whole span); data-now on the list
   places the marker. Keeps up when rows are redrawn or their numbers change. */
S4.register('timeline', function (scope) {
  function unit(v) { return String(Math.min(1, Math.max(0, +v || 0))); }
  function sync(list) {
    if (list.hasAttribute('data-now')) list.style.setProperty('--_now', unit(list.getAttribute('data-now')));
    if (!list.hasAttribute('role')) list.setAttribute('role', 'list');
    Array.prototype.forEach.call(list.children, function (li) {
      if (!li.querySelector(':scope > .s4-timeline-track')) li.insertAdjacentHTML('beforeend', '<span class="s4-timeline-track" aria-hidden="true"></span>');
      var a = unit(li.getAttribute('data-start')), b = unit(li.hasAttribute('data-end') ? li.getAttribute('data-end') : 1);
      li.style.setProperty('--_start', a); li.style.setProperty('--_end', +b < +a ? a : b);
    });
  }
  S4.util.all(scope, '.s4-timeline').forEach(function (list) {
    if (!S4.util.once(list, 'timeline')) return;
    sync(list);
    new MutationObserver(function () { sync(list); }).observe(list, { childList: true, attributes: true, subtree: true, attributeFilter: ['data-start', 'data-end', 'data-now'] });
  });
});
