import { DELETE } from '@/app/api/records/[id]/route';
import { getBPTrackerDatabase, resetBPTrackerDatabase } from '@/lib/db';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

// Mock the database module
jest.mock('@/lib/db', () => ({
  getBPTrackerDatabase: jest.fn(),
  resetBPTrackerDatabase: jest.fn()
}));

const mockGetDB = getBPTrackerDatabase as jest.MockedFunction<typeof getBPTrackerDatabase>;

describe('DELETE /api/records/[id]', () => {
  let testDbPath: string;
  let mockDb: {
    deleteRecord: jest.MockedFunction<(id: number) => boolean>;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    testDbPath = path.join(os.tmpdir(), `test-bp-${Date.now()}.db`);
    
    mockDb = {
      deleteRecord: jest.fn()
    };
    
    mockGetDB.mockReturnValue(mockDb as any);
  });

  afterEach(() => {
    // Clean up test database
    try {
      if (fs.existsSync(testDbPath)) {
        fs.unlinkSync(testDbPath);
      }
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  describe('successful deletion', () => {
    it('deletes record and returns success', async () => {
      mockDb.deleteRecord.mockReturnValue(true);

      const request = new Request('http://localhost:3000/api/records/1', {
        method: 'DELETE'
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        message: 'Record deleted successfully'
      });
      expect(mockDb.deleteRecord).toHaveBeenCalledWith(1);
    });

    it('handles larger record IDs', async () => {
      mockDb.deleteRecord.mockReturnValue(true);

      const request = new Request('http://localhost:3000/api/records/999999', {
        method: 'DELETE'
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: '999999' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockDb.deleteRecord).toHaveBeenCalledWith(999999);
    });
  });

  describe('validation errors', () => {
    it('returns 400 for invalid ID (non-numeric)', async () => {
      const request = new Request('http://localhost:3000/api/records/abc', {
        method: 'DELETE'
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: 'abc' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid record ID');
      expect(mockDb.deleteRecord).not.toHaveBeenCalled();
    });

    it('returns 400 for zero ID', async () => {
      const request = new Request('http://localhost:3000/api/records/0', {
        method: 'DELETE'
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: '0' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid record ID');
    });

    it('returns 400 for negative ID', async () => {
      const request = new Request('http://localhost:3000/api/records/-1', {
        method: 'DELETE'
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: '-1' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid record ID');
    });

    it('returns 400 for decimal ID', async () => {
      const request = new Request('http://localhost:3000/api/records/1.5', {
        method: 'DELETE'
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: '1.5' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid record ID');
    });
  });

  describe('not found errors', () => {
    it('returns 404 when record does not exist', async () => {
      mockDb.deleteRecord.mockReturnValue(false);

      const request = new Request('http://localhost:3000/api/records/999', {
        method: 'DELETE'
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: '999' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Record not found');
    });
  });

  describe('server errors', () => {
    it('returns 500 on database error', async () => {
      mockDb.deleteRecord.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const request = new Request('http://localhost:3000/api/records/1', {
        method: 'DELETE'
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('returns 500 when getBPTrackerDatabase throws', async () => {
      mockGetDB.mockImplementation(() => {
        throw new Error('Database initialization failed');
      });

      const request = new Request('http://localhost:3000/api/records/1', {
        method: 'DELETE'
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
