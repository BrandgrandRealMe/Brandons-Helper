import Database from 'better-sqlite3';

const db = new Database('./polls.db');

db.prepare(`
  CREATE TABLE IF NOT EXISTS polls (
    id TEXT PRIMARY KEY,
    channel_id TEXT,
    message_id TEXT,
    question TEXT,
    options TEXT,
    end_time INTEGER
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS poll_votes (
    poll_id TEXT,
    user_id TEXT,
    option_index INTEGER,
    UNIQUE(poll_id, user_id)
  )
`).run();

export default db;
