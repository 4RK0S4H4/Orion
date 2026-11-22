/* A minimal Electron shell for an Orion desktop app (issue 60). It is an example: nothing here is installed or run
   in this repository. To try it: cd examples/electron && npm install && npm start.
   What it shows:
   - a frameless window whose title bar is the page's .s4-titlebar (it drags because the CSS says app-region: drag):
     on a Mac the traffic lights sit at the start (the page keeps room for them); on Windows and Linux the page draws
     its own window controls (decision 0072), or with ORION_CONTROLS=system the system's buttons are drawn over the end
     of the title bar (titleBarOverlay; the page reads env(titlebar-area-*));
   - the native menu: on a Mac the page sends S4.commands.native('<menu bar name>') and this builds the menu bar from
     it, with the app menu holding Settings and Quit; clicks come back as commands. On Windows and Linux there is no
     native menu: the page's own menu bar (.s4-menubar) is the menu;
   - the window's state (in front or not, full screen, maximized) and the window buttons of a frameless window. */
const { app, BrowserWindow, Menu, ipcMain, nativeTheme } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

const isMac = process.platform === 'darwin';
/* Windows and Linux: 'own' (the default) is a frameless window with Orion's window controls (decision 0072: full-height
   cells to the window's top and end edges, so the corner hits Close); ORION_CONTROLS=system keeps the system's buttons
   drawn over the bar (titleBarOverlay). */
const CONTROLS = isMac ? 'system' : (process.env.ORION_CONTROLS === 'system' ? 'system' : 'own');
const PAGE = path.join(__dirname, '..', '..', 'templates', 'desktop-app.html');
const BRIDGE = fs.readFileSync(path.join(__dirname, '..', 'shell-bridge.js'), 'utf8');
const SETTINGS = 'app.settings';   /* the command a Mac puts in the app menu, not in File */

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 400,
    minHeight: 520,
    show: false,
    ...(isMac
      ? { titleBarStyle: 'hidden', trafficLightPosition: { x: 16, y: 13 } }
      : CONTROLS === 'own'
        /* frameless: no system buttons. The window still resizes from its edges (the system's invisible borders, and a
           thin band inside the top edge that the page keeps free of drag regions while the window is not maximized) */
        ? { frame: false }
        : { titleBarStyle: 'hidden', titleBarOverlay: { color: '#00000000', symbolColor: nativeTheme.shouldUseDarkColors ? '#e6e6e6' : '#1f1f1f', height: 40 } }),
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#141414' : '#ffffff',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: true },
  });
  win.loadFile(PAGE);
  /* the bridge runs in the page, where S4 lives (the preload is isolated from it) */
  win.webContents.on('dom-ready', () => win.webContents.executeJavaScript(BRIDGE).catch(() => {}));
  win.once('ready-to-show', () => win.show());

  const send = () => win.webContents.send('window:state', {
    focused: win.isFocused(), fullscreen: win.isFullScreen(), maximized: win.isMaximized(), controls: CONTROLS,
  });
  ['focus', 'blur', 'enter-full-screen', 'leave-full-screen', 'maximize', 'unmaximize', 'restore'].forEach((e) => win.on(e, send));
  win.webContents.on('did-finish-load', send);
  return win;
}

/* the page's menu, as plain data, becomes the native menu (Mac only) */
ipcMain.on('menu:set', (event, menus) => {
  if (!isMac) { Menu.setApplicationMenu(null); return; }
  const win = BrowserWindow.fromWebContents(event.sender);
  const run = (id) => () => win && win.webContents.send('menu:run', id);
  let settings = null;
  const convert = (items) => items.map((it) => {
    if (it.type === 'separator') return { type: 'separator' };
    if (it.submenu) return { label: it.label, submenu: convert(it.submenu) };
    if (it.id === SETTINGS) { settings = { label: it.label + '…', accelerator: 'Cmd+,', click: run(it.id) }; return null; }
    return { id: it.id, label: it.label, accelerator: it.accelerator, enabled: it.enabled !== false,
      type: it.type, checked: it.checked, click: it.id ? run(it.id) : undefined };
  }).filter(Boolean)
    /* no separator at the start or end, none twice in a row */
    .filter((x, i, a) => !(x.type === 'separator' && (i === 0 || i === a.length - 1 || a[i - 1].type === 'separator')));
  const own = menus.map((m) => ({ label: m.label, submenu: convert(m.submenu || []) }));
  const template = [
    { label: app.name, submenu: [{ role: 'about' }, { type: 'separator' }, ...(settings ? [settings, { type: 'separator' }] : []),
      { role: 'services' }, { type: 'separator' }, { role: 'hide' }, { role: 'hideOthers' }, { role: 'unhide' }, { type: 'separator' }, { role: 'quit' }] },
    ...own,
    { role: 'windowMenu' },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
});

/* the window buttons of a frameless window that draws its own (.s4-window-control); s4-window says whether it was
   maximized, but the window is asked, as the page may be out of date */
ipcMain.on('window:action', (event, action) => {
  const win = BrowserWindow.fromWebContents(event.sender); if (!win) return;
  if (action === 'minimize') win.minimize();
  else if (action === 'maximize') (win.isMaximized() ? win.unmaximize() : win.maximize());
  else if (action === 'close') win.close();
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (!isMac) app.quit(); });
