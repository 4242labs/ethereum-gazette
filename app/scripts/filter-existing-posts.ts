#!/usr/bin/env node

// Script to filter existing posts in the database using the keyword filter
// This script will:
// 1. Fetch all posts from the database
// 2. Run each through the keyword filter
// 3. Keep only the 150 most recent approved posts
// 4. Log rejected/review items to their respective tables
// 5. Delete all other posts from the main posts table

import { createClient } from "@supabase/supabase-js";
import { KeywordFilter } from "../../api/rss/keyword-filter";
import {
  logRejectedItem,
  logReviewItem,
  batchLogRejectedItems,
  batchLogReviewItems,
} from "../../api/rss/filter-logger";
import * as readline from "readline";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing required environment variables:");
  console.error("   NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✓" : "✗");
  console.error("   SUPABASE_SERVICE_KEY:", supabaseServiceKey ? "✓" : "✗");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize keyword filter
const keywordFilter = new KeywordFilter();

// CLI arguments
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run") || args.includes("-d");
const skipConfirmation = args.includes("--yes") || args.includes("-y");
const verbose = args.includes("--verbose") || args.includes("-v");

interface Post {
  id: string;
  title: string;
  snippet: string;
  url: string;
  source: string;
  category: string;
  pub_date: string;
  created_at: string;
}

interface FilterStats {
  total: number;
  approved: number;
  rejected: number;
  review: number;
  kept: number;
  toDelete: number;
}

/**
 * Ask user for confirmation
 */
async function askConfirmation(question: string): Promise<boolean> {
  if (skipConfirmation) return true;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${question} (y/N): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
    });
  });
}

/**
 * Fetch all posts from the database
 */
