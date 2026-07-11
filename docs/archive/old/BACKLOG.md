# Ethereum Gazette - Development Backlog

## Overview

This document serves as the single source of truth for all planned development work on Ethereum Gazette. Tasks are organized by priority with clear timelines, dependencies, and success criteria.

**Current Status:** Live aggregator with 42 RSS sources (39 enabled, 3 disabled) pulling content every 15-60 minutes. Major issue: **No content filtering** - system ingests all content regardless of relevance to core Ethereum.

---

## 🔥 CRITICAL PRIORITY (This Week)

### 1. Manual Source Filtering (Immediate - Today)

**Goal:** Reduce content noise by 40-60% through source tiering

**Tasks:**
- [ ] **1.1** Categorize all 42 RSS sources into tiers:
  - **Tier 1 (Auto-approve):** Ethereum Foundation Blog, Vitalik's Blog, EthResearch, Week in Ethereum News
  - **Tier 2 (High relevance):** Core project blogs (Uniswap, Aave, Lido), reputable news (CoinDesk Ethereum, The Defiant)
  - **Tier 3 (Ecosystem/Noisy):** General crypto news, tool/infra blogs, podcasts
- [ ] **1.2** Temporarily disable Tier 3 sources with high noise (The Block, Decrypt, Cointelegraph, Polygon, Chainlink, Alchemy)
- [ ] **1.3** Monitor content quality improvement for 24 hours
- [ ] **1.4** Document source performance and user feedback

**Files to modify:**
- `data/feed-sources.json` - Set `enabled: false` for noisy sources
- Create `docs/SOURCE-TIERS.md` - Document tiering rationale

**Success Criteria:** 40-60% reduction in off-topic content, improved content relevance

---

### 2. Failed Source Audit (Immediate - Today)

**Goal:** Fix broken RSS feeds affecting system reliability

**Current disabled sources to investigate:**
- [ ] **2.1** ETH.Build Blog (ID: 8) - `https://sandbox.eth.build/feed`
- [ ] **2.2** ETHGlobal Events (ID: 17) - `https://ethglobal.com/events/rss`  
- [ ] **2.3** Messari (ID: 36) - `https://messari.io/rss`

**Tasks:**
- [ ] Test each RSS URL manually
- [ ] Fix URL formats if possible
- [ ] Re-enable working sources
- [ ] Remove permanently broken sources
- [ ] Update feed-sources.json accordingly

**Success Criteria:** All enabled sources are functional and fetching content

---

## 🚀 HIGH PRIORITY (Next 1-2 Weeks)

### 3. Method 3: Economical LLM Classification Implementation

**Goal:** Implement intelligent content filtering with 90%+ relevance at <$50/month cost

#### Stage 1: Source Tiering System (Day 2-3)
- [ ] **3.1** Implement source tier logic in RSS parser
- [ ] **3.2** Auto-approve all content from Tier 1 sources (0 cost filtering)
- [ ] **3.3** Test and measure Tier 1 auto-approval impact

#### Stage 2: Keyword Heuristics Engine (Day 4-5)  
- [ ] **3.4** Implement keyword scoring system:
  - **Positive keywords (+1 to +3 points):** ethereum, eth, eip-xxxx, mainnet, staking, sharding, gas fees, merge, deneb, validator, consensus, execution
  - **Negative keywords (-1 to -3 points):** bitcoin, btc, solana, cardano, avalanche, polygon (when not about ethereum), truffle, hardhat, ganache
  - **Context weighting:** Title words = 2x, snippet words = 1x
- [ ] **3.5** Set rejection threshold (score < 1 = auto-reject)
- [ ] **3.6** Test keyword filtering on historical data
- [ ] **3.7** Measure noise reduction (target: 70-80% of irrelevant content filtered)

#### Stage 3: LLM Classification (Day 6-7)
- [ ] **3.8** Implement cheap LLM integration (Claude 3 Haiku or Gemini 1.5 Flash)
- [ ] **3.9** Process only title + snippet (not full article) to minimize tokens
- [ ] **3.10** Use structured prompt for binary classification:
  ```
  You are a content classifier for an Ethereum news aggregator. Determine if this article is about the core Ethereum protocol, its technology, or its direct roadmap. Exclude articles primarily about applications, tools, or tokens in the ecosystem.

  Title: "{title}"  
  Snippet: "{snippet}"

  Respond with JSON: {"is_core_ethereum": boolean, "reason": "brief explanation"}
  ```
