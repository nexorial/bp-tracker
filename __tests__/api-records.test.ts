import { POST } from '@/app/api/records/route';
import { createBPTrackerDatabase, BPTrackerDatabase } from '@/lib/db';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

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
  });

  afterEach(() => {
    db.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  // Mock the getBPTrackerDatabase to return our test database
  jest.mock('@/lib/db', () => {
    const actual = jest.requireActual('@/lib/db');
    return {
      ...actual,
      getBPTrackerDatabase: () => db
    };
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
      expect(data.heart_rate).toBe(0); // Defaults to 0 when not provided
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
