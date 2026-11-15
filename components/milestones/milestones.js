/* Milestones behaviour: <ol class="s4-milestones"><li data-state="done|current" data-value="0.4" data-label="…">.
   Adds the marker to the current step (at its data-value, 0–1), names each step for screen readers and tooltips from
   data-label ("Algebra, you are here"), and keeps up when the list is redrawn or a step's state changes.
   data-here on the list sets the words for the marker (default "you are here"), data-done those for a finished step. */
S4.register('milestones', function (scope) {
  function sync(list) {
    var here = list.getAttribute('data-here') || 'you are here', done = list.getAttribute('data-done') || 'done';
    if (!list.hasAttribute('role')) list.setAttribute('role', 'list');
    Array.prototype.forEach.call(list.children, function (li) {
      var state = li.getAttribute('data-state'), mark = li.querySelector(':scope > .s4-milestones-here'), label = li.getAttribute('data-label');
      if (state === 'current') {
        var v = Math.min(1, Math.max(0, +li.getAttribute('data-value') || 0));
        li.style.setProperty('--_value', String(v));
        if (v < 0.04) li.setAttribute('data-at', 'start'); else if (v > 0.96) li.setAttribute('data-at', 'end'); else li.removeAttribute('data-at');
        if (!mark) li.insertAdjacentHTML('beforeend', '<span class="s4-milestones-here" aria-hidden="true"></span>');
        li.setAttribute('aria-current', 'step');
      } else {
        if (mark) mark.remove();
        li.removeAttribute('data-at'); li.removeAttribute('aria-current'); li.style.removeProperty('--_value');
      }
      if (label) {
        var text = label + (state === 'current' ? ', ' + here : state === 'done' ? ', ' + done : '');
        if (li.getAttribute('aria-label') !== text) { li.setAttribute('aria-label', text); li.title = text; }
      }
    });
  }
  S4.util.all(scope, '.s4-milestones').forEach(function (list) {
    if (!S4.util.once(list, 'milestones')) return;
    sync(list);
    new MutationObserver(function () { sync(list); }).observe(list, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-state', 'data-value', 'data-label'] });
  });
});
