const chokidar = require("chokidar");
const path = require("path");
const fs = require("fs");
const { processImage } = require("./ocr");
const { terminate } = require('./ocr')
const { terminateTagger } = require('./tagger')  
const { terminateEmbedder } = require('./embedder')
const {
  deleteScreenshot,
  insertScreenshot,
  updateOcrResult,
  markOcrFailed,
  updateAiResult,
  markAiFailed,
  getPendingScreenshots,
  markEmbedded,
} = require("./db");
const IMAGE_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".bmp",
]);
const { tagImage, waitForTagger } = require("./tagger");
const { embed, waitForEmbedder } = require("./embedder");
const { upsertVector } = require("./vectorstore");
let watcher = null;
let mainWindow = null;
let watchPath = null;
let idleTimer = null

function isImage(filepath) {
  return IMAGE_EXTENSIONS.has(path.extname(filepath).toLowerCase());
}

async function ingestFile(filepath) {
  if (!isImage(filepath)) return
  if (idleTimer) clearTimeout(idleTimer)

  try {
    const stats = fs.statSync(filepath)
    const filename = path.basename(filepath)
    const timestamp = stats.mtimeMs

    const result = insertScreenshot({ filepath, filename, timestamp, fileSize: stats.size })
    if (result.changes === 0) return

    mainWindow?.webContents.send('screenshot:added', { filepath, filename, timestamp })

    await waitForTagger()
    const { ocrText, width, height } = await processImage(filepath)
    updateOcrResult({ filepath, ocrText, width, height })
    mainWindow?.webContents.send('screenshot:ocr-done', { filepath, ocrText })

    const { tags, description } = await tagImage(filepath)
    updateAiResult({ filepath, aiTags: tags, aiDescription: description })
    mainWindow?.webContents.send('screenshot:tagged', { filepath, aiTags: tags, aiDescription: description })

    await waitForEmbedder()
    const textToEmbed = [ocrText, tags, description].filter(Boolean).join(' ')
    const vector = await embed(textToEmbed)
    if (vector) {
      await upsertVector(filepath, vector, { filename })
      markEmbedded(filepath)
    }

  } catch (err) {
    console.error('Failed to ingest file:', filepath, err)
    markOcrFailed(filepath)
    markAiFailed(filepath)
  }

  // Always set idle timer, even if processing failed
idleTimer = setTimeout(async () => {
  console.log('Shard: idle, unloading models to free memory')
  await terminate()
  await terminateTagger()
  await terminateEmbedder()

  // Force garbage collection if available
  if (global.gc) {
    global.gc()
    console.log('Shard: GC triggered')
  }
}, 30000)
}

function startWatcher(folderPath, window) {
  if (watcher) stopWatcher()

  watchPath = folderPath
  mainWindow = window

  const existingFiles = fs.readdirSync(folderPath).map((f) =>
    path.join(folderPath, f)
  )

  ;(async () => {
    for (const filepath of existingFiles) {
      await ingestFile(filepath)
    }

    // Start idle timer after initial scan is done
    if (idleTimer) clearTimeout(idleTimer)
    idleTimer = setTimeout(async () => {
      console.log('Shard: idle, unloading models to free memory')
      await terminate()
      await terminateTagger()
      await terminateEmbedder()
      if (global.gc) global.gc()
    }, 30000)
  })()

  watcher = chokidar.watch(folderPath, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 1500,
      pollInterval: 100,
    },
  })

  watcher.on('add', (filepath) => ingestFile(filepath))
  watcher.on('unlink', (filepath) => {
    deleteScreenshot(filepath)
    mainWindow?.webContents.send('screenshot:removed', { filepath })
  })
  watcher.on('error', (err) => console.error('Watcher error:', err))

  console.log(`Shard: watching ${folderPath}`)
}

function stopWatcher() {
  if (watcher) {
    watcher.close();
    watcher = null;
  }
}

function getWatchPath() {
  return watchPath;
}

// On startup, retry any screenshots that didn't finish OCR last time
async function retryPending() {
  const pending = getPendingScreenshots();
  for (const screenshot of pending) {
    await ingestFile(screenshot.filepath);
  }
}

module.exports = { startWatcher, stopWatcher, getWatchPath, retryPending };
