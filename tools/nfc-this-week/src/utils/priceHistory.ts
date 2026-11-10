import { GroupedItem, PricePoint } from '../types/receipt';

/**
 * Returns chronological price points for a given grouped item.
 */
export function getPriceHistory(group: GroupedItem): PricePoint[] {
  if (!group || !group.priceHistory) return [];

  // Return a sorted copy of price history
  return [...group.priceHistory].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

/**
 * Calculates metrics for price history (delta, percentage change, volatility)
 */
export function calculatePriceStats(history: PricePoint[]) {
  if (history.length === 0) {
    return {
      currentPrice: 0,
      initialPrice: 0,
      diff: 0,
      percentageChange: 0,
      minPrice: 0,
      maxPrice: 0,
      averagePrice: 0,
    };
  }

  const initialPrice = history[0].unitPrice;
  const currentPrice = history[history.length - 1].unitPrice;
  const diff = currentPrice - initialPrice;
  const percentageChange = initialPrice > 0 ? (diff / initialPrice) * 100 : 0;

  const prices = history.map((p) => p.unitPrice);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const averagePrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;

  return {
    currentPrice,
    initialPrice,
    diff,
    percentageChange,
    minPrice,
    maxPrice,
    averagePrice,
  };
}
