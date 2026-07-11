// Database seed script - Populate feed_sources table from feed-sources.json
// Usage: node db/seed.js

const { readFileSync } = require('fs');
const { join } = require('path');

/**
 * Load feed sources from JSON file
 */
function loadFeedSources() {
  const filePath = join(__dirname, '../data/feed-sources.json');
  const fileContent = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(fileContent);
  return data.sources;
}

/**
 * Seed feed_sources table using node-postgres
 */
async function seedFeedSources() {
  console.log('🌱 Starting database seed...\n');

  // Check for DATABASE_URL
  if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
    console.error('❌ Error: DATABASE_URL or POSTGRES_URL environment variable not set');
    console.error('\nUsage:');
    console.error('  DATABASE_URL="your-connection-string" node db/seed.js');
    process.exit(1);
  }

  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  // Use pg library if available, otherwise use @vercel/postgres
  let client;
  let usePg = false;

  try {
    // Try using pg first
    const { Client } = require('pg');
    client = new Client({ connectionString });
    usePg = true;
    console.log('Using pg library...');
  } catch (e) {
    // Fallback to manual fetch-based approach
    console.log('Using fetch-based approach...');
  }

  try {
    if (usePg) {
      // Connect using pg
      await client.connect();
      console.log('✅ Database connected\n');

      // Load sources from JSON
      console.log('Loading feed sources from JSON...');
      const sources = loadFeedSources();
      console.log(`📦 Loaded ${sources.length} feed sources\n`);

      // Insert sources
      console.log('Inserting feed sources...');
      let insertedCount = 0;
      let updatedCount = 0;
      let errorCount = 0;

      for (const source of sources) {
        try {
          const query = `
            INSERT INTO feed_sources (
              name,
              url,
              category,
              description,
              enabled,
              priority,
              update_interval
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
            source.updateInterval
          ];

          const result = await client.query(query, values);

          if (result.rows[0].inserted) {
            insertedCount++;
            console.log(`  ✅ Inserted: ${source.name}`);
          } else {
            updatedCount++;
            console.log(`  🔄 Updated: ${source.name}`);
          }
        } catch (error) {
          errorCount++;
          console.error(`  ❌ Error with ${source.name}:`, error.message);
        }
      }

      console.log('\n📊 Seed Summary:');
      console.log(`   Inserted: ${insertedCount}`);
      console.log(`   Updated: ${updatedCount}`);
      console.log(`   Errors: ${errorCount}`);
      console.log(`   Total: ${sources.length}`);

      // Verify
      console.log('\n🔍 Verifying...');
      const countResult = await client.query('SELECT COUNT(*) as count FROM feed_sources');
      console.log(`   Total sources in database: ${countResult.rows[0].count}`);

      const enabledResult = await client.query('SELECT COUNT(*) as count FROM feed_sources WHERE enabled = true');
      console.log(`   Enabled sources: ${enabledResult.rows[0].count}`);

      console.log('\n✨ Seed completed successfully!');

      await client.end();
    }
  } catch (error) {
    console.error('\n❌ Seed failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure DATABASE_URL is set correctly');
    console.error('2. Verify database connection string format');
    console.error('3. Ensure migrations have been run (tables exist)');
    console.error('4. Install pg: npm install pg');
    process.exit(1);
  }
}

/**
 * Main execution
 */
seedFeedSources()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
