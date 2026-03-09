const Database = require("better-sqlite3");
const path = require("path");
const { app } = require("electron");

let db = null;

function getDb() {
  if (db) return db;

  const dbPath = path.join(app.getPath("userData"), "shard.db");
  db = new Database(dbPath);

  // Enable WAL mode for better performance
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
  CREATE TABLE IF NOT EXISTS screenshots (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    filepath        TEXT NOT NULL UNIQUE,
    filename        TEXT NOT NULL,
    timestamp       INTEGER NOT NULL,
    ocr_text        TEXT,
    ocr_status      TEXT NOT NULL DEFAULT 'pending',
    ai_tags         TEXT,
    ai_description  TEXT,
    ai_status       TEXT NOT NULL DEFAULT 'pending',
    width           INTEGER,
    height          INTEGER,
    file_size       INTEGER,
    embed_status    TEXT NOT NULL DEFAULT 'pending'
  );
  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_screenshots_timestamp ON screenshots(timestamp DESC);
  CREATE INDEX IF NOT EXISTS idx_screenshots_ocr_status ON screenshots(ocr_status);
`);
  return db;
}

// --- Screenshots ---

function insertScreenshot({ filepath, filename, timestamp, fileSize }) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO screenshots (filepath, filename, timestamp, file_size, ocr_status)
    VALUES (@filepath, @filename, @timestamp, @fileSize, 'pending')
  `);
  return stmt.run({ filepath, filename, timestamp, fileSize });
}

function updateOcrResult({ filepath, ocrText, width, height }) {
  const db = getDb();
  const stmt = db.prepare(`
    UPDATE screenshots
    SET ocr_text = @ocrText, ocr_status = 'done', width = @width, height = @height
    WHERE filepath = @filepath
  `);
  return stmt.run({ filepath, ocrText, width, height });
}

function markOcrFailed(filepath) {
  const db = getDb();
  db.prepare(
    `UPDATE screenshots SET ocr_status = 'failed' WHERE filepath = ?`,
  ).run(filepath);
}

function getAllScreenshots() {
  const db = getDb();
  return db
    .prepare(
      `
    SELECT * FROM screenshots ORDER BY timestamp DESC
  `,
    )
    .all();
}

function searchScreenshots(query) {
  const db = getDb();
  const like = `%${query}%`;
  return db
    .prepare(
      `
    SELECT * FROM screenshots
    WHERE ocr_text LIKE ?
       OR ai_tags LIKE ?
       OR ai_description LIKE ?
    ORDER BY timestamp DESC
  `,
    )
    .all(like, like, like);
}

function getPendingScreenshots() {
  const db = getDb();
  return db
    .prepare(
      `
    SELECT * FROM screenshots WHERE ocr_status = 'pending'
  `,
    )
    .all();
}

function deleteScreenshot(filepath) {
  const db = getDb();
  db.prepare(`DELETE FROM screenshots WHERE filepath = ?`).run(filepath);
}

// --- Settings ---

function getSetting(key) {
  const db = getDb();
  const row = db.prepare(`SELECT value FROM settings WHERE key = ?`).get(key);
  return row ? row.value : null;
}

function setSetting(key, value) {
  const db = getDb();
  db.prepare(
    `
    INSERT INTO settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `,
  ).run(key, value);
}

function updateAiResult({ filepath, aiTags, aiDescription }) {
  const db = getDb();
  db.prepare(
    `
    UPDATE screenshots
    SET ai_tags = @aiTags, ai_description = @aiDescription, ai_status = 'done'
    WHERE filepath = @filepath
  `,
  ).run({ filepath, aiTags, aiDescription });
}

function markAiFailed(filepath) {
  const db = getDb();
  db.prepare(
    `UPDATE screenshots SET ai_status = 'failed' WHERE filepath = ?`,
  ).run(filepath);
}
function markEmbedded(filepath) {
  const db = getDb();
  db.prepare(
    `UPDATE screenshots SET embed_status = 'done' WHERE filepath = ?`,
  ).run(filepath);
}

function getPendingEmbeds() {
  const db = getDb();
  return db
    .prepare(
      `SELECT * FROM screenshots WHERE embed_status = 'pending' AND ocr_status = 'done'`,
    )
    .all();
}
module.exports = {
  getDb,
  insertScreenshot,
  updateOcrResult,
  markOcrFailed,
  getAllScreenshots,
  searchScreenshots,
  getPendingScreenshots,
  deleteScreenshot,
  getSetting,
  setSetting,
  updateAiResult,
  markAiFailed,
  markEmbedded,
  getPendingEmbeds,
};
