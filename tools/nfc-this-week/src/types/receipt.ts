export interface ReceiptItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
}

export interface Receipt {
  id: string;
  store: string;
  date: string; // ISO 8601 date string YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss
  items: ReceiptItem[];
}

export interface PricePoint {
  date: string;
  store: string;
  unitPrice: number;
  receiptId: string;
  rawDescription: string;
}

export interface GroupedItem {
  id: string; // Canonical key
  canonicalDescription: string;
  normalizedDescription: string;
  priceHistory: PricePoint[];
  itemCount: number;
  latestPrice: number;
  minPrice: number;
  maxPrice: number;
}
