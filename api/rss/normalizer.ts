// Content normalization pipeline for RSS feed items
// Converts raw RSS/Atom items into standardized Post format

import type { RSSFeedItem, ParsedFeedItem } from './types';
import {
  stripHtml,
  truncateText,
  extractDescription,
  extractAuthor,
  extractImageUrl,
  parseDate,
  generateContentId,
  cleanText,
  isValidUrl,
  extractDomain,
} from './utils';

export interface NormalizationOptions {
  maxTitleLength?: number;
  maxSnippetLength?: number;
  stripHtmlTags?: boolean;
  enforceHttps?: boolean;
  requireValidDate?: boolean;
}

export interface NormalizationResult {
  success: boolean;
  item?: ParsedFeedItem;
  error?: string;
  warnings?: string[];
}

const DEFAULT_OPTIONS: NormalizationOptions = {
  maxTitleLength: 50,
  maxSnippetLength: 150,
  stripHtmlTags: true,
  enforceHttps: false,
  requireValidDate: true,
};

/**
 * Normalizes a raw RSS feed item into standardized Post format
 */
export function normalizeItem(
  rawItem: RSSFeedItem,
  sourceName: string,
  category: string,
  sourceId?: number,
  options: NormalizationOptions = {}
): NormalizationResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const warnings: string[] = [];

  try {
    // 1. Extract and validate URL
    const url = extractUrl(rawItem);
    if (!url) {
      return {
        success: false,
        error: 'Missing or invalid item URL',
      };
    }

    // 2. Extract and normalize title
    const title = normalizeTitle(rawItem, opts, warnings);
    if (!title) {
      return {
        success: false,
        error: 'Missing or invalid title',
      };
    }

    // 3. Extract and normalize description/snippet
    const snippet = normalizeSnippet(rawItem, opts, warnings);
    if (!snippet) {
      warnings.push('Empty snippet generated');
    }

    // 4. Extract and validate publication date
    const pubDate = normalizePubDate(rawItem, opts, warnings);
    if (!pubDate) {
      if (opts.requireValidDate) {
        return {
          success: false,
          error: 'Missing or invalid publication date',
        };
      }
      // Fallback to current date if not required
      warnings.push('Using current date as fallback');
    }

    // 5. Extract author
    const author = normalizeAuthor(rawItem, warnings);

    // 6. Extract image URL
    const imageUrl = normalizeImageUrl(rawItem, warnings);

    // 7. Generate unique content ID
    const id = generateContentId(url, pubDate || new Date());

    // 8. Build normalized item
    const normalizedItem: ParsedFeedItem = {
      id,
      title,
      snippet,
      url,
      author,
      source: sourceName,
      category,
      pubDate: pubDate || new Date(),
      imageUrl,
      sourceId,
    };

    return {
      success: true,
      item: normalizedItem,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown normalization error',
      warnings,
    };
  }
}

/**
 * Batch normalize multiple items
 */
export function normalizeItems(
  items: RSSFeedItem[],
  sourceName: string,
  category: string,
  sourceId?: number,
  options?: NormalizationOptions
): ParsedFeedItem[] {
  const normalized: ParsedFeedItem[] = [];

  for (const item of items) {
    const result = normalizeItem(item, sourceName, category, sourceId, options);
    if (result.success && result.item) {
      normalized.push(result.item);
    }
  }

  return normalized;
}

/**
 * Extract URL from item
 */
function extractUrl(item: RSSFeedItem): string | null {
  const url = item.link || item.guid;
  if (!url || !isValidUrl(url)) {
    return null;
  }
  return url.trim();
}

/**
 * Normalize title with character limits
 */
function normalizeTitle(
  item: RSSFeedItem,
  options: NormalizationOptions,
  warnings: string[]
): string | null {
  let title = item.title;

  if (!title || title.trim() === '') {
    return null;
  }

  // Strip HTML if enabled
  if (options.stripHtmlTags) {
    title = stripHtml(title);
  }

  // Clean text (decode entities, normalize whitespace)
  title = cleanText(title);

  // Remove CDATA wrappers if present
  title = title.replace(/^<!\[CDATA\[(.*)\]\]>$/, '$1').trim();

  // Truncate if exceeds limit
  if (options.maxTitleLength && title.length > options.maxTitleLength) {
    title = truncateText(title, options.maxTitleLength);
    warnings.push(`Title truncated from ${title.length} to ${options.maxTitleLength} chars`);
  }

  return title;
}

