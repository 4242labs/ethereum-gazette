// Deduplication system for RSS feed items
// Detects duplicates using URL normalization and title similarity

import { normalizeUrl, areUrlsDuplicate } from "../lib/url-normalizer";
import { areSimilar, hybridSimilarity } from "../lib/string-similarity";
import type { ParsedFeedItem } from "./types";

export interface DeduplicationConfig {
  urlThreshold: number; // Similarity threshold for URL comparison (0-1)
  titleThreshold: number; // Similarity threshold for title comparison (0-1)
  timeWindowHours: number; // Time window for considering duplicates (hours)
  enableUrlNormalization: boolean;
  enableTitleSimilarity: boolean;
  mergeStrategy: "keepFirst" | "keepLatest" | "keepBest";
}

export interface DuplicateMatch {
  item: ParsedFeedItem;
  matchedWith: ParsedFeedItem;
  matchType: "url" | "title" | "both";
  similarity: number;
  reason: string;
}

export interface DeduplicationResult {
  unique: ParsedFeedItem[];
  duplicates: DuplicateMatch[];
  stats: {
    totalItems: number;
    uniqueItems: number;
    duplicateCount: number;
    urlDuplicates: number;
    titleDuplicates: number;
    bothDuplicates: number;
  };
}

const DEFAULT_CONFIG: DeduplicationConfig = {
  urlThreshold: 0.95,
  titleThreshold: 0.85,
  timeWindowHours: 24,
  enableUrlNormalization: true,
  enableTitleSimilarity: true,
  mergeStrategy: "keepFirst",
};

/**
 * Deduplicate items based on URL and title similarity
 */
export function deduplicateItems(
  items: ParsedFeedItem[],
  config: Partial<DeduplicationConfig> = {},
): DeduplicationResult {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const unique: ParsedFeedItem[] = [];
  const duplicates: DuplicateMatch[] = [];

  // Stats tracking
  let urlDuplicates = 0;
  let titleDuplicates = 0;
  let bothDuplicates = 0;

  // Sort items by publication date (earliest first for keepFirst strategy)
  const sortedItems = [...items].sort((a, b) => {
    if (finalConfig.mergeStrategy === "keepLatest") {
      return b.pubDate.getTime() - a.pubDate.getTime();
    }
    return a.pubDate.getTime() - b.pubDate.getTime();
  });

  for (const item of sortedItems) {
    const duplicateMatch = findDuplicate(item, unique, finalConfig);

    if (duplicateMatch) {
      duplicates.push(duplicateMatch);

      // Track duplicate types
      if (duplicateMatch.matchType === "url") {
        urlDuplicates++;
      } else if (duplicateMatch.matchType === "title") {
        titleDuplicates++;
      } else if (duplicateMatch.matchType === "both") {
        bothDuplicates++;
      }

      // Optionally merge metadata from duplicate
      if (finalConfig.mergeStrategy === "keepBest") {
        mergeItemMetadata(duplicateMatch.matchedWith, item);
      }
    } else {
      unique.push(item);
    }
  }

  return {
    unique,
    duplicates,
    stats: {
      totalItems: items.length,
      uniqueItems: unique.length,
      duplicateCount: duplicates.length,
      urlDuplicates,
      titleDuplicates,
      bothDuplicates,
    },
  };
}

/**
 * Find if an item is a duplicate of any item in the unique list
 */
