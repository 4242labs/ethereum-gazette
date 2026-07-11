# Ethereum Gazette - Implementation Guide

## Overview

This document provides implementation details, patterns, and guidelines for developing Ethereum Gazette features. The application is currently deployed as a live aggregator at https://ethereumworld.42labs.io/

## Core Implementations

### Dark Mode System

**Implementation:** CSS variables + Tailwind dark: prefix + Zustand store

```typescript
// Theme initialization hook
useEffect(() => {
  const theme = localStorage.getItem("theme") || "light";
  document.documentElement.classList.toggle("dark", theme === "dark");
}, []);
```

**CSS Strategy:**

- Use Tailwind's `dark:` variants
- CSS custom properties for dynamic values
- System preference detection fallback
- Rich dark violet tones (`#111827` base, violet accents)

### Design System

**Color Palette:**

- Primary accent: `#8b5cf6` (violet-500)
- Background: `#f9f7ff` (light violet tint)
- Cards: White with violet-tinted soft shadows
- Dark mode background: `#111827` with violet dot pattern

**Category Colors:**

- Communities: `#8b5cf6` (violet)
- People: `#06b6d4` (cyan)
- Orgs: `#6366f1` (indigo)
- Projects: `#f59e0b` (amber)
- Education: `#10b981` (emerald)
- News: `#ef4444` (red)
- Events: `#ec4899` (pink)
- Grants: `#22c55e` (green)
- DAOs: `#a855f7` (purple)
- Jobs: `#3b82f6` (blue)

**Shadow System:**

- `.shadow-soft` - Subtle violet-tinted shadow
- `.shadow-soft-md` - Medium shadow for hover states
- `.shadow-soft-lg` - Large shadow for emphasis

**Micro-interactions:**

- `.hover-lift` - Cards rise 2px on hover
- Animated external link arrow slides in on card hover
- Icon scale on hover in navigation

### Character Limit System

**Limits by Card Type:**

| Card Type   | Title | Snippet |
| ----------- | ----- | ------- |
| Regular     | 110   | 270     |
| Featured L1 | 100   | 200     |
| Featured L2 | 50    | 100     |
| Social      | N/A   | 270     |

**Implementation:**

```typescript
const truncate = (text: string, limit: number): string => {
  if (text.length <= limit) return text;
  return text.slice(0, limit - 3) + "...";
};
```

### Featured Content System

**Structure:**

```typescript
interface FeaturedItem {
  level: 1 | 2 | 3;
  category: Category;
  title?: string;
  snippet: string;
  url: string;
  source: string;
  date: Date;
  imageUrl?: string;
}
```

**Display Rules:**

- Level 1: Full card with image
- Level 2: Compact card
- Level 3: Minimal text link

### Mobile View System

**Breakpoints:**

- Mobile: <768px
- Tablet: 768px-1024px
- Desktop: >1024px

**Mobile-Specific Views:**

1. Feed View (default)
2. Featured View
3. Stats View
4. Search View

**Navigation:** Bottom tab bar with icons

## API Implementations

### RSS Parser

**Core Functions:**

```typescript
parseFeed(url: string): Promise<ParsedFeed>
normalizeItem(item: RawItem): PostItem
parseMultipleFeeds(feeds: Feed[]): Promise<PostItem[]>
```

**Error Handling:**

- Retry logic: 3 attempts
- Exponential backoff: 1s, 2s, 4s
- Timeout: 30 seconds
- Fallback to cached data

### Network Stats

**Data Sources:**

```typescript
interface StatsData {
  ethPrice: number; // CoinGecko
  gasPrice: number; // Alchemy
  hashrate: number; // Etherscan
  validators: number; // Beacon Chain
  stakingApr: number; // Calculated
}
```

**Update Strategy:**

- Cache duration: 5 minutes
- Stale-while-revalidate
- Fallback to last known good

### Content Aggregation

**Current Pipeline:**

1. Fetch → Parse → Normalize → Filter → Log → Store → Serve

**Data Quality Status:**

- ✅ **FIXED:** Author names no longer contain raw XML/HTML (enhanced `extractAuthor()` parsing)
- Titles sometimes truncated inappropriately (pending fix)
- ✅ **CORRECTED:** Only 3 out of 42 RSS sources permanently broken (not 15 as previously reported)
- ✅ **IMPLEMENTED:** Method 3 Phase 1 source tiering with auto-approval for core Ethereum sources
- ✅ **DEPLOYED:** Method 3 Phase 2 keyword filter is now live in the RSS aggregation pipeline
- ✅ **ENHANCED:** Review items now excluded from publication (not just rejected)
- ✅ **LOGGING:** All filtered content logged to Supabase tables for analysis

