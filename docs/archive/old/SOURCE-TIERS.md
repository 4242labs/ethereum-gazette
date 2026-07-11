# Ethereum Gazette - Source Tier Analysis

## Overview

This document provides a detailed analysis of all 42 RSS sources, organized by relevance to core Ethereum content. This tiering system is the foundation for intelligent content filtering and cost-effective curation.

---

## 🏆 Tier 1: Core Ethereum Sources (Auto-Approve)

**Criteria:** Official sources, core protocol content, high editorial standards
**Treatment:** All content auto-approved (0 cost filtering)
**Expected Relevance:** 95-100%

### Sources (6 total)

| ID | Name | URL | Rationale |
|----|------|-----|-----------|
| 1 | Ethereum Foundation Blog | `blog.ethereum.org/feed/` | Official Ethereum Foundation announcements |
| 2 | Week in Ethereum News | `weekinethereumnews.com/feed/` | Comprehensive Ethereum ecosystem roundup |
| 7 | Vitalik Buterin's Blog | `vitalik.eth.limo/feed.xml` | Ethereum co-founder insights |
| 23 | EthResearch | `ethresear.ch/latest.rss` | Core protocol research discussions |
| 26 | EF Grants | `blog.ethereum.org/en/category/grants/feed/` | Official grant announcements |
| 37 | EthStaker | `ethstaker.cc/feed/` | Ethereum staking community |

**Impact:** ~15% of total content volume, 100% relevance rate

---

## ✅ Tier 2: High-Relevance Sources (Keyword + Context Filtering)

**Criteria:** Trusted projects, established media, core ecosystem participants
**Treatment:** Keyword heuristics + context analysis
**Expected Relevance:** 70-85%

### Project Sources (8 total)

| ID | Name | URL | Notes |
|----|------|-----|-------|
| 11 | Uniswap Blog | `blog.uniswap.org/rss.xml` | Leading DEX protocol updates |
| 12 | Aave Blog | `medium.com/feed/aave` | DeFi lending protocol |
| 13 | Lido Blog | `blog.lido.fi/rss/` | Liquid staking leader |
| 14 | MakerDAO Blog | `blog.makerdao.com/feed/` | Dai stablecoin protocol |
| 15 | Optimism Blog | `optimism.mirror.xyz/feed/atom` | Major L2 solution |
| 16 | Arbitrum Blog | `offchain.medium.com/feed` | Major L2 solution |
| 38 | StarkWare Blog | `medium.com/feed/starkware` | ZK-rollup technology |
| 39 | zkSync Blog | `blog.matter-labs.io/feed` | ZK-rollup L2 |

### News Sources (3 total)

| ID | Name | URL | Notes |
|----|------|-----|-------|
| 3 | CoinDesk Ethereum | `coindesk.com/arc/outboundfeeds/rss/?tag=ethereum` | Filtered for Ethereum content |
| 35 | The Defiant | `thedefiant.io/feed/` | DeFi-focused news outlet |
| 18 | Bankless | `banklesshq.com/feed` | Ethereum-native media |

### Community Sources (4 total)

| ID | Name | URL | Notes |
|----|------|-----|-------|
| 22 | Reddit r/ethereum | `reddit.com/r/ethereum/.rss` | Main Ethereum subreddit |
| 24 | Ethereum Magicians | `ethereum-magicians.org/latest.rss` | EIP discussion forum |
| 42 | Ethereum Cat Herders | `medium.com/feed/ethereum-cat-herders` | Protocol coordination |
| 27 | MakerDAO Governance | `forum.makerdao.com/latest.rss` | DAO governance |

### Education Sources (3 total)

| ID | Name | URL | Notes |
|----|------|-----|-------|
| 9 | EthHub | `ethhub.substack.com/feed` | Educational content |
| 10 | Finematics | `finematics.com/feed/` | DeFi education |
| 41 | Alchemy Blog | `alchemy.com/blog/rss.xml` | Developer tutorials |

**Impact:** ~50% of total content volume, 75-85% relevance rate after filtering

---

## ⚠️ Tier 3: Ecosystem Sources (LLM Classification Required)

**Criteria:** Broader crypto focus, tool-specific content, mixed relevance
**Treatment:** Full Method 3 pipeline (keyword + LLM classification)
**Expected Relevance:** 30-60% before filtering, 80-90% after

### General Crypto News (5 total)

| ID | Name | URL | Issue |
|----|------|-----|--------|
| 4 | The Block | `theblock.co/rss.xml` | Covers all cryptocurrencies |
| 5 | Decrypt | `decrypt.co/feed` | Broad Web3 coverage |
| 6 | Cointelegraph Ethereum | `cointelegraph.com/rss/tag/ethereum` | Mixed quality, sensationalist |
| 30 | ConsenSys | `consensys.net/blog/feed/` | Corporate blog, product-focused |
| 36 | Messari | `messari.io/rss` | Multi-chain research |

### Project Sources (Mixed Relevance) (3 total)

