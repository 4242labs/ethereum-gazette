// Automated feed aggregation cron job with Method 3 Source Tiering
// Fetches RSS feeds, applies tier-based filtering, normalizes content, categorizes, deduplicates, and stores in database

import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as fs from "fs";
import * as path from "path";
import { parseFeedToItems } from "../rss/parser";
import { categorizeContent } from "../rss/categorizer";
import { deduplicateAgainstDatabase } from "../rss/deduplicator";
import { bulkInsertPosts, getRecentPostsForDeduplication } from "../../lib/db";
import type { ParsedFeedItem } from "../rss/types";

// Cron job authentication
const CRON_SECRET = process.env.CRON_SECRET || "dev-secret";

// Feed source priorities
type Priority = "high" | "medium" | "low";

interface FeedSource {
  id: number;
  name: string;
  url: string;
  category?: string;
  priority: Priority;
  enabled: boolean;
  tier?: number;
  autoApprove?: boolean;
  description?: string;
  updateInterval?: number;
}

// Concurrency limits
const MAX_CONCURRENT_FETCHES = 5;
const RATE_LIMIT_DELAY_MS = 5000; // 5 seconds between requests to same domain

// Track last fetch time per domain to implement rate limiting
const domainLastFetch = new Map<string, number>();

/**
 * Extract domain from URL for rate limiting
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url;
  }
}

/**
 * Rate limit check - ensure minimum delay between requests to same domain
 */
async function rateLimitDelay(url: string): Promise<void> {
  const domain = extractDomain(url);
  const lastFetch = domainLastFetch.get(domain);

  if (lastFetch) {
    const timeSinceLastFetch = Date.now() - lastFetch;
    if (timeSinceLastFetch < RATE_LIMIT_DELAY_MS) {
      const delayNeeded = RATE_LIMIT_DELAY_MS - timeSinceLastFetch;
      await new Promise((resolve) => setTimeout(resolve, delayNeeded));
    }
  }

  domainLastFetch.set(domain, Date.now());
}

/**
 * Fetch and process a single feed
 */
