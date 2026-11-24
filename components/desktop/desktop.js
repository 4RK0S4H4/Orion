/* Desktop behaviour (decision 0043).
   - <html data-platform="mac|windows|linux|ios|android"> is set once (unless the page set it), so CSS and apps can adapt.
   - data-shortcut="mod+k" on any button or link: that key combination clicks it, anywhere in the window. "mod" is ⌘ on
     Apple platforms and Ctrl elsewhere; also shift, alt, and one key (a letter, digit, enter, escape, /, comma, …).
     Shortcuts don't fire while typing in a field unless they use mod. An empty <kbd class="s4-kbd"> inside the element
     (or one with data-for="element-id" anywhere) is filled with the shortcut written the platform's way (⌘K, Ctrl+K).
   - data-context-menu="menu-id" on any element: right-click (or a long press on touch) opens that .s4-menu at the
     pointer instead of the browser's menu. The menu gets .contextTarget (the element) and fires s4-context { target }
     before it opens; choosing an item fires the menu's usual s4-select.
   - [data-window-action="minimize|maximize|close"] fires s4-window { action, maximized } on the document: wire it to the
     shell (Electron ipc, Tauri window API); Orion never talks to a shell itself. While <html data-window-state> holds
     "maximized", Maximize is labelled Restore (or its data-label-restore) and shows the Restore icon (decision 0072).
     Each .s4-window-control gets its icon written in: .s4-icon[data-window-icon] with window-minimize, window-maximize,
     window-restore or window-close, Orion's Line Duotone icons from the icon registry (decisions 0074, 0079).
   - Commands (S4.commands, components/commands/) with a shortcut run on it from anywhere, with the same rules.
   - Shift+F10 or the menu key opens an element's data-context-menu from the keyboard, under the element.
   - <html data-window-blurred> while the window is not in front; <html data-window-state="fullscreen"> in full
     screen; <html data-window-state="overlay"> while an installed web app draws into the title bar area (window
     controls overlay). A shell may set data-window-state itself (Electron and Tauri know the real state).
   - .s4-inspector: a grip on its start edge (drag, arrows, Home/End, Enter to hide), the width remembered with
     data-resize-key; its .s4-inspector-group sections open and close with Reveal. S4.desktop.inspector(el, on).
   S4.desktop.platform, S4.desktop.format('mod+k'), S4.desktop.matches(event, 'mod+k'). */
