import * as fs from 'fs';
import * as path from 'path';
import Database from 'better-sqlite3';
import { initDatabase, getDatabase } from '../db/init';

describe('Database Schema', () => {
  const testDbPath = path.join(process.cwd(), 'db', 'test-bp.db');

  beforeEach(() => {
    // Clean up test database before each test
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  afterEach(() => {
    // Clean up test database after each test
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  it('should create bp_records table with all required columns', () => {
    const db = initDatabase();
    
    // Check if table exists
    const tableInfo = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='bp_records'"
    ).get() as { name: string } | undefined;
    
    expect(tableInfo).toBeDefined();
    expect(tableInfo?.name).toBe('bp_records');

    // Get column info
    const columns = db.prepare("PRAGMA table_info(bp_records)").all() as Array<{
      name: string;
      type: string;
      notnull: number;
      dflt_value: string | null;
      pk: number;
    }>;

    const columnMap = new Map(columns.map(c => [c.name, c]));

    // Verify all required columns exist
    expect(columnMap.has('id')).toBe(true);
    expect(columnMap.has('systolic')).toBe(true);
    expect(columnMap.has('diastolic')).toBe(true);
    expect(columnMap.has('heart_rate')).toBe(true);
    expect(columnMap.has('recorded_at')).toBe(true);
    expect(columnMap.has('notes')).toBe(true);

    // Verify column types
    expect(columnMap.get('id')?.type).toBe('INTEGER');
    expect(columnMap.get('systolic')?.type).toBe('INTEGER');
    expect(columnMap.get('diastolic')?.type).toBe('INTEGER');
    expect(columnMap.get('heart_rate')?.type).toBe('INTEGER');
    expect(columnMap.get('recorded_at')?.type).toBe('DATETIME');
    expect(columnMap.get('notes')?.type).toBe('TEXT');

    // Verify NOT NULL constraints
    expect(columnMap.get('id')?.notnull).toBe(0); // PK is not null by default
    expect(columnMap.get('systolic')?.notnull).toBe(1);
    expect(columnMap.get('diastolic')?.notnull).toBe(1);
    expect(columnMap.get('heart_rate')?.notnull).toBe(1);
    expect(columnMap.get('recorded_at')?.notnull).toBe(0); // Has default value
    expect(columnMap.get('notes')?.notnull).toBe(0); // Optional

    // Verify id is primary key
    expect(columnMap.get('id')?.pk).toBe(1);

    db.close();
  });

  it('should have default CURRENT_TIMESTAMP for recorded_at', () => {
    const db = initDatabase();

    // Insert a record without specifying recorded_at
    const insert = db.prepare(
      'INSERT INTO bp_records (systolic, diastolic, heart_rate) VALUES (?, ?, ?)'
    );
    const result = insert.run(120, 80, 72);

    expect(result.lastInsertRowid).toBeDefined();

    // Retrieve the record
    const record = db.prepare('SELECT * FROM bp_records WHERE id = ?').get(result.lastInsertRowid) as {
      recorded_at: string;
    };

    expect(record.recorded_at).toBeDefined();
    expect(new Date(record.recorded_at)).toBeInstanceOf(Date);

    db.close();
  });

  it('should create index on recorded_at column', () => {
    const db = initDatabase();

    const indexInfo = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='index' AND name='idx_bp_records_recorded_at'"
    ).get() as { name: string } | undefined;

    expect(indexInfo).toBeDefined();
    expect(indexInfo?.name).toBe('idx_bp_records_recorded_at');

    db.close();
  });

  it('should enforce NOT NULL constraints on required fields', () => {
    const db = initDatabase();

    // Attempt to insert without required fields should fail
    expect(() => {
      db.prepare('INSERT INTO bp_records (diastolic, heart_rate) VALUES (?, ?)').run(80, 72);
    }).toThrow();

    expect(() => {
      db.prepare('INSERT INTO bp_records (systolic, heart_rate) VALUES (?, ?)').run(120, 72);
    }).toThrow();

    expect(() => {
      db.prepare('INSERT INTO bp_records (systolic, diastolic) VALUES (?, ?)').run(120, 80);
    }).toThrow();

    // Valid insert should succeed
    const result = db.prepare(
      'INSERT INTO bp_records (systolic, diastolic, heart_rate) VALUES (?, ?, ?)'
    ).run(120, 80, 72);

    expect(result.changes).toBe(1);

    db.close();
  });

  it('should allow optional notes field to be NULL', () => {
    const db = initDatabase();

    // Insert without notes
    const result1 = db.prepare(
      'INSERT INTO bp_records (systolic, diastolic, heart_rate) VALUES (?, ?, ?)'
    ).run(120, 80, 72);

    expect(result1.changes).toBe(1);

    // Insert with notes
    const result2 = db.prepare(
      'INSERT INTO bp_records (systolic, diastolic, heart_rate, notes) VALUES (?, ?, ?, ?)'
    ).run(130, 85, 75, 'After exercise');

    expect(result2.changes).toBe(1);

    db.close();
  });
});