function findDuplicate(
  item: ParsedFeedItem,
  uniqueItems: ParsedFeedItem[],
  config: DeduplicationConfig,
): DuplicateMatch | null {
  for (const uniqueItem of uniqueItems) {
    // Check if items are within the time window
    if (
      !isWithinTimeWindow(
        item.pubDate,
        uniqueItem.pubDate,
        config.timeWindowHours,
      )
    ) {
      continue;
    }

    let urlMatch = false;
    let titleMatch = false;
    let urlSimilarity = 0;
    let titleSimilarity = 0;

    // 1. Check URL similarity
    if (config.enableUrlNormalization) {
      urlSimilarity = calculateUrlSimilarityScore(item.url, uniqueItem.url);
      urlMatch = urlSimilarity >= config.urlThreshold;
    }

    // 2. Check title similarity
    if (config.enableTitleSimilarity) {
      titleSimilarity = hybridSimilarity(item.title, uniqueItem.title);
      titleMatch = titleSimilarity >= config.titleThreshold;
    }

    // 3. Determine if it's a duplicate
    if (urlMatch && titleMatch) {
      return {
        item,
        matchedWith: uniqueItem,
        matchType: "both",
        similarity: (urlSimilarity + titleSimilarity) / 2,
        reason: `URL similarity: ${(urlSimilarity * 100).toFixed(1)}%, Title similarity: ${(titleSimilarity * 100).toFixed(1)}%`,
      };
    } else if (urlMatch) {
      return {
        item,
        matchedWith: uniqueItem,
        matchType: "url",
        similarity: urlSimilarity,
        reason: `URL similarity: ${(urlSimilarity * 100).toFixed(1)}%`,
      };
    } else if (titleMatch) {
      return {
        item,
        matchedWith: uniqueItem,
        matchType: "title",
        similarity: titleSimilarity,
        reason: `Title similarity: ${(titleSimilarity * 100).toFixed(1)}%`,
      };
    }
  }

  return null;
}

/**
 * Calculate URL similarity score
 */
function calculateUrlSimilarityScore(url1: string, url2: string): number {
  // First check exact match after normalization
  const normalized1 = normalizeUrl(url1);
  const normalized2 = normalizeUrl(url2);

  if (normalized1 === normalized2) {
    return 1.0;
  }

  // Then check similarity
  try {
    const urlObj1 = new URL(normalized1);
    const urlObj2 = new URL(normalized2);

    // Same domain and very similar path = high similarity
    if (urlObj1.hostname === urlObj2.hostname) {
      const pathSimilarity = hybridSimilarity(
        urlObj1.pathname,
        urlObj2.pathname,
      );
      return 0.7 + pathSimilarity * 0.3; // Base 70% for same domain
    }

    // Different domains but very similar full URLs
    return hybridSimilarity(normalized1, normalized2) * 0.8; // Cap at 80% for different domains
  } catch {
    return 0;
  }
}

/**
 * Check if two dates are within the specified time window
 */
function isWithinTimeWindow(
  date1: Date,
  date2: Date,
  windowHours: number,
): boolean {
  // Safety check for undefined or invalid dates
  if (
    !date1 ||
    !date2 ||
    !(date1 instanceof Date) ||
    !(date2 instanceof Date)
  ) {
    return false;
  }

  try {
    const diffMs = Math.abs(date1.getTime() - date2.getTime());
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours <= windowHours;
  } catch {
    return false;
  }
}

/**
 * Merge metadata from duplicate item into the kept item
 * Keeps the best available data (non-null, longer descriptions, etc.)
 */
function mergeItemMetadata(
  kept: ParsedFeedItem,
  duplicate: ParsedFeedItem,
): void {
  // Keep longer snippet if available
  if (
    !kept.snippet ||
    (duplicate.snippet && duplicate.snippet.length > kept.snippet.length)
  ) {
    kept.snippet = duplicate.snippet;
  }

  // Keep author if missing
  if (!kept.author && duplicate.author) {
    kept.author = duplicate.author;
  }

  // Keep image if missing
  if (!kept.imageUrl && duplicate.imageUrl) {
    kept.imageUrl = duplicate.imageUrl;
  }

  // Use earlier publication date
  if (duplicate.pubDate < kept.pubDate) {
    kept.pubDate = duplicate.pubDate;
  }
}

/**
 * Deduplicate against existing database items
 * Returns only items that don't exist in the database
 */
export async function deduplicateAgainstDatabase(
  newItems: ParsedFeedItem[],
  existingItems: ParsedFeedItem[],
  config: Partial<DeduplicationConfig> = {},
): Promise<DeduplicationResult> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const unique: ParsedFeedItem[] = [];
  const duplicates: DuplicateMatch[] = [];

  let urlDuplicates = 0;
  let titleDuplicates = 0;
  let bothDuplicates = 0;

  for (const newItem of newItems) {
    const duplicateMatch = findDuplicate(newItem, existingItems, finalConfig);

    if (duplicateMatch) {
      duplicates.push(duplicateMatch);

      if (duplicateMatch.matchType === "url") {
        urlDuplicates++;
      } else if (duplicateMatch.matchType === "title") {
        titleDuplicates++;
      } else if (duplicateMatch.matchType === "both") {
        bothDuplicates++;
      }
    } else {
      unique.push(newItem);
    }
  }

  return {
    unique,
    duplicates,
    stats: {
      totalItems: newItems.length,
      uniqueItems: unique.length,
      duplicateCount: duplicates.length,
      urlDuplicates,
      titleDuplicates,
      bothDuplicates,
    },
  };
}

