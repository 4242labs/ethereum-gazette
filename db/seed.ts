// Database seed script - Populate feed_sources table from feed-sources.json
// Usage: ts-node db/seed.ts

import { readFileSync } from "fs";
import { join } from "path";
import { Client } from "pg";

interface FeedSourceJson {
  id: number;
  name: string;
  url: string;
  category: string;
  description?: string;
  enabled: boolean;
  priority: number;
  updateInterval: number;
}

interface FeedSourcesData {
  sources: FeedSourceJson[];
  lastUpdated: string;
}

/**
 * Load feed sources from JSON file
 */
function loadFeedSources(): FeedSourceJson[] {
  const filePath = join(__dirname, "../data/feed-sources.json");
  const fileContent = readFileSync(filePath, "utf-8");
  const data: FeedSourcesData = JSON.parse(fileContent);
  return data.sources;
}

/**
 * Seed feed_sources table
 */
async function seedFeedSources() {
  console.log("🌱 Starting database seed...\n");

  if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
    console.error(
      "❌ Error: DATABASE_URL or POSTGRES_URL environment variable not set",
    );
    process.exit(1);
  }

  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  const client = new Client({
    connectionString,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : undefined,
  });

  try {
    // Connect
    await client.connect();
    console.log("✅ Database connected\n");

    // Load sources from JSON
    console.log("Loading feed sources from JSON...");
    const sources = loadFeedSources();
    console.log(`📦 Loaded ${sources.length} feed sources\n`);

    // Insert sources
    console.log("Inserting feed sources...");
    let insertedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (const source of sources) {
      try {
        const query = `
          INSERT INTO feed_sources (
            name, url, category, description, enabled, priority, update_interval
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7
          )
          ON CONFLICT (url) DO UPDATE SET
            name = EXCLUDED.name,
            category = EXCLUDED.category,
            description = EXCLUDED.description,
            enabled = EXCLUDED.enabled,
            priority = EXCLUDED.priority,
            update_interval = EXCLUDED.update_interval,
            updated_at = NOW()
          RETURNING (xmax = 0) AS inserted
        `;

        const values = [
          source.name,
          source.url,
          source.category,
          source.description || null,
          source.enabled,
          source.priority,
          source.updateInterval,
        ];

        const res = await client.query(query, values);

        if (res.rows[0].inserted) {
          insertedCount++;
          console.log(`  ✅ Inserted: ${source.name}`);
        } else {
          updatedCount++;
          console.log(`  🔄 Updated: ${source.name}`);
        }
      } catch (error: any) {
        errorCount++;
        console.error(`  ❌ Error with ${source.name}:`, error.message);
      }
    }

    console.log("\n📊 Seed Summary:");
    console.log(`   Inserted: ${insertedCount}`);
    console.log(`   Updated: ${updatedCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Total: ${sources.length}`);

    // Verify
    console.log("\n🔍 Verifying...");
    const countRes = await client.query(
      "SELECT COUNT(*) as count FROM feed_sources",
    );
    console.log(`   Total sources in database: ${countRes.rows[0].count}`);

    const enabledRes = await client.query(
      "SELECT COUNT(*) as count FROM feed_sources WHERE enabled = true",
    );
    console.log(`   Enabled sources: ${enabledRes.rows[0].count}`);

    console.log("\n✨ Seed completed successfully!");
  } catch (error) {
    console.error("\n❌ Seed failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

/**
 * Main execution
 */
if (require.main === module) {
  seedFeedSources()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

export { seedFeedSources };
