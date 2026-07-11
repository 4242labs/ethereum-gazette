# Ethereum Gazette: System Map

Technical implementation details — stack, architecture, API endpoints, DB schema, data pipeline.

---

## System Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   Client App    │────>│  Vercel Edge    │────>│  External APIs  │
│  (React + TS)   │<────│   Functions     │<────│  (RSS, Chain)   │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │
         │                       v
         │              ┌─────────────────┐
         └─────────────>│   PostgreSQL    │
                        │   (Supabase)    │
                        └─────────────────┘
```

**Current mode:** Live — RSS ingestion every 15 min, Supabase active.

---

## Technology Stack

### Frontend

- **React 18+** — Component-based UI
- **TypeScript** — Strict mode, full type safety
- **Vite** — Fast build tool with HMR
- **Tailwind CSS** — Utility-first styling
- **Zustand** — Lightweight state management
- **React Router v6** — Client-side routing

### Backend

- **Vercel Functions** — Serverless API endpoints
- **Node.js 18.x** — JavaScript runtime

### Data Sources

- **RSS Feeds** — 42 curated sources with 3-tier classification

### Infrastructure

- **Vercel** — Hosting, serverless functions, edge caching
- **Supabase PostgreSQL** — Content storage (Session Pooler for IPv4 compat)
- **Matomo Cloud** — Privacy-focused analytics (cookie-free, no personal data)
- **In-memory cache** — Endpoint caching via HTTP Cache-Control

---

## Component Architecture

```
src/
├── components/
│   ├── layout/       # Shell components (AppShell, Sidebar, Featured)
│   ├── feed/         # Content display (PostCard, AISummaryCard, FeedSkeleton)
│   ├── ui/           # Reusable primitives (ThemeToggle, ErrorState)
│   ├── analytics/    # Matomo tracking (MatomoTracker)
│   └── features/     # Feature-specific components
├── hooks/            # Custom React hooks (useThemeInit, useFeed)
├── store/            # Zustand stores (useAppStore)
├── lib/              # Utilities (truncate, parsing, analytics)
├── data/             # Static data (featured.ts)
└── types/            # TypeScript definitions
```

---

## API Endpoints

**Production Base:** `https://ethereumgazette.com`

| Endpoint                    | Method | Description              | Cache  |
|:---------------------------|:-------|:-------------------------|:-------|
| `/api/posts`                | GET    | Aggregated content       | —      |
| `/api/posts/fetch-and-store`| POST   | Manual RSS ingestion     | None   |
| `/api/rss/sources`          | GET    | Feed sources config      | 1 min  |
| `/api/cron/fetch-feeds`     | GET    | Scheduled RSS ingestion  | None   |

**Response Format:**

```typescript
{
  success: boolean
  data?: T
  error?: string
  timestamp: string
}
```

---

## Database Schema (Supabase PostgreSQL)

**Tables:**

- `feed_sources` — RSS source config (id, name, url, category, tier, enabled, autoApprove)
- `posts` — Aggregated content (id, content_id, title, snippet, url, author, source, category, published_at)
- `fetch_history` — Ingestion logs
- `filter_rejected` — Method 3 rejected items with reason
- `filter_review` — Method 3 review-queue items with score

**Connection:** Use Session Pooler (port 6543) from Vercel Functions — direct connections are IPv6-only.

---

## RSS Content Pipeline

### Data Flow

1. **Fetch** — RSS feeds parsed on schedule (every 15 min when live)
2. **Normalize** — Convert to standard Post format, extract author, decode HTML entities
3. **Filter** — Method 3 multi-stage filtering:
   - Tier 1 sources: auto-approve (6 sources, 100% relevance)
   - Tier 2 sources: keyword heuristic filter (18 sources)
   - Tier 3 sources: LLM classification (pending Phase 3)
4. **Deduplicate** — SHA-256 hash of `url + pubDate`
5. **Store** — Save to PostgreSQL
6. **Serve** — Reverse chronological, filterable by category

### Method 3 Curation Pipeline

**Stage 1 — Source Tiering:**
- Tier 1 (6 sources): Auto-approve, $0 cost, 95–100% relevance
- Tier 2 (18 sources): Keyword filtering, ~$5/month, 70–85% relevance
- Tier 3 (15 sources): LLM classification (pending), ~$40/month target

**Stage 2 — Keyword Heuristics (deployed):**
- 319 keywords across 12 categories with weighted scoring
- Context-aware: title 2x, URL 1.5x, snippet 1x
- Thresholds: auto-approve >= 1.2, auto-reject <= -0.5, review queue in between
- Review items excluded from publication, logged for analysis

**Stage 3 — LLM Classification (pending):**
- Claude 3 Haiku or Gemini 1.5 Flash on title + snippet only
- Binary output: `{is_core_ethereum: boolean, reason: string}`
- Target: <$0.01 per article

### Author Name Parsing

Enhanced `extractAuthor()` handles:
- `dc:creator` field (RSS 2.0)
- Nested XML `<name></name>` tags (Atom feeds, case-insensitive)
- Object-style `author.name`
- Raw string author fields

---

## State Management

```typescript
interface AppStore {
  theme: 'light' | 'dark'
  selectedCategory: Category | 'all'
  posts: Post[]
  isLoading: boolean
  setTheme: (theme: Theme) => void
  setCategory: (category: Category) => void
}
```

**Data Flow:** User Action → Store Action → React Re-render → Side Effects (API) → Store Update

---

## Performance Targets

| Metric           | Target     | Current    |
|:-----------------|:-----------|:-----------|
| Initial JS       | <200KB     | —          |
| API response     | <500ms     | ~275ms     |
| Feed processing  | <30s       | ~18s       |
| Cache hit rate   | >90%       | —          |
| Uptime           | >99.9%     | —          |

---

## Security

### Client

- CSP headers restricting resource loading
- HTTPS enforced
- Input sanitization (XSS prevention, especially RSS content)
- External links: `rel="noopener noreferrer"`

### API

- Rate limiting: 100 req/min per IP
- CORS: restricted origins
- Input validation with type checking
- Error responses: no stack traces exposed

### Headers

```json
{
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block"
}
```

---

**Last Updated:** 2026-03-21
