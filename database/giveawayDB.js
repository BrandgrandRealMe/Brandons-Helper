import Database from 'better-sqlite3';

const db = new Database('./giveaways.db');

// Ensure tables exist
db.prepare(`
  CREATE TABLE IF NOT EXISTS giveaways (
    id TEXT PRIMARY KEY,
    channel_id TEXT,
    message_id TEXT,
    prize TEXT,
    host_id TEXT,
    end_time INTEGER,
    winner_count INTEGER,
    ended INTEGER DEFAULT 0
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS entries (
    giveaway_id TEXT,
    user_id TEXT,
    UNIQUE(giveaway_id, user_id)  
  )
`).run();

export default db;
