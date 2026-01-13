import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve to project root database directory
const dbPath = path.resolve(__dirname, '../../../database/helphive.db');

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

console.log('📁 Database path:', dbPath);

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');


// Initialize database schema
export function initializeDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL CHECK(role IN ('user', 'volunteer')),
      is_verified INTEGER DEFAULT 0,
      latitude REAL,
      longitude REAL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // Help requests table
  db.exec(`
    CREATE TABLE IF NOT EXISTS help_requests (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      help_type TEXT NOT NULL CHECK(help_type IN ('medical', 'transport', 'shelter', 'supplies', 'other')),
      urgency_level TEXT NOT NULL CHECK(urgency_level IN ('high', 'medium', 'low')),
      location_name TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('open', 'accepted', 'completed', 'expired')),
      volunteer_id TEXT,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      completed_at INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (volunteer_id) REFERENCES users(id)
    )
  `);

  // Request responses table
  db.exec(`
    CREATE TABLE IF NOT EXISTS request_responses (
      id TEXT PRIMARY KEY,
      request_id TEXT NOT NULL,
      volunteer_id TEXT NOT NULL,
      message TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (request_id) REFERENCES help_requests(id),
      FOREIGN KEY (volunteer_id) REFERENCES users(id)
    )
  `);

  // Create indexes for better query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_requests_status ON help_requests(status);
    CREATE INDEX IF NOT EXISTS idx_requests_user ON help_requests(user_id);
    CREATE INDEX IF NOT EXISTS idx_requests_volunteer ON help_requests(volunteer_id);
    CREATE INDEX IF NOT EXISTS idx_requests_expires ON help_requests(expires_at);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `);

  console.log('✅ Database initialized successfully');
}

export default db;
