import { Receipt, GroupedItem, PricePoint } from '../types/receipt';
import { normalizeDescription } from './normalize';
import { isFuzzyMatch, stringSimilarity } from './fuzzy';

/**
 * Clusters receipt items across multiple receipts by normalized description using fuzzy matching.
 * Returns an array of GroupedItem sorted by canonicalDescription.
 */
export function groupReceiptItems(receipts: Receipt[], fuzzyThreshold = 0.70): GroupedItem[] {
  const groups: GroupedItem[] = [];

  for (const receipt of receipts) {
    for (const item of receipt.items) {
      const rawDesc = item.description;
      const normalizedDesc = normalizeDescription(rawDesc);
      if (!normalizedDesc) continue;

      const pricePoint: PricePoint = {
        date: receipt.date,
        store: receipt.store,
        unitPrice: item.unitPrice,
        receiptId: receipt.id,
        rawDescription: rawDesc,
      };

      // Find best matching existing group
      let matchedGroup: GroupedItem | null = null;
      let highestSim = 0;

      for (const group of groups) {
        if (group.normalizedDescription === normalizedDesc) {
          matchedGroup = group;
          break;
        }

        if (isFuzzyMatch(group.normalizedDescription, normalizedDesc, fuzzyThreshold)) {
          const sim = stringSimilarity(group.normalizedDescription, normalizedDesc);
          if (sim > highestSim) {
            highestSim = sim;
            matchedGroup = group;
          }
        }
      }

      if (matchedGroup) {
        matchedGroup.priceHistory.push(pricePoint);
      } else {
        // Create new group
        const newGroup: GroupedItem = {
          id: `item-${groups.length + 1}-${normalizedDesc.replace(/\s+/g, '-').slice(0, 30)}`,
          canonicalDescription: rawDesc,
          normalizedDescription: normalizedDesc,
          priceHistory: [pricePoint],
          itemCount: 0,
          latestPrice: item.unitPrice,
          minPrice: item.unitPrice,
          maxPrice: item.unitPrice,
        };
        groups.push(newGroup);
      }
    }
  }

  // Post-process each group: sort price history by date ascending, compute aggregate prices
  for (const group of groups) {
    group.priceHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    group.itemCount = group.priceHistory.length;

    const prices = group.priceHistory.map((p) => p.unitPrice);
    group.minPrice = Math.min(...prices);
    group.maxPrice = Math.max(...prices);
    group.latestPrice = group.priceHistory[group.priceHistory.length - 1].unitPrice;
  }

  // Sort groups alphabetically by canonical description
  return groups.sort((a, b) => a.canonicalDescription.localeCompare(b.canonicalDescription));
}
