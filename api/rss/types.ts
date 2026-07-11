// TypeScript interfaces for RSS/Atom feed parsing

export interface RSSFeedItem {
  title: string;
  link: string;
  description?: string;
  content?: string;
  pubDate?: string;
  author?: string;
  creator?: string;
  categories?: string[];
  guid?: string;
  enclosure?: {
    url: string;
    type: string;
    length?: number;
  };
  'content:encoded'?: string;
  'dc:creator'?: string;
  'media:thumbnail'?: {
    url: string;
  };
  'media:content'?: {
    url: string;
    type?: string;
    medium?: string;
  };
}

export interface RSSFeed {
  title: string;
  description?: string;
  link: string;
  language?: string;
  lastBuildDate?: string;
  items: RSSFeedItem[];
}

export interface ParsedFeedItem {
  id: string;
  title: string;
  snippet: string;
  url: string;
  author?: string;
  source: string;
  category: string;
  pubDate: Date;
  imageUrl?: string;
  sourceId?: number;
  rawContent?: string;
}

export interface FeedParseResult {
  success: boolean;
  feed?: RSSFeed;
  items?: ParsedFeedItem[];
  error?: string;
  feedUrl: string;
  fetchedAt: Date;
  itemCount: number;
}

export interface FeedParseOptions {
  timeout?: number;
  maxRetries?: number;
  userAgent?: string;
  headers?: Record<string, string>;
  maxItems?: number;
}

export interface FeedSource {
  id: number;
  name: string;
  url: string;
  category: string;
  enabled: boolean;
  lastFetched?: Date;
  priority: number;
  updateInterval?: number; // in minutes
}

export interface FeedFetchError {
  feedUrl: string;
  error: string;
  timestamp: Date;
  statusCode?: number;
  retryCount: number;
}

export const DEFAULT_PARSE_OPTIONS: FeedParseOptions = {
  timeout: 30000, // 30 seconds
  maxRetries: 3,
  userAgent: 'Ethereum.Gazette Aggregator/1.0 (+https://ethereumgazette.com)',
  maxItems: 50,
};
