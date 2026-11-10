/**
 * Computes Levenshtein distance between two strings.
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const bLen = b.length;
  const aLen = a.length;

  let prevRow = new Array(aLen + 1);
  let currRow = new Array(aLen + 1);

  for (let j = 0; j <= aLen; j++) {
    prevRow[j] = j;
  }

  for (let i = 1; i <= bLen; i++) {
    currRow[0] = i;
    const bChar = b.charCodeAt(i - 1);
    for (let j = 1; j <= aLen; j++) {
      const cost = a.charCodeAt(j - 1) === bChar ? 0 : 1;
      currRow[j] = Math.min(
        currRow[j - 1] + 1, // insertion
        prevRow[j] + 1, // deletion
        prevRow[j - 1] + cost // substitution
      );
    }
    const temp = prevRow;
    prevRow = currRow;
    currRow = temp;
  }

  return prevRow[aLen];
}

/**
 * Extracts numbers from text (e.g. package sizes, product models, quantities).
 * If numbers conflict (e.g. "1" vs "2", or "500g" vs "1kg"), they are distinct items!
 */
export function extractNumbers(text: string): string[] {
  const matches = text.match(/\b\d+(?:[.,]\d+)?\b/g);
  return matches ? matches.map((m) => m.replace(',', '.')) : [];
}

/**
 * Calculates string similarity ratio between 0 and 1.
 */
export function stringSimilarity(a: string, b: string): number {
  if (a === b) return 1.0;
  if (!a || !b) return 0.0;

  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;

  const levDist = levenshteinDistance(a, b);
  const levSim = 1 - levDist / maxLen;

  // Token Jaccard check with prefix matching for abbreviations (e.g. 'int' matches 'integral')
  const tokensA = a.split(/\s+/).filter(Boolean);
  const tokensB = b.split(/\s+/).filter(Boolean);

  let matchTokens = 0;
  for (const tA of tokensA) {
    if (
      tokensB.some(
        (tB) =>
          tA === tB ||
          (tA.length >= 3 && tB.startsWith(tA)) ||
          (tB.length >= 3 && tA.startsWith(tB))
      )
    ) {
      matchTokens++;
    }
  }

  const unionTokens = new Set([...tokensA, ...tokensB]).size;
  const tokenSim = unionTokens > 0 ? matchTokens / unionTokens : 0;

  return levSim * 0.4 + tokenSim * 0.6;
}

/**
 * Checks if two normalized strings should be considered fuzzy matches.
 * - Requires numbers/quantities (e.g., item number or size) to match if present.
 * - Otherwise checks similarity score threshold (default 0.70).
 */
export function isFuzzyMatch(a: string, b: string, threshold = 0.70): boolean {
  if (a === b) return true;
  if (!a || !b) return false;

  // Number / ID guard: distinct numbers mean distinct product items or package sizes
  const numsA = extractNumbers(a);
  const numsB = extractNumbers(b);
  if (numsA.length > 0 && numsB.length > 0) {
    // If both have numbers but they don't match, they shouldn't be grouped together
    const setB = new Set(numsB);
    const hasCommonNumber = numsA.some((n) => setB.has(n));
    if (!hasCommonNumber) {
      return false;
    }
  }

  // Prefix match (e.g. "leite desnatado 1l" vs "leite desnatado")
  if (a.startsWith(b) || b.startsWith(a)) {
    const minLen = Math.min(a.length, b.length);
    const maxLen = Math.max(a.length, b.length);
    if (minLen / maxLen >= 0.75) return true;
  }

  return stringSimilarity(a, b) >= threshold;
}
