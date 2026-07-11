#!/usr/bin/env node

// Quick script to remove specific non-Ethereum posts that shouldn't be in the database

const { createClient } = require("@supabase/supabase-js");
const { config } = require("dotenv");

// Load environment variables
config({ path: ".env.local" });

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

// List of URLs that should NOT be in the database (non-Ethereum content)
const problematicUrls = [
  "https://thedefiant.io/news/blockchains/xrp-jumps-nearly-20-as-ripple-teases-major-xrpl-upgrades",
  "https://thedefiant.io/news/tokens/rainbow-token-rnbw-tanks-65-below-ico-price-on-day-one-trading",
  "https://decrypt.co/357128/waymos-self-driving-claims-reality-check-capitol-hill",
  "https://www.coindesk.com/markets/2026/02/06/ripple-lays-out-institutional-defi-blueprint-for-xrpl-with-xrp-at-center",
  "https://decrypt.co/357058/uk-teens-jailed-after-4-3m-wrench-attack-robbery-caught-on-police-video",
];

// Additional patterns to find more problematic posts
const badPatterns = [
  { field: 'title', pattern: 'XRP', reason: 'Ripple/XRP content' },
  { field: 'title', pattern: 'Ripple', reason: 'Ripple/XRP content' },
  { field: 'title', pattern: 'Solana', reason: 'Solana content' },
  { field: 'title', pattern: 'SOL', reason: 'Solana content' },
  { field: 'title', pattern: 'Bitcoin', reason: 'Bitcoin-only content' },
  { field: 'title', pattern: 'BTC', reason: 'Bitcoin-only content' },
  { field: 'title', pattern: 'Binance', reason: 'Binance/BSC content' },
  { field: 'title', pattern: 'BNB', reason: 'Binance/BSC content' },
  { field: 'title', pattern: 'Waymo', reason: 'Not crypto related' },
  { field: 'title', pattern: 'self-driving', reason: 'Not crypto related' },
  { field: 'title', pattern: 'Rainbow', reason: 'Non-Ethereum token' },
];

async function findAndRemovePosts() {
  console.log("🔍 Finding problematic posts in database...\n");

  const postsToDelete = [];
  const foundPosts = [];

  // Check specific URLs
  console.log("Checking specific problematic URLs:");
  for (const url of problematicUrls) {
    const { data } = await supabase
      .from("posts")
      .select("id, title, url")
      .eq("url", url)
      .single();

    if (data) {
      console.log(`  ❌ FOUND: "${data.title.substring(0, 60)}..."`);
      postsToDelete.push(data);
      foundPosts.push({ ...data, reason: 'Known problematic URL' });
    }
  }

  // Check patterns
  console.log("\nChecking for pattern matches:");
  for (const { field, pattern, reason } of badPatterns) {
    const { data } = await supabase
      .from("posts")
      .select("id, title, url")
      .ilike(field, `%${pattern}%`)
      .limit(100);

    if (data && data.length > 0) {
      console.log(`\n  Pattern "${pattern}" in ${field} (${reason}):`);
      for (const post of data) {
        // Skip if already in deletion list
        if (!postsToDelete.find(p => p.id === post.id)) {
          console.log(`    ❌ "${post.title.substring(0, 60)}..."`);
          postsToDelete.push(post);
          foundPosts.push({ ...post, reason });
        }
      }
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`  Total problematic posts found: ${postsToDelete.length}`);

  if (postsToDelete.length === 0) {
    console.log("\n✅ No problematic posts found!");
    return;
  }

  // Show what will be deleted
  console.log("\n📋 Posts to be deleted:");
  foundPosts.forEach(post => {
    console.log(`  - "${post.title.substring(0, 50)}..." (${post.reason})`);
  });

  // Ask for confirmation
  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer = await new Promise((resolve) => {
    rl.question(`\n⚠️  Delete these ${postsToDelete.length} posts? (y/N): `, resolve);
  });
  rl.close();

  if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
    console.log("Operation cancelled.");
    return;
  }

  // Delete posts
  console.log("\n🗑️  Deleting posts...");
  const ids = postsToDelete.map(p => p.id);

  // Delete in batches
  const batchSize = 50;
  let deleted = 0;

  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const { error } = await supabase
      .from("posts")
      .delete()
      .in("id", batch);

    if (error) {
      console.error("Error deleting batch:", error);
    } else {
      deleted += batch.length;
      console.log(`  Deleted ${deleted}/${ids.length} posts...`);
    }
  }

  console.log(`\n✅ Successfully deleted ${deleted} problematic posts!`);

  // Check remaining post count
  const { count } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true });

  console.log(`\n📈 Remaining posts in database: ${count}`);
}

// Run the script
findAndRemovePosts().catch(console.error);
