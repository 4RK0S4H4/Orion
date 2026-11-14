/* Accordion behaviour (decision 0042).
   A click on a summary opens or closes its section on the calm reveal spring: the body's height grows from 0 (or
   shrinks to 0) while its text fades in, rising 4px, just behind. Items that share a name="…" close the others.
   data-closing on the <details> while it closes keeps the chevron in step (it bends back at the start). Reduced motion:
   the height change is instant; the fade stays. Fires s4-toggle { open } on the item. */
S4.register('accordion', function (scope) {
  S4.util.all(scope, '.s4-accordion').forEach(function (acc) {
    if (!S4.util.once(acc, 'accordion')) return;
    /* the browser's own name="…" exclusivity would snap the other item shut with no motion: the script takes it over */
    acc.querySelectorAll('.s4-accordion-item[name]').forEach(function (d) { d.dataset.name = d.getAttribute('name'); d.removeAttribute('name'); });
    function body(d) { return d.querySelector(':scope > .s4-accordion-body'); }
    function open(d) {
      var b = body(d); if (!b) { d.open = true; return; }
      d.removeAttribute('data-closing'); d.open = true;
      S4.transition.reveal(b, { open: true });
      S4.util.emit(d, 's4-toggle', { open: true });
    }
    function close(d) {
      var b = body(d); if (!b) { d.open = false; return; }
      d.setAttribute('data-closing', '');
      S4.transition.reveal(b, { open: false }).then(function (done) {
        if (!done || !d.hasAttribute('data-closing')) return;
        d.open = false; d.removeAttribute('data-closing'); S4.transition.restore(b);
      });
      S4.util.emit(d, 's4-toggle', { open: false });
    }
    acc.addEventListener('click', function (e) {
      var sum = e.target.closest('summary'); if (!sum || !acc.contains(sum)) return;
      var d = sum.parentElement; if (!d.matches('.s4-accordion-item')) return;
      e.preventDefault();
      var opening = !d.open || d.hasAttribute('data-closing');
      if (opening) {
        var name = d.dataset.name;
        if (name) acc.querySelectorAll('.s4-accordion-item[open]').forEach(function (o) { if (o !== d && o.dataset.name === name && !o.hasAttribute('data-closing')) close(o); });
        open(d);
      } else close(d);
    });
  });
});
