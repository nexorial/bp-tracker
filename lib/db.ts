import Database from 'better-sqlite3';
import * as path from 'path';

const DB_PATH = path.join(process.cwd(), 'db', 'bp.db');

// Type definitions for BP records
export interface BPRecord {
  id: number;
  systolic: number;
  diastolic: number;
  heart_rate: number;
  recorded_at: string;
  notes: string | null;
}

export interface CreateBPRecordInput {
  systolic: number;
  diastolic: number;
  heartRate: number;
  notes?: string;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

// Database client class
export class BPTrackerDatabase {
  private db: Database.Database;

  constructor(dbPath: string = DB_PATH) {
    this.db = new Database(dbPath);
  }

  /**
   * Create a new blood pressure record
   */
  createRecord(input: CreateBPRecordInput): BPRecord {
    const insert = this.db.prepare(
      `INSERT INTO bp_records (systolic, diastolic, heart_rate, notes)
       VALUES (?, ?, ?, ?)`
    );

    const result = insert.run(
      input.systolic,
      input.diastolic,
      input.heartRate,
      input.notes ?? null
    );

    const record = this.getRecordById(Number(result.lastInsertRowid));
    if (!record) {
      throw new Error('Failed to retrieve created record');
    }

    return record;
  }

  /**
   * Get all records with optional pagination, ordered by recorded_at DESC
   */
  getRecords(options: PaginationOptions = {}): BPRecord[] {
    const limit = options.limit ?? 100;
    const offset = options.offset ?? 0;

    const query = this.db.prepare(
      `SELECT * FROM bp_records 
       ORDER BY recorded_at DESC 
       LIMIT ? OFFSET ?`
    );

    return query.all(limit, offset) as BPRecord[];
  }

  /**
   * Get a single record by ID
   */
  getRecordById(id: number): BPRecord | null {
    const query = this.db.prepare('SELECT * FROM bp_records WHERE id = ?');
    const record = query.get(id) as BPRecord | undefined;
    return record ?? null;
  }

  /**
   * Delete a record by ID
   */
  deleteRecord(id: number): boolean {
    const query = this.db.prepare('DELETE FROM bp_records WHERE id = ?');
    const result = query.run(id);
    return result.changes > 0;
  }

  /**
   * Close the database connection
   */
  close(): void {
    this.db.close();
  }
}

// Singleton instance for application use
let dbInstance: BPTrackerDatabase | null = null;

export function getBPTrackerDatabase(): BPTrackerDatabase {
  if (!dbInstance) {
    dbInstance = new BPTrackerDatabase();
  }
  return dbInstance;
}

// For testing - allows creating new instances
export function createBPTrackerDatabase(dbPath: string): BPTrackerDatabase {
  return new BPTrackerDatabase(dbPath);
}
