import { describe, it, expect } from 'vitest';
import { validateAndParse, buildProcessedCsv, UploadValidationError } from './validator';

describe('validator service', () => {
  describe('validateAndParse', () => {
    it('should successfully parse a valid CSV', () => {
      const csv = 'product_id,product_name,market,category,purchases,conversions\n1,Test Product,DK,Electronics,100,10';
      const buffer = Buffer.from(csv);
      
      const result = validateAndParse(buffer);
      
      expect(result.headers).toEqual(['product_id', 'product_name', 'market', 'category', 'purchases', 'conversions']);
      expect(result.records).toHaveLength(1);
      expect(result.records[0].product_id).toBe('1');
      expect(result.records[0].market).toBe('DK');
    });

    it('should throw UploadValidationError when columns are missing', () => {
      const csv = 'product_id,market\n1,DK';
      const buffer = Buffer.from(csv);
      
      expect(() => validateAndParse(buffer)).toThrow(UploadValidationError);
      try {
        validateAndParse(buffer);
      } catch (err) {
        const error = err as UploadValidationError;
        expect(error.message).toContain('Missing required columns');
        expect(error.details?.missingColumns).toContain('product_name');
      }
    });

    it('should throw error for non-numeric values in numeric fields', () => {
      const csv = 'product_id,product_name,market,category,purchases,conversions\n1,Test Product,DK,Electronics,not-a-number,10';
      const buffer = Buffer.from(csv);
      
      expect(() => validateAndParse(buffer)).toThrow(/must be numeric/);
    });

    it('should throw error for empty required fields', () => {
      const csv = 'product_id,product_name,market,category,purchases,conversions\n1,,DK,Electronics,100,10';
      const buffer = Buffer.from(csv);
      
      expect(() => validateAndParse(buffer)).toThrow(/'product_name' is empty/);
    });
  });

  describe('buildProcessedCsv', () => {
    it('should align headers and values correctly', () => {
      const headers = ['product_id', 'market'];
      const records = [{ product_id: '1', market: 'DK' }];
      const submissionId = 'SUB-1';
      const submittedBy = 'user';
      const submittedAt = '2026-02-26';
      
      const result = buildProcessedCsv(headers, records, submissionId, submittedBy, submittedAt);
      const lines = result.split('\n');
      const resultHeaders = lines[0].split(',');
      const resultValues = lines[1].split(',');
      
      expect(resultHeaders.length).toBe(resultValues.length);
      expect(resultHeaders).toEqual(['product_id', 'market', 'submission_id', 'submitted_by', 'submitted_at']);
      expect(resultValues).toEqual(['1', 'DK', 'SUB-1', 'user', '2026-02-26']);
    });
  });
});
