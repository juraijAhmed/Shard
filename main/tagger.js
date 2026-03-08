const { pipeline, env } = require('@huggingface/transformers')
const path = require('path')
const { app } = require('electron')

// Cache model in userData so it only downloads once
env.cacheDir = path.join(app.getPath('userData'), 'models')

const CANDIDATE_LABELS = [
  // UI & software
  'code editor', 'terminal', 'browser', 'spreadsheet', 'document',
  'email', 'chat message', 'video call', 'dashboard', 'settings',
  // Content types  
  'error message', 'graph or chart', 'table or data', 'form', 'login screen',
  // Media & real world
  'photograph', 'aircraft or aviation', 'map or location', 'receipt or invoice',
  'social media', 'video or media player', 'game', 'diagram or flowchart',
  // General
  'text heavy', 'dark theme', 'light theme',
]

let classifier = null

async function initTagger() {
  if (classifier) return
  classifier = await pipeline('zero-shot-image-classification', 'Xenova/clip-vit-base-patch32')
}

async function tagImage(filepath) {
  if (!classifier) throw new Error('Tagger not initialised')

  const output = await classifier(filepath, CANDIDATE_LABELS, {
    topk: 5, // return top 5 matching labels
  })

  // Only keep labels with decent confidence
  const tags = output
    .filter((r) => r.score > 0.08)
    .map((r) => r.label)

  const description = tags.slice(0, 3).join(', ')

  return { tags: tags.join(', '), description }
}

async function terminateTagger() {
  classifier = null
}

module.exports = { initTagger, tagImage, terminateTagger }