#!/usr/bin/env node

/**
 * Simple script to import Vitalik's latest 20 posts
 * This script can run locally and connects directly to Supabase
 */

const https = require('https');
const crypto = require('crypto');

// Supabase configuration - update these with your values
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

// Vitalik's RSS feed
const VITALIK_FEED_URL = 'https://vitalik.eth.limo/feed.xml';
const VITALIK_SOURCE = 'Vitalik Buterin\'s Blog';

/**
 * Simple HTTP GET function
 */
function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

/**
 * Make Supabase API request
 */
function supabaseRequest(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, SUPABASE_URL);
    const options = {
      method,
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      }
    };

    const req = https.request(url, options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = responseData ? JSON.parse(responseData) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Simple XML parser for RSS feeds
 */
function parseRSSItem(itemXml) {
  const getTag = (xml, tag) => {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1].trim() : null;
  };

  const title = getTag(itemXml, 'title');
  const link = getTag(itemXml, 'link');
  const description = getTag(itemXml, 'description');
  const pubDate = getTag(itemXml, 'pubDate');

  if (!title || !link) return null;

  return {
    title: title.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim(),
    link: link.trim(),
    description: description ? description.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/<[^>]*>/g, '').trim() : '',
    pubDate: new Date(pubDate)
  };
}

/**
 * Parse RSS feed
 */
function parseRSSFeed(xmlString) {
  const items = [];
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xmlString)) !== null) {
    const item = parseRSSItem(match[1]);
    if (item) {
      items.push(item);
    }
  }

  return items;
}

/**
 * Generate content ID
 */
function generateContentId(url, pubDate) {
  const input = url + pubDate.toISOString();
  return crypto.createHash('sha256').update(input).digest('hex').slice(0, 16);
}

/**
 * Truncate text to specified length
 */
function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Check existing posts
 */
async function checkExistingPosts() {
  try {
    console.log('📊 Checking existing Vitalik posts...');

    const posts = await supabaseRequest(
      `/rest/v1/posts?source=eq.${encodeURIComponent(VITALIK_SOURCE)}&select=title,pub_date,url&order=pub_date.desc&limit=5`
    );

    console.log(`   Found ${posts.length} existing posts`);

    if (posts.length > 0) {
      console.log('   Recent posts:');
      posts.forEach((post, i) => {
        const date = new Date(post.pub_date).toISOString().split('T')[0];
        console.log(`   ${i + 1}. ${post.title} (${date})`);
      });
    }

    return posts.map(p => p.url); // Return URLs for deduplication
  } catch (error) {
    console.log('   No existing posts found or error occurred:', error.message);
    return [];
  }
}

/**
 * Insert posts into database
 */
async function insertPosts(posts) {
  if (posts.length === 0) {
    console.log('📝 No new posts to insert');
    return 0;
  }

  try {
    console.log(`📝 Inserting ${posts.length} new posts...`);

    // Insert posts one by one to handle conflicts gracefully
    let insertedCount = 0;

    for (const post of posts) {
      try {
        await supabaseRequest('/rest/v1/posts', 'POST', post);
        insertedCount++;
        console.log(`   ✅ ${post.title}`);
      } catch (error) {
        if (error.message.includes('duplicate') || error.message.includes('conflict')) {
          console.log(`   🔄 ${post.title} (already exists)`);
        } else {
          console.log(`   ❌ ${post.title} (error: ${error.message})`);
        }
      }
    }

    return insertedCount;
  } catch (error) {
    console.error('Error inserting posts:', error.message);
    return 0;
  }
}

/**
 * Main import function
 */
async function importVitalikPosts() {
  console.log('🚀 Starting Vitalik blog import...');
  console.log(`📡 Fetching from: ${VITALIK_FEED_URL}`);

  try {
    // Step 1: Check existing posts
    const existingUrls = await checkExistingPosts();

    // Step 2: Fetch RSS feed
    console.log('\n📡 Fetching RSS feed...');
    const xmlString = await httpsGet(VITALIK_FEED_URL);
    console.log('✅ RSS feed fetched successfully');

    // Step 3: Parse RSS
    console.log('📄 Parsing RSS items...');
    const rssItems = parseRSSFeed(xmlString);
    console.log(`✅ Parsed ${rssItems.length} RSS items`);

    if (rssItems.length === 0) {
      console.log('❌ No items found in RSS feed');
      return;
    }

    // Step 4: Convert to database format and filter duplicates
    console.log('🔄 Processing and filtering posts...');
    const posts = rssItems
      .slice(0, 20) // Latest 20
      .filter(item => !existingUrls.includes(item.link)) // Remove duplicates
      .map(item => ({
        id: generateContentId(item.link, item.pubDate),
        title: truncateText(item.title, 255),
        snippet: truncateText(item.description, 270),
        url: item.link,
        author: 'Vitalik Buterin',
        source: VITALIK_SOURCE,
        category: 'people',
        pub_date: item.pubDate.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

    console.log(`✅ Found ${posts.length} new posts to import`);

    if (posts.length === 0) {
      console.log('✨ All recent posts already exist in database');
      return;
    }

    // Step 5: Insert into database
    const insertedCount = await insertPosts(posts);

    // Step 6: Summary
    console.log('\n📋 Import Summary:');
    console.log(`   📥 RSS items fetched: ${rssItems.length}`);
    console.log(`   🔄 Existing posts found: ${existingUrls.length}`);
    console.log(`   ✨ New posts processed: ${posts.length}`);
    console.log(`   💾 Posts inserted: ${insertedCount}`);

    if (insertedCount > 0) {
      console.log('\n📝 Newly imported posts:');
      posts.slice(0, insertedCount).forEach((post, i) => {
        const date = new Date(post.pub_date).toISOString().split('T')[0];
        console.log(`   ${i + 1}. ${post.title} (${date})`);
      });
    }

    console.log('\n✅ Import completed successfully!');

  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the script
if (require.main === module) {
  console.log('🌐 Vitalik Blog Import Script');
  console.log('============================\n');

  // Check environment variables
  if (SUPABASE_URL.includes('your-project') || SUPABASE_ANON_KEY.includes('your-anon-key')) {
    console.log('❌ Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables');
    console.log('   export SUPABASE_URL="https://your-project.supabase.co"');
    console.log('   export SUPABASE_ANON_KEY="your-anon-key"');
    process.exit(1);
  }

  importVitalikPosts().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Script execution failed:', error);
    process.exit(1);
  });
}

module.exports = { importVitalikPosts };
