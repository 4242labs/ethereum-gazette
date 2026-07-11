#!/usr/bin/env node

/**
 * Manual import script for Vitalik's latest 20 posts
 * This script fetches posts directly from Vitalik's blog RSS feed,
 * processes them through the existing pipeline, and stores them in the database.
 */

import { parseFeedToItems } from "../api/rss/parser";
import { normalizeItem } from "../api/rss/normalizer";
import { categorizeContent } from "../api/rss/categorizer";
import { deduplicateAgainstDatabase } from "../api/rss/deduplicator";
import { bulkInsertPosts, getRecentPostsForDeduplication, query } from "../lib/db";
import type { ParsedFeedItem } from "../api/rss/types";

// Vitalik's blog configuration
const VITALIK_SOURCE = {
  id: 7,
  name: "Vitalik Buterin's Blog",
  url: "https://vitalik.eth.limo/feed.xml",
  category: "people",
  tier: 1,
  autoApprove: true,
  description: "Vitalik Buterin's personal blog",
};

/**
 * Check current posts from Vitalik in database
 */
async function checkExistingVitalikPosts(): Promise<void> {
  try {
    const result = await query(`
      SELECT COUNT(*) as count, MIN(pub_date) as oldest, MAX(pub_date) as newest
      FROM posts
      WHERE source = $1
    `, [VITALIK_SOURCE.name]);

    if (result.rows[0].count > 0) {
      console.log(`📊 Current Vitalik posts in database: ${result.rows[0].count}`);
      console.log(`📅 Date range: ${result.rows[0].oldest} to ${result.rows[0].newest}`);
    } else {
      console.log("📊 No existing Vitalik posts found in database");
    }

    // Show recent posts
    const recentResult = await query(`
      SELECT title, pub_date, url
      FROM posts
      WHERE source = $1
      ORDER BY pub_date DESC
      LIMIT 5
    `, [VITALIK_SOURCE.name]);

    if (recentResult.rows.length > 0) {
      console.log("\n📝 Recent Vitalik posts:");
      recentResult.rows.forEach((post, i) => {
        console.log(`   ${i + 1}. ${post.title} (${post.pub_date.toISOString().split('T')[0]})`);
      });
    }

    console.log(""); // Empty line for separation
  } catch (error) {
    console.error("Error checking existing posts:", error);
  }
}

/**
 * Fetch and process Vitalik's latest posts
 */
async function importVitalikPosts(): Promise<void> {
  console.log("🚀 Starting Vitalik's blog import...");
  console.log(`📡 Fetching from: ${VITALIK_SOURCE.url}`);

  try {
    // Step 1: Parse RSS feed
    console.log("\n1️⃣ Parsing RSS feed...");
    const items = await parseFeedToItems(
      VITALIK_SOURCE.url,
      VITALIK_SOURCE.name,
      VITALIK_SOURCE.category,
      { maxItems: 25 } // Fetch 25 to ensure we get 20 after filtering
    );

    if (items.length === 0) {
      console.log("❌ No items fetched from RSS feed");
      return;
    }

    console.log(`✅ Fetched ${items.length} items from RSS feed`);

    // Step 2: Take only latest 20 posts
    const latest20 = items.slice(0, 20);
    console.log(`📝 Processing latest ${latest20.length} posts`);

    // Step 3: Auto-categorize posts (Tier 1 auto-approval)
    console.log("\n2️⃣ Categorizing posts...");
    const categorizedItems = latest20.map(item => {
      // For Vitalik's blog, we can auto-categorize based on content
      const categorization = categorizeContent(item.title, item.snippet, item.url);

      // Override category for better classification
      if (item.title.toLowerCase().includes('roadmap') ||
          item.title.toLowerCase().includes('ethereum') ||
          item.snippet.toLowerCase().includes('scaling') ||
          item.snippet.toLowerCase().includes('protocol')) {
        item.category = "education"; // Technical posts
      } else if (item.title.toLowerCase().includes('governance') ||
                 item.title.toLowerCase().includes('coordination')) {
        item.category = "governance";
      } else {
        item.category = "people"; // Default for Vitalik's personal thoughts
      }

      console.log(`   📄 "${item.title}" → ${item.category}`);
      return item;
    });

    // Step 4: Deduplicate against existing database content
    console.log("\n3️⃣ Checking for duplicates...");
    const recentPosts = await getRecentPostsForDeduplication(30); // Check last 30 days

    const dedupeResult = await deduplicateAgainstDatabase(
      categorizedItems,
      recentPosts,
      {
        urlThreshold: 0.95,
        titleThreshold: 0.85,
        timeWindowHours: 720, // 30 days
      }
    );

    console.log(`✅ Unique posts: ${dedupeResult.unique.length}`);
    console.log(`🔄 Duplicates found: ${dedupeResult.duplicates.length}`);

    if (dedupeResult.duplicates.length > 0) {
      console.log("\n📋 Duplicate posts (already in database):");
      dedupeResult.duplicates.forEach((dup, i) => {
        console.log(`   ${i + 1}. ${dup.title} (${dup.pubDate.toISOString().split('T')[0]})`);
      });
    }

    // Step 5: Insert unique posts into database
    if (dedupeResult.unique.length === 0) {
      console.log("\n✨ No new posts to import - all posts already exist in database");
      return;
    }

    console.log(`\n4️⃣ Inserting ${dedupeResult.unique.length} new posts into database...`);

    const insertedCount = await bulkInsertPosts(dedupeResult.unique);

    console.log(`✅ Successfully inserted ${insertedCount} posts`);

    // Step 6: Show summary of imported posts
    console.log("\n📋 Imported posts:");
    dedupeResult.unique.forEach((post, i) => {
      console.log(`   ${i + 1}. ${post.title}`);
      console.log(`      📅 ${post.pubDate.toISOString().split('T')[0]} | 🏷️ ${post.category}`);
      console.log(`      🔗 ${post.url}`);
      console.log("");
    });

  } catch (error) {
    console.error("❌ Error importing Vitalik's posts:", error);
    throw error;
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  console.log("🌐 Vitalik's Blog Import Script");
  console.log("===============================\n");

  try {
    // Check existing posts first
    await checkExistingVitalikPosts();

    // Import new posts
    await importVitalikPosts();

    // Final summary
    console.log("✨ Import completed successfully!");

  } catch (error) {
    console.error("\n💥 Import failed:", error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error("Script execution failed:", error);
    process.exit(1);
  });
}

export { importVitalikPosts, checkExistingVitalikPosts };
