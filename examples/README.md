# Desktop shells for Orion

Two small, real starting points for putting an Orion desktop app ([`templates/desktop-app.html`](../templates/desktop-app.html),
[`components/desktop/`](../components/desktop/)) into a desktop window. **Neither is installed or run in this
repository** (it has no dependencies and its checks cannot open a desktop window); they follow the documented APIs and
are kept small enough to read in a few minutes. Try them on your own computer.

| Folder | What |
|---|---|
| [`electron/`](electron/) | An Electron shell: frameless window, drag regions, traffic lights (Mac) or the window controls overlay (Windows, Linux), the native Mac menu built from the page's commands, window state |
| [`installed-web-app/`](installed-web-app/) | A web app manifest with `display_override: ["window-controls-overlay"]` and a page whose `.s4-titlebar` takes the place of the window's title bar |
| [`shell-bridge.js`](shell-bridge.js) | Runs in the page; connects `S4.commands` and the window state to any shell that exposes `window.orionShell` |

## Electron

```sh
cd examples/electron
npm install        # fetches Electron (about 100 MB)
npm start          # opens the desktop app template in a frameless window
```

How the pieces meet:

| Need | Page (Orion) | Shell (Electron) |
|---|---|---|
| Drag the window | `.s4-titlebar` is `app-region: drag`; its buttons, fields, menu bar and tabs are `no-drag` | `titleBarStyle: 'hidden'` |
| Window buttons | Mac: room at the start (`data-shell` + `data-platform="mac"`); Windows/Linux: `env(titlebar-area-*)` | Mac: `trafficLightPosition`; Windows/Linux: `titleBarOverlay` (the system draws them over the bar's end) |
| Menu | `S4.commands.menu('parley', …)` fills the in-window `.s4-menubar`; `S4.commands.native('parley')` gives the same menu as data | Mac: `Menu.buildFromTemplate` from that data, with Settings (⌘,) and Quit in the app menu and the Window menu added; clicks send the command id back. Windows/Linux: `Menu.setApplicationMenu(null)`, the page's menu bar is the menu |
| Shortcuts | `S4.commands` shortcuts run in the page (mod = ⌘ on a Mac, Ctrl elsewhere) | The Mac menu shows the same accelerators (`CmdOrCtrl+S`) |
| In front, full screen | `<html data-window-blurred>`, `data-window-state="fullscreen maximized"` | `focus`, `blur`, `enter-full-screen`, `maximize` events, sent over IPC |
| Frameless buttons | `.s4-window-control[data-window-action]` fires `s4-window` | `minimize()`, `maximize()`, `close()` |

Security: `contextIsolation` and `sandbox` stay on; the preload exposes four functions and two listeners, never Node or
`ipcRenderer` itself. The bridge is injected with `executeJavaScript` so the template needs no change; in your own app,
include `shell-bridge.js` with a `<script>` tag instead.

Not verified here: the exact look of `titleBarOverlay` colors on every Windows and Linux desktop, and the traffic light
position for a 40px title bar (`trafficLightPosition: { x: 16, y: 13 }` is a starting point; adjust by eye).

## Tauri

Not included as code, because its menu and window APIs changed between versions 1 and 2 and this repository cannot run
either to check them. What carries over, with names to confirm against the Tauri 2 documentation:

- A window with `decorations: false` (or `titleBarStyle: "Overlay"` and `hiddenTitle: true` on a Mac) in
  `tauri.conf.json`.
- Tauri drags by an attribute, not CSS: add `data-tauri-drag-region` to `.s4-titlebar` (and keep it off its buttons).
- The native menu from the page's data: the JavaScript menu API (`Menu`, `Submenu`, `MenuItem`, `PredefinedMenuItem`
  in `@tauri-apps/api/menu`, then `setAsAppMenu()`) can be built from `S4.commands.native(name)`; each item's action
  calls `S4.commands.run(id)`. Accelerators use the same `CmdOrCtrl+S` spelling.
- Window state: the window API's focus and resize events set `data-window-blurred` and `data-window-state`, as the
  bridge does for Electron. Expose them as `window.orionShell` and `shell-bridge.js` works unchanged.

## Installed web app (window controls overlay)

Serve the repository (any static server), open `examples/installed-web-app/index.html` in Chrome or Edge, install it,
and the page's title bar becomes the window's. `.s4-titlebar` already pads itself with `env(titlebar-area-x)` and
`env(titlebar-area-width)`, takes `env(titlebar-area-height)` as its height, and drags the window. `desktop.js` sets
`data-window-state="overlay"` while the overlay is on.
