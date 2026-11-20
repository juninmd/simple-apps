export type BmiResult = { value: string; status: 'Underweight' | 'Normal' | 'Overweight' | 'Obese' };

// Numeric keyboards in pt-BR type "1,75"; parseFloat would stop at the comma.
const toNumber = (text: string): number => Number(text.trim().replace(',', '.'));

/** Height in cm and weight in kg as typed; returns null unless both are positive, finite numbers. */
export function calculateBmi(heightCm: string, weightKg: string): BmiResult | null {
  const h = toNumber(heightCm) / 100;
  const w = toNumber(weightKg);
  if (!Number.isFinite(h) || !Number.isFinite(w) || h <= 0 || w <= 0) return null;

  // Classify the value the user sees: 24.96 is shown as "25.0" and must read Overweight, not Normal.
  const val = Math.round((w / (h * h)) * 10) / 10;
  const status = val < 18.5 ? 'Underweight' : val < 25 ? 'Normal' : val < 30 ? 'Overweight' : 'Obese';
  return { value: val.toFixed(1), status };
}
