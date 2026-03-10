let isReady = false
const queue = []

function cleanOcrText(text) {
  return text
    .replace(/[^\x00-\x7F\n]/g, (char) => {
      const map = { '◆': '•', '→': '-', '◄': '<', '►': '>', '▶': '>', '◀': '<' }
      return map[char] || ''
    })
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

async function preprocessImage(filepath) {
  const sharp = require('sharp')
  const path = require('path')
  const os = require('os')

  const base = path.join(os.tmpdir(), `shard_ocr_${Date.now()}`)

  // Generate multiple contrast variants
  const variants = [
    // Standard: grayscale + normalize
    sharp(filepath).resize({ width: 2400, withoutEnlargement: false })
      .grayscale().normalize().sharpen().toFile(`${base}_a.png`),
    // High contrast: grayscale + high threshold
    sharp(filepath).resize({ width: 2400, withoutEnlargement: false })
      .grayscale().normalize().linear(2.0, -128).sharpen().toFile(`${base}_b.png`),
    // Inverted: good for light text on dark OR coloured text on white
    sharp(filepath).resize({ width: 2400, withoutEnlargement: false })
      .grayscale().normalize().negate().sharpen().toFile(`${base}_c.png`),
    // Threshold: pure black and white
    sharp(filepath).resize({ width: 2400, withoutEnlargement: false })
      .grayscale().threshold(128).toFile(`${base}_d.png`),
  ]

  await Promise.all(variants)
  return [`${base}_a.png`, `${base}_b.png`, `${base}_c.png`, `${base}_d.png`]
}
async function runWindowsOcr(filepath) {
  const { execFile } = require('child_process')
  const fs = require('fs')

  let tempPaths = []
  try {
    tempPaths = await preprocessImage(filepath)
  } catch (err) {
    console.warn('Shard: preprocessing failed, using original', err.message)
    tempPaths = [filepath]
  }

  async function ocrFile(targetPath) {
    const normalizedPath = targetPath.replace(/\//g, '\\')
    const script = `
      Add-Type -AssemblyName System.Runtime.WindowsRuntime
      $null = [Windows.Storage.StorageFile,Windows.Storage,ContentType=WindowsRuntime]
      $null = [Windows.Media.Ocr.OcrEngine,Windows.Foundation,ContentType=WindowsRuntime]
      $null = [Windows.Graphics.Imaging.BitmapDecoder,Windows.Foundation,ContentType=WindowsRuntime]
      function Await($WinRtTask, $ResultType) {
        $asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation\`1' })[0]
        $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
        $netTask = $asTask.Invoke($null, @($WinRtTask))
        $netTask.Wait(-1) | Out-Null
        $netTask.Result
      }
      $file = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync('${normalizedPath}')) ([Windows.Storage.StorageFile])
      $stream = Await ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
      $decoder = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
      $bitmap = Await ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
      $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
      $result = Await ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])
      $lines = $result.Lines | ForEach-Object { $_.Text }
      $lines -join "\`n"
    `
    return new Promise((resolve) => {
      execFile('powershell', ['-NoProfile', '-NonInteractive', '-Command', script],
        { timeout: 30000 }, (err, stdout) => {
          resolve(err ? '' : cleanOcrText(stdout.trim()))
        })
    })
  }

  // Run all variants, pick the one with the most text
  const results = await Promise.all(tempPaths.map(ocrFile))

  // Cleanup temp files
  for (const p of tempPaths) {
    if (p !== filepath) try { fs.unlinkSync(p) } catch (_) {}
  }

  const best = results.reduce((a, b) => a.length >= b.length ? a : b, '')
  console.log('Shard: OCR variants lengths:', results.map(r => r.length), '→ picked', best.length, 'chars')
  return best
}
async function getImageDimensions(filepath) {
  try {
    const sizeOf = require('image-size')
    const dims = sizeOf(filepath)
    return { width: dims.width, height: dims.height }
  } catch {
    return { width: null, height: null }
  }
}

async function processQueue() {
  if (!isReady || queue.length === 0) return
  const { filepath, resolve, reject } = queue.shift()
  try {
    const [ocrText, dims] = await Promise.all([
      runWindowsOcr(filepath),
      getImageDimensions(filepath),
    ])
    resolve({ ocrText, width: dims.width, height: dims.height })
  } catch (err) {
    console.error('Windows OCR failed for', filepath, err)
    resolve({ ocrText: '', width: null, height: null })
  }
  processQueue()
}

async function initWorker() {
  isReady = true
  processQueue()
  console.log('Shard: Windows OCR ready')
}

async function processImage(filepath) {
  if (!isReady) await initWorker()
  return new Promise((resolve, reject) => {
    queue.push({ filepath, resolve, reject })
    if (isReady) processQueue()
  })
}

async function terminate() {
  if (queue.length > 0) {
    console.log('Shard: OCR queue not empty, skipping terminate')
    return
  }
  isReady = false
  console.log('Shard: Windows OCR unloaded')
}

async function waitForWorker() {
  if (!isReady) await initWorker()
}

module.exports = { processImage, terminate, waitForWorker }