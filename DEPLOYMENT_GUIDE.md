# 🚀 Deployment Guide - MTDRB Admin

## Pre-Deployment Checklist

### ✅ Step 1: Deploy Database Schema (CRITICAL - Do This First!)

**Before deploying the frontend, you MUST deploy the database schema:**

1. Go to your Supabase project: https://app.supabase.com
2. Navigate to **SQL Editor**
3. Open `supabase/complete_schema.sql`
4. Copy the entire file contents
5. Paste into SQL Editor and click **Run**
6. Verify deployment using queries in `supabase/DEPLOYMENT.md`

**⚠️ Without the database schema, the app will fail!**

### ✅ Step 2: Get Your Supabase Credentials

1. Go to Supabase Dashboard → **Project Settings** → **API**
2. Copy these values:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`
3. Save them - you'll need them for Vercel

### ✅ Step 3: Test Build Locally

```bash
# Install dependencies
npm install

# Test production build
npm run build

# Preview the build
npm run preview
```

If the build succeeds, you're ready to deploy!

---

## 🚀 Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel**: https://vercel.com
2. **Import Project**:
   - Click "Add New" → "Project"
   - Import your Git repository (GitHub/GitLab/Bitbucket)
   - Or drag & drop your project folder

3. **Configure Project**:
   - **Framework Preset**: Vite (auto-detected)
   - **Root Directory**: `./` (or leave default)
   - **Build Command**: `npm run build:deploy` (already in vercel.json)
   - **Output Directory**: `dist` (already in vercel.json)
   - **Install Command**: `npm install`

4. **Set Environment Variables** (CRITICAL):
   - Click "Environment Variables"
   - Add these variables:

   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   VITE_APP_URL=https://your-vercel-domain.vercel.app
   ```

   ⚠️ **Replace with your actual values from Step 2!**

5. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)
   - Your app will be live at `https://your-project.vercel.app`

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (first time - will ask questions)
vercel

# Set environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_APP_URL

# Deploy to production
vercel --prod
```

---

## 🔧 Post-Deployment Steps

### 1. Verify Environment Variables

After deployment, verify your environment variables are set:
- Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- Ensure all 3 variables are present and correct

### 2. Test Your Live Site

1. Visit your Vercel URL
2. Try to sign up (creates tenant + membership)
3. Test core features:
   - ✅ Sign up / Login
   - ✅ Create a member
   - ✅ Create a class
   - ✅ Create an invoice
   - ✅ View dashboard

### 3. Set Up Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `VITE_APP_URL` environment variable to your custom domain

### 4. Enable Analytics (Optional)

1. Vercel Dashboard → Your Project → Analytics
2. Enable Web Analytics (free tier available)

---

## 🔍 Troubleshooting

### Build Fails

**Error: "Missing environment variables"**
- ✅ Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in Vercel
- ✅ Redeploy after adding variables

**Error: "Module not found"**
- ✅ Run `npm install` locally to check for missing dependencies
- ✅ Ensure `package.json` is committed to git

**Error: "TypeScript errors"**
- ✅ Run `npm run typecheck` locally to see errors
- ✅ Fix errors before deploying

### App Fails to Load

**Error: "Failed to fetch" or "Network error"**
- ✅ Check Supabase URL is correct
- ✅ Check Supabase anon key is correct
- ✅ Verify database schema is deployed
- ✅ Check browser console for specific errors

**Error: "RLS policy violation"**
- ✅ Verify database schema was deployed correctly
- ✅ Check RLS policies exist: `SELECT * FROM pg_policies WHERE schemaname = 'public';`
- ✅ Ensure `get_user_tenant_id()` function exists

### Database Connection Issues

**Error: "Invalid API key"**
- ✅ Regenerate anon key in Supabase
- ✅ Update `VITE_SUPABASE_ANON_KEY` in Vercel
- ✅ Redeploy

**Error: "Table does not exist"**
- ✅ Deploy `complete_schema.sql` to Supabase
- ✅ Verify tables exist: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`

---

## 📊 Monitoring & Maintenance

### Check Deployment Status

- Vercel Dashboard → Your Project → Deployments
- See build logs, deployment status, and errors

### View Logs

- Vercel Dashboard → Your Project → Functions → Logs
- Or use Vercel CLI: `vercel logs`

### Update Environment Variables

1. Vercel Dashboard → Settings → Environment Variables
2. Edit variable
3. Redeploy (or wait for auto-redeploy on next push)

---

## 🔐 Security Checklist

- [x] ✅ Database schema deployed with RLS enabled
- [x] ✅ Environment variables set in Vercel (not in code)
- [x] ✅ `.env` file is in `.gitignore` (never commit secrets)
- [x] ✅ Using `anon` key (not service role key) in frontend
- [x] ✅ RLS policies enforce tenant isolation
- [x] ✅ All API calls go through authenticated Supabase client

---

## 🎉 You're Live!

Once deployed, your app will be available at:
- **Production**: `https://your-project.vercel.app`
- **Preview**: Each git push creates a preview deployment

### Next Steps

1. ✅ Test all features on production
2. ✅ Set up monitoring/error tracking (optional)
3. ✅ Configure custom domain (optional)
4. ✅ Set up CI/CD for automatic deployments (already configured via Vercel)

---

## 📝 Quick Reference

**Required Environment Variables:**
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
VITE_APP_URL=https://your-domain.vercel.app
```

**Deployment Commands:**
```bash
# Build locally
npm run build

# Deploy to Vercel
vercel --prod

# View logs
vercel logs
```

**Database Schema:**
- File: `supabase/complete_schema.sql`
- Deploy via: Supabase SQL Editor
- Verification: See `supabase/DEPLOYMENT.md`

---

**Need Help?**
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Check build logs in Vercel Dashboard
