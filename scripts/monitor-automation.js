#!/usr/bin/env node

/**
 * Automation Monitoring Script for Ethereum Gazette
 *
 * This script checks if the automatic RSS feed aggregation and stats updates
 * are working correctly by analyzing recent activity and timing patterns.
 *
 * Usage: node scripts/monitor-automation.js [--verbose] [--hours=24]
 */

const https = require("https");

// Configuration
const API_BASE_URL = "https://ethereumgazette.com";
const DEFAULT_HOURS = 2; // Check last 2 hours by default

// Parse command line arguments
const args = process.argv.slice(2);
const verbose = args.includes("--verbose");
const hoursArg = args.find((arg) => arg.startsWith("--hours="));
const hoursToCheck = hoursArg ? parseInt(hoursArg.split("=")[1]) : DEFAULT_HOURS;

// Utility functions
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(error);
          }
        });
      })
      .on("error", reject);
  });
}

function log(message, level = "info") {
  const timestamp = new Date().toISOString();
  const prefix =
    level === "error"
      ? "❌"
      : level === "warn"
        ? "⚠️"
        : level === "success"
          ? "✅"
          : level === "automation"
            ? "🤖"
            : "ℹ️";
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function logVerbose(message) {
  if (verbose) {
    console.log(`   ${message}`);
  }
}

function formatTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  return `${Math.floor(diffHours / 24)} days ago`;
}

// Monitoring functions
async function checkApiHealth() {
  try {
    const startTime = Date.now();
    const response = await makeRequest(`${API_BASE_URL}/api/posts?limit=1`);
    const responseTime = Date.now() - startTime;

    if (response.success) {
      log(`API health check passed (${responseTime}ms)`, "success");
      return { healthy: true, responseTime };
    } else {
      log("API health check failed - unsuccessful response", "error");
      return { healthy: false, error: "Unsuccessful response" };
    }
  } catch (error) {
    log(`API health check failed - ${error.message}`, "error");
    return { healthy: false, error: error.message };
  }
}

async function analyzeRecentPosts() {
  try {
    log("Analyzing recent posts for automation activity...");

    // Get recent posts
    const response = await makeRequest(`${API_BASE_URL}/api/posts?limit=50`);
    if (!response.success) {
      throw new Error("Failed to fetch posts");
    }

    const posts = response.data;
    const now = new Date();
    const cutoffTime = new Date(now - hoursToCheck * 60 * 60 * 1000);

    // Analyze posts by time periods
    const recentPosts = posts.filter(
      (post) => new Date(post.pubDate) > cutoffTime,
    );

    // Group by hour
    const postsByHour = {};
    recentPosts.forEach((post) => {
      const hour = new Date(post.pubDate).toISOString().substring(0, 13);
      postsByHour[hour] = (postsByHour[hour] || 0) + 1;
    });

    // Find most recent post
    const mostRecent = posts.length > 0 ? posts[0] : null;
    const mostRecentTime = mostRecent ? new Date(mostRecent.pubDate) : null;
    const timeSinceLastPost = mostRecentTime
      ? formatTimeAgo(mostRecentTime)
      : "unknown";

    // Automation assessment
    const isRecentActivity = recentPosts.length > 0;
    const timeSinceLastMs = mostRecentTime ? now - mostRecentTime : Infinity;
    const isLikelyAutomated = timeSinceLastMs < 20 * 60 * 1000; // Less than 20 minutes

    return {
      totalRecent: recentPosts.length,
      mostRecentPost: mostRecent,
      timeSinceLastPost,
      isRecentActivity,
      isLikelyAutomated,
      postsByHour,
      hoursChecked: hoursToCheck,
    };
  } catch (error) {
    log(`Failed to analyze posts: ${error.message}`, "error");
    return null;
  }
}

async function checkPostStats() {
  try {
    log("Checking post statistics...");

    const response = await makeRequest(`${API_BASE_URL}/api/posts?stats=true`);
    if (!response.success) {
      throw new Error("Failed to fetch stats");
    }

    const stats = response.stats;
    const total = Object.values(stats).reduce((sum, count) => sum + count, 0);

    logVerbose(`Total posts: ${total}`);
    Object.entries(stats).forEach(([category, count]) => {
      logVerbose(`  ${category}: ${count} posts`);
    });

    return { stats, total };
  } catch (error) {
    log(`Failed to check stats: ${error.message}`, "error");
    return null;
  }
}

