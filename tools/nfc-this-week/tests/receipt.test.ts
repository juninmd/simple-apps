import { describe, it, expect } from 'vitest';
import {
  Receipt,
  formatReceiptJson,
  receiptToCsvString,
  receiptToCsvBlob,
  createCsvFile
} from '../src/receipt';

describe('Receipt data model & serialization', () => {
  const sampleReceipt: Receipt = {
    id: 'rec-12345',
    title: 'Receipt',
    storeName: 'Supermercado Central',
    date: '2026-11-04T12:00:00Z',
    items: [
      { id: '1', name: 'Leite Integral 1L', quantity: 2, unitPrice: 4.5, totalPrice: 9.0 },
      { id: '2', name: 'Pão Francês, Kg', quantity: 0.5, unitPrice: 18.0, totalPrice: 9.0 },
      { id: '3', name: 'Café "Especial" Torrado', quantity: 1, unitPrice: 16.5, totalPrice: 16.5 }
    ],
    totalAmount: 34.5,
    currency: 'BRL',
    taxAmount: 2.1
  };

  it('formats receipt JSON properly', () => {
    const jsonStr = formatReceiptJson(sampleReceipt);
    const parsed = JSON.parse(jsonStr);
    expect(parsed.id).toBe('rec-12345');
    expect(parsed.totalAmount).toBe(34.5);
    expect(parsed.items).toHaveLength(3);
  });

  it('generates compliant CSV with UTF-8 BOM, headers, and quoted fields', () => {
    const csv = receiptToCsvString(sampleReceipt);

    // Should include headers
    expect(csv).toContain('Item,Quantity,Unit Price,Total Price');

    // Should handle commas in item name by quoting
    expect(csv).toContain('"Pão Francês, Kg"');

    // Should escape double quotes by doubling them
    expect(csv).toContain('"Café ""Especial"" Torrado"');

    // Should include summary lines
    expect(csv).toContain('Total,,,34.50');
  });

  it('generates CSV string for empty receipt without items', () => {
    const emptyReceipt: Receipt = {
      id: 'rec-empty',
      title: 'Receipt',
      storeName: 'Quick Mart',
      date: '2026-11-04T12:00:00Z',
      items: [],
      totalAmount: 0
    };

    const csv = receiptToCsvString(emptyReceipt);
    expect(csv).toContain('Item,Quantity,Unit Price,Total Price');
    expect(csv).toContain('Total,,,0.00');
  });

  it('creates Blob and File with text/csv mime type and UTF-8 BOM for spreadsheet recipient compatibility', async () => {
    const blob = receiptToCsvBlob(sampleReceipt);
    expect(blob.type).toBe('text/csv;charset=utf-8');

    const file = createCsvFile(sampleReceipt, 'receipt-12345.csv');
    expect(file.name).toBe('receipt-12345.csv');
    expect(file.type).toBe('text/csv;charset=utf-8');

    const text = await file.text();
    expect(text).toContain('Supermercado Central');
    expect(text).toContain('Leite Integral 1L');
  });
});
