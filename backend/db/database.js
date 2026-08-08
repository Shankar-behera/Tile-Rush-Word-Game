const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// File-based DB so games/scores survive a server restart.
// (Swap for ':memory:' only if you want a totally clean slate on every boot.)
const dbPath = path.join(__dirname, 'wordgame.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON');

  db.run(`CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_name TEXT NOT NULL,
    letters TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    score INTEGER NOT NULL DEFAULT 0,
    duration_seconds INTEGER NOT NULL DEFAULT 120,
    started_at TEXT NOT NULL,
    ended_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    word TEXT NOT NULL,
    score INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (game_id) REFERENCES games(id)
  )`);

  db.run(`CREATE INDEX IF NOT EXISTS idx_words_game_id ON words(game_id)`);
});

// Small promise wrappers so routes can use async/await instead of callback pyramids.
const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });

const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });

const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });

module.exports = { db, run, get, all };
