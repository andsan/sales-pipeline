export type ColumnType = 'string' | 'number';

export interface ColumnRule {
  type: ColumnType;
  required?: boolean;
}

export interface ValidationConfig {
  columns: Record<string, ColumnRule>;
}

export const PRODUCT_VALIDATION_CONFIG = {
  columns: {
    product_id: { type: 'string', required: true },
    product_name: { type: 'string', required: true },
    market: { type: 'string', required: true },
    category: { type: 'string', required: true },
    purchases: { type: 'number', required: true },
    conversions: { type: 'number', required: true },
  },
} as const satisfies ValidationConfig;

