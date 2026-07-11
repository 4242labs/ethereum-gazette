#!/usr/bin/env node

/**
 * Featured Content Sync Script
 *
 * Syncs featured content from YAML configuration to the application.
 * This script reads the featured-content.yml file and updates the
 * frontend data structure accordingly.
 *
 * Usage: node sync-featured.js [--dry-run] [--verbose]
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

// Simple YAML parser for our specific format
function parseYAML(yamlContent) {
  const lines = yamlContent.split("\n");
  const result = { featured_items: [] };

  let currentItem = null;
  let inFeaturedItems = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (trimmed.startsWith("#") || trimmed === "") continue;

    if (trimmed === "featured_items:") {
      inFeaturedItems = true;
      continue;
    }

    if (!inFeaturedItems) continue;

    // New item starts with dash
    if (trimmed.startsWith("- id:")) {
      if (currentItem) {
        result.featured_items.push(currentItem);
      }
      currentItem = {};
      const idMatch = trimmed.match(/- id:\s*["']?([^"']+)["']?/);
      if (idMatch) currentItem.id = idMatch[1];
      continue;
    }

    // Parse other properties
    if (currentItem && trimmed.includes(":")) {
      const colonIndex = trimmed.indexOf(":");
      const key = trimmed.substring(0, colonIndex).trim();
      let value = trimmed.substring(colonIndex + 1).trim();

      // Remove quotes
      value = value.replace(/^["']|["']$/g, "");

      // Handle null values
      if (value === "null") {
        value = undefined;
      } else if (value === "true") {
        value = true;
      } else if (value === "false") {
        value = false;
      } else if (!isNaN(value) && value !== "") {
        value = parseInt(value);
      }

      currentItem[key] = value;
    }
  }

  // Add the last item
  if (currentItem) {
    result.featured_items.push(currentItem);
  }

  return result;
}

// Validation functions
function validateFeaturedItem(item, index) {
  const errors = [];

  if (!item.id) {
    errors.push(`Item ${index + 1}: Missing required field 'id'`);
  }

  if (!item.title) {
    errors.push(`Item ${index + 1}: Missing required field 'title'`);
  }

  if (!item.description) {
    errors.push(`Item ${index + 1}: Missing required field 'description'`);
  }

  if (!item.url) {
    errors.push(`Item ${index + 1}: Missing required field 'url'`);
  }

  if (!item.category) {
    errors.push(`Item ${index + 1}: Missing required field 'category'`);
  }

  if (item.level !== 1 && item.level !== 2) {
    errors.push(`Item ${index + 1}: Level must be 1 or 2, got ${item.level}`);
  }

  // Character limit validation
  if (item.level === 1) {
    if (item.title && item.title.length > 100) {
      errors.push(
        `Item ${index + 1}: Level 1 title exceeds 100 characters (${item.title.length})`,
      );
    }
    if (item.description && item.description.length > 200) {
      errors.push(
        `Item ${index + 1}: Level 1 description exceeds 200 characters (${item.description.length})`,
      );
    }
  } else if (item.level === 2) {
    if (item.title && item.title.length > 50) {
      errors.push(
        `Item ${index + 1}: Level 2 title exceeds 50 characters (${item.title.length})`,
      );
    }
    if (item.description && item.description.length > 100) {
      errors.push(
        `Item ${index + 1}: Level 2 description exceeds 100 characters (${item.description.length})`,
      );
    }
  }

  // Category validation
  const validCategories = [
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

  if (item.category && !validCategories.includes(item.category)) {
    errors.push(
      `Item ${index + 1}: Invalid category '${item.category}'. Valid categories: ${validCategories.join(", ")}`,
    );
  }

  // URL validation
  if (item.url && !item.url.match(/^https?:\/\/.+/)) {
    errors.push(`Item ${index + 1}: Invalid URL format '${item.url}'`);
  }

  return errors;
}

function validateFeaturedContent(config) {
  const errors = [];
  const activeItems = config.featured_items.filter((item) => item.active);

  // Check for required structure
  if (!config.featured_items || !Array.isArray(config.featured_items)) {
    errors.push("Invalid YAML structure: featured_items must be an array");
    return errors;
  }

  // Validate each item
  config.featured_items.forEach((item, index) => {
    const itemErrors = validateFeaturedItem(item, index);
    errors.push(...itemErrors);
  });

  // Check active item distribution
  const activeLevelOnes = activeItems.filter((item) => item.level === 1);
  const activeLevelTwos = activeItems.filter((item) => item.level === 2);

  if (activeLevelOnes.length !== 1) {
    errors.push(
      `Must have exactly 1 active level 1 item, found ${activeLevelOnes.length}`,
    );
  }

  if (activeLevelTwos.length !== 3) {
    errors.push(
      `Must have exactly 3 active level 2 items, found ${activeLevelTwos.length}`,
    );
  }

  // Check for duplicate IDs
  const ids = config.featured_items.map((item) => item.id);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    errors.push(`Duplicate IDs found: ${duplicateIds.join(", ")}`);
  }

  return errors;
}

// Convert to frontend format
function convertToFrontendFormat(config) {
  const activeItems = config.featured_items
    .filter((item) => item.active)
    .sort((a, b) => (a.priority || 999) - (b.priority || 999));

  return activeItems.map((item) => ({
    id: item.id,
    category: item.category,
    title: item.title,
    description: item.description,
    badge: item.badge || undefined,
    url: item.url,
    imageUrl: item.imageUrl || undefined,
    featuredLevel: item.level,
  }));
}

// Backup current featured.ts
function backupCurrentFeatured() {
  const featuredPath = path.join(__dirname, "../app/src/data/featured.ts");
  const backupPath = path.join(__dirname, `featured-backup-${Date.now()}.ts`);

  if (fs.existsSync(featuredPath)) {
    fs.copyFileSync(featuredPath, backupPath);
    return backupPath;
  }

  return null;
}

// Update featured.ts file
function updateFeaturedFile(frontendData) {
  const featuredPath = path.join(__dirname, "../app/src/data/featured.ts");

  const content = `// Featured content for right sidebar
// This file is auto-generated from admin/featured-content.yml
// Do not edit manually - run 'node admin/sync-featured.js' to update
//
// Last updated: ${new Date().toISOString()}

import type { FeaturedItem } from "@/types";

export const featuredItems: FeaturedItem[] = ${JSON.stringify(frontendData, null, 2)};

// Helper function to get featured posts (for backward compatibility)
export const getFeaturedPosts = (): FeaturedItem[] => {
  return featuredItems;
};

// Get primary featured item (Level 1)
export const getPrimaryFeatured = (): FeaturedItem | undefined => {
  return featuredItems.find((item) => item.featuredLevel === 1);
};

// Get secondary featured items (Level 2)
export const getSecondaryFeatured = (): FeaturedItem[] => {
  return featuredItems.filter((item) => item.featuredLevel === 2);
};
`;

  fs.writeFileSync(featuredPath, content);
}

// Logging utilities
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
  if (process.argv.includes("--verbose")) {
    console.log(`   ${message}`);
  }
}

// Main sync function
async function syncFeaturedContent() {
  const isDryRun = process.argv.includes("--dry-run");
  const isVerbose = process.argv.includes("--verbose");

  log("Starting featured content sync...");

  try {
    // Read YAML configuration
    const yamlPath = path.join(__dirname, "featured-content.yml");
    if (!fs.existsSync(yamlPath)) {
      throw new Error(`Configuration file not found: ${yamlPath}`);
    }

    const yamlContent = fs.readFileSync(yamlPath, "utf8");
    log("YAML configuration loaded");

    // Parse YAML
    const config = parseYAML(yamlContent);
    logVerbose(`Parsed ${config.featured_items.length} featured items`);

    // Validate configuration
    log("Validating configuration...");
    const errors = validateFeaturedContent(config);

    if (errors.length > 0) {
      log("Validation failed:", "error");
      errors.forEach((error) => console.log(`   ❌ ${error}`));
      process.exit(1);
    }

    log("Configuration validation passed", "success");

    // Convert to frontend format
    const frontendData = convertToFrontendFormat(config);
    logVerbose(`Converted to ${frontendData.length} active featured items`);

    if (isVerbose) {
      console.log("\nFeatured items to sync:");
      frontendData.forEach((item) => {
        console.log(`   - ${item.title} (Level ${item.featuredLevel})`);
      });
    }

    if (isDryRun) {
      log(
        "DRY RUN: Would update featured.ts with the following content:",
        "warn",
      );
      console.log(JSON.stringify(frontendData, null, 2));
      return;
    }

    // Backup current file
    const backupPath = backupCurrentFeatured();
    if (backupPath) {
      logVerbose(`Created backup: ${path.basename(backupPath)}`);
    }

    // Update featured.ts
    log("Updating featured.ts file...");
    updateFeaturedFile(frontendData);

    log("Featured content sync completed successfully!", "success");
    log(`Updated ${frontendData.length} featured items`);

    // Summary
    const levelOnes = frontendData.filter((item) => item.featuredLevel === 1);
    const levelTwos = frontendData.filter((item) => item.featuredLevel === 2);

    console.log("\nSync Summary:");
    console.log(`   Level 1 items: ${levelOnes.length}`);
    console.log(`   Level 2 items: ${levelTwos.length}`);
    console.log(`   Total active: ${frontendData.length}`);

    if (backupPath) {
      console.log(`   Backup created: ${path.basename(backupPath)}`);
    }

    console.log("\nNext steps:");
    console.log("   1. Review the changes in app/src/data/featured.ts");
    console.log("   2. Test locally to ensure everything looks correct");
    console.log("   3. Commit and deploy the changes");
  } catch (error) {
    log(`Sync failed: ${error.message}`, "error");
    process.exit(1);
  }
}

// CLI help
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
Featured Content Sync Tool

Usage: node sync-featured.js [options]

Options:
  --dry-run     Show what would be changed without making changes
  --verbose     Show detailed output
  --help, -h    Show this help message

Examples:
  node admin/sync-featured.js                    # Sync featured content
  node admin/sync-featured.js --dry-run          # Preview changes
  node admin/sync-featured.js --verbose          # Show detailed output
  node admin/sync-featured.js --dry-run --verbose # Preview with details

Configuration:
  Edit admin/featured-content.yml to change featured content.

Character Limits:
  Level 1: Title ≤100 chars, Description ≤200 chars
  Level 2: Title ≤50 chars, Description ≤100 chars

Requirements:
  - Exactly 1 active level 1 item
  - Exactly 3 active level 2 items
  - All items must have valid URLs and categories
`);
  process.exit(0);
}

// Run the sync
if (require.main === module) {
  syncFeaturedContent();
}

module.exports = {
  parseYAML,
  validateFeaturedContent,
  convertToFrontendFormat,
  syncFeaturedContent,
};
