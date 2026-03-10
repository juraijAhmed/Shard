if (process.env.NODE_ENV !== "production") {
  require("electron-reload")(__dirname, {
    electron: require("path").join(
      __dirname,
      "..",
      "node_modules",
      "electron",
      "dist",
      "electron.exe",
    ),
    hardResetMethod: "exit",
    forceHardReset: true,
  });
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
  updateUserTags
} = require("./db");
const { processImage, terminate, waitForWorker } = require('./ocr')
const { startWatcher, stopWatcher, retryPending } = require("./watcher");
const { tagImage, waitForTagger, terminateTagger } = require("./tagger");
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

function resolveNaturalDateRange(query) {
  const q = query.toLowerCase().trim()
  const now = new Date()

  // Helper to get start of a day
  const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const endOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59).getTime()

  if (q === 'today') {
    return { from: startOf(now), to: endOf(now) }
  }

  if (q === 'yesterday') {
    const y = new Date(now); y.setDate(y.getDate() - 1)
    return { from: startOf(y), to: endOf(y) }
  }

  if (q === 'this week' || q === 'last 7 days') {
    const from = new Date(now); from.setDate(from.getDate() - 7)
    return { from: startOf(from), to: endOf(now) }
  }

  if (q === 'last week') {
    const startOfThisWeek = new Date(now)
    startOfThisWeek.setDate(now.getDate() - now.getDay())
    const startOfLastWeek = new Date(startOfThisWeek)
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7)
    const endOfLastWeek = new Date(startOfThisWeek)
    endOfLastWeek.setDate(endOfLastWeek.getDate() - 1)
    return { from: startOf(startOfLastWeek), to: endOf(endOfLastWeek) }
  }

  if (q === 'this month') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1)
    return { from: from.getTime(), to: endOf(now) }
  }

  if (q === 'last month') {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const to = new Date(now.getFullYear(), now.getMonth(), 0)
    return { from: from.getTime(), to: endOf(to) }
  }

  if (q === 'this year') {
    const from = new Date(now.getFullYear(), 0, 1)
    return { from: from.getTime(), to: endOf(now) }
  }

  if (q === 'last year') {
    const from = new Date(now.getFullYear() - 1, 0, 1)
    const to = new Date(now.getFullYear() - 1, 11, 31)
    return { from: from.getTime(), to: endOf(to) }
  }

  // "last N days/weeks/months"
  const lastN = q.match(/^last (\d+) (day|days|week|weeks|month|months)$/)
  if (lastN) {
    const n = parseInt(lastN[1])
    const unit = lastN[2]
    const from = new Date(now)
    if (unit.startsWith('day')) from.setDate(from.getDate() - n)
    else if (unit.startsWith('week')) from.setDate(from.getDate() - n * 7)
    else if (unit.startsWith('month')) from.setMonth(from.getMonth() - n)
    return { from: startOf(from), to: endOf(now) }
  }

  return null
}

function searchByDate(query, allScreenshots) {
  const q = query.toLowerCase().trim()

  const months = {
    january: 0, february: 1, march: 2, april: 3,
    may: 4, june: 5, july: 6, august: 7,
    september: 8, october: 9, november: 10, december: 11,
    jan: 0, feb: 1, mar: 2, apr: 3,
    jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  }

  // Match "march 2025" or "2025 march"
  for (const [name, idx] of Object.entries(months)) {
    const yearMatch = q.match(/\b(20\d{2})\b/)
    if (q.includes(name) && yearMatch) {
      const year = parseInt(yearMatch[1])
      return allScreenshots.filter((s) => {
        const d = new Date(s.timestamp)
        return d.getMonth() === idx && d.getFullYear() === year
      })
    }
    // Just a month name with no year — match any year
    if (q === name) {
      return allScreenshots.filter((s) => {
        const d = new Date(s.timestamp)
        return d.getMonth() === idx
      })
    }
  }

  // Match just a year "2025"
  if (/^20\d{2}$/.test(q)) {
    const year = parseInt(q)
    return allScreenshots.filter((s) => new Date(s.timestamp).getFullYear() === year)
  }

  // Match specific date "9 march 2026", "march 9 2026", "9/3/2026", "2026-03-09"

  

  const specificDate = parseSpecificDate(q)
  if (specificDate) {
    return allScreenshots.filter((s) => {
      const d = new Date(s.timestamp)
      return d.getDate() === specificDate.day &&
             d.getMonth() === specificDate.month &&
             d.getFullYear() === specificDate.year
    })
  }

  return null // not a date query
}

