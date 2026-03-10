const { pipeline, env } = require('@huggingface/transformers')
const path = require('path')
const { app } = require('electron')

env.cacheDir = path.join(app.getPath('userData'), 'models')

let captioner = null
let initPromise = null

async function initTagger() {
  if (initPromise) return initPromise
  initPromise = (async () => {
    console.log('Shard: loading captioning model...')
    captioner = await pipeline('image-to-text', 'Xenova/vit-gpt2-image-captioning')
    console.log('Shard: captioning model ready')
  })()
  return initPromise
}

async function waitForTagger() {
  await initTagger()
}

async function tagImage(filepath) {
  if (!captioner) await initTagger()
  try {
    const result = await captioner(filepath)
    const caption = result[0]?.generated_text || ''

    // Use caption as both description and extract keywords as tags
    const tags = extractKeywords(caption)

    return { tags, description: caption }
  } catch (err) {
    console.error('Captioning failed:', filepath, err)
    return { tags: '', description: '' }
  }
}

// Pull meaningful words out of the caption as tags
function extractKeywords(caption) {
  const stopwords = new Set(['a', 'an', 'the', 'is', 'are', 'was', 'with', 'of', 'in', 'on', 'at', 'to', 'and', 'or', 'it', 'its', 'this', 'that', 'by', 'for', 'from', 'has', 'have', 'be', 'been', 'being'])
  return caption
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopwords.has(w))
    .join(', ')
}

async function terminateTagger() {
  captioner = null
  initPromise = null  // ← this line is critical, must reset so re-init works
  console.log('Shard: captioning model unloaded')
}

module.exports = { tagImage, waitForTagger, terminateTagger }