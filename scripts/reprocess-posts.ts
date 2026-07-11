// One-time script: reprocess latest 200 posts
// - Truncate titles to 50 chars, snippets to 150 chars
// - Backfill missing image_url via OG image extraction
// - Dry-run mode: pass --dry-run flag to preview changes
// Run: export $(grep POSTGRES_URL .env.local | tr -d '"') && npx tsx scripts/reprocess-posts.ts

import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false },
});

const MAX_TITLE = 50;
const MAX_SNIPPET = 150;
const FETCH_TIMEOUT = 5000;
const DELAY_MS = 150;
const DRY_RUN = process.argv.includes("--dry-run");

function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > maxLength * 0.6 ? truncated.substring(0, lastSpace) : truncated) + "...";
}

function extractOgImage(html: string): string | null {
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
        // invalid URL
      }
    }
  }
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log(DRY_RUN ? "=== DRY RUN ===" : "=== LIVE RUN ===");

  const { rows: posts } = await pool.query(
    "SELECT id, title, snippet, url, image_url FROM posts ORDER BY pub_date DESC LIMIT 200"
  );
  console.log(`Posts to process: ${posts.length}`);

  let titlesTruncated = 0;
  let snippetsTruncated = 0;
  let imagesBackfilled = 0;
  let imageFailed = 0;

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const updates: string[] = [];
    const values: any[] = [];
    let paramIdx = 1;

    // Check title
    if (post.title && post.title.length > MAX_TITLE) {
      const newTitle = truncateText(post.title, MAX_TITLE);
      updates.push(`title = $${paramIdx++}`);
      values.push(newTitle);
      titlesTruncated++;
      if (DRY_RUN) console.log(`  [title] "${post.title.substring(0, 60)}..." → "${newTitle}"`);
    }

    // Check snippet
    if (post.snippet && post.snippet.length > MAX_SNIPPET) {
      const newSnippet = truncateText(post.snippet, MAX_SNIPPET);
      updates.push(`snippet = $${paramIdx++}`);
      values.push(newSnippet);
      snippetsTruncated++;
    }

    // Backfill image if missing
    if (!post.image_url) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

        const response = await fetch(post.url, {
          signal: controller.signal,
          headers: { "User-Agent": "EthereumGazette-Reprocess/1.0" },
          redirect: "follow",
        });
        clearTimeout(timeout);

        if (response.ok) {
          const html = await response.text();
          const imageUrl = extractOgImage(html);
          if (imageUrl) {
            updates.push(`image_url = $${paramIdx++}`);
            values.push(imageUrl);
            imagesBackfilled++;
          }
        } else {
          imageFailed++;
        }
      } catch {
        imageFailed++;
      }
      await sleep(DELAY_MS);
    }

    // Apply updates
    if (updates.length > 0 && !DRY_RUN) {
      values.push(post.id);
      await pool.query(
        `UPDATE posts SET ${updates.join(", ")} WHERE id = $${paramIdx}`,
        values
      );
    }

    if ((i + 1) % 50 === 0) {
      console.log(`Progress: ${i + 1}/${posts.length}`);
    }
  }

  console.log(`\nDone!`);
  console.log(`Titles truncated: ${titlesTruncated}`);
  console.log(`Snippets truncated: ${snippetsTruncated}`);
  console.log(`Images backfilled: ${imagesBackfilled}`);
  console.log(`Image fetch failed: ${imageFailed}`);

  await pool.end();
}

main().catch((e) => {
  console.error("Fatal error:", e);
  pool.end();
  process.exit(1);
});
