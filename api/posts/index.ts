// Posts API endpoint - Get aggregated posts from database
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getPosts, getRecentPosts, getPostCountByCategory } from "../../lib/db";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { category, limit, offset, recent, stats } = req.query;

  try {
    // Return category statistics
    if (stats === "true") {
      const counts = await getPostCountByCategory();
      return res.status(200).json({
        success: true,
        stats: counts,
        timestamp: new Date().toISOString(),
      });
    }

    // Parse pagination parameters
    const limitNum = limit ? parseInt(limit as string, 10) : 50;
    const offsetNum = offset ? parseInt(offset as string, 10) : 0;

    // Validate pagination parameters
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        error: "Invalid limit parameter (must be 1-100)",
      });
    }

    if (isNaN(offsetNum) || offsetNum < 0) {
      return res.status(400).json({
        error: "Invalid offset parameter (must be >= 0)",
      });
    }

    // Get posts based on query parameters
    let posts;
    if (recent === "true") {
      // Get recent posts (last 7 days)
      posts = await getRecentPosts(category as string);
    } else {
      // Get posts with pagination
      posts = await getPosts(
        category as string,
        limitNum,
        offsetNum
      );
    }

    // Return posts
    return res.status(200).json({
      success: true,
      data: posts.map((post) => ({
        id: post.id,
        title: post.title,
        snippet: post.snippet,
        url: post.url,
        author: post.author,
        source: post.source,
        category: post.category,
        pubDate: post.pubDate.toISOString(),
        imageUrl: post.imageUrl,
        date: post.pubDate.toISOString(), // For backward compatibility
      })),
      meta: {
        count: posts.length,
        limit: limitNum,
        offset: offsetNum,
        category: category || "all",
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Posts API error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch posts",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
