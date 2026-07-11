#!/usr/bin/env node

// Database cleanup script using production keyword filter logic
// Uses the same logic as test-keyword-filter.js which is confirmed working

const readline = require("readline");
const path = require("path");
const fs = require("fs");
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

// CLI arguments
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run") || args.includes("-d");
const skipConfirmation = args.includes("--yes") || args.includes("-y");
const verbose = args.includes("--verbose") || args.includes("-v");

// Load keyword filter configuration (same as test-keyword-filter.js)
const configPath = path.resolve(__dirname, "../../data/keyword-filter-config.json");
let filterConfig;

try {
  const configData = fs.readFileSync(configPath, "utf8");
  filterConfig = JSON.parse(configData);
} catch (error) {
  console.error("❌ Failed to load keyword filter config:", error.message);
  console.error("   Expected path:", configPath);
  process.exit(1);
}

// Production KeywordFilter class (identical to test-keyword-filter.js implementation)
class KeywordFilter {
  constructor() {
    this.config = filterConfig.config;
    this.keywords = filterConfig.keywords;
    this.contextualRules = filterConfig.contextualRules;
    this.exclusionPatterns = filterConfig.exclusionPatterns;

    // Compile regex patterns
    this.compiledContextualRules = {};
    for (const [ruleName, rule] of Object.entries(this.contextualRules)) {
      this.compiledContextualRules[ruleName] = new RegExp(rule.pattern, "i");
    }

    this.compiledExclusionPatterns = this.exclusionPatterns.patterns.map(
      (pattern) => new RegExp(pattern, "i")
    );
  }

  filter(item) {
    const title = item.title || "";
    const snippet = item.snippet || "";
    const url = item.url || "";

    // Check exclusion patterns first
    const exclusions = this.checkExclusionPatterns(title, snippet, url);
    if (exclusions.length > 0) {
      return {
        decision: "reject",
        score: -10.0,
        reasoning: {
          exclusionMatches: exclusions,
          keywordMatches: [],
          contextualRuleMatches: [],
        },
        summary: `EXCLUSION: ${exclusions.join(", ")}`,
      };
    }

    // Calculate keyword score
    const keywordResult = this.calculateKeywordScore(title, snippet, url);
    let score = keywordResult.score;
    const keywordMatches = keywordResult.matches;

    // Apply contextual rules
    const contextualMatches = this.applyContextualRules(title, snippet, url);
    for (const match of contextualMatches) {
      score += match.modifier;
    }

    // Determine decision based on thresholds
    let decision;
    if (score >= this.config.thresholds.autoApprove) {
      decision = "approve";
    } else if (score <= this.config.thresholds.autoReject) {
      decision = "reject";
    } else {
      decision = "review";
    }

    const reasoning = {
      exclusionMatches: [],
      keywordMatches: keywordMatches,
      contextualRuleMatches: contextualMatches,
    };

    return {
      decision,
      score,
      reasoning,
      summary: this.generateSummary(score, decision, keywordMatches, contextualMatches),
    };
  }

  checkExclusionPatterns(title, snippet, url) {
    const text = `${title} ${snippet} ${url}`.toLowerCase();
    const matches = [];

    for (let i = 0; i < this.compiledExclusionPatterns.length; i++) {
      const pattern = this.compiledExclusionPatterns[i];
      if (pattern.test(text)) {
        matches.push(this.exclusionPatterns.patterns[i]);
      }
    }

    return matches;
  }

  calculateKeywordScore(title, snippet, url) {
    const contexts = [
      { text: title, weight: this.config.contextWeights.title, context: "title" },
      { text: snippet, weight: this.config.contextWeights.snippet, context: "snippet" },
      { text: url, weight: this.config.contextWeights.url, context: "url" },
    ];

    let totalScore = 0;
    const matches = [];
    const keywordFrequency = new Map();

    for (const { text, weight, context } of contexts) {
      if (!text) continue;
      const lowerText = text.toLowerCase();

      for (const [category, categoryConfig] of Object.entries(this.keywords)) {
        for (const term of categoryConfig.terms) {
          const termLower = term.toLowerCase();
          const regex = new RegExp(`\\b${this.escapeRegex(termLower)}\\b`, "gi");
          const termMatches = (lowerText.match(regex) || []).length;

          if (termMatches > 0) {
            const currentCount = keywordFrequency.get(term) || 0;
            keywordFrequency.set(term, currentCount + termMatches);

            // Apply frequency capping (max 3x)
            const effectiveCount = Math.min(currentCount + termMatches, 3);
            const termScore = categoryConfig.weight * weight * effectiveCount;
            totalScore += termScore;

            matches.push({
              term,
              category,
              weight: categoryConfig.weight,
              context,
              frequency: termMatches,
            });
          }
        }
      }
    }

    return { score: totalScore, matches };
  }

