#!/usr/bin/env node

/**
 * Content Validation Script for Ethereum Gazette
 *
 * This script validates content quality metrics including:
 * - Character limits (110 title, 270 snippet)
 * - Category distribution
 * - Content freshness
 * - Source diversity
 *
 * Usage: node validate-content.js [--verbose] [--category=all]
 */

const https = require("https");
const fs = require("fs");

// Configuration
const API_BASE_URL = "https://ethereumgazette.com";
const LIMITS = {
  title: 110,
  snippet: 270,
};

const CATEGORIES = [
  "all",
  "news",
  "communities",
  "projects",
  "education",
  "people",
  "events",
  "grants",
  "daos",
  "orgs",
  "jobs",
  "media",
];

// Parse command line arguments
const args = process.argv.slice(2);
const verbose = args.includes("--verbose");
const categoryArg = args.find((arg) => arg.startsWith("--category="));
const categoryFilter = categoryArg ? categoryArg.split("=")[1] : "all";
const limitArg = args.find((arg) => arg.startsWith("--limit="));
const limit = limitArg ? limitArg.split("=")[1] : "100";

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
          : "ℹ️";
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function logVerbose(message) {
  if (verbose) {
    console.log(`   ${message}`);
  }
}

// Validation functions
function validateCharacterLimits(posts) {
  const results = {
    total: posts.length,
    titleViolations: 0,
    snippetViolations: 0,
    violations: [],
  };

  posts.forEach((post) => {
    const titleLength = (post.title && post.title.length) || 0;
    const snippetLength = (post.snippet && post.snippet.length) || 0;

    if (titleLength > LIMITS.title) {
      results.titleViolations++;
      results.violations.push({
        id: post.id,
        type: "title",
        length: titleLength,
        limit: LIMITS.title,
        content: (post.title && post.title.substring(0, 50)) + "...",
      });
    }

    if (snippetLength > LIMITS.snippet) {
      results.snippetViolations++;
      results.violations.push({
        id: post.id,
        type: "snippet",
        length: snippetLength,
        limit: LIMITS.snippet,
        content: (post.snippet && post.snippet.substring(0, 50)) + "...",
      });
    }

    logVerbose(
      `${post.id}: Title(${titleLength}/${LIMITS.title}) Snippet(${snippetLength}/${LIMITS.snippet}) - ${post.source}`,
    );
  });

  return results;
}

function validateCategoryDistribution(posts) {
  const distribution = {};
  const sources = new Set();

  posts.forEach((post) => {
    distribution[post.category] = (distribution[post.category] || 0) + 1;
    sources.add(post.source);
  });

  return {
    distribution,
    totalCategories: Object.keys(distribution).length,
    totalSources: sources.size,
    sourceList: Array.from(sources).sort(),
  };
}

function validateContentFreshness(posts) {
  const now = new Date();
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const freshness = {
    last24h: 0,
    lastWeek: 0,
    older: 0,
    oldest: null,
    newest: null,
  };

  posts.forEach((post) => {
    const postDate = new Date(post.pubDate || post.date);

    if (postDate > oneDayAgo) {
      freshness.last24h++;
    } else if (postDate > oneWeekAgo) {
      freshness.lastWeek++;
    } else {
      freshness.older++;
    }

    if (!freshness.oldest || postDate < new Date(freshness.oldest)) {
      freshness.oldest = postDate.toISOString();
    }

    if (!freshness.newest || postDate > new Date(freshness.newest)) {
      freshness.newest = postDate.toISOString();
    }
  });

  return freshness;
}

function validateContentQuality(posts) {
  const quality = {
    emptyTitles: 0,
    emptySnippets: 0,
    duplicateTitles: 0,
    suspiciousContent: 0,
  };

  const titleSet = new Set();

  posts.forEach((post) => {
    // Check for empty content
    if (!post.title || post.title.trim().length === 0) {
      quality.emptyTitles++;
    }

    if (!post.snippet || post.snippet.trim().length === 0) {
      quality.emptySnippets++;
    }

    // Check for duplicate titles
    const normalizedTitle = post.title && post.title.toLowerCase().trim();
    if (titleSet.has(normalizedTitle)) {
      quality.duplicateTitles++;
    } else {
      titleSet.add(normalizedTitle);
    }

    // Check for suspicious content patterns
    const suspiciousPatterns = [
      /^\s*submitted by\s*$/i,
      /^\s*\[link\]\s*\[comments\]\s*$/i,
      /error|failed|timeout/i,
    ];

    const titleToTest = post.title || "";
    if (suspiciousPatterns.some((pattern) => pattern.test(titleToTest))) {
      quality.suspiciousContent++;
    }
  });

  return quality;
}

// Performance testing
async function testPerformance() {
  const tests = [
    { name: "Posts API (limit=20)", url: `${API_BASE_URL}/api/posts?limit=20` },
    {
      name: "Category News",
      url: `${API_BASE_URL}/api/posts?category=news&limit=10`,
    },
    { name: "Stats API", url: `${API_BASE_URL}/api/posts?stats=true` },
  ];

  const results = {};

  for (const test of tests) {
    const startTime = Date.now();
    try {
      await makeRequest(test.url);
      const endTime = Date.now();
      results[test.name] = {
        success: true,
        responseTime: endTime - startTime,
        status: endTime - startTime < 500 ? "PASS" : "WARN",
      };
    } catch (error) {
      results[test.name] = {
        success: false,
        error: error.message,
        status: "FAIL",
      };
    }
  }

  return results;
}

