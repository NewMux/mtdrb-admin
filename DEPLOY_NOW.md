# 🚀 Deploy Now - Quick Steps

## ⚠️ CRITICAL: Deploy Database Schema First!

**Before deploying the frontend, you MUST deploy the database schema:**

1. Go to: https://app.supabase.com
2. Navigate to **SQL Editor**
3. Open `supabase/complete_schema.sql`
4. Copy the entire file contents
5. Paste into SQL Editor and click **Run**
6. ✅ Verify it completed successfully

**Without this, the app will fail!**

---

## 🚀 Deploy to Vercel

### Option 1: Via CLI (Fastest)

```bash
# Make sure you're logged in
vercel login

# Deploy to production
vercel --prod

# When prompted:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No (first time) or Yes (if updating)
# - Project name: mtdrb-admin (or your preferred name)
# - Directory: ./
# - Override settings? No

# After first deployment, add environment variables:
# Go to: https://vercel.com/your-project/settings/environment-variables
```

### Option 2: Via Dashboard (Recommended for first time)

1. Go to: https://vercel.com/new
2. Click "Import Git Repository" or "Add New" → "Project"
3. Connect your Git provider (GitHub/GitLab/Bitbucket)
4. Select your repository
5. Configure:
   - **Framework Preset:** Vite (auto-detected)
   - **Root Directory:** `./` (default)
   - **Build Command:** `npm run build:deploy` (already in vercel.json)
   - **Output Directory:** `dist` (already in vercel.json)
6. Click "Deploy"
7. **After deployment, add environment variables** (see below)

---

## 🔑 Environment Variables (REQUIRED)

Add these in Vercel Dashboard → Your Project → Settings → Environment Variables:

### Get Your Supabase Keys:
1. Go to: https://app.supabase.com
2. Select your project
3. Go to: **Settings** → **API**
4. Copy:
   - **Project URL** → Use for `VITE_SUPABASE_URL`
   - **anon public key** → Use for `VITE_SUPABASE_ANON_KEY`

### Add to Vercel:
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_APP_URL=https://your-project.vercel.app
```

**Note:** For `VITE_APP_URL`, wait until after first deployment, then use your actual Vercel URL.

---

## ✅ After Deployment

1. Visit your Vercel URL
2. Test signup/login
3. Test main features
4. Check browser console for errors
5. Monitor Vercel logs if issues occur

---

## 🆘 Troubleshooting

**Build fails?**
- Check environment variables are set correctly
- Verify Supabase URL/key are valid
- Check Vercel build logs

**App doesn't load?**
- Verify database schema is deployed
- Check environment variables in Vercel
- Check browser console for errors

**Can't sign up/login?**
- Database schema not deployed → Deploy `complete_schema.sql`
- RLS policies missing → Re-run schema deployment
- Check Supabase auth settings

---

## 📝 Quick Commands

```bash
# Check Vercel login status
vercel whoami

# Deploy to production
vercel --prod

# Deploy to preview
vercel

# View logs
vercel logs

# List deployments
vercel ls
```
