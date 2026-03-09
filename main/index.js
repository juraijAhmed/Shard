if (process.env.NODE_ENV !== 'production') {
  require('electron-reload')(__dirname, {
    electron: require('path').join(__dirname, '..', 'node_modules', '.bin', 'electron'),
    hardResetMethod: 'exit',
    forceHardReset: true,
  })
}
const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  ipcMain,
  dialog,
  clipboard,
} = require("electron");
const path = require("path");
const {
  getSetting,
  setSetting,
  getAllScreenshots,
  searchScreenshots,
} = require("./db");
const { initWorker, terminate } = require("./ocr");
const { startWatcher, stopWatcher, retryPending } = require("./watcher");
const { initTagger, terminateTagger } = require("./tagger");
const isDev = process.env.NODE_ENV !== "production";
const { initEmbedder, terminateEmbedder } = require("./embedder");
const { searchVectors } = require("./vectorstore");
let mainWindow = null;
let tray = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 800,
    minHeight: 500,
    frame: false,
    icon: path.join(__dirname, "../renderer/public/logo.ico"),
    backgroundColor: "#0e0e0f",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
    },
    show: false,
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/renderer/index.html"));
  }

  mainWindow.once("ready-to-show", () => mainWindow.show());

  mainWindow.on("close", (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  const icon = nativeImage.createFromPath(
    path.join(__dirname, "../renderer/public/logo.ico"),
  );
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open Shard",
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      },
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip("Shard");
  tray.setContextMenu(contextMenu);
  tray.on("double-click", () => {
    mainWindow.show();
    mainWindow.focus();
  });
}

// Window controls
ipcMain.on("window:minimize", () => mainWindow.minimize());
ipcMain.on("window:maximize", () =>
  mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize(),
);
ipcMain.on("window:close", () => mainWindow.hide());

// Screenshots
ipcMain.handle("screenshots:getAll", () => getAllScreenshots());
ipcMain.handle("screenshots:search", (_, query) => searchScreenshots(query));
//url
ipcMain.on("clipboard:write", (_, text) => {
  clipboard.writeText(text);
});
// Settings
ipcMain.handle("settings:get", (_, key) => getSetting(key));
ipcMain.handle("settings:set", async (_, key, value) => {
  setSetting(key, value);
  if (key === "watchFolder") {
    startWatcher(value, mainWindow);
  }
});

// Folder picker
ipcMain.handle("dialog:pickFolder", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
    title: "Choose a folder to watch",
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});
ipcMain.handle("screenshots:semanticSearch", async (_, query) => {
  const { embed } = require("./embedder")
  const { getAllScreenshots, searchScreenshots } = require("./db")

  const trimmed = query.trim()
  if (!trimmed) return []

  const [vector, keywordResults] = await Promise.all([
    embed(trimmed),
    searchScreenshots(trimmed),
  ])

  if (!vector) return keywordResults

  const vectorResults = await searchVectors(vector, 20)

  // Filter out low confidence vector matches
  const SCORE_THRESHOLD = 0.25
  const confidentVectorResults = vectorResults.filter((r) => r.score >= SCORE_THRESHOLD)

  const all = getAllScreenshots()
  const byPath = Object.fromEntries(all.map((s) => [s.filepath, s]))

  const seen = new Set()
  const merged = []

  // Add confident vector results first
  for (const r of confidentVectorResults) {
    if (byPath[r.filepath]) {
      merged.push({ ...byPath[r.filepath], score: r.score })
      seen.add(r.filepath)
    }
  }

  // Add keyword results that weren't in vector results
  for (const r of keywordResults) {
    if (!seen.has(r.filepath)) {
      merged.push({ ...r, score: 0 })
      seen.add(r.filepath)
    }
  }

  return merged
})
app.whenReady().then(async () => {
  const { session } = require("electron");
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    callback({ requestHeaders: details.requestHeaders });
  });
  createWindow();
  createTray();
  initWorker().catch(console.error);
  initTagger().catch(console.error);
  initWorker().catch(console.error);
  initEmbedder().catch(console.error);

  const savedFolder = getSetting("watchFolder");
  if (savedFolder) {
    startWatcher(savedFolder, mainWindow);
    retryPending().catch(console.error);
  }
});

app.on("window-all-closed", (e) => e.preventDefault());

app.on("before-quit", async () => {
  stopWatcher();
  await terminate();
  await terminateTagger();
  await terminateEmbedder();
});
