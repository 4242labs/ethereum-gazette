// Core RSS/Atom feed parser implementation

import type {
  RSSFeed,
  RSSFeedItem,
  FeedParseResult,
  FeedParseOptions,
  ParsedFeedItem,
  DEFAULT_PARSE_OPTIONS,
} from "./types";
import {
  stripHtml,
  truncateText,
  extractDescription,
  extractAuthor,
  extractImageUrl,
  parseDate,
  isValidUrl,
  extractDomain,
  generateContentId,
  fetchWithTimeout,
  retry,
  extractCategories,
} from "./utils";
import { KeywordFilter } from "./keyword-filter";
import { logRejectedItem, logReviewItem } from "./filter-logger";

// Instantiate the filter once to be reused across all parsing jobs
const keywordFilter = new KeywordFilter();

/**
 * Parses XML string to extract RSS/Atom feed data
 */
function parseXML(xmlString: string): any {
  // Simple XML parser for Node.js environment
  // This is a basic implementation - in production, consider using xml2js or fast-xml-parser

  const getTagContent = (xml: string, tag: string): string | null => {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
    const match = xml.match(regex);
    return match ? match[1].trim() : null;
  };

  const getAllTags = (xml: string, tag: string): string[] => {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "gi");
    const matches = [];
    let match;
    while ((match = regex.exec(xml)) !== null) {
      matches.push(match[1]);
    }
    return matches;
  };

  const getAttribute = (element: string, attr: string): string | null => {
    const regex = new RegExp(`${attr}=["']([^"']+)["']`, "i");
    const match = element.match(regex);
    return match ? match[1] : null;
  };

  try {
    // Detect feed type
    const isAtom =
      xmlString.includes("<feed") &&
      xmlString.includes('xmlns="http://www.w3.org/2005/Atom"');
    const isRSS = xmlString.includes("<rss") || xmlString.includes("<rdf:RDF");

    if (!isAtom && !isRSS) {
      throw new Error("Invalid feed format: Not RSS or Atom");
    }

    const channel = getTagContent(xmlString, "channel") || xmlString;

    const feed: any = {
      title: getTagContent(channel, "title") || "Untitled Feed",
      description: getTagContent(channel, "description") || "",
      link: getTagContent(channel, "link") || "",
      items: [],
    };

    // Parse items (RSS) or entries (Atom)
    const itemTag = isAtom ? "entry" : "item";
    const itemsXml = getAllTags(xmlString, itemTag);

    feed.items = itemsXml.map((itemXml: string) => {
      const item: any = {};

      if (isAtom) {
        // Atom format
        item.title = getTagContent(itemXml, "title") || "";
        const linkMatch = itemXml.match(/<link[^>]+href=["']([^"']+)["']/i);
        item.link = linkMatch ? linkMatch[1] : "";
        item.description =
          getTagContent(itemXml, "summary") ||
          getTagContent(itemXml, "content") ||
          "";
        item.pubDate =
          getTagContent(itemXml, "updated") ||
          getTagContent(itemXml, "published") ||
          "";
        item.author = getTagContent(itemXml, "author") || "";
        item.guid = getTagContent(itemXml, "id") || "";
      } else {
        // RSS format
        item.title = getTagContent(itemXml, "title") || "";
        item.link = getTagContent(itemXml, "link") || "";
        item.description = getTagContent(itemXml, "description") || "";
        item.pubDate =
          getTagContent(itemXml, "pubDate") ||
          getTagContent(itemXml, "dc:date") ||
          "";
        item.author =
          getTagContent(itemXml, "author") ||
          getTagContent(itemXml, "dc:creator") ||
          "";
        item.guid = getTagContent(itemXml, "guid") || "";
        item["content:encoded"] =
          getTagContent(itemXml, "content:encoded") || "";
        item["dc:creator"] = getTagContent(itemXml, "dc:creator") || "";

        // Parse enclosure
        const enclosureMatch = itemXml.match(/<enclosure[^>]+>/i);
        if (enclosureMatch) {
          const enclosureTag = enclosureMatch[0];
          item.enclosure = {
            url: getAttribute(enclosureTag, "url") || "",
            type: getAttribute(enclosureTag, "type") || "",
          };
        }

        // Parse media:thumbnail
        const thumbnailMatch = itemXml.match(
          /<media:thumbnail[^>]+url=["']([^"']+)["']/i,
        );
        if (thumbnailMatch) {
          item["media:thumbnail"] = { url: thumbnailMatch[1] };
        }

        // Parse media:content (used by CoinDesk, Arc Publishing feeds)
        const mediaContentMatch = itemXml.match(
          /<media:content[^>]+url=["']([^"']+)["'][^>]*>/i,
        );
        if (mediaContentMatch) {
          const mediaTag = mediaContentMatch[0];
          item["media:content"] = {
            url: mediaContentMatch[1],
            type: getAttribute(mediaTag, "type") || undefined,
            medium: getAttribute(mediaTag, "medium") || undefined,
          };
        }

        // Parse categories
        const categories = getAllTags(itemXml, "category");
        if (categories.length > 0) {
          item.categories = categories;
        }
      }

      return item;
    });

    return feed;
  } catch (error) {
    throw new Error(
      `XML parsing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Normalizes a parsed feed item to our standard format
 */
function normalizeItem(
  item: RSSFeedItem,
  feedSource: string,
  category: string = "all",
): ParsedFeedItem | null {
  // Validate required fields
  if (!item.title || !item.link) {
    return null;
  }

  if (!isValidUrl(item.link)) {
    return null;
  }

  // Extract and clean description
  const description = extractDescription(item);

  // Allow items with short/empty descriptions if they have substantial titles (like Vitalik's blog)
  // or if they come from known high-quality sources
  if ((!description || description.length < 10) && item.title.length < 15) {
    return null; // Skip items with no meaningful content and short titles
  }

  // Generate snippet (270 characters max)
  const snippet = truncateText(description, 270);

  // Extract metadata
  const rawAuthor = extractAuthor(item);
  const author = rawAuthor ? stripHtml(rawAuthor) : undefined;
  const pubDate = parseDate(item.pubDate);
  const imageUrl = extractImageUrl(item);
  const id = generateContentId(item.link, pubDate);

  // Extract source name from feed or domain
  const source = feedSource || extractDomain(item.link);

  return {
    id,
    title: truncateText(stripHtml(item.title), 110), // Title max 110 chars
    snippet,
    url: item.link,
    author,
    source,
    category,
    pubDate,
    imageUrl,
    rawContent: description,
  };
}

/**
 * Fetches and parses an RSS feed
 */
export async function parseFeed(
  feedUrl: string,
  options: FeedParseOptions = {},
): Promise<FeedParseResult> {
  const opts = {
    timeout: options.timeout ?? 30000,
    maxRetries: options.maxRetries ?? 3,
    userAgent:
      options.userAgent ??
      "Ethereum.Gazette Aggregator/1.0 (+https://ethereumgazette.com)",
    maxItems: options.maxItems ?? 50,
  };

  const startTime = Date.now();
  let feedXml: string;
  let feed: any;

  try {
    // Fetch the feed with retry logic
    const response = await retry(async () => {
      return await fetchWithTimeout(feedUrl, {
        timeout: opts.timeout,
        headers: {
          "User-Agent": opts.userAgent,
          Accept:
            "application/rss+xml, application/xml, text/xml, application/atom+xml",
          ...options.headers,
        },
      });
    }, opts.maxRetries);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    feedXml = await response.text();

    if (!feedXml || feedXml.trim().length === 0) {
      throw new Error("Empty feed response");
    }

    // Parse the XML
    feed = parseXML(feedXml);

    if (!feed || !feed.items || !Array.isArray(feed.items)) {
      throw new Error("Invalid feed structure: no items array");
    }

    const fetchTime = Date.now() - startTime;
    console.log(
      `✓ Fetched ${feedUrl} in ${fetchTime}ms - ${feed.items.length} items`,
    );

    return {
      success: true,
      feed: feed as RSSFeed,
      items: feed.items.slice(0, opts.maxItems),
      feedUrl,
      fetchedAt: new Date(),
      itemCount: feed.items.length,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`✗ Failed to fetch ${feedUrl}: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
      feedUrl,
      fetchedAt: new Date(),
      itemCount: 0,
    };
  }
}

