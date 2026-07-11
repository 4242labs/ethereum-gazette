#!/usr/bin/env node

// Script to filter existing posts in the database using the PRODUCTION keyword filter
// Fixed version that imports the actual keyword filter instead of simplified logic

const readline = require("readline");
const path = require("path");
const { config } = require("dotenv");
const { createClient } = require("@supabase/supabase-js");

// Load environment variables from ew-app directory
config({ path: path.join(__dirname, "../.env.local") });

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

// Import the production keyword filter
// Note: This requires the compiled JS version from the Next.js build
let KeywordFilter;
try {
  // Try to import from built API directory
  const filterModule = require("../../api/rss/keyword-filter.js");
  KeywordFilter = filterModule.KeywordFilter;
} catch (error) {
  console.error("❌ Could not import production KeywordFilter.");
  console.error("   Make sure the API is built: npm run build");
  console.error("   Error:", error.message);

  // Fallback: Use require to load the TypeScript file directly with ts-node
  try {
    require("ts-node/register");
    const filterModule = require("../../api/rss/keyword-filter.ts");
    KeywordFilter = filterModule.KeywordFilter;
    console.log("✓ Using ts-node fallback to load TypeScript filter");
  } catch (tsError) {
    console.error("❌ ts-node fallback also failed:", tsError.message);
    console.error("\nPlease run: npm install -g ts-node");
    process.exit(1);
  }
}

// CLI arguments
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run") || args.includes("-d");
const skipConfirmation = args.includes("--yes") || args.includes("-y");
const verbose = args.includes("--verbose") || args.includes("-v");

// Initialize the PRODUCTION keyword filter
let keywordFilter;
try {
  keywordFilter = new KeywordFilter();
  console.log("✓ Production KeywordFilter initialized successfully");
} catch (error) {
  console.error("❌ Failed to initialize KeywordFilter:", error.message);
  process.exit(1);
}

