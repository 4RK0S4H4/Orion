/* Extended FAB: the label folds with data-collapsed by animating max-width. A fixed cap (20em) made the fold wait while
   the cap shrank down to the label's real width and then snap shut (and open the same way backwards), so the real width
   is measured and handed to the CSS as --_label-w. Re-measured when fonts load, when the label's text changes, and when a label first measured hidden is shown. */
S4.register('fab', function (scope) {
  S4.util.all(scope, '.s4-fab-label').forEach(function (label) {
    if (!S4.util.once(label, 'fabLabel')) return;
    function measure() {
      label.style.setProperty('--_label-w', 'none');
      var w = Math.max(label.scrollWidth, label.getBoundingClientRect().width);   /* scrollWidth rounds: a label 81.4 wide read as 81 and wrapped */
      if (w) label.style.setProperty('--_label-w', Math.ceil(w) + 'px'); else label.style.removeProperty('--_label-w');
    }
    measure();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    new MutationObserver(measure).observe(label, { childList: true, characterData: true, subtree: true });
    var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(function () { var f = label.closest('.s4-fab'); if (!f || !f.hasAttribute('data-collapsed')) measure(); }, 100); });   /* text size or window changed */
    if (window.ResizeObserver) new ResizeObserver(function () { if (!label.style.getPropertyValue('--_label-w')) measure(); }).observe(label);   /* first shown (it was in a hidden view) */
  });
});
