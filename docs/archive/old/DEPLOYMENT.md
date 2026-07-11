# Ethereum Gazette - Deployment Guide

## Overview

This guide covers deployment, infrastructure setup, and operational procedures for Ethereum Gazette.

## Quick Deploy

```bash
# Deploy to production
git push origin main

# Manual deploy
vercel --prod
```

## Infrastructure

### Vercel Configuration

**Project Settings:**
- Framework: Vite
- Root Directory: (leave empty)
- Build Command: `cd app && npm run build`
- Output Directory: `app/dist`
- Node Version: 18.x

**vercel.json:**
```json
{
  "buildCommand": "cd app && npm run build",
  "outputDirectory": "app/dist",
  "installCommand": "cd app && npm install",
  "functions": {
    "api/*.ts": {
      "maxDuration": 10
    }
  }
}
```

### Environment Variables

**Required:**
- `ALCHEMY_API_KEY` - Ethereum network data
- `ETHERSCAN_API_KEY` - Gas prices and stats
- `CRON_SECRET` - Secure cron endpoints

**Optional:**
- `KV_URL` - Redis connection (auto-added)
- `DATABASE_URL` - PostgreSQL (future)

## API Endpoints

**Production Base:** `https://ethereumworld.42labs.io`

| Endpoint | Description | Cache |
|----------|-------------|-------|
| `/api/stats` | Network statistics | 5 min |
| `/api/rss/sources` | Feed sources | 1 min |
| `/api/rss/test-parser` | Parse single feed | None |

## External Services

### Data Sources

**CoinGecko (Market Data)**
- Free tier: 10-30 calls/min
- No API key required
- Endpoint: `/api/v3/simple/price`

**Etherscan (Network Data)**
- Free tier: 5 calls/sec
- API key required
- Endpoints: Gas oracle, daily transactions

**Alchemy SDK (Blockchain)**
- Free tier: 300M compute units/month
- API key required
- Direct node access

**Beacon Chain (Staking)**
- No authentication
- Endpoint: `beaconcha.in/api/v1/epoch/latest`

### Rate Limits

With 5-minute caching:
- 288 API calls/day per source
- Well within all free tiers
- Scales to 100k+ users without additional cost

## Deployment Process

### GitHub Integration

1. **Automatic:** Push to `main` branch
2. **Preview:** Create pull request
3. **Rollback:** Promote previous deployment

### Pre-Deployment Checklist

- [ ] Run type checking: `npm run type-check`
- [ ] Test build locally: `npm run build`
- [ ] Verify environment variables set
- [ ] Check API endpoints working
- [ ] Review bundle size (<200KB initial)

### Post-Deployment Verification

- [ ] Check production URL loads
- [ ] Test all API endpoints
- [ ] Verify mobile responsiveness
- [ ] Monitor error logs
- [ ] Validate cache headers

## Monitoring

### Vercel Dashboard

- **Functions:** Monitor execution and errors
- **Analytics:** Traffic and performance
- **Logs:** Real-time function logs
- **Usage:** Track against limits

### Key Metrics

- API response time: <2s target
- Success rate: >99.5% target
- Cache hit rate: >90% target
- Bundle size: <200KB initial

## Troubleshooting

### Common Issues

**Build Failures:**
- Check TypeScript errors
- Verify dependencies installed
- Review build logs

**API 404 Errors:**
- Ensure `/api` at root level
- Check function exports
- Verify file naming

**Slow Performance:**
- Review function logs
- Check external API latency
- Verify caching working

### Debug Commands

```bash
# View logs
vercel logs

# List deployments
vercel ls

# Check environment
vercel env ls

# Force redeploy
git commit --allow-empty -m "force deploy"
git push origin main
```

## Cost Management

**Current Monthly:**
- Vercel Pro: $20
- Redis: Free (30MB)
- APIs: Free tiers
- **Total: $20**

**Scaling Thresholds:**
- 1TB bandwidth
- 1M function executions
- 6000 build minutes

## Security

### Best Practices

- Rotate secrets quarterly
- Use environment variables
- Enable CORS restrictions
- Implement rate limiting
- Regular dependency updates

### Headers Configuration

```json
{
  "headers": [{
    "source": "/(.*)",
    "headers": [
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "X-Frame-Options", "value": "DENY" },
      { "key": "X-XSS-Protection", "value": "1; mode=block" }
    ]
  }]
}
```

## Backup & Recovery

### Code Backup
- Primary: GitHub
- Local: Development machine

### Deployment Rollback
1. Vercel Dashboard → Deployments
2. Find working deployment
3. Menu → "Promote to Production"

### Data Recovery
- Stats: Regenerated from APIs
- RSS: Re-fetched on schedule
- Cache: Rebuilds automatically

---

**Last Updated:** 2024-12-28
