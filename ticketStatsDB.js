const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'ticketstats.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS claim_stats (
      user_id TEXT PRIMARY KEY,
      user_tag TEXT,
      claim_count INTEGER DEFAULT 0
    )
  `);
});

module.exports = db;