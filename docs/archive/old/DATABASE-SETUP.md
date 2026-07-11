# Database Setup Guide - Ethereum Gazette

## Overview

This guide walks you through setting up PostgreSQL database for Ethereum Gazette's RSS feed aggregation system.

## Prerequisites

- Vercel account with project deployed
- 10 minutes for setup

## Option A: Supabase (Recommended)

### Step 1: Create Supabase Project

1. Go to https://supabase.com/
2. Sign in or create account
3. Click "New Project"
4. Fill in details:
   - **Name:** ethereum-gazette
   - **Database Password:** (generate strong password and save it)
   - **Region:** Choose closest to your users
   - **Plan:** Free tier (sufficient for MVP)
5. Click "Create new project" (takes ~2 minutes)

### Step 2: Get Connection String

1. In Supabase dashboard, go to **Settings** → **Database**
2. Scroll to **Connection String** section
3. Select **Connection Pooling** tab
4. Copy the connection string (should look like):
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
5. Replace `[PASSWORD]` with your actual database password

### Step 3: Add to Vercel

1. Go to Vercel dashboard: https://vercel.com/dashboard
2. Select your **ethereum-gazette** project
3. Go to **Settings** → **Environment Variables**
4. Add new variable:
   - **Key:** `POSTGRES_URL`
   - **Value:** (paste connection string from Step 2)
   - **Environments:** Check all (Production, Preview, Development)
5. Click **Save**

### Step 4: Run Migrations

### Step 5: Seed Feed Sources

1. In Supabase dashboard, stay in **SQL Editor**
2. Click **New Query** (or use the same one)
3. Copy the entire content from `db/seed-sources.sql`
4. Paste into the SQL editor
5. Click **Run** (bottom right)
6. Verify success: Should show "Success. 42 rows affected" (or similar)

7. Verify the data was inserted:
   ```sql
   SELECT COUNT(*) FROM feed_sources;
   SELECT name, category, enabled FROM feed_sources LIMIT 5;
   ```
   Should show 42 sources total

### Step 6: Verify Deployment

1. Trigger new Vercel deployment:

   ```bash
   git commit --allow-empty -m "redeploy with database"
   git push origin main
   ```

2. Wait for deployment (1-2 minutes)

3. Test database connection:

   ```bash
   curl https://ethereumworld.42labs.io/api/test-db
   ```

   Expected response:

   ```json
   {
     "success": true,
     "connection": "OK",
     "tables": ["feed_sources", "posts", "fetch_history"],
     "counts": {
       "sources": 42,
       "posts": 0
     }
   }
   ```

## Option B: Vercel Postgres

### Step 1: Create Database

1. Go to Vercel dashboard
2. Select **Storage** tab
3. Click **Create Database**
4. Select **Postgres**
5. Name: `ethereum-gazette-db`
6. Region: Same as your function region
7. Click **Create**

### Step 2: Connect to Project

1. Select the database you just created
2. Click **Connect Project**
3. Select your **ethereum-gazette** project
4. Vercel automatically adds `POSTGRES_URL` and related env vars

### Step 3: Run Migrations

1. Install Vercel CLI if not already:

   ```bash
   npm i -g vercel
   ```

2. Link project:

   ```bash
   vercel link
   ```

3. Run migration using Vercel's psql access or Supabase SQL Editor

### Step 4: Seed Data

Use Supabase SQL Editor to run `db/seed-sources.sql` (same as Option A, Step 5)

## Troubleshooting

### "Connection refused" or "Connection timeout"

- Check that connection string includes correct host and port
- Verify Supabase project is active (green indicator)
- Check if connection pooling is enabled

### "relation does not exist"

- Migrations not run yet - run Step 4 again
- Check SQL Editor for any errors during migration

### "Authentication failed"

- Double-check password in connection string
- Ensure no special characters broke the URL encoding

### "getaddrinfo ENOTFOUND" (DNS Failure)

- This indicates the database hostname cannot be found.
- If your project was recently **unpaused**, the DNS record for the connection pooler (`db.[ref].supabase.co`) may be missing.
- **Solution:** Restart the project in Supabase settings. If that fails, contact Supabase Support.
- **Workaround:** Try using the direct regional address (e.g., `aws-0-[region].pooler.supabase.com`) if you know your region and can configure the username correctly (`postgres.[ref]`).

### "connect ETIMEDOUT" (Network Timeout)

- This usually means a firewall is blocking the connection.
- **Vercel Users:** Vercel uses IPv4. Direct connections to Supabase (port 5432) are IPv6-only. You **MUST** use the Connection Pooler (port 6543) or Session Pooler (port 5432 via `aws-0` hostname).
- Check Supabase "Network Restrictions" to ensure `0.0.0.0/0` (Allow All) is enabled if connecting from serverless environments.

### Seed script fails (SQL method)

- Ensure migrations were run first (tables must exist)
- Check SQL syntax if using custom queries
- Use Supabase SQL Editor directly instead of local scripts
- Verify `db/seed-sources.sql` file exists and is readable

## Next Steps

Once database is set up and verified:

1. ✅ Database connected and tables created
2. ✅ Feed sources seeded (42 sources)
3. ⏭️ Ready to test normalization pipeline
4. ⏭️ Ready to implement aggregation service

## Verification Checklist

- [ ] Supabase/Vercel Postgres project created
- [ ] Connection string added to Vercel environment variables
- [ ] Migrations run successfully
- [ ] 42 feed sources seeded
- [ ] Test endpoint returns success
- [ ] No errors in Vercel function logs

## Cost Notes

**Supabase Free Tier:**

- 500MB database
- Unlimited API requests
- 2GB bandwidth

**Vercel Postgres:**

- 256MB database (free)
- 60 compute hours/month
- $0.30/GB after free tier

Both are sufficient for MVP. Estimated 42 sources × 20 posts each = ~850 posts ≈ 5MB storage.

---

**Status:** Ready to proceed once checklist complete
**Last Updated:** 2024-12-28
