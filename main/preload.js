const { contextBridge, ipcRenderer, shell, clipboard } = require("electron");

contextBridge.exposeInMainWorld("shard", {
  // Window controls
  minimize: () => ipcRenderer.send("window:minimize"),
  maximize: () => ipcRenderer.send("window:maximize"),
  close: () => ipcRenderer.send("window:close"),

  // Screenshots
  getAll: () => ipcRenderer.invoke("screenshots:getAll"),
  search: (query) => ipcRenderer.invoke("screenshots:search", query),
  semanticSearch: (query) =>
    ipcRenderer.invoke("screenshots:semanticSearch", query),
  onScreenshotRemoved: (cb) =>
    ipcRenderer.on("screenshot:removed", (_, data) => cb(data)),
  updateUserTags: (filepath, userTags) =>
    ipcRenderer.invoke("screenshots:updateUserTags", filepath, userTags),
  deleteScreenshot: (filepath) =>
    ipcRenderer.invoke("screenshots:delete", filepath),
  togglePin: (filepath) =>
    ipcRenderer.invoke("screenshots:togglePin", filepath),
  onScreenshotTagged: (cb) =>
    ipcRenderer.once("screenshot:tagged", (_, data) => cb(data)),
  reprocessScreenshot: (filepath) =>
    ipcRenderer.invoke("screenshot:reprocess", filepath),
  // Settings
  getSetting: (key) => ipcRenderer.invoke("settings:get", key),
  setSetting: (key, value) => ipcRenderer.invoke("settings:set", key, value),
  // Folder picker
  pickFolder: () => ipcRenderer.invoke("dialog:pickFolder"),

  // URL utils
  openUrl: (url) => ipcRenderer.invoke("open:url", url),
  copyToClipboard: (text) => ipcRenderer.send("clipboard:write", text),

  // licenses

  checkLicense: () => ipcRenderer.invoke("license:check"),
  activateLicense: (key) => ipcRenderer.invoke("license:activate", key),

  //updates
  onUpdateAvailable: (cb) =>
    ipcRenderer.on("update:available", (_, info) => cb(info)),
  installUpdate: () => ipcRenderer.send("update:install"),

  // Real-time events
  onScreenshotAdded: (cb) =>
    ipcRenderer.on("screenshot:added", (_, data) => cb(data)),
  onScreenshotOcrDone: (cb) =>
    ipcRenderer.once("screenshot:ocr-done", (_, data) => cb(data)),
  countFolder: (folderPath) => ipcRenderer.invoke("folder:count", folderPath),
  onScanStart: (cb) => ipcRenderer.on("scan:start", (_, data) => cb(data)),
  onScanProgress: (cb) =>
    ipcRenderer.on("scan:progress", (_, data) => cb(data)),
  onScanComplete: (cb) => ipcRenderer.on("scan:complete", () => cb()),
  removeListener: (channel, cb) => ipcRenderer.removeListener(channel, cb),
});
