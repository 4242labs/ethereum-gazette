# Ethereum Gazette — Documentation

> The minimalist, curated front page of the Ethereum ecosystem.

This project is archived (sunset July 2026). See the [root README](../README.md) for context
and setup. These documents describe the system as it ran.

## Index

| Doc | Describes |
|:--|:--|
| [system-overview.md](system-overview.md) | Vision, categories, product spec, metrics |
| [system-map.md](system-map.md) | Architecture, API endpoints, DB schema, data pipeline |
| [content-curation.md](content-curation.md) | Method 3 curation — source tiers, keyword scoring |
| [guidelines-code.md](guidelines-code.md) | TypeScript, React, testing & security standards |
| [guidelines-frontend.md](guidelines-frontend.md) | Design system, colors, cards, responsive rules |
| [playbook-dev.md](playbook-dev.md) | Local dev setup, deployment, troubleshooting |
| [backlog.md](backlog.md) | Feature backlog at time of sunset |

## Tech stack

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS + Zustand
- **Backend:** Vercel Functions (Node.js) + PostgreSQL (Supabase)
- **Data:** 42 curated RSS sources with the Method 3 curation pipeline

## License

Open source — [AGPL-3.0](../LICENSE). Commercial — contact ahoy@42labs.io. © 42labs.
