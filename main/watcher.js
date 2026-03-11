const chokidar = require("chokidar");
const path = require("path");
const fs = require("fs");
const { processImage, terminate, waitForWorker } = require("./ocr");
const { terminateTagger } = require("./tagger");
const { terminateEmbedder } = require("./embedder");
const {
  deleteScreenshot,
  insertScreenshot,
  updateOcrResult,
  markOcrFailed,
  updateAiResult,
  markAiFailed,
  markAiDone,
  getPendingScreenshots,
  getScreenshot,
  markEmbedded,
} = require("./db");

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp"]);
const { tagImage, waitForTagger } = require("./tagger");
const { embed, waitForEmbedder } = require("./embedder");
const { upsertVector } = require("./vectorstore");

let watcher = null;
let mainWindow = null;
let watchPath = null;
let idleTimer = null;

const OCR_TAG_THRESHOLD = 30;

function extractKeywordsFromOcr(text) {
  if (!text) return [];
  const stopwords = new Set([
    'the','a','an','and','or','but','in','on','at','to','for','of','with','by',
    'from','is','are','was','were','be','been','has','have','had','this','that',
    'these','those','it','its','as','if','into','via','per','not','also','more',
    'your','our','you','we','he','she','they','will','can','may','all','one','two',
  ]);
  return [...new Set(
    text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !stopwords.has(w))
  )].slice(0, 8);
}

function isImage(filepath) {
  return IMAGE_EXTENSIONS.has(path.extname(filepath).toLowerCase());
}

function scheduleIdle() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(async () => {
    console.log("Shard: idle, unloading models to free memory");
    await terminate();
    await terminateTagger();
    await terminateEmbedder();
    if (global.gc) global.gc();
    // Second pass GC to catch deferred cleanup
    setTimeout(() => { if (global.gc) global.gc(); }, 5000);
  }, 15000);
}

async function runAiTagging(filepath, ocrText) {
  if (ocrText && ocrText.length > OCR_TAG_THRESHOLD) {
    const aiTags = extractKeywordsFromOcr(ocrText).join(', ');
    const aiDescription = ocrText.slice(0, 120).replace(/\n/g, ' ').trim();
    updateAiResult({ filepath, aiTags, aiDescription });
    markAiDone(filepath);
    return { aiTags, aiDescription };
  } else {
    await waitForTagger();
    const { tags, description } = await tagImage(filepath);
    updateAiResult({ filepath, aiTags: tags, aiDescription: description });
    return { aiTags: tags, aiDescription: description };
  }
}

async function ingestFile(filepath) {
  if (!isImage(filepath)) return;

  try {
    const stats = fs.statSync(filepath);
    const filename = path.basename(filepath);
    const timestamp = stats.mtimeMs;

    const result = insertScreenshot({ filepath, filename, timestamp, fileSize: stats.size });

    // Already in DB — check if anything still needs processing
    if (result.changes === 0) {
      const existing = getScreenshot(filepath);
      if (!existing) return;
      const needsOcr = existing.ocr_status === "pending";
      const needsAi = existing.ai_status === "pending";
      const needsEmbed = existing.embed_status === "pending";
      if (!needsOcr && !needsAi && !needsEmbed) return;

      let ocrText = existing.ocr_text;

      if (needsOcr) {
        await waitForWorker();
        const res = await processImage(filepath);
        ocrText = res.ocrText;
        updateOcrResult({ filepath, ocrText, width: res.width, height: res.height });
        mainWindow?.webContents.send("screenshot:ocr-done", { filepath, ocrText });
      }

      if (needsAi) {
        const { aiTags, aiDescription } = await runAiTagging(filepath, ocrText);
        mainWindow?.webContents.send("screenshot:tagged", { filepath, aiTags, aiDescription });
      }

      if (needsEmbed) {
        await waitForEmbedder();
        const fresh = getScreenshot(filepath);
        const textToEmbed = [fresh?.ocr_text, fresh?.ai_tags, fresh?.ai_description].filter(Boolean).join(' ');
        const vector = await embed(textToEmbed);
        if (vector) {
          await upsertVector(filepath, vector, { filename });
          markEmbedded(filepath);
        }
      }
      return;
    }

    // New screenshot — full pipeline
    mainWindow?.webContents.send("screenshot:added", { filepath, filename, timestamp });

    await waitForWorker();
    const { ocrText, width, height } = await processImage(filepath);
    updateOcrResult({ filepath, ocrText, width, height });
    mainWindow?.webContents.send("screenshot:ocr-done", { filepath, ocrText });

    const { aiTags, aiDescription } = await runAiTagging(filepath, ocrText);
    mainWindow?.webContents.send("screenshot:tagged", { filepath, aiTags, aiDescription });

    await waitForEmbedder();
    const textToEmbed = [ocrText, aiTags, aiDescription].filter(Boolean).join(' ');
    const vector = await embed(textToEmbed);
    if (vector) {
      await upsertVector(filepath, vector, { filename });
      markEmbedded(filepath);
    }

  } catch (err) {
    console.error("Failed to ingest file:", filepath, err);
    markOcrFailed(filepath);
    markAiFailed(filepath);
  }
}

function startWatcher(folderPath, window) {
  if (watcher) stopWatcher();
  watchPath = folderPath;
  mainWindow = window;

  ;(async () => {
    const pending = getPendingScreenshots();
    console.log(`Shard: ${pending.length} pending screenshots from previous session`);

    const allFiles = fs.readdirSync(folderPath)
      .map(f => path.join(folderPath, f))
      .filter(isImage);

    const pendingPaths = new Set(pending.map(s => s.filepath));
    const toProcess = [
      ...pending.map(s => s.filepath),
      ...allFiles.filter(f => !pendingPaths.has(f)),
    ];

    const total = toProcess.length;
    console.log(`Shard: scanning ${total} files`);
    mainWindow?.webContents.send("scan:start", { total });

    for (let i = 0; i < toProcess.length; i++) {
      await ingestFile(toProcess[i]);
      mainWindow?.webContents.send("scan:progress", { total, current: i + 1 });
    }

    mainWindow?.webContents.send("scan:complete");
    console.log("Shard: initial scan complete");
    scheduleIdle();
  })();

  watcher = chokidar.watch(folderPath, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 1500, pollInterval: 100 },
  });

  watcher.on("add", async (filepath) => {
    await ingestFile(filepath);
    scheduleIdle();
  });

  watcher.on("unlink", (filepath) => {
    deleteScreenshot(filepath);
    mainWindow?.webContents.send("screenshot:removed", { filepath });
  });

  watcher.on("error", (err) => console.error("Watcher error:", err));

  console.log(`Shard: watching ${folderPath}`);
}

function stopWatcher() {
  if (watcher) { watcher.close(); watcher = null; }
  if (idleTimer) { clearTimeout(idleTimer); idleTimer = null; }
}

function getWatchPath() {
  return watchPath;
}

async function retryPending() {
  const pending = getPendingScreenshots();
  for (const screenshot of pending) {
    await ingestFile(screenshot.filepath);
  }
  scheduleIdle();
}

async function ingestFileForced(filepath) {
  const { resetScreenshotStatus } = require('./db');
  resetScreenshotStatus(filepath);
  await ingestFile(filepath);
  scheduleIdle();
}

module.exports = { startWatcher, stopWatcher, getWatchPath, retryPending, ingestFileForced };