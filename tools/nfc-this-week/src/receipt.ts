export interface ReceiptItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Receipt {
  id: string;
  title: string;
  storeName: string;
  date: string;
  items: ReceiptItem[];
  totalAmount: number;
  currency?: string;
  taxAmount?: number;
  note?: string;
}

/**
 * Formats receipt object into indented JSON string suitable for text sharing.
 */
export function formatReceiptJson(receipt: Receipt): string {
  return JSON.stringify(receipt, null, 2);
}

/**
 * Escapes a CSV field according to RFC 4180:
 * - Wrap with double quotes if field contains commas, double quotes, or newlines.
 * - Double quotes inside are escaped by doubling them ("").
 */
function escapeCsvField(val: string | number | undefined | null): string {
  if (val === undefined || val === null) {
    return '';
  }
  const str = String(val);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Formats a number to 2 decimal places.
 */
function formatNumber(num: number): string {
  return Number.isFinite(num) ? num.toFixed(2) : '0.00';
}

/**
 * Converts a Receipt object into a CSV string.
 * Uses CRLF line endings as specified in RFC 4180.
 */
export function receiptToCsvString(receipt: Receipt): string {
  const lines: string[] = [];

  // Metadata headers
  lines.push(`${escapeCsvField('Store')},${escapeCsvField(receipt.storeName)}`);
  lines.push(`${escapeCsvField('Date')},${escapeCsvField(receipt.date)}`);
  lines.push(`${escapeCsvField('Receipt ID')},${escapeCsvField(receipt.id)}`);
  if (receipt.currency) {
    lines.push(`${escapeCsvField('Currency')},${escapeCsvField(receipt.currency)}`);
  }
  lines.push(''); // blank row separator

  // Items table header
  lines.push('Item,Quantity,Unit Price,Total Price');

  // Item rows
  for (const item of receipt.items) {
    lines.push(
      [
        escapeCsvField(item.name),
        escapeCsvField(item.quantity),
        escapeCsvField(formatNumber(item.unitPrice)),
        escapeCsvField(formatNumber(item.totalPrice))
      ].join(',')
    );
  }

  // Summary rows
  lines.push('');
  if (receipt.taxAmount !== undefined) {
    lines.push(`Tax,,,${escapeCsvField(formatNumber(receipt.taxAmount))}`);
  }
  lines.push(`Total,,,${escapeCsvField(formatNumber(receipt.totalAmount))}`);

  return lines.join('\r\n');
}

/**
 * Converts receipt to a CSV Blob prepended with UTF-8 BOM (\uFEFF)
 * so that mobile spreadsheet apps (iOS Numbers, Excel, Android viewers) open it with correct encoding.
 */
export function receiptToCsvBlob(receipt: Receipt): Blob {
  const csvContent = receiptToCsvString(receipt);
  // Prepend UTF-8 BOM (\uFEFF) for Excel/Numbers compatibility
  const bom = '\uFEFF';
  return new Blob([bom + csvContent], {
    type: 'text/csv;charset=utf-8'
  });
}

/**
 * Creates a File instance from the receipt CSV for Web Share API file sharing.
 */
export function createCsvFile(receipt: Receipt, filename?: string): File {
  const blob = receiptToCsvBlob(receipt);
  const name = filename || `receipt-${receipt.id || 'export'}.csv`;
  return new File([blob], name, {
    type: 'text/csv;charset=utf-8',
    lastModified: Date.now()
  });
}
