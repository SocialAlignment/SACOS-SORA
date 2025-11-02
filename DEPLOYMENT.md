# SACOS-SORA Vercel Deployment Guide

## Current Status: Authentication Required

The Vercel CLI is currently waiting for you to authenticate.

### Step 1: Authenticate with Vercel

**Visit this URL to authorize:**
```
https://vercel.com/oauth/device?user_code=QWLC-CWHJ
```

**What to do:**
1. Open the URL above in your browser
2. Login to Vercel (or create account if you don't have one)
3. Authorize the CLI access
4. The deployment will automatically continue

---

## Full Deployment Steps

### 1. Vercel Authentication (In Progress)
- Visit authorization URL above
- Complete OAuth flow
- CLI will automatically proceed

### 2. Project Setup
Vercel will ask these questions (defaults are fine):
```
? Set up and deploy "~/sora-2-playground"? [Y/n] Y
? Which scope do you want to deploy to? SocialAlignment
? Link to existing project? [y/N] N
? What's your project's name? sacos-sora
? In which directory is your code located? ./
```

### 3. Environment Variables Setup

After deployment, go to Vercel Dashboard:
1. Click on your project "sacos-sora"
2. Go to **Settings** > **Environment Variables**
3. Add these variables (from .env.production):

**Required:**
```bash
# Storage (cloud-compatible)
NEXT_PUBLIC_FILE_STORAGE_MODE=indexeddb
STORAGE_BACKEND=local

# Database
DATABASE_URL=postgresql://neondb_owner:npg_iNqns4Seh7Mb@ep-round-shape-afqxv076.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Authentication (Update after deployment)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_c2V0dGxpbmctdW5pY29ybi0xOC5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_z8j8U4t1K2LmdfsqIEoQ6846NhXlvKSkH3QFpY34kP
CLERK_WEBHOOK_SECRET=whsec_7uHheXJ+vfxJJJIyU8JUwfya4qC4HKJb

# Clerk Redirects
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# AI APIs (Copy from your .env.local file)
OPENAI_API_KEY=your_openai_key_here
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
GOOGLE_GEMINI_API_KEY=your_gemini_key_here
PERPLEXITY_API_KEY=your_perplexity_key_here

# Notion (Copy from your .env.local file)
NOTION_TOKEN=your_notion_token_here
```

**Scope for each variable:** Select "Production", "Preview", and "Development"

### 4. Update Clerk Configuration

Once you get your Vercel URL (e.g., `https://sacos-sora.vercel.app`):

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Go to **Configure** > **Domains**
4. Add your Vercel URL: `https://sacos-sora.vercel.app`
5. Update allowed redirect URLs:
   ```
   https://sacos-sora.vercel.app/dashboard
   ```

### 5. Get Production Keys (After Testing)

For production use, replace test keys:

1. In Clerk Dashboard, go to **API Keys**
2. Copy **Publishable Key** (starts with `pk_live_`)
3. Copy **Secret Key** (starts with `sk_live_`)
4. Update these in Vercel Environment Variables:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
5. Redeploy from Vercel dashboard

### 6. Test Deployment

After deployment completes:

1. Visit your Vercel URL (shown in terminal after deployment)
2. You should see the login screen
3. Create an account or sign in
4. You should be redirected to `/dashboard`
5. Test from your phone to verify coffee shop access works

---

## What Changed for Cloud Deployment

**Removed (won't work on Vercel):**
- ❌ NAS storage (`192.168.0.78`) - local network only
- ❌ Qdrant vector DB (`192.168.0.78:6333`) - local network only

**Replaced with:**
- ✅ IndexedDB for browser-based storage
- ✅ Local filesystem storage adapter
- ✅ Neon PostgreSQL (cloud database)

**Qdrant Note:**
- Not needed for Phase 1 (coffee shop access)
- Can add cloud-hosted Qdrant later for Phase 2 (brand data)

---

## Expected Deployment URL

Format: `https://sacos-sora.vercel.app` or `https://sacos-sora-socialignment.vercel.app`

You'll use this URL to:
- Login from anywhere (coffee shop, phone, etc.)
- Access the dashboard
- Generate Sora 2 prompts
- Test the AI pipeline

---

## Troubleshooting

**Build fails?**
- Check Vercel build logs in dashboard
- Verify all environment variables are set
- Check for missing dependencies

**Login doesn't work?**
- Verify Clerk domain is added
- Check redirect URLs match exactly
- Ensure Clerk keys are correct

**Database errors?**
- Verify DATABASE_URL is correct
- Check Neon database is active
- Run Prisma migrations if needed

---

## Next Steps After Deployment

Once deployment succeeds and you can login:

1. ✅ Mark Phase 1 complete
2. Move to Phase 2: Add Nike brand data to Qdrant
3. Test AI pipeline with real prompts
4. Build matrix with copy buttons
5. Add Notion integration
