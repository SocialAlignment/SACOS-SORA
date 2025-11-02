# Update DATABASE_URL for RLS Support

## Current Issue
Your Neon connection is using **transaction pooling** which doesn't preserve session variables needed for Row-Level Security.

## Current Connection String
```
DATABASE_URL="postgresql://neondb_owner:npg_iNqns4Seh7Mb@ep-round-shape-afqxv076-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

**Problem**: Using `-pooler` endpoint with transaction pooling

## Solution: Switch to Direct Connection

### Update your `.env.local` file:

**Change this line:**
```bash
DATABASE_URL="postgresql://neondb_owner:npg_iNqns4Seh7Mb@ep-round-shape-afqxv076-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

**To this (remove `-pooler`):**
```bash
DATABASE_URL="postgresql://neondb_owner:npg_iNqns4Seh7Mb@ep-round-shape-afqxv076.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

## What Changed
- **Removed**: `-pooler` from the hostname
- **Why**: Direct connections preserve session variables across queries
- **Trade-off**: Fewer concurrent connections, but RLS works correctly

## Alternative: Get Connection String from Neon Dashboard

1. Go to https://console.neon.tech
2. Select your project
3. Go to **Connection Details**
4. Copy the **Direct connection** string (NOT pooled)
5. Paste into `.env.local` as `DATABASE_URL`

## After Updating

1. Save `.env.local`
2. Run: `npx tsx scripts/test-rls-isolation.ts`
3. Should see: **7/7 tests passed** ✅

## Production Considerations

For production at scale, you'll want to use pooling. The recommended approach is:

1. Use pooled connection for normal queries
2. Use direct connection for RLS operations
3. OR wrap all RLS queries in transactions (using `withTenantTransaction()`)

See `docs/story-3.4-rls-implementation.md` for production patterns.