- [ ] **3.11** Implement retry logic and error handling
- [ ] **3.12** Add cost monitoring and usage alerts
- [ ] **3.13** Test on full pipeline with cost tracking

**Files to create/modify:**
- `api/content-classifier.ts` - LLM classification service
- `lib/keyword-filter.ts` - Heuristics engine  
- `api/rss/feed-parser.ts` - Integrate filtering pipeline
- `data/classification-keywords.json` - Keyword lists with weights

**Success Criteria:** 90%+ content relevance, <$50/month LLM costs, <5 second processing time per article

---

### 4. Data Quality Fixes (Day 8-10)

**Goal:** Fix author name parsing and content display issues

**Known issues:**
- Author names: `<name>/u/AbdulRoosetrane</name><uri>https://www.reddit.com/user/AbdulRoosetrane</uri>`
- Truncated titles and poor snippet extraction
- HTML/XML tags in content

**Tasks:**
- [ ] **4.1** Fix author name parsing:
  ```typescript
  function parseAuthorName(rawAuthor: string): string {
    return rawAuthor
      .replace(/<name>(.*?)<\/name>.*$/i, "$1")
      .replace(/<[^>]*>/g, "")
      .replace(/\/u\//, "")
      .trim();
  }
  ```
- [ ] **4.2** Implement smart title truncation (respect word boundaries)
- [ ] **4.3** Add proper HTML entity decoding
- [ ] **4.4** Sanitize all content for XSS prevention
- [ ] **4.5** Test parsing improvements across all active sources

**Success Criteria:** Clean author names, properly truncated titles, no HTML artifacts in content

---

### 5. Twitter/X Integration (Week 2)

**Goal:** Add high-quality social media content from key Ethereum accounts

**Priority accounts to integrate:**
- @VitalikButerin
- @ethereum  
- @EthereumJustin
- @drakefjustin
- @TimBeiko
- @dannyryan
- @nethermindeth
- @prylabs
- @lighthouse_team

**Tasks:**
- [ ] **5.1** Set up Twitter/X API v2 access (Bearer Token)
- [ ] **5.2** Create Twitter content fetcher service
- [ ] **5.3** Implement tweet normalization (convert to Post format)
- [ ] **5.4** Add Twitter content to classification pipeline
- [ ] **5.5** Handle Twitter rate limits (300 requests/15min)
- [ ] **5.6** Add tweet thread handling
- [ ] **5.7** Test integration with 5 priority accounts

**Files to create:**
- `api/twitter/fetch-tweets.ts` - Twitter API integration
- `lib/twitter-normalizer.ts` - Convert tweets to Post format
- `api/cron/twitter-sync.ts` - Scheduled Twitter fetching

**Success Criteria:** 20-30 high-quality tweets/day from priority accounts, properly formatted and classified

---

## 🛠️ MEDIUM PRIORITY (Weeks 3-4)

### 6. Admin Interface Development

**Goal:** Build management dashboard for operational efficiency

**Features needed:**
- [ ] **6.1** Featured content management (replace hardcoded featured.ts)
- [ ] **6.2** RSS source monitoring and health dashboard
- [ ] **6.3** Content moderation queue (review flagged items)
- [ ] **6.4** Classification accuracy monitoring
- [ ] **6.5** Cost tracking and budget alerts
- [ ] **6.6** Basic analytics (sources, categories, engagement)

**Implementation approach:**
- Next.js admin routes under `/admin/*`
- Simple auth with password protection initially
- Real-time data from existing APIs

---

### 7. Search Enhancement

**Goal:** Implement robust search capabilities

**Options to evaluate:**
- [ ] **7.1** **Algolia** (hosted, $300+/month, fastest implementation)
- [ ] **7.2** **Elasticsearch** (self-hosted on DigitalOcean, $50/month, more control)
- [ ] **7.3** **PostgreSQL full-text search** (current Supabase, $0 extra, limited features)

**Recommended:** Start with PostgreSQL full-text search for MVP, migrate to Algolia when budget allows

---

### 8. Performance Optimizations

**Goal:** Improve site speed and user experience

- [ ] **8.1** Fix Vercel KV integration (currently failing, using memory cache)
- [ ] **8.2** Implement proper Redis caching layer
- [ ] **8.3** Add CDN for static assets
- [ ] **8.4** Optimize database queries and indexing
- [ ] **8.5** Add skeleton loading states
- [ ] **8.6** Implement service worker for offline support

