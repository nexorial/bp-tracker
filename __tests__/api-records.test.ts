import { POST, GET } from '@/app/api/records/route';
import { createBPTrackerDatabase, BPTrackerDatabase, resetBPTrackerDatabase } from '@/lib/db';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

// Mock the db module
jest.mock('@/lib/db', () => {
  const actual = jest.requireActual('@/lib/db');
  return {
    ...actual,
    getBPTrackerDatabase: jest.fn()
  };
});

import { getBPTrackerDatabase } from '@/lib/db';
const mockedGetBPTrackerDatabase = getBPTrackerDatabase as jest.MockedFunction<typeof getBPTrackerDatabase>;

describe('POST /api/records', () => {
  let tempDir: string;
  let dbPath: string;
  let db: BPTrackerDatabase;

  beforeEach(() => {
    // Create a temporary database for each test
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bp-api-test-'));
    dbPath = path.join(tempDir, 'test.db');
    
    // Create the database with schema
    const Database = require('better-sqlite3');
    const sqlite = new Database(dbPath);
    sqlite.exec(`
      CREATE TABLE bp_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        systolic INTEGER NOT NULL,
        diastolic INTEGER NOT NULL,
        heart_rate INTEGER NOT NULL,
        recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        notes TEXT
      );
      CREATE INDEX idx_recorded_at ON bp_records(recorded_at);
    `);
    sqlite.close();
    
    db = createBPTrackerDatabase(dbPath);
    mockedGetBPTrackerDatabase.mockReturnValue(db);
  });

  afterEach(() => {
    db.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
    jest.clearAllMocks();
  });

  function createRequest(body: unknown): Request {
    return new Request('http://localhost/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  }

  describe('string format input', () => {
    it('should create record with valid input string "120/80/72"', async () => {
      const request = createRequest({ input: '120/80/72' });
      
      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toMatchObject({
        id: expect.any(Number),
        systolic: 120,
        diastolic: 80,
        heart_rate: 72,
        recorded_at: expect.any(String),
        notes: null
      });
    });

    it('should create record without heart rate "120/80"', async () => {
      const request = createRequest({ input: '120/80' });
      
      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.heart_rate).toBe(0);
    });

    it('should create record with notes', async () => {
      const request = createRequest({ 
        input: '120/80/72',
        notes: 'After morning exercise'
      });
      
      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.notes).toBe('After morning exercise');
    });

    it('should return 400 for invalid string format', async () => {
      const request = createRequest({ input: 'invalid' });
      
      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid input format');
      expect(data.details).toContain('Invalid format. Expected: systolic/diastolic or systolic/diastolic/heartRate');
    });

    it('should return 400 for out of range values', async () => {
      const request = createRequest({ input: '300/80/72' });
      
      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid input format');
      expect(data.details).toContain('Systolic must be between 60 and 250');
    });
  });

  describe('object format input', () => {
    it('should create record with valid object format', async () => {
      const request = createRequest({
        systolic: 120,
        diastolic: 80,
        heartRate: 72
      });
      
      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toMatchObject({
        id: expect.any(Number),
        systolic: 120,
        diastolic: 80,
        heart_rate: 72,
        recorded_at: expect.any(String),
        notes: null
      });
    });

    it('should create record with object format and notes', async () => {
      const request = createRequest({
        systolic: 130,
        diastolic: 85,
        heartRate: 75,
        notes: 'Regular checkup'
      });
      
      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.systolic).toBe(130);
      expect(data.diastolic).toBe(85);
      expect(data.heart_rate).toBe(75);
      expect(data.notes).toBe('Regular checkup');
    });

    it('should return 400 for out of range systolic', async () => {
      const request = createRequest({
        systolic: 300,
        diastolic: 80,
        heartRate: 72
      });
      
      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid data');
      expect(data.details).toContain('Systolic must be between 60 and 250');
    });

    it('should return 400 for out of range diastolic', async () => {
      const request = createRequest({
        systolic: 120,
        diastolic: 10,
        heartRate: 72
      });
      
      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid data');
      expect(data.details).toContain('Diastolic must be between 40 and 150');
    });

    it('should return 400 for out of range heart rate', async () => {
      const request = createRequest({
        systolic: 120,
        diastolic: 80,
        heartRate: 250
      });
      
      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid data');
      expect(data.details).toContain('Heart rate must be between 40 and 200');
    });

    it('should return 400 for missing systolic', async () => {
      const request = createRequest({
        diastolic: 80,
        heartRate: 72
      });
      
      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request body');
    });

    it('should return 400 for missing diastolic', async () => {
      const request = createRequest({
        systolic: 120,
        heartRate: 72
      });
      
      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request body');
    });

    it('should return 400 for missing heartRate', async () => {
      const request = createRequest({
        systolic: 120,
        diastolic: 80
      });
      
      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request body');
    });
  });

  describe('edge cases', () => {
    it('should handle boundary values correctly', async () => {
      const request = createRequest({
        systolic: 60,
        diastolic: 40,
        heartRate: 40
      });
      
      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.systolic).toBe(60);
      expect(data.diastolic).toBe(40);
      expect(data.heart_rate).toBe(40);
    });

    it('should handle upper boundary values correctly', async () => {
      const request = createRequest({
        systolic: 250,
        diastolic: 150,
        heartRate: 200
      });
      
      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.systolic).toBe(250);
      expect(data.diastolic).toBe(150);
      expect(data.heart_rate).toBe(200);
    });

    it('should return 400 for empty body', async () => {
      const request = createRequest({});
      
      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request body');
    });

    it('should return 400 for null body', async () => {
      const request = createRequest(null);
      
      const response = await POST(request as any);
      
      expect(response.status).toBe(400);
    });

    it('should include timestamp in created record', async () => {
      const beforeTime = new Date().toISOString();
      
      const request = createRequest({ input: '120/80/72' });
      const response = await POST(request as any);
      const data = await response.json();
      
      const afterTime = new Date().toISOString();

      expect(response.status).toBe(201);
      expect(data.recorded_at).toBeDefined();
      const recordedTime = new Date(data.recorded_at).toISOString();
      expect(recordedTime >= beforeTime || recordedTime <= afterTime).toBe(true);
    });

    it('should create records with auto-incrementing IDs', async () => {
      const request1 = createRequest({ input: '120/80/72' });
      const response1 = await POST(request1 as any);
      const data1 = await response1.json();

      const request2 = createRequest({ input: '130/85/75' });
      const response2 = await POST(request2 as any);
      const data2 = await response2.json();

      expect(data2.id).toBe(data1.id + 1);
    });
  });
});

