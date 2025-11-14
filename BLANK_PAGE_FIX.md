# 🔧 Fix Blank Page on Vercel

## Most Common Cause: Missing Environment Variables

If you see a blank page, it's usually because **environment variables are missing** in Vercel.

---

## ✅ Step-by-Step Fix

### 1. Check Vercel Environment Variables

Go to: **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**

**Required Variables (Production):**

1. **NEXTAUTH_URL**
   - Value: `https://tutor-me-suafast.vercel.app` (or your custom domain)
   
2. **NEXTAUTH_SECRET**
   - Value: `Q2o/YN1sGIBZ4fP8ZfZEG4pJrZdE7ZjmUtD3IyITODE=`
   - Or generate new: `openssl rand -base64 32`

3. **NEXT_PUBLIC_SUPABASE_URL**
   - Value: `https://ptjnlzrvqyynklzdipac.supabase.co`

4. **SUPABASE_SERVICE_ROLE_KEY**
   - Value: (Your Supabase service role key from Supabase dashboard)

5. **PAYSTACK_SECRET_KEY**
   - Value: `sk_live_...` (Your Paystack live secret key)

### 2. Verify Variables Are Set

- ✅ All variables should be set for **Production** environment
- ✅ Check spelling (case-sensitive)
- ✅ No extra spaces before/after values

### 3. Redeploy

After adding variables:
- Go to **Deployments** tab
- Click **⋯** on latest deployment
- Click **Redeploy**

---

## 🔍 Check Vercel Logs

1. Go to **Deployments** → Click on deployment
2. Click **Functions** tab
3. Look for errors in the logs

**Common errors:**
- `Missing Supabase environment variables` → Add env vars
- `NEXTAUTH_SECRET is missing` → Add NEXTAUTH_SECRET
- `Cannot read property 'from' of undefined` → Supabase client not initialized

---

## 🧪 Test Locally First

Before deploying, test locally:

```bash
# Create .env.local with all variables
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret
NEXT_PUBLIC_SUPABASE_URL=https://ptjnlzrvqyynklzdipac.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-key
PAYSTACK_SECRET_KEY=sk_live_...

# Run locally
npm run dev
```

If it works locally but not on Vercel → Environment variables issue

---

## 🐛 Debug Steps

### 1. Check Browser Console
- Open browser DevTools (F12)
- Go to **Console** tab
- Look for JavaScript errors

### 2. Check Network Tab
- Open browser DevTools (F12)
- Go to **Network** tab
- Reload page
- Look for failed requests (red)

### 3. Check Vercel Function Logs
- Go to Vercel Dashboard
- **Deployments** → Latest deployment
- **Functions** tab
- Look for runtime errors

---

## ✅ Quick Checklist

- [ ] All 5 environment variables added in Vercel
- [ ] Variables set for **Production** environment
- [ ] Redeployed after adding variables
- [ ] Checked Vercel logs for errors
- [ ] Checked browser console for errors
- [ ] Tested locally (if possible)

---

## 🚨 Still Blank Page?

If you've added all variables and redeployed:

1. **Clear browser cache:**
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Or use incognito/private window

2. **Check if it's a specific route:**
   - Try: `https://tutor-me-suafast.vercel.app/auth/signin`
   - If signin works but homepage doesn't → Homepage issue

3. **Check Vercel build logs:**
   - Go to **Deployments** → Latest deployment
   - Check if build succeeded
   - Look for warnings/errors

4. **Verify domain:**
   - Make sure you're using the correct Vercel URL
   - Check if custom domain is configured correctly

---

## 📝 What I Fixed

✅ Added error boundaries (`error.tsx`, `global-error.tsx`)
✅ Improved Supabase client error handling (fails gracefully)
✅ Added try-catch around auth session
✅ Better error messages

**The app should now show error messages instead of blank pages!**

---

## 🎯 Next Steps

1. **Add all environment variables in Vercel** (most important!)
2. **Redeploy**
3. **Check Vercel logs** if still blank
4. **Check browser console** for client-side errors

**After adding env vars and redeploying, the blank page should be fixed!** 🚀

