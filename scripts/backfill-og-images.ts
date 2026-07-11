// One-time script: backfill OG images for posts missing image_url
// Run: export $(grep POSTGRES_URL .env.local | tr -d '"') && npx tsx scripts/backfill-og-images.ts

import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false },
});

const BATCH_SIZE = 50;
const FETCH_TIMEOUT = 5000;
const DELAY_MS = 150;

function extractOgImage(html: string): string | null {
  // Match og:image with property/content in either order
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<meta[^>]+property=["']og:image:secure_url["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image:secure_url["']/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      const url = match[1].trim();
      try {
        new URL(url);
        if (url.length < 2048) return url;
      } catch {
        // invalid URL, skip
      }
    }
  }
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const { rows: stats } = await pool.query(
    "SELECT COUNT(*) AS total, COUNT(image_url) AS with_image FROM posts"
  );
  console.log(`Before: ${stats[0].with_image}/${stats[0].total} posts have images`);

  const { rows: posts } = await pool.query(
    "SELECT id, url FROM posts WHERE image_url IS NULL ORDER BY pub_date DESC"
  );
  console.log(`Posts to process: ${posts.length}`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

      const response = await fetch(post.url, {
        signal: controller.signal,
        headers: { "User-Agent": "EthereumGazette-ImageBackfill/1.0" },
        redirect: "follow",
      });
      clearTimeout(timeout);

      if (!response.ok) {
        failed++;
        continue;
      }

      const html = await response.text();
      const imageUrl = extractOgImage(html);

      if (!imageUrl) {
        skipped++;
        continue;
      }

      await pool.query("UPDATE posts SET image_url = $1 WHERE id = $2", [
        imageUrl,
        post.id,
      ]);
      updated++;

      if ((i + 1) % BATCH_SIZE === 0) {
        console.log(`Progress: ${i + 1}/${posts.length} (updated: ${updated}, skipped: ${skipped}, failed: ${failed})`);
      }
    } catch {
      failed++;
    }

    await sleep(DELAY_MS);
  }

  const { rows: after } = await pool.query(
    "SELECT COUNT(*) AS total, COUNT(image_url) AS with_image FROM posts"
  );

  console.log(`\nDone!`);
  console.log(`Updated: ${updated}, Skipped (no OG): ${skipped}, Failed: ${failed}`);
  console.log(`After: ${after[0].with_image}/${after[0].total} posts have images`);

  await pool.end();
}

main().catch((e) => {
  console.error("Fatal error:", e);
  pool.end();
  process.exit(1);
});