// Helper functions
async function askConfirmation(question) {
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

async function fetchAllPosts() {
  console.log("📥 Fetching all posts from database...");

  const posts = [];
  let hasMore = true;
  let offset = 0;
  const limit = 1000;

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

async function filterPosts(posts) {
  console.log("\n🔍 Filtering posts with PRODUCTION keyword filter...");

  const approved = [];
  const rejected = [];
  const review = [];

  let processed = 0;
  const progressInterval = Math.floor(posts.length / 20) || 1;

  for (const post of posts) {
    try {
      const filterResult = keywordFilter.filter({
        title: post.title || "",
        snippet: post.snippet || "",
        url: post.url || "",
      });

      if (filterResult.decision === "approve") {
        approved.push(post);
      } else if (filterResult.decision === "review") {
        review.push({ post, filterResult });
      } else if (filterResult.decision === "reject") {
        rejected.push({ post, filterResult });
      }

      if (verbose && filterResult.decision !== "approve") {
        console.log(
          `  ${filterResult.decision.toUpperCase()}: "${post.title}" (score: ${filterResult.score.toFixed(3)})`,
        );
      }
    } catch (error) {
      console.warn(
        `Warning: Failed to filter post "${post.title}":`,
        error.message,
      );
      // On error, treat as reject to be safe
      rejected.push({
        post,
        filterResult: { decision: "reject", score: 0, error: error.message },
      });
    }

    processed++;
    if (processed % progressInterval === 0) {
      const percent = Math.floor((processed / posts.length) * 100);
      console.log(`  Progress: ${percent}% (${processed}/${posts.length})`);
    }
  }

  // Sort approved posts by date and keep only the most recent 150
  approved.sort(
    (a, b) => new Date(b.pub_date).getTime() - new Date(a.pub_date).getTime(),
  );
  const keptPosts = approved.slice(0, 150);
  const approvedToDelete = approved.slice(150);

  const stats = {
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

  return { approved: keptPosts, rejected, review, approvedToDelete, stats };
}

async function logFilteredItems(rejected, review) {
  console.log("\n📝 Logging filtered items to database...");

  // Log rejected items
  if (rejected.length > 0) {
    console.log(`  Logging ${rejected.length} rejected items...`);
    for (let i = 0; i < rejected.length; i += 100) {
      const batch = rejected
        .slice(i, i + 100)
        .map(({ post, filterResult }) => ({
          title: post.title,
          snippet: post.snippet,
          url: post.url,
          source: post.source,
          category: post.category,
          original_pub_date: post.pub_date,
          filter_score: filterResult.score || 0,
          filter_reasoning: JSON.stringify(
            filterResult.reasoning || filterResult.error || "Unknown",
          ),
        }));

      const { error } = await supabase.from("filter_rejected").insert(batch);
      if (error) {
        console.error("Failed to log rejected items:", error);
      }
    }
    console.log("  ✓ Rejected items logged");
  }

  // Log review items
  if (review.length > 0) {
    console.log(`  Logging ${review.length} review items...`);
    for (let i = 0; i < review.length; i += 100) {
      const batch = review.slice(i, i + 100).map(({ post, filterResult }) => ({
        title: post.title,
        snippet: post.snippet,
        url: post.url,
        source: post.source,
        category: post.category,
        original_pub_date: post.pub_date,
        filter_score: filterResult.score,
        filter_reasoning: JSON.stringify(filterResult.reasoning),
      }));

      const { error } = await supabase.from("filter_review").insert(batch);
      if (error) {
        console.error("Failed to log review items:", error);
      }
    }
    console.log("  ✓ Review items logged");
  }
}

async function deletePosts(posts, keptPostIds) {
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

async function main() {
  console.log(
    "🚀 Ethereum Gazette - Database Content Filter (PRODUCTION VERSION)",
  );
  console.log(
    "================================================================",
  );
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

    // Filter posts using production filter
    const { approved, rejected, review, approvedToDelete, stats } =
      await filterPosts(posts);

    if (isDryRun) {
      console.log("\n🏁 DRY RUN COMPLETE - No changes made to database");

      if (verbose) {
        console.log("\nSample of posts that would be kept:");
        approved.slice(0, 5).forEach((post) => {
          console.log(
            `  ✓ "${post.title}" (${new Date(post.pub_date).toLocaleDateString()})`,
          );
        });

        console.log("\nSample of posts that would be deleted (rejected):");
        rejected.slice(0, 5).forEach(({ post }) => {
          console.log(
            `  ✗ "${post.title}" (${new Date(post.pub_date).toLocaleDateString()})`,
          );
        });

        console.log("\nSample of posts that would be deleted (review):");
        review.slice(0, 5).forEach(({ post }) => {
          console.log(
            `  ? "${post.title}" (${new Date(post.pub_date).toLocaleDateString()})`,
          );
        });

        if (approvedToDelete.length > 0) {
          console.log(
            "\nSample of approved posts that would be deleted (excess):",
          );
          approvedToDelete.slice(0, 5).forEach((post) => {
            console.log(
              `  ↓ "${post.title}" (${new Date(post.pub_date).toLocaleDateString()})`,
            );
          });
        }
      }

      return;
    }

    // Ask for confirmation
    console.log("\n⚠️  WARNING: This will permanently modify your database!");
    console.log(
      "   This script uses the PRODUCTION keyword filter (319 keywords, 6 contextual rules)",
    );
    console.log(`   - ${stats.kept} posts will be kept`);
    console.log(`   - ${stats.toDelete} posts will be deleted`);
    console.log(`   - ${stats.rejected} items will be logged as rejected`);
    console.log(`   - ${stats.review} items will be logged for review`);

    const confirmed = await askConfirmation("\nDo you want to proceed?");

    if (!confirmed) {
      console.log("Operation cancelled.");
      return;
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
    console.log(
      "\n🔍 Recommendation: Check the site to verify non-Ethereum content is removed",
    );
  } catch (error) {
    console.error("\n❌ Error:", error);
    console.error("\nStack trace:", error.stack);
    process.exit(1);
  }
}

// Usage information
if (args.includes("--help") || args.includes("-h")) {
  console.log(`
Usage: node scripts/filter-existing-posts.cjs [options]

This script uses the PRODUCTION keyword filter (319 keywords + contextual rules)
to properly filter database content and remove non-Ethereum posts.

Options:
  -d, --dry-run     Run without making changes to the database
  -y, --yes         Skip confirmation prompts
  -v, --verbose     Show detailed filtering information
  -h, --help        Show this help message

Examples:
  # Dry run to see what would happen
  node scripts/filter-existing-posts.cjs --dry-run --verbose

  # Execute cleanup (with confirmations)
  node scripts/filter-existing-posts.cjs

  # Execute cleanup without confirmations
  node scripts/filter-existing-posts.cjs --yes

Prerequisites:
  1. Build the API: npm run build
  2. Or install ts-node: npm install -g ts-node
`);
  process.exit(0);
}

// Run the script
main().catch(console.error);
