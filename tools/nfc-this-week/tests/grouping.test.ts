import { describe, it, expect } from 'vitest';
import { groupReceiptItems } from '../src/utils/grouping';
import { Receipt } from '../src/types/receipt';

describe('groupReceiptItems', () => {
  const sampleReceipts: Receipt[] = [
    {
      id: 'rec-1',
      store: 'Supermercado Alpha',
      date: '2025-01-10',
      items: [
        { description: 'Café Torrado Melitta 500g', quantity: 1, unitPrice: 18.5 },
        { description: 'Leite Integral Parmalat 1L', quantity: 2, unitPrice: 5.2 },
      ],
    },
    {
      id: 'rec-2',
      store: 'Supermercado Beta',
      date: '2025-01-15',
      items: [
        // Accent/casing variant
        { description: 'CAFE TORRADO MELITTA 500G', quantity: 1, unitPrice: 19.9 },
        // Minor typo/variant
        { description: 'Leite Int Parmalat 1L', quantity: 1, unitPrice: 5.49 },
      ],
    },
    {
      id: 'rec-3',
      store: 'Mercado Local',
      date: '2025-01-20',
      items: [
        { description: 'Cafe Torrado Melitta 500g', quantity: 1, unitPrice: 17.9 },
        { description: 'Arroz Tipo 1 Camil 5kg', quantity: 1, unitPrice: 28.9 },
      ],
    },
  ];

  it('groups items with normalized and fuzzy variations across receipts', () => {
    const groups = groupReceiptItems(sampleReceipts);

    expect(groups.length).toBe(3); // Melitta, Parmalat, Arroz

    const coffeeGroup = groups.find((g) => g.canonicalDescription.includes('Café') || g.canonicalDescription.includes('CAFE'));
    expect(coffeeGroup).toBeDefined();
    expect(coffeeGroup!.priceHistory.length).toBe(3);
    expect(coffeeGroup!.priceHistory[0].unitPrice).toBe(18.5);
    expect(coffeeGroup!.priceHistory[1].unitPrice).toBe(19.9);
    expect(coffeeGroup!.priceHistory[2].unitPrice).toBe(17.9);
    expect(coffeeGroup!.minPrice).toBe(17.9);
    expect(coffeeGroup!.maxPrice).toBe(19.9);
    expect(coffeeGroup!.latestPrice).toBe(17.9);

    const milkGroup = groups.find((g) => g.normalizedDescription.includes('parmalat'));
    expect(milkGroup).toBeDefined();
    expect(milkGroup!.priceHistory.length).toBe(2);
  });
});
