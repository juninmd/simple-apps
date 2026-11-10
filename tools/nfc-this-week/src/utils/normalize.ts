/**
 * Normalizes an item description for comparison and fuzzy matching:
 * - strips accents / diacritics
 * - lowercases
 * - strips punctuation & special symbols
 * - collapses whitespace
 */
export function normalizeDescription(text: string): string {
  if (!text) return '';

  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ') // replace punctuation/symbols with space
    .replace(/\s+/g, ' ') // collapse multi-spaces
    .trim();
}