async function checkNetworkStatsUpdate() {
  try {
    log("Checking network stats freshness...");

    const response = await makeRequest(`${API_BASE_URL}/api/stats`);
    if (!response.success) {
      throw new Error("Failed to fetch network stats");
    }

    const lastUpdated = new Date(response.lastUpdated);
    const now = new Date();
    const minutesSinceUpdate = Math.floor((now - lastUpdated) / (1000 * 60));

    // Network stats should update every 5 minutes
    const isStatsAutomated = minutesSinceUpdate <= 10; // Allow 10 minute grace period

    logVerbose(
      `Network stats last updated: ${formatTimeAgo(lastUpdated)} (${minutesSinceUpdate} minutes ago)`,
    );

    return {
      lastUpdated,
      minutesSinceUpdate,
      isStatsAutomated,
      statsData: response,
    };
  } catch (error) {
    log(`Failed to check network stats: ${error.message}`, "error");
    return null;
  }
}

async function triggerManualTest() {
  try {
    log("Testing manual trigger endpoint...");

    const startTime = Date.now();
    const response = await makeRequest(
      `${API_BASE_URL}/api/cron/trigger-fetch`,
    );
    const executionTime = Date.now() - startTime;

    if (response.success) {
      log(
        `Manual trigger succeeded (${executionTime}ms execution)`,
        "success",
      );
      logVerbose(
        `Processed ${response.stats.totalItemsProcessed} items, stored ${response.stats.totalItemsStored}`,
      );
      return { success: true, stats: response.stats, executionTime };
    } else {
      log("Manual trigger failed", "error");
      return { success: false, error: response.error };
    }
  } catch (error) {
    log(`Manual trigger test failed: ${error.message}`, "error");
    return { success: false, error: error.message };
  }
}

