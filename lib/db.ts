// Database connection and query utilities for PostgreSQL
// Uses pg (node-postgres) for broad compatibility with Supabase and Vercel

import { Pool } from "pg";
import type { ParsedFeedItem } from "../api/rss/types";

// Create connection pool
// Note: connectionString comes from POSTGRES_URL environment variable
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : undefined,
});

// Export pool for direct access
export { pool };

// Export query function for direct database queries
export async function query(text: string, params?: any[]): Promise<any> {
  return pool.query(text, params);
}

export interface FeedSource {
  id: number;
  name: string;
  url: string;
  category: string;
  description?: string;
  enabled: boolean;
  priority: number;
  updateInterval: number;
  lastFetched?: Date;
  lastSuccess?: Date;
  lastError?: string;
  errorCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Post {
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
  createdAt: Date;
  updatedAt: Date;
}

export interface FetchHistory {
  id: number;
  sourceId: number;
  fetchTime: Date;
  success: boolean;
  itemsCount: number;
  errorMessage?: string;
  durationMs?: number;
}

// ============================================================================
// FEED SOURCES QUERIES
// ============================================================================

/**
 * Get all feed sources
 */
export async function getAllSources(
  includeDisabled = false,
): Promise<FeedSource[]> {
  const query = includeDisabled
    ? "SELECT * FROM feed_sources ORDER BY category, name"
    : "SELECT * FROM feed_sources WHERE enabled = true ORDER BY category, name";

  const { rows } = await pool.query(query);
  return rows.map(mapRowToSource);
}

/**
 * Get feed sources by category
 */
export async function getSourcesByCategory(
  category: string,
): Promise<FeedSource[]> {
  const { rows } = await pool.query(
    "SELECT * FROM feed_sources WHERE category = $1 AND enabled = true ORDER BY priority, name",
    [category],
  );
  return rows.map(mapRowToSource);
}

/**
 * Get feed source by ID
 */
export async function getSourceById(id: number): Promise<FeedSource | null> {
  const { rows } = await pool.query(
    "SELECT * FROM feed_sources WHERE id = $1",
    [id],
  );
  return rows.length > 0 ? mapRowToSource(rows[0]) : null;
}

/**
 * Get sources due for update
 */
export async function getSourcesDueForUpdate(): Promise<FeedSource[]> {
  const { rows } = await pool.query(`
    SELECT * FROM feed_sources
    WHERE enabled = true
    AND (
      last_fetched IS NULL
      OR last_fetched < NOW() - (update_interval || ' minutes')::INTERVAL
    )
    ORDER BY priority, last_fetched ASC NULLS FIRST
  `);
  return rows.map(mapRowToSource);
}

/**
 * Update source fetch status
 */
export async function updateSourceFetchStatus(
  sourceId: number,
  success: boolean,
  error?: string,
): Promise<void> {
  if (success) {
    await pool.query(
      `
      UPDATE feed_sources
      SET
        last_fetched = NOW(),
        last_success = NOW(),
        last_error = NULL,
        error_count = 0
      WHERE id = $1
    `,
      [sourceId],
    );
  } else {
    await pool.query(
      `
      UPDATE feed_sources
      SET
        last_fetched = NOW(),
        last_error = $1,
        error_count = error_count + 1
      WHERE id = $2
    `,
      [error || "Unknown error", sourceId],
    );
  }
}

/**
 * Insert or update feed source
 */
export async function upsertSource(
  source: Omit<FeedSource, "id" | "createdAt" | "updatedAt">,
): Promise<number> {
  const { rows } = await pool.query(
    `
    INSERT INTO feed_sources (
      name, url, category, description, enabled, priority, update_interval
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7
    )
    ON CONFLICT (url) DO UPDATE SET
      name = EXCLUDED.name,
      category = EXCLUDED.category,
      description = EXCLUDED.description,
      enabled = EXCLUDED.enabled,
      priority = EXCLUDED.priority,
      update_interval = EXCLUDED.update_interval,
      updated_at = NOW()
    RETURNING id
  `,
    [
      source.name,
      source.url,
      source.category,
      source.description || null,
      source.enabled,
      source.priority,
      source.updateInterval,
    ],
  );
  return rows[0].id;
}

// ============================================================================
// POSTS QUERIES
// ============================================================================

/**
 * Get posts with pagination
 */
export async function getPosts(
  category?: string,
  limit = 50,
  offset = 0,
): Promise<Post[]> {
  let queryText = "SELECT * FROM posts";
  const queryParams: any[] = [];

  if (category && category !== "all") {
    queryText += " WHERE category = $1";
    queryParams.push(category);
  }

  queryText +=
    " ORDER BY pub_date DESC LIMIT $" +
    (queryParams.length + 1) +
    " OFFSET $" +
    (queryParams.length + 2);
  queryParams.push(limit, offset);

  const { rows } = await pool.query(queryText, queryParams);
  return rows.map(mapRowToPost);
}

/**
 * Get post by ID
 */
export async function getPostById(id: string): Promise<Post | null> {
  const { rows } = await pool.query("SELECT * FROM posts WHERE id = $1", [id]);
  return rows.length > 0 ? mapRowToPost(rows[0]) : null;
}

/**
 * Get post by URL
 */
export async function getPostByUrl(url: string): Promise<Post | null> {
  const { rows } = await pool.query("SELECT * FROM posts WHERE url = $1", [
    url,
  ]);
  return rows.length > 0 ? mapRowToPost(rows[0]) : null;
}

/**
 * Get recent posts (last 7 days)
 */
export async function getRecentPosts(category?: string): Promise<Post[]> {
  let queryText =
    "SELECT * FROM posts WHERE pub_date > NOW() - INTERVAL '7 days'";
  const queryParams: any[] = [];

  if (category && category !== "all") {
    queryText += " AND category = $1";
    queryParams.push(category);
  }

  queryText += " ORDER BY pub_date DESC";

  const { rows } = await pool.query(queryText, queryParams);
  return rows.map(mapRowToPost);
}

/**
 * Get recent posts for deduplication (returns ParsedFeedItem format)
 */
export async function getRecentPostsForDeduplication(
  days: number = 7,
): Promise<ParsedFeedItem[]> {
  const { rows } = await pool.query(
    "SELECT * FROM posts WHERE pub_date > NOW() - INTERVAL '1 day' * $1 ORDER BY pub_date DESC",
    [days],
  );

  return rows.map(
    (row): ParsedFeedItem => ({
      id: row.id,
      title: row.title,
      snippet: row.snippet,
      url: row.url,
      author: row.author || "",
      source: row.source,
      category: row.category,
      pubDate: new Date(row.pub_date),
      imageUrl: row.image_url || undefined,
    }),
  );
}

/**
 * Insert single post
 * Returns true if inserted, false if it was a duplicate
 */
export async function insertPost(post: ParsedFeedItem): Promise<boolean> {
  const result = await pool.query(
    `
    INSERT INTO posts (
      id, title, snippet, url, author, source, category, pub_date, image_url, source_id
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
    )
    ON CONFLICT (id) DO NOTHING
    RETURNING id
  `,
    [
      post.id,
      post.title,
      post.snippet,
      post.url,
      post.author || null,
      post.source,
      post.category,
      post.pubDate,
      post.imageUrl || null,
      post.sourceId || null,
    ],
  );

  return result.rowCount !== null && result.rowCount > 0;
}

/**
 * Bulk insert posts (more efficient for multiple posts)
 */
export async function bulkInsertPosts(
  posts: ParsedFeedItem[],
): Promise<number> {
  console.log(`bulkInsertPosts called with ${posts.length} posts`);
  if (posts.length === 0) return 0;

  let insertedCount = 0;

  for (const post of posts) {
    const wasInserted = await insertPost(post);
    if (wasInserted) {
      insertedCount++;
    }
  }

  console.log(
    `bulkInsertPosts completed: ${insertedCount}/${posts.length} inserted`,
  );
  return insertedCount;
}

/**
 * Delete old posts (older than specified days)
 */
export async function deleteOldPosts(daysOld = 90): Promise<number> {
  const { rowCount } = await pool.query(
    "DELETE FROM posts WHERE pub_date < NOW() - ($1 || ' days')::INTERVAL",
    [daysOld],
  );
  return rowCount || 0;
}

/**
 * Get post count by category
 */
export async function getPostCountByCategory(): Promise<
  Record<string, number>
> {
  const { rows } = await pool.query(`
    SELECT category, COUNT(*) as count
    FROM posts
    GROUP BY category
  `);

  const counts: Record<string, number> = {};
  rows.forEach((row) => {
    counts[row.category] = parseInt(row.count, 10);
  });

  return counts;
}

// ============================================================================
// FETCH HISTORY QUERIES
// ============================================================================

/**
 * Record fetch attempt
 */
export async function recordFetchHistory(
  sourceId: number,
  success: boolean,
  itemsCount: number,
  errorMessage?: string,
  durationMs?: number,
): Promise<void> {
  await pool.query(
    `
    INSERT INTO fetch_history (
      source_id, success, items_count, error_message, duration_ms
    ) VALUES (
      $1, $2, $3, $4, $5
    )
  `,
    [sourceId, success, itemsCount, errorMessage || null, durationMs || null],
  );
}

/**
 * Get fetch history for a source
 */
export async function getFetchHistory(
  sourceId: number,
  limit = 50,
): Promise<FetchHistory[]> {
  const { rows } = await pool.query(
    `
    SELECT * FROM fetch_history
    WHERE source_id = $1
    ORDER BY fetch_time DESC
    LIMIT $2
  `,
    [sourceId, limit],
  );
  return rows.map(mapRowToFetchHistory);
}

/**
 * Get recent fetch statistics
 */
export async function getFetchStats(hours = 24): Promise<{
  totalFetches: number;
  successfulFetches: number;
  failedFetches: number;
  totalItems: number;
  averageDuration: number;
}> {
  const { rows } = await pool.query(
    `
    SELECT
      COUNT(*) as total_fetches,
      SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_fetches,
      SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) as failed_fetches,
      SUM(items_count) as total_items,
      AVG(duration_ms) as avg_duration
    FROM fetch_history
    WHERE fetch_time > NOW() - ($1 || ' hours')::INTERVAL
  `,
    [hours],
  );

  const row = rows[0];
  return {
    totalFetches: parseInt(row.total_fetches || "0", 10),
    successfulFetches: parseInt(row.successful_fetches || "0", 10),
    failedFetches: parseInt(row.failed_fetches || "0", 10),
    totalItems: parseInt(row.total_items || "0", 10),
    averageDuration: parseFloat(row.avg_duration || "0") || 0,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mapRowToSource(row: any): FeedSource {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    category: row.category,
    description: row.description,
    enabled: row.enabled,
    priority: row.priority,
    updateInterval: row.update_interval,
    lastFetched: row.last_fetched ? new Date(row.last_fetched) : undefined,
    lastSuccess: row.last_success ? new Date(row.last_success) : undefined,
    lastError: row.last_error,
    errorCount: row.error_count,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapRowToPost(row: any): Post {
  return {
    id: row.id,
    title: row.title,
    snippet: row.snippet,
    url: row.url,
    author: row.author,
    source: row.source,
    category: row.category,
    pubDate: new Date(row.pub_date),
    imageUrl: row.image_url,
    sourceId: row.source_id,
    rawContent: row.raw_content,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapRowToFetchHistory(row: any): FetchHistory {
  return {
    id: row.id,
    sourceId: row.source_id,
    fetchTime: new Date(row.fetch_time),
    success: row.success,
    itemsCount: row.items_count,
    errorMessage: row.error_message,
    durationMs: row.duration_ms,
  };
}

// ============================================================================
// DATABASE INITIALIZATION
// ============================================================================

/**
 * Initialize database tables (run migrations)
 */
export async function initializeDatabase(): Promise<void> {
  // This would typically run the migrations from db/migrations/
  // For now, we assume the schema is already set up
  console.log("Database initialization should be done manually via migrations");
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}