  applyContextualRules(title, snippet, url) {
    const text = `${title} ${snippet} ${url}`;
    const matches = [];

    for (const [ruleName, rule] of Object.entries(this.compiledContextualRules)) {
      if (rule.test(text)) {
        matches.push({
          rule: ruleName,
          modifier: this.contextualRules[ruleName].weightModifier,
        });
      }
    }

    return matches;
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  generateSummary(score, decision, keywordMatches, contextualMatches) {
    const positiveMatches = keywordMatches.filter((m) => m.weight > 0);
    const negativeMatches = keywordMatches.filter((m) => m.weight < 0);

    let summary = `Score: ${score.toFixed(3)} | Decision: ${decision.toUpperCase()}`;

    if (positiveMatches.length > 0) {
      const topPositive = positiveMatches
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 3)
        .map((m) => m.term);
      summary += `| Positive: ${topPositive.join(", ")} `;
    }

    if (negativeMatches.length > 0) {
      const topNegative = negativeMatches
        .sort((a, b) => a.weight - b.weight)
        .slice(0, 3)
        .map((m) => m.term);
      summary += `| Negative: ${topNegative.join(", ")} `;
    }

    if (contextualMatches.length > 0) {
      summary += `| Rules: ${contextualMatches.map((r) => r.rule).join(", ")} `;
    }

    return summary;
  }
}

// Initialize the production keyword filter
let keywordFilter;
try {
  keywordFilter = new KeywordFilter();
  console.log("✓ Production KeywordFilter initialized successfully");
  console.log(`✓ Loaded ${Object.keys(filterConfig.keywords).length} keyword categories`);
  console.log(`✓ Loaded ${Object.keys(filterConfig.contextualRules).length} contextual rules`);
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
  console.log(`   Using ${Object.keys(filterConfig.keywords).length} keyword categories and ${Object.keys(filterConfig.contextualRules).length} contextual rules`);

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
        if (verbose && filterResult.summary) {
          console.log(`    Reason: ${filterResult.summary}`);
        }
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
            filterResult.reasoning || filterResult.summary || filterResult.error || "Unknown",
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
      const batch = review
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
            filterResult.reasoning || filterResult.summary || "Unknown",
          ),
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
    "🚀 Ethereum Gazette - Database Cleanup (PRODUCTION KEYWORD FILTER)",
  );
  console.log(
    "==================================================================",
  );
  console.log(`Mode: ${isDryRun ? "DRY RUN" : "LIVE"}`);
  console.log(`Auto-confirm: ${skipConfirmation ? "YES" : "NO"}`);
  console.log(`Verbose: ${verbose ? "YES" : "NO"}`);
  console.log(`Config: ${Object.keys(filterConfig.keywords).length} categories, ${Object.keys(filterConfig.contextualRules).length} rules`);
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
        rejected.slice(0, 5).forEach(({ post, filterResult }) => {
          console.log(
            `  ✗ "${post.title}" (${new Date(post.pub_date).toLocaleDateString()})`,
          );
          if (filterResult.summary) {
            console.log(`    Reason: ${filterResult.summary}`);
          }
        });

        console.log("\nSample of posts that would be deleted (review):");
        review.slice(0, 5).forEach(({ post, filterResult }) => {
          console.log(
            `  ? "${post.title}" (${new Date(post.pub_date).toLocaleDateString()})`,
          );
          if (filterResult.summary) {
            console.log(`    Reason: ${filterResult.summary}`);
          }
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
      "   This script uses the PRODUCTION keyword filter with 319 keywords and 6 contextual rules",
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
      "\n🔍 Next steps: Check https://ethereumworld.42labs.io/ to verify content quality",
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
Usage: node ew-app/scripts/cleanup-with-production-filter.cjs [options]

This script uses the PRODUCTION keyword filter (319 keywords + 6 contextual rules)
from data/keyword-filter-config.json to properly filter database content.

Options:
  -d, --dry-run     Run without making changes to the database
  -y, --yes         Skip confirmation prompts
  -v, --verbose     Show detailed filtering information
  -h, --help        Show this help message

Examples:
  # Dry run to see what would happen
  node ew-app/scripts/cleanup-with-production-filter.cjs --dry-run --verbose

  # Execute cleanup (with confirmations)
  node ew-app/scripts/cleanup-with-production-filter.cjs

  # Execute cleanup without confirmations
  node ew-app/scripts/cleanup-with-production-filter.cjs --yes

Prerequisites:
  - Environment variables in ew-app/.env.local
  - Keyword filter config in data/keyword-filter-config.json
`);
  process.exit(0);
}

// Run the script
main().catch(console.error);
