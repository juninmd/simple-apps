export interface TipResult {
  total: string;
  perPerson: string;
  tipAmount: string;
}

/**
 * Calculates the total bill and amount per person based on the bill amount, tip percentage, and number of people.
 *
 * @param bill - The total bill amount.
 * @param tipPct - The tip percentage (e.g., 15 for 15%).
 * @param people - The number of people to split the bill among.
 * @returns An object containing the total bill and per-person amount formatted as strings, or null if inputs are invalid.
 */
export const calculateTip = (bill: number, tipPct: number, people: number): TipResult | null => {
  if (isNaN(bill) || bill < 0) return null;
  if (people < 1) return null;

  const totalTip = bill * (tipPct / 100);
  const totalBill = bill + totalTip;
  const perPerson = totalBill / people;

  return {
    total: totalBill.toFixed(2),
    perPerson: perPerson.toFixed(2),
    tipAmount: totalTip.toFixed(2),
  };
};
