# Ethereum Gazette - Quick Reference

## 🚀 Common Commands

```bash
# Development
cd app && npm run dev        # Start dev server
npm run build                    # Build for production
npm run type-check              # Check TypeScript

# Deployment
git push origin main            # Auto-deploy via GitHub
vercel --prod                   # Manual deploy

# Testing
curl https://ethereumworld.42labs.io/api/stats
curl https://ethereumworld.42labs.io/api/rss/sources
```

## 📁 Project Structure

```
ethereum-gazette/
├── app/             # React application
├── api/             # Vercel functions
├── data/            # Static data (RSS sources)
├── db/              # Database schema & migrations
├── lib/             # Shared libraries
├── scripts/         # Operational scripts
├── admin/           # Admin tools
├── types/           # TypeScript types
└── docs/            # Technical documentation
```

## 🔗 Key URLs

- **Production:** https://ethereumworld.42labs.io
- **GitHub:** https://github.com/42piratas/ethereum-gazette
- **Vercel:** https://vercel.com/dashboard

## 📊 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/api/stats` | Network statistics (5min cache) |
| `/api/rss/sources` | Feed configuration |
| `/api/rss/test-parser?url=X` | Test RSS parsing |

## 🎨 Design Tokens

**Breakpoints:**
- Mobile: <768px
- Tablet: 768px-1024px
- Desktop: >1024px

**Character Limits:**
- Regular cards: 110/270
- Featured L1: 100/200
- Featured L2: 50/100
- Social: 0/270

## 🔧 Environment Variables

```bash
ALCHEMY_API_KEY=xxx      # Ethereum data
ETHERSCAN_API_KEY=xxx    # Gas prices
CRON_SECRET=xxx          # Secure crons
DATABASE_URL=xxx         # PostgreSQL (future)
```

## 📦 Tech Stack

- **Frontend:** React + TypeScript + Tailwind
- **Backend:** Vercel Functions
- **State:** Zustand
- **APIs:** Alchemy, Etherscan, CoinGecko
- **Deploy:** Vercel + GitHub

## 🐛 Debug Tips

```bash
# Check logs
vercel logs

# Force rebuild
git commit --allow-empty -m "rebuild"

# Test locally
vercel dev
```

## 📈 Current Status

- ✅ UI/UX Complete
- ✅ Network stats live
- ✅ RSS parser ready
- 🚧 Database integration
- 📋 Social feeds planned
