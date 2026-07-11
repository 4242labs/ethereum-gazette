# Ethereum Gazette: System Overview

## Vision

Ethereum Gazette is "The Front Page of Ethereum" — a minimalist, curated aggregator for the Ethereum ecosystem. It solves coordination and information discovery problems through a unified, clean interface presenting the most important events, news, projects, and opportunities.

**Live URL:** https://ethereumgazette.com/

---

## Core Concept

A single destination where anyone can discover what's happening in Ethereum without navigating dozens of different sources.

**Key Principles:**

- **Minimalist:** Clean, distraction-free interface
- **Curated:** Quality over quantity
- **Unified:** All ecosystem information in one place
- **Accessible:** Works for both newcomers and veterans

---

## Content Categories

1. Home (default)
2. People
3. Orgs
4. Projects
5. Education
6. News
7. Events
8. Jobs
9. Grants
10. Communities
11. Podcasts
12. YouTube

_Note: DAOs removed in Phase A (Mar 2026). Grants and Communities restored in B3. Podcasts and YouTube added in B6._

---

## Content Guidelines

### Character Limits

Enforced to ensure consistent display:

| Card Type   | Title | Snippet |
|:------------|:------|:--------|
| Regular     | 50    | 150     |
| Featured L1 | 100   | 200     |
| Featured L2 | 50    | 100     |
| Social      | N/A   | 270     |

### Feed Limit

Feed displays a maximum of 30 posts. After the last post, a stopping message ("That's a wrap! Now, go build something.") appears with no option to load more. This is intentional — curated brevity over infinite scroll.

### Quality Standards

- Accurate categorization
- No duplicate content
- Relevant to Ethereum
- Timely information
- Proper attribution

---

## Branding

- **Name:** Ethereum Gazette
- **Tagline:** The Front Page of Ethereum
- **Logo:** Ethereum diamond within globe wireframe, orange palette
- **Sidebar Links:**
  - About Ethereum Gazette
  - Buy me a coffee (overlay)
  - How it Works (GitHub)
  - Terms of Service
  - Analytics (overlay)
  - Dark/Light Mode toggle

---

## Success Metrics

Tracked via Matomo Cloud (cookie-free, privacy-focused). Custom events fire for category selection, post click-through, search queries, and theme toggles.

### Technical KPIs

- Page load time: <2 seconds
- API latency: <200ms
- Error rate: <0.5%
- Uptime: 99.9%

### User KPIs

- Daily active users
- Session duration (target >3min)
- Content engagement / click-through rate
- Search usage

### Content KPIs

- Source reliability: >95%
- Relevance rate: >90%
- Update freshness: <2 hours for breaking news
- Category balance
- Content volume: 50–100 relevant posts/day

---

## Phased Roadmap

### Phase 1 (Completed)

- Live aggregator with database storage
- RSS feed aggregation (42 sources, 34 active)
- Responsive UI with orange accent design system

### Phase 2 (Completed)

- Method 3 content curation (Stages 1–2: source tiering + keyword filter)
- Static migration (completed, reverted, re-frozen, then reactivated in Phase A)

### Phase A (Completed — Mar 2026)

- Dependency cleanup: removed `@vercel/kv`, `@vercel/postgres`, `string-similarity`
- Dead code removal: 27+ test/debug files, unused API endpoints
- UI cleanup: removed Sign Up button, source filter, right panel cards, 4 categories
- Reactivated live pipeline (RSS ingestion every 15 min)
- Migrated domain to `ethereumgazette.com`

### Phase B (Completed — Mar 2026)

- Layout, visual & platform changes (8 blocks)
- Magazine-style post cards with OG images and category fallbacks
- 30-post feed limit with deliberate stopping message
- AI Summary card with 13 rotating stories (typing animation)
- AI Daily Podcast card in featured sidebar
- Matomo analytics integration (cookie-free)
- OG image backfill script (coverage 40% → 75%)
- Live data mode enabled (`VITE_DATA_MODE`), static snapshot fallback removed as default
- B6: Fixed card height (180px), Podcasts/YouTube categories, `media:content` image pipeline fix, doubled header padding, AI Briefing rename, Ask AI CTA button, warm tint on right panel, reprocess script for 200 posts
- B7: Removed fixed desktop header, relocated logo/search/BETA to sidebar panels, new GAZETTE logo, Ask AI CTA removed, AI Daily Podcast below AI Briefing
- B8: Taller AI Briefing (2.5x), BETA badge overlay on logo, embedded audio player with SOON tag, sidebar renames, smaller category tags

### Phase C (Planned)

- LLM classification for Tier 3 sources (Method 3 Stage 3)

### Phase 3 (Future)

- Admin interface for featured content
- Search enhancement (PostgreSQL FTS → Algolia)

### Phase 4 (Future)

- User accounts (Web3)
- Community curation features
- Multi-language support
- Native mobile apps

---

**Last Updated:** 2026-03-22
