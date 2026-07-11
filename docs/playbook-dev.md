# Ethereum Gazette: Developer Playbook

Local development, deployment, environment variables, build commands, and troubleshooting.

---

## Local Development

### Prerequisites

- Node.js 18.x
- npm
- Vercel CLI (`npm i -g vercel`)

### Setup

```bash
cd ethereum-gazette
cd app && npm install
```

### Development Server

```bash
# Frontend only (Vite HMR)
cd app && npm run dev

# Full stack with Vercel Functions
vercel dev
```

### Build & Type Check

```bash
cd app
npm run build          # Production build
npm run type-check     # TypeScript validation
npm run lint           # ESLint
```

---

## Project Structure

```
ethereum-gazette/
├── app/             # React application (Vite)
├── api/             # Vercel serverless functions
├── data/            # Static data (feed-sources.json, keyword-filter-config.json)
├── db/              # Database schema & migrations (SQL)
├── lib/             # Shared libraries (keyword-filter, source-tiers)
├── scripts/         # Operational scripts
├── admin/           # Admin tools (featured content sync)
├── types/           # TypeScript type definitions
└── docs/            # Technical documentation
```

---

## Deployment

### Automatic (preferred)

```bash
git push origin main    # Triggers Vercel deployment via GitHub integration
```

### Manual

```bash
vercel --prod           # Direct deploy via CLI
```

### Preview Deployments

Every pull request gets a preview URL automatically from Vercel.

### Rollback

1. Vercel Dashboard → Deployments
2. Find working deployment
3. Menu → "Promote to Production"

### Force Redeploy

```bash
git commit --allow-empty -m "redeploy"
git push origin main
```

---

## Environment Variables

### Required (Vercel Dashboard → Settings → Env Vars)

| Variable           | Description              |
|:-------------------|:-------------------------|
| `ALCHEMY_API_KEY`  | Ethereum network data    |
| `ETHERSCAN_API_KEY` | Gas prices and stats    |
| `CRON_SECRET`      | Secure cron endpoints    |

### App Mode (client-side, public value)

| Variable              | Description                          |
|:----------------------|:-------------------------------------|
| `VITE_DATA_MODE`      | Set to `static` for snapshot data; omit or any other value for live API (default: live) |

### Analytics (client-side, public values)

| Variable              | Description                          |
|:----------------------|:-------------------------------------|
| `VITE_MATOMO_URL`     | Matomo Cloud instance URL            |
| `VITE_MATOMO_SITE_ID` | Matomo site ID for Ethereum Gazette  |

### Optional

| Variable           | Description              |
|:-------------------|:-------------------------|
| `POSTGRES_URL`     | Supabase connection string (Session Pooler) |
| `KV_URL`           | Vercel KV / Redis        |

### Vercel Configuration

**vercel.json:**

```json
{
  "buildCommand": "cd app && npm run build",
  "outputDirectory": "app/dist",
  "installCommand": "cd app && npm install",
  "functions": {
    "api/posts/*.ts": { "maxDuration": 10 }
  }
}
```

---

## Vercel CLI Commands

```bash
vercel logs              # View function logs
vercel ls                # List deployments
vercel env ls            # Check environment variables
vercel link              # Link local project to Vercel
```

---

## Database (Supabase)

### Connection

Use **Session Pooler** connection string (IPv4 compatible) from Supabase Dashboard → Settings → Database → Connection Pooling.

Format: `postgresql://postgres.[REF]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true`

**Do NOT use** the direct connection (IPv6 only) — Vercel Functions require IPv4.

### Migrations

Run manually via Supabase SQL Editor:
1. Copy SQL from `db/migrations/`
2. Paste and run in Supabase SQL Editor

### Seeding

Run `db/seed-sources.sql` in Supabase SQL Editor to populate 42 RSS sources.

---

## External API Rate Limits

| Service      | Rate Limit          | Notes                    |
|:-------------|:--------------------|:-------------------------|
| CoinGecko    | 10–30 calls/min     | No API key required      |
| Etherscan    | 5 calls/sec         | API key required         |
| Alchemy      | 300M CU/month (free)| API key required         |
| Beacon Chain | No limit            | No auth                  |

With 5-minute caching: 288 calls/day per source — well within all free tiers.

---

## Pre-Deployment Checklist

- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] Bundle size <200KB initial JS
- [ ] Environment variables set in Vercel
- [ ] Test RSS parsing with author name handling
- [ ] Validate content classification pipeline

## Post-Deployment Checklist

- [ ] Production URL loads
- [ ] All API endpoints respond
- [ ] Mobile responsiveness works
- [ ] External links open in new tab
- [ ] Error logs clean
- [ ] Cache headers correct
- [ ] RSS source health verified

---

## Troubleshooting

### Build Failures

- Check TypeScript errors (`npm run type-check`)
- Verify dependencies installed (`npm install`)
- Review Vercel build logs

### API 404 Errors

- Ensure `/api` directory is at project root (not inside `app/`)
- Check function exports (must export default handler)
- Verify file naming matches route

### Supabase Connection Issues

- Use Session Pooler, not direct connection
- Check password encoding in connection string
- Verify project is active (not paused) in Supabase dashboard
- If DNS fails after unpause → restart project in Supabase settings

### Slow Performance

- Check Vercel function logs for external API latency
- Verify caching is working (5-min TTL for stats)
- Check bundle size for bloat

---

## Cost Overview

| Service         | Current Cost   | Notes                        |
|:----------------|:---------------|:-----------------------------|
| Vercel          | $0–20/month    | Free tier or Pro             |
| Supabase        | $0/month       | Free tier (500MB, dormant)   |
| External APIs   | $0/month       | All within free tiers        |
| LLM (planned)   | ~$40/month     | Method 3 Phase 3             |
| **Total**       | **$0–75/month**| Depending on active mode     |

---

### OG Image Backfill

One-time script to populate `image_url` for posts missing OG images:

```bash
export $(grep POSTGRES_URL .env.local | tr -d '"') && npx tsx scripts/backfill-og-images.ts
```

Requires `POSTGRES_URL` in `.env.local`.

### Reprocess Posts

One-time script to truncate titles (50 chars) and snippets (150 chars), and backfill missing OG images for the latest 200 posts:

```bash
# Dry run (preview changes, no DB writes)
export $(grep POSTGRES_URL .env.local | tr -d '"') && npx tsx scripts/reprocess-posts.ts --dry-run

# Live run
export $(grep POSTGRES_URL .env.local | tr -d '"') && npx tsx scripts/reprocess-posts.ts
```

Requires `POSTGRES_URL` in `.env.local`.

---

**Last Updated:** 2026-03-21
