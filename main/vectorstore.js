const { LocalIndex } = require('vectra')
const path = require('path')
const { app } = require('electron')

let index = null

async function getIndex() {
  if (index) return index
  const indexPath = path.join(app.getPath('userData'), 'vectorstore')
  index = new LocalIndex(indexPath)
  if (!await index.isIndexCreated()) {
    await index.createIndex()
  }
  return index
}

async function upsertVector(filepath, vector, metadata) {
  const idx = await getIndex()
  // Use filepath as a stable ID
  const id = Buffer.from(filepath).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 40)
  await idx.upsertItem({ id, vector, metadata: { filepath, ...metadata } })
}

async function searchVectors(queryVector, topK = 20) {
  const idx = await getIndex()
  const results = await idx.queryItems(queryVector, topK)
  return results.map((r) => ({
    filepath: r.item.metadata.filepath,
    score: r.score,
  }))
}

async function deleteVector(filepath) {
  const idx = await getIndex()
  const id = Buffer.from(filepath).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 40)
  try { await idx.deleteItem(id) } catch (_) {}
}

module.exports = { upsertVector, searchVectors, deleteVector }