/**
 * Quick check if a single item exists in a list
 */
export function isDuplicate(
  item: ParsedFeedItem,
  existingItems: ParsedFeedItem[],
  config: Partial<DeduplicationConfig> = {},
): boolean {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  return findDuplicate(item, existingItems, finalConfig) !== null;
}

/**
 * Find all duplicate groups in a list of items
 */
export function findDuplicateGroups(
  items: ParsedFeedItem[],
  config: Partial<DeduplicationConfig> = {},
): ParsedFeedItem[][] {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const groups: ParsedFeedItem[][] = [];
  const visited = new Set<string>();

  for (let i = 0; i < items.length; i++) {
    if (visited.has(items[i].id)) continue;

    const group: ParsedFeedItem[] = [items[i]];
    visited.add(items[i].id);

    for (let j = i + 1; j < items.length; j++) {
      if (visited.has(items[j].id)) continue;

      const duplicateMatch = findDuplicate(items[j], [items[i]], finalConfig);
      if (duplicateMatch) {
        group.push(items[j]);
        visited.add(items[j].id);
      }
    }

    if (group.length > 1) {
      groups.push(group);
    }
  }

  return groups;
}

/**
 * Get deduplication statistics for a list of items
 */
export function getDeduplicationStats(
  items: ParsedFeedItem[],
  config: Partial<DeduplicationConfig> = {},
): {
  totalItems: number;
  uniqueItems: number;
  duplicateGroups: number;
  largestGroup: number;
  averageGroupSize: number;
} {
  const groups = findDuplicateGroups(items, config);
  const uniqueCount =
    items.length - groups.reduce((sum, group) => sum + (group.length - 1), 0);
  const largestGroup =
    groups.length > 0 ? Math.max(...groups.map((g) => g.length)) : 0;
  const averageGroupSize =
    groups.length > 0
      ? groups.reduce((sum, group) => sum + group.length, 0) / groups.length
      : 0;

  return {
    totalItems: items.length,
    uniqueItems: uniqueCount,
    duplicateGroups: groups.length,
    largestGroup,
    averageGroupSize,
  };
}

/**
 * Normalize URLs in items for consistent duplicate detection
 */
export function normalizeItemUrls(items: ParsedFeedItem[]): ParsedFeedItem[] {
  return items.map((item) => ({
    ...item,
    url: normalizeUrl(item.url),
  }));
}

/**
 * Create a deduplication report
 */
export function createDeduplicationReport(result: DeduplicationResult): string {
  const { stats, duplicates } = result;
  const rate = ((stats.duplicateCount / stats.totalItems) * 100).toFixed(1);

  let report = `Deduplication Report\n`;
  report += `====================\n\n`;
  report += `Total Items: ${stats.totalItems}\n`;
  report += `Unique Items: ${stats.uniqueItems}\n`;
  report += `Duplicates: ${stats.duplicateCount} (${rate}%)\n\n`;
  report += `Duplicate Breakdown:\n`;
  report += `- URL duplicates: ${stats.urlDuplicates}\n`;
  report += `- Title duplicates: ${stats.titleDuplicates}\n`;
  report += `- Both URL & Title: ${stats.bothDuplicates}\n\n`;

  if (duplicates.length > 0) {
    report += `Top 10 Duplicates:\n`;
    report += `------------------\n`;
    duplicates.slice(0, 10).forEach((dup, index) => {
      report += `${index + 1}. ${dup.item.title}\n`;
      report += `   Match Type: ${dup.matchType}\n`;
      report += `   Similarity: ${(dup.similarity * 100).toFixed(1)}%\n`;
      report += `   Reason: ${dup.reason}\n\n`;
    });
  }

  return report;
}
