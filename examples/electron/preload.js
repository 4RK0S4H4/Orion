/* The preload exposes a small, explicit API to the page (contextIsolation stays on): the page never gets Node or
   ipcRenderer itself. shell-bridge.js (run in the page) is the only user. */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('orionShell', {
  name: 'electron',
  platform: process.platform === 'darwin' ? 'mac' : process.platform === 'win32' ? 'windows' : 'linux',
  setMenu: (menus) => ipcRenderer.send('menu:set', menus),
  windowAction: (action) => ipcRenderer.send('window:action', action),
  onMenu: (fn) => ipcRenderer.on('menu:run', (_e, id) => fn(id)),
  onWindowState: (fn) => ipcRenderer.on('window:state', (_e, state) => fn(state)),
});
