/* Connects an Orion page to a desktop shell, from inside the page. The shell exposes window.orionShell (Electron:
   preload.js; another shell can expose the same few functions):
     { name, platform, setMenu(menus), windowAction(action), onMenu(fn), onWindowState(fn) }
   What it does:
   - <html data-shell="electron" data-platform="mac|windows|linux">: the title bar keeps room for a Mac's traffic lights.
   - On a Mac: <html data-native-menu> (the in-window menu bar hides) and the menu bar's menus are sent to the shell as
     plain data (S4.commands.native), again whenever a command or its state changes; a native menu click runs the
     command here. Elsewhere the in-window menu bar is the menu.
   - The shell's window state becomes <html data-window-blurred> and data-window-state="fullscreen maximized".
   - s4-window { action } from .s4-window-control buttons goes to the shell.
   Without window.orionShell (a browser tab) it does nothing. */
(function () {
  var shell = window.orionShell, S4 = window.S4, root = document.documentElement;
  if (!shell || !S4 || !S4.commands) return;
  root.dataset.shell = shell.name || 'shell';
  root.dataset.platform = shell.platform;
  var bar = document.querySelector('.s4-menubar[data-menus]'), name = bar && bar.dataset.menus;
  if (shell.platform === 'mac' && name) {
    root.setAttribute('data-native-menu', '');
    var queued = false;
    var push = function () {
      if (queued) return; queued = true;
      setTimeout(function () { queued = false; shell.setMenu(S4.commands.native(name)); }, 50);
    };
    document.addEventListener('s4-commands', push);
    push();
  } else shell.setMenu([]);
  shell.onMenu(function (id) { S4.commands.run(id, { source: 'native-menu' }); });
  shell.onWindowState(function (s) {
    root.toggleAttribute('data-window-blurred', !s.focused);
    var words = [s.fullscreen && 'fullscreen', s.maximized && 'maximized'].filter(Boolean);
    if (words.length) root.dataset.windowState = words.join(' '); else delete root.dataset.windowState;
  });
  document.addEventListener('s4-window', function (e) { shell.windowAction(e.detail.action); });
})();
