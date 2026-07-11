#!/usr/bin/env node

/**
 * Simple Automation Check for Ethereum Gazette
 * Compatible with older Node.js versions
 */

const https = require("https");

const API_BASE_URL = "https://ethereumgazette.com";

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

function formatTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return diffMinutes + " minutes ago";
  if (diffHours < 24) return diffHours + " hours ago";
  return Math.floor(diffHours / 24) + " days ago";
}

async function checkAutomation() {
  console.log("🤖 Ethereum Gazette Automation Status Check");
  console.log("=".repeat(50));

  try {
    // Check API health
    console.log("📡 Checking API health...");
    const startTime = Date.now();
    const healthCheck = await makeRequest(API_BASE_URL + "/api/posts?limit=1");
    const apiTime = Date.now() - startTime;

    if (healthCheck.success) {
      console.log("✅ API: Healthy (" + apiTime + "ms)");
    } else {
      console.log("❌ API: Unhealthy");
      return;
    }

    // Check recent posts
    console.log("📄 Checking recent posts...");
    const postsResponse = await makeRequest(
      API_BASE_URL + "/api/posts?limit=10",
    );

    if (!postsResponse.success) {
      console.log("❌ Failed to fetch posts");
      return;
    }

    const posts = postsResponse.data;
    const mostRecent = posts[0];
    const mostRecentTime = new Date(mostRecent.pubDate);
    const now = new Date();
    const minutesSinceLastPost = Math.floor(
      (now - mostRecentTime) / (1000 * 60),
    );

    console.log("📅 Most recent post: " + formatTimeAgo(mostRecentTime));
    console.log("   Title: " + mostRecent.title);
    console.log("   Source: " + mostRecent.source);

    // RSS Automation Assessment
    if (minutesSinceLastPost <= 20) {
      console.log("🟢 RSS AUTOMATION: ACTIVE ✅");
      console.log("   Posts are being updated automatically");
    } else if (minutesSinceLastPost <= 60) {
      console.log("🟡 RSS AUTOMATION: POSSIBLY ACTIVE ⚠️");
      console.log("   Last post was " + minutesSinceLastPost + " minutes ago");
    } else {
      console.log("🔴 RSS AUTOMATION: INACTIVE ❌");
      console.log("   Last post was " + formatTimeAgo(mostRecentTime));
    }

    // Check network stats (using simple-stats endpoint)
    console.log("📊 Checking network stats...");
    try {
      const statsResponse = await makeRequest(
        API_BASE_URL + "/api/simple-stats",
      );

      if (statsResponse.lastUpdated) {
        const lastUpdated = new Date(statsResponse.lastUpdated);
        const minutesSinceStats = Math.floor((now - lastUpdated) / (1000 * 60));

        console.log(
          "📈 Network stats last updated: " + formatTimeAgo(lastUpdated),
        );
        console.log("   ETH Price: $" + statsResponse.market.ethPrice);
        console.log(
          "   Gas Price: " + statsResponse.network.gasPrice.average + " gwei",
        );

        if (minutesSinceStats <= 10) {
          console.log("🟢 NETWORK STATS: ACTIVE ✅");
        } else {
          console.log("🔴 NETWORK STATS: INACTIVE ❌");
        }
      } else {
        console.log("⚠️ Network stats data incomplete");
      }
    } catch (error) {
      console.log("⚠️ Network stats endpoint issue (non-critical)");
      console.log("   Main RSS automation still working");
    }

    // Check total content
    console.log("📈 Checking content stats...");
    const contentStats = await makeRequest(
      API_BASE_URL + "/api/posts?stats=true",
    );

    if (contentStats.success) {
      const total = Object.values(contentStats.stats).reduce(
        (sum, count) => sum + count,
        0,
      );
      console.log("📚 Total posts: " + total);
      console.log("   Categories: " + Object.keys(contentStats.stats).length);

      // Show breakdown
      Object.entries(contentStats.stats).forEach(function (entry) {
        const category = entry[0];
        const count = entry[1];
        console.log("   " + category + ": " + count + " posts");
      });
    }

    // Overall status
    console.log("\n" + "=".repeat(50));
    console.log("🎯 OVERALL STATUS:");

    const rssActive = minutesSinceLastPost <= 20;
    let statsActive = false;
    try {
      const simpleStats = await makeRequest(API_BASE_URL + "/api/simple-stats");
      if (simpleStats.lastUpdated) {
        const statsAge =
          (now - new Date(simpleStats.lastUpdated)) / (1000 * 60);
        statsActive = statsAge <= 10;
      }
    } catch (error) {
      statsActive = false; // Non-critical
    }

    if (rssActive && statsActive) {
      console.log("🟢 FULLY AUTOMATED - All systems operational!");
      console.log("✅ RSS feeds updating automatically every 15 minutes");
      console.log("✅ Network stats updating every 5 minutes");
    } else if (statsActive && !rssActive) {
      console.log("🟡 PARTIALLY AUTOMATED - Network stats working");
      console.log("⚠️  RSS feeds may need attention");
      console.log("💡 Try manual trigger:");
      console.log("   curl " + API_BASE_URL + "/api/cron/trigger-fetch");
    } else if (!statsActive && !rssActive) {
      console.log("🔴 AUTOMATION INACTIVE");
      console.log("❌ Both RSS feeds and network stats need attention");
      console.log("💡 Check environment variables: CRON_SECRET, ADMIN_KEY");
    } else {
      console.log("🟠 MIXED STATUS - Some systems working");
    }

    console.log("\n⏰ Next check recommended in 15-30 minutes");
    console.log("📝 Run: node scripts/check-automation.js");
  } catch (error) {
    console.log("❌ Error checking automation: " + error.message);
  }
}

// Run if called directly
if (require.main === module) {
  checkAutomation();
}

module.exports = { checkAutomation };
