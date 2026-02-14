import { GET } from '@/app/api/export/route';
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

describe('GET /api/export', () => {
  let tempDir: string;
  let dbPath: string;
  let db: BPTrackerDatabase;

  beforeEach(() => {
    // Create a temporary database for each test
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bp-export-test-'));
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

  function createExportRequest(queryString: string = ''): Request {
    return new Request(`http://localhost/api/export${queryString}`, {
      method: 'GET'
    });
  }

  describe('basic export', () => {
    it('should return CSV with correct headers when no records exist', async () => {
      const request = createExportRequest();

      const response = await GET(request as any);
      const csvContent = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/csv; charset=utf-8');
      expect(response.headers.get('Content-Disposition')).toMatch(/bp-records-\d{4}-\d{2}-\d{2}\.csv/);
      expect(csvContent).toBe('Date,Systolic,Diastolic,Heart Rate,Notes');
    });

    it('should return CSV with all records', async () => {
      // Create test records
      (db as any).db.prepare('INSERT INTO bp_records (systolic, diastolic, heart_rate, recorded_at, notes) VALUES (?, ?, ?, ?, ?)')
        .run(120, 80, 72, '2024-03-15T10:30:00.000Z', 'Morning reading');
      (db as any).db.prepare('INSERT INTO bp_records (systolic, diastolic, heart_rate, recorded_at, notes) VALUES (?, ?, ?, ?, ?)')
        .run(130, 85, 75, '2024-03-16T14:45:00.000Z', null);

      const request = createExportRequest();

      const response = await GET(request as any);
      const csvContent = await response.text();

      expect(response.status).toBe(200);
      const lines = csvContent.split('\n');
      expect(lines).toHaveLength(3);
      expect(lines[0]).toBe('Date,Systolic,Diastolic,Heart Rate,Notes');
      expect(lines[1]).toContain('130');
      expect(lines[1]).toContain('85');
      expect(lines[1]).toContain('75');
      expect(lines[2]).toContain('120');
      expect(lines[2]).toContain('80');
      expect(lines[2]).toContain('72');
      expect(lines[2]).toContain('Morning reading');
    });

    it('should have correct CSV format with all fields', async () => {
      (db as any).db.prepare('INSERT INTO bp_records (systolic, diastolic, heart_rate, recorded_at, notes) VALUES (?, ?, ?, ?, ?)')
        .run(125, 82, 70, '2024-01-15T08:00:00.000Z', 'Test note');

      const request = createExportRequest();

      const response = await GET(request as any);
      const csvContent = await response.text();

      const lines = csvContent.split('\n');
      expect(lines).toHaveLength(2);
      expect(lines[0]).toBe('Date,Systolic,Diastolic,Heart Rate,Notes');
      
      // Parse the data line
      const dataLine = lines[1];
      const fields = dataLine.split(',');
      expect(fields).toHaveLength(5);
      expect(fields[0]).toBe('2024-01-15T08:00:00.000Z');
      expect(fields[1]).toBe('125');
      expect(fields[2]).toBe('82');
      expect(fields[3]).toBe('70');
      expect(fields[4]).toBe('Test note');
    });
  });

  describe('date range filtering', () => {
    beforeEach(() => {
      // Create records on different dates
      (db as any).db.prepare('INSERT INTO bp_records (systolic, diastolic, heart_rate, recorded_at, notes) VALUES (?, ?, ?, ?, ?)')
        .run(110, 70, 65, '2024-01-01T08:00:00.000Z', 'January record');
      (db as any).db.prepare('INSERT INTO bp_records (systolic, diastolic, heart_rate, recorded_at, notes) VALUES (?, ?, ?, ?, ?)')
        .run(120, 80, 72, '2024-03-15T10:00:00.000Z', 'March record');
      (db as any).db.prepare('INSERT INTO bp_records (systolic, diastolic, heart_rate, recorded_at, notes) VALUES (?, ?, ?, ?, ?)')
        .run(130, 90, 80, '2024-06-20T14:00:00.000Z', 'June record');
    });

    it('should filter by from date', async () => {
      const request = createExportRequest('?from=2024-03-01');

      const response = await GET(request as any);
      const csvContent = await response.text();

      const lines = csvContent.split('\n');
      expect(lines).toHaveLength(3); // header + 2 records
      expect(csvContent).toContain('March record');
      expect(csvContent).toContain('June record');
      expect(csvContent).not.toContain('January record');
    });

    it('should filter by to date', async () => {
      const request = createExportRequest('?to=2024-03-31');

      const response = await GET(request as any);
      const csvContent = await response.text();

      const lines = csvContent.split('\n');
      expect(lines).toHaveLength(3); // header + 2 records
      expect(csvContent).toContain('January record');
      expect(csvContent).toContain('March record');
      expect(csvContent).not.toContain('June record');
    });

    it('should filter by both from and to dates', async () => {
      const request = createExportRequest('?from=2024-03-01&to=2024-03-31');

      const response = await GET(request as any);
      const csvContent = await response.text();

      const lines = csvContent.split('\n');
      expect(lines).toHaveLength(2); // header + 1 record
      expect(csvContent).toContain('March record');
      expect(csvContent).not.toContain('January record');
      expect(csvContent).not.toContain('June record');
    });

    it('should return empty CSV when date range has no records', async () => {
      const request = createExportRequest('?from=2024-12-01&to=2024-12-31');

      const response = await GET(request as any);
      const csvContent = await response.text();

      expect(csvContent).toBe('Date,Systolic,Diastolic,Heart Rate,Notes');
    });
  });

  describe('filename generation', () => {
    it('should include current date in filename', async () => {
      const request = createExportRequest();
      const today = new Date();
      const expectedFilename = `bp-records-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}.csv`;

      const response = await GET(request as any);
      const contentDisposition = response.headers.get('Content-Disposition');

      expect(contentDisposition).toContain(expectedFilename);
    });
  });

  describe('CSV escaping', () => {
    it('should escape fields containing commas', async () => {
      (db as any).db.prepare('INSERT INTO bp_records (systolic, diastolic, heart_rate, recorded_at, notes) VALUES (?, ?, ?, ?, ?)')
        .run(120, 80, 72, '2024-01-15T08:00:00.000Z', 'Note, with, commas');

      const request = createExportRequest();

      const response = await GET(request as any);
      const csvContent = await response.text();

      expect(csvContent).toContain('"Note, with, commas"');
    });

    it('should escape fields containing quotes', async () => {
      (db as any).db.prepare('INSERT INTO bp_records (systolic, diastolic, heart_rate, recorded_at, notes) VALUES (?, ?, ?, ?, ?)')
        .run(120, 80, 72, '2024-01-15T08:00:00.000Z', 'Note with "quotes"');

      const request = createExportRequest();

      const response = await GET(request as any);
      const csvContent = await response.text();

      expect(csvContent).toContain('"Note with ""quotes"""');
    });

    it('should escape fields containing newlines', async () => {
      (db as any).db.prepare('INSERT INTO bp_records (systolic, diastolic, heart_rate, recorded_at, notes) VALUES (?, ?, ?, ?, ?)')
        .run(120, 80, 72, '2024-01-15T08:00:00.000Z', 'Note with\nnewlines');

      const request = createExportRequest();

      const response = await GET(request as any);
      const csvContent = await response.text();

      expect(csvContent).toContain('"Note with\nnewlines"');
    });

    it('should handle null notes correctly', async () => {
      (db as any).db.prepare('INSERT INTO bp_records (systolic, diastolic, heart_rate, recorded_at, notes) VALUES (?, ?, ?, ?, ?)')
        .run(120, 80, 72, '2024-01-15T08:00:00.000Z', null);

      const request = createExportRequest();

      const response = await GET(request as any);
      const csvContent = await response.text();

      const lines = csvContent.split('\n');
      expect(lines[1]).toBe('2024-01-15T08:00:00.000Z,120,80,72,');
    });
  });

  describe('validation', () => {
    it('should return 400 for invalid from date format', async () => {
      const request = createExportRequest('?from=invalid-date');

      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid from date format');
    });

    it('should return 400 for invalid to date format', async () => {
      const request = createExportRequest('?to=03-15-2024');

      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid to date format');
    });

    it('should return 400 for invalid date (non-existent day)', async () => {
      const request = createExportRequest('?from=2024-02-30');

      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid from date format');
    });

    it('should accept valid date formats', async () => {
      (db as any).db.prepare('INSERT INTO bp_records (systolic, diastolic, heart_rate, recorded_at) VALUES (?, ?, ?, ?)')
        .run(120, 80, 72, '2024-03-15T08:00:00.000Z');

      const request = createExportRequest('?from=2024-01-01&to=2024-12-31');

      const response = await GET(request as any);

      expect(response.status).toBe(200);
    });
  });

  describe('error handling', () => {
    it('should return 500 on database error', async () => {
      mockedGetBPTrackerDatabase.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const request = createExportRequest();

      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('record ordering', () => {
    it('should return records ordered by recorded_at DESC', async () => {
      (db as any).db.prepare('INSERT INTO bp_records (systolic, diastolic, heart_rate, recorded_at) VALUES (?, ?, ?, ?)')
        .run(100, 70, 60, '2024-01-01T08:00:00.000Z');
      (db as any).db.prepare('INSERT INTO bp_records (systolic, diastolic, heart_rate, recorded_at) VALUES (?, ?, ?, ?)')
        .run(150, 95, 85, '2024-06-01T08:00:00.000Z');
      (db as any).db.prepare('INSERT INTO bp_records (systolic, diastolic, heart_rate, recorded_at) VALUES (?, ?, ?, ?)')
        .run(125, 80, 72, '2024-03-01T08:00:00.000Z');

      const request = createExportRequest();

      const response = await GET(request as any);
      const csvContent = await response.text();

      const lines = csvContent.split('\n');
      // First data line should be the newest (June)
      expect(lines[1]).toContain('150');
      expect(lines[1]).toContain('95');
      // Second data line (March)
      expect(lines[2]).toContain('125');
      expect(lines[2]).toContain('80');
      // Third data line (January)
      expect(lines[3]).toContain('100');
      expect(lines[3]).toContain('70');
    });
  });
});
