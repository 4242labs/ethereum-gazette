// String similarity utilities for duplicate detection
// Uses Levenshtein distance and other text comparison algorithms

/**
 * Calculate Levenshtein distance between two strings
 * Returns the minimum number of single-character edits required to change one string into another
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  // Create a 2D array for dynamic programming
  const matrix: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));

  // Initialize first row and column
  for (let i = 0; i <= len1; i++) {
    matrix[i][0] = i;
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill the matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity ratio between two strings (0-1 scale)
 * Based on Levenshtein distance
 */
export function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1.0;
  if (str1.length === 0 || str2.length === 0) return 0.0;

  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);

  return 1 - distance / maxLength;
}

/**
 * Calculate similarity with normalization (case-insensitive, trimmed)
 */
export function calculateNormalizedSimilarity(str1: string, str2: string): number {
  const normalized1 = normalizeString(str1);
  const normalized2 = normalizeString(str2);

  return calculateSimilarity(normalized1, normalized2);
}

/**
 * Normalize string for comparison
 * Converts to lowercase, removes extra whitespace, and trims
 */
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculate Jaccard similarity coefficient
 * Compares sets of words between two strings
 */
export function jaccardSimilarity(str1: string, str2: string): number {
  const words1 = new Set(normalizeString(str1).split(' '));
  const words2 = new Set(normalizeString(str2).split(' '));

  const intersection = new Set([...words1].filter((word) => words2.has(word)));
  const union = new Set([...words1, ...words2]);

  if (union.size === 0) return 0.0;

  return intersection.size / union.size;
}

/**
 * Calculate Dice coefficient (Sørensen–Dice coefficient)
 * Similar to Jaccard but gives more weight to common elements
 */
export function diceSimilarity(str1: string, str2: string): number {
  const words1 = new Set(normalizeString(str1).split(' '));
  const words2 = new Set(normalizeString(str2).split(' '));

  const intersection = new Set([...words1].filter((word) => words2.has(word)));

  if (words1.size + words2.size === 0) return 0.0;

  return (2 * intersection.size) / (words1.size + words2.size);
}

/**
 * Calculate cosine similarity using character bigrams
 */
export function cosineSimilarity(str1: string, str2: string): number {
  const bigrams1 = getBigrams(normalizeString(str1));
  const bigrams2 = getBigrams(normalizeString(str2));

  if (bigrams1.length === 0 || bigrams2.length === 0) return 0.0;

  const vector1 = createBigramVector(bigrams1);
  const vector2 = createBigramVector(bigrams2);

  return calculateCosine(vector1, vector2);
}

/**
 * Get character bigrams from string
 */
function getBigrams(str: string): string[] {
  const bigrams: string[] = [];
  for (let i = 0; i < str.length - 1; i++) {
    bigrams.push(str.substring(i, i + 2));
  }
  return bigrams;
}

/**
 * Create frequency vector from bigrams
 */
function createBigramVector(bigrams: string[]): Map<string, number> {
  const vector = new Map<string, number>();
  for (const bigram of bigrams) {
    vector.set(bigram, (vector.get(bigram) || 0) + 1);
  }
  return vector;
}

/**
 * Calculate cosine similarity between two vectors
 */
function calculateCosine(
  vector1: Map<string, number>,
  vector2: Map<string, number>
): number {
  const allKeys = new Set([...vector1.keys(), ...vector2.keys()]);

  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  for (const key of allKeys) {
    const val1 = vector1.get(key) || 0;
    const val2 = vector2.get(key) || 0;

    dotProduct += val1 * val2;
    magnitude1 += val1 * val1;
    magnitude2 += val2 * val2;
  }

  if (magnitude1 === 0 || magnitude2 === 0) return 0.0;

  return dotProduct / (Math.sqrt(magnitude1) * Math.sqrt(magnitude2));
}

/**
 * Hybrid similarity score combining multiple algorithms
 * Provides more robust similarity detection
 */
export function hybridSimilarity(
  str1: string,
  str2: string,
  weights: {
    levenshtein?: number;
    jaccard?: number;
    dice?: number;
    cosine?: number;
  } = {}
): number {
  const defaultWeights = {
    levenshtein: 0.4,
    jaccard: 0.2,
    dice: 0.2,
    cosine: 0.2,
  };

  const finalWeights = { ...defaultWeights, ...weights };

  const levenshteinScore = calculateNormalizedSimilarity(str1, str2);
  const jaccardScore = jaccardSimilarity(str1, str2);
  const diceScore = diceSimilarity(str1, str2);
  const cosineScore = cosineSimilarity(str1, str2);

  return (
    levenshteinScore * finalWeights.levenshtein +
    jaccardScore * finalWeights.jaccard +
    diceScore * finalWeights.dice +
    cosineScore * finalWeights.cosine
  );
}

/**
 * Check if two strings are similar based on threshold
 */
export function areSimilar(
  str1: string,
  str2: string,
  threshold: number = 0.85,
  method: 'levenshtein' | 'jaccard' | 'dice' | 'cosine' | 'hybrid' = 'hybrid'
): boolean {
  let similarity: number;

  switch (method) {
    case 'levenshtein':
      similarity = calculateNormalizedSimilarity(str1, str2);
      break;
    case 'jaccard':
      similarity = jaccardSimilarity(str1, str2);
      break;
    case 'dice':
      similarity = diceSimilarity(str1, str2);
      break;
    case 'cosine':
      similarity = cosineSimilarity(str1, str2);
      break;
    case 'hybrid':
    default:
      similarity = hybridSimilarity(str1, str2);
      break;
  }

  return similarity >= threshold;
}

/**
 * Find most similar string from a list
 */
export function findMostSimilar(
  target: string,
  candidates: string[],
  method: 'levenshtein' | 'jaccard' | 'dice' | 'cosine' | 'hybrid' = 'hybrid'
): { string: string; similarity: number; index: number } | null {
  if (candidates.length === 0) return null;

  let maxSimilarity = -1;
  let maxIndex = -1;

  for (let i = 0; i < candidates.length; i++) {
    let similarity: number;

    switch (method) {
      case 'levenshtein':
        similarity = calculateNormalizedSimilarity(target, candidates[i]);
        break;
      case 'jaccard':
        similarity = jaccardSimilarity(target, candidates[i]);
        break;
      case 'dice':
        similarity = diceSimilarity(target, candidates[i]);
        break;
      case 'cosine':
        similarity = cosineSimilarity(target, candidates[i]);
        break;
      case 'hybrid':
      default:
        similarity = hybridSimilarity(target, candidates[i]);
        break;
    }

    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
      maxIndex = i;
    }
  }

  return {
    string: candidates[maxIndex],
    similarity: maxSimilarity,
    index: maxIndex,
  };
}

/**
 * Group similar strings together
 */
export function groupSimilarStrings(
  strings: string[],
  threshold: number = 0.85,
  method: 'levenshtein' | 'jaccard' | 'dice' | 'cosine' | 'hybrid' = 'hybrid'
): string[][] {
  const groups: string[][] = [];
  const visited = new Set<number>();

  for (let i = 0; i < strings.length; i++) {
    if (visited.has(i)) continue;

    const group: string[] = [strings[i]];
    visited.add(i);

    for (let j = i + 1; j < strings.length; j++) {
      if (visited.has(j)) continue;

      if (areSimilar(strings[i], strings[j], threshold, method)) {
        group.push(strings[j]);
        visited.add(j);
      }
    }

    groups.push(group);
  }

  return groups;
}
