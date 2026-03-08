const { createWorker } = require('tesseract.js')
const sizeOf = require('image-size')

let worker = null
let isReady = false
let queue = []
let isProcessing = false

async function initWorker() {
  if (worker) return
  worker = await createWorker('eng', 1, {
    // Cache trained data in userData so it's only downloaded once
    cachePath: require('path').join(require('electron').app.getPath('userData'), 'tessdata'),
    logger: () => {}, // suppress verbose logs
  })
  isReady = true
  processQueue()
}

async function processQueue() {
  if (isProcessing || queue.length === 0) return
  isProcessing = true

  while (queue.length > 0) {
    const { filepath, resolve, reject } = queue.shift()
    try {
      const result = await runOcr(filepath)
      resolve(result)
    } catch (err) {
      reject(err)
    }
  }

  isProcessing = false
}

async function runOcr(filepath) {
  const { data } = await worker.recognize(filepath)

  // Get image dimensions
  let width = null
  let height = null
  try {
    const dims = sizeOf(filepath)
    width = dims.width
    height = dims.height
  } catch (_) {}

  return {
    ocrText: data.text.trim(),
    width,
    height,
  }
}

// Public: queue a file for OCR, returns a promise
function processImage(filepath) {
  return new Promise((resolve, reject) => {
    queue.push({ filepath, resolve, reject })
    if (isReady) processQueue()
  })
}

async function terminate() {
  if (worker) {
    await worker.terminate()
    worker = null
    isReady = false
  }
}

module.exports = { initWorker, processImage, terminate }