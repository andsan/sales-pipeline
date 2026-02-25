import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';
import * as blobStorage from '../services/blobStorage';
import jwt from 'jsonwebtoken';

// Mock the blob storage service
vi.mock('../services/blobStorage', () => ({
  uploadBlob: vi.fn().mockResolvedValue('container/path/to/blob.csv'),
  generateSasUrl: vi.fn().mockResolvedValue('https://example.com/sas-url'),
}));

// Mock auth middleware to bypass real JWT verification if needed
// Or just sign a real one with the dev secret
const secret = 'dev-secret';
const token = jwt.sign({ username: 'testuser', role: 'admin' }, secret);

describe('upload route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reject unauthorized requests', async () => {
    const res = await request(app).post('/api/upload');
    expect(res.status).toBe(401);
  });

  it('should accept valid CSV uploads', async () => {
    const csvContent = 'product_id,product_name,market,category,purchases,conversions\n1,Test,DK,Electronics,100,10';
    
    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from(csvContent), 'test.csv');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('submissionId');
    expect(res.body.rowCount).toBe(1);
    expect(blobStorage.uploadBlob).toHaveBeenCalled();
  });

  it('should reject non-CSV files', async () => {
    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('fake excel content'), 'test.xlsx');

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('not supported');
  });

  it('should return 422 for validation failures', async () => {
    const invalidCsv = 'product_id,market\n1,DK';
    
    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from(invalidCsv), 'invalid.csv');

    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('validation');
    expect(res.body.validation).not.toBeNull();
    expect(res.body.validation.missingColumns).toContain('product_name');
  });
});
