/* Glass glow depth (decision 0080). The glow inside a glass edge reaches 15% of the surface's height, 3 to 12px. Orion's
   own short surfaces name their height from their size tokens (glass.css), so they need no script; a .s4-glass element of
   the app's own has no such token, so this measures it once it is laid out and again whenever its size changes. A
   ResizeObserver sees the layout size, never a transform, so a surface that pops or rises keeps its depth; a hidden one
   (0 tall) keeps the last value; nothing is animated. Without ResizeObserver it keeps the full depth. Not in the site
   bundle: a site's glass (the header's phone panel) is tall. */
(function () {
  var S4 = window.S4, ro = window.ResizeObserver && new ResizeObserver(function (list) {
    list.forEach(function (e) { var h = e.target.offsetHeight; if (h) e.target.style.setProperty('--_glass-h', h + 'px'); });
  });
  /* after the other inits of the same pass, since some add .s4-glass themselves; observing twice is a no-op */
  S4.register('glass', function (scope) { if (ro) requestAnimationFrame(function () { S4.util.all(scope, '.s4-glass').forEach(function (el) { ro.observe(el); }); }); });
})();
