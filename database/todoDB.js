import Database from 'better-sqlite3';

const db = new Database('./database/todos.db');

db.prepare(`
  CREATE TABLE IF NOT EXISTS todos (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    task TEXT,
    done INTEGER DEFAULT 0
  )
`).run();

export default db;
