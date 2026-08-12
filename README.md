# Ethereum Gazette

[![No Maintenance Intended](https://unmaintained.tech/badge.svg)](https://unmaintained.tech/)

> **The Front Page of Ethereum** — a minimalist, curated aggregator for the Ethereum ecosystem.

> [!NOTE]
> **This project is archived (sunset July 2026).** It is no longer maintained and the
> hosted service at `ethereumgazette.com` has been retired. The code is published as-is
> so anyone can reuse the aggregation engine, the multi-stage content-curation pipeline,
> or the frontend. No support, warranty, or ongoing updates are provided.

---

## What this is

Ethereum Gazette was a single destination for discovering what's happening across the
Ethereum ecosystem — news, projects, people, orgs, events, jobs, grants and more — without
navigating dozens of sources. It ran a live pipeline that ingested RSS feeds every 15
minutes, filtered them through a cost-aware multi-stage curation system ("Method 3"), and
served the results through a clean React frontend.

This repository contains the **complete engine**: ingestion, curation, storage, API, and UI.
The RSS source list and keyword configuration we used are included as-is — treat them as a
starting point and swap in your own.

## Architecture

```
┌─────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  React SPA  │───▶│ Vercel Functions │───▶│  RSS / Chain    │
│ (Vite + TS) │◀───│   (Node.js)      │◀───│  external APIs  │
└─────────────┘    └────────┬─────────┘    └─────────────────┘
                            │
                            ▼
                   ┌──────────────────┐
                   │   PostgreSQL     │
                   │   (Supabase)     │
                   └──────────────────┘
```

- **Frontend** (`app/`) — React 19 + TypeScript + Vite + Tailwind CSS + Zustand.
- **API** (`api/`) — Vercel serverless functions: posts, RSS sources, and a cron ingestion endpoint.
- **Pipeline** (`api/`, `data/`, `scripts/`) — RSS fetch → normalize → Method 3 filter → dedupe → store.
- **Database** (`db/`) — PostgreSQL schema and seeds (built for Supabase, any Postgres works).
- **Curation config** (`data/`) — RSS source tiers and the keyword-scoring configuration.

### Method 3 — the curation pipeline

A three-stage filter designed to keep hosting costs low while maintaining relevance:

1. **Source tiering** — Tier 1 sources auto-approve; Tier 2 go through keyword heuristics; Tier 3 were reserved for LLM classification.
2. **Keyword heuristics** — weighted keyword scoring across categories (title 2×, URL 1.5×, snippet 1×) with auto-approve / auto-reject / review thresholds.
3. **LLM classification** — a binary "is this core Ethereum?" pass (designed, not shipped before sunset).

See [`docs/content-curation.md`](docs/content-curation.md) for the full design.

## Getting started

```bash
git clone https://github.com/4242labs/ethereum-gazette.git
cd ethereum-gazette

# Install root (API) + app dependencies
npm install && cd app && npm install && cd ..

# Configure environment (see .env.example files)
cp .env.example .env.local
cp app/.env.example app/.env.local

# Set up the database (any PostgreSQL / Supabase)
psql "$POSTGRES_URL" -f db/schema.sql
psql "$POSTGRES_URL" -f db/seed-sources.sql

# Run the frontend
cd app && npm run dev
```

The frontend supports two data modes via `VITE_DATA_MODE`: `static` (bundled snapshot, zero
backend) or `live` (API + database).

## Configuration

| File | Purpose |
|:--|:--|
| `.env.example` | Backend/API keys and database URL |
| `app/.env.example` | Frontend Supabase config and data mode |
| `data/feed-sources.json` | RSS sources with tier + category |
| `data/keyword-filter-config.json` | Keyword scoring weights and thresholds |
| `data/category-keywords.json` | Per-category keyword lists |

## Documentation

Full technical docs live in [`docs/`](docs/):

- [`system-overview.md`](docs/system-overview.md) — vision, categories, product spec
- [`system-map.md`](docs/system-map.md) — architecture, API, DB schema, pipeline
- [`content-curation.md`](docs/content-curation.md) — Method 3 in detail
- [`guidelines-code.md`](docs/guidelines-code.md) / [`guidelines-frontend.md`](docs/guidelines-frontend.md) — code & design standards
- [`playbook-dev.md`](docs/playbook-dev.md) — dev setup and operations

## License

Open source — [AGPL-3.0](LICENSE). Commercial — contact ahoy@42labs.io.

---
If it earned its keep, [coffee is appreciated](https://buymeacoffee.com/42piratas). ☕
