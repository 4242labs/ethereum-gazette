// Manual feed fetch and store endpoint
// Simplified approach that works around import issues
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { query } from "../../lib/db";

const ADMIN_KEY = process.env.ADMIN_KEY || "dev-admin";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Simple authentication
  const adminKey = req.query.key || req.headers["x-admin-key"];
  if (adminKey !== ADMIN_KEY) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized - Admin key required",
    });
  }

  const startTime = Date.now();

  try {
    // Test feeds to fetch
    const feedUrls = [
      "https://blog.ethereum.org/feed.xml",
      "https://weekinethereumnews.com/feed/",
      "https://vitalik.eth.limo/feed.xml",
    ];

    // Test database connection and table
    try {
      const tableCheck = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = 'posts'
        );
      `);

      const tableExists = tableCheck.rows[0].exists;

      if (!tableExists) {
        return res.status(500).json({
          success: false,
          error: "Posts table does not exist in database",
          timestamp: new Date().toISOString(),
        });
      }

      // Count existing posts
      const countResult = await query("SELECT COUNT(*) FROM posts");
      console.log("Existing posts in database:", countResult.rows[0].count);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "Database connection failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }

    const results = [];
    let totalStored = 0;

    for (const feedUrl of feedUrls) {
      try {
        // Fetch feed
        const response = await fetch(feedUrl, {
          headers: {
            "User-Agent": "Ethereum.World Aggregator/1.0",
          },
        });

        if (!response.ok) {
          results.push({
            feed: feedUrl,
            status: "failed",
            error: `HTTP ${response.status}`,
          });
          continue;
        }

        const xmlText = await response.text();

        // Parse XML manually (simple regex-based parsing)
        const items = parseSimpleRSS(xmlText);

        // Store items
        let stored = 0;
        let skipped = 0;
        for (const item of items) {
          try {
            // Generate ID
            const id = generateId(item.url);

            // Insert into database
            const result = await query(
              `INSERT INTO posts (
                id, title, snippet, url, author, source, category, pub_date
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
              ON CONFLICT (id) DO UPDATE SET id = EXCLUDED.id
              RETURNING id`,
              [
                id,
                item.title.substring(0, 110),
                item.snippet.substring(0, 270),
                item.url,
                item.author || "",
                item.source,
                item.category || "news",
                item.pubDate,
              ],
            );

            if (result.rowCount && result.rowCount > 0) {
              stored++;
            } else {
              skipped++;
            }
          } catch (error) {
            console.error("Error storing item:", error, "Title:", item.title);
            skipped++;
          }
        }

        results.push({
          feed: feedUrl,
          status: "success",
          itemsFetched: items.length,
          itemsStored: stored,
          itemsSkipped: skipped,
        });

        totalStored += stored;
      } catch (error) {
        results.push({
          feed: feedUrl,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      executionTimeMs: Date.now() - startTime,
      totalItemsStored: totalStored,
      results,
    });
  } catch (error) {
    console.error("Fetch and store error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
      executionTimeMs: Date.now() - startTime,
    });
  }
}

/**
 * Simple RSS/Atom parser using regex
 */
function parseSimpleRSS(xmlText: string): Array<{
  title: string;
  snippet: string;
  url: string;
  author?: string;
  source: string;
  category?: string;
  pubDate: Date;
}> {
  const items: Array<any> = [];

  // Detect feed type
  const isAtom =
    xmlText.includes("<feed") &&
    xmlText.includes('xmlns="http://www.w3.org/2005/Atom"');
  const feedTitle =
    extractTag(xmlText, isAtom ? "title" : "channel title") || "Unknown";

  // Extract items
  const itemRegex = isAtom
    ? /<entry>([\s\S]*?)<\/entry>/g
    : /<item>([\s\S]*?)<\/item>/g;

  let match;
  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemXml = match[1];

    const title = cleanText(extractTag(itemXml, "title") || "Untitled");

    let snippet = "";
    const description = extractTag(itemXml, "description");
    const content = extractTag(itemXml, isAtom ? "content" : "content:encoded");
    const summary = extractTag(itemXml, "summary");

    snippet = content || description || summary || "";
    snippet = cleanText(snippet);

    const link = isAtom
      ? extractAtomLink(itemXml)
      : extractTag(itemXml, "link") || "";

    if (!link) continue;

    const pubDateStr =
      extractTag(itemXml, isAtom ? "updated" : "pubDate") ||
      extractTag(itemXml, "published") ||
      new Date().toISOString();

    let pubDate: Date;
    try {
      pubDate = new Date(pubDateStr);
      if (isNaN(pubDate.getTime())) {
        pubDate = new Date();
      }
    } catch {
      pubDate = new Date();
    }

    const author =
      extractTag(itemXml, "author name") ||
      extractTag(itemXml, "dc:creator") ||
      extractTag(itemXml, "creator") ||
      "";

    items.push({
      title,
      snippet,
      url: link,
      author: cleanText(author),
      source: feedTitle,
      pubDate,
    });
  }

  return items;
}

/**
 * Extract content from XML tag
 */
function extractTag(xml: string, tagName: string): string | null {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\/${tagName}>`, "i");
  const match = xml.match(regex);
  return match ? match[1] : null;
}

/**
 * Extract Atom link
 */
function extractAtomLink(xml: string): string | null {
  const regex = /<link[^>]*href="([^"]+)"[^>]*>/i;
  const match = xml.match(regex);
  return match ? match[1] : null;
}

/**
 * Clean HTML and entities from text
 */
function cleanText(text: string): string {
  return text
    .replace(/<[^>]+>/g, "") // Remove HTML tags
    .replace(/\u0026lt;/g, "\u003c")
    .replace(/\u0026gt;/g, "\u003e")
    .replace(/\u0026amp;/g, "\u0026")
    .replace(/\u0026quot;/g, "\u0022")
    .replace(/\u0026#039;/g, "\u0027")
    .replace(/\u0026nbsp;/g, "\u0020")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Generate ID from URL
 */
function generateId(url: string): string {
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}
