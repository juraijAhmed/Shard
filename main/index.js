if (process.env.NODE_ENV !== 'production') {
  require('electron-reload')(__dirname, {
    electron: require('path').join(__dirname, '..', 'node_modules', '.bin', 'electron.cmd'),
    hardResetMethod: 'exit',
  })
}
const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, dialog } = require('electron')
const path = require('path')
const { getSetting, setSetting, getAllScreenshots, searchScreenshots } = require('./db')
const { initWorker, terminate } = require('./ocr')
const { startWatcher, stopWatcher, retryPending } = require('./watcher')
const { initTagger, terminateTagger } = require('./tagger')
const isDev = process.env.NODE_ENV !== 'production'

let mainWindow = null
let tray = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 800,
    minHeight: 500,
    frame: false,
    backgroundColor: '#0e0e0f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
    },
    show: false,
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/renderer/index.html'))
  }

  mainWindow.once('ready-to-show', () => mainWindow.show())

  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault()
      mainWindow.hide()
    }
  })
}

function createTray() {
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon)

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open Shard', click: () => { mainWindow.show(); mainWindow.focus() } },
    { type: 'separator' },
    { label: 'Quit', click: () => { app.isQuitting = true; app.quit() } },
  ])

  tray.setToolTip('Shard')
  tray.setContextMenu(contextMenu)
  tray.on('double-click', () => { mainWindow.show(); mainWindow.focus() })
}

// Window controls
ipcMain.on('window:minimize', () => mainWindow.minimize())
ipcMain.on('window:maximize', () => mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize())
ipcMain.on('window:close', () => mainWindow.hide())

// Screenshots
ipcMain.handle('screenshots:getAll', () => getAllScreenshots())
ipcMain.handle('screenshots:search', (_, query) => searchScreenshots(query))

// Settings
ipcMain.handle('settings:get', (_, key) => getSetting(key))
ipcMain.handle('settings:set', async (_, key, value) => {
  setSetting(key, value)
  if (key === 'watchFolder') {
    startWatcher(value, mainWindow)
  }
})

// Folder picker
ipcMain.handle('dialog:pickFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Choose a folder to watch',
  })
  if (result.canceled) return null
  return result.filePaths[0]
})

app.whenReady().then(async () => {
    const { session } = require('electron')
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    callback({ requestHeaders: details.requestHeaders })
  })
  
  createWindow()
  createTray()
  initWorker().catch(console.error)
  initTagger().catch(console.error) 
  initWorker().catch(console.error)

  const savedFolder = getSetting('watchFolder')
  if (savedFolder) {
    startWatcher(savedFolder, mainWindow)
    retryPending().catch(console.error)
  }
})

app.on('window-all-closed', (e) => e.preventDefault())

app.on('before-quit', async () => {
  stopWatcher()
  await terminate()
  await terminateTagger() 
})