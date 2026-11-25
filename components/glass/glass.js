/* Glass glow depth (decision 0080). The glow inside a glass edge reaches 15% of the surface's height, 3 to 12px. Orion's
   short surfaces name their least height from their size tokens in their own stylesheets, so the first paint needs no
   script. This measures the two whose height only layout knows: a .s4-glass element of the app's own (no token knows it)
   and a snackbar (its floor is the touch target, 48, or 32 in compact density; one line of text makes it 52). One
   ResizeObserver reads the layout height (offsetHeight: a pop or a rise is a transform and never changes it) once the
   surface is laid out and again when it changes size; a hidden surface keeps its last value, a removed one is let go,
   and nothing is animated. Not in the site bundle: a site's glass (the header's phone panel) is tall. */
(function () {
  var S4 = window.S4, ro = window.ResizeObserver && new ResizeObserver(function (list) {
    list.forEach(function (e) {
      var el = e.target, h = el.offsetHeight;
      if (!el.isConnected) ro.unobserve(el); else if (h) el.style.setProperty('--_glass-h', h + 'px');
    });
  });
  var snack = null;
  /* after the other inits of the same pass, since some add .s4-glass themselves; observing twice is a no-op. A snackbar
     lives in a host the auto-init skips, so S4.snackbar hands each one over as it is made (the same function, same result) */
  S4.register('glass', function (scope) {
    if (!ro) return;
    if (!snack && S4.snackbar) { snack = S4.snackbar; S4.snackbar = function () { var api = snack.apply(this, arguments); if (api && api.element) ro.observe(api.element); return api; }; }
    requestAnimationFrame(function () { S4.util.all(scope, '.s4-glass').forEach(function (el) { ro.observe(el); }); });
  });
})();