// Main validation function
async function runValidation() {
  log(`Starting content validation for category: ${categoryFilter}`);

  try {
    // Fetch posts
    log("Fetching posts from API...");
    const url =
      categoryFilter === "all"
        ? `${API_BASE_URL}/api/posts?limit=${limit}`
        : `${API_BASE_URL}/api/posts?category=${categoryFilter}&limit=${limit}`;

    const response = await makeRequest(url);

    if (!response.success || !response.data) {
      throw new Error("Invalid API response");
    }

    const posts = response.data;
    log(`Fetched ${posts.length} posts successfully`, "success");

    // Run validations
    log("Running character limit validation...");
    const charLimits = validateCharacterLimits(posts);

    log("Analyzing category distribution...");
    const categoryDist = validateCategoryDistribution(posts);

    log("Checking content freshness...");
    const freshness = validateContentFreshness(posts);

    log("Validating content quality...");
    const quality = validateContentQuality(posts);

    log("Testing API performance...");
    const performance = await testPerformance();

    // Generate report
    console.log("\n" + "=".repeat(80));
    console.log("ETHEREUM WORLD CONTENT VALIDATION REPORT");
    console.log("=".repeat(80));

    // Character Limits
    console.log("\n📏 CHARACTER LIMITS");
    console.log(`Total posts analyzed: ${charLimits.total}`);
    console.log(
      `Title violations (>${LIMITS.title}): ${charLimits.titleViolations} ${charLimits.titleViolations === 0 ? "✅" : "❌"}`,
    );
    console.log(
      `Snippet violations (>${LIMITS.snippet}): ${charLimits.snippetViolations} ${charLimits.snippetViolations === 0 ? "✅" : "❌"}`,
    );

    if (charLimits.violations.length > 0 && verbose) {
      console.log("\nViolations:");
      charLimits.violations.forEach((v) => {
        console.log(
          `  ${v.id}: ${v.type} (${v.length}/${v.limit}) - ${v.content}`,
        );
      });
    }

    // Category Distribution
    console.log("\n📊 CATEGORY DISTRIBUTION");
    console.log(`Total categories: ${categoryDist.totalCategories}`);
    console.log(`Total sources: ${categoryDist.totalSources}`);
    Object.entries(categoryDist.distribution).forEach(([cat, count]) => {
      const percentage = ((count / posts.length) * 100).toFixed(1);
      console.log(`  ${cat}: ${count} posts (${percentage}%)`);
    });

    if (verbose) {
      console.log("\nActive sources:");
      categoryDist.sourceList.forEach((source) => {
        console.log(`  - ${source}`);
      });
    }

    // Content Freshness
    console.log("\n📅 CONTENT FRESHNESS");
    console.log(`Last 24 hours: ${freshness.last24h} posts`);
    console.log(`Last week: ${freshness.lastWeek} posts`);
    console.log(`Older: ${freshness.older} posts`);
    console.log(`Newest post: ${freshness.newest}`);
    console.log(`Oldest post: ${freshness.oldest}`);

    // Content Quality
    console.log("\n🔍 CONTENT QUALITY");
    console.log(
      `Empty titles: ${quality.emptyTitles} ${quality.emptyTitles === 0 ? "✅" : "❌"}`,
    );
    console.log(
      `Empty snippets: ${quality.emptySnippets} ${quality.emptySnippets === 0 ? "✅" : "❌"}`,
    );
    console.log(
      `Duplicate titles: ${quality.duplicateTitles} ${quality.duplicateTitles === 0 ? "✅" : "❌"}`,
    );
    console.log(`Suspicious content: ${quality.suspiciousContent}`);

    // Performance
    console.log("\n⚡ API PERFORMANCE");
    Object.entries(performance).forEach(([test, result]) => {
      if (result.success) {
        const status =
          result.status === "PASS"
            ? "✅"
            : result.status === "WARN"
              ? "⚠️"
              : "❌";
        console.log(`${test}: ${result.responseTime}ms ${status}`);
      } else {
        console.log(`${test}: FAILED - ${result.error} ❌`);
      }
    });

    // Overall Assessment
    console.log("\n🎯 OVERALL ASSESSMENT");
    const issues = [];

    if (charLimits.titleViolations > 0)
      issues.push("Character limit violations");
    if (quality.emptyTitles > 0 || quality.emptySnippets > 0)
      issues.push("Empty content detected");
    if (quality.duplicateTitles > 0) issues.push("Duplicate titles found");
    if (freshness.last24h < posts.length * 0.1)
      issues.push("Content not fresh enough");
    if (categoryDist.totalSources < 10) issues.push("Low source diversity");

    if (issues.length === 0) {
      console.log("✅ All quality checks PASSED");
    } else {
      console.log("❌ Issues found:");
      issues.forEach((issue) => console.log(`   - ${issue}`));
    }

    // Save detailed report if verbose
    if (verbose) {
      const reportData = {
        timestamp: new Date().toISOString(),
        category: categoryFilter,
        totalPosts: posts.length,
        characterLimits: charLimits,
        categoryDistribution: categoryDist,
        contentFreshness: freshness,
        contentQuality: quality,
        performance: performance,
      };

      const reportPath = `validation-report-${Date.now()}.json`;
      fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
      console.log(`\nDetailed report saved to: ${reportPath}`);
    }
  } catch (error) {
    log(`Validation failed: ${error.message}`, "error");
    process.exit(1);
  }
}

// Run the validation
if (require.main === module) {
  runValidation();
}

module.exports = {
  validateCharacterLimits,
  validateCategoryDistribution,
  validateContentFreshness,
  validateContentQuality,
  testPerformance,
};
