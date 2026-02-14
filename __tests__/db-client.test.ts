import * as fs from 'fs';
import * as path from 'path';
import { BPTrackerDatabase, createBPTrackerDatabase, BPRecord, CreateBPRecordInput } from '../lib/db';

describe('BPTrackerDatabase CRUD Operations', () => {
  const testDbPath = path.join(process.cwd(), 'db', 'test-crud.db');
  let db: BPTrackerDatabase;

  beforeEach(() => {
    // Clean up test database before each test
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    // Initialize the schema manually for tests
    const dbInstance = new (require('better-sqlite3'))(testDbPath);
    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS bp_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        systolic INTEGER NOT NULL,
        diastolic INTEGER NOT NULL,
        heart_rate INTEGER NOT NULL,
        recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        notes TEXT
      );
    `);
    dbInstance.close();

    // Create our database client
    db = createBPTrackerDatabase(testDbPath);
  });

  afterEach(() => {
    db.close();
    // Clean up test database after each test
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('createRecord', () => {
    it('should create a record with all fields', () => {
      const input: CreateBPRecordInput = {
        systolic: 120,
        diastolic: 80,
        heartRate: 72,
        notes: 'Morning reading'
      };

      const record = db.createRecord(input);

      expect(record).toBeDefined();
      expect(record.id).toBeDefined();
      expect(record.systolic).toBe(120);
      expect(record.diastolic).toBe(80);
      expect(record.heart_rate).toBe(72);
      expect(record.notes).toBe('Morning reading');
      expect(record.recorded_at).toBeDefined();
    });

    it('should create a record without optional notes', () => {
      const input: CreateBPRecordInput = {
        systolic: 130,
        diastolic: 85,
        heartRate: 75
      };

      const record = db.createRecord(input);

      expect(record).toBeDefined();
      expect(record.id).toBeDefined();
      expect(record.systolic).toBe(130);
      expect(record.diastolic).toBe(85);
      expect(record.heart_rate).toBe(75);
      expect(record.notes).toBeNull();
    });

    it('should auto-generate timestamps', () => {
      const input: CreateBPRecordInput = {
        systolic: 120,
        diastolic: 80,
        heartRate: 72
      };

      const record = db.createRecord(input);

      expect(record.recorded_at).toBeDefined();
      const recordDate = new Date(record.recorded_at);
      expect(recordDate).toBeInstanceOf(Date);
      expect(isNaN(recordDate.getTime())).toBe(false);
    });
  });

  describe('getRecords', () => {
    it('should return empty array when no records exist', () => {
      const result = db.getRecords();
      expect(result.records).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should return all records ordered by recorded_at DESC', () => {
      // Insert multiple records with explicit timestamps
      const insert = (db as any).db.prepare(
        `INSERT INTO bp_records (systolic, diastolic, heart_rate, recorded_at) 
         VALUES (?, ?, ?, datetime('now', ?))`
      );

      insert.run(120, 80, 72, '-2 minutes');
      const record1Id = insert.run(120, 80, 72, '-1 minutes').lastInsertRowid;
      const record2Id = insert.run(120, 80, 72, 'localtime').lastInsertRowid;

      const result = db.getRecords();

      expect(result.records).toHaveLength(3);
      expect(result.total).toBe(3);
      // Should be ordered by recorded_at DESC (newest first)
      expect(result.records[0].id).toBe(Number(record2Id));
      expect(result.records[1].id).toBe(Number(record1Id));
    });

    it('should respect limit parameter', () => {
      db.createRecord({ systolic: 120, diastolic: 80, heartRate: 72 });
      db.createRecord({ systolic: 130, diastolic: 85, heartRate: 75 });
      db.createRecord({ systolic: 110, diastolic: 70, heartRate: 68 });

      const result = db.getRecords({ limit: 2 });

      expect(result.records).toHaveLength(2);
      expect(result.total).toBe(3);
    });

    it('should respect offset parameter', () => {
      // Insert multiple records with explicit timestamps
      const insert = (db as any).db.prepare(
        `INSERT INTO bp_records (systolic, diastolic, heart_rate, recorded_at) 
         VALUES (?, ?, ?, datetime('now', ?))`
      );

      insert.run(120, 80, 72, '-3 minutes');
      const record1Id = insert.run(120, 80, 72, '-2 minutes').lastInsertRowid;
      const record2Id = insert.run(120, 80, 72, '-1 minutes').lastInsertRowid;
      insert.run(120, 80, 72, 'localtime');

      const result = db.getRecords({ limit: 10, offset: 1 });

      expect(result.records).toHaveLength(3);
      expect(result.total).toBe(4);
      expect(result.records[0].id).toBe(Number(record2Id));
      expect(result.records[1].id).toBe(Number(record1Id));
    });

    it('should default to 50 records when no limit specified', () => {
      // Create 5 records (less than default limit)
      for (let i = 0; i < 5; i++) {
        db.createRecord({ systolic: 120 + i, diastolic: 80, heartRate: 72 });
      }

      const result = db.getRecords();

      expect(result.records).toHaveLength(5);
      expect(result.total).toBe(5);
    });

    it('should filter by days parameter', () => {
      // Create records with different dates using raw SQL
      const insert = (db as any).db.prepare(
        `INSERT INTO bp_records (systolic, diastolic, heart_rate, recorded_at) 
         VALUES (?, ?, ?, ?)`
      );

      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

      insert.run(120, 80, 72, now.toISOString());
      insert.run(130, 85, 75, yesterday.toISOString());
      insert.run(140, 90, 80, fiveDaysAgo.toISOString());

      const result = db.getRecords({ days: 3 });

      expect(result.total).toBe(2); // Today + yesterday
      expect(result.records.length).toBe(2);
    });
  });

  describe('getRecordById', () => {
    it('should return a record by ID', () => {
      const created = db.createRecord({
        systolic: 120,
        diastolic: 80,
        heartRate: 72,
        notes: 'Test record'
      });

      const retrieved = db.getRecordById(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.systolic).toBe(120);
      expect(retrieved?.diastolic).toBe(80);
      expect(retrieved?.heart_rate).toBe(72);
      expect(retrieved?.notes).toBe('Test record');
    });

    it('should return null for non-existent ID', () => {
      const record = db.getRecordById(999999);

      expect(record).toBeNull();
    });

    it('should return correct types', () => {
      const created = db.createRecord({ systolic: 120, diastolic: 80, heartRate: 72 });
      const retrieved = db.getRecordById(created.id);

      expect(typeof retrieved?.id).toBe('number');
      expect(typeof retrieved?.systolic).toBe('number');
      expect(typeof retrieved?.diastolic).toBe('number');
      expect(typeof retrieved?.heart_rate).toBe('number');
      expect(typeof retrieved?.recorded_at).toBe('string');
    });
  });

  describe('deleteRecord', () => {
    it('should delete a record by ID', () => {
      const created = db.createRecord({ systolic: 120, diastolic: 80, heartRate: 72 });

      const deleted = db.deleteRecord(created.id);

      expect(deleted).toBe(true);

      const retrieved = db.getRecordById(created.id);
      expect(retrieved).toBeNull();
    });

    it('should return true when deleting existing record', () => {
      const created = db.createRecord({ systolic: 120, diastolic: 80, heartRate: 72 });

      const result = db.deleteRecord(created.id);

      expect(result).toBe(true);
    });

    it('should return false when deleting non-existent record', () => {
      const result = db.deleteRecord(999999);

      expect(result).toBe(false);
    });

    it('should only delete the specified record', () => {
      const record1 = db.createRecord({ systolic: 120, diastolic: 80, heartRate: 72 });
      const record2 = db.createRecord({ systolic: 130, diastolic: 85, heartRate: 75 });

      db.deleteRecord(record1.id);

      expect(db.getRecordById(record1.id)).toBeNull();
      expect(db.getRecordById(record2.id)).toBeDefined();
    });
  });
});
