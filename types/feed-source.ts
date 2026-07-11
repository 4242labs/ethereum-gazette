// TypeScript interfaces for feed source management

export type FeedCategory =
  | "all"
  | "news"
  | "people"
  | "projects"
  | "education"
  | "events"
  | "orgs"
  | "jobs";

export type FeedPriority = 1 | 2 | 3;

export interface FeedSource {
  id: number;
  name: string;
  url: string;
  category: FeedCategory;
  enabled: boolean;
  priority: FeedPriority;
  updateInterval: number; // in minutes
  description?: string;
  lastFetched?: string;
  lastSuccess?: string;
  lastError?: string;
  errorCount?: number;
}

export interface FeedSourceConfig {
  version: string;
  lastUpdated: string;
  sources: FeedSource[];
  categoryStats: Record<string, number>;
  updateIntervals: {
    high: number;
    medium: number;
    low: number;
  };
  notes?: Record<string, string>;
}

export interface FeedSourceFilter {
  category?: FeedCategory;
  enabled?: boolean;
  priority?: FeedPriority;
  minUpdateInterval?: number;
  maxUpdateInterval?: number;
}

export interface FeedSourceUpdate {
  enabled?: boolean;
  priority?: FeedPriority;
  updateInterval?: number;
  description?: string;
  lastFetched?: string;
  lastSuccess?: string;
  lastError?: string;
  errorCount?: number;
}

export interface FeedSourceHealth {
  id: number;
  name: string;
  url: string;
  isHealthy: boolean;
  lastFetched?: string;
  lastSuccess?: string;
  lastError?: string;
  errorCount: number;
  uptime?: number; // percentage
}

export interface FeedSourceStats {
  totalSources: number;
  enabledSources: number;
  disabledSources: number;
  sourcesByCategory: Record<FeedCategory, number>;
  sourcesByPriority: Record<FeedPriority, number>;
  healthySources: number;
  unhealthySources: number;
}
