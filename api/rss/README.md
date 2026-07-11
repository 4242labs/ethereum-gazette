# RSS Feed Processing Systems

This directory contains the core RSS feed processing functionality for Ethereum Gazette, including categorization and deduplication systems.

## Overview

The RSS processing pipeline consists of:

1. **Parsing** - Fetching and parsing RSS/Atom feeds
2. **Normalization** - Converting feed items to standardized format
3. **Categorization** - Auto-tagging content with appropriate categories
4. **Deduplication** - Identifying and removing duplicate content
5. **Storage** - Saving processed items to database

## Components

### 1. Categorizer (`categorizer.ts`)

Automatically assigns categories to feed items using keyword matching and domain-based rules.

#### Features

- **Keyword Matching**: Matches content against category-specific keyword dictionaries
- **Domain-Based Rules**: Automatically categorizes based on source domain
- **Multi-Category Support**: Can assign primary and secondary categories
- **Confidence Scoring**: Provides confidence scores for categorization decisions
- **Manual Override**: Supports manual category corrections

#### Categories

- `news` - News articles and announcements
- `events` - Hackathons, conferences, meetups
- `grants` - Funding opportunities and grant programs
- `jobs` - Job openings and career opportunities
- `education` - Tutorials, guides, and learning resources
- `media` - Podcasts, videos, interviews
- `communities` - Community groups and forums
- `daos` - DAO governance and proposals
- `projects` - Protocol launches and project updates
- `orgs` - Organizations and foundations
- `people` - Individual profiles and interviews

#### Usage

```typescript
import { categorizeContent } from './rss/categorizer';

const result = categorizeContent(
  'ETHGlobal Hackathon Coming to SF',
  'Join us for the biggest Ethereum hackathon...',
  'https://ethglobal.com/events/sf2024'
);

console.log(result.primaryCategory); // 'events'
console.log(result.confidence); // 0.95
console.log(result.requiresManualReview); // false
```

#### Configuration

Keywords and domain rules are defined in `data/category-keywords.json`. This file includes:

- Category-specific keywords
- Domain patterns for auto-categorization
- Scoring weights
- Multi-category rules

#### Testing

Test the categorizer:
```bash
curl https://ethereumgazette.com/api/test-categorizer
```

Test with custom content:
```bash
curl "https://ethereumgazette.com/api/test-categorizer?title=Your%20Title&description=Description&url=https://example.com"
```

Run accuracy test:
```bash
curl https://ethereumgazette.com/api/test-categorizer?test=accuracy
```

#### Accuracy

Target accuracy: **>80%** on test dataset
Current performance metrics available via test endpoint.

---

### 2. Deduplicator (`deduplicator.ts`)

Detects and removes duplicate content using URL normalization and text similarity algorithms.

#### Features

- **URL Normalization**: Removes tracking parameters and normalizes URLs
- **Title Similarity**: Uses hybrid text similarity (Levenshtein, Jaccard, Dice, Cosine)
- **Time Window**: Only compares items within configurable time window
- **Merge Strategies**: Supports different strategies for handling duplicates
- **Duplicate Groups**: Can identify groups of similar content

#### Detection Methods

1. **URL-based**: Exact match after normalization (removes utm_* params, etc.)
2. **Title-based**: Fuzzy matching using hybrid similarity algorithms
3. **Hybrid**: Combines both URL and title similarity

#### Usage

```typescript
import { deduplicateItems } from './rss/deduplicator';

const result = deduplicateItems(items, {
  urlThreshold: 0.95,      // 95% similarity for URL match
  titleThreshold: 0.85,     // 85% similarity for title match
  timeWindowHours: 24,      // Only check items within 24 hours
  mergeStrategy: 'keepFirst'
});

console.log(result.unique.length);       // Items to keep
console.log(result.duplicates.length);   // Duplicate items found
console.log(result.stats);               // Detailed statistics
```

#### Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `urlThreshold` | 0.95 | Similarity threshold for URL matching (0-1) |
| `titleThreshold` | 0.85 | Similarity threshold for title matching (0-1) |
| `timeWindowHours` | 24 | Time window for duplicate detection (hours) |
| `enableUrlNormalization` | true | Enable URL normalization |
| `enableTitleSimilarity` | true | Enable title similarity matching |
| `mergeStrategy` | 'keepFirst' | Strategy: 'keepFirst', 'keepLatest', 'keepBest' |

