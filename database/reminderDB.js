// database/reminderDB.js
import Database from 'better-sqlite3';

const db = new Database('./reminders.db');

db.prepare(`
  CREATE TABLE IF NOT EXISTS reminders (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    channel_id TEXT,
    message TEXT,
    remind_at INTEGER,
    reminded INTEGER DEFAULT 0
  )
`).run();

export default db;
