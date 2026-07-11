import type { VercelRequest, VercelResponse } from "@vercel/node";
import type {
  FeedSource,
  FeedSourceConfig,
  FeedSourceFilter,
  FeedSourceStats,
  FeedSourceHealth,
  FeedCategory,
} from "../../types/feed-source";
import feedSourcesData from "../../data/feed-sources.json";

/**
 * Get all feed sources with optional filtering
 */
function getFeedSources(filter?: FeedSourceFilter): FeedSource[] {
  const config = feedSourcesData as FeedSourceConfig;
  let sources = config.sources;

  if (filter) {
    if (filter.category && filter.category !== "all") {
      sources = sources.filter((s) => s.category === filter.category);
    }
    if (filter.enabled !== undefined) {
      sources = sources.filter((s) => s.enabled === filter.enabled);
    }
    if (filter.priority !== undefined) {
      sources = sources.filter((s) => s.priority === filter.priority);
    }
    if (filter.minUpdateInterval !== undefined) {
      sources = sources.filter(
        (s) => s.updateInterval >= filter.minUpdateInterval!,
      );
    }
    if (filter.maxUpdateInterval !== undefined) {
      sources = sources.filter(
        (s) => s.updateInterval <= filter.maxUpdateInterval!,
      );
    }
  }

  return sources;
}

/**
 * Get a single feed source by ID
 */
function getFeedSourceById(id: number): FeedSource | undefined {
  const config = feedSourcesData as FeedSourceConfig;
  return config.sources.find((s) => s.id === id);
}

/**
 * Get feed sources by category
 */
function getFeedSourcesByCategory(category: FeedCategory): FeedSource[] {
  const config = feedSourcesData as FeedSourceConfig;
  if (category === "all") {
    return config.sources.filter((s) => s.enabled);
  }
  return config.sources.filter(
    (s) => s.category === category && s.enabled,
  );
}

/**
 * Calculate feed source statistics
 */
function getFeedSourceStats(): FeedSourceStats {
  const config = feedSourcesData as FeedSourceConfig;
  const sources = config.sources;

  const stats: FeedSourceStats = {
    totalSources: sources.length,
    enabledSources: sources.filter((s) => s.enabled).length,
    disabledSources: sources.filter((s) => !s.enabled).length,
    sourcesByCategory: {} as Record<FeedCategory, number>,
    sourcesByPriority: {
      1: sources.filter((s) => s.priority === 1).length,
      2: sources.filter((s) => s.priority === 2).length,
      3: sources.filter((s) => s.priority === 3).length,
    },
    healthySources: sources.filter((s) => s.enabled && !s.lastError).length,
    unhealthySources: sources.filter((s) => s.lastError).length,
  };

  // Count by category
  const categories: FeedCategory[] = [
    "all",
    "news",
    "people",
    "projects",
    "education",
    "events",
    "orgs",
    "jobs",
  ];

  categories.forEach((cat) => {
    if (cat === "all") {
      stats.sourcesByCategory[cat] = sources.length;
    } else {
      stats.sourcesByCategory[cat] = sources.filter(
        (s) => s.category === cat,
      ).length;
    }
  });

  return stats;
}

/**
 * Get health status of feed sources
 */
function getFeedSourcesHealth(): FeedSourceHealth[] {
  const config = feedSourcesData as FeedSourceConfig;
  return config.sources.map((source) => {
    const errorCount = source.errorCount || 0;
    const isHealthy = source.enabled && errorCount < 3;

    return {
      id: source.id,
      name: source.name,
      url: source.url,
      isHealthy,
      lastFetched: source.lastFetched,
      lastSuccess: source.lastSuccess,
      lastError: source.lastError,
      errorCount,
      uptime: errorCount === 0 ? 100 : errorCount < 3 ? 90 : 50,
    };
  });
}

/**
 * Get sources that need updating based on their update interval
 */
function getSourcesDueForUpdate(): FeedSource[] {
  const config = feedSourcesData as FeedSourceConfig;
  const now = new Date();

  return config.sources.filter((source) => {
    if (!source.enabled) return false;

    if (!source.lastFetched) return true; // Never fetched

    const lastFetched = new Date(source.lastFetched);
    const minutesSinceLastFetch =
      (now.getTime() - lastFetched.getTime()) / 1000 / 60;

    return minutesSinceLastFetch >= source.updateInterval;
  });
}

/**
 * Main API handler
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    action,
    id,
    category,
    enabled,
    priority,
    stats,
    health,
    due,
  } = req.query;

  try {
    // Get statistics
    if (stats === "true") {
      const statistics = getFeedSourceStats();
      return res.status(200).json({
        success: true,
        stats: statistics,
      });
    }

    // Get health status
    if (health === "true") {
      const healthStatus = getFeedSourcesHealth();
      return res.status(200).json({
        success: true,
        health: healthStatus,
      });
    }

    // Get sources due for update
    if (due === "true") {
      const dueForUpdate = getSourcesDueForUpdate();
      return res.status(200).json({
        success: true,
        count: dueForUpdate.length,
        sources: dueForUpdate,
      });
    }

    // Get single source by ID
    if (id) {
      const sourceId = parseInt(id as string);
      const source = getFeedSourceById(sourceId);

      if (!source) {
        return res.status(404).json({
          success: false,
          error: `Feed source with ID ${sourceId} not found`,
        });
      }

      return res.status(200).json({
        success: true,
        source,
      });
    }

    // Get sources by category
    if (category && typeof category === "string") {
      const sources = getFeedSourcesByCategory(category as FeedCategory);
      return res.status(200).json({
        success: true,
        category,
        count: sources.length,
        sources,
      });
    }

    // Get all sources with optional filters
    const filter: FeedSourceFilter = {};

    if (enabled !== undefined) {
      filter.enabled = enabled === "true";
    }
    if (priority !== undefined) {
      filter.priority = parseInt(priority as string) as 1 | 2 | 3;
    }

    const sources = getFeedSources(filter);
    const config = feedSourcesData as FeedSourceConfig;

    return res.status(200).json({
      success: true,
      version: config.version,
      lastUpdated: config.lastUpdated,
      count: sources.length,
      sources,
      categoryStats: config.categoryStats,
    });
  } catch (error) {
    console.error("Feed sources API error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