(function () {
  var S4 = window.S4, root = document.documentElement;
  var ua = navigator.userAgent || '', plat = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '';
  var platform = /iPhone|iPad|iPod/.test(ua) || (/Mac/.test(plat) && navigator.maxTouchPoints > 1) ? 'ios'
    : /Android/.test(ua) ? 'android' : /Mac/i.test(plat) ? 'mac' : /Win/i.test(plat) ? 'windows' : 'linux';
  if (!root.dataset.platform) root.dataset.platform = platform; else platform = root.dataset.platform;
  var apple = platform === 'mac' || platform === 'ios';

  function parse(s) {
    var p = String(s).toLowerCase().split('+').map(function (x) { return x.trim(); });
    return { mod: p.indexOf('mod') >= 0, shift: p.indexOf('shift') >= 0, alt: p.indexOf('alt') >= 0, key: p[p.length - 1] };
  }
  var NAMES = { enter: '↵', escape: 'Esc', backspace: '⌫', delete: 'Del', pageup: 'PgUp', pagedown: 'PgDn', tab: 'Tab', arrowup: '↑', arrowdown: '↓', arrowleft: '←', arrowright: '→', comma: ',', space: 'Space' };
  function format(s) {
    var c = parse(s), key = NAMES[c.key] || (c.key.length === 1 ? c.key.toUpperCase() : c.key.charAt(0).toUpperCase() + c.key.slice(1));
    if (apple) return (c.alt ? '⌥' : '') + (c.shift ? '⇧' : '') + (c.mod ? '⌘' : '') + key;
    return (c.mod ? 'Ctrl+' : '') + (c.alt ? 'Alt+' : '') + (c.shift ? 'Shift+' : '') + key;
  }
  function matches(e, s) {
    var c = parse(s), mod = apple ? e.metaKey : e.ctrlKey, key = (e.key || '').toLowerCase();
    if (key === ',') key = 'comma'; if (key === ' ') key = 'space';
    return c.key === key && c.mod === mod && c.shift === e.shiftKey && c.alt === e.altKey && (apple ? !e.ctrlKey : !e.metaKey);
  }
  S4.desktop = { platform: platform, format: format, matches: matches };

  document.addEventListener('keydown', function (e) {
    if (e.defaultPrevented || e.repeat) return;
    var typing = e.target && e.target.matches && e.target.matches('input, textarea, select, [contenteditable=""], [contenteditable="true"]');
    var mod = apple ? e.metaKey : e.ctrlKey, key = (e.key || '').toLowerCase();
    if (key === ',') key = 'comma'; if (key === ' ') key = 'space';
    var els = document.querySelectorAll('[data-shortcut]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i], c = parse(el.dataset.shortcut);
      if (c.key !== key || c.mod !== mod || c.shift !== e.shiftKey || c.alt !== e.altKey) continue;
      if (typing && !c.mod && key !== 'escape') continue;
      if (el.matches(':disabled, [aria-disabled="true"]') || !el.getClientRects().length && !el.closest('.s4-menu')) continue;
      e.preventDefault(); el.click(); return;
    }
    /* then the app's commands */
    if (!S4.commands || document.querySelector('dialog[open]:not(.s4-palette)')) return;
    var list = S4.commands.list();
    for (var j = 0; j < list.length; j++) {
      var cmd = list[j]; if (!cmd.shortcut || !matches(e, cmd.shortcut)) continue;
      if (typing && !parse(cmd.shortcut).mod && key !== 'escape') continue;
      if (!S4.commands.enabled(cmd.id)) continue;
      e.preventDefault(); S4.commands.run(cmd.id, { source: 'keyboard', target: document.activeElement }); return;
    }
  });

  function openContext(host, x, y) {
    var menu = document.getElementById(host.dataset.contextMenu);
    if (!menu || !S4.menu) return false;
    var point = { getBoundingClientRect: function () { return { left: x, right: x, top: y, bottom: y, width: 0, height: 0 }; },
      setAttribute: function () {}, focus: function () { if (host.focus) host.focus({ preventScroll: true }); }, contains: function () { return false; } };
    menu.contextTarget = host;
    S4.util.emit(menu, 's4-context', { target: host, x: x, y: y });
    S4.menu.close(menu, false);
    requestAnimationFrame(function () { S4.menu.open(menu, point); });
    return true;
  }
  document.addEventListener('contextmenu', function (e) {
    var host = e.target.closest && e.target.closest('[data-context-menu]'); if (!host) return;
    var x = e.clientX, y = e.clientY;
    if (!x && !y || e.button === -1) { var r = host.getBoundingClientRect(); x = r.left + Math.min(24, r.width / 2); y = r.bottom; }   /* from the keyboard */
    if (openContext(host, x, y)) e.preventDefault();
  });
  /* Shift+F10 and the menu key: the same menu from the keyboard, under the focused element */
  document.addEventListener('keydown', function (e) {
    if (!(e.key === 'ContextMenu' || (e.key === 'F10' && e.shiftKey))) return;
    var host = document.activeElement && document.activeElement.closest && document.activeElement.closest('[data-context-menu]'); if (!host) return;
    var r = (host.querySelector(':scope > .s4-tree-row') || host).getBoundingClientRect();
    if (openContext(host, r.left + Math.min(24, r.width / 2), r.bottom)) e.preventDefault();
  });
  /* touch: a long press opens the same menu */
  var press = null;
  document.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'touch') return;
    var host = e.target.closest && e.target.closest('[data-context-menu]'); if (!host) return;
    var x = e.clientX, y = e.clientY;
    press = { x: x, y: y, t: setTimeout(function () { press = null; openContext(host, x, y); }, 500) };
  }, { passive: true });
  ['pointerup', 'pointercancel', 'pointermove', 'scroll'].forEach(function (t) {
    document.addEventListener(t, function (e) {
      if (!press) return;
      if (t === 'pointermove' && Math.abs(e.clientX - press.x) + Math.abs(e.clientY - press.y) < 10) return;
      clearTimeout(press.t); press = null;
    }, { passive: true, capture: true });
  });

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-window-action]');
    if (b) S4.util.emit(document, 's4-window', { action: b.dataset.windowAction, maximized: /(^|\s)maximized(\s|$)/.test(root.dataset.windowState || '') });
  });

  /* ---------- the window: in front or not, full screen, drawing into the title bar ---------- */
  window.addEventListener('blur', function () { root.setAttribute('data-window-blurred', ''); });
  window.addEventListener('focus', function () { root.removeAttribute('data-window-blurred'); });
  function state(word, on) {
    var set = (root.dataset.windowState || '').split(/\s+/).filter(function (w) { return w && w !== word; });
    if (on) set.push(word);
    if (set.length) root.dataset.windowState = set.join(' '); else delete root.dataset.windowState;
  }
  document.addEventListener('fullscreenchange', function () { state('fullscreen', !!document.fullscreenElement); });
  if (window.matchMedia) { var fs = matchMedia('(display-mode: fullscreen)'); state('fullscreen', fs.matches || !!document.fullscreenElement); if (fs.addEventListener) fs.addEventListener('change', function () { state('fullscreen', fs.matches); }); }
  var wco = navigator.windowControlsOverlay;
  if (wco) { state('overlay', wco.visible); wco.addEventListener('geometrychange', function (e) { state('overlay', e.visible); }); }
  /* window controls (decision 0072): while the window is maximized, Maximize is Restore. Each control holds one icon from
     the registry (decision 0074), written in here so the markup stays an empty button with its label */
  function maximized() { return /(^|\s)maximized(\s|$)/.test(root.dataset.windowState || ''); }
  function windowControls() {
    var max = maximized();
    document.querySelectorAll('.s4-window-control[data-window-action]').forEach(function (b) {
      var action = b.getAttribute('data-window-action'), icon = b.querySelector(':scope > [data-window-icon]');
      if (action === 'maximize') {
        if (!b.dataset.labelMaximize) b.dataset.labelMaximize = b.getAttribute('aria-label') || 'Maximize';
        var want = max ? (b.dataset.labelRestore || 'Restore') : b.dataset.labelMaximize;
        if (b.getAttribute('aria-label') !== want) b.setAttribute('aria-label', want);
        if (max) action = 'restore';
      }
      if (!/^(minimize|restore|maximize|close)$/.test(action)) return;
      if (!icon) { icon = document.createElement('span'); icon.className = 's4-icon'; icon.setAttribute('data-window-icon', ''); icon.setAttribute('aria-hidden', 'true'); b.appendChild(icon); }
      var name = 'window-' + action;
      if (icon.getAttribute('data-icon') !== name) { if (S4.icon) S4.icon.set(icon, name); else icon.setAttribute('data-icon', name); }
    });
  }
  if (window.MutationObserver) new MutationObserver(windowControls).observe(root, { attributes: true, attributeFilter: ['data-window-state'] });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', windowControls); else windowControls();

  /* ---------- the inspector ---------- */
  function store(key, v) { try { if (v == null) localStorage.removeItem(key); else localStorage.setItem(key, String(v)); } catch (e) {} }
  function stored(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function inspector(el, on) {
    if (on == null) on = el.hidden;
    el.hidden = !on;
    S4.util.emit(el, 's4-toggle', { open: !!on });
    return !!on;
  }
  S4.desktop.inspector = inspector;
  function wireInspector(el) {
    var key = el.dataset.resizeKey, min = 220, max = 520;
    var w = key && parseFloat(stored(key + '-width'));
    if (w) el.style.setProperty('--s4-inspector-width', w + 'px');
    var grip = document.createElement('button');
    grip.type = 'button'; grip.className = 's4-inspector-grip';
    grip.setAttribute('role', 'separator'); grip.setAttribute('aria-orientation', 'vertical');
    grip.setAttribute('aria-label', 'Resize ' + (el.getAttribute('aria-label') || 'Inspector'));
    grip.setAttribute('aria-valuemin', min); grip.setAttribute('aria-valuemax', max);
    el.insertBefore(grip, el.firstChild);
    function size(px) {
      px = Math.round(Math.max(min, Math.min(max, px)));
      el.style.setProperty('--s4-inspector-width', px + 'px'); grip.setAttribute('aria-valuenow', px);
      if (key) store(key + '-width', px);
    }
    grip.setAttribute('aria-valuenow', Math.round(el.getBoundingClientRect().width) || 288);
    grip.addEventListener('keydown', function (e) {
      var rtl = getComputedStyle(el).direction === 'rtl', cur = el.getBoundingClientRect().width, grow = rtl ? 'ArrowRight' : 'ArrowLeft', shrink = rtl ? 'ArrowLeft' : 'ArrowRight';
      if (e.key === grow) size(cur + 16); else if (e.key === shrink) size(cur - 16);
      else if (e.key === 'Home') size(min); else if (e.key === 'End') size(max);
      else if (e.key === 'Enter') inspector(el, false);
      else return;
      e.preventDefault();
    });
    grip.addEventListener('pointerdown', function (e) {
      if (e.button) return;
      e.preventDefault();
      var x0 = e.clientX, w0 = el.getBoundingClientRect().width, rtl = getComputedStyle(el).direction === 'rtl';
      grip.setAttribute('data-dragging', ''); grip.setPointerCapture(e.pointerId);
      function mv(ev) { size(w0 + (rtl ? ev.clientX - x0 : x0 - ev.clientX)); }
      function up() { grip.removeAttribute('data-dragging'); grip.removeEventListener('pointermove', mv); grip.removeEventListener('pointerup', up); grip.removeEventListener('pointercancel', up); }
      grip.addEventListener('pointermove', mv); grip.addEventListener('pointerup', up); grip.addEventListener('pointercancel', up);
    });
    grip.addEventListener('dblclick', function () { el.style.removeProperty('--s4-inspector-width'); if (key) store(key + '-width', null); });
    /* groups open and close in place (Reveal), like the accordion */
    el.addEventListener('click', function (e) {
      var sum = e.target.closest('.s4-inspector-group > summary'); if (!sum) return;
      var d = sum.parentElement, body = d.querySelector(':scope > :not(summary)'); if (!body) return;
      e.preventDefault();
      if (!d.open) { d.removeAttribute('data-closing'); d.open = true; S4.transition.reveal(body, { open: true }); }
      else { d.setAttribute('data-closing', ''); S4.transition.reveal(body, { open: false }).then(function (done) { if (!done || !d.hasAttribute('data-closing')) return; d.open = false; d.removeAttribute('data-closing'); S4.transition.restore(body); }); }
      S4.util.emit(d, 's4-toggle', { open: !d.hasAttribute('data-closing') });
    });
  }

  S4.register('desktop', function (scope) {
    S4.util.all(scope, '.s4-inspector').forEach(function (el) { if (S4.util.once(el, 'inspector')) wireInspector(el); });
    S4.util.all(scope, '.s4-kbd').forEach(function (k) {
      if (k.textContent.trim()) return;
      var host = k.dataset.for ? document.getElementById(k.dataset.for) : k.closest('[data-shortcut]');
      if (host && host.dataset.shortcut) k.textContent = format(host.dataset.shortcut);
    });
  });
})();