**Method 3 LLM Classification Implementation**

**Phase 1: Source Tiering (✅ COMPLETE)**

```typescript
interface FeedSource {
  id: number;
  name: string;
  tier: 1 | 2 | 3;
  autoApprove: boolean;
}

// Tier 1: Core Ethereum Sources (6 sources - Auto-Approved)
// - Ethereum Foundation Blog, Vitalik's Blog, EthResearch, etc.
// - Cost: $0, Relevance: 95-100%

// Tier 2: High-Relevance Sources (19 sources - Keyword Filtering)
// - Major projects, trusted news, education sources
// - Cost: ~$5/month, Expected relevance: 70-85%

// Tier 3: Ecosystem Sources (9 sources - LLM Classification)
// - Broader ecosystem content requiring intelligent filtering
// - Cost: ~$40/month, Expected relevance after filtering: 80-90%
```

**Phase 2: Keyword Heuristics (✅ COMPLETE & DEPLOYED)**

```typescript
interface KeywordConfig {
  keywords: Record<
    string,
    {
      weight: number;
      description: string;
      terms: string[];
    }
  >;
  contextualRules: Record<
    string,
    {
      description: string;
      pattern: string;
      weightModifier: number;
    }
  >;
  thresholds: {
    autoApprove: number; // >= 1.2
    autoReject: number; // <= -0.5
    reviewQueue: { min: number; max: number };
  };
}

// 319 keywords across 12 categories with weighted scoring
// 6 contextual rules for pattern detection
// 100% test accuracy achieved on 25 test cases
// LIVE in production: Review items now excluded from publication
// Filter logging to Supabase tables: filter_rejected, filter_review
```

**Phase 3: LLM Classification (🔜 NEXT PHASE)**

```typescript
interface LLMClassification {
  model: "claude-3-haiku" | "gemini-1.5-flash";
  input: { title: string; snippet: string }; // No full article
  output: { is_core_ethereum: boolean; reason: string };
}
```

**Current Implementation:**

```typescript
function applySourceTiering(items: ParsedFeedItem[], source: FeedSource) {
  if (source.tier === 1 && source.autoApprove) {
    // Auto-approve all Tier 1 content
    return { approvedItems: items, filteredCount: 0 };
  }

  if (source.tier === 2) {
    // Apply keyword filtering with contextual rules (LIVE in production)
    return applyKeywordFiltering(items, source);
  }

  // Tier 3: Auto-approved pending Phase 3 LLM implementation
  return { approvedItems: items, filteredCount: 0 };
}

// Filter Logging Implementation (LIVE):
async function processFilterResult(
  item: ParsedFeedItem,
  filterResult: FilterDecision,
) {
  if (filterResult.decision === "approve") {
    return item; // Publish
  } else if (filterResult.decision === "review") {
    await logReviewItem(item, filterResult); // Log and exclude
    return null;
  } else if (filterResult.decision === "reject") {
    await logRejectedItem(item, filterResult); // Log and exclude
    return null;
  }
}
```

**Deduplication:**

```typescript
const contentId = crypto
  .createHash("sha256")
  .update(url + pubDate)
  .digest("hex")
  .slice(0, 16);
```

**Author Name Parsing (✅ FIXED):**

```typescript
export function extractAuthor(item: any): string | undefined {
  const dcCreator = item["dc:creator"] || item.dcCreator;
  const author = item.author;
  const creator = item.creator;

  if (dcCreator) return dcCreator;

  if (typeof author === "string") {
    // Handle nested XML in author field (common in Atom feeds)
    if (
      author.toLowerCase().includes("<name>") &&
      author.toLowerCase().includes("</name>")
    ) {
      const nameMatch = author.match(/<name>(.*?)<\/name>/i);
      if (nameMatch) {
        return nameMatch[1]; // Extract clean username: /u/username
      }
    }
    return author;
  }

  if (author?.name) return author.name;
  if (creator) return creator;

  return undefined;
}
```

## Component Patterns

### Layout Components

**AppShell:**

```tsx
<div className="min-h-screen flex">
  <Sidebar className="w-64 hidden md:block" />
  <main className="flex-1">
    <Outlet />
  </main>
  <Featured className="w-80 hidden lg:block" />
</div>
```

### Data Components

**Feed Pattern:**

