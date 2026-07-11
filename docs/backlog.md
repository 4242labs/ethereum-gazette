# Ethereum Gazette: Backlog

Feature backlog organized by priority. Active work tracked in `meta/pipeline.md`.

---

## High Priority

### Method 3 Phase 3: LLM Classification

- Integrate Claude 3 Haiku or Gemini 1.5 Flash for Tier 3 source filtering
- Process title + snippet only (cost optimization)
- Binary classification with structured JSON output
- Cost monitoring and usage alerts
- Target: <$50/month, 90%+ relevance

### Admin Interface

- Featured content management (replace hardcoded `featured.ts`)
- RSS source monitoring and health dashboard
- Content moderation queue (review flagged items)
- Classification accuracy monitoring
- Cost tracking and budget alerts

### Twitter/X Integration

- Priority accounts: @VitalikButerin, @ethereum, @TimBeiko, @drakefjustin, @dannyryan
- Tweet normalization to Post format
- Rate limit handling (300 req/15min)
- Thread handling

---

## Medium Priority

### Search Enhancement

- Start with PostgreSQL full-text search (Supabase, $0 extra)
- Migrate to Algolia when budget allows
- Search suggestions and autocomplete

### Performance

- Fix Vercel KV integration (currently using in-memory fallback)
- CDN for static assets
- Service worker for offline support
- Database query optimization

### Code Quality

- Remove `!important` CSS overrides for dark mode
- Implement structured logging (replace console.log)
- Comprehensive testing (unit + integration + E2E)
- Security audit
- Sentry integration for error monitoring
- API documentation (OpenAPI/Swagger)

---

## Low Priority / Future

### UX Enhancements

- Theme persistence across sessions (Zustand persist middleware)
- Better mobile navigation and gestures
- Content bookmarking and favorites
- Email newsletter subscription
- Accessibility audit (WCAG 2.1 AA)
- Twitter/X-like column scrolling behavior

### Community Features

- User feedback system (report content)
- Community voting on content quality
- Web3 wallet authentication
- Personalized feeds based on wallet activity
- Community-submitted content workflow

### Additional Data Sources

- GitHub API for EIP updates and protocol repos
- YouTube API for educational content
- Event aggregation from multiple sources
- Grant tracking from multiple platforms
- Job board integrations beyond RSS

---

**Last Updated:** 2026-03-20
