# Ethereum Gazette: Content Curation

Method 3 curation pipeline, source tiering, keyword filtering, LLM classification, and source management.

---

## Curation Philosophy

Ethereum Gazette is a **curated** aggregator — quality over quantity. All content must be directly related to the core Ethereum ecosystem. Adjacent topics (Bitcoin, other chains) are included only when directly relevant to Ethereum.

### Content Priorities

- **High:** Protocol changes, security issues, major launches, regulatory updates
- **Medium:** Market analysis, educational content, community discussions
- **Low:** Opinion pieces, historical content, tangential topics

### Freshness Requirements

- Breaking news: within 1 hour of publication
- Daily updates: within 24 hours
- Educational: no strict time limits (evergreen)

---

## Method 3: Multi-Stage Curation Pipeline

### Stage 1 — Source Tiering (Complete)

Sources classified into 3 tiers with different filtering strategies:

#### Tier 1: Core Ethereum Sources (6 sources — auto-approve)

| Source                    | Rationale                            |
|:--------------------------|:-------------------------------------|
| Ethereum Foundation Blog  | Official announcements               |
| Vitalik Buterin's Blog    | Co-founder insights                  |
| EthResearch               | Core protocol research               |
| Week in Ethereum News     | Comprehensive ecosystem roundup      |
| EF Grants                 | Official grant announcements         |
| EthStaker                 | Staking community                    |

- Cost: $0, Relevance: 95–100%
- ~15% of total content volume

#### Tier 2: High-Relevance Sources (18 sources — keyword filtering)

Projects (8): Uniswap, Aave, Lido, MakerDAO, Optimism, Arbitrum, StarkWare, zkSync
News (3): CoinDesk Ethereum, The Defiant, Bankless
Community (4): Reddit r/ethereum, Ethereum Magicians, Ethereum Cat Herders, MakerDAO Governance
Education (3): EthHub, Finematics, Alchemy Blog

- Cost: ~$5/month, Relevance: 70–85% after filtering
- ~50% of total content volume

#### Tier 3: Ecosystem Sources (15 sources — LLM classification)

General crypto news, multi-chain projects, podcasts, governance forums, job boards.

- Cost: ~$40/month, Relevance: 30–60% before filtering, 80–90% after
- ~35% of total content volume

### Stage 2 — Keyword Heuristics (Complete & Deployed)

```typescript
interface KeywordConfig {
  keywords: Record<string, {
    weight: number
    description: string
    terms: string[]
  }>
  contextualRules: Record<string, {
    description: string
    pattern: string
    weightModifier: number
  }>
  thresholds: {
    autoApprove: number   // >= 1.2
    autoReject: number    // <= -0.5
    reviewQueue: { min: number; max: number }
  }
}
```

**Implementation details:**

- 319 keywords across 12 categories with weighted scoring
- Context-aware: title words 2x, URL 1.5x, snippet 1x
- 6 contextual rules for pattern detection (competitive dominance, spam, etc.)
- Three-tier decision: auto-approve, auto-reject, review queue
- Review items excluded from publication, logged to Supabase tables
- Config: `data/keyword-filter-config.json`
- Code: `api/rss/keyword-filter.ts`

**Current accuracy:** 100% on 25 test cases (Phase 2 complete).

### Stage 3 — LLM Classification (Pending)

For Tier 3 sources only:

```typescript
interface LLMClassification {
  model: 'claude-3-haiku' | 'gemini-1.5-flash'
  input: { title: string; snippet: string }   // No full article
  output: { is_core_ethereum: boolean; reason: string }
}
```

- Processes title + snippet only (cost optimization)
- Expected cost: <$0.01 per article, ~$40/month total
- Binary classification with structured JSON output

---

## Source Quality Standards

### Tier Promotion/Demotion Criteria

**Promote to higher tier:**
- Consistent high-quality Ethereum content (>90% relevant)
- Established editorial standards
- Technical accuracy track record

**Demote or disable:**
- Consistent quality issues or misinformation
- Technical reliability problems (broken RSS, timeouts)
- Community complaints
- Off-topic drift

### Adding New Sources

1. Evaluate: editorial quality, Ethereum relevance, technical accuracy, community reputation
2. Trial period: 30 days monitoring with quality tracking
3. Approve: assign tier, category, and keyword filter rules
4. Document: update source tier list

### Removing Sources

1. Trigger: consistent quality issues, broken feed, editorial violations
2. Review: analyze performance data and community feedback
3. Disable: set `enabled: false` in feed-sources.json
4. Document: update source tier list with reason

---

## Content Categories & Targets

| Category    | Target %   | Priority   | Active Sources |
|:------------|:-----------|:-----------|:---------------|
| News        | 40–50%     | High       | 5              |
| Communities | 20–25%     | High       | 4              |
| Projects    | 15–20%     | High       | 8              |
| Education   | 8–12%      | Medium     | 3              |
| People      | 5–8%       | Medium     | 1              |
| DAOs        | 5–8%       | Medium     | 3              |
| Events      | 3–5%       | Low-Medium | 0 (broken)     |
| Grants      | 2–3%       | Low        | 1              |
| Orgs        | 2–3%       | Low        | 0              |
| Jobs        | 1–2%       | Low        | 2              |

---

## Current Source Status

- **Total configured:** 42
- **Active:** 34 (6 Tier 1 + 18 Tier 2 + 10 Tier 3)
- **Temporarily disabled:** 5 (high noise, pending LLM filter)
- **Permanently broken:** 3 (ETH.Build 404, ETHGlobal 404, Messari 429)

---

## Filter Logging

All filtering decisions are logged to Supabase:

- **`filter_rejected`** — items that scored below auto-reject threshold, with reason
- **`filter_review`** — items in the review queue (between thresholds), with score

This data is used to tune keywords, thresholds, and evaluate source quality.

---

## Auto-Categorization

### Domain-Based

Sources are pre-categorized by domain in `feed-sources.json`. Each source maps to exactly one category.

### Keyword-Based Override

```
news:      ["upgrade", "fork", "regulation", "sec", "adoption"]
projects:  ["protocol", "launch", "integration", "defi", "l2"]
education: ["tutorial", "guide", "explained", "how-to", "learn"]
events:    ["conference", "meetup", "hackathon", "devconnect"]
grants:    ["funding", "grant", "proposal", "ecosystem support"]
```

Manual overrides take precedence over both auto-categorization methods.

---

## Deduplication

Content ID generated from URL + publication date:

```typescript
const contentId = crypto
  .createHash('sha256')
  .update(url + pubDate)
  .digest('hex')
  .slice(0, 16)
```

---

## Featured Content

- **Level 1:** 1 item, gradient background, primary featured
- **Level 2:** 3 items, standard cards
- Currently hardcoded in `app/src/data/featured.ts`
- Manually curated, long-term placement (not dynamic rotation)
- Admin interface planned for future phase

---

**Last Updated:** 2026-03-20
