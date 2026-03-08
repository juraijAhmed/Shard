const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('shard', {
  // Window controls
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close:    () => ipcRenderer.send('window:close'),

  // Screenshots
  getAll:   ()      => ipcRenderer.invoke('screenshots:getAll'),
  search:   (query) => ipcRenderer.invoke('screenshots:search', query),

  // Settings
  getSetting: (key)        => ipcRenderer.invoke('settings:get', key),
  setSetting: (key, value) => ipcRenderer.invoke('settings:set', key, value),

  // Folder picker
  pickFolder: () => ipcRenderer.invoke('dialog:pickFolder'),

  // Listen for real-time events from main process
  onScreenshotAdded:  (cb) => ipcRenderer.on('screenshot:added',   (_, data) => cb(data)),
  onScreenshotOcrDone:(cb) => ipcRenderer.on('screenshot:ocr-done',(_, data) => cb(data)),
})