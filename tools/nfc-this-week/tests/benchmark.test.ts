import { describe, it, expect } from 'vitest';
import { Receipt } from '../src/types/receipt';
import { groupReceiptItems } from '../src/utils/grouping';
import { getPriceHistory, calculatePriceStats } from '../src/utils/priceHistory';

function generateBenchmarkReceipts(receiptCount = 50, uniqueItemCount = 200): Receipt[] {
  const stores = [
    'Carrefour Bairro',
    'Pão de Açúcar',
    'Extra Hiper',
    'Supermercado Dia',
    'Assaí Atacadista',
    'Atacadão',
    'Mambo Supermercados',
    'St. Marche',
  ];

  // Base list of unique product prototypes
  const baseProducts = Array.from({ length: uniqueItemCount }, (_, i) => {
    return {
      id: i,
      baseName: `Produto Especial Linha Premium ${i + 1}`,
      basePrice: 5 + (i * 0.75) % 80,
    };
  });

  const receipts: Receipt[] = [];

  for (let r = 0; r < receiptCount; r++) {
    // Generate dates spread across last 100 days
    const dateObj = new Date(2025, 0, 1 + r * 2);
    const dateStr = dateObj.toISOString().split('T')[0];
    const store = stores[r % stores.length];

    // Pick 15 to 25 items per receipt from baseProducts
    const itemsInReceiptCount = 20;
    const items = [];

    for (let k = 0; k < itemsInReceiptCount; k++) {
      const prodIndex = (r * 7 + k * 13) % uniqueItemCount;
      const prod = baseProducts[prodIndex];

      // Introduce occasional casing, accent or punctuation variation
      let desc = prod.baseName;
      if (r % 3 === 0) {
        desc = desc.toUpperCase();
      } else if (r % 4 === 0) {
        desc = desc.replace(/Premium/g, 'Prem.');
      } else if (r % 5 === 0) {
        desc = desc.replace(/Linha/g, 'Lnh');
      }

      // Small price variation across receipts
      const priceVariation = ((r * 11 + k * 3) % 9 - 4) * 0.25;
      const unitPrice = Math.max(1.0, Number((prod.basePrice + priceVariation).toFixed(2)));

      items.push({
        description: desc,
        quantity: 1 + (k % 3),
        unitPrice,
      });
    }

    receipts.push({
      id: `rcpt-bench-${r + 1}`,
      store,
      date: dateStr,
      items,
    });
  }

  return receipts;
}

describe('Performance Acceptance Benchmark', () => {
  it('processes 50 receipts and 200 unique items in <500ms', () => {
    const receipts = generateBenchmarkReceipts(50, 200);

    // Verify dataset size
    expect(receipts.length).toBe(50);
    const totalItems = receipts.reduce((sum, r) => sum + r.items.length, 0);
    expect(totalItems).toBeGreaterThanOrEqual(1000);

    // Measure grouping and price history computation
    const startTime = performance.now();
    const groups = groupReceiptItems(receipts);

    // Compute price history and stats for all groups
    let pricePointsCount = 0;
    for (const group of groups) {
      const history = getPriceHistory(group);
      const stats = calculatePriceStats(history);
      pricePointsCount += history.length;
      expect(stats.averagePrice).toBeGreaterThan(0);
    }

    const duration = performance.now() - startTime;

    console.log(`[Benchmark] Grouped ${totalItems} items into ${groups.length} groups in ${duration.toFixed(2)}ms`);

    expect(groups.length).toBeGreaterThanOrEqual(180);
    expect(pricePointsCount).toBe(totalItems);
    expect(duration).toBeLessThan(500); // Acceptance criteria: <500ms
  });
});
