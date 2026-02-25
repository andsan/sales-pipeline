import { parse } from 'csv-parse/sync';
import { ValidationError } from '../types/index';
import {
  ColumnRule,
  PRODUCT_VALIDATION_CONFIG,
} from '../config/uploadValidationConfig';

export type ProductColumn = keyof typeof PRODUCT_VALIDATION_CONFIG.columns;
export type ProductRow = Record<string, string> & { [K in ProductColumn]: string };

export const REQUIRED_COLUMNS = Object.entries(PRODUCT_VALIDATION_CONFIG.columns)
  .filter(([, rule]) => rule.required)
  .map(([name]) => name);

export interface ParsedCsv {
  headers: string[];
  records: ProductRow[];
}

export interface ValidationDetails {
  requiredColumns?: string[];
  foundColumns?: string[];
  missingColumns?: string[];
}

export class UploadValidationError extends Error {
  details?: ValidationDetails;

  constructor(message: string, details?: ValidationDetails) {
    super(message);
    this.name = 'UploadValidationError';
    this.details = details;
  }
}

function normalizeHeader(value: string): string {
  return `${value ?? ''}`.replace(/^\uFEFF/, '').trim().toLowerCase();
}

function normalizeCellValue(value: unknown): string {
  const asString = `${value ?? ''}`.replace(/^\uFEFF/, '');
  return asString.trim();
}

function isNumeric(value: string): boolean {
  if (value === '') return false;
  const n = Number(value);
  return Number.isFinite(n);
}

function extractHeaderColumns(buffer: Buffer): string[] {
  try {
    const rows = parse(buffer, {
      columns: false,
      skip_empty_lines: true,
      trim: true,
      to_line: 1,
      relax_column_count: true,
    }) as string[][];

    const headerRow = rows[0] ?? [];
    return headerRow.map((h) => normalizeHeader(h));
  } catch {
    return [];
  }
}

function buildValidationDetails(foundColumns: string[]): ValidationDetails {
  const missingColumns = REQUIRED_COLUMNS.filter((col) => !foundColumns.includes(col));
  return {
    requiredColumns: REQUIRED_COLUMNS,
    foundColumns,
    missingColumns,
  };
}

function validateRecord(
  row: Record<string, unknown>,
  rowNum: number,
  columns: Record<string, ColumnRule>,
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const [field, rule] of Object.entries(columns)) {
    const value = normalizeCellValue(row[field]);
    row[field] = value;

    if (rule.required && value === '') {
      errors.push({
        row: rowNum,
        field,
        message: `Row ${rowNum}: '${field}' is empty`,
      });
      continue;
    }

    if (value !== '' && rule.type === 'number' && !isNumeric(value)) {
      errors.push({
        row: rowNum,
        field,
        message: `Row ${rowNum}: '${field}' must be numeric (got "${value}")`,
      });
    }
  }

  return errors;
}

export function validateAndParse(buffer: Buffer): ParsedCsv {
  const errors: ValidationError[] = [];
  const previewHeaders = extractHeaderColumns(buffer);

  let parsedRecords: Record<string, unknown>[];
  try {
    parsedRecords = parse(buffer, {
      columns: (headers: string[]) => headers.map((h) => normalizeHeader(h)),
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, unknown>[];
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.includes('Invalid Record Length')) {
      const details = buildValidationDetails(previewHeaders);
      const friendly = (details.missingColumns?.length ?? 0) > 0
        ? 'Missing required columns in the uploaded file.'
        : 'The CSV format is invalid: one or more rows have a different column count than the header.';

      throw new UploadValidationError(friendly, details);
    }
    throw new UploadValidationError(`CSV parse error: ${msg}`);
  }

  if (parsedRecords.length === 0) {
    throw new UploadValidationError('File has no data rows.');
  }

  const headers = Object.keys(parsedRecords[0]).map((h) => normalizeHeader(h));
  const details = buildValidationDetails(headers);

  if ((details.missingColumns?.length ?? 0) > 0) {
    throw new UploadValidationError('Missing required columns in the uploaded file.', details);
  }

  const limit = Math.min(parsedRecords.length, 1000);
  for (let i = 0; i < limit; i++) {
    const row = parsedRecords[i];
    const rowNum = i + 1;
    errors.push(...validateRecord(row, rowNum, PRODUCT_VALIDATION_CONFIG.columns));
  }

  if (errors.length > 0) {
    const preview = errors.slice(0, 10).map((e) => e.message).join('\n');
    const extra = errors.length > 10 ? `\n...and ${errors.length - 10} more` : '';
    throw new UploadValidationError(`Row validation failed:\n${preview}${extra}`);
  }

  return { headers, records: parsedRecords as ProductRow[] };
}

export function buildProcessedCsv(
  headers: string[],
  records: Record<string, string>[],
  submissionId: string,
  submittedBy: string,
  submittedAt: string,
): string {
  const newHeaders = [...headers, 'submission_id', 'submitted_by', 'submitted_at'].join(',');
  const rows = records.map((row) => {
    const values = headers.map((h) => {
      const v = `${row[h] ?? ''}`;
      return v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
    });

    return [
      ...values,
      submissionId,
      submittedBy,
      submittedAt,
    ].join(',');
  });

  return [newHeaders, ...rows].join('\n');
}
