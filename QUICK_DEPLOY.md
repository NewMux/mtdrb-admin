# ⚡ Quick Deploy - 5 Minutes

## 🎯 Before You Start

**CRITICAL:** Deploy the database schema FIRST!

1. Open Supabase SQL Editor
2. Copy/paste `supabase/complete_schema.sql`
3. Run it
4. ✅ Done - Database is ready

---

## 🚀 Deploy to Vercel (3 Steps)

### Step 1: Get Supabase Keys
- Go to: https://app.supabase.com → Your Project → Settings → API
- Copy: **Project URL** and **anon public key**

### Step 2: Deploy to Vercel

**Option A: Via Dashboard (Easiest)**
1. Go to: https://vercel.com/new
2. Import your Git repository
3. Add environment variables:
   ```
   VITE_SUPABASE_URL=your-url-here
   VITE_SUPABASE_ANON_KEY=your-key-here
   VITE_APP_URL=https://your-project.vercel.app
   ```
4. Click "Deploy"
5. ✅ Done!

**Option B: Via CLI**
```bash
npm i -g vercel
vercel login
vercel --prod
# When prompted, add environment variables
```

### Step 3: Verify
- Visit your Vercel URL
- Try signing up
- ✅ If it works, you're live!

---

## 🔑 Environment Variables Needed

Add these in Vercel Dashboard → Settings → Environment Variables:

| Variable | Where to Get It |
|----------|----------------|
| `VITE_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → anon public key |
| `VITE_APP_URL` | Your Vercel deployment URL (e.g., `https://xxx.vercel.app`) |

---

## ✅ Build Status

✅ **Local build successful!** Ready to deploy.

Build output:
- ✅ TypeScript compiled
- ✅ Vite build completed
- ✅ All assets generated
- ⚠️ Large bundle size (2.2MB) - acceptable for now, can optimize later

---

## 🆘 Quick Troubleshooting

**Build fails?**
- Check environment variables are set
- Check `package.json` is committed

**App doesn't load?**
- Check Supabase URL/key are correct
- Check database schema is deployed
- Check browser console for errors

**Can't sign up?**
- Database schema not deployed → Deploy `complete_schema.sql`
- RLS policies missing → Re-run schema deployment

---

## 📚 Full Guide

See `DEPLOYMENT_GUIDE.md` for detailed instructions.
