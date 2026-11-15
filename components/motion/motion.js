/* S4 Orion motion patterns in script (decision 0046, one motion philosophy; builds on 0022 and 0042).
   Components never call element.animate or pick a spring themselves: they name a pattern here (npm run check:motion).
     Reveal   S4.transition.reveal(el, { open })               content opens in place and pushes what is below; what is inside follows
     Follow   S4.transition.follow(menu, { open })             anchored glass (menus, pickers): fades in where it sits, items follow
     Pop      S4.transition.pop(surface, { open })             floating glass (dialogs, panels): rises 16px and fades in
              S4.transition.scrim(dialog, open)                the dimmed page behind a modal fades with it
     Rise     S4.transition.rise(el, { open })                 notices (snackbars, a new message): rise 14px and fade in
              S4.transition.tip(el, { open })                  the small rise (tooltips): 4px
     Switch   S4.transition.sharedAxis(outView, inView, dir)   sibling views (tabs, destinations, steps)
              S4.transition.enter(view, dir)                   one view arriving on its own (a pane, a month)
     Morph    S4.transition.move(el, dx, dy)                   a thing lands in a new place (rows after a sort)
     State    S4.transition.fade(el, open)                     a plain fade, when nothing moves
   Rules that keep it robust in every browser:
     - surfaces that appear only move (transform) and fade (opacity); reveal is the one pattern that sizes a box, and
       only the box being opened;
     - nothing is cloned; glass is glass from the first frame;
     - each element runs one transition at a time: a new one starts from where the old one was showing;
     - under reduced motion everything that moves takes 0ms and only fades remain.
   Each returns a Promise (true when it finished, false when a newer transition replaced it).
   drop(), slide(), containerTransform() and unfold() are old names kept so existing apps keep working. */