/**
 * Parses a feed and normalizes items to our standard format
 */
export async function parseFeedToItems(
  feedUrl: string,
  feedSource: string,
  category: string = "all",
  options: FeedParseOptions = {},
): Promise<ParsedFeedItem[]> {
  const result = await parseFeed(feedUrl, options);

  if (!result.success || !result.items) {
    return [];
  }

  const normalizedItems: ParsedFeedItem[] = [];

  for (const item of result.items) {
    const normalized = normalizeItem(item, feedSource, category);
    if (normalized) {
      normalizedItems.push(normalized);
    }
  }

  // Apply keyword filter and log filtered items
  const filteredItems: ParsedFeedItem[] = [];
  const rejectedItems: Array<{ item: ParsedFeedItem; filterResult: any }> = [];
  const reviewItems: Array<{ item: ParsedFeedItem; filterResult: any }> = [];

  for (const item of normalizedItems) {
    const filterResult = keywordFilter.filter({
      title: item.title,
      snippet: item.snippet,
      url: item.url,
    });

    if (filterResult.decision === "approve") {
      filteredItems.push(item);
    } else if (filterResult.decision === "review") {
      // Log to review table and exclude from publication
      reviewItems.push({ item, filterResult });
    } else if (filterResult.decision === "reject") {
      // Log to rejected table
      rejectedItems.push({ item, filterResult });
    }
  }

  // Log filtered items asynchronously (don't block the feed parsing)
  if (rejectedItems.length > 0) {
    Promise.all(
      rejectedItems.map(({ item, filterResult }) =>
        logRejectedItem(
          {
            title: item.title,
            snippet: item.snippet,
            url: item.url,
            source: feedSource,
            category: category,
            original_pub_date: item.pubDate,
          },
          filterResult,
        ),
      ),
    ).catch((err) => console.error("Failed to log rejected items:", err));
  }

  if (reviewItems.length > 0) {
    Promise.all(
      reviewItems.map(({ item, filterResult }) =>
        logReviewItem(
          {
            title: item.title,
            snippet: item.snippet,
            url: item.url,
            source: feedSource,
            category: category,
            original_pub_date: item.pubDate,
          },
          filterResult,
        ),
      ),
    ).catch((err) => console.error("Failed to log review items:", err));
  }

  const filteredCount = rejectedItems.length + reviewItems.length;

  console.log(
    `✓ Normalized ${normalizedItems.length}/${result.items.length} items from ${feedSource}. Filtered: ${rejectedItems.length} rejected, ${reviewItems.length} for review.`,
  );

  return filteredItems;
}