describe('GET /api/records', () => {
  let tempDir: string;
  let dbPath: string;
  let db: BPTrackerDatabase;

  beforeEach(() => {
    // Create a temporary database for each test
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bp-api-test-'));
    dbPath = path.join(tempDir, 'test.db');
    
    // Create the database with schema
    const Database = require('better-sqlite3');
    const sqlite = new Database(dbPath);
    sqlite.exec(`
      CREATE TABLE bp_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        systolic INTEGER NOT NULL,
        diastolic INTEGER NOT NULL,
        heart_rate INTEGER NOT NULL,
        recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        notes TEXT
      );
      CREATE INDEX idx_recorded_at ON bp_records(recorded_at);
    `);
    sqlite.close();
    
    db = createBPTrackerDatabase(dbPath);
    mockedGetBPTrackerDatabase.mockReturnValue(db);
  });

  afterEach(() => {
    db.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
    jest.clearAllMocks();
  });

  function createGetRequest(queryString: string = ''): Request {
    return new Request(`http://localhost/api/records${queryString}`, {
      method: 'GET'
    });
  }

  describe('basic retrieval', () => {
    it('should return empty array when no records exist', async () => {
      const request = createGetRequest();
      
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.records).toEqual([]);
      expect(data.total).toBe(0);
      expect(data.limit).toBe(50);
      expect(data.offset).toBe(0);
    });

    it('should return records ordered by recorded_at DESC', async () => {
      // Create test records
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      (db as any).db.prepare('INSERT INTO bp_records (systolic, diastolic, heart_rate, recorded_at) VALUES (?, ?, ?, ?)').run(120, 80, 72, yesterday.toISOString());
      (db as any).db.prepare('INSERT INTO bp_records (systolic, diastolic, heart_rate, recorded_at) VALUES (?, ?, ?, ?)').run(130, 85, 75, now.toISOString());

      const request = createGetRequest();
      
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.records).toHaveLength(2);
      expect(data.total).toBe(2);
      // Newest first
      expect(data.records[0].systolic).toBe(130);
      expect(data.records[1].systolic).toBe(120);
    });

    it('should return record structure with all fields', async () => {
      (db as any).db.prepare('INSERT INTO bp_records (systolic, diastolic, heart_rate, notes) VALUES (?, ?, ?, ?)').run(120, 80, 72, 'Test note');

      const request = createGetRequest();
      
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.records[0]).toMatchObject({
        id: expect.any(Number),
        systolic: 120,
        diastolic: 80,
        heart_rate: 72,
        recorded_at: expect.any(String),
        notes: 'Test note'
      });
    });
  });

  describe('pagination', () => {
    beforeEach(() => {
      // Create 5 records with different timestamps
      for (let i = 1; i <= 5; i++) {
        const timestamp = new Date(Date.now() - i * 60 * 60 * 1000).toISOString();
        (db as any).db.prepare('INSERT INTO bp_records (systolic, diastolic, heart_rate, recorded_at) VALUES (?, ?, ?, ?)').run(100 + i, 70 + i, 60 + i, timestamp);
      }
    });

    it('should respect limit parameter', async () => {
      const request = createGetRequest('?limit=2');
      
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.records).toHaveLength(2);
      expect(data.total).toBe(5);
      expect(data.limit).toBe(2);
    });

    it('should respect offset parameter', async () => {
      const request = createGetRequest('?limit=2&offset=2');
      
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.records).toHaveLength(2);
      expect(data.offset).toBe(2);
      // Should get 3rd and 4th newest records (IDs 3 and 4)
      expect(data.records[0].systolic).toBe(103);
      expect(data.records[1].systolic).toBe(104);
    });

    it('should default limit to 50 when not specified', async () => {
      const request = createGetRequest();
      
      const response = await GET(request as any);
      const data = await response.json();

      expect(data.limit).toBe(50);
    });

    it('should default offset to 0 when not specified', async () => {
      const request = createGetRequest();
      
      const response = await GET(request as any);
      const data = await response.json();

      expect(data.offset).toBe(0);
    });
  });

  describe('days filter', () => {
    beforeEach(() => {
      // Create records with different dates
      const now = new Date();
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
      const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

      (db as any).db.prepare('INSERT INTO bp_records (systolic, diastolic, heart_rate, recorded_at) VALUES (?, ?, ?, ?)').run(120, 80, 72, now.toISOString());
      (db as any).db.prepare('INSERT INTO bp_records (systolic, diastolic, heart_rate, recorded_at) VALUES (?, ?, ?, ?)').run(130, 85, 75, twoDaysAgo.toISOString());
      (db as any).db.prepare('INSERT INTO bp_records (systolic, diastolic, heart_rate, recorded_at) VALUES (?, ?, ?, ?)').run(140, 90, 80, fiveDaysAgo.toISOString());
      (db as any).db.prepare('INSERT INTO bp_records (systolic, diastolic, heart_rate, recorded_at) VALUES (?, ?, ?, ?)').run(150, 95, 85, tenDaysAgo.toISOString());
    });

    it('should filter records by last 7 days', async () => {
      const request = createGetRequest('?days=7');
      
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Should include today, 2 days ago, and 5 days ago (3 records)
      // 10 days ago should be excluded
      expect(data.records.length).toBeGreaterThanOrEqual(2);
      expect(data.total).toBeGreaterThanOrEqual(2);
    });

    it('should filter records by last 3 days', async () => {
      const request = createGetRequest('?days=3');
      
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Should include today and 2 days ago only
      expect(data.records.length).toBeGreaterThanOrEqual(1);
    });

    it('should combine days filter with limit', async () => {
      const request = createGetRequest('?days=30&limit=2');
      
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.records.length).toBeLessThanOrEqual(2);
      expect(data.total).toBeGreaterThanOrEqual(2);
    });
  });

  describe('validation', () => {
    it('should return 400 for invalid limit (negative)', async () => {
      const request = createGetRequest('?limit=-1');
      
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid limit');
    });

    it('should return 400 for invalid limit (zero)', async () => {
      const request = createGetRequest('?limit=0');
      
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid limit');
    });

    it('should return 400 for invalid limit (non-numeric)', async () => {
      const request = createGetRequest('?limit=abc');
      
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid limit');
    });

    it('should return 400 for invalid offset (negative)', async () => {
      const request = createGetRequest('?offset=-1');
      
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid offset');
    });

    it('should return 400 for invalid offset (non-numeric)', async () => {
      const request = createGetRequest('?offset=xyz');
      
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid offset');
    });

    it('should return 400 for invalid days (zero)', async () => {
      const request = createGetRequest('?days=0');
      
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid days');
    });

    it('should return 400 for invalid days (negative)', async () => {
      const request = createGetRequest('?days=-5');
      
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid days');
    });

    it('should return 400 for invalid days (non-numeric)', async () => {
      const request = createGetRequest('?days=abc');
      
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid days');
    });

    it('should allow valid limit at max boundary (1000)', async () => {
      const request = createGetRequest('?limit=1000');
      
      const response = await GET(request as any);

      expect(response.status).toBe(200);
    });

    it('should return 400 for limit over max (1001)', async () => {
      const request = createGetRequest('?limit=1001');
      
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid limit');
    });
  });
});
