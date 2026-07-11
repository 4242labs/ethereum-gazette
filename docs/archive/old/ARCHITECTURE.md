# Ethereum Gazette - Architecture

## Overview

This document outlines the technical architecture, design decisions, and technology choices for Ethereum Gazette. The application is currently deployed as a **live aggregator** with database backend and real-time content ingestion.

## System Architecture

**Current (Live Deployment):**

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   Client App    │────▶│  Vercel Edge    │────▶│  External APIs  │
│  (React + TS)   │◀────│   Functions     │◀────│  (RSS, Chain)   │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │
         │                       ▼
         │              ┌─────────────────┐
         └─────────────▶│   PostgreSQL    │
                        │   (Supabase)    │
                        └─────────────────┘
```

## Technology Stack

### Frontend

- **React 18+** - Component-based UI library
- **TypeScript** - Type safety and better DX
- **Vite** - Fast build tool with HMR
- **Tailwind CSS** - Utility-first styling
- **Zustand** - Lightweight state management
- **React Router v6** - Client-side routing

### Backend

- **Vercel Functions** - Serverless API endpoints
- **Node.js** - JavaScript runtime
- **TypeScript** - Consistent language across stack

### Data Sources

- **RSS Feeds** - 42 curated sources with 3-tier classification system
- **Alchemy SDK** - Ethereum network data
- **Etherscan API** - Additional chain metrics
- **CoinGecko API** - Market data
- **Method 3 Curation** - Multi-stage content filtering pipeline

### Infrastructure

- **Vercel** - Serverless hosting with Functions
- **Supabase PostgreSQL** - Content storage (active with Session Pooler)
- **Vercel KV** - Caching layer (configured but experiencing connection issues)

### Design System

- **Color Palette:** Violet/purple accent theme (`#8b5cf6` primary)
- **Background:** Light violet tint (`#f9f7ff`)
- **Cards:** White with soft violet-tinted shadows
- **Typography:** Bold titles, lighter body text
- **Icons:** Colorful per-category (Lucide icons)
- **Badges:** Rounded pill style with category colors

## Design Patterns

### Component Architecture

```
src/
├── components/
│   ├── layout/       # Shell components
│   ├── feed/         # Content display
│   ├── ui/           # Reusable primitives
│   └── features/     # Feature-specific
├── hooks/            # Custom React hooks
├── store/            # Zustand stores
├── lib/              # Utilities
└── types/            # TypeScript definitions
```

### API Design

**RESTful Endpoints:**

- `GET /api/stats` - Network statistics
- `GET /api/rss/sources` - Feed sources
- `GET /api/rss/test-parser` - Parse single feed
- `GET /api/posts` - Aggregated content (planned)

**Response Format:**

```typescript
{
  success: boolean
  data?: T
  error?: string
  timestamp: string
}
```

### State Management

**Zustand Stores:**

```typescript
interface AppStore {
  // UI State
  theme: "light" | "dark";
  selectedCategory: Category | "all";

  // Data State
  posts: Post[];
  isLoading: boolean;

  // Actions
  setTheme: (theme: Theme) => void;
  setCategory: (category: Category) => void;
}
```

## Key Design Decisions

### 1. Serverless Architecture

**Decision:** Use Vercel Functions instead of traditional server

**Rationale:**

- Zero-ops deployment
- Automatic scaling
- Cost-effective for variable traffic
- Built-in edge caching

### 2. Client-Side Rendering

**Decision:** CSR with static exports

**Rationale:**

- Simplifies architecture
- Better for real-time updates
- Reduced server costs
- Progressive enhancement possible

### 3. Utility-First CSS

**Decision:** Tailwind CSS over CSS-in-JS

**Rationale:**

- Faster development
- Smaller bundle size
- Better performance
- Easier AI assistance

### 4. TypeScript Everywhere

**Decision:** Strict TypeScript for entire codebase

**Rationale:**

- Type safety across stack
- Better developer experience
- Self-documenting code
- Fewer runtime errors

## Performance Optimizations

### Frontend

- **Code Splitting:** Route-based chunks
- **Lazy Loading:** Components and images
- **Caching:** Service worker for assets
- **Bundle Size:** <200KB initial JS

### Backend

- **Edge Caching:** 5-minute TTL for stats
- **Connection Pooling:** Database connections
- **Rate Limiting:** Per-IP request limits
- **Query Optimization:** Indexed lookups

## Security Considerations

### Client Security

- **CSP Headers:** Restrict resource loading
- **HTTPS Only:** Enforce SSL
- **Input Sanitization:** XSS prevention
- **External Links:** rel="noopener noreferrer"

### API Security

- **Rate Limiting:** 100 req/min per IP
- **CORS:** Restricted origins
- **Input Validation:** Type checking
- **Error Handling:** No stack traces

## Scalability Strategy

### Current Scale (Live Aggregator)

- **Users:** Unlimited (serverless hosting)
- **Content:** 2,696+ posts (live database)
- **RSS Sources:** 34 active, 8 disabled (3 broken, 5 temporarily disabled for noise reduction)
- **Content Curation:** Method 3 Phase 1 active (source tiering with auto-approval)
- **Cost:** ~$30/month (current), ~$75/month (after full Method 3 implementation)

### Future Scale

- **Users:** 100K+ daily
- **Content:** 10K+ posts/day
- **Strategy:**
  - Database read replicas
  - CDN for static assets
  - Queue for processing
  - Microservices split

## Development Workflow

### Local Development

```bash
# Frontend
cd app && npm run dev

# API (via Vercel CLI)
vercel dev
```

### Deployment

```bash
# Automatic via GitHub
git push origin main

# Manual
vercel --prod
```

### Testing Strategy

- **Unit Tests:** Vitest for logic
- **Integration:** API endpoint tests
- **E2E:** Playwright (planned)
- **Visual:** Storybook (planned)

## Monitoring & Observability

### Current

- **Vercel Analytics:** Traffic and performance
- **Console Logs:** Basic debugging (needs cleanup for production)
- **Error Boundaries:** React error handling
- **Supabase Monitoring:** Database performance and connection health

### Planned

- **Sentry:** Error tracking
- **Datadog:** APM and logs
- **Custom Metrics:** Business KPIs

## Future Considerations

### Technical Debt

- **Method 3 Phases 2-3:** Complete keyword heuristics and LLM classification implementation
- **Admin Interface:** Build proper featured content management system
- **Code Organization:** Restructure files/folders, update documentation
- **CSS Architecture:** Remove `!important` CSS overrides for dark mode
- **Caching Layer:** Fix Vercel KV integration issues
- **Testing & Security:** Add comprehensive testing and security measures

### Architectural Evolution

- **Phase 1:** Current monolithic frontend
- **Phase 2:** Separate API service
- **Phase 3:** Microservices architecture
- **Phase 4:** Multi-region deployment

---

**Last Updated:** 2026-02-06
