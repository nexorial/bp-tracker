import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

const DB_PATH = path.join(process.cwd(), 'db', 'bp.db');
const SCHEMA_PATH = path.join(process.cwd(), 'db', 'schema.sql');

export function initDatabase(): Database.Database {
  // Ensure db directory exists
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Open or create database
  const db = new Database(DB_PATH);

  // Enable foreign keys
  db.pragma('journal_mode = WAL');

  // Execute schema
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  db.exec(schema);

  return db;
}

export function getDatabase(): Database.Database {
  return new Database(DB_PATH);
}

// Initialize if run directly
if (require.main === module) {
  initDatabase();
  console.log('Database initialized successfully at:', DB_PATH);
}