// Main monitoring function
async function runAutomationMonitoring() {
  console.log("🤖 ETHEREUM WORLD AUTOMATION MONITOR");
  console.log("=" .repeat(50));
  console.log(`Checking last ${hoursToCheck} hours of activity...\n`);

  const results = {};

  // 1. API Health Check
  log("Step 1: API Health Check");
  results.apiHealth = await checkApiHealth();

  // 2. Post Statistics
  log("\nStep 2: Content Statistics");
  results.postStats = await checkPostStats();

  // 3. Recent Activity Analysis
  log("\nStep 3: Recent Activity Analysis");
  results.recentActivity = await analyzeRecentPosts();

  // 4. Network Stats Check
  log("\nStep 4: Network Stats Automation");
  results.networkStats = await checkNetworkStatsUpdate();

  // 5. Manual Trigger Test (optional)
  if (process.argv.includes("--test-trigger")) {
    log("\nStep 5: Manual Trigger Test");
    results.manualTrigger = await triggerManualTest();
  }

  // Generate Report
  console.log("\n" + "=".repeat(50));
  console.log("🎯 AUTOMATION STATUS REPORT");
  console.log("=".repeat(50));

  // API Health
  if (results.apiHealth?.healthy) {
    log(
      `API Status: Healthy (${results.apiHealth.responseTime}ms response)`,
      "success",
    );
  } else {
    log("API Status: Unhealthy", "error");
  }

  // Content Stats
  if (results.postStats) {
    log(
      `Total Posts: ${results.postStats.total} across ${Object.keys(results.postStats.stats).length} categories`,
    );
  }

  // Recent Activity Assessment
  if (results.recentActivity) {
    const activity = results.recentActivity;

    console.log(`\n📊 Recent Activity (last ${activity.hoursChecked} hours):`);
    console.log(`   New posts: ${activity.totalRecent}`);
    console.log(`   Most recent: ${activity.timeSinceLastPost}`);

    if (activity.isLikelyAutomated) {
      log("RSS Feed Automation: ACTIVE ✅", "automation");
      log("Content is being updated automatically", "success");
    } else {
      log("RSS Feed Automation: INACTIVE ⚠️", "automation");
      log(
        `Last post was ${activity.timeSinceLastPost} - may need manual trigger`,
        "warn",
      );
    }

    if (verbose && Object.keys(activity.postsByHour).length > 0) {
      console.log("\n📈 Posts by hour:");
      Object.entries(activity.postsByHour).forEach(([hour, count]) => {
        console.log(`   ${hour}: ${count} posts`);
      });
    }
  }

  // Network Stats Assessment
  if (results.networkStats) {
    const stats = results.networkStats;

    if (stats.isStatsAutomated) {
      log("Network Stats Automation: ACTIVE ✅", "automation");
      log(
        `Stats updated ${stats.minutesSinceUpdate} minutes ago`,
        "success",
      );
    } else {
      log("Network Stats Automation: INACTIVE ⚠️", "automation");
      log(
        `Stats last updated ${stats.minutesSinceUpdate} minutes ago (>10 min threshold)`,
        "warn",
      );
    }
  }

  // Overall Assessment
  console.log("\n🎯 Overall Automation Status:");

  const rssWorking = results.recentActivity?.isLikelyAutomated || false;
  const statsWorking = results.networkStats?.isStatsAutomated || false;
  const apiWorking = results.apiHealth?.healthy || false;

  if (rssWorking && statsWorking && apiWorking) {
    log("🟢 FULLY AUTOMATED - All systems operational", "success");
  } else if (apiWorking && statsWorking && !rssWorking) {
    log(
      "🟡 PARTIALLY AUTOMATED - Network stats working, RSS feeds may need attention",
      "warn",
    );
  } else if (apiWorking && !statsWorking && !rssWorking) {
    log(
      "🟠 MANUAL MODE - API working but automation inactive",
      "warn",
    );
  } else {
    log("🔴 SYSTEM ISSUES - Multiple components not working", "error");
  }

  // Recommendations
  console.log("\n💡 Recommendations:");

  if (!apiWorking) {
    console.log("   ❌ Fix API connectivity issues first");
  }

  if (!statsWorking) {
    console.log(
      "   ⚠️ Check CRON_SECRET environment variable for network stats",
    );
  }

  if (!rssWorking) {
    console.log(
      "   ⚠️ Check RSS feed automation - may need environment variables",
    );
    console.log(
      "   💡 Try manual trigger: curl https://ethereumgazette.com/api/cron/trigger-fetch",
    );
  }

  if (rssWorking && statsWorking && apiWorking) {
    console.log("   ✅ System is fully operational!");
    console.log("   📊 Monitor regularly with this script");
  }

  // Next check recommendation
  const nextCheckMinutes = rssWorking ? 30 : 15;
  console.log(`\n⏰ Run next check in ~${nextCheckMinutes} minutes`);

  console.log("\n" + "=".repeat(50));
}

// CLI help
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
Ethereum Gazette Automation Monitor

Usage: node scripts/monitor-automation.js [options]

Options:
  --verbose         Show detailed output and hourly breakdowns
  --hours=N         Check last N hours of activity (default: 2)
  --test-trigger    Test manual trigger endpoint (will update content)
  --help, -h        Show this help message

Examples:
  node scripts/monitor-automation.js                    # Quick status check
  node scripts/monitor-automation.js --verbose          # Detailed report
  node scripts/monitor-automation.js --hours=6          # Check last 6 hours
  node scripts/monitor-automation.js --test-trigger     # Test and trigger update

Output:
  🟢 FULLY AUTOMATED    - All systems working automatically
  🟡 PARTIALLY AUTOMATED - Some systems working
  🟠 MANUAL MODE        - API working but no automation
  🔴 SYSTEM ISSUES      - Multiple problems detected
`);
  process.exit(0);
}

// Run the monitoring
if (require.main === module) {
  runAutomationMonitoring().catch((error) => {
    console.error("❌ Monitoring failed:", error.message);
    process.exit(1);
  });
}

module.exports = {
  runAutomationMonitoring,
  checkApiHealth,
  analyzeRecentPosts,
  checkPostStats,
  checkNetworkStatsUpdate,
};
