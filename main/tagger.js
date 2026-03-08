const { pipeline, env } = require('@huggingface/transformers')
const path = require('path')
const { app } = require('electron')

env.cacheDir = path.join(app.getPath('userData'), 'models')

const CANDIDATE_LABELS = [
  'airplane', 'aircraft', 'helicopter', 'airport',
  'car', 'vehicle', 'train', 'ship',
  'resume', 'CV', 'cover letter', 'contract', 'invoice',
  'receipt', 'certificate', 'report', 'letter',
  'code editor', 'terminal', 'browser', 'website',
  'spreadsheet', 'presentation slide', 'email',
  'chat conversation', 'video call', 'login screen',
  'graph', 'chart', 'dashboard', 'diagram', 'map', 'table',
  'social media post', 'tweet', 'news article', 'video player',
  'error message', 'warning', 'notification',
  'photograph', 'clothing', 'food', 'animal', 'cat', 'dog',
  'person', 'building', 'nature', 'product photo',
  't-shirt', 'dark theme', 'light theme',
]

const SYNONYMS = {
  'airplane':           ['plane', 'flight', 'aircraft', 'aviation'],
  'aircraft':           ['plane', 'airplane', 'flight', 'aviation'],
  'resume':             ['CV', 'job application', 'work experience'],
  'CV':                 ['resume', 'job application'],
  'invoice':            ['bill', 'payment', 'receipt'],
  'code editor':        ['code', 'programming', 'IDE'],
  'terminal':           ['command line', 'shell', 'console'],
  'browser':            ['website', 'internet', 'web'],
  'spreadsheet':        ['Excel', 'table', 'data'],
  'presentation slide': ['PowerPoint', 'slides', 'deck'],
  'error message':      ['bug', 'crash', 'exception'],
  'graph':              ['chart', 'data', 'statistics'],
  'map':                ['location', 'geography', 'navigation'],
  'social media post':  ['tweet', 'Instagram', 'Facebook'],
  'cat':                ['animal', 'pet'],
  'dog':                ['animal', 'pet'],
  'clothing':           ['fashion', 'apparel', 'shirt', 'outfit'],
  't-shirt':            ['clothing', 'fashion', 'shirt'],
}

let classifier = null
let readyResolve
const readyPromise = new Promise((resolve) => { readyResolve = resolve })

async function initTagger() {
  if (classifier) return
  try {
    classifier = await pipeline('zero-shot-image-classification', 'Xenova/clip-vit-base-patch32')
    readyResolve()
  } catch (err) {
    console.error('Tagger failed to init:', err)
    readyResolve() // resolve anyway so OCR isn't blocked forever
  }
}

async function waitForTagger() {
  return readyPromise
}

async function tagImage(filepath) {
  if (!classifier) return { tags: '', description: '' }

  const output = await classifier(filepath, CANDIDATE_LABELS, { topk: 8 })
  const matched = output.filter((r) => r.score > 0.12)
  const baseTags = matched.map((r) => r.label)

  const allTags = new Set(baseTags)
  for (const tag of baseTags) {
    (SYNONYMS[tag] || []).forEach((s) => allTags.add(s))
  }

  const tags = [...allTags].join(', ')
  const description = baseTags.slice(0, 3).join(', ')

  return { tags, description }
}

async function terminateTagger() {
  classifier = null
}

module.exports = { initTagger, tagImage, terminateTagger, waitForTagger }