(function () {
  var S4 = window.S4, M = S4.motion;

  /* end what an element is running and report what it shows right now, so the next transition starts from there */
  function begin(el) {
    var running = (el._s4anims || []).filter(function (a) { return a.playState === 'running'; });
    var now = null;
    if (running.length) { var cs = getComputedStyle(el); now = { opacity: cs.opacity, transform: cs.transform }; }
    (el._s4anims || []).forEach(function (a) { a.cancel(); });
    el._s4anims = [];
    return now;
  }
  function track(el, anim) { el._s4anims.push(anim); return anim; }
  function settle(el, anims, keep) {
    return Promise.all(anims.map(function (a) { return a.finished; })).then(function () {
      if (!keep) anims.forEach(function (a) { a.cancel(); });   /* opened: the element's own styles take over */
      return true;
    }, function () { return false; });
  }
  /* move + fade on two springs: movement on a spatial spring, opacity on an effects spring (never overshoots) */
  function moveFade(el, open, offTransform, springs) {
    var now = begin(el);
    var shown = { opacity: '1', transform: 'none' }, hidden = { opacity: '0', transform: offTransform };
    var start = now || (open ? hidden : shown), end = open ? shown : hidden;
    var t = track(el, M.animate(el, [{ transform: start.transform }, { transform: end.transform }], springs[0]));
    var o = track(el, M.animate(el, [{ opacity: start.opacity }, { opacity: end.opacity }], springs[1]));
    return settle(el, [t, o], !open);
  }

  /* ---------- pop: dialogs and the phone sheet card ---------- */
  function pop(el, opts) {
    var open = !opts || opts.open !== false, d = M.reduced() ? 0 : 16;
    /* axis 'x': a floating panel at the side arrives from its side (decision 0043); sign follows the writing direction */
    var x = opts && opts.axis === 'x', sign = x && getComputedStyle(el).direction === 'rtl' ? -1 : 1;
    return moveFade(el, open, (x ? 'translateX(' : 'translateY(') + (sign * (open ? d : d / 2)) + 'px)', open ? ['spatial', 'effects'] : ['fast-effects', 'fast-effects']);
  }

  /* ---------- drop: menus (0042: not out of the button; the glass fades in place, the items follow) ---------- */
  function drop(el, opts) {
    opts = opts || {};
    var open = opts.open !== false, now = begin(el);
    var items = Array.prototype.slice.call(el.querySelectorAll(':scope > .s4-menu-item, :scope > .s4-menu-label, :scope > .s4-menu-divider, :scope > hr'));
    items.forEach(function (it) { it.getAnimations().forEach(function (a) { a.cancel(); }); });
    var o = track(el, M.animate(el, [{ opacity: now ? now.opacity : (open ? 0 : 1) }, { opacity: open ? 1 : 0 }], open ? 'slow-effects' : 'fast-effects'));
    var anims = [o];
    if (open && !now) {
      var d = M.reduced() ? 0 : 4;
      items.forEach(function (it, i) {
        anims.push(track(el, M.animate(it, [{ opacity: 0, transform: 'translateY(' + d + 'px)' }, { opacity: 1, transform: 'none' }], 'settle', { fill: 'backwards', delay: 30 + i * 25 })));
      });
    }
    return settle(el, anims, !open);
  }

  /* ---------- rise: snackbars (0042) ---------- */
  function rise(el, opts) {
    var open = !opts || opts.open !== false, d = M.reduced() ? 0 : (open ? 14 : 10);
    return moveFade(el, open, 'translateY(' + d + 'px)', open ? ['rise', 'effects'] : ['fast-effects', 'fast-effects']);
  }

  /* ---------- tip: tooltips (0042) ---------- */
  function tip(el, opts) {
    var open = !opts || opts.open !== false, d = M.reduced() ? 0 : 4;
    return moveFade(el, open, 'translateY(' + (opts && opts.from === 'bottom' ? -d : d) + 'px)', open ? ['tip', 'fast-effects'] : ['fast-effects', 'fast-effects']);
  }

  /* ---------- fade ---------- */
  function fade(el, open) {
    open = open !== false;
    var now = begin(el);
    var a = track(el, M.animate(el, [{ opacity: now ? now.opacity : (open ? 0 : 1) }, { opacity: open ? 1 : 0 }], open ? 'effects' : 'fast-effects'));
    return settle(el, [a], !open);
  }

  /* ---------- reveal: content opens in place (accordion, inline expand, disclosure, a chip leaving its set) ----------
     The box grows from nothing on the calm reveal spring and pushes what is below it; its children fade in just behind,
     each rising 4px. Closing shrinks it back; the end state is held until the caller hides it and calls restore().
     axis 'x' closes a thing sideways out of a row (width, side padding and the gap after it). */
  function reveal(el, opts) {
    opts = opts || {};
    var open = opts.open !== false, x = opts.axis === 'x';
    var running = (el._s4anims || []).some(function (a) { return a.playState === 'running'; });
    var r = el.getBoundingClientRect(), from = running || !open ? (x ? r.width : r.height) : 0;
    begin(el);
    el.style.overflow = 'hidden';
    var anims = [], kids = Array.prototype.slice.call(el.children.length ? el.children : []);
    if (x) {
      var cs = getComputedStyle(el), gap = opts.gap || 0;
      anims.push(track(el, M.animate(el, [
        { width: from + 'px', paddingLeft: cs.paddingLeft, paddingRight: cs.paddingRight, opacity: 1, marginInlineEnd: '0px' },
        { width: '0px', paddingLeft: '0px', paddingRight: '0px', opacity: 0, marginInlineEnd: -gap + 'px' }], 'fast-spatial-calm')));
    } else {
      var to = open ? el.scrollHeight : 0;
      anims.push(track(el, M.animate(el, [{ height: from + 'px' }, { height: to + 'px' }], 'reveal')));
      if (open && !running) kids.forEach(function (c) {
        anims.push(track(el, M.animate(c, [{ opacity: 0, transform: 'translateY(' + (M.reduced() ? 0 : -4) + 'px)' }, { opacity: 1, transform: 'none' }], 'settle', { fill: 'backwards', delay: 40 })));
      });
    }
    return settle(el, anims, !open).then(function (done) { if (done && open) el.style.overflow = ''; return done; });
  }

  /* ---------- scrim: the page behind a modal dims with it ---------- */
  function scrim(dialog, open) {
    open = open !== false;
    var s = M.spring(open ? 'effects' : 'fast-effects');
    return dialog.animate([{ opacity: open ? 0 : 1 }, { opacity: open ? 1 : 0 }], { duration: s.duration, easing: s.easing, pseudoElement: '::backdrop', fill: open ? 'none' : 'forwards' });
  }

  /* ---------- enter: one view arriving on its own (the second half of a switch) ---------- */
  function enter(el, dir, opts) {
    var now = begin(el);
    var dist = M.reduced() || !dir ? 0 : ((opts && opts.distance) || parseFloat(S4.util.css('--s4-motion-pattern-shared-axis-distance')) || 30);
    var d = dist * (dir < 0 ? -1 : 1) * (getComputedStyle(el).direction === 'rtl' ? -1 : 1);
    var t = track(el, M.animate(el, [{ transform: now ? now.transform : 'translateX(' + d + 'px)' }, { transform: 'none' }], 'spatial'));
    var o = track(el, M.animate(el, [{ opacity: now ? now.opacity : 0 }, { opacity: 1 }], 'effects'));
    return settle(el, [t, o], false);
  }

  /* ---------- move: a thing lands in a new place (FLIP). dx, dy: where it was, measured from where it is now ---------- */
  function move(el, dx, dy) {
    begin(el);
    if (!dx && !dy) return Promise.resolve(true);
    var a = track(el, M.animate(el, [{ transform: 'translate(' + (dx || 0) + 'px, ' + (dy || 0) + 'px)' }, { transform: 'none' }], 'settle'));
    return settle(el, [a], false);
  }

  /* ---------- shared axis: switching sibling views ----------
     The old view slides 30px away and fades out, then the new one slides in from the side you're heading and fades in.
     onSwap (optional) runs at the moment of the swap. dir 1 = forward, -1 = back. state: kept per container so an
     interrupted switch is cancelled cleanly. */
  function sharedAxis(from, to, dir, state, onSwap) {
    state = state || {};
    (state.anims || []).forEach(function (a) { a.cancel(); });
    state.anims = [];
    var dist = M.reduced() ? 0 : (parseFloat(S4.util.css('--s4-motion-pattern-shared-axis-distance')) || 0);
    var d = dist * (dir < 0 ? -1 : 1) * (to && getComputedStyle(to).direction === 'rtl' ? -1 : 1);
    return new Promise(function (resolve) {
      var enter = function () {
        if (from && from !== to) from.hidden = true;
        if (onSwap) onSwap();
        if (!to) return resolve();
        to.hidden = false;
        var move = M.animate(to, [{ transform: 'translateX(' + d + 'px)' }, { transform: 'none' }], 'spatial');
        var show = M.animate(to, [{ opacity: 0 }, { opacity: 1 }], 'effects');
        state.anims = [move, show];
        Promise.all([move.finished, show.finished]).then(function () { move.cancel(); show.cancel(); resolve(); }, resolve);
      };
      if (!from || from.hidden || from === to) return enter();
      var out = M.animate(from, [{ transform: 'none' }, { transform: 'translateX(' + (-d) + 'px)' }], 'fast-effects');
      var hide = M.animate(from, [{ opacity: 1 }, { opacity: 0 }], 'fast-effects');
      state.anims = [out, hide];
      hide.finished.then(function () { out.cancel(); hide.cancel(); enter(); }, resolve);
    });
  }

  /* after a surface is hidden: drop any held end state so the next open starts clean */
  function restore(surface, source) {
    begin(surface);
    surface.style.visibility = ''; surface.style.overflow = '';
    if (source) source.style.visibility = '';
  }

  /* how long a named spring runs, for things that are timed but are not a transition (a number counting up) */
  function duration(name) { return M.spring(name || 'reveal').duration; }

  S4.transition = {
    duration: duration,
    reveal: reveal, follow: drop, pop: pop, scrim: scrim, rise: rise, tip: tip, sharedAxis: sharedAxis, enter: enter, move: move, fade: fade,
    restore: restore,
    /* old names, same behavior as the patterns that replaced them (sheets no longer slide from an edge, decision 0043) */
    drop: drop,
    slide: function (el, opts) { return pop(el, opts); },
    containerTransform: function (surface, source, opts) { return pop(surface, opts); },
    unfold: drop
  };
})();