function parseSpecificDate(q) {
  const months = {
    january: 0, february: 1, march: 2, april: 3,
    may: 4, june: 5, july: 6, august: 7,
    september: 8, october: 9, november: 10, december: 11,
    jan: 0, feb: 1, mar: 2, apr: 3,
    jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  }

  // "9 march 2026" or "march 9 2026"
  for (const [name, idx] of Object.entries(months)) {
    const pattern1 = new RegExp(`(\\d{1,2})\\s+${name}\\s+(20\\d{2})`)
    const pattern2 = new RegExp(`${name}\\s+(\\d{1,2})\\s+(20\\d{2})`)
    let m = q.match(pattern1)
    if (m) return { day: parseInt(m[1]), month: idx, year: parseInt(m[2]) }
    m = q.match(pattern2)
    if (m) return { day: parseInt(m[1]), month: idx, year: parseInt(m[2]) }
  }

  // "dd/mm/yyyy" or "dd-mm-yyyy"
  const slashMatch = q.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](20\d{2})$/)
  if (slashMatch) {
    return { day: parseInt(slashMatch[1]), month: parseInt(slashMatch[2]) - 1, year: parseInt(slashMatch[3]) }
  }

  // "yyyy-mm-dd"
  const isoMatch = q.match(/^(20\d{2})-(\d{2})-(\d{2})$/)
  if (isoMatch) {
    return { day: parseInt(isoMatch[3]), month: parseInt(isoMatch[2]) - 1, year: parseInt(isoMatch[1]) }
  }

  return null
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
ipcMain.handle("screenshots:updateUserTags", (_, filepath, userTags) => {
  updateUserTags({ filepath, userTags });
});

ipcMain.handle('screenshots:delete', async (_, filepath) => {
  const { deleteScreenshot } = require('./db')
  const trash = await import('trash')
  deleteScreenshot(filepath)
  try {
    await trash.default([filepath])
    console.log('Shard: trashed file', filepath)
  } catch (err) {
    console.error('Shard: failed to trash file', filepath, err)
  }
  mainWindow?.webContents.send('screenshot:removed', { filepath })
})

ipcMain.handle('screenshots:togglePin', (_, filepath) => {
  const { togglePin } = require('./db')
  return togglePin(filepath)
})

//url
ipcMain.on("clipboard:write", (_, text) => {
  clipboard.writeText(text);
});

const { shell } = require('electron')

ipcMain.handle('open:url', (_, url) => {
  shell.openExternal(url)
})

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

ipcMain.handle('folder:count', async (_, folderPath) => {
  const files = fs.readdirSync(folderPath).filter(f => {
    const ext = path.extname(f).toLowerCase()
    return ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'].includes(ext)
  })
  return files.length
})

ipcMain.handle('screenshot:reprocess', async (_, filepath) => {
  const { ingestFileForced } = require('./watcher')
  await ingestFileForced(filepath)
})

ipcMain.handle("screenshots:semanticSearch", async (_, query) => {
  const { embed } = require("./embedder")
  const { getAllScreenshots, searchScreenshots } = require("./db")
  const trimmed = query.trim()
  if (!trimmed) return []


  // Natural language for dates(last year, week or month)
  const range = resolveNaturalDateRange(trimmed)
  if (range) {
    return getAllScreenshots().filter(s => s.timestamp >= range.from && s.timestamp <= range.to)
  }

  // Specific dates

  const dateResults = searchByDate(trimmed, getAllScreenshots())
  if (dateResults !== null) return dateResults

  const [vector, keywordResults] = await Promise.all([
    embed(trimmed),
    searchScreenshots(trimmed),
  ])

  if (!vector) return keywordResults

  const vectorResults = await searchVectors(vector, 20)
  const SCORE_THRESHOLD = 0.25
  const confidentVectorResults = vectorResults.filter((r) => r.score >= SCORE_THRESHOLD)

  const all = getAllScreenshots()
  const byPath = Object.fromEntries(all.map((s) => [s.filepath, s]))
  const seen = new Set()
  const merged = []

  for (const r of confidentVectorResults) {
    if (byPath[r.filepath]) {
      merged.push({ ...byPath[r.filepath], score: r.score })
      seen.add(r.filepath)
    }
  }
  for (const r of keywordResults) {
    if (!seen.has(r.filepath)) {
      merged.push({ ...r, score: 0 })
      seen.add(r.filepath)
    }
  }
  return merged
})

app.setName('Shard')
app.whenReady().then(async () => {
  const { session } = require("electron");
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    callback({ requestHeaders: details.requestHeaders });
  });
  createWindow();
  createTray();
  waitForWorker().catch(console.error);
  waitForTagger().catch(console.error);
   waitForWorker().catch(console.error);
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
