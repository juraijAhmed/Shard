const { pipeline, env } = require('@huggingface/transformers')
const path = require('path')
const { app } = require('electron')

env.cacheDir = path.join(app.getPath('userData'), 'models')

let embedder = null
let readyResolve
const readyPromise = new Promise((resolve) => { readyResolve = resolve })

async function terminateEmbedder() {
  embedder = null
  // Reset ready promise
  readyPromise = new Promise((resolve) => { readyResolve = resolve })
}


async function initEmbedder() {
  if (embedder) return
  try {
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
    readyResolve()
  } catch (err) {
    console.error('Embedder failed to init:', err)
    readyResolve() // don't block the rest of the app
  }
}

async function waitForEmbedder() {
  return readyPromise
}

async function embed(text) {
   if (!embedder) await initEmbedder() 
  const output = await embedder(text, { pooling: 'mean', normalize: true })
  return Array.from(output.data)
}

async function terminateEmbedder() {
  embedder = null
}

module.exports = { initEmbedder, waitForEmbedder, embed, terminateEmbedder }