#### Merge Strategies

- **keepFirst**: Keep the earliest published item
- **keepLatest**: Keep the most recently published item
- **keepBest**: Keep first but merge best metadata from duplicates

#### Testing

Test the deduplicator:
```bash
curl https://ethereumgazette.com/api/test-deduplicator
```

Test with custom thresholds:
```bash
curl "https://ethereumgazette.com/api/test-deduplicator?urlThreshold=0.9&titleThreshold=0.8&timeWindow=48"
```

Find duplicate groups:
```bash
curl https://ethereumgazette.com/api/test-deduplicator?test=groups
```

Get statistics:
```bash
curl https://ethereumgazette.com/api/test-deduplicator?test=stats
```

---

### 3. URL Normalizer (`lib/url-normalizer.ts`)

Utility library for URL normalization and comparison.

#### Features

- Removes tracking parameters (utm_*, fbclid, gclid, etc.)
- Normalizes protocol (http → https)
- Removes www prefix
- Sorts query parameters
- Removes trailing slashes
- Case-insensitive comparison

#### Usage

```typescript
import { normalizeUrl, calculateUrlSimilarity } from './lib/url-normalizer';

const normalized = normalizeUrl('https://example.com/page?utm_source=twitter');
// Result: 'https://example.com/page'

const similarity = calculateUrlSimilarity(url1, url2);
// Result: 0.95 (95% similar)
```

---

### 4. String Similarity (`lib/string-similarity.ts`)

Text similarity algorithms for duplicate detection.

#### Algorithms

- **Levenshtein Distance**: Edit distance between strings
- **Jaccard Similarity**: Word set comparison
- **Dice Coefficient**: Weighted word set comparison
- **Cosine Similarity**: Character bigram comparison
- **Hybrid**: Combines all methods with configurable weights

#### Usage

```typescript
import { hybridSimilarity, areSimilar } from './lib/string-similarity';

const similarity = hybridSimilarity(
  'Ethereum Foundation Announces Devcon 2025',
  'Ethereum Foundation announces DevCon 2025'
);
// Result: 0.92 (92% similar)

const isDuplicate = areSimilar(title1, title2, 0.85, 'hybrid');
// Result: true (exceeds 85% threshold)
```

#### Algorithm Selection

- **Levenshtein**: Best for typos and small variations
- **Jaccard/Dice**: Best for word-level similarity
- **Cosine**: Best for character-level similarity
- **Hybrid** (recommended): Most robust, combines all methods

---

## Processing Pipeline

### Step-by-Step Flow

1. **Fetch Feed** → `parser.ts`
2. **Parse Items** → `parser.ts`
3. **Normalize** → `normalizer.ts`
4. **Categorize** → `categorizer.ts`
5. **Deduplicate (Internal)** → `deduplicator.ts`
6. **Deduplicate (vs Database)** → `deduplicator.ts`
7. **Store** → `lib/db.ts`

### Example Integration

```typescript
import { fetchFeed } from './rss/parser';
import { normalizeItems } from './rss/normalizer';
import { categorizeContent } from './rss/categorizer';
import { deduplicateItems, deduplicateAgainstDatabase } from './rss/deduplicator';
import { savePosts, getRecentPosts } from './lib/db';

// 1. Fetch and parse
const feed = await fetchFeed(feedUrl);

// 2. Normalize
const normalized = normalizeItems(
  feed.items,
  sourceName,
  defaultCategory,
  sourceId
);

// 3. Categorize items with generic categories
const categorized = normalized.map(item => {
  if (item.category === 'news' || item.category === 'general') {
    const result = categorizeContent(item.title, item.snippet, item.url);
    return { ...item, category: result.primaryCategory };
  }
  return item;
});

// 4. Deduplicate within batch
const deduped = deduplicateItems(categorized);

// 5. Deduplicate against database
const existing = await getRecentPosts(7); // Last 7 days
const final = await deduplicateAgainstDatabase(
  deduped.unique,
  existing
);

// 6. Save to database
await savePosts(final.unique);
```

---

## Performance Considerations

### Categorization

- **Speed**: ~1-2ms per item
- **Memory**: Loads config once, caches in memory
- **Scalability**: Can process 1000+ items/second

### Deduplication

- **Speed**: ~5-10ms per item (depends on existing item count)
- **Memory**: O(n) where n is number of items to compare
- **Optimization**: Use time windows to limit comparison scope

### Recommendations

1. **Batch Processing**: Process feeds in batches of 50-100 items
2. **Time Windows**: Use 24-48 hour windows for duplicate detection
3. **Database Indexing**: Index posts by URL and pub_date
4. **Caching**: Cache recent posts in Redis for faster comparison

---

## Testing

### Unit Tests

Run categorization test:
```bash
curl https://ethereumgazette.com/api/test-categorizer
```

Run deduplication test:
```bash
curl https://ethereumgazette.com/api/test-deduplicator
```

### Accuracy Testing

Test categorizer accuracy:
```bash
curl "https://ethereumgazette.com/api/test-categorizer?test=accuracy"
```

### Integration Testing

Test full pipeline with real feed:
```bash
curl "https://ethereumgazette.com/api/rss/test-normalizer?url=https://weekinethereumnews.com/feed/"
```

---

## Configuration Files

### `data/category-keywords.json`

Defines keywords, domains, and rules for categorization.

**Structure:**
```json
{
  "categories": {
    "category_name": {
      "keywords": ["keyword1", "keyword2"],
      "domains": ["example.com"],
      "weight": 1.0
    }
  },
  "scoring": {
    "titleWeight": 2.0,
    "descriptionWeight": 1.0,
    "domainWeight": 3.0,
    "minimumConfidence": 0.3
  }
}
```

**Updating Keywords:**

1. Edit `data/category-keywords.json`
2. Add new keywords to appropriate category
3. Test accuracy with: `curl https://ethereumgazette.com/api/test-categorizer?test=accuracy`
4. Deploy changes

---

## Future Enhancements

### Categorization
- [ ] AI-based categorization using OpenAI/Anthropic APIs
- [ ] Learning from manual overrides
- [ ] Context-aware multi-category assignment
- [ ] Language detection and multilingual support

### Deduplication
- [ ] Semantic similarity using embeddings
- [ ] Cross-source canonical URL resolution
- [ ] Duplicate chain detection (A→B→C)
- [ ] Fuzzy date matching for re-published content

### Performance
- [ ] Redis caching for recent items
- [ ] Parallel processing with worker threads
- [ ] Incremental processing (only new items)
- [ ] Bloom filters for fast duplicate checks

---

## Troubleshooting

### Low Categorization Confidence

**Symptom**: Many items marked for manual review

**Solutions:**
1. Add more keywords to `category-keywords.json`
2. Add domain rules for known sources
3. Lower `minimumConfidence` threshold
4. Review and improve keyword quality

### High Duplicate Rate

**Symptom**: Too many items marked as duplicates

**Solutions:**
1. Increase `titleThreshold` (e.g., 0.85 → 0.90)
2. Increase `urlThreshold` (e.g., 0.95 → 0.98)
3. Reduce `timeWindowHours` (e.g., 24 → 12)
4. Check for overly aggressive URL normalization

### Missing Duplicates

**Symptom**: Duplicate content not being detected

**Solutions:**
1. Decrease `titleThreshold` (e.g., 0.85 → 0.80)
2. Enable both URL and title similarity
3. Increase `timeWindowHours` (e.g., 24 → 48)
4. Check URL normalization is working correctly

---

## Dependencies

- `string-similarity` - Text similarity algorithms (Levenshtein, etc.)
- Built-in Node.js modules: `fs`, `path`, `url`

---

## Maintenance

### Regular Tasks

1. **Weekly**: Review categorization accuracy metrics
2. **Monthly**: Update keyword dictionaries based on new patterns
3. **Quarterly**: Analyze duplicate patterns and adjust thresholds
4. **As needed**: Handle edge cases and add domain rules

### Monitoring

Track these metrics:
- Categorization accuracy rate
- Average confidence score
- Duplicate detection rate
- Processing time per item
- Manual review queue size

---

## Support

For issues or questions:
1. Check test endpoints for debugging
2. Review configuration files
3. Check logs for error messages
4. Test with sample data using API endpoints

---

**Last Updated**: 2024-12-28
**Version**: 1.0.0