/**
 * Normalize snippet/description with character limits
 */
function normalizeSnippet(
  item: RSSFeedItem,
  options: NormalizationOptions,
  warnings: string[]
): string {
  // Try to extract description in order of preference
  let snippet = extractDescription(item);

  if (!snippet || snippet.trim() === '') {
    return '';
  }

  // Strip HTML if enabled
  if (options.stripHtmlTags) {
    snippet = stripHtml(snippet);
  }

  // Clean text
  snippet = cleanText(snippet);

  // Remove CDATA wrappers
  snippet = snippet.replace(/^<!\[CDATA\[(.*)\]\]>$/, '$1').trim();

  // Truncate if exceeds limit
  if (options.maxSnippetLength && snippet.length > options.maxSnippetLength) {
    snippet = truncateText(snippet, options.maxSnippetLength);
    warnings.push(`Snippet truncated from ${snippet.length} to ${options.maxSnippetLength} chars`);
  }

  return snippet;
}

/**
 * Normalize publication date
 */
function normalizePubDate(
  item: RSSFeedItem,
  options: NormalizationOptions,
  warnings: string[]
): Date | null {
  const dateString = item.pubDate;

  if (!dateString) {
    return null;
  }

  const date = parseDate(dateString);

  if (!date || isNaN(date.getTime())) {
    warnings.push(`Invalid date format: ${dateString}`);
    return null;
  }

  // Check if date is in the future
  const now = new Date();
  if (date > now) {
    warnings.push(`Future date detected: ${dateString}, using current date`);
    return now;
  }

  // Check if date is too old (more than 2 years)
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  if (date < twoYearsAgo) {
    warnings.push(`Very old date detected: ${dateString}`);
  }

  return date;
}

/**
 * Normalize author field
 */
function normalizeAuthor(item: RSSFeedItem, warnings: string[]): string | undefined {
  const author = extractAuthor(item);

  if (!author || author.trim() === '') {
    return undefined;
  }

  // Clean author field
  let cleanAuthor = author.trim();

  // Remove CDATA wrappers
  cleanAuthor = cleanAuthor.replace(/^<!\[CDATA\[(.*)\]\]>$/, '$1').trim();

  // Remove email addresses in parentheses
  cleanAuthor = cleanAuthor.replace(/\s*\([^)]*@[^)]*\)/, '');

  // Limit to reasonable length
  if (cleanAuthor.length > 100) {
    cleanAuthor = truncateText(cleanAuthor, 100);
    warnings.push('Author name truncated');
  }

  return cleanAuthor;
}

/**
 * Normalize image URL
 */
function normalizeImageUrl(item: RSSFeedItem, warnings: string[]): string | undefined {
  const imageUrl = extractImageUrl(item);

  if (!imageUrl || !isValidUrl(imageUrl)) {
    return undefined;
  }

  // Ensure HTTPS if enforced
  let normalized = imageUrl.trim();

  // Validate image URL
  if (!normalized.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) &&
      !normalized.includes('image') &&
      !normalized.includes('thumbnail')) {
    warnings.push('Questionable image URL format');
  }

  return normalized;
}

/**
 * Validate normalized item
 */
export function validateNormalizedItem(item: ParsedFeedItem): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!item.id || item.id.length === 0) {
    errors.push('Missing content ID');
  }

  if (!item.title || item.title.trim() === '') {
    errors.push('Missing title');
  }

  if (item.title && item.title.length > 50) {
    errors.push('Title exceeds 50 character limit');
  }

  if (item.snippet && item.snippet.length > 150) {
    errors.push('Snippet exceeds 150 character limit');
  }

  if (!item.url || !isValidUrl(item.url)) {
    errors.push('Invalid URL');
  }

  if (!item.source || item.source.trim() === '') {
    errors.push('Missing source');
  }

  if (!item.category || item.category.trim() === '') {
    errors.push('Missing category');
  }

  if (!item.pubDate || isNaN(item.pubDate.getTime())) {
    errors.push('Invalid publication date');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Filter duplicate items based on URL or ID
 */
export function deduplicateItems(items: ParsedFeedItem[]): ParsedFeedItem[] {
  const seen = new Set<string>();
  const unique: ParsedFeedItem[] = [];

  for (const item of items) {
    const key = item.url; // Use URL as primary deduplication key
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
  }

  return unique;
}

/**
 * Sort items by publication date (newest first)
 */
export function sortByDate(items: ParsedFeedItem[]): ParsedFeedItem[] {
  return items.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
}