async function processFeed(source: FeedSource): Promise<{
  source: string;
  success: boolean;
  itemsProcessed: number;
  itemsStored: number;
  itemsFetched: number;
  itemsNormalized: number;
  itemsFiltered: number;
  itemsApproved: number;
  itemsUnique: number;
  itemsDuplicate: number;
  tier: number;
  autoApproved: boolean;
  error?: string;
}> {
  try {
    // Rate limiting
    await rateLimitDelay(source.url);

    // Parse feed and normalize items in one step
    const normalizedItems = await parseFeedToItems(
      source.url,
      source.name,
      source.category || "all",
    );

    if (normalizedItems.length === 0) {
      return {
        source: source.name,
        success: false,
        itemsProcessed: 0,
        itemsStored: 0,
        itemsFetched: 0,
        itemsNormalized: 0,
        itemsFiltered: 0,
        itemsApproved: 0,
        itemsUnique: 0,
        itemsDuplicate: 0,
        tier: source.tier || 3,
        autoApproved: source.autoApprove || false,
        error: "No items found or failed to parse feed",
      };
    }

    const itemsFetched = normalizedItems.length;

    // Auto-categorize if no category assigned
    normalizedItems.forEach((item) => {
      if (!source.category) {
        const categorization = categorizeContent(
          item.title,
          item.snippet,
          item.url,
        );
        item.category = categorization.primaryCategory;
      } else {
        item.category = source.category;
      }
    });

    // Apply Method 3 Phase 1: Source Tiering
    const { approvedItems, filteredCount } = applySourceTiering(
      normalizedItems,
      source,
    );

    if (approvedItems.length === 0) {
      return {
        source: source.name,
        success: true,
        itemsProcessed: normalizedItems.length,
        itemsStored: 0,
        itemsFetched,
        itemsNormalized: normalizedItems.length,
        itemsFiltered: filteredCount,
        itemsApproved: 0,
        itemsUnique: 0,
        itemsDuplicate: 0,
        tier: source.tier || 3,
        autoApproved: source.autoApprove || false,
      };
    }

    // Get recent posts from database for deduplication (last 7 days)
    const recentPosts = await getRecentPostsForDeduplication(7);

    // Deduplicate against existing database content
    const dedupeResult = await deduplicateAgainstDatabase(
      approvedItems,
      recentPosts,
      {
        urlThreshold: 0.95,
        titleThreshold: 0.85,
        timeWindowHours: 168, // 7 days
      },
    );

    // Store unique items in database
    let itemsStored = 0;
    if (dedupeResult.unique.length > 0) {
      itemsStored = await bulkInsertPosts(dedupeResult.unique);
    }

    return {
      source: source.name,
      success: true,
      itemsProcessed: normalizedItems.length,
      itemsStored,
      itemsFetched,
      itemsNormalized: normalizedItems.length,
      itemsFiltered: filteredCount,
      itemsApproved: approvedItems.length,
      itemsUnique: dedupeResult.unique.length,
      itemsDuplicate: dedupeResult.duplicates.length,
      tier: source.tier || 3,
      autoApproved: source.autoApprove || false,
    };
  } catch (error) {
    console.error(`Error processing feed ${source.name}:`, error);
    return {
      source: source.name,
      success: false,
      itemsProcessed: 0,
      itemsStored: 0,
      itemsFetched: 0,
      itemsNormalized: 0,
      itemsFiltered: 0,
      itemsApproved: 0,
      itemsUnique: 0,
      itemsDuplicate: 0,
      tier: source.tier || 3,
      autoApproved: source.autoApprove || false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Apply Method 3 Phase 1: Source Tiering
 * Tier 1 sources get auto-approval, others await future filtering phases
 */
function applySourceTiering(
  items: ParsedFeedItem[],
  source: FeedSource,
): {
  approvedItems: ParsedFeedItem[];
  filteredCount: number;
} {
  // Phase 1: Source Tiering (Auto-approve Tier 1)
  if (source.tier === 1 && source.autoApprove) {
    console.log(
      `✅ Tier 1 auto-approval: ${source.name} - ${items.length} items approved`,
    );
    return {
      approvedItems: items,
      filteredCount: 0,
    };
  }

  // Phase 2: Tier 2 & 3 - For now, approve all (Phase 2 keyword filtering coming next)
  // TODO: Implement keyword heuristics for Tier 2
  // TODO: Implement LLM classification for Tier 3
  console.log(
    `⏳ Tier ${source.tier} filtering: ${source.name} - ${items.length} items (currently auto-approved, filtering coming in Phase 2)`,
  );

  return {
    approvedItems: items,
    filteredCount: 0,
  };
}

/**
 * Process feeds in batches with concurrency limit
 */
async function processFeedsInBatches(sources: FeedSource[]): Promise<
  Array<{
    source: string;
    success: boolean;
    itemsProcessed: number;
    itemsStored: number;
    itemsFetched: number;
    itemsNormalized: number;
    itemsFiltered: number;
    itemsApproved: number;
    itemsUnique: number;
    itemsDuplicate: number;
    tier: number;
    autoApproved: boolean;
    error?: string;
  }>
> {
  const results: Array<{
    source: string;
    success: boolean;
    itemsProcessed: number;
    itemsStored: number;
    itemsFetched: number;
    itemsNormalized: number;
    itemsFiltered: number;
    itemsApproved: number;
    itemsUnique: number;
    itemsDuplicate: number;
    tier: number;
    autoApproved: boolean;
    error?: string;
  }> = [];

  // Process in batches of MAX_CONCURRENT_FETCHES
  for (let i = 0; i < sources.length; i += MAX_CONCURRENT_FETCHES) {
    const batch = sources.slice(i, i + MAX_CONCURRENT_FETCHES);
    const batchResults = await Promise.all(batch.map(processFeed));
    results.push(...batchResults);
  }

  return results;
}

/**
 * Load feed sources from JSON file with tier metadata
 * Supports Method 3 Phase 1 source tiering
 */
async function loadFeedSources(): Promise<FeedSource[]> {
  try {
    // Load from feed-sources.json file
    const filePath = path.join(process.cwd(), "data", "feed-sources.json");
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(fileContent);

    if (!data.sources || !Array.isArray(data.sources)) {
      throw new Error("Invalid feed sources data structure");
    }

    const sources = data.sources
      .filter((source: any) => source.enabled)
      .map((source: any) => ({
        id: source.id,
        name: source.name,
        url: source.url,
        category: source.category,
        priority: mapPriorityNumber(source.priority),
        enabled: source.enabled,
        tier: source.tier || 3, // Default to Tier 3 if not specified
        autoApprove: source.autoApprove || false,
        description: source.description,
        updateInterval: source.updateInterval,
      }));

    console.log(
      `📊 Loaded ${sources.length} enabled sources with tier distribution:`,
    );
    const tierCounts = sources.reduce((acc: any, s: FeedSource) => {
      acc[`tier${s.tier}`] = (acc[`tier${s.tier}`] || 0) + 1;
      return acc;
    }, {});
    console.log(`   Tier 1 (auto-approve): ${tierCounts.tier1 || 0} sources`);
    console.log(`   Tier 2 (keyword filter): ${tierCounts.tier2 || 0} sources`);
    console.log(`   Tier 3 (LLM filter): ${tierCounts.tier3 || 0} sources`);

    return sources;
  } catch (error) {
    console.error("Failed to load feed sources from JSON:", error);
    // Fallback to single Tier 1 source for testing
    return [
      {
        id: 1,
        name: "Ethereum Foundation Blog",
        url: "https://blog.ethereum.org/feed/",
        category: "news",
        priority: "high",
        enabled: true,
        tier: 1,
        autoApprove: true,
      },
    ];
  }
}

/**
 * Map numeric priority to string priority
 */
function mapPriorityNumber(priority: number): Priority {
  if (priority === 1) return "high";
  if (priority === 2) return "medium";
  return "low";
}

/**
 * Main cron handler
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify cron authentication
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
    });
  }

  const startTime = Date.now();

  try {
    console.log("Starting feed aggregation job...");

    // Load feed sources
    let sources: FeedSource[];
    try {
      sources = await loadFeedSources();
      console.log(`Loaded ${sources.length} feed sources`);
    } catch (error) {
      console.error("Error loading feed sources:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to load feed sources",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }

    // Filter sources based on priority and schedule
    // This cron runs every 15 minutes, so we'll process all sources
    const sourcesToProcess = sources.filter((s) => s.enabled);

    if (sourcesToProcess.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No sources to process",
        timestamp: new Date().toISOString(),
      });
    }

    // Process feeds
    console.log(`Processing ${sourcesToProcess.length} feeds...`);
    let results;
    try {
      results = await processFeedsInBatches(sourcesToProcess);
    } catch (error) {
      console.error("Error processing feeds:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to process feeds",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      });
    }

    // Calculate statistics with tier breakdown
    const stats = {
      totalSources: sourcesToProcess.length,
      successfulSources: results.filter((r) => r.success).length,
      failedSources: results.filter((r) => !r.success).length,
      totalItemsProcessed: results.reduce(
        (sum, r) => sum + r.itemsProcessed,
        0,
      ),
      totalItemsStored: results.reduce((sum, r) => sum + r.itemsStored, 0),
      totalItemsFiltered: results.reduce(
        (sum, r) => sum + (r.itemsFiltered || 0),
        0,
      ),
      totalItemsApproved: results.reduce(
        (sum, r) => sum + (r.itemsApproved || 0),
        0,
      ),
      tierBreakdown: {
        tier1AutoApproved: results.filter((r) => r.tier === 1 && r.autoApproved)
          .length,
        tier2Sources: results.filter((r) => r.tier === 2).length,
        tier3Sources: results.filter((r) => r.tier === 3).length,
      },
      executionTimeMs: Date.now() - startTime,
    };

    // Log failures
    const failures = results.filter((r) => !r.success);
    if (failures.length > 0) {
      console.error("Failed sources:", failures);
    }

    // Store fetch history in database
    try {
      const { query } = await import("../../lib/db");
      await query(
        `INSERT INTO fetch_history
         (sources_processed, items_fetched, items_stored, execution_time_ms, errors)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          stats.totalSources,
          stats.totalItemsProcessed,
          stats.totalItemsStored,
          stats.executionTimeMs,
          failures.length > 0 ? JSON.stringify(failures) : null,
        ],
      );
    } catch (error) {
      console.error("Failed to store fetch history:", error);
    }

    console.log("Feed aggregation completed:", stats);

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      phase: "Method 3 Phase 1 - Source Tiering Active",
      stats,
      results: results
        .filter((r) => r.success)
        .map((r) => ({
          source: r.source,
          tier: r.tier,
          autoApproved: r.autoApproved,
          itemsFetched: r.itemsFetched,
          itemsNormalized: r.itemsNormalized,
          itemsFiltered: r.itemsFiltered,
          itemsApproved: r.itemsApproved,
          itemsUnique: r.itemsUnique,
          itemsDuplicate: r.itemsDuplicate,
          itemsStored: r.itemsStored,
        })),
      failures: failures.length > 0 ? failures : undefined,
    });
  } catch (error) {
    console.error("Feed aggregation error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      executionTimeMs: Date.now() - startTime,
    });
  }
}
