# Ethereum Gazette - Specifications

## Executive Summary

Ethereum Gazette is "The Front Page of Ethereum" — a minimalist, curated aggregator for the Ethereum ecosystem. It solves coordination and information discovery problems through a unified, clean interface presenting the most important events, news, projects, and opportunities.

**Live URL:** https://ethereumworld.42labs.io/

## Core Concept

**Vision:** A single destination where anyone can discover what's happening in Ethereum without navigating dozens of different sources.

**Key Principles:**

- **Minimalist:** Clean, distraction-free interface
- **Curated:** Quality over quantity
- **Unified:** All ecosystem information in one place
- **Accessible:** Works for both newcomers and veterans

## User Interface

### Layout Structure

**Desktop (≥768px):** Three-column layout

- **Left (250px):** Navigation sidebar
- **Center (fluid):** Main content feed
- **Right (300px):** Featured content

**Mobile (<768px):** Single column with bottom navigation

### Navigation Categories

1. Home (default)
2. Communities
3. People
4. Orgs
5. Projects
6. Education
7. News
8. Events
9. Grants
10. DAOs
11. Jobs

_Note: Media category removed in Feb 2026 update_

### Content Cards

**Standard Post Card:**

- Category icon (top-left)
- Title (110 chars max)
- Snippet (270 chars max)
- Author/source
- Relative timestamp
- Click anywhere → external link

**Featured Cards:**

- Level 1: 100 char title, 200 char snippet
- Level 2: 50 char title, 100 char snippet
- Distinct visual treatment
- Manually curated by admin (long-term placement, not dynamic rotation)

**Titleless Cards (Social):**

- No title display
- Larger snippet text
- 270 char limit
- Preserves social media format

### Visual Design

- **Typography:** Bold titles (tight letter-spacing), lighter body text
- **Colors:**
  - Background: Light violet tint (`#f9f7ff`)
  - Cards: White with soft violet-tinted shadows
  - Accent: Violet/purple palette (`#8b5cf6` primary)
  - Category icons: Colorful per-category
- **Spacing:** Generous whitespace, 16px base
- **Dark Mode:** Full theme support with rich dark violet tones
- **Animations:** Subtle hover states, lift effects on cards, animated external link arrows
- **Badges:** Rounded pill style with per-category colors
- **Logo:** Custom Ethereum Gazette logo (globe + diamond motif)

### Branding

- **Name:** Ethereum Gazette
- **Tagline:** The Front Page of Ethereum
- **Logo:** Ethereum diamond within globe wireframe, violet/purple palette
- **Footer Links:**
  - Crafted by AKASHA (akasha.org)
  - Powered by Etherscan
  - Contribute to this project (GitHub)
  - Terms of Service
  - Dark/Light Mode toggle

## Functional Requirements

### Content Aggregation

**Current Implementation (RSS Feeds Only):**

- 24 Active RSS feeds out of 42 planned sources
- 15 Failed sources requiring manual review
- Categories: News (5), Community (3), Projects (8), Education (4), People (1), DAOs (3)
- Update Frequency: Every 15 minutes via Supabase cron jobs

**Planned Data Sources (Not Yet Implemented):**

- Twitter/X API integration for key accounts
- GitHub API for project updates
- Event aggregation APIs
- Grant platform integrations
- Job board connections

**Current Update Frequency:**

- RSS feeds: Every 15 minutes
- Network stats: Every 5 minutes

### Data Flow

1. **Fetch:** RSS feeds parsed on schedule
2. **Normalize:** Convert to standard format
3. **Store:** Save to database (planned)
4. **Display:** Show in reverse chronological order
5. **Filter:** By category or search terms

### Network Statistics

**Real-time data (5-min updates):**

- ETH price (USD)
- 24h price change
- Gas price (Gwei)
- Network hashrate
- Total validators
- Staking APR

### Search & Discovery

- Full-text search across titles/snippets
- Category filtering
- Mobile search view
- Future: trending topics

## Technical Requirements

### Performance

- Initial load: <2 seconds
- API response: <200ms
- 99.9% uptime target
- Mobile-optimized assets

### Browser Support

- Chrome/Edge (latest 2)
- Firefox (latest 2)
- Safari (latest 2)
- Mobile browsers

### Accessibility

- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- High contrast mode

### Security

- HTTPS only
- CSP headers
- Input sanitization
- Rate limiting

## Content Guidelines

### Character Limits

Enforced to ensure consistent display:

- Regular posts: 110/270 (title/snippet)
- Featured L1: 100/200
- Featured L2: 50/100
- Social posts: 0/270

### Quality Standards

- Accurate categorization
- No duplicate content
- Relevant to Ethereum
- Timely information
- Proper attribution

### Future Enhancements

### Phase 1 (Current - Completed)

- ✅ Live aggregator with database storage
- ✅ Real-time network statistics
- ✅ RSS feed aggregation (24 active sources)
- ✅ Responsive UI with violet design system

### Phase 2 (Next Priority)

- **Intelligent Content Curation:** Implement Method 3 (Economical LLM Classification) with multi-stage filtering to ensure only Ethereum-core content
- **Source Review & Expansion:** Review all 42 RSS sources, fix 15 failed sources, add Twitter/X integration
- **Admin Interface:** Build proper admin dashboard for featured content management
- **Search Enhancement:** Implement Elasticsearch or Algolia for robust search capabilities

### Phase 3 (Planned)

- Advanced filtering and personalization
- User accounts (Web3)
- Community curation features
- Native mobile apps

### Phase 4 (Future)

- Push notifications
- Developer API
- Multi-language support

## Success Metrics

### Technical KPIs

- Page load time
- API latency
- Error rate
- Uptime percentage

### User KPIs

- Daily active users
- Session duration
- Content engagement
- Search usage

### Content KPIs

- Source reliability
- Update freshness
- Category balance
- User satisfaction

---

**Last Updated:** 2026-02-04