/**
 * Parses multiple feeds in parallel
 */
export async function parseMultipleFeeds(
  feeds: Array<{ url: string; source: string; category: string }>,
  options: FeedParseOptions = {},
  concurrency: number = 5,
): Promise<ParsedFeedItem[]> {
  const allItems: ParsedFeedItem[] = [];

  // Process in batches to respect concurrency limit
  for (let i = 0; i < feeds.length; i += concurrency) {
    const batch = feeds.slice(i, i + concurrency);

    const batchResults = await Promise.all(
      batch.map(({ url, source, category }) =>
        parseFeedToItems(url, source, category, options),
      ),
    );

    batchResults.forEach((items) => allItems.push(...items));
  }

  return allItems;
}

/**
 * Test endpoint handler for Vercel
 */
export async function testParser(req: any, res: any) {
  const { url } = req.query;

  if (!url || typeof url !== "string") {
    return res.status(400).json({
      error: 'Missing or invalid "url" query parameter',
      example: "/api/rss/parser?url=https://blog.ethereum.org/feed/",
    });
  }

  try {
    const result = await parseFeed(url);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        feedUrl: url,
      });
    }

    // Sample first 3 items
    const sampleItems = result.items?.slice(0, 3).map((item: any) => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      author: extractAuthor(item),
      hasDescription: !!item.description,
      hasContent: !!(item["content:encoded"] || item.content),
    }));

    return res.status(200).json({
      success: true,
      feedUrl: url,
      feedTitle: result.feed?.title,
      itemCount: result.itemCount,
      sampleItems,
      fetchedAt: result.fetchedAt,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      feedUrl: url,
    });
  }
}