| ID | Name | URL | Issue |
|----|------|-----|--------|
| 33 | Polygon Blog | `polygon.technology/blog/rss.xml` | Separate blockchain, Ethereum-compatible |
| 34 | Chainlink Blog | `blog.chain.link/rss/` | Multi-chain oracle, not Ethereum-specific |
| 40 | Scroll Blog | `scroll.io/blog/rss.xml` | zkEVM L2, newer project |

### Media/Podcasts (4 total)

| ID | Name | URL | Issue |
|----|------|-----|--------|
| 19 | Unchained Podcast | `unchainedpodcast.com/feed/podcast/` | Broad crypto coverage |
| 20 | Zero Knowledge Podcast | `zeroknowledge.fm/feed/podcast/` | ZK-focused, not Ethereum-specific |
| 21 | Epicenter Podcast | `epicenter.tv/feed/podcast/` | Broad blockchain coverage |
| 25 | Gitcoin Blog | `gitcoin.co/blog/rss.xml` | Multi-chain grants platform |

### Governance/DAOs (2 total)

| ID | Name | URL | Issue |
|----|------|-----|--------|
| 28 | Uniswap Governance | `gov.uniswap.org/latest.rss` | Governance-specific content |
| 29 | ENS DAO | `discuss.ens.domains/latest.rss` | ENS-specific governance |

### Jobs (2 total)

| ID | Name | URL | Issue |
|----|------|-----|--------|
| 31 | Crypto Jobs List | `cryptojobslist.com/ethereum?format=rss` | Jobs have lower content value |
| 32 | Web3 Career | `web3.career/feed` | Broad Web3 jobs, not Ethereum-specific |

**Impact:** ~35% of total content volume, requires expensive filtering

---

## 🚫 Currently Disabled Sources (3 total)

Sources disabled due to technical issues or testing:

| ID | Name | URL | Status |
|----|------|-----|--------|
| 8 | ETH.Build Blog | `sandbox.eth.build/feed` | RSS feed not accessible |
| 17 | ETHGlobal Events | `ethglobal.com/events/rss` | RSS format issues |
| 36 | Messari | `messari.io/rss` | Disabled for testing (Tier 3) |

**Action Required:** Test and fix these sources or find alternatives

---

## 📊 Tier Distribution Analysis

### Content Volume Distribution
- **Tier 1:** 15% (6 sources) - High quality, auto-approved
- **Tier 2:** 50% (18 sources) - Good quality, keyword filtered  
- **Tier 3:** 35% (15 sources) - Mixed quality, LLM filtered

### Cost Analysis
- **Tier 1:** $0/month (auto-approved)
- **Tier 2:** ~$5/month (keyword processing)
- **Tier 3:** ~$40/month (LLM classification)
- **Total:** ~$45/month for intelligent curation

### Expected Quality Improvement
- **Before filtering:** ~60% relevance across all content
- **After Method 3:** ~90% relevance across all content
- **Noise reduction:** 40-50% of irrelevant content eliminated

---

## 🎯 Immediate Actions (This Week)

### Phase 1: Quick Wins (Day 1)
1. **Temporarily disable highest-noise Tier 3 sources:**
   - The Block (ID: 4) - Too broad crypto coverage
   - Decrypt (ID: 5) - Mixed Web3 content
   - Cointelegraph (ID: 6) - Low editorial quality
   - Polygon Blog (ID: 33) - Different blockchain focus
   - Chainlink Blog (ID: 34) - Multi-chain, not Ethereum-specific

2. **Monitor content quality for 24 hours**
3. **Measure noise reduction and user feedback**

### Phase 2: Source Health Check (Day 2)
1. **Test disabled sources:**
   - ETH.Build Blog - Find working RSS URL or alternative
   - ETHGlobal Events - Fix RSS parsing or find alternative
   - Messari - Evaluate if worth re-enabling with filtering

2. **Re-enable working sources with appropriate tier assignment**

### Phase 3: Method 3 Implementation (Days 3-7)
1. **Implement source tiering logic**
2. **Build keyword heuristics engine**
3. **Integrate LLM classification for Tier 3**
4. **Test and refine filtering pipeline**

---

## 📈 Success Criteria

### Immediate (Week 1)
- [ ] 40-60% reduction in off-topic content
- [ ] All enabled sources functioning properly
- [ ] User feedback shows improved relevance

### Short-term (Week 2-3)
- [ ] 90%+ content relevance after full Method 3 implementation
- [ ] LLM costs under $50/month
- [ ] Processing time under 5 seconds per article

### Long-term (Month 1)
- [ ] User engagement metrics improve (longer session times)
- [ ] Community feedback validates curation quality
- [ ] System handles 100+ posts/day with maintained quality

---

## 🔄 Review Process

### Weekly Reviews
- Monitor source performance and relevance rates
- Adjust tier assignments based on content quality
- Review classification accuracy and costs

### Monthly Reviews  
- Evaluate new sources for addition
- Remove consistently low-performing sources
- Update keyword lists and classification prompts

### Quarterly Reviews
- Major tier restructuring if needed
- Technology updates (new LLM models, approaches)
- Budget and cost optimization analysis

---

**Last Updated:** 2026-02-09  
**Next Review:** 2026-02-16 (after Method 3 implementation)
