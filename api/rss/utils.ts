// Utility functions for RSS feed parsing

/**
 * Normalizes a URL by removing tracking parameters and fragments
 */
export function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);

    // Remove common tracking parameters
    const trackingParams = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "ref",
      "source",
      "fbclid",
      "gclid",
      "mc_cid",
      "mc_eid",
    ];

    trackingParams.forEach((param) => urlObj.searchParams.delete(param));

    // Remove fragment
    urlObj.hash = "";

    return urlObj.toString();
  } catch (error) {
    return url;
  }
}

/**
 * Strips HTML tags and decodes entities from a string
 */
export function stripHtml(html: string): string {
  if (!html) return "";

  // Remove CDATA tags
  let text = html.replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1");

  // Remove HTML tags
  text = text.replace(/<[^>]*>/g, " ");

  // Decode common HTML entities
  const entities: Record<string, string> = {
    "\u0026amp;": "\u0026",
    "\u0026lt;": "\u003c",
    "\u0026gt;": "\u003e",
    "\u0026quot;": "\u0022",
    "\u0026apos;": "\u0027",
    "\u0026nbsp;": "\u0020",
    "\u0026#39;": "\u0027",
    "\u0026#x27;": "\u0027",
    "\u0026mdash;": "\u2014",
    "\u0026ndash;": "\u2013",
    "\u0026hellip;": "\u2026",
    "\u0026#8211;": "\u2013",
    "\u0026#8212;": "\u2014",
  };

  Object.entries(entities).forEach(([entity, char]) => {
    text = text.replace(new RegExp(entity, "g"), char);
  });

  // Remove extra whitespace
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

/**
 * Cleans text by decoding entities and normalizing whitespace
 */
export function cleanText(text: string): string {
  if (!text) return "";

  // Decode HTML entities
  let cleaned = text;

  const entities: Record<string, string> = {
    "\u0026amp;": "\u0026",
    "\u0026lt;": "\u003c",
    "\u0026gt;": "\u003e",
    "\u0026quot;": "\u0022",
    "\u0026apos;": "\u0027",
    "\u0026nbsp;": "\u0020",
    "\u0026#39;": "\u0027",
    "\u0026#x27;": "\u0027",
    "\u0026mdash;": "\u2014",
    "\u0026ndash;": "\u2013",
    "\u0026hellip;": "\u2026",
    "\u0026#8211;": "\u2013",
    "\u0026#8212;": "\u2014",
    "\u0026#8217;": "\u0027",
    "\u0026#8220;": "\u201c",
    "\u0026#8221;": "\u201d",
  };

  Object.entries(entities).forEach(([entity, char]) => {
    cleaned = cleaned.replace(new RegExp(entity, "g"), char);
  });

  // Normalize whitespace (but preserve single line breaks)
  cleaned = cleaned.replace(/[ \t]+/g, " "); // Multiple spaces/tabs to single space
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n"); // Multiple line breaks to max 2
  cleaned = cleaned.trim();

  return cleaned;
}

/**
 * Generates a unique ID from URL and date
 */
export function generateContentId(url: string, pubDate: Date | string): string {
  const normalizedUrl = normalizeUrl(url);
  const dateStr = typeof pubDate === "string" ? pubDate : pubDate.toISOString();
  const combined = `${normalizedUrl}:${dateStr}`;

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return `post_${Math.abs(hash).toString(36)}`;
}

/**
 * Truncates text to a maximum length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;

  // Try to break at word boundary
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");

  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + "…";
  }

  return truncated + "…";
}

/**
 * Extracts the best available description from RSS item
 */
export function extractDescription(item: any): string {
  // Priority: content:encoded > content > description > summary
  const contentEncoded = item["content:encoded"] || item.contentEncoded;
  const content = item.content;
  const description = item.description;
  const summary = item.summary;

  let text = "";

  if (contentEncoded) {
    text = contentEncoded;
  } else if (content) {
    text = typeof content === "string" ? content : content.value || "";
  } else if (description) {
    text = description;
  } else if (summary) {
    text = summary;
  }

  return stripHtml(text);
}

/**
 * Extracts the author from various RSS fields
 */
export function extractAuthor(item: any): string | undefined {
  const dcCreator = item["dc:creator"] || item.dcCreator;
  const author = item.author;
  const creator = item.creator;

  if (dcCreator) return dcCreator;

  if (typeof author === "string") {
    // Handle nested XML in author field (common in Atom feeds)
    if (
      author.toLowerCase().includes("<name>") &&
      author.toLowerCase().includes("</name>")
    ) {
      const nameMatch = author.match(/<name>(.*?)<\/name>/i);
      if (nameMatch) {
        return nameMatch[1];
      }
    }
    return author;
  }

  if (author?.name) return author.name;
  if (creator) return creator;

  return undefined;
}

/**
 * Extracts image URL from RSS item
 */
export function extractImageUrl(item: any): string | undefined {
  // 1. Check media:thumbnail
  const mediaThumbnail = item["media:thumbnail"] || item.mediaThumbnail;
  if (mediaThumbnail?.url) return mediaThumbnail.url;

  // 2. Check media:content (used by CoinDesk, Arc Publishing feeds)
  const mediaContent = item["media:content"] || item.mediaContent;
  if (mediaContent) {
    const media = Array.isArray(mediaContent) ? mediaContent[0] : mediaContent;
    if (media?.url && (media.medium === "image" || media.type?.startsWith("image/"))) {
      return media.url;
    }
  }

  // 3. Check enclosure
  const enclosure = item.enclosure;
  if (enclosure?.url && enclosure.type?.startsWith("image/")) {
    return enclosure.url;
  }

  // 4. Check for image in content HTML
  const content = item["content:encoded"] || item.content || item.description;
  if (content) {
    const imgMatch = content.match(/<img[^>]+src="([^">]+)"/i);
    if (imgMatch) return imgMatch[1];
  }

  return undefined;
}

/**
 * Parses date string to Date object with fallback
 */
export function parseDate(dateString: string | undefined): Date {
  if (!dateString) return new Date();

  try {
    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return new Date();
    }

    // Check if date is not in the future
    const now = new Date();
    if (date > now) {
      return now;
    }

    return date;
  } catch (error) {
    return new Date();
  }
}

/**
 * Validates a URL
 */
export function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Extracts domain from URL
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace("www.", "");
  } catch {
    return "unknown";
  }
}

/**
 * Fetches with timeout
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number } = {},
): Promise<Response> {
  const { timeout = 30000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (i < maxRetries - 1) {
        // Exponential backoff: delay * 2^i
        const backoffDelay = delay * Math.pow(2, i);
        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
      }
    }
  }

  throw lastError!;
}

/**
 * Sanitizes string for use as filename or ID
 */
export function sanitizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Gets content length estimate
 */
export function getContentLength(text: string): number {
  // Remove extra whitespace and count words
  const words = text.trim().split(/\s+/).length;
  return words;
}

/**
 * Checks if content is too short to be meaningful
 */
export function isContentTooShort(
  text: string,
  minWords: number = 10,
): boolean {
  return getContentLength(text) < minWords;
}

/**
 * Extracts categories from RSS item
 */
export function extractCategories(item: any): string[] {
  const categories: string[] = [];

  if (item.categories) {
    if (Array.isArray(item.categories)) {
      categories.push(...item.categories);
    } else if (typeof item.categories === "string") {
      categories.push(item.categories);
    }
  }

  if (item.category) {
    if (Array.isArray(item.category)) {
      categories.push(...item.category);
    } else if (typeof item.category === "string") {
      categories.push(item.category);
    }
  }

  return categories.filter(Boolean);
}
