import type { FilterResult } from "./keyword-filter";
import { query } from "../../lib/db";

interface FilterLogEntry {
  title: string;
  snippet?: string;
  url: string;
  source?: string;
  category?: string;
  original_pub_date?: Date;
  filter_score: number;
  filter_reasoning: string;
}

/**
 * Log a rejected item to the filter_rejected table
 */
export async function logRejectedItem(
  item: Omit<FilterLogEntry, "filter_score" | "filter_reasoning">,
  filterResult: FilterResult,
): Promise<void> {
  try {
    await query(
      `INSERT INTO filter_rejected
       (title, snippet, url, source, category, original_pub_date, filter_score, filter_reasoning, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        item.title,
        item.snippet,
        item.url,
        item.source,
        item.category,
        item.original_pub_date,
        filterResult.score,
        JSON.stringify(filterResult.reasoning),
      ],
    );
  } catch (err) {
    console.error("Error logging rejected item:", err);
  }
}

/**
 * Log a review item to the filter_review table
 */
export async function logReviewItem(
  item: Omit<FilterLogEntry, "filter_score" | "filter_reasoning">,
  filterResult: FilterResult,
): Promise<void> {
  try {
    await query(
      `INSERT INTO filter_review
       (title, snippet, url, source, category, original_pub_date, filter_score, filter_reasoning, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        item.title,
        item.snippet,
        item.url,
        item.source,
        item.category,
        item.original_pub_date,
        filterResult.score,
        JSON.stringify(filterResult.reasoning),
      ],
    );
  } catch (err) {
    console.error("Error logging review item:", err);
  }
}

/**
 * Batch log multiple rejected items
 */
export async function batchLogRejectedItems(
  items: Array<{
    item: Omit<FilterLogEntry, "filter_score" | "filter_reasoning">;
    filterResult: FilterResult;
  }>,
): Promise<void> {
  if (items.length === 0) return;

  try {
    const values = items
      .map((_, index) => {
        const offset = index * 8;
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, NOW())`;
      })
      .join(", ");

    const params = items.flatMap(({ item, filterResult }) => [
      item.title,
      item.snippet,
      item.url,
      item.source,
      item.category,
      item.original_pub_date,
      filterResult.score,
      JSON.stringify(filterResult.reasoning),
    ]);

    await query(
      `INSERT INTO filter_rejected
       (title, snippet, url, source, category, original_pub_date, filter_score, filter_reasoning, created_at)
       VALUES ${values}`,
      params,
    );
  } catch (err) {
    console.error("Error batch logging rejected items:", err);
  }
}

/**
 * Batch log multiple review items
 */
export async function batchLogReviewItems(
  items: Array<{
    item: Omit<FilterLogEntry, "filter_score" | "filter_reasoning">;
    filterResult: FilterResult;
  }>,
): Promise<void> {
  if (items.length === 0) return;

  try {
    const values = items
      .map((_, index) => {
        const offset = index * 8;
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, NOW())`;
      })
      .join(", ");

    const params = items.flatMap(({ item, filterResult }) => [
      item.title,
      item.snippet,
      item.url,
      item.source,
      item.category,
      item.original_pub_date,
      filterResult.score,
      JSON.stringify(filterResult.reasoning),
    ]);

    await query(
      `INSERT INTO filter_review
       (title, snippet, url, source, category, original_pub_date, filter_score, filter_reasoning, created_at)
       VALUES ${values}`,
      params,
    );
  } catch (err) {
    console.error("Error batch logging review items:", err);
  }
}

/**
 * Check if a URL has already been processed (exists in either table)
 */
export async function isUrlProcessed(url: string): Promise<boolean> {
  try {
    const rejectedResult = await query(
      "SELECT 1 FROM filter_rejected WHERE url = $1 LIMIT 1",
      [url],
    );

    if (rejectedResult.rows.length > 0) {
      return true;
    }

    const reviewResult = await query(
      "SELECT 1 FROM filter_review WHERE url = $1 LIMIT 1",
      [url],
    );

    return reviewResult.rows.length > 0;
  } catch (error) {
    console.error("Error checking if URL is processed:", error);
    return false;
  }
}
