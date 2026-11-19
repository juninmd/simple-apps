export interface TipResult {
  total: string;
  perPerson: string;
  tipAmount: string;
}

/**
 * Parses a user-typed amount. Accepts a comma as decimal separator (pt-BR
 * keyboards type "12,50") and rejects partial or non-finite input such as
 * "12abc" or "1e999", which parseFloat would silently accept.
 */
export const parseAmount = (raw: string): number => {
  const s = raw.trim().replace(',', '.');
  if (!/^\d*\.?\d+$|^\d+\.$/.test(s)) return NaN;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
};

/**
 * Calculates the total bill and amount per person based on the bill amount, tip percentage, and number of people.
 *
 * @param bill - The total bill amount.
 * @param tipPct - The tip percentage (e.g., 15 for 15%).
 * @param people - The number of people to split the bill among.
 * @returns An object containing the total bill and per-person amount formatted as strings, or null if inputs are invalid.
 */
export const calculateTip = (bill: number, tipPct: number, people: number): TipResult | null => {
  if (!Number.isFinite(bill) || bill < 0) return null;
  if (!Number.isFinite(tipPct) || tipPct < 0) return null;
  if (!Number.isInteger(people) || people < 1) return null;

  const totalTip = bill * (tipPct / 100);
  const totalBill = bill + totalTip;
  const perPerson = totalBill / people;

  return {
    total: totalBill.toFixed(2),
    perPerson: perPerson.toFixed(2),
    tipAmount: totalTip.toFixed(2),
  };
};