async function fetchAllPosts(): Promise<Post[]> {
  console.log("📥 Fetching all posts from database...");

  const posts: Post[] = [];
  let hasMore = true;
  let offset = 0;
  const limit = 1000; // Fetch in batches

  while (hasMore) {
    const { data, error } = await supabase
      .from("posts")
      .select("id, title, snippet, url, source, category, pub_date, created_at")
      .order("pub_date", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch posts: ${error.message}`);
    }

    if (data && data.length > 0) {
      posts.push(...data);
      offset += data.length;
      console.log(`  Fetched ${posts.length} posts so far...`);

      if (data.length < limit) {
        hasMore = false;
      }
    } else {
      hasMore = false;
    }
  }

  console.log(`✓ Fetched ${posts.length} total posts`);
  return posts;
}

/**
 * Filter posts and collect statistics
 */
async function filterPosts(posts: Post[]): Promise<{
  approved: Post[];
  rejected: Array<{ post: Post; filterResult: any }>;
  review: Array<{ post: Post; filterResult: any }>;
  stats: FilterStats;
}> {
  console.log("\n🔍 Filtering posts...");

  const approved: Post[] = [];
  const rejected: Array<{ post: Post; filterResult: any }> = [];
  const review: Array<{ post: Post; filterResult: any }> = [];

  let processed = 0;
  const progressInterval = Math.floor(posts.length / 20); // Show progress every 5%

  for (const post of posts) {
    const filterResult = keywordFilter.filter({
      title: post.title,
      snippet: post.snippet,
      url: post.url,
    });

    if (filterResult.decision === "approve") {
      approved.push(post);
    } else if (filterResult.decision === "review") {
      review.push({ post, filterResult });
    } else if (filterResult.decision === "reject") {
      rejected.push({ post, filterResult });
    }

    processed++;
    if (processed % progressInterval === 0) {
      const percent = Math.floor((processed / posts.length) * 100);
      console.log(`  Progress: ${percent}% (${processed}/${posts.length})`);
    }

    if (verbose && filterResult.decision !== "approve") {
      console.log(
        `  ${filterResult.decision.toUpperCase()}: "${post.title}" (score: ${filterResult.score.toFixed(3)})`,
      );
    }
  }

  // Sort approved posts by date and keep only the most recent 150
  approved.sort(
    (a, b) => new Date(b.pub_date).getTime() - new Date(a.pub_date).getTime(),
  );
  const keptPosts = approved.slice(0, 150);
  const approvedToDelete = approved.slice(150);

  const stats: FilterStats = {
    total: posts.length,
    approved: approved.length,
    rejected: rejected.length,
    review: review.length,
    kept: keptPosts.length,
    toDelete: rejected.length + review.length + approvedToDelete.length,
  };

  console.log("\n📊 Filtering Results:");
  console.log(`  Total posts:     ${stats.total}`);
  console.log(`  Approved:        ${stats.approved} (keeping ${stats.kept})`);
  console.log(`  For review:      ${stats.review}`);
  console.log(`  Rejected:        ${stats.rejected}`);
  console.log(`  To be deleted:   ${stats.toDelete}`);

  return {
    approved: keptPosts,
    rejected,
    review,
    stats,
  };
}

/**
 * Log filtered items to Supabase tables
 */
async function logFilteredItems(
  rejected: Array<{ post: Post; filterResult: any }>,
  review: Array<{ post: Post; filterResult: any }>,
): Promise<void> {
  console.log("\n📝 Logging filtered items to database...");

  // Batch log rejected items
  if (rejected.length > 0) {
    console.log(`  Logging ${rejected.length} rejected items...`);
    const rejectedBatches = [];
    for (let i = 0; i < rejected.length; i += 100) {
      const batch = rejected
        .slice(i, i + 100)
        .map(({ post, filterResult }) => ({
          item: {
            title: post.title,
            snippet: post.snippet,
            url: post.url,
            source: post.source,
            category: post.category,
            original_pub_date: new Date(post.pub_date),
          },
          filterResult,
        }));
      rejectedBatches.push(batch);
    }

    for (const batch of rejectedBatches) {
      await batchLogRejectedItems(batch);
    }
    console.log("  ✓ Rejected items logged");
  }

  // Batch log review items
  if (review.length > 0) {
    console.log(`  Logging ${review.length} review items...`);
    const reviewBatches = [];
    for (let i = 0; i < review.length; i += 100) {
      const batch = review.slice(i, i + 100).map(({ post, filterResult }) => ({
        item: {
          title: post.title,
          snippet: post.snippet,
          url: post.url,
          source: post.source,
          category: post.category,
          original_pub_date: new Date(post.pub_date),
        },
        filterResult,
      }));
      reviewBatches.push(batch);
    }

    for (const batch of reviewBatches) {
      await batchLogReviewItems(batch);
    }
    console.log("  ✓ Review items logged");
  }
}

/**
 * Delete posts from the database
 */
async function deletePosts(
  posts: Post[],
  keptPostIds: Set<string>,
): Promise<number> {
  console.log("\n🗑️  Deleting filtered posts...");

  const idsToDelete = posts
    .filter((post) => !keptPostIds.has(post.id))
    .map((post) => post.id);

  if (idsToDelete.length === 0) {
    console.log("  No posts to delete");
    return 0;
  }

  // Delete in batches
  const batchSize = 100;
  let deleted = 0;

  for (let i = 0; i < idsToDelete.length; i += batchSize) {
    const batch = idsToDelete.slice(i, i + batchSize);

    const { error } = await supabase.from("posts").delete().in("id", batch);

    if (error) {
      throw new Error(`Failed to delete posts: ${error.message}`);
    }

    deleted += batch.length;
    console.log(`  Deleted ${deleted}/${idsToDelete.length} posts...`);
  }

  console.log(`✓ Deleted ${deleted} posts`);
  return deleted;
}

/**
 * Create a backup of the posts table
 */
async function createBackup(): Promise<void> {
  console.log("\n💾 Creating backup table...");

  // Create backup table with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const backupTableName = `posts_backup_${timestamp}`;

  const { error } = await supabase.rpc("create_posts_backup", {
    backup_table_name: backupTableName,
  });

  if (error) {
    // If the RPC doesn't exist, try raw SQL
    console.log("  Note: Backup RPC not found, skipping backup");
    console.log(
      "  You may want to manually backup the posts table before proceeding",
    );
    return;
  }

  console.log(`✓ Created backup table: ${backupTableName}`);
}

/**
 * Main function
 */
async function main() {
  console.log("🚀 Ethereum Gazette - Database Content Filter");
  console.log("==========================================");
  console.log(`Mode: ${isDryRun ? "DRY RUN" : "LIVE"}`);
  console.log(`Auto-confirm: ${skipConfirmation ? "YES" : "NO"}`);
  console.log(`Verbose: ${verbose ? "YES" : "NO"}`);
  console.log("");

  try {
    // Fetch all posts
    const posts = await fetchAllPosts();

    if (posts.length === 0) {
      console.log("No posts found in database. Exiting.");
      return;
    }

    // Filter posts
    const { approved, rejected, review, stats } = await filterPosts(posts);

    if (isDryRun) {
      console.log("\n🏁 DRY RUN COMPLETE - No changes made to database");

      if (verbose) {
        console.log("\nSample of posts that would be kept:");
        approved.slice(0, 5).forEach((post) => {
          console.log(
            `  ✓ "${post.title}" (${new Date(post.pub_date).toLocaleDateString()})`,
          );
        });

        console.log("\nSample of posts that would be deleted:");
        rejected.slice(0, 5).forEach(({ post }) => {
          console.log(
            `  ✗ "${post.title}" (${new Date(post.pub_date).toLocaleDateString()})`,
          );
        });
      }

      return;
    }

    // Ask for confirmation
    console.log("\n⚠️  WARNING: This will permanently modify your database!");
    console.log(`   - ${stats.kept} posts will be kept`);
    console.log(`   - ${stats.toDelete} posts will be deleted`);
    console.log(`   - ${stats.rejected} items will be logged as rejected`);
    console.log(`   - ${stats.review} items will be logged for review`);

    const confirmed = await askConfirmation("\nDo you want to proceed?");

    if (!confirmed) {
      console.log("Operation cancelled.");
      return;
    }

    // Create backup (optional)
    const backupConfirmed = await askConfirmation(
      "Create a backup of the posts table first?",
    );
    if (backupConfirmed) {
      await createBackup();
    }

    // Log filtered items
    await logFilteredItems(rejected, review);

    // Delete posts
    const keptPostIds = new Set(approved.map((post) => post.id));
    const deletedCount = await deletePosts(posts, keptPostIds);

    console.log("\n✅ Database cleanup complete!");
    console.log(`   Kept ${stats.kept} high-quality posts`);
    console.log(`   Deleted ${deletedCount} posts`);
    console.log(`   Logged ${stats.rejected} rejected items`);
    console.log(`   Logged ${stats.review} items for review`);
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

// Usage information
if (args.includes("--help") || args.includes("-h")) {
  console.log(`
Usage: ts-node scripts/filter-existing-posts.ts [options]

Options:
  -d, --dry-run     Run without making changes to the database
  -y, --yes         Skip confirmation prompts
  -v, --verbose     Show detailed filtering information
  -h, --help        Show this help message

Examples:
  # Dry run to see what would happen
  ts-node scripts/filter-existing-posts.ts --dry-run

  # Run with verbose output
  ts-node scripts/filter-existing-posts.ts --dry-run --verbose

  # Execute cleanup (with confirmations)
  ts-node scripts/filter-existing-posts.ts

  # Execute cleanup without confirmations
  ts-node scripts/filter-existing-posts.ts --yes
`);
  process.exit(0);
}

// Run the script
main().catch(console.error);