```tsx
const Feed = () => {
  const { posts, loading, error } = useFeed();

  if (loading) return <FeedSkeleton />;
  if (error) return <ErrorState />;
  if (!posts.length) return <EmptyState />;

  return <PostList posts={posts} />;
};
```

### Interaction Components

**Click Handler Pattern:**

```tsx
const handleCardClick = (url: string) => {
  window.open(url, "_blank", "noopener,noreferrer");
};
```

## State Management Patterns

### Store Structure

```typescript
const useAppStore = create<AppStore>((set) => ({
  // State
  posts: [],
  category: "all",

  // Actions
  setPosts: (posts) => set({ posts }),
  setCategory: (category) => set({ category }),

  // Computed
  get filteredPosts() {
    return this.posts.filter(
      (p) => this.category === "all" || p.category === this.category,
    );
  },
}));
```

### Data Flow

1. **User Action** → Store action
2. **Store Update** → React re-render
3. **Side Effects** → API calls
4. **Response** → Store update

## Performance Patterns

### Lazy Loading

```tsx
const Featured = lazy(() => import('./components/Featured'))

<Suspense fallback={<Skeleton />}>
  <Featured />
</Suspense>
```

### Memoization

```tsx
const expensiveFilter = useMemo(
  () => posts.filter(complexLogic),
  [posts, filters],
);
```

### Virtual Scrolling

For feeds >100 items, implement windowing:

```tsx
<VirtualList
  height={600}
  itemCount={posts.length}
  itemSize={120}
  renderItem={({ index }) => <PostCard post={posts[index]} />}
/>
```

## Testing Patterns

### Component Tests

```tsx
describe("PostCard", () => {
  it("truncates long titles", () => {
    const post = { title: "A".repeat(150) };
    render(<PostCard post={post} />);
    expect(screen.getByText(/\.\.\.$/)).toBeInTheDocument();
  });
});
```

### API Tests

```typescript
describe("RSS Parser", () => {
  it("handles malformed XML", async () => {
    const result = await parseFeed("invalid-xml");
    expect(result.error).toBeDefined();
  });
});
```

## Error Handling

### User-Facing Errors

```tsx
<ErrorBoundary fallback={<ErrorFallback />}>
  <App />
</ErrorBoundary>
```

### API Errors

```typescript
try {
  const data = await fetchData();
  return { success: true, data };
} catch (error) {
  console.error("API Error:", error);
  return {
    success: false,
    error: "Something went wrong. Please try again.",
  };
}
```

## Deployment Checklist

### Pre-Deployment

- [ ] Run type checking: `npm run type-check`
- [ ] Run linting: `npm run lint`
- [ ] Test build: `npm run build`
- [ ] Check bundle size: <200KB initial
- [ ] Verify env variables
- [ ] Test RSS feed parsing with author name fixes
- [ ] Validate content classification pipeline

### Post-Deployment

- [ ] Verify all endpoints
- [ ] Check mobile responsiveness
- [ ] Test external links
- [ ] Monitor error rates
- [ ] Validate caching headers
- [ ] Check RSS source health (24/42 active)
- [ ] Monitor content quality metrics
- [ ] Verify featured content displays correctly

### Data Quality Checklist

- [x] Author names display properly (✅ fixed XML parsing)
- [ ] Titles are not truncated inappropriately
- [x] Content classification working (✅ Phase 1 & 2 active: source tiering + keyword filter)
- [x] Failed RSS sources identified and logged (3 broken, 5 disabled for quality)
- [x] Duplicate detection functioning
- [x] Review items excluded from publication (✅ fixed)
- [x] Filter logging operational (✅ Supabase tables active)
- [ ] Database cleanup completed (⚠️ in progress - cleanup script issue found)

## Next Priority Implementations

### 1. Method 3 Phase 3: LLM Classification (Next Priority)

```typescript
async function applyLLMClassification(
  items: ParsedFeedItem[],
  source: FeedSource,
): Promise<{ approvedItems: ParsedFeedItem[]; filteredCount: number }> {
  if (source.tier !== 3) return { approvedItems: items, filteredCount: 0 };

  const classifications = await Promise.all(
    items.map((item) => classifyWithLLM(item.title, item.snippet)),
  );

  const approved = items.filter(
    (item, index) => classifications[index].isRelevant,
  );

  return {
    approvedItems: approved,
    filteredCount: items.length - approved.length,
  };
}
```

### 2. Admin Interface (Medium Priority)

### 3. RSS Source Health Monitoring (Medium Priority)

- Featured content management dashboard
- RSS source monitoring and health checks
- Content moderation queue
- Analytics and performance metrics

---

**Last Updated:** 2026-02-19
