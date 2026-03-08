const chokidar = require('chokidar')
const path = require('path')
const fs = require('fs')
const { processImage } = require('./ocr')
const { insertScreenshot, updateOcrResult, markOcrFailed, updateAiResult, markAiFailed, getPendingScreenshots } = require('./db')
const { tagImage } = require('./tagger')
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'])

let watcher = null
let mainWindow = null
let watchPath = null

function isImage(filepath) {
  return IMAGE_EXTENSIONS.has(path.extname(filepath).toLowerCase())
}

async function ingestFile(filepath) {
  if (!isImage(filepath)) return

  try {
    const stats = fs.statSync(filepath)
    const filename = path.basename(filepath)
    const timestamp = stats.mtimeMs

    const result = insertScreenshot({ filepath, filename, timestamp, fileSize: stats.size })
    if (result.changes === 0) return

    mainWindow?.webContents.send('screenshot:added', { filepath, filename, timestamp })

    // OCR
    const { ocrText, width, height } = await processImage(filepath)
    updateOcrResult({ filepath, ocrText, width, height })
    mainWindow?.webContents.send('screenshot:ocr-done', { filepath, ocrText })

    // AI tagging
    const { tags, description } = await tagImage(filepath)
    updateAiResult({ filepath, aiTags: tags, aiDescription: description })
    mainWindow?.webContents.send('screenshot:tagged', { filepath, aiTags: tags, aiDescription: description })

  } catch (err) {
    console.error('Failed to ingest file:', filepath, err)
    markOcrFailed(filepath)
    markAiFailed(filepath)
  }
}
function startWatcher(folderPath, window) {
  if (watcher) stopWatcher()

  watchPath = folderPath
  mainWindow = window

  watcher = chokidar.watch(folderPath, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: false,     // process existing files on startup
    awaitWriteFinish: {
      stabilityThreshold: 500, // wait for file to finish writing
      pollInterval: 100,
    },
  })

  watcher.on('add', (filepath) => ingestFile(filepath))

  watcher.on('error', (err) => {
    console.error('Watcher error:', err)
  })

  console.log(`Shard: watching ${folderPath}`)
}

function stopWatcher() {
  if (watcher) {
    watcher.close()
    watcher = null
  }
}

function getWatchPath() {
  return watchPath
}

// On startup, retry any screenshots that didn't finish OCR last time
async function retryPending() {
  const pending = getPendingScreenshots()
  for (const screenshot of pending) {
    await ingestFile(screenshot.filepath)
  }
}

module.exports = { startWatcher, stopWatcher, getWatchPath, retryPending }