---

## 📋 BACKLOG (Weeks 5-8)

### 9. Architecture & Code Quality

**Goal:** Improve maintainability and developer experience

- [ ] **9.1** Restructure project folders for better organization
- [ ] **9.2** Add comprehensive TypeScript types
- [ ] **9.3** Implement structured logging system (replace console.log)
- [ ] **9.4** Add comprehensive testing (unit + integration)
- [ ] **9.5** Security audit and penetration testing
- [ ] **9.6** Add proper error monitoring (Sentry integration)
- [ ] **9.7** Create deployment automation and CI/CD
- [ ] **9.8** Add API documentation (OpenAPI/Swagger)

### 10. User Experience Enhancements

- [ ] **10.1** Dark mode CSS cleanup (remove !important overrides)
- [ ] **10.2** Theme persistence across sessions
- [ ] **10.3** Better mobile navigation and gestures
- [ ] **10.4** Content bookmarking and favorites
- [ ] **10.5** Email newsletter subscription
- [ ] **10.6** Social sharing improvements
- [ ] **10.7** Accessibility audit and WCAG 2.1 compliance

### 11. Community Features

- [ ] **11.1** User feedback system (report inappropriate content)
- [ ] **11.2** Community voting on content quality
- [ ] **11.3** Web3 wallet authentication
- [ ] **11.4** Personalized feeds based on wallet activity
- [ ] **11.5** Community-submitted content workflow

### 12. Additional Data Sources

- [ ] **12.1** GitHub API for EIP updates and protocol repos
- [ ] **12.2** YouTube API for educational content
- [ ] **12.3** Podcast RSS feeds with better parsing
- [ ] **12.4** Event aggregation from multiple sources
- [ ] **12.5** Grant tracking from multiple platforms
- [ ] **12.6** Job board integrations beyond RSS

---

## 📊 Success Metrics

### Content Quality KPIs
- **Relevance Rate:** >90% (currently ~60%)
- **User Engagement:** >3min average session time
- **Content Freshness:** <2 hours for breaking news
- **Source Reliability:** >95% uptime for enabled sources

### Technical KPIs  
- **Page Load Time:** <2 seconds
- **API Response Time:** <200ms
- **Classification Cost:** <$50/month
- **Search Response Time:** <100ms

### Operational KPIs
- **Content Volume:** 50-100 relevant posts/day
- **Admin Efficiency:** <30min daily content management
- **User Feedback:** <5% inappropriate content reports

---

## 🚨 Risk Management

### Technical Risks
- **LLM Cost Overrun:** Implement usage caps and monitoring
- **API Rate Limits:** Implement proper queuing and retry logic  
- **Database Performance:** Monitor query performance and add indexing
- **Source Reliability:** Implement health checks and fallbacks

### Content Risks
- **Misinformation:** Multi-source verification for breaking news
- **Legal Issues:** Clear attribution and fair use compliance
- **Bias:** Diverse source portfolio and transparent moderation

### Operational Risks
- **Single Point of Failure:** Document all processes and create backups
- **Cost Management:** Monthly budget reviews and automated alerts
- **Team Knowledge:** Comprehensive documentation and code comments

---

## 📅 Timeline Summary

| Week | Focus | Deliverables |
|------|-------|-------------|
| **Week 1** | Content Curation | Manual source filtering, failed source fixes, keyword heuristics |
| **Week 2** | LLM Integration | Complete Method 3 implementation, Twitter integration start |
| **Week 3** | Twitter & Admin | Twitter integration complete, admin interface MVP |
| **Week 4** | Polish & Performance | Search enhancement, performance optimizations |
| **Week 5-8** | Architecture & UX | Code quality improvements, user experience enhancements |

**Total Timeline:** 8 weeks to production-ready, intelligently curated platform

---

## 📝 Notes

- **Budget Estimate:** $75-150/month for production (Supabase + Vercel + LLM + monitoring)
- **Team Size:** 1-2 developers can handle this roadmap
- **Dependencies:** Twitter API access, LLM provider account setup
- **Fallback Plans:** Each major feature has simpler alternatives documented

---

**Last Updated:** 2026-02-09
**Next Review:** Weekly during critical priority phase, bi-weekly after
