// URL normalization utilities for duplicate detection
// Removes tracking parameters and normalizes URLs for comparison

/**
 * Common tracking parameters to remove from URLs
 */
const TRACKING_PARAMS = [
  // Analytics
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'utm_source_platform',
  'utm_creative_format',
  'utm_marketing_tactic',

  // Social media
  'fbclid',
  'gclid',
  'msclkid',
  'twclid',
  'li_fat_id',

  // Email tracking
  'mc_cid',
  'mc_eid',
  'mkt_tok',
  '_hsenc',
  '_hsmi',

  // Referral tracking
  'ref',
  'referrer',
  'source',

  // Session tracking
  'sessionid',
  'session_id',
  '_ga',
  '_gid',

  // Other common tracking
  'click_id',
  'campaign_id',
  'ad_id',
  'affiliate_id',
];

/**
 * Normalize URL for comparison
 * Removes tracking parameters, normalizes protocol, trailing slashes, etc.
 */
export function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);

    // 1. Normalize protocol to https
    urlObj.protocol = 'https:';

    // 2. Remove www prefix
    urlObj.hostname = urlObj.hostname.replace(/^www\./, '');

    // 3. Remove tracking parameters
    for (const param of TRACKING_PARAMS) {
      urlObj.searchParams.delete(param);
    }

    // 4. Sort remaining query parameters for consistency
    const sortedParams = new URLSearchParams(
      Array.from(urlObj.searchParams.entries()).sort(([a], [b]) => a.localeCompare(b))
    );
    urlObj.search = sortedParams.toString();

    // 5. Remove trailing slash from pathname (except for root)
    if (urlObj.pathname !== '/' && urlObj.pathname.endsWith('/')) {
      urlObj.pathname = urlObj.pathname.slice(0, -1);
    }

    // 6. Remove fragment/hash
    urlObj.hash = '';

    // 7. Convert to lowercase for case-insensitive comparison
    let normalized = urlObj.toString().toLowerCase();

    // 8. Remove empty query string
    if (normalized.endsWith('?')) {
      normalized = normalized.slice(0, -1);
    }

    return normalized;
  } catch (error) {
    // If URL parsing fails, return original (lowercase)
    return url.toLowerCase().trim();
  }
}

/**
 * Calculate URL similarity (0-1 scale)
 * Compares normalized URLs and their components
 */
export function calculateUrlSimilarity(url1: string, url2: string): number {
  const normalized1 = normalizeUrl(url1);
  const normalized2 = normalizeUrl(url2);

  // Exact match after normalization
  if (normalized1 === normalized2) {
    return 1.0;
  }

  try {
    const urlObj1 = new URL(normalized1);
    const urlObj2 = new URL(normalized2);

    let score = 0;
    let weights = 0;

    // Domain comparison (weight: 0.4)
    if (urlObj1.hostname === urlObj2.hostname) {
      score += 0.4;
    }
    weights += 0.4;

    // Path comparison (weight: 0.5)
    const pathSimilarity = calculatePathSimilarity(urlObj1.pathname, urlObj2.pathname);
    score += pathSimilarity * 0.5;
    weights += 0.5;

    // Query parameters comparison (weight: 0.1)
    const paramSimilarity = calculateParamSimilarity(
      urlObj1.searchParams,
      urlObj2.searchParams
    );
    score += paramSimilarity * 0.1;
    weights += 0.1;

    return score / weights;
  } catch {
    // If URL parsing fails, use string similarity as fallback
    return calculateStringSimilarity(normalized1, normalized2);
  }
}

/**
 * Calculate path similarity using Levenshtein-like approach
 */
function calculatePathSimilarity(path1: string, path2: string): number {
  if (path1 === path2) return 1.0;

  const segments1 = path1.split('/').filter(Boolean);
  const segments2 = path2.split('/').filter(Boolean);

  if (segments1.length === 0 && segments2.length === 0) return 1.0;
  if (segments1.length === 0 || segments2.length === 0) return 0.0;

  let matches = 0;
  const maxLength = Math.max(segments1.length, segments2.length);

  for (let i = 0; i < Math.min(segments1.length, segments2.length); i++) {
    if (segments1[i] === segments2[i]) {
      matches++;
    }
  }

  return matches / maxLength;
}

/**
 * Calculate query parameter similarity
 */
function calculateParamSimilarity(
  params1: URLSearchParams,
  params2: URLSearchParams
): number {
  const keys1 = Array.from(params1.keys());
  const keys2 = Array.from(params2.keys());

  if (keys1.length === 0 && keys2.length === 0) return 1.0;
  if (keys1.length === 0 || keys2.length === 0) return 0.0;

  const allKeys = new Set([...keys1, ...keys2]);
  let matches = 0;

  for (const key of allKeys) {
    if (params1.get(key) === params2.get(key)) {
      matches++;
    }
  }

  return matches / allKeys.size;
}

/**
 * Simple string similarity (Dice coefficient)
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1.0;
  if (str1.length < 2 || str2.length < 2) return 0.0;

  const bigrams1 = getBigrams(str1);
  const bigrams2 = getBigrams(str2);

  const intersection = bigrams1.filter((bigram) => bigrams2.includes(bigram));

  return (2.0 * intersection.length) / (bigrams1.length + bigrams2.length);
}

/**
 * Get bigrams from string
 */
function getBigrams(str: string): string[] {
  const bigrams: string[] = [];
  for (let i = 0; i < str.length - 1; i++) {
    bigrams.push(str.substring(i, i + 2));
  }
  return bigrams;
}

/**
 * Check if two URLs are duplicates based on normalized comparison
 */
export function areUrlsDuplicate(
  url1: string,
  url2: string,
  threshold: number = 0.95
): boolean {
  const similarity = calculateUrlSimilarity(url1, url2);
  return similarity >= threshold;
}

/**
 * Extract canonical URL from HTML redirects or shortened URLs
 * This is a placeholder for future implementation
 */
export function extractCanonicalUrl(url: string): string {
  // For now, just return the normalized URL
  // In future, could fetch URL and check for canonical link tags or redirects
  return normalizeUrl(url);
}

/**
 * Batch normalize URLs
 */
export function normalizeUrls(urls: string[]): string[] {
  return urls.map(normalizeUrl);
}

/**
 * Find duplicate URLs in a list
 */
export function findDuplicateUrls(
  urls: string[],
  threshold: number = 0.95
): Map<string, string[]> {
  const duplicates = new Map<string, string[]>();
  const normalized = urls.map((url) => ({
    original: url,
    normalized: normalizeUrl(url),
  }));

  for (let i = 0; i < normalized.length; i++) {
    for (let j = i + 1; j < normalized.length; j++) {
      if (areUrlsDuplicate(normalized[i].original, normalized[j].original, threshold)) {
        const key = normalized[i].original;
        if (!duplicates.has(key)) {
          duplicates.set(key, []);
        }
        duplicates.get(key)!.push(normalized[j].original);
      }
    }
  }

  return duplicates;
}
