# 🔧 Fix Vercel Redirect Loop - Environment Variables

## Problem
- `ERR_TOO_MANY_REDIRECTS` error
- Blank page or redirect loop
- URL shows: `/api/auth/error?error=Configuration`

## Root Cause
Missing or incorrect NextAuth environment variables in Vercel.

---

## ✅ Solution: Add Environment Variables in Vercel

### Step 1: Go to Vercel Dashboard
1. Go to: https://vercel.com/dashboard
2. Click on your project: **TutorMe-Suafast**
3. Go to: **Settings** → **Environment Variables**

### Step 2: Add These Variables (Production)

Add each variable one by one:

#### 1. NEXTAUTH_URL
- **Name:** `NEXTAUTH_URL`
- **Value:** `https://tutor-me-suafast.vercel.app` (or your custom domain if set)
- **Environment:** ✅ Production (and Preview if you want)

#### 2. NEXTAUTH_SECRET
- **Name:** `NEXTAUTH_SECRET`
- **Value:** Generate one using:
  ```bash
  openssl rand -base64 32
  ```
  Or use this one: `Q2o/YN1sGIBZ4fP8ZfZEG4pJrZdE7ZjmUtD3IyITODE=`
- **Environment:** ✅ Production (and Preview if you want)

#### 3. NEXT_PUBLIC_SUPABASE_URL
- **Name:** `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** `https://ptjnlzrvqyynklzdipac.supabase.co`
- **Environment:** ✅ Production (and Preview if you want)

#### 4. SUPABASE_SERVICE_ROLE_KEY
- **Name:** `SUPABASE_SERVICE_ROLE_KEY`
- **Value:** (Your Supabase service role key from Supabase dashboard)
- **Environment:** ✅ Production (and Preview if you want)

#### 5. PAYSTACK_SECRET_KEY
- **Name:** `PAYSTACK_SECRET_KEY`
- **Value:** `sk_live_...` (Your Paystack live secret key)
- **Environment:** ✅ Production (and Preview if you want)

---

## 🔄 After Adding Variables

### Option 1: Redeploy (Recommended)
1. Go to **Deployments** tab
2. Click **⋯** (three dots) on the latest deployment
3. Click **Redeploy**

### Option 2: Push a New Commit
```bash
git commit --allow-empty -m "Trigger redeploy"
git push
```

---

## ✅ Quick Checklist

- [ ] `NEXTAUTH_URL` = `https://tutor-me-suafast.vercel.app`
- [ ] `NEXTAUTH_SECRET` = (generated secret)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` = (your Supabase URL)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = (your Supabase service key)
- [ ] `PAYSTACK_SECRET_KEY` = (your Paystack key)
- [ ] All variables set for **Production** environment
- [ ] Redeployed after adding variables

---

## 🎯 If Using Custom Domain

If you've set up `suafast.live` as a custom domain:

1. **Update NEXTAUTH_URL:**
   - Change from: `https://tutor-me-suafast.vercel.app`
   - To: `https://suafast.live`

2. **Redeploy** after changing

---

## 🐛 Still Not Working?

1. **Check Vercel Logs:**
   - Go to **Deployments** → Click on deployment → **Functions** tab
   - Look for errors in the logs

2. **Verify Variables:**
   - Go to **Settings** → **Environment Variables**
   - Make sure all variables are there
   - Check they're set for **Production**

3. **Clear Browser Cache:**
   - Clear cookies for the domain
   - Try incognito/private window

4. **Check Middleware:**
   - The middleware might be causing issues
   - Try temporarily disabling it to test

---

## 📝 Notes

- **NEXTAUTH_URL** must match your actual domain
- **NEXTAUTH_SECRET** must be the same across all deployments
- Variables are case-sensitive
- Changes require a redeploy to take effect

---

**After adding variables and redeploying, the redirect loop should be fixed!** 